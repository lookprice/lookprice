import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  N11_DEFAULT_CATEGORIES,
  getAttributesForCategory,
  suggestMarketplaceCategory,
  normalizeCategoryText,
  matchCategorySearchToken,
  buildScopedCategoryAttrKey,
  resolveScopedCategoryAttributes
} from '@/data/marketplaceCategoriesData';

import { MarketplaceType, LocalCategoryItem } from './categoryMapping/types';
import { CategoryAttributeModal } from './categoryMapping/CategoryAttributeModal';
import { CommissionSettingsBar } from './categoryMapping/CommissionSettingsBar';
import { SectorFilterBar } from './categoryMapping/SectorFilterBar';
import { CategoryMappingHeader } from './categoryMapping/CategoryMappingHeader';
import {
  CategoryMappingRow,
  IndexedMarketplaceCategory,
  MappedCategoryLabel
} from './categoryMapping/CategoryMappingRow';

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

function normalizeMappingId(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val).trim();
  if (typeof val === 'object') {
    return String(val.id || val.categoryId || val.hepsiburada || val.trendyol || val.n11 || val.amazon || val.pazarama || '').trim();
  }
  return '';
}

function normalizeMappingsRecord(raw: any): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const cleanKey = String(k || '').trim();
    const idStr = normalizeMappingId(v);
    if (cleanKey && idStr) {
      out[cleanKey] = idStr;
    }
  }
  return out;
}

function mergeCategoryLists(existing: MarketplaceCategory[], incoming: MarketplaceCategory[]): MarketplaceCategory[] {
  const byId = new Map<string, MarketplaceCategory>();
  for (const c of existing) {
    const idStr = String(c.id ?? '');
    if (idStr) byId.set(idStr, c);
  }
  for (const c of incoming) {
    const idStr = String(c.id ?? '');
    if (!idStr) continue;
    const prev = byId.get(idStr);
    // Prefer richer record (e.g. one with paths/displayName)
    if (!prev || ((c.paths?.length || 0) >= (prev.paths?.length || 0))) {
      byId.set(idStr, c);
    }
  }
  return Array.from(byId.values());
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
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [searchingRemote, setSearchingRemote] = useState(false);
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
  const [pazaramaCatalogNotice, setPazaramaCatalogNotice] = useState<string | null>(null);

  // Local mappings copy per marketplace
  const [mappings, setMappings] = useState<Record<MarketplaceType, Record<string, string>>>({
    hepsiburada: normalizeMappingsRecord(branding.hepsiburada_settings?.categoryMappings),
    trendyol: normalizeMappingsRecord(branding.trendyol_settings?.categoryMappings),
    n11: normalizeMappingsRecord(branding.n11_settings?.categoryMappings),
    amazon: normalizeMappingsRecord(branding.amazon_settings?.categoryMappings),
    pazarama: normalizeMappingsRecord(branding.pazarama_settings?.categoryMappings)
  });

  // Saved human-readable marketplace category labels/paths per marketplace (prevents blank counterparts before live API loads)
  const [mappingLabels, setMappingLabels] = useState<Record<MarketplaceType, Record<string, MappedCategoryLabel>>>({
    hepsiburada: branding.hepsiburada_settings?.categoryMappingLabels || {},
    trendyol: branding.trendyol_settings?.categoryMappingLabels || {},
    n11: branding.n11_settings?.categoryMappingLabels || {},
    amazon: branding.amazon_settings?.categoryMappingLabels || {},
    pazarama: branding.pazarama_settings?.categoryMappingLabels || {}
  });

  // Local category attributes configuration per marketplace
  const [attributesConfig, setAttributesConfig] = useState<Record<MarketplaceType, Record<string, Record<string, any>>>>({
    hepsiburada: branding.hepsiburada_settings?.categoryAttributes || {},
    trendyol: branding.trendyol_settings?.categoryAttributes || {},
    n11: branding.n11_settings?.categoryAttributes || {},
    amazon: branding.amazon_settings?.categoryAttributes || {},
    pazarama: branding.pazarama_settings?.categoryAttributes || {}
  });

  // Category-specific Commission & Markup configuration per marketplace
  const [categoryMarkups, setCategoryMarkups] = useState<Record<MarketplaceType, Record<string, { commissionRate?: number; fixedFee?: number }>>>({
    hepsiburada: branding.hepsiburada_settings?.categoryMarkups || {},
    trendyol: branding.trendyol_settings?.categoryMarkups || {},
    n11: branding.n11_settings?.categoryMarkups || {},
    amazon: branding.amazon_settings?.categoryMarkups || {},
    pazarama: branding.pazarama_settings?.categoryMarkups || {}
  });

  // Global default commission and fixed fee per marketplace
  const [defaultCommissionRates, setDefaultCommissionRates] = useState<Record<MarketplaceType, number>>({
    hepsiburada: branding.hepsiburada_settings?.defaultCommissionRate ?? 18,
    trendyol: branding.trendyol_settings?.defaultCommissionRate ?? 18,
    n11: branding.n11_settings?.defaultCommissionRate ?? 20,
    amazon: branding.amazon_settings?.defaultCommissionRate ?? 15,
    pazarama: branding.pazarama_settings?.commissionRate ?? 15
  });

  const [defaultFixedFees, setDefaultFixedFees] = useState<Record<MarketplaceType, number>>({
    hepsiburada: branding.hepsiburada_settings?.defaultFixedFee ?? 20,
    trendyol: branding.trendyol_settings?.defaultFixedFee ?? 20,
    n11: branding.n11_settings?.defaultFixedFee ?? 20,
    amazon: branding.amazon_settings?.defaultFixedFee ?? 20,
    pazarama: branding.pazarama_settings?.defaultFixedFee ?? 20
  });

  const prevIsOpenRef = useRef(false);
  const resolvedMissingIdsRef = useRef<Set<string>>(new Set());

  // Initialize state ONLY when modal transitions from closed -> open.
  // Never wipe in-progress or freshly-saved modal state when parent `branding` re-fetches in the background!
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      prevIsOpenRef.current = true;
      resolvedMissingIdsRef.current.clear();

      const saved = typeof window !== 'undefined' ? (localStorage.getItem('categoryMappingModalTab') as MarketplaceType) : null;
      if (initialMarketplace) {
        setActiveMarketplace(initialMarketplace);
      } else if (saved) {
        setActiveMarketplace(saved);
      }

      setMappings({
        hepsiburada: normalizeMappingsRecord(branding.hepsiburada_settings?.categoryMappings),
        trendyol: normalizeMappingsRecord(branding.trendyol_settings?.categoryMappings),
        n11: normalizeMappingsRecord(branding.n11_settings?.categoryMappings),
        amazon: normalizeMappingsRecord(branding.amazon_settings?.categoryMappings),
        pazarama: normalizeMappingsRecord(branding.pazarama_settings?.categoryMappings)
      });
      setMappingLabels({
        hepsiburada: branding.hepsiburada_settings?.categoryMappingLabels || {},
        trendyol: branding.trendyol_settings?.categoryMappingLabels || {},
        n11: branding.n11_settings?.categoryMappingLabels || {},
        amazon: branding.amazon_settings?.categoryMappingLabels || {},
        pazarama: branding.pazarama_settings?.categoryMappingLabels || {}
      });
      setAttributesConfig({
        hepsiburada: branding.hepsiburada_settings?.categoryAttributes || {},
        trendyol: branding.trendyol_settings?.categoryAttributes || {},
        n11: branding.n11_settings?.categoryAttributes || {},
        amazon: branding.amazon_settings?.categoryAttributes || {},
        pazarama: branding.pazarama_settings?.categoryAttributes || {}
      });
      setCategoryMarkups({
        hepsiburada: branding.hepsiburada_settings?.categoryMarkups || {},
        trendyol: branding.trendyol_settings?.categoryMarkups || {},
        n11: branding.n11_settings?.categoryMarkups || {},
        amazon: branding.amazon_settings?.categoryMarkups || {},
        pazarama: branding.pazarama_settings?.categoryMarkups || {}
      });
      setDefaultCommissionRates({
        hepsiburada: branding.hepsiburada_settings?.defaultCommissionRate ?? 18,
        trendyol: branding.trendyol_settings?.defaultCommissionRate ?? 18,
        n11: branding.n11_settings?.defaultCommissionRate ?? 20,
        amazon: branding.amazon_settings?.defaultCommissionRate ?? 15,
        pazarama: branding.pazarama_settings?.commissionRate ?? 15
      });
      setDefaultFixedFees({
        hepsiburada: branding.hepsiburada_settings?.defaultFixedFee ?? 20,
        trendyol: branding.trendyol_settings?.defaultFixedFee ?? 20,
        n11: branding.n11_settings?.defaultFixedFee ?? 20,
        amazon: branding.amazon_settings?.defaultFixedFee ?? 20,
        pazarama: branding.pazarama_settings?.defaultFixedFee ?? 20
      });
    } else if (!isOpen) {
      prevIsOpenRef.current = false;
      setOpenDropdownFor(null);
      setCatSearchTerm('');
    }
  }, [isOpen, branding, initialMarketplace]);

  // Helper to update specific category's markup
  const handleUpdateCategoryMarkup = useCallback((localCatKey: string, field: 'commissionRate' | 'fixedFee', val: number | undefined) => {
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
  }, [activeMarketplace]);

  // Helper to compute sample price
  const calculateSimulatedPrice = useCallback((basePrice: number, commRate: number, fixedFee: number) => {
    if (basePrice <= 0) return 0;
    const safeRate = commRate >= 100 ? 99.9 : Math.max(0, commRate);
    const divisor = 1 - (safeRate / 100);
    return Math.round(((basePrice + fixedFee) / divisor) * 100) / 100;
  }, []);

  // Available marketplace categories from API / Fallback
  const [marketCategories, setMarketCategories] = useState<Record<MarketplaceType, MarketplaceCategory[]>>({
    hepsiburada: HEPSIBURADA_DEFAULT_CATEGORIES,
    trendyol: TRENDYOL_DEFAULT_CATEGORIES,
    n11: N11_DEFAULT_CATEGORIES,
    amazon: AMAZON_DEFAULT_CATEGORIES,
    pazarama: PAZARAMA_DEFAULT_CATEGORIES
  });

  // Fetch live categories when modal opens or active marketplace changes (merge so we never drop searched/resolved items)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        if (activeMarketplace === 'hepsiburada') {
          const res = await api.getHepsiburadaCategories(currentStoreId);
          const list = res.data?.categories || res.data || res.categories;
          if (!cancelled && Array.isArray(list) && list.length > 0) {
            const incoming: MarketplaceCategory[] = list.map((c: any) => ({
              id: c.categoryId || c.id,
              name: c.name || c.displayName,
              displayName: c.displayName || c.name,
              paths: c.paths || (c.parentName ? [c.parentName, c.name] : []),
              leaf: c.leaf !== false,
              sector: c.sector || detectCategorySector(c.name || c.displayName, c.paths || [])
            }));
            setMarketCategories((prev) => ({
              ...prev,
              hepsiburada: mergeCategoryLists(prev.hepsiburada || [], incoming)
            }));
          }
        } else if (activeMarketplace === 'trendyol') {
          const res = await api.getTrendyolCategories();
          const list = res.data?.categories || res.data || res;
          if (!cancelled && Array.isArray(list) && list.length > 0) {
            const incoming: MarketplaceCategory[] = list.map((c: any) => ({
              id: c.id,
              name: c.name,
              displayName: c.displayName || c.name,
              paths: Array.isArray(c.paths) ? c.paths : (c.subCategories ? [c.name] : []),
              sector: c.sector || detectCategorySector(c.name, Array.isArray(c.paths) ? c.paths : [])
            }));
            setMarketCategories((prev) => ({
              ...prev,
              trendyol: mergeCategoryLists(prev.trendyol || [], incoming)
            }));
          }
        } else if (activeMarketplace === 'n11') {
          const res = await api.getN11Categories(currentStoreId);
          const list = res.data?.categories || res.data || res.categories;
          if (!cancelled && Array.isArray(list) && list.length > 0) {
            const incoming: MarketplaceCategory[] = list.map((c: any) => ({
              id: c.id || c.categoryId,
              name: c.name || c.displayName,
              displayName: c.displayName || c.name,
              paths: c.paths || [c.name],
              leaf: c.leaf !== false,
              sector: c.sector || detectCategorySector(c.name || c.displayName, c.paths || [])
            }));
            setMarketCategories((prev) => ({
              ...prev,
              n11: mergeCategoryLists(prev.n11 || [], incoming)
            }));
          }
        } else if (activeMarketplace === 'pazarama') {
          const res: any = await api.getPazaramaCategories(currentStoreId);
          const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
          const list = payload?.categories || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
          const isLiveSource = payload?.source === 'live_api_cache' || (Array.isArray(list) && list.length > 50);
          if (!cancelled) {
            setPazaramaCatalogNotice(
              !isLiveSource
                ? (payload?.warning || 'Pazarama canlı yaprak kategorilerini (örn. Klavye, Mouse, Grafik Tablet) yüklemek için Ayarlar > E-Mağazalar bölümünden Pazarama Client ID ve Client Secret bilgilerini bağlayın.')
                : null
            );
          }
          if (!cancelled && Array.isArray(list) && list.length > 0) {
            const incoming: MarketplaceCategory[] = list.map((c: any) => ({
              id: c.id || c.categoryId,
              name: c.name || c.categoryName || c.displayName,
              displayName: c.displayName || c.name || c.categoryName,
              paths: Array.isArray(c.paths) ? c.paths : [],
              leaf: c.leaf !== false,
              sector: c.sector || detectCategorySector(c.name || c.categoryName || c.displayName, Array.isArray(c.paths) ? c.paths : [])
            }));
            setMarketCategories((prev) => ({
              ...prev,
              // When live Pazarama leaf tree arrives, replace the 15 static dummy placeholders completely
              pazarama: isLiveSource ? incoming : mergeCategoryLists(prev.pazarama || [], incoming)
            }));
          }
        }
      } catch {
        // Fallback default catalog remains available
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    };

    loadCategories();
    return () => { cancelled = true; };
  }, [isOpen, activeMarketplace, currentStoreId]);

  // Pre-index all available categories for active marketplace ONCE per list update (O(1) lookup + instant search)
  const currentAvailableMarketCats = useMemo<IndexedMarketplaceCategory[]>(() => {
    const rawList = marketCategories[activeMarketplace] || [];
    return rawList.map((c) => {
      const name = String(c.name || c.displayName || '');
      const displayName = String(c.displayName || c.name || '');
      const paths = Array.isArray(c.paths) ? c.paths : [];
      const idStr = String(c.id ?? '');
      return {
        ...c,
        name,
        displayName,
        paths,
        sector: c.sector || detectCategorySector(name || displayName, paths),
        _normName: normalizeCategoryText(name),
        _normFull: normalizeCategoryText(`${name} ${displayName} ${paths.join(' ')}`),
        _idStr: idStr
      };
    });
  }, [marketCategories, activeMarketplace]);

  // O(1) lookup map by category ID
  const marketCatById = useMemo(() => {
    const map = new Map<string, IndexedMarketplaceCategory>();
    for (let i = 0; i < currentAvailableMarketCats.length; i++) {
      const c = currentAvailableMarketCats[i];
      if (c._idStr) map.set(c._idStr, c);
    }
    return map;
  }, [currentAvailableMarketCats]);

  const sectorFilteredMarketCats = useMemo(() => {
    if (selectedSector === 'all') return currentAvailableMarketCats;
    return currentAvailableMarketCats.filter((c) => c.sector === selectedSector);
  }, [currentAvailableMarketCats, selectedSector]);

  // Auto-resolve any saved Hepsiburada or Pazarama mapped category IDs not yet present in loaded catalog
  useEffect(() => {
    if (!isOpen || (activeMarketplace !== 'hepsiburada' && activeMarketplace !== 'pazarama')) return;
    const activeMap = mappings[activeMarketplace] || {};
    const missingIds = Array.from(
      new Set(
        Object.values(activeMap)
          .map((v) => String(v || '').trim())
          .filter((id) => id && !marketCatById.has(id) && !resolvedMissingIdsRef.current.has(`${activeMarketplace}:${id}`))
      )
    );
    if (missingIds.length === 0) return;

    missingIds.forEach((id) => resolvedMissingIdsRef.current.add(`${activeMarketplace}:${id}`));
    const targetMp = activeMarketplace;
    api.get(`/api/integrations/${targetMp}/categories/search?ids=${encodeURIComponent(missingIds.join(','))}${currentStoreId ? `&storeId=${currentStoreId}` : ''}`)
      .then((res: any) => {
        const list = res.data?.categories || res.categories || [];
        if (Array.isArray(list) && list.length > 0) {
          const incoming: MarketplaceCategory[] = list.map((c: any) => ({
            id: c.id || c.categoryId,
            name: c.name || c.displayName,
            displayName: c.displayName || c.name,
            paths: c.paths || [],
            leaf: c.leaf !== false,
            sector: c.sector || detectCategorySector(c.name || c.displayName, c.paths || [])
          }));
          setMarketCategories((prev) => ({
            ...prev,
            [targetMp]: mergeCategoryLists(prev[targetMp] || [], incoming)
          }));
        }
      })
      .catch(() => {});
  }, [isOpen, activeMarketplace, mappings.hepsiburada, mappings.pazarama, marketCatById, currentStoreId]);

  // Live Category Search fallback on backend when user types in HB/Pazarama search box (only when live catalog isn't fully loaded yet)
  useEffect(() => {
    if (!isOpen || !openDropdownFor || !catSearchTerm || catSearchTerm.trim().length < 2) {
      setSearchingRemote(false);
      return;
    }
    if (activeMarketplace !== 'hepsiburada' && activeMarketplace !== 'pazarama') return;
    // If full live catalog (> 500 items) is already loaded locally, client-side pre-indexed search is instant (< 2ms) with zero network latency!
    if ((marketCategories[activeMarketplace]?.length || 0) > 500) {
      setSearchingRemote(false);
      return;
    }

    const term = catSearchTerm.trim();
    const targetMp = activeMarketplace;
    let cancelled = false;
    setSearchingRemote(true);
    const timer = setTimeout(() => {
      api.get(`/api/integrations/${targetMp}/categories/search?q=${encodeURIComponent(term)}${currentStoreId ? `&storeId=${currentStoreId}` : ''}`)
        .then((res: any) => {
          if (cancelled) return;
          const list = res.data?.categories || res.categories || [];
          if (Array.isArray(list) && list.length > 0) {
            const incoming: MarketplaceCategory[] = list.map((c: any) => ({
              id: c.id || c.categoryId,
              name: c.name || c.displayName,
              displayName: c.displayName || c.name,
              paths: c.paths || [],
              leaf: c.leaf !== false,
              sector: c.sector || detectCategorySector(c.name || c.displayName, c.paths || [])
            }));
            setMarketCategories((prev) => ({
              ...prev,
              [targetMp]: mergeCategoryLists(prev[targetMp] || [], incoming)
            }));
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setSearchingRemote(false);
        });
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, openDropdownFor, catSearchTerm, activeMarketplace, currentStoreId, marketCategories.hepsiburada?.length, marketCategories.pazarama?.length]);

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
      }

      if (cat2) {
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
      if (a.isSubCategory !== b.isSubCategory) {
        return a.isSubCategory ? -1 : 1;
      }
      return b.productCount - a.productCount;
    });
  }, [products]);

  const localCategories = useMemo(() => {
    return localCategoryItems.map((item) => item.key);
  }, [localCategoryItems]);

  const currentMappings = mappings[activeMarketplace] || {};
  const currentLabels = mappingLabels[activeMarketplace] || {};

  // Resolve mapped ID for a local category item (supporting both "Main > Sub" and legacy leaf-only "Sub" keys)
  const resolveMappedIdForItem = useCallback((item: LocalCategoryItem, mapObj: Record<string, string>): string | undefined => {
    if (mapObj[item.key]) return mapObj[item.key];
    // Handle minor spacing differences around ">" (e.g., "Ana>Alt" vs "Ana > Alt")
    if (item.isSubCategory && item.subCategory) {
      const compactKey = `${item.mainCategory}>${item.subCategory}`;
      if (mapObj[compactKey]) return mapObj[compactKey];
      if (mapObj[item.subCategory]) return mapObj[item.subCategory];
    }
    return undefined;
  }, []);

  const handleSelectMapping = useCallback((localCat: string, marketCat: MarketplaceCategory) => {
    const idStr = String(marketCat.id);
    const leafSub = localCat.includes('>') ? localCat.split('>').pop()?.trim() : undefined;
    const labelPayload: MappedCategoryLabel = {
      id: idStr,
      name: marketCat.name || marketCat.displayName || `Kategori #${idStr}`,
      displayName: marketCat.displayName || marketCat.name || `Kategori #${idStr}`,
      paths: Array.isArray(marketCat.paths) ? marketCat.paths : []
    };

    setMappings((prev) => {
      const nextMarket = { ...(prev[activeMarketplace] || {}), [localCat]: idStr };
      // Keep legacy leaf-only alias in sync if it already existed so product resolvers stay 100% consistent
      if (leafSub && nextMarket[leafSub] !== undefined) {
        nextMarket[leafSub] = idStr;
      }
      return {
        ...prev,
        [activeMarketplace]: nextMarket
      };
    });

    setMappingLabels((prev) => {
      const nextLabels = { ...(prev[activeMarketplace] || {}), [localCat]: labelPayload };
      if (leafSub && nextLabels[leafSub] !== undefined) {
        nextLabels[leafSub] = labelPayload;
      }
      return {
        ...prev,
        [activeMarketplace]: nextLabels
      };
    });

    setOpenDropdownFor(null);
    setCatSearchTerm('');
  }, [activeMarketplace]);

  const handleRemoveMapping = useCallback((localCat: string) => {
    const leafSub = localCat.includes('>') ? localCat.split('>').pop()?.trim() : undefined;
    const compactKey = localCat.includes(' > ') ? localCat.replace(/\s*>\s*/g, '>') : undefined;

    setMappings((prev) => {
      const copy = { ...(prev[activeMarketplace] || {}) };
      delete copy[localCat];
      if (compactKey) delete copy[compactKey];
      // If a legacy leaf-only alias existed and no other subcategory shares it, remove it so the row cleanly unmaps
      if (leafSub && copy[leafSub] !== undefined) {
        const sharedByOther = localCategoryItems.some((it) => it.isSubCategory && it.key !== localCat && it.subCategory === leafSub);
        if (!sharedByOther) {
          delete copy[leafSub];
        }
      }
      return {
        ...prev,
        [activeMarketplace]: copy
      };
    });

    setMappingLabels((prev) => {
      const copy = { ...(prev[activeMarketplace] || {}) };
      delete copy[localCat];
      if (compactKey) delete copy[compactKey];
      return {
        ...prev,
        [activeMarketplace]: copy
      };
    });
  }, [activeMarketplace, localCategoryItems]);

  const handleAutoMatch = () => {
    const availableCats = currentAvailableMarketCats;
    if (availableCats.length === 0) {
      toast.error('Bu pazaryeri için henüz kategori listesi yüklenmedi.');
      return;
    }

    let newlyMatched = 0;
    const updated = { ...currentMappings };
    const updatedLabels = { ...currentLabels };

    localCategoryItems.forEach((item) => {
      if (!resolveMappedIdForItem(item, updated)) {
        const pool = sectorFilteredMarketCats.length > 0 ? sectorFilteredMarketCats : availableCats;
        const { bestMatch, score } = suggestMarketplaceCategory(item.key, pool);
        let winner = bestMatch && score >= 35 ? bestMatch : null;

        if (!winner && pool !== availableCats) {
          const fallback = suggestMarketplaceCategory(item.key, availableCats);
          if (fallback.bestMatch && fallback.score >= 35) {
            winner = fallback.bestMatch;
          }
        }

        if (winner) {
          const idStr = String(winner.id);
          updated[item.key] = idStr;
          updatedLabels[item.key] = {
            id: idStr,
            name: winner.name || winner.displayName || `Kategori #${idStr}`,
            displayName: winner.displayName || winner.name || `Kategori #${idStr}`,
            paths: Array.isArray(winner.paths) ? winner.paths : []
          };
          newlyMatched++;
        }
      }
    });

    if (newlyMatched > 0) {
      setMappings((prev) => ({
        ...prev,
        [activeMarketplace]: updated
      }));
      setMappingLabels((prev) => ({
        ...prev,
        [activeMarketplace]: updatedLabels
      }));
      toast.success(`${newlyMatched} adet kategori (özellikle alt kategoriler) otomatik bağlandı!`);
    } else {
      toast.info('Eşleşecek yeni kategori bulunamadı veya tüm kategoriler zaten eşleşmiş.');
    }
  };

  const handleOpenAttributes = useCallback(async (localCat: string, marketCatId: string | number) => {
    const idStr = String(marketCatId);
    const matched = marketCatById.get(idStr);
    const savedLabel = currentLabels[localCat];
    const catName = matched?.name || savedLabel?.name || `Kategori #${marketCatId}`;
    const catPaths = matched?.paths || savedLabel?.paths || [];

    setAttributeModalCategory({
      localCat,
      marketCatId,
      marketCatName: catName
    });

    setLoadingAttributes(true);
    try {
      if (activeMarketplace === 'hepsiburada') {
        const res = await api.getHepsiburadaCategoryAttributes(marketCatId, currentStoreId, catPaths?.[0] || catName, catName);
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
          setCurrentCategoryAttributes(getAttributesForCategory(catName, catPaths, marketCatId));
        }
      } else if (activeMarketplace === 'n11') {
        const res = await api.getN11CategoryAttributes(marketCatId, currentStoreId);
        const attrs = res.data?.attributes || res.attributes;
        if (Array.isArray(attrs) && attrs.length > 0) {
          setCurrentCategoryAttributes(attrs.map((a: any) => ({
            id: String(a.id || a.name),
            name: a.name || a.displayName,
            description: a.description,
            mandatory: !!a.mandatory,
            type: a.values?.length ? 'select' : 'text',
            values: a.values || [],
            defaultValue: a.defaultValue
          })));
        } else {
          setCurrentCategoryAttributes(getAttributesForCategory(catName, catPaths, marketCatId));
        }
      } else if (activeMarketplace === 'trendyol') {
        const res = await api.getTrendyolCategoryAttributes(marketCatId, catName, catPaths?.[catPaths.length - 1]);
        const attrs = res.data?.attributes || res.data || res.attributes;
        if (Array.isArray(attrs) && attrs.length > 0) {
          setCurrentCategoryAttributes(attrs.map((a: any) => ({
            id: String(a.id || a.attribute?.id || a.attributeId || a.name),
            name: a.name || a.attribute?.name || a.displayName || a.attributeName,
            description: a.description,
            mandatory: !!(a.mandatory || a.required),
            type: (a.values?.length || a.attributeValues?.length) ? 'select' : 'text',
            values: Array.isArray(a.values)
              ? a.values.map((v: any) => typeof v === 'object' ? `${v.id}: ${v.name}` : String(v))
              : (Array.isArray(a.attributeValues) ? a.attributeValues.map((v: any) => typeof v === 'object' ? `${v.id}: ${v.name}` : String(v)) : undefined),
            defaultValue: a.defaultValue
          })));
        } else {
          setCurrentCategoryAttributes(getAttributesForCategory(catName, catPaths, marketCatId));
        }
      } else if (activeMarketplace === 'pazarama') {
        const res: any = await api.getPazaramaCategoryAttributes(marketCatId, currentStoreId);
        const attrs = res?.data?.attributes || res?.attributes;
        if (Array.isArray(attrs) && attrs.length > 0) {
          setCurrentCategoryAttributes(attrs.map((a: any) => ({
            id: String(a.id || a.attributeId || a.name),
            name: a.name || a.displayName || a.attributeName,
            description: a.isVariant ? 'Varyant özelliği' : (a.isSlicer ? 'Dilimleyici özellik' : a.description),
            mandatory: !!(a.mandatory || a.isRequired || a.required),
            type: (Array.isArray(a.values) && a.values.length > 0) ? 'select' : 'text',
            values: Array.isArray(a.values)
              ? a.values.map((v: any) => typeof v === 'object' ? `${v.id}: ${v.value || v.name}` : String(v))
              : undefined,
            defaultValue: a.defaultValue
          })));
        } else {
          if (res?.warning) {
            toast.info(res.warning);
          }
          setCurrentCategoryAttributes(getAttributesForCategory(catName, catPaths, marketCatId));
        }
      } else {
        setCurrentCategoryAttributes(getAttributesForCategory(catName, catPaths, marketCatId));
      }
    } catch {
      setCurrentCategoryAttributes(getAttributesForCategory(catName, catPaths, marketCatId));
    } finally {
      setLoadingAttributes(false);
    }
  }, [activeMarketplace, currentStoreId, marketCatById, currentLabels]);

  const handleUpdateAttributeValue = (attrId: string, mode: 'fixed' | 'field', value: string) => {
    if (!attributeModalCategory) return;
    const scopedKey = buildScopedCategoryAttrKey(attributeModalCategory.localCat, attributeModalCategory.marketCatId);

    setAttributesConfig((prev) => {
      const currentMarketAttrs = prev[activeMarketplace] || {};
      // Seed isolated per-subcategory bucket from its existing scoped config (or read-only legacy fallback on first edit)
      // NEVER mutate the shared bare marketCatId bucket!
      const existingBase = resolveScopedCategoryAttributes(
        currentMarketAttrs,
        attributeModalCategory.localCat,
        attributeModalCategory.marketCatId
      );

      return {
        ...prev,
        [activeMarketplace]: {
          ...currentMarketAttrs,
          [scopedKey]: {
            ...existingBase,
            [attrId]: { mode, value }
          }
        }
      };
    });
  };

  const handleAutoFillAttributes = () => {
    if (!attributeModalCategory) return;
    const scopedKey = buildScopedCategoryAttrKey(attributeModalCategory.localCat, attributeModalCategory.marketCatId);

    const autoFilled: Record<string, any> = {};
    currentCategoryAttributes.forEach((attr) => {
      const lowerId = attr.id.toLowerCase();
      const lowerName = attr.name.toLowerCase();

      if (lowerId === 'marka' || lowerName.includes('marka') || lowerId.includes('brand')) {
        autoFilled[attr.id] = { mode: 'field', value: '$product.brand' };
      } else if (lowerId === '1192' || lowerId === 'mensei' || lowerName.includes('menşei') || lowerName.includes('mensei') || lowerId.includes('origin')) {
        autoFilled[attr.id] = { mode: 'fixed', value: activeMarketplace === 'trendyol' ? '10617344' : 'TR' };
      } else if (lowerId === '290' || lowerName.includes('garanti tipi')) {
        autoFilled[attr.id] = { mode: 'fixed', value: activeMarketplace === 'trendyol' ? '4183' : 'Resmi Distribütör Garantili' };
      } else if (lowerId === '433' || lowerName.includes('garanti süresi') || lowerName.includes('garanti suresi')) {
        autoFilled[attr.id] = { mode: 'fixed', value: activeMarketplace === 'trendyol' ? '20637' : '24' };
      } else if (lowerId === '343' || lowerName.includes('cinsiyet')) {
        autoFilled[attr.id] = { mode: 'fixed', value: activeMarketplace === 'trendyol' ? '4296' : 'Unisex' };
      } else if (lowerId === '346' || lowerName.includes('yaş grubu') || lowerName.includes('yas grubu')) {
        autoFilled[attr.id] = { mode: 'fixed', value: activeMarketplace === 'trendyol' ? '256116' : 'Yetişkin' };
      } else if (lowerId === '881' || lowerName.includes('ortam')) {
        autoFilled[attr.id] = { mode: 'fixed', value: activeMarketplace === 'trendyol' ? '10591476' : 'Belirtilmemiş' };
      } else if (lowerId === '33' || lowerName.includes('desen')) {
        autoFilled[attr.id] = { mode: 'fixed', value: 'Düz' };
      } else if (lowerId === 'model' || lowerName === 'model') {
        autoFilled[attr.id] = { mode: 'field', value: '$product.model' };
      } else if (lowerId === 'renk' || lowerName.includes('renk') || lowerId === '47' || lowerId === '348') {
        autoFilled[attr.id] = { mode: 'field', value: '$product.variant_color' };
      } else if (lowerId === 'beden' || lowerName.includes('beden') || lowerName.includes('boyut') || lowerId === '338') {
        autoFilled[attr.id] = { mode: 'field', value: '$product.variant_size' };
      } else if (lowerId.includes('garanti') || lowerName.includes('garanti')) {
        autoFilled[attr.id] = { mode: 'fixed', value: '24' };
      } else if (lowerId.includes('kdv') || lowerName.includes('kdv') || lowerId.includes('tax')) {
        autoFilled[attr.id] = { mode: 'field', value: '$product.tax_rate' };
      } else if (attr.defaultValue) {
        if (attr.defaultValue.startsWith('$product.')) {
          autoFilled[attr.id] = { mode: 'field', value: attr.defaultValue };
        } else {
          autoFilled[attr.id] = { mode: 'fixed', value: attr.defaultValue };
        }
      }
    });

    setAttributesConfig((prev) => {
      const currentMarketAttrs = prev[activeMarketplace] || {};
      const existingBase = resolveScopedCategoryAttributes(
        currentMarketAttrs,
        attributeModalCategory.localCat,
        attributeModalCategory.marketCatId
      );
      return {
        ...prev,
        [activeMarketplace]: {
          ...currentMarketAttrs,
          [scopedKey]: {
            ...existingBase,
            ...autoFilled
          }
        }
      };
    });
    toast.success('Önerilen varsayılan alanlar bu kategori için otomatik dolduruldu.');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const activeMappings = mappings[activeMarketplace] || {};
      const activeAttrs = attributesConfig[activeMarketplace] || {};
      const activeMarkups = categoryMarkups[activeMarketplace] || {};
      const activeDefComm = defaultCommissionRates[activeMarketplace] ?? 18;
      const activeDefFee = defaultFixedFees[activeMarketplace] ?? 20;

      // Enrich categoryMappingLabels from currently loaded live catalog so every saved mapping retains its full display name & path
      const enrichedLabels: Record<string, MappedCategoryLabel> = { ...(mappingLabels[activeMarketplace] || {}) };
      for (const [localKey, catId] of Object.entries(activeMappings)) {
        const idStr = String(catId || '').trim();
        if (!idStr) continue;
        const liveCat = marketCatById.get(idStr);
        if (liveCat) {
          enrichedLabels[localKey] = {
            id: idStr,
            name: liveCat.name || liveCat.displayName || `Kategori #${idStr}`,
            displayName: liveCat.displayName || liveCat.name || `Kategori #${idStr}`,
            paths: Array.isArray(liveCat.paths) ? liveCat.paths : []
          };
        }
      }

      let savedSettings: any = null;
      let brandingField = '';

      if (activeMarketplace === 'hepsiburada') {
        brandingField = 'hepsiburada_settings';
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
          categoryMappingLabels: enrichedLabels,
          categoryAttributes: activeAttrs,
          categoryMarkups: activeMarkups,
          storeId: currentStoreId
        };
        const res: any = await api.saveHepsiburadaSettings(payload as any);
        savedSettings = res?.data?.settings || res?.settings || { ...prevHb, ...payload };
      } else if (activeMarketplace === 'trendyol') {
        brandingField = 'trendyol_settings';
        const prevTy = branding.trendyol_settings || {};
        const payload = {
          apiKey: prevTy.apiKey || '',
          apiSecret: prevTy.apiSecret || '',
          merchantId: prevTy.merchantId || '',
          defaultCommissionRate: activeDefComm,
          defaultFixedFee: activeDefFee,
          categoryMappings: activeMappings,
          categoryMappingLabels: enrichedLabels,
          categoryAttributes: activeAttrs,
          categoryMarkups: activeMarkups,
          storeId: currentStoreId
        };
        const res: any = await api.saveTrendyolSettings(payload as any);
        savedSettings = res?.data?.settings || res?.settings || { ...prevTy, ...payload };
      } else if (activeMarketplace === 'n11') {
        brandingField = 'n11_settings';
        const prevN11 = branding.n11_settings || {};
        const payload = {
          appKey: prevN11.appKey || '',
          appSecret: prevN11.appSecret || '',
          defaultCommissionRate: activeDefComm,
          defaultFixedFee: activeDefFee,
          categoryMappings: activeMappings,
          categoryMappingLabels: enrichedLabels,
          categoryAttributes: activeAttrs,
          categoryMarkups: activeMarkups,
          connected: prevN11.connected,
          storeId: currentStoreId
        };
        const res: any = await api.saveN11Settings(payload as any);
        savedSettings = res?.data?.settings || res?.settings || { ...prevN11, ...payload };
      } else if (activeMarketplace === 'amazon') {
        brandingField = 'amazon_settings';
        const prevAmz = branding.amazon_settings || {};
        const payload = {
          clientId: prevAmz.clientId || '',
          clientSecret: prevAmz.clientSecret || '',
          refreshToken: prevAmz.refreshToken || prevAmz.refresh_token || '',
          sellerId: prevAmz.sellerId || '',
          defaultCommissionRate: activeDefComm,
          defaultFixedFee: activeDefFee,
          categoryMappings: activeMappings,
          categoryMappingLabels: enrichedLabels,
          categoryAttributes: activeAttrs,
          categoryMarkups: activeMarkups,
          storeId: currentStoreId
        };
        const res: any = await api.saveAmazonSettings(payload as any);
        savedSettings = res?.data?.settings || res?.settings || { ...prevAmz, ...payload };
      } else if (activeMarketplace === 'pazarama') {
        brandingField = 'pazarama_settings';
        const prevPz = branding.pazarama_settings || {};
        const payload = {
          apiKey: prevPz.apiKey || '',
          apiSecret: prevPz.apiSecret || '',
          merchantId: prevPz.merchantId || '',
          commissionRate: activeDefComm,
          defaultFixedFee: activeDefFee,
          categoryMappings: activeMappings,
          categoryMappingLabels: enrichedLabels,
          categoryAttributes: activeAttrs,
          categoryMarkups: activeMarkups,
          brandMappings: prevPz.brandMappings || {},
          storeId: currentStoreId
        };
        const res: any = await api.savePazaramaSettings(payload as any);
        savedSettings = res?.data?.settings || res?.settings || { ...prevPz, ...payload };
      }

      // Sync local modal state strictly from the authoritative persisted server response
      if (savedSettings) {
        setMappings((prev) => ({
          ...prev,
          [activeMarketplace]: normalizeMappingsRecord(savedSettings.categoryMappings ?? activeMappings)
        }));
        setMappingLabels((prev) => ({
          ...prev,
          [activeMarketplace]: savedSettings.categoryMappingLabels || enrichedLabels
        }));
        if (onBrandingChange && brandingField) {
          onBrandingChange(brandingField, savedSettings);
        }
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

  // Multi-word Turkish search on local category list (matches local name, subcategory, mapped ID, and mapped marketplace category name)
  const filteredLocalCategoryItems = useMemo(() => {
    const rawSearch = searchFilter.trim();
    const normSearch = rawSearch ? normalizeCategoryText(rawSearch) : '';
    const tokens = normSearch ? normSearch.split(' ').filter(Boolean) : [];

    return localCategoryItems.filter((item) => {
      const mappedId = resolveMappedIdForItem(item, currentMappings);

      if (rawSearch) {
        const mappedCat = mappedId ? marketCatById.get(String(mappedId)) : undefined;
        const savedLabel = currentLabels[item.key] || (item.subCategory ? currentLabels[item.subCategory] : undefined);
        const combinedText = normalizeCategoryText(
          `${item.key} ${mappedId || ''} ${mappedCat?.displayName || mappedCat?.name || ''} ${(mappedCat?.paths || []).join(' ')} ${savedLabel?.displayName || savedLabel?.name || ''}`
        );
        const exactIdHit = mappedId && String(mappedId).includes(rawSearch);
        const tokensHit = tokens.length > 0 && tokens.every((t) => matchCategorySearchToken(combinedText, t));
        if (!exactIdHit && !tokensHit) return false;
      }

      if (localScopeFilter === 'sub' && !item.isSubCategory) return false;
      if (localScopeFilter === 'main' && item.isSubCategory) return false;
      if (localScopeFilter === 'unmapped' && !!mappedId) return false;

      return true;
    });
  }, [localCategoryItems, currentMappings, currentLabels, marketCatById, searchFilter, localScopeFilter, resolveMappedIdForItem]);

  // Compute header counts accurately (including legacy sub-category key fallback)
  const { totalCount, subCategoryCount, mainCategoryCount, mappedCount, unmappedCount, completionPercent } = useMemo(() => {
    const total = localCategoryItems.length;
    const sub = localCategoryItems.filter((i) => i.isSubCategory).length;
    const main = total - sub;
    const mapped = localCategoryItems.filter((item) => !!resolveMappedIdForItem(item, currentMappings)).length;
    const unmapped = total - mapped;
    const pct = total > 0 ? Math.round((mapped / total) * 100) : 0;
    return { totalCount: total, subCategoryCount: sub, mainCategoryCount: main, mappedCount: mapped, unmappedCount: unmapped, completionPercent: pct };
  }, [localCategoryItems, currentMappings, resolveMappedIdForItem]);

  // Build normalized mappings map for header tab badges so legacy subCategory keys are also counted accurately
  const headerMappingsForCounts = useMemo(() => {
    const out: Record<MarketplaceType, Record<string, string>> = {
      hepsiburada: {},
      trendyol: {},
      n11: {},
      amazon: {},
      pazarama: {}
    };
    (['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama'] as MarketplaceType[]).forEach((mp) => {
      const mpMap = mappings[mp] || {};
      const resolved: Record<string, string> = {};
      localCategoryItems.forEach((item) => {
        const hit = resolveMappedIdForItem(item, mpMap);
        if (hit) resolved[item.key] = hit;
      });
      out[mp] = resolved;
    });
    return out;
  }, [mappings, localCategoryItems, resolveMappedIdForItem]);

  const MARKETPLACE_CONFIGS: Record<MarketplaceType, {
    title: string;
    badgeBg: string;
    activeTabBg: string;
    ringColor: string;
    accentColor: string;
    tag: string;
  }> = useMemo(() => ({
    hepsiburada: {
      title: 'Hepsiburada',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
      activeTabBg: 'bg-orange-600 text-white',
      ringColor: 'focus:border-orange-500',
      accentColor: 'text-orange-600',
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
    n11: {
      title: 'N11.com',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      activeTabBg: 'bg-red-600 text-white',
      ringColor: 'focus:border-red-500',
      accentColor: 'text-red-600',
      tag: 'SOAP WSDL Entegratör'
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
  }), []);

  if (!isOpen) return null;

  const activeMarketplaceConfig = MARKETPLACE_CONFIGS[activeMarketplace] || {
    title: activeMarketplace ? String(activeMarketplace).toUpperCase() : 'Pazaryeri',
    badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
    activeTabBg: 'bg-slate-800 text-white',
    ringColor: 'focus:border-slate-500',
    accentColor: 'text-slate-600',
    tag: 'Pazaryeri Entegratör'
  };

  const activeDefaultCommission = defaultCommissionRates[activeMarketplace] ?? 18;
  const activeDefaultFixedFee = defaultFixedFees[activeMarketplace] ?? 20;
  const activeMarkupsMap = categoryMarkups[activeMarketplace] || {};
  const activeAttrsMap = attributesConfig[activeMarketplace] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-1.5 sm:p-3 md:p-4 overflow-hidden animate-fade-in">
      <div className="bg-white w-full max-w-6xl xl:max-w-7xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col h-[94dvh] max-h-[94dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden my-auto">

        {/* HEADER & TABS */}
        <CategoryMappingHeader
          onClose={onClose}
          activeMarketplace={activeMarketplace}
          setActiveMarketplace={(m) => {
            setOpenDropdownFor(null);
            setCatSearchTerm('');
            setActiveMarketplace(m);
          }}
          mappings={headerMappingsForCounts}
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
        <div className="shrink-0">
          <CommissionSettingsBar
            activeMarketplace={activeMarketplace}
            activeMarketplaceTitle={activeMarketplaceConfig?.title || 'Pazaryeri'}
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

          {activeMarketplace === 'pazarama' && pazaramaCatalogNotice && (
            <div className="mx-3 sm:mx-4 mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200/90 text-amber-900 text-[11px] flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>{pazaramaCatalogNotice}</span>
            </div>
          )}
        </div>

        {/* MAPPING TABLE / LIST */}
        <div className="px-3 sm:px-4 py-2.5 overflow-y-auto flex-1 min-h-0 space-y-1.5">
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
              const mappedId = resolveMappedIdForItem(item, currentMappings);
              const mappedCat = mappedId ? marketCatById.get(String(mappedId)) : undefined;
              const savedLabel = currentLabels[localCat] || (item.subCategory ? currentLabels[item.subCategory] : undefined);
              const isDropdownOpen = openDropdownFor === localCat;
              const currentCatAttrs = mappedId
                ? resolveScopedCategoryAttributes(activeAttrsMap, localCat, mappedId)
                : {};

              return (
                <CategoryMappingRow
                  key={localCat}
                  item={item}
                  mappedId={mappedId}
                  matchedMarketCat={mappedCat}
                  mappedLabel={savedLabel}
                  loadingCategories={loadingCategories}
                  searchingRemote={isDropdownOpen ? searchingRemote : false}
                  currentCatAttrs={currentCatAttrs}
                  isDropdownOpen={isDropdownOpen}
                  onToggleDropdown={setOpenDropdownFor}
                  catSearchTerm={isDropdownOpen ? catSearchTerm : ''}
                  setCatSearchTerm={setCatSearchTerm}
                  sectorFilteredMarketCats={sectorFilteredMarketCats}
                  currentAvailableMarketCats={currentAvailableMarketCats}
                  selectedSector={selectedSector}
                  setSelectedSector={setSelectedSector}
                  activeMarketplace={activeMarketplace}
                  activeMarketplaceConfig={activeMarketplaceConfig}
                  categoryMarkup={activeMarkupsMap[localCat]}
                  defaultCommissionRate={activeDefaultCommission}
                  defaultFixedFee={activeDefaultFixedFee}
                  calculateSimulatedPrice={calculateSimulatedPrice}
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
        <div className="px-3 sm:px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 pb-safe">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-500">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {lang === 'tr'
                ? 'Eşleştirmeler kaydedildiğinde ürün senkronizasyonlarında otomatik olarak kullanılır.'
                : 'Saved mappings are automatically applied during product synchronization.'}
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0 justify-end">
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
              className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-bold text-xs shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer transition-all"
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
