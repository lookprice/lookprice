import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { motion } from "motion/react";
import { AlertCircle, Zap, ZapOff } from "lucide-react";

interface ScannerProps {
  onResult: (decodedText: string) => void;
  onManualEntry?: () => void;
}

const Scanner = ({ onResult, onManualEntry }: ScannerProps) => {
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const beepAudio = useRef<HTMLAudioElement | null>(null);

  const playBeep = () => {
    if (!beepAudio.current) {
      beepAudio.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
    }
    beepAudio.current.play().catch(() => {});
  };

  useEffect(() => {
    if (!scannerRef.current) return;

    // Generate a unique ID for the scanner div
    const scannerId = "reader-" + Math.random().toString(36).substring(2, 9);
    scannerRef.current.id = scannerId;

    const initScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        });
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (navigator.vibrate) navigator.vibrate(100);
            playBeep();
            
            // Stop scanning and return result
            if (html5QrCode.isScanning) {
              html5QrCode.stop().then(() => {
                onResult(decodedText);
              }).catch(err => {
                console.error("Stop failed: ", err);
                onResult(decodedText);
              });
            } else {
              onResult(decodedText);
            }
          },
          (errorMessage) => {
            // parse errors are normal, ignore them
          }
        );

        setIsStarting(false);

        // Check for torch support
        setTimeout(() => {
          try {
            const track = html5QrCode.getRunningTrackCameraCapabilities();
            if (track && track.torchFeature && track.torchFeature().isSupported()) {
              setHasTorch(true);
            } else {
              // Fallback check
              const mediaStreamTrack = html5QrCodeRef.current?.getRunningTrackCameraCapabilities();
              if (mediaStreamTrack && (mediaStreamTrack as any).torchFeature) {
                setHasTorch(true);
              }
            }
          } catch (e) {
            console.warn("Torch check failed", e);
          }
        }, 1000);

      } catch (err) {
        console.error("Scanner Error:", err);
        setError("Kamera erişimi sağlanamadı. Lütfen tarayıcı ayarlarından (adres çubuğundaki kilit simgesi) veya cihazınızın gizlilik ayarlarından kamera iznini kontrol edin.");
        setIsStarting(false);
      }
    };

    initScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error);
      }
      if (beepAudio.current) beepAudio.current = null;
    };
  }, [onResult]);

  const toggleTorch = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        const newState = !isTorchOn;
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: newState }] as any
        });
        setIsTorchOn(newState);
      }
    } catch (err) {
      console.error("Flaş hatası:", err);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto aspect-[4/5] overflow-hidden rounded-[2.5rem] border-8 border-white/10 shadow-2xl bg-black isolation-isolate">
      {/* Scanner Container */}
      <div 
        ref={scannerRef} 
        className="absolute inset-0 w-full h-full [&>video]:absolute [&>video]:inset-0 [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:hidden" 
      />

      {/* Tarama Arayüzü (Overlay) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
        {/* Odak Çerçevesi */}
        <div className="w-4/5 h-1/4 border-2 border-indigo-500/50 rounded-2xl relative">
          <div className="absolute inset-0 border-2 border-white/20 animate-pulse rounded-2xl" />
          {/* Kırmızı Tarama Çizgisi */}
          <motion.div 
            animate={{ top: ["10%", "90%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute left-2 right-2 h-[2px] bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]"
          />
        </div>
        <p className="text-white/70 text-[10px] font-bold tracking-[0.2em] mt-6 uppercase">Barkodu Çerçevenin İçine Hizalayın</p>
      </div>

      {/* Kontrol Butonları */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 px-10 z-20 pointer-events-auto">
        {hasTorch && (
          <button 
            onClick={toggleTorch}
            className={`p-4 rounded-full backdrop-blur-xl border border-white/20 transition-all ${isTorchOn ? 'bg-yellow-400 text-black' : 'bg-black/40 text-white'}`}
          >
            {isTorchOn ? <ZapOff size={24} /> : <Zap size={24} />}
          </button>
        )}
        <button 
          onClick={onManualEntry}
          className="flex-1 bg-white text-black font-black py-4 rounded-2xl text-sm uppercase tracking-tighter shadow-lg"
        >
          Manuel Barkod Gir
        </button>
      </div>

      {/* Yükleme Ekranı */}
      {isStarting && (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-[10px] font-black tracking-widest">KAMERA HAZIRLANIYOR...</p>
        </div>
      )}

      {/* Hata Ekranı */}
      {error && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-8 text-center z-50 pointer-events-auto">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h3 className="text-white font-black text-lg mb-4 uppercase tracking-tighter">Kamera Erişimi Hatası</h3>
          <p className="text-white/70 text-sm leading-relaxed mb-8">
            {error}
          </p>
          <div className="space-y-3 w-full">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black font-black py-4 rounded-2xl text-sm uppercase tracking-tighter hover:bg-gray-200 transition-colors"
            >
              Sayfayı Yenile
            </button>
            {onManualEntry && (
              <button 
                onClick={onManualEntry}
                className="w-full bg-white/10 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-tighter hover:bg-white/20 transition-colors"
              >
                Manuel Giriş Yap
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
