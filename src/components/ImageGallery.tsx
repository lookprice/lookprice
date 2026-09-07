import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageGalleryProps {
  images: string[];
  onChange?: (images: string[]) => void;
  isEditable?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onChange, isEditable }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedIndex === null || images.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev !== null ? (prev - 1 + images.length) % images.length : 0));
      } else if (e.key === "Escape") {
        setSelectedIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, images.length]);

  const removeImage = (index: number) => {
    if (onChange) {
      onChange(images.filter((_, i) => i !== index));
    }
  };

  const makeCover = (index: number) => {
    if (!onChange || index === 0) return;
    const item = images[index];
    const remaining = images.filter((_, i) => i !== index);
    onChange([item, ...remaining]);
  };

  const moveLeft = (index: number) => {
    if (!onChange || index === 0) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index - 1];
    newImages[index - 1] = temp;
    onChange(newImages);
  };

  const moveRight = (index: number) => {
    if (!onChange || index === images.length - 1) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[index + 1];
    newImages[index + 1] = temp;
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {images.map((url, index) => {
          const isCover = index === 0;
          return (
            <div 
              key={`${url}-${index}`} 
              className={`relative group aspect-square rounded-2xl overflow-hidden transition-all duration-300 ${
                isCover 
                  ? 'ring-4 ring-amber-500 shadow-lg shadow-amber-500/10' 
                  : 'border border-slate-200'
              }`}
            >
              <img
                src={url}
                alt={`Gallery ${index}`}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => setSelectedIndex(index)}
              />

              {/* Cover Badge */}
              {isCover && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-[10px] font-black tracking-wider px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
                  <Star className="w-3 h-3 fill-current" />
                  VİTRİN RESMİ
                </div>
              )}

              {isEditable && (
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 pointer-events-none">
                  {/* Top Row - Actions */}
                  <div className="flex justify-between items-center w-full pointer-events-auto">
                    {/* Make Cover Button (if not already cover) */}
                    {!isCover ? (
                      <button
                        type="button"
                        onClick={() => makeCover(index)}
                        title="Vitrin Yap"
                        className="bg-white/95 hover:bg-amber-500 hover:text-white text-slate-800 p-1.5 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    ) : (
                      <div />
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      title="Sil"
                      className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Row - Reordering buttons */}
                  <div className="flex justify-center items-center gap-1.5 w-full pointer-events-auto bg-slate-950/80 backdrop-blur-xs py-1 px-2 rounded-xl">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveLeft(index)}
                      className="text-white hover:text-amber-400 disabled:opacity-40 disabled:hover:text-white p-1 transition-colors"
                      title="Sola Kaydır"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-bold text-slate-300 select-none">
                      {index + 1} / {images.length}
                    </span>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => moveRight(index)}
                      className="text-white hover:text-amber-400 disabled:opacity-40 disabled:hover:text-white p-1 transition-colors"
                      title="Sağa Kaydır"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Persistent/Tap Action Indicators */}
              {isEditable && (
                <div className="md:hidden absolute bottom-2 left-2 right-2 bg-slate-900/75 backdrop-blur-xs py-1 px-2 rounded-lg flex items-center justify-between pointer-events-auto gap-1">
                  {!isCover ? (
                    <button
                      type="button"
                      onClick={() => makeCover(index)}
                      className="text-amber-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5"
                    >
                      <Star className="w-2.5 h-2.5 fill-current" />
                      Vitrin Yap
                    </button>
                  ) : (
                    <span className="text-amber-400 font-black text-[9px] uppercase tracking-wider flex items-center gap-0.5">
                      ⭐ Kapak
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveLeft(index)}
                      className="text-white disabled:opacity-30 p-0.5"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => moveRight(index)}
                      className="text-white disabled:opacity-30 p-0.5"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-400 ml-1 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox with Multi-Image Carousel / Navigation */}
      <AnimatePresence>
        {selectedIndex !== null && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8"
            onClick={() => setSelectedIndex(null)}
          >
            {/* Top Bar inside Lightbox */}
            <div className="w-full flex justify-between items-center z-[210] pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-white text-xs font-bold tracking-wider uppercase">
                Görsel ({selectedIndex + 1} / {images.length})
              </div>
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="pointer-events-auto p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl transition-all active:scale-95 border border-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Central Viewport with Prev/Next buttons */}
            <div
              className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center px-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) =>
                      prev !== null ? (prev - 1 + images.length) % images.length : 0
                    )
                  }
                  className="absolute left-2 md:left-4 w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/85 hover:bg-slate-900 hover:scale-105 border border-white/10 text-white flex items-center justify-center shadow-2xl transition-all z-[220] cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              )}

              <motion.img
                key={selectedIndex}
                src={images[selectedIndex]}
                alt={`Lightbox ${selectedIndex}`}
                className="max-w-full max-h-[70vh] md:max-h-[82vh] object-contain select-none shadow-2xl rounded-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              />

              {images.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) =>
                      prev !== null ? (prev + 1) % images.length : 0
                    )
                  }
                  className="absolute right-2 md:right-4 w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/85 hover:bg-slate-900 hover:scale-105 border border-white/10 text-white flex items-center justify-center shadow-2xl transition-all z-[220] cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Scroller */}
            {images.length > 1 && (
              <div
                className="w-full max-w-4xl mx-auto flex gap-3.5 justify-center py-4 overflow-x-auto no-scrollbar z-[210]"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedIndex === idx
                        ? "border-amber-400 scale-110 shadow-lg"
                        : "border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

