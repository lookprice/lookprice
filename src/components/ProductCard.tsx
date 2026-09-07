import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getExchangeRate } from "../services/currencyService";
import { Eye, Package, Plus, Star, MapPin, Ruler, BedDouble, Car, Settings, Fuel, Home, Calendar, ArrowRight, FlaskConical, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product, Store as StoreInfo } from "../types";
import { formatTransmission, formatFuelType } from "../utils/formatUtils";
import { getLabels } from "../utils/showcase";

interface ProductCardProps {
  product: Product;
  store: StoreInfo | null;
  t: any;
  addToBasket: (p: Product) => void;
  onView: (p: Product) => void;
  primaryColor: string;
  isLuxury?: boolean;
  sector?: string;
}

const formatPrice = (price: number, currency: string, sector: string, storeType?: string) => {
  const isPortfolio = storeType === "portfolio" || storeType === "real_estate" || storeType === "motor_vehicle" || sector === "real_estate" || sector === "automotive";
  const decimals = isPortfolio ? 0 : 2;
  return `${Number(price).toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency || "TRY"}`;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  store,
  t,
  addToBasket,
  onView,
  primaryColor,
  isLuxury,
  sector = "general",
}) => {
  const { lang } = useLanguage();
  const [convertedPrice, setConvertedPrice] = useState<number>(product.price);
  const [isFlipped, setIsFlipped] = useState(false);

  // Helper function to dynamically yield recipe ratios/ingredients for any product
  const getRecipeItems = (prod: Product) => {
    let recipe = prod.recipe_items;
    if (typeof recipe === "string") {
      try {
        recipe = JSON.parse(recipe);
      } catch (e) {
        recipe = [];
      }
    }
    if (Array.isArray(recipe) && recipe.length > 0) {
      return recipe;
    }
    
    // Only return mock items for products containing "lookprice" for demonstration/testing
    const nameLower = (prod.name || "").toLowerCase();
    if (nameLower.includes("lookprice")) {
      if (nameLower.includes("coctail") || nameLower.includes("cocktail") || nameLower.includes("kokteyl")) {
        return [
          { ingredient_name: lang === 'tr' ? "Yarı Mamül X (Lookprice Özel)" : "Half-Finished X (Lookprice Special)", amount: 100, ingredient_unit: "cc" },
          { ingredient_name: lang === 'tr' ? "Yarı Mamül Y (Premium Nektar)" : "Half-Finished Y (Premium Nectar)", amount: 200, ingredient_unit: "cc" },
          { ingredient_name: lang === 'tr' ? "Yarı Mamül Z (Aromatik Esans)" : "Half-Finished Z (Aromatic Essence)", amount: 30, ingredient_unit: "cc" },
        ];
      }
      return [
        { ingredient_name: lang === 'tr' ? "Yarı Mamül (Lookprice Özel)" : "Half-Finished (Lookprice Special)", amount: 50, ingredient_unit: "g" },
        { ingredient_name: lang === 'tr' ? "Premium Aroma (Lookprice Özel)" : "Premium Flavoring", amount: 10, ingredient_unit: "ml" }
      ];
    }
    
    return [];
  };

  useEffect(() => {
    if (
      store?.currency &&
      product.currency &&
      product.currency !== store.currency
    ) {
      getExchangeRate(product.currency, store.currency).then((rate) => {
        setConvertedPrice(product.price * rate);
      });
    } else {
      setConvertedPrice(product.price);
    }
  }, [product.price, product.currency, store?.currency]);

  // Helper to get annotated image URL for Sold/Rented status
  const getAnnotatedImageUrl = (originalUrl: string) => {
    if (!product || !originalUrl) return originalUrl;
    const status = (product as any).status || product.sector_data?.status;
    const labels = getLabels(product.labels).map(l => l.toLowerCase());
    
    const isSold = status === 'sold' || labels.includes('satildi') || labels.includes('sold');
    const isRented = status === 'rented' || labels.includes('kiralandi') || labels.includes('rented');
    
    if (isSold || isRented) {
      const normalizedStatus = isSold ? 'sold' : 'rented';
      const origin = window.location.origin;
      const absoluteUrl = originalUrl.startsWith('http') ? originalUrl : `${origin}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
      return `${origin}/api/annotate-image?imageUrl=${encodeURIComponent(absoluteUrl)}&status=${normalizedStatus}`;
    }
    return originalUrl;
  };

  const pHasVars = React.useMemo(() => {
    if (product.has_variants === true || String(product.has_variants) === 'true') return true;
    let vars = product.variants;
    if (typeof vars === 'string') {
      try { vars = JSON.parse(vars); } catch (e) { vars = []; }
    }
    return Array.isArray(vars) && vars.length > 0;
  }, [product.has_variants, product.variants]);

  const isRealEstate = product.type === "real_estate" || sector === "real_estate";
  const isAutomotive = product.type === "vehicle" || sector === "automotive";

  const renderBentoRealEstate = () => (
    <div className="grid grid-cols-2 gap-2 my-4">
      {product.sector_data?.square_meters && (
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Ruler className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Net (m²)' : 'Net Area'}</span>
            <span className="text-xs font-bold text-slate-700 truncate">{product.sector_data.square_meters}</span>
          </div>
        </div>
      )}
      {product.sector_data?.rooms && (
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BedDouble className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Oda' : 'Rooms'}</span>
            <span className="text-xs font-bold text-slate-700 truncate">{product.sector_data.rooms}</span>
          </div>
        </div>
      )}
      {product.sector_data?.building_age && (
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Home className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Bina Yaşı' : 'Age'}</span>
            <span className="text-xs font-bold text-slate-700 truncate">{product.sector_data.building_age}</span>
          </div>
        </div>
      )}
      {product.sector_data?.floor && (
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Kat' : 'Floor'}</span>
            <span className="text-xs font-bold text-slate-700 truncate">{product.sector_data.floor}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderBentoAutomotive = () => (
    <div className="grid grid-cols-2 gap-2 my-4">
      {((product as any).current_mileage || (product.sector_data as any)?.current_mileage) && (
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Car className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Kilometre' : 'Mileage'}</span>
            <span className="text-xs font-bold text-slate-700 truncate">
              {Number((product as any).current_mileage || (product.sector_data as any)?.current_mileage).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
            </span>
          </div>
        </div>
      )}
      {((product as any).year || product.name.match(/^(\d{4})/)?.[1]) && (
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Yıl' : 'Year'}</span>
            <span className="text-xs font-bold text-slate-700 truncate">
              {(product as any).year || product.name.match(/^(\d{4})/)?.[1]}
            </span>
          </div>
        </div>
      )}
      {product.sector_data?.transmission && (
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Vites' : 'Trans.'}</span>
            <span className="text-xs font-bold text-slate-700 truncate">{formatTransmission(product.sector_data.transmission, lang)}</span>
          </div>
        </div>
      )}
      {(() => {
        const rawFuel = product.sector_data?.fuel_type || product.sector_data?.fuel || (product as any).fuel_type || (product as any).fuel;
        if (!rawFuel) return null;
        return (
          <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Fuel className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Yakıt' : 'Fuel'}</span>
              <span className="text-xs font-bold text-slate-700 truncate">{formatFuelType(rawFuel, lang)}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );

  return (
    <div className="w-full min-h-[460px] h-full relative" style={{ perspective: "1200px" }}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full relative"
      >
        {/* FRONT SIDE (Standard Product Card) */}
        <div 
          className={`bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group relative flex flex-col h-full w-full ${isLuxury ? "font-sans tracking-tight" : ""}`}
          style={{ 
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden"
          }}
        >
          <div className={`aspect-[4/3] bg-white relative overflow-hidden cursor-pointer flex items-center justify-center ${isRealEstate || isAutomotive ? 'p-0' : 'p-3 sm:p-4'}`} onClick={() => onView(product)}>
            {product.image_url ? (
              <img
                src={getAnnotatedImageUrl(product.image_url)}
                alt={product.name}
                className={`w-full h-full ${
                  isRealEstate || isAutomotive
                    ? "object-cover group-hover:scale-105"
                    : "object-contain mix-blend-multiply group-hover:scale-105"
                } transition-transform duration-500 ease-out`}
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package className="w-16 h-16" />
              </div>
            )}
            
            {/* Minimalist Price Overlay for Luxury/Portfolio */}
            {(isRealEstate || isAutomotive) && (
              <div className="absolute top-4 right-4 z-10 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-slate-950 shadow-sm">
                 {formatPrice(convertedPrice, store?.currency || product.currency || '', sector, store?.store_type)}
              </div>
            )}

            {/* Recipe Flip Trigger */}
            {!isRealEstate && !isAutomotive && getRecipeItems(product).length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className="absolute top-4 right-4 z-20 h-9 w-9 bg-white/90 backdrop-blur-sm hover:bg-slate-900 hover:text-white text-slate-900 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
                title={lang === "tr" ? "Reçete ve İçerik Detayları" : "Recipe & Ratios"}
              >
                <FlaskConical className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="p-6 flex flex-col flex-1 relative bg-white">
            <div className="mb-3 flex items-center justify-between">
              <span
                className="text-[10px] uppercase tracking-widest font-bold text-slate-400"
              >
                {isRealEstate && lang === "tr"
                  ? (product.category === "residence" ? "Konut" : product.category === "commercial" ? "Ticari" : product.category === "land" ? "Arsa" : (product.category || t.dashboard.uncategorized))
                  : (product.category || t.dashboard.uncategorized)}
              </span>
            </div>

            <h3
              className={`font-semibold text-slate-950 line-clamp-2 h-12 mb-3 cursor-pointer hover:text-sky-600 text-base leading-snug tracking-tight ${isLuxury ? "!font-display !font-medium" : ""}`}
              onClick={() => onView(product)}
            >
              {product.name}
            </h3>
            
            {/* Bento Grid Specs */}
            <div className="mt-auto">
                {isRealEstate ? renderBentoRealEstate() : isAutomotive ? renderBentoAutomotive() : (
                   <div className="mb-4">
                      <p className="text-sm text-slate-500 line-clamp-2">{product.description || t.dashboard.noDescription}</p>
                   </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              {!(isRealEstate || isAutomotive) && (
                  <span className={`text-lg font-bold text-slate-950`}>
                    {formatPrice(convertedPrice, store?.currency || product.currency || '', sector, store?.store_type)}
                  </span>
              )}
              <button
                onClick={() => {
                  if (isRealEstate || isAutomotive || pHasVars || (product.available_branches && product.available_branches.length > 1)) {
                    onView(product);
                  } else {
                    addToBasket(product);
                  }
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-2
                  ${isLuxury ? 'bg-amber-500 text-slate-950 hover:bg-amber-600' : 'bg-slate-950 text-white hover:bg-slate-800'}`}
              >
                {isRealEstate || isAutomotive ? (
                  <>
                    {lang === "tr" ? "İncele" : "View"}
                  </>
                ) : (
                  <>
                    {lang === "tr" ? "Sepete Ekle" : "Add to Cart"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* BACK SIDE (Secret Recipe Details Flip Card) */}
        <div 
          className="absolute inset-0 w-full h-full bg-slate-950 rounded-2xl p-6 flex flex-col justify-between text-white border border-slate-800"
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)"
          }}
        >
          {/* Back Header */}
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 text-amber-400">
                  <FlaskConical className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 leading-none">
                    {lang === "tr" ? "REÇETE / İÇERİK" : "RECIPE & RATIOS"}
                  </h4>
                  <span className="text-[8px] text-slate-400 font-bold tracking-tight">
                    {lang === "tr" ? "Lookprice Seçkin Analiz" : "Lookprice Selected Blend"}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border border-slate-800"
                title={lang === "tr" ? "Kartı Çevir" : "Flip Back"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <h3 className="font-extrabold text-white text-base leading-tight tracking-tight line-clamp-1">
              {product.name}
            </h3>
            
            <p className="text-[11px] text-slate-400 leading-relaxed italic line-clamp-2">
              {product.description || (lang === "tr" ? "Bu premium ürün için özel olarak belirlenmiş karışım oranları ve hammadde listesi." : "Special blend ratios and raw ingredient checklist carefully calibrated for this premium tier.")}
            </p>
          </div>

          {/* Recipe List with Interactive Dynamic Bars */}
          <div className="flex-1 my-4 space-y-3.5 overflow-y-auto pr-1">
            {getRecipeItems(product).map((item: any, idx: number) => {
              const totalAmount = getRecipeItems(product).reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
              const percent = totalAmount > 0 ? ((parseFloat(item.amount) || 0) / totalAmount * 100).toFixed(0) : "30";
              
              return (
                <div key={`${item.ingredient_name}-${idx}`} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-200">{item.ingredient_name}</span>
                    <span className="text-amber-400 font-mono text-[11px]">{item.amount} {item.ingredient_unit}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: isFlipped ? `${percent}%` : 0 }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full" 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Back Footer */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                {t.dashboard.price}
              </span>
              <span className="text-base font-extrabold text-amber-400">
                {formatPrice(convertedPrice, store?.currency || product.currency || '', sector, store?.store_type)}
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
                addToBasket(product);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.dashboard.addToBasket}</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
