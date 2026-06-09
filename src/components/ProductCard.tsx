import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { getExchangeRate } from "../services/currencyService";
import { Eye, Package, Plus, Star, MapPin } from "lucide-react";
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
  const isPortfolio = storeType === "portfolio" || sector === "real_estate" || sector === "automotive";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-700 group relative flex flex-col h-full ${isLuxury ? "font-sans tracking-tight" : ""}`}
    >
      <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-contain p-4 bg-white group-hover:scale-105 transition-transform duration-1000"
            referrerPolicy="no-referrer"
            loading="lazy"
            onClick={() => onView(product)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-gray-200"
            onClick={() => onView(product)}
          >
            <Package className="w-16 h-16" />
          </div>
        )}

        {/* Sector Specific Mini Specs */}
        {product.sector_data && (
          <div className="absolute top-24 left-4 flex flex-col gap-1 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
            {(sector === "automotive" || product.type === "vehicle") &&
              product.sector_data.hp && (
                <span className="px-2 py-1 bg-black/80 text-white text-[8px] font-semibold rounded backdrop-blur-sm border border-white/10 tracking-wide">
                  {product.sector_data.hp} HP
                </span>
              )}
            {sector === "tech" && product.sector_data.ram && (
              <span className="px-2 py-1 bg-indigo-600/80 text-white text-[8px] font-semibold rounded backdrop-blur-sm border border-indigo-500/20 tracking-wide">
                {product.sector_data.ram} RAM
              </span>
            )}
            {product.type === "real_estate" &&
              product.sector_data.square_meters && (
                <span className="px-2 py-1 bg-emerald-600/80 text-white text-[8px] font-semibold rounded backdrop-blur-sm border border-emerald-500/20 tracking-wide">
                  {product.sector_data.square_meters} m²
                </span>
              )}
          </div>
        )}

        {/* Product Labels */}
        {getLabels(product.labels).length > 0 && (
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
            {getLabels(product.labels).map((label, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-semibold tracking-wide rounded-lg shadow-sm"
                style={{ color: primaryColor }}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
          <button
            onClick={() => {
              if (
                product.type === "vehicle" ||
                product.type === "real_estate" ||
                (product.available_branches &&
                  product.available_branches.length > 1)
              ) {
                onView(product);
              } else {
                addToBasket(product);
              }
            }}
            className="w-full py-3.5 bg-white text-gray-900 rounded-2xl font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95"
          >
            {product.type === "vehicle" || product.type === "real_estate" ? (
              <>
                <Eye className="w-4 h-4" />{" "}
                {lang === "tr" ? "Detayları İncele" : "View Details"}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />{" "}
                {product.available_branches &&
                product.available_branches.length > 1
                  ? lang === "tr"
                    ? "Seçenekleri Gör"
                    : "View Options"
                  : t.dashboard.addToBasket}
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span
              className="text-[10px] uppercase tracking-[0.15em] font-semibold"
              style={{ color: primaryColor }}
            >
              {product.type === "real_estate" && lang === "tr"
                ? (product.category === "residence" ? "Konut" : product.category === "commercial" ? "Ticari" : product.category === "land" ? "Arsa" : (product.category || t.dashboard.uncategorized))
                : (product.category || t.dashboard.uncategorized)}
            </span>
            {product.brand && (
              <span className="text-[9px] font-bold text-gray-400 tracking-normal">
                {product.brand}
              </span>
            )}
            {product.branch_name && product.branch_name !== store?.name && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2 h-2 text-gray-400" />
                <span className="text-[9px] font-bold text-gray-500 tracking-tight">
                  {product.available_branches &&
                  product.available_branches.length > 1
                    ? lang === "tr"
                      ? `${product.available_branches.length} Şubede Mevcut`
                      : `Available in ${product.available_branches.length} Branches`
                    : product.branch_name}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-bold text-gray-400">4.8</span>
          </div>
        </div>

        <h3
          className={`font-semibold text-slate-800 line-clamp-2 h-11 mb-3 transition-colors cursor-pointer hover:text-indigo-600 text-[14px] leading-snug tracking-tight ${isLuxury ? "!font-sans !font-medium text-gray-800" : ""}`}
          onClick={() => onView(product)}
        >
          {product.name}
        </h3>

        {/* Portfolio Card Spec Sheet Row & Grid */}
        {product.type === "real_estate" && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 my-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-[10px] font-medium text-slate-600">
            {product.sector_data?.square_meters ? (
              <div className="flex items-center gap-1.5 min-w-0" title={`${product.sector_data.square_meters} m² Net`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">{lang === 'tr' ? 'Net:' : 'Net:'}</span>
                <span className="font-extrabold text-slate-800 truncate">{product.sector_data.square_meters} m²</span>
              </div>
            ) : null}
            {product.sector_data?.sqm_gross ? (
              <div className="flex items-center gap-1.5 min-w-0" title={`${product.sector_data.sqm_gross} m² Brüt`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">{lang === 'tr' ? 'Brüt:' : 'Gross:'}</span>
                <span className="font-extrabold text-slate-800 truncate">{product.sector_data.sqm_gross} m²</span>
              </div>
            ) : null}
            {product.sector_data?.rooms ? (
              <div className="flex items-center gap-1.5 min-w-0" title={product.sector_data.rooms}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">{lang === 'tr' ? 'Oda:' : 'Rooms:'}</span>
                <span className="font-extrabold text-slate-800 truncate">{product.sector_data.rooms}</span>
              </div>
            ) : null}
            {product.sector_data?.building_age ? (
              <div className="flex items-center gap-1.5 min-w-0" title={product.sector_data.building_age}>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">{lang === 'tr' ? 'Yaş:' : 'Age:'}</span>
                <span className="font-extrabold text-slate-800 truncate">{product.sector_data.building_age}</span>
              </div>
            ) : null}
            {product.sector_data?.floor ? (
              <div className="flex items-center gap-1.5 min-w-0" title={product.sector_data.floor}>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">{lang === 'tr' ? 'Kat:' : 'Floor:'}</span>
                <span className="font-extrabold text-slate-800 truncate">{product.sector_data.floor}</span>
              </div>
            ) : null}
            {product.sector_data?.furnished !== undefined ? (
              <div className="flex items-center gap-1.5 min-w-0" title={product.sector_data.furnished ? 'Eşyalı' : 'Boş'}>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">{lang === 'tr' ? 'Eşya:' : 'Furn:'}</span>
                <span className="font-extrabold text-slate-800 truncate">
                  {product.sector_data.furnished ? (lang === 'tr' ? 'Eşyalı' : 'Furnished') : (lang === 'tr' ? 'Boş' : 'Unfurnished')}
                </span>
              </div>
            ) : null}
            {product.sector_data?.kktc_title_type && product.sector_data?.listing_intent !== 'rent' ? (
              <div className="flex items-center gap-1.5 col-span-2 border-t border-slate-100 pt-1.5 mt-0.5 min-w-0" title={product.sector_data.kktc_title_type}>
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">{lang === 'tr' ? 'Koçan:' : 'Title:'}</span>
                <span className="font-extrabold text-slate-800 truncate">{product.sector_data.kktc_title_type}</span>
              </div>
            ) : null}
            {product.reference_no || product.sector_data?.reference_no ? (
              <div className="flex items-center gap-1.5 col-span-2 border-t border-slate-100 pt-1 mt-0.5 min-w-0" title={product.reference_no || product.sector_data?.reference_no}>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span className="text-slate-400 font-semibold shrink-0">{lang === 'tr' ? 'Ref No:' : 'Ref No:'}</span>
                <span className="font-extrabold text-slate-600 font-mono truncate">{product.reference_no || product.sector_data?.reference_no}</span>
              </div>
            ) : null}
          </div>
        )}

        {product.type === "vehicle" && (
          <div className="flex items-center gap-3 my-3 text-[11px] font-bold text-slate-500 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="text-rose-600 font-extrabold">
                {lang === "tr" ? "Yıl" : "Year"}
              </span>
              {(product as any).year || product.name.match(/^(\d{4})/)?.[1] || "---"}
            </span>
            {((product as any).current_mileage || (product.sector_data as any)?.current_mileage) !== undefined && (
              <span className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span className="text-sky-600 font-extrabold">KM</span>
                {Number((product as any).current_mileage || (product.sector_data as any)?.current_mileage).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold tracking-wide leading-none mb-1">
              {t.dashboard.price}
            </span>
            <span className="text-xsl font-bold text-gray-900">
              {formatPrice(convertedPrice, store?.currency || product.currency || '', sector, store?.store_type)}
            </span>
          </div>
          <button
            onClick={() => onView(product)}
            className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
