import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Plus, Trash2, Search, Flame, Sparkles, Camera, Upload, Palette } from "lucide-react";
import { MultiImageUploader } from "../../../components/MultiImageUploader";
import { api } from "../../../services/api";
import { compressImageToWebP } from "../../../utils/imageUtils";
import { VariantMatrixManager } from "../../../components/dashboard/VariantMatrixManager";
import { MarketplaceProductFields } from "../../../components/marketplace/MarketplaceProductFields";

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

  // ShopLP Retail Variant Matrix States
  const [variantBarcodeMode, setVariantBarcodeMode] = useState<'individual' | 'shared'>('individual');
  const [showMatrixGenerator, setShowMatrixGenerator] = useState(false);
  const [matrixColors, setMatrixColors] = useState("");
  const [matrixSizes, setMatrixSizes] = useState("");

  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';
  const isHbEnabled = !!branding?.hepsiburada_settings?.connected;

  useEffect(() => {
    if (showProductModal && isHbEnabled) {
      setLoadingHbCategories(true);
      api.getHepsiburadaCategories(branding.id)
        .then(res => {
          if (res.data?.categories) setHbCategories(res.data.categories);
          else if (Array.isArray(res.categories)) setHbCategories(res.categories);
        })
        .catch(err => console.error("HB Cat Fetch Error:", err))
        .finally(() => setLoadingHbCategories(false));
    }
  }, [showProductModal, isHbEnabled]);

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
    if (!products || !Array.isArray(products)) return [];
    const cats = new Set<string>();
    products.forEach((p: any) => {
      if (p.category) cats.add(p.category.trim());
      if (p.category_2) cats.add(p.category_2.trim());
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b, "tr"));
  }, [products]);

  const subCategoriesMap = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
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
  }, [products]);

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
      setCalories("");
      setPrepTimeMin("");
      setPortionSize("");
      setIsNewCategoryMode(false);
      setIsNewSubCategoryMode(false);
      setRecipeItems([]);
    }
  }, [showProductModal, editingProduct]);

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in"
      >
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              {editingProduct
                ? isTr
                  ? "Ürünü Düzenle"
                  : "Edit Product"
                : isTr
                ? "Yeni Ürün Kaydet"
                : "Create New Product"}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              {isTr
                ? "Stok listenize yeni ürün veya hizmet tanımlayın."
                : "Define new product or service in inventory."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowProductModal(false);
              setEditingProduct(null);
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white border-0 outline-none cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            if (handleAddProduct) handleAddProduct(e);
          }}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* SECTION 1: Kimlik & Temel Bilgiler (Soft Indigo Tint) */}
          <div className="p-4 bg-indigo-50/30 rounded-3xl border border-indigo-100/80 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <span className="text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                {isTr ? "Temel Kimlik & Barkod" : "Core Identification & SKU"}
              </span>
              {hasVariants && (
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md border border-indigo-200">
                  {isTr ? "Varyant Takipli" : "Variant Tracked"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? (hasVariants ? "Barkod / Ürün Kodu (Varyantlı Ürün)" : "Barkod / Ürün Kodu *") : (hasVariants ? "Barcode / SKU (Has Variants)" : "Barcode / SKU *")}
                </label>
                <input
                  type="text"
                  name="barcode"
                  required={!hasVariants}
                  disabled={hasVariants}
                  placeholder={hasVariants ? (isTr ? "Varyantlar altındaki kendi barkod/SKU'su geçerlidir" : "Tracked via individual variants") : (isTr ? "Barkod girin veya okutun..." : "SKU code...")}
                  className={`w-48 max-w-[190px] px-4 py-2.5 border-2 rounded-2xl transition-all font-bold text-xs ${
                    hasVariants 
                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed opacity-80" 
                      : "bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:ring-0 shadow-2xs"
                  }`}
                  defaultValue={editingProduct?.barcode || ""}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Ürün / Hizmet Adı *" : "Product / Service Name *"}
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={isTr ? "örn: Alçıpan Profili" : "Product name"}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-extrabold text-slate-900 text-sm shadow-2xs"
                  defaultValue={editingProduct?.name || ""}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Kategoriler ve Sektörel Sınıflandırma (Soft Slate Tint) */}
          <div className="p-4 bg-slate-50/80 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                {isTr ? "Kategoriler & Marka" : "Categories & Brand"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 flex flex-col justify-between">
                <div className="flex justify-between items-center ml-1 mb-1">
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
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
                      className="text-[10px] font-black text-indigo-700 hover:text-indigo-900 uppercase tracking-widest cursor-pointer border-0 outline-none"
                    >
                      {isNewCategoryMode
                        ? (isTr ? "Listeden Seç" : "Select from List")
                        : (isTr ? "+ Yeni Kategori" : "+ New Category")}
                    </button>
                  )}
                </div>
                {isNewCategoryMode || categoriesList.length === 0 ? (
                  <input
                    type="text"
                    name="category"
                    placeholder={isTr ? "örn: İnşaat, Yiyecek" : "Category"}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryTextChange(e.target.value)}
                  />
                ) : (
                  <div className="relative">
                    <select
                      name="category"
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 appearance-none h-[42px] text-xs shadow-2xs"
                    >
                      <option value="">{isTr ? "-- Kategori Seçin --" : "-- Select Category --"}</option>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1 flex flex-col justify-between">
                <div className="flex justify-between items-center ml-1 mb-1">
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    {isTr ? "Alt Kategori" : "Sub Category"}
                  </label>
                  {!isNewCategoryMode && selectedCategory && (subCategoriesMap.get(selectedCategory)?.size || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewSubCategoryMode(!isNewSubCategoryMode);
                        if (isNewSubCategoryMode) {
                          setSelectedSubCategory("");
                        }
                      }}
                      className="text-[10px] font-black text-indigo-700 hover:text-indigo-900 uppercase tracking-widest cursor-pointer border-0 outline-none"
                    >
                      {isNewSubCategoryMode
                        ? (isTr ? "Listeden Seç" : "Select from List")
                        : (isTr ? "+ Yeni Alt Kategori" : "+ New Sub Category")}
                    </button>
                  )}
                </div>
                {isNewSubCategoryMode || isNewCategoryMode || !selectedCategory || (subCategoriesMap.get(selectedCategory)?.size || 0) === 0 ? (
                  <input
                    type="text"
                    name="sub_category"
                    placeholder={isTr ? "örn: Çatı Paneli" : "Sub category"}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                  />
                ) : (
                  <div className="relative">
                    <select
                      name="sub_category"
                      value={selectedSubCategory}
                      onChange={(e) => setSelectedSubCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 appearance-none h-[42px] text-xs shadow-2xs"
                    >
                      <option value="">{isTr ? "-- Alt Kategori Seçin --" : "-- Select Sub Category --"}</option>
                      {Array.from(subCategoriesMap.get(selectedCategory) || []).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {isHbEnabled && (
                <MarketplaceProductFields
                  product={editingProduct}
                  onUpdate={(data) => setEditingProduct(data)}
                  isTr={isTr}
                  categories={hbCategories}
                />
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "2. Kategori" : "2nd Category"}
                </label>
                <input
                  type="text"
                  name="category_2"
                  placeholder={isTr ? "örn: Soğuk İçecekler" : "2nd Category"}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                  value={selectedCategory2}
                  onChange={(e) => setSelectedCategory2(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "2. Alt Kategori" : "2nd Sub Category"}
                </label>
                <input
                  type="text"
                  name="sub_category_2"
                  placeholder={isTr ? "örn: Milkshake & Smoothie" : "2nd Sub Category"}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                  value={selectedSubCategory2}
                  onChange={(e) => setSelectedSubCategory2(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Marka / Üretici" : "Brand"}
                </label>
                <input
                  type="text"
                  name="brand"
                  placeholder={isTr ? "örn: Knauf, Gap" : "Brand name"}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                  defaultValue={editingProduct?.brand || ""}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Ürün Tipi" : "Product Type"}
                </label>
                <select
                  name="product_type"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 appearance-none text-xs h-[42px] shadow-2xs"
                  defaultValue={editingProduct?.product_type || "product"}
                >
                  <option value="product">{isTr ? "Fiziksel Ürün (Stoklu)" : "Physical Product"}</option>
                  <option value="service">{isTr ? "Hizmet / Servis (Stoksuz)" : "Service / Labor"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Fiyatlandırma & Maliyetler (Soft Emerald Tint) */}
          <div className="p-4 bg-emerald-50/30 rounded-3xl border border-emerald-100/80 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                {isTr ? "Fiyatlandırma & Maliyet Yönetimi" : "Pricing & Cost Management"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Maliyet Fiyatı" : "Cost Price"}
                </label>
                <input
                  type="text"
                  name="cost_price"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                  defaultValue={editingProduct?.cost_price || ""}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Para Birimi" : "Currency"}
                </label>
                <select
                  name="cost_currency"
                  className="w-32 max-w-[120px] px-3 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 appearance-none text-xs h-[42px] shadow-2xs"
                  defaultValue={editingProduct?.cost_currency || branding?.default_currency || "TRY"}
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Satış Fiyatı *" : "Sales Price *"}
                </label>
                <input
                  type="text"
                  name="price"
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-black text-emerald-700 text-sm shadow-2xs"
                  defaultValue={editingProduct?.price || ""}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Eski Fiyat (Üstü Çizili)" : "Old Price"}
                </label>
                <input
                  type="text"
                  name="old_price"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                  defaultValue={editingProduct?.old_price || ""}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "2. Fiyat" : "2nd Price"}
                </label>
                <input
                  type="text"
                  name="price_2"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                  defaultValue={editingProduct?.price_2 || ""}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Para Birimi" : "Currency"}
                </label>
                <select
                  name="currency"
                  className="w-32 max-w-[120px] px-3 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 appearance-none text-xs h-[42px] shadow-2xs"
                  defaultValue={editingProduct?.currency || branding?.default_currency || "TRY"}
                >
                  <option value="TRY">TRY (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Varsayılan KDV Oranı" : "VAT Rate"}
                </label>
                <select
                  name="tax_rate"
                  className="w-32 max-w-[120px] px-3 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 appearance-none text-xs h-[42px] shadow-2xs"
                  defaultValue={editingProduct?.tax_rate !== undefined ? String(editingProduct.tax_rate) : "20"}
                >
                  <option value="20">%20</option>
                  <option value="10">%10</option>
                  <option value="1">%1</option>
                  <option value="0">%0</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION: Varyant Yönetimi & Kombinasyon Matrisi (Sektörel İzolasyonlu: ShopLP / HorecaLP) */}
          <div className="p-5 bg-indigo-50/40 rounded-3xl border border-indigo-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-indigo-200 pb-3 gap-2">
              <div>
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
                          name: isTr ? (isCafeRestaurant ? "Standart Boy / Porsiyon" : "Standart / Tek Ebat") : "Standard", 
                          price: editingProduct?.price || 0, 
                          stock_quantity: editingProduct?.stock_quantity || 10, 
                          barcode: "",
                          sku: `${editingProduct?.barcode || 'PRD'}-STD`,
                          variant_type: 'standard',
                          is_active: true
                        }]);
                      }
                    }}
                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="prod_has_variants" className="text-xs font-black text-indigo-950 uppercase tracking-wider cursor-pointer select-none flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    {isCafeRestaurant 
                      ? (isTr ? "Varyantlı / Boyutlu / Porsiyonlu Ürün" : "Variant / Portion Product") 
                      : (isTr ? "Varyantlı Ürün (Renk, Beden, Hafıza, Kumaş, Ebat vb.)" : "Variant Product (Color, Size, Capacity, Fabric)")}
                  </label>
                </div>
                <p className="text-[10px] text-indigo-900 font-bold mt-1 ml-7">
                  {isCafeRestaurant
                    ? (isTr ? "Yiyecek & İçecek için porsiyon, pişme, sos veya hamur kırılımları." : "Food & beverage portion, cook, sauce, dough breakdowns.")
                    : (isTr ? "EAV tabanlı dinamik nitelik matrisi: Tekstil, ayakkabı, elektronik, mobilya ve market için sınırsız kırılım." : "Dynamic EAV matrix for fashion, electronics, furniture, FMCG.")}
                </p>
              </div>
            </div>

            {hasVariants && (
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
            )}

            <input type="hidden" name="variants_data" value={JSON.stringify(variants)} />
          </div>

          {/* SECTION 4: Stok ve Lojistik Yönetimi (Soft Amber Tint) */}
          <div className="p-4 bg-amber-50/30 rounded-3xl border border-amber-100/80 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                {isTr ? "Stok & Kargo Profili" : "Stock & Shipping"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Birim *" : "Unit *"}
                </label>
                <select
                  name="unit"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 appearance-none text-xs h-[42px] shadow-2xs"
                  defaultValue={editingProduct?.unit || "Adet"}
                >
                  <option value="Adet">{isTr ? "Adet (pcs)" : "Pieces (pcs)"}</option>
                  <option value="Paket">{isTr ? "Paket (Pack)" : "Pack"}</option>
                  <option value="Kutu">{isTr ? "Kutu (Box)" : "Box"}</option>
                  <option value="Koli">{isTr ? "Koli (Carton)" : "Carton"}</option>
                  <option value="Çift">{isTr ? "Çift (Pair)" : "Pair"}</option>
                  <option value="Takım">{isTr ? "Takım / Set" : "Set"}</option>
                  <option value="Metre">{isTr ? "Metre (m)" : "Meter (m)"}</option>
                  <option value="m²">{isTr ? "Metrekare (m²)" : "Square Meter (m²)"}</option>
                  <option value="kg">{isTr ? "Kilogram (kg)" : "Kilogram (kg)"}</option>
                  <option value="gr">{isTr ? "Gram (gr)" : "Gram (g)"}</option>
                  <option value="L">{isTr ? "Litre (L)" : "Liter (L)"}</option>
                  <option value="ml">{isTr ? "Mililitre (ml)" : "Milliliter (ml)"}</option>
                  <option value="Rulo">{isTr ? "Rulo (Roll)" : "Roll"}</option>
                  <option value="Palet">{isTr ? "Palet (Pallet)" : "Pallet"}</option>
                  <option value="Demet">{isTr ? "Demet (Bundle)" : "Bundle"}</option>
                  <option value="Düzine">{isTr ? "Düzine (Dozen)" : "Dozen"}</option>
                  {isCafeRestaurant && <option value="Porsiyon">{isTr ? "Porsiyon" : "Portion"}</option>}
                  {isCafeRestaurant && <option value="Şişe">{isTr ? "Şişe (Bottle)" : "Bottle"}</option>}
                  {isCafeRestaurant && <option value="Kasa">{isTr ? "Kasa (Case)" : "Case"}</option>}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                    {isTr ? "Mevcut Stok" : "Stock Quantity"}
                  </label>
                  {hasVariants && (
                    <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      {isTr ? "Varyant Toplamı" : "Variant Total"}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  name="stock_quantity"
                  readOnly={hasVariants}
                  disabled={hasVariants}
                  placeholder="0"
                  className={`w-full px-4 py-2.5 border-2 rounded-2xl transition-all font-bold text-xs ${
                    hasVariants 
                      ? "bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed opacity-90 font-black" 
                      : "bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:ring-0 shadow-2xs"
                  }`}
                  value={hasVariants ? variants.reduce((acc, curr) => acc + (parseInt(curr.stock_quantity) || 0), 0) : undefined}
                  defaultValue={!hasVariants ? (editingProduct?.stock_quantity !== undefined ? String(editingProduct.stock_quantity) : "0") : undefined}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Kritik Stok" : "Min Stock Level"}
                </label>
                <input
                  type="number"
                  name="min_stock_level"
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                  defaultValue={editingProduct?.min_stock_level !== undefined ? String(editingProduct.min_stock_level) : "5"}
                />
              </div>

              {isCafeRestaurant && (
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                    {isTr ? "Birim Hacmi (ml/gr)" : "Volume per Unit (ml/gr)"}
                  </label>
                  <input
                    type="number"
                    name="volume_ml"
                    placeholder={isTr ? "örn: 700" : "e.g. 700"}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 text-xs shadow-2xs"
                    defaultValue={editingProduct?.volume_ml || ""}
                  />
                  <p className="text-[10px] text-slate-600 font-bold ml-1">
                    {isTr ? "Şişe/Kasa/Paket alımlarını ML/GR takip için." : "Required for tracking Bottle/Case purchases in ML/GR."}
                  </p>
                </div>
              )}

              <div className="space-y-1 sm:col-span-3">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Kargo Seçeneği / Kargo Profili" : "Shipping Profile"}
                </label>
                <div className="relative">
                  <select
                    name="shipping_profile_id"
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-bold text-slate-900 appearance-none text-xs h-[42px] shadow-2xs"
                    defaultValue={editingProduct?.shipping_profile_id || ""}
                  >
                    <option value="">{isTr ? "Varsayılan (Kategori / Alt Kategori veya Ücretsiz)" : "Default (Category / Sub Category or Free)"}</option>
                    {(branding?.shipping_profiles || []).map((profile: any) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name || (isTr ? "İsimsiz Profil" : "Unnamed Profile")} - {profile.cost} {profile.currency}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Görsel, Açıklama ve Etiketler */}
          <div className="p-4 bg-slate-50/80 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                {isTr ? "Görsel, Açıklama & Etiketler" : "Media, Description & Tags"}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Ürün Görseli (Canlı Fotoğraf veya URL)" : "Product Image"}
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-3 bg-white rounded-2xl border-2 border-slate-200 shadow-2xs">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs bg-cover bg-center">
                    {productImageUrl ? (
                      <img src={productImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">{isTr ? "Yok" : "Blank"}</span>
                    )}
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      name="image_url"
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 focus:ring-0 transition-all font-semibold text-xs text-slate-900"
                      value={productImageUrl}
                      onChange={(e) => setProductImageUrl(e.target.value)}
                    />
                    <div className="pt-0.5">
                      <MultiImageUploader 
                        onImagesUploaded={(urls) => {
                          if (urls && urls.length > 0) {
                            setProductImageUrl(urls[0]);
                          }
                        }} 
                        lang={lang} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Ürün Detaylı Açıklaması" : "Detailed Description"}
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder={isTr ? "Ürün teknik özellikleri ve detayları" : "Detailed specs"}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-semibold text-slate-900 text-xs shadow-2xs"
                  defaultValue={editingProduct?.description || ""}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider ml-1">
                  {isTr ? "Etiketler (Virgülle Ayırın)" : "Labels"}
                </label>
                <input
                  type="text"
                  name="labels"
                  placeholder={isTr ? "Örn: Kampanya, Fırsat, Yeni" : "e.g. Campaign, Deal, New"}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:ring-0 transition-all font-semibold text-slate-900 text-xs shadow-2xs"
                  defaultValue={
                    Array.isArray(editingProduct?.labels) 
                      ? editingProduct.labels.join(", ") 
                      : (typeof editingProduct?.labels === 'string' ? editingProduct.labels.replace(/[\[\]"]/g, '') : "")
                  }
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: Reçete / BOM ve Varyantlar (Horeca & Retail) */}
          {isCafeRestaurant && (
            <div className="p-4 bg-orange-50/40 rounded-3xl border border-orange-200/80 space-y-4">
              <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                <div>
                  <h4 className="text-[11px] font-black text-orange-950 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                    {isTr ? "Malzeme Yapısı (Reçete / BOM)" : "Bill of Materials (Recipe)"}
                  </h4>
                  <p className="text-[10px] text-orange-900 font-bold mt-0.5">
                    {isTr ? "Bu ürün satıldığında stoktan düşecek malzemeler." : "Ingredients deducted upon sale."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIngredientSelector(!showIngredientSelector)}
                  className="px-3 py-1.5 bg-orange-100 text-orange-900 rounded-xl hover:bg-orange-200 transition-all border border-orange-300 font-black text-[10px] uppercase flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isTr ? "Malzeme Ekle" : "Add Ingredient"}</span>
                </button>
              </div>

              {showIngredientSelector && (
                <div className="p-3 bg-white rounded-2xl border border-orange-300 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder={isTr ? "Malzeme ara..." : "Search ingredient..."}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                      value={ingredientSearch}
                      onChange={(e) => setIngredientSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {products
                      .filter(p => p.id !== editingProduct?.id && (p.name.toLowerCase().includes(ingredientSearch.toLowerCase()) || p.barcode?.toLowerCase().includes(ingredientSearch.toLowerCase())))
                      .slice(0, 10)
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
                          className="w-full text-left p-2 hover:bg-orange-50 rounded-lg text-[11px] font-bold text-slate-800 flex justify-between items-center cursor-pointer"
                        >
                          <span>{p.name} <span className="text-slate-500 font-medium">({p.barcode})</span></span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-200 rounded-md">{p.unit}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {recipeItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 bg-white border border-orange-200 rounded-xl shadow-2xs">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.ingredient_name}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.ingredient_unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-center focus:border-indigo-600 focus:ring-0"
                        value={item.amount}
                        onChange={(e) => {
                          const newItems = [...recipeItems];
                          newItems[idx].amount = parseFloat(e.target.value) || 0;
                          setRecipeItems(newItems);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRecipeItems(recipeItems.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-0 outline-none cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <input type="hidden" name="recipe_data" value={JSON.stringify(recipeItems)} />
            </div>
          )}

          {/* SECTION: HoReCaLP Besin Değeri, Alerjen ve Hazırlık Bilgileri */}
          {isCafeRestaurant && (
            <div className="p-5 bg-emerald-50/40 rounded-3xl border border-emerald-200/80 space-y-4">
              <div className="border-b border-emerald-200 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    {isTr ? "Besin Değeri, Kalori & Alerjen Bilgileri" : "Nutrition, Calories & Allergens"}
                  </h4>
                  <p className="text-[10px] text-emerald-900 font-bold mt-0.5">
                    {isTr ? "QR Dijital Menüde misafirlerinize gösterilecek sağlık ve porsiyon detayları." : "Health, calories, and portion details displayed in QR Digital Menu."}
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  {isTr ? "HoReCa Menü" : "HoReCa Menu"}
                </span>
              </div>

              {/* Kalori, Porsiyon, Hazırlık Süresi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-emerald-150">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                    {isTr ? "Enerji (Kalori - kcal)" : "Calories (kcal)"}
                  </label>
                  <input
                    type="number"
                    name="calories"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="örn: 320"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:border-emerald-600 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="bg-white p-3 rounded-2xl border border-emerald-150">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                    {isTr ? "Porsiyon Gramaj / Hacim" : "Portion Size / Weight"}
                  </label>
                  <input
                    type="text"
                    name="portion_size"
                    value={portionSize}
                    onChange={(e) => setPortionSize(e.target.value)}
                    placeholder={isTr ? "örn: 180 gr / 330 ml" : "e.g. 180 g / 330 ml"}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:border-emerald-600 focus:bg-white outline-none transition-all"
                  />
                </div>

                <div className="bg-white p-3 rounded-2xl border border-emerald-150">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                    {isTr ? "Ortalama Hazırlık (Dk)" : "Prep Time (Min)"}
                  </label>
                  <input
                    type="number"
                    name="prep_time_min"
                    value={prepTimeMin}
                    onChange={(e) => setPrepTimeMin(e.target.value)}
                    placeholder="örn: 15"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:border-emerald-600 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              {/* Alerjen Seçim Rozetleri */}
              <div className="bg-white p-3.5 rounded-2xl border border-emerald-150 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                    {isTr ? "Alerjen ve Özel Tercih Etiketleri" : "Allergen & Dietary Badges"}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {selectedAllergens.length} {isTr ? "Seçili" : "Selected"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: "gluten", labelTr: "Gluten", labelEn: "Gluten", icon: "🌾" },
                    { id: "lactose", labelTr: "Laktoz / Süt", labelEn: "Dairy / Lactose", icon: "🥛" },
                    { id: "nuts", labelTr: "Kuruyemiş / Fıstık", labelEn: "Nuts / Peanuts", icon: "🥜" },
                    { id: "egg", labelTr: "Yumurta", labelEn: "Egg", icon: "🥚" },
                    { id: "soy", labelTr: "Soya", labelEn: "Soy", icon: "🌱" },
                    { id: "seafood", labelTr: "Deniz Ürünü / Kabuklu", labelEn: "Seafood / Shellfish", icon: "🦐" },
                    { id: "fish", labelTr: "Balık", labelEn: "Fish", icon: "🐟" },
                    { id: "mustard", labelTr: "Hardal", labelEn: "Mustard", icon: "🌭" },
                    { id: "sesame", labelTr: "Susam", labelEn: "Sesame", icon: "🥯" },
                    { id: "spicy", labelTr: "Acı / Baharatlı", labelEn: "Spicy", icon: "🌶️" },
                    { id: "vegan", labelTr: "Vegan", labelEn: "Vegan", icon: "🥬" },
                    { id: "vegetarian", labelTr: "Vejetaryen", labelEn: "Vegetarian", icon: "🥗" },
                    { id: "sugar_free", labelTr: "Şekersiz", labelEn: "Sugar Free", icon: "🍃" },
                    { id: "pork_free", labelTr: "Domuz Ürünü İçermez (Helal)", labelEn: "No Pork (Halal)", icon: "✨" },
                  ].map((item) => {
                    const isSelected = selectedAllergens.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAllergens(selectedAllergens.filter(x => x !== item.id));
                          } else {
                            setSelectedAllergens([...selectedAllergens, item.id]);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{isTr ? item.labelTr : item.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <input type="hidden" name="allergens_data" value={JSON.stringify(selectedAllergens)} />
            </div>
          )}

          {/* Published Visibility Switches */}
          <div className="p-4 bg-slate-100 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_web_sale"
                id="prod_is_web_sale"
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                defaultChecked={editingProduct?.is_web_sale !== false}
              />
              <label htmlFor="prod_is_web_sale" className="text-xs font-black text-slate-900 cursor-pointer select-none">
                {isTr ? "Bu Ürün Mağaza Web Sitesinde Vitrinde Yayınlansın" : "Publish product in public store showcase page"}
              </label>
            </div>

            {isCafeRestaurant && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_bestseller"
                  id="prod_is_bestseller"
                  className="h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                  defaultChecked={!!editingProduct?.is_bestseller}
                />
                <label htmlFor="prod_is_bestseller" className="text-xs font-black text-slate-900 cursor-pointer select-none flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
                  <span>
                    {isTr ? "En Çok Satan Ürün (Dijital Menü Öne Çıkarılan)" : "Bestseller Product"}
                  </span>
                </label>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_sellable"
                id="prod_is_sellable"
                className="h-5 w-5 text-amber-500 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                defaultChecked={editingProduct?.is_sellable !== false}
              />
              <label htmlFor="prod_is_sellable" className="text-xs font-black text-slate-900 cursor-pointer select-none">
                {isTr ? "Bu ürün satışa açıktır (Mamül)" : "This product is available for sale (Finished Good)"}
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowProductModal(false);
                setEditingProduct(null);
              }}
              className="flex-1 py-3.5 bg-slate-200 text-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all cursor-pointer border-0"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-[2] py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer border-0"
            >
              {isTr ? "Ürünü Kaydet" : "Save Product Record"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
