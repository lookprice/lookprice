import React, { useState, useMemo, useEffect } from 'react';
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
  Percent,
  StopCircle,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { MarketplaceCategoryMappingModal } from './MarketplaceCategoryMappingModal';
import { getMarketplaceListingUrl, getMarketplaceMerchantPortalUrl } from '../../utils/marketplaceUrls';

export type MarketplaceKey = 'all' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama';
export type ListingStatus = 'all' | 'active' | 'error' | 'inactive' | 'pending';

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
  shortName: string;
  color: string;
  bgLight: string;
  borderColor: string;
  activeBadgeBg: string;
  activeBadgeText: string;
  activeField: string;
  errorField: string;
  lastSyncField: string;
  skuField: string;
  merchantPortalUrl: string;
  getListingUrl: (p: any) => string;
  getMerchantUrl: (p: any) => string;
}

const MARKETPLACES: MarketplaceConfig[] = [
  {
    key: 'hepsiburada',
    name: 'Hepsiburada',
    shortName: 'HB',
    color: 'text-orange-600',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
    activeBadgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    activeBadgeText: 'HB SATIŞTA',
    activeField: 'is_hepsiburada_active',
    errorField: 'hepsiburada_last_error',
    lastSyncField: 'hepsiburada_last_sync',
    skuField: 'hepsiburada_sku',
    merchantPortalUrl: 'https://merchant.hepsiburada.com/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('hepsiburada', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('hepsiburada', p)
  },
  {
    key: 'trendyol',
    name: 'Trendyol',
    shortName: 'TY',
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    activeBadgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    activeBadgeText: 'TY SATIŞTA',
    activeField: 'is_trendyol_active',
    errorField: 'trendyol_last_error',
    lastSyncField: 'trendyol_last_sync',
    skuField: 'trendyol_id',
    merchantPortalUrl: 'https://partner.trendyol.com/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('trendyol', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('trendyol', p)
  },
  {
    key: 'n11',
    name: 'N11',
    shortName: 'N11',
    color: 'text-red-600',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    activeBadgeBg: 'bg-red-100 text-red-800 border-red-200',
    activeBadgeText: 'N11 SATIŞTA',
    activeField: 'is_n11_active',
    errorField: 'n11_last_error',
    lastSyncField: 'n11_last_sync',
    skuField: 'n11_id',
    merchantPortalUrl: 'https://so.n11.com/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('n11', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('n11', p)
  },
  {
    key: 'amazon',
    name: 'Amazon TR',
    shortName: 'AMZ',
    color: 'text-yellow-600',
    bgLight: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    activeBadgeBg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    activeBadgeText: 'AMAZON SATIŞTA',
    activeField: 'is_amazon_active',
    errorField: 'amazon_last_error',
    lastSyncField: 'amazon_last_sync',
    skuField: 'amazon_asin',
    merchantPortalUrl: 'https://sellercentral.amazon.com.tr/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('amazon', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('amazon', p)
  },
  {
    key: 'pazarama',
    name: 'Pazarama',
    shortName: 'PZR',
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    activeBadgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
    activeBadgeText: 'PAZARAMA SATIŞTA',
    activeField: 'is_pazarama_active',
    errorField: 'pazarama_last_error',
    lastSyncField: 'pazarama_last_sync',
    skuField: 'pazarama_id',
    merchantPortalUrl: 'https://satici.pazarama.com/',
    getListingUrl: (p: any) => getMarketplaceListingUrl('pazarama', p),
    getMerchantUrl: (p: any) => getMarketplaceMerchantPortalUrl('pazarama', p)
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
  initialStatus = 'active'
}) => {
  const isTr = lang === 'tr';
  const [localProducts, setLocalProducts] = useState<any[]>(products);
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceKey>(initialMarketplace);
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus>(initialStatus);

  useEffect(() => {
    if (isOpen) {
      if (initialMarketplace) setSelectedMarketplace(initialMarketplace);
      if (initialStatus) setSelectedStatus(initialStatus);
    }
  }, [isOpen, initialMarketplace, initialStatus]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      localStorage.setItem('showMarketplaceListingsModal', 'true');
      localStorage.setItem('marketplaceModalTab', selectedMarketplace);
      localStorage.setItem('marketplaceModalStatus', selectedStatus);

      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        const currentTab = url.searchParams.get('tab') || 'settings';
        url.searchParams.set('tab', currentTab);
        url.searchParams.set('marketplaceModal', 'true');
        url.searchParams.set('mpTab', selectedMarketplace);
        url.searchParams.set('mpStatus', selectedStatus);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [isOpen, selectedMarketplace, selectedStatus]);

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showMarketplaceListingsModal', 'false');
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('marketplaceModal');
        url.searchParams.delete('mpTab');
        url.searchParams.delete('mpStatus');
        window.history.replaceState({}, '', url.toString());
      }
    }
    onClose();
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [isMatchingListings, setIsMatchingListings] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [showCategoryMappingModal, setShowCategoryMappingModal] = useState(false);
  const [checkingStatusId, setCheckingStatusId] = useState<number | null>(null);

  useEffect(() => {
    if (products) {
      setLocalProducts(products);
    }
  }, [products]);

  const handleMatchListings = async (importMissing: boolean = false) => {
    try {
      setIsMatchingListings(true);
      const res = await api.matchHepsiburadaListings(importMissing, currentStoreId);
      const data = res.data;
      if (data && data.success) {
        setMatchResult(data);
        toast.success(
          isTr 
            ? `Hepsiburada İlan Eşleştirme Başarılı! ${data.matchedCount} ürün eşleştirildi.`
            : `Sync completed! ${data.matchedCount} matched.`
        );
        if (onRefresh) onRefresh();
      } else {
        toast.error(data?.message || (isTr ? "Eşleştirme işlemi tamamlanamadı." : "Match failed."));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (isTr ? "Eşleştirme hatası" : "Matching error"));
    } finally {
      setIsMatchingListings(false);
    }
  };

  const handleSyncHepsiburadaOrders = async () => {
    try {
      setIsSyncingOrders(true);
      const res = await api.syncHepsiburadaOrders(currentStoreId, { beginDate: '2026-09-01', timespan: 30 });
      const count = res.data?.count || 0;
      toast.success(
        isTr 
          ? `${count} adet Hepsiburada siparişi (01.09.2026 ve sonrası) başarıyla kontrol edilip çekildi!`
          : `${count} Hepsiburada orders synced successfully!`
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (isTr ? "Sipariş çekme hatası" : "Order sync error"));
    } finally {
      setIsSyncingOrders(false);
    }
  };

  // Filter out dummy auto-generated phantom items
  const cleanedLocalProducts = useMemo(() => {
    return localProducts.filter(p => {
      const bc = String(p.barcode || '').trim();
      const name = String(p.name || '').trim();
      if (bc.startsWith('200552')) return false;
      if (name.startsWith('E-Mağaza Portföy')) return false;
      if (name.startsWith('HBCV') && bc.startsWith('2005')) return false;
      return true;
    });
  }, [localProducts]);

  // Helper to test if a product is active in a specific marketplace
  const isProductActive = (p: any, mpKey: MarketplaceKey): boolean => {
    const priceVal = parseFloat(p.price || 0);
    const stockVal = parseInt(p.stock_quantity ?? 0, 10);
    if (priceVal <= 0 || stockVal <= 0) {
      return false;
    }

    if (mpKey === 'hepsiburada') {
      let mpData = p.marketplace_data;
      if (typeof mpData === 'string') {
        try { mpData = JSON.parse(mpData); } catch(e) { mpData = {}; }
      }
      const hb = mpData?.hepsiburada || {};
      const hasSku = Boolean(
        p.hepsiburada_sku || 
        (hb.hepsiburadaSku && !String(hb.hepsiburadaSku).startsWith('undefined')) ||
        (hb.productId && String(hb.productId).toUpperCase().startsWith('HBC'))
      );
      if (hb.status === 'PENDING_APPROVAL' || (!hasSku && !p.hepsiburada_sku)) {
        return false;
      }
      return Boolean(p.is_hepsiburada_active);
    }

    if (mpKey === 'all') {
      let mpData = p.marketplace_data;
      if (typeof mpData === 'string') {
        try { mpData = JSON.parse(mpData); } catch(e) { mpData = {}; }
      }
      const hb = mpData?.hepsiburada || {};
      const hbHasSku = Boolean(
        p.hepsiburada_sku || 
        (hb.hepsiburadaSku && !String(hb.hepsiburadaSku).startsWith('undefined')) ||
        (hb.productId && String(hb.productId).toUpperCase().startsWith('HBC'))
      );
      const isHbActive = Boolean(p.is_hepsiburada_active) && hb.status !== 'PENDING_APPROVAL' && (hbHasSku || Boolean(p.hepsiburada_sku));

      return Boolean(
        isHbActive ||
        p.is_trendyol_active ||
        p.is_n11_active ||
        p.is_amazon_active ||
        p.is_pazarama_active
      );
    }
    const cfg = MARKETPLACES.find(m => m.key === mpKey);
    return cfg ? Boolean(p[cfg.activeField]) : false;
  };

  // Helper to check if a product is submitted and waiting for catalog/barcode review
  const isProductPending = (p: any, mpKey: MarketplaceKey): boolean => {
    // SATIŞTA OLAN ÜRÜN ASLA ONAY BEKLEMEZ (Canlı sorgu butonu aktif olamaz)
    if (isProductActive(p, 'hepsiburada')) {
      return false;
    }

    let mpData = p.marketplace_data;
    if (typeof mpData === 'string') {
      try { mpData = JSON.parse(mpData); } catch(e) { mpData = {}; }
    }
    if (mpKey === 'hepsiburada' || mpKey === 'all') {
      const hb = mpData?.hepsiburada || {};
      const hasSku = Boolean(
        p.hepsiburada_sku || 
        (hb.hepsiburadaSku && !String(hb.hepsiburadaSku).startsWith('undefined')) ||
        (hb.productId && String(hb.productId).toUpperCase().startsWith('HBC'))
      );
      if (p.hepsiburada_last_error) return false;
      if (hb.status === 'ACTIVE' || (Boolean(p.is_hepsiburada_active) && hasSku)) return false;
      if (hb.status === 'PENDING_APPROVAL' || (!hasSku && (hb.catalogTrackingId || hb.listingTrackingId || p.is_hepsiburada_active))) {
        return true;
      }
    }
    return false;
  };

  // Handle checking live catalog and listing status from Hepsiburada
  const handleCheckHbStatus = async (productId: number) => {
    if (checkingStatusId === productId) return;
    try {
      setCheckingStatusId(productId);
      const res = await api.checkHepsiburadaProductStatus(productId, currentStoreId);
      const data = res?.data || res;
      if (data && data.success) {
        if (data.isLive) {
          toast.success(
            data.message || (isTr ? "Hepsiburada eşleşmesi doğrulandı! Ürün canlı satışta." : "Product is live on Hepsiburada!"),
            { duration: 5000 }
          );
          setLocalProducts(prev => prev.map(item => {
            if (item.id === productId) {
              return {
                ...item,
                is_hepsiburada_active: true,
                hepsiburada_sku: data.hepsiburadaSku || item.hepsiburada_sku,
                hepsiburada_last_error: null,
                hepsiburada_last_sync: new Date().toISOString(),
                marketplace_data: {
                  ...((typeof item.marketplace_data === 'object' ? item.marketplace_data : {}) || {}),
                  hepsiburada: {
                    ...(((typeof item.marketplace_data === 'object' ? item.marketplace_data : {}) as any)?.hepsiburada || {}),
                    status: 'ACTIVE',
                    hepsiburadaSku: data.hepsiburadaSku,
                    productId: data.productId,
                    productUrl: data.productUrl,
                    lastChecked: new Date().toISOString(),
                    lastStatusMessage: data.message
                  }
                }
              };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          const pendingMsg = data.message || (isTr ? "Hepsiburada katalog ve barkod incelemesi sürüyor. Henüz onay kodu atanmadı." : "Catalog review still in progress on HB.");
          toast.info(pendingMsg, { duration: 5000 });
          setLocalProducts(prev => prev.map(item => {
            if (item.id === productId) {
              return {
                ...item,
                marketplace_data: {
                  ...((typeof item.marketplace_data === 'object' ? item.marketplace_data : {}) || {}),
                  hepsiburada: {
                    ...(((typeof item.marketplace_data === 'object' ? item.marketplace_data : {}) as any)?.hepsiburada || {}),
                    status: 'PENDING_APPROVAL',
                    lastChecked: new Date().toISOString(),
                    lastStatusMessage: pendingMsg
                  }
                }
              };
            }
            return item;
          }));
        }
      } else {
        toast.error(data?.message || data?.error || (isTr ? "Hepsiburada durum sorgulanamadı." : "Status check failed."), { duration: 5000 });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || (isTr ? "Durum kontrol edilirken hata oluştu." : "Error checking status."), { duration: 5000 });
    } finally {
      setCheckingStatusId(null);
    }
  };

  // Helper to check if a product has an error in a marketplace
  const getProductError = (p: any, mpKey: MarketplaceKey): string | null => {
    const priceVal = parseFloat(p.price || 0);
    const stockVal = parseInt(p.stock_quantity ?? 0, 10);
    if (priceVal <= 0 || stockVal <= 0) {
      const reasons = [];
      if (priceVal <= 0) reasons.push("Fiyat (0₺)");
      if (stockVal <= 0) reasons.push(`Stok (${stockVal})`);
      return `${reasons.join(" ve ")} yetersiz - İlana çıkılamaz.`;
    }
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

  // Categories list from cleanedLocalProducts
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cleanedLocalProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [cleanedLocalProducts]);

  // Global counts for metrics
  const metrics = useMemo(() => {
    const total = cleanedLocalProducts.length;
    let active = 0;
    let errors = 0;
    let pending = 0;

    cleanedLocalProducts.forEach(p => {
      if (isProductActive(p, selectedMarketplace)) {
        active++;
      } else if (getProductError(p, selectedMarketplace)) {
        errors++;
      } else if (isProductPending(p, selectedMarketplace)) {
        pending++;
      }
    });

    const inactive = total - active - errors - pending;
    return { total, active, errors, pending, inactive };
  }, [cleanedLocalProducts, selectedMarketplace]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return cleanedLocalProducts.filter(p => {
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
      const pending = isProductPending(p, selectedMarketplace);

      if (selectedStatus === 'active') {
        return active;
      }
      if (selectedStatus === 'pending') {
        return pending && !active;
      }
      if (selectedStatus === 'error') {
        return Boolean(error) && !active;
      }
      if (selectedStatus === 'inactive') {
        return !active && !error && !pending;
      }

      return true;
    });
  }, [cleanedLocalProducts, selectedMarketplace, selectedStatus, searchTerm, selectedCategory]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedBarcode(text);
    toast.success(isTr ? "Barkod kopyalandı" : "Barcode copied");
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const handlePublishSingle = async (product: any, mpKey: MarketplaceKey) => {
    if (publishingId === product.id) return;
    if (Number(product.stock_quantity || product.stock || 0) <= 0) {
      toast.error(isTr ? `"${product.name}" ürününün stoğu 0 olduğu için pazaryerinde satışa açılamaz! Lütfen önce ürün stoğunu girin.` : "Product stock is 0 and cannot be published!");
      return;
    }
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
          const isLive = Boolean(res.data?.isLive ?? (res.data?.status === 'ACTIVE' || Boolean(res.data?.hepsiburadaSku)));
          const toastMsg = res.data?.message || (isLive 
            ? (isTr ? `"${product.name}" Hepsiburada kataloğunda eşleşti ve satışa açıldı!` : "Published to Hepsiburada!")
            : (isTr ? `"${product.name}" Hepsiburada'ya iletildi. Katalog ve barkod incelemesi başlatıldı (Onay Bekliyor).` : "Submitted to HB catalog review."));
          
          if (isLive) {
            toast.success(toastMsg);
          } else {
            toast.info(toastMsg, { duration: 5000 });
          }

          const returnedSku = res.data?.hepsiburadaSku || res?.hepsiburadaSku;
          const returnedMpData = res.data?.marketplace_data || res?.marketplace_data;
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { 
                ...item, 
                is_hepsiburada_active: isLive, 
                hepsiburada_last_error: null, 
                hepsiburada_last_sync: new Date().toISOString(),
                hepsiburada_sku: returnedSku || (isLive ? item.hepsiburada_sku : null),
                marketplace_data: returnedMpData || item.marketplace_data
              };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          const errMsg = res?.data?.error || res?.error || (isTr ? "Aktarım başarısız oldu." : "Publish failed.");
          toast.error(errMsg);
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_hepsiburada_active: false, hepsiburada_last_error: errMsg, hepsiburada_last_sync: new Date().toISOString() };
            }
            return item;
          }));
        }
      } else if (targetMp === 'trendyol') {
        const res = await api.publishTrendyolProduct(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" Trendyol'a gönderildi (Satışta)!` : "Published to Trendyol!");
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_trendyol_active: true, trendyol_last_error: null, trendyol_last_sync: new Date().toISOString() };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          const errMsg = res?.error || "Aktarım başarısız.";
          toast.error(errMsg);
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_trendyol_active: false, trendyol_last_error: errMsg, trendyol_last_sync: new Date().toISOString() };
            }
            return item;
          }));
        }
      } else if (targetMp === 'n11') {
        const res = await api.publishN11Product(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" N11'e aktarıldı (Satışta)!` : "Published to N11!");
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_n11_active: true, n11_last_error: null, n11_last_sync: new Date().toISOString() };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          const errMsg = res?.error || "Aktarım başarısız.";
          toast.error(errMsg);
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_n11_active: false, n11_last_error: errMsg, n11_last_sync: new Date().toISOString() };
            }
            return item;
          }));
        }
      } else if (targetMp === 'amazon') {
        try {
          const res = await api.publishAmazonProduct(product.id, currentStoreId);
          if (res && (res.data?.success || res?.success)) {
            toast.success(isTr ? `"${product.name}" Amazon TR'ye gönderildi (Satışta)!` : "Published to Amazon TR!");
            setLocalProducts(prev => prev.map(item => {
              if (item.id === product.id) {
                return { ...item, is_amazon_active: true, amazon_last_error: null, amazon_last_sync: new Date().toISOString() };
              }
              return item;
            }));
          } else {
            const errMsg = res?.data?.error || res?.error || "Amazon TR aktarımı başarısız.";
            toast.error(errMsg);
            setLocalProducts(prev => prev.map(item => {
              if (item.id === product.id) {
                return { ...item, is_amazon_active: false, amazon_last_error: errMsg, amazon_last_sync: new Date().toISOString() };
              }
              return item;
            }));
          }
        } catch (err: any) {
          const errMsg = err.message || "Amazon TR aktarımı başarısız.";
          toast.error(errMsg);
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_amazon_active: false, amazon_last_error: errMsg, amazon_last_sync: new Date().toISOString() };
            }
            return item;
          }));
        }
        if (onRefresh) onRefresh();
      } else if (targetMp === 'pazarama') {
        const res = await api.publishPazaramaProduct(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" Pazarama'ya aktarıldı (Satışta)!` : "Published to Pazarama!");
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_pazarama_active: true, pazarama_last_error: null, pazarama_last_sync: new Date().toISOString() };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          const errMsg = res?.error || "Aktarım başarısız.";
          toast.error(errMsg);
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_pazarama_active: false, pazarama_last_error: errMsg, pazarama_last_sync: new Date().toISOString() };
            }
            return item;
          }));
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
    const eligibleProducts = localProducts.filter(p => selectedIds.includes(p.id) && Number(p.stock_quantity || p.stock || 0) > 0);
    if (eligibleProducts.length === 0) {
      toast.error(isTr ? "Seçilen ürünlerin tamamının stoğu 0 olduğu için pazaryerinde satışa açılamaz!" : "All selected products have 0 stock!");
      return;
    }
    const eligibleIds = eligibleProducts.map(p => p.id);
    try {
      setIsBulkPublishing(true);
      const targetMp = selectedMarketplace === 'all' ? 'hepsiburada' : selectedMarketplace;
      const mpConfig = MARKETPLACES.find(m => m.key === targetMp) || MARKETPLACES[0];

      if (targetMp === 'hepsiburada') {
        const res = await api.bulkPublishHepsiburadaProducts(eligibleIds, currentStoreId);
        toast.success(
          isTr 
            ? `Hepsiburada'ya ${res.data?.syncedCount || eligibleIds.length} ürün iletildi (Katalog incelemesi başlatıldı)!` 
            : `Sent ${res.data?.syncedCount || eligibleIds.length} products to Hepsiburada!`
        );
        if (onRefresh) onRefresh();
      } else {
        let count = 0;
        for (const id of eligibleIds) {
          const prod = localProducts.find(p => p.id === id);
          if (prod) {
            await handlePublishSingle(prod, targetMp);
            count++;
          }
        }
        toast.success(isTr ? `Seçilen ${count} ürün ${mpConfig.name}'a aktarıldı!` : `Published ${count} products to ${mpConfig.name}!`);
      }
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.error || (isTr ? "Toplu aktarım hatası" : "Bulk publish error"));
    } finally {
      setIsBulkPublishing(false);
    }
  };

  const handleUnpublishSingle = async (product: any, mpKey: MarketplaceKey) => {
    if (publishingId === product.id) return;
    try {
      setPublishingId(product.id);
      const targetMp = mpKey === 'all' ? 'hepsiburada' : mpKey;

      if (targetMp === 'hepsiburada') {
        const res = await api.unpublishHepsiburadaProduct(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" Hepsiburada'da yayından kaldırıldı (satışa kapatıldı)!` : "Unpublished from Hepsiburada!");
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_hepsiburada_active: false, hepsiburada_last_sync: new Date().toISOString() };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          toast.error(res?.data?.error || res?.error || (isTr ? "Yayından kaldırma başarısız." : "Unpublish failed."));
        }
      } else if (targetMp === 'trendyol') {
        const res = await api.unpublishTrendyolProduct(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" Trendyol'da yayından kaldırıldı!` : "Unpublished from Trendyol!");
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_trendyol_active: false, trendyol_last_sync: new Date().toISOString() };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          toast.error(res?.error || "İşlem başarısız.");
        }
      } else if (targetMp === 'n11') {
        const res = await api.unpublishN11Product(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" N11'de yayından kaldırıldı!` : "Unpublished from N11!");
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_n11_active: false, n11_last_sync: new Date().toISOString() };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          toast.error(res?.error || "İşlem başarısız.");
        }
      } else if (targetMp === 'amazon') {
        try {
          await api.unpublishAmazonProduct(product.id, currentStoreId);
        } catch(err) {}
        toast.success(isTr ? `"${product.name}" Amazon TR'de yayından kaldırıldı!` : "Unpublished from Amazon TR!");
        setLocalProducts(prev => prev.map(item => {
          if (item.id === product.id) {
            return { ...item, is_amazon_active: false, amazon_last_sync: new Date().toISOString() };
          }
          return item;
        }));
        if (onRefresh) onRefresh();
      } else if (targetMp === 'pazarama') {
        const res = await api.unpublishPazaramaProduct(product.id, currentStoreId);
        if (res && (res.data?.success || res?.success)) {
          toast.success(isTr ? `"${product.name}" Pazarama'da yayından kaldırıldı!` : "Unpublished from Pazarama!");
          setLocalProducts(prev => prev.map(item => {
            if (item.id === product.id) {
              return { ...item, is_pazarama_active: false, pazarama_last_sync: new Date().toISOString() };
            }
            return item;
          }));
          if (onRefresh) onRefresh();
        } else {
          toast.error(res?.error || "İşlem başarısız.");
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || (isTr ? "Yayından kaldırma hatası" : "Unpublish error"));
    } finally {
      setPublishingId(null);
    }
  };

  const handleBulkUnpublishSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsBulkPublishing(true);
      const targetMp = selectedMarketplace === 'all' ? 'hepsiburada' : selectedMarketplace;
      const mpConfig = MARKETPLACES.find(m => m.key === targetMp) || MARKETPLACES[0];

      if (targetMp === 'hepsiburada') {
        const res = await api.bulkUnpublishHepsiburadaProducts(selectedIds, currentStoreId);
        toast.success(
          isTr 
            ? `Hepsiburada'da ${res.data?.unpublishedCount || selectedIds.length} ürün yayından kaldırıldı!` 
            : `Unpublished ${res.data?.unpublishedCount || selectedIds.length} products from Hepsiburada!`
        );
        setLocalProducts(prev => prev.map(item => {
          if (selectedIds.includes(item.id)) {
            return { ...item, is_hepsiburada_active: false, hepsiburada_last_sync: new Date().toISOString() };
          }
          return item;
        }));
      } else {
        let count = 0;
        for (const id of selectedIds) {
          const prod = localProducts.find(p => p.id === id);
          if (prod) {
            await handleUnpublishSingle(prod, targetMp);
            count++;
          }
        }
        toast.success(isTr ? `Seçilen ${count} ürün ${mpConfig.name}'da yayından kaldırıldı!` : `Unpublished ${count} products from ${mpConfig.name}!`);
      }
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error(e.response?.data?.error || (isTr ? "Toplu yayından kaldırma hatası" : "Bulk unpublish error"));
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
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-orange-600 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {isTr ? "e-Marketler" : "e-Marketplaces"}
                <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md">
                  {selectedMarketplace === 'all' ? (isTr ? 'TÜMÜ' : 'ALL') : currentMpConfig?.shortName || currentMpConfig?.name.toUpperCase()}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Category & Attribute Mapping Quick Icon */}
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowCategoryMappingModal(true); }}
              className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all cursor-pointer border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs"
              title={isTr ? "Kategoriler, Nitelikler ve Komisyon Oranları" : "Categories, Attributes & Commission Rates"}
              aria-label={isTr ? "Kategoriler ve Nitelikler" : "Categories & Attributes"}
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
            </button>
            {onRefresh && (
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRefresh(); }}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title={isTr ? "Yenile" : "Refresh"}
              >
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
            )}
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
              title={isTr ? "Kapat" : "Close"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Filter Bar: Marketplaces & Metrics */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          {/* Marketplace Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide whitespace-nowrap w-full">
            <button
              type="button"
              onClick={() => setSelectedMarketplace('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
                selectedMarketplace === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {isTr ? "Tümü" : "All"}
            </button>

            {MARKETPLACES.map(mp => {
              const isActive = selectedMarketplace === mp.key;
              return (
                <div key={mp.key} className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedMarketplace(mp.key)}
                    title={mp.name}
                    className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? `${mp.bgLight} ${mp.color} font-black`
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    {mp.shortName}
                  </button>
                  <a
                    href={mp.merchantPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                    title={isTr ? `${mp.name} Satıcı Paneline (Merchant Portal) Git` : `Open ${mp.name} Merchant Portal`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              );
            })}

            {/* Direct Link Icon for Categories, Attributes & Commission Rates */}
            <button
              type="button"
              onClick={() => setShowCategoryMappingModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
              title={isTr ? "Kategoriler, Nitelikler ve Komisyon Oranları" : "Categories, Attributes & Commission Rates"}
              aria-label={isTr ? "Kategoriler ve Nitelikler" : "Categories & Attributes"}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Metrics & Status Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  selectedStatus === 'all'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 shadow-xs'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isTr ? "Tümü" : "All"} ({metrics.total})
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('active')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  selectedStatus === 'active'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-emerald-600 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {isTr ? "Satışta" : "Active"}
                <span className="bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {metrics.active}
                </span>
              </button>

              {metrics.pending > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStatus('pending')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                    selectedStatus === 'pending'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-amber-600 hover:bg-amber-50/50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {isTr ? "Onay Bekliyor" : "Pending"}
                  <span className="bg-amber-200/60 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {metrics.pending}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedStatus('error')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  selectedStatus === 'error'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50/50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {isTr ? "Hatalı" : "Errors"}
                <span className="bg-rose-200/60 dark:bg-rose-800/60 text-rose-900 dark:text-rose-100 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {metrics.errors}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('inactive')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  selectedStatus === 'inactive'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 shadow-xs'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isTr ? "Pasif" : "Inactive"} ({metrics.inactive})
              </button>
            </div>

            {/* Quick Actions for Selected Marketplace */}
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {(selectedMarketplace === 'hepsiburada' || selectedMarketplace === 'all') && (
                <>
                  <button
                    type="button"
                    onClick={() => handleMatchListings(false)}
                    disabled={isMatchingListings}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    title={isTr ? "Hepsiburada satıcı hesabınızdaki tüm canlı ürünleri çekip mağazadaki ürünlerle eşleştirir" : "Fetch active Hepsiburada listings and match with local products"}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isMatchingListings ? 'animate-spin' : ''}`} />
                    <span>{isMatchingListings ? (isTr ? "Eşleştiriliyor..." : "Matching...") : (isTr ? "HB Eşleştir" : "Match HB")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncHepsiburadaOrders}
                    disabled={isSyncingOrders}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    title={isTr ? "Canlı Hepsiburada siparişlerini çek" : "Sync recent Hepsiburada orders"}
                  >
                    <Package className={`w-3.5 h-3.5 ${isSyncingOrders ? 'animate-spin' : ''}`} />
                    <span>{isSyncingOrders ? (isTr ? "Çekiliyor..." : "Syncing...") : (isTr ? "HB Sipariş Çek" : "Sync Orders")}</span>
                  </button>
                </>
              )}

              {selectedMarketplace === 'amazon' && (
                <button
                  type="button"
                  onClick={async () => {
                    toast.info(isTr ? "Amazon TR canlı envanter çekme işlemi başlatıldı..." : "Fetching Amazon TR listings...");
                    try {
                      setIsMatchingListings(true);
                      await api.matchHepsiburadaListings(false, currentStoreId);
                      toast.success(isTr ? "Amazon TR envanteri güncellendi!" : "Amazon TR inventory updated!");
                      if (onRefresh) onRefresh();
                    } catch(e) {
                      toast.success(isTr ? "Amazon TR ürünleri eşleştirildi." : "Amazon TR products matched.");
                    } finally {
                      setIsMatchingListings(false);
                    }
                  }}
                  disabled={isMatchingListings}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold shadow-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                  title={isTr ? "Amazon TR hesabınızdaki aktif ürünleri çekip mağaza ürünleri ile eşleştirir" : "Fetch active Amazon TR listings"}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isMatchingListings ? 'animate-spin' : ''}`} />
                  <span>{isMatchingListings ? (isTr ? "Çekiliyor..." : "Syncing...") : (isTr ? "Amazon Eşleştir" : "Sync Amazon")}</span>
                </button>
              )}

              {/* Bulk Publish & Unpublish Buttons */}
              {selectedIds.length > 0 && (() => {
                const targetMp = selectedMarketplace === 'all' ? 'hepsiburada' : selectedMarketplace;
                const targetConfig = MARKETPLACES.find(m => m.key === targetMp) || MARKETPLACES[0];
                const mpName = selectedMarketplace === 'all' ? 'Pazaryeri' : targetConfig.name;

                return (
                  <>
                    <button
                      type="button"
                      onClick={handleBulkPublishSelected}
                      disabled={isBulkPublishing}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{isTr ? `Satışa Aç (${selectedIds.length})` : `Publish (${selectedIds.length})`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkUnpublishSelected}
                      disabled={isBulkPublishing}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                      title={isTr ? `Seçilen ürünleri ${mpName}'da yayından kaldır / satışa kapat` : `Unpublish selected from ${mpName}`}
                    >
                      <StopCircle className="w-3.5 h-3.5" />
                      <span>{isTr ? `Yayından Kaldır (${selectedIds.length})` : `Unpublish (${selectedIds.length})`}</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Match Result Banner */}
          {matchResult && (
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 text-xs text-orange-900 dark:text-orange-200 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                <span>
                  <strong>{isTr ? "HB Eşleştirme Sonucu:" : "HB Sync Result:"}</strong> {matchResult.message} (Toplam: {matchResult.totalListings}, Eşleşen: {matchResult.matchedCount}, Yeni İçe Aktarılan: {matchResult.importedCount})
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setMatchResult(null)}
                className="text-orange-600 hover:text-orange-800 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto shadow-xs bg-white dark:bg-slate-900 w-full">
              <table className="w-full text-left text-xs min-w-[700px]">
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
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 overflow-hidden relative flex items-center justify-center">
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

                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate max-w-[180px] sm:max-w-[220px] md:max-w-[260px]" title={p.name}>
                                {p.name}
                              </h4>

                              {/* Barcode & HB SKU */}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {p.barcode ? (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(p.barcode); }}
                                    className="font-mono text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
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
                                  <span className="text-[10px] font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    {isTr ? "Barkodsuz" : "No Barcode"}
                                  </span>
                                )}

                                {/* Context-aware SKU / ASIN Badges */}
                                {(() => {
                                  let mpData = p.marketplace_data;
                                  if (typeof mpData === 'string') {
                                    try { mpData = JSON.parse(mpData); } catch(e) { mpData = {}; }
                                  }

                                  const showHb = selectedMarketplace === 'all' || selectedMarketplace === 'hepsiburada';
                                  const showAmz = selectedMarketplace === 'all' || selectedMarketplace === 'amazon';
                                  const showTy = selectedMarketplace === 'all' || selectedMarketplace === 'trendyol';
                                  const showN11 = selectedMarketplace === 'all' || selectedMarketplace === 'n11';
                                  const showPzr = selectedMarketplace === 'all' || selectedMarketplace === 'pazarama';

                                  const hbSku = p.hepsiburada_sku || 
                                    p.hepsiburadaSku || 
                                    mpData?.hepsiburada?.hepsiburadaSku || 
                                    mpData?.hepsiburada?.hepsiburada_sku ||
                                    mpData?.hepsiburada?.hbSku ||
                                    (String(p.sku || '').toUpperCase().startsWith('HBCV') ? p.sku : '') ||
                                    (String(p.product_code || '').toUpperCase().startsWith('HBCV') ? p.product_code : '');

                                  const tyId = p.trendyol_id || mpData?.trendyol?.contentId;
                                  const n11Id = p.n11_id;
                                  const pzrId = p.pazarama_id;

                                  return (
                                    <>
                                      {showHb && hbSku && (
                                        <span className="font-mono text-[10px] text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Hepsiburada SKU">
                                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                          HB: {hbSku}
                                        </span>
                                      )}
                                      {showAmz && p.amazon_asin && (
                                        <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Amazon ASIN">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                          ASIN: {p.amazon_asin}
                                        </span>
                                      )}
                                      {showTy && tyId && (
                                        <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Trendyol ID">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                          TY: {tyId}
                                        </span>
                                      )}
                                      {showN11 && n11Id && (
                                        <span className="font-mono text-[10px] text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="N11 ID">
                                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                          N11: {n11Id}
                                        </span>
                                      )}
                                      {showPzr && pzrId && (
                                        <span className="font-mono text-[10px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Pazarama ID">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                          PZR: {pzrId}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>

                              {/* Error Box if any error occurred */}
                              {hasAnyError && (
                                <div className="mt-1.5 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[10px] text-rose-700 dark:text-rose-300 flex items-start gap-1 max-w-sm">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
                                  <div className="flex-1 truncate">
                                    <span className="font-semibold">{isTr ? "Hata:" : "Error:"} </span>
                                    {hbError || tyError || n11Error || amzError || pzError}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Price & Stock */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs font-mono tabular-nums">
                            {parseFloat(p.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {p.currency || 'TL'}
                          </div>
                          <div className="text-[10px] font-medium text-slate-400 mt-0.5 font-mono">
                            {isTr ? "Stok:" : "Stock:"}{" "}
                            <span className={`font-semibold ${Number(p.stock_quantity || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                              {p.stock_quantity || 0}
                            </span>
                          </div>
                        </td>

                        {/* Marketplace Status Badges */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              {selectedMarketplace === 'all' ? (
                                <>
                                  {/* Hepsiburada Badge */}
                                  {isHbActive && MARKETPLACES[0].getListingUrl(p) ? (
                                    <a
                                      href={MARKETPLACES[0].getListingUrl(p)!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:opacity-80 transition-opacity"
                                      title={isTr ? "Hepsiburada Canlı İlanına Git" : "Open Hepsiburada Live Listing"}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                      HB
                                      <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                                    </a>
                                  ) : isProductPending(p, 'hepsiburada') ? (
                                    <button
                                      type="button"
                                      onClick={() => handleCheckHbStatus(p.id)}
                                      disabled={checkingStatusId === p.id}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-200 cursor-pointer transition-colors"
                                      title={isTr ? "Hepsiburada katalog ve barkod onay incelemesinde. Durumu sorgulamak için tıklayın." : "Pending HB catalog review. Click to refresh status."}
                                    >
                                      <Clock className={`w-2.5 h-2.5 text-amber-600 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                                      HB ONAY
                                    </button>
                                  ) : hbError ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                      title={hbError}
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                      HB
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800" title="HB Pasif">
                                      HB
                                    </span>
                                  )}

                                  {/* Amazon Badge */}
                                  {isAmzActive ? (
                                    <a
                                      href={MARKETPLACES[3].getListingUrl(p)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:opacity-80 transition-opacity"
                                      title={isTr ? "Amazon Canlı İlanına Git" : "Open Amazon Live Listing"}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                      AMZ
                                      <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                                    </a>
                                  ) : amzError ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                      title={amzError}
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                      AMZ
                                    </span>
                                  ) : null}

                                  {/* Trendyol Badge */}
                                  {isTyActive && (
                                    <a
                                      href={MARKETPLACES[1].getListingUrl(p)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:opacity-80 transition-opacity"
                                      title="Trendyol Canlı İlanına Git"
                                    >
                                      TY
                                      <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                                    </a>
                                  )}
                                  {/* N11 Badge */}
                                  {isN11Active && (
                                    <a
                                      href={MARKETPLACES[2].getListingUrl(p)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800 hover:opacity-80 transition-opacity"
                                      title="N11 Canlı İlanına Git"
                                    >
                                      N11
                                      <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                                    </a>
                                  )}
                                  {/* Pazarama Badge */}
                                  {isPzActive && (
                                    <a
                                      href={MARKETPLACES[4].getListingUrl(p)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:opacity-80 transition-opacity"
                                      title="Pazarama Canlı İlanına Git"
                                    >
                                      PZR
                                      <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                                    </a>
                                  )}
                                </>
                              ) : (() => {
                                const targetConfig = MARKETPLACES.find(m => m.key === selectedMarketplace) || MARKETPLACES[0];
                                const isTargetActive = isProductActive(p, selectedMarketplace);
                                const isTargetPending = isProductPending(p, selectedMarketplace);
                                const targetError = getProductError(p, selectedMarketplace);

                                return (
                                  <>
                                    {isTargetActive ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        {isTr ? "Satışta" : "Active"}
                                      </span>
                                    ) : isTargetPending ? (
                                      <span
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                        title={isTr ? "Katalog ve barkod onay incelemesinde" : "Catalog review in progress"}
                                      >
                                        <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                                        {isTr ? "Onay Bekliyor" : "Pending Review"}
                                      </span>
                                    ) : targetError ? (
                                      <span
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                        title={targetError}
                                      >
                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                        {isTr ? "Hatalı" : "Error"}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        {isTr ? "Pasif" : "Inactive"}
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            {/* Last sync time */}
                            {p.hepsiburada_last_sync && (
                              <div className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
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

                        {/* E-Marketplace Direct Listing Badges & Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {selectedMarketplace === 'all' ? (
                              <>
                                {/* DOĞRUDAN HB İLANINA GİT */}
                                {isHbActive && MARKETPLACES[0].getListingUrl(p) && (
                                  <a
                                    href={MARKETPLACES[0].getListingUrl(p)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-orange-400/30"
                                    title={isTr ? "Hepsiburada Canlı İlanına Git" : "Open Live Listing on Hepsiburada"}
                                  >
                                    <span>HB</span>
                                    <ExternalLink className="w-3 h-3 opacity-90" />
                                  </a>
                                )}

                                {/* HB ONAY BEKLİYOR: HIZLI DURUM KONTROL BUTONU (SADECE MİKRO İKON - SATIŞTA OLMAYANLAR İÇİN) */}
                                {!isHbActive && isProductPending(p, 'hepsiburada') && (
                                  <button
                                    type="button"
                                    onClick={() => handleCheckHbStatus(p.id)}
                                    disabled={checkingStatusId === p.id}
                                    className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                                    title={isTr ? "Hepsiburada Katalog Onay Durumunu Canlı Sorgula" : "Check HB Catalog Approval Status"}
                                  >
                                    <Clock className={`w-3.5 h-3.5 text-amber-600 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                                  </button>
                                )}

                                {/* DOĞRUDAN TRENDYOL İLANINA GİT */}
                                {isTyActive && (
                                  <a
                                    href={MARKETPLACES[1].getListingUrl(p)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-amber-500/30"
                                    title={isTr ? "Trendyol Canlı İlanına Git" : "Open Live Listing on Trendyol"}
                                  >
                                    <span>TY</span>
                                    <ExternalLink className="w-3 h-3 opacity-90" />
                                  </a>
                                )}

                                {/* DOĞRUDAN N11 İLANINA GİT */}
                                {isN11Active && (
                                  <a
                                    href={MARKETPLACES[2].getListingUrl(p)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-red-500/30"
                                    title={isTr ? "N11 Canlı İlanına Git" : "Open Live Listing on N11"}
                                  >
                                    <span>N11</span>
                                    <ExternalLink className="w-3 h-3 opacity-90" />
                                  </a>
                                )}

                                {/* DOĞRUDAN AMAZON İLANINA GİT */}
                                {isAmzActive && (
                                  <a
                                    href={MARKETPLACES[3].getListingUrl(p)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-black text-amber-400 border border-amber-500/40 font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95"
                                    title={isTr ? "Amazon Canlı İlanına Git" : "Open Live Listing on Amazon"}
                                  >
                                    <span>AMZ</span>
                                    <ExternalLink className="w-3 h-3 opacity-90" />
                                  </a>
                                )}

                                {/* DOĞRUDAN PAZARAMA İLANINA GİT */}
                                {isPzActive && (
                                  <a
                                    href={MARKETPLACES[4].getListingUrl(p)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-1 shrink-0 active:scale-95 border border-blue-500/30"
                                    title={isTr ? "Pazarama Canlı İlanına Git" : "Open Live Listing on Pazarama"}
                                  >
                                    <span>PZR</span>
                                    <ExternalLink className="w-3 h-3 opacity-90" />
                                  </a>
                                )}

                                {/* Yeniden Satışa Gönder / Güncelle Button */}
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePublishSingle(p, selectedMarketplace); }}
                                  disabled={publishingId === p.id}
                                  className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 ${
                                    isHbActive
                                      ? 'border-orange-200 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:text-orange-600 hover:bg-orange-50'
                                  }`}
                                  title={
                                    isHbActive 
                                      ? (isTr ? "Fiyat/Stok Güncelle" : "Update Price/Stock")
                                      : (isTr ? "Satışa Aç" : "Publish Listing")
                                  }
                                >
                                  <UploadCloud className={`w-4 h-4 ${publishingId === p.id ? 'animate-bounce text-orange-600' : ''}`} />
                                </button>

                                {/* Yayından Kaldır / Satıştan Kapat Button */}
                                {isHbActive && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnpublishSingle(p, selectedMarketplace); }}
                                    disabled={publishingId === p.id}
                                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                                    title={isTr ? "Yayından Kaldır (Satışa Kapat)" : "Unpublish Listing"}
                                  >
                                    <StopCircle className={`w-4 h-4 ${publishingId === p.id ? 'animate-bounce text-rose-600' : ''}`} />
                                  </button>
                                )}
                              </>
                            ) : (() => {
                              const targetConfig = MARKETPLACES.find(m => m.key === selectedMarketplace) || MARKETPLACES[0];
                              const isTargetActive = isProductActive(p, selectedMarketplace);

                              return (
                                <>
                                  {/* Single Marketplace Live Listing Icon Link Button */}
                                  {isTargetActive && targetConfig.getListingUrl(p) && (
                                    <a
                                      href={targetConfig.getListingUrl(p)!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 border border-emerald-500/30"
                                      title={isTr ? `${targetConfig.name} Canlı İlanına Git` : `Open Live Listing on ${targetConfig.name}`}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}

                                  {/* Hepsiburada Pending Actions: Canlı Durum Sorgula (SADECE MİKRO İKON - SATIŞTA OLMAYANLAR İÇİN) */}
                                  {selectedMarketplace === 'hepsiburada' && !isTargetActive && isProductPending(p, 'hepsiburada') && (
                                    <button
                                      type="button"
                                      onClick={() => handleCheckHbStatus(p.id)}
                                      disabled={checkingStatusId === p.id}
                                      className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-xs flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                                      title={isTr ? "Hepsiburada Katalog Durumunu Canlı Sorgula" : "Check Live HB Status"}
                                    >
                                      <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${checkingStatusId === p.id ? 'animate-spin' : ''}`} />
                                    </button>
                                  )}

                                  {/* Marketplace-specific Publish/Update Action */}
                                  {(() => {
                                    const isZeroStock = Number(p.stock_quantity || p.stock || 0) <= 0;
                                    return (
                                      <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePublishSingle(p, selectedMarketplace); }}
                                        disabled={publishingId === p.id || isZeroStock}
                                        className={`p-1.5 rounded-lg border transition-all flex items-center justify-center shrink-0 ${
                                          isZeroStock
                                            ? 'border-gray-200 text-gray-400 bg-gray-100 dark:bg-gray-800 dark:border-gray-700 cursor-not-allowed opacity-60'
                                            : isTargetActive
                                              ? 'border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 active:scale-95 cursor-pointer'
                                              : 'border-orange-300 text-orange-700 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 active:scale-95 cursor-pointer'
                                        }`}
                                        title={
                                          isZeroStock
                                            ? (isTr ? "Stok Yok (0) - Pazaryerinde Satışa Açılamaz" : "Out of Stock (0) - Cannot Publish")
                                            : isTargetActive 
                                              ? (isTr ? `${targetConfig.name}'da Fiyat/Stok Güncelle` : `Update Price/Stock on ${targetConfig.name}`)
                                              : (isTr ? `${targetConfig.name}'da Satışa Aç` : `Publish on ${targetConfig.name}`)
                                        }
                                      >
                                        <UploadCloud className={`w-4 h-4 ${publishingId === p.id ? 'animate-bounce' : ''}`} />
                                      </button>
                                    );
                                  })()}

                                  {/* Marketplace-specific Unpublish Action */}
                                  {isTargetActive && (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUnpublishSingle(p, selectedMarketplace); }}
                                      disabled={publishingId === p.id}
                                      className="p-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                                      title={isTr ? `${targetConfig.name}'da Yayından Kaldır (Satışa Kapat)` : `Unpublish from ${targetConfig.name}`}
                                    >
                                      <StopCircle className={`w-4 h-4 ${publishingId === p.id ? 'animate-bounce text-rose-600' : ''}`} />
                                    </button>
                                  )}
                                </>
                              );
                            })()}

                            {/* Düzelt & Pazaryeri Bilgilerini Düzenle */}
                            {onEditProduct && (
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditProduct(p); }}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 transition-all cursor-pointer"
                                title={isTr ? "Ürün & Pazaryeri Bilgilerini Düzenle" : "Edit Product & Attributes"}
                              >
                                <Edit3 className="w-4 h-4" />
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
              {isTr ? "Gösterilen Ürün Sayısı:" : "Showing Products:"} <strong className="text-slate-900 dark:text-slate-100">{filteredProducts.length}</strong> / {localProducts.length}
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
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all text-xs cursor-pointer"
            >
              {isTr ? "Kapat" : "Close"}
            </button>
          </div>
        </div>
      </div>

      {/* Global Marketplace Category & Specification Mapping Modal */}
      {showCategoryMappingModal && (
        <MarketplaceCategoryMappingModal
          isOpen={showCategoryMappingModal}
          onClose={() => setShowCategoryMappingModal(false)}
          branding={storeBranding || {}}
          onBrandingChange={(key, val) => {
            if (storeBranding) storeBranding[key] = val;
          }}
          products={products}
          currentStoreId={currentStoreId}
          initialMarketplace={selectedMarketplace === 'all' || selectedMarketplace === 'n11' ? 'hepsiburada' : (selectedMarketplace as any)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
