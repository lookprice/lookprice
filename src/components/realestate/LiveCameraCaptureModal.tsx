import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Camera, 
  Check, 
  AlertCircle,
  Clock,
  SwitchCamera,
  Upload
} from "lucide-react";
import { toast } from "sonner";

interface LiveCameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemCondition?: string;
  propertyRef: string;
  propertyTitle: string;
  onPhotoCaptured: (stampedDataUrl: string, timestampStr: string, isoDate: string) => void;
}

export const LiveCameraCaptureModal: React.FC<LiveCameraCaptureModalProps> = ({
  isOpen,
  onClose,
  itemName,
  itemCondition,
  propertyRef,
  onPhotoCaptured
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flash, setFlash] = useState<boolean>(false);
  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setCurrentTimeStr(
        `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
      );
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    startCamera(facingMode);
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (mode: "environment" | "user") => {
    stopCamera();
    setErrorMsg(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Tarayıcınız canlı kamera akışını desteklemiyor. Cihaz kamerası ile çekim yapabilirsiniz.");
      return;
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(e => console.warn("Video play error:", e));
      }
    } catch (err: any) {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr: any) {
        setErrorMsg("Kamera başlatılamadı veya izin verilmedi. Cihaz kamerasını kullanarak doğrudan çekim yapabilirsiniz.");
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const stampCanvasAndEmit = (sourceCanvasOrImg: HTMLVideoElement | HTMLImageElement, width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context is unavailable");

    ctx.drawImage(sourceCanvasOrImg, 0, 0, width, height);

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

    ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
    ctx.fillRect(0, bannerY, width, bannerHeight);

    ctx.fillStyle = "#0284c7";
    ctx.fillRect(0, bannerY, width, Math.max(3, Math.floor(bannerHeight * 0.05)));

    const primaryFontSize = Math.max(14, Math.floor(bannerHeight * 0.28));
    const secondaryFontSize = Math.max(11, Math.floor(bannerHeight * 0.22));

    // Left text: Item name + Ref code only
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

    // Right text: Date/Time + "hukuki delil"
    const textRightMargin = width - Math.max(16, Math.floor(width * 0.02));
    ctx.textAlign = "right";

    ctx.fillStyle = "#38bdf8";
    ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
    ctx.fillText(`${dateStr} ${timeStr}`, textRightMargin, line1Y);

    ctx.fillStyle = "#fbbf24";
    ctx.font = `bold ${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(`hukuki delil`, textRightMargin, line2Y);

    const stampedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
    onPhotoCaptured(stampedDataUrl, timestampStr, isoDate);
    setCapturedCount(prev => prev + 1);
    toast.success(`"${itemName}" çekildi ve damgalandı.`);
  };

  const takeSnapshot = async () => {
    if (!videoRef.current || isCapturing) return;

    setIsCapturing(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      stampCanvasAndEmit(video, width, height);
    } catch (err: any) {
      console.error("Snapshot error:", err);
      toast.error("Fotoğraf çekilirken hata oluştu: " + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleNativeCameraFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCapturing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          stampCanvasAndEmit(img, img.naturalWidth || img.width || 1280, img.naturalHeight || img.height || 720);
        } catch (err: any) {
          toast.error("Fotoğraf işlenemedi: " + err.message);
        } finally {
          setIsCapturing(false);
          if (fallbackFileInputRef.current) fallbackFileInputRef.current.value = "";
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Daylight High-Contrast Corporate Modal Frame */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col relative text-slate-950 max-h-[92dvh]">
        
        {/* Top bar */}
        <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                Canlı Kamera
              </h3>
              <span className="bg-emerald-500 text-slate-950 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
                AKTİF
              </span>
            </div>
            <p className="text-[11px] text-slate-200 truncate">
              Seçili Eşya: <strong className="text-amber-300 font-black">{itemName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleFacingMode}
              type="button"
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              title="Ön/Arka Kamera Değiştir"
            >
              <SwitchCamera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kamera Çevir</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Canvas / Video */}
        <div className="relative aspect-[4/3] sm:aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
          <input
            ref={fallbackFileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleNativeCameraFallback}
          />
          {errorMsg ? (
            <div className="p-4 text-center max-w-md bg-white m-3 rounded-xl border-2 border-slate-300 shadow-lg text-slate-950">
              <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-1.5" />
              <p className="text-xs font-black text-slate-950">{errorMsg}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer"
                >
                  Tekrar Dene
                </button>
                <button
                  type="button"
                  onClick={() => fallbackFileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cihaz Kamerası / Galeri Aç</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {flash && (
                <div className="absolute inset-0 bg-white opacity-80 pointer-events-none transition-opacity duration-150" />
              )}

              {/* Top HUD Badges */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <div className="bg-white/95 px-2.5 py-1 rounded-lg text-[10px] font-mono font-black text-slate-950 border border-slate-300 flex items-center gap-1 shadow">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span>{currentTimeStr || "Saat Damgalanıyor"}</span>
                </div>
                {capturedCount > 0 && (
                  <div className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{capturedCount} Fotoğraf Çekildi</span>
                  </div>
                )}
              </div>

              {/* Bottom HUD Preview Bar */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700 pointer-events-none flex items-center justify-between text-[10px]">
                <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  {itemName} • Ref: {propertyRef}
                </span>
                <span className="text-amber-400 font-bold truncate">
                  hukuki delil
                </span>
              </div>
            </>
          )}
        </div>

        {/* Bottom Shutter Controls - Strict 2-Column Mobile Grid so Tamamla never overflows */}
        <div className="p-2.5 sm:p-3 bg-slate-50 border-t-2 border-slate-200 grid grid-cols-2 gap-2 items-center shrink-0">
          <button
            type="button"
            disabled={isCapturing}
            onClick={() => {
              if (stream) {
                takeSnapshot();
              } else {
                fallbackFileInputRef.current?.click();
              }
            }}
            className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span className="truncate">{isCapturing ? "Damgalanıyor..." : "Çek & Damgala"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Tamamla {capturedCount > 0 ? `(${capturedCount})` : ""}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
