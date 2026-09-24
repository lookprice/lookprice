import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";
import { useTableManager } from "@/hooks/useTableManager";
import { BOOKSTORE_BADGES, extractProductLabels, hasBookstoreBadge, toggleBookstoreBadgeData } from "@/data/bookstoreBadges";
import { resolveDomainId } from "@/utils/sectorCapability";
import { getMarketplaceListingUrl } from "@/utils/marketplaceUrls";

// Vertical Slices
import { ProductsTabProps, MarketplaceFilterType, MarketplaceModalTab, MarketplaceModalStatus } from "./products/types";
import { ProductsHeaderActions } from "./products/ProductsHeaderActions";
import { ProductsFilterToolbar } from "./products/ProductsFilterToolbar";
import { ProductsTable } from "./products/ProductsTable";
import { ProductsModalsContainer } from "./products/ProductsModalsContainer";

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  loading,
  isViewer,
  onBulkDelete,
  onEdit,
  onAddNew,
  onImport,
  onDelete,
  onExportReport,
  onBulkRename,
  branding,
  showStoreName,
  currentStoreId,
  includeBranches,
  branches,
  setIncludeBranches,
  isCafeRestaurant,
  onRefresh
}) => {
  const { lang } = useLanguage();
  const t = translations[lang]?.dashboard || translations.tr.dashboard;

  // Primary filtering and pagination state
  const [localSearch, setLocalSearch] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [includeZeroStock, setIncludeZeroStock] = useState<boolean>(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;
  const [isFixingNames, setIsFixingNames] = useState(false);

  // Debounce search state update to prevent jank when typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
      setPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [localSearch]);

  // Dropdowns and popovers
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [badgePopoverProductId, setBadgePopoverProductId] = useState<number | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  const [optimisticBadges, setOptimisticBadges] = useState<Record<number, string[]>>({});

  // Marketplaces filtering & modal state
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceFilterType>('all');
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [isBackupLoading, setIsBackupLoading] = useState<boolean>(false);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [recipeProduct, setRecipeProduct] = useState<any>(null);
  const [sharingProduct, setSharingProduct] = useState<any>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isAiMenuModalOpen, setIsAiMenuModalOpen] = useState(false);
  const [showBulkPublishModal, setShowBulkPublishModal] = useState(false);
  const [showMarketplaceListingsModal, setShowMarketplaceListingsModal] = useState(() => {
    if (typeof window === 'undefined') return false;
    const url = new URL(window.location.href);
    return url.searchParams.get('marketplaceModal') === 'true' || localStorage.getItem('showMarketplaceListingsModal') === 'true';
  });
  const [marketplaceModalTab, setMarketplaceModalTab] = useState<MarketplaceModalTab>(() => {
    if (typeof window === 'undefined') return 'all';
    const url = new URL(window.location.href);
    return (url.searchParams.get('mpTab') as any) || (localStorage.getItem('marketplaceModalTab') as any) || 'all';
  });
  const [marketplaceModalStatus, setMarketplaceModalStatus] = useState<MarketplaceModalStatus>(() => {
    if (typeof window === 'undefined') return 'all';
    const url = new URL(window.location.href);
    return (url.searchParams.get('mpStatus') as any) || (localStorage.getItem('marketplaceModalStatus') as any) || 'all';
  });

  useEffect(() => {
    const handleReopen = () => {
      setShowMarketplaceListingsModal(true);
    };
    window.addEventListener('reopenMarketplaceModal', handleReopen);
    return () => window.removeEventListener('reopenMarketplaceModal', handleReopen);
  }, []);

  // Sector and Store Category Detection via SSOT Domain Resolver
  const domainId = resolveDomainId(branding);
  const isCafe = domainId === 'HORECA' || domainId === 'HOTEL' || isCafeRestaurant;
  const isPortfolio = domainId === 'REAL_ESTATE' || domainId === 'AUTOMOTIVE';
  const isBookstore = domainId === 'BOOKSTORE';
  const isShopLp = domainId === 'RETAIL' || domainId === 'BOOKSTORE';

  // Table Manager for responsive columns & metadata display modes
  const tableManager = useTableManager({
    tableKey: 'products-table',
    defaultMetadataMode: 'inline',
    columns: [
      { id: 'barcode', label: t.barcode, defaultVisible: !isCafe, required: false },
      { id: 'image', label: lang === 'tr' ? 'Görsel' : 'Image', defaultVisible: true, required: false },
      { id: 'name', label: t.productName, defaultVisible: true, required: true },
      { id: 'branch', label: t.branch, defaultVisible: !!showStoreName, required: false },
      { id: 'price', label: t.price, defaultVisible: true, required: true },
      { id: 'cost', label: t.cost, defaultVisible: true, required: false },
      { id: 'stock', label: t.stock, defaultVisible: true, required: true },
      { id: 'actions', label: t.actions, defaultVisible: true, required: true }
    ]
  });

  // Google Drive connection status
  useEffect(() => {
    api.getGoogleDriveSettings()
      .then(res => setDriveConnected(!!res?.connected))
      .catch(() => setDriveConnected(false));
  }, []);

  // Global click listeners for dropdowns/popovers
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.action-menu-trigger') && !target.closest('.action-menu-dropdown')) {
        setOpenActionMenuId(null);
      }
      if (!target.closest('.book-badge-popover')) {
        setBadgePopoverProductId(null);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Hash-based smooth scroll & highlight for incoming routes
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#product-row-')) {
      const productIdStr = hash.replace('#product-row-', '');
      const pId = parseInt(productIdStr, 10);
      if (!isNaN(pId)) {
        setHighlightedProductId(pId);
        setTimeout(() => {
          const el = document.getElementById(`product-row-${pId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
        const timer = setTimeout(() => {
          setHighlightedProductId(null);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [products]);

  // Bookstore showcase badges handlers
  const getProductBadgesLocal = (p: any): string[] => {
    if (optimisticBadges[p.id] !== undefined) {
      return optimisticBadges[p.id];
    }
    return extractProductLabels(p);
  };

  const hasProductBadgeLocal = (p: any, badgeId: string): boolean => {
    if (optimisticBadges[p.id] !== undefined) {
      return optimisticBadges[p.id].some(b => b.toLowerCase() === badgeId.toLowerCase());
    }
    return hasBookstoreBadge(p, badgeId);
  };

  const handleToggleBookBadge = async (e: React.MouseEvent, p: any, badgeId: string) => {
    e.stopPropagation();
    const current = getProductBadgesLocal(p);
    const exists = current.some(b => b.toLowerCase() === badgeId.toLowerCase());
    const updated = exists 
      ? current.filter(b => b.toLowerCase() !== badgeId.toLowerCase())
      : [...current, badgeId];

    setOptimisticBadges(prev => ({ ...prev, [p.id]: updated }));

    try {
      const updatedFields = toggleBookstoreBadgeData(p, badgeId);
      await api.updateProduct(p.id, {
        labels: JSON.stringify(updatedFields.labels || []),
        is_bestseller: updatedFields.is_bestseller ?? p.is_bestseller,
        is_weekly_pick: updatedFields.is_weekly_pick ?? p.is_weekly_pick,
        sector_data: JSON.stringify(updatedFields.sector_data || {})
      });
      const badgeDef = BOOKSTORE_BADGES.find(b => b.id === badgeId);
      const badgeName = badgeDef ? (lang === 'tr' ? badgeDef.labelTr : badgeDef.labelEn) : badgeId;
      if (exists) {
        toast.info(lang === 'tr' ? `"${badgeName}" rozeti kaldırıldı.` : `"${badgeName}" badge removed.`);
      } else {
        toast.success(lang === 'tr' ? `"${badgeName}" rozeti eklendi!` : `"${badgeName}" badge added!`);
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(lang === 'tr' ? 'Rozet güncellenirken hata oluştu' : 'Failed to update badge');
      setOptimisticBadges(prev => {
        const copy = { ...prev };
        delete copy[p.id];
        return copy;
      });
    }
  };

  // Profit margin calculation helper
  const calculateProfitMargin = (p: any) => {
    const price = Number(p.price) || 0;
    const cost = Number(p.cost_price) || 0;
    if (cost <= 0 || price <= 0) return null;
    const profit = price - cost;
    const margin = (profit / cost) * 100;
    return { profit, margin };
  };

  // Sync names from invoices
  const handleSyncNamesFromInvoices = async () => {
    setIsFixingNames(true);
    const toastId = toast.loading(lang === 'tr' ? 'Faturalardaki orijinal ürün isimleri taranıyor...' : 'Syncing original product names from invoices...');
    try {
      const invoices = await api.getPurchaseInvoices(currentStoreId);
      const purchases = Array.isArray(invoices) ? invoices : (invoices?.invoices || []);
      const barcodeToNameMap: Record<string, string> = {};

      purchases.forEach((inv: any) => {
        let items: any[] = [];
        if (typeof inv.items === 'string') {
          try { items = JSON.parse(inv.items); } catch (e) { items = []; }
        } else if (Array.isArray(inv.items)) {
          items = inv.items;
        }
        items.forEach((item: any) => {
          const barcode = String(item.barcode || item.product_barcode || '').trim();
          const name = String(item.product_name || item.name || '').trim();
          if (barcode && barcode.length >= 4 && name && name.length >= 3) {
            barcodeToNameMap[barcode] = name;
          }
        });
      });

      const renames: { id: number; name: string }[] = [];
      products.forEach((p: any) => {
        const b = String(p.barcode || '').trim();
        if (b && barcodeToNameMap[b]) {
          const originalName = barcodeToNameMap[b];
          if (p.name !== originalName) {
            renames.push({ id: p.id, name: originalName });
          }
        }
      });

      if (renames.length === 0) {
        toast.info(lang === 'tr' ? 'Tüm ürün isimleri zaten faturalarla tam eşleşiyor.' : 'All product names already match invoices.', { id: toastId });
      } else {
        if (onBulkRename) {
          await onBulkRename(renames);
          toast.success(lang === 'tr' ? `${renames.length} adet ürün ismi orijinal fatura kayıtlarıyla eşitlendi!` : `Synced ${renames.length} product names from invoices!`, { id: toastId });
        } else {
          toast.success(lang === 'tr' ? `${renames.length} ürün adı bulundu.` : `Found ${renames.length} product names.`, { id: toastId });
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(lang === 'tr' ? 'İsim eşitleme sırasında bir hata oluştu.' : 'Error while syncing product names.', { id: toastId });
    } finally {
      setIsFixingNames(false);
    }
  };

  // Auto-find images
  const handleAutoFindImages = async ({ id }: { id: number }) => {
    const toastId = toast.loading(lang === 'tr' ? 'Ürün görseli aranıyor...' : 'Finding product image...');
    try {
      const res = await api.autoFindImage({ id }, currentStoreId);
      if (res && res.updated) {
        toast.success(lang === 'tr' ? 'Ürün görseli başarıyla güncellendi!' : 'Product image updated successfully!', { id: toastId });
        if (onRefresh) onRefresh();
      } else {
        toast.info(lang === 'tr' ? 'Uygun görsel bulunamadı.' : 'No suitable image found.', { id: toastId });
      }
    } catch (err: any) {
      toast.error(lang === 'tr' ? 'Görsel aranırken hata oluştu.' : 'Failed to find image.', { id: toastId });
    }
  };

  // Bulk delete selected
  const handleBulkDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(lang === 'tr' ? `Seçilen ${selectedIds.length} ürünü silmek istediğinize emin misiniz?` : `Are you sure you want to delete ${selectedIds.length} selected products?`)) {
      if (onBulkDelete) {
        onBulkDelete(selectedIds);
      } else {
        selectedIds.forEach(id => onDelete(id));
      }
      setSelectedIds([]);
    }
  };

  // Selection handlers
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Marketplace helpers
  const getHepsiburadaUrl = (p: any): string | null => {
    if (!p) return null;
    return getMarketplaceListingUrl('hepsiburada', p);
  };

  const isHepsiburadaPending = (p: any): boolean => {
    if (!p) return false;
    if (p.is_hepsiburada_active) return false;
    const status = String(p.hepsiburada_status || '').toUpperCase();
    if (status === 'PENDING' || status === 'IN_REVIEW' || status === 'UPLOADED') return true;
    if (p.hepsiburada_tracking_id && !p.hepsiburada_last_error) return true;
    return false;
  };

  const getTrendyolUrl = (p: any): string | null => {
    if (!p) return null;
    return getMarketplaceListingUrl('trendyol', p);
  };

  const getN11Url = (p: any): string | null => {
    if (!p) return null;
    return getMarketplaceListingUrl('n11', p);
  };

  const getAmazonUrl = (p: any): string | null => {
    if (!p) return null;
    return getMarketplaceListingUrl('amazon', p);
  };

  const getPazaramaUrl = (p: any): string | null => {
    if (!p) return null;
    return getMarketplaceListingUrl('pazarama', p);
  };

  const connectedMarketplaces = useMemo(() => {
    const mp = branding?.marketplace_settings || {};
    const hb = !!(mp.hepsiburada?.merchant_id && (mp.hepsiburada?.api_key || mp.hepsiburada?.secret_key));
    const ty = !!(mp.trendyol?.supplier_id && mp.trendyol?.api_key);
    const n11 = !!(mp.n11?.api_key && mp.n11?.api_secret);
    const amz = !!(mp.amazon?.seller_id && mp.amazon?.refresh_token);
    const pzr = !!(mp.pazarama?.api_key && mp.pazarama?.api_secret);
    return {
      hepsiburada: hb,
      trendyol: ty,
      n11: n11,
      amazon: amz,
      pazarama: pzr,
      hasAnyConnected: hb || ty || n11 || amz || pzr,
    };
  }, [branding]);

  // Helper to check if a product is a bestseller
  const getIsBestseller = (p: any): boolean => {
    if (!p) return false;
    if (p.is_bestseller === true || p.is_bestseller === 1 || p.is_bestseller === 'true' || p.is_bestseller === '1') return true;
    if (p.is_popular === true || p.is_popular === 1 || p.is_popular === 'true' || p.is_popular === '1') return true;
    if (Array.isArray(p.labels) && (p.labels.includes('bestseller') || p.labels.includes('cok_satan') || p.labels.includes('populer'))) return true;
    if (Array.isArray(p.tags) && (p.tags.includes('bestseller') || p.tags.includes('cok_satan') || p.tags.includes('populer'))) return true;
    return false;
  };

  // Distinct category list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

  const effectiveShowStoreName = Boolean(showStoreName || includeBranches || (branches && branches.length > 0));

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // If store_id belongs to a branch and user has not enabled "Şube Stokları", hide branch products
      if (currentStoreId && p.store_id && Number(p.store_id) !== Number(currentStoreId) && !includeBranches) {
        return false;
      }
      
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || 
        p.name?.toLowerCase().includes(q) || 
        p.barcode?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.store_name?.toLowerCase().includes(q);

      let matchesCategory = true;
      if (selectedCategory === "all") {
        matchesCategory = true;
      } else if (selectedCategory === "bestsellers") {
        matchesCategory = getIsBestseller(p);
      } else if (selectedCategory.startsWith("badge_")) {
        const targetBadgeId = selectedCategory.replace("badge_", "");
        matchesCategory = hasProductBadgeLocal(p, targetBadgeId);
      } else {
        matchesCategory = p.category === selectedCategory;
      }

      let matchesStock = true;
      if (!includeZeroStock) {
        let vars: any[] = [];
        if (p.variants) {
          if (typeof p.variants === 'string') {
            try { vars = JSON.parse(p.variants); } catch (e) { vars = []; }
          } else if (Array.isArray(p.variants)) {
            vars = p.variants;
          }
        }
        const effectiveStock = vars.length > 0
          ? vars.reduce((sum, v) => sum + (Number(v.stock_quantity) || Number(v.stock) || 0), 0)
          : Number(p.stock_quantity) || 0;
        
        matchesStock = effectiveStock > 0 || p.product_type === 'service';
      }

      let matchesMarketplace = true;
      if (isShopLp && marketplaceFilter !== 'all') {
        const isHb = Boolean(p.is_hepsiburada_active);
        const isTy = Boolean(p.is_trendyol_active);
        const isN11 = Boolean(p.is_n11_active);
        const isAmz = Boolean(p.is_amazon_active);
        const isPzr = Boolean(p.is_pazarama_active);
        const isAnyActive = isHb || isTy || isN11 || isAmz || isPzr;

        if (marketplaceFilter === 'listed') {
          matchesMarketplace = isAnyActive;
        } else if (marketplaceFilter === 'hepsiburada') {
          matchesMarketplace = isHb;
        } else if (marketplaceFilter === 'trendyol') {
          matchesMarketplace = isTy;
        } else if (marketplaceFilter === 'n11') {
          matchesMarketplace = isN11;
        } else if (marketplaceFilter === 'amazon') {
          matchesMarketplace = isAmz;
        } else if (marketplaceFilter === 'pazarama') {
          matchesMarketplace = isPzr;
        } else if (marketplaceFilter === 'errors') {
          matchesMarketplace = Boolean(p.hepsiburada_last_error || p.trendyol_last_error || p.n11_last_error);
        } else if (marketplaceFilter === 'not_listed') {
          matchesMarketplace = !isAnyActive;
        }
      }

      return matchesSearch && matchesCategory && matchesStock && matchesMarketplace;
    });
  }, [products, search, selectedCategory, includeZeroStock, marketplaceFilter, isShopLp, currentStoreId, includeBranches, effectiveShowStoreName, optimisticBadges]);

  // Counts for quick chips
  const { 
    marketplaceActiveCount, 
    hbActiveCount, 
    tyActiveCount, 
    n11ActiveCount, 
    amzActiveCount, 
    pzrActiveCount, 
    marketplaceErrorCount 
  } = useMemo(() => {
    let active = 0;
    let hb = 0;
    let ty = 0;
    let n11 = 0;
    let amz = 0;
    let pzr = 0;
    let err = 0;

    products.forEach(p => {
      const isHb = Boolean(p.is_hepsiburada_active);
      const isTy = Boolean(p.is_trendyol_active);
      const isN11 = Boolean(p.is_n11_active);
      const isAmz = Boolean(p.is_amazon_active);
      const isPzr = Boolean(p.is_pazarama_active);

      if (isHb) hb++;
      if (isTy) ty++;
      if (isN11) n11++;
      if (isAmz) amz++;
      if (isPzr) pzr++;
      if (isHb || isTy || isN11 || isAmz || isPzr) active++;
      if (p.hepsiburada_last_error || p.trendyol_last_error || p.n11_last_error) err++;
    });

    return {
      marketplaceActiveCount: active,
      hbActiveCount: hb,
      tyActiveCount: ty,
      n11ActiveCount: n11,
      amzActiveCount: amz,
      pzrActiveCount: pzr,
      marketplaceErrorCount: err
    };
  }, [products]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, page, itemsPerPage]);

  const toggleSelectAll = () => {
    if (paginatedProducts.every(p => selectedIds.includes(p.id))) {
      setSelectedIds(prev => prev.filter(id => !paginatedProducts.some(p => p.id === id)));
    } else {
      const newIds = paginatedProducts.map(p => p.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...newIds])));
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header and Primary Action Buttons */}
      <ProductsHeaderActions
        t={t}
        lang={lang}
        isViewer={isViewer}
        isCafe={isCafe}
        selectedIds={selectedIds}
        onAddNew={onAddNew}
        onImport={onImport}
        onExportReport={onExportReport}
        handleBulkDeleteSelected={handleBulkDeleteSelected}
        handleSyncNamesFromInvoices={handleSyncNamesFromInvoices}
        isFixingNames={isFixingNames}
        setIsMergeModalOpen={setIsMergeModalOpen}
        setIsAiMenuModalOpen={setIsAiMenuModalOpen}
        driveConnected={driveConnected}
        isBackupLoading={isBackupLoading}
        setIsBackupLoading={setIsBackupLoading}
        isBookstore={isBookstore}
        onRefresh={onRefresh}
        currentStoreId={currentStoreId}
      />

      {/* 2. Filter & Marketplace Toolbar */}
      <ProductsFilterToolbar
        search={localSearch}
        setSearch={setLocalSearch}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        setPage={setPage}
        includeZeroStock={includeZeroStock}
        setIncludeZeroStock={setIncludeZeroStock}
        tableManager={tableManager}
        paginatedProducts={paginatedProducts}
        isCafe={isCafe}
        isBookstore={isBookstore}
        isShopLp={isShopLp}
        connectedMarketplaces={connectedMarketplaces}
        marketplaceFilter={marketplaceFilter}
        setMarketplaceFilter={setMarketplaceFilter}
        marketplaceActiveCount={marketplaceActiveCount}
        hbActiveCount={hbActiveCount}
        tyActiveCount={tyActiveCount}
        n11ActiveCount={n11ActiveCount}
        amzActiveCount={amzActiveCount}
        pzrActiveCount={pzrActiveCount}
        marketplaceErrorCount={marketplaceErrorCount}
        setShowMarketplaceListingsModal={setShowMarketplaceListingsModal}
        setMarketplaceModalTab={setMarketplaceModalTab}
        setMarketplaceModalStatus={setMarketplaceModalStatus}
        products={products}
        getIsBestseller={getIsBestseller}
        hasProductBadgeLocal={hasProductBadgeLocal}
        lang={lang}
        t={t}
        branches={branches}
        includeBranches={includeBranches}
        onToggleIncludeBranches={setIncludeBranches}
      />

      {/* 3. Products Table & Pagination */}
      <ProductsTable
        products={products}
        paginatedProducts={paginatedProducts}
        filteredProducts={filteredProducts}
        loading={loading}
        isViewer={isViewer}
        isCafe={isCafe}
        isCafeRestaurant={isCafeRestaurant}
        isShopLp={isShopLp}
        isBookstore={isBookstore}
        showStoreName={effectiveShowStoreName}
        currentStoreId={currentStoreId}
        includeBranches={includeBranches}
        tableManager={tableManager}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        toggleSelectAll={toggleSelectAll}
        highlightedProductId={highlightedProductId}
        openActionMenuId={openActionMenuId}
        setOpenActionMenuId={setOpenActionMenuId}
        badgePopoverProductId={badgePopoverProductId}
        setBadgePopoverProductId={setBadgePopoverProductId}
        handleToggleBookBadge={handleToggleBookBadge}
        hasProductBadgeLocal={hasProductBadgeLocal}
        getProductBadgesLocal={getProductBadgesLocal}
        getIsBestseller={getIsBestseller}
        calculateProfitMargin={calculateProfitMargin}
        getHepsiburadaUrl={getHepsiburadaUrl}
        isHepsiburadaPending={isHepsiburadaPending}
        getTrendyolUrl={getTrendyolUrl}
        getN11Url={getN11Url}
        getAmazonUrl={getAmazonUrl}
        getPazaramaUrl={getPazaramaUrl}
        connectedMarketplaces={connectedMarketplaces}
        setShowMarketplaceListingsModal={setShowMarketplaceListingsModal}
        setMarketplaceModalTab={setMarketplaceModalTab}
        setMarketplaceModalStatus={setMarketplaceModalStatus}
        handleAutoFindImages={handleAutoFindImages}
        onEdit={onEdit}
        onDelete={onDelete}
        setRecipeProduct={setRecipeProduct}
        setSharingProduct={setSharingProduct}
        setSelectedProduct={setSelectedProduct}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        lang={lang}
        t={t}
      />

      {/* 4. Modals & Dialogs Container */}
      <ProductsModalsContainer
        products={products}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        recipeProduct={recipeProduct}
        setRecipeProduct={setRecipeProduct}
        sharingProduct={sharingProduct}
        setSharingProduct={setSharingProduct}
        isMergeModalOpen={isMergeModalOpen}
        setIsMergeModalOpen={setIsMergeModalOpen}
        isAiMenuModalOpen={isAiMenuModalOpen}
        setIsAiMenuModalOpen={setIsAiMenuModalOpen}
        showBulkPublishModal={showBulkPublishModal}
        setShowBulkPublishModal={setShowBulkPublishModal}
        selectedIds={selectedIds}
        showMarketplaceListingsModal={showMarketplaceListingsModal}
        setShowMarketplaceListingsModal={setShowMarketplaceListingsModal}
        marketplaceModalTab={marketplaceModalTab}
        marketplaceModalStatus={marketplaceModalStatus}
        branding={branding}
        currentStoreId={currentStoreId}
        onRefresh={onRefresh}
        onEdit={onEdit}
        lang={lang}
      />
    </div>
  );
};

export default ProductsTab;
