import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Sparkles, Layers, Settings2, CheckCircle2, AlertCircle, 
  ChevronRight, Save, RefreshCw, SlidersHorizontal, ArrowRight, 
  HelpCircle, Trash2, Check, Info, ShieldCheck, Tag, Laptop, Smartphone,
  Tv, Shirt, Home, Wrench, LayoutGrid, FolderTree, Filter, Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { 
  MarketplaceCategory, 
  MarketplaceAttribute,
  MARKETPLACE_SECTORS,
  MarketplaceSectorOption,
  detectCategorySector,
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

export interface LocalCategoryItem {
  key: string;
  mainCategory: string;
  subCategory?: string;
  isSubCategory: boolean;
  productCount: number;
}

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

  // Sector Filtering State (e.g. 'all', 'computer', 'phone', 'electronics', 'fashion', 'home', 'auto')
  const [selectedSector, setSelectedSector] = useState<string>('all');
  
  // Local Category Scope Filter (e.g. 'all', 'sub', 'main', 'unmapped')
  const [localScopeFilter, setLocalScopeFilter] = useState<'all' | 'sub' | 'main' | 'unmapped'>('all');

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

  // Category-specific Commission & Markup configuration per marketplace
  // Structure: { [marketplace]: { [localCategoryKey]: { commissionRate?: number, fixedFee?: number } } }
  const [categoryMarkups, setCategoryMarkups] = useState<Record<MarketplaceType, Record<string, { commissionRate?: number; fixedFee?: number }>>>({
    hepsiburada: branding.hepsiburada_settings?.categoryMarkups || {},
    trendyol: branding.trendyol_settings?.categoryMarkups || {},
    amazon: branding.amazon_settings?.categoryMarkups || {},
    pazarama: branding.pazarama_settings?.categoryMarkups || {}
  });

  // Global default commission and fixed fee per marketplace
  const [defaultCommissionRates, setDefaultCommissionRates] = useState<Record<MarketplaceType, number>>({
    hepsiburada: branding.hepsiburada_settings?.defaultCommissionRate ?? 18,
    trendyol: branding.trendyol_settings?.defaultCommissionRate ?? 18,
    amazon: branding.amazon_settings?.defaultCommissionRate ?? 15,
    pazarama: branding.pazarama_settings?.commissionRate ?? 15
  });

  const [defaultFixedFees, setDefaultFixedFees] = useState<Record<MarketplaceType, number>>({
    hepsiburada: branding.hepsiburada_settings?.defaultFixedFee ?? 20,
    trendyol: branding.trendyol_settings?.defaultFixedFee ?? 20,
    amazon: branding.amazon_settings?.defaultFixedFee ?? 20,
    pazarama: branding.pazarama_settings?.defaultFixedFee ?? 20
  });

  const [showPricingFormulaInfo, setShowPricingFormulaInfo] = useState(false);

  // Helper to update specific category's markup
  const handleUpdateCategoryMarkup = (localCatKey: string, field: 'commissionRate' | 'fixedFee', val: number) => {
    setCategoryMarkups((prev) => {
      const currentMarketMarkups = prev[activeMarketplace] || {};
      const existing = currentMarketMarkups[localCatKey] || {};
      return {
        ...prev,
        [activeMarketplace]: {
          ...currentMarketMarkups,
          [localCatKey]: {
            ...existing,
            [field]: isNaN(val) ? 0 : val
          }
        }
      };
    });
  };

  // Helper to compute sample price
  const calculateSimulatedPrice = (basePrice: number, commRate: number, fixedFee: number) => {
    if (basePrice <= 0) return 0;
    const safeRate = commRate >= 100 ? 99.9 : Math.max(0, commRate);
    const divisor = 1 - (safeRate / 100);
    return Math.round(((basePrice + fixedFee) / divisor) * 100) / 100;
  };

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
                leaf: c.leaf !== false,
                sector: c.sector || detectCategorySector(c.name || c.displayName, c.paths || [])
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
                paths: c.subCategories ? [c.name] : [],
                sector: c.sector || detectCategorySector(c.name, c.subCategories ? [c.name] : [])
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
                displayName: c.name || c.categoryName,
                sector: c.sector || detectCategorySector(c.name || c.categoryName)
              }))
            }));
          }
        })
        .catch(() => {
          // Keep curated default categories
        });
    }
  }, [isOpen, activeMarketplace, currentStoreId]);

  // Extract all unique local categories and sub-categories from store's products
  const localCategoryItems = useMemo<LocalCategoryItem[]>(() => {
    const itemMap = new Map<string, LocalCategoryItem>();

    (products || []).forEach((p: any) => {
      const cat1 = p.category ? String(p.category).trim() : '';
      const sub1 = p.sub_category ? String(p.sub_category).trim() : '';
      const cat2 = p.category_2 ? String(p.category_2).trim() : '';
      const sub2 = p.sub_category_2 ? String(p.sub_category_2).trim() : '';

      // 1. Primary Hierarchical Sub-Category (e.g. "BELLEK&HAFIZA KARTLARI > USB BELLEK")
      if (cat1 && sub1) {
        const key = `${cat1} > ${sub1}`;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            key,
            mainCategory: cat1,
            subCategory: sub1,
            isSubCategory: true,
            productCount: 0
          });
        }
        itemMap.get(key)!.productCount += 1;
      }

      // 2. Primary Main Category (e.g. "BELLEK&HAFIZA KARTLARI")
      if (cat1) {
        const key = cat1;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            key,
            mainCategory: cat1,
            isSubCategory: false,
            productCount: 0
          });
        }
        itemMap.get(key)!.productCount += 1;
      }

      // 3. Secondary Category & Subcategory if exists
      if (cat2 && sub2) {
        const key = `${cat2} > ${sub2}`;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            key,
            mainCategory: cat2,
            subCategory: sub2,
            isSubCategory: true,
            productCount: 0
          });
        }
        itemMap.get(key)!.productCount += 1;
      } else if (cat2) {
        const key = cat2;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            key,
            mainCategory: cat2,
            isSubCategory: false,
            productCount: 0
          });
        }
        itemMap.get(key)!.productCount += 1;
      }
    });

    // Sub-categories first, then descending by product count
    return Array.from(itemMap.values()).sort((a, b) => {
      if (a.isSubCategory && !b.isSubCategory) return -1;
      if (!a.isSubCategory && b.isSubCategory) return 1;
      return b.productCount - a.productCount;
    });
  }, [products]);

  const localCategories = useMemo(() => localCategoryItems.map((i) => i.key), [localCategoryItems]);

  // Count of products per local category key
  const productCountPerCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    localCategoryItems.forEach((i) => {
      counts[i.key] = i.productCount;
    });
    return counts;
  }, [localCategoryItems]);

  // Statistics for active marketplace
  const currentMappings = mappings[activeMarketplace] || {};
  const mappedCount = localCategories.filter((cat) => !!currentMappings[cat]).length;
  const totalCount = localCategories.length;
  const completionPercent = totalCount > 0 ? Math.round((mappedCount / totalCount) * 100) : 0;

  // Subcategory and main category counts
  const subCategoryCount = localCategoryItems.filter((i) => i.isSubCategory).length;
  const mainCategoryCount = localCategoryItems.filter((i) => !i.isSubCategory).length;
  const unmappedCount = localCategories.filter((cat) => !currentMappings[cat]).length;

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

  // Handler: Smart Auto-Match with sector awareness and subcategory prioritization
  const handleAutoMatch = () => {
    const availableCats = marketCategories[activeMarketplace] || [];
    if (availableCats.length === 0) {
      toast.error('Pazaryeri kategorileri henüz yüklenmedi.');
      return;
    }

    let newlyMatched = 0;
    const updated = { ...currentMappings };

    localCategoryItems.forEach((item) => {
      if (!updated[item.key]) {
        // If sector selected and not 'all', try sector categories first
        let pool = availableCats;
        if (selectedSector !== 'all') {
          const sectorCats = availableCats.filter((c) => (c.sector || detectCategorySector(c.name, c.paths)) === selectedSector);
          if (sectorCats.length > 0) {
            pool = sectorCats;
          }
        }

        const { bestMatch, score } = suggestMarketplaceCategory(item.key, pool);
        if (bestMatch && score >= 35) {
          updated[item.key] = String(bestMatch.id);
          newlyMatched++;
        } else if (pool !== availableCats) {
          // Fallback to all categories
          const fallback = suggestMarketplaceCategory(item.key, availableCats);
          if (fallback.bestMatch && fallback.score >= 35) {
            updated[item.key] = String(fallback.bestMatch.id);
            newlyMatched++;
          }
        }
      }
    });

    if (newlyMatched > 0) {
      setMappings((prev) => ({
        ...prev,
        [activeMarketplace]: updated
      }));
      toast.success(`${newlyMatched} adet kategori (özellikle alt kategoriler) otomatik bağlandı!`);
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
      const lowerId = attr.id.toLowerCase();
      const lowerName = attr.name.toLowerCase();

      if (lowerId === 'marka' || lowerName.includes('marka') || lowerId.includes('brand')) {
        autoFilled[attr.id] = { mode: 'field', value: '$product.brand' };
      } else if (lowerId === 'mensei' || lowerName.includes('menşei') || lowerName.includes('mensei') || lowerId.includes('origin')) {
        autoFilled[attr.id] = { mode: 'fixed', value: 'Çin' };
      } else if (lowerId === 'model' || lowerName === 'model') {
        autoFilled[attr.id] = { mode: 'field', value: '$product.model' };
      } else if (lowerId === 'renk' || lowerName.includes('renk')) {
        autoFilled[attr.id] = { mode: 'field', value: '$product.variant_color' };
      } else if (lowerId === 'beden' || lowerName.includes('beden')) {
        autoFilled[attr.id] = { mode: 'field', value: '$product.variant_size' };
      } else if (lowerId === 'garantisuresi' || lowerName.includes('garanti')) {
        autoFilled[attr.id] = { mode: 'fixed', value: '24' };
      } else if (lowerId === 'tax_vat_rate' || lowerName.includes('kdv')) {
        autoFilled[attr.id] = { mode: 'fixed', value: '20' };
      } else if (lowerId === 'cinsiyet') {
        autoFilled[attr.id] = { mode: 'fixed', value: 'Unisex' };
      } else if (attr.defaultValue) {
        if (attr.defaultValue.startsWith('$product.')) {
          autoFilled[attr.id] = { mode: 'field', value: attr.defaultValue };
        } else {
          autoFilled[attr.id] = { mode: 'fixed', value: attr.defaultValue };
        }
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
      const activeMarkups = categoryMarkups[activeMarketplace] || {};
      const activeDefComm = defaultCommissionRates[activeMarketplace] ?? 18;
      const activeDefFee = defaultFixedFees[activeMarketplace] ?? 20;

      if (activeMarketplace === 'hepsiburada') {
        const prevHb = branding.hepsiburada_settings || {};
        const payload = {
          apiKey: prevHb.apiKey || 'lookprice_dev',
          apiSecret: prevHb.apiSecret || '',
          merchantId: prevHb.merchantId || '',
          isTestMode: prevHb.isTestMode,
          defaultDispatchTime: prevHb.defaultDispatchTime,
          defaultCargoCompany: prevHb.defaultCargoCompany,
          defaultCommissionRate: activeDefComm,
          defaultFixedFee: activeDefFee,
          categoryMappings: activeMappings,
          categoryAttributes: activeAttrs,
          categoryMarkups: activeMarkups,
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
          defaultCommissionRate: activeDefComm,
          defaultFixedFee: activeDefFee,
          categoryMappings: activeMappings,
          categoryAttributes: activeAttrs,
          categoryMarkups: activeMarkups,
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
          defaultCommissionRate: activeDefComm,
          defaultFixedFee: activeDefFee,
          categoryMappings: activeMappings,
          categoryAttributes: activeAttrs,
          categoryMarkups: activeMarkups,
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
          commissionRate: activeDefComm,
          defaultFixedFee: activeDefFee,
          categoryMappings: activeMappings,
          categoryMarkups: activeMarkups,
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

  const currentAvailableMarketCats = useMemo(() => {
    return (marketCategories[activeMarketplace] || []).map((c) => ({
      ...c,
      sector: c.sector || detectCategorySector(c.name || c.displayName || '', c.paths || [])
    }));
  }, [marketCategories, activeMarketplace]);

  // Categories filtered by the selected sector
  const sectorFilteredMarketCats = useMemo(() => {
    if (selectedSector === 'all') return currentAvailableMarketCats;
    return currentAvailableMarketCats.filter((c) => c.sector === selectedSector);
  }, [currentAvailableMarketCats, selectedSector]);

  // Filter local category items by search term and local scope
  const filteredLocalCategoryItems = useMemo(() => {
    return localCategoryItems.filter((item) => {
      const mappedId = currentMappings[item.key];

      // Text search
      if (searchFilter.trim()) {
        const s = searchFilter.toLowerCase();
        const matchKey = item.key.toLowerCase().includes(s);
        const matchMapped = mappedId && String(mappedId).includes(s);
        if (!matchKey && !matchMapped) return false;
      }

      // Scope filter: all, sub, main, unmapped
      if (localScopeFilter === 'sub' && !item.isSubCategory) return false;
      if (localScopeFilter === 'main' && item.isSubCategory) return false;
      if (localScopeFilter === 'unmapped' && !!mappedId) return false;

      return true;
    });
  }, [localCategoryItems, searchFilter, localScopeFilter, currentMappings]);

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

  // Helper: Icon for sector
  const getSectorIcon = (sectorId: string) => {
    switch (sectorId) {
      case 'computer': return <Laptop className="h-3.5 w-3.5" />;
      case 'phone': return <Smartphone className="h-3.5 w-3.5" />;
      case 'electronics': return <Tv className="h-3.5 w-3.5" />;
      case 'fashion': return <Shirt className="h-3.5 w-3.5" />;
      case 'home': return <Home className="h-3.5 w-3.5" />;
      case 'auto': return <Wrench className="h-3.5 w-3.5" />;
      default: return <LayoutGrid className="h-3.5 w-3.5" />;
    }
  };

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
                  Hiyerarşik Alt Kategori Destekli
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {lang === 'tr' 
                  ? 'Ürünlerinizin alt kategorilerini (Örn: Bellek & Hafıza Kartları > USB Bellek) resmi pazaryeri kategorileriyle sektörel olarak eşleştirin.' 
                  : 'Map store sub-categories with official marketplace categories using sector-based filtering.'}
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
              title="Alt kategori ve ana kategori isimlerine göre otomatik akıllı eşleme yap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{lang === 'tr' ? 'Akıllı Otomatik Eşleştir' : 'Auto Match'}</span>
            </button>
          </div>
        </div>

        {/* PRICING STRATEGY & REVERSE MARGIN COMMISSION BANNER */}
        <div className="px-6 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-wide uppercase text-amber-400">
                  {lang === 'tr' ? `${activeMarketplaceConfig.title} Fiyatlandırma & Komisyon Formülü` : `${activeMarketplaceConfig.title} Pricing & Commission Strategy`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPricingFormulaInfo(!showPricingFormulaInfo)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 flex items-center space-x-1 cursor-pointer transition-all"
                >
                  <Info className="h-3 w-3 text-amber-300" />
                  <span>{showPricingFormulaInfo ? (lang === 'tr' ? 'Formülü Gizle' : 'Hide Formula') : (lang === 'tr' ? 'Ters Marj Formülü Detayı' : 'Formula Details')}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-300">
                {lang === 'tr' 
                  ? 'Pazaryeri komisyon ve kargo kesintisi yapıldığında, kasanıza web sitenizdeki net fiyatın kalması için fiyat otomatik yükseltilir.'
                  : 'Prices are dynamically marked up so your net profit remains 100% equal to your web store price after commission.'}
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/15">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-300 uppercase">{lang === 'tr' ? 'Genel Komisyon:' : 'Def. Comm:'}</span>
                <div className="flex items-center bg-slate-900/80 rounded-lg px-2 py-1 border border-white/20">
                  <span className="text-xs font-bold text-amber-400 mr-1">%</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    value={defaultCommissionRates[activeMarketplace] ?? 18}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setDefaultCommissionRates((prev) => ({ ...prev, [activeMarketplace]: isNaN(v) ? 0 : v }));
                    }}
                    className="w-12 bg-transparent text-xs font-black text-white focus:outline-hidden text-right"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold text-slate-300 uppercase">{lang === 'tr' ? 'Sabit Gider:' : 'Fixed Fee:'}</span>
                <div className="flex items-center bg-slate-900/80 rounded-lg px-2 py-1 border border-white/20">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={defaultFixedFees[activeMarketplace] ?? 20}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setDefaultFixedFees((prev) => ({ ...prev, [activeMarketplace]: isNaN(v) ? 0 : v }));
                    }}
                    className="w-12 bg-transparent text-xs font-black text-white focus:outline-hidden text-right"
                  />
                  <span className="text-[11px] font-bold text-slate-300 ml-1">TL</span>
                </div>
              </div>

              <div className="hidden lg:flex items-center pl-2 border-l border-white/20 text-[11px] text-amber-300 font-bold whitespace-nowrap">
                <span>1.000 TL Web ➔ {calculateSimulatedPrice(1000, defaultCommissionRates[activeMarketplace] ?? 18, defaultFixedFees[activeMarketplace] ?? 20).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            </div>
          </div>

          {/* DETAILED FORMULA EXPLANATION */}
          {showPricingFormulaInfo && (
            <div className="mt-3 pt-3 border-t border-white/15 text-xs grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-200">
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-400">📐</span> {lang === 'tr' ? 'Ters Marj (Net Kasa Koruma) Formülü:' : 'Formula:'}
                </p>
                <div className="font-mono text-[11px] bg-slate-950/80 p-2 rounded-lg text-emerald-400 border border-white/10 overflow-x-auto">
                  Fiyat_Pazaryeri = (Fiyat_Web + Sabit_Gider) / (1 - (Komisyon_Oranı / 100))
                </div>
                <p className="text-[10px] text-slate-300">
                  {lang === 'tr' 
                    ? 'Düz yüzde eklemesi yerine ters marj kullanılır. Çünkü pazaryeri komisyonu nihai satış fiyatından keser.'
                    : 'Reverse margin is applied because marketplaces deduct commission from the final gross selling price.'}
                </p>
              </div>

              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="text-amber-400">💡</span> {lang === 'tr' ? 'Kategori Bazlı Özel Komisyon Tanımlama:' : 'Category-Specific Overrides:'}
                </p>
                <p className="text-[11px] text-slate-300">
                  {lang === 'tr' 
                    ? 'Aşağıdaki kategori listesinde her satırın yanındaki komisyon alanından o kategoriye özel komisyon oranı (%) ve kargo payı (TL) girebilirsiniz. Boş bırakılan kategorilerde yukarıdaki genel varsayılan değerler uygulanır.'
                    : 'You can set category-specific commission rates and fixed fees for individual rows below. Empty rows automatically inherit the default global values.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SECTOR FILTER BAR (SEKTÖREL KATEGORİ SEÇİMİ) */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-indigo-600" />
              {lang === 'tr' ? 'Pazaryeri Sektör Filtresi (Aradığınız sektöre göre kategori ağacını filtreleyin):' : 'Marketplace Sector Filter:'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {sectorFilteredMarketCats.length} {lang === 'tr' ? 'kategori listeleniyor' : 'categories available'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {MARKETPLACE_SECTORS.map((sector) => {
              const isCurrent = selectedSector === sector.id;
              const sectorCatsCount = sector.id === 'all' 
                ? currentAvailableMarketCats.length 
                : currentAvailableMarketCats.filter((c) => c.sector === sector.id).length;

              return (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => setSelectedSector(sector.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer border ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                  title={sector.description}
                >
                  {getSectorIcon(sector.id)}
                  <span>{sector.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {sectorCatsCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROGRESS, SEARCH & SCOPE TABS */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* SCOPE TABS */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => setLocalScopeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                localScopeFilter === 'all' 
                  ? 'bg-slate-200 text-slate-900' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lang === 'tr' ? 'Tümü' : 'All'} ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setLocalScopeFilter('sub')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
                localScopeFilter === 'sub' 
                  ? 'bg-purple-100 text-purple-900' 
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <FolderTree className="h-3 w-3" />
              <span>{lang === 'tr' ? 'Alt Kategoriler' : 'Sub-Categories'} ({subCategoryCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setLocalScopeFilter('main')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                localScopeFilter === 'main' 
                  ? 'bg-blue-100 text-blue-900' 
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              {lang === 'tr' ? 'Ana Kategoriler' : 'Main'} ({mainCategoryCount})
            </button>
            <button
              type="button"
              onClick={() => setLocalScopeFilter('unmapped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                localScopeFilter === 'unmapped' 
                  ? 'bg-rose-100 text-rose-900' 
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              {lang === 'tr' ? 'Eşleşmemiş' : 'Unmapped'} ({unmappedCount})
            </button>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-28 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="font-mono font-bold text-slate-800 text-[11px]">
                %{completionPercent} ({mappedCount}/{totalCount})
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={lang === 'tr' ? 'Kategori ara...' : 'Filter categories...'}
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 w-40 transition-all"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>
        </div>

        {/* MAPPING TABLE / LIST */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {localCategoryItems.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">
                {lang === 'tr' ? 'Envanterinizde henüz kategorize edilmiş ürün bulunmuyor.' : 'No categorized products found.'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {lang === 'tr' 
                  ? 'Ürün eklerken kategori veya alt kategori belirlediğinizde burada listelenecektir.' 
                  : 'Categories and sub-categories will appear here once you assign categories to your products.'}
              </p>
            </div>
          ) : filteredLocalCategoryItems.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-100">
              {lang === 'tr' ? 'Seçilen filtre ve aramayla eşleşen kategori bulunamadı.' : 'No matching categories found.'}
            </div>
          ) : (
            filteredLocalCategoryItems.map((item) => {
              const localCat = item.key;
              const mappedId = currentMappings[localCat];
              const matchedMarketCat = currentAvailableMarketCats.find((c) => String(c.id) === String(mappedId));
              const prodCount = item.productCount;
              const isDropdownOpen = openDropdownFor === localCat;

              // Check attributes configured count
              const currentCatAttrs = attributesConfig[activeMarketplace]?.[String(mappedId)] || {};
              const configuredAttrCount = Object.keys(currentCatAttrs).length;

              // Suggestion pill if unmapped (prioritizes active sector pool if available)
              const suggestionPool = sectorFilteredMarketCats.length > 0 ? sectorFilteredMarketCats : currentAvailableMarketCats;
              const suggestion = !mappedId ? suggestMarketplaceCategory(localCat, suggestionPool).bestMatch : null;

              // Filter marketplace categories for dropdown (sector filtered first)
              const filteredMarketCats = sectorFilteredMarketCats.filter((c) => {
                if (!catSearchTerm) return true;
                const s = catSearchTerm.toLowerCase();
                return (
                  c.name.toLowerCase().includes(s) ||
                  String(c.id).includes(s) ||
                  (c.displayName && c.displayName.toLowerCase().includes(s)) ||
                  (c.paths || []).some((p) => p.toLowerCase().includes(s))
                );
              });

              return (
                <div 
                  key={localCat}
                  className={`p-4 rounded-2xl border transition-all ${
                    mappedId 
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs' 
                      : 'bg-slate-50/60 border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* STORE CATEGORY COLUMN (HIERARCHICAL & SUBCATEGORY AWARE) */}
                    <div className="lg:w-1/3 space-y-1">
                      {item.isSubCategory ? (
                        <div>
                          <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-400">
                            <FolderTree className="h-3 w-3 text-purple-500 shrink-0" />
                            <span>{item.mainCategory}</span>
                            <span>&gt;</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="font-black text-slate-900 text-sm">{item.subCategory}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                              {lang === 'tr' ? 'Alt Kategori' : 'Sub-Category'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {prodCount} {lang === 'tr' ? 'Ürün' : 'Products'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{item.mainCategory}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              {lang === 'tr' ? 'Ana Kategori' : 'Main'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {prodCount} {lang === 'tr' ? 'Ürün' : 'Products'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {lang === 'tr' ? 'Mağaza ana ürün kategorisi' : 'Store category'}
                          </p>
                        </div>
                      )}
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
                            <span className="flex items-center gap-1.5">
                              <span>{lang === 'tr' ? `${activeMarketplaceConfig.title} Kategorisi Seç...` : 'Select category...'}</span>
                              {selectedSector !== 'all' && (
                                <span className="text-[10px] font-normal text-indigo-600">
                                  ({MARKETPLACE_SECTORS.find((s) => s.id === selectedSector)?.name})
                                </span>
                              )}
                            </span>
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
                                <Sparkles className="h-3 w-3 text-purple-600" />
                                <span>{suggestion.displayName || suggestion.name} (#{suggestion.id})</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* DROPDOWN SEARCH MENU WITH SECTOR QUICK SWITCH */}
                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 space-y-2 max-h-80 flex flex-col">
                          
                          {/* Mini Sector Switcher inside dropdown */}
                          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[10px] font-bold border-b border-slate-100">
                            {MARKETPLACE_SECTORS.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setSelectedSector(s.id)}
                                className={`px-2 py-0.5 rounded-md cursor-pointer whitespace-nowrap ${
                                  selectedSector === s.id
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {s.name}
                              </button>
                            ))}
                          </div>

                          <div className="relative">
                            <input
                              type="text"
                              autoFocus
                              placeholder={lang === 'tr' ? 'Kategori ara (örn: USB Bellek, Kart Okuyucu, SSD)...' : 'Search category name or ID...'}
                              value={catSearchTerm}
                              onChange={(e) => setCatSearchTerm(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          </div>

                          <div className="overflow-y-auto flex-1 space-y-1 max-h-52 pr-1">
                            {filteredMarketCats.length === 0 ? (
                              <div className="text-center py-4 space-y-1">
                                <p className="text-xs text-slate-400">
                                  {lang === 'tr' ? 'Seçili sektörde uygun kategori bulunamadı' : 'No categories found'}
                                </p>
                                {selectedSector !== 'all' && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSector('all')}
                                    className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                                  >
                                    {lang === 'tr' ? 'Tüm sektörleri göster' : 'Show all sectors'}
                                  </button>
                                )}
                              </div>
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
                                  <span className="font-mono text-[10px] bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-700 px-2 py-0.5 rounded border border-slate-200 shrink-0 ml-2">
                                    ID: {c.id}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>

                          <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[11px] text-slate-400">
                            <span>{filteredMarketCats.length} {lang === 'tr' ? 'kategori' : 'categories'}</span>
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

                  {/* CATEGORY COMMISSION & REVERSE MARGIN PRICING BAR */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Percent className="h-3 w-3 text-indigo-500" />
                        <span>{lang === 'tr' ? 'Bu Kategoriye Özel Komisyon & Gider:' : 'Category Markup:'}</span>
                      </span>
                      
                      <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'tr' ? 'Komisyon' : 'Comm'}</span>
                        <div className="flex items-center">
                          <span className="text-xs font-bold text-indigo-600 mr-0.5">%</span>
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="0.5"
                            placeholder={String(defaultCommissionRates[activeMarketplace] ?? 18)}
                            value={categoryMarkups[activeMarketplace]?.[localCat]?.commissionRate ?? ''}
                            onChange={(e) => handleUpdateCategoryMarkup(localCat, 'commissionRate', parseFloat(e.target.value))}
                            className="w-11 bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden text-right"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'tr' ? 'Sabit Pay' : 'Fixed'}</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder={String(defaultFixedFees[activeMarketplace] ?? 20)}
                            value={categoryMarkups[activeMarketplace]?.[localCat]?.fixedFee ?? ''}
                            onChange={(e) => handleUpdateCategoryMarkup(localCat, 'fixedFee', parseFloat(e.target.value))}
                            className="w-11 bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden text-right"
                          />
                          <span className="text-[10px] font-bold text-slate-500 ml-0.5">TL</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px]">
                      {(() => {
                        const customComm = categoryMarkups[activeMarketplace]?.[localCat]?.commissionRate;
                        const customFee = categoryMarkups[activeMarketplace]?.[localCat]?.fixedFee;
                        const comm = customComm !== undefined && !isNaN(Number(customComm)) ? Number(customComm) : (defaultCommissionRates[activeMarketplace] ?? 18);
                        const fee = customFee !== undefined && !isNaN(Number(customFee)) ? Number(customFee) : (defaultFixedFees[activeMarketplace] ?? 20);
                        const sim = calculateSimulatedPrice(1000, comm, fee);
                        const hasCustom = customComm !== undefined || customFee !== undefined;
                        return (
                          <span className={`px-2.5 py-1 rounded-md font-mono font-bold flex items-center space-x-1 border ${
                            hasCustom 
                              ? 'bg-purple-50 text-purple-700 border-purple-200' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <span className="text-[10px] uppercase">{hasCustom ? 'Özel Formül:' : 'Varsayılan:'}</span>
                            <span>1.000 TL ➔ {sim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                          </span>
                        );
                      })()}
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
