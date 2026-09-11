import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Product, Store as StoreInfo } from "../../types";
import { BookCardNetflix } from "./BookCardNetflix";

interface NetflixBookRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  products: Product[];
  store: StoreInfo | null;
  lang: string;
  onViewProduct: (p: Product) => void;
  addToBasket: (p: Product) => void;
  primaryColor?: string;
}

export const NetflixBookRow: React.FC<NetflixBookRowProps> = ({
  title,
  subtitle,
  badge,
  products,
  store,
  lang,
  onViewProduct,
  addToBasket,
  primaryColor = "#ef4444"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.75;
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="relative my-8 group/row">
      {/* Row Header */}
      <div className="flex items-end justify-between px-4 sm:px-8 md:px-12 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{title}</span>
              {badge && (
                <span className="px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-black uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Desktop Navigation Chevrons in Header */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center transition-all ${
              canScrollLeft 
                ? "bg-slate-900/80 hover:bg-slate-800 text-white cursor-pointer" 
                : "bg-slate-950 text-slate-600 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center transition-all ${
              canScrollRight 
                ? "bg-slate-900/80 hover:bg-slate-800 text-white cursor-pointer" 
                : "bg-slate-950 text-slate-600 cursor-not-allowed opacity-50"
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Side Scroll Arrow Buttons (Netflix Style on Hover) */}
      <button
        type="button"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Scroll Left"
        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 left-2 z-30 w-11 h-28 rounded-r-xl bg-black/70 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover/row:opacity-100 cursor-pointer shadow-2xl ${
          !canScrollLeft ? "pointer-events-none !opacity-0" : ""
        }`}
      >
        <ChevronLeft className="w-7 h-7" />
      </button>

      <button
        type="button"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Scroll Right"
        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 right-2 z-30 w-11 h-28 rounded-l-xl bg-black/70 hover:bg-black/90 text-white items-center justify-center backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover/row:opacity-100 cursor-pointer shadow-2xl ${
          !canScrollRight ? "pointer-events-none !opacity-0" : ""
        }`}
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Carousel Track (Peek-a-boo: next card visible partially at the right edge) */}
      <div
        ref={containerRef}
        onScroll={checkScroll}
        className="flex items-stretch gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-8 md:px-12 pr-12 sm:pr-16"
      >
        {products.map((product) => (
          <BookCardNetflix
            key={`netflix-book-${product.id}-${product.barcode || ""}`}
            product={product}
            store={store}
            lang={lang}
            onView={onViewProduct}
            addToBasket={addToBasket}
            primaryColor={primaryColor}
          />
        ))}
      </div>
    </div>
  );
};
