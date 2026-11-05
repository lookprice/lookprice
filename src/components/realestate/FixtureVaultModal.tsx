import React, { useState, useRef } from "react";
import { 
  X, 
  Camera, 
  Upload, 
  Trash2, 
  ZoomIn, 
  Printer, 
  Clock, 
  Plus, 
  Check, 
  Edit3,
  Download,
  Share2,
  ListFilter
} from "lucide-react";
import { RealEstateProperty, FixturePhotoItem } from "@/types";
import { toast } from "sonner";
import { LiveCameraCaptureModal } from "./LiveCameraCaptureModal";
import { formatPhoneForWhatsApp } from "@/utils/formatUtils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface FixtureVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: RealEstateProperty;
  onUpdateFixtures?: (updatedPhotos: FixturePhotoItem[]) => Promise<void> | void;
}

export const PRESET_FIXTURE_NAMES = [
  "Salon - Klima",
  "Salon - Koltuk Takımı",
  "Salon - Akıllı TV & Ünite",
  "Mutfak - Buzdolabı",
  "Mutfak - Bulaşık Makinesi",
  "Mutfak - Ankastre Fırın & Ocak",
  "Mutfak - Davlumbaz",
  "Yatak Odası - Çift Kişilik Baza & Başlık",
  "Yatak Odası - Gardırop",
  "Yatak Odası - Klima",
  "Banyo - Çamaşır Makinesi",
  "Banyo - Termosifon / Şofben",
  "Balkon / Teras - Masa & Sandalye Seti",
  "Genel - Elektrik & Su Sayacı Başlangıç Endeksi",
  "Genel - Giriş Çelik Kapı & Anahtarlar"
];

export const FIXTURE_CONDITIONS = [
  "Sağlam / Çalışır",
  "Yeni / Sıfır",
  "Az Kullanılmış",
  "Mevcut Çizik / Notlu"
];

// Normalize base fixture name (strip trailing "(#1)" etc. for grouping)
export function getBaseFixtureName(name: string): string {
  return (name || "").replace(/\s*\(#\d+\)\s*$/, "").trim();
}

// Canvas-based Timestamp Burn-in Engine
export async function stampImageWithDateAndMetadata(
  dataUrl: string, 
  itemName: string, 
  propertyRef: string, 
  itemCondition?: string
): Promise<{ stampedDataUrl: string; timestampStr: string; isoDate: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is not available"));
          return;
        }

        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        canvas.width = width;
        canvas.height = height;

        // Draw original photo
        ctx.drawImage(img, 0, 0, width, height);

        // Generate current timestamp
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const day = pad(now.getDate());
        const month = pad(now.getMonth() + 1);
        const year = now.getFullYear();
        const hours = pad(now.getHours());
        const minutes = pad(now.getMinutes());
        const seconds = pad(now.getSeconds());

        const dateStr = `${day}.${month}.${year}`;
        const timeStr = `${hours}:${minutes}:${seconds}`;
        const timestampStr = `${dateStr} ${timeStr}`;
        const isoDate = now.toISOString();

        // Calculate dynamic banner height based on image size
        const bannerHeight = Math.max(54, Math.floor(height * 0.085));
        const bannerY = height - bannerHeight;

        // Draw semi-transparent dark background banner
        ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
        ctx.fillRect(0, bannerY, width, bannerHeight);

        // Top accent line
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(0, bannerY, width, Math.max(3, Math.floor(bannerHeight * 0.05)));

        // Text styling
        const primaryFontSize = Math.max(14, Math.floor(bannerHeight * 0.28));
        const secondaryFontSize = Math.max(11, Math.floor(bannerHeight * 0.22));

        // Left Side: Item Name and Ref Code ONLY
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const textLeftMargin = Math.max(16, Math.floor(width * 0.02));
        const line1Y = bannerY + bannerHeight * 0.38;
        const line2Y = bannerY + bannerHeight * 0.72;

        const cleanItemName = (itemName || "Eşya").toUpperCase();
        const condSuffix = itemCondition ? ` • ${itemCondition.toUpperCase()}` : "";
        ctx.fillText(`${cleanItemName}${condSuffix}`, textLeftMargin, line1Y);

        ctx.fillStyle = "#cbd5e1";
        ctx.font = `600 ${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(`REF: ${propertyRef || "LP-PORTFOY"}`, textLeftMargin, line2Y);

        // Right Side: Date/Time and ONLY "hukuki delil"
        const textRightMargin = width - Math.max(16, Math.floor(width * 0.02));
        ctx.textAlign = "right";

        ctx.fillStyle = "#38bdf8";
        ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
        ctx.fillText(`${dateStr} ${timeStr}`, textRightMargin, line1Y);

        ctx.fillStyle = "#fbbf24";
        ctx.font = `bold ${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(`hukuki delil`, textRightMargin, line2Y);

        const stampedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve({ stampedDataUrl, timestampStr, isoDate });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(new Error("Image failed to load for stamping: " + e));
    img.src = dataUrl;
  });
}

// Group fixture photos by base item name for compact row-by-row table rendering
export function groupFixturesByItem(photos: FixturePhotoItem[]) {
  const map = new Map<string, { name: string; condition: string; latestTimestamp: string; photos: FixturePhotoItem[] }>();
  photos.forEach((p) => {
    const baseName = getBaseFixtureName(p.name || "Eşya");
    const existing = map.get(baseName);
    if (existing) {
      existing.photos.push(p);
      if (p.condition && !existing.condition) existing.condition = p.condition;
    } else {
      map.set(baseName, {
        name: baseName,
        condition: p.condition || "Sağlam / Çalışır",
        latestTimestamp: p.timestamp_str || "",
        photos: [p]
      });
    }
  });
  return Array.from(map.values());
}

// Build compact row-by-row A4 HTML for PDF / Print / Contract Annex
export function buildCompactFixtureReportHtml(
  propertyRef: string,
  photos: FixturePhotoItem[],
  approvalStatus?: string,
  approvalBy?: string,
  approvalDate?: string
): string {
  const nowStr = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const grouped = groupFixturesByItem(photos);

  const rowsHtml = grouped
    .map(
      (group, idx) => `
      <tr style="border-bottom: 1px solid #cbd5e1; page-break-inside: avoid;">
        <td style="padding: 6px 8px; font-weight: 800; color: #0f172a; font-size: 11px; text-align: center; width: 36px;">
          ${idx + 1}
        </td>
        <td style="padding: 6px 8px; font-weight: 800; color: #0f172a; font-size: 11px;">
          ${group.name}
          <div style="font-size: 9px; font-weight: 600; color: #475569; margin-top: 2px;">
            ${group.photos.length} Adet Mühürlü Fotoğraf
          </div>
        </td>
        <td style="padding: 6px 8px; font-weight: 700; color: #0369a1; font-size: 10px; width: 120px;">
          ${group.condition || "Sağlam / Çalışır"}
        </td>
        <td style="padding: 6px 8px; font-family: monospace; font-weight: 700; color: #334155; font-size: 10px; width: 115px;">
          ${group.latestTimestamp}
        </td>
        <td style="padding: 5px 8px;">
          <div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center;">
            ${group.photos
              .map(
                (ph) => `
              <img 
                src="${ph.url}" 
                alt="${ph.name}" 
                style="width: 64px; height: 46px; object-fit: cover; border-radius: 4px; border: 1px solid #94a3b8; background: #0f172a;" 
              />
            `
              )
              .join("")}
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #0f172a; padding: 16px; line-height: 1.4;">
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.02em;">
            EŞYALI KİRALIK MÜLK EŞYA & DEMİRBAŞ TESLİM LİSTESİ
          </h1>
          <div style="font-size: 11px; color: #334155; margin-top: 2px; font-weight: 700;">
            Ref: <strong>${propertyRef}</strong>
          </div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #334155; font-weight: 700;">
          Tarih: <strong>${nowStr}</strong><br/>
          Toplam Kalem: <strong>${grouped.length} Eşya (${photos.length} Fotoğraf)</strong>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a; margin-bottom: 12px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #0f172a;">
            <th style="padding: 6px 8px; font-size: 10px; font-weight: 900; color: #0f172a; text-align: center; text-transform: uppercase;">No</th>
            <th style="padding: 6px 8px; font-size: 10px; font-weight: 900; color: #0f172a; text-align: left; text-transform: uppercase;">Eşya / Demirbaş Adı</th>
            <th style="padding: 6px 8px; font-size: 10px; font-weight: 900; color: #0f172a; text-align: left; text-transform: uppercase;">Nitelik / Durum</th>
            <th style="padding: 6px 8px; font-size: 10px; font-weight: 900; color: #0f172a; text-align: left; text-transform: uppercase;">Mühür Zamanı</th>
            <th style="padding: 6px 8px; font-size: 10px; font-weight: 900; color: #0f172a; text-align: left; text-transform: uppercase;">Hukuki Delil Fotoğrafları</th>
          </tr>
        </thead>
        <tbody>
          ${
            rowsHtml ||
            `<tr><td colspan="5" style="padding: 16px; text-align: center; color: #64748b; font-size: 11px;">Kayıtlı eşya fotoğrafı bulunmamaktadır.</td></tr>`
          }
        </tbody>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #94a3b8; border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; font-size: 10px; color: #0f172a;">
        <strong>KİRACI TESLİM & TAHLİYE DEPOZİTO GÜVENCE ŞARTI:</strong>
        <em>"Mülk'ü kiralarken içerisinde bulunan Eşya / demirbaşları inceledim, gördüm. Eşyalara ait resimleri de inceledim, gördüm. Onaylıyorum, kabulümdür."</em>
        Tahliye esnasında mülkteki eşyalar işbu zaman damgalı fotoğraflar ve durum listesi ile birebir karşılaştırılır; olağan kullanım dışı hasar veya eksiklik olması halinde onarım/ikame bedeli depozitodan mahsup edilir.
      </div>

      ${
        approvalStatus === "approved"
          ? `<div style="background-color: #ecfdf5; border: 1.5px solid #059669; border-radius: 6px; padding: 6px 10px; margin-bottom: 12px; font-size: 10px; color: #065f46; font-weight: 800;">
              ✔ DİJİTAL ONAYLI: Bu eşya listesi ve fotoğrafları ${approvalBy || "Kiracı"} tarafından ${approvalDate || nowStr} tarihinde incelenerek onaylanmıştır.
            </div>`
          : ""
      }

      <div style="display: flex; justify-content: space-between; gap: 24px; page-break-inside: avoid; margin-top: 10px;">
        <div style="flex: 1; border: 1px solid #94a3b8; border-radius: 6px; padding: 8px; text-align: center; min-height: 68px;">
          <strong style="font-size: 10px; color: #0f172a;">KİRAYA VEREN / YETKİLİ ARACI</strong>
          <div style="font-size: 9px; color: #64748b; margin-top: 26px;">İmza / Kaşe</div>
        </div>
        <div style="flex: 1; border: 1px solid #94a3b8; border-radius: 6px; padding: 8px; text-align: center; min-height: 68px;">
          <strong style="font-size: 10px; color: #0f172a;">KİRACI / TESLİM ALAN</strong>
          <div style="font-size: 9px; color: #64748b; margin-top: 26px;">${
            approvalStatus === "approved" ? `Dijital Onaylı: ${approvalBy || ""}` : "İmza / Tarih"
          }</div>
        </div>
      </div>
    </div>
  `;
}

export const FixtureVaultModal: React.FC<FixtureVaultModalProps> = ({
  isOpen,
  onClose,
  property,
  onUpdateFixtures
}) => {
  const initialPhotos: FixturePhotoItem[] = React.useMemo(() => {
    const raw = property?.fixture_photos || (property as any)?.sector_data?.fixture_photos;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [property]);

  const [photos, setPhotos] = useState<FixturePhotoItem[]>(initialPhotos);
  const [presetList, setPresetList] = useState<string[]>(() => {
    const existingNames = initialPhotos.map((p) => getBaseFixtureName(p.name)).filter(Boolean);
    return Array.from(new Set([...PRESET_FIXTURE_NAMES, ...existingNames]));
  });
  const [selectedName, setSelectedName] = useState<string>(PRESET_FIXTURE_NAMES[0]);
  const [selectedCondition, setSelectedCondition] = useState<string>(FIXTURE_CONDITIONS[0]);
  const [filterMode, setFilterMode] = useState<"selected" | "all">("selected");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editingNameValue, setEditingNameValue] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [inspectPhoto, setInspectPhoto] = useState<FixturePhotoItem | null>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPhotos(initialPhotos);
    const existingNames = initialPhotos.map((p) => getBaseFixtureName(p.name)).filter(Boolean);
    setPresetList((prev) => Array.from(new Set([...prev, ...existingNames])));
  }, [initialPhotos]);

  if (!isOpen) return null;

  const propertyRef = property.reference_no || `LP-${property.id}`;
  const currentItemName = selectedName;

  // Photos belonging to the currently selected fixture item
  const selectedItemPhotos = photos.filter(
    (p) => getBaseFixtureName(p.name).toLowerCase() === selectedName.toLowerCase()
  );
  const displayedPhotos = filterMode === "selected" ? selectedItemPhotos : photos;
  const groupedInventory = groupFixturesByItem(photos);

  const approvalStatus =
    property.fixture_approval_status || (property as any)?.sector_data?.fixture_approval_status;
  const approvalNote =
    property.fixture_approval_note || (property as any)?.sector_data?.fixture_approval_note;
  const approvalBy =
    property.fixture_approved_by || (property as any)?.sector_data?.fixture_approved_by;
  const approvalDate =
    property.fixture_approval_date || (property as any)?.sector_data?.fixture_approval_date;

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

    // Also update any existing photos of this item
    const hasMatchingPhotos = photos.some(
      (p) => getBaseFixtureName(p.name).toLowerCase() === oldName.toLowerCase()
    );
    if (hasMatchingPhotos) {
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
      setPhotos(updatedPhotos);
      await saveToDatabase(updatedPhotos);
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
    setPhotos(updated);
    await saveToDatabase(updated);
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
      setPhotos(updated);
      toast.success(`${newItems.length} adet eşya fotoğrafı damgalanarak 7. Eşyalar bölümüne kaydedildi.`);
      await saveToDatabase(updated);
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
    setPhotos(updated);
    if (inspectPhoto?.id === id) setInspectPhoto(null);
    await saveToDatabase(updated);
    toast.success("Eşya fotoğrafı silindi.");
  };

  const saveToDatabase = async (updatedPhotos: FixturePhotoItem[]) => {
    setIsSaving(true);
    try {
      if (onUpdateFixtures) {
        await onUpdateFixtures(updatedPhotos);
      } else {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/real-estate/properties/${property.id}/fixtures`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            fixture_photos: updatedPhotos,
            store_id: property.store_id
          })
        });
        if (!res.ok) {
          throw new Error("Sunucu güncelleme hatası: " + res.statusText);
        }
      }
    } catch (err: any) {
      console.error("Failed to save fixture photos:", err);
      toast.error("Kayıt güncellenemedi: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Direct PDF Download (Row-by-row compact list)
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
    container.style.width = "794px"; // A4 width at 96dpi
    container.style.background = "#ffffff";
    container.innerHTML = buildCompactFixtureReportHtml(
      propertyRef,
      photos,
      approvalStatus,
      approvalBy,
      approvalDate
    );
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
    } catch (err: any) {
      console.error("PDF generation failed, falling back to print:", err);
      handlePrintInspectionReport();
    } finally {
      document.body.removeChild(container);
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintInspectionReport = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      const reportBody = buildCompactFixtureReportHtml(
        propertyRef,
        photos,
        approvalStatus,
        approvalBy,
        approvalDate
      );
      doc.write(`
        <html>
          <head>
            <title>Eşya Tespit Tutanağı - ${propertyRef}</title>
            <style>
              body { font-family: sans-serif; background: white; margin: 12mm; color: #0f172a; }
              @media print {
                body { margin: 8mm; }
              }
            </style>
          </head>
          <body>${reportBody}</body>
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
    const tenantName = window.prompt("Kiralayacak Müşterinin Adı Soyadı:", "Sayın Kiracı") || "Sayın Müşterimiz";
    const tenantPhone = window.prompt("Müşterinin WhatsApp Telefon Numarası (Örn: 0533...):", "");
    if (!tenantPhone || !tenantPhone.trim()) return;

    const formattedPhone = formatPhoneForWhatsApp(tenantPhone.trim());
    const signUrl = `${window.location.origin}/contract/sign/${property.id}?client=${encodeURIComponent(
      tenantName.trim()
    )}&phone=${encodeURIComponent(tenantPhone.trim())}&templateId=rental_agreement`;

    const summaryLines = groupedInventory
      .map((g, i) => `${i + 1}. ${g.name} (${g.condition}) - [${g.photos.length} Fotoğraf]`)
      .join("\n");

    const msg = `Sayın *${tenantName.trim()}*,\n\n*Ref: ${propertyRef}* kodlu kiralık mülkümüzün *Kira Sözleşmesi, Eşya/Demirbaş Teslim Listesi ve Zaman Damgalı Eşya Fotoğrafları* incelemeniz ve dijital onayınız için hazırlanmıştır.\n\n*Kayıtlı Eşya Listesi (${groupedInventory.length} Kalem / ${photos.length} Fotoğraf):*\n${
      summaryLines || "Eşya listesi ektedir."
    }\n\nSözleşmeyi, eşya listesini ve mühürlü fotoğrafları telefonunuzdan inceleyerek *ONAYLAMAK* veya *DÜZELTME TALEP ETMEK* için aşağıdaki güvenli bağlantıya tıklayınız:\n\n${signUrl}`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* High-Contrast Corporate Daylight Modal Container */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-4xl h-[92vh] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl relative text-slate-950">
        
        {/* Header: Minimal "Eşyalar" + "Ref: ..." ONLY */}
        <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Eşyalar
                </h2>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Ref: {propertyRef}
                </span>
                {approvalStatus === "approved" && (
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    Kiracı Onaylı
                  </span>
                )}
                {approvalStatus === "rejected" && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    Düzeltme Talebi
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {photos.length > 0 && (
              <>
                <button
                  type="button"
                  disabled={isGeneratingPdf}
                  onClick={handleDownloadPdfReport}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[11px] transition shadow-xs cursor-pointer disabled:opacity-50"
                  title="Satır Satır Kompakt PDF Tutanak İndir"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGeneratingPdf ? "PDF..." : "PDF İndir"}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintInspectionReport}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-[11px] border border-slate-600 transition cursor-pointer"
                  title="Tutanak Yazdır"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Yazdır</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppToTenant}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                  title="Sözleşme, Eşya Listesi ve Resimleri Müşteriye WhatsApp ile Gönder"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp Onaya Gönder</span>
                  <span className="sm:hidden">WA</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Client Approval / Rejection Status Banner if present */}
        {approvalStatus && (
          <div
            className={`px-3.5 py-1.5 text-[11px] font-bold flex items-center justify-between border-b shrink-0 ${
              approvalStatus === "approved"
                ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                : "bg-rose-50 text-rose-950 border-rose-300"
            }`}
          >
            <span>
              {approvalStatus === "approved"
                ? `✔ Müşteri Onayı (${approvalBy || "Kiracı"} - ${approvalDate || ""}): ${approvalNote || "Eşya listesi ve fotoğraflar onaylandı."}`
                : `✖ Müşteri Red / Düzeltme Talebi (${approvalBy || "Kiracı"} - ${approvalDate || ""}): ${approvalNote || ""}`}
            </span>
          </div>
        )}

        {/* High-Contrast Daylight Control Bar */}
        <div className="p-3 sm:px-4 bg-slate-100 border-b-2 border-slate-300 shrink-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-black text-slate-950 uppercase tracking-tight">
              Eşya Seçimi
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingNameValue(selectedName);
                  setIsEditingName(!isEditingName);
                }}
                className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-md text-[10px] font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Seçili eşyanın adını değiştir"
              >
                <Edit3 className="w-3 h-3 text-indigo-600" />
                <span>Adı Değiştir</span>
              </button>
              <button
                type="button"
                onClick={handleAddNewItem}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-black flex items-center gap-0.5 cursor-pointer shadow-2xs"
                title="Yeni eşya tanımla"
              >
                <Plus className="w-3 h-3" />
                <span>Ekle</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedItemName}
                className="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-md text-[10px] font-black flex items-center gap-0.5 cursor-pointer shadow-2xs"
                title="Seçili eşyayı listeden sil"
              >
                <Trash2 className="w-3 h-3" />
                <span>Sil</span>
              </button>
            </div>
          </div>

          {/* Inline Rename Bar when "Adı Değiştir" is clicked */}
          {isEditingName && (
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-lg border-2 border-indigo-600">
              <input
                type="text"
                value={editingNameValue}
                onChange={(e) => setEditingNameValue(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs font-black text-slate-950 bg-slate-50 border border-slate-300 rounded focus:outline-none"
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

          {/* Main Selection & Upload Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            {/* Selector with minimized option font size */}
            <div className="sm:col-span-5 flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-white border-2 border-slate-300 overflow-hidden shrink-0 flex items-center justify-center relative shadow-2xs">
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
                className="flex-1 bg-white border-2 border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-950 font-black focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
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

            {/* Condition / Qualification Selector */}
            <div className="sm:col-span-3">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-lg px-2 py-1.5 text-[11px] text-slate-950 font-bold focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
                title="Eşya Niteliği / Durumu"
              >
                {FIXTURE_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond} className="text-[11px]">
                    Durum: {cond}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons: Canlı Foto Çek & Yükle */}
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
                className="flex items-center justify-center gap-1 px-2.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Canlı Foto Çek</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-black text-xs rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Galeriden Yükle</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar: Selected Item Photos vs All Items Compact Table */}
        <div className="px-3.5 py-2 bg-white border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="inline-flex p-0.5 bg-slate-100 border border-slate-300 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterMode("selected")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition cursor-pointer ${
                filterMode === "selected"
                  ? "bg-slate-900 text-white shadow-2xs"
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
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950"
              }`}
            >
              <ListFilter className="w-3 h-3" />
              <span>Tüm Eşya Listesi ({groupedInventory.length} Eşya / {photos.length} Foto)</span>
            </button>
          </div>

          {isSaving && (
            <span className="text-[11px] font-bold text-indigo-700">Kaydediliyor...</span>
          )}
        </div>

        {/* Main Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-slate-50">
          {filterMode === "selected" ? (
            /* SELECTED ITEM VIEW: Empty if no photo for this item, or grid of multiple photos for this item */
            selectedItemPhotos.length === 0 ? (
              <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-5 bg-white border-2 border-dashed border-slate-300 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-600 mb-2">
                  <Camera className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-slate-950 mb-1">
                  "{selectedName}" İçin Henüz Fotoğraf Yok
                </h3>
                <p className="text-[11px] text-slate-600 max-w-sm mb-3 font-medium">
                  Bu eşyaya ait birden fazla fotoğraf çekebilir veya galeriden yükleyebilirsiniz.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLiveCameraOpen(true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Fotoğraf Çek</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Galeriden Seç</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-950">
                    {selectedName} Fotoğrafları ({selectedItemPhotos.length} Adet)
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">
                    Aynı eşyaya yeni fotoğraf eklemek için yukarıdan Çek / Yükle butonunu kullanın
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {selectedItemPhotos.map((item) => (
                    <div
                      key={item.id}
                      className="group bg-white border-2 border-slate-300 hover:border-indigo-600 rounded-xl overflow-hidden transition-all shadow-2xs flex flex-col"
                    >
                      <div
                        className="relative h-28 sm:h-32 bg-slate-950 cursor-pointer overflow-hidden"
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
                          <p className="text-[11px] font-black text-slate-950 truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[10px] font-bold text-indigo-700 truncate">
                            {item.condition || "Sağlam / Çalışır"}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setInspectPhoto(item)}
                            className="p-1 text-slate-700 hover:text-indigo-600 rounded cursor-pointer"
                            title="Büyüt"
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
              </div>
            )
          ) : (
            /* ALL ITEMS COMPACT ROW-BY-ROW LIST VIEW (Prevents vertical blowout) */
            groupedInventory.length === 0 ? (
              <div className="p-6 text-center bg-white border-2 border-dashed border-slate-300 rounded-xl">
                <p className="text-xs font-black text-slate-900">Henüz kayıtlı eşya bulunmuyor.</p>
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase">
                      <th className="py-2 px-2.5 w-8 text-center">#</th>
                      <th className="py-2 px-2.5">Eşya / Demirbaş Adı</th>
                      <th className="py-2 px-2.5 hidden sm:table-cell">Nitelik / Durum</th>
                      <th className="py-2 px-2.5">Fotoğraflar (Tıkla & Büyüt)</th>
                      <th className="py-2 px-2.5 text-right w-16">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {groupedInventory.map((group, idx) => (
                      <tr
                        key={group.name}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2 px-2.5 font-black text-slate-700 text-center">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5">
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
                        <td className="py-2 px-2.5 hidden sm:table-cell">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded text-[10px] font-black">
                            {group.condition}
                          </span>
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {group.photos.map((ph) => (
                              <div
                                key={ph.id}
                                className="relative w-12 h-9 rounded border border-slate-300 overflow-hidden cursor-pointer group shrink-0 bg-slate-950"
                                onClick={() => setInspectPhoto(ph)}
                              >
                                <img
                                  src={ph.url}
                                  alt={ph.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-right">
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
            )
          )}
        </div>

        {/* Clean High-Contrast Footer - No obstructing text on mobile */}
        <div className="p-2.5 sm:px-4 bg-white border-t-2 border-slate-300 shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-black text-slate-900">
              Toplam: {groupedInventory.length} Eşya ({photos.length} Fotoğraf)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-sm shrink-0"
          >
            Tamamla & Kapat
          </button>
        </div>

        {/* Fullscreen Inspector Modal */}
        {inspectPhoto && (
          <div 
            className="fixed inset-0 z-[140] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
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
          propertyTitle={property.title || "Kiralık Eşyalı Mülk"}
          onPhotoCaptured={handleLiveCaptured}
        />
      </div>
    </div>
  );
};
