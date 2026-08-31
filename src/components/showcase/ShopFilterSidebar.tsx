import React, { useState } from "react";
import { 
  Filter, 
  X, 
  Check, 
  RotateCcw, 
  ChevronDown, 
  ChevronRight,
  Sparkles, 
  SlidersHorizontal,
  Layers,
  FolderTree,
  Tag
} from "lucide-react";
import { Product } from "../../types";

export interface ShopFilterState {
  search: string;
  category: string | null;
  subCategory: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  selectedAttributes: Record<string, string>;
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  bestsellerOnly: boolean;
  sortBy: "default" | "priceAsc" | "priceDesc" | "newest";
}

interface ShopFilterSidebarProps {
  products: Product[];
  filterState: ShopFilterState;
  onFilterChange: (key: keyof ShopFilterState, value: any) => void;
  onResetFilters: () => void;
  lang: string;
  currency: string;
  isMobileDrawer?: boolean;
  onCloseMobile?: () => void;
}

export const ShopFilterSidebar: React.FC<ShopFilterSidebarProps> = ({
  products,
  filterState,
  onFilterChange,
  onResetFilters,
  lang,
  currency,
  isMobileDrawer = false,
  onCloseMobile
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryExpand = (catName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: prev[catName] !== undefined ? !prev[catName] : false // default open if clicked
    }));
  };

  // Helper to safely extract variants from product
  const getProductVariants = (p: Product): any[] => {
    if (!p || !p.variants) return [];
    if (typeof p.variants === "string") {
      try { return JSON.parse(p.variants); } catch (e) { return []; }
    }
    if (Array.isArray(p.variants)) return p.variants;
    return [];
  };

  // 1. Compute Category & Sub-Category Tree
  const categoryTree = React.useMemo(() => {
    const tree: { 
      name: string; 
      count: number; 
      subCategories: { name: string; count: number }[] 
    }[] = [];

    const catMap = new Map<string, { count: number; subMap: Map<string, number> }>();

    products.forEach((p) => {
      const cat = p.category || (lang === "tr" ? "Genel" : "General");
      if (!catMap.has(cat)) {
        catMap.set(cat, { count: 0, subMap: new Map() });
      }
      const catEntry = catMap.get(cat)!;
      catEntry.count += 1;

      const subCat = p.sub_category || p.sub_category_2;
      if (subCat && subCat.trim()) {
        const cleanSub = subCat.trim();
        catEntry.subMap.set(cleanSub, (catEntry.subMap.get(cleanSub) || 0) + 1);
      }
    });

    catMap.forEach((val, catName) => {
      const subCategories = Array.from(val.subMap.entries()).map(([subName, count]) => ({
        name: subName,
        count
      })).sort((a, b) => b.count - a.count);

      tree.push({
        name: catName,
        count: val.count,
        subCategories
      });
    });

    return tree.sort((a, b) => b.count - a.count);
  }, [products, lang]);

  // 2. Compute Brands
  const brandsWithCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) {
        const b = p.brand.trim();
        map.set(b, (map.get(b) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [products]);

  // Filter products matching current category/subcategory scope to calculate relevant variants
  const relevantProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (filterState.category && p.category !== filterState.category && p.category_2 !== filterState.category) {
        return false;
      }
      if (filterState.subCategory && p.sub_category !== filterState.subCategory && p.sub_category_2 !== filterState.subCategory) {
        return false;
      }
      return true;
    });
  }, [products, filterState.category, filterState.subCategory]);

  // 3. Compute Color Swatches from Variants
  const colorsMap = React.useMemo(() => {
    const map = new Map<string, { count: number; colorCode?: string }>();
    relevantProducts.forEach((p) => {
      const vars = getProductVariants(p);
      vars.forEach((v) => {
        const cName = v.color_name || (v.attributes ? (v.attributes['Renk'] || v.attributes['Color']) : undefined);
        if (cName && typeof cName === "string" && cName.trim()) {
          const cleanName = cName.trim();
          const current = map.get(cleanName) || { count: 0, colorCode: v.color_code };
          map.set(cleanName, { count: current.count + 1, colorCode: v.color_code || current.colorCode });
        }
      });
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [relevantProducts]);

  // 4. Compute Sizes / Bedens
  const sizesMap = React.useMemo(() => {
    const map = new Map<string, number>();
    relevantProducts.forEach((p) => {
      const vars = getProductVariants(p);
      vars.forEach((v) => {
        const sName = v.size || (v.attributes ? (v.attributes['Beden'] || v.attributes['Size'] || v.attributes['Numara'] || v.attributes['Kasa Çapı']) : undefined);
        if (sName && typeof sName === "string" && sName.trim()) {
          const cleanSize = sName.trim();
          map.set(cleanSize, (map.get(cleanSize) || 0) + 1);
        }
      });
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [relevantProducts]);

  // 5. Compute Dynamic Variant Attributes (e.g. "Hafıza", "Materyal", "Kalıp", "Desen", etc.)
  const dynamicAttributeFacets = React.useMemo(() => {
    const attrMap = new Map<string, Map<string, number>>();
    const standardKeys = new Set(['Renk', 'Color', 'Beden', 'Size', 'Numara', 'Kasa Çapı']);

    relevantProducts.forEach((p) => {
      const vars = getProductVariants(p);
      vars.forEach((v) => {
        if (v.attributes && typeof v.attributes === 'object') {
          Object.entries(v.attributes).forEach(([attrKey, attrVal]) => {
            if (!standardKeys.has(attrKey) && typeof attrVal === 'string' && attrVal.trim()) {
              const cleanKey = attrKey.trim();
              const cleanVal = attrVal.trim();
              if (!attrMap.has(cleanKey)) {
                attrMap.set(cleanKey, new Map());
              }
              const valMap = attrMap.get(cleanKey)!;
              valMap.set(cleanVal, (valMap.get(cleanVal) || 0) + 1);
            }
          });
        }
      });
    });

    const facets: { key: string; values: { name: string; count: number }[] }[] = [];
    attrMap.forEach((valMap, key) => {
      if (valMap.size > 1) { // Only show attribute facet if there is more than 1 option
        const values = Array.from(valMap.entries()).map(([name, count]) => ({ name, count }));
        facets.push({ key, values });
      }
    });

    return facets;
  }, [relevantProducts]);

  const hasActiveFilters = 
    filterState.category !== null ||
    filterState.subCategory !== null ||
    filterState.brand !== null ||
    filterState.color !== null ||
    filterState.size !== null ||
    (filterState.selectedAttributes && Object.keys(filterState.selectedAttributes).length > 0) ||
    filterState.minPrice !== "" ||
    filterState.maxPrice !== "" ||
    filterState.inStockOnly ||
    filterState.onSaleOnly ||
    filterState.bestsellerOnly;

  const handleToggleAttribute = (attrKey: string, attrVal: string) => {
    const current = filterState.selectedAttributes || {};
    if (current[attrKey] === attrVal) {
      const updated = { ...current };
      delete updated[attrKey];
      onFilterChange("selectedAttributes", updated);
    } else {
      onFilterChange("selectedAttributes", { ...current, [attrKey]: attrVal });
    }
  };

  return (
    <div className={`flex flex-col space-y-6 ${isMobileDrawer ? "p-6" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {lang === "tr" ? "Filtreler" : "Filters"}
          </h3>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{lang === "tr" ? "Temizle" : "Reset"}</span>
          </button>
        )}

        {isMobileDrawer && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Status Toggles */}
      <div className="space-y-2">
        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            {lang === "tr" ? "Sadece Stoktakiler" : "In Stock Only"}
          </span>
          <input
            type="checkbox"
            checked={filterState.inStockOnly}
            onChange={(e) => onFilterChange("inStockOnly", e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            {lang === "tr" ? "İndirimli Ürünler" : "On Sale"}
          </span>
          <input
            type="checkbox"
            checked={filterState.onSaleOnly}
            onChange={(e) => onFilterChange("onSaleOnly", e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            {lang === "tr" ? "Çok Satanlar" : "Top Sellers"}
          </span>
          <input
            type="checkbox"
            checked={filterState.bestsellerOnly}
            onChange={(e) => onFilterChange("bestsellerOnly", e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
        </label>
      </div>

      {/* 1. Categories & Subcategories Tree Accordion */}
      {categoryTree.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lang === "tr" ? "KATEGORİ & ALT KATEGORİLER" : "CATEGORIES & SUBCATEGORIES"}</span>
            </span>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                onFilterChange("category", null);
                onFilterChange("subCategory", null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterState.category === null && filterState.subCategory === null
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{lang === "tr" ? "Tüm Kategoriler" : "All Categories"}</span>
              <span className="text-[10px] opacity-75 font-mono">{products.length}</span>
            </button>

            {categoryTree.map((cat) => {
              const isSelected = filterState.category === cat.name;
              const isExpanded = expandedCategories[cat.name] !== undefined ? expandedCategories[cat.name] : isSelected;
              const hasSubs = cat.subCategories && cat.subCategories.length > 0;

              return (
                <div key={cat.name} className="space-y-1">
                  <div
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected && filterState.subCategory === null
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-black border border-indigo-200 dark:border-indigo-800"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      if (isSelected && filterState.subCategory === null) {
                        onFilterChange("category", null);
                        onFilterChange("subCategory", null);
                      } else {
                        onFilterChange("category", cat.name);
                        onFilterChange("subCategory", null);
                        setExpandedCategories(prev => ({ ...prev, [cat.name]: true }));
                      }
                    }}
                  >
                    <span className="truncate">{cat.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] opacity-75 font-mono">{cat.count}</span>
                      {hasSubs && (
                        <button
                          type="button"
                          onClick={(e) => toggleCategoryExpand(cat.name, e)}
                          className="p-0.5 rounded hover:bg-black/10 transition-colors"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-categories dropdown items */}
                  {hasSubs && isExpanded && (
                    <div className="pl-4 pr-1 space-y-1 border-l-2 border-indigo-200 dark:border-indigo-900 ml-3 my-1">
                      {cat.subCategories.map((sub) => {
                        const isSubSelected = isSelected && filterState.subCategory === sub.name;
                        return (
                          <button
                            key={sub.name}
                            type="button"
                            onClick={() => {
                              onFilterChange("category", cat.name);
                              onFilterChange("subCategory", isSubSelected ? null : sub.name);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                              isSubSelected
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black shadow-xs"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <span className="truncate flex items-center gap-1">
                              <span className="text-slate-400">•</span>
                              {sub.name}
                            </span>
                            <span className="text-[10px] opacity-75 font-mono">{sub.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Color Swatches from Variants */}
      {colorsMap.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
            {lang === "tr" ? "RENK SEÇENEKLERİ" : "COLOR OPTIONS"}
          </span>
          <div className="flex flex-wrap gap-2">
            {colorsMap.map((c) => {
              const isSelected = filterState.color === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onFilterChange("color", isSelected ? null : c.name)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20 dark:bg-indigo-950/50 dark:border-indigo-400 dark:text-indigo-200"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {c.colorCode ? (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0"
                      style={{ backgroundColor: c.colorCode }}
                    />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  )}
                  <span>{c.name}</span>
                  <span className="text-[10px] opacity-60 font-mono">({c.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Sizes / Bedens from Variants */}
      {sizesMap.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
            {lang === "tr" ? "BEDEN & NUMARA" : "SIZE & FIT"}
          </span>
          <div className="flex flex-wrap gap-2">
            {sizesMap.map((s) => {
              const isSelected = filterState.size === s.name;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => onFilterChange("size", isSelected ? null : s.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer min-w-[40px] text-center flex items-center justify-center gap-1 ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="text-[9px] opacity-60 font-normal font-mono">({s.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Dynamic Variant Attributes (Hafıza, Materyal, Kalıp, etc.) */}
      {dynamicAttributeFacets.map((facet) => (
        <div key={facet.key} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
            {facet.key.toUpperCase()}
          </span>
          <div className="flex flex-wrap gap-2">
            {facet.values.map((v) => {
              const isSelected = filterState.selectedAttributes?.[facet.key] === v.name;
              return (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => handleToggleAttribute(facet.key, v.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                  }`}
                >
                  <span>{v.name}</span>
                  <span className="text-[9px] opacity-60 font-mono">({v.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 5. Brands */}
      {brandsWithCounts.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
            {lang === "tr" ? "MARKALAR" : "BRANDS"}
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {brandsWithCounts.map((b) => {
              const isSelected = filterState.brand === b.name;
              return (
                <button
                  key={b.name}
                  type="button"
                  onClick={() => onFilterChange("brand", isSelected ? null : b.name)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{b.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">{b.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Price Range */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
          {lang === "tr" ? "FİYAT ARALIĞI" : "PRICE RANGE"}
        </span>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder={lang === "tr" ? "Min TL" : "Min Price"}
            value={filterState.minPrice}
            onChange={(e) => onFilterChange("minPrice", e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
          <input
            type="number"
            placeholder={lang === "tr" ? "Max TL" : "Max Price"}
            value={filterState.maxPrice}
            onChange={(e) => onFilterChange("maxPrice", e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};
