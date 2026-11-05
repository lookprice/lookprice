import React, { useState, useRef } from "react";
import { 
  X, 
  ShieldAlert, 
  Camera, 
  Upload, 
  Trash2, 
  ZoomIn, 
  Printer, 
  Calendar, 
  Clock, 
  FileCheck, 
  Plus, 
  Check, 
  Loader2,
  AlertTriangle,
  Info
} from "lucide-react";
import { RealEstateProperty, FixturePhotoItem } from "@/types";
import { toast } from "sonner";
import { LiveCameraCaptureModal } from "./LiveCameraCaptureModal";

interface FixtureVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: RealEstateProperty;
  onUpdateFixtures?: (updatedPhotos: FixturePhotoItem[]) => Promise<void> | void;
}

const PRESET_FIXTURE_NAMES = [
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

// Canvas-based Timestamp Burn-in Engine
async function stampImageWithDateAndMetadata(
  dataUrl: string, 
  itemName: string, 
  propertyRef: string, 
  propertyTitle: string
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
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.fillRect(0, bannerY, width, bannerHeight);

        // Top accent line
        ctx.fillStyle = "#0284c7"; // Sky 600
        ctx.fillRect(0, bannerY, width, Math.max(3, Math.floor(bannerHeight * 0.05)));

        // Text styling
        const primaryFontSize = Math.max(14, Math.floor(bannerHeight * 0.28));
        const secondaryFontSize = Math.max(11, Math.floor(bannerHeight * 0.22));

        // Left Side: Title and Item Name
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const textLeftMargin = Math.max(16, Math.floor(width * 0.02));
        const line1Y = bannerY + bannerHeight * 0.38;
        const line2Y = bannerY + bannerHeight * 0.72;

        const cleanItemName = (itemName || "Demirbaş Eşya").toUpperCase();
        ctx.fillText(`🔒 ${cleanItemName}`, textLeftMargin, line1Y);

        ctx.fillStyle = "#94a3b8"; // Slate 400
        ctx.font = `600 ${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const shortTitle = propertyTitle.length > 40 ? propertyTitle.substring(0, 37) + "..." : propertyTitle;
        ctx.fillText(`MÜLK: ${propertyRef || "LP-PORTFOY"} • ${shortTitle}`, textLeftMargin, line2Y);

        // Right Side: Date, Hour, Minute and Verification Badge
        const textRightMargin = width - Math.max(16, Math.floor(width * 0.02));
        ctx.textAlign = "right";

        // Timestamp with high contrast
        ctx.fillStyle = "#38bdf8"; // Sky 400
        ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
        ctx.fillText(`📅 ${dateStr}  ⏰ ${timeStr}`, textRightMargin, line1Y);

        ctx.fillStyle = "#f59e0b"; // Amber 500
        ctx.font = `bold ${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(`HUKUKİ DELİL & GİZLİ ARŞİV • WEB'DE YAYINLANMAZ`, textRightMargin, line2Y);

        // Export as JPEG with stamped metadata
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

export const FixtureVaultModal: React.FC<FixtureVaultModalProps> = ({
  isOpen,
  onClose,
  property,
  onUpdateFixtures
}) => {
  const initialPhotos: FixturePhotoItem[] = React.useMemo(() => {
    if (!property?.fixture_photos) return [];
    if (Array.isArray(property.fixture_photos)) return property.fixture_photos;
    if (typeof property.fixture_photos === "string") {
      try {
        return JSON.parse(property.fixture_photos);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [property]);

  const [photos, setPhotos] = useState<FixturePhotoItem[]>(initialPhotos);
  const [selectedName, setSelectedName] = useState<string>(PRESET_FIXTURE_NAMES[0]);
  const [customName, setCustomName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [inspectPhoto, setInspectPhoto] = useState<FixturePhotoItem | null>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  if (!isOpen) return null;

  const currentItemName = customName.trim() ? customName.trim() : selectedName;

  const handleLiveCaptured = async (stampedDataUrl: string, timestampStr: string, isoDate: string) => {
    const newItem: FixturePhotoItem = {
      id: `fix-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: stampedDataUrl,
      name: currentItemName,
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

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const effectiveName = files.length > 1 
          ? `${currentItemName} (#${i + 1})`
          : currentItemName;

        const { stampedDataUrl, timestampStr, isoDate } = await stampImageWithDateAndMetadata(
          rawDataUrl,
          effectiveName,
          property.reference_no || `LP-${property.id}`,
          property.title || "Kiralık Eşyalı Mülk"
        );

        newItems.push({
          id: `fix-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          url: stampedDataUrl,
          name: effectiveName,
          timestamp_str: timestampStr,
          captured_at: isoDate
        });
      }

      const updated = [...newItems, ...photos];
      setPhotos(updated);
      toast.success(`${newItems.length} adet demirbaş görseli zaman damgası yakılarak arşive eklendi.`);
      
      // Persist directly
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
    if (!window.confirm("Bu demirbaş fotoğrafını arşivden silmek istediğinize emin misiniz?")) {
      return;
    }
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated);
    if (inspectPhoto?.id === id) setInspectPhoto(null);
    await saveToDatabase(updated);
    toast.success("Demirbaş fotoğrafı silindi.");
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
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
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

  const handlePrintInspectionReport = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      const nowStr = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
      
      const photosHtml = photos.map((p, idx) => `
        <div style="break-inside: avoid; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 16px; background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
            <strong style="font-size: 13px; color: #0f172a;">${idx + 1}. ${p.name}</strong>
            <span style="font-size: 11px; color: #0284c7; font-family: monospace; font-weight: bold;">ZAMAN: ${p.timestamp_str}</span>
          </div>
          <div style="text-align: center; background: #0f172a; border-radius: 6px; overflow: hidden;">
            <img src="${p.url}" alt="${p.name}" style="max-width: 100%; max-height: 280px; object-fit: contain; display: block; margin: 0 auto;" />
          </div>
        </div>
      `).join("");

      doc.write(`
        <html>
          <head>
            <title>Demirbaş Tespit Tutanağı - ${property.reference_no || property.id}</title>
            <style>
              body { font-family: sans-serif; background: white; margin: 30px; color: #0f172a; line-height: 1.5; }
              @media print {
                body { margin: 15px; }
              }
            </style>
          </head>
          <body>
            <div style="border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <h1 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase;">
                  EŞYALI KİRALIK MÜLK DEMİRBAŞ TESPİT TUTANAĞI
                </h1>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                  Portföy Ref: <strong>${property.reference_no || `LP-${property.id}`}</strong> • ${property.title}
                </div>
              </div>
              <div style="text-align: right; font-size: 11px; color: #64748b;">
                Tutanak Tarihi: <strong>${nowStr}</strong><br/>
                Kayıtlı Demirbaş: <strong>${photos.length} Adet</strong>
              </div>
            </div>

            <div style="background-color: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 12px;">
              <strong style="color: #0369a1; display: block; margin-bottom: 4px; font-size: 13px;">YASAL TAAHHÜT VE KABUL ŞARTI:</strong>
              <em style="color: #0f172a; font-weight: 600;">"Mülk'ü kiralarken içerisinde bulunan Eşya / demirbaşları inceledim, gördüm. Eşyalara ait resimleri de inceledim, gördüm. Onaylıyorum. kabulümdür."</em>
            </div>

            <div style="margin-bottom: 25px;">
              ${photosHtml || '<p style="text-align:center; color:#94a3b8; font-style:italic;">Kayıtlı demirbaş görseli bulunmamaktadır.</p>'}
            </div>

            <div style="margin-top: 30px; display: flex; justify-content: space-between; gap: 40px; break-inside: avoid;">
              <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; min-height: 100px;">
                <strong style="font-size: 11px; color: #475569;">KİRAYA VEREN / YETKİLİ ARACI</strong>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 40px;">İmza / Kaşe</div>
              </div>
              <div style="flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: center; min-height: 100px;">
                <strong style="font-size: 11px; color: #475569;">KİRACI / TESLİM ALAN</strong>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 40px;">İmza / Tarih</div>
              </div>
            </div>
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1500);
      }, 500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl relative text-slate-100">
        
        {/* Header with High-Contrast Security Notice */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Eşya & Demirbaş Fotoğraf Deposu
                </h2>
                <span className="bg-sky-500/20 text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-sky-500/30 uppercase">
                  Gizli Arşiv
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase">
                  Kiralık & Eşyalı
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md sm:max-w-xl">
                Ref: <strong className="text-white">{property.reference_no || `LP-${property.id}`}</strong> • {property.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {photos.length > 0 && (
              <button
                onClick={handlePrintInspectionReport}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700"
                title="Tutanak Yazdır / PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Tutanak Yazdır</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Strict Anti-Public Guarantee Banner */}
        <div className="bg-sky-950/40 border-b border-sky-900/60 px-4 py-2.5 sm:px-6 flex items-start sm:items-center gap-2.5 shrink-0 text-sky-200 text-xs">
          <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-[11px] sm:text-xs leading-relaxed">
            <span className="font-extrabold text-sky-300">GİZLİ HUKUKİ ARŞİV KORUMASI: </span>
            Bu fotoğraflar web sitesinde, vitrinde veya halka açık hiçbir ortamda <strong className="text-white underline">kesinlikle yayınlanmaz</strong>. 
            Yalnızca kira sözleşmesi eki, teslim-tesellüm tutanağı ve olası tahliye/hasar anlaşmazlıkları için kurum içi kanıt olarak tutulur.
          </div>
        </div>

        {/* Upload Control Strip */}
        <div className="p-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Demirbaş / Eşya Adı (Fotoğrafın Üzerine Kazınır)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedName}
                  onChange={(e) => {
                    setSelectedName(e.target.value);
                    setCustomName("");
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-sky-500"
                >
                  {PRESET_FIXTURE_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Veya Özel Eşya Adı (Örn: Çift Kapılı Gardırop)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {/* Direct Camera Input with capture="environment" for mobile/tablet fallback */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Standard File Picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />

              {/* Trademark LookPrice "Canlı Foto Çek 📸" Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  // If on desktop or browser supports mediaDevices, open live viewfinder; also cameraInput available
                  setIsLiveCameraOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/25 transition disabled:opacity-50 whitespace-nowrap cursor-pointer"
                title="Canlı kamera vizörünü aç ve doğrudan damgalı çek"
              >
                <Camera className="w-4 h-4 animate-pulse" />
                <span>Canlı Foto Çek 📸</span>
              </button>

              {/* Standard File Upload Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition disabled:opacity-50 whitespace-nowrap cursor-pointer"
                title="Galeriden veya bilgisayardan görsel seç"
              >
                <Upload className="w-4 h-4" />
                <span>Galeriden Yükle</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              Yüklenen her görselin alt bandına <strong>Gün.Ay.Yıl, Saat:Dakika:Saniye</strong> ve <strong>"{currentItemName}"</strong> etiketi dijital mühür olarak kalıcı şekilde işlenir.
            </span>
          </div>
        </div>

        {/* Gallery / Vault Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {photos.length === 0 ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-3xl">
              <div className="w-14 h-14 rounded-3xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Henüz Demirbaş Fotoğrafı Eklenmedi
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Kiralık mülk içerisindeki klima, beyaz eşya, mobilya ve sayaçları fotoğraflayarak yasal zaman damgalı delil arşivi oluşturun.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Fotoğrafı Çek / Yükle</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-bold text-slate-300">
                  Kayıtlı Demirbaş Listesi ({photos.length} Adet)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Tıklayarak tam boy inceleyebilir veya silebilirsiniz
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-2xl overflow-hidden transition-all shadow-md flex flex-col"
                  >
                    <div 
                      className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                      onClick={() => setInspectPhoto(item)}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="p-2 bg-slate-900/80 rounded-xl text-white backdrop-blur-sm">
                          <ZoomIn className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 bg-slate-950/90 text-sky-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.timestamp_str}</span>
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-2 shrink-0 bg-slate-950">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Zaman damgalı mühürlü</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setInspectPhoto(item)}
                          className="p-1.5 text-slate-400 hover:text-sky-400 rounded-lg transition"
                          title="İncele"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
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
          )}
        </div>

        {/* Footer with Contract Clause reminder */}
        <div className="p-3 sm:px-6 bg-slate-950 border-t border-slate-800 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Kira Sözleşmesi Zorunlu Maddesi: <em className="text-slate-200">"Mülk'ü kiralarken içerisinde bulunan Eşya / demirbaşları inceledim, gördüm. Eşyalara ait resimleri de inceledim, gördüm. Onaylıyorum. kabulümdür."</em>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition self-end sm:self-auto"
          >
            Tamamla & Kapat
          </button>
        </div>

        {/* Fullscreen Inspector Modal */}
        {inspectPhoto && (
          <div 
            className="fixed inset-0 z-[140] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
            onClick={() => setInspectPhoto(null)}
          >
            <div className="w-full max-w-4xl flex items-center justify-between mb-3 text-white px-2">
              <div>
                <h4 className="text-base font-bold text-sky-400">{inspectPhoto.name}</h4>
                <p className="text-xs text-slate-400 font-mono">Kayıt: {inspectPhoto.timestamp_str}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(inspectPhoto.id);
                  }}
                  className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Fotoğrafı Sil</span>
                </button>
                <button
                  onClick={() => setInspectPhoto(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div 
              className="max-w-4xl max-h-[80vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center p-2"
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
          propertyRef={property.reference_no || `LP-${property.id}`}
          propertyTitle={property.title || "Kiralık Eşyalı Mülk"}
          onPhotoCaptured={handleLiveCaptured}
        />
      </div>
    </div>
  );
};
