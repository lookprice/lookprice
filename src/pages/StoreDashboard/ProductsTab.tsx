import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Globe, EyeOff, FolderTree, CheckSquare, X, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";
import { useTableManager } from "@/hooks/useTableManager";
import { BOOKSTORE_BADGES, extractProductLabels, hasBookstoreBadge, toggleBookstoreBadgeData } from "@/data/bookstoreBadges";
import { resolveDomainId } from "@/utils/sectorCapability";
import { getMarketplaceListingUrl } from "@/utils/marketplaceUrls";
import { getConnectedMarketplaces } from "@/utils/marketplaceEStores";
import { matchProductSearch } from "@/lib/searchUtils";

// Vertical Slices
import { ProductsTabProps, MarketplaceFilterType, MarketplaceModalTab, MarketplaceModalStatus, ShowcaseFilterType } from "./products/types";
import { ProductsHeaderActions } from "./products/ProductsHeaderActions";
import { ProductsFilterToolbar } from "./products/ProductsFilterToolbar";
import { ProductsTable } from "./products/ProductsTable";
import { ProductsModalsContainer } from "./products/ProductsModalsContainer";
import CategoriesTab from "./CategoriesTab";

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  loading,
  isViewer,
  onBulkDelete,
  onBulkWebSale,
  onBulkCategoryAssign,
  onEdit,
  onOpenPlacement,
  onAddNew,
  onImport,
  onDelete,
  onExportReport,
  onApplyTaxRule,
  onBulkRename,
  branding,
  setBranding,
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
  const [includeZeroStock, setIncludeZeroStockState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("products_include_zero_stock");
      if (saved !== null) return saved === "true";
    }
    return false;
  });

  const setIncludeZeroStock = (val: boolean) => {
    setIncludeZeroStockState(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("products_include_zero_stock", String(val));
    }
  };
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

  // Marketplaces & showcase filtering & modal state
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceFilterType>('all');
  const [showcaseFilter, setShowcaseFilter] = useState<ShowcaseFilterType>('all');
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [isBackupLoading, setIsBackupLoading] = useState<boolean>(false);
  const [isBulkVitrinLoading, setIsBulkVitrinLoading] = useState<boolean>(false);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [recipeProduct, setRecipeProduct] = useState<any>(null);
  const [sharingProduct, setSharingProduct] = useState<any>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isEanModalOpen, setIsEanModalOpen] = useState(false);
  const [isAiMenuModalOpen, setIsAiMenuModalOpen] = useState(false);
  const [showBulkPublishModal, setShowBulkPublishModal] = useState(false);
  const [showXRayModal, setShowXRayModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [bulkCatInput, setBulkCatInput] = useState("");
  const [bulkSubCatInput, setBulkSubCatInput] = useState("");
  const [bulkCatSubmitting, setBulkCatSubmitting] = useState(false);
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
  const hasShowcaseVisibility = isShopLp || isCafe;

  // Table Manager for responsive columns & metadata display modes
  const tableManager = useTableManager({
    tableKey: 'products-table',
    defaultMetadataMode: 'inline',
    columns: [
      { id: 'barcode', label: t.barcode, defaultVisible: true, required: false },
      { id: 'image', label: lang === 'tr' ? 'Görsel' : 'Image', defaultVisible: true, required: false },
      { id: 'name', label: t.productName, defaultVisible: true, required: true },
      { id: 'category', label: t.category, defaultVisible: true, required: false },
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

  // Helper to check if a product currently has variants
  const hasProductVariants = (p: any): boolean => {
    if (!p) return false;
    if (p.has_variants === true || String(p.has_variants) === 'true') return true;
    if (Array.isArray(p.variants)) return p.variants.length > 0;
    if (typeof p.variants === 'string' && p.variants.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(p.variants);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    }
    return false;
  };

  const variantProductsCount = useMemo(
    () => products.filter(p => hasProductVariants(p)).length,
    [products]
  );

  const selectedVariantIds = useMemo(
    () => selectedIds.filter(id => {
      const prod = products.find(p => Number(p.id) === Number(id));
      return prod ? hasProductVariants(prod) : false;
    }),
    [selectedIds, products]
  );

  // Bulk convert selected variant products to single products
  const handleBulkClearVariantsSelected = async () => {
    if (selectedVariantIds.length === 0) return;
    const msg = lang === 'tr'
      ? `Seçili ${selectedVariantIds.length} ürünün varyantları kaldırılıp tekil ürüne dönüştürülecek (fiyat, stok ve barkod korunur). Devam edilsin mi?`
      : `Remove variants from ${selectedVariantIds.length} selected products and convert them to single products?`;
    if (!window.confirm(msg)) return;

    const toastId = toast.loading(lang === 'tr' ? 'Varyantlar kaldırılıyor...' : 'Removing variants...');
    try {
      const res = await api.bulkClearProductVariants(selectedVariantIds, currentStoreId);
      toast.success(
        lang === 'tr'
          ? `${res?.updatedCount ?? selectedVariantIds.length} ürün başarıyla tekil ürüne dönüştürüldü!`
          : `Converted ${res?.updatedCount ?? selectedVariantIds.length} products to single products!`,
        { id: toastId }
      );
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err?.message || (lang === 'tr' ? 'Varyantlar kaldırılamadı.' : 'Failed to remove variants.'), { id: toastId });
    }
  };

  // Single-row quick convert to single product
  const handleConvertSingleProductToSimple = async (product: any) => {
    if (!product?.id) return;
    const msg = lang === 'tr'
      ? `"${product.name}" ürününün varyantları kaldırılıp tekil ürüne dönüştürülsün mü? (Fiyat, stok ve barkod korunur)`
      : `Convert "${product.name}" to a single product by removing its variants?`;
    if (!window.confirm(msg)) return;

    const toastId = toast.loading(lang === 'tr' ? 'Tekil ürüne dönüştürülüyor...' : 'Converting to single product...');
    try {
      await api.bulkClearProductVariants([Number(product.id)], currentStoreId);
      toast.success(lang === 'tr' ? 'Ürün tekil ürüne dönüştürüldü!' : 'Converted to single product!', { id: toastId });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err?.message || (lang === 'tr' ? 'İşlem başarısız oldu.' : 'Conversion failed.'), { id: toastId });
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

  // Bulk Showcase / Menu Visibility ("Vitrinde / Menüde Yayınla" Aktif / Pasif)
  const handleBulkWebSaleSelected = async (isWebSale: boolean) => {
    if (selectedIds.length === 0 || isViewer) return;
    setIsBulkVitrinLoading(true);
    try {
      if (onBulkWebSale) {
        await onBulkWebSale(selectedIds, isWebSale);
      } else {
        await api.bulkUpdateWebSale(selectedIds, isWebSale, currentStoreId);
        toast.success(
          isWebSale
            ? (lang === 'tr'
                ? `${selectedIds.length} ürün ${isCafe ? 'menüde yayınlandı.' : 'vitrinde yayınlandı.'}`
                : `${selectedIds.length} products published.`)
            : (lang === 'tr'
                ? `${selectedIds.length} ürün ${isCafe ? 'menüden kaldırıldı.' : 'vitrinden kaldırıldı.'}`
                : `${selectedIds.length} products hidden.`)
        );
        if (onRefresh) onRefresh();
      }
      setSelectedIds([]);
    } catch {
      // handled in hook / toast
    } finally {
      setIsBulkVitrinLoading(false);
    }
  };

  // Single-row Showcase / Menu Toggle
  const handleToggleSingleWebSale = async (product: any) => {
    if (!product?.id || isViewer) return;
    const nextState = product.is_web_sale === false;
    try {
      if (onBulkWebSale) {
        await onBulkWebSale([Number(product.id)], nextState);
      } else {
        await api.bulkUpdateWebSale([Number(product.id)], nextState, currentStoreId);
        toast.success(
          nextState
            ? (lang === 'tr'
                ? `"${product.name}" ${isCafe ? 'menüde yayınlandı.' : 'vitrinde yayınlandı.'}`
                : `"${product.name}" published.`)
            : (lang === 'tr'
                ? `"${product.name}" ${isCafe ? 'menüden kaldırıldı.' : 'vitrinden kaldırıldı.'}`
                : `"${product.name}" hidden.`)
        );
        if (onRefresh) onRefresh();
      }
    } catch {
      // handled by hook
    }
  };

  // Bulk Category Assign submit
  const handleBulkCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0 || isViewer) return;
    const cleanCat = bulkCatInput.trim();
    const cleanSub = bulkSubCatInput.trim();
    setBulkCatSubmitting(true);
    try {
      if (onBulkCategoryAssign) {
        await onBulkCategoryAssign(selectedIds, cleanCat, cleanSub, true);
      } else {
        await api.bulkUpdateCategory(selectedIds, cleanCat, cleanSub, true, currentStoreId);
        toast.success(lang === 'tr' ? `${selectedIds.length} ürünün kategorisi güncellendi.` : `Updated category for ${selectedIds.length} products.`);
        if (onRefresh) onRefresh();
      }
      setShowBulkCategoryModal(false);
      setBulkCatInput("");
      setBulkSubCatInput("");
      setSelectedIds([]);
    } catch {
      // handled in hook
    } finally {
      setBulkCatSubmitting(false);
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
    return getMarketplaceListingUrl('trendyol', p, { fallbackToSearch: false });
  };

  const getN11Url = (p: any): string | null => {
    if (!p) return null;
    return getMarketplaceListingUrl('n11', p);
  };

  const getAmazonUrl = (p: any): string | null => {
    if (!p) return null;
    return getMarketplaceListingUrl('amazon', p, { fallbackToSearch: false });
  };

  const getPazaramaUrl = (p: any): string | null => {
    if (!p) return null;
    return getMarketplaceListingUrl('pazarama', p);
  };

  const connectedMarketplaces = useMemo(() => {
    const estoreConn = getConnectedMarketplaces(branding);
    const mp = branding?.marketplace_settings || {};
    const hb = estoreConn.hepsiburada || !!(mp.hepsiburada?.merchant_id && (mp.hepsiburada?.api_key || mp.hepsiburada?.secret_key));
    const ty = estoreConn.trendyol || !!(mp.trendyol?.supplier_id && mp.trendyol?.api_key);
    const n11 = estoreConn.n11 || !!(mp.n11?.api_key && mp.n11?.api_secret);
    const amz = estoreConn.amazon || !!(mp.amazon?.seller_id && (mp.amazon?.refresh_token || mp.amazon?.clientId));
    const pzr = estoreConn.pazarama || !!(mp.pazarama?.api_key && mp.pazarama?.api_secret);
    return {
      hepsiburada: hb,
      trendyol: ty,
      n11: n11,
      amazon: amz,
      pazarama: pzr,
      hasAnyConnected: hb || ty || n11 || amz || pzr,
    };
  }, [branding]);

  // Strict sectoral isolation: Product X-Ray is ONLY for shopLP (retail) stores with connected marketplace APIs
  const isShopLpOnly = (domainId === 'RETAIL' || branding?.store_type === 'shop' || branding?.store_type === 'retail') && !isCafe && !isBookstore && !isPortfolio;
  const showXRayButton = isShopLpOnly && connectedMarketplaces.hasAnyConnected;

  // Helper to check if a product is a bestseller
  const getIsBestseller = (p: any): boolean => {
    if (!p) return false;
    if (p.is_bestseller === true || p.is_bestseller === 1 || p.is_bestseller === 'true' || p.is_bestseller === '1') return true;
    if (p.is_popular === true || p.is_popular === 1 || p.is_popular === 'true' || p.is_popular === '1') return true;
    if (Array.isArray(p.labels) && (p.labels.includes('bestseller') || p.labels.includes('cok_satan') || p.labels.includes('populer'))) return true;
    if (Array.isArray(p.tags) && (p.tags.includes('bestseller') || p.tags.includes('cok_satan') || p.tags.includes('populer'))) return true;
    return false;
  };

  // Distinct category list (respecting branding.operator_categories order + product categories)
  const operatorCategoryTree = useMemo(() => {
    const raw = branding?.operator_categories;
    if (!Array.isArray(raw)) return [] as { name: string; sub_categories: string[] }[];
    return raw
      .map((item: any) => {
        if (typeof item === 'string') return { name: item.trim(), sub_categories: [] as string[] };
        if (item && typeof item === 'object' && item.name) {
          return {
            name: String(item.name).trim(),
            sub_categories: Array.isArray(item.sub_categories)
              ? item.sub_categories.map((s: any) => String(s || '').trim()).filter(Boolean)
              : []
          };
        }
        return null;
      })
      .filter((x): x is { name: string; sub_categories: string[] } => Boolean(x && x.name));
  }, [branding?.operator_categories]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    operatorCategoryTree.forEach((c) => {
      if (c.name) cats.add(c.name);
    });
    const extra: string[] = [];
    products.forEach(p => {
      const c = String(p.category || '').trim();
      if (c && !cats.has(c)) {
        cats.add(c);
        extra.push(c);
      }
    });
    return [
      ...operatorCategoryTree.map((c) => c.name),
      ...extra.sort((a, b) => a.localeCompare(b, 'tr'))
    ];
  }, [products, operatorCategoryTree]);

  const subCategoriesByCategory = useMemo(() => {
    const map = new Map<string, Set<string>>();
    operatorCategoryTree.forEach((c) => {
      if (!map.has(c.name)) map.set(c.name, new Set());
      c.sub_categories.forEach((s) => map.get(c.name)!.add(s));
    });
    products.forEach((p) => {
      const c = String(p.category || '').trim();
      const s = String(p.sub_category || '').trim();
      if (c && s) {
        if (!map.has(c)) map.set(c, new Set());
        map.get(c)!.add(s);
      }
    });
    return map;
  }, [products, operatorCategoryTree]);

  const effectiveShowStoreName = Boolean(showStoreName || includeBranches || (branches && branches.length > 0));

  // Showcase & uncategorized summary counts (scoped by branch toggle)
  const { webActiveCount, webPassiveCount, uncategorizedCount } = useMemo(() => {
    let webOn = 0;
    let webOff = 0;
    let uncat = 0;
    products.forEach((p) => {
      if (currentStoreId && p.store_id && Number(p.store_id) !== Number(currentStoreId) && !includeBranches) {
        return;
      }
      if (!p.category || !String(p.category).trim()) uncat++;
      if (p.is_web_sale === false) webOff++;
      else webOn++;
    });
    return { webActiveCount: webOn, webPassiveCount: webOff, uncategorizedCount: uncat };
  }, [products, currentStoreId, includeBranches]);

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // If store_id belongs to a branch and user has not enabled "Şube Stokları", hide branch products
      if (currentStoreId && p.store_id && Number(p.store_id) !== Number(currentStoreId) && !includeBranches) {
        return false;
      }
      
      const matchesSearch = matchProductSearch(p, search);

      let matchesCategory = true;
      if (selectedCategory === "all") {
        matchesCategory = true;
      } else if (selectedCategory === "__uncategorized__") {
        matchesCategory = !p.category || !String(p.category).trim();
      } else if (selectedCategory === "__has_variants__") {
        matchesCategory = hasProductVariants(p);
      } else if (selectedCategory === "bestsellers") {
        matchesCategory = getIsBestseller(p);
      } else if (selectedCategory.startsWith("badge_")) {
        const targetBadgeId = selectedCategory.replace("badge_", "");
        matchesCategory = hasProductBadgeLocal(p, targetBadgeId);
      } else {
        matchesCategory = p.category === selectedCategory;
      }

      const hasActiveSearch = Boolean(search && search.trim().length > 0);

      let matchesStock = true;
      if (!includeZeroStock && !hasActiveSearch) {
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

      let matchesShowcase = true;
      if (hasShowcaseVisibility && showcaseFilter !== 'all') {
        if (showcaseFilter === 'web_active') {
          matchesShowcase = p.is_web_sale !== false;
        } else if (showcaseFilter === 'web_passive') {
          matchesShowcase = p.is_web_sale === false;
        }
      }

      const isServiceItem = (() => {
        const pType = String(p.product_type || '').trim().toLowerCase();
        if (pType === 'service' || pType === 'hizmet' || pType === 'servis') return true;
        const cat = String(p.category || '').trim().toLocaleLowerCase('tr-TR');
        const subCat = String(p.sub_category || '').trim().toLocaleLowerCase('tr-TR');
        if (cat === 'servis' || cat === 'hizmet' || cat === 'hizmet/servis' || cat === 'servis/hizmet') return true;
        if (subCat.includes('servis') || subCat.includes('hizmet')) return true;
        return false;
      })();

      let matchesMarketplace = true;
      if (isShopLp && marketplaceFilter !== 'all') {
        if (isServiceItem) return false;
        const isHb = Boolean(p.is_hepsiburada_active);
        const isTy = Boolean(p.is_trendyol_active);
        const isN11 = Boolean(p.is_n11_active && p.n11_id && String(p.n11_id).trim().toLowerCase() !== 'null' && String(p.n11_id).trim().toUpperCase() !== 'PUBLISHED');
        const isAmz = Boolean(p.is_amazon_active && p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== 'null' && String(p.amazon_asin).trim().length >= 9 && !String(p.amazon_asin).startsWith('http'));
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
          const isRealErr = (err: any) => {
            if (!err) return false;
            const l = String(err).toLowerCase();
            if ((l.includes('fiyat') || l.includes('stok') || l.includes('stoğu')) && (l.includes('yetersiz') || l.includes('pasife') || l.includes('kapalı'))) return false;
            if (l.includes('operatör tarafından satışa kapatıldı')) return false;
            return true;
          };
          const hasValidStockAndPrice = Number(p.price || 0) > 0 && Number(p.stock_quantity || 0) > 0;
          matchesMarketplace = hasValidStockAndPrice && Boolean(
            (!isHb && isRealErr(p.hepsiburada_last_error)) ||
            (!isTy && isRealErr(p.trendyol_last_error)) ||
            (!isN11 && isRealErr(p.n11_last_error)) ||
            (!isAmz && isRealErr(p.amazon_last_error)) ||
            (!isPzr && isRealErr(p.pazarama_last_error))
          );
        } else if (marketplaceFilter === 'not_listed') {
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
            : Number(p.stock_quantity ?? p.stock ?? 0) || 0;
          matchesMarketplace = !isAnyActive && effectiveStock > 0;
        }
      }

      return matchesSearch && matchesCategory && matchesStock && matchesShowcase && matchesMarketplace;
    });
  }, [products, search, selectedCategory, includeZeroStock, showcaseFilter, marketplaceFilter, isShopLp, hasShowcaseVisibility, currentStoreId, includeBranches, effectiveShowStoreName, optimisticBadges]);

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
      const pType = String(p.product_type || '').trim().toLowerCase();
      const cat = String(p.category || '').trim().toLocaleLowerCase('tr-TR');
      const subCat = String(p.sub_category || '').trim().toLocaleLowerCase('tr-TR');
      if (
        pType === 'service' ||
        pType === 'hizmet' ||
        pType === 'servis' ||
        cat === 'servis' ||
        cat === 'hizmet' ||
        cat === 'hizmet/servis' ||
        cat === 'servis/hizmet' ||
        subCat.includes('servis') ||
        subCat.includes('hizmet')
      ) {
        return;
      }
      const isHb = Boolean(p.is_hepsiburada_active);
      const isTy = Boolean(p.is_trendyol_active);
      const isN11 = Boolean(p.is_n11_active && p.n11_id && String(p.n11_id).trim().toLowerCase() !== 'null' && String(p.n11_id).trim().toUpperCase() !== 'PUBLISHED');
      const isAmz = Boolean(p.is_amazon_active && p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== 'null' && String(p.amazon_asin).trim().length >= 9 && !String(p.amazon_asin).startsWith('http'));
      const isPzr = Boolean(p.is_pazarama_active);

      if (isHb) hb++;
      if (isTy) ty++;
      if (isN11) n11++;
      if (isAmz) amz++;
      if (isPzr) pzr++;
      if (isHb || isTy || isN11 || isAmz || isPzr) active++;
      const isRealErr = (errMsg: any) => {
        if (!errMsg) return false;
        const l = String(errMsg).toLowerCase();
        if ((l.includes('fiyat') || l.includes('stok') || l.includes('stoğu')) && (l.includes('yetersiz') || l.includes('pasife') || l.includes('kapalı'))) return false;
        if (l.includes('operatör tarafından satışa kapatıldı')) return false;
        return true;
      };
      const hasValidStockAndPrice = Number(p.price || 0) > 0 && Number(p.stock_quantity || 0) > 0;
      if (hasValidStockAndPrice && (
        (!isHb && isRealErr(p.hepsiburada_last_error)) ||
        (!isTy && isRealErr(p.trendyol_last_error)) ||
        (!isN11 && isRealErr(p.n11_last_error)) ||
        (!isAmz && isRealErr(p.amazon_last_error)) ||
        (!isPzr && isRealErr(p.pazarama_last_error))
      )) {
        err++;
      }
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
    <div className="w-full">
      {/* 1. Header and Primary Action Buttons */}
      <ProductsHeaderActions
        t={t}
        lang={lang}
        isViewer={isViewer}
        isCafe={isCafe}
        selectedIds={selectedIds}
        selectedVariantCount={selectedVariantIds.length}
        handleBulkClearVariantsSelected={handleBulkClearVariantsSelected}
        onAddNew={onAddNew}
        onImport={onImport}
        onExportReport={() => onExportReport && (onExportReport as any)(includeZeroStock, filteredProducts)}
        onOpenXRay={() => setShowXRayModal(true)}
        showXRay={showXRayButton}
        handleBulkDeleteSelected={handleBulkDeleteSelected}
        handleSyncNamesFromInvoices={handleSyncNamesFromInvoices}
        isFixingNames={isFixingNames}
        setIsMergeModalOpen={setIsMergeModalOpen}
        setIsEanModalOpen={setIsEanModalOpen}
        setIsAiMenuModalOpen={setIsAiMenuModalOpen}
        driveConnected={driveConnected}
        isBackupLoading={isBackupLoading}
        setIsBackupLoading={setIsBackupLoading}
        isBookstore={isBookstore}
        onRefresh={onRefresh}
        currentStoreId={currentStoreId}
        onOpenCategoriesModal={() => setShowCategoriesModal(true)}
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
        hasParentStore={Boolean(branding?.parent_id)}
        includeBranches={includeBranches}
        onToggleIncludeBranches={setIncludeBranches}
        variantProductsCount={variantProductsCount}
        showcaseFilter={showcaseFilter}
        setShowcaseFilter={setShowcaseFilter}
        webActiveCount={webActiveCount}
        webPassiveCount={webPassiveCount}
        uncategorizedCount={uncategorizedCount}
      />

      {/* Contextual Bulk Selection Toolbar */}
      {selectedIds.length > 0 && !isViewer && (
        <div className="my-2 px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono tabular-nums">{selectedIds.length}</span>
              <span>{lang === 'tr' ? 'ürün seçildi' : 'selected'}</span>
            </span>

            {filteredProducts.length > selectedIds.length && (
              <button
                type="button"
                onClick={() => setSelectedIds(filteredProducts.map(p => p.id))}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
              >
                {lang === 'tr'
                  ? `Filtrelenen Tümünü Seç (${filteredProducts.length})`
                  : `Select All Filtered (${filteredProducts.length})`}
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>{lang === 'tr' ? 'Seçimi Temizle' : 'Clear'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {hasShowcaseVisibility && (
              <>
                <button
                  type="button"
                  disabled={isBulkVitrinLoading}
                  onClick={() => handleBulkWebSaleSelected(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isBulkVitrinLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                  <span>
                    {lang === 'tr'
                      ? isCafe
                        ? 'Menüde Yayınla (Aktif)'
                        : 'Vitrinde Yayınla (Aktif)'
                      : 'Publish to Web'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={isBulkVitrinLoading}
                  onClick={() => handleBulkWebSaleSelected(false)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {isBulkVitrinLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />}
                  <span>
                    {lang === 'tr'
                      ? isCafe
                        ? 'Menüden Kaldır (Pasif)'
                        : 'Vitrinden Kaldır (Pasif)'
                      : 'Hide from Web'}
                  </span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setBulkCatInput(selectedCategory !== 'all' && !selectedCategory.startsWith('__') && !selectedCategory.startsWith('badge_') && selectedCategory !== 'bestsellers' ? selectedCategory : '');
                setBulkSubCatInput('');
                setShowBulkCategoryModal(true);
              }}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FolderTree className="w-3 h-3" />
              <span>{lang === 'tr' ? 'Kategori Ata' : 'Assign Category'}</span>
            </button>
          </div>
        </div>
      )}

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
        onOpenPlacement={onOpenPlacement}
        onDelete={onDelete}
        onConvertToSingle={handleConvertSingleProductToSimple}
        setRecipeProduct={setRecipeProduct}
        setSharingProduct={setSharingProduct}
        setSelectedProduct={setSelectedProduct}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        lang={lang}
        t={t}
        onRefresh={onRefresh}
        onToggleWebSale={hasShowcaseVisibility && !isViewer ? handleToggleSingleWebSale : undefined}
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
        isEanModalOpen={isEanModalOpen}
        setIsEanModalOpen={setIsEanModalOpen}
        isAiMenuModalOpen={isAiMenuModalOpen}
        setIsAiMenuModalOpen={setIsAiMenuModalOpen}
        showBulkPublishModal={showBulkPublishModal}
        setShowBulkPublishModal={setShowBulkPublishModal}
        showXRayModal={showXRayModal}
        setShowXRayModal={setShowXRayModal}
        selectedIds={selectedIds}
        showMarketplaceListingsModal={showMarketplaceListingsModal}
        setShowMarketplaceListingsModal={setShowMarketplaceListingsModal}
        marketplaceModalTab={marketplaceModalTab}
        setMarketplaceModalTab={setMarketplaceModalTab}
        marketplaceModalStatus={marketplaceModalStatus}
        branding={branding}
        currentStoreId={currentStoreId}
        onRefresh={onRefresh}
        onEdit={onEdit}
        lang={lang}
      />

      {/* 5. Category Studio Modal (Opened from Products Header) */}
      {showCategoriesModal && (
        <CategoriesTab
          mode="modal"
          isOpen={showCategoriesModal}
          onClose={() => setShowCategoriesModal(false)}
          products={products}
          branding={branding}
          setBranding={setBranding}
          currentStoreId={currentStoreId}
          isViewer={isViewer}
          onRefreshProducts={onRefresh}
          onApplyTaxRule={onApplyTaxRule}
          onNavigateToProducts={(cat) => {
            if (cat) setSelectedCategory(cat);
            setPage(1);
            setShowCategoriesModal(false);
          }}
        />
      )}

      {/* 6. Bulk Category Assign Modal */}
      {showBulkCategoryModal && (
        <div className="fixed inset-0 z-[110] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">
                  {lang === 'tr' ? `Toplu Kategori Ata (${selectedIds.length} Ürün)` : `Bulk Assign Category (${selectedIds.length})`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkCategoryModal(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBulkCategorySubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {lang === 'tr' ? 'Ana Kategori' : 'Main Category'}
                </label>
                <input
                  type="text"
                  list="bulk-category-suggestions"
                  value={bulkCatInput}
                  onChange={(e) => {
                    setBulkCatInput(e.target.value);
                    setBulkSubCatInput('');
                  }}
                  placeholder={lang === 'tr' ? 'Mevcut seçin veya yeni yazın (boş = kategorisiz)' : 'Pick existing or type new'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                />
                <datalist id="bulk-category-suggestions">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {lang === 'tr' ? 'Alt Kategori (Opsiyonel)' : 'Sub-category (Optional)'}
                </label>
                <input
                  type="text"
                  list="bulk-subcategory-suggestions"
                  value={bulkSubCatInput}
                  onChange={(e) => setBulkSubCatInput(e.target.value)}
                  placeholder={lang === 'tr' ? 'Alt kategori seçin veya yazın' : 'Sub-category'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                />
                <datalist id="bulk-subcategory-suggestions">
                  {Array.from(subCategoriesByCategory.get(bulkCatInput.trim()) || []).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkCategoryModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  {lang === 'tr' ? 'İptal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={bulkCatSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {bulkCatSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{lang === 'tr' ? 'Uygula' : 'Apply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTab;
