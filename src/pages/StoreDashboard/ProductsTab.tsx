import React, { useState, useDeferredValue, useEffect, useMemo } from "react";
import { normalizeSearch } from "../../lib/searchUtils";
import { 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Edit2, 
  FileText,
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  Filter,
  AlertTriangle,
  Download,
  QrCode,
  Package,
  Tag,
  Percent,
  History,
  Truck,
  X,
  Store,
  UploadCloud,
  MoreVertical,
  Globe,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  Flame,
  Zap,
  Sparkles,
  Image as ImageIcon,
  Cloud,
  Barcode,
  Layers
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import ProductMovementModal from "../../components/ProductMovementModal";
import { ProductSocialMediaShareModal } from "../../components/ProductSocialMediaShareModal";
import { RecipeModal } from "./modals/RecipeModal";
import ProductsFilterBar from "../../components/dashboard/ProductsFilterBar";
import { DuplicateMergeModal } from "../../components/DuplicateMergeModal";
import AiMenuScanModal from "./modals/AiMenuScanModal";
import { MarketplaceBulkPublishModal } from "../../components/marketplace/MarketplaceBulkPublishModal";
import { MarketplaceListingsModal } from "../../components/marketplace/MarketplaceListingsModal";
import { TableManager } from "../../components/common/TableManager";
import { useTableManager, ColumnDefinition } from "../../hooks/useTableManager";
import { api } from "../../services/api";
import { toast } from "sonner";
import { getLabels } from "../../utils/showcase";
import { getConnectedMarketplaces } from "../../utils/marketplaceEStores";

interface ProductsTabProps {
  products: any[];
  loading: boolean;
  isViewer: boolean;
  onDeleteAll: () => void;
  onBulkDelete?: (ids: number[]) => void;
  onEdit: (product: any) => void;
  onAddNew: () => void;
  onImport: () => void;
  onDelete: (id: number) => void;
  onExportReport: () => void;
  onApplyTaxRule?: (category: string, taxRate: number) => void;
  onBulkPriceUpdate?: () => void;
  onBulkRecalculatePrice2?: () => void;
  onBulkAdd?: (products: any[]) => void;
  onBulkRename?: (renames: { id: number, name: string }[]) => void;
  onReformatNames?: () => void;
  onShowQr: () => void;
  branding?: any;
  showStoreName?: boolean;
  currentStoreId?: number;
  includeBranches?: boolean;
  propertiesCount?: number;
  onSwitchTab?: (tab: string) => void;
  isCafeRestaurant?: boolean;
  onRefresh?: () => void;
}

const ProductsTab = ({ 
  products, 
  loading, 
  isViewer, 
  onDeleteAll, 
  onBulkDelete,
  onEdit, 
  onAddNew,
  onImport,
  onDelete,
  onExportReport,
  onApplyTaxRule,
  onBulkPriceUpdate,
  onBulkRecalculatePrice2,
  onBulkAdd,
  onBulkRename,
  onReformatNames,
  onShowQr,
  branding,
  showStoreName,
  currentStoreId,
  includeBranches,
  propertiesCount,
  onSwitchTab,
  isCafeRestaurant,
  onRefresh
}: ProductsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [driveConnected, setDriveConnected] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  useEffect(() => {
    api.getGoogleDriveSettings().then(res => {
      setDriveConnected(!!res?.connected);
    }).catch(err => console.error("Error fetching drive connected status in ProductsTab", err));
  }, []);
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return localStorage.getItem('productsTabCategory') || "all";
  });

  useEffect(() => {
    localStorage.setItem('productsTabCategory', selectedCategory);
  }, [selectedCategory]);
  const [marketplaceFilter, setMarketplaceFilter] = useState("all"); // all, listed, not_listed
  const [includeZeroStock, setIncludeZeroStock] = useState(true);
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [isFixingNames, setIsFixingNames] = useState(false);
  const [openMarketMenu, setOpenMarketMenu] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkPublishModal, setShowBulkPublishModal] = useState(false);
  const [showMarketplaceListingsModal, setShowMarketplaceListingsModal] = useState(false);
  const [marketplaceModalTab, setMarketplaceModalTab] = useState<'all' | 'hepsiburada' | 'trendyol' | 'n11' | 'amazon' | 'pazarama'>('hepsiburada');
  const [marketplaceModalStatus, setMarketplaceModalStatus] = useState<'all' | 'active' | 'error' | 'inactive'>('all');
  const [isFindingImages, setIsFindingImages] = useState(false);
  const [sharingProduct, setSharingProduct] = useState<any>(null);
  const [recipeProduct, setRecipeProduct] = useState<any>(null);
  const [bestsellerStateMap, setBestsellerStateMap] = useState<Record<number, boolean>>({});
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isAiMenuModalOpen, setIsAiMenuModalOpen] = useState(false);

  const isCafe = isCafeRestaurant || 
    branding?.store_type === 'cafe_restaurant' || 
    branding?.store_type === 'horeca' || 
    branding?.store_type === 'restaurant' || 
    branding?.store_type === 'cafe' || 
    branding?.store_type === 'hotel' || 
    branding?.page_layout_settings?.sector === 'cafe_restaurant' ||
    branding?.page_layout_settings?.sector === 'horeca';
  const isPortfolio = branding?.store_type === 'real_estate' || branding?.store_type === 'motor_vehicle' || branding?.store_type === 'portfolio' || branding?.page_layout_settings?.sector === 'real_estate' || branding?.page_layout_settings?.sector === 'automotive';
  const isShopLp = !isCafe && !isPortfolio;
  const connectedMarketplaces = useMemo(() => getConnectedMarketplaces(branding), [branding]);

  const productColumns = useMemo<ColumnDefinition[]>(() => {
    const cols: ColumnDefinition[] = [];
    if (!isCafe) {
      cols.push({ id: 'barcode', label: t.barcode || (lang === 'tr' ? 'Barkod' : 'Barcode'), defaultVisible: true, category: 'primary' });
    }
    cols.push({ id: 'image', label: lang === 'tr' ? 'Görsel' : 'Image', defaultVisible: true, category: 'primary' });
    cols.push({ id: 'product', label: t.productName || (lang === 'tr' ? 'Ürün Adı' : 'Product Name'), required: true, category: 'primary' });
    if (showStoreName) {
      cols.push({ id: 'branch', label: t.branch || (lang === 'tr' ? 'Şube' : 'Branch'), defaultVisible: true, category: 'primary' });
    }
    cols.push({ id: 'price', label: t.price || (lang === 'tr' ? 'Satış Fiyatı' : 'Price'), defaultVisible: true, category: 'pricing' });
    cols.push({ id: 'cost', label: t.cost || (lang === 'tr' ? 'Maliyet' : 'Cost'), defaultVisible: true, category: 'pricing' });
    cols.push({ id: 'stock', label: t.stock || (lang === 'tr' ? 'Stok' : 'Stock'), defaultVisible: true, category: 'inventory' });
    cols.push({ id: 'actions', label: t.actions || (lang === 'tr' ? 'İşlemler' : 'Actions'), required: true, category: 'actions' });
    return cols;
  }, [t, lang, isCafe, showStoreName]);

  const tableManager = useTableManager({
    tableKey: `products_${branding?.id || currentStoreId || 'default'}`,
    columns: productColumns,
    defaultMetadataMode: 'inline'
  });

  const getIsBestseller = (p: any) => bestsellerStateMap[p.id] !== undefined ? bestsellerStateMap[p.id] : !!p.is_bestseller;

  const handleAutoFindImages = async (params: { productIds?: number[], allMissing?: boolean, id?: number }) => {
    if (isFindingImages) return;
    
    // For bulk actions, ask for confirmation
    if (params.allMissing || (params.productIds && params.productIds.length > 1)) {
       const msg = lang === 'tr' 
        ? "Resmi olmayan ürünler için internet üzerinden (barkod ve yapay zeka) otomatik resim aranacak. Bu işlem biraz zaman alabilir. Devam etmek istiyor musunuz?"
        : "Automated image search will be performed for products without images using barcode databases and AI. This may take some time. Do you want to continue?";
       if (!window.confirm(msg)) return;
    }

    try {
      setIsFindingImages(true);
      toast.info(lang === 'tr' ? "Görüntü araması başlatıldı..." : "Image search started...");
      
      const res = await api.autoFindImage(params, currentStoreId, includeBranches);
      
      if (res && res.success) {
        if (res.updatedCount > 0) {
          toast.success(lang === 'tr' 
            ? `${res.updatedCount} ürün için resim bulundu ve güncellendi.`
            : `Images found and updated for ${res.updatedCount} products.`);
          
          window.location.reload();
        } else {
          toast.info(lang === 'tr'
            ? "Maalesef bu ürünler için uygun resim bulunamadı."
            : "No suitable images were found for these products.");
        }
      } else {
        toast.error(res?.error || "Error");
      }
    } catch (e: any) {
      toast.error(e.message || "Error finding images");
    } finally {
      setIsFindingImages(false);
    }
  };

  const handleFixNames = async () => {
    toast.info("handleFixNames triggered");
    if (isFixingNames) return;
    if (!window.confirm(lang === 'tr' ? "Tüm ürün isimleri 'Title Case' (İlk Harfler Büyük) formatına getirilecek. Devam etmek istiyor musunuz?" : "All product names will be converted to 'Title Case'. Do you want to continue?")) {
      return;
    }

    try {
      setIsFixingNames(true);
      const res = await api.reformatProductNames(currentStoreId);
      if (res && res.success) {
        toast.success(res.message || (lang === 'tr' ? "Ürün isimleri başarıyla düzeltildi." : "Product names reformatted successfully."));
        window.location.reload(); 
      } else {
        toast.error(res?.error || "Error");
      }
    } catch (e: any) {
      toast.error(e.message || "Error reformating names");
    } finally {
      setIsFixingNames(false);
    }
  };

  const itemsPerPage = 15;

  const handlePublishToPazarama = async (product: any) => {
    if (publishingId === product.id) return;
    try {
      setPublishingId(product.id);
      const res = await api.publishPazaramaProduct(product.id, currentStoreId);
      if (res && res.success) {
        toast.success(res.message || (lang === 'tr' ? "Ürün başarıyla Pazarama'ya aktarıldı." : "Product published to Pazarama successfully."));
      } else {
        toast.error(res?.error || (lang === 'tr' ? "Aktarım başarısız oldu." : "Publish failed."));
      }
    } catch (e: any) {
      toast.error(e.message || "Pazarama aktarım hatası");
    } finally {
      setPublishingId(null);
    }
  };

  const handlePublishToTrendyol = async (product: any) => {
    if (publishingId === product.id) return;
    try {
      setPublishingId(product.id);
      const res = await api.publishTrendyolProduct(product.id, currentStoreId);
      if (res && res.success) {
        toast.success(res.message || (lang === 'tr' ? "Ürün başarıyla Trendyol'a aktarıldı." : "Product published to Trendyol successfully."));
      } else {
        toast.error(res?.error || (lang === 'tr' ? "Aktarım başarısız oldu." : "Publish failed."));
      }
    } catch (e: any) {
      toast.error(e.message || "Trendyol aktarım hatası");
    } finally {
      setPublishingId(null);
    }
  };

  const handlePublishToN11 = async (product: any) => {
    if (publishingId === product.id) return;
    try {
      setPublishingId(product.id);
      const res = await api.publishN11Product(product.id, currentStoreId);
      if (res && res.success) {
        toast.success(res.message || (lang === 'tr' ? "Ürün başarıyla N11'e aktarıldı." : "Product published to N11 successfully."));
      } else {
        toast.error(res?.error || (lang === 'tr' ? "Aktarım başarısız oldu." : "Publish failed."));
      }
    } catch (e: any) {
      toast.error(e.message || "N11 aktarım hatası");
    } finally {
      setPublishingId(null);
    }
  };

  const handlePublishToHepsiburada = async (product: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (publishingId === product.id) return;
    if (!product.barcode || !String(product.barcode).trim()) {
      toast.error(lang === 'tr' ? `"${product.name}" ürününün barkodu eksik! Hepsiburada'da ilana açmak için barkod zorunludur.` : "Barcode is required to publish on Hepsiburada!");
      return;
    }
    try {
      setPublishingId(product.id);
      const res = await api.publishHepsiburadaProduct(product.id, currentStoreId);
      if (res && (res.data?.success || res?.success)) {
        toast.success(lang === 'tr' ? `"${product.name}" Hepsiburada'da ilana açıldı / güncellendi!` : `"${product.name}" published to Hepsiburada!`);
        if (onRefresh) onRefresh();
      } else {
        toast.error(res?.data?.error || res?.error || (lang === 'tr' ? "Aktarım başarısız oldu." : "Publish failed."));
      }
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || (lang === 'tr' ? "Hepsiburada aktarım hatası" : "Publish failed"));
    } finally {
      setPublishingId(null);
    }
  };

  const calculateProfitMargin = (p: any) => {
    if (!p.cost_price || p.cost_price === 0) return null;
    
    const getRate = (currency: string) => {
      if (currency === 'TRY' || !currency) return 1;
      return branding?.currency_rates?.[currency] || 1;
    };

    const salesRate = getRate(p.currency);
    const costRate = getRate(p.cost_currency);

    // Sales price is tax-inclusive, cost price is tax-exclusive
    // We must extract the tax from the sales price to calculate true profit.
    const taxRate = p.tax_rate ?? (branding?.default_tax_rate ?? 20);
    const taxMultiplier = 1 + (Number(taxRate) / 100);

    const rawSalesInTry = p.price * salesRate;
    const taxExclusiveSalesInTry = rawSalesInTry / taxMultiplier;

    const costInTry = p.cost_price * costRate;

    const profit = taxExclusiveSalesInTry - costInTry;
    const margin = (profit / costInTry) * 100;
    
    return {
      profitInTry: profit,
      margin: margin
    };
  };

  const getProductStock = (p: any) => {
    if (p.variants) {
      let vars: any[] = [];
      if (typeof p.variants === 'string') {
        try { vars = JSON.parse(p.variants); } catch (e) { vars = []; }
      } else if (Array.isArray(p.variants)) {
        vars = p.variants;
      }
      if (vars.length > 0) {
        return vars.reduce((sum: number, v: any) => sum + (Number(v.stock_quantity) || Number(v.stock) || 0), 0);
      }
    }
    return Number(p.stock_quantity) || 0;
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const isSelectedCategoryValid = selectedCategory === "all" || selectedCategory === "bestsellers" || categories.includes(selectedCategory);
  const effectiveCategory = isSelectedCategoryValid ? selectedCategory : "all";

  const hbActiveCount = products.filter(p => p.is_hepsiburada_active).length;
  const marketplaceActiveCount = products.filter(p => 
    p.is_hepsiburada_active || p.is_trendyol_active || p.is_n11_active || p.is_amazon_active || p.is_pazarama_active
  ).length;
  const marketplaceErrorCount = products.filter(p => 
    p.hepsiburada_last_error || p.trendyol_last_error || p.n11_last_error || p.amazon_last_error || p.pazarama_last_error
  ).length;

  const filteredProducts = products.filter(p => {
    const searchTerms = normalizeSearch(deferredSearch || "").split(/\s+/).filter(Boolean);
    const matchesSearch = searchTerms.length === 0 ? true : searchTerms.every(term => 
      normalizeSearch(p.name || "").includes(term) || (p.barcode && p.barcode.toString().includes(term))
    );
    const matchesCategory = effectiveCategory === "bestsellers" 
      ? getIsBestseller(p) 
      : (effectiveCategory === "all" || p.category === effectiveCategory);

    const isAnyMpActive = Boolean(p.is_hepsiburada_active || p.is_trendyol_active || p.is_n11_active || p.is_amazon_active || p.is_pazarama_active);
    const hasAnyMpError = Boolean(p.hepsiburada_last_error || p.trendyol_last_error || p.n11_last_error || p.amazon_last_error || p.pazarama_last_error);

    const matchesMarketplace = 
      marketplaceFilter === "all" ? true :
      marketplaceFilter === "listed" ? isAnyMpActive :
      marketplaceFilter === "hepsiburada" ? Boolean(p.is_hepsiburada_active) :
      marketplaceFilter === "errors" ? hasAnyMpError :
      marketplaceFilter === "not_listed" ? !isAnyMpActive :
      true;
    
    // Stok adetleri 0 ve altı olanları gizle, ancak arama yapılıyorsa veya includeZeroStock aktifse göster
    if (!includeZeroStock && searchTerms.length === 0) {
      if (getProductStock(p) <= 0) {
        return false;
      }
    }
    
    return matchesSearch && matchesCategory && matchesMarketplace;
  }).sort((a, b) => {
    const aLabels = getLabels(a.labels);
    const bLabels = getLabels(b.labels);
    const aIsNewLabel = aLabels.includes('yeni_fatura_urunu') ? 1 : 0;
    const bIsNewLabel = bLabels.includes('yeni_fatura_urunu') ? 1 : 0;
    
    if (aIsNewLabel && !bIsNewLabel) return -1;
    if (!aIsNewLabel && bIsNewLabel) return 1;

    // Also consider recently updated products as "new"
    const isRecent = (dateStr: string) => {
      if (!dateStr) return false;
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
      return diffDays < 3; // within 3 days
    };

    const aIsRecent = isRecent(a.updated_at);
    const bIsRecent = isRecent(b.updated_at);

    if (aIsRecent && !bIsRecent) return -1;
    if (!aIsRecent && bIsRecent) return 1;

    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
  
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleBulkDeleteFiltered = () => {
    if (filteredProducts.length === 0) return;
    
    const confirmMsg = lang === 'tr' 
      ? `FİLTRELENMİŞ OLAN ${filteredProducts.length} ADET ÜRÜNÜ SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?\n\nBu işlem geri alınamaz!` 
      : `ARE YOU SURE YOU WANT TO DELETE ${filteredProducts.length} FILTERED PRODUCTS?\n\nThis action cannot be undone!`;
      
    if (window.confirm(confirmMsg)) {
      onBulkDelete?.(filteredProducts.map(p => p.id));
      setSelectedIds([]);
    }
  };

  const toggleSelectAll = () => {
    const allOnPageSelected = paginatedProducts.every(p => selectedIds.includes(p.id));
    if (allOnPageSelected) {
      const pageIds = paginatedProducts.map(p => p.id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedProducts.map(p => p.id);
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    const confirmMsg = lang === 'tr' 
      ? `SEÇİLMİŞ OLAN ${selectedIds.length} ADET ÜRÜNÜ SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?` 
      : `ARE YOU SURE YOU WANT TO DELETE ${selectedIds.length} SELECTED PRODUCTS?`;
      
    if (window.confirm(confirmMsg)) {
      onBulkDelete?.(selectedIds);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  return (
    <div className="space-y-4">
      {propertiesCount !== undefined && propertiesCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[1.5rem] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div className="flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
             <div>
               <h4 className="text-sm font-black text-amber-800 uppercase tracking-wide">
                 {lang === 'tr' ? "Emlak İlanları Tespit Edildi" : "Real Estate Listings Detected"}
               </h4>
               <p className="text-xs text-amber-700 font-medium leading-relaxed">
                 {lang === 'tr' 
                   ? `Bu mağazada ${propertiesCount} adet emlak portföy ilanı bulunmaktadır. Menü yapısı ürün/operasyon odaklı olduğundan emlak ilanlarını görüntülemek/silmek için sol menüdeki "Emlak Portföyü (Demo)" alanını kullanabilirsiniz.` 
                   : `There are ${propertiesCount} real estate listings registered in this store. Since menus are product-focused, you can use the "Property Portfolio (Demo)" tab in the sidebar to view and manage/delete them.`}
               </p>
             </div>
          </div>
          {onSwitchTab && (
            <button 
              type="button"
              onClick={() => onSwitchTab("real_estate")}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all self-start sm:self-center whitespace-nowrap active:scale-95 duration-100"
            >
              {lang === 'tr' ? "Emlak Yönetimine Git" : "Go to Real Estate Management"}
            </button>
          )}
        </div>
      )}
      {selectedProduct && (
        <ProductMovementModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          branding={branding}
        />
      )}
      {recipeProduct && (
        <RecipeModal 
          product={recipeProduct} 
          products={products}
          onClose={() => setRecipeProduct(null)} 
          lang={lang}
        />
      )}
      {sharingProduct && (
        <ProductSocialMediaShareModal 
          isOpen={!!sharingProduct}
          onClose={() => setSharingProduct(null)}
          product={sharingProduct}
          branding={branding}
        />
      )}
      <div className="flex flex-col gap-3.5 pb-2">
        {/* Row 1: Header ("| ÜRÜNLER") on left, Action Icons on right */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="bg-indigo-600 rounded-full h-8 sm:h-9 w-1 shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">
              {t.products || "ÜRÜNLER"}
            </h2>
          </div>

          {/* Action icons sitting right next to the title on the right */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isViewer && (
              <div className="flex items-center gap-1.5">
                {isCafe && (
                  <button
                    onClick={() => setIsAiMenuModalOpen(true)}
                    className="os-btn-secondary p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-200 hover:border-emerald-300 active:scale-95 shadow-xs flex items-center gap-1.5"
                    title={lang === 'tr' ? "Yapay Zeka ile Menü Oku (Görselden)" : "Scan Menu with AI (From Image)"}
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-bold hidden md:inline whitespace-nowrap">
                      {lang === 'tr' ? "Menü Tara" : "AI Menu"}
                    </span>
                  </button>
                )}
                <button 
                  onClick={onImport}
                  className="os-btn-secondary p-2 text-slate-500 hover:text-indigo-600 rounded-lg transition-all border border-slate-200 hover:border-indigo-200 active:scale-95 shadow-xs"
                  title={t.importBtn}
                >
                  <Upload className="h-4 w-4" />
                </button>
                <button 
                  onClick={onAddNew}
                  className="os-btn-primary p-2 text-white rounded-lg transition-all border border-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-xs"
                  title={t.addEntry}
                >
                  <Plus className="h-4 w-4" />
                </button>

                {selectedIds.length > 0 && (
                  <button 
                    onClick={handleBulkDeleteSelected}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-200 hover:border-rose-700 active:scale-95 font-bold flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300 shadow-xs text-xs"
                    title={lang === 'tr' ? "Seçilenleri Sil" : "Delete Selected"}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-[10px] tracking-tight uppercase hidden xs:inline sm:inline">
                      {lang === 'tr' ? `SİL (${selectedIds.length})` : `DEL (${selectedIds.length})`}
                    </span>
                  </button>
                )}
              </div>
            )}
            <button 
              onClick={onExportReport}
              className="os-btn-secondary p-2 text-slate-500 hover:text-indigo-600 rounded-lg transition-all border border-slate-200 hover:border-indigo-200 active:scale-95 shadow-xs"
              title={t.report}
            >
              <Download className="h-4 w-4" />
            </button>

            {/* In-Store Price Check / Store QR & Printable Poster Button */}
            {!isViewer && onShowQr && (
              <button 
                onClick={onShowQr}
                className="os-btn-secondary p-2 text-amber-700 hover:text-amber-800 bg-amber-50/90 hover:bg-amber-100 rounded-lg transition-all border border-amber-300 hover:border-amber-400 active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={lang === 'tr' ? "Mağaza İçi 'Fiyat Gör' Barkod QR Kodu & Yazdırılabilir Afiş" : "In-Store 'Price Check' Barcode QR & Printable Poster"}
              >
                <QrCode className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-black text-amber-950 hidden md:inline whitespace-nowrap">
                  {lang === 'tr' ? "Fiyat Gör QR" : "Price Check QR"}
                </span>
              </button>
            )}

            {!isViewer && isShopLp && connectedMarketplaces.hasAnyConnected && (
              <button 
                onClick={() => {
                  setMarketplaceModalTab('hepsiburada');
                  setMarketplaceModalStatus('all');
                  setShowMarketplaceListingsModal(true);
                }}
                className="os-btn-secondary p-2 text-orange-600 hover:text-orange-700 bg-orange-50/90 hover:bg-orange-100 rounded-lg transition-all border border-orange-200 hover:border-orange-300 active:scale-95 shadow-xs flex items-center gap-1.5"
                title={lang === 'tr' ? "Pazaryeri İlan Takibi & Canlı İlanlar" : "Marketplace Listings & Monitoring"}
              >
                <Store className="h-4 w-4 text-orange-600 shrink-0" />
                <span className="text-[11px] font-bold text-orange-950 hidden md:inline whitespace-nowrap">
                  {lang === 'tr' ? "Pazaryeri" : "Marketplace"}
                </span>
                {hbActiveCount > 0 && (
                  <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full" title={lang === 'tr' ? `${hbActiveCount} ürün Hepsiburada'da yayında` : `${hbActiveCount} products on HB`}>
                    {hbActiveCount}
                  </span>
                )}
                {marketplaceErrorCount > 0 && (
                  <span className="text-[9px] font-bold bg-rose-600 text-white px-1.5 py-0.2 rounded-full animate-pulse" title={lang === 'tr' ? `${marketplaceErrorCount} ürün pazaryeri hatası aldı` : `${marketplaceErrorCount} marketplace errors`}>
                    {marketplaceErrorCount}
                  </span>
                )}
              </button>
            )}

            {!isViewer && isShopLp && connectedMarketplaces.hepsiburada && (
              <button 
                onClick={() => setShowBulkPublishModal(true)}
                className="os-btn-secondary p-2 text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all border border-orange-200 hover:border-orange-300 active:scale-95 shadow-xs flex items-center gap-1.5"
                title={lang === 'tr' ? "Hepsiburada'da Toplu İlan Aç & Satışa Gönder" : "Bulk Publish to Hepsiburada"}
              >
                <UploadCloud className="h-4 w-4 text-orange-600 shrink-0" />
                <span className="text-[11px] font-bold text-orange-950 hidden md:inline whitespace-nowrap">
                  {selectedIds.length > 0 
                    ? (lang === 'tr' ? `HB (${selectedIds.length})` : `HB (${selectedIds.length})`)
                    : (lang === 'tr' ? "HB İlan" : "HB Publish")}
                </span>
              </button>
            )}

            {!isViewer && (
              <button 
                onClick={() => setIsMergeModalOpen(true)}
                className="os-btn-secondary p-2 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-all border border-amber-200 hover:border-amber-300 active:scale-95 shadow-xs flex items-center gap-1.5"
                title={lang === 'tr' ? "Mükerrer Ürünleri Birleştir / Envanter Temizliği" : "Merge Duplicate Products / Clean Inventory"}
              >
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-bold text-amber-900 hidden lg:inline whitespace-nowrap">
                  {lang === 'tr' ? "Temizle" : "Clean"}
                </span>
              </button>
            )}

            {driveConnected && (
              <button 
                onClick={async () => {
                  setIsBackupLoading(true);
                  const promise = api.exportToGoogleDrive({ targetType: 'products', format: 'xls' });
                  toast.promise(promise, {
                    loading: 'Ürün şeması Google Drive\'a yedekleniyor...',
                    success: 'Ürün şeması Excel formatında Google Drive\'a başarıyla kaydoldu!',
                    error: 'Google Drive yedeklemesi başarısız oldu.'
                  });
                  try {
                    await promise;
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsBackupLoading(false);
                  }
                }}
                disabled={isBackupLoading}
                className="os-btn-secondary p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all border border-emerald-200 hover:border-emerald-300 active:scale-95 shadow-xs"
                title={lang === 'tr' ? "Google Drive'a Yedekle" : "Backup to Google Drive"}
              >
                <Cloud className="h-4 w-4 text-emerald-600" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
          {/* Search Input: FULL WIDTH on mobile, flex-1 on desktop - no squishing! */}
          <div className="relative w-full sm:flex-1 group min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
            <input 
              type="text" 
              placeholder={isCafe ? (lang === 'tr' ? "Ürün / Menü adı ile ara..." : (t.searchProduct || "Search menu product...")) : (lang === 'tr' ? "Ürün adı veya barkod ile ara..." : (t.searchProduct || "Search product name or barcode..."))}
              className="os-input w-full pr-8 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 shadow-xs"
              style={{ paddingLeft: '2.25rem' }}
              value={search}
              onChange={(e) => { 
                setSearch(e.target.value);
                setPage(1); 
              }}
            />
            {search && (
              <button 
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title="Temizle"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters: Category & 0 Stock Checkbox & Barcode Toggle */}
          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
            <div className="relative flex-1 sm:w-44 sm:flex-initial shrink-0 group min-w-[120px]">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
              <select 
                className="os-input w-full pr-7 py-1.5 text-xs font-medium appearance-none cursor-pointer truncate shadow-xs"
                style={{ paddingLeft: '2rem' }}
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{t.allCategories}</option>
                {isCafe && <option value="bestsellers">🔥 {lang === 'tr' ? 'En Çok Satanlar' : 'Bestsellers'}</option>}
                {categories.map((cat: any) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Quick Bestseller Filter Toggle */}
            {isCafe && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(selectedCategory === 'bestsellers' ? 'all' : 'bestsellers');
                  setPage(1);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 border cursor-pointer select-none active:scale-95 ${
                  selectedCategory === 'bestsellers'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs'
                    : 'bg-orange-50/80 text-orange-800 hover:bg-orange-100 border-orange-200/80'
                }`}
                title={lang === 'tr' ? 'En Çok Satan Ürünleri Filtrele' : 'Filter Bestsellers'}
              >
                <Flame className={`w-3.5 h-3.5 ${selectedCategory === 'bestsellers' ? 'fill-white text-white' : 'text-orange-500 fill-orange-500'}`} />
                <span className="hidden md:inline">{lang === 'tr' ? 'Çok Satan' : 'Bestseller'}</span>
                <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${selectedCategory === 'bestsellers' ? 'bg-white/20 text-white' : 'bg-orange-200/60 text-orange-900'}`}>
                  {products.filter(p => getIsBestseller(p)).length}
                </span>
              </button>
            )}

            <TableManager 
              manager={tableManager} 
              lang={lang} 
              allRowIds={paginatedProducts.map(p => p.id)} 
            />

            <label className="flex items-center cursor-pointer group shrink-0 select-none px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors">
              <input 
                type="checkbox" 
                className="peer h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                checked={includeZeroStock}
                onChange={(e) => setIncludeZeroStock(e.target.checked)}
              />
              <span className="ml-1.5 text-xs font-medium text-slate-600 group-hover:text-slate-800 transition-colors whitespace-nowrap">
                {lang === 'tr' ? '0 Stok' : '0 Stock'}
              </span>
            </label>
          </div>
        </div>

        {/* E-Marketplace Quick Filter Chips for shopLP (Only visible when connected) */}
        {isShopLp && connectedMarketplaces.hasAnyConnected && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 overflow-x-auto pb-1 scrollbar-none text-xs">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Pazaryeri:</span>
              
              <button
                type="button"
                onClick={() => { setMarketplaceFilter('all'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 ${
                  marketplaceFilter === 'all'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {lang === 'tr' ? 'Tümü' : 'All'}
              </button>

              <button
                type="button"
                onClick={() => { setMarketplaceFilter('listed'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
                  marketplaceFilter === 'listed'
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                    : 'bg-white text-orange-800 border-orange-200 hover:bg-orange-50'
                }`}
              >
                <Store className="w-3 h-3" />
                {lang === 'tr' ? 'Pazaryerinde Satışta' : 'In Marketplace'}
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  marketplaceFilter === 'listed' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-900'
                }`}>
                  {marketplaceActiveCount}
                </span>
              </button>

              {connectedMarketplaces.hepsiburada && (
                <button
                  type="button"
                  onClick={() => { setMarketplaceFilter('hepsiburada'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
                    marketplaceFilter === 'hepsiburada'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-white text-orange-900 border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  Hepsiburada
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    marketplaceFilter === 'hepsiburada' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-900'
                  }`}>
                    {hbActiveCount}
                  </span>
                </button>
              )}

              {marketplaceErrorCount > 0 && (
                <button
                  type="button"
                  onClick={() => { setMarketplaceFilter('errors'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
                    marketplaceFilter === 'errors'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  {lang === 'tr' ? 'Hatalı Ürünler' : 'Marketplace Errors'}
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-200 text-rose-900 animate-pulse">
                    {marketplaceErrorCount}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => { setMarketplaceFilter('not_listed'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 ${
                  marketplaceFilter === 'not_listed'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {lang === 'tr' ? 'Henüz Açılmamış' : 'Not Listed'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMarketplaceModalTab('hepsiburada');
                setMarketplaceModalStatus('all');
                setShowMarketplaceListingsModal(true);
              }}
              className="text-[11px] font-bold text-orange-700 hover:text-orange-900 hover:underline flex items-center gap-1 shrink-0 ml-auto"
            >
              <ExternalLink className="w-3 h-3" />
              {lang === 'tr' ? 'Tüm Pazaryeri İlanlarını Yönet' : 'Manage All Marketplace Listings'}
            </button>
          </div>
        )}
      </div>

      <div className="os-panel overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                {!isViewer && (
                  <th className="pl-3 py-2 w-8">
                    <input 
                      type="checkbox" 
                      className="h-3.5 w-3.5 border-2 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                {tableManager.metadataMode === 'expandable' && (
                  <th className="w-7 py-2 px-1 text-center text-[10px] text-slate-400 font-bold">
                    <span className="sr-only">Expand</span>
                  </th>
                )}
                {!isCafe && tableManager.isColumnVisible('barcode') && (
                  <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.barcode}</th>
                )}
                <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.productName}</th>
                {showStoreName && tableManager.isColumnVisible('branch') && (
                  <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.branch}</th>
                )}
                {tableManager.isColumnVisible('price') && (
                  <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.price}</th>
                )}
                {tableManager.isColumnVisible('cost') && (
                  <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.cost}</th>
                )}
                {tableManager.isColumnVisible('stock') && (
                  <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.stock}</th>
                )}
                {tableManager.isColumnVisible('actions') && (
                  <th className="px-2.5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(loading && products.length === 0) ? (
                <tr>
                  <td colSpan={10} className="px-3.5 py-8 text-center">
                    <div className="animate-spin h-6 w-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-2 shadow-xs"></div>
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3.5 py-10 text-center text-slate-400 text-[11px] font-bold uppercase tracking-wider italic">
                    {t.noProducts}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isRowOpen = tableManager.isRowExpanded(p.id);
                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`hover:bg-slate-50/70 transition-colors group cursor-default ${selectedIds.includes(p.id) ? 'bg-indigo-50/30' : (Array.isArray(p.labels) && p.labels.includes('yeni_fatura_urunu') ? 'bg-amber-50/50' : '')}`}>
                        {!isViewer && (
                          <td className="pl-3 py-1.5">
                            <input 
                              type="checkbox" 
                              className="h-3.5 w-3.5 border-2 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => toggleSelect(p.id)}
                            />
                          </td>
                        )}
                        {tableManager.metadataMode === 'expandable' && (
                          <td className="w-7 py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => tableManager.toggleRowExpansion(p.id)}
                              className="p-1 rounded hover:bg-slate-200/70 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                              title={isRowOpen ? (lang === 'tr' ? 'Detayları Gizle' : 'Collapse Details') : (lang === 'tr' ? 'Detayları Göster' : 'Expand Details')}
                            >
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${isRowOpen ? 'rotate-90 text-indigo-600' : ''}`} />
                            </button>
                          </td>
                        )}
                        {!isCafe && tableManager.isColumnVisible('barcode') && (
                          <td className="px-2.5 py-1.5 whitespace-nowrap">
                            <span className="font-mono text-[10px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200 font-medium">
                              {p.barcode || '-'}
                            </span>
                          </td>
                        )}
                        <td className="px-2.5 py-1.5">
                          <div className="flex items-center gap-2.5">
                            {tableManager.isColumnVisible('image') && (
                            <div className="relative group/img shrink-0">
                              {p.image_url ? (
                                <img 
                                  src={p.image_url} 
                                  alt={p.name} 
                                  className="w-8 h-8 rounded-lg object-contain p-0.5 bg-white border border-slate-200 shadow-2xs"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (!target.dataset.fallback && p.image_url?.startsWith('http')) {
                                      target.dataset.fallback = '1';
                                      target.src = `/api/proxy-image?url=${encodeURIComponent(p.image_url)}`;
                                    } else {
                                      target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m21 8-9-4-9 4v8l9 4 9-4V8z'/%3E%3Cpath d='M3.27 6.96 12 12.01l8.73-5.05'/%3E%3Cpath d='M12 22.08V12'/%3E%3C/svg%3E";
                                    }
                                  }}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200">
                                  <Package className="w-4 h-4 text-slate-400" />
                                  {!isViewer && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAutoFindImages({ id: p.id });
                                      }}
                                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg"
                                      title={lang === 'tr' ? 'Resim bul' : 'Find image'}
                                    >
                                      <Sparkles className="h-3 w-3 text-white" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <div className="text-xs font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-[240px] md:max-w-[320px] leading-tight" title={p.name}>
                                  {p.name}
                                </div>
                                {p.description && (
                                  <div className="group/desc relative hover:z-[60] shrink-0">
                                    <div className="p-0.5 text-indigo-500 hover:bg-indigo-50 rounded cursor-help">
                                      <FileText className="h-3 w-3" />
                                    </div>
                                    <div className="invisible group-hover/desc:visible absolute left-0 top-full mt-1 w-64 p-2.5 bg-white border border-slate-200 rounded-lg shadow-lg z-50 text-[11px] text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                                      {p.description}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {tableManager.metadataMode === 'inline' && (
                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                  {(() => {
                                    if (!p.updated_at) return null;
                                    const date = new Date(p.updated_at);
                                    const now = new Date();
                                    const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
                                    if (diffDays < 3) {
                                      return (
                                        <span className="text-[8px] font-bold text-white bg-indigo-600 px-1 py-0.2 rounded uppercase">
                                          {lang === 'tr' ? 'YENİ' : 'NEW'}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                  {isShopLp && connectedMarketplaces.hepsiburada && p.is_hepsiburada_active && (
                                    <a
                                      href={`https://www.hepsiburada.com/ara?q=${encodeURIComponent(p.barcode || p.name)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[8px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-1 py-0.2 rounded uppercase inline-flex items-center gap-0.5"
                                      title={lang === 'tr' ? "Hepsiburada Canlı İlan" : "HB Live"}
                                    >
                                      <span className="w-1 h-1 rounded-full bg-orange-500"></span>
                                      HB
                                    </a>
                                  )}
                                  {isShopLp && connectedMarketplaces.hepsiburada && !p.is_hepsiburada_active && p.hepsiburada_last_error && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMarketplaceModalTab('hepsiburada');
                                        setMarketplaceModalStatus('error');
                                        setShowMarketplaceListingsModal(true);
                                      }}
                                      className="text-[8px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-1 py-0.2 rounded uppercase inline-flex items-center gap-0.5 cursor-pointer"
                                      title={`Hepsiburada Hatası: ${p.hepsiburada_last_error}`}
                                    >
                                      <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                                      HB Hata
                                    </button>
                                  )}
                                  {isShopLp && connectedMarketplaces.trendyol && p.is_trendyol_active && (
                                    <span className="text-[8px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded uppercase">
                                      TY
                                    </span>
                                  )}
                                  {isShopLp && connectedMarketplaces.n11 && p.is_n11_active && (
                                    <span className="text-[8px] font-bold text-red-800 bg-red-50 border border-red-200 px-1 py-0.2 rounded uppercase">
                                      N11
                                    </span>
                                  )}
                                  {p.category && (
                                    <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {p.category}
                                    </span>
                                  )}
                                  {p.brand && (
                                    <span className="text-[9px] font-medium text-slate-400 bg-white border border-slate-200 px-1 py-0.2 rounded">
                                      {p.brand}
                                    </span>
                                  )}
                                  {isCafe && getIsBestseller(p) && (
                                    <span className="text-[8px] font-bold text-white bg-orange-500 px-1.5 py-0.2 rounded uppercase inline-flex items-center gap-0.5">
                                      <Flame className="h-2.5 w-2.5 fill-white text-white" />
                                      {lang === 'tr' ? 'ÇOK SATAN' : 'BESTSELLER'}
                                    </span>
                                  )}
                                  {p.is_web_sale === false && (
                                    <span className="text-[8px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-1 py-0.2 rounded uppercase">
                                      {lang === 'tr' ? 'KAPALI' : 'OFFLINE'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                    {showStoreName && tableManager.isColumnVisible('branch') && (
                      <td className="px-2.5 py-1.5 whitespace-nowrap">
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {p.store_name}
                        </span>
                      </td>
                    )}
                    {tableManager.isColumnVisible('price') && (
                    <td className="px-2.5 py-1.5 whitespace-nowrap">
                      {(() => {
                        let parsedVars: any[] = [];
                        if (p.variants) {
                          if (typeof p.variants === 'string') {
                            try { parsedVars = JSON.parse(p.variants); } catch (e) { parsedVars = []; }
                          } else if (Array.isArray(p.variants)) {
                            parsedVars = p.variants;
                          }
                        }
                        const varPrices = parsedVars
                          .map((v: any) => parseFloat(String(v.price || '').replace(',', '.')))
                          .filter((pr: number) => !isNaN(pr) && pr > 0);

                        if (varPrices.length > 0) {
                          const minP = Math.min(...varPrices);
                          const maxP = Math.max(...varPrices);
                          return (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900 tabular-nums">
                                {minP === maxP
                                  ? minP.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : `${minP.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - ${maxP.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                }
                                <span className="text-[10px] text-slate-400 font-medium ml-1">{(p.currency || 'TRY').substring(0, 3)}</span>
                              </span>
                              <span className="text-[8px] font-semibold text-indigo-600">
                                {lang === 'tr' ? `${parsedVars.length} Varyant` : `${parsedVars.length} Vars`}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <span className="text-xs font-bold text-slate-900 tabular-nums">
                            {Number(p.price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{(p.currency || 'TRY').substring(0, 3)}</span>
                          </span>
                        );
                      })()}
                    </td>
                    )}
                    {tableManager.isColumnVisible('cost') && (
                    <td className="px-2.5 py-1.5 whitespace-nowrap">
                      {p.cost_price > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-600 tabular-nums">
                            {Number(p.cost_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 ml-0.5">{(p.cost_currency || 'TRY').substring(0, 3)}</span>
                          </span>
                          {(() => {
                            const profit = calculateProfitMargin(p);
                            if (!profit) return null;
                            const isLoss = profit.margin < 0;
                            return (
                              <span className={`text-[8px] font-bold uppercase ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isLoss ? (lang === 'tr' ? 'DÜŞÜK' : 'LOW') : `%${profit.margin.toFixed(0)} KÂR`}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300">-</span>
                      )}
                    </td>
                    )}
                    {tableManager.isColumnVisible('stock') && (
                    <td className="px-2.5 py-1.5 whitespace-nowrap">
                      {p.product_type === 'service' ? (
                        <span className="text-[8px] font-medium text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded uppercase">{lang === 'tr' ? 'HİZMET' : 'SRV'}</span>
                      ) : (() => {
                        let vars: any[] = [];
                        if (p.variants) {
                          if (typeof p.variants === 'string') {
                            try { vars = JSON.parse(p.variants); } catch (e) { vars = []; }
                          } else if (Array.isArray(p.variants)) {
                            vars = p.variants;
                          }
                        }
                        const hasVariants = vars.length > 0;
                        const effectiveStock = hasVariants 
                          ? vars.reduce((sum, v) => sum + (Number(v.stock_quantity) || Number(v.stock) || 0), 0)
                          : Number(p.stock_quantity) || 0;
                        const isLowStock = effectiveStock <= Number(p.min_stock_level || 0);

                        return (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold tabular-nums ${isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                              {Math.floor(effectiveStock)}
                            </span>
                            {isLowStock && (
                              <span className="px-1 py-0.2 bg-rose-50 text-[8px] font-bold text-rose-600 border border-rose-100 rounded uppercase">
                                !
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    )}
                    {tableManager.isColumnVisible('actions') && (
                    <td className="px-2.5 py-1.5 text-right whitespace-nowrap">
                      {!isViewer && (
                        <div className="flex justify-end items-center gap-0.5">
                          {isShopLp && connectedMarketplaces.hepsiburada && (
                            <button 
                              onClick={(e) => handlePublishToHepsiburada(p, e)}
                              disabled={publishingId === p.id}
                              className={`p-1.5 rounded-md transition-all border active:scale-90 flex items-center justify-center ${
                                p.is_hepsiburada_active
                                  ? "text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200"
                                  : "text-slate-400 hover:text-orange-600 hover:bg-orange-50 border-transparent"
                              }`}
                              title={
                                p.is_hepsiburada_active 
                                  ? (lang === 'tr' ? "HB Yayında - Güncelle" : "Active on HB - Update")
                                  : (lang === 'tr' ? "HB'de İlana Aç" : "Publish to HB")
                              }
                            >
                              <UploadCloud className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button 
                            onClick={() => setSelectedProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                            title={t.movementHistory}
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => setRecipeProduct(p)}
                            className={`p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all ${!isCafeRestaurant ? "hidden" : ""}`}
                            title={lang === "tr" ? "Ürün Reçetesi" : "Product Recipe"}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                          {!isCafeRestaurant && (
                            <button 
                              onClick={() => setSharingProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                              title={lang === "tr" ? "Sosyal Medya Afişi" : "Social Media Poster"}
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {isCafe && (
                            <button 
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const currentVal = getIsBestseller(p);
                                const nextVal = !currentVal;
                                p.is_bestseller = nextVal;
                                setBestsellerStateMap(prev => ({ ...prev, [p.id]: nextVal }));
                                try {
                                  await api.toggleBestsellerProduct(p.id, currentStoreId);
                                  toast.success(nextVal 
                                    ? (lang === "tr" ? `"${p.name}" Çok Satanlara eklendi 🔥` : `"${p.name}" marked as Bestseller 🔥`)
                                    : (lang === "tr" ? `"${p.name}" Çok Satanlardan çıkarıldı` : `"${p.name}" removed from Bestsellers`)
                                  );
                                } catch (err: any) {
                                  p.is_bestseller = currentVal;
                                  setBestsellerStateMap(prev => ({ ...prev, [p.id]: currentVal }));
                                  toast.error(err.message || "Hata oluştu.");
                                }
                              }}
                              className={`p-1.5 rounded-md transition-all border active:scale-95 flex items-center cursor-pointer ${
                                getIsBestseller(p)
                                  ? 'bg-orange-500 text-white border-orange-500' 
                                  : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50 border-transparent'
                              }`}
                              title={getIsBestseller(p) ? (lang === 'tr' ? 'Çok Satan (Çıkar)' : 'Bestseller (Remove)') : (lang === 'tr' ? 'Çok Satan Yap' : 'Mark as Bestseller')}
                            >
                              <Flame className={`h-3.5 w-3.5 shrink-0 ${getIsBestseller(p) ? 'fill-white text-white' : 'text-slate-400'}`} />
                            </button>
                          )}

                          <button 
                            onClick={() => onEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all"
                            title={t.edit}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(lang === 'tr' ? "Bu ürünü silmek istediğinize emin misiniz?" : "Are you sure you want to delete this product?")) {
                                onDelete(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                            title={t.deleteEntry}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    )}
                  </tr>

                  {/* Nested / Expandable Sub-Row for Grouped Auxiliary Metadata */}
                  {(tableManager.metadataMode === 'nested' || (tableManager.metadataMode === 'expandable' && isRowOpen)) && (
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <td colSpan={10} className="px-3 py-1.5 pl-8 sm:pl-10">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          {p.category && (
                            <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs flex items-center gap-1">
                              <span className="text-slate-400 font-normal">{lang === 'tr' ? 'Kategori:' : 'Category:'}</span>
                              {p.category}
                              {p.sub_category && <span className="text-slate-400">/ {p.sub_category}</span>}
                            </span>
                          )}
                          {p.brand && (
                            <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs flex items-center gap-1">
                              <span className="text-slate-400 font-normal">{lang === 'tr' ? 'Marka:' : 'Brand:'}</span>
                              {p.brand}
                            </span>
                          )}
                          {p.cost_price > 0 && (() => {
                            const profit = calculateProfitMargin(p);
                            if (!profit) return null;
                            return (
                              <span className={`font-bold px-2 py-0.5 rounded border shadow-2xs ${profit.margin < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                %{profit.margin.toFixed(1)} {lang === 'tr' ? 'Kâr Marjı' : 'Margin'}
                              </span>
                            );
                          })()}
                          {isShopLp && connectedMarketplaces.hasAnyConnected && (
                            <div className="flex items-center gap-1">
                              {connectedMarketplaces.hepsiburada && p.is_hepsiburada_active && (
                                <a
                                  href={`https://www.hepsiburada.com/ara?q=${encodeURIComponent(p.barcode || p.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded uppercase inline-flex items-center gap-1"
                                  title={lang === 'tr' ? "Hepsiburada Canlı İlan" : "HB Live"}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                  Hepsiburada Yayında
                                </a>
                              )}
                              {connectedMarketplaces.trendyol && p.is_trendyol_active && (
                                <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase">
                                  Trendyol Yayında
                                </span>
                              )}
                              {connectedMarketplaces.n11 && p.is_n11_active && (
                                <span className="font-bold text-red-800 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase">
                                  N11 Yayında
                                </span>
                              )}
                            </div>
                          )}
                          {p.description && (
                            <span className="text-slate-500 italic truncate max-w-xs sm:max-w-md" title={p.description}>
                              &ldquo;{p.description}&rdquo;
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
             })
               )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {filteredProducts.length} {lang === 'tr' ? 'ürün' : 'products'}
            </p>
            <div className="flex items-center space-x-1.5">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-all active:scale-90 disabled:opacity-20"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="text-xs font-semibold text-slate-700 tabular-nums flex items-center">
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded shadow-2xs">{page} <span className="text-slate-300 mx-0.5">/</span> {totalPages}</span>
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-all active:scale-90 disabled:opacity-20"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DuplicateMergeModal 
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onMergedSuccess={onRefresh || (() => {})}
        storeId={currentStoreId}
      />
      
      <AiMenuScanModal
        isOpen={isAiMenuModalOpen}
        onClose={() => setIsAiMenuModalOpen(false)}
        lang={lang}
        storeId={currentStoreId}
        onSuccess={onRefresh || (() => window.location.reload())}
      />

      {isShopLp && connectedMarketplaces.hepsiburada && (
        <MarketplaceBulkPublishModal
          isOpen={showBulkPublishModal}
          onClose={() => setShowBulkPublishModal(false)}
          products={products}
          selectedProductIds={selectedIds}
          storeBranding={branding}
          currentStoreId={currentStoreId}
          onSuccess={onRefresh}
          lang={lang}
        />
      )}

      {isShopLp && connectedMarketplaces.hasAnyConnected && (
        <MarketplaceListingsModal
          isOpen={showMarketplaceListingsModal}
          onClose={() => setShowMarketplaceListingsModal(false)}
          products={products}
          storeBranding={branding}
          currentStoreId={currentStoreId}
          onRefresh={onRefresh}
          onEditProduct={(p) => {
            setShowMarketplaceListingsModal(false);
            onEdit(p);
          }}
          lang={lang}
          initialMarketplace={marketplaceModalTab}
          initialStatus={marketplaceModalStatus}
        />
      )}
    </div>
  );
};

export default ProductsTab;
