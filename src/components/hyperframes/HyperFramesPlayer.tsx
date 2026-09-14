import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Code, 
  ChevronRight, 
  Tv, 
  Mic, 
  Check, 
  Layers,
  MousePointer,
  Download,
  Video,
  X
} from 'lucide-react';
import { 
  HYPERFRAME_SCENARIOS, 
  HyperFrameScenario, 
  HyperFrameStep 
} from './scenarios';
import { 
  BookNavScreen, 
  BookIsbnScreen, 
  HotelBookingScreen, 
  HotelWhatsappScreen,
  HotelCleaningScreen,
  HotelChannelScreen,
  ShopPosScreen 
} from './HyperFramesScreens';
import { playHyperSound } from './soundEffects';

interface HyperFramesPlayerProps {
  initialScenarioId?: 
    | 'book_nav' 
    | 'book_isbn' 
    | 'hotel_booking' 
    | 'hotel_whatsapp'
    | 'hotel_cleaning'
    | 'hotel_channel'
    | 'shop_pos';
  lang?: string;
  className?: string;
  onClose?: () => void;
}

export function HyperFramesPlayer({
  initialScenarioId = 'book_nav',
  lang = 'tr',
  className = '',
  onClose
}: HyperFramesPlayerProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(initialScenarioId);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const lastStepIndexRef = useRef<number>(-1);

  // Instant Screen Capture / Video Recorder helper using MediaRecorder API
  const handleStartCapture = async () => {
    try {
      setIsRecording(true);
      setRecordProgress(10);
      
      // Prompt user or record display
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 }
        });

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `LookPrice_${scenario.id}_${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          setIsRecording(false);
          setRecordProgress(100);
        };

        recorder.start();
        setCurrentTime(0);
        setIsPlaying(true);

        // Auto-stop after scenario duration
        setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
            stream.getTracks().forEach(track => track.stop());
          }
        }, scenario.duration * 1000 + 500);

      } else {
        // Fallback simulated export
        simulateDirectVideoDownload();
      }
    } catch {
      simulateDirectVideoDownload();
    }
  };

  const simulateDirectVideoDownload = () => {
    setIsRecording(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setRecordProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsRecording(false);
        // Create formatted scenario export blob
        const videoData = JSON.stringify({
          lookprice_video_export: true,
          scenario_id: scenario.id,
          title: scenario.title.tr,
          sector: scenario.sectorKey,
          duration_sec: scenario.duration,
          exported_at: new Date().toISOString(),
          steps: scenario.steps
        }, null, 2);

        const blob = new Blob([videoData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LookPrice_Video_${scenario.id}_Spec.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 400);
  };

  // Sync if initialScenarioId changes from parent props
  useEffect(() => {
    if (initialScenarioId) {
      setActiveScenarioId(initialScenarioId);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [initialScenarioId]);

  const scenario = useMemo(() => {
    return HYPERFRAME_SCENARIOS.find(s => s.id === activeScenarioId) || HYPERFRAME_SCENARIOS[0];
  }, [activeScenarioId]);

  const currentStepIndex = useMemo(() => {
    const idx = scenario.steps.findIndex(step => currentTime >= step.startSec && currentTime < step.endSec);
    return idx !== -1 ? idx : scenario.steps.length - 1;
  }, [currentTime, scenario]);

  const currentStep = scenario.steps[currentStepIndex];

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 50;
    const incrementSec = (intervalMs / 1000) * playbackSpeed;

    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + incrementSec;
        if (next >= scenario.duration) {
          return 0; // Loop back or pause
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, scenario.duration]);

  // Audio effect triggers when step transitions
  useEffect(() => {
    if (lastStepIndexRef.current !== currentStepIndex) {
      lastStepIndexRef.current = currentStepIndex;
      if (!isMuted && isPlaying) {
        const action = currentStep?.cursorTarget?.action;
        if (action === 'click') {
          playHyperSound('click');
        } else if (action === 'type') {
          playHyperSound('type');
        } else {
          playHyperSound('beep');
        }
      }
    }
  }, [currentStepIndex, isMuted, isPlaying, currentStep]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getLocalized = (obj: any) => {
    if (!obj) return '';
    return obj[lang] || obj['tr'] || obj['en'] || '';
  };

  // Cursor coordinates with default center
  const cursorX = currentStep?.cursorTarget?.x ?? 50;
  const cursorY = currentStep?.cursorTarget?.y ?? 50;
  const cursorAction = currentStep?.cursorTarget?.action;
  const cursorActionText = currentStep?.cursorTarget?.actionText;

  return (
    <div 
      ref={containerRef}
      className={`relative flex flex-col bg-[#05060b] rounded-2xl border border-white/10 overflow-hidden shadow-2xl ${className}`}
    >
      {/* Top Studio Control Bar */}
      <div className="px-3 sm:px-4 py-2.5 bg-[#0a0c16]/90 backdrop-blur-md border-b border-white/10 flex flex-wrap items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-[10px] font-black text-purple-200 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>HyperFrames AI Studio</span>
          </div>

          <span className="text-[11px] font-bold text-white/80 hidden sm:inline-block">
            {getLocalized(scenario.title)}
          </span>
        </div>

        {/* Quick Scenario Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          {HYPERFRAME_SCENARIOS.map(s => {
            const isSel = s.id === activeScenarioId;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveScenarioId(s.id);
                  setCurrentTime(0);
                  setIsPlaying(true);
                  if (!isMuted) playHyperSound('click');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                  isSel 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <span>{s.badge}</span>
              </button>
            );
          })}

          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white ml-2 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Screen Canvas with Animated Cursor */}
      <div className="relative flex-1 w-full min-h-[320px] sm:min-h-[440px] md:min-h-[500px] bg-black overflow-hidden flex items-center justify-center">
        {/* Render Scenario UI */}
        {scenario.id === 'book_nav' && (
          <BookNavScreen 
            activeBookIndex={currentStep?.statePayload?.activeBookIndex ?? 0}
            highlightBar={currentStep?.statePayload?.highlightBar ?? false}
          />
        )}

        {scenario.id === 'book_isbn' && (
          <BookIsbnScreen 
            isbnValue={currentStep?.statePayload?.isbnValue ?? ''}
            isScanning={currentStep?.statePayload?.isScanning ?? false}
            isAutoFilled={currentStep?.statePayload?.isAutoFilled ?? false}
            priceValue={currentStep?.statePayload?.priceValue}
            isSaved={currentStep?.statePayload?.isSaved ?? false}
          />
        )}

        {scenario.id === 'hotel_booking' && (
          <HotelBookingScreen 
            activeTab={currentStep?.statePayload?.activeTab ?? 'details'}
            selectedDates={currentStep?.statePayload?.selectedDates ?? null}
            totalPrice={currentStep?.statePayload?.totalPrice}
            isBooked={currentStep?.statePayload?.isBooked ?? false}
            bookingRef={currentStep?.statePayload?.bookingRef}
          />
        )}

        {scenario.id === 'hotel_whatsapp' && (
          <HotelWhatsappScreen 
            stage={currentStep?.statePayload?.stage ?? 'preview'}
            guestName={currentStep?.statePayload?.guestName ?? 'Ahmet Yılmaz'}
            phone={currentStep?.statePayload?.phone ?? '+90 533 888 1234'}
            room={currentStep?.statePayload?.room ?? 'Deluxe Balayı Süiti #304'}
            dates={currentStep?.statePayload?.dates ?? '18 - 22 Eylül (4 Gece)'}
            isSent={currentStep?.statePayload?.isSent ?? false}
          />
        )}

        {scenario.id === 'hotel_cleaning' && (
          <HotelCleaningScreen 
            highlightRoom={currentStep?.statePayload?.highlightRoom ?? null}
            staffAssigned={currentStep?.statePayload?.staffAssigned ?? false}
            roomStatus={currentStep?.statePayload?.roomStatus ?? 'dirty'}
          />
        )}

        {scenario.id === 'hotel_channel' && (
          <HotelChannelScreen 
            multiplier={currentStep?.statePayload?.multiplier ?? 1.0}
            seasonName={currentStep?.statePayload?.seasonName ?? 'Standart Sezon'}
            applied={currentStep?.statePayload?.applied ?? false}
            liveSync={currentStep?.statePayload?.liveSync ?? false}
          />
        )}

        {scenario.id === 'shop_pos' && (
          <ShopPosScreen 
            screen={currentStep?.statePayload?.screen ?? 'matrix'}
            matrixCount={currentStep?.statePayload?.matrixCount ?? 12}
            priceApplied={currentStep?.statePayload?.priceApplied ?? false}
            cartItems={currentStep?.statePayload?.cartItems ?? []}
            paid={currentStep?.statePayload?.paid ?? false}
            receiptNo={currentStep?.statePayload?.receiptNo}
          />
        )}

        {/* Animated Virtual Cursor Overlay */}
        <div 
          className="absolute pointer-events-none z-40 transition-all duration-700 ease-out"
          style={{ 
            left: `${cursorX}%`, 
            top: `${cursorY}%`,
            transform: 'translate(-4px, -4px)'
          }}
        >
          {/* Cursor SVG */}
          <div className="relative">
            <svg 
              className="w-5 h-5 text-white filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              stroke="#000" 
              strokeWidth="1.5"
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>

            {/* Click Ripple Effect */}
            {cursorAction === 'click' && (
              <span className="absolute -inset-3 rounded-full border-2 border-purple-400 animate-ping opacity-75 pointer-events-none" />
            )}

            {/* Action text badge */}
            {cursorActionText && (
              <span className="absolute left-5 top-0 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-bold text-white border border-white/20 whitespace-nowrap shadow-md">
                {cursorAction === 'type' ? '⌨️ ' : '👆 '} {cursorActionText}
              </span>
            )}
          </div>
        </div>

        {/* Sync Subtitles (AI Presenter / Narration) Banner */}
        <div className="absolute bottom-3 left-4 right-4 z-30 pointer-events-none flex justify-center">
          <div className="max-w-2xl w-full px-3.5 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 text-white shadow-2xl flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center shrink-0">
              <Mic className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 block leading-none mb-0.5">
                AI Voiceover • {currentStep.title} ({formatTime(currentTime)} / {formatTime(scenario.duration)})
              </span>
              <p className="text-xs font-semibold text-white/95 leading-snug line-clamp-2">
                {getLocalized(currentStep.narration)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Timeline & Controls */}
      <div className="p-3 bg-[#0a0c16] border-t border-white/10 z-30 space-y-2">
        {/* Step Bookmarks / Chapters */}
        <div className="grid grid-cols-4 gap-1.5">
          {scenario.steps.map((step, idx) => {
            const isCurrent = currentStepIndex === idx;
            const isPassed = currentTime >= step.endSec;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentTime(step.startSec);
                  setIsPlaying(true);
                  if (!isMuted) playHyperSound('click');
                }}
                className={`py-1 px-1.5 rounded-md text-[9px] font-bold truncate transition-all cursor-pointer text-left flex items-center gap-1 ${
                  isCurrent 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : isPassed 
                    ? 'bg-white/10 text-white/80' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                <span className="truncate">{step.title}</span>
              </button>
            );
          })}
        </div>

        {/* Progress Bar & Scrubber */}
        <div 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            setCurrentTime(pos * scenario.duration);
          }}
          className="relative w-full h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden group hover:h-2.5 transition-all"
        >
          <div 
            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 rounded-full transition-all"
            style={{ width: `${(currentTime / scenario.duration) * 100}%` }}
          />
        </div>

        {/* Media Buttons Row */}
        <div className="flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlaying(!isPlaying);
                if (!isMuted) playHyperSound('click');
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title={isPlaying ? "Durdur" : "Oynat"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => {
                setCurrentTime(0);
                setIsPlaying(true);
                if (!isMuted) playHyperSound('click');
              }}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Başa Sar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="font-mono text-[11px] text-white/80 ml-1">
              {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(scenario.duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed Multiplier */}
            <button
              onClick={() => {
                const speeds = [1, 1.5, 2];
                const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                setPlaybackSpeed(nextSpeed);
              }}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-white transition-all"
            >
              {playbackSpeed}x
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title={isMuted ? "Sesi Aç" : "Sessize Al"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-purple-300" />}
            </button>

            {/* HyperFrames JSON Spec Inspector */}
            <button
              onClick={() => setShowCodeModal(true)}
              className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all cursor-pointer hidden sm:flex items-center gap-1 text-[10px] font-bold"
              title="HyperFrames Kodunu İncele"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Spec</span>
            </button>

            {/* Video İndir / Kaydet Button */}
            <button
              onClick={() => setShowDownloadModal(true)}
              className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
              title="Videoyu İndir & YouTube'a Aktar"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Videoyu İndir</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title={isFullscreen ? "Küçült" : "Tam Ekran"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* HyperFrames JSON Spec Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-purple-500/30 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">HyperFrames Video Spec (JSON Declaration)</h3>
              </div>
              <button 
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Bu senaryo, HeyGen HyperFrames motorunun kod üzerinden otomatik video render alması için standart declarative JSON formatında tanımlanmıştır.
            </p>

            <pre className="bg-black/60 p-3.5 rounded-xl border border-white/10 text-[11px] font-mono text-purple-200 overflow-y-auto max-h-80 select-all leading-relaxed">
              {JSON.stringify(scenario, null, 2)}
            </pre>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(scenario, null, 2));
                  alert("HyperFrames JSON spec panoya kopyalandı!");
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                Spec'i Kopyala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video İndirme ve Dışa Aktarma Modalı */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b141a] border border-emerald-500/30 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Videoyu İndir & Dışa Aktar</h3>
                  <p className="text-[10px] text-emerald-400 font-mono">{scenario.title.tr}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-white/80 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-emerald-400" />
                  1. Doğrudan Video Olarak Kaydet (WebM / MP4)
                </p>
                <p className="text-[11px] text-white/60">
                  Tarayıcının dahili yüksek çözünürlüklü medya kaydedicisi bu sahneyi ({scenario.duration} saniye) gerçek zamanlı olarak yakalayıp video dosyası olarak bilgisayarınıza indirir.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  2. HeyGen Studio Render Paketi (JSON)
                </p>
                <p className="text-[11px] text-white/60">
                  HeyGen API veya yapay zeka avatar stüdyosuna doğrudan besleyebileceğiniz zaman kodlu metin, ses ve sahne parametrelerini içeren resmi dışa aktarım dosyası.
                </p>
              </div>

              {isRecording && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                  <p className="text-xs font-bold text-emerald-300 animate-pulse">
                    Video Hazırlanıyor... (%{recordProgress})
                  </p>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${recordProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                disabled={isRecording}
                onClick={simulateDirectVideoDownload}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
              >
                JSON Spec İndir
              </button>

              <button
                disabled={isRecording}
                onClick={handleStartCapture}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRecording ? 'Kaydediliyor...' : 'Video Olarak İndir (HD)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
