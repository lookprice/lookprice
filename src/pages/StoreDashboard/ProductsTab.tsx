import React, { useState, useDeferredValue, useEffect } from "react";
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
  Cloud
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import ProductMovementModal from "../../components/ProductMovementModal";
import { ProductSocialMediaShareModal } from "../../components/ProductSocialMediaShareModal";
import { RecipeModal } from "./modals/RecipeModal";
import ProductsFilterBar from "../../components/dashboard/ProductsFilterBar";
import { api } from "../../services/api";
import { toast } from "sonner";
import { getLabels } from "../../utils/showcase";

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
  isCafeRestaurant
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
  const [isFindingImages, setIsFindingImages] = useState(false);
  const [sharingProduct, setSharingProduct] = useState<any>(null);
  const [recipeProduct, setRecipeProduct] = useState<any>(null);
  const [bestsellerStateMap, setBestsellerStateMap] = useState<Record<number, boolean>>({});

  const isCafe = isCafeRestaurant || branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';

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

  const handlePublishToHepsiburada = async (product: any) => {
    if (publishingId === product.id) return;
    try {
      setPublishingId(product.id);
      const res = await api.publishHepsiburadaProduct(product.id, currentStoreId);
      if (res && res.success) {
        toast.success(res.message || (lang === 'tr' ? "Ürün başarıyla Hepsiburada'ya aktarıldı." : "Product published to Hepsiburada successfully."));
      } else {
        toast.error(res?.error || (lang === 'tr' ? "Aktarım başarısız oldu." : "Publish failed."));
      }
    } catch (e: any) {
      toast.error(e.message || "Hepsiburada aktarım hatası");
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

  const filteredProducts = products.filter(p => {
    const searchTerms = normalizeSearch(deferredSearch || "").split(/\s+/).filter(Boolean);
    const matchesSearch = searchTerms.length === 0 ? true : searchTerms.every(term => 
      normalizeSearch(p.name || "").includes(term) || (p.barcode && p.barcode.toString().includes(term))
    );
    const matchesCategory = effectiveCategory === "bestsellers" 
      ? getIsBestseller(p) 
      : (effectiveCategory === "all" || p.category === effectiveCategory);
    const matchesMarketplace = marketplaceFilter === "all" || 
                              (marketplaceFilter === "listed" && p.is_pazarama_active) ||
                              (marketplaceFilter === "not_listed" && !p.is_pazarama_active);
    
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
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3.5 md:py-4 bg-slate-50/95 backdrop-blur-xl border-b border-slate-200 flex flex-col gap-3 shadow-xs">
        {/* Row 1: Header ("| ÜRÜNLER") on left, Action Icons on right */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="bg-indigo-600 rounded-full h-8 sm:h-9 w-1 shrink-0" />
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">
              {t.products || "ÜRÜNLER"}
            </h2>
          </div>

          {/* Action icons sitting right next to the title on the right */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isViewer && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button 
                  onClick={onImport}
                  className="os-btn-secondary p-2.5 sm:p-3 text-slate-500 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 hover:border-indigo-200 active:scale-95 shadow-xs"
                  title={t.importBtn}
                >
                  <Upload className="h-4.5 w-4.5" />
                </button>
                <button 
                  onClick={onAddNew}
                  className="os-btn-primary p-2.5 sm:p-3 text-white rounded-xl transition-all border border-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-xs"
                  title={t.addEntry}
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>

                {selectedIds.length > 0 && (
                  <button 
                    onClick={handleBulkDeleteSelected}
                    className="p-2.5 sm:p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all border border-rose-200 hover:border-rose-700 active:scale-95 font-black flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300 shadow-xs"
                    title={lang === 'tr' ? "Seçilenleri Sil" : "Delete Selected"}
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    <span className="text-[10px] tracking-tight uppercase hidden xs:inline sm:inline">
                      {lang === 'tr' ? `SİL (${selectedIds.length})` : `DEL (${selectedIds.length})`}
                    </span>
                  </button>
                )}
              </div>
            )}
            <button 
              onClick={onExportReport}
              className="os-btn-secondary p-2.5 sm:p-3 text-slate-500 hover:text-indigo-600 rounded-xl transition-all border border-slate-200 hover:border-indigo-200 active:scale-95 shadow-xs"
              title={t.report}
            >
              <Download className="h-4.5 w-4.5" />
            </button>

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
                className="os-btn-secondary p-2.5 sm:p-3 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200 hover:border-emerald-300 active:scale-95 shadow-xs"
                title={lang === 'tr' ? "Google Drive'a Yedekle" : "Backup to Google Drive"}
              >
                <Cloud className="h-4.5 w-4.5 text-emerald-600" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
          {/* Search Input: FULL WIDTH on mobile, flex-1 on desktop - no squishing! */}
          <div className="relative w-full sm:flex-1 group min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
            <input 
              type="text" 
              placeholder={lang === 'tr' ? "Ürün adı veya barkod ile ara..." : (t.searchProduct || "Search product name or barcode...")}
              className="os-input w-full pr-10 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 shadow-xs"
              style={{ paddingLeft: '2.75rem' }}
              value={search}
              onChange={(e) => { 
                setSearch(e.target.value);
                setPage(1); 
              }}
            />
            {search && (
              <button 
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                title="Temizle"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters: Category & 0 Stock Checkbox */}
          <div className="flex items-center gap-2.5 shrink-0 justify-between sm:justify-start">
            <div className="relative flex-1 sm:w-48 sm:flex-initial shrink-0 group min-w-[130px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
              <select 
                className="os-input w-full pr-8 py-2.5 text-xs font-bold appearance-none cursor-pointer truncate shadow-xs"
                style={{ paddingLeft: '2.25rem' }}
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
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 border cursor-pointer select-none active:scale-95 ${
                  selectedCategory === 'bestsellers'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                    : 'bg-orange-50/80 text-orange-800 hover:bg-orange-100 border-orange-200/80'
                }`}
                title={lang === 'tr' ? 'En Çok Satan Ürünleri Filtrele' : 'Filter Bestsellers'}
              >
                <Flame className={`w-4 h-4 ${selectedCategory === 'bestsellers' ? 'fill-white text-white animate-bounce' : 'text-orange-500 fill-orange-500'}`} />
                <span className="hidden md:inline">{lang === 'tr' ? 'En Çok Satanlar' : 'Bestsellers'}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${selectedCategory === 'bestsellers' ? 'bg-white/20 text-white' : 'bg-orange-200/60 text-orange-900'}`}>
                  {products.filter(p => getIsBestseller(p)).length}
                </span>
              </button>
            )}

            <label className="flex items-center cursor-pointer group shrink-0 select-none px-2 py-1.5 rounded-xl hover:bg-slate-200/60 transition-colors">
              <input 
                type="checkbox" 
                className="peer h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                checked={includeZeroStock}
                onChange={(e) => setIncludeZeroStock(e.target.checked)}
              />
              <span className="ml-2 text-xs font-bold text-slate-600 group-hover:text-slate-800 transition-colors whitespace-nowrap">
                {lang === 'tr' ? '0 Stokları Göster' : 'Show Zero Stock'}
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="os-panel overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {!isViewer && (
                  <th className="pl-6 py-5 w-10">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 border-2 border-slate-300 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.barcode}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.productName}</th>
                {showStoreName && <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.branch}</th>}
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.price}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.cost}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.stock}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(loading && products.length === 0) ? (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-5 shadow-2xl shadow-slate-200"></div>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-24 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    {t.noProducts}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, pIdx) => {
                  const isNearBottom = pIdx >= paginatedProducts.length - 4;
                  return (
                      <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors group cursor-default ${selectedIds.includes(p.id) ? 'bg-indigo-50/30' : (Array.isArray(p.labels) && p.labels.includes('yeni_fatura_urunu') ? 'bg-amber-50/50' : '')}`}>
                        {!isViewer && (
                          <td className="pl-6 py-4">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 border-2 border-slate-300 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => toggleSelect(p.id)}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="font-mono text-[10px] bg-white px-2 py-1 rounded-lg text-slate-600 border border-slate-200 font-bold tracking-widest shadow-sm">
                            {p.barcode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative group shrink-0">
                              {p.image_url ? (
                                <img 
                                  src={p.image_url} 
                                  alt={p.name} 
                                  className="w-12 h-12 rounded-2xl object-contain p-2 bg-white border border-slate-200 shadow-sm group-hover:scale-110 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                  <Package className="w-6 h-6 text-slate-300" />
                                  {!isViewer && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAutoFindImages({ id: p.id });
                                      }}
                                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
                                      title={lang === 'tr' ? 'Resim bul' : 'Find image'}
                                    >
                                      <Sparkles className="h-4 w-4 text-white" />
                                    </button>
                                  )}
                                </div>
                              )}
                              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 pointer-events-none" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="text-[13px] font-black text-slate-900 truncate max-w-[150px] md:max-w-[200px] lg:max-w-[250px] leading-none" title={p.name}>
                                  {p.name.length > 40 ? p.name.substring(0, 40) + '...' : p.name}
                                </div>
                                {p.description && (
                                  <div className="group/desc relative hover:z-[60]">
                                    <div className="p-1 text-indigo-500 bg-indigo-50 rounded-lg cursor-help">
                                      <FileText className="h-3 w-3" />
                                    </div>
                                    <div className="invisible group-hover/desc:visible absolute left-0 top-full mt-2 w-64 p-3 bg-white border border-slate-200 rounded-xl shadow-xl z-50 text-[11px] text-slate-600 leading-relaxed max-h-48 overflow-y-auto">
                                      {p.description}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(() => {
                                  if (!p.updated_at) return null;
                                  const date = new Date(p.updated_at);
                                  const now = new Date();
                                  const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
                                  if (diffDays < 3) {
                                    return (
                                      <span className="text-[8px] font-black text-white bg-indigo-600 border border-indigo-700 px-1.5 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-sm animate-pulse">
                                        <Zap className="h-2.5 w-2.5" />
                                        {lang === 'tr' ? 'YENİ' : 'NEW'}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                                {p.category && (
                                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-lg uppercase tracking-widest leading-none">
                                    {p.category}
                                  </span>
                                )}
                                {p.sub_category && (
                                  <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg uppercase tracking-widest leading-none">
                                    {p.sub_category}
                                  </span>
                                )}
                                {p.brand && (
                                  <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-lg uppercase tracking-widest bg-white">
                                    {p.brand}
                                  </span>
                                )}
                                {p.product_type === 'service' && (
                                  <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-lg uppercase tracking-widest">
                                    SERV
                                  </span>
                                )}
                                {isCafe && getIsBestseller(p) && (
                                  <span className="text-[9px] font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 border border-orange-400 px-2 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-sm shadow-orange-500/20 animate-pulse" title={lang === 'tr' ? 'En Çok Satan Ürün (Dijital Menüde Öne Çıkarılır)' : 'Bestseller Product'}>
                                    <Flame className="h-3 w-3 fill-white text-white" />
                                    {lang === 'tr' ? 'EN ÇOK SATAN' : 'BESTSELLER'}
                                  </span>
                                )}
                                {p.is_web_sale === false && (
                                  <span className="text-[8px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-lg uppercase tracking-widest">
                                    {lang === 'tr' ? 'ÇEVRİM DIŞI' : 'OFFLINE'}
                                  </span>
                                )}
                                {p.is_pazarama_active && (
                                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    PAZARAMA
                                  </span>
                                )}
                                {Array.isArray(p.labels) && p.labels.includes('yeni_fatura_urunu') && (
                                  <span className="text-[8px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    {lang === 'tr' ? 'YENİ (Fat.)' : 'NEW (Inv.)'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                    {showStoreName && (
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black text-slate-500 bg-slate-100/50 px-2.5 py-1.5 rounded-xl border border-slate-200 uppercase tracking-widest">
                          {p.store_name}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-black text-slate-900 mono-data tracking-tighter">
                        {Number(p.price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[11px] text-slate-400 font-bold ml-1 tracking-normal">{(p.currency || 'TRY').substring(0, 3)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.cost_price > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-600 mono-data">
                            {Number(p.cost_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-bold ml-1">{(p.cost_currency || 'TRY').substring(0, 3)}</span>
                          </span>
                          {(() => {
                            const profit = calculateProfitMargin(p);
                            if (!profit) return null;
                            const isLoss = profit.margin < 0;
                            return (
                              <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isLoss ? (lang === 'tr' ? 'DÜŞÜK MARJ' : 'LOW MARGIN') : (lang === 'tr' ? `%${profit.margin.toFixed(0)} KÂR` : `+${profit.margin.toFixed(0)}% PROFIT`)}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase letter-wider">{lang === 'tr' ? 'MALİYET BİLGİSİ YOK' : 'NO COST DATA'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.product_type === 'service' ? (
                        <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-2 py-1.5 rounded-xl uppercase tracking-widest leading-none">{lang === 'tr' ? 'DİJİTAL / HİZMET' : 'VIRTUAL / SERVICE'}</span>
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
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-3">
                              <span className={`text-[15px] font-black mono-data ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                                {Math.floor(effectiveStock)}
                              </span>
                              {isLowStock && (
                                <div className="flex items-center px-2 py-1 bg-rose-50 text-[8px] font-black text-rose-600 border border-rose-100 rounded-lg uppercase tracking-[0.15em] animate-pulse">
                                  {lang === 'tr' ? 'DÜŞÜK STOK' : 'LOW STOCK'}
                                </div>
                              )}
                            </div>
                            {hasVariants && (
                              <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md mt-1 inline-block w-fit">
                                {vars.length} {lang === 'tr' ? 'Varyant' : 'Variants'}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isViewer && (
                        <div className="flex justify-end items-center gap-1">


                          <button 
                            onClick={() => setSelectedProduct(p)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 active:scale-90"
                            title={t.movementHistory}
                          >
                            <History className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => setRecipeProduct(p)}
                            className={`p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100 active:scale-90 ${!isCafeRestaurant ? "hidden" : ""}`}
                            title={lang === "tr" ? "Ürün Reçetesi" : "Product Recipe"}
                          >
                            <Sparkles className="h-4.5 w-4.5" />
                          </button>
                          {!isCafeRestaurant && (
                            <button 
                              onClick={() => setSharingProduct(p)}
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 active:scale-90"
                              title={lang === "tr" ? "Sosyal Medya Afişi" : "Social Media Poster"}
                            >
                              <Share2 className="h-4.5 w-4.5" />
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
                                    ? (lang === "tr" ? `"${p.name}" En Çok Satanlar listesine eklendi 🔥` : `"${p.name}" marked as Bestseller 🔥`)
                                    : (lang === "tr" ? `"${p.name}" En Çok Satanlar listesinden çıkarıldı` : `"${p.name}" removed from Bestsellers`)
                                  );
                                } catch (err: any) {
                                  p.is_bestseller = currentVal;
                                  setBestsellerStateMap(prev => ({ ...prev, [p.id]: currentVal }));
                                  toast.error(err.message || "Hata oluştu.");
                                }
                              }}
                              className={`px-3 py-2 rounded-xl transition-all border active:scale-95 flex items-center gap-1.5 cursor-pointer select-none ${
                                getIsBestseller(p)
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md shadow-orange-500/30 ring-2 ring-orange-300 ring-offset-1 font-black text-xs' 
                                  : 'text-slate-400 hover:text-orange-600 hover:bg-orange-50 border-slate-200 hover:border-orange-300'
                              }`}
                              title={getIsBestseller(p) ? (lang === 'tr' ? 'En Çok Satan (Çıkar)' : 'Bestseller (Remove)') : (lang === 'tr' ? 'En Çok Satan Yap' : 'Mark as Bestseller')}
                            >
                              <Flame className={`h-4.5 w-4.5 shrink-0 ${getIsBestseller(p) ? 'fill-white text-white animate-bounce' : 'text-slate-400 hover:text-orange-500'}`} />
                              {getIsBestseller(p) && (
                                <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                                  {lang === 'tr' ? 'SEÇİLİ' : 'ACTIVE'}
                                </span>
                              )}
                            </button>
                          )}

                          <button 
                            onClick={() => onEdit(p)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-300 active:scale-90"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(lang === 'tr' ? "Bu ürünü silmek istediğinize emin misiniz?" : "Are you sure you want to delete this product?")) {
                                onDelete(p.id);
                              }
                            }}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200 active:scale-90"
                            title={t.deleteEntry}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                 })
               )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {filteredProducts.length} {lang === 'tr' ? 'ÜRÜN BULUNDU' : 'RECORDS LOCATED'}
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2.5 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all active:scale-90 disabled:opacity-20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="text-[11px] font-black text-slate-900 tabular-nums tracking-widest flex items-center">
                <span>PAGE</span>
                <span className="mx-2 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-inner">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2.5 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all active:scale-90 disabled:opacity-20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsTab;
