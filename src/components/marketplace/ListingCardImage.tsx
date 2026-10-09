import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Car, Home } from "lucide-react";
import { getListingIntent } from "../../utils/marketplace";

export const ListingCardImage = ({ 
  listing, 
  aspect = "aspect-[16/10]",
  className = "",
  disableCarousel = false,
  disableBadges = false,
  onImageClick,
  formatCategory = (l: any) => l.category || "İlan"
}: { 
  listing: any; 
  aspect?: string; 
  className?: string;
  disableCarousel?: boolean;
  disableBadges?: boolean;
  onImageClick?: () => void;
  formatCategory?: (l: any) => string;
}) => {
  const images = React.useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      list.push(...listing.images.filter((i: any) => typeof i === "string" && i.trim()));
    }
    if (listing.image_url && !list.includes(listing.image_url)) {
      list.unshift(listing.image_url);
    }
    return list;
  }, [listing]);

  const [currentIdx, setCurrentIdx] = useState(0);

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const intent = getListingIntent(listing);

  return (
    <div className={`bg-slate-950 overflow-hidden relative border border-slate-800/80 group/img ${aspect} ${className}`}>
      {images.length > 0 ? (
        <img
          src={images[currentIdx]}
          alt={listing.title || 'İlan görseli'}
          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 cursor-pointer"
          onClick={onImageClick}
          referrerPolicy="no-referrer"
          onError={(e: any) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"; }}
        />
      ) : (
        <div 
          onClick={onImageClick}
          className="w-full h-full flex flex-col items-center justify-center text-slate-600 cursor-pointer"
        >
          {listing.listing_type === 'vehicle' ? <Car className="w-8 h-8 opacity-30 text-rose-500" /> : <Home className="w-8 h-8 opacity-30 text-blue-500" />}
          <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">Görsel Yok</span>
        </div>
      )}

      {/* Badges Over Image (Disabled in Table / List View) */}
      {!disableBadges && (
        <>
          {/* Category Tag Badge */}
          <div className="absolute top-2 left-2 px-2.5 py-1 bg-slate-950/90 backdrop-blur-md rounded-lg text-[10px] font-black text-amber-300 border border-slate-800 pointer-events-none z-10 shadow-lg">
            {formatCategory(listing)}
          </div>

          {/* Intent Badge (Satılık / Kiralık) */}
          {listing.listing_type === 'real_estate' && (
            <div className={`absolute top-2 right-2 px-2.5 py-1 backdrop-blur-md rounded-lg text-[10px] font-black border z-10 shadow-lg pointer-events-none ${
              intent === 'kiralik'
                ? "bg-purple-950/95 text-purple-200 border-purple-500/80 ring-2 ring-purple-500/30"
                : "bg-emerald-950/95 text-emerald-200 border-emerald-500/80 ring-2 ring-emerald-500/30"
            }`}>
              {intent === 'kiralik' ? '🔑 KİRALIK' : '🏷️ SATILIK'}
            </div>
          )}
        </>
      )}

      {/* Multiple Images Chevron Nav Buttons & Indicator (Disabled in Table View Mode) */}
      {!disableCarousel && images.length > 1 && (
        <>
          <button
            onClick={prevImg}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/85 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-blue-600 hover:border-blue-400 z-20 cursor-pointer shadow-xl"
            title="Önceki Fotoğraf"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextImg}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/85 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-blue-600 hover:border-blue-400 z-20 cursor-pointer shadow-xl"
            title="Sonraki Fotoğraf"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Photo Counter Badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/90 text-white backdrop-blur-md rounded-md text-[10px] font-black border border-white/10 z-10 pointer-events-none">
            {currentIdx + 1}/{images.length}
          </div>

          {/* Dot Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none">
            {images.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIdx ? "w-3 bg-amber-400" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
