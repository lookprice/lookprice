import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getExchangeRate } from "../services/currencyService";
import {
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  MessageCircle,
  MapPin,
  Package,
  Share2,
  Link2,
  ShoppingBag,
  ShieldCheck,
  Map as MapIcon,
  Car,
  RefreshCw,
  ArrowDownUp,
} from "lucide-react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { api } from "../services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { SectorSpecs } from "./SectorSpecs";
import { ListingFinancingCalculator } from "./ListingFinancingCalculator";
import { PropertyMapTour } from "./PropertyMapTour";
import SEO from "./SEO";
import { Product, Store as StoreInfo } from "../types";

const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || "";

interface ProductDetailModalProps {
  product: Product | null;
  store: StoreInfo | null;
  t: any;
  slug: string;
  onClose: () => void;
  addToBasket: (p: Product) => void;
  primaryColor: string;
  isLuxury?: boolean;
  sector?: string;
  showAboutModal: boolean;
  setShowAboutModal: (show: boolean) => void;
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

const DigitalSignature: React.FC<{ storeName: string; lang: string; isPortfolio?: boolean }> = ({
  storeName,
  lang,
  isPortfolio
}) => {
  if (isPortfolio) return null;
  return (
    <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <ShieldCheck className="w-24 h-24 text-slate-900" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-lg bg-green-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
            {lang === "tr" ? "DOĞRULANMIŞ ÜRÜN" : "VERIFIED PRODUCT"}
          </span>
        </div>
        <h5 className="text-[14px] font-bold text-slate-800 tracking-tight">
          {storeName} {lang === "tr" ? "Dijital İmzalı Garanti" : "Digitally Signed Warranty"}
        </h5>
        <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed max-w-sm">
          {lang === "tr"
            ? "Bu ilan yetkili satıcı tarafından onaylanmış olup LookPrice platformu güvencesiyle listelenmektedir."
            : "This listing has been approved by the authorized dealer and is listed under LookPrice protection."}
        </p>
      </div>
    </div>
  );
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  store,
  t,
  slug,
  onClose,
  addToBasket,
  primaryColor,
  isLuxury,
  sector = "general",
  showAboutModal,
  setShowAboutModal,
}) => {
  const { lang } = useLanguage();
  const [branchStocks, setBranchStocks] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranchIdx, setSelectedBranchIdx] = useState(0);
  const [convertedPrice, setConvertedPrice] = useState<number>(
    product?.price || 0,
  );

  // States for 360° virtual tour mode
  const [activeViewMode, setActiveViewMode] = useState<"gallery" | "tourMap">(
    "gallery",
  );

  // Premium dynamic image gallery integration
  const productImages = useMemo(() => {
    const list: string[] = [];
    if (product?.image_url) {
      list.push(product.image_url);
    }
    const rawImages = (product as any)?.images;
    if (rawImages) {
      if (Array.isArray(rawImages)) {
        rawImages.forEach((img: any) => {
          if (img && typeof img === "string" && !list.includes(img)) {
            list.push(img);
          }
        });
      } else if (typeof rawImages === "string") {
        try {
          const parsed = JSON.parse(rawImages);
          if (Array.isArray(parsed)) {
            parsed.forEach((img: any) => {
              if (img && typeof img === "string" && !list.includes(img)) {
                list.push(img);
              }
            });
          }
        } catch (e) {}
      }
    }
    return list;
  }, [product]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Keyboard navigation for enlarged viewer
  useEffect(() => {
    if (!isLightboxOpen || productImages.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setActiveImageIdx((prev) => (prev + 1) % productImages.length);
      } else if (e.key === "ArrowLeft") {
        setActiveImageIdx(
          (prev) => (prev - 1 + productImages.length) % productImages.length,
        );
      } else if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, productImages.length]);

  const categoryLabel = product?.type === "real_estate"
    ? (lang === "tr" ? "MÜLK TİPİ" : "PROPERTY TYPE")
    : store?.category_label || (lang === "tr" ? "Kategori" : "Category");
  const brandLabel = product?.type === "real_estate" 
    ? (lang === "tr" ? "KONUM" : "LOCATION")
    : store?.brand_label || (lang === "tr" ? "Marka" : "Brand");

  useEffect(() => {
    if (
      product &&
      store?.currency &&
      product.currency &&
      product.currency !== store.currency
    ) {
      getExchangeRate(product.currency, store.currency).then((rate) => {
        setConvertedPrice(product.price * rate);
      });
    } else if (product) {
      setConvertedPrice(product.price);
    }
  }, [product?.price, product?.currency, store?.currency]);

  useEffect(() => {
    if (product?.id && store?.id) {
      const typeOfProduct = store.store_type === "real_estate" ? "property" : (store.store_type === "motor_vehicle" ? "vehicle" : "product");
      fetch("/api/public/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          entity_type: typeOfProduct,
          entity_id: product.id,
          event_type: "view",
          referer: window.location.href
        })
      }).catch(e => console.error("Telemetry failed:", e));
    }
  }, [product?.id, store?.id]);

  useEffect(() => {
    const effectiveSlug = store?.slug || slug;
    if (product?.barcode && effectiveSlug) {
      setLoadingBranches(true);
      api
        .getPublicProductBranchStock(effectiveSlug, product.barcode)
        .then((res) => {
          if (!res.error) {
            setBranchStocks(res);
            // Preselect the first branch that has stock
            const inStockIdx = res.findIndex((b: any) => b.stock > 0);
            if (inStockIdx !== -1) {
              setSelectedBranchIdx(inStockIdx);
            }
          }
        })
        .finally(() => setLoadingBranches(false));
    }
  }, [product?.barcode, store?.slug, slug]);

  const [isCopied, setIsCopied] = useState(false);

  const productUrl = useMemo(() => {
    if (!product) return window.location.href;
    const baseUrl = window.location.origin;
    const isCustomDomain = !window.location.pathname.startsWith("/s/");
    if (isCustomDomain) {
      return `${baseUrl}/p/${product.barcode || product.id}`;
    } else {
      const effectiveStoreSlug = store?.slug || slug;
      return `${baseUrl}/s/${effectiveStoreSlug}/p/${product.barcode || product.id}`;
    }
  }, [product, store?.slug, slug]);

  const shareProduct = async () => {
    const shareData = {
      title: product?.name || "",
      text: `${product?.name} - ${product?.price} ${store?.currency || "TRY"}`,
      url: productUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      copyLink();
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(productUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    if (!product) return;
    const text = encodeURIComponent(
      `${product.name}\nFiyat: ${product.price} ${store?.currency || "TRY"}\n\nİncelemek için: ${productUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (!product) return null;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `Buy ${product.name} at ${store?.name}`,
    image: product.image_url,
    sku: product.barcode,
    brand: {
      "@type": "Brand",
      name: product.brand || store?.name || "FastPOS",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: store?.currency || product.currency || "USD",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <APIProvider apiKey={MAP_KEY}>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <SEO
        title={`${product.name} | ${store?.name}`}
        description={product.description?.substring(0, 160)}
        ogImage={product.image_url}
        schemaData={productSchema}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-[1440px] rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[95vh] border border-slate-200"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2.5 bg-slate-900/90 text-white hover:bg-slate-850 rounded-full transition-all z-50 shadow-xl active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full md:w-1/2 h-[325px] sm:h-[450px] md:h-auto md:min-h-[650px] bg-white flex flex-col relative border-b md:border-b-0 md:border-r border-slate-100 transition-all duration-500">
          {/* Share Buttons Overlay */}
          <div className="absolute top-6 left-6 flex flex-col items-start gap-2 z-20">
            <button
              onClick={shareProduct}
              type="button"
              className="p-3 bg-white/95 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-all active:scale-90 group border border-slate-200"
              title={lang === "tr" ? "Paylaş" : "Share"}
            >
              <Share2 className="w-5 h-5 text-indigo-600" />
            </button>
            <button
              onClick={shareOnWhatsApp}
              type="button"
              className="p-3 bg-emerald-500/95 backdrop-blur-md rounded-xl shadow-lg hover:bg-emerald-500 transition-all active:scale-90 border border-emerald-400/20"
              title="WhatsApp"
            >
              <svg
                className="w-5 h-5 text-white fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
            <button
              onClick={copyLink}
              type="button"
              className="p-3 bg-white/95 backdrop-blur-md rounded-xl shadow-lg hover:bg-white transition-all active:scale-90 flex items-center gap-2 group overflow-hidden border border-slate-200"
              title={lang === "tr" ? "Linki Kopyala" : "Copy Link"}
            >
              <div className="flex items-center gap-2">
                {isCopied ? (
                  <Check className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Link2 className="w-5 h-5 text-slate-600" />
                )}
                <AnimatePresence>
                  {isCopied && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-[10px] font-black uppercase text-emerald-600 tracking-widest whitespace-nowrap"
                    >
                      {lang === "tr" ? "Kopyalandı" : "Copied"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>
          </div>

          {/* View Mode Switcher Moved and Refined */}
          {(product.type === "real_estate" || product.type === "vehicle" || store?.store_type === "real_estate" || store?.store_type === "motor_vehicle") && (
              <div className="absolute top-6 right-16 z-30 transition-all duration-500">
                <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 flex gap-1 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveViewMode("gallery")}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all flex items-center gap-1.5 ${activeViewMode === "gallery" ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-white"}`}
                  >
                    <Package className="w-3 h-3" />
                    {lang === "tr" ? "Galeri" : "Gallery"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveViewMode("tourMap")}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase transition-all flex items-center gap-1.5 ${activeViewMode === "tourMap" ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-white"}`}
                  >
                    <MapIcon className="w-3 h-3" />
                    {lang === "tr" ? "HARİTA" : "MAP FLOW"}
                  </button>
                </div>
              </div>
            )}
          {activeViewMode === "tourMap" ? (
             <PropertyMapTour 
                location={(product as any).location || product.sector_data?.location || product.address || store?.address} 
                property={product} 
                lang={lang} 
              />
          ) : productImages.length > 0 ? (
            <div className="w-full flex-1 flex flex-col justify-between bg-white relative p-3 pb-4 md:p-6 md:pb-8">
              {/* Main Viewport Box */}
              <div
                className="flex-1 relative min-h-0 flex items-center justify-center group/gallery cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
                title={
                  lang === "tr" ? "Büyütmek için tıklayın" : "Click to enlarge"
                }
              >
                <img
                  src={productImages[activeImageIdx]}
                  alt={product.name}
                  className="w-full h-full object-cover md:object-contain transition-all duration-300 group-hover/gallery:scale-105"
                  referrerPolicy="no-referrer"
                />

                {/* Action Icon overlay */}
                <div className="absolute top-2 right-2 bg-slate-900/40 backdrop-blur-xs text-white p-1.5 rounded-lg opacity-0 group-hover/gallery:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4" />
                </div>

                {/* Previous / Next chevrons inside the product frame */}
                {productImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx(
                          (prev) =>
                            (prev - 1 + productImages.length) %
                            productImages.length,
                        );
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx(
                          (prev) => (prev + 1) % productImages.length,
                        );
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/60 hover:bg-slate-950 text-white flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails list below inside normal frame */}
              {productImages.length > 1 && (
                <div className="flex gap-2 justify-center py-2 px-4 overflow-x-auto no-scrollbar max-w-full z-10 shrink-0">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${activeImageIdx === idx ? "border-indigo-600 scale-105 shadow-md" : "border-slate-100 hover:border-slate-300"}`}
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Package className="w-32 h-32" />
            </div>
          )}
        </div>
        <div className="md:w-1/2 p-6 md:p-14 overflow-y-auto no-scrollbar">
          <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 items-center">
            {getLabels(product.labels).map((label, idx) => (
              <span
                key={idx}
                className="text-[10px] tracking-wide font-semibold px-4 py-1.5 rounded-lg text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {label}
              </span>
            ))}
            <div className="flex flex-col">
              <span className="text-[8px] font-semibold text-gray-400 tracking-wide leading-none mb-1">
                {categoryLabel}
              </span>
              <span
                className="text-[10px] tracking-wide font-semibold px-3 py-1 rounded-lg whitespace-nowrap"
                style={{
                  color: primaryColor,
                  backgroundColor: `${primaryColor}10`,
                }}
              >
                {product.type === "real_estate" && lang === "tr"
                  ? (product.category === "residence" ? "Konut" : product.category === "commercial" ? "Ticari" : product.category === "land" ? "Arsa" : (product.category || t.dashboard.uncategorized))
                  : (product.category || t.dashboard.uncategorized)}
              </span>
            </div>
            {product.brand && product.type !== "real_estate" && (
              <div className="flex flex-col">
                <span className="text-[8px] font-semibold text-gray-400 tracking-wide leading-none mb-1">
                  {brandLabel}
                </span>
                <span className="text-[10px] tracking-wide font-semibold px-3 py-1 rounded-lg border border-gray-100 text-gray-500 whitespace-nowrap">
                  {product.brand}
                </span>
              </div>
            )}
            {product.type === "real_estate" && (product as any).location && (
              <div className="flex flex-col">
                <span className="text-[8px] font-semibold text-gray-400 tracking-wide leading-none mb-1">
                  {brandLabel}
                </span>
                <span className="text-[10px] tracking-wide font-semibold px-3 py-1 rounded-lg border border-gray-100 text-gray-500 whitespace-nowrap">
                  {(product as any).location}
                </span>
              </div>
            )}
            {product.branch_name && product.branch_name !== store?.name && (
              <div className="flex flex-col px-2">
                <span className="text-[8px] font-semibold text-gray-400 tracking-wide leading-none mb-1">
                  {lang === "tr" ? "Şube" : "Branch"}
                </span>
                <span className="text-[10px] tracking-wide font-semibold px-3 py-1 rounded-lg border border-gray-100 text-gray-500 whitespace-nowrap">
                  {product.branch_name}
                </span>
              </div>
            )}
          </div>

          <h2
            className={`text-4xl md:text-5xl text-slate-900 mb-4 leading-[1.1] tracking-tighter ${isLuxury ? "!font-sans !font-medium" : "font-bold"}`}
          >
            {product.name}
          </h2>

          <div className="flex items-baseline gap-3 mb-8">
            <span
              className={`text-4xl text-slate-900 ${isLuxury ? "!font-sans !font-medium" : "font-semibold font-display"}`}
            >
              {formatPrice(convertedPrice, store?.currency || product.currency || '', sector, store?.store_type)}
            </span>
            {product.unit && (
              <span className="text-xl text-slate-400 font-medium">
                / {product.unit}
              </span>
            )}
          </div>

          {(product.is_trade_in_available || (product.sector_data as any)?.is_trade_in_available) && (
            <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100/50 group hover:bg-emerald-100/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowDownUp className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                  {lang === "tr" ? "TAKAS İMKANI" : "TRADE-IN AVAILABLE"}
                </span>
                <span className="text-[10px] opacity-70 font-medium">
                  {lang === "tr" ? "Bu araç için takas teklifleri değerlendirilir." : "Trade-in offers are considered for this vehicle."}
                </span>
              </div>
            </div>
          )}

          {product.description && 
            !product.description.startsWith("Şasi:") && 
            (() => {
              const desc = product.description.trim().toLowerCase();
              const story = ((product as any).market_story || (product.sector_data as any)?.market_story || "").trim().toLowerCase();
              const tech = ((product as any).technical_description || (product.sector_data as any)?.technical_description || "").trim().toLowerCase();
              return desc !== story && desc !== tech && desc.length > 5;
            })() && (
            <div className="prose prose-slate max-w-none mb-10 text-slate-700">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.3em] mb-4">
                {t.dashboard.description}
              </h4>
              <div 
                className="text-slate-600 leading-relaxed text-base font-medium [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-bold [&_h1]:text-2xl [&_h2]:text-xl"
                dangerouslySetInnerHTML={{ __html: product.description.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ') }} 
              />
            </div>
          )}

          {((product as any).market_story || (product.sector_data as any)?.market_story) && (
            <div className="mb-10 p-8 bg-blue-50/40 rounded-[2.5rem] border border-blue-100/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Car className="w-32 h-32 text-blue-600" />
              </div>
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-blue-200" />
                {lang === "tr" ? "PAZAR HİKAYESİ" : "MARKET STORY"}
              </h4>
              <p className="text-slate-800 leading-relaxed text-base font-medium relative z-10">
                {(product as any).market_story || (product.sector_data as any)?.market_story}
              </p>
            </div>
          )}

          {((product as any).technical_description || (product.sector_data as any)?.technical_description) && (
            <div className="mb-10 p-8 bg-slate-50/80 rounded-[2.5rem] border border-slate-200/50 shadow-sm relative overflow-hidden group">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-slate-300" />
                {lang === "tr" ? "TEKNİK İLAN AÇIKLAMASI" : "TECHNICAL DESCRIPTION"}
              </h4>
              <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-medium">
                {(product as any).technical_description || (product.sector_data as any)?.technical_description}
              </p>
            </div>
          )}

          <SectorSpecs
            sector={
              product?.type === "vehicle"
                ? "automotive"
                : product?.type === "real_estate"
                  ? "real_estate"
                  : sector
            }
            data={{
              ...product.sector_data,
              mileage: (product as any).current_mileage || (product.sector_data as any)?.current_mileage,
              paint_report: (product as any).paint_report || (product.sector_data as any)?.paint_report,
              is_trade_in_available: (product as any).is_trade_in_available !== undefined ? (product as any).is_trade_in_available : (product.sector_data as any)?.is_trade_in_available,
            }}
            category={product.category}
            name={product.name}
            description={product.description}
          />

          {((store?.store_type === "real_estate" || store?.store_type === "motor_vehicle" || store?.sector === "real_estate" || store?.sector === "automotive" || sector === "real_estate" || sector === "automotive" || product?.type === "real_estate" || product?.type === "vehicle")) && (
            <ListingFinancingCalculator
              price={convertedPrice}
              currency={store?.currency || product?.currency || 'TRY'}
              lang={lang}
              store={store}
            />
          )}

          <DigitalSignature storeName={store?.name || ""} lang={lang} isPortfolio={store?.store_type === 'real_estate' || store?.store_type === 'motor_vehicle'} />

          {branchStocks.length > 0 && (
            <div className="mt-10 mb-10">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.3em] mb-6">
                {lang === "tr" ? "ŞUBE SEÇİN" : "CHOOSE BRANCH"}
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {branchStocks.map((branch, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (branch.stock > 0) setSelectedBranchIdx(idx);
                    }}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${branch.stock > 0 ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${selectedBranchIdx === idx ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-550 shadow-sm" : "bg-gray-55/50 bg-gray-50 border-gray-100 hover:border-indigo-500/30"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform ${selectedBranchIdx === idx ? "bg-indigo-600 text-white scale-110" : "bg-white text-indigo-600"}`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`font-bold ${selectedBranchIdx === idx ? "text-indigo-600" : "text-gray-900"}`}
                        >
                          {branch.branch_name}
                        </span>
                        {selectedBranchIdx === idx && (
                          <span className="text-[9px] text-indigo-600 font-bold mt-1 uppercase tracking-wider">
                            {lang === "tr" ? "Seçili Şube" : "Selected Branch"}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide ${branch.stock > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {branch.stock > 0
                        ? `${branch.stock} ${t.dashboard.inStock || "Stokta"}`
                        : t.dashboard.outOfStock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {store?.store_type === "real_estate" || store?.store_type === "motor_vehicle" ||
          product.type === "vehicle" ||
          product.type === "real_estate" ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const phone = store?.whatsapp_number || store?.phone;
                  if (phone) {
                    // Send click event to telemetry
                    fetch("/api/public/analytics/event", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        store_id: store.id,
                        entity_type: store.store_type === "real_estate" ? "property" : (store.store_type === "motor_vehicle" ? "vehicle" : "product"),
                        entity_id: product.id,
                        event_type: "whatsapp_click",
                        referer: window.location.href
                      })
                    }).catch(e => console.error(e));

                    const message = lang === "tr" 
                      ? `Merhaba, #${product.id} portföy numaralı ${product.name} ilanı hakkında bilgi almak istiyorum.`
                      : `Hello, I would like to inquire about listing #${product.id} - ${product.name}.`;
                    
                    window.open(
                      `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`,
                      "_blank",
                    );
                  } else {
                    alert(lang === "tr" ? "İletişim numarası bulunamadı." : "No contact number found.");
                  }
                }}
                type="button"
                className="w-full py-4 text-white rounded-[2rem] font-semibold text-lg transition-all shadow-lg flex items-center justify-center gap-4 group active:scale-95"
                style={{
                  backgroundColor: "#25D366",
                  boxShadow: `0 20px 40px -10px #25D36660`,
                }}
              >
                <div className="p-1 px-1.5 bg-white/20 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/></svg>
                </div>
                {lang === "tr" ? "WhatsApp ile Bilgi Al" : "Inquire via WhatsApp"}
              </button>

              {(product as any).is_trade_in_available && (
                <button
                  onClick={() => {
                    const phone = store?.whatsapp_number || store?.phone;
                    if (phone) {
                      // Send click event to telemetry
                      fetch("/api/public/analytics/event", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          store_id: store.id,
                          entity_type: "vehicle",
                          entity_id: product.id,
                          event_type: "whatsapp_click",
                          referer: window.location.href
                        })
                      }).catch(e => console.error(e));

                      const tradeMessage = lang === "tr"
                        ? `Merhaba, #${product.id} portföy numaralı ${product.name} aracınız için Takas Teklifi göndermek istiyorum. \n\nLütfen aracımın bilgilerini ve görsellerini buradan size iletiyorum: `
                        : `Hello, I would like to send a Trade-in Offer for listing #${product.id} - ${product.name}. \n\nI am sending my vehicle information and photos here: `;
                      
                      window.open(
                        `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(tradeMessage)}`,
                        "_blank",
                      );
                    }
                  }}
                  type="button"
                  className="w-full py-4 text-white rounded-[2rem] font-semibold text-lg transition-all shadow-lg flex items-center justify-center gap-4 group active:scale-95"
                  style={{
                    backgroundColor: "#2563eb",
                    boxShadow: `0 20px 40px -10px #2563eb60`,
                  }}
                >
                  <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                  {lang === "tr" ? "Takas Teklifini Hemen Gönder" : "Send Trade-in Offer Now"}
                </button>
              )}
            </div>
          ) : (
            <button
              disabled={
                branchStocks.length > 0 &&
                branchStocks[selectedBranchIdx]?.stock <= 0
              }
              type="button"
              onClick={() => {
                if (branchStocks.length > 0) {
                  const selectedBranch = branchStocks[selectedBranchIdx];
                  if (selectedBranch.stock > 0) {
                    addToBasket({
                      ...product,
                      id: selectedBranch.product_id,
                      store_id: selectedBranch.store_id,
                      branch_name: selectedBranch.branch_name,
                      branch_slug: selectedBranch.branch_slug,
                      stock_quantity: selectedBranch.stock,
                    });
                    onClose();
                  }
                } else {
                  addToBasket(product);
                  onClose();
                }
              }}
              className={`w-full py-4 text-white rounded-[2rem] font-semibold text-lg transition-all shadow-lg flex items-center justify-center gap-4 group ${branchStocks.length > 0 && branchStocks[selectedBranchIdx]?.stock <= 0 ? "opacity-50 cursor-not-allowed grayscale" : "active:scale-95"}`}
              style={
                branchStocks.length > 0 &&
                branchStocks[selectedBranchIdx]?.stock <= 0
                  ? { backgroundColor: "#9ca3af" }
                  : {
                      backgroundColor: primaryColor,
                      boxShadow: `0 20px 40px -10px ${primaryColor}60`,
                    }
              }
            >
              <ShoppingBag className="w-7 h-7 group-hover:scale-110 transition-transform" />
              {branchStocks.length > 0 &&
              branchStocks[selectedBranchIdx]?.stock <= 0
                ? t.dashboard.outOfStock
                : t.dashboard.addToCart}
            </button>
          )}
        </div>
      </motion.div>

      {/* Lightbox / Fullscreen Image Viewer Modal Overlay */}
      <AnimatePresence>
        {isLightboxOpen && productImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Top Bar inside Lightbox */}
            <div className="w-full flex justify-between items-center z-[210] pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-white text-xs font-bold tracking-wider uppercase">
                {product.name} ({activeImageIdx + 1} / {productImages.length})
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="pointer-events-auto p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl transition-all active:scale-95 border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Central Zoom Viewport */}
            <div
              className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Arrow Button */}
              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIdx(
                      (prev) =>
                        (prev - 1 + productImages.length) %
                        productImages.length,
                    )
                  }
                  className="absolute left-2 md:left-8 w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/85 hover:bg-slate-900 hover:scale-105 border border-white/10 text-white flex items-center justify-center shadow-2xl transition-all z-[220]"
                >
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              )}

              {/* Large Active Image inside Enlarged View */}
              <img
                src={productImages[activeImageIdx]}
                alt={product.name}
                className="max-w-full max-h-[70vh] md:max-h-[82vh] object-contain select-none shadow-2xl rounded-xl"
                referrerPolicy="no-referrer"
              />

              {/* Right Arrow Button */}
              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIdx(
                      (prev) => (prev + 1) % productImages.length,
                    )
                  }
                  className="absolute right-2 md:right-8 w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/85 hover:bg-slate-900 hover:scale-105 border border-white/10 text-white flex items-center justify-center shadow-2xl transition-all z-[220]"
                >
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              )}
            </div>

            {/* Lightbox Bottom thumbnail scroller bar */}
            {productImages.length > 1 && (
              <div
                className="w-full max-w-4xl mx-auto flex gap-3.5 justify-center py-4 overflow-x-auto no-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImageIdx === idx ? "border-indigo-500 scale-110 shadow-lg" : "border-slate-800 hover:border-slate-600"}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </APIProvider>
  );
};
