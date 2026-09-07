import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";

interface StoryItem {
  id: string;
  title: string;
  image_url: string;
  video_url?: string;
  badge?: string;
  link?: string;
}

interface ShopStoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: StoryItem[];
  initialIndex?: number;
  onSelectStoryLink?: (link: string) => void;
}

export const ShopStoryViewerModal: React.FC<ShopStoryViewerModalProps> = ({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
  onSelectStoryLink
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  // Story progress timer
  useEffect(() => {
    if (!isOpen || stories.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, stories.length, onClose]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex] || stories[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setProgress(0);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 select-none">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Nav Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-6 z-20 hidden sm:flex items-center justify-center p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < stories.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-6 z-20 hidden sm:flex items-center justify-center p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* 9:16 Vertical Story Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm aspect-[9/16] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bars at top */}
          <div className="absolute top-4 inset-x-4 z-30 flex items-center gap-1.5">
            {stories.map((s, idx) => (
              <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: idx < currentIndex ? "100%" : idx === currentIndex ? `${progress}%` : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Story Background Visual / Video */}
          <div className="absolute inset-0 z-0">
            {currentStory.video_url ? (
              <video
                src={currentStory.video_url}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentStory.image_url}
                alt={currentStory.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />
          </div>

          {/* Top Info Bar */}
          <div className="relative z-20 pt-8 px-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-xs font-black text-white uppercase tracking-widest drop-shadow-md">
                {currentStory.badge || "LOOKPRICE EXCLUSIVE"}
              </span>
            </div>
          </div>

          {/* Bottom Title & Action */}
          <div className="relative z-20 p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
                {currentStory.title}
              </h3>
            </div>

            {currentStory.link && (
              <button
                type="button"
                onClick={() => {
                  if (onSelectStoryLink) onSelectStoryLink(currentStory.link!);
                  onClose();
                }}
                className="w-full py-3.5 bg-white text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <span>İncele & Satın Al</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
