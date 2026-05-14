import React, { useState, useDeferredValue, useEffect } from "react";
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
  Zap,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import ProductMovementModal from "../../components/ProductMovementModal";
import { api } from "../../services/api";
import { toast } from "sonner";

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
  onShowQr: () => void;
  branding?: any;
  showStoreName?: boolean;
  currentStoreId?: number;
  includeBranches?: boolean;
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
  onShowQr,
  branding,
  showStoreName,
  currentStoreId,
  includeBranches
}: ProductsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [marketplaceFilter, setMarketplaceFilter] = useState("all"); // all, listed, not_listed
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [isFixingNames, setIsFixingNames] = useState(false);
  const [openMarketMenu, setOpenMarketMenu] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isFindingImages, setIsFindingImages] = useState(false);

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
    if (isFixingNames) return;
    if (!window.confirm(lang === 'tr' ? "Tüm ürün isimleri 'Title Case' (İlk Harfler Büyük) formatına getirilecek. Devam etmek istiyor musunuz?" : "All product names will be converted to 'Title Case'. Do you want to continue?")) {
      return;
    }

    try {
      setIsFixingNames(true);
      const res = await api.reformatProductNames(currentStoreId);
      if (res && res.success) {
        toast.success(res.message || (lang === 'tr' ? "Ürün isimleri başarıyla düzeltildi." : "Product names reformatted successfully."));
        // We might need to refresh the parent data, but since the parent handles data, 
        // we'll assume the user will see changes or we can suggest a refresh.
        // Actually, the parent `fetchData` should be called.
        // But ProductsTab doesn't have a direct refresh callback in props.
        // Let's assume the parent updates or suggest refresh.
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

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const normalizeSearch = (text: string) => {
    if (!text) return "";
    return text.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase();
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = normalizeSearch(p.name).includes(normalizeSearch(deferredSearch)) || 
                         p.barcode.includes(deferredSearch);
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesMarketplace = marketplaceFilter === "all" || 
                              (marketplaceFilter === "listed" && p.is_pazarama_active) ||
                              (marketplaceFilter === "not_listed" && !p.is_pazarama_active);
    return matchesSearch && matchesCategory && matchesMarketplace;
  }).sort((a, b) => {
    const aIsNew = Array.isArray(a.labels) && a.labels.includes('yeni_fatura_urunu') ? 1 : 0;
    const bIsNew = Array.isArray(b.labels) && b.labels.includes('yeni_fatura_urunu') ? 1 : 0;
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return b.id - a.id;
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
      {selectedProduct && (
        <ProductMovementModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          branding={branding}
        />
      )}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t.productTitle}</h2>
            <div className="flex items-center gap-2">
                {!isViewer && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={onImport}
                      className="os-btn-secondary p-3 text-slate-400 hover:text-indigo-600 rounded-[1rem] transition-all border border-slate-200 hover:border-indigo-200 active:scale-95"
                      title={t.importBtn}
                    >
                      <Upload className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={onAddNew}
                      className="os-btn-primary p-3 text-white rounded-[1rem] transition-all border border-indigo-600 hover:bg-indigo-700 active:scale-95"
                      title={t.addEntry}
                    >
                      <Plus className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={() => handleAutoFindImages({ allMissing: true })}
                      disabled={isFindingImages}
                      className="p-3 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-[1rem] transition-all border border-slate-200 hover:border-indigo-100 active:scale-95 disabled:opacity-50"
                      title={lang === 'tr' ? "Eksik Resimleri Bul" : "Auto-find Missing Images"}
                    >
                      {isFindingImages ? (
                        <div className="h-4.5 w-4.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ImageIcon className="h-4.5 w-4.5" />
                      )}
                    </button>
                    <button 
                      onClick={handleFixNames}
                      disabled={isFixingNames}
                      className="p-3 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-[1rem] transition-all border border-slate-200 hover:border-indigo-100 active:scale-95 disabled:opacity-50"
                      title={lang === 'tr' ? "İsimleri Düzenle (Title Case)" : "Fix Names (Title Case)"}
                    >
                      {isFixingNames ? (
                        <div className="h-4.5 w-4.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(lang === 'tr' ? "DİKKAT! Bu İşlem Listenizdeki TÜM ÜRÜNLERİ SİLECEKTİR! EMİN MİSİNİZ?" : "ATTENTION! This will delete ALL PRODUCTS in your list! ARE YOU SURE?")) {
                          onDeleteAll();
                        }
                      }}
                      className="p-3 text-slate-400 hover:bg-rose-600 hover:text-white rounded-[1rem] transition-all border border-transparent hover:border-rose-700 active:scale-95 text-rose-600 font-black hover:text-white group"
                      title={t.deleteAll}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>

                    {selectedIds.length > 0 && (
                      <button 
                        onClick={handleBulkDeleteSelected}
                        className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-[1rem] transition-all border border-rose-200 hover:border-rose-700 active:scale-95 font-black flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300"
                        title={lang === 'tr' ? "Seçilenleri Sil" : "Delete Selected"}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                        <span className="text-[10px] tracking-tight uppercase">{lang === 'tr' ? `SEÇİLENLERİ SİL (${selectedIds.length})` : `DELETE SELECTED (${selectedIds.length})`}</span>
                      </button>
                    )}

                    {!isViewer && (selectedCategory !== 'all' || search !== '') && filteredProducts.length > 0 && selectedIds.length === 0 && (
                      <button 
                        onClick={handleBulkDeleteFiltered}
                        className="p-3 bg-amber-50 text-amber-700 hover:bg-rose-600 hover:text-white rounded-[1rem] transition-all border border-amber-200 hover:border-rose-700 active:scale-95 font-black flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300 shadow-sm"
                        title={lang === 'tr' ? "Filtrelenmiş Ürünleri Sil" : "Delete Filtered Products"}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                        <span className="text-[10px] tracking-tight uppercase">
                          {lang === 'tr' ? `LİSTEYİ SİL (${filteredProducts.length})` : `DELETE LIST (${filteredProducts.length})`}
                        </span>
                      </button>
                    )}
                  </div>
                )}
                <button 
                  onClick={onExportReport}
                  className="os-btn-secondary p-3 text-slate-400 hover:text-indigo-600 rounded-[1rem] transition-all border border-slate-200 hover:border-indigo-200 active:scale-95"
                  title={t.report}
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
            </div>
          </div>

          <div className="flex flex-row items-center gap-3 w-full sm:w-auto sm:max-w-md lg:max-w-lg ml-auto">
            <div className="relative flex-1 min-w-[120px] group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
              <input 
                type="text" 
                placeholder={t.searchProduct}
                className="os-input w-full pr-10 py-2.5 text-[13px] font-bold truncate"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                  title="Temizle"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>
            <div className="relative w-36 sm:w-44 shrink-0 group">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
              <select 
                className="os-input w-full pr-8 py-2.5 text-[13px] font-bold appearance-none cursor-pointer truncate"
                style={{ paddingLeft: '2.75rem' }}
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{t.allCategories}</option>
                {categories.map((cat: any) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {/* Marketplace Status Filter */}
            <div className="relative w-36 sm:w-44 shrink-0 group">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
              <select 
                className="os-input w-full pr-8 py-2.5 text-[13px] font-bold appearance-none cursor-pointer truncate"
                style={{ paddingLeft: '2.75rem' }}
                value={marketplaceFilter}
                onChange={(e) => {
                  setMarketplaceFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{lang === 'tr' ? 'Tüm İlanlar' : 'All Listings'}</option>
                <option value="listed">{lang === 'tr' ? 'Pazarama: İlanda' : 'Pazarama: Listed'}</option>
                <option value="not_listed">{lang === 'tr' ? 'Pazarama: İlanda Değil' : 'Pazarama: Not Listed'}</option>
              </select>
            </div>
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
              {loading ? (
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
                                <div className="text-[13px] font-black text-slate-900 truncate leading-none">{p.name}</div>
                                {p.description && (
                                  <div className="group/desc relative">
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
                                {p.is_web_sale === false && (
                                  <span className="text-[8px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-lg uppercase tracking-widest">
                                    OFF_LINE
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
                                {isLoss ? 'LOW_MARGIN' : `+${profit.margin.toFixed(0)}%_PROFIT`}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase letter-wider">NO_COST_DATA</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.product_type === 'service' ? (
                        <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-2 py-1.5 rounded-xl uppercase tracking-widest leading-none">VIRTUAL</span>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className={`text-[15px] font-black mono-data ${Number(p.stock_quantity) <= Number(p.min_stock_level) ? 'text-rose-600' : 'text-slate-900'}`}>
                            {Math.floor(Number(p.stock_quantity))}
                          </span>
                          {Number(p.stock_quantity) <= Number(p.min_stock_level) && (
                            <div className="flex items-center px-2 py-1 bg-rose-50 text-[8px] font-black text-rose-600 border border-rose-100 rounded-lg uppercase tracking-[0.15em] animate-pulse">
                              LOW_STOCK
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isViewer && (
                        <div className="flex justify-end items-center gap-1">
                          {/* Marketplace / Channels Hub */}
                          <div className="relative">
                            <button 
                              onClick={() => setOpenMarketMenu(openMarketMenu === p.id ? null : p.id)}
                              className={`p-2.5 rounded-xl transition-all border active:scale-90 flex items-center justify-center ${openMarketMenu === p.id ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border-transparent hover:border-indigo-100'}`}
                              title={lang === 'tr' ? "Pazaryeri İşlemleri" : "Marketplace Channels"}
                            >
                              <Globe className="h-4.5 w-4.5" />
                            </button>

                            {openMarketMenu === p.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setOpenMarketMenu(null)}
                                />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: isNearBottom ? 10 : -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  className={`absolute right-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden ${isNearBottom ? 'bottom-full mb-2' : 'mt-2'}`}
                                >
                                  <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'tr' ? 'PAZARYERLERİ' : 'CHANNELS'}</p>
                                  </div>
                                  <div className="p-2 space-y-1">
                                    {/* Pazarama */}
                                    <button
                                      disabled={publishingId === p.id}
                                      onClick={() => {
                                        handlePublishToPazarama(p);
                                        setOpenMarketMenu(null);
                                      }}
                                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group group-disabled:opacity-50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg transition-colors ${p.is_pazarama_active ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'}`}>
                                          <Store className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                          <p className="text-xs font-bold text-slate-700">Pazarama</p>
                                          <p className={`text-[10px] ${p.pazarama_last_error ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                                            {p.pazarama_last_error 
                                              ? (lang === 'tr' ? `HATA: ${p.pazarama_last_error.substring(0, 30)}...` : `ERROR: ${p.pazarama_last_error.substring(0, 30)}...`)
                                              : (p.is_pazarama_active 
                                                ? (lang === 'tr' ? 'Yayında / Güncelle' : 'Live / Update') 
                                                : (lang === 'tr' ? 'İlana Çık' : 'Publish Product'))}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {p.pazarama_last_error && !publishingId && <AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" />}
                                        {p.is_pazarama_active && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                        {publishingId === p.id && <div className="h-2 w-2 bg-orange-500 rounded-full animate-ping" />}
                                      </div>
                                    </button>

                                    {/* Trendyol */}
                                    <button
                                      disabled={publishingId === p.id}
                                      onClick={() => {
                                        handlePublishToTrendyol(p);
                                        setOpenMarketMenu(null);
                                      }}
                                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group group-disabled:opacity-50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg transition-colors ${p.trendyol_id ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                          <Package className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                          <p className="text-xs font-bold text-slate-700">Trendyol</p>
                                          <p className={`text-[10px] ${p.trendyol_last_error ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                                            {p.trendyol_last_error 
                                              ? (lang === 'tr' ? `HATA: ${p.trendyol_last_error.substring(0, 30)}...` : `ERROR: ${p.trendyol_last_error.substring(0, 30)}...`)
                                              : (p.trendyol_id 
                                                ? (lang === 'tr' ? 'Yayında / Güncelle' : 'Live / Update') 
                                                : (lang === 'tr' ? 'İlana Çık' : 'Publish Product'))}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {p.trendyol_id && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                      </div>
                                    </button>

                                    {/* N11 */}
                                    <button
                                      disabled={publishingId === p.id}
                                      onClick={() => {
                                        handlePublishToN11(p);
                                        setOpenMarketMenu(null);
                                      }}
                                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group group-disabled:opacity-50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg transition-colors ${p.n11_id ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                          <CircleDot className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                          <p className="text-xs font-bold text-slate-700">N11</p>
                                          <p className={`text-[10px] ${p.n11_last_error ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                                            {p.n11_last_error 
                                              ? (lang === 'tr' ? `HATA: ${p.n11_last_error.substring(0, 30)}...` : `ERROR: ${p.n11_last_error.substring(0, 30)}...`)
                                              : (p.n11_id 
                                                ? (lang === 'tr' ? 'Yayında / Güncelle' : 'Live / Update') 
                                                : (lang === 'tr' ? 'İlana Çık' : 'Publish Product'))}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {p.n11_last_error && !publishingId && <AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" />}
                                        {p.n11_id && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                      </div>
                                    </button>

                                    {/* Hepsiburada */}
                                    <button
                                      disabled={publishingId === p.id}
                                      onClick={() => {
                                        handlePublishToHepsiburada(p);
                                        setOpenMarketMenu(null);
                                      }}
                                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group group-disabled:opacity-50"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg transition-colors ${p.is_hepsiburada_active ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                                          <Zap className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                          <p className="text-xs font-bold text-slate-700">Hepsiburada</p>
                                          <p className={`text-[10px] ${p.hepsiburada_last_error ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                                            {p.hepsiburada_last_error 
                                              ? (lang === 'tr' ? `HATA: ${p.hepsiburada_last_error.substring(0, 30)}...` : `ERROR: ${p.hepsiburada_last_error.substring(0, 30)}...`)
                                              : (p.is_hepsiburada_active 
                                                ? (lang === 'tr' ? 'Yayında / Güncelle' : 'Live / Update') 
                                                : (lang === 'tr' ? 'İlana Çık' : 'Publish Product'))}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {p.hepsiburada_last_error && !publishingId && <AlertCircle className="h-3 w-3 text-rose-500 animate-pulse" />}
                                        {p.is_hepsiburada_active && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                                      </div>
                                    </button>

                                    {/* Amazon */}
                                    <button
                                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group opacity-50 cursor-not-allowed"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-yellow-50 text-yellow-700 rounded-lg">
                                          <ExternalLink className="h-4 w-4" />
                                        </div>
                                        <div className="text-left">
                                          <p className="text-xs font-bold text-slate-700">Amazon</p>
                                          <p className="text-[10px] text-slate-400">{lang === 'tr' ? 'Çok Yakında' : 'Coming Soon'}</p>
                                        </div>
                                      </div>
                                    </button>
                                  </div>
                                </motion.div>
                              </>
                            )}
                          </div>

                          <button 
                            onClick={() => setSelectedProduct(p)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 active:scale-90"
                            title={t.movementHistory}
                          >
                            <History className="h-4.5 w-4.5" />
                          </button>
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
              {filteredProducts.length} RECORDS_LOCATED
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
