import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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

  // Extract secondary image for hover flip
  const secondaryImage = React.useMemo(() => {
    let images: string[] = [];
    if (product.images) {
      if (typeof product.images === "string") {
        try { images = JSON.parse(product.images); } catch (e) { images = []; }
      } else if (Array.isArray(product.images)) {
        images = product.images;
      }
    }
    const filtered = images.filter(img => img && img !== product.image_url);
    if (filtered.length > 0) return filtered[0];
    if (variants.length > 1 && variants[1]?.image_url && variants[1].image_url !== product.image_url) {
      return variants[1].image_url;
    }
    return null;
  }, [product.images, product.image_url, variants]);

  // Active displayed image
  const displayImage = selectedVariant?.image_url || (isHovered && secondaryImage && themeConfig?.card_hover_effect === 'secondary_image' ? secondaryImage : product.image_url);

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 ${radiusClass} overflow-hidden shadow-xs hover:shadow-xl transition-all duration-500 cursor-pointer`}
      onClick={() => onView(product)}
    >
      {/* 1. Image Canvas & Overlay Actions */}
      <div className={`relative w-full ${aspectRatioClass} bg-slate-100 dark:bg-slate-800/50 overflow-hidden`}>
        {displayImage ? (
          <motion.img
            key={displayImage}
            src={displayImage}
            alt={product.name}
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className={`w-full h-full object-cover object-center ${
              themeConfig?.card_hover_effect === "zoom" ? "group-hover:scale-108" : "group-hover:scale-104"
            } transition-transform duration-700 ease-out`}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <Package className="w-12 h-12 stroke-[1.5]" />
          </div>
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
                <span className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">
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
                <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">
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

        {/* Hover Action Bar (Slide up from bottom of image) */}
        <div className="absolute inset-x-3 bottom-3 z-10 hidden sm:flex items-center gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(product);
            }}
            className="flex-1 py-2.5 px-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{lang === "tr" ? "Hızlı İncele" : "Quick View"}</span>
          </button>

          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleQuickAdd}
              className={`p-2.5 rounded-xl shadow-lg transition-all active:scale-95 ${
                addedAnimation
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100"
              }`}
              title={lang === "tr" ? "Hızlı Sepete Ekle" : "Quick Add"}
            >
              {addedAnimation ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* 2. Content & Typography */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white dark:bg-slate-900">
        {/* Brand or Category Tag */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
            {product.brand || product.category || (lang === "tr" ? "Koleksiyon" : "Collection")}
          </span>
          {product.brand && product.category && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {product.category}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {product.name}
        </h3>

        {/* Dynamic On-Card Color Swatches */}
        {colorSwatches.length > 0 && themeConfig?.show_swatches_on_card !== false && (
          <div className="my-2 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {colorSwatches.slice(0, 5).map((swatch, idx) => {
              const isSelected = selectedVariant?.name === swatch.variant.name;
              return (
                <button
                  key={idx}
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

          {/* Mobile Instant Add Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            className={`sm:hidden p-2.5 rounded-xl transition-all active:scale-95 ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                : addedAnimation
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
            }`}
          >
            {addedAnimation ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
