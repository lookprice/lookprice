import React, { useState, useEffect } from "react";
import { Search, ChevronDown, CheckCircle2, Layers, Sparkles, SlidersHorizontal, Info, X } from "lucide-react";
import { getAttributesForCategory, MarketplaceAttribute } from "@/data/marketplaceCategoriesData";

interface MarketplaceProductFieldsProps {
  product: any;
  onUpdate: (data: any) => void;
  isTr: boolean;
  categories: any[];
  storeSettings?: any;
}

export const MarketplaceProductFields = ({ 
  product, 
  onUpdate, 
  isTr, 
  categories = [], 
  storeSettings 
}: MarketplaceProductFieldsProps) => {
  const getHbData = (prod: any) => {
    let mp = prod?.marketplace_data;
    if (typeof mp === "string") {
      try {
        mp = JSON.parse(mp);
      } catch (e) {
        mp = {};
      }
    }
    return mp?.hepsiburada || { categoryId: "", attributes: {} };
  };

  const [marketData, setMarketData] = useState(() => getHbData(product));
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAttributesEditor, setShowAttributesEditor] = useState(false);

  // Sync state if product changes
  useEffect(() => {
    const currentHb = getHbData(product);
    setMarketData(currentHb);
  }, [product?.id, JSON.stringify(product?.marketplace_data)]);

  // Check store-level category mapping (checks hierarchical sub-category first, then sub_category, then main category)
  const catKey = product?.category ? String(product.category).trim() : "";
  const subCatKey = product?.sub_category ? String(product.sub_category).trim() : "";
  const hierarchicalKey = catKey && subCatKey ? `${catKey} > ${subCatKey}` : "";
  
  const storeMappedCatId = 
    (hierarchicalKey && storeSettings?.categoryMappings?.[hierarchicalKey]) ||
    (subCatKey && storeSettings?.categoryMappings?.[subCatKey]) ||
    (catKey && storeSettings?.categoryMappings?.[catKey]) ||
    "";
  const effectiveCatId = marketData.categoryId || storeMappedCatId || "";

  const activeCategory = categories.find(
    (c) => String(c.id || c.categoryId) === String(effectiveCatId)
  );

  // Get relevant attributes for active category
  const categoryAttributes = activeCategory 
    ? getAttributesForCategory(activeCategory.name || activeCategory.displayName || "", activeCategory.paths || [])
    : [];

  const storeCategoryAttrs = storeSettings?.categoryAttributes?.[String(effectiveCatId)] || {};

  const filteredCategories = categories.filter((c) => {
    if (!searchTerm) return true;
    const name = (c.displayName || c.name || "").toLowerCase();
    const id = String(c.id || c.categoryId || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
  });

  const handleCategorySelect = (categoryId: string) => {
    const updated = { ...marketData, categoryId };
    setMarketData(updated);
    setShowCategoryDropdown(false);
    setSearchTerm("");
    onUpdate({
      ...product,
      marketplace_data: { ...(product.marketplace_data || {}), hepsiburada: updated }
    });
  };

  const handleClearOverride = () => {
    const updated = { ...marketData, categoryId: "" };
    setMarketData(updated);
    onUpdate({
      ...product,
      marketplace_data: { ...(product.marketplace_data || {}), hepsiburada: updated }
    });
  };

  const handleAttributeChange = (attrId: string, value: string) => {
    const currentAttrs = marketData.attributes || {};
    const updatedAttrs = { ...currentAttrs, [attrId]: value };
    const updated = { ...marketData, attributes: updatedAttrs };
    setMarketData(updated);
    onUpdate({
      ...product,
      marketplace_data: { ...(product.marketplace_data || {}), hepsiburada: updated }
    });
  };

  return (
    <div className="p-4 bg-rose-50/30 rounded-3xl border border-rose-200/80 space-y-3.5 mt-4">
      <input type="hidden" name="marketplace_data" value={JSON.stringify(marketData)} />
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-rose-600 text-white rounded-lg">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-black text-rose-950 uppercase tracking-wider">
            {isTr ? "Hepsiburada Katalog & Kategori Entegrasyonu" : "Hepsiburada Catalog & Category Integration"}
          </span>
        </div>

        {effectiveCatId ? (
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>{isTr ? "Kategori Hazır" : "Category Ready"}</span>
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            {isTr ? "Eşleştirme Bekliyor" : "Mapping Needed"}
          </span>
        )}
      </div>

      {/* STORE-LEVEL AUTOMATIC MAPPING BADGE */}
      {storeMappedCatId && !marketData.categoryId && (
        <div className="p-2.5 bg-white/90 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-[11px]">
                {isTr ? "Mağaza Ayarlarından Otomatik Eşlendi" : "Auto-Mapped from Store Settings"}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                {activeCategory?.displayName || activeCategory?.name || `Kategori #${storeMappedCatId}`} (#{storeMappedCatId})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="text-[10px] font-bold text-rose-600 hover:underline px-2 py-1 cursor-pointer shrink-0"
          >
            {isTr ? "Farklı Seç" : "Override"}
          </button>
        </div>
      )}

      {/* MANUAL OVERRIDE ACTIVE BADGE */}
      {marketData.categoryId && (
        <div className="p-2.5 bg-white/90 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-[9px] font-black uppercase text-rose-600 tracking-wider">
              {isTr ? "Bu Ürüne Özel Seçilen Kategori" : "Product-Specific Category"}
            </span>
            <p className="font-bold text-slate-900 text-xs">
              {activeCategory?.displayName || activeCategory?.name || `Kategori #${marketData.categoryId}`} (#{marketData.categoryId})
            </p>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              {isTr ? "Değiştir" : "Change"}
            </button>
            {storeMappedCatId && (
              <button
                type="button"
                onClick={handleClearOverride}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                title={isTr ? "Mağaza varsayılanına dön" : "Revert to default"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY SEARCH & SELECT (If dropdown opened or no category mapped yet) */}
      {(showCategoryDropdown || !effectiveCatId) && (
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] font-bold text-rose-800 uppercase">
            {isTr ? "Hepsiburada Kategorisi Seçin" : "Select Hepsiburada Category"}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={isTr ? "Kategori ara veya ID girin..." : "Search category or enter ID..."}
              className="w-full px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowCategoryDropdown(true);
              }}
              onFocus={() => setShowCategoryDropdown(true)}
            />
            <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-rose-400" />
          </div>

          {showCategoryDropdown && (
            <div className="max-h-48 overflow-y-auto bg-white border border-rose-200 rounded-xl shadow-xl space-y-1 p-1 z-20 relative">
              {filteredCategories.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  {isTr ? "Eşleşen kategori bulunamadı." : "No matching categories found."}
                </div>
              ) : (
                filteredCategories.slice(0, 30).map((cat) => {
                  const catId = String(cat.id || cat.categoryId);
                  const isSelected = String(effectiveCatId) === catId;
                  return (
                    <button
                      key={catId}
                      type="button"
                      className={`w-full text-left p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected ? "bg-rose-100 text-rose-900 font-bold" : "hover:bg-rose-50/70 text-slate-700"
                      }`}
                      onClick={() => handleCategorySelect(catId)}
                    >
                      <div>
                        <p className="font-bold">{cat.displayName || cat.name}</p>
                        {cat.paths && cat.paths.length > 0 && (
                          <p className="text-[10px] text-slate-400">{cat.paths.join(" > ")}</p>
                        )}
                      </div>
                      <span className="font-mono text-[10px] bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                        #{catId}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* CATEGORY ATTRIBUTES COLLAPSIBLE SECTION */}
      {effectiveCatId && categoryAttributes.length > 0 && (
        <div className="pt-2 border-t border-rose-100/80">
          <button
            type="button"
            onClick={() => setShowAttributesEditor(!showAttributesEditor)}
            className="w-full flex items-center justify-between text-xs font-bold text-rose-900 hover:text-rose-700 cursor-pointer py-1"
          >
            <div className="flex items-center space-x-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-rose-500" />
              <span>
                {isTr ? "Kategori Zorunlu Özellikleri & Nitelikler" : "Category Attributes & Specifications"}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-md">
                {categoryAttributes.length}
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAttributesEditor ? "rotate-180" : ""}`} />
          </button>

          {showAttributesEditor && (
            <div className="mt-2.5 p-3 bg-white rounded-2xl border border-rose-100 space-y-3">
              <p className="text-[10px] text-slate-500 font-medium">
                {isTr 
                  ? "Bu alanlar ürün Hepsiburada'ya aktarılırken otomatik olarak pakete dahil edilir." 
                  : "These attributes are automatically sent when listing products on Hepsiburada."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categoryAttributes.map((attr) => {
                  const inheritedStoreVal = storeCategoryAttrs[attr.id]?.value;
                  const currentProductVal = marketData.attributes?.[attr.id];

                  // Resolve dynamic variable mappings like $product.brand or fallbacks
                  const resolveDynamicValue = (valOrVar: string | undefined): string => {
                    if (!valOrVar) return "";
                    if (valOrVar === "$product.brand") return product?.brand || product?.brand_name || "";
                    if (valOrVar === "$product.name") return product?.name || "";
                    if (valOrVar === "$product.barcode") return product?.barcode || "";
                    if (valOrVar === "$product.model") return product?.model || "";
                    if (valOrVar === "$product.tax_rate" || valOrVar === "$product.kdv") return String(product?.tax_rate || 20);
                    return valOrVar;
                  };

                  let effectiveVal = currentProductVal !== undefined && currentProductVal !== "" ? currentProductVal : "";

                  if (!effectiveVal) {
                    if (inheritedStoreVal) {
                      effectiveVal = resolveDynamicValue(inheritedStoreVal);
                    }
                  }

                  // If still empty, check if this is Brand / Marka
                  const isBrandAttr = attr.id.toLowerCase() === "marka" || attr.id.toLowerCase().includes("brand");
                  if (!effectiveVal && isBrandAttr) {
                    effectiveVal = product?.brand || product?.brand_name || "";
                  }

                  // If still empty, check if this is Origin / Menşei (Default to 'Çin')
                  const isOriginAttr = attr.id.toLowerCase() === "mensei" || attr.id.toLowerCase().includes("origin");
                  if (!effectiveVal && isOriginAttr) {
                    effectiveVal = "Çin";
                  }

                  // If still empty and attribute has a default value defined
                  if (!effectiveVal && attr.defaultValue) {
                    effectiveVal = resolveDynamicValue(attr.defaultValue);
                  }

                  return (
                    <div key={attr.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <span>{attr.name}</span>
                          {isBrandAttr && product?.brand && (
                            <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 rounded font-normal">
                              ({isTr ? "Üründen Alındı" : "From Product"})
                            </span>
                          )}
                          {isOriginAttr && effectiveVal === "Çin" && (
                            <span className="text-[9px] text-amber-600 bg-amber-50 px-1 rounded font-normal">
                              ({isTr ? "Varsayılan: Çin" : "Default: China"})
                            </span>
                          )}
                        </span>
                        {attr.mandatory && <span className="text-rose-600 font-bold">*</span>}
                      </div>

                      {attr.values && attr.values.length > 0 ? (
                        <select
                          value={effectiveVal}
                          onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white"
                        >
                          <option value="">{isTr ? "-- Seçin --" : "-- Select --"}</option>
                          {attr.values.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={attr.type === "number" ? "number" : "text"}
                          placeholder={attr.defaultValue || attr.placeholder || (isTr ? "Değer girin..." : "Enter value...")}
                          value={effectiveVal}
                          onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
