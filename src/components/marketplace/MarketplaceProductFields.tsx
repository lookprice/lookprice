import React, { useState, useEffect } from "react";
import { Search, ChevronDown, CheckCircle2, Layers, Sparkles, SlidersHorizontal, Info, X, Loader2, Zap, ExternalLink, Lock, Check } from "lucide-react";
import { getAttributesForCategory, MarketplaceAttribute } from "@/data/marketplaceCategoriesData";
import { autoHydrateTargetAttributes } from "@/services/crossMarketplaceAttributeMapper";
import { api } from "@/services/api";
import { getMarketplaceListingUrl, slugifyText } from "@/utils/marketplaceUrls";
import { getConnectedMarketplaces, ConnectedMarketplaces } from "@/utils/marketplaceEStores";

interface MarketplaceProductFieldsProps {
  product: any;
  onUpdate: (data: any) => void;
  isTr: boolean;
  categories: any[];
  storeSettings?: any;
  connectedMarketplaces?: ConnectedMarketplaces;
  branding?: any;
}

export const MarketplaceProductFields = ({ 
  product, 
  onUpdate, 
  isTr, 
  categories = [], 
  storeSettings,
  connectedMarketplaces,
  branding
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
    if (mp?.hepsiburada) {
      return {
        categoryId: String(mp.hepsiburada.categoryId || ""),
        attributes: mp.hepsiburada.attributes || {},
        hepsiburadaSku: mp.hepsiburada.hepsiburadaSku || mp.hepsiburada.hbSku || prod?.hepsiburada_sku || "",
        productUrl: mp.hepsiburada.productUrl || ""
      };
    }
    if (mp && (mp.categoryId !== undefined || mp.attributes !== undefined)) {
      return {
        categoryId: String(mp.categoryId || ""),
        attributes: mp.attributes || {},
        hepsiburadaSku: prod?.hepsiburada_sku || "",
        productUrl: ""
      };
    }
    return { categoryId: "", attributes: {}, hepsiburadaSku: prod?.hepsiburada_sku || "", productUrl: "" };
  };

  const getAmzData = (prod: any) => {
    let mp = prod?.marketplace_data;
    if (typeof mp === "string") {
      try { mp = JSON.parse(mp); } catch (e) { mp = {}; }
    }
    const amz = mp?.amazon || {};
    return {
      asin: prod?.amazon_asin || amz.asin || "",
      sku: prod?.amazon_sku || amz.sku || "",
      productUrl: amz.productUrl || (prod?.amazon_asin ? `https://www.amazon.com.tr/dp/${prod.amazon_asin}` : "")
    };
  };

  const [marketData, setMarketData] = useState(() => getHbData(product));
  const [amzData, setAmzData] = useState(() => getAmzData(product));
  const [hbSkuInput, setHbSkuInput] = useState(product?.hepsiburada_sku || marketData.hepsiburadaSku || "");
  const [amzAsinInput, setAmzAsinInput] = useState(product?.amazon_asin || amzData.asin || "");

  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAttributesEditor, setShowAttributesEditor] = useState(false);
  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingCategories, setSearchingCategories] = useState(false);

  // Sync state if product changes
  useEffect(() => {
    const currentHb = getHbData(product);
    const currentAmz = getAmzData(product);
    setMarketData(currentHb);
    setAmzData(currentAmz);
    setHbSkuInput(product?.hepsiburada_sku || currentHb.hepsiburadaSku || "");
    setAmzAsinInput(product?.amazon_asin || currentAmz.asin || "");
  }, [product?.id, product?.hepsiburada_sku, product?.amazon_asin, JSON.stringify(product?.marketplace_data)]);

  // Check store-level category mapping
  const catKey = product?.category ? String(product.category).trim() : "";
  const subCatKey = product?.sub_category ? String(product.sub_category).trim() : "";
  const hierarchicalKey = catKey && subCatKey ? `${catKey} > ${subCatKey}` : "";
  
  const storeMappedCatId = 
    (hierarchicalKey && storeSettings?.categoryMappings?.[hierarchicalKey]) ||
    (subCatKey && storeSettings?.categoryMappings?.[subCatKey]) ||
    (catKey && storeSettings?.categoryMappings?.[catKey]) ||
    "";

  // If user has explicitly selected a category (marketData.categoryId), respect it 100%!
  const prodSearchStr = `${product?.name || ''} ${catKey} ${subCatKey}`.toLowerCase();
  let resolvedCatId = marketData.categoryId ? String(marketData.categoryId) : (storeMappedCatId ? String(storeMappedCatId) : "");
  
  if (!marketData.categoryId && !storeMappedCatId) {
    if (prodSearchStr.includes("usb") && (prodSearchStr.includes("bellek") || prodSearchStr.includes("flash"))) {
      resolvedCatId = "970";
    } else if (prodSearchStr.includes("kart okuyucu")) {
      resolvedCatId = "698";
    } else if (prodSearchStr.includes("sd kart")) {
      resolvedCatId = "1100011";
    }
  }

  const effectiveCatId = resolvedCatId;

  let activeCategory = [...searchResults, ...categories].find(
    (c) => String(c.id || c.categoryId) === String(effectiveCatId)
  );

  if (!activeCategory && effectiveCatId === "970") {
    activeCategory = {
      id: 970,
      name: "USB Flash Bellekler",
      displayName: "Bilgisayar > Veri Depolama > Usb Bellek",
      paths: ["Bilgisayar", "Veri Depolama", "Usb Bellek"],
      leaf: true,
      available: true
    };
  }

  // Load Dynamic Category Attributes from API whenever effectiveCatId changes
  useEffect(() => {
    if (!effectiveCatId) {
      setDynamicAttributes([]);
      return;
    }

    setLoadingAttributes(true);
    const storeId = storeSettings?.id || product?.store_id;

    api.getHepsiburadaCategoryAttributes(effectiveCatId, storeId)
      .then((res: any) => {
        const attrs = res.data?.attributes || res.attributes || [];
        if (Array.isArray(attrs) && attrs.length > 0) {
          setDynamicAttributes(attrs);
        } else {
          const fallback = activeCategory 
            ? getAttributesForCategory(activeCategory.name || activeCategory.displayName || "", activeCategory.paths || [], effectiveCatId)
            : [];
          setDynamicAttributes(fallback);
        }
      })
      .catch((err) => {
        console.warn("Dynamic HB Attributes Fetch Error:", err);
        const fallback = activeCategory 
          ? getAttributesForCategory(activeCategory.name || activeCategory.displayName || "", activeCategory.paths || [], effectiveCatId)
          : [];
        setDynamicAttributes(fallback);
      })
      .finally(() => setLoadingAttributes(false));
  }, [effectiveCatId, activeCategory?.name]);

  // Live Category Search Handler with debounce
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearchingCategories(true);
      const storeId = storeSettings?.id || product?.store_id;
      
      api.get(`/api/integrations/hepsiburada/categories/search?q=${encodeURIComponent(searchTerm)}${storeId ? `&storeId=${storeId}` : ''}`)
        .then((res: any) => {
          const list = res.data?.categories || res.categories || [];
          if (Array.isArray(list)) {
            setSearchResults(list);
          }
        })
        .catch(() => {})
        .finally(() => setSearchingCategories(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const categoryAttributes = dynamicAttributes.length > 0 
    ? dynamicAttributes 
    : (activeCategory ? getAttributesForCategory(activeCategory.name || activeCategory.displayName || "", activeCategory.paths || []) : []);

  const storeCategoryAttrs = storeSettings?.categoryAttributes?.[String(effectiveCatId)] || {};

  const displayCategories = searchResults.length > 0 
    ? searchResults 
    : categories.filter((c) => {
        if (!searchTerm) return true;
        const name = (c.displayName || c.name || "").toLowerCase();
        const id = String(c.id || c.categoryId || "").toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
      });

  const getFullMarketplacePayload = (hbSlice: any, amzSlice?: any) => {
    let existingMp = product?.marketplace_data;
    if (typeof existingMp === 'string') {
      try { existingMp = JSON.parse(existingMp); } catch { existingMp = {}; }
    }
    existingMp = (typeof existingMp === 'object' && existingMp !== null) ? existingMp : {};
    return {
      ...existingMp,
      hepsiburada: {
        ...(existingMp.hepsiburada || {}),
        ...hbSlice
      },
      amazon: {
        ...(existingMp.amazon || {}),
        ...(amzSlice || amzData)
      }
    };
  };

  const handleCategorySelect = (categoryId: string) => {
    const updated = { ...marketData, categoryId };
    setMarketData(updated);
    setShowCategoryDropdown(false);
    setSearchTerm("");
    const fullMp = getFullMarketplacePayload(updated);
    onUpdate({
      ...product,
      marketplace_data: fullMp
    });
  };

  const handleClearOverride = () => {
    const updated = { ...marketData, categoryId: "" };
    setMarketData(updated);
    const fullMp = getFullMarketplacePayload(updated);
    onUpdate({
      ...product,
      marketplace_data: fullMp
    });
  };

  const handleAttributeChange = (attrId: string, value: string) => {
    const currentAttrs = marketData.attributes || {};
    const updatedAttrs = { ...currentAttrs, [attrId]: value };
    const updated = { ...marketData, attributes: updatedAttrs };
    setMarketData(updated);
    const fullMp = getFullMarketplacePayload(updated);
    onUpdate({
      ...product,
      marketplace_data: fullMp
    });
  };

  // Helper parser for Hepsiburada SKU / URL input
  const handleHbSkuChange = (val: string) => {
    setHbSkuInput(val);
    const raw = String(val || "").trim();
    if (!raw) {
      const updated = { ...marketData, hepsiburadaSku: "", productId: "", productUrl: "" };
      setMarketData(updated);
      const fullMp = getFullMarketplacePayload(updated, amzData);
      onUpdate({
        ...product,
        hepsiburada_sku: "",
        hepsiburada_url: "",
        is_hepsiburada_active: false,
        marketplace_data: fullMp
      });
      return;
    }

    let extractedSku = raw;
    let directUrl = "";

    // If pasted a full URL
    if (raw.startsWith("http") || raw.includes("hepsiburada.com")) {
      directUrl = raw.startsWith("http") ? raw : `https://${raw}`;
      const pmMatch = raw.match(/-pm-([A-Za-z0-9]+)/i);
      const pMatch = raw.match(/-p-([A-Za-z0-9]+)/i);
      const hbcvMatch = raw.match(/HBCV[0-9A-Z]+/i);
      const hbcMatch = raw.match(/HBC[0-9A-Z]+/i);
      const bsMatch = raw.match(/BS[0-9A-Z]+/i);

      if (pmMatch) {
        extractedSku = pmMatch[1].toUpperCase();
      } else if (pMatch) {
        extractedSku = pMatch[1].toUpperCase();
      } else if (hbcvMatch) {
        extractedSku = hbcvMatch[0].toUpperCase();
      } else if (hbcMatch) {
        extractedSku = hbcMatch[0].toUpperCase();
      } else if (bsMatch) {
        extractedSku = bsMatch[0].toUpperCase();
      }
    } else {
      // User entered SKU directly (e.g. HBC0000J8TRQM or HBCV00008VOOO3)
      const hbcvMatch = raw.match(/HBCV[0-9A-Z]+/i);
      const hbcMatch = raw.match(/HBC[0-9A-Z]+/i);
      const bsMatch = raw.match(/BS[0-9A-Z]+/i);

      if (hbcvMatch) {
        extractedSku = hbcvMatch[0].toUpperCase();
      } else if (hbcMatch) {
        extractedSku = hbcMatch[0].toUpperCase();
      } else if (bsMatch) {
        extractedSku = bsMatch[0].toUpperCase();
      } else {
        extractedSku = raw.trim().toUpperCase();
      }
    }

    const prodSlug = slugifyText(product?.name || "urun");
    const sellerParam = "?magaza=Enrakipsiz";

    if (!directUrl && extractedSku) {
      if (extractedSku.startsWith("HBCV") || extractedSku.startsWith("HBV")) {
        directUrl = `https://www.hepsiburada.com/${prodSlug}-p-${extractedSku}${sellerParam}`;
      } else {
        directUrl = `https://www.hepsiburada.com/${prodSlug}-pm-${extractedSku}${sellerParam}`;
      }
    } else if (directUrl && !directUrl.includes("magaza=")) {
      directUrl = directUrl.includes("?") ? `${directUrl}&magaza=Enrakipsiz` : `${directUrl}${sellerParam}`;
    }

    const updated = {
      ...marketData,
      hepsiburadaSku: extractedSku,
      productId: extractedSku.startsWith("HBCV") ? (marketData.productId || extractedSku) : extractedSku,
      productUrl: directUrl,
      status: 'ACTIVE',
      isSalable: true,
      lastSync: new Date().toISOString()
    };
    setMarketData(updated);
    const fullMp = getFullMarketplacePayload(updated, amzData);
    onUpdate({
      ...product,
      hepsiburada_sku: extractedSku,
      hepsiburada_url: directUrl,
      is_hepsiburada_active: true,
      marketplace_data: fullMp
    });
  };

  // Helper parser for Amazon ASIN / URL input
  const handleAmzAsinChange = (val: string) => {
    setAmzAsinInput(val);
    const raw = String(val || "").trim();
    if (!raw) {
      const updatedAmz = { ...amzData, asin: "", productUrl: "" };
      setAmzData(updatedAmz);
      const fullMp = getFullMarketplacePayload(marketData, updatedAmz);
      onUpdate({
        ...product,
        amazon_asin: "",
        is_amazon_active: false,
        marketplace_data: fullMp
      });
      return;
    }

    let extractedAsin = raw;
    let directUrl = "";

    if (raw.startsWith("http")) {
      directUrl = raw;
      const asinMatch = raw.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
      if (asinMatch) {
        extractedAsin = asinMatch[1].toUpperCase();
      }
    } else {
      const asinMatch = raw.match(/[A-Z0-9]{10}/i);
      if (asinMatch) {
        extractedAsin = asinMatch[0].toUpperCase();
      }
    }

    if (!directUrl && extractedAsin) {
      directUrl = `https://www.amazon.com.tr/dp/${extractedAsin}`;
    }

    const updatedAmz = {
      ...amzData,
      asin: extractedAsin,
      sku: amzData.sku || product?.sku || product?.barcode || extractedAsin,
      productUrl: directUrl,
      status: 'ACTIVE',
      lastSync: new Date().toISOString()
    };
    setAmzData(updatedAmz);
    const fullMp = getFullMarketplacePayload(marketData, updatedAmz);
    onUpdate({
      ...product,
      amazon_asin: extractedAsin,
      amazon_sku: updatedAmz.sku,
      amazon_url: directUrl,
      is_amazon_active: true,
      marketplace_data: fullMp
    });
  };

  const fullMarketplaceJson = JSON.stringify(getFullMarketplacePayload(marketData, amzData));

  // Determine if a category is leaf (alt yaprak)
  const isLeafCategory = (cat: any) => {
    if (!cat) return false;
    if (cat.leaf === true || cat.isLeaf === true) return true;
    if (cat.available === true) return true;
    if (cat.paths && cat.paths.length >= 3) return true;
    return false;
  };

  const hbLiveUrl = getMarketplaceListingUrl('hepsiburada', {
    ...product,
    name: product?.name,
    barcode: product?.barcode,
    hepsiburada_sku: hbSkuInput || product?.hepsiburada_sku || marketData.hepsiburadaSku,
    hepsiburada_url: marketData.productUrl || product?.hepsiburada_url,
    marketplace_data: getFullMarketplacePayload(marketData, amzData)
  });

  const amzLiveUrl = getMarketplaceListingUrl('amazon', {
    ...product,
    name: product?.name,
    barcode: product?.barcode,
    amazon_asin: amzAsinInput || product?.amazon_asin || amzData.asin,
    amazon_url: amzData.productUrl || product?.amazon_url,
    marketplace_data: getFullMarketplacePayload(marketData, amzData)
  });

  const activeConnections = connectedMarketplaces || getConnectedMarketplaces(branding || { hepsiburada_settings: storeSettings });
  const showHbSection = activeConnections.hepsiburada;
  const showAmzSection = activeConnections.amazon;

  return (
    <div className="space-y-3 mt-3">
      {/* Hidden inputs for form synchronization */}
      <input type="hidden" name="marketplace_data" value={fullMarketplaceJson} />
      <input type="hidden" name="hepsiburada_url" value={product?.hepsiburada_url || marketData.productUrl || ""} />
      <input type="hidden" name="hepsiburada_sku" value={product?.hepsiburada_sku || marketData.hepsiburadaSku || ""} />
      <input type="hidden" name="is_hepsiburada_active" value={String(Boolean(product?.is_hepsiburada_active || product?.hepsiburada_sku || marketData.hepsiburadaSku || product?.hepsiburada_url || marketData.productUrl))} />
      <input type="hidden" name="amazon_url" value={product?.amazon_url || amzData.productUrl || ""} />
      <input type="hidden" name="amazon_asin" value={product?.amazon_asin || amzData.asin || ""} />
      <input type="hidden" name="amazon_sku" value={product?.amazon_sku || amzData.sku || ""} />
      <input type="hidden" name="is_amazon_active" value={String(Boolean(product?.is_amazon_active || product?.amazon_asin || amzData.asin))} />

      {/* 1. HEPSIBURADA INTEGRATION SECTION */}
      {showHbSection && (
        <div className="p-3.5 bg-orange-50/40 dark:bg-orange-950/20 rounded-2xl border border-orange-200/90 dark:border-orange-900/50 space-y-3">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-orange-200/60 pb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-orange-600 text-white rounded-lg shadow-2xs">
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-black text-orange-950 dark:text-orange-200 uppercase tracking-wider block">
                {isTr ? "Hepsiburada Entegrasyonu & Kart Kilitleme" : "Hepsiburada Integration & Card Lock"}
              </span>
            </div>
          </div>

          {(product?.hepsiburada_sku || marketData.hepsiburadaSku) ? (
            <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Lock className="h-3 w-3 text-emerald-600" />
              <span>{product?.hepsiburada_sku || marketData.hepsiburadaSku}</span>
            </span>
          ) : effectiveCatId ? (
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

        {/* DIRECT HB SKU / URL MANUAL ENTRY (SPECIFIC CARD LOCK) */}
        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-800 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-orange-600" />
              <span>{isTr ? "Hepsiburada SKU veya İlan Linki (Spesifik Karta Kilitle)" : "HB SKU or Direct Listing URL"}</span>
            </label>
            {hbLiveUrl && (
              <a
                href={hbLiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-orange-600 hover:text-orange-800 dark:text-orange-400 flex items-center gap-1 hover:underline"
              >
                <span>{isTr ? "İlanı Aç" : "Open Listing"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder={isTr ? "örn: HBCV00008VOOO3 veya https://www.hepsiburada.com/...-p-HBCV..." : "e.g. HBCV00008VOOO3 or product URL"}
              value={hbSkuInput}
              onChange={(e) => handleHbSkuChange(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:bg-white focus:border-orange-500 outline-none"
            />
            {hbSkuInput && (
              <button
                type="button"
                onClick={() => handleHbSkuChange("")}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title={isTr ? "Eşleştirmeyi Temizle" : "Clear"}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[9px] text-slate-500 dark:text-slate-400">
            {isTr 
              ? "Hepsiburada'da aynı barkodda birden fazla kart varsa, hedeflediğiniz ürünün HBCV kodunu veya linkini yapıştırarak ürünü doğrudan o karta kilitleyebilirsiniz."
              : "Paste the exact HBCV code or listing URL to lock this product to a specific Hepsiburada catalog item."}
          </p>
        </div>

        {/* STORE-LEVEL AUTOMATIC MAPPING BADGE */}
        {storeMappedCatId && !marketData.categoryId && (
          <div className="p-2 bg-white/90 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                  {isTr ? "Mağaza Ayarlarından Otomatik Eşlendi" : "Auto-Mapped from Store Settings"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {activeCategory?.displayName || activeCategory?.name || `Kategori #${storeMappedCatId}`} (#{storeMappedCatId})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="text-[10px] font-bold text-orange-600 hover:underline px-2 py-1 cursor-pointer shrink-0"
            >
              {isTr ? "Farklı Seç" : "Override"}
            </button>
          </div>
        )}

        {/* MANUAL OVERRIDE ACTIVE BADGE */}
        {marketData.categoryId && (
          <div className="p-2 bg-white/90 dark:bg-slate-900 border border-orange-200 dark:border-orange-800 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[9px] font-black uppercase text-orange-600 tracking-wider">
                {isTr ? "Bu Ürüne Özel Seçilen Kategori" : "Product-Specific Category"}
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                {activeCategory?.displayName || activeCategory?.name || `Kategori #${marketData.categoryId}`} (#{marketData.categoryId})
              </p>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                {isTr ? "Değiştir" : "Change"}
              </button>
              {storeMappedCatId && (
                <button
                  type="button"
                  onClick={handleClearOverride}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-800 p-1 cursor-pointer"
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
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-orange-950 dark:text-orange-200 uppercase">
                {isTr ? "Hepsiburada Alt (Yaprak) Kategorisi Seçin" : "Select Hepsiburada Leaf Category"}
              </label>
              <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-bold">
                🌿 {isTr ? "Yalnızca Yaprak Kategoriye Ürün Açılabilir" : "Leaf Category Required"}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder={isTr ? "Kategori adı ara veya ID girin..." : "Search category name or enter ID..."}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
              />
              <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-orange-400" />
            </div>

            {showCategoryDropdown && (
              <div className="max-h-56 overflow-y-auto bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-800 rounded-xl shadow-xl space-y-1 p-1 z-20 relative">
                {searchingCategories ? (
                  <div className="p-3 text-center text-xs text-orange-600 font-medium flex items-center justify-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                    <span>{isTr ? "Kategoriler taranıyor..." : "Searching categories..."}</span>
                  </div>
                ) : displayCategories.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    {isTr ? "Eşleşen kategori bulunamadı." : "No matching categories found."}
                  </div>
                ) : (
                  displayCategories.slice(0, 40).map((cat) => {
                    const catId = String(cat.id || cat.categoryId);
                    const isSelected = String(effectiveCatId) === catId;
                    const leaf = isLeafCategory(cat);

                    return (
                      <button
                        key={catId}
                        type="button"
                        className={`w-full text-left p-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? "bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-100 font-bold" 
                            : "hover:bg-orange-50/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                        }`}
                        onClick={() => handleCategorySelect(catId)}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold truncate">{cat.displayName || cat.name}</p>
                            {leaf ? (
                              <span className="text-[9px] font-black px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded border border-emerald-300">
                                🌿 {isTr ? "Yaprak" : "Leaf"}
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium px-1.5 py-0.2 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 rounded border border-amber-200">
                                ⚠️ {isTr ? "Üst Kategori" : "Parent"}
                              </span>
                            )}
                          </div>
                          {cat.paths && cat.paths.length > 0 && (
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{cat.paths.join(" > ")}</p>
                          )}
                        </div>
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shrink-0">
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
          <div className="pt-2 border-t border-orange-200/60">
            <button
              type="button"
              onClick={() => setShowAttributesEditor(!showAttributesEditor)}
              className="w-full flex items-center justify-between text-xs font-bold text-orange-950 dark:text-orange-200 hover:text-orange-700 cursor-pointer py-1"
            >
              <div className="flex items-center space-x-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-orange-600" />
                <span>
                  {isTr ? "Kategori Zorunlu Alanları & Nitelikler" : "Category Required Attributes"}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 rounded-md flex items-center gap-1">
                  {loadingAttributes ? <Loader2 className="h-3 w-3 animate-spin text-orange-600" /> : categoryAttributes.length}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showAttributesEditor ? "rotate-180" : ""}`} />
            </button>

            {showAttributesEditor && (
              <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-800 space-y-2.5">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {isTr 
                    ? "Kırmızı yıldızlı (*) alanlar Hepsiburada kataloğunda zorunludur ve aktarımda otomatik pakete dahil edilir." 
                    : "Fields marked with (*) are required by Hepsiburada."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(() => {
                    const { hydratedAttributes, autoFilledFields } = autoHydrateTargetAttributes(
                      "hepsiburada",
                      categoryAttributes,
                      marketData.attributes || {},
                      product
                    );

                    return categoryAttributes.map((attr) => {
                      const inheritedStoreVal = storeCategoryAttrs[attr.id]?.value;
                      const currentProductVal = marketData.attributes?.[attr.id];
                      const autoSource = autoFilledFields[attr.id];

                      const resolveDynamicValue = (valOrVar: string | undefined): string => {
                        if (!valOrVar) return "";
                        if (valOrVar === "$product.brand") return product?.brand || product?.brand_name || "";
                        if (valOrVar === "$product.name") return product?.name || "";
                        if (valOrVar === "$product.barcode") return product?.barcode || "";
                        if (valOrVar === "$product.model") return product?.model || "";
                        if (valOrVar === "$product.tax_rate" || valOrVar === "$product.kdv") return String(product?.tax_rate || 20);
                        return valOrVar;
                      };

                      let effectiveVal = currentProductVal !== undefined && currentProductVal !== "" 
                        ? currentProductVal 
                        : (hydratedAttributes[attr.id] || "");

                      if (!effectiveVal && inheritedStoreVal) {
                        effectiveVal = resolveDynamicValue(inheritedStoreVal);
                      }

                      const prodName = String(product?.name || "").trim();

                      // Brand fallback
                      const isBrandAttr = attr.id.toLowerCase() === "marka" || attr.id.toLowerCase().includes("brand");
                      if (!effectiveVal && isBrandAttr) {
                        effectiveVal = product?.brand || product?.brand_name || "";
                        if (!effectiveVal && prodName) {
                          const knownBrands = ["Kingston", "SanDisk", "Samsung", "Toshiba", "Kioxia", "Philips", "Hikvision", "Lexar", "Sony", "Adata", "Western Digital", "WD", "Seagate", "Apple", "Xiaomi", "Logitech", "HP", "Lenovo", "Asus", "Dell", "TP-Link", "Baseus", "Anker", "Ugreen", "Digitus", "Targus", "Bory", "SBS"];
                          const foundBrand = knownBrands.find(b => new RegExp(`\\b${b}\\b`, 'i').test(prodName));
                          if (foundBrand) {
                            effectiveVal = foundBrand;
                          } else {
                            const firstWord = prodName.split(" ")[0];
                            if (firstWord && firstWord.length > 2) effectiveVal = firstWord;
                          }
                        }
                      }

                      if (!effectiveVal && attr.defaultValue) {
                        effectiveVal = resolveDynamicValue(attr.defaultValue);
                      }

                      return (
                        <div key={attr.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 flex-wrap">
                              <span>{attr.name}</span>
                              {autoSource && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                                  <Zap className="h-2.5 w-2.5 text-emerald-600" />
                                  <span>{autoSource}</span>
                                </span>
                              )}
                              {isBrandAttr && product?.brand && !autoSource && (
                                <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 rounded font-normal">
                                  ({isTr ? "Üründen" : "From Prod"})
                                </span>
                              )}
                            </span>
                            {attr.mandatory && <span className="text-rose-600 font-black">*</span>}
                          </div>

                          {attr.values && attr.values.length > 0 ? (
                            <select
                              value={effectiveVal}
                              onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white outline-none"
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
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:bg-white outline-none"
                            />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* 2. AMAZON TR INTEGRATION SECTION */}
      {showAmzSection && (
        <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200/90 dark:border-amber-900/50 space-y-2.5">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-600 text-white rounded-lg shadow-2xs">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider block">
                  {isTr ? "Amazon TR Entegrasyonu & ASIN Kilitleme" : "Amazon TR Integration & ASIN Lock"}
                </span>
              </div>
            </div>

            {(product?.amazon_asin || amzData.asin) ? (
              <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Lock className="h-3 w-3 text-emerald-600" />
                <span>ASIN: {product?.amazon_asin || amzData.asin}</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {isTr ? "ASIN Bekliyor" : "No ASIN"}
              </span>
            )}
          </div>

          <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>{isTr ? "Amazon ASIN veya İlan Linki" : "Amazon ASIN or Direct URL"}</span>
              </label>
              {amzLiveUrl && (
                <a
                  href={amzLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-amber-600 hover:text-amber-800 dark:text-amber-400 flex items-center gap-1 hover:underline"
                >
                  <span>{isTr ? "Amazon İlanını Aç" : "Open Amazon"}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder={isTr ? "örn: B07QJ32SJR veya https://www.amazon.com.tr/dp/B07QJ32SJR" : "e.g. B07QJ32SJR or Amazon URL"}
                value={amzAsinInput}
                onChange={(e) => handleAmzAsinChange(e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:bg-white focus:border-amber-500 outline-none"
              />
              {amzAsinInput && (
                <button
                  type="button"
                  onClick={() => handleAmzAsinChange("")}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title={isTr ? "ASIN Temizle" : "Clear"}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[9px] text-slate-500 dark:text-slate-400">
              {isTr 
                ? "Amazon TR'de aktif olan ürünün ASIN kodunu veya linkini buraya yapıştırarak ürünü doğrudan canlı Amazon ilanına bağlayabilirsiniz."
                : "Paste the Amazon ASIN or direct URL to connect this product directly to the Amazon listing."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceProductFields;
