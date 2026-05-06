import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getExchangeRate } from "../services/currencyService";
import { 
  Check,
  Lock,
  Search, 
  ShoppingBasket, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Store as StoreIcon,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  MapPin,
  Phone,
  Info,
  ArrowLeft,
  ShieldCheck,
  Shield,
  Globe,
  Truck,
  ExternalLink,
  RotateCcw,
  Star,
  Eye,
  Filter,
  ArrowUpDown,
  Tag,
  ShoppingBag,
  Mail,
  Share2,
  Sparkles,
  Link2,
  MessageSquare,
  BookOpen
} from "lucide-react";
import { CreditCard, User, LogOut, Edit3, Building2, Home } from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import ErrorBoundary from "../components/ErrorBoundary";
import { PageBuilder } from "../components/PageBuilder";
import { Product, Store as StoreInfo, FAQEntry, BlogPost, LegalPage } from "../types";
import SEO from "../components/SEO";
import { StoreLocatorModal } from "../components/StoreLocatorModal";

interface BasketItem extends Product {
  quantity: number;
}

const getLabels = (labels: any): string[] => {
  if (Array.isArray(labels)) return labels;
  if (typeof labels === 'string') {
    try {
      const parsed = JSON.parse(labels);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const ProductCard: React.FC<{ 
  product: Product, 
  store: StoreInfo | null, 
  t: any, 
  addToBasket: (p: Product) => void,
  onView: (p: Product) => void,
  primaryColor: string;
  isLuxury?: boolean;
  sector?: string;
}> = ({ product, store, t, addToBasket, onView, primaryColor, isLuxury, sector = 'general' }) => {
  const { lang } = useLanguage();
  const [convertedPrice, setConvertedPrice] = useState<number>(product.price);

  useEffect(() => {
    if (store?.currency && product.currency && product.currency !== store.currency) {
      getExchangeRate(product.currency, store.currency).then(rate => {
        setConvertedPrice(product.price * rate);
      });
    } else {
      setConvertedPrice(product.price);
    }
  }, [product.price, product.currency, store?.currency]);

  return (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-700 group relative flex flex-col h-full ${isLuxury ? 'font-sans tracking-tight' : ''}`}
  >
    <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden">
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
          onClick={() => onView(product)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-200" onClick={() => onView(product)}>
          <Package className="w-16 h-16" />
        </div>
      )}
      
      {/* Sector Specific Mini Specs */}
      {product.sector_data && (
        <div className="absolute top-24 left-4 flex flex-col gap-1 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
           {sector === 'automotive' && product.sector_data.hp && (
             <span className="px-2 py-1 bg-black/80 text-white text-[8px] font-semibold rounded backdrop-blur-sm border border-white/10 tracking-wide">{product.sector_data.hp} HP</span>
           )}
           {sector === 'tech' && product.sector_data.ram && (
             <span className="px-2 py-1 bg-indigo-600/80 text-white text-[8px] font-semibold rounded backdrop-blur-sm border border-indigo-500/20 tracking-wide">{product.sector_data.ram} RAM</span>
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
          onClick={() => addToBasket(product)}
          className="w-full py-3.5 bg-white text-gray-900 rounded-2xl font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {t.dashboard.addToBasket}
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
            {product.category || t.dashboard.uncategorized}
          </span>
          {product.brand && (
            <span className="text-[9px] font-bold text-gray-400 tracking-normal">
              {product.brand}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-[10px] font-bold text-gray-400">4.8</span>
        </div>
      </div>

      <h3 
        className={`font-bold text-slate-900 line-clamp-2 h-12 mb-3 transition-colors cursor-pointer group-hover:text-xsrimary text-base leading-tight tracking-tight ${isLuxury ? '!font-sans !font-medium text-gray-800' : ''}`} 
        onClick={() => onView(product)}
      >
        {product.name}
      </h3>
      
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold tracking-wide leading-none mb-1">{t.dashboard.price}</span>
          <span className="text-xsl font-bold text-gray-900">
            {convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {store?.currency || product.currency}
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

const SectorSpecs: React.FC<{ sector: string, data: any }> = ({ sector, data }) => {
  if (!data || typeof data !== 'object') return null;
  const { lang } = useLanguage();

  const renderAutomotive = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.hp && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">{lang === 'tr' ? 'BEYGİR GÜCÜ' : 'HORSEPOWER'}</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">{data.hp} HP</p>
        </div>
      )}
      {data.engine && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">{lang === 'tr' ? 'MOTOR' : 'ENGINE'}</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">{data.engine}</p>
        </div>
      )}
      {data.transmission && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">{lang === 'tr' ? 'ŞANZIMAN' : 'TRANSMISSION'}</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">{data.transmission}</p>
        </div>
      )}
      {data.fuel && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">{lang === 'tr' ? 'YAKIT' : 'FUEL'}</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">{data.fuel}</p>
        </div>
      )}
      {data.acceleration && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-500/20 transition-all">
          <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">{lang === 'tr' ? '0-100 KM/S' : '0-100 KM/H'}</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-amber-600 transition-colors uppercase">{data.acceleration}s</p>
        </div>
      )}
    </div>
  );

  const renderFashion = () => (
    <div className="grid grid-cols-2 gap-3">
      {data.material && (
        <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 group hover:border-pink-300 transition-all">
          <p className="text-[8px] font-semibold text-xsink-400 tracking-wide mb-1">{lang === 'tr' ? 'KUMAŞ / MATERYAL' : 'MATERIAL'}</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-xsink-600 transition-colors uppercase">{data.material}</p>
        </div>
      )}
      {data.fit && (
        <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 group hover:border-pink-300 transition-all">
          <p className="text-[8px] font-semibold text-xsink-400 tracking-wide mb-1">{lang === 'tr' ? 'KESİM / KALIP' : 'FIT'}</p>
          <p className="text-sm font-semibold text-slate-900 group-hover:text-xsink-600 transition-colors uppercase">{data.fit}</p>
        </div>
      )}
      {data.collection && (
        <div className="col-span-2 p-4 bg-slate-900 rounded-2xl border border-slate-800 group hover:border-amber-500/30 transition-all">
          <p className="text-[8px] font-semibold text-slate-500 tracking-wide mb-1">{lang === 'tr' ? 'KOLEKSİYON' : 'COLLECTION'}</p>
          <p className="text-sm font-semibold text-amber-500 group-hover:text-amber-400 transition-colors uppercase">{data.collection}</p>
        </div>
      )}
    </div>
  );

  const renderTech = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {data.cpu && (
        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-semibold text-indigo-400 tracking-wide mb-1">{lang === 'tr' ? 'İŞLEMCİ' : 'CPU'}</p>
          <p className="text-sm font-semibold text-indigo-900 transition-colors uppercase">{data.cpu}</p>
        </div>
      )}
      {data.ram && (
        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-semibold text-indigo-400 tracking-wide mb-1">RAM</p>
          <p className="text-sm font-semibold text-indigo-900 transition-colors uppercase">{data.ram}</p>
        </div>
      )}
      {data.storage && (
        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 group hover:border-indigo-300 transition-all">
          <p className="text-[8px] font-semibold text-indigo-400 tracking-wide mb-1">{lang === 'tr' ? 'DEPOLAMA' : 'STORAGE'}</p>
          <p className="text-sm font-semibold text-indigo-900 transition-colors uppercase">{data.storage}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
        {lang === 'tr' ? 'TEKNİK VERİ SAYFASI' : 'TECHNICAL DATA SHEET'}
        <div className="flex-1 h-[1px] bg-slate-100" />
      </h4>
      {sector === 'automotive' && renderAutomotive()}
      {sector === 'fashion' && renderFashion()}
      {sector === 'tech' && renderTech()}
      {sector === 'general' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(data).map(([key, value]: [string, any]) => (
            <div key={key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[8px] font-semibold text-slate-400 tracking-wide mb-1">{key.replace(/_/g, ' ')}</p>
              <p className="text-sm font-semibold text-slate-900 uppercase">{String(value)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DigitalSignature: React.FC<{ storeName: string, lang: string }> = ({ storeName, lang }) => (
  <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between overflow-hidden relative group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
       <ShieldCheck className="w-24 h-24 text-slate-900" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-lg bg-green-500 animate-pulse" />
        <span className="text-[10px] font-semibold text-slate-400 tracking-wide">{lang === 'tr' ? 'DOĞRULANMIŞ ÜRÜN' : 'VERIFIED PRODUCT'}</span>
      </div>
      <p className="text-xss font-bold text-slate-600 leading-tight">
        {lang === 'tr' ? `Bu ürün ${storeName} tarafından kalite kontrolünden geçmiştir.` : `This product has been quality-checked by ${storeName}.`}
      </p>
    </div>
    <div className="relative z-10 text-right">
       <span className="text-[10px] font-semibold text-slate-900 tracking-wide block mb-1 opacity-20 underline decoration-slate-900/10 decoration-dotted">SECURE_PASS_ID</span>
       <div className="flex gap-0.5 justify-end">
          {[1,2,3,4,5,6].map(i => <div key={i} className="w-1 h-4 bg-slate-900/10 rounded-lg" />)}
       </div>
    </div>
  </div>
);

const DiscoverModal: React.FC<{
  products: Product[],
  onClose: () => void,
  onViewProduct: (product: Product) => void,
  lang: string
}> = ({ products, onClose, onViewProduct, lang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (products.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [products]);

  if (products.length === 0) return null;

  const currentProduct = products[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % products.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + products.length) % products.length);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <img 
          src={currentProduct.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"} 
          alt={currentProduct.name}
          className="w-full h-full object-cover opacity-60 blur-sm scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />
      </div>

      <div className="relative z-10 w-full max-w-md h-full sm:h-[85vh] sm:rounded-3xl overflow-hidden bg-black flex flex-col shadow-2xl">
        {/* Progress Bars */}
        <div className="flex gap-1 p-4 absolute top-0 left-0 right-0 z-30">
          {products.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%',
                  transitionDuration: idx === currentIndex ? '4000ms' : '0ms'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
               <Sparkles className="w-4 h-4 text-amber-400" />
             </div>
             <span className="text-white text-sm font-semibold tracking-wide drop-shadow-md">
               {lang === 'tr' ? 'Keşfet' : 'Discover'}
             </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Click Areas */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-pointer" onClick={handleNext} />

        {/* Image */}
        <div className="flex-1 relative">
           <AnimatePresence mode="wait">
             <motion.img 
               key={currentProduct.id}
               initial={{ opacity: 0, scale: 1.05 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.4 }}
               src={currentProduct.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30"} 
               className="absolute inset-0 w-full h-full object-cover"
             />
           </AnimatePresence>
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-2 block drop-shadow-md">
              {currentProduct.category || (lang === 'tr' ? 'YENİ ÜRÜN' : 'NEW ARRIVAL')}
            </span>
            <h2 className="text-white text-3xl font-bold leading-tight mb-2 drop-shadow-lg max-w-[90%]">
              {currentProduct.name}
            </h2>
            <p className="text-white/80 text-sm line-clamp-2 mb-6 drop-shadow-md">
              {currentProduct.description || ''}
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  onViewProduct(currentProduct);
                }}
                className="flex-1 py-4 bg-white text-black rounded-2xl font-bold text-sm hover:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {lang === 'tr' ? 'Ürünü İncele' : 'View Product'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductDetailModal: React.FC<{
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
}> = ({ product, store, t, slug, onClose, addToBasket, primaryColor, isLuxury, sector = 'general', showAboutModal, setShowAboutModal }) => {
  const { lang } = useLanguage();
  const [branchStocks, setBranchStocks] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [convertedPrice, setConvertedPrice] = useState<number>(product?.price || 0);

  const brandLabel = store?.brand_label || (lang === 'tr' ? 'Marka' : 'Brand');
  const categoryLabel = store?.category_label || (lang === 'tr' ? 'Kategori' : 'Category');
  const stockLabel = store?.stock_label || (lang === 'tr' ? 'Stok' : 'Stock');

  useEffect(() => {
    if (product && store?.currency && product.currency && product.currency !== store.currency) {
      getExchangeRate(product.currency, store.currency).then(rate => {
        setConvertedPrice(product.price * rate);
      });
    } else if (product) {
      setConvertedPrice(product.price);
    }
  }, [product?.price, product?.currency, store?.currency]);

  useEffect(() => {
    const effectiveSlug = store?.slug || slug;
    if (product?.barcode && effectiveSlug) {
      setLoadingBranches(true);
      api.getPublicProductBranchStock(effectiveSlug, product.barcode)
        .then(res => {
          if (!res.error) setBranchStocks(res);
        })
        .finally(() => setLoadingBranches(false));
    }
  }, [product?.barcode, store?.slug, slug]);

  const [isCopied, setIsCopied] = useState(false);

  const productUrl = useMemo(() => {
    if (!product) return window.location.href;
    const baseUrl = window.location.origin;
    const isCustomDomain = !window.location.pathname.startsWith('/s/');
    if (isCustomDomain) {
      return `${baseUrl}/p/${product.barcode || product.id}`;
    } else {
      const effectiveStoreSlug = store?.slug || slug;
      return `${baseUrl}/s/${effectiveStoreSlug}/p/${product.barcode || product.id}`;
    }
  }, [product, store?.slug, slug]);

  const shareProduct = async () => {
    const shareData = {
      title: product.name,
      text: `${product.name} - ${product.price} ${store?.currency || 'TRY'}`,
      url: productUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
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
    const text = encodeURIComponent(`${product.name}\nFiyat: ${product.price} ${store?.currency || 'TRY'}\n\nİncelemek için: ${productUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (!product) return null;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `Buy ${product.name} at ${store?.name}`,
    "image": product.image_url,
    "sku": product.barcode,
    "brand": {
      "@type": "Brand",
      "name": product.brand || store?.name || "FastPOS"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": store?.currency || product.currency || "USD",
      "price": product.price,
      "availability": "https://schema.org/InStock"
    }
  };

  return (
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
        className="fixed inset-0 bg-black/40 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-5xl rounded-xl shadow-lg relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 bg-white/80 backdrop-blur-md hover:bg-white rounded-lg transition-all z-20 shadow-lg active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="md:w-1/2 bg-gray-50 relative overflow-hidden h-80 md:h-auto">
          {/* Share Buttons Overlay */}
          <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
            <button 
              onClick={shareProduct}
              className="p-3 bg-white/90 backdrop-blur-md rounded-lg shadow-lg hover:bg-white transition-all active:scale-90 group"
              title={lang === 'tr' ? 'Paylaş' : 'Share'}
            >
              <Share2 className="w-5 h-5 text-indigo-600" />
            </button>
            <button 
              onClick={shareOnWhatsApp}
              className="p-3 bg-emerald-500/90 backdrop-blur-md rounded-lg shadow-lg hover:bg-emerald-500 transition-all active:scale-90"
              title="WhatsApp"
            >
              <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
            <button 
              onClick={copyLink}
              className="p-3 bg-white/90 backdrop-blur-md rounded-lg shadow-lg hover:bg-white transition-all active:scale-90 flex items-center gap-2 group overflow-hidden"
              title={lang === 'tr' ? 'Linki Kopyala' : 'Copy Link'}
            >
              <div className="flex items-center gap-2">
                {isCopied ? <Check className="w-5 h-5 text-emerald-600" /> : <Link2 className="w-5 h-5 text-slate-600" />}
                <AnimatePresence>
                  {isCopied && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-[10px] font-semibold uppercase text-emerald-600 tracking-widest whitespace-nowrap"
                    >
                      {lang === 'tr' ? 'Kopyalandı' : 'Copied'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>
          </div>
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Package className="w-32 h-32" />
            </div>
          )}
        </div>

        <div className="md:w-1/2 p-6 md:p-14 overflow-y-auto no-scrollbar">
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            {getLabels(product.labels).map((label, idx) => (
              <span 
                key={idx}
                className="text-[10px] tracking-wide font-semibold px-4 py-1.5 rounded-lg text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {label}
              </span>
            ))}
            <div className="flex flex-col px-2">
              <span className="text-[8px] font-semibold text-gray-400 tracking-wide leading-none mb-1">{categoryLabel}</span>
              <span 
                className="text-[10px] tracking-wide font-semibold px-3 py-1 rounded-lg whitespace-nowrap"
                style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}
              >
                {product.category || t.dashboard.uncategorized}
              </span>
            </div>
            {product.brand && (
              <div className="flex flex-col px-2">
                <span className="text-[8px] font-semibold text-gray-400 tracking-wide leading-none mb-1">{brandLabel}</span>
                <span 
                  className="text-[10px] tracking-wide font-semibold px-3 py-1 rounded-lg border border-gray-100 text-gray-500 whitespace-nowrap"
                >
                  {product.brand}
                </span>
              </div>
            )}
          </div>
          
          <h2 className={`text-4xl md:text-4xl text-slate-900 mb-4 leading-[1.1] tracking-tighter ${isLuxury ? '!font-sans !font-medium' : 'font-bold'}`}>
            {product.name}
          </h2>

          <div className="flex items-baseline gap-3 mb-8">
            <span className={`text-4xl text-slate-900 ${isLuxury ? '!font-sans !font-medium' : 'font-semibold font-display'}`}>
              {convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {store?.currency || product.currency}
            </span>
            {product.unit && (
              <span className="text-xsl text-slate-400 font-medium">/ {product.unit}</span>
            )}
          </div>

          <div className="prose prose-gray max-w-none mb-10">
            <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.3em] mb-4">{t.dashboard.description}</h4>
            <p className="text-gray-500 leading-relaxed text-lg font-medium">
              {product.description || t.dashboard.noProductsDesc}
            </p>
          </div>

          <SectorSpecs sector={sector} data={product.sector_data} />
          
          <DigitalSignature storeName={store?.name || ''} lang={lang} />

          {branchStocks.length > 0 && (
            <div className="mt-10 mb-10">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.3em] mb-6">{lang === 'tr' ? 'MAĞAZA STOKLARI' : 'STORE STOCKS'}</h4>
              <div className="grid grid-cols-1 gap-3">
                {branchStocks.map((branch, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 text-xsrimary" />
                      </div>
                      <span className="font-bold text-gray-900">{branch.branch_name}</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-lg text-xss font-semibold tracking-wide ${branch.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {branch.stock > 0 ? `${branch.stock} ${t.dashboard.inStock || 'Stokta'}` : t.dashboard.outOfStock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={() => {
              addToBasket(product);
              onClose();
            }}
            className="w-full py-4 text-white rounded-[2rem] font-semibold text-xsl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-4 group"
            style={{ backgroundColor: primaryColor, boxShadow: `0 20px 40px -10px ${primaryColor}60` }}
          >
            <ShoppingBag className="w-7 h-7 group-hover:scale-110 transition-transform" />
            {t.dashboard.addToCart}
          </button>
        </div>
      </motion.div>
      {/* Removed About Modal functionality */}
    </div>
  );
};

const StoreShowcase: React.FC<{ customSlug?: string }> = ({ customSlug }) => {
  const { slug: urlSlug, barcode: urlBarcode } = useParams<{ slug: string, barcode?: string }>();
  const slug = customSlug || urlSlug;
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];
  const isTr = lang === 'tr';
  
  const getStorePath = (path: string = "") => {
    if (customSlug) {
      return path.startsWith("/") ? path : `/${path}`;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/s/${slug}${cleanPath === "/" ? "" : cleanPath}`;
  };

  const isProfileView = location.pathname.endsWith('/profile');
  const isOrdersView = location.pathname.endsWith('/orders');
  const isReturnView = location.pathname.endsWith('/return');
  
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement>(null);
  
  const brandLabel = store?.brand_label || (lang === 'tr' ? 'Marka' : 'Brand');
  const brandsLabel = store?.brand_label ? store.brand_label.toUpperCase() : (lang === 'tr' ? 'MARKALAR' : 'BRANDS');
  const categoryLabel = store?.category_label || (lang === 'tr' ? 'Kategori' : 'Category');
  const categoriesLabel = store?.category_label ? store.category_label.toUpperCase() : (lang === 'tr' ? 'KATEGORİLER' : 'CATEGORIES');
  const productLabel = store?.product_label || (lang === 'tr' ? 'Ürün' : 'Product');
  const stockLabel = store?.stock_label || (lang === 'tr' ? 'Stok' : 'Stock');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(localStorage.getItem('customerToken'));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState<any>({});
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    if ((isProfileView || isOrdersView || isReturnView) && !customerToken) {
      setShowAuthModal(true);
    }
  }, [isProfileView, isOrdersView, isReturnView, customerToken]);

  useEffect(() => {
    if (isProfileView && customerToken) {
      api.getCustomerProfile().then(res => {
        if (!res.error) {
          setCustomerProfile(res);
          setProfileEditForm(res);
        }
      });
    }
  }, [isProfileView, customerToken]);

  useEffect(() => {
    const savedBasket = localStorage.getItem(`basket_${slug}`);
    if (savedBasket) {
      try {
        setBasket(JSON.parse(savedBasket));
      } catch (e) {
        console.error("Failed to parse saved basket", e);
      }
    }
  }, [slug]);

  useEffect(() => {
    if (basket.length > 0) {
      localStorage.setItem(`basket_${slug}`, JSON.stringify(basket));
    } else {
      localStorage.removeItem(`basket_${slug}`);
    }
  }, [basket, slug]);

  const [customerInfo, setCustomerInfo] = useState({ 
    name: "", surname: "", phone: "", address: "", email: "", password: "", passwordConfirm: "",
    country: "", city: "", tc_id: "", is_corporate: false, marketing_email: false, marketing_sms: false, accept_terms: false, createAccount: false
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer' | 'cash_on_delivery' | 'payoneer' | 'paypal' | 'iyzico' | 'store_reservation'>('credit_card');
  const [iyzicoPaymentUrl, setIyzicoPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (store?.payment_settings) {
      if (store.payment_settings.cod_enabled) {
        setPaymentMethod('cash_on_delivery');
      } else if (store.payment_settings.bank_transfer_enabled) {
        setPaymentMethod('bank_transfer');
      } else if (store.payment_settings.iyzico_enabled) {
        setPaymentMethod('iyzico');
      } else if (store.payment_settings.paypal_enabled) {
        setPaymentMethod('paypal');
      } else if (store.payment_settings.payoneer_enabled) {
        setPaymentMethod('payoneer');
      }
    }
  }, [store]);
  const [customer, setCustomer] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showFaq, setShowFaq] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [showLegal, setShowLegal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const ITEMS_PER_PAGE = 20;
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (isOrdersView && customerToken) {
        setLoadingOrders(true);
        try {
          const res = await api.getCustomerOrders();
          setOrders(res || []);
        } catch (error) {
          console.error("Error fetching orders:", error);
        } finally {
          setLoadingOrders(false);
        }
      }
    };
    fetchOrders();
  }, [isOrdersView, customerToken]);

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  const formatPrice = (price: number, currency?: string) => {
    return `${Number(price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || store?.currency || 'TRY'}`;
  };

  const layoutSettings = store?.page_layout_settings || {
    show_announcement: true,
    show_stories: true,
    show_campaigns: true,
    show_testimonials: true,
    show_newsletter: true,
    enable_live_activity: true,
    theme_variety: 'modern',
    sector: 'general'
  };

  const isLuxury = layoutSettings.theme_variety === 'luxury' || layoutSettings.theme_variety === 'minimal';
  const isModern = layoutSettings.theme_variety === 'modern';
  const isBold = layoutSettings.theme_variety === 'bold';
  
  const sector = layoutSettings.sector || 'general';
  const isAuto = sector === 'automotive';
  const isFashion = sector === 'fashion' || isLuxury;
  const isTech = sector === 'tech';

  const primaryColor = store?.primary_color || (isLuxury ? '#8B7355' : '#3b82f6'); // Elegant bronze for luxury
  const secondaryColor = store?.secondary_color || (isLuxury ? '#000000' : '#1e293b');

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showStoreLocatorModal, setShowStoreLocatorModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      console.log(`Fetching store data for slug: ${slug}`);
      try {
        const [storeRes, productsRes] = await Promise.all([
          api.getPublicStore(slug),
          api.getPublicStoreProducts(slug)
        ]);

        console.log('Store response:', storeRes);
        console.log('Products response:', productsRes);

        if (storeRes.redirect) {
          navigate(storeRes.redirect, { replace: true });
          return;
        }

        if (storeRes.error) throw new Error(storeRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        if (typeof storeRes.page_layout === 'string') {
          try {
            storeRes.page_layout = JSON.parse(storeRes.page_layout);
          } catch (e) {
            storeRes.page_layout = [];
          }
        }
        
        if (typeof storeRes.menu_links === 'string') {
          try {
            storeRes.menu_links = JSON.parse(storeRes.menu_links);
          } catch (e) {
            storeRes.menu_links = [];
          }
        }
        
        storeRes.currency = storeRes.default_currency || 'TRY';
        console.log('Store data fetched:', storeRes);
        setStore(storeRes);
        
        // Update favicon
        if (storeRes.favicon_url) {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
          link.rel = 'icon';
          link.href = storeRes.favicon_url;
          document.head.appendChild(link);
        }

        document.title = storeRes.name || 'Store';
        setProducts(productsRes.filter((p: Product) => p.is_web_sale !== false));
        
        // If we have a barcode in the URL and haven't selected a product yet, try to find it
        if (urlBarcode) {
          const cleanBarcode = urlBarcode.toString().trim().toLowerCase();
          const product = productsRes.find((p: Product) => 
            (p.barcode && p.barcode.toString().trim().toLowerCase() === cleanBarcode) || 
            (p.id.toString() === cleanBarcode)
          );
          if (product) {
            setSelectedProduct(product);
          }
        }

        // If customer is logged in, sync their info to checkout
        if (customer) {
          setCustomerInfo(prev => ({
            ...prev,
            name: customer.name || "",
            surname: customer.surname || "",
            phone: customer.phone || "",
            address: customer.address || "",
            email: customer.email || "",
            country: customer.country || "",
            city: customer.city || "",
            tc_id: customer.tc_id || "",
            is_corporate: customer.is_corporate || false
          }));
        }
      } catch (err: any) {
        setError(err.message || t.dashboard.storeLoadingError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, customer?.id]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateCustomerProfile(profileEditForm);
      if (res.error) throw new Error(res.error);
      setCustomerProfile(res.customer);
      setCustomer(res.customer);
      localStorage.setItem('customer', JSON.stringify(res.customer));
      setIsEditingProfile(false);
      alert(lang === 'tr' ? 'Profil başarıyla güncellendi!' : 'Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || (lang === 'tr' ? 'Profil güncellenirken bir hata oluştu.' : 'An error occurred while updating profile.'));
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.customerLogin({
        email: customerInfo.email,
        password: customerInfo.password,
        storeId: store?.id
      });
      if (res.error) throw new Error(res.error);
      setCustomer(res.customer);
      setBasket([]); // Clear basket on login
      localStorage.setItem('customer', JSON.stringify(res.customer));
      localStorage.setItem('customerToken', res.token);
      setCustomerToken(res.token);
      setShowAuthModal(false);
      setCustomerInfo(prev => ({
        ...prev,
        name: res.customer.name,
        surname: res.customer.surname,
        phone: res.customer.phone,
        address: res.customer.address,
        email: res.customer.email,
        country: res.customer.country,
        city: res.customer.city,
        tc_id: res.customer.tc_id,
        is_corporate: res.customer.is_corporate
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customerInfo.password !== customerInfo.passwordConfirm) {
      alert(lang === 'tr' ? 'Şifreler eşleşmiyor' : 'Passwords do not match');
      return;
    }
    if (!customerInfo.accept_terms) {
      alert(lang === 'tr' ? 'Üyelik sözleşmesini kabul etmelisiniz' : 'You must accept the membership agreement');
      return;
    }
    try {
      const res = await api.customerRegister({
        name: customerInfo.name,
        surname: customerInfo.surname,
        email: customerInfo.email,
        password: customerInfo.password,
        phone: customerInfo.phone,
        address: customerInfo.address,
        country: customerInfo.country,
        city: customerInfo.city,
        tc_id: customerInfo.tc_id,
        is_corporate: customerInfo.is_corporate,
        marketing_email: customerInfo.marketing_email,
        marketing_sms: customerInfo.marketing_sms,
        storeId: store?.id
      });
      if (res.error) throw new Error(res.error);
      
      // Auto login after registration
      const loginRes = await api.customerLogin({
        email: customerInfo.email,
        password: customerInfo.password,
        storeId: store?.id
      });
      
      if (loginRes.error) throw new Error(loginRes.error);
      
      setCustomer(loginRes.customer);
      setBasket([]); // Clear basket on register
      setCustomerInfo(prev => ({
        ...prev,
        name: loginRes.customer.name,
        surname: loginRes.customer.surname,
        phone: loginRes.customer.phone,
        address: loginRes.customer.address,
        email: loginRes.customer.email,
        country: loginRes.customer.country,
        city: loginRes.customer.city,
        tc_id: loginRes.customer.tc_id,
        is_corporate: loginRes.customer.is_corporate
      }));
      localStorage.setItem('customer', JSON.stringify(loginRes.customer));
      localStorage.setItem('customerToken', loginRes.token);
      setCustomerToken(loginRes.token);
      setShowAuthModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    setCustomer(null);
    setCustomerToken(null);
    setBasket([]);
    setCustomerInfo({ 
      name: "", surname: "", phone: "", address: "", email: "", password: "", passwordConfirm: "",
      country: "", city: "", tc_id: "", is_corporate: false, marketing_email: false, marketing_sms: false, accept_terms: false, createAccount: false
    });
    localStorage.removeItem('customer');
    localStorage.removeItem('customerToken');
    localStorage.removeItem('basket'); // Just in case it was there
    if (isProfileView || isOrdersView || isReturnView) {
      navigate(`/s/${slug}`);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const shuffledProducts = useMemo(() => {
    if (!products.length) return [];
    // Stable shuffle based on product ID to avoid jumping items on re-renders but still feel "mixed"
    return [...products].sort((a, b) => {
      const hashA = (a.id * 15485863) % 1000000;
      const hashB = (b.id * 15485863) % 1000000;
      return hashA - hashB;
    });
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Map<string, Set<string>>();
    products.forEach(p => {
      const cat = p.category || t.dashboard.uncategorized;
      if (!cats.has(cat)) cats.set(cat, new Set());
      if (p.sub_category) cats.get(cat)!.add(p.sub_category);
    });
    return cats;
  }, [products, t]);

  const brands = useMemo(() => {
    const b = new Set<string>();
    products.forEach(p => {
      if (p.brand) b.add(p.brand);
    });
    return Array.from(b).sort();
  }, [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    const baseProducts = sortBy === 'default' && !searchQuery && !selectedCategory && !selectedBrand ? shuffledProducts : products;
    
    let result = baseProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const productCategory = p.category || t.dashboard.uncategorized;
      const matchesCategory = !selectedCategory || productCategory === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || p.sub_category === selectedSubCategory;
      const matchesBrand = !selectedBrand || p.brand === selectedBrand;
      
      return matchesSearch && matchesCategory && matchesSubCategory && matchesBrand;
    });

    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, shuffledProducts, searchQuery, selectedCategory, selectedSubCategory, selectedBrand, sortBy, t]);

  const totalPages = Math.ceil(sortedAndFilteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredProducts, currentPage]);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);
  const newArrivals = useMemo(() => [...products].reverse().slice(0, 8), [products]);
  const bestSellers = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 8), [products]);

  const seoKeywords = useMemo(() => {
    const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
    const brands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);
    return [
      store?.name,
      store?.hero_title,
      ...categories,
      ...brands,
      lang === 'tr' ? 'online alışveriş, en iyi fiyatlar, kaliteli ürünler' : 'online shopping, best prices, quality products'
    ].filter(Boolean).join(', ');
  }, [products, store, lang]);

  const storeSchema = store ? {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "name": store.name,
    "description": store.description,
    "url": window.location.href,
    "logo": store.logo_url,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": store.address
    }
  } : undefined;

  const addToBasket = (product: Product) => {
    setBasket(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromBasket = (productId: number) => {
    setBasket(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const [basketTotal, setBasketTotal] = useState(0);
  const [basketSubtotal, setBasketSubtotal] = useState(0);
  const [basketShippingTotal, setBasketShippingTotal] = useState(0);
  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  const [basketItemPrices, setBasketItemPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    const calculateTotal = async () => {
      if (!store?.currency) return;
      let subtotal = 0;
      let maxShippingCost = 0;
      const newPrices: Record<number, number> = {};
      
      for (const item of basket) {
        const itemPrice = Number(item.price) || 0;
        let shippingCost = 0;
        
        if (item.shipping_profile_id && store.shipping_profiles) {
          const profile = store.shipping_profiles.find((p: any) => String(p.id) === String(item.shipping_profile_id));
          if (profile) {
            let profileCost = Number(profile.cost) || 0;
            if (profile.currency && profile.currency !== store.currency) {
              const sRate = await getExchangeRate(profile.currency, store.currency);
              profileCost = profileCost * sRate;
            }
            shippingCost = profileCost;
          }
        }

        if (shippingCost > maxShippingCost) {
          maxShippingCost = shippingCost;
        }

        let convertedItemPrice = itemPrice;
        if (item.currency && item.currency !== store.currency) {
          const rate = await getExchangeRate(item.currency, store.currency);
          convertedItemPrice = itemPrice * rate;
        }

        const finalPrice = convertedItemPrice;
        newPrices[item.id] = finalPrice;
        
        subtotal += convertedItemPrice * item.quantity;
      }
      
      setBasketItemPrices(newPrices);
      setBasketSubtotal(subtotal);
      setBasketShippingTotal(maxShippingCost);
      setBasketTotal(subtotal + maxShippingCost);
    };
    calculateTotal();
  }, [basket, store?.currency, store?.shipping_profiles]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || basket.length === 0) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const selectedLocation = formData.get('selected_store_location');

    if (paymentMethod === 'store_reservation' && store?.locations && store.locations.length > 0 && !selectedLocation) {
      setError(lang === 'tr' ? 'Lütfen bir mağaza seçin.' : 'Please select a store.');
      return;
    }

    // Iyzico zorunluluğu kontrolü
    if (store.payment_settings?.iyzico_enabled && paymentMethod !== 'iyzico') {
      setError(lang === 'tr' ? 'Lütfen ödeme yöntemi olarak iyzico seçin.' : 'Please select iyzico as payment method.');
      return;
    }

    setCheckoutStatus('loading');
    try {
      // Calculate converted prices for items
      const itemsWithConvertedPrices = await Promise.all(basket.map(async (item) => {
        let itemPrice = Number(item.price) || 0;

        let finalPrice = itemPrice;
        if (item.currency && item.currency !== store.currency) {
          const rate = await getExchangeRate(item.currency, store.currency);
          finalPrice = itemPrice * rate;
        }
        return {
          productId: item.id,
          name: item.name,
          barcode: item.barcode,
          quantity: item.quantity,
          price: finalPrice
        };
      }));

      if (basketShippingTotal > 0) {
        itemsWithConvertedPrices.push({
          productId: null as any,
          name: lang === 'tr' ? 'Kargo Ücreti' : 'Shipping Fee',
          barcode: 'SHIPPING',
          quantity: 1,
          price: basketShippingTotal
        });
      }

      const res = await api.createPublicSale({
        storeId: store.id,
        items: itemsWithConvertedPrices,
        customerName: `${customerInfo.name} ${customerInfo.surname}`.trim(),
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        customerAddress: paymentMethod === 'store_reservation' ? `Mağazadan Teslim: ${selectedLocation}` : customerInfo.address,
        customerCity: customerInfo.city,
        customerCountry: customerInfo.country,
        customerTcId: customerInfo.tc_id,
        total: basketTotal,
        currency: store.currency,
        paymentMethod: paymentMethod,
        createAccount: customerInfo.createAccount,
        customerId: customer?.id
      });

      if (res.error) throw new Error(res.error);
      
      if (res.paymentProvider === 'iyzico' && res.initializeUrl) {
        const initRes = await fetch(res.initializeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId: res.saleId, paymentMethod: 'iyzico' })
        });
        const initData = await initRes.json();
        if (initData.paymentPageUrl) {
          setIyzicoPaymentUrl(initData.paymentPageUrl + "&iframe=true");
          setCheckoutStatus('idle');
          return;
        } else {
          throw new Error(initData.error || "Ödeme başlatılamadı.");
        }
      }
      
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }

      setCheckoutStatus('success');
      setBasket([]);
      setTimeout(() => {
        setIsCheckoutModalOpen(false);
        setCheckoutStatus('idle');
      }, 3000);
    } catch (err: any) {
      setCheckoutStatus('error');
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t.dashboard.storeLoading}</p>
        </div>
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.errorOccurred}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate(getStorePath("/"))}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {t.dashboard.backToHome}
          </button>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.errorOccurred}</h2>
          <p className="text-gray-600 mb-6">{t.dashboard.storeNotFound}</p>
          <button 
            onClick={() => navigate(getStorePath("/"))}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {t.dashboard.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary lang={lang}>
      <div className="min-h-screen bg-white pb-24 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      <SEO 
        title={selectedBlogPost ? `${selectedBlogPost.title} | ${store.name}` : store.name}
        description={selectedBlogPost ? selectedBlogPost.excerpt : store.description}
        ogImage={selectedBlogPost ? selectedBlogPost.image_url : store.logo_url}
        ogType={selectedBlogPost ? "article" : "website"}
        keywords={seoKeywords}
        siteName={store.name}
        schemaData={selectedBlogPost ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": selectedBlogPost.title,
          "image": selectedBlogPost.image_url,
          "datePublished": selectedBlogPost.date,
          "description": selectedBlogPost.excerpt
        } : storeSchema}
      />
      
      {layoutSettings.show_announcement && (
      <div className="bg-gray-900 overflow-hidden py-1.5">
        <div className="flex whitespace-nowrap animate-marquee">
          <div className="flex gap-8 text-[10px] sm:text-xss font-semibold text-white/80 tracking-wide px-4">
            <span className="flex items-center gap-2">
              <Package className="w-3 h-3" />
              {layoutSettings.announcement_text || (lang === 'tr' ? 'Anneler Gününüz Kutlu Olsun' : 'Happy Mother\'s Day')}
            </span>
            {/* Repeat to ensure smooth flow */}
            <span className="flex items-center gap-2">
              <Package className="w-3 h-3" />
              {layoutSettings.announcement_text || (lang === 'tr' ? 'Anneler Gününüz Kutlu Olsun' : 'Happy Mother\'s Day')}
            </span>
          </div>
        </div>
      </div>
      )}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-[60] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate(getStorePath("/"))}>
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-10 w-auto object-contain group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
            ) : (
              <div 
                className="h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform"
                style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
              >
                <StoreIcon className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-xsl font-bold text-gray-900 tracking-tighter hidden sm:block">{store?.name}</h1>
          </div>
          
          {/* Menu Links */}
          <div className="hidden md:flex items-center gap-6">
            {(store?.menu_links || []).map((link: any, index: number) => (
              <a key={index} href={link.url} className="text-sm font-bold text-gray-600 hover:text-xsrimary transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="flex-1 max-w-xl relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder={t.dashboard.searchProducts}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-lg transition-all outline-none text-sm font-medium"
              style={{ '--tw-ring-color': primaryColor } as any}
            />
          </div>

          <div className="flex items-center gap-3">
            {customer ? (
              <div className="relative" ref={accountMenuRef}>
                <button 
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xss font-bold shadow-md" style={{ backgroundColor: primaryColor }}>
                    {customer.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-700 hidden sm:block">{lang === 'tr' ? 'Hesabım' : 'My Account'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
                    >
                      <button onClick={() => { navigate(getStorePath("/profile")); setIsAccountMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm font-bold flex items-center gap-2">
                        <User className="w-4 h-4" /> {lang === 'tr' ? 'Profilim' : 'My Profile'}
                      </button>
                      <button onClick={() => { navigate(getStorePath("/orders")); setIsAccountMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm font-bold flex items-center gap-2">
                        <Package className="w-4 h-4" /> {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
                      </button>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-sm font-bold flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> {lang === 'tr' ? 'Çıkış Yap' : 'Logout'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-100 rounded-lg transition-all group"
              >
                <User className="w-5 h-5 text-gray-700 group-hover:text-xsrimary transition-colors" />
                <span className="text-sm font-bold text-gray-700 hidden sm:block">{lang === 'tr' ? 'Giriş Yap' : 'Login'}</span>
              </button>
            )}
            <button 
              onClick={() => setIsBasketOpen(true)}
              className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-all active:scale-95 group"
            >
              <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-xsrimary transition-colors" />
              {basketCount > 0 && (
                <span 
                  className="absolute top-1 right-1 text-white text-[9px] font-semibold w-4 h-4 flex items-center justify-center rounded-lg shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {basketCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

          {/* Premium Category Showcase */}
          {layoutSettings.show_stories && Array.from(categories.keys()).length > 0 && (
            <section className="bg-white py-16 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
                  <div className="space-y-2">
                    <h3 className={`text-[10px] font-semibold uppercase tracking-[0.4em] mb-2 ${isLuxury ? 'text-amber-500' : 'text-indigo-600'}`}>
                      {lang === 'tr' ? 'KOLEKSİYONLAR' : 'COLLECTIONS'}
                    </h3>
                    <h2 className={`text-4xl md:text-4xl md:text-4xl tracking-tight text-slate-900 ${isLuxury ? '!font-sans !font-bold' : 'font-semibold font-display tracking-tighter'}`}>
                      {categoriesLabel}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-xss font-bold text-slate-400 tracking-wide">
                    <div className="w-12 h-[1px] bg-slate-200"></div>
                    {lang === 'tr' ? 'Seçkin Seçkiler' : 'Curated Selections'}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {Array.from(categories.keys()).sort().map((cat, idx) => {
                    const firstProduct = products.find(p => p.category === cat);
                    const isLarge = idx % 5 === 0;
                    return (
                      <motion.div
                        key={`cat-grid-${cat}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        viewport={{ once: true }}
                        onClick={() => {
                          setSelectedCategory(cat);
                          document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`group relative overflow-hidden rounded-xl cursor-pointer bg-slate-50 transition-all duration-700 hover:shadow-lg hover:-translate-y-2 ${isLarge ? 'md:col-span-2 md:row-span-1' : ''}`}
                        style={{ height: isLarge ? '260px' : '260px' }}
                      >
                        <div className="absolute inset-0 z-0">
                          {firstProduct?.image_url ? (
                            <img 
                              src={firstProduct.image_url} 
                              alt={cat} 
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                              <Tag className="w-12 h-12" />
                            </div>
                          )}
                          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-90`} />
                        </div>
                        
                        <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                          <span className="text-[10px] font-semibold text-white/60 tracking-wide mb-1 group-hover:text-white transition-colors">
                            {products.filter(p => p.category === cat).length} {productLabel}
                          </span>
                          <h4 className={`text-xsl md:text-2xl font-semibold text-white tracking-tight leading-tight group-hover:translate-x-2 transition-transform duration-500`}>
                            {cat}
                          </h4>
                          <div className="mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                             <div className="flex items-center gap-2 text-white text-[10px] font-semibold tracking-wide">
                               {lang === 'tr' ? 'Keşfet' : 'Discover'}
                               <Plus className="w-3 h-3" />
                             </div>
                          </div>
                        </div>

                        {selectedCategory === cat && (
                          <div className="absolute top-6 right-6 z-20 w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-900 shadow-xl border border-white/50">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

      {/* Main Content Area */}
      {!isProfileView && !isOrdersView && !isReturnView ? (
        <>
          {/* Hero Section */}
          <section className="relative min-h-[60vh] md:min-h-[85vh] flex items-center overflow-hidden bg-slate-950">
            <motion.div 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.7 }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="absolute inset-0 z-0"
            >
              {store?.hero_image_url ? (
                <img 
                  src={store.hero_image_url} 
                  alt={store.hero_title || store.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img 
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2048&auto=format&fit=crop" 
                  alt="Store Hero" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </motion.div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
            <div className="absolute inset-0 bg-slate-950/20 z-10" />

            <div className="container max-w-7xl mx-auto px-4 md:px-8 relative z-20">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-4 mb-8"
                >
                  <div className="w-12 h-0.5 bg-white/40" />
                  <span className="text-white/80 text-xss font-semibold uppercase tracking-[0.4em]">
                    {store?.name}
                  </span>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className={`text-4xl md:text-4xl md:text-9xl text-white mb-6 leading-[0.85] tracking-tight text-balance ${isLuxury ? '!font-sans !font-bold' : 'font-semibold font-display tracking-tighter'}`}
                >
                  {store?.hero_title || store?.name}
                </motion.h2>

                {store?.hero_subtitle && (
                  <motion.p 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="text-xsl md:text-3xl text-white/60 font-medium max-w-2xl leading-relaxed mb-12 text-balance"
                  >
                    {store.hero_subtitle}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 }}
                  className="flex flex-wrap gap-4"
                >
                  <button 
                    onClick={() => setShowDiscoverModal(true)}
                    className="px-10 py-5 bg-white text-slate-950 rounded-lg font-semibold text-sm tracking-wide hover:bg-opacity-90 transition-all active:scale-95 shadow-lg flex items-center gap-3"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    {lang === 'tr' ? 'Keşfet' : 'Discover Now'}
                  </button>
                </motion.div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-4 text-white/40"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">{lang === 'tr' ? 'Kaydır' : 'Scroll'}</span>
              <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent" />
            </motion.div>
          </section>

          {/* Featured / Campaign Section */}
          {layoutSettings.show_campaigns && (
          <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-32">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
              <div className="space-y-3">
                <h3 className={`text-[10px] font-semibold uppercase tracking-[0.5em] mb-2 ${isLuxury ? 'text-amber-500' : 'text-blue-600'}`}>
                  {lang === 'tr' ? 'HAFTANIN FIRSATLARI' : 'DEALS OF THE WEEK'}
                </h3>
                <h2 className={`text-4xl md:text-4xl md:text-4xl tracking-tight text-slate-900 ${isLuxury ? '!font-sans !font-bold' : 'font-semibold font-display tracking-tighter'}`}>
                  {lang === 'tr' ? 'Kampanyalı Ürünler' : 'Special Campaigns'}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xss font-bold text-slate-400 tracking-wide">
                <span className="w-16 h-[1px] bg-slate-100"></span>
                <span className="text-slate-900 font-semibold">{products.length}</span> {lang === 'tr' ? 'Parça' : 'Items'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(products.some(p => p.labels?.includes('Kampanya') || p.labels?.includes('Fırsat')) 
                ? products.filter(p => p.labels?.includes('Kampanya') || p.labels?.includes('Fırsat'))
                : products
              ).slice(0, 4).map((product, idx) => (
                <motion.div 
                  key={`featured-${product.id}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                  className="group relative cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="aspect-[1/1] object-contain p-4 rounded-2xl overflow-hidden bg-slate-50 mb-8 relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-2 transition-all duration-700 font-sans">
                    {/* Discount Badge */}
                    {product.old_price && (
                      <div className="absolute top-8 right-8 z-10 w-14 h-14 bg-white rounded-lg flex items-center justify-center text-red-600 text-xss font-semibold shadow-xl">
                        -{Math.round((1 - product.price / product.old_price) * 100)}%
                      </div>
                    )}
                    
                    <img 
                      src={product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop"} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />
                    
                    <div className="absolute bottom-8 left-8 right-8 flex justify-center translate-y-20 group-hover:translate-y-0 transition-transform duration-700">
                       <button className="w-full py-4 bg-white text-slate-950 rounded-2xl font-semibold text-[10px] tracking-wide shadow-lg">
                         {lang === 'tr' ? 'İncele' : 'View Details'}
                       </button>
                    </div>
                  </div>

                  <div className="px-4 text-center">
                    <h4 className={`text-xsl text-slate-900 mb-2 truncate ${isLuxury ? '!font-sans !font-medium' : 'font-semibold'}`}>
                      {product.name}
                    </h4>
                    {(() => {
                      let labels: string[] = [];
                      
                      if (Array.isArray(product.labels)) {
                        labels = product.labels;
                      } else if (typeof product.labels === 'string') {
                        // Remove all non-alphanumeric characters except spaces and Turkish chars, 
                        // treat as comma separated to extract clean labels.
                        labels = (product.labels as string)
                          .replace(/[^a-zA-Z0-9çÇğĞışİÖöÜü\s,]/g, '') 
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean);
                      }
                      
                      if (labels.length === 0) return null;

                      return (
                        <div className="flex flex-wrap gap-1 justify-center mb-2">
                          {labels.map((label, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] uppercase font-black rounded-md tracking-wider">
                              {label}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xsl font-semibold text-slate-900 font-sans tracking-tight">{formatPrice(product.price)}</span>
                      {product.old_price && (
                        <span className="text-sm font-medium text-slate-400 line-through decoration-red-500/50 font-sans tracking-tight">{formatPrice(product.old_price)}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
          )}

          {/* Removed category boxes section */}

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8" id="products-grid">
        {/* Search Bar & Filters */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div>
              <h2 className={`text-4xl md:text-4xl md:text-4xl text-slate-900 tracking-tight mb-4 ${isLuxury ? '!font-sans !font-bold' : 'font-semibold font-display tracking-tighter'}`}>
                {selectedCategory || t.dashboard.allProducts}
              </h2>
              <p className="text-slate-400 font-bold tracking-wide text-[10px]">
                <span className="text-slate-900">{sortedAndFilteredProducts.length}</span> {t.dashboard.productsFound || 'ürün listeleniyor'}
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-xsrimary transition-colors" />
                <input 
                  type="text"
                  placeholder={t.dashboard.searchProducts}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 focus:border-primary rounded-2xl transition-all outline-none text-sm font-medium shadow-sm"
                />
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-11 pr-12 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-50 transition-all shadow-sm min-w-[160px]"
                >
                  <option value="default">{t.dashboard.newest || (lang === 'tr' ? 'Varsayılan' : 'Default')}</option>
                  <option value="priceAsc">{t.dashboard.priceLow || (lang === 'tr' ? 'En Düşük Fiyat' : 'Price: Low to High')}</option>
                  <option value="priceDesc">{t.dashboard.priceHigh || (lang === 'tr' ? 'En Yüksek Fiyat' : 'Price: High to Low')}</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-900 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Category Scroll */}
        <div className="lg:hidden mb-8 -mx-4 px-4 overflow-x-auto custom-scrollbar flex items-center gap-2 pb-2">
          <button
            onClick={() => { 
                setSelectedCategory(null); 
                setSelectedSubCategory(null);
                document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex-shrink-0 px-6 py-2.5 rounded-lg text-xss font-semibold transition-all border whitespace-nowrap ${
                !selectedCategory 
                ? "bg-gray-900 text-white border-gray-900 shadow-lg" 
                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
            }`}
          >
            {t.dashboard.all}
          </button>
          
          {Array.from(categories.keys()).sort().map(cat => (
            <button
              key={cat}
              onClick={() => {
                if (selectedCategory === cat) {
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                } else {
                    setSelectedCategory(cat);
                    setSelectedSubCategory(null);
                }
              }}
              className={`flex-shrink-0 px-6 py-2.5 rounded-lg text-xss font-semibold transition-all border whitespace-nowrap ${
                selectedCategory === cat 
                ? "bg-gray-900 text-white border-gray-900 shadow-lg" 
                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}

          <button 
            onClick={() => setShowMobileFilters(true)}
            className="flex-shrink-0 w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all ml-2 sticky right-0 shadow-lg"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-12">
              {/* Categories */}
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
                  <Filter className="w-4 h-4" />
                  {categoriesLabel}
                </h3>
                
                {/* Removed sidebar category search bar */}

                <div className="space-y-1">
                  <button
                    onClick={() => { 
                      setSelectedCategory(null); 
                      setSelectedSubCategory(null);
                      document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-5 py-3 rounded-xl text-xss font-bold transition-all flex items-center justify-between group ${
                      !selectedCategory ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <div className={`w-1 h-1 rounded-lg ${!selectedCategory ? "bg-primary" : "bg-gray-300"}`}></div>
                      {t.dashboard.all}
                    </span>
                    <span className="text-[9px] opacity-50">{products.length}</span>
                  </button>

                  <div className="space-y-1">
                    {Array.from(categories.keys())
                      .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                      .sort()
                      .slice(0, showAllCategories ? undefined : 5)
                      .map(cat => (
                      <div key={cat} className="space-y-1">
                        <button
                          onClick={() => {
                            if (selectedCategory === cat) {
                              toggleCategory(cat);
                            } else {
                              setSelectedCategory(cat);
                              setSelectedSubCategory(null);
                              if (!expandedCategories.has(cat)) toggleCategory(cat);
                              document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className={`w-full text-left px-5 py-3 rounded-xl text-xss font-bold transition-all flex items-center justify-between group ${
                            selectedCategory === cat ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-1 rounded-lg transition-colors ${selectedCategory === cat ? "bg-primary" : "bg-gray-300 group-hover:bg-gray-400"}`}></div>
                            <span className="truncate">{cat}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] opacity-50">{products.filter(p => p.category === cat).length}</span>
                            {categories.get(cat)!.size > 0 && (
                              <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${expandedCategories.has(cat) ? "rotate-90" : ""}`} />
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {expandedCategories.has(cat) && categories.get(cat)!.size > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-8 space-y-1"
                            >
                              {Array.from(categories.get(cat)!).sort().map(sub => (
                                <button
                                  key={sub}
                                  onClick={() => {
                                    setSelectedSubCategory(sub);
                                    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className={`w-full text-left px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                                    selectedSubCategory === sub ? "text-xsrimary bg-primary/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className={`w-1 h-1 rounded-lg ${selectedSubCategory === sub ? "bg-primary" : "bg-transparent"}`}></div>
                                  <span className="truncate">{sub}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    
                    {Array.from(categories.keys()).length > 5 && (
                      <button 
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="w-full text-center py-1.5 text-[10px] font-semibold text-xsrimary tracking-wide hover:bg-primary/5 rounded-lg transition-all"
                      >
                        {showAllCategories ? (lang === 'tr' ? 'Daha Az' : 'Show Less') : (lang === 'tr' ? 'Tümünü Gör' : 'Show All')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
                    <Tag className="w-4 h-4" />
                    {brandsLabel}
                  </h3>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={lang === 'tr' ? `${brandLabel} Ara...` : `Search ${brandLabel}...`}
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="flex flex-wrap gap-2">
                        {brands
                          .filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase()))
                          .map(brand => (
                          <button
                            key={brand}
                            onClick={() => {
                              setSelectedBrand(brand === selectedBrand ? null : brand);
                              setSearchQuery("");
                              document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                              selectedBrand === brand 
                                ? "bg-gray-900 text-white border-gray-900 shadow-md" 
                                : "bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                        {brands.filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                          <div className="w-full text-center py-4 text-gray-400 text-sm">
                            {lang === 'tr' ? `${brandLabel} bulunamadı.` : `No ${brandLabel.toLowerCase()}s found.`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {store?.page_layout && store.page_layout.length > 0 ? (
              <div className="space-y-24">
                {store.page_layout.map((section: any) => {
                  switch (section.type) {
                    case 'hero':
                      return (
                        <section key={section.id} className="relative h-[600px] flex items-center justify-center rounded-2xl overflow-hidden">
                          <img src={store.hero_image_url} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40" />
                          <div className="relative z-10 text-center text-white p-8">
                            <h1 className="text-4xl md:text-4xl font-semibold mb-4">{store.hero_title}</h1>
                            <p className="text-xsl">{store.hero_subtitle}</p>
                          </div>
                        </section>
                      );
                    case 'featured':
                      return (
                        <section key={section.id}>
                          <h2 className="text-3xl font-semibold text-gray-900 mb-10">{t.dashboard.featuredProducts}</h2>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {featuredProducts.map(p => (
                              <ProductCard 
                                key={p.id} 
                                product={p} 
                                store={store} 
                                t={t} 
                                addToBasket={addToBasket} 
                                onView={setSelectedProduct} 
                                primaryColor={primaryColor} 
                                isLuxury={isLuxury}
                                sector={sector}
                              />
                            ))}
                          </div>
                        </section>
                      );
                    case 'blog':
                      return (
                        <section key={section.id} id="blog" className="py-12">
                          <div className="flex items-center justify-between mb-10">
                            <h2 className="text-4xl font-semibold text-gray-900 tracking-tight">{isTr ? 'Blog Yazıları' : 'Blog Posts'}</h2>
                            <div className="hidden md:flex items-center space-x-2 text-sm font-semibold text-indigo-600 tracking-wide">
                              <Sparkles className="w-4 h-4" />
                              <span>{isTr ? 'YENİ İÇERİKLER' : 'NEW CONTENT'}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {store.blog_posts?.map(post => (
                              <motion.div 
                                key={post.id} 
                                whileHover={{ y: -8 }}
                                onClick={() => setSelectedBlogPost(post)}
                                className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-500"
                              >
                                <div className="relative h-64 overflow-hidden">
                                  <img 
                                    src={post.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60'} 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-xss font-semibold text-indigo-600 tracking-wide">
                                      {isTr ? 'Okumaya Devam Et' : 'Read More'}
                                    </span>
                                  </div>
                                </div>
                                <div className="p-8">
                                  <div className="flex items-center gap-3 mb-4">
                                    <span className="text-[10px] font-semibold text-indigo-600 tracking-wide bg-indigo-50 px-2 py-1 rounded-md">
                                      {post.date}
                                    </span>
                                    <span className="w-1 h-1 rounded-lg bg-gray-300" />
                                    <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                                      {Math.ceil((post.content?.length || 0) / 1000)} {isTr ? 'DAKİKA' : 'MIN READ'}
                                    </span>
                                  </div>
                                  <h4 className="text-xsl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {post.title}
                                  </h4>
                                  <p className="text-gray-500 text-sm leading-relaxed font-medium line-clamp-3">
                                    {post.excerpt}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </section>
                      );
                    case 'about':
                      return (
                        <section key={section.id} id="about" className="bg-gray-50 p-8 rounded-2xl">
                          <h2 className="text-3xl font-semibold text-gray-900 mb-6">{lang === 'tr' ? 'Hakkımızda' : 'About Us'}</h2>
                          <p className="text-gray-600 leading-relaxed">{store.about_text}</p>
                        </section>
                      );
                    case 'contact':
                      return (
                        <section key={section.id} id="contact" className="bg-gray-900 text-white p-8 rounded-2xl">
                          <h2 className="text-3xl font-semibold mb-6">{lang === 'tr' ? 'İletişim' : 'Contact'}</h2>
                          <p>{store.address}</p>
                          <p>{store.email}</p>
                          <p>{store.phone}</p>
                        </section>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ) : (
              // Fallback to original layout if no page_layout
              sortedAndFilteredProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-6">
                    <AnimatePresence mode="popLayout">
                      {paginatedProducts.map((product) => (
                          <ProductCard 
                            key={product.id} 
                            product={product} 
                            store={store} 
                            t={t} 
                            onView={setSelectedProduct}
                            addToBasket={addToBasket}
                            primaryColor={primaryColor}
                            isLuxury={isLuxury}
                            sector={sector}
                          />
                      ))}
                    </AnimatePresence>
                  </div>
                  {/* ... pagination ... */}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-xl mb-8">
                    <Package className="w-12 h-12 text-gray-200" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.noProductsFound}</h3>
                  <p className="text-gray-400 font-medium max-w-xs">{t.dashboard.noProductsDesc}</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* New Arrivals Section */}
        {!selectedCategory && !searchQuery && newArrivals.length > 0 && (
          <section className="mt-32">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">{t.dashboard.newArrivals}</h2>
                <div className="h-1.5 w-20 mt-2 rounded-lg" style={{ backgroundColor: primaryColor }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  store={store} 
                  t={t} 
                  addToBasket={addToBasket} 
                  onView={setSelectedProduct} 
                  primaryColor={primaryColor} 
                  isLuxury={isLuxury}
                  sector={sector}
                />
              ))}
            </div>
          </section>
        )}

        {/* Best Sellers Section */}
        {!selectedCategory && !searchQuery && bestSellers.length > 0 && (
          <section className="mt-32">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">{t.dashboard.bestSellers}</h2>
                <div className="h-1.5 w-20 mt-2 rounded-lg" style={{ backgroundColor: primaryColor }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {bestSellers.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  store={store} 
                  t={t} 
                  addToBasket={addToBasket} 
                  onView={setSelectedProduct} 
                  primaryColor={primaryColor} 
                  isLuxury={isLuxury}
                  sector={sector}
                />
              ))}
            </div>
          </section>
        )}

      </main>
      </>
      ) : (
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-1.54">
          {isProfileView && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-3">
                  {/* Profile Sidebar */}
                  <div className="bg-gray-50 p-6 md:p-8 border-r border-gray-100">
                    <div className="flex flex-col items-center text-center mb-10">
                      <div className="w-24 h-24 bg-white rounded-xl shadow-xl flex items-center justify-center mb-6 border-4 border-white">
                        <User className="w-10 h-10 text-gray-900" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tighter mb-1">
                        {customerProfile?.name} {customerProfile?.surname}
                      </h2>
                      <p className="text-gray-400 text-xss font-bold tracking-wide">{customerProfile?.email}</p>
                    </div>

                    <nav className="space-y-2">
                      <button 
                        onClick={() => { setIsEditingProfile(false); navigate(`/s/${slug}/profile`); }}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${isProfileView ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-white'}`}
                      >
                        <User className="w-5 h-5" />
                        {lang === 'tr' ? 'Profil Bilgilerim' : 'My Profile'}
                      </button>
                      <button 
                        onClick={() => navigate(`/s/${slug}/orders`)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${isOrdersView ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-white'}`}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
                      </button>
                      <button 
                        onClick={() => navigate(`/s/${slug}/return`)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${isReturnView ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-white'}`}
                      >
                        <RotateCcw className="w-5 h-5" />
                        {lang === 'tr' ? 'İade Taleplerim' : 'Return Requests'}
                      </button>
                      <div className="pt-8">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm text-red-500 hover:bg-red-50 transition-all"
                        >
                          <LogOut className="w-5 h-5" />
                          {lang === 'tr' ? 'Çıkış Yap' : 'Logout'}
                        </button>
                      </div>
                    </nav>
                  </div>

                  {/* Profile Content */}
                  <div className="lg:col-span-2 p-6 md:p-16">
                    <div className="flex items-center justify-between mb-12">
                      <h3 className="text-3xl font-bold text-gray-900 tracking-tighter">
                        {isEditingProfile ? (lang === 'tr' ? 'Profili Düzenle' : 'Edit Profile') : (lang === 'tr' ? 'Hesap Detayları' : 'Account Details')}
                      </h3>
                      {!isEditingProfile && (
                        <button 
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold text-xss transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                          {lang === 'tr' ? 'Düzenle' : 'Edit'}
                        </button>
                      )}
                    </div>

                    {customerProfile ? (
                      isEditingProfile ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'ADINIZ' : 'NAME'}</label>
                              <input 
                                required
                                type="text"
                                value={profileEditForm.name || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'SOYADINIZ' : 'SURNAME'}</label>
                              <input 
                                required
                                type="text"
                                value={profileEditForm.surname || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, surname: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">E-POSTA</label>
                              <input 
                                required
                                type="email"
                                value={profileEditForm.email || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{t.dashboard.phone}</label>
                              <input 
                                required
                                type="tel"
                                value={profileEditForm.phone || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'ÜLKE' : 'COUNTRY'}</label>
                              <input 
                                required
                                type="text"
                                value={profileEditForm.country || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, country: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'İL' : 'CITY'}</label>
                              <input 
                                required
                                type="text"
                                value={profileEditForm.city || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'T.C. KİMLİK NUMARASI' : 'TC ID'}</label>
                              <input 
                                type="text"
                                value={profileEditForm.tc_id || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, tc_id: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2 flex flex-col justify-center">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1 mb-2">{lang === 'tr' ? 'HESAP TÜRÜ' : 'ACCOUNT TYPE'}</label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="edit_is_corporate" 
                                    checked={!profileEditForm.is_corporate} 
                                    onChange={() => setProfileEditForm(prev => ({ ...prev, is_corporate: false }))}
                                    className="w-4 h-4 text-xsrimary focus:ring-primary"
                                  />
                                  <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Bireysel' : 'Individual'}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="edit_is_corporate" 
                                    checked={profileEditForm.is_corporate} 
                                    onChange={() => setProfileEditForm(prev => ({ ...prev, is_corporate: true }))}
                                    className="w-4 h-4 text-xsrimary focus:ring-primary"
                                  />
                                  <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Kurumsal' : 'Corporate'}</span>
                                </label>
                              </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{t.dashboard.address}</label>
                              <textarea 
                                required
                                value={profileEditForm.address || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900 resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="flex gap-4 pt-6">
                            <button 
                              type="button"
                              onClick={() => {
                                setIsEditingProfile(false);
                                setProfileEditForm(customerProfile);
                              }}
                              className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-semibold transition-all"
                            >
                              {lang === 'tr' ? 'İptal' : 'Cancel'}
                            </button>
                            <button 
                              type="submit"
                              className="flex-1 py-5 text-white rounded-2xl font-semibold transition-all shadow-xl active:scale-95"
                              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                            >
                              {lang === 'tr' ? 'Kaydet' : 'Save'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-8">
                            <div>
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide mb-2 block">Kişisel Bilgiler</label>
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xss text-gray-400 font-bold tracking-wide">{lang === 'tr' ? 'Ad Soyad' : 'Full Name'}</p>
                                    <p className="text-base font-semibold text-gray-900">{customerProfile.name} {customerProfile.surname}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <Mail className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xss text-gray-400 font-bold tracking-wide">E-posta</p>
                                    <p className="text-base font-semibold text-gray-900">{customerProfile.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <CreditCard className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xss text-gray-400 font-bold tracking-wide">{lang === 'tr' ? 'T.C. Kimlik No' : 'TC ID'}</p>
                                    <p className="text-base font-semibold text-gray-900">{customerProfile.tc_id || '-'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <Building2 className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xss text-gray-400 font-bold tracking-wide">{lang === 'tr' ? 'Hesap Türü' : 'Account Type'}</p>
                                    <p className="text-base font-semibold text-gray-900">{customerProfile.is_corporate ? (lang === 'tr' ? 'Kurumsal' : 'Corporate') : (lang === 'tr' ? 'Bireysel' : 'Individual')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div>
                              <label className="text-[10px] font-semibold text-gray-400 tracking-wide mb-2 block">Adres Bilgileri</label>
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xss text-gray-400 font-bold tracking-wide">{lang === 'tr' ? 'Konum' : 'Location'}</p>
                                    <p className="text-base font-semibold text-gray-900">{customerProfile.city}, {customerProfile.country}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 mt-1">
                                    <Home className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xss text-gray-400 font-bold tracking-wide">{lang === 'tr' ? 'Tam Adres' : 'Full Address'}</p>
                                    <p className="text-base font-semibold text-gray-900 leading-tight">{customerProfile.address}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-16">
                        <Loader2 className="w-10 h-10 animate-spin text-xsrimary mx-auto mb-4" />
                        <p className="text-gray-500 font-bold">{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {isOrdersView && (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tighter">
                  {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
                </h2>
                <div className="px-4 py-1.5 bg-gray-100 rounded-lg text-[10px] font-semibold text-gray-500 tracking-wide">
                  {orders.length} {lang === 'tr' ? 'SİPARİŞ' : 'ORDERS'}
                </div>
              </div>
              
              {loadingOrders ? (
                <div className="bg-white rounded-lg p-20 text-center border border-gray-100">
                  <Loader2 className="w-10 h-10 animate-spin text-xsrimary mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">{lang === 'tr' ? 'Siparişler yükleniyor...' : 'Loading orders...'}</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <motion.div 
                      key={order.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-white rounded-2xl border border-gray-100 hover:border-primary/20 transition-all shadow-sm hover:shadow-xl overflow-hidden"
                    >
                      <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-xsrimary transition-colors">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-semibold text-gray-400 tracking-wide">#{order.id}</span>
                              <span className="w-1 h-1 rounded-lg bg-gray-300"></span>
                              <span className="text-[10px] font-bold text-gray-500">{new Date(order.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              {order.items_count || (order.items?.length || 1)} {lang === 'tr' ? 'Ürün' : 'Items'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-4 md:gap-8">
                          <div className="hidden sm:block">
                            <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1">{lang === 'tr' ? 'ÖDEME' : 'PAYMENT'}</p>
                            <p className="text-xss font-bold text-gray-600 flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3" />
                              {order.payment_method === 'iyzico' ? 'iyzico' : 
                               order.payment_method === 'bank_transfer' ? (lang === 'tr' ? 'Havale' : 'Transfer') :
                               order.payment_method === 'cash_on_delivery' ? (lang === 'tr' ? 'Kapıda' : 'COD') : order.payment_method}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1">{lang === 'tr' ? 'TUTAR' : 'TOTAL'}</p>
                            <p className="text-sm font-semibold text-xsrimary">
                              {order.total_amount?.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {order.currency}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1 text-right">{lang === 'tr' ? 'DURUM' : 'STATUS'}</p>
                            <span className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-semibold tracking-wide border transition-colors ${
                              order.status === 'completed' || order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                              order.status === 'shipped' || order.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              order.status === 'cancelled' || order.status === 'returned' ? 'bg-red-50 text-red-600 border-red-100' :
                              'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                              {order.status === 'pending' ? (lang === 'tr' ? 'Bekliyor' : 'Pending') :
                               order.status === 'processing' ? (lang === 'tr' ? 'Hazırlanıyor' : 'Preparing') :
                               order.status === 'shipped' ? (lang === 'tr' ? 'Kargoda' : 'Shipped') :
                               order.status === 'delivered' ? (lang === 'tr' ? 'Teslim Edildi' : 'Delivered') :
                               order.status === 'completed' ? (lang === 'tr' ? 'Tamamlandı' : 'Completed') :
                               order.status === 'cancelled' ? (lang === 'tr' ? 'İptal Edildi' : 'Cancelled') : order.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {order.notes && (
                        <div className="px-4 py-2 bg-blue-50/30 border-t border-gray-100 italic text-xss text-gray-500">
                          {lang === 'tr' ? 'Not: ' : 'Note: '}{order.notes}
                        </div>
                      )}
                      
                      {/* Shipping Info */}
                      {(order.tracking_number || order.shipping_carrier) && (
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold text-gray-400 tracking-wide">{lang === 'tr' ? 'KARGO BİLGİSİ' : 'SHIPPING INFO'}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xss font-semibold text-gray-700">{order.shipping_carrier || (lang === 'tr' ? 'Standart Kargo' : 'Standard Shipping')}</span>
                                {order.tracking_number && (
                                  <>
                                    <span className="w-1 h-1 rounded-lg bg-gray-300"></span>
                                    <span className="text-xss font-mono font-bold text-xsrimary select-all">{order.tracking_number}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {order.tracking_number && (
                            <a 
                              href={`#`} // You can add logic for carrier specific tracking URLs if needed
                              onClick={(e) => {
                                e.preventDefault();
                                // Most Turkish carriers have a tracking query page
                                const carrier = order.shipping_carrier?.toLowerCase();
                                let url = '';
                                if (carrier?.includes('aras')) url = `https://www.araskargo.com.tr/takipp-detay?kargo_no=${order.tracking_number}`;
                                else if (carrier?.includes('yurtiçi')) url = `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${order.tracking_number}`;
                                else if (carrier?.includes('mng')) url = `https://www.mngkargo.com.tr/gonderitakip/${order.tracking_number}`;
                                else if (carrier?.includes('ptt')) url = `https://gonderitakip.ptt.gov.tr/Track/Verify?id=${order.tracking_number}`;
                                else if (carrier?.includes('ups')) url = `https://www.ups.com/track?tracknum=${order.tracking_number}`;
                                
                                if (url) window.open(url, '_blank');
                              }}
                              className="px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-semibold text-gray-600 hover:border-primary hover:text-xsrimary transition-all flex items-center gap-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {lang === 'tr' ? 'KARGO TAKİP' : 'TRACK SHIPPING'}
                            </a>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-20 text-center border border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-bold">{lang === 'tr' ? 'Henüz bir siparişiniz bulunmuyor.' : 'You don\'t have any orders yet.'}</p>
                </div>
              )}
            </div>
          )}
          {isReturnView && (
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 border border-gray-100">
              <h2 className="text-3xl font-semibold text-gray-900 mb-8">{lang === 'tr' ? 'İade Taleplerim' : 'My Return Requests'}</h2>
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                  <RotateCcw className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold">{lang === 'tr' ? 'Aktif bir iade veya değişim talebiniz bulunmuyor.' : 'You don\'t have any active return or exchange requests.'}</p>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-[3rem] z-[101] overflow-hidden flex flex-col shadow-lg"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 tracking-tighter">Filtrele</h3>
                  <p className="text-xss text-gray-400 font-bold tracking-wide">{products.length} Ürün Mevcut</p>
                </div>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                {/* Mobile Subcategories */}
                {selectedCategory && categories.get(selectedCategory)!.size > 0 && (
                  <div>
                    <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-4">{t.dashboard.subCategories || 'ALT KATEGORİLER'}</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedSubCategory(null)}
                            className={`px-4 py-1.5 rounded-xl text-xss font-bold border transition-all ${
                                !selectedSubCategory ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-500 border-gray-100"
                            }`}
                        >
                            Hepsi
                        </button>
                        {Array.from(categories.get(selectedCategory)!).sort().map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubCategory(sub)}
                                className={`px-4 py-1.5 rounded-xl text-xss font-bold border transition-all ${
                                    selectedSubCategory === sub ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-500 border-gray-100"
                                }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Brands */}
                <div>
                  <h4 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-4">{brandsLabel}</h4>
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={lang === 'tr' ? `${brandLabel} Ara...` : `Search ${brandLabel}...`}
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedBrand(null)}
                        className={`px-4 py-1.5 rounded-xl text-xss font-bold border transition-all ${
                            !selectedBrand ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-500 border-gray-100"
                        }`}
                    >
                        {lang === 'tr' ? 'Hepsi' : 'All'}
                    </button>
                    {brands
                      .filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase()))
                      .map(brand => (
                        <button
                          key={brand}
                          onClick={() => setSelectedBrand(brand)}
                          className={`px-4 py-1.5 rounded-xl text-xss font-bold border transition-all ${
                            selectedBrand === brand ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-500 border-gray-100"
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50">
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-gray-900/20 active:scale-95 transition-all"
                >
                  Sonuçları Gör
                </button>
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                    setSelectedBrand(null);
                    setShowMobileFilters(false);
                  }}
                  className="w-full mt-4 py-1.5 text-gray-400 text-xss font-bold hover:text-gray-600 transition-all"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Newsletter Section */}
      {layoutSettings.show_newsletter && (
      <section className="bg-white py-1.54 px-4 md:px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-900 rounded-[4rem] p-6 md:p-24 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/30 via-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-lg blur-[100px]" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
              <div className="max-w-xl text-center lg:text-left">
                <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter mb-8 leading-[0.9]">
                  {lang === 'tr' ? 'Fırsatları Kaçırmayın' : 'Never Miss a Deal'}
                </h2>
                <p className="text-white/60 font-medium text-xsl md:text-2xl leading-relaxed">
                  {lang === 'tr' ? 'Yeni ürünler ve özel indirimlerden ilk siz haberdar olun. Hemen abone olun!' : 'Be the first to know about new products and special discounts. Subscribe now!'}
                </p>
              </div>

              <div className="w-full max-w-md">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="email" 
                      placeholder={lang === 'tr' ? 'E-posta adresiniz' : 'Your email address'}
                      className="w-full pl-16 pr-6 py-4 bg-white/10 border border-white/10 rounded-lg text-white placeholder:text-gray-500 font-bold focus:bg-white/20 focus:border-white/30 transition-all outline-none text-lg"
                    />
                  </div>
                  <button className="w-full py-4 bg-white text-gray-900 rounded-lg font-semibold text-lg tracking-wide hover:bg-blue-50 hover:scale-[0.98] transition-all shadow-lg shadow-black/20">
                    {lang === 'tr' ? 'ABONE OL VE KEŞFET' : 'SUBSCRIBE & DISCOVER'}
                  </button>
                </form>
                <div className="flex items-center justify-center lg:justify-start gap-4 mt-8 opacity-40">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-white" />
                    <span className="text-[10px] text-white font-semibold tracking-wide">KVKK GÜVENLİ</span>
                  </div>
                  <div className="w-1 h-1 rounded-lg bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-white" />
                    <span className="text-[10px] text-white font-semibold tracking-wide">SSL KORUMALI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Footer */}
      <footer className="bg-black pt-32 pb-12 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-8">
                {store?.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-blue-600 shadow-xl shadow-blue-500/20">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
                <span className="text-3xl font-bold tracking-tighter text-white">{store?.name}</span>
              </div>
              <p className="text-gray-500 text-lg font-medium max-w-md leading-relaxed mb-10">
                {store?.description || (lang === 'tr' ? 'En kaliteli ürünleri en uygun fiyatlarla sizlere sunuyoruz. Müşteri memnuniyeti bizim için her zaman önceliklidir.' : 'We offer you the highest quality products at the most affordable prices. Customer satisfaction is always our priority.')}
              </p>
              
              <div className="flex items-center gap-4">
                {[
                  { id: 'instagram_url', icon: Instagram, color: 'hover:text-xsink-500', bg: 'hover:bg-pink-500/10' },
                  { id: 'facebook_url', icon: Facebook, color: 'hover:text-blue-500', bg: 'hover:bg-blue-500/10' },
                  { id: 'twitter_url', icon: Twitter, color: 'hover:text-sky-400', bg: 'hover:bg-sky-400/10' },
                  { id: 'whatsapp_number', icon: MessageCircle, color: 'hover:text-green-500', bg: 'hover:bg-green-500/10' }
                ].map((social) => {
                  const url = store?.[social.id as keyof StoreInfo];
                  if (!url) return null;
                  
                  let href = String(url);
                  if (social.id === 'whatsapp_number') {
                    href = `https://wa.me/${href.replace(/[^0-9]/g, '')}`;
                  } else if (!href.startsWith('http')) {
                    const base = social.id.split('_')[0];
                    href = `https://${base}.com/${href}`;
                  }

                  return (
                    <a 
                      key={social.id}
                      href={href}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 transition-all duration-500 ${social.color} ${social.bg} hover:border-current hover:scale-110`}
                    >
                      <social.icon className="w-6 h-6" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xss font-semibold uppercase tracking-[0.3em] text-white/40 mb-8">{lang === 'tr' ? 'HIZLI ERİŞİM' : 'QUICK LINKS'}</h4>
              <ul className="space-y-4">
                {store?.about_text && (
                  <li>
                    <button 
                      onClick={() => setShowAboutModal(true)}
                      className="text-gray-500 hover:text-white text-sm font-bold transition-colors flex items-center gap-2 group"
                    >
                      <div className="w-1.5 h-1.5 rounded-lg bg-blue-600 scale-0 group-hover:scale-100 transition-transform" />
                      {lang === 'tr' ? 'Hakkımızda' : 'About Us'}
                    </button>
                  </li>
                )}
                {store?.locations && store.locations.length > 0 && (
                  <li>
                    <button 
                      onClick={() => setShowStoreLocatorModal(true)}
                      className="text-gray-500 hover:text-white text-sm font-bold transition-colors flex items-center gap-2 group"
                    >
                      <div className="w-1.5 h-1.5 rounded-lg bg-blue-600 scale-0 group-hover:scale-100 transition-transform" />
                      {lang === 'tr' ? 'Mağazalarımız' : 'Our Stores'}
                    </button>
                  </li>
                )}
                {(store?.menu_links || []).map((link: any, index: number) => (
                  <li key={index}>
                    <a href={link.url} className="text-gray-500 hover:text-white text-sm font-bold transition-colors flex items-center gap-2 group">
                      <div className="w-1.5 h-1.5 rounded-lg bg-blue-600 scale-0 group-hover:scale-100 transition-transform" />
                      {link.label}
                    </a>
                  </li>
                ))}
                {/* Removed 'No menu links' message to avoid UX issues */}
              </ul>
            </div>

            <div>
              <h4 className="text-xss font-semibold uppercase tracking-[0.3em] text-white/40 mb-8">{lang === 'tr' ? 'İLETİŞİM' : 'CONTACT US'}</h4>
              <ul className="space-y-6">
                {(store?.emails && store.emails.some(e => e?.trim())) ? (
                  store.emails.filter(e => e?.trim()).map((e, idx) => (
                    <li key={`email-${idx}`} className="flex items-center gap-4 text-gray-500 text-sm font-bold group">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-all">
                        <Mail className="w-4 h-4" />
                      </div>
                      {e}
                    </li>
                  ))
                ) : (
                  <li className="flex items-center gap-4 text-gray-500 text-sm font-bold group">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-blue-600/10 group-hover:text-blue-500 transition-all">
                      <Mail className="w-4 h-4" />
                    </div>
                    {store?.email || 'destek@lookprice.net'}
                  </li>
                )}
                
                {(store?.phones && store.phones.some(p => p?.trim())) ? (
                  store.phones.filter(p => p?.trim()).map((p, idx) => (
                    <li key={`phone-${idx}`} className="flex items-center gap-4 text-gray-500 text-sm font-bold group">
                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-green-600/10 group-hover:text-green-500 transition-all">
                        <Phone className="w-4 h-4" />
                      </div>
                      {p}
                    </li>
                  ))
                ) : (
                  <li className="flex items-center gap-4 text-gray-500 text-sm font-bold group">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:bg-green-600/10 group-hover:text-green-500 transition-all">
                        <Phone className="w-4 h-4" />
                      </div>
                    {store?.phone || '+90 212 000 00 00'}
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="pt-12 border-t border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-wrap items-center justify-center gap-8 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-semibold text-white tracking-wide underline underline-offset-8 decoration-blue-600">Secure Payments</span>
                  <div className="flex items-center gap-4">
                    <CreditCard className="w-5 h-5 text-white" />
                    <ShieldCheck className="w-5 h-5 text-white" />
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              <p className="text-gray-600 font-bold text-[10px] tracking-wide">
                © {new Date().getFullYear()} {store?.name}. {lang === 'tr' ? 'TÜM HAKLARI SAKLIDIR.' : 'ALL RIGHTS RESERVED.'}
              </p>

              <div className="flex items-center gap-6">
                {store?.about_text && (
                  <button onClick={() => setShowAboutModal(true)} className="text-gray-600 hover:text-white text-[10px] font-semibold tracking-wide transition-colors">
                    {lang === 'tr' ? 'Hakkımızda' : 'Our Story'}
                  </button>
                )}
                {(store?.footer_links || []).map((page: any, index: number) => (
                  <a key={index} href={page.url} className="text-gray-600 hover:text-white text-[10px] font-semibold tracking-wide transition-colors">{page.label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Element */}
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-blue-600/5 rounded-lg blur-[120px]" />
      </footer>

      {/* Floating Basket Summary (Mobile) */}
      {basketCount > 0 && !isBasketOpen && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-4 right-4 z-40 md:hidden"
        >
          <button 
            onClick={() => setIsBasketOpen(true)}
            className="w-full text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-bold"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingBasket className="w-6 h-6" />
              </div>
              <span>{basketCount} {t.dashboard.productsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </motion.div>
      )}

      {/* Basket Sidebar */}
      <AnimatePresence>
        {isBasketOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBasketOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg z-[101] flex flex-col"
            >
              <div className="p-8 border-b flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                  >
                    <ShoppingBasket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xsl font-semibold tracking-normal">{t.dashboard.cart}</h2>
                    <p className="text-gray-500 text-xss font-bold tracking-wide">{basketCount} {t.dashboard.product}</p>
                  </div>
                </div>
                <button onClick={() => setIsBasketOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {basket.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6">
                      <ShoppingBasket className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-xsl font-semibold text-gray-900">{t.dashboard.emptyBasket}</h3>
                    <p className="text-gray-500 mt-2 max-w-[200px]">{t.dashboard.startShopping}</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {basket.map((item) => (
                      <div key={item.id} className="flex gap-6 group">
                        <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-10 h-10" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:opacity-80 transition-colors" style={{ color: primaryColor }}>{item.name}</h4>
                            <p className="font-semibold mt-1" style={{ color: primaryColor }}>
                              {(basketItemPrices[item.id] || item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                              <button 
                                onClick={() => removeFromBasket(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm active:scale-90"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-semibold w-8 text-center text-sm">{item.quantity}</span>
                              <button 
                                onClick={() => addToBasket(item)}
                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm active:scale-90"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button 
                              onClick={() => {
                                setBasket(prev => prev.filter(i => i.id !== item.id));
                              }}
                              className="text-red-400 hover:text-red-600 p-2 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {basket.length > 0 && (
                <div className="p-8 border-t bg-gray-50 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-gray-500 text-sm font-bold tracking-wide">
                      <span>{t.dashboard.subtotal}</span>
                      <span>{basketSubtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}</span>
                    </div>
                    <div className="flex items-center justify-between text-green-600 text-sm font-bold tracking-wide">
                      <span>{t.dashboard.shipping}</span>
                      <span>
                        {basketShippingTotal > 0 
                          ? `${basketShippingTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${store?.currency || "TL"}`
                          : t.dashboard.freeShipping
                        }
                      </span>
                    </div>
                    <div className="h-px bg-gray-200 my-4"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-semibold tracking-wide">{t.dashboard.total}</span>
                      <span className="text-3xl font-semibold" style={{ color: primaryColor }}>
                        {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full py-5 text-white rounded-2xl font-semibold text-xsl transition-all shadow-lg active:scale-95 tracking-wide"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                  >
                    {t.dashboard.checkout}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAQ Modal */}
      <AnimatePresence>
        {showFaq && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFaq(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-lg relative z-10 overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-8 border-b flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-normal">{lang === 'tr' ? 'Sıkça Sorulan Sorular' : 'FAQ'}</h2>
                <button onClick={() => setShowFaq(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto space-y-4">
                {store?.faq?.length ? store.faq.map((item, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">{item.question}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                  </div>
                )) : (
                  <p className="text-center text-gray-400 py-10">{lang === 'tr' ? 'Henüz soru eklenmemiş.' : 'No questions added yet.'}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blog Modal */}
      <AnimatePresence>
        {showBlog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlog(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[40px] shadow-lg relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-normal">{lang === 'tr' ? 'Blog' : 'Blog'}</h2>
                <button onClick={() => setShowBlog(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar">
                {selectedBlogPost ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <button 
                      onClick={() => setSelectedBlogPost(null)} 
                      className="group mb-8 flex items-center gap-2 text-sm font-semibold text-indigo-600 tracking-wide hover:text-indigo-700 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                      {lang === 'tr' ? 'TÜM YAZILAR' : 'ALL POSTS'}
                    </button>
                    
                    {selectedBlogPost.image_url && (
                      <div className="relative h-96 rounded-xl overflow-hidden mb-10 shadow-lg">
                        <img 
                          src={selectedBlogPost.image_url} 
                          alt={selectedBlogPost.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}
                    
                    <div className="max-w-2xl mx-auto">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-semibold tracking-wide leading-none">
                          {selectedBlogPost.date}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-lg bg-gray-200" />
                        <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                          {Math.ceil((selectedBlogPost.content?.length || 0) / 1000)} {isTr ? 'DAKİKA OKUMA' : 'MIN READ'}
                        </span>
                      </div>
                      
                      <h3 className="text-4xl md:text-4xl font-semibold text-gray-900 leading-tight mb-10 tracking-tight">
                        {selectedBlogPost.title}
                      </h3>
                      
                      <div className="whitespace-pre-wrap text-gray-600 text-lg leading-relaxed font-normal space-y-6">
                        {selectedBlogPost.content}
                      </div>

                      {/* Social Share for Blog */}
                      <div className="mt-16 pt-10 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <span className="text-xss font-semibold text-gray-400 tracking-wide">{isTr ? 'PAYLAŞ:' : 'SHARE:'}</span>
                          <div className="flex items-center gap-2">
                             <button className="p-3 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all"><Facebook className="w-5 h-5" /></button>
                             <button className="p-3 bg-gray-50 hover:bg-sky-50 hover:text-sky-600 rounded-2xl transition-all"><Twitter className="w-5 h-5" /></button>
                             <button className="p-3 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-2xl transition-all"><MessageSquare className="w-5 h-5" /></button>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert(isTr ? 'Bağlantı kopyalandı!' : 'Link copied!');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-2xl font-semibold text-xss tracking-wide hover:bg-gray-800 transition-all active:scale-95"
                        >
                          <Link2 className="w-4 h-4" />
                          <span>{isTr ? 'BAĞLANTIYI KOPYALA' : 'COPY LINK'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {store?.blog_posts?.length ? store.blog_posts.map((post) => (
                      <motion.div 
                        key={post.id} 
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedBlogPost(post)} 
                        className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative h-56 overflow-hidden">
                          {post.image_url ? (
                            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                               <BookOpen className="w-12 h-12 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-8">
                          <span className="text-[10px] font-semibold text-indigo-600 tracking-wide mb-3 block">
                            {post.date}
                          </span>
                          <h4 className="text-xsl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">{post.title}</h4>
                          <p className="text-gray-500 text-sm font-medium line-clamp-3 leading-relaxed">{post.excerpt || post.content}</p>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="col-span-full text-center py-16 px-8">
                        <div className="p-6 bg-slate-50 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-6 text-slate-300">
                           <BookOpen className="w-10 h-10" />
                        </div>
                        <p className="text-xsl font-semibold text-slate-900 mb-2">{isTr ? 'Henüz Yazı Yok' : 'No Posts Yet'}</p>
                        <p className="text-slate-500 font-medium">{isTr ? 'Yakında yeni içeriklerimizle burada olacağız.' : 'We will be here with new content soon.'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legal Modal */}
      <AnimatePresence>
        {showLegal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLegal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[40px] shadow-lg relative z-10 overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-8 border-b flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-normal">
                  {showLegal === 'kvkk' ? (lang === 'tr' ? 'KVKK ve Gizlilik Politikası' : 'Privacy Policy') : 
                   showLegal === 'sales' ? (lang === 'tr' ? 'Mesafeli Satış Sözleşmesi' : 'Sales Agreement') : 
                   (lang === 'tr' ? 'Ön Bilgilendirme Formu' : 'Pre-Information Form')}
                </h2>
                <button onClick={() => setShowLegal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto prose prose-blue max-w-none text-gray-600 leading-relaxed">
                {showLegal === 'kvkk' ? store?.legal_pages?.kvkk?.content : 
                 showLegal === 'sales' ? store?.legal_pages?.sales_agreement?.content : 
                 store?.legal_pages?.pre_info?.content}
                {!store?.legal_pages?.[showLegal === 'kvkk' ? 'kvkk' : showLegal === 'sales' ? 'sales_agreement' : 'pre_info'] && (
                  <p className="text-center text-gray-400 py-10">{lang === 'tr' ? 'İçerik henüz eklenmemiş.' : 'Content not added yet.'}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-lg relative z-10 overflow-y-auto max-h-[90vh]"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setAuthMode('login')}
                      className={`text-2xl font-semibold tracking-tight transition-colors ${authMode === 'login' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                      {lang === 'tr' ? 'GİRİŞ YAP' : 'LOGIN'}
                    </button>
                    <button 
                      onClick={() => setAuthMode('register')}
                      className={`text-2xl font-semibold tracking-tight transition-colors ${authMode === 'register' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                      {lang === 'tr' ? 'ÜYE OL' : 'REGISTER'}
                    </button>
                  </div>
                  <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={authMode === 'login' ? handleCustomerLogin : handleCustomerRegister} className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'ADINIZ' : 'NAME'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'SOYADINIZ' : 'SURNAME'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.surname}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, surname: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">E-POSTA</label>
                    <input 
                      required
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                      style={{ borderFocusColor: primaryColor } as any}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">ŞİFRE</label>
                      <input 
                        required
                        type="password"
                        value={customerInfo.password}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                        style={{ borderFocusColor: primaryColor } as any}
                      />
                    </div>
                    {authMode === 'register' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'ŞİFRE TEKRAR' : 'PASSWORD CONFIRM'}</label>
                        <input 
                          required
                          type="password"
                          value={customerInfo.passwordConfirm}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                          style={{ borderFocusColor: primaryColor } as any}
                        />
                      </div>
                    )}
                  </div>
                  {authMode === 'register' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{t.dashboard.phone}</label>
                        <input 
                          required
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                          style={{ borderFocusColor: primaryColor } as any}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'ÜLKE' : 'COUNTRY'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.country}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, country: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'İL' : 'CITY'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{t.dashboard.address}</label>
                        <textarea 
                          required
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900 resize-none"
                          rows={2}
                          style={{ borderFocusColor: primaryColor } as any}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'T.C. KİMLİK NUMARASI' : 'TC ID'}</label>
                          <input 
                            type="text"
                            value={customerInfo.tc_id}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, tc_id: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                        <div className="space-y-1 flex flex-col justify-center">
                          <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1 mb-2">{lang === 'tr' ? 'HESAP TÜRÜ' : 'ACCOUNT TYPE'}</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="is_corporate" 
                                checked={!customerInfo.is_corporate} 
                                onChange={() => setCustomerInfo(prev => ({ ...prev, is_corporate: false }))}
                                className="w-4 h-4 text-xsrimary focus:ring-primary"
                              />
                              <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Bireysel' : 'Individual'}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="is_corporate" 
                                checked={customerInfo.is_corporate} 
                                onChange={() => setCustomerInfo(prev => ({ ...prev, is_corporate: true }))}
                                className="w-4 h-4 text-xsrimary focus:ring-primary"
                              />
                              <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Kurumsal' : 'Corporate'}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={customerInfo.marketing_email}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, marketing_email: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-xsrimary focus:ring-primary"
                          />
                          <span className="text-xss font-medium text-gray-600 leading-tight">
                            {lang === 'tr' ? 'Kampanyalardan haberdar olmak için elektronik ileti almak istiyorum.' : 'I want to receive electronic messages to be informed about campaigns.'}
                          </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={customerInfo.marketing_sms}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, marketing_sms: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-xsrimary focus:ring-primary"
                          />
                          <span className="text-xss font-medium text-gray-600 leading-tight">
                            {lang === 'tr' ? 'Kampanyalardan haberdar olmak için SMS almak istiyorum.' : 'I want to receive SMS to be informed about campaigns.'}
                          </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            required
                            checked={customerInfo.accept_terms}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, accept_terms: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-xsrimary focus:ring-primary"
                          />
                          <span className="text-xss font-medium text-gray-600 leading-tight">
                            {lang === 'tr' ? 'Üyelik sözleşmesini ve kişisel verilerin işlenmesine ilişkin aydınlatma metnini okudum, kabul ediyorum.' : 'I have read and accept the membership agreement and the clarification text on the processing of personal data.'}
                          </span>
                        </label>
                      </div>
                    </>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-5 text-white rounded-2xl font-semibold text-xsl transition-all shadow-lg active:scale-95 mt-4"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                  >
                    {authMode === 'login' ? (lang === 'tr' ? 'GİRİŞ YAP' : 'LOGIN') : (lang === 'tr' ? 'KAYIT OL' : 'REGISTER')}
                  </button>

                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xss font-bold tracking-wide">
                      {lang === 'tr' ? 'VEYA' : 'OR'}
                    </span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        alert(lang === 'tr' ? 'Google ile giriş yakında eklenecek!' : 'Google login coming soon!');
                      }}
                      className="w-full py-4 bg-white border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        <path fill="none" d="M1 1h22v22H1z" />
                      </svg>
                      {lang === 'tr' ? 'Google ile Devam Et' : 'Continue with Google'}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setShowAuthModal(false);
                        setIsCheckoutModalOpen(true);
                      }}
                      className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
                    >
                      {lang === 'tr' ? 'Misafir Olarak Devam Et' : 'Continue as Guest'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            store={store} 
            t={t} 
            slug={slug}
            onClose={() => setSelectedProduct(null)} 
            addToBasket={addToBasket} 
            primaryColor={primaryColor}
            isLuxury={isLuxury}
            sector={sector}
            showAboutModal={showAboutModal}
            setShowAboutModal={setShowAboutModal}
          />
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => checkoutStatus !== 'loading' && setIsCheckoutModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-lg relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 overflow-y-auto no-scrollbar">
                {iyzicoPaymentUrl ? (
                  <div className="w-full flex flex-col h-[70vh] min-h-[500px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <h2 className="text-xsl font-semibold text-gray-900 tracking-normal">{lang === 'tr' ? 'Güvenli Ödeme' : 'Secure Payment'}</h2>
                      <button 
                        onClick={() => {
                          setIyzicoPaymentUrl(null);
                          setIsCheckoutModalOpen(false);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <iframe 
                      src={iyzicoPaymentUrl} 
                      className="w-full flex-1 border-0 rounded-2xl"
                      title="Iyzico Payment"
                    />
                  </div>
                ) : checkoutStatus === 'success' ? (
                  <div className="text-center py-10">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-semibold text-gray-900 mb-4 tracking-tight">{t.dashboard.orderReceived}</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">{t.dashboard.orderReceivedDesc}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900 tracking-normal">{t.dashboard.orderSummary}</h2>
                        <div className="h-1 w-12 mt-1 rounded-lg" style={{ backgroundColor: primaryColor }}></div>
                      </div>
                      <button 
                        onClick={() => setIsCheckoutModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{t.dashboard.customerName}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                            placeholder={lang === 'tr' ? 'Ad' : 'First Name'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'SOYAD' : 'SURNAME'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.surname}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, surname: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                            placeholder={lang === 'tr' ? 'Soyad' : 'Surname'}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{t.dashboard.phone}</label>
                          <input 
                            required
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                            placeholder="05xx xxx xx xx"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'T.C. KİMLİK NO' : 'IDENTITY NUMBER'}</label>
                          <input 
                            required
                            type="text"
                            maxLength={11}
                            value={customerInfo.tc_id}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, tc_id: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                            placeholder="11111111111"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'E-POSTA' : 'EMAIL'}</label>
                        <input 
                          required
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                          style={{ borderFocusColor: primaryColor } as any}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'ŞEHİR' : 'CITY'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            placeholder={lang === 'tr' ? 'Şehir' : 'City'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'ÜLKE' : 'COUNTRY'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.country}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, country: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            placeholder={lang === 'tr' ? 'Ülke' : 'Country'}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{t.dashboard.address}</label>
                        <textarea 
                          required
                          rows={2}
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none resize-none font-bold text-gray-900"
                          style={{ borderFocusColor: primaryColor } as any}
                          placeholder={t.dashboard.address}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={customerInfo.createAccount}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, createAccount: e.target.checked }))}
                            className="w-4 h-4 rounded text-xsrimary focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Hesap oluştur' : 'Create an account'}</span>
                        </label>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-xss font-semibold text-gray-400 tracking-wide ml-1">{lang === 'tr' ? 'ÖDEME YÖNTEMİ' : 'PAYMENT METHOD'}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {/* 1. Iyzico (Primary Credit Card if enabled) */}
                          {store?.payment_settings?.iyzico_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('iyzico')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'iyzico' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'iyzico' ? primaryColor : undefined }}
                            >
                              <ShieldCheck className={`w-6 h-6 mb-2 ${paymentMethod === 'iyzico' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'iyzico' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xss text-center ${paymentMethod === 'iyzico' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</span>
                            </button>
                          )}

                          {/* 2. Generic Credit Card - ONLY if iyzico is NOT enabled AND some other POS is enabled */}
                          {!store?.payment_settings?.iyzico_enabled && (store?.payment_settings?.paypal_enabled || store?.payment_settings?.payoneer_enabled) && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('credit_card')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'credit_card' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'credit_card' ? primaryColor : undefined }}
                            >
                              <ShieldCheck className={`w-6 h-6 mb-2 ${paymentMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'credit_card' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xss text-center ${paymentMethod === 'credit_card' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</span>
                            </button>
                          )}

                          {/* 3. Payoneer */}
                          {store?.payment_settings?.payoneer_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('payoneer')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'payoneer' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'payoneer' ? primaryColor : undefined }}
                            >
                              <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'payoneer' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'payoneer' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xss text-center ${paymentMethod === 'payoneer' ? 'text-gray-900' : 'text-gray-500'}`}>Payoneer</span>
                            </button>
                          )}

                          {/* 4. PayPal */}
                          {store?.payment_settings?.paypal_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('paypal')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'paypal' ? primaryColor : undefined }}
                            >
                              <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'paypal' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'paypal' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xss text-center ${paymentMethod === 'paypal' ? 'text-gray-900' : 'text-gray-500'}`}>PayPal</span>
                            </button>
                          )}

                          {/* Bank Transfer */}
                          {store?.payment_settings?.bank_transfer_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('bank_transfer')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'bank_transfer' ? primaryColor : undefined }}
                            >
                              <RotateCcw className={`w-6 h-6 mb-2 ${paymentMethod === 'bank_transfer' ? 'text-xsrimary' : 'text-gray-400'}`} style={{ color: paymentMethod === 'bank_transfer' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xss text-center ${paymentMethod === 'bank_transfer' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Havale / EFT' : 'Bank Transfer'}</span>
                            </button>
                          )}
                          
                          {/* Cash on Delivery */}
                          {store?.payment_settings?.cod_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('cash_on_delivery')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'cash_on_delivery' ? primaryColor : undefined }}
                            >
                              <Truck className={`w-6 h-6 mb-2 ${paymentMethod === 'cash_on_delivery' ? 'text-xsrimary' : 'text-gray-400'}`} style={{ color: paymentMethod === 'cash_on_delivery' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xss text-center ${paymentMethod === 'cash_on_delivery' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</span>
                            </button>
                          )}

                          {/* In-Store Pickup */}
                          {store?.reservation_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('store_reservation')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'store_reservation' ? 'border-amber-600 bg-amber-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'store_reservation' ? primaryColor : undefined }}
                            >
                              <MapPin className={`w-6 h-6 mb-2 ${paymentMethod === 'store_reservation' ? 'text-amber-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'store_reservation' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xss text-center ${paymentMethod === 'store_reservation' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Mağazadan Teslim' : 'In-Store Pickup'}</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Bank Details Display */}
                        {paymentMethod === 'bank_transfer' && store?.payment_settings?.bank_details && (
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium whitespace-pre-wrap">
                            {store.payment_settings.bank_details}
                          </div>
                        )}

                        {/* Store Locator Selection */}
                        {paymentMethod === 'store_reservation' && store?.locations && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm mt-4">
                            <h4 className="font-bold mb-2">Mağaza Seçiniz:</h4>
                            {store.locations.map((loc, idx) => (
                                <label key={idx} className="flex items-center gap-2 mb-1">
                                    <input type="radio" value={loc.name} name="selected_store_location" className="text-amber-600" />
                                    <span>{loc.name} - {loc.address}</span>
                                </label>
                            ))}
                          </div>
                        )}
                      </div>

                      {checkoutStatus === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <p className="text-red-600 text-sm font-bold">
                            {error || t.dashboard.orderError}
                          </p>
                        </div>
                      )}

                      <div className="pt-6">
                        <div 
                          className="flex items-center justify-between mb-6 p-5 rounded-2xl text-white shadow-xl"
                          style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                        >
                          <div className="flex flex-col">
                            <span className="text-white/70 text-[10px] font-semibold tracking-wide mb-1">{t.dashboard.amountToPay}</span>
                            <span className="text-xss font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3" />
                              {t.dashboard.securePayment}
                            </span>
                          </div>
                          <span className="text-2xl font-semibold">
                            {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                          </span>
                        </div>
                        <button 
                          type="submit"
                          disabled={checkoutStatus === 'loading'}
                          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold text-lg hover:bg-black transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95 tracking-wide"
                        >
                          {checkoutStatus === 'loading' ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin" />
                              {t.dashboard.processing}
                            </>
                          ) : (
                            <>
                              <ShoppingBasket className="w-6 h-6" />
                              {t.dashboard.checkout}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    {/* WhatsApp Button */} 
    {store?.whatsapp_number && (
      <a 
        href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9+]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-28 md:bottom-24 right-4 md:right-8 z-[100] bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg shadow-xl flex items-center gap-3 transition-all active:scale-95"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="text-sm font-bold hidden md:block">{lang === 'tr' ? 'Yardım Al' : 'WhatsApp'}</span>
      </a>
    )}

    {showStoreLocatorModal && store?.locations && (
      <StoreLocatorModal 
        locations={store.locations} 
        onClose={() => setShowStoreLocatorModal(false)}
      />
    )}

    {/* Discover Stories Modal */}
    <AnimatePresence>
      {showDiscoverModal && (
        <DiscoverModal 
          products={products.slice(0, 10)} 
          onClose={() => setShowDiscoverModal(false)}
          onViewProduct={(p) => {
            setSelectedProduct(p);
            // Optionally fetch details...
          }}
          lang={lang}
        />
      )}
    </AnimatePresence>

    {/* About Modal */}
    <AnimatePresence>
      {showAboutModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAboutModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[4rem] overflow-hidden shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative h-48 bg-slate-900 overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <img src={store?.hero_image_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
              <button 
                onClick={() => setShowAboutModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-lg bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all z-20"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-6 left-10 z-10">
                 <h2 className="text-4xl font-bold text-slate-900 tracking-tighter">
                   {lang === 'tr' ? 'Hikayemiz' : 'Our Story'}
                 </h2>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <div className="prose prose-slate max-w-none">
                 <p className="text-slate-600 text-lg leading-relaxed font-semibold whitespace-pre-wrap">
                   {store?.about_text || (lang === 'tr' ? 'Henüz hakkımızda yazısı eklenmedi.' : 'No about text added yet.')}
                 </p>
              </div>
              <div className="mt-12 pt-8 border-t border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-bold text-sm tracking-tight">{lang === 'tr' ? 'Güvenilir Alışveriş' : 'Trusted Shopping'}</h4>
                  <p className="text-slate-400 text-xss font-medium">{store?.name} {lang === 'tr' ? 'güvencesiyle.' : 'guarantee.'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </ErrorBoundary>
  );
};

export default StoreShowcase;
