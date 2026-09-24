import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { X, Plus, Trash2, Search, Flame, Sparkles, Camera, Upload, Palette, History, BookOpen, Check, Star, Award, Crown, Clock, Tag, Loader2 } from "lucide-react";
import { MultiImageUploader } from "../../../components/MultiImageUploader";
import { api } from "../../../services/api";
import { compressImageToWebP } from "../../../utils/imageUtils";
import { VariantMatrixManager } from "../../../components/dashboard/VariantMatrixManager";
import { MarketplaceProductFields } from "../../../components/marketplace/MarketplaceProductFields";
import ProductMovementModal from "../../../components/ProductMovementModal";
import { BookstoreSectorSpecs } from "../../../components/bookstore/BookstoreSectorSpecs";
import { getConnectedMarketplaces } from "../../../utils/marketplaceEStores";
import { resolveDomainId } from "../../../utils/sectorCapability";
import { BOOKSTORE_CATEGORIES } from "../../../data/bookstoreCategories";
import { BOOKSTORE_BADGES, extractProductLabels } from "../../../data/bookstoreBadges";

interface ProductModalProps {
  showProductModal: boolean;
  setShowProductModal: (show: boolean) => void;
  editingProduct: any;
  setEditingProduct: (p: any) => void;
  handleAddProduct?: (e: React.FormEvent) => void;
  isTr: boolean;
  lang: string;
  branding: any;
  translations: any;
  products?: any[];
}

export const ProductModal = ({
  showProductModal,
  setShowProductModal,
  editingProduct,
  setEditingProduct,
  handleAddProduct,
  isTr,
  lang,
  branding,
  translations: t,
  products = [],
}: ProductModalProps) => {
  const [productImageUrl, setProductImageUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedCategory2, setSelectedCategory2] = useState("");
  const [selectedSubCategory2, setSelectedSubCategory2] = useState("");
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [isNewSubCategoryMode, setIsNewSubCategoryMode] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [hbCategories, setHbCategories] = useState<any[]>([]);
  const [loadingHbCategories, setLoadingHbCategories] = useState(false);
  
  const [activeVariantIngredientSelector, setActiveVariantIngredientSelector] = useState<string | null>(null);
  const [variantIngredientSearch, setVariantIngredientSearch] = useState("");
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);

  // HoReCaLP Allergen and Nutrition States
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [calories, setCalories] = useState<number | string>("");
  const [prepTimeMin, setPrepTimeMin] = useState<number | string>("");
  const [portionSize, setPortionSize] = useState<string>("");

  // Bookstore Curated Badges State
  const [selectedBookBadges, setSelectedBookBadges] = useState<string[]>([]);

  // ShopLP Retail Variant Matrix States
  const [variantBarcodeMode, setVariantBarcodeMode] = useState<'individual' | 'shared'>('individual');
  const [showMatrixGenerator, setShowMatrixGenerator] = useState(false);
  const [matrixColors, setMatrixColors] = useState("");
  const [matrixSizes, setMatrixSizes] = useState("");
  const [showMovementModal, setShowMovementModal] = useState(false);

  const domainId = resolveDomainId(branding);
  const isCafeRestaurant = domainId === 'HORECA' || domainId === 'HOTEL';
  const isPortfolio = domainId === 'REAL_ESTATE' || domainId === 'AUTOMOTIVE';
  const isBookstore = domainId === 'BOOKSTORE';
  const isShopLp = domainId === 'RETAIL' || domainId === 'BOOKSTORE';
  const connectedMarketplaces = useMemo(() => getConnectedMarketplaces(branding), [branding]);
  const isMarketplaceEnabled = isShopLp;

  useEffect(() => {
    if (showProductModal && isMarketplaceEnabled) {
      setLoadingHbCategories(true);
      api.getHepsiburadaCategories(branding?.id || branding?.store_id)
        .then(res => {
          if (res.data?.categories) setHbCategories(res.data.categories);
          else if (Array.isArray(res.categories)) setHbCategories(res.categories);
        })
        .catch(err => console.error("HB Cat Fetch Error:", err))
        .finally(() => setLoadingHbCategories(false));
    }
  }, [showProductModal, isMarketplaceEnabled]);

  const handleVariantImageUpload = async (vIdx: number, file: File) => {
    try {
      const compressed = await compressImageToWebP(file);
      const formData = new FormData();
      formData.append('file', compressed);
      const res = await api.uploadFile(formData);
      if (res && res.url) {
        setVariants((prev) => {
          const next = [...prev];
          next[vIdx] = { ...next[vIdx], image_url: res.url };
          return next;
        });
      } else if (res && res.error) {
        alert(isTr ? `Görsel yükleme hatası: ${res.error}` : `Image upload error: ${res.error}`);
      }
    } catch (err) {
      console.error("Variant image upload error:", err);
    }
  };

  const [isPublishingToHb, setIsPublishingToHb] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleAutoLookup = async () => {
    // Find barcode input from modal form
    const barcodeInput = document.querySelector('form input[name="barcode"]') as HTMLInputElement || 
                         document.querySelector('input[name="barcode"]') as HTMLInputElement;
    const barcodeVal = barcodeInput?.value?.trim();
    if (!barcodeVal || barcodeVal.length < 5) {
      alert(isTr ? "Lütfen önce geçerli bir ISBN / barkod giriniz (örn: 9789752128262)!" : "Please enter a valid ISBN/barcode first!");
      return;
    }
    try {
      setLookupLoading(true);
      const res = await api.lookupBarcode(barcodeVal, branding?.id || branding?.store_id);
      const dataObj = res?.data || res;
      if (dataObj && (dataObj.success || dataObj.data || dataObj.name)) {
        const d = dataObj.data || dataObj;
        
        const setValAndTrigger = (selector: string, val?: string) => {
          if (!val) return;
          const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
          if (el) {
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        };

        setValAndTrigger('form input[name="name"]', d.name);
        setValAndTrigger('form input[name="author"]', d.author);
        setValAndTrigger('form input[name="brand"]', d.publisher || d.brand);
        setValAndTrigger('form input[name="category"]', d.category);
        setValAndTrigger('form input[name="sub_category"]', d.sub_category);
        setValAndTrigger('form textarea[name="description"]', d.description);
        setValAndTrigger('form input[name="image_url"]', d.image_url);

        if (d.image_url) {
          setProductImageUrl(d.image_url);
        }

        if (editingProduct) {
          setEditingProduct((prev: any) => ({
            ...prev,
            name: d.name || prev?.name,
            author: d.author || prev?.author,
            brand: d.publisher || d.brand || prev?.brand,
            category: d.category || prev?.category,
            sub_category: d.sub_category || prev?.sub_category,
            description: d.description || prev?.description,
            image_url: d.image_url || prev?.image_url
          }));
        }

        alert(isTr 
          ? `Kitap bilgileri ve kapak görseli başarıyla getirildi:\n\n• Eser: ${d.name}\n• Yazar: ${d.author || 'Belirtilmemiş'}\n• Yayıncı: ${d.publisher || d.brand || 'Belirtilmemiş'}` 
          : `Book details retrieved successfully!\n\n• Title: ${d.name}\n• Author: ${d.author || 'Not specified'}\n• Publisher: ${d.publisher || d.brand || 'Not specified'}`);
      } else {
        alert(dataObj?.error || (isTr ? "Kataloglarda bu ISBN numarasına ait kitap bulunamadı." : "Book not found in catalogs."));
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || (isTr ? "Kitap bilgisi getirilemedi" : "Failed to lookup book");
      alert(errMsg);
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    if (showProductModal && hbCategories.length === 0) {
      setLoadingHbCategories(true);
      api.getHepsiburadaCategories(branding?.id)
        .then((res: any) => {
          const data = res.data?.categories || res.categories || res.data || [];
          if (Array.isArray(data) && data.length > 0) {
            setHbCategories(data);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingHbCategories(false));
    }
  }, [showProductModal]);

  const handleDirectPublishToHb = async () => {
    if (!editingProduct?.id) {
      alert(isTr ? "Lütfen önce ürünü kaydedin." : "Please save the product first.");
      return;
    }
    if (!editingProduct.barcode || !String(editingProduct.barcode).trim()) {
      alert(isTr ? "Hepsiburada'da ilana açmak için ürünün geçerli bir barkodu olmalıdır!" : "Barcode is required to publish on Hepsiburada!");
      return;
    }
    try {
      setIsPublishingToHb(true);
      const res = await api.publishHepsiburadaProduct(editingProduct.id, branding?.id || branding?.store_id);
      const data = res.data || res;
      if (data?.success) {
        if (data.marketplace_data || data.hepsiburadaSku) {
          setEditingProduct((prev: any) => ({
            ...prev,
            is_hepsiburada_active: true,
            hepsiburada_sku: data.hepsiburadaSku || prev?.hepsiburada_sku,
            marketplace_data: data.marketplace_data || prev?.marketplace_data
          }));
        }
        alert(isTr ? (data.message || "Ürün Hepsiburada'ya başarıyla gönderildi / ilana açıldı!") : "Product published to Hepsiburada!");
      } else {
        alert(data?.error || (isTr ? "Aktarım başarısız" : "Publish failed"));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || (isTr ? "Aktarım başarısız" : "Publish failed"));
    } finally {
      setIsPublishingToHb(false);
    }
  };

  const scrollToLatestVariant = (targetId?: string) => {
    setTimeout(() => {
      if (targetId) {
        const el = document.getElementById(`variant_card_${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const firstInput = el.querySelector('input');
          if (firstInput) (firstInput as HTMLInputElement).focus();
          return;
        }
      }
      const allCards = document.querySelectorAll('[id^="variant_card_"]');
      if (allCards.length > 0) {
        const lastCard = allCards[allCards.length - 1];
        lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstInput = lastCard.querySelector('input');
        if (firstInput) (firstInput as HTMLInputElement).focus();
      }
    }, 120);
  };

  const fetchRecipe = async (prodId: number) => {
    try {
      const res = await api.getProductRecipe(prodId, branding.id);
      if (res && res.items) {
        setRecipeItems(res.items);
      }
    } catch (error) {
      console.error("Fetch recipe error:", error);
    }
  };

  const categoriesList = React.useMemo(() => {
    const cats = new Set<string>();
    if (isBookstore) {
      BOOKSTORE_CATEGORIES.forEach((c) => cats.add(c.mainCategory));
    }
    if (products && Array.isArray(products)) {
      products.forEach((p: any) => {
        if (p.category) cats.add(p.category.trim());
        if (p.category_2) cats.add(p.category_2.trim());
      });
    }
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "tr"));
  }, [products, isBookstore]);

  const subCategoriesMap = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (isBookstore) {
      BOOKSTORE_CATEGORIES.forEach((c) => {
        if (!map.has(c.mainCategory)) map.set(c.mainCategory, new Set());
        c.subCategories.forEach((s) => map.get(c.mainCategory)!.add(s));
      });
    }
    if (products && Array.isArray(products)) {
      products.forEach((p: any) => {
        if (p.category && p.sub_category) {
          const cat = p.category.trim();
          const sub = p.sub_category.trim();
          if (!map.has(cat)) map.set(cat, new Set());
          map.get(cat)!.add(sub);
        }
        if (p.category_2 && p.sub_category_2) {
          const cat2 = p.category_2.trim();
          const sub2 = p.sub_category_2.trim();
          if (!map.has(cat2)) map.set(cat2, new Set());
          map.get(cat2)!.add(sub2);
        }
      });
    }
    return map;
  }, [products, isBookstore]);

  useEffect(() => {
    if (showProductModal) {
      if (editingProduct?.id && isCafeRestaurant) {
        fetchRecipe(editingProduct.id);
      } else {
        setRecipeItems([]);
      }
      setProductImageUrl(editingProduct?.image_url || "");
      const cat = editingProduct?.category || "";
      const sub = editingProduct?.sub_category || "";
      setSelectedCategory(cat);
      setSelectedSubCategory(sub);
      setSelectedCategory2(editingProduct?.category_2 || "");
      setSelectedSubCategory2(editingProduct?.sub_category_2 || "");

      const pHasVariants = !!editingProduct?.has_variants || (Array.isArray(editingProduct?.variants) && editingProduct.variants.length > 0);
      setHasVariants(pHasVariants);
      setVariants(Array.isArray(editingProduct?.variants) ? editingProduct.variants : []);

      // Parse and set Allergens & Nutrition
      let initialAllergens: string[] = [];
      if (Array.isArray(editingProduct?.allergens)) {
        initialAllergens = editingProduct.allergens;
      } else if (typeof editingProduct?.allergens === 'string') {
        try {
          initialAllergens = JSON.parse(editingProduct.allergens);
        } catch {
          initialAllergens = [];
        }
      }
      setSelectedAllergens(initialAllergens);
      setCalories(editingProduct?.calories || "");
      setPrepTimeMin(editingProduct?.prep_time_min || "");
      setPortionSize(editingProduct?.portion_size || "");

      if (isBookstore) {
        setSelectedBookBadges(extractProductLabels(editingProduct));
      } else {
        setSelectedBookBadges([]);
      }

      const hasCategories = categoriesList.length > 0;
      const warrantsNewCat = cat ? !categoriesList.includes(cat) : !hasCategories;
      setIsNewCategoryMode(warrantsNewCat);

      const availableSubs = cat ? Array.from(subCategoriesMap.get(cat) || []) : [];
      const warrantsNewSub = sub ? !availableSubs.includes(sub) : availableSubs.length === 0;
      setIsNewSubCategoryMode(warrantsNewSub);
    } else {
      setProductImageUrl("");
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedCategory2("");
      setSelectedSubCategory2("");
      setHasVariants(false);
      setVariants([]);
      setSelectedAllergens([]);
      setSelectedBookBadges([]);
      setCalories("");
      setPrepTimeMin("");
      setPortionSize("");
      setIsNewCategoryMode(false);
      setIsNewSubCategoryMode(false);
      setRecipeItems([]);
    }
  }, [showProductModal, editingProduct, isBookstore]);

  const toggleBookBadge = (badgeId: string) => {
    setSelectedBookBadges((prev) => {
      const exists = prev.some((b) => b.toLowerCase() === badgeId.toLowerCase());
      if (exists) {
        return prev.filter((b) => b.toLowerCase() !== badgeId.toLowerCase());
      } else {
        return [...prev, badgeId];
      }
    });
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setSelectedSubCategory("");

    const availableSubs = val ? Array.from(subCategoriesMap.get(val) || []) : [];
    setIsNewSubCategoryMode(availableSubs.length === 0);
  };

  const handleCategoryTextChange = (val: string) => {
    setSelectedCategory(val);
    setIsNewSubCategoryMode(true);
    setSelectedSubCategory("");
  };

  if (!showProductModal) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-3 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-fade-in border border-slate-200"
      >
        {/* COMPACT MODAL HEADER */}
        <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            {isBookstore && <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />}
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>
                  {editingProduct
                    ? isTr
                      ? isBookstore ? "Eseri / Kitabı Düzenle" : "Ürünü Düzenle"
                      : isBookstore ? "Edit Book" : "Edit Product"
                    : isTr
                    ? isBookstore ? "Yeni Eser / Kitap Ekle" : "Yeni Ürün Kaydet"
                    : isBookstore ? "Add New Book" : "Create New Product"}
                </span>
                {hasVariants && (
                  <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded border border-indigo-500/30">
                    Varyantlı
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-300 leading-none mt-0.5">
                {isTr
                  ? isBookstore ? "Eser künyesi, yayıncılık nitelikleri, manşet vitrini ve fiyatlandırma." : "Stok listenize yeni ürün veya hizmet tanımlayın."
                  : isBookstore ? "Define book bibliographic data and pricing." : "Define new product or service in inventory."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingProduct?.id && (
              <button
                type="button"
                onClick={() => setShowMovementModal(true)}
                className="px-2.5 py-1 bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-400/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                title={isTr ? "Ürün Hareketleri & Ekstresi" : "Product Movement & Statement"}
              >
                <History className="h-3.5 w-3.5" />
                <span>{isTr ? "Stok Ekstresi" : "Statement"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowProductModal(false);
                setEditingProduct(null);
                if (typeof window !== 'undefined' && sessionStorage.getItem('returnToMarketplaceModal') === 'true') {
                  sessionStorage.removeItem('returnToMarketplaceModal');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('reopenMarketplaceModal'));
                  }, 50);
                }
              }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white border-0 outline-none cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* UNIFIED FORM WITH FIXED STICKY FOOTER */}
        <form
          onSubmit={(e) => {
            if (handleAddProduct) handleAddProduct(e);
          }}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          {/* SCROLLABLE BODY (COMPACT BENTO GRID) */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-2">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
              
              {/* LEFT COLUMN: IDENTIFICATION, SPECS, DESCRIPTION, RECIPE */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-2">
                {/* 1. TEMEL KİMLİK & KODLAR */}
                <div className="p-2 bg-slate-50/90 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                      <span>{isTr ? (isBookstore ? "Eser Kimliği & ISBN" : "Temel Kimlik & Barkod") : "Core Identity & Barcode"}</span>
                    </span>
                    <span className="text-[9px] font-bold text-slate-500">
                      {isBookstore ? "ISBN / EAN Standart" : "EAN-13 Standart"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 items-start">
                    <div className="space-y-0.5 flex-1 w-full min-w-0">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? (isBookstore ? "Eser / Kitap Adı *" : "Ürün / Hizmet Adı *") : "Product / Book Name *"}
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder={isTr ? (isBookstore ? "örn: Suç ve Ceza, İnce Memed" : "Ürün Adı") : "Product name"}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                        defaultValue={editingProduct?.name || ""}
                      />
                    </div>

                    <div className="space-y-0.5 w-full sm:w-44 sm:max-w-[170px] shrink-0">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr 
                          ? (hasVariants ? "Barkod" : isBookstore ? "Barkod / ISBN *" : `Barkod${isCafeRestaurant ? " (İsteğe)" : " *"}`) 
                          : (hasVariants ? "Barcode" : isBookstore ? "Barcode / ISBN *" : `Barcode${isCafeRestaurant ? " (Opt)" : " *"}`)}
                      </label>
                      <input
                        type="text"
                        name="barcode"
                        required={!hasVariants && !isCafeRestaurant}
                        disabled={hasVariants}
                        placeholder={hasVariants ? (isTr ? "Varyantta" : "In variants") : (isTr ? (isCafeRestaurant ? "Oto boş bırak..." : isBookstore ? "örn: 978-605-241-607-5" : "Barkod") : "Barcode")}
                        className={`w-full px-2 py-1 border rounded-lg transition-all font-mono font-bold text-xs h-7.5 outline-none ${
                          hasVariants 
                            ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-80" 
                            : "bg-white border-slate-200 text-slate-900 focus:border-indigo-600 shadow-2xs"
                        }`}
                        defaultValue={editingProduct?.barcode || (editingProduct as any)?.sector_data?.isbn || ""}
                      />
                      {(isBookstore || isShopLp) && (
                        <button
                          type="button"
                          onClick={handleAutoLookup}
                          disabled={lookupLoading}
                          className="mt-1 w-full py-1 px-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-[9px] font-black flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Google Books ile ISBN sorgula ve bilgileri doldur"
                        >
                          {lookupLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5 text-amber-300" />}
                          <span>{isTr ? "ISBN İle Doldur" : "Auto-Fill ISBN"}</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-0.5 w-full sm:w-32 sm:max-w-[120px] shrink-0">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "Kod / SKU" : "SKU / Code"}
                      </label>
                      <input
                        type="text"
                        name="product_code"
                        placeholder={isTr ? "SKU-123" : "SKU-123"}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-0 transition-all font-mono font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                        defaultValue={editingProduct?.product_code || editingProduct?.sku || ""}
                      />
                    </div>
                  </div>

                  {/* 2. SATIR: YAZAR / MARKA & KATEGORİLER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
                    {/* Eser Sahibi / Yazar (Bookstore ise öncelikli) */}
                    {isBookstore ? (
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                          {isTr ? "Eser Sahibi / Yazar *" : "Author *"}
                        </label>
                        <input
                          type="text"
                          name="author"
                          placeholder={isTr ? "örn: Dostoyevski" : "Author"}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                          defaultValue={editingProduct?.author || (editingProduct as any)?.sector_data?.author || ""}
                        />
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                          {isTr ? "Marka / Üretici" : "Brand"}
                        </label>
                        <input
                          type="text"
                          name="brand"
                          placeholder={isTr ? "örn: Apple, Nike" : "Brand"}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                          defaultValue={editingProduct?.brand || ""}
                        />
                      </div>
                    )}

                    {/* Yayınevi (Bookstore) / Ürün Tipi */}
                    {isBookstore ? (
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                          {isTr ? "Yayınevi / Yayıncı *" : "Publisher *"}
                        </label>
                        <input
                          type="text"
                          name="brand"
                          placeholder={isTr ? "örn: Can Yayınları" : "Publisher"}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                          defaultValue={editingProduct?.brand || (editingProduct as any)?.sector_data?.publisher || ""}
                        />
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                          {isTr ? "Ürün Tipi" : "Type"}
                        </label>
                        <select
                          name="product_type"
                          className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none cursor-pointer"
                          defaultValue={editingProduct?.product_type || "product"}
                        >
                          <option value="product">{isTr ? "Fiziksel Ürün" : "Physical"}</option>
                          <option value="service">{isTr ? "Hizmet / Servis" : "Service"}</option>
                        </select>
                      </div>
                    )}

                    {/* Kategori */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                          {isTr ? "Kategori" : "Category"}
                        </label>
                        {categoriesList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const prevMode = isNewCategoryMode;
                              setIsNewCategoryMode(!prevMode);
                              if (!prevMode) {
                                setIsNewSubCategoryMode(true);
                              } else {
                                setSelectedCategory("");
                                setSelectedSubCategory("");
                                setIsNewSubCategoryMode(false);
                              }
                            }}
                            className="text-[9px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer border-0 outline-none"
                          >
                            {isNewCategoryMode ? (isTr ? "Listeden" : "List") : (isTr ? "+ Yeni" : "+ New")}
                          </button>
                        )}
                      </div>
                      {isNewCategoryMode || categoriesList.length === 0 ? (
                        <input
                          type="text"
                          name="category"
                          placeholder={isTr ? (isBookstore ? "örn: Edebiyat" : "Kategori") : "Category"}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                          value={selectedCategory}
                          onChange={(e) => handleCategoryTextChange(e.target.value)}
                        />
                      ) : (
                        <select
                          name="category"
                          value={selectedCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none cursor-pointer"
                        >
                          <option value="">{isTr ? "-- Kategori Seçin --" : "-- Select --"}</option>
                          {categoriesList.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Alt Kategori */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                          {isTr ? "Alt Kategori" : "Sub Category"}
                        </label>
                        {!isNewCategoryMode && selectedCategory && (subCategoriesMap.get(selectedCategory)?.size || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewSubCategoryMode(!isNewSubCategoryMode);
                              if (isNewSubCategoryMode) setSelectedSubCategory("");
                            }}
                            className="text-[9px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer border-0 outline-none"
                          >
                            {isNewSubCategoryMode ? (isTr ? "Listeden" : "List") : (isTr ? "+ Yeni" : "+ New")}
                          </button>
                        )}
                      </div>
                      {isNewSubCategoryMode || isNewCategoryMode || !selectedCategory || (subCategoriesMap.get(selectedCategory)?.size || 0) === 0 ? (
                        <input
                          type="text"
                          name="sub_category"
                          placeholder={isTr ? (isBookstore ? "örn: Dünya Klasikleri" : "Alt Kategori") : "Sub Category"}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                          value={selectedSubCategory}
                          onChange={(e) => setSelectedSubCategory(e.target.value)}
                        />
                      ) : (
                        <select
                          name="sub_category"
                          value={selectedSubCategory}
                          onChange={(e) => setSelectedSubCategory(e.target.value)}
                          className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none cursor-pointer"
                        >
                          <option value="">{isTr ? "-- Alt Kategori --" : "-- Select --"}</option>
                          {Array.from(subCategoriesMap.get(selectedCategory) || []).map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. BOOKSTORE ÖZEL NİTELİKLERİ (HAFTANIN ESERİ + 4x2 SPECS + SPOT/ÖDÜLLER) */}
                {isBookstore && (
                  <BookstoreSectorSpecs
                    editingProduct={editingProduct}
                    isTr={isTr}
                    branding={branding}
                    selectedBookBadges={selectedBookBadges}
                    setSelectedBookBadges={setSelectedBookBadges}
                  />
                )}

                {/* 3. AÇIKLAMA / ARKA KAPAK YAZISI */}
                <div className="p-2 bg-slate-50/90 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                      {isBookstore ? (isTr ? "Arka Kapak Tanıtım Yazısı / Eser Özeti" : "Book Synopsis") : (isTr ? "Açıklama & Detaylar" : "Description")}
                    </label>
                  </div>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder={isBookstore 
                      ? (isTr ? "Arka kapak tanıtım yazısı veya detaylı eser bilgisi..." : "Book synopsis or bibliographic review...") 
                      : (isTr ? "Ürün teknik özellikleri ve detayları" : "Detailed specs")}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 focus:ring-0 transition-all font-medium text-slate-900 text-xs shadow-2xs resize-none outline-none leading-relaxed"
                    defaultValue={editingProduct?.description || ""}
                  />
                </div>

                {/* HORECA / CAFE RESTAURANT RECIPE & NUTRITION (Only if cafe_restaurant) */}
                {isCafeRestaurant && (
                  <>
                    <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-200/80 space-y-2">
                      <div className="flex justify-between items-center border-b border-orange-200 pb-1">
                        <span className="text-[10px] font-black text-orange-950 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                          <span>{isTr ? "Malzeme Reçetesi (BOM)" : "Recipe (BOM)"}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowIngredientSelector(!showIngredientSelector)}
                          className="px-2 py-0.5 bg-orange-100 text-orange-900 rounded-md font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>{isTr ? "Malzeme Ekle" : "Add"}</span>
                        </button>
                      </div>

                      {showIngredientSelector && (
                        <div className="p-2 bg-white rounded-lg border border-orange-300 space-y-1">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder={isTr ? "Malzeme ara..." : "Search..."}
                              className="w-full pl-8 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-900"
                              value={ingredientSearch}
                              onChange={(e) => setIngredientSearch(e.target.value)}
                            />
                          </div>
                          <div className="max-h-28 overflow-y-auto space-y-0.5">
                            {products
                              .filter(p => p.id !== editingProduct?.id && (p.name.toLowerCase().includes(ingredientSearch.toLowerCase()) || p.barcode?.toLowerCase().includes(ingredientSearch.toLowerCase())))
                              .slice(0, 8)
                              .map(p => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    if (!recipeItems.find(item => item.ingredient_id === p.id)) {
                                      setRecipeItems([...recipeItems, { 
                                        ingredient_id: p.id, 
                                        ingredient_name: p.name, 
                                        amount: 1, 
                                        ingredient_unit: p.unit || 'ml' 
                                      }]);
                                    }
                                    setShowIngredientSelector(false);
                                    setIngredientSearch("");
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-orange-50 rounded text-[11px] font-bold text-slate-800 flex justify-between items-center cursor-pointer"
                                >
                                  <span>{p.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 rounded">{p.unit}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        {recipeItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-1.5 bg-white border border-orange-200 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.ingredient_name}</p>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-900 text-center"
                              value={item.amount}
                              onChange={(e) => {
                                const newItems = [...recipeItems];
                                newItems[idx].amount = parseFloat(e.target.value) || 0;
                                setRecipeItems(newItems);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setRecipeItems(recipeItems.filter((_, i) => i !== idx))}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <input type="hidden" name="recipe_data" value={JSON.stringify(recipeItems)} />
                    </div>

                    <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/80 space-y-2">
                      <div className="border-b border-emerald-200 pb-1 flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>{isTr ? "Besin Değeri & Alerjenler" : "Nutrition & Allergens"}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          name="calories"
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                          placeholder={isTr ? "Kalori (kcal)" : "Calories"}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <input
                          type="text"
                          name="portion_size"
                          value={portionSize}
                          onChange={(e) => setPortionSize(e.target.value)}
                          placeholder={isTr ? "Porsiyon (gr/ml)" : "Portion"}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                        <input
                          type="number"
                          name="prep_time_min"
                          value={prepTimeMin}
                          onChange={(e) => setPrepTimeMin(e.target.value)}
                          placeholder={isTr ? "Hazırlık (Dk)" : "Prep (Min)"}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>
                      <input type="hidden" name="allergens_data" value={JSON.stringify(selectedAllergens)} />
                    </div>
                  </>
                )}

                {/* VARYANT MATRİSİ AÇIKSA GÖSTERİMİ */}
                {hasVariants && (
                  <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-200 space-y-2">
                    <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider block">
                      {isTr ? "Varyant ve Ebat Kırılımları" : "Variant Attributes Matrix"}
                    </span>
                    <VariantMatrixManager
                      variants={variants}
                      onChange={(updated) => setVariants(updated)}
                      baseProduct={{
                        name: editingProduct?.name,
                        price: editingProduct?.price,
                        cost_price: editingProduct?.cost_price,
                        barcode: editingProduct?.barcode,
                        sku: editingProduct?.sku || editingProduct?.barcode,
                        stock_quantity: editingProduct?.stock_quantity,
                        currency: editingProduct?.currency,
                        image_url: productImageUrl
                      }}
                      isCafeRestaurant={isCafeRestaurant}
                      lang={lang}
                    />
                    <input type="hidden" name="variants_data" value={JSON.stringify(variants)} />
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: PRICING, STOCK, MEDIA, VISIBILITY */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-2">
                
                {/* 1. FİYATLANDIRMA & MALİYETLER */}
                <div className="p-2 bg-emerald-50/30 rounded-xl border border-emerald-100 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-0.5">
                    <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      <span>{isTr ? "Fiyat & Vergi Yönetimi" : "Pricing & VAT"}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Satış Fiyatı + Para Birimi */}
                    <div className="space-y-0.5 col-span-2">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? `Satış Fiyatı${hasVariants ? "" : " *"}` : `Price${hasVariants ? "" : " *"}`}
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          name="price"
                          required={!hasVariants}
                          placeholder={hasVariants ? (isTr ? "Varyantta" : "In variants") : "0.00"}
                          className="flex-1 min-w-0 px-2.5 py-1 bg-white border border-r-0 border-slate-200 rounded-l-lg focus:border-indigo-600 font-black text-emerald-700 text-xs sm:text-sm h-7.5 shadow-2xs outline-none"
                          defaultValue={editingProduct?.price || ""}
                        />
                        <select
                          name="currency"
                          className="w-18 shrink-0 px-1 py-1 bg-slate-100 border border-slate-200 rounded-r-lg font-bold text-slate-900 text-xs text-center cursor-pointer h-7.5 outline-none"
                          defaultValue={editingProduct?.currency || branding?.default_currency || "TRY"}
                        >
                          <option value="TRY">TRY (₺)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>

                    {/* Eski Fiyat & 2. Fiyat */}
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "Eski Fiyat (Çizili)" : "Old Price"}
                      </label>
                      <input
                        type="text"
                        name="old_price"
                        placeholder="0.00"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                        defaultValue={editingProduct?.old_price || ""}
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "2. Fiyat (Toptan)" : "2nd Price"}
                      </label>
                      <input
                        type="text"
                        name="price_2"
                        placeholder="0.00"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none"
                        defaultValue={editingProduct?.price_2 || ""}
                      />
                    </div>

                    {/* Maliyet & KDV */}
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "Maliyet Fiyatı" : "Cost"}
                      </label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          name="cost_price"
                          placeholder="0.00"
                          className="flex-1 min-w-0 px-2 py-1 bg-white border border-r-0 border-slate-200 rounded-l-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7.5 outline-none"
                          defaultValue={editingProduct?.cost_price || ""}
                        />
                        <select
                          name="cost_currency"
                          className="w-16 shrink-0 px-1 py-1 bg-slate-100 border border-slate-200 rounded-r-lg font-bold text-slate-900 text-[11px] text-center cursor-pointer h-7.5 outline-none"
                          defaultValue={editingProduct?.cost_currency || branding?.default_currency || "TRY"}
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "KDV Oranı" : "VAT Rate"}
                      </label>
                      <select
                        name="tax_rate"
                        className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7.5 shadow-2xs outline-none cursor-pointer"
                        defaultValue={editingProduct?.tax_rate !== undefined ? String(editingProduct.tax_rate) : "20"}
                      >
                        <option value="20">%20 (Genel)</option>
                        <option value="10">%10 (Gıda/Tıbbi)</option>
                        <option value="1">%1 (Temel)</option>
                        <option value="0">%0 (Muaf / Kitap)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. STOK, BİRİM & KARGO */}
                <div className="p-2 bg-amber-50/30 rounded-xl border border-amber-100 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-0.5">
                    <span className="text-[10px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                      <span>{isTr ? "Stok, Birim & Kargo" : "Stock & Shipping"}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "Birim *" : "Unit *"}
                      </label>
                      <select
                        name="unit"
                        className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7 outline-none cursor-pointer"
                        defaultValue={editingProduct?.unit || (isBookstore ? "Adet" : "Adet")}
                      >
                        <option value="Adet">{isTr ? "Adet" : "Pieces"}</option>
                        <option value="Paket">{isTr ? "Paket" : "Pack"}</option>
                        <option value="Kutu">{isTr ? "Kutu" : "Box"}</option>
                        <option value="Koli">{isTr ? "Koli" : "Carton"}</option>
                        <option value="kg">{isTr ? "kg" : "kg"}</option>
                        {isCafeRestaurant && <option value="Porsiyon">{isTr ? "Porsiyon" : "Portion"}</option>}
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "Stok Miktarı" : "Stock"}
                      </label>
                      <input
                        type="number"
                        name="stock_quantity"
                        readOnly={hasVariants}
                        disabled={hasVariants}
                        placeholder="0"
                        className={`w-full px-2 py-0.5 border rounded-lg font-bold text-xs h-7 outline-none ${
                          hasVariants 
                            ? "bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed font-black" 
                            : "bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                        }`}
                        value={hasVariants ? variants.reduce((acc, curr) => acc + (parseInt(curr.stock_quantity) || 0), 0) : undefined}
                        defaultValue={!hasVariants ? (editingProduct?.stock_quantity !== undefined ? String(editingProduct.stock_quantity) : "0") : undefined}
                      />
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "Kritik Stok" : "Min Stock"}
                      </label>
                      <input
                        type="number"
                        name="min_stock_level"
                        placeholder="5"
                        className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7 outline-none"
                        defaultValue={editingProduct?.min_stock_level !== undefined ? String(editingProduct.min_stock_level) : "5"}
                      />
                    </div>

                    <div className="space-y-0.5 col-span-3">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "Kargo Profili" : "Shipping Profile"}
                      </label>
                      <select
                        name="shipping_profile_id"
                        className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-bold text-slate-900 text-xs h-7 outline-none cursor-pointer"
                        defaultValue={editingProduct?.shipping_profile_id || ""}
                      >
                        <option value="">{isTr ? "Varsayılan Kargo Profili" : "Default Profile"}</option>
                        {(branding?.shipping_profiles || []).map((profile: any) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name || (isTr ? "Profil" : "Profile")} - {profile.cost} {profile.currency}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. GÖRSEL, ETİKETLER & VİTRİN ANAHTARLARI */}
                <div className="p-2 bg-slate-50/90 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-0.5">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      <span>{isTr ? (isBookstore ? "Kapak Görseli & Etiketler" : "Görsel & Etiketler") : "Image & Media"}</span>
                    </span>
                  </div>

                  {/* Görsel Satırı */}
                  <div className="flex items-center gap-2 p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="w-7 h-7 rounded border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {productImageUrl ? (
                        <img 
                          src={productImageUrl} 
                          alt="Cover" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.fallback && productImageUrl.startsWith('http')) {
                              target.dataset.fallback = '1';
                              target.src = `/api/proxy-image?url=${encodeURIComponent(productImageUrl)}`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-[8px] text-slate-400 font-bold">{isTr ? "Yok" : "None"}</span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="image_url"
                      placeholder="https://... görsel adresi"
                      className="flex-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-900 h-6.5 outline-none"
                      value={productImageUrl}
                      onChange={(e) => setProductImageUrl(e.target.value)}
                    />
                    <div className="shrink-0 scale-90 origin-right">
                      <MultiImageUploader 
                        compact={true}
                        onImagesUploaded={(urls) => {
                          if (urls && urls.length > 0) setProductImageUrl(urls[0]);
                        }} 
                        lang={lang} 
                      />
                    </div>
                  </div>

                  {/* Etiketler & Rozetler */}
                  {isBookstore ? (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>{isTr ? "Vitrin Rozetleri & Izgara Seçimi" : "Showcase Badges & Curated Grids"}</span>
                        </label>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {isTr ? "Seçilen ızgaralarda listelenir" : "Appears in selected rows"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-white rounded-lg border border-slate-200">
                        {BOOKSTORE_BADGES.map((b) => {
                          const isSelected = selectedBookBadges.some(s => s.toLowerCase() === b.id.toLowerCase());
                          const IconComponent = 
                            b.iconName === 'Flame' ? Flame :
                            b.iconName === 'Sparkles' ? Sparkles :
                            b.iconName === 'Star' ? Star :
                            b.iconName === 'Award' ? Award :
                            b.iconName === 'Crown' ? Crown :
                            b.iconName === 'Clock' ? Clock : Tag;

                          return (
                            <button
                              key={`badge-opt-${b.id}`}
                              type="button"
                              onClick={() => toggleBookBadge(b.id)}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-black flex items-center justify-between gap-1 transition-all border cursor-pointer select-none text-left ${
                                isSelected
                                  ? `${b.badgeBgClass} border-transparent shadow-xs scale-[1.01]`
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-current" : b.textClass}`} />
                                <span className="truncate">{isTr ? b.labelTr : b.labelEn}</span>
                              </div>
                              {isSelected ? (
                                <Check className="w-3.5 h-3.5 shrink-0 ml-1" />
                              ) : (
                                <Plus className="w-3 h-3 shrink-0 text-slate-400 opacity-60 ml-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Hidden form inputs to pass values seamlessly */}
                      <input type="hidden" name="labels" value={selectedBookBadges.join(", ")} />
                      {selectedBookBadges.some(s => s.toLowerCase() === "bestseller") && (
                        <input type="hidden" name="is_bestseller" value="on" />
                      )}
                      {selectedBookBadges.some(s => s.toLowerCase() === "featured_week") && (
                        <input type="hidden" name="sector_spec_is_weekly_pick" value="true" />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                        {isTr ? "Etiketler / Rozetler" : "Labels"}
                      </label>
                      <input
                        type="text"
                        name="labels"
                        placeholder={isTr ? "Örn: Kampanya, Fırsat" : "e.g. Campaign, Deal"}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-indigo-600 font-semibold text-slate-900 text-xs h-7 shadow-2xs outline-none"
                        defaultValue={
                          Array.isArray(editingProduct?.labels) 
                            ? editingProduct.labels.join(", ") 
                            : (typeof editingProduct?.labels === 'string' ? editingProduct.labels.replace(/[\[\]"]/g, '') : "")
                        }
                      />
                    </div>
                  )}

                  {/* Vitrin ve Satış Durumu Anahtarları (Kompakt Tek Satır) */}
                  <div className="p-1.5 bg-slate-100/90 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="prod_is_web_sale" className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="is_web_sale"
                        id="prod_is_web_sale"
                        className="h-3.5 w-3.5 text-indigo-600 rounded cursor-pointer"
                        defaultChecked={editingProduct?.is_web_sale !== false}
                      />
                      <span className="text-[11px] font-black text-slate-900">
                        {isTr ? "Vitrinde Yayınla" : "Showcase"}
                      </span>
                    </label>

                    <label htmlFor="prod_is_sellable" className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        name="is_sellable"
                        id="prod_is_sellable"
                        className="h-3.5 w-3.5 text-amber-500 rounded cursor-pointer"
                        defaultChecked={editingProduct?.is_sellable !== false}
                      />
                      <span className="text-[11px] font-black text-slate-900">
                        {isTr ? "Satışa Açık" : "Sellable"}
                      </span>
                    </label>

                    {isCafeRestaurant && (
                      <label htmlFor="prod_is_bestseller" className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="is_bestseller"
                          id="prod_is_bestseller"
                          className="h-3.5 w-3.5 text-orange-600 rounded cursor-pointer"
                          defaultChecked={!!editingProduct?.is_bestseller}
                        />
                        <span className="text-[11px] font-black text-slate-900 flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                          <span>{isTr ? "En Çok Satan" : "Bestseller"}</span>
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* 4. VARYANT AÇ/KAPAT TOGGLE */}
                <div className="p-2 bg-indigo-50/40 rounded-xl border border-indigo-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="has_variants"
                      id="prod_has_variants"
                      checked={hasVariants}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setHasVariants(val);
                        if (val && variants.length === 0) {
                          setVariants([{ 
                            id: `var_${Date.now()}_1`,
                            name: isTr ? (isBookstore ? "Ciltli / Özel Baskı" : isCafeRestaurant ? "Standart Porsiyon" : "Standart Boy") : "Standard", 
                            price: editingProduct?.price || 0, 
                            stock_quantity: editingProduct?.stock_quantity || 10, 
                            barcode: "",
                            sku: `${editingProduct?.barcode || 'PRD'}-V1`,
                            variant_type: 'standard',
                            is_active: true
                          }]);
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <label htmlFor="prod_has_variants" className="text-[11px] font-black text-indigo-950 uppercase tracking-wider cursor-pointer select-none">
                      {isTr ? (isBookstore ? "Varyantlı Eser (Cilt, Boyut, Set)" : "Varyantlı Ürün (Beden, Renk vb.)") : "Has Variants"}
                    </label>
                  </div>
                  {hasVariants && (
                    <span className="text-[9px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                      {variants.length} {isTr ? "Varyant" : "Vars"}
                    </span>
                  )}
                </div>

                {/* MARKETPLACE INTEGRATION (HEPSIBURADA & AMAZON) */}
                {isMarketplaceEnabled && (
                  <div className="space-y-1.5">
                    <MarketplaceProductFields
                      product={editingProduct || {}}
                      onUpdate={(updated) => {
                        if (editingProduct) setEditingProduct({ ...editingProduct, ...updated });
                      }}
                      isTr={isTr}
                      categories={hbCategories}
                      storeSettings={branding?.hepsiburada_settings}
                    />
                    {editingProduct?.id && connectedMarketplaces.hepsiburada && (
                      <button
                        type="button"
                        onClick={handleDirectPublishToHb}
                        disabled={isPublishingToHb}
                        className="w-full py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{isPublishingToHb ? "Hepsiburada'ya Gönderiliyor..." : "Hepsiburada'da Satışa Aç"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FIXED STICKY FOOTER - ALWAYS IN VIEWPORT */}
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowProductModal(false);
                setEditingProduct(null);
                if (typeof window !== 'undefined' && sessionStorage.getItem('returnToMarketplaceModal') === 'true') {
                  sessionStorage.removeItem('returnToMarketplaceModal');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('reopenMarketplaceModal'));
                  }, 50);
                }
              }}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-0"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer border-0 flex items-center gap-1.5"
            >
              <span>{isTr ? (isBookstore ? "Eseri / Kitabı Kaydet" : "Ürünü Kaydet") : (isBookstore ? "Save Book Record" : "Save Product")}</span>
            </button>
          </div>
        </form>
      </motion.div>

      {showMovementModal && editingProduct && (
        <ProductMovementModal
          isOpen={showMovementModal}
          onClose={() => setShowMovementModal(false)}
          product={editingProduct}
          branding={branding}
          storeId={branding?.id}
        />
      )}
    </div>
  );
};
