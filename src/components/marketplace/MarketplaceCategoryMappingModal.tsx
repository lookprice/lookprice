import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Sparkles, Layers, Settings2, CheckCircle2, AlertCircle, 
  ChevronRight, Save, RefreshCw, SlidersHorizontal, ArrowRight, 
  HelpCircle, Trash2, Check, Info, ShieldCheck, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { 
  MarketplaceCategory, 
  MarketplaceAttribute,
  HEPSIBURADA_DEFAULT_CATEGORIES,
  TRENDYOL_DEFAULT_CATEGORIES,
  AMAZON_DEFAULT_CATEGORIES,
  PAZARAMA_DEFAULT_CATEGORIES,
  getAttributesForCategory,
  suggestMarketplaceCategory
} from '@/data/marketplaceCategoriesData';

export type MarketplaceType = 'hepsiburada' | 'trendyol' | 'amazon' | 'pazarama';

interface MarketplaceCategoryMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: any;
  currentStoreId?: number;
  products: any[];
  initialMarketplace?: MarketplaceType;
  onSaveSuccess?: () => void;
  onBrandingChange?: (field: string, value: any) => void;
  onRefresh?: () => void;
  lang?: string;
}

const PRODUCT_FIELD_OPTIONS = [
  { value: '$product.brand', label: 'Ürün Markası (Brand / Marka)' },
  { value: '$product.name', label: 'Ürün Adı (Product Name)' },
  { value: '$product.barcode', label: 'Barkod / SKU (Barcode)' },
  { value: '$product.description', label: 'Ürün Açıklaması (Description)' },
  { value: '$product.category', label: 'Mağaza Kategorisi' },
  { value: '$product.sub_category', label: 'Alt Kategori' },
  { value: '$product.variant_color', label: 'Varyant Rengi (Color Swatch)' },
  { value: '$product.variant_size', label: 'Varyant Bedeni / Ölçüsü (Size)' },
  { value: '$product.tax_rate', label: 'KDV Oranı (%)' },
  { value: '$product.price', label: 'Satış Fiyatı (Price)' }
];

export const MarketplaceCategoryMappingModal: React.FC<MarketplaceCategoryMappingModalProps> = ({
  isOpen,
  onClose,
  branding,
  currentStoreId,
  products,
  initialMarketplace = 'hepsiburada',
  onSaveSuccess,
  onBrandingChange,
  onRefresh,
  lang = 'tr'
}) => {
  const [activeMarketplace, setActiveMarketplace] = useState<MarketplaceType>(initialMarketplace);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Active Category Dropdown Search & State
  const [openDropdownFor, setOpenDropdownFor] = useState<string | null>(null);
  const [catSearchTerm, setCatSearchTerm] = useState('');

  // Category Attributes Modal State
  const [attributeModalCategory, setAttributeModalCategory] = useState<{
    localCat: string;
    marketCatId: string | number;
    marketCatName: string;
  } | null>(null);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [currentCategoryAttributes, setCurrentCategoryAttributes] = useState<MarketplaceAttribute[]>([]);

  // Local mappings copy per marketplace
  const [mappings, setMappings] = useState<Record<MarketplaceType, Record<string, string>>>({
    hepsiburada: branding.hepsiburada_settings?.categoryMappings || {},
    trendyol: branding.trendyol_settings?.categoryMappings || {},
    amazon: branding.amazon_settings?.categoryMappings || {},
    pazarama: branding.pazarama_settings?.categoryMappings || {}
  });

  // Local category attributes configuration per marketplace
  // Structure: { [marketplace]: { [categoryId]: { [attributeId]: { mode: 'fixed' | 'field', value: string } } } }
  const [attributesConfig, setAttributesConfig] = useState<Record<MarketplaceType, Record<string, Record<string, any>>>>({
    hepsiburada: branding.hepsiburada_settings?.categoryAttributes || {},
    trendyol: branding.trendyol_settings?.categoryAttributes || {},
    amazon: branding.amazon_settings?.categoryAttributes || {},
    pazarama: branding.pazarama_settings?.categoryAttributes || {}
  });

  // Available marketplace categories from API / Fallback
  const [marketCategories, setMarketCategories] = useState<Record<MarketplaceType, MarketplaceCategory[]>>({
    hepsiburada: HEPSIBURADA_DEFAULT_CATEGORIES,
    trendyol: TRENDYOL_DEFAULT_CATEGORIES,
    amazon: AMAZON_DEFAULT_CATEGORIES,
    pazarama: PAZARAMA_DEFAULT_CATEGORIES
  });

  // Fetch live categories when modal opens or active marketplace changes
  useEffect(() => {
    if (!isOpen) return;

    if (activeMarketplace === 'hepsiburada') {
      api.getHepsiburadaCategories(currentStoreId)
        .then((res) => {
          const list = res.data?.categories || res.data || res.categories;
          if (Array.isArray(list) && list.length > 0) {
            setMarketCategories((prev) => ({
              ...prev,
              hepsiburada: list.map((c: any) => ({
                id: c.categoryId || c.id,
                name: c.name || c.displayName,
                displayName: c.displayName || c.name,
                paths: c.paths || (c.parentName ? [c.parentName, c.name] : []),
                leaf: c.leaf !== false
              }))
            }));
          }
        })
        .catch(() => {
          // Keep curated default categories
        });
    } else if (activeMarketplace === 'trendyol') {
      api.getTrendyolCategories()
        .then((res) => {
          const list = res.data?.categories || res.data;
          if (Array.isArray(list) && list.length > 0) {
            setMarketCategories((prev) => ({
              ...prev,
              trendyol: list.map((c: any) => ({
                id: c.id,
                name: c.name,
                displayName: c.name,
                paths: c.subCategories ? [c.name] : []
              }))
            }));
          }
        })
        .catch(() => {
          // Keep curated default categories
        });
    } else if (activeMarketplace === 'pazarama') {
      api.getPazaramaCategories(currentStoreId)
        .then((res) => {
          const list = res.data?.categories || res.data || res.categories;
          if (Array.isArray(list) && list.length > 0) {
            setMarketCategories((prev) => ({
              ...prev,
              pazarama: list.map((c: any) => ({
                id: c.id || c.categoryId,
                name: c.name || c.categoryName,
                displayName: c.name || c.categoryName
              }))
            }));
          }
        })
        .catch(() => {
          // Keep curated default categories
        });
    }
  }, [isOpen, activeMarketplace, currentStoreId]);

  // Extract all unique local categories from store's products
  const localCategories = useMemo(() => {
    const cats = new Set<string>();
    (products || []).forEach((p: any) => {
      if (p.category && String(p.category).trim() !== '') {
        cats.add(String(p.category).trim());
      }
    });
    return Array.from(cats);
  }, [products]);

  // Count of products per local category
  const productCountPerCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Statistics for active marketplace
  const currentMappings = mappings[activeMarketplace] || {};
  const mappedCount = localCategories.filter((cat) => !!currentMappings[cat]).length;
  const totalCount = localCategories.length;
  const completionPercent = totalCount > 0 ? Math.round((mappedCount / totalCount) * 100) : 0;

  // Handler: Set single mapping
  const handleSelectMapping = (localCat: string, marketCatId: string | number) => {
    setMappings((prev) => ({
      ...prev,
      [activeMarketplace]: {
        ...prev[activeMarketplace],
        [localCat]: String(marketCatId)
      }
    }));
    setOpenDropdownFor(null);
    setCatSearchTerm('');
    toast.success(`"${localCat}" kategorisi eşleştirildi.`);
  };

  // Handler: Clear mapping
  const handleRemoveMapping = (localCat: string) => {
    setMappings((prev) => {
      const nextMap = { ...prev[activeMarketplace] };
      delete nextMap[localCat];
      return {
        ...prev,
        [activeMarketplace]: nextMap
      };
    });
    toast.info(`"${localCat}" eşleştirmesi kaldırıldı.`);
  };

  // Handler: Smart Auto-Match
  const handleAutoMatch = () => {
    const availableCats = marketCategories[activeMarketplace] || [];
    if (availableCats.length === 0) {
      toast.error('Pazaryeri kategorileri henüz yüklenmedi.');
      return;
    }

    let newlyMatched = 0;
    const updated = { ...currentMappings };

    localCategories.forEach((localCat) => {
      if (!updated[localCat]) {
        const { bestMatch, score } = suggestMarketplaceCategory(localCat, availableCats);
        if (bestMatch && score >= 40) {
          updated[localCat] = String(bestMatch.id);
          newlyMatched++;
        }
      }
    });

    if (newlyMatched > 0) {
      setMappings((prev) => ({
        ...prev,
        [activeMarketplace]: updated
      }));
      toast.success(`${newlyMatched} adet kategori akıllı eşleme ile otomatik bağlandı!`);
    } else {
      toast.info('Eşleşecek yeni kategori bulunamadı veya tüm kategoriler zaten eşleşmiş.');
    }
  };

  // Open attributes configurator for a mapped category
  const handleOpenAttributes = async (localCat: string, marketCatId: string | number) => {
    const availableCats = marketCategories[activeMarketplace] || [];
    const matched = availableCats.find((c) => String(c.id) === String(marketCatId));
    const catName = matched?.name || `Kategori #${marketCatId}`;

    setAttributeModalCategory({
      localCat,
      marketCatId,
      marketCatName: catName
    });

    setLoadingAttributes(true);
    try {
      if (activeMarketplace === 'hepsiburada') {
        const res = await api.getHepsiburadaCategoryAttributes(marketCatId, currentStoreId);
        const attrs = res.data?.attributes || res.data || res.attributes;
        if (Array.isArray(attrs) && attrs.length > 0) {
          setCurrentCategoryAttributes(attrs.map((a: any) => ({
            id: a.id || a.attributeId || a.name,
            name: a.name || a.displayName || a.attributeName,
            description: a.description,
            mandatory: !!(a.mandatory || a.required),
            type: a.type === 'enum' || a.values?.length ? 'select' : 'text',
            values: Array.isArray(a.values) ? a.values.map((v: any) => typeof v === 'object' ? (v.value || v.name) : v) : undefined,
            defaultValue: a.defaultValue
          })));
        } else {
          setCurrentCategoryAttributes(getAttributesForCategory(catName, matched?.paths || []));
        }
      } else {
        // Fallback for other marketplaces
        setCurrentCategoryAttributes(getAttributesForCategory(catName, matched?.paths || []));
      }
    } catch (e) {
      setCurrentCategoryAttributes(getAttributesForCategory(catName, matched?.paths || []));
    } finally {
      setLoadingAttributes(false);
    }
  };

  // Set attribute configuration for a specific attribute
  const handleUpdateAttributeValue = (attrId: string, mode: 'fixed' | 'field', value: string) => {
    if (!attributeModalCategory) return;
    const catId = String(attributeModalCategory.marketCatId);

    setAttributesConfig((prev) => {
      const currentMarketAttrs = prev[activeMarketplace] || {};
      const currentCatAttrs = currentMarketAttrs[catId] || {};

      return {
        ...prev,
        [activeMarketplace]: {
          ...currentMarketAttrs,
          [catId]: {
            ...currentCatAttrs,
            [attrId]: { mode, value }
          }
        }
      };
    });
  };

  // Quick fill recommended defaults for attributes
  const handleAutoFillAttributes = () => {
    if (!attributeModalCategory) return;
    const catId = String(attributeModalCategory.marketCatId);

    const autoFilled: Record<string, any> = {};
    currentCategoryAttributes.forEach((attr) => {
      if (attr.id === 'Marka' || attr.name.toLowerCase().includes('marka')) {
        autoFilled[attr.id] = { mode: 'field', value: '$product.brand' };
      } else if (attr.id === 'Renk' || attr.name.toLowerCase().includes('renk')) {
        autoFilled[attr.id] = { mode: 'field', value: '$product.variant_color' };
      } else if (attr.id === 'Beden' || attr.name.toLowerCase().includes('beden')) {
        autoFilled[attr.id] = { mode: 'field', value: '$product.variant_size' };
      } else if (attr.id === 'GarantiSuresi' || attr.name.toLowerCase().includes('garanti')) {
        autoFilled[attr.id] = { mode: 'fixed', value: '24' };
      } else if (attr.id === 'tax_vat_rate' || attr.name.toLowerCase().includes('kdv')) {
        autoFilled[attr.id] = { mode: 'fixed', value: '20' };
      } else if (attr.id === 'Cinsiyet') {
        autoFilled[attr.id] = { mode: 'fixed', value: 'Unisex' };
      } else if (attr.defaultValue) {
        autoFilled[attr.id] = { mode: 'fixed', value: attr.defaultValue };
      }
    });

    setAttributesConfig((prev) => ({
      ...prev,
      [activeMarketplace]: {
        ...(prev[activeMarketplace] || {}),
        [catId]: {
          ...((prev[activeMarketplace] || {})[catId] || {}),
          ...autoFilled
        }
      }
    }));
    toast.success('Önerilen varsayılan alanlar otomatik dolduruldu.');
  };

  // Save all settings for the active marketplace
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const activeMappings = mappings[activeMarketplace];
      const activeAttrs = attributesConfig[activeMarketplace];

      if (activeMarketplace === 'hepsiburada') {
        const prevHb = branding.hepsiburada_settings || {};
        const payload = {
          apiKey: prevHb.apiKey || 'lookprice_dev',
          apiSecret: prevHb.apiSecret || '',
          merchantId: prevHb.merchantId || '',
          isTestMode: prevHb.isTestMode,
          defaultDispatchTime: prevHb.defaultDispatchTime,
          defaultCargoCompany: prevHb.defaultCargoCompany,
          categoryMappings: activeMappings,
          categoryAttributes: activeAttrs,
          storeId: currentStoreId
        };
        await api.saveHepsiburadaSettings(payload as any);
        if (onBrandingChange) onBrandingChange('hepsiburada_settings', { ...prevHb, ...payload });
      } else if (activeMarketplace === 'trendyol') {
        const prevTy = branding.trendyol_settings || {};
        const payload = {
          apiKey: prevTy.apiKey || '',
          apiSecret: prevTy.apiSecret || '',
          merchantId: prevTy.merchantId || '',
          categoryMappings: activeMappings,
          categoryAttributes: activeAttrs,
          storeId: currentStoreId
        };
        await api.saveTrendyolSettings(payload as any);
        if (onBrandingChange) onBrandingChange('trendyol_settings', { ...prevTy, ...payload });
      } else if (activeMarketplace === 'amazon') {
        const prevAmz = branding.amazon_settings || {};
        const payload = {
          clientId: prevAmz.clientId || '',
          clientSecret: prevAmz.clientSecret || '',
          refreshToken: prevAmz.refresh_token || '',
          sellerId: prevAmz.sellerId || '',
          categoryMappings: activeMappings,
          categoryAttributes: activeAttrs,
          storeId: currentStoreId
        };
        await api.saveAmazonSettings(payload as any);
        if (onBrandingChange) onBrandingChange('amazon_settings', { ...prevAmz, ...payload });
      } else if (activeMarketplace === 'pazarama') {
        const prevPz = branding.pazarama_settings || {};
        const payload = {
          apiKey: prevPz.apiKey || '',
          apiSecret: prevPz.apiSecret || '',
          merchantId: prevPz.merchantId || '',
          commissionRate: prevPz.commissionRate || 0,
          categoryMappings: activeMappings,
          brandMappings: prevPz.brandMappings || {},
          storeId: currentStoreId
        };
        await api.savePazaramaSettings(payload as any);
        if (onBrandingChange) onBrandingChange('pazarama_settings', { ...prevPz, ...payload });
      }

      toast.success(`${activeMarketplace.toUpperCase()} kategori ve özellik eşleştirmeleri başarıyla kaydedildi!`);
      if (onSaveSuccess) onSaveSuccess();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Eşleştirmeler kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentAvailableMarketCats = marketCategories[activeMarketplace] || [];
  const filteredLocalCategories = localCategories.filter((cat) => 
    cat.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const activeMarketplaceConfig = {
    hepsiburada: {
      title: 'Hepsiburada',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      activeTabBg: 'bg-rose-600 text-white',
      ringColor: 'focus:border-rose-500',
      accentColor: 'text-rose-600',
      tag: 'Katalog & OMS Canlı Entegratör'
    },
    trendyol: {
      title: 'Trendyol',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      activeTabBg: 'bg-amber-600 text-white',
      ringColor: 'focus:border-amber-500',
      accentColor: 'text-amber-600',
      tag: 'SAPIGW Marketplace'
    },
    amazon: {
      title: 'Amazon TR',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      activeTabBg: 'bg-blue-600 text-white',
      ringColor: 'focus:border-blue-500',
      accentColor: 'text-blue-600',
      tag: 'SP-API Partner'
    },
    pazarama: {
      title: 'Pazarama',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeTabBg: 'bg-indigo-600 text-white',
      ringColor: 'focus:border-indigo-500',
      accentColor: 'text-indigo-600',
      tag: 'Pazarama API'
    }
  }[activeMarketplace];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden my-auto">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-2xl shadow-sm">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>{lang === 'tr' ? 'Pazaryeri Kategori & Özellik Eşleştirme' : 'Marketplace Category & Attribute Mapping'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Otomatik & Akıllı
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {lang === 'tr' 
                  ? 'Envanterinizdeki ürün kategorilerini pazaryerlerinin resmi kategorileri ve zorunlu alanlarıyla eşleştirin.' 
                  : 'Map your store inventory categories with official marketplace categories and mandatory attributes.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MARKETPLACE TABS SELECTOR */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            {(['hepsiburada', 'trendyol', 'amazon', 'pazarama'] as MarketplaceType[]).map((m) => {
              const count = localCategories.filter((c) => !!mappings[m]?.[c]).length;
              const isSelected = activeMarketplace === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setActiveMarketplace(m);
                    setOpenDropdownFor(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    isSelected
                      ? `${activeMarketplaceConfig.activeTabBg} shadow-sm`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="capitalize">{m === 'amazon' ? 'Amazon TR' : m}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white font-black' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}/{totalCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAutoMatch}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
              title="Kategori isim benzerliklerine göre otomatik eşleme yap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{lang === 'tr' ? 'Akıllı Otomatik Eşleştir' : 'Auto Match'}</span>
            </button>
          </div>
        </div>

        {/* PROGRESS & STATUS BAR */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-slate-700">
              {lang === 'tr' ? 'Eşleşme Durumu:' : 'Mapping Status:'}
            </span>
            <div className="w-36 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="font-mono font-bold text-slate-900">
              %{completionPercent} ({mappedCount} / {totalCount} {lang === 'tr' ? 'Kategori' : 'Categories'})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder={lang === 'tr' ? 'Kategorilerde ara...' : 'Filter categories...'}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 w-48 transition-all"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* MAPPING TABLE / LIST */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {localCategories.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">
                {lang === 'tr' ? 'Envanterinizde henüz kategorize edilmiş ürün bulunmuyor.' : 'No categorized products found.'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {lang === 'tr' 
                  ? 'Ürün eklerken veya düzenlerken kategori belirlediğinizde burada listelenecektir.' 
                  : 'Categories will appear here once you assign categories to your products.'}
              </p>
            </div>
          ) : filteredLocalCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium">
              {lang === 'tr' ? 'Aramanızla eşleşen kategori bulunamadı.' : 'No matching categories.'}
            </div>
          ) : (
            filteredLocalCategories.map((localCat) => {
              const mappedId = currentMappings[localCat];
              const matchedMarketCat = currentAvailableMarketCats.find((c) => String(c.id) === String(mappedId));
              const prodCount = productCountPerCategory[localCat] || 0;
              const isDropdownOpen = openDropdownFor === localCat;

              // Check attributes configured count
              const currentCatAttrs = attributesConfig[activeMarketplace]?.[String(mappedId)] || {};
              const configuredAttrCount = Object.keys(currentCatAttrs).length;

              // Suggestion pill if unmapped
              const suggestion = !mappedId ? suggestMarketplaceCategory(localCat, currentAvailableMarketCats).bestMatch : null;

              // Filter marketplace categories for dropdown
              const filteredMarketCats = currentAvailableMarketCats.filter((c) => {
                if (!catSearchTerm) return true;
                const s = catSearchTerm.toLowerCase();
                return (
                  c.name.toLowerCase().includes(s) ||
                  String(c.id).includes(s) ||
                  (c.paths || []).some((p) => p.toLowerCase().includes(s))
                );
              });

              return (
                <div 
                  key={localCat}
                  className={`p-4 rounded-2xl border transition-all ${
                    mappedId 
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs' 
                      : 'bg-slate-50/50 border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* STORE CATEGORY COLUMN */}
                    <div className="lg:w-1/3 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{localCat}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70">
                          {prodCount} {lang === 'tr' ? 'Ürün' : 'Products'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'tr' ? 'Mağazanızdaki ürün kategorisi' : 'Store category'}
                      </p>
                    </div>

                    {/* MARKETPLACE MAPPING SELECTOR COLUMN */}
                    <div className="lg:w-1/2 relative">
                      {mappedId && matchedMarketCat ? (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="space-y-0.5 pr-2">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="text-xs font-bold text-slate-900">
                                {matchedMarketCat.displayName || matchedMarketCat.name}
                              </span>
                            </div>
                            {matchedMarketCat.paths && matchedMarketCat.paths.length > 0 && (
                              <p className="text-[10px] text-slate-500 font-medium pl-6">
                                {matchedMarketCat.paths.join(' > ')}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1.5 shrink-0">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                              #{mappedId}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownFor(localCat);
                                setCatSearchTerm('');
                              }}
                              className="text-xs text-indigo-600 font-bold hover:underline px-2 py-1 cursor-pointer"
                            >
                              {lang === 'tr' ? 'Değiştir' : 'Change'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveMapping(localCat)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title={lang === 'tr' ? 'Eşleştirmeyi Kaldır' : 'Remove'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdownFor(isDropdownOpen ? null : localCat);
                              setCatSearchTerm('');
                            }}
                            className="w-full text-left px-4 py-2.5 bg-white border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-between cursor-pointer transition-all"
                          >
                            <span>{lang === 'tr' ? `${activeMarketplaceConfig.title} Kategorisi Seç...` : 'Select category...'}</span>
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </button>

                          {/* SMART SUGGESTION PILL */}
                          {suggestion && (
                            <div className="flex items-center space-x-2 text-[11px]">
                              <span className="text-slate-400 font-medium">
                                {lang === 'tr' ? 'Akıllı Öneri:' : 'Suggestion:'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectMapping(localCat, suggestion.id)}
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                              >
                                <Sparkles className="h-3 w-3" />
                                <span>{suggestion.displayName || suggestion.name} (#{suggestion.id})</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* DROPDOWN SEARCH MENU */}
                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 max-h-72 flex flex-col">
                          <div className="relative">
                            <input
                              type="text"
                              autoFocus
                              placeholder={lang === 'tr' ? 'Kategori adı veya ID ara...' : 'Search category name or ID...'}
                              value={catSearchTerm}
                              onChange={(e) => setCatSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          </div>

                          <div className="overflow-y-auto flex-1 space-y-1 max-h-48 pr-1">
                            {filteredMarketCats.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-4">
                                {lang === 'tr' ? 'Kategori bulunamadı' : 'No categories found'}
                              </p>
                            ) : (
                              filteredMarketCats.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleSelectMapping(localCat, c.id)}
                                  className="w-full text-left p-2 hover:bg-slate-50 rounded-xl text-xs transition-colors flex items-center justify-between group cursor-pointer"
                                >
                                  <div>
                                    <p className="font-bold text-slate-900 group-hover:text-indigo-600">
                                      {c.displayName || c.name}
                                    </p>
                                    {c.paths && c.paths.length > 0 && (
                                      <p className="text-[10px] text-slate-400">{c.paths.join(' > ')}</p>
                                    )}
                                  </div>
                                  <span className="font-mono text-[10px] bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-700 px-2 py-0.5 rounded border border-slate-200">
                                    ID: {c.id}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>

                          <div className="border-t border-slate-100 pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setOpenDropdownFor(null)}
                              className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1 cursor-pointer"
                            >
                              {lang === 'tr' ? 'Kapat' : 'Close'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ATTRIBUTES BUTTON COLUMN */}
                    <div className="lg:w-auto flex items-center justify-end">
                      {mappedId ? (
                        <button
                          type="button"
                          onClick={() => handleOpenAttributes(localCat, mappedId)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                            configuredAttrCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>
                            {configuredAttrCount > 0 
                              ? `${configuredAttrCount} ${lang === 'tr' ? 'Özellik Ayarlandı' : 'Attributes Configured'}`
                              : (lang === 'tr' ? 'Zorunlu Alanları Ayarla' : 'Configure Attributes')}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          {lang === 'tr' ? 'Önce kategori eşleyin' : 'Map category first'}
                        </span>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Info className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              {lang === 'tr' 
                ? 'Eşleştirmeler kaydedildiğinde ürün senkronizasyonlarında otomatik olarak kullanılır.' 
                : 'Saved mappings are automatically applied during product synchronization.'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAll}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center space-x-2 disabled:opacity-50 cursor-pointer transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Tüm Eşleştirmeleri Kaydet' : 'Save All Mappings')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ATTRIBUTES CONFIGURATION SUB-MODAL */}
      {attributeModalCategory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden my-auto">
            
            {/* SUB-MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base">
                    {attributeModalCategory.marketCatName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'tr' ? 'Mağaza Kategorisi:' : 'Store Category:'} <strong className="text-slate-700">{attributeModalCategory.localCat}</strong> (Kategori ID: #{attributeModalCategory.marketCatId})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttributeModalCategory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* INFO & QUICK ACTION */}
            <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100/50 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-indigo-900 font-medium">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>
                  {lang === 'tr' 
                    ? 'Pazaryerinin istediği zorunlu alanları sabit değer veya ürün alanıyla bağlayın.' 
                    : 'Map required attributes to static values or product fields.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillAttributes}
                className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-bold text-[11px] hover:bg-indigo-50 transition-all cursor-pointer shrink-0"
              >
                {lang === 'tr' ? 'Önerilenleri Doldur' : 'Auto Fill'}
              </button>
            </div>

            {/* ATTRIBUTES LIST */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingAttributes ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">{lang === 'tr' ? 'Özellikler yükleniyor...' : 'Loading attributes...'}</p>
                </div>
              ) : currentCategoryAttributes.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  {lang === 'tr' ? 'Bu kategori için ek zorunlu özellik bulunamadı.' : 'No required attributes for this category.'}
                </p>
              ) : (
                currentCategoryAttributes.map((attr) => {
                  const catId = String(attributeModalCategory.marketCatId);
                  const existingSetting = attributesConfig[activeMarketplace]?.[catId]?.[attr.id] || {
                    mode: attr.type === 'select' || attr.defaultValue ? 'fixed' : 'field',
                    value: attr.defaultValue || ''
                  };

                  return (
                    <div 
                      key={attr.id}
                      className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{attr.name}</span>
                          {attr.mandatory && (
                            <span className="text-[10px] px-2 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold">
                              {lang === 'tr' ? 'Zorunlu' : 'Required'}
                            </span>
                          )}
                        </div>

                        {/* MODE SELECTOR (Fixed vs Field) */}
                        <div className="inline-flex p-0.5 bg-slate-200/80 rounded-lg text-[10px] font-bold">
                          <button
                            type="button"
                            onClick={() => handleUpdateAttributeValue(attr.id, 'fixed', existingSetting.value || attr.defaultValue || '')}
                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                              existingSetting.mode === 'fixed'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600'
                            }`}
                          >
                            {lang === 'tr' ? 'Sabit Değer' : 'Static'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateAttributeValue(attr.id, 'field', existingSetting.value || '$product.brand')}
                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                              existingSetting.mode === 'field'
                                ? 'bg-white text-slate-900 shadow-2xs'
                                : 'text-slate-600'
                            }`}
                          >
                            {lang === 'tr' ? 'Ürün Alanından Al' : 'From Product'}
                          </button>
                        </div>
                      </div>

                      {attr.description && (
                        <p className="text-[11px] text-slate-500">{attr.description}</p>
                      )}

                      {/* VALUE INPUT ACCORDING TO MODE */}
                      {existingSetting.mode === 'field' ? (
                        <select
                          value={existingSetting.value || ''}
                          onChange={(e) => handleUpdateAttributeValue(attr.id, 'field', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">{lang === 'tr' ? '-- Ürün Alanı Seçin --' : '-- Select Product Field --'}</option>
                          {PRODUCT_FIELD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : attr.values && attr.values.length > 0 ? (
                        <select
                          value={existingSetting.value || ''}
                          onChange={(e) => handleUpdateAttributeValue(attr.id, 'fixed', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">{lang === 'tr' ? '-- Değer Seçin --' : '-- Select Value --'}</option>
                          {attr.values.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={attr.type === 'number' ? 'number' : 'text'}
                          placeholder={attr.placeholder || (lang === 'tr' ? 'Varsayılan değer yazın...' : 'Enter default value...')}
                          value={existingSetting.value || ''}
                          onChange={(e) => handleUpdateAttributeValue(attr.id, 'fixed', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* SUB-MODAL FOOTER */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setAttributeModalCategory(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-sm"
              >
                {lang === 'tr' ? 'Tamamla & Uygula' : 'Done & Apply'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
