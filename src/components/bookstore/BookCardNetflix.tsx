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
  Heart,
  Flame,
  Award,
  Crown,
  Clock,
  Tag
} from "lucide-react";
import { Product, Store as StoreInfo } from "../../types";
import { api } from "../../services/api";
import { getBookCoverFallbackSvg } from "../../utils/imageFallback";
import { bookstoreInteraction } from "../../services/bookstoreInteractionService";
import { BOOKSTORE_BADGES, getProductBookstoreBadges } from "../../data/bookstoreBadges";

interface BookCardNetflixProps {
  product: Product;
  store: StoreInfo | null;
  lang: string;
  onView: (p: Product) => void;
  addToBasket: (p: Product) => void;
  primaryColor?: string;
  secondaryColor?: string;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: number | string) => void;
  enableCardFlip?: boolean;
  showCardSynopsis?: boolean;
  showCardBadges?: boolean;
  showCardRating?: boolean;
  showCardQuickAdd?: boolean;
}

export const BookCardNetflix: React.FC<BookCardNetflixProps> = ({
  product,
  store,
  lang,
  onView,
  addToBasket,
  primaryColor = "#ef4444",
  secondaryColor = "#f59e0b",
  isWishlisted = false,
  onToggleWishlist,
  enableCardFlip = true,
  showCardSynopsis = true,
  showCardBadges = true,
  showCardRating = true,
  showCardQuickAdd = true
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [branchStocks, setBranchStocks] = useState<any[]>([]);
  const [hasLoadedStocks, setHasLoadedStocks] = useState(false);
  const [isFav, setIsFav] = useState<boolean>(() => bookstoreInteraction.isFavorite(product.id, store?.id));
  const isTr = lang === "tr";

  // Sync favorites state
  useEffect(() => {
    const updateFav = () => {
      setIsFav(bookstoreInteraction.isFavorite(product.id, store?.id));
    };
    window.addEventListener("bookstore-favorites-changed", updateFav);
    return () => window.removeEventListener("bookstore-favorites-changed", updateFav);
  }, [product.id, store?.id]);

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
        api.getPublicProductBranchStock(slug, barcode)
          .then((res: any) => {
            if (Array.isArray(res)) {
              setBranchStocks(res);
            } else if (res && Array.isArray(res.stocks)) {
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
  const featuredQuote = sectorData.quote || sectorData.featured_quote || (product as any).quote || (product as any).spot || (product as any).highlight;
  const synopsis = sectorData.synopsis || product.description || (isTr 
    ? "Bu değerli eser; güçlü kurgusu, akıcı üslubu ve derin karakter tahlilleriyle okurlarına unutulmaz bir edebi deneyim sunuyor." 
    : "An extraordinary masterpiece that provides an unforgettable literary experience.");
  
  const totalProductStock = Number((product as any).stock_quantity ?? (product as any).stock ?? (product as any).quantity ?? 0);
  const coverImage = product.image_url || "";
  const price = Number(product.price) || 0;
  const currency = product.currency || store?.currency || "TRY";
  const currencySymbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";

  // Extract bookstore badges
  const bookBadges = React.useMemo(() => {
    return getProductBookstoreBadges(product);
  }, [product]);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
    addToBasket(product);
  };

  return (
    <div 
      className="relative flex-none w-[200px] sm:w-[220px] md:w-[240px] select-none perspective-1000 py-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={
          isFlipped
            ? { scale: 1, y: 0, rotateY: 180 }
            : isHovered
            ? { scale: 1.03, y: -4, rotateY: 0 }
            : { scale: 1, y: 0, rotateY: 0 }
        }
        transition={
          isFlipped
            ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
            : { type: "spring", stiffness: 350, damping: 25 }
        }
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-full rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-slate-900 border border-slate-800 h-[420px] sm:h-[440px]"
      >
        {/* FRONT COVER: Netflix Style Cinematic Book Poster */}
        <div
          className={`absolute inset-0 w-full h-full flex flex-col justify-between bg-slate-900 rounded-2xl overflow-hidden cursor-pointer transition-opacity duration-300 ${
            isFlipped ? "pointer-events-none z-0 opacity-0" : "pointer-events-auto z-10 opacity-100"
          }`}
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          onClick={() => onView(product)}
        >
          {/* Cover Canvas */}
          <div className="relative w-full flex-1 min-h-0 bg-slate-950 overflow-hidden flex items-center justify-center">
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

            {/* Out of Stock Premium Styled Overlay */}
            {totalProductStock <= 0 && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-3 z-15 pointer-events-none">
                <div className="px-3 py-1.5 rounded-xl bg-red-600/90 border border-red-500/30 text-white font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-1.5 scale-95 animate-pulse">
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span>{isTr ? "TÜKENDİ" : "OUT OF STOCK"}</span>
                </div>
              </div>
            )}

            {/* Top Overlay Badges */}
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none gap-1">
              {showCardRating ? (
                <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 text-[10px] font-black text-amber-300 shrink-0">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{ratingScore}</span>
                </div>
              ) : <div />}

              {showCardBadges && (
                <div className="flex items-center gap-1 flex-wrap justify-end max-w-[70%]">
                  {bookBadges.length > 0 ? (
                    bookBadges.slice(0, 2).map((badge) => {
                      const IconComp = 
                        badge.iconName === 'Flame' ? Flame :
                        badge.iconName === 'Sparkles' ? Sparkles :
                        badge.iconName === 'Star' ? Star :
                        badge.iconName === 'Award' ? Award :
                        badge.iconName === 'Crown' ? Crown :
                        badge.iconName === 'Clock' ? Clock : Tag;
                      return (
                        <span 
                          key={`cover-badge-${badge.id}`}
                          className={`${badge.badgeBgClass} backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1`}
                        >
                          <IconComp className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[75px]">{isTr ? badge.badgeTr : badge.badgeEn}</span>
                        </span>
                      );
                    })
                  ) : product.is_bestseller ? (
                    <span className="bg-red-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm">
                      {isTr ? "Çok Satan" : "Top"}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Featured Quote / Spot Overlay on Front Cover (Sleek, non-intrusive) */}
            {featuredQuote && (
              <div className="absolute bottom-2.5 left-2.5 right-12 z-10 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/15 text-[10px] text-white/95 italic font-medium line-clamp-2 pointer-events-none shadow-lg">
                <span className="text-red-400 font-bold mr-1">&ldquo;</span>
                {featuredQuote}
                <span className="text-red-400 font-bold ml-1">&rdquo;</span>
              </div>
            )}

            {/* Flip Card Action Trigger Badge & Button (Bottom Right) */}
            {enableCardFlip && (
              <button
                type="button"
                title={isTr ? "Kitabın arkasını çevir (Arka Kapak Yazısı & Özet)" : "Flip to back cover (Synopsis & Details)"}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 bg-gradient-to-r from-red-600 via-amber-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white text-[9.5px] font-black rounded-full flex items-center gap-1.5 backdrop-blur-md border border-white/40 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
              >
                <Sparkles className="w-3 h-3 text-amber-200" />
                <span>{isTr ? "Arka Kapak 🔄" : "Back Cover 🔄"}</span>
              </button>
            )}
          </div>

          {/* Front Info Bottom Bar */}
          <div className="p-3 bg-slate-900 flex flex-col justify-between shrink-0 border-t border-slate-800/80">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    bookstoreInteraction.toggleFavorite(product.id, store?.id);
                  }}
                  title={isFav ? (isTr ? "Favorilerden Çıkar" : "Remove Favorite") : (isTr ? "Favorilere Ekle" : "Add to Favorites")}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-500 transition-all active:scale-95 cursor-pointer"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>

                <button
                  type="button"
                  disabled={totalProductStock <= 0}
                  onClick={handleQuickAdd}
                  title={totalProductStock <= 0 ? (isTr ? "Tükendi" : "Out of Stock") : (isTr ? "Sepete Ekle" : "Add to Cart")}
                  className={`p-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                    totalProductStock <= 0
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-40"
                      : addedAnimation 
                        ? "bg-emerald-600 text-white" 
                        : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20"
                  }`}
                >
                  {totalProductStock <= 0 ? (
                    <Package className="w-3.5 h-3.5" />
                  ) : addedAnimation ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACK COVER: Detailed Synopsis, Publisher, Branches (Always rendered upright with rotateY(180deg)) */}
        <div
          className={`absolute inset-0 w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200 rounded-2xl overflow-y-auto no-scrollbar border border-slate-800 transition-opacity duration-300 ${
            isFlipped ? "pointer-events-auto z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
          }`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Back Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-red-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {isTr ? "Arka Kapak & Özet" : "Back Cover & Synopsis"}
                </span>
              </div>
              <button
                type="button"
                title={isTr ? "Ön yüze dön" : "Flip to front"}
                onClick={() => setIsFlipped(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badges / Rozetler */}
            {bookBadges.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {bookBadges.map((badge) => {
                  const IconComp = 
                    badge.iconName === 'Flame' ? Flame :
                    badge.iconName === 'Sparkles' ? Sparkles :
                    badge.iconName === 'Star' ? Star :
                    badge.iconName === 'Award' ? Award :
                    badge.iconName === 'Crown' ? Crown :
                    badge.iconName === 'Clock' ? Clock : Tag;
                  return (
                    <span 
                      key={`back-badge-${badge.id}`}
                      className={`${badge.badgeBgClass} text-white px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1`}
                    >
                      <IconComp className="w-2.5 h-2.5 shrink-0" />
                      <span>{isTr ? badge.badgeTr : badge.badgeEn}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Metadata tags: Publisher & Pages & Year */}
            <div className="space-y-1 text-[10px] text-slate-400">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">{isTr ? "Yayınevi:" : "Publisher:"}</span>
                <span className="font-bold text-slate-200 truncate max-w-[140px]">{publisherName}</span>
              </div>
              {sectorData.page_count && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">{isTr ? "Sayfa:" : "Pages:"}</span>
                  <span className="font-bold text-slate-200">{sectorData.page_count}</span>
                </div>
              )}
              {sectorData.publication_year && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">{isTr ? "Basım Yılı:" : "Year:"}</span>
                  <span className="font-bold text-slate-200">{sectorData.publication_year}</span>
                </div>
              )}
            </div>

            {/* Synopsis - Full Text with proper line spacing */}
            {showCardSynopsis && (
              <div className="pt-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                  {isTr ? "ÖZET & İÇERİK" : "SYNOPSIS"}
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed italic line-clamp-6">
                  &ldquo;{synopsis}&rdquo;
                </p>
              </div>
            )}

            {/* Branch Stocks Info */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                <Package className="w-2.5 h-2.5" />
                <span>{isTr ? "Şube Stokları" : "Branch Stocks"}</span>
              </span>
              {branchStocks.length > 0 ? (
                <div className="space-y-1 max-h-16 overflow-y-auto no-scrollbar">
                  {branchStocks.map((b: any, bIdx: number) => {
                    const effectiveQty = Number(b.stock ?? b.quantity ?? 0);
                    return (
                      <div key={bIdx} className="flex items-center justify-between text-[9px] bg-slate-800/80 px-2 py-1 rounded">
                        <span className="text-slate-300 truncate max-w-[110px]">{b.branch_name}</span>
                        <span className={`font-bold ${effectiveQty > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {effectiveQty > 0 ? `${effectiveQty} Adet` : (isTr ? "Tükendi" : "Out of Stock")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold">
                  {totalProductStock > 0 
                    ? (isTr ? `Genel Stok: ${totalProductStock} Adet` : `In Stock: ${totalProductStock}`)
                    : (isTr ? "Tükendi" : "Out of Stock")}
                </p>
              )}
            </div>
          </div>

          {/* Back Footer Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onView(product)}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>{isTr ? "İncele" : "Details"}</span>
            </button>
            {showCardQuickAdd && (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all cursor-pointer"
                title={isTr ? "Sepete Ekle" : "Add to Cart"}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
