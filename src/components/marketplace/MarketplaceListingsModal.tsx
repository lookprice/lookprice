import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { MarketplaceCategoryMappingModal } from './MarketplaceCategoryMappingModal';
import { 
  MarketplaceKey, 
  ListingStatus, 
  MarketplaceMetrics, 
  MARKETPLACES 
} from './marketplaceTypes';
import { MarketplaceListingsHeader } from './MarketplaceListingsHeader';
import { MarketplaceMetricsBar } from './MarketplaceMetricsBar';
import { MarketplaceBanners } from './MarketplaceBanners';
import { MarketplaceSearchBar } from './MarketplaceSearchBar';
import { MarketplaceListingsTable } from './MarketplaceListingsTable';

export type { MarketplaceKey, ListingStatus };

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
  const [isCheckingBulkPending, setIsCheckingBulkPending] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [matchResult, setMatchResult] = useState<any | null>(null);
  const [showCategoryMappingModal, setShowCategoryMappingModal] = useState(false);
  const [checkingStatusId, setCheckingStatusId] = useState<number | null>(null);

  useEffect(() => {
    if (products) {
      setLocalProducts(products);
    }
  }, [products]);

  const handleMatchHbListings = async (importMissing: boolean = false) => {
    try {
      setIsMatchingListings(true);
      const res = await api.matchHepsiburadaListings(importMissing, currentStoreId);
      const data = (res as any)?.data ?? res;
      if (data && (data.success || data.matchedCount !== undefined)) {
        setMatchResult({ ...data, marketplaceKey: 'hepsiburada' });
        toast.success(
          isTr 
            ? `Hepsiburada İlan Eşleştirme Başarılı! ${data.matchedCount || 0} ürün eşleştirildi, ${data.importedCount || 0} yeni ürün aktarıldı.`
            : `Hepsiburada sync completed! ${data.matchedCount || 0} matched.`
        );
        if (onRefresh) onRefresh();
      } else {
        toast.error(data?.message || data?.error || (isTr ? "Eşleştirme işlemi tamamlanamadı." : "Match failed."));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (isTr ? "Eşleştirme hatası" : "Matching error"));
    } finally {
      setIsMatchingListings(false);
    }
  };

  const handleMatchAmazonListings = async (importMissing: boolean = true) => {
    try {
      setIsMatchingListings(true);
      const res = await api.matchAmazonListings(importMissing, currentStoreId);
      const data = (res as any)?.data ?? res;
      if (data && (data.success || data.matchedCount !== undefined)) {
        setMatchResult({ ...data, marketplaceKey: 'amazon' });
        toast.success(
          isTr 
            ? `Amazon İlan Eşleştirme Başarılı! ${data.matchedCount || 0} ürün eşleştirildi, ${data.importedCount || 0} yeni ürün aktarıldı.`
            : `Amazon sync completed! ${data.matchedCount || 0} matched.`
        );
        if (onRefresh) onRefresh();
      } else {
        toast.error(data?.message || data?.error || (isTr ? "Amazon eşleştirme işlemi tamamlanamadı." : "Amazon match failed."));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (isTr ? "Amazon eşleştirme hatası" : "Amazon match error"));
    } finally {
      setIsMatchingListings(false);
    }
  };

  const handleMatchListings = async (importMissing: boolean = false) => {
    if (selectedMarketplace === 'amazon') {
      return handleMatchAmazonListings(true);
    }
    return handleMatchHbListings(importMissing);
  };

  const handleCheckBulkPendingStatus = async () => {
    try {
      setIsCheckingBulkPending(true);
      const res = await api.checkHepsiburadaBulkPendingStatus(currentStoreId);
      const data = (res as any)?.data ?? res;
      if (data && data.success) {
        toast.success(data.message, { duration: 6000 });
        if (data.matchedCount > 0 && onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(data?.message || (isTr ? "Sorgulama tamamlanamadı." : "Check failed."));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (isTr ? "Toplu sorgulama hatası" : "Bulk check error"));
    } finally {
      setIsCheckingBulkPending(false);
    }
  };

  const handleSyncHepsiburadaOrders = async () => {
    try {
      setIsSyncingOrders(true);
      const res = await api.syncHepsiburadaOrders(currentStoreId, { beginDate: '2026-09-01', timespan: 30 });
      const data = (res as any)?.data ?? res;
      const count = data?.count || 0;
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
  const metrics = useMemo<MarketplaceMetrics>(() => {
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
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesBarcode = (p.barcode || '').toString().toLowerCase().includes(query);
        const matchesBrand = (p.brand || '').toLowerCase().includes(query);
        if (!matchesName && !matchesBarcode && !matchesBrand) return false;
      }

      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Marketplace Tabs & Direct Merchant Portal Links */}
        <MarketplaceListingsHeader
          isTr={isTr}
          selectedMarketplace={selectedMarketplace}
          setSelectedMarketplace={setSelectedMarketplace}
          currentMpConfig={currentMpConfig}
          onOpenCategoryMapping={() => setShowCategoryMappingModal(true)}
          onRefresh={onRefresh}
          onClose={handleClose}
        />

        {/* Toolbar & Search Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3">
          <MarketplaceSearchBar
            isTr={isTr}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
          />

          <MarketplaceMetricsBar
            isTr={isTr}
            selectedMarketplace={selectedMarketplace}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            metrics={metrics}
            selectedIds={selectedIds}
            isMatchingListings={isMatchingListings}
            isCheckingBulkPending={isCheckingBulkPending}
            isSyncingOrders={isSyncingOrders}
            isBulkPublishing={isBulkPublishing}
            onMatchListings={handleMatchListings}
            onCheckBulkPending={handleCheckBulkPendingStatus}
            onSyncOrders={handleSyncHepsiburadaOrders}
            onSyncAmazon={() => handleMatchAmazonListings(true)}
            onBulkPublish={handleBulkPublishSelected}
            onBulkUnpublish={handleBulkUnpublishSelected}
          />
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <MarketplaceBanners
            isTr={isTr}
            matchResult={matchResult}
            onClearMatchResult={() => setMatchResult(null)}
            selectedStatus={selectedStatus}
            isCheckingBulkPending={isCheckingBulkPending}
            onCheckBulkPending={handleCheckBulkPendingStatus}
          />

          <MarketplaceListingsTable
            products={filteredProducts}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            selectedMarketplace={selectedMarketplace}
            isTr={isTr}
            copiedBarcode={copiedBarcode}
            onCopyBarcode={copyToClipboard}
            onCheckHbStatus={handleCheckHbStatus}
            checkingStatusId={checkingStatusId}
            publishingId={publishingId}
            onPublishSingle={handlePublishSingle}
            onUnpublishSingle={handleUnpublishSingle}
            onEditProduct={onEditProduct}
            isProductActive={isProductActive}
            isProductPending={isProductPending}
            getProductError={getProductError}
          />
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
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
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
export default MarketplaceListingsModal;
