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
  Mic, 
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
  hideHeaderChips?: boolean;
  allowAdminTools?: boolean;
}

export function HyperFramesPlayer({
  initialScenarioId = 'book_nav',
  lang = 'tr',
  className = '',
  onClose,
  hideHeaderChips = true,
  allowAdminTools = false
}: HyperFramesPlayerProps) {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(initialScenarioId);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const lastStepIndexRef = useRef<number>(-1);

  // Sync with initial scenario changes from parent tabs
  useEffect(() => {
    if (initialScenarioId && initialScenarioId !== activeScenarioId) {
      setActiveScenarioId(initialScenarioId);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [initialScenarioId]);

  // Find active scenario data
  const scenario: HyperFrameScenario = useMemo(() => {
    return HYPERFRAME_SCENARIOS.find(s => s.id === activeScenarioId) || HYPERFRAME_SCENARIOS[0];
  }, [activeScenarioId]);

  // Current active step calculation
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
          return 0; // Loop back
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
      {/* Top Header Bar - Minimalist, single line, no ugly scrollbar */}
      <div className="px-4 py-2 bg-[#090c16]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-[10px] font-black text-purple-200 uppercase tracking-wider shrink-0 shadow-sm">
            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
            <span>LookPrice Canlı Simülasyon</span>
          </div>

          <span className="text-xs font-bold text-white/90 truncate">
            {getLocalized(scenario.title)}
          </span>
        </div>

        {/* Action / Close if provided */}
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Video Screen Canvas with Animated Cursor */}
      <div 
        ref={screenRef}
        data-video-screen="true"
        className="relative flex-1 w-full min-h-[320px] sm:min-h-[440px] md:min-h-[500px] bg-black overflow-hidden flex items-center justify-center select-none"
      >
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

        {/* Sync Subtitles (Narration) Banner */}
        <div className="absolute bottom-3 left-4 right-4 z-30 pointer-events-none flex justify-center">
          <div className="max-w-2xl w-full px-3.5 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 text-white shadow-2xl flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center shrink-0">
              <Mic className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 block leading-none mb-0.5">
                Sesli Anlatım • {currentStep.title} ({formatTime(currentTime)} / {formatTime(scenario.duration)})
              </span>
              <p className="text-xs font-semibold text-white/95 leading-snug line-clamp-2">
                {getLocalized(currentStep.narration)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="p-3 bg-[#090c16]/95 backdrop-blur-md border-t border-white/10 flex flex-col gap-2.5 z-30">
        {/* Step Chapters Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
          {scenario.steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isPassed = idx < currentStepIndex;
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
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-white transition-all cursor-pointer"
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
    </div>
  );
}
