import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isRentalListing } from "../../utils/marketplace";

export const ListingCardImage = ({ 
  listing, 
  aspect = "aspect-[16/10]", 
  className = "", 
  onImageClick, 
  disableBadges = false, 
  disableCarousel = false,
  formatCategory = (l: any) => l.category || "İlan"
}: { 
  listing: any, 
  aspect?: string, 
  className?: string, 
  onImageClick?: () => void,
  disableBadges?: boolean,
  disableCarousel?: boolean,
  formatCategory?: (l: any) => string
}) => {
  const images = Array.isArray(listing.images) && listing.images.length > 0 
    ? listing.images 
    : listing.image_url 
    ? [listing.image_url] 
    : ["/placeholder-image.jpg"];

  const [currentIdx, setCurrentIdx] = useState(0);

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const isRental = isRentalListing(listing);

  return (
    <div className={`relative overflow-hidden ${aspect} ${className}`} onClick={onImageClick}>
      <img 
        src={images[currentIdx]} 
        alt={listing.title} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />

      {!disableBadges && (
        <>
          <div className="absolute top-2 left-2 px-2.5 py-1 bg-slate-950/90 backdrop-blur-md rounded-lg text-[10px] font-black text-amber-300 border border-slate-800 pointer-events-none z-10 shadow-lg">
            {formatCategory(listing)}
          </div>
          {listing.listing_type === 'real_estate' && (
            <div className={`absolute top-2 right-2 px-2.5 py-1 backdrop-blur-md rounded-lg text-[10px] font-black border z-10 shadow-lg pointer-events-none ${
              isRental
                ? "bg-purple-950/95 text-purple-200 border-purple-500/80 ring-2 ring-purple-500/30"
                : "bg-emerald-950/95 text-emerald-200 border-emerald-500/80 ring-2 ring-emerald-500/30"
            }`}>
              {isRental ? '🔑 KİRALIK' : '🏷️ SATILIK'}
            </div>
          )}
        </>
      )}

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
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/90 text-white backdrop-blur-md rounded-md text-[10px] font-black border border-white/10 z-10 pointer-events-none">
            {currentIdx + 1}/{images.length}
          </div>
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
