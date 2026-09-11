import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  BookOpen, 
  RotateCw, 
  Eye, 
  ShoppingBag, 
  Check, 
  Star, 
  User, 
  Building2, 
  MapPin, 
  Layers, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Info,
  Package,
  Heart
} from "lucide-react";
import { Product, Store as StoreInfo } from "../../types";
import { api } from "../../services/api";
import { getBookCoverFallbackSvg } from "../../utils/imageFallback";

interface BookCardNetflixProps {
  product: Product;
  store: StoreInfo | null;
  lang: string;
  onView: (p: Product) => void;
  addToBasket: (p: Product) => void;
  primaryColor?: string;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: number | string) => void;
}

export const BookCardNetflix: React.FC<BookCardNetflixProps> = ({
  product,
  store,
  lang,
  onView,
  addToBasket,
  primaryColor = "#ef4444",
  isWishlisted = false,
  onToggleWishlist
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [branchStocks, setBranchStocks] = useState<any[]>([]);
  const [hasLoadedStocks, setHasLoadedStocks] = useState(false);
  const isTr = lang === "tr";

  // Parse sector_data
  const sectorData = React.useMemo(() => {
    const raw = (product as any)?.sector_data;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch (e) { return {}; }
    }
    return raw || {};
  }, [product]);

  // Lazy load branch stocks on flip
  useEffect(() => {
    if (isFlipped && !hasLoadedStocks) {
      const barcode = product.barcode;
      const slug = store?.slug;
      if (barcode && slug) {
        api.get(`/api/public/stores/${slug}/products/${barcode}/branch-stock`)
          .then((res: any) => {
            if (res && res.stocks && Array.isArray(res.stocks)) {
              setBranchStocks(res.stocks);
            }
          })
          .catch(() => {})
          .finally(() => setHasLoadedStocks(true));
      }
    }
  }, [isFlipped, hasLoadedStocks, product.barcode, store?.slug]);

  const authorName = product.author || sectorData.author || "Seçkin Yazar";
  const publisherName = product.brand || sectorData.publisher || "Seçkin Yayıncılık";
  const ratingScore = sectorData.rating || "4.8";
  const synopsis = sectorData.synopsis || product.description || (isTr 
    ? "Bu değerli eser; güçlü kurgusu, akıcı üslubu ve derin karakter tahlilleriyle okurlarına unutulmaz bir edebi deneyim sunuyor." 
    : "An extraordinary masterpiece that provides an unforgettable literary experience.");
  
  const coverImage = product.image_url || "";
  const price = Number(product.price) || 0;
  const currency = product.currency || store?.currency || "TRY";
  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
    addToBasket(product);
  };

  return (
    <div 
      className="relative flex-none w-[200px] sm:w-[220px] md:w-[240px] select-none perspective-1000 py-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        // auto unflip on mouseleave for crisp UX
        if (isFlipped) setIsFlipped(false);
      }}
    >
      <motion.div
        animate={{ 
          scale: isHovered && !isFlipped ? 1.06 : 1,
          y: isHovered && !isFlipped ? -6 : 0
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="relative w-full rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer"
        onClick={() => onView(product)}
      >
        <AnimatePresence initial={false} mode="wait">
          {!isFlipped ? (
            /* FRONT COVER: Netflix Style Cinematic Book Poster */
            <motion.div
              key="front"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.28 }}
              className="flex flex-col w-full h-full"
            >
              {/* Cover Canvas 2:3 aspect ratio */}
              <div className="relative w-full aspect-[2/3] bg-slate-950 overflow-hidden flex items-center justify-center">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.fallback && coverImage && coverImage.startsWith('http') && !coverImage.includes('/api/proxy-image')) {
                        target.dataset.fallback = 'proxy';
                        target.src = `/api/proxy-image?url=${encodeURIComponent(coverImage)}`;
                      } else {
                        target.src = getBookCoverFallbackSvg(product.name, authorName);
                      }
                    }}
                  />
                ) : (
                  <img
                    src={getBookCoverFallbackSvg(product.name, authorName)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Subtle Book Spine Shadow Left */}
                <div className="absolute top-0 left-0 bottom-0 w-3.5 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />

                {/* Top Overlay Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                  <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[10px] font-black text-amber-300">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{ratingScore}</span>
                  </div>

                  {product.is_bestseller && (
                    <span className="bg-red-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {isTr ? "Çok Satan" : "Top"}
                    </span>
                  )}
                </div>

                {/* Flip Card Action Trigger Button (Bottom Right) */}
                <button
                  type="button"
                  title={isTr ? "Kitabın arkasını çevir (Özet & Yorumlar)" : "Flip to back cover"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(true);
                  }}
                  className="absolute bottom-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-red-600 text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl transition-all duration-300 hover:rotate-180 active:scale-95"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              {/* Front Info Bottom Bar */}
              <div className="p-3 bg-slate-900 flex flex-col justify-between flex-1 border-t border-slate-800/80">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white line-clamp-1 group-hover:text-red-400 transition-colors" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 line-clamp-1 mt-0.5">
                    {authorName}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-emerald-400 tracking-tight">
                      {price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleQuickAdd}
                      title={isTr ? "Sepete Ekle" : "Add to Cart"}
                      className={`p-1.5 rounded-lg transition-all active:scale-95 ${
                        addedAnimation 
                          ? "bg-emerald-600 text-white" 
                          : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20"
                      }`}
                    >
                      {addedAnimation ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* BACK COVER: Detailed Synopsis, Publisher, Branches, Quotes */
            <motion.div
              key="back"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.28 }}
              className="flex flex-col w-full h-full p-4 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200 aspect-[2/3] overflow-y-auto no-scrollbar justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Back Header */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-red-400">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {isTr ? "Arka Kapak" : "Back Cover"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFlipped(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Metadata tags */}
                <div className="mt-2 space-y-1 text-[10px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">{isTr ? "Yazar:" : "Author:"}</span>
                    <span className="font-bold text-slate-200 truncate max-w-[130px]">{authorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-500">{isTr ? "Yayınevi:" : "Publisher:"}</span>
                    <span className="font-bold text-slate-200 truncate max-w-[130px]">{publisherName}</span>
                  </div>
                  {sectorData.page_count && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500">{isTr ? "Sayfa:" : "Pages:"}</span>
                      <span className="font-bold text-slate-200">{sectorData.page_count}</span>
                    </div>
                  )}
                </div>

                {/* Synopsis */}
                <div className="mt-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                    {isTr ? "ÖZET & İÇERİK" : "SYNOPSIS"}
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-4 italic">
                    "{synopsis}"
                  </p>
                </div>

                {/* Branch Stocks Info */}
                <div className="mt-3 pt-2 border-t border-slate-800">
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                    <Package className="w-2.5 h-2.5" />
                    <span>{isTr ? "Şube Stokları" : "Branch Stocks"}</span>
                  </span>
                  {branchStocks.length > 0 ? (
                    <div className="space-y-1 max-h-16 overflow-y-auto no-scrollbar">
                      {branchStocks.map((b: any, bIdx: number) => (
                        <div key={bIdx} className="flex items-center justify-between text-[9px] bg-slate-800/80 px-2 py-1 rounded">
                          <span className="text-slate-300 truncate max-w-[110px]">{b.branch_name}</span>
                          <span className={`font-bold ${b.quantity > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {b.quantity > 0 ? `${b.quantity} Adet` : (isTr ? "Tükendi" : "Out")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500 italic">
                      {isTr ? "Tüm şubelerde mevcut" : "Available in branches"}
                    </p>
                  )}
                </div>
              </div>

              {/* Back Footer Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onView(product)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>{isTr ? "İncele" : "Details"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all"
                  title={isTr ? "Sepete Ekle" : "Add to Cart"}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
