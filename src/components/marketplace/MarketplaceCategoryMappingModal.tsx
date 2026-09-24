import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, Save, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { 
  MarketplaceCategory, 
  MarketplaceAttribute,
  detectCategorySector,
  HEPSIBURADA_DEFAULT_CATEGORIES,
  TRENDYOL_DEFAULT_CATEGORIES,
  AMAZON_DEFAULT_CATEGORIES,
  PAZARAMA_DEFAULT_CATEGORIES,
  getAttributesForCategory,
  suggestMarketplaceCategory
} from '@/data/marketplaceCategoriesData';

import { MarketplaceType, LocalCategoryItem } from './categoryMapping/types';
import { CategoryAttributeModal } from './categoryMapping/CategoryAttributeModal';
import { CommissionSettingsBar } from './categoryMapping/CommissionSettingsBar';
import { SectorFilterBar } from './categoryMapping/SectorFilterBar';
import { CategoryMappingHeader } from './categoryMapping/CategoryMappingHeader';
import { CategoryMappingRow } from './categoryMapping/CategoryMappingRow';

export type { MarketplaceType, LocalCategoryItem };

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
  const [activeMarketplace, setActiveMarketplace] = useState<MarketplaceType>(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const urlTab = url.searchParams.get('mapTab') as MarketplaceType;
      if (urlTab) return urlTab;
      const savedTab = localStorage.getItem('categoryMappingModalTab') as MarketplaceType;
      if (savedTab) return savedTab;
    }
    return initialMarketplace;
  });

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      localStorage.setItem('categoryMappingModalTab', activeMarketplace);
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('mapTab', activeMarketplace);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [isOpen, activeMarketplace]);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Sector Filtering State
  const [selectedSector, setSelectedSector] = useState<string>('all');
  
  // Local Category Scope Filter
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
  const [attributesConfig, setAttributesConfig] = useState<Record<MarketplaceType, Record<string, Record<string, any>>>>({
    hepsiburada: branding.hepsiburada_settings?.categoryAttributes || {},
    trendyol: branding.trendyol_settings?.categoryAttributes || {},
    amazon: branding.amazon_settings?.categoryAttributes || {},
    pazarama: branding.pazarama_settings?.categoryAttributes || {}
  });

  // Category-specific Commission & Markup configuration per marketplace
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

  // Sync state whenever modal opens or branding changes
  useEffect(() => {
    if (isOpen) {
      if (initialMarketplace) {
        setActiveMarketplace(initialMarketplace);
      }
      setMappings({
        hepsiburada: branding.hepsiburada_settings?.categoryMappings || {},
        trendyol: branding.trendyol_settings?.categoryMappings || {},
        amazon: branding.amazon_settings?.categoryMappings || {},
        pazarama: branding.pazarama_settings?.categoryMappings || {}
      });
      setAttributesConfig({
        hepsiburada: branding.hepsiburada_settings?.categoryAttributes || {},
        trendyol: branding.trendyol_settings?.categoryAttributes || {},
        amazon: branding.amazon_settings?.categoryAttributes || {},
        pazarama: branding.pazarama_settings?.categoryAttributes || {}
      });
      setCategoryMarkups({
        hepsiburada: branding.hepsiburada_settings?.categoryMarkups || {},
        trendyol: branding.trendyol_settings?.categoryMarkups || {},
        amazon: branding.amazon_settings?.categoryMarkups || {},
        pazarama: branding.pazarama_settings?.categoryMarkups || {}
      });
      setDefaultCommissionRates({
        hepsiburada: branding.hepsiburada_settings?.defaultCommissionRate ?? 18,
        trendyol: branding.trendyol_settings?.defaultCommissionRate ?? 18,
        amazon: branding.amazon_settings?.defaultCommissionRate ?? 15,
        pazarama: branding.pazarama_settings?.commissionRate ?? 15
      });
      setDefaultFixedFees({
        hepsiburada: branding.hepsiburada_settings?.defaultFixedFee ?? 20,
        trendyol: branding.trendyol_settings?.defaultFixedFee ?? 20,
        amazon: branding.amazon_settings?.defaultFixedFee ?? 20,
        pazarama: branding.pazarama_settings?.defaultFixedFee ?? 20
      });
    }
  }, [isOpen, branding, initialMarketplace]);

  // Helper to update specific category's markup
  const handleUpdateCategoryMarkup = (localCatKey: string, field: 'commissionRate' | 'fixedFee', val: number | undefined) => {
    setCategoryMarkups((prev) => {
      const currentMarketMarkups = prev[activeMarketplace] || {};
      const existing = currentMarketMarkups[localCatKey] || {};
      const nextObj = { ...existing };
      if (val === undefined || isNaN(val)) {
        delete nextObj[field];
      } else {
        nextObj[field] = val;
      }
      return {
        ...prev,
        [activeMarketplace]: {
          ...currentMarketMarkups,
          [localCatKey]: nextObj
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
        .catch(() => {});
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
        .catch(() => {});
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
        .catch(() => {});
    }
  }, [isOpen, activeMarketplace, currentStoreId]);

  // Live Category Search when user types in category search box
  useEffect(() => {
    if (!isOpen || !catSearchTerm || catSearchTerm.trim().length < 2) return;

    const term = catSearchTerm.trim();
    const timer = setTimeout(() => {
      if (activeMarketplace === 'hepsiburada') {
        api.get(`/api/integrations/hepsiburada/categories/search?q=${encodeURIComponent(term)}${currentStoreId ? `&storeId=${currentStoreId}` : ''}`)
          .then((res: any) => {
            const list = res.data?.categories || res.categories || [];
            if (Array.isArray(list) && list.length > 0) {
              setMarketCategories((prev) => {
                const existing = prev.hepsiburada || [];
                const existingIds = new Set(existing.map((c) => String(c.id)));
                const newItems = list
                  .map((c: any) => ({
                    id: c.id || c.categoryId,
                    name: c.name || c.displayName,
                    displayName: c.displayName || c.name,
                    paths: c.paths || [],
                    leaf: c.leaf !== false,
                    sector: c.sector || detectCategorySector(c.name || c.displayName, c.paths || [])
                  }))
                  .filter((c: any) => !existingIds.has(String(c.id)));

                if (newItems.length === 0) return prev;
                return {
                  ...prev,
                  hepsiburada: [...existing, ...newItems]
                };
              });
            }
          })
          .catch(() => {});
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, catSearchTerm, activeMarketplace, currentStoreId]);

  // Extract all unique local categories and sub-categories from store's products
  const localCategoryItems = useMemo<LocalCategoryItem[]>(() => {
    const itemMap = new Map<string, LocalCategoryItem>();

    (products || []).forEach((p: any) => {
      const cat1 = p.category ? String(p.category).trim() : '';
      const sub1 = p.sub_category ? String(p.sub_category).trim() : '';
      const cat2 = p.category_2 ? String(p.category_2).trim() : '';
      const sub2 = p.sub_category_2 ? String(p.sub_category_2).trim() : '';

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

    return Array.from(itemMap.values()).sort((a, b) => {
      if (a.isSubCategory && !b.isSubCategory) return -1;
      if (!a.isSubCategory && b.isSubCategory) return 1;
      return b.productCount - a.productCount;
    });
  }, [products]);

  const localCategories = useMemo(() => localCategoryItems.map((i) => i.key), [localCategoryItems]);

  // Statistics for active marketplace
  const currentMappings = mappings[activeMarketplace] || {};
  const mappedCount = localCategories.filter((cat) => !!currentMappings[cat]).length;
  const totalCount = localCategories.length;
  const completionPercent = totalCount > 0 ? Math.round((mappedCount / totalCount) * 100) : 0;

  const subCategoryCount = localCategoryItems.filter((i) => i.isSubCategory).length;
  const mainCategoryCount = localCategoryItems.filter((i) => !i.isSubCategory).length;
  const unmappedCount = localCategories.filter((cat) => !currentMappings[cat]).length;

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
        setCurrentCategoryAttributes(getAttributesForCategory(catName, matched?.paths || []));
      }
    } catch (e) {
      setCurrentCategoryAttributes(getAttributesForCategory(catName, matched?.paths || []));
    } finally {
      setLoadingAttributes(false);
    }
  };

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

  const currentAvailableMarketCats = (marketCategories[activeMarketplace] || []).map((c) => ({
    ...c,
    sector: c.sector || detectCategorySector(c.name || c.displayName || '', c.paths || [])
  }));

  const sectorFilteredMarketCats = selectedSector === 'all' 
    ? currentAvailableMarketCats 
    : currentAvailableMarketCats.filter((c) => c.sector === selectedSector);

  const filteredLocalCategoryItems = localCategoryItems.filter((item) => {
    const mappedId = currentMappings[item.key];

    if (searchFilter.trim()) {
      const s = searchFilter.toLowerCase();
      const matchKey = item.key.toLowerCase().includes(s);
      const matchMapped = mappedId && String(mappedId).includes(s);
      if (!matchKey && !matchMapped) return false;
    }

    if (localScopeFilter === 'sub' && !item.isSubCategory) return false;
    if (localScopeFilter === 'main' && item.isSubCategory) return false;
    if (localScopeFilter === 'unmapped' && !!mappedId) return false;

    return true;
  });

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
      tag: 'SP-API Listings'
    },
    pazarama: {
      title: 'Pazarama',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeTabBg: 'bg-emerald-600 text-white',
      ringColor: 'focus:border-emerald-500',
      accentColor: 'text-emerald-600',
      tag: 'Pazarama API'
    }
  }[activeMarketplace];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-2 md:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-6xl xl:max-w-7xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[94vh] overflow-hidden my-auto">
        
        {/* HEADER & TABS */}
        <CategoryMappingHeader
          onClose={onClose}
          activeMarketplace={activeMarketplace}
          setActiveMarketplace={setActiveMarketplace}
          mappings={mappings}
          localCategories={localCategories}
          handleAutoMatch={handleAutoMatch}
          localScopeFilter={localScopeFilter}
          setLocalScopeFilter={setLocalScopeFilter}
          totalCount={totalCount}
          subCategoryCount={subCategoryCount}
          mainCategoryCount={mainCategoryCount}
          unmappedCount={unmappedCount}
          completionPercent={completionPercent}
          mappedCount={mappedCount}
          searchFilter={searchFilter}
          setSearchFilter={setSearchFilter}
          lang={lang}
        />

        {/* PRICING STRATEGY & REVERSE MARGIN COMMISSION BANNER */}
        <CommissionSettingsBar
          activeMarketplace={activeMarketplace}
          activeMarketplaceTitle={activeMarketplaceConfig.title}
          defaultCommissionRates={defaultCommissionRates}
          setDefaultCommissionRates={setDefaultCommissionRates}
          defaultFixedFees={defaultFixedFees}
          setDefaultFixedFees={setDefaultFixedFees}
          calculateSimulatedPrice={calculateSimulatedPrice}
          lang={lang}
        />

        {/* SECTOR FILTER BAR */}
        <SectorFilterBar
          selectedSector={selectedSector}
          setSelectedSector={setSelectedSector}
          currentAvailableMarketCats={currentAvailableMarketCats}
          sectorFilteredMarketCats={sectorFilteredMarketCats}
          lang={lang}
        />

        {/* MAPPING TABLE / LIST */}
        <div className="px-4 py-2.5 overflow-y-auto flex-1 space-y-1.5">
          {localCategoryItems.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">
                {lang === 'tr' ? 'Envanterinizde henüz kategorize edilmiş ürün bulunmuyor.' : 'No categorized products found.'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                {lang === 'tr' 
                  ? 'Ürünlerinizi içeri aktardıktan sonra kategorileri buradan pazaryeri kataloglarına bağlayabilirsiniz.' 
                  : 'After importing products, map your store categories here.'}
              </p>
            </div>
          ) : filteredLocalCategoryItems.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              {lang === 'tr' ? 'Arama filtresine uygun kategori bulunamadı.' : 'No categories matched your filter.'}
            </div>
          ) : (
            filteredLocalCategoryItems.map((item) => {
              const localCat = item.key;
              const mappedId = currentMappings[localCat];
              const matchedMarketCat = mappedId 
                ? (currentAvailableMarketCats.find((c) => String(c.id) === String(mappedId)) || { id: mappedId, name: `Kategori #${mappedId}` })
                : undefined;
              const currentCatAttrs = mappedId ? (attributesConfig[activeMarketplace]?.[String(mappedId)] || {}) : {};

              return (
                <CategoryMappingRow
                  key={localCat}
                  item={item}
                  activeMarketplace={activeMarketplace}
                  activeMarketplaceConfig={activeMarketplaceConfig}
                  mappedId={mappedId}
                  matchedMarketCat={matchedMarketCat}
                  currentCatAttrs={currentCatAttrs}
                  categoryMarkups={categoryMarkups}
                  defaultCommissionRates={defaultCommissionRates}
                  defaultFixedFees={defaultFixedFees}
                  calculateSimulatedPrice={calculateSimulatedPrice}
                  openDropdownFor={openDropdownFor}
                  setOpenDropdownFor={setOpenDropdownFor}
                  catSearchTerm={catSearchTerm}
                  setCatSearchTerm={setCatSearchTerm}
                  selectedSector={selectedSector}
                  setSelectedSector={setSelectedSector}
                  sectorFilteredMarketCats={sectorFilteredMarketCats}
                  currentAvailableMarketCats={currentAvailableMarketCats}
                  handleSelectMapping={handleSelectMapping}
                  handleRemoveMapping={handleRemoveMapping}
                  handleOpenAttributes={handleOpenAttributes}
                  handleUpdateCategoryMarkup={handleUpdateCategoryMarkup}
                  lang={lang}
                />
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>
              {lang === 'tr' 
                ? 'Eşleştirmeler kaydedildiğinde ürün senkronizasyonlarında otomatik olarak kullanılır.' 
                : 'Saved mappings are automatically applied during product synchronization.'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveAll}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer transition-all"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Tüm Eşleştirmeleri Kaydet' : 'Save All Mappings')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* ATTRIBUTES CONFIGURATION SUB-MODAL */}
      <CategoryAttributeModal
        attributeModalCategory={attributeModalCategory}
        onClose={() => setAttributeModalCategory(null)}
        activeMarketplace={activeMarketplace}
        loadingAttributes={loadingAttributes}
        currentCategoryAttributes={currentCategoryAttributes}
        attributesConfig={attributesConfig}
        onUpdateAttributeValue={handleUpdateAttributeValue}
        onAutoFillAttributes={handleAutoFillAttributes}
        lang={lang}
      />

    </div>
  );
};
