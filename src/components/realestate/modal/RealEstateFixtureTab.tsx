import React, { useState, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Trash2, 
  ZoomIn, 
  Clock, 
  Check, 
  Loader2, 
  ShieldAlert, 
  Info,
  X,
  Plus
} from "lucide-react";
import { RealEstateProperty, FixturePhotoItem } from "@/types";
import { toast } from "sonner";
import { LiveCameraCaptureModal } from "../LiveCameraCaptureModal";

interface RealEstateFixtureTabProps {
  formData: Partial<RealEstateProperty>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<RealEstateProperty>>>;
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

// Canvas-based Timestamp Burn-in
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

        ctx.drawImage(img, 0, 0, width, height);

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

        const bannerHeight = Math.max(54, Math.floor(height * 0.085));
        const bannerY = height - bannerHeight;

        // Semi-transparent dark background
        ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
        ctx.fillRect(0, bannerY, width, bannerHeight);

        // Accent top border
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(0, bannerY, width, Math.max(3, Math.floor(bannerHeight * 0.05)));

        const primaryFontSize = Math.max(14, Math.floor(bannerHeight * 0.28));
        const secondaryFontSize = Math.max(11, Math.floor(bannerHeight * 0.22));

        // Left side text
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const textLeftMargin = Math.max(16, Math.floor(width * 0.02));
        const line1Y = bannerY + bannerHeight * 0.38;
        const line2Y = bannerY + bannerHeight * 0.72;

        const cleanItemName = (itemName || "Demirbaş Eşya").toUpperCase();
        ctx.fillText(`🔒 ${cleanItemName}`, textLeftMargin, line1Y);

        ctx.fillStyle = "#94a3b8";
        ctx.font = `600 ${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        const shortTitle = propertyTitle.length > 40 ? propertyTitle.substring(0, 37) + "..." : propertyTitle;
        ctx.fillText(`MÜLK: ${propertyRef || "LP-PORTFOY"} • ${shortTitle}`, textLeftMargin, line2Y);

        // Right side text
        const textRightMargin = width - Math.max(16, Math.floor(width * 0.02));
        ctx.textAlign = "right";

        ctx.fillStyle = "#38bdf8";
        ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
        ctx.fillText(`📅 ${dateStr}  ⏰ ${timeStr}`, textRightMargin, line1Y);

        ctx.fillStyle = "#f59e0b";
        ctx.font = `bold ${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.fillText(`HUKUKİ DELİL & GİZLİ ARŞİV • WEB'DE YAYINLANMAZ`, textRightMargin, line2Y);

        const stampedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
        resolve({ stampedDataUrl, timestampStr, isoDate });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (e) => reject(new Error("Image loading error: " + e));
    img.src = dataUrl;
  });
}

export const RealEstateFixtureTab: React.FC<RealEstateFixtureTabProps> = ({
  formData,
  setFormData
}) => {
  const photos: FixturePhotoItem[] = Array.isArray(formData.fixture_photos) 
    ? formData.fixture_photos 
    : [];

  const [selectedName, setSelectedName] = useState<string>(PRESET_FIXTURE_NAMES[0]);
  const [customName, setCustomName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [inspectPhoto, setInspectPhoto] = useState<FixturePhotoItem | null>(null);
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const currentItemName = customName.trim() ? customName.trim() : selectedName;

  const handleLiveCaptured = (stampedDataUrl: string, timestampStr: string, isoDate: string) => {
    const newItem: FixturePhotoItem = {
      id: `fix-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: stampedDataUrl,
      name: currentItemName,
      timestamp_str: timestampStr,
      captured_at: isoDate
    };
    const updated = [newItem, ...photos];
    setFormData(prev => ({ ...prev, fixture_photos: updated }));
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
          formData.reference_no || "LP-PORTFOY",
          formData.title || "Kiralık Eşyalı Mülk"
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
      setFormData(prev => ({ ...prev, fixture_photos: updated }));
      toast.success(`${newItems.length} demirbaş görseli zaman damgalı olarak eklendi.`);
    } catch (err: any) {
      console.error("Fixture upload error:", err);
      toast.error("Fotoğraf işlenirken hata oluştu: " + err.message);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    setFormData(prev => ({ ...prev, fixture_photos: updated }));
    if (inspectPhoto?.id === id) setInspectPhoto(null);
    toast.success("Demirbaş fotoğrafı kaldırıldı.");
  };

  return (
    <div className="space-y-3">
      {/* Strict Privacy Guarantee Header */}
      <div className="bg-sky-950/40 border border-sky-800/80 rounded-2xl p-3 sm:p-4 text-sky-200">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-white">
                🔒 GİZLİ EŞYA & DEMİRBAŞ FOTOĞRAF DEPOSU
              </h4>
              <span className="bg-sky-500/20 text-sky-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                Sadece Kiralık & Eşyalı
              </span>
            </div>
            <p className="text-[11px] text-sky-200/90 leading-relaxed mt-1">
              Bu resimler web sitesinde, vitrinde veya ilan sayfalarında <strong>ASLA YAYINLANMAZ</strong>. Yalnızca kira sözleşmesi eki demirbaş teslim tutanağı ve hukuki delil arşivi olarak saklanır.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Contract Clause Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <strong className="text-white block mb-0.5">Kira Sözleşmesi Zorunlu Maddesi:</strong>
          <span className="italic text-sky-300 font-semibold">
            "Mülk'ü kiralarken içerisinde bulunan Eşya / demirbaşları inceledim, gördüm. Eşyalara ait resimleri de inceledim, gördüm. Onaylıyorum. kabulümdür."
          </span>
          <div className="text-[10px] text-slate-400 mt-1">
            Bu portföy için oluşturulacak tüm kira sözleşmelerine bu madde ve kaydedilen demirbaş sayısı otomatik eklenir.
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs space-y-2.5">
        <label className="text-[11px] font-bold text-slate-700 block">
          Yeni Demirbaş Ekle (Fotoğraf Üzerine Tarih/Saat Damgası İşlenir)
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={selectedName}
            onChange={(e) => {
              setSelectedName(e.target.value);
              setCustomName("");
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
          >
            {PRESET_FIXTURE_NAMES.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Veya Özel İsim (Örn: Çift Kapılı Gardırop)"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-1 gap-2">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Fotoğraf çekildiğinde güncel gün, saat ve saniye otomatik olarak damgalanır.</span>
          </span>

          <div className="flex items-center gap-2 self-end sm:self-auto">
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

            {/* LookPrice "Canlı Foto Çek 📸" Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsLiveCameraOpen(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer disabled:opacity-50"
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
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              title="Galeriden veya bilgisayardan görsel seç"
            >
              <Upload className="w-4 h-4" />
              <span>Galeriden Yükle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fixtures Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Kayıtlı Demirbaş Fotoğrafları ({photos.length} Adet)</span>
          <span className="text-[11px] text-slate-500 font-normal">
            Büyütmek için fotoğrafa tıklayınız
          </span>
        </div>

        {photos.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Henüz demirbaş fotoğrafı eklenmedi</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kiralık eşyalı mülklerde teslim edilen demirbaşların zaman damgalı fotoğraflarını buraya ekleyebilirsiniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {photos.map((item) => (
              <div
                key={item.id}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
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
                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-1.5 bg-white/90 rounded-lg text-slate-900 shadow">
                      <ZoomIn className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="absolute bottom-1 left-1 bg-slate-900/90 text-sky-300 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp_str}</span>
                  </div>
                </div>

                <div className="p-2 flex items-center justify-between gap-1.5 bg-white">
                  <span className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectPhoto(item)}
                      className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer"
                      title="İncele"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Inspector Modal */}
      {inspectPhoto && (
        <div 
          className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setInspectPhoto(null)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between mb-3 text-white px-2">
            <div>
              <h4 className="text-base font-bold text-sky-400">{inspectPhoto.name}</h4>
              <p className="text-xs text-slate-400 font-mono">Damga Zamanı: {inspectPhoto.timestamp_str}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(inspectPhoto.id);
                }}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Fotoğrafı Sil</span>
              </button>
              <button
                onClick={() => setInspectPhoto(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl cursor-pointer"
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
        propertyRef={formData.reference_no || "LP-PORTFOY"}
        propertyTitle={formData.title || "Kiralık Eşyalı Mülk"}
        onPhotoCaptured={handleLiveCaptured}
      />
    </div>
  );
};
