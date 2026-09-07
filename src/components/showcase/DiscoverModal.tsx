import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Eye } from 'lucide-react';
import { Product } from '../../types';

interface DiscoverModalProps {
  products: Product[];
  onClose: () => void;
  onViewProduct: (product: Product) => void;
  lang: string;
}

export const DiscoverModal: React.FC<DiscoverModalProps> = ({
  products,
  onClose,
  onViewProduct,
  lang
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (products.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [products]);

  if (products.length === 0) return null;

  const currentProduct = products[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <img
          src={
            currentProduct.image_url ||
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
          }
          alt={currentProduct.name}
          className="w-full h-full object-cover opacity-60 blur-sm scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
      </div>

      <div className="relative z-10 w-full max-w-md h-full sm:h-[85vh] sm:rounded-3xl overflow-hidden bg-black flex flex-col shadow-2xl">
        {/* Progress Bars */}
        <div className="flex gap-1 p-4 absolute top-0 left-0 right-0 z-30">
          {products.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? "100%"
                      : idx === currentIndex
                        ? "100%"
                        : "0%",
                  transitionDuration: idx === currentIndex ? "4000ms" : "0ms",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-white text-sm font-semibold tracking-wide drop-shadow-md">
              {lang === "tr" ? "Keşfet" : "Discover"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Click Areas */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer"
          onClick={handleNext}
        />

        {/* Image */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentProduct.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              src={
                currentProduct.image_url ||
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
              }
              className="absolute inset-0 w-full h-full object-contain bg-black/20"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-2 block drop-shadow-md">
              {currentProduct.category ||
                (lang === "tr" ? "YENİ ÜRÜN" : "NEW ARRIVAL")}
            </span>
            <h2 className="text-white text-3xl font-bold leading-tight mb-2 drop-shadow-lg max-w-[90%]">
              {currentProduct.name}
            </h2>
            <p className="text-white/80 text-sm line-clamp-2 mb-6 drop-shadow-md">
              {currentProduct.description || ""}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  onViewProduct(currentProduct);
                }}
                className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-sm hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {lang === "tr" ? "Ürünü İncele" : "View Product"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
