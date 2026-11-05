import React, { useState, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Trash2, 
  ZoomIn, 
  Clock, 
  X,
  Plus,
  Edit3,
  Download,
  Printer,
  Share2,
  ListFilter
} from "lucide-react";
import { RealEstateProperty, FixturePhotoItem } from "@/types";
import { toast } from "sonner";
import { LiveCameraCaptureModal } from "../LiveCameraCaptureModal";
import {
  PRESET_FIXTURE_NAMES,
  FIXTURE_CONDITIONS,
  getBaseFixtureName,
  stampImageWithDateAndMetadata,
  groupFixturesByItem,
  buildCompactFixtureReportHtml
} from "../FixtureVaultModal";
import { formatPhoneForWhatsApp } from "@/utils/formatUtils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface RealEstateFixtureTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
}

export const RealEstateFixtureTab: React.FC<RealEstateFixtureTabProps> = ({
  formData,
  setFormData
}) => {
  const photos: FixturePhotoItem[] = Array.isArray(formData.fixture_photos) 
    ? formData.fixture_photos 
    : [];

  const [presetList, setPresetList] = useState<string[]>(() => {
    const existingNames = photos.map((p) => getBaseFixtureName(p.name)).filter(Boolean);
    return Array.from(new Set([...PRESET_FIXTURE_NAMES, ...existingNames]));
  });
  const [selectedName, setSelectedName] = useState<string>(PRESET_FIXTURE_NAMES[0]);
  const [selectedCondition, setSelectedCondition] = useState<string>(FIXTURE_CONDITIONS[0]);
  const [filterMode, setFilterMode] = useState<"selected" | "all">("selected");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingNameValue, setEditingNameValue] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [inspectPhoto, setInspectPhoto] = useState<FixturePhotoItem | null>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const propertyRef = formData.reference_no || (formData.id ? `LP-${formData.id}` : "LP-PORTFOY");
  const currentItemName = selectedName;

  const selectedItemPhotos = photos.filter(
    (p) => getBaseFixtureName(p.name).toLowerCase() === selectedName.toLowerCase()
  );
  const groupedInventory = groupFixturesByItem(photos);

  const persistIfExistingProperty = async (updatedPhotos: FixturePhotoItem[]) => {
    setFormData((prev) => ({
      ...prev,
      fixture_photos: updatedPhotos,
      sector_data: {
        ...((prev as any).sector_data || {}),
        fixture_photos: updatedPhotos
      }
    }));

    if (formData.id) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`/api/real-estate/properties/${formData.id}/fixtures`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            fixture_photos: updatedPhotos,
            store_id: formData.store_id
          })
        });
      } catch (e) {
        console.warn("Auto-sync fixture photos to property id failed:", e);
      }
    }
  };

  const handleRenameSelected = async () => {
    const trimmed = editingNameValue.trim();
    if (!trimmed) {
      setIsEditingName(false);
      return;
    }
    const oldName = selectedName;
    const updatedPresets = presetList.map((item) => (item === oldName ? trimmed : item));
    if (!updatedPresets.includes(trimmed)) updatedPresets.push(trimmed);
    setPresetList(updatedPresets);
    setSelectedName(trimmed);
    setIsEditingName(false);

    const hasMatching = photos.some(
      (p) => getBaseFixtureName(p.name).toLowerCase() === oldName.toLowerCase()
    );
    if (hasMatching) {
      const updatedPhotos = photos.map((p) => {
        if (getBaseFixtureName(p.name).toLowerCase() === oldName.toLowerCase()) {
          const suffixMatch = p.name.match(/\s*(\(#\d+\))\s*$/);
          return {
            ...p,
            name: suffixMatch ? `${trimmed} ${suffixMatch[1]}` : trimmed
          };
        }
        return p;
      });
      await persistIfExistingProperty(updatedPhotos);
    }
    toast.success(`Eşya adı "${trimmed}" olarak güncellendi.`);
  };

  const handleAddNewItem = () => {
    const newName = window.prompt("Yeni Eşya / Demirbaş Adı Girin:", "Salon - Dresuar & Ayna");
    if (newName && newName.trim()) {
      const trimmed = newName.trim();
      if (!presetList.includes(trimmed)) {
        setPresetList([...presetList, trimmed]);
      }
      setSelectedName(trimmed);
      setFilterMode("selected");
      toast.success(`"${trimmed}" eklendi ve seçildi.`);
    }
  };

  const handleDeleteSelectedItemName = () => {
    if (presetList.length <= 1) {
      toast.error("En az bir eşya seçeneği kalmalıdır.");
      return;
    }
    const remaining = presetList.filter((name) => name !== selectedName);
    setPresetList(remaining);
    setSelectedName(remaining[0]);
    toast.success(`"${selectedName}" listeden kaldırıldı.`);
  };

  const handleLiveCaptured = async (stampedDataUrl: string, timestampStr: string, isoDate: string) => {
    const existingForThisItem = photos.filter(
      (p) => getBaseFixtureName(p.name).toLowerCase() === currentItemName.toLowerCase()
    ).length;
    const effectiveName =
      existingForThisItem > 0 ? `${currentItemName} (#${existingForThisItem + 1})` : currentItemName;

    const newItem: FixturePhotoItem = {
      id: `fix-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: stampedDataUrl,
      name: effectiveName,
      condition: selectedCondition,
      timestamp_str: timestampStr,
      captured_at: isoDate
    };
    const updated = [newItem, ...photos];
    await persistIfExistingProperty(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newItems: FixturePhotoItem[] = [];
    const existingCount = photos.filter(
      (p) => getBaseFixtureName(p.name).toLowerCase() === currentItemName.toLowerCase()
    ).length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const totalIdx = existingCount + i + 1;
        const effectiveName =
          totalIdx > 1 || files.length > 1
            ? `${currentItemName} (#${totalIdx})`
            : currentItemName;

        const { stampedDataUrl, timestampStr, isoDate } = await stampImageWithDateAndMetadata(
          rawDataUrl,
          effectiveName,
          propertyRef,
          selectedCondition
        );

        newItems.push({
          id: `fix-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          url: stampedDataUrl,
          name: effectiveName,
          condition: selectedCondition,
          timestamp_str: timestampStr,
          captured_at: isoDate
        });
      }

      const updated = [...newItems, ...photos];
      await persistIfExistingProperty(updated);
      toast.success(`${newItems.length} eşya fotoğrafı zaman damgalı olarak eklendi.`);
    } catch (err: any) {
      console.error("Fixture upload error:", err);
      toast.error("Fotoğraf işlenirken hata oluştu: " + err.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    await persistIfExistingProperty(updated);
    if (inspectPhoto?.id === id) setInspectPhoto(null);
    toast.success("Eşya fotoğrafı kaldırıldı.");
  };

  const handleDownloadPdfReport = async () => {
    if (photos.length === 0) {
      toast.error("Önce en az bir eşya fotoğrafı ekleyin.");
      return;
    }
    setIsGeneratingPdf(true);
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "794px";
    container.style.background = "#ffffff";
    container.innerHTML = buildCompactFixtureReportHtml(propertyRef, photos);
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const renderedHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = renderedHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, renderedHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position = heightLeft - renderedHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, renderedHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Esya-Teslim-Tutanagi-${propertyRef}.pdf`);
      toast.success("PDF Eşya Tutanağı indirildi.");
    } catch (err) {
      handlePrintReport();
    } finally {
      document.body.removeChild(container);
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintReport = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.write(`
        <html>
          <head>
            <title>Eşya Tespit Tutanağı - ${propertyRef}</title>
            <style>
              body { font-family: sans-serif; background: white; margin: 12mm; color: #0f172a; }
              @media print { body { margin: 8mm; } }
            </style>
          </head>
          <body>${buildCompactFixtureReportHtml(propertyRef, photos)}</body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1500);
      }, 400);
    }
  };

  const handleSendWhatsAppToTenant = () => {
    if (!formData.id) {
      toast.error("WhatsApp onay linki göndermek için önce portföyü kaydedin.");
      return;
    }
    const tenantName = window.prompt("Kiralayacak Müşterinin Adı Soyadı:", "Sayın Kiracı") || "Sayın Müşterimiz";
    const tenantPhone = window.prompt("Müşterinin WhatsApp Telefon Numarası (Örn: 0533...):", "");
    if (!tenantPhone || !tenantPhone.trim()) return;

    const formattedPhone = formatPhoneForWhatsApp(tenantPhone.trim());
    const sym = formData.currency === "GBP" ? "£" : formData.currency === "USD" ? "$" : formData.currency === "EUR" ? "€" : "₺";
    const depVal = Number(formData.deposit) > 0 ? `${formData.deposit} ${sym}` : "";
    const depositQuery = depVal ? `&depositAmount=${encodeURIComponent(depVal)}` : "";
    const signUrl = `${window.location.origin}/contract/sign/${formData.id}?client=${encodeURIComponent(
      tenantName.trim()
    )}&phone=${encodeURIComponent(tenantPhone.trim())}&templateId=rental_agreement${depositQuery}`;

    const summaryLines = groupedInventory
      .map((g, i) => `${i + 1}. ${g.name} (${g.condition}) - [${g.photos.length} Fotoğraf]`)
      .join("\n");

    const msg = `Sayın *${tenantName.trim()}*,\n\n*Ref: ${propertyRef}* kodlu kiralık mülkümüzün *Kira Sözleşmesi, Eşya/Demirbaş Teslim Listesi ve Zaman Damgalı Eşya Fotoğrafları* incelemeniz ve dijital onayınız için hazırlanmıştır.\n\n*Kayıtlı Eşya Listesi (${groupedInventory.length} Kalem / ${photos.length} Fotoğraf):*\n${
      summaryLines || "Eşya listesi ektedir."
    }\n\nSözleşmeyi, eşya listesini ve mühürlü fotoğrafları telefonunuzdan inceleyerek *ONAYLAMAK* veya *DÜZELTME TALEP ETMEK* için aşağıdaki güvenli bağlantıya tıklayınız:\n\n${signUrl}`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Header - Horizontal Standout Ref Badge, No Title, Icon-Based Action Buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white flex items-center justify-between gap-2 shrink-0 select-none">
        <div className="flex items-center min-w-0">
          <span className="px-2.5 py-1 bg-amber-400 text-slate-950 text-xs sm:text-sm font-black font-mono tracking-wider rounded-lg shadow-sm whitespace-nowrap">
            Ref: {propertyRef}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {photos.length > 0 && (
            <>
              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdfReport}
                title={isGeneratingPdf ? "PDF Hazırlanıyor..." : "Satır Satır PDF Tutanak İndir"}
                className="p-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handlePrintReport}
                title="Tutanak Yazdır"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center justify-center"
              >
                <Printer className="w-4 h-4" />
              </button>
              {formData.id && (
                <button
                  type="button"
                  onClick={handleSendWhatsAppToTenant}
                  title="Sözleşme ve Eşyaları WhatsApp ile Onaya Gönder"
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg transition-colors shadow-xs cursor-pointer flex items-center justify-center"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* High-Contrast Daylight Upload & Selection Strip */}
      <div className="bg-white border-2 border-slate-300 rounded-xl p-3 space-y-2 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-black text-slate-950 uppercase">
            Eşya Seçimi
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setEditingNameValue(selectedName);
                setIsEditingName(!isEditingName);
              }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-950 border border-slate-300 rounded text-[10px] font-black flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-indigo-600" />
              <span>Adı Değiştir</span>
            </button>
            <button
              type="button"
              onClick={handleAddNewItem}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-black flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Ekle</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteSelectedItemName}
              className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded text-[10px] font-black flex items-center gap-0.5 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Sil</span>
            </button>
          </div>
        </div>

        {isEditingName && (
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border-2 border-indigo-600">
            <input
              type="text"
              value={editingNameValue}
              onChange={(e) => setEditingNameValue(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs font-black text-slate-950 bg-white border border-slate-300 rounded focus:outline-none"
              placeholder="Eşya adını düzenleyin..."
              autoFocus
            />
            <button
              type="button"
              onClick={handleRenameSelected}
              className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded cursor-pointer"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={() => setIsEditingName(false)}
              className="px-2.5 py-1 bg-slate-200 text-slate-800 text-xs font-bold rounded cursor-pointer"
            >
              İptal
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          <div className="sm:col-span-5 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border-2 border-slate-300 overflow-hidden shrink-0 flex items-center justify-center relative">
              {selectedItemPhotos.length > 0 ? (
                <img
                  src={selectedItemPhotos[0].url}
                  alt={selectedName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-4 h-4 text-slate-400" />
              )}
              <span
                className={`absolute -top-1 -right-1 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow ${
                  selectedItemPhotos.length > 0
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-300 text-slate-800"
                }`}
              >
                {selectedItemPhotos.length}
              </span>
            </div>

            <select
              value={selectedName}
              onChange={(e) => {
                setSelectedName(e.target.value);
                setFilterMode("selected");
              }}
              className="flex-1 bg-white border-2 border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-black text-slate-950 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {presetList.map((name) => {
                const count = photos.filter(
                  (p) => getBaseFixtureName(p.name).toLowerCase() === name.toLowerCase()
                ).length;
                return (
                  <option key={name} value={name} className="text-[11px] font-bold text-slate-950">
                    {name} {count > 0 ? `(${count} Foto)` : "(Foto Yok)"}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full bg-white border-2 border-slate-300 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-950 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {FIXTURE_CONDITIONS.map((cond) => (
                <option key={cond} value={cond} className="text-[11px]">
                  Durum: {cond}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4 grid grid-cols-2 gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsLiveCameraOpen(true)}
              className="flex items-center justify-center gap-1 px-2.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Canlı Foto Çek</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Galeriden Yükle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Mode Toggle & Photo List */}
      <div className="bg-white border-2 border-slate-300 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="inline-flex p-0.5 bg-slate-100 border border-slate-300 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterMode("selected")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition cursor-pointer ${
                filterMode === "selected"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              Seçili Eşya ({selectedItemPhotos.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                filterMode === "all"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              <ListFilter className="w-3 h-3" />
              <span>Tüm Eşya Listesi ({groupedInventory.length} Eşya / {photos.length} Foto)</span>
            </button>
          </div>
        </div>

        {filterMode === "selected" ? (
          selectedItemPhotos.length === 0 ? (
            <div className="p-5 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
              <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
              <p className="text-xs font-black text-slate-950">
                "{selectedName}" İçin Henüz Fotoğraf Yok
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Yukarıdaki butonlarla bu eşya için bir veya birden fazla fotoğraf ekleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {selectedItemPhotos.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white border-2 border-slate-300 hover:border-indigo-600 rounded-xl overflow-hidden shadow-2xs flex flex-col"
                >
                  <div 
                    className="relative h-28 bg-slate-950 cursor-pointer overflow-hidden"
                    onClick={() => setInspectPhoto(item)}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 bg-slate-900/90 text-white px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{item.timestamp_str}</span>
                    </div>
                    <div className="absolute bottom-1 right-1 bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                      hukuki delil
                    </div>
                  </div>

                  <div className="p-2 flex items-center justify-between gap-1.5 bg-white">
                    <div className="min-w-0">
                      <span className="text-[11px] font-black text-slate-950 truncate block" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 truncate block">
                        {item.condition || "Sağlam / Çalışır"}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setInspectPhoto(item)}
                        className="p-1 text-slate-700 hover:text-indigo-600 rounded cursor-pointer"
                        title="İncele"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(item.id)}
                        className="p-1 text-slate-700 hover:text-rose-600 rounded cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : groupedInventory.length === 0 ? (
          <div className="p-5 text-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <p className="text-xs font-black text-slate-900">Henüz kayıtlı eşya fotoğrafı bulunmuyor.</p>
          </div>
        ) : (
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
                  <th className="py-1.5 px-2.5 w-8 text-center">#</th>
                  <th className="py-1.5 px-2.5">Eşya / Demirbaş Adı</th>
                  <th className="py-1.5 px-2.5 hidden sm:table-cell">Durum</th>
                  <th className="py-1.5 px-2.5">Fotoğraflar</th>
                  <th className="py-1.5 px-2.5 text-right w-16">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {groupedInventory.map((group, idx) => (
                  <tr key={group.name} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-black text-slate-700 text-center">{idx + 1}</td>
                    <td className="py-1.5 px-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedName(group.name);
                          setFilterMode("selected");
                        }}
                        className="font-black text-slate-950 hover:text-indigo-600 text-left block cursor-pointer"
                      >
                        {group.name}
                      </button>
                      <span className="text-[10px] font-mono text-slate-600 block">
                        {group.latestTimestamp}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 hidden sm:table-cell">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded text-[10px] font-black">
                        {group.condition}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {group.photos.map((ph) => (
                          <div
                            key={ph.id}
                            className="w-11 h-8 rounded border border-slate-300 overflow-hidden cursor-pointer bg-slate-950"
                            onClick={() => setInspectPhoto(ph)}
                          >
                            <img src={ph.url} alt={ph.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-1.5 px-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedName(group.name);
                          setFilterMode("selected");
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded text-[10px] border border-slate-300 cursor-pointer"
                      >
                        Seç ({group.photos.length})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fullscreen Inspector Modal */}
      {inspectPhoto && (
        <div 
          className="fixed inset-0 z-[150] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setInspectPhoto(null)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between mb-3 text-white px-2">
            <div>
              <h4 className="text-sm sm:text-base font-black text-amber-400">{inspectPhoto.name}</h4>
              <p className="text-xs text-slate-300 font-mono">
                Ref: {propertyRef} • {inspectPhoto.timestamp_str} • hukuki delil
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(inspectPhoto.id);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sil</span>
              </button>
              <button
                onClick={() => setInspectPhoto(null)}
                className="p-2 bg-slate-800 text-white hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div 
            className="max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl border-2 border-slate-700 bg-black flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={inspectPhoto.url}
              alt={inspectPhoto.name}
              className="max-w-full max-h-[76vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Live Interactive Camera Capture Modal */}
      <LiveCameraCaptureModal
        isOpen={isLiveCameraOpen}
        onClose={() => setIsLiveCameraOpen(false)}
        itemName={currentItemName}
        itemCondition={selectedCondition}
        propertyRef={propertyRef}
        propertyTitle={formData.title || "Kiralık Eşyalı Mülk"}
        onPhotoCaptured={handleLiveCaptured}
      />
    </div>
  );
};
