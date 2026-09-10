import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  UploadCloud, 
  RefreshCw, 
  Search, 
  Filter, 
  Package, 
  Store, 
  Edit3, 
  ArrowUpRight, 
  Copy, 
  Check, 
  AlertCircle, 
  Layers, 
  Eye, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export type MarketplaceKey = 'all' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama';
export type ListingStatus = 'all' | 'active' | 'error' | 'inactive';

interface MarketplaceListingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  storeBranding: any;
  currentStoreId?: number;
  onRefresh?: () => void;
  onEditProduct?: (product: any) => void;
  lang?: string;
  initialMarketplace?: MarketplaceKey;
  initialStatus?: ListingStatus;
}

interface MarketplaceConfig {
  key: MarketplaceKey;
  name: string;
  color: string;
  bgLight: string;
  borderColor: string;
  activeBadgeBg: string;
  activeBadgeText: string;
  activeField: string;
  errorField: string;
  lastSyncField: string;
  skuField: string;
  getListingUrl: (p: any) => string;
  getMerchantUrl: (p: any) => string;
}

const MARKETPLACES: MarketplaceConfig[] = [
  {
    key: 'hepsiburada',
    name: 'Hepsiburada',
    color: 'text-orange-600',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
    activeBadgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    activeBadgeText: 'HB SATIŞTA',
    activeField: 'is_hepsiburada_active',
    errorField: 'hepsiburada_last_error',
    lastSyncField: 'hepsiburada_last_sync',
    skuField: 'hepsiburada_sku',
    getListingUrl: (p: any) => {
      if (p.hepsiburada_sku) {
        return `https://www.hepsiburada.com/product-p-${p.hepsiburada_sku}`;
      }
      return `https://www.hepsiburada.com/ara?q=${encodeURIComponent(p.barcode || p.name)}`;
    },
    getMerchantUrl: (p: any) => `https://merchant.hepsiburada.com/listing-management?merchantSku=${encodeURIComponent(p.barcode || '')}`
  },
  {
    key: 'trendyol',
    name: 'Trendyol',
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    activeBadgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    activeBadgeText: 'TY SATIŞTA',
    activeField: 'is_trendyol_active',
    errorField: 'trendyol_last_error',
    lastSyncField: 'trendyol_last_sync',
    skuField: 'trendyol_id',
    getListingUrl: (p: any) => `https://www.trendyol.com/sr?q=${encodeURIComponent(p.barcode || p.name)}`,
    getMerchantUrl: (p: any) => `https://partner.trendyol.com/products/inventory?barcode=${encodeURIComponent(p.barcode || '')}`
  },
  {
    key: 'n11',
    name: 'N11',
    color: 'text-red-600',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    activeBadgeBg: 'bg-red-100 text-red-800 border-red-200',
    activeBadgeText: 'N11 SATIŞTA',
    activeField: 'is_n11_active',
    errorField: 'n11_last_error',
    lastSyncField: 'n11_last_sync',
    skuField: 'n11_id',
    getListingUrl: (p: any) => {
      if (p.n11_id) return `https://www.n11.com/urun/${p.n11_id}`;
      return `https://www.n11.com/arama?q=${encodeURIComponent(p.barcode || p.name)}`;
    },
    getMerchantUrl: () => `https://so.n11.com/product/index`
  },
  {
    key: 'amazon',
    name: 'Amazon TR',
    color: 'text-yellow-600',
    bgLight: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    activeBadgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    activeBadgeText: 'AMAZON SATIŞTA',
    activeField: 'is_amazon_active',
    errorField: 'amazon_last_error',
    lastSyncField: 'amazon_last_sync',
    skuField: 'amazon_asin',
    getListingUrl: (p: any) => {
      if (p.amazon_asin) return `https://www.amazon.com.tr/dp/${p.amazon_asin}`;
      return `https://www.amazon.com.tr/s?k=${encodeURIComponent(p.barcode || p.name)}`;
    },
    getMerchantUrl: () => `https://sellercentral.amazon.com.tr/inventory`
  },
  {
    key: 'pazarama',
    name: 'Pazarama',
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    activeBadgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    activeBadgeText: 'PAZARAMA SATIŞTA',
    activeField: 'is_pazarama_active',
    errorField: 'pazarama_last_error',
    lastSyncField: 'pazarama_last_sync',
    skuField: 'pazarama_id',
    getListingUrl: (p: any) => `https://www.pazarama.com/arama?q=${encodeURIComponent(p.barcode || p.name)}`,
    getMerchantUrl: () => `https://satici.pazarama.com/urun-yonetimi`
  }
];

export const MarketplaceListingsModal: React.FC<MarketplaceListingsModalProps> = ({
  isOpen,
  onClose,
  products = [],
  storeBranding,
  currentStoreId,
  onRefresh,
  onEditProduct,
  lang = 'tr',
  initialMarketplace = 'hepsiburada',
  initialStatus = 'all'
}) => {
  const isTr = lang === 'tr';
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceKey>(initialMarketplace);
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus>(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);

  // Helper to test if a product is active in a specific marketplace
  const isProductActive = (p: any, mpKey: MarketplaceKey): boolean => {
    if (mpKey === 'all') {
      return Boolean(
        p.is_hepsiburada_active ||
        p.is_trendyol_active ||
        p.is_n11_active ||
        p.is_amazon_active ||
        p.is_pazarama_active
      );
    }
    const cfg = MARKETPLACES.find(m => m.key === mpKey);
    return cfg ? Boolean(p[cfg.activeField]) : false;
  };

  // Helper to check if a product has an error in a marketplace
  const getProductError = (p: any, mpKey: MarketplaceKey): string | null => {
    if (mpKey === 'all') {
      return p.hepsiburada_last_error ||
        p.trendyol_last_error ||
        p.n11_last_error ||
        p.amazon_last_error ||
        p.pazarama_last_error ||
        null;
    }
    const cfg = MARKETPLACES.find(m => m.key === mpKey);
    return cfg ? (p[cfg.errorField] || null) : null;
  };

  // Categories list from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Global counts for metrics
  const metrics = useMemo(() => {
    const total = products.length;
    let active = 0;
    let errors = 0;

    products.forEach(p => {
      if (isProductActive(p, selectedMarketplace)) {
        active++;
      } else if (getProductError(p, selectedMarketplace)) {
        errors++;
      }
    });

    const inactive = total - active - errors;
    return { total, active, errors, inactive };
  }, [products, selectedMarketplace]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesBarcode = (p.barcode || '').toString().toLowerCase().includes(query);
        const matchesBrand = (p.brand || '').toLowerCase().includes(query);
        if (!matchesName && !matchesBarcode && !matchesBrand) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Status filter
      const active = isProductActive(p, selectedMarketplace);
      const error = getProductError(p, selectedMarketplace);

      if (selectedStatus === 'active') {
        return active;
      }
      if (selectedStatus === 'error') {
        return Boolean(error) && !active;
      }
      if (selectedStatus === 'inactive') {
        return !active && !error;
      }

      return true;
    });
  }, [products, selectedMarketplace, selectedStatus, searchTerm, selectedCategory]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBarcode(text);
    toast.success(isTr ? "Barkod kopyalandı" : "Barcode copied");
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const handlePublishSingle = async (product: any, mpKey: MarketplaceKey) => {
    if (publishingId === product.id) return;
    if (!product.barcode || !String(product.barcode).trim()) {
      toast.error(isTr ? `"${product.name}" ürününün barkodu eksik!` : "Product barcode is missing!");
      return;
    }

    try {
      setPublishingId(product.id);
      const targetMp = mpKey === 'all' ? 'hepsiburada' : mpKey;

      if (targetMp === 'hepsiburada') {
        const res = await api.publishHepsiburadaProduct(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" Hepsiburada'ya gönderildi!` : "Published to Hepsiburada!");
          if (onRefresh) onRefresh();
        } else {
          toast.error(res?.data?.error || res?.error || (isTr ? "Aktarım başarısız oldu." : "Publish failed."));
        }
      } else if (targetMp === 'trendyol') {
        const res = await api.publishTrendyolProduct(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" Trendyol'a gönderildi!` : "Published to Trendyol!");
          if (onRefresh) onRefresh();
        } else {
          toast.error(res?.error || "Aktarım başarısız.");
        }
      } else if (targetMp === 'n11') {
        const res = await api.publishN11Product(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" N11'e aktarıldı!` : "Published to N11!");
          if (onRefresh) onRefresh();
        } else {
          toast.error(res?.error || "Aktarım başarısız.");
        }
      } else if (targetMp === 'pazarama') {
        const res = await api.publishPazaramaProduct(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" Pazarama'ya aktarıldı!` : "Published to Pazarama!");
          if (onRefresh) onRefresh();
        } else {
          toast.error(res?.error || "Aktarım başarısız.");
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || (isTr ? "Aktarım hatası" : "Publish error"));
    } finally {
      setPublishingId(null);
    }
  };

  const handleBulkPublishSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkPublishing(true);
      const res = await api.bulkPublishHepsiburadaProducts(selectedIds, currentStoreId);
      toast.success(
        isTr 
          ? `Hepsiburada'ya ${res.data?.syncedCount || selectedIds.length} ürün başarıyla iletildi!` 
          : `Sent ${res.data?.syncedCount || selectedIds.length} products to Hepsiburada!`
      );
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.error || (isTr ? "Toplu aktarım hatası" : "Bulk publish error"));
    } finally {
      setIsBulkPublishing(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  if (!isOpen) return null;

  const currentMpConfig = MARKETPLACES.find(m => m.key === selectedMarketplace);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-orange-600 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {isTr ? "Pazaryeri İlanları & Ürün Takibi" : "Marketplace Listings & Monitoring"}
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md">
                  {selectedMarketplace === 'all' ? (isTr ? 'TÜM PAZARYERLERİ' : 'ALL MARKETPLACES') : currentMpConfig?.name.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md sm:max-w-xl">
                {isTr 
                  ? "Satıştaki canlı ilanlarınızı görüntüleyin, doğrudan ilana gidin ve hatalı ürünleri tek tıkla düzeltip yeniden gönderin."
                  : "Monitor live listings, navigate directly to market pages, and resolve errors with 1-click retry."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                title={isTr ? "Yenile" : "Refresh"}
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
              title={isTr ? "Kapat" : "Close"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Filter Bar: Marketplaces & Metrics */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          {/* Marketplace Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedMarketplace('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                selectedMarketplace === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {isTr ? "Tüm Pazaryerleri" : "All Marketplaces"}
            </button>

            {MARKETPLACES.map(mp => {
              const isActive = selectedMarketplace === mp.key;
              return (
                <button
                  key={mp.key}
                  onClick={() => setSelectedMarketplace(mp.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    isActive
                      ? `${mp.bgLight} ${mp.color} ${mp.borderColor} shadow-xs font-black ring-1 ring-orange-400/40`
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {mp.name}
                </button>
              );
            })}
          </div>

          {/* Quick Metrics & Status Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  selectedStatus === 'all'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 shadow-xs'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isTr ? "Tümü" : "All"} ({metrics.total})
              </button>

              <button
                onClick={() => setSelectedStatus('active')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  selectedStatus === 'active'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-emerald-600 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {isTr ? "Satışta / Yayında" : "Active / In Sale"}
                <span className="bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {metrics.active}
                </span>
              </button>

              <button
                onClick={() => setSelectedStatus('error')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  selectedStatus === 'error'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50/50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {isTr ? "Hatalı / Çıkamayan" : "Errors / Failed"}
                <span className="bg-rose-200/60 dark:bg-rose-800/60 text-rose-900 dark:text-rose-100 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {metrics.errors}
                </span>
              </button>

              <button
                onClick={() => setSelectedStatus('inactive')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  selectedStatus === 'inactive'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 shadow-xs'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isTr ? "Satışa Açılmamış" : "Not Listed"} ({metrics.inactive})
              </button>
            </div>

            {/* Bulk Publish Button */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkPublishSelected}
                  disabled={isBulkPublishing}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {isTr ? `Seçilenleri Hepsiburada'da Satışa Aç (${selectedIds.length})` : `Publish Selected (${selectedIds.length})`}
                </button>
              </div>
            )}
          </div>

          {/* Row 3: Search Input & Category Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={isTr ? "Ürün adı, barkod (EAN) veya marka ile filtrele..." : "Search by name, barcode, brand..."}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                aria-label={isTr ? "Kategori Filtresi" : "Category Filter"}
                className="py-2 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 dark:text-slate-300"
              >
                <option value="all">{isTr ? "Tüm Kategoriler" : "All Categories"}</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Product Table / Listing Rows */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {isTr ? "Filtrelere Uygun Ürün Bulunamadı" : "No products match criteria"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {isTr 
                  ? "Arama kriterlerinizi veya durum filtresini değiştirerek tekrar deneyebilirsiniz."
                  : "Try clearing search or switching status filter."}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredProducts.length}
                        onChange={toggleSelectAll}
                        aria-label={isTr ? "Tümünü Seç" : "Select All"}
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="py-3 px-4">{isTr ? "Ürün & Barkod" : "Product & Barcode"}</th>
                    <th className="py-3 px-4">{isTr ? "Fiyat & Stok" : "Price & Stock"}</th>
                    <th className="py-3 px-4">{isTr ? "Pazaryeri Durumu" : "Marketplace Status"}</th>
                    <th className="py-3 px-4 text-right">{isTr ? "İlan Linki & İşlemler" : "Direct Link & Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map(p => {
                    const isHbActive = p.is_hepsiburada_active;
                    const isTyActive = p.is_trendyol_active;
                    const isN11Active = p.is_n11_active;
                    const isAmzActive = p.is_amazon_active;
                    const isPzActive = p.is_pazarama_active;

                    const hbError = p.hepsiburada_last_error;
                    const tyError = p.trendyol_last_error;
                    const n11Error = p.n11_last_error;
                    const amzError = p.amazon_last_error;
                    const pzError = p.pazarama_last_error;

                    const hasAnyError = Boolean(hbError || tyError || n11Error || amzError || pzError);
                    const isSelected = selectedIds.includes(p.id);

                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelected ? 'bg-orange-50/40 dark:bg-orange-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(p.id)}
                            aria-label={isTr ? `Seç: ${p.name}` : `Select: ${p.name}`}
                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                          />
                        </td>

                        {/* Product info */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3">
                            {/* Product Image */}
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden relative flex items-center justify-center">
                              {p.image_url ? (
                                <img 
                                  src={p.image_url.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(p.image_url)}` : p.image_url}
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e: any) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21 8-9-4-9 4v8l9 4 9-4V8z'/%3E%3Cpath d='M3.27 6.96 12 12.01l8.73-5.05'/%3E%3Cpath d='M12 22.08V12'/%3E%3C/svg%3E";
                                  }}
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[220px] sm:max-w-xs md:max-w-md" title={p.name}>
                                {p.name}
                              </h4>

                              {/* Barcode & Brand */}
                              <div className="flex items-center gap-2 mt-1">
                                {p.barcode ? (
                                  <button
                                    onClick={() => copyToClipboard(p.barcode)}
                                    className="font-mono text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                                    title={isTr ? "Barkodu Kopyala" : "Copy Barcode"}
                                  >
                                    {copiedBarcode === p.barcode ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 opacity-60" />
                                    )}
                                    {p.barcode}
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    {isTr ? "Barkodsuz" : "No Barcode"}
                                  </span>
                                )}

                                {p.brand && (
                                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {p.brand}
                                  </span>
                                )}

                                {p.category && (
                                  <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">
                                    {p.category}
                                  </span>
                                )}
                              </div>

                              {/* Error Box if any error occurred */}
                              {hasAnyError && (
                                <div className="mt-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-1.5 max-w-lg">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <span className="font-bold">{isTr ? "Aktarım Hatası:" : "Publish Error:"} </span>
                                    {hbError || tyError || n11Error || amzError || pzError}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Price & Stock */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-black text-slate-900 dark:text-slate-100 text-xs">
                            {parseFloat(p.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {p.currency || 'TL'}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                            {isTr ? "Stok:" : "Stock:"}{" "}
                            <span className={`font-black ${Number(p.stock_quantity || 0) > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {p.stock_quantity || 0}
                            </span>
                          </div>
                        </td>

                        {/* Marketplace Status Badges */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            {/* Hepsiburada Status */}
                            <div className="flex items-center gap-1.5">
                              {isHbActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-orange-100 text-orange-800 border border-orange-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                  HEPSİBURADA
                                </span>
                              ) : hbError ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200" title={hbError}>
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  HB HATASI
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  HB Pasif
                                </span>
                              )}

                              {/* Additional marketplaces active badges if present */}
                              {isTyActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                  TRENDYOL
                                </span>
                              )}
                              {isN11Active && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                                  N11
                                </span>
                              )}
                              {isAmzActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  AMAZON
                                </span>
                              )}
                              {isPzActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                  PAZARAMA
                                </span>
                              )}
                            </div>

                            {/* Last sync time */}
                            {p.hepsiburada_last_sync && (
                              <div className="text-[9px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 opacity-60" />
                                {new Date(p.hepsiburada_last_sync).toLocaleString('tr-TR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions & DIRECT LINK */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* DOĞRUDAN İLANA GİT BUTONU (Ana Fonksiyon) */}
                            {isHbActive && (
                              <a
                                href={MARKETPLACES[0].getListingUrl(p)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs transition-all shadow-xs flex items-center gap-1 active:scale-95 group"
                                title={isTr ? "Hepsiburada'da Bu Ürünün Canlı İlanına Git" : "Open Live Listing on Hepsiburada"}
                              >
                                <span>{isTr ? "HB İlanına Git" : "Go to HB"}</span>
                                <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </a>
                            )}

                            {/* Trendyol direct link if active */}
                            {isTyActive && (
                              <a
                                href={MARKETPLACES[1].getListingUrl(p)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-xs flex items-center gap-1 active:scale-95 group"
                                title={isTr ? "Trendyol'da Bu Ürünün İlanına Git" : "Open on Trendyol"}
                              >
                                <span>TY</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Merchant Portal Quick Link */}
                            <a
                              href={MARKETPLACES[0].getMerchantUrl(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 text-slate-500 hover:text-orange-600 bg-slate-50 dark:bg-slate-800 transition-all"
                              title={isTr ? "Hepsiburada Satıcı Paneli (Merchant Portal)" : "Hepsiburada Merchant Portal"}
                            >
                              <Store className="w-3.5 h-3.5" />
                            </a>

                            {/* Yeniden Satışa Gönder / Güncelle Button */}
                            <button
                              onClick={() => handlePublishSingle(p, selectedMarketplace)}
                              disabled={publishingId === p.id}
                              className={`p-1.5 rounded-xl border transition-all active:scale-95 ${
                                isHbActive
                                  ? 'border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                              }`}
                              title={
                                isHbActive 
                                  ? (isTr ? "Hepsiburada Fiyat/Stok Güncelle" : "Update HB Price/Stock")
                                  : (isTr ? "Hepsiburada'da Satışa Aç" : "Publish to Hepsiburada")
                              }
                            >
                              <UploadCloud className={`w-3.5 h-3.5 ${publishingId === p.id ? 'animate-bounce text-orange-600' : ''}`} />
                            </button>

                            {/* Düzelt & Pazaryeri Bilgilerini Düzenle */}
                            {onEditProduct && (
                              <button
                                onClick={() => onEditProduct(p)}
                                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 transition-all"
                                title={isTr ? "Ürün & Pazaryeri Bilgilerini Düzenle" : "Edit Product & Attributes"}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>
              {isTr ? "Gösterilen Ürün Sayısı:" : "Showing Products:"} <strong className="text-slate-900 dark:text-slate-100">{filteredProducts.length}</strong> / {products.length}
            </span>
            {metrics.active > 0 && (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                • {metrics.active} {isTr ? "ilan satışta aktif" : "active listings"}
              </span>
            )}
            {metrics.errors > 0 && (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                • {metrics.errors} {isTr ? "ürün düzeltme bekliyor" : "require attention"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all text-xs"
            >
              {isTr ? "Kapat" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
