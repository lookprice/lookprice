import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getExchangeRate } from "../services/currencyService";
import { Eye, Package, Plus, Star, MapPin, Ruler, BedDouble, Car, Settings, Fuel, Home, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product, Store as StoreInfo } from "../types";

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

const getLabels = (labels: any): string[] => {
  if (Array.isArray(labels)) return labels;
  if (typeof labels === "string") {
    try {
      const parsed = JSON.parse(labels);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

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
            <span className="text-xs font-bold text-slate-700 truncate">{product.sector_data.transmission}</span>
          </div>
        </div>
      )}
      {product.sector_data?.fuel_type && (
        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Fuel className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'tr' ? 'Yakıt' : 'Fuel'}</span>
            <span className="text-xs font-bold text-slate-700 truncate">{product.sector_data.fuel_type}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border ${isLuxury ? "border-amber-200/50" : "border-gray-100"} overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 group relative flex flex-col h-full ${isLuxury ? "font-sans tracking-tight" : ""}`}
    >
      <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden cursor-pointer" onClick={() => onView(product)}>
        {product.image_url ? (
          <img
            src={getAnnotatedImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package className="w-16 h-16" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Product Labels */}
        {getLabels(product.labels).length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {getLabels(product.labels).map((label, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[10px] font-black tracking-widest uppercase rounded shadow-lg"
                style={{ color: primaryColor }}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-1 relative bg-white">
        {/* Luxury Gold Trim */}
        {isLuxury && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 opacity-50" />}

        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span
              className="text-[10px] uppercase tracking-widest font-black"
              style={{ color: isLuxury ? '#d97706' : primaryColor }}
            >
              {isRealEstate && lang === "tr"
                ? (product.category === "residence" ? "Konut" : product.category === "commercial" ? "Ticari" : product.category === "land" ? "Arsa" : (product.category || t.dashboard.uncategorized))
                : (product.category || t.dashboard.uncategorized)}
            </span>
          </div>
        </div>

        <h3
          className={`font-semibold text-slate-900 line-clamp-2 h-12 mb-1 transition-colors cursor-pointer hover:text-indigo-600 text-base leading-snug tracking-tight ${isLuxury ? "!font-display !font-medium" : ""}`}
          onClick={() => onView(product)}
        >
          {product.name}
        </h3>
        
        {product.branch_name && product.branch_name !== store?.name && (
          <div className="flex items-center gap-1.5 text-slate-400 mt-1 mb-2">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-bold tracking-tight">
              {product.branch_name}
            </span>
          </div>
        )}

        {isRealEstate ? renderBentoRealEstate() : isAutomotive ? renderBentoAutomotive() : (
           <div className="flex-1 my-4">
              <p className="text-sm text-slate-500 line-clamp-3">{product.description || t.dashboard.noDescription}</p>
           </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              {isRealEstate || isAutomotive ? (lang === 'tr' ? 'Fiyat' : 'Price') : t.dashboard.price}
            </span>
            <span className={`text-lg font-bold text-slate-900 ${isLuxury ? 'font-display' : ''}`}>
              {formatPrice(convertedPrice, store?.currency || product.currency || '', sector, store?.store_type)}
            </span>
          </div>
          <button
            onClick={() => {
              if (isRealEstate || isAutomotive || (product.available_branches && product.available_branches.length > 1)) {
                onView(product);
              } else {
                addToBasket(product);
              }
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2
              ${isLuxury ? 'bg-slate-900 text-amber-400 hover:bg-slate-800' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {isRealEstate || isAutomotive ? (
              <>
                {lang === "tr" ? "İncele" : "View"} <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {product.available_branches && product.available_branches.length > 1
                  ? lang === "tr" ? "Seçenekler" : "Options"
                  : t.dashboard.addToBasket}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
