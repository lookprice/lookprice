import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Camera, 
  RotateCcw, 
  Check, 
  Sparkles, 
  AlertCircle,
  Clock,
  ShieldCheck,
  SwitchCamera
} from "lucide-react";
import { toast } from "sonner";

interface LiveCameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  propertyRef: string;
  propertyTitle: string;
  onPhotoCaptured: (stampedDataUrl: string, timestampStr: string, isoDate: string) => void;
}

export const LiveCameraCaptureModal: React.FC<LiveCameraCaptureModalProps> = ({
  isOpen,
  onClose,
  itemName,
  propertyRef,
  propertyTitle,
  onPhotoCaptured
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flash, setFlash] = useState<boolean>(false);
  const [capturedCount, setCapturedCount] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  // Live clock on HUD
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

  // Start / restart camera stream
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
      setErrorMsg("Tarayıcınız canlı kamera akışını desteklemiyor.");
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
      console.warn("Camera access failed with preferred facingMode, retrying generic video:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr: any) {
        setErrorMsg("Kamera başlatılamadı veya izin verilmedi. Lütfen kamera izni verdiğinizden emin olun.");
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
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

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas context is unavailable");

      // Draw video frame
      ctx.drawImage(video, 0, 0, width, height);

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

      // Timestamp bottom banner
      const bannerHeight = Math.max(54, Math.floor(height * 0.085));
      const bannerY = height - bannerHeight;

      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fillRect(0, bannerY, width, bannerHeight);

      ctx.fillStyle = "#0284c7";
      ctx.fillRect(0, bannerY, width, Math.max(3, Math.floor(bannerHeight * 0.05)));

      const primaryFontSize = Math.max(14, Math.floor(bannerHeight * 0.28));
      const secondaryFontSize = Math.max(11, Math.floor(bannerHeight * 0.22));

      // Left text
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

      // Right text
      const textRightMargin = width - Math.max(16, Math.floor(width * 0.02));
      ctx.textAlign = "right";

      ctx.fillStyle = "#38bdf8";
      ctx.font = `bold ${primaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace`;
      ctx.fillText(`📅 ${dateStr}  ⏰ ${timeStr}`, textRightMargin, line1Y);

      ctx.fillStyle = "#f59e0b";
      ctx.font = `bold ${secondaryFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.fillText(`HUKUKİ DELİL & GİZLİ ARŞİV • WEB'DE YAYINLANMAZ`, textRightMargin, line2Y);

      const stampedDataUrl = canvas.toDataURL("image/jpeg", 0.88);

      onPhotoCaptured(stampedDataUrl, timestampStr, isoDate);
      setCapturedCount(prev => prev + 1);
      toast.success(`"${itemName}" başarıyla çekildi ve zaman damgalandı.`);
    } catch (err: any) {
      console.error("Snapshot error:", err);
      toast.error("Fotoğraf çekilirken hata oluştu: " + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col relative text-white">
        
        {/* Top bar */}
        <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Camera className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <span>Canlı Kamera Vizörü</span>
                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider animate-pulse">
                  CANLI
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Hedef: <strong className="text-sky-300">{itemName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFacingMode}
              type="button"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition flex items-center gap-1 text-xs cursor-pointer"
              title="Ön/Arka Kamera Değiştir"
            >
              <SwitchCamera className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">Kamera Çevir</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Canvas / Video */}
        <div className="relative aspect-[4/3] sm:aspect-video bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center max-w-md">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-rose-300">{errorMsg}</p>
              <p className="text-xs text-slate-400 mt-2">
                Tarayıcı izinlerinden kamerayı aktif edebilir veya cihazınızın yerel kamera uygulamasını kullanabilirsiniz.
              </p>
              <button
                onClick={() => startCamera(facingMode)}
                className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Yeniden Dene
              </button>
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

              {/* Shutter flash animation */}
              {flash && (
                <div className="absolute inset-0 bg-white opacity-80 pointer-events-none transition-opacity duration-150" />
              )}

              {/* Target Aim Reticle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-sky-400/40 rounded-3xl flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-sky-400 rounded-full opacity-60" />
                </div>
              </div>

              {/* Top HUD Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-mono text-sky-300 border border-slate-800 flex items-center gap-1.5 shadow">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>{currentTimeStr || "Saat Damgalanıyor"}</span>
                </div>
                {capturedCount > 0 && (
                  <div className="bg-emerald-600/90 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{capturedCount} Çekildi</span>
                  </div>
                )}
              </div>

              {/* Bottom HUD Preview Bar */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 pointer-events-none flex items-center justify-between text-[10px]">
                <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  🔒 {itemName}
                </span>
                <span className="text-amber-400 font-semibold truncate hidden sm:inline">
                  Hukuki Delil & Damgalı Arşiv
                </span>
              </div>
            </>
          )}
        </div>

        {/* Bottom Shutter Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            <span>Butona her basıldığında fotoğraf mühürlenip arşive eklenir.</span>
          </div>

          <div className="flex-1 sm:flex-none flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={!stream || isCapturing}
              onClick={takeSnapshot}
              className="px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-xl shadow-sky-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all w-full sm:w-auto justify-center"
            >
              <Camera className="w-5 h-5" />
              <span>{isCapturing ? "Damgalanıyor..." : "ŞİMDİ ÇEK & DAMGALA 📸"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Tamamla
          </button>
        </div>
      </div>
    </div>
  );
};
