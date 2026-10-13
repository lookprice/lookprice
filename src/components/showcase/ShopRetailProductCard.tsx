import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Eye, 
  ShoppingBag, 
  Check, 
  Heart, 
  Sparkles,
  Package
} from "lucide-react";
import { Product, Store as StoreInfo } from "../../types";
import { ShopThemeConfig } from "../../utils/shopThemePresets";
import { getExchangeRate } from "../../services/currencyService";
import { getLabels } from "../../utils/showcase";
import { getProductFallbackSvg } from "../../utils/imageFallback";
import { normalizeImageUrl } from "../../utils/imageUtils";

interface ShopRetailProductCardProps {
  product: Product;
  store: StoreInfo | null;
  themeConfig?: ShopThemeConfig;
  t: any;
  lang: string;
  onView: (p: Product) => void;
  addToBasket: (p: Product & { selectedVariant?: any; selected_variant_name?: string; selected_variant_id?: any }) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (id: number | string) => void;
}

export const ShopRetailProductCard: React.FC<ShopRetailProductCardProps> = ({
  product,
  store,
  themeConfig,
  t,
  lang,
  onView,
  addToBasket,
  isWishlisted = false,
  onToggleWishlist
}) => {
  const [convertedPrice, setConvertedPrice] = useState<number>(Number(product.price) || 0);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Extract variants safely
  const variants = React.useMemo(() => {
    let list: any[] = [];
    if (product.variants) {
      if (typeof product.variants === "string") {
        try { list = JSON.parse(product.variants); } catch (e) { list = []; }
      } else if (Array.isArray(product.variants)) {
        list = product.variants;
      }
    }
    return list;
  }, [product.variants]);

  // Extract unique color swatches from variants
  const colorSwatches = React.useMemo(() => {
    const map = new Map<string, any>();
    variants.forEach((v: any) => {
      let colorName = v.color_name || (v.attributes ? (v.attributes['Renk'] || v.attributes['Color'] || v.attributes['Kordon Rengi'] || v.attributes['Kadran']) : undefined);
      if (!colorName && v.name && v.name.includes("-")) {
        colorName = v.name.split("-")[0].trim();
      }
      if (colorName && !map.has(colorName)) {
        map.set(colorName, {
          name: colorName,
          colorCode: v.color_code,
          imageUrl: v.image_url || product.image_url,
          variant: v
        });
      }
    });
    return Array.from(map.values());
  }, [variants, product.image_url]);

  // Extract full gallery images list (main image + extra images + variant images)
  const galleryImages = React.useMemo(() => {
    const list: string[] = [];
    const pushImg = (raw?: string) => {
      if (!raw || typeof raw !== "string") return;
      const trimmed = raw.trim();
      if (trimmed && !list.includes(trimmed)) list.push(trimmed);
    };
    pushImg(product.image_url);
    if (product.images) {
      let parsed: any = product.images;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch { parsed = []; }
      }
      if (Array.isArray(parsed)) {
        parsed.forEach(img => pushImg(img));
      }
    }
    variants.forEach((v: any) => pushImg(v?.image_url));
    return list;
  }, [product.image_url, product.images, variants]);

  const [cardImgIdx, setCardImgIdx] = useState(0);

  useEffect(() => {
    setCardImgIdx(0);
  }, [product.id]);

  // Active displayed image
  const rawDisplayImage = selectedVariant?.image_url || (
    galleryImages.length > 1
      ? (cardImgIdx > 0 ? galleryImages[cardImgIdx] : (isHovered && themeConfig?.card_hover_effect === 'secondary_image' ? galleryImages[1] : galleryImages[0]))
      : product.image_url
  );
  const displayImage = normalizeImageUrl(rawDisplayImage);

  // Active price (takes variant price if available)
  const activePrice = selectedVariant && selectedVariant.price && Number(selectedVariant.price) > 0
    ? Number(selectedVariant.price)
    : convertedPrice;

  // Currency rate conversion
  useEffect(() => {
    if (store?.currency && product.currency && product.currency !== store.currency) {
      getExchangeRate(product.currency, store.currency).then((rate) => {
        setConvertedPrice((Number(product.price) || 0) * rate);
      });
    } else {
      setConvertedPrice(Number(product.price) || 0);
    }
  }, [product.price, product.currency, store?.currency]);

  // Labels & Badges
  const labels = React.useMemo(() => {
    return getLabels(product.labels);
  }, [product.labels]);

  const isOutOfStock = selectedVariant 
    ? (selectedVariant.stock_quantity !== undefined && Number(selectedVariant.stock_quantity) <= 0)
    : (product.stock_quantity !== undefined && Number(product.stock_quantity) <= 0);

  const isBestseller = product.is_bestseller || labels.some((l: string) => l.toLowerCase().includes("bestseller") || l.toLowerCase().includes("çoksatan"));
  const isNew = labels.some((l: string) => l.toLowerCase().includes("yeni") || l.toLowerCase().includes("new"));
  const discountLabel = labels.find((l: string) => l.includes("%") || l.toLowerCase().includes("indirim"));

  // Card Aspect Ratio class
  const aspectRatioClass = themeConfig?.card_aspect_ratio === "square" 
    ? "aspect-square" 
    : themeConfig?.card_aspect_ratio === "wide" 
    ? "aspect-[16/10]" 
    : "aspect-[4/5]";

  // Card Corner Radius
  const radiusClass = themeConfig?.card_radius === "none"
    ? "rounded-none"
    : themeConfig?.card_radius === "subtle"
    ? "rounded-xl"
    : themeConfig?.card_radius === "pill"
    ? "rounded-3xl"
    : "rounded-2xl";

  // Card Style Variants
  const cardStyleClass = React.useMemo(() => {
    const style = themeConfig?.card_style || "minimal";
    switch (style) {
      case "borderless":
        return "bg-slate-50/70 dark:bg-slate-900/60 border-0 shadow-none hover:shadow-md hover:bg-white dark:hover:bg-slate-900";
      case "elevated":
        return "bg-white dark:bg-slate-900 border-0 shadow-md hover:shadow-2xl hover:-translate-y-1";
      case "glass":
        return "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-xs hover:shadow-xl";
      case "neo":
        return "bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]";
      case "minimal":
      default:
        return "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-xl";
    }
  }, [themeConfig?.card_style]);

  // Glow effect on hover
  const glowHoverClass = themeConfig?.card_hover_effect === "glow" ? "hover:ring-2 hover:ring-indigo-500/50" : "";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);

    addToBasket({
      ...product,
      price: activePrice,
      selectedVariant: selectedVariant || (variants.length > 0 ? variants[0] : null),
      selected_variant_name: selectedVariant ? selectedVariant.name : (variants.length > 0 ? variants[0].name : undefined),
      selected_variant_id: selectedVariant ? selectedVariant.id : (variants.length > 0 ? variants[0].id : undefined)
    });
  };

  const currencySymbol = store?.currency || product.currency || "TRY";
  const primaryColor = themeConfig?.primary_color || "#0f172a";
  const accentColor = themeConfig?.accent_color || "#e11d48";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col ${cardStyleClass} ${radiusClass} ${glowHoverClass} overflow-hidden transition-all duration-500 cursor-pointer`}
      onClick={() => onView(product)}
    >
      {/* 1. Image Canvas & Overlay Actions - Strictly bounded frame */}
      <div className={`relative w-full ${aspectRatioClass} bg-white dark:bg-slate-900/50 overflow-hidden flex items-center justify-center p-2.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80`}>
        {displayImage ? (
          <motion.img
            key={displayImage}
            src={displayImage}
            alt={product.name}
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            drag={galleryImages.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset }) => {
              if (galleryImages.length <= 1) return;
              e.stopPropagation();
              if (offset.x < -35) {
                setSelectedVariant(null);
                setCardImgIdx((prev) => (prev + 1) % galleryImages.length);
              } else if (offset.x > 35) {
                setSelectedVariant(null);
                setCardImgIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }
            }}
            className="w-full h-full max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal select-none touch-pan-y transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.fallback && displayImage && displayImage.startsWith('http') && !displayImage.includes('/api/proxy-image')) {
                target.dataset.fallback = 'proxy';
                target.src = `/api/proxy-image?url=${encodeURIComponent(displayImage)}`;
              } else {
                target.src = getProductFallbackSvg(product.name, product.category);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <Package className="w-12 h-12 stroke-[1.5]" />
          </div>
        )}

        {/* Multi-Image Navigation Dots & Subtle Prev/Next Controls */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVariant(null);
                setCardImgIdx((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }}
              aria-label="Önceki görsel"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900/65 hover:bg-slate-900 text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVariant(null);
                setCardImgIdx((prev) => (prev + 1) % galleryImages.length);
              }}
              aria-label="Sonraki görsel"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900/65 hover:bg-slate-900 text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-slate-900/55 backdrop-blur-xs px-2 py-0.5 rounded-full"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.slice(0, 6).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariant(null);
                    setCardImgIdx(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    cardImgIdx === idx ? "w-3.5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">
              {lang === "tr" ? "Tükendi" : "Sold Out"}
            </span>
          ) : (
            <>
              {isNew && (
                <span
                  style={{ backgroundColor: accentColor }}
                  className="px-2.5 py-1 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm"
                >
                  {lang === "tr" ? "Yeni" : "New"}
                </span>
              )}
              {isBestseller && (
                <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {lang === "tr" ? "Çok Satan" : "Top Seller"}
                </span>
              )}
              {discountLabel && (
                <span
                  style={{ backgroundColor: accentColor }}
                  className="px-2.5 py-1 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm"
                >
                  {discountLabel}
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
              isWishlisted
                ? "bg-rose-50 text-rose-600 shadow-md"
                : "bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-600" : ""}`} />
          </button>
        )}

        {/* Hover Action Bar */}
        {themeConfig?.show_quick_view !== false && (
          <div className="absolute inset-x-3 bottom-7 z-10 hidden sm:flex items-center gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onView(product);
              }}
              className="w-full py-2 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{lang === "tr" ? "Hızlı İncele" : "Quick View"}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Content & Typography */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white dark:bg-slate-900">
        {/* Brand or Category Tag */}
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">
            {product.brand || product.sub_category || product.category || (lang === "tr" ? "Ürün" : "Product")}
          </span>
          {product.brand && (product.sub_category || product.category) && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
              {product.sub_category || product.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-2 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.name}
        </h3>

        {/* Color Swatches */}
        {colorSwatches.length > 0 && themeConfig?.show_swatches_on_card !== false && (
          <div className="my-2 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {colorSwatches.slice(0, 5).map((swatch, idx) => {
              const isSelected = selectedVariant?.name === swatch.variant.name;
              return (
                <button
                  key={`swatch-${product.id}-${swatch.variant?.id || swatch.name || idx}-${idx}`}
                  type="button"
                  onClick={() => setSelectedVariant(isSelected ? null : swatch.variant)}
                  onMouseEnter={() => setSelectedVariant(swatch.variant)}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "ring-2 ring-indigo-600 ring-offset-1 scale-110 border-white"
                      : "border-slate-300 dark:border-slate-700 hover:scale-110"
                  }`}
                  title={swatch.name}
                >
                  {swatch.colorCode ? (
                    <span className="w-full h-full rounded-full" style={{ backgroundColor: swatch.colorCode }} />
                  ) : (
                    <span className="w-full h-full rounded-full bg-slate-400 text-[8px] flex items-center justify-center font-bold text-white uppercase">
                      {swatch.name.slice(0, 1)}
                    </span>
                  )}
                </button>
              );
            })}
            {colorSwatches.length > 5 && (
              <span className="text-[10px] font-bold text-slate-400 pl-0.5">
                +{colorSwatches.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Active Variant Hint */}
        {selectedVariant && (
          <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1 truncate">
            {selectedVariant.name}
          </div>
        )}

        {/* Price & Mobile Add To Cart */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {activePrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
            </span>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            style={{
              backgroundColor: isOutOfStock ? undefined : addedAnimation ? "#059669" : primaryColor,
              color: isOutOfStock ? undefined : "#ffffff"
            }}
            className={`p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                : ""
            }`}
          >
            {addedAnimation ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
