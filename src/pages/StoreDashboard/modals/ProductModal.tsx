import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Plus, Trash2, Search, Flame, Sparkles, Camera, Upload, Palette } from "lucide-react";
import { MultiImageUploader } from "../../../components/MultiImageUploader";
import { api } from "../../../services/api";
import { compressImageToWebP } from "../../../utils/imageUtils";

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
  const [activeVariantIngredientSelector, setActiveVariantIngredientSelector] = useState<string | null>(null);
  const [variantIngredientSearch, setVariantIngredientSearch] = useState("");
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);

  // ShopLP Retail Variant Matrix States
  const [variantBarcodeMode, setVariantBarcodeMode] = useState<'individual' | 'shared'>('individual');
  const [showMatrixGenerator, setShowMatrixGenerator] = useState(false);
  const [matrixColors, setMatrixColors] = useState("");
  const [matrixSizes, setMatrixSizes] = useState("");

  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';

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
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <h3 className="text-lg font-black uppercase tracking-wider">
              {editingProduct
                ? isTr
                  ? "Ürünü Düzenle"
                  : "Edit Product"
                : isTr
                ? "Yeni Ürün Kaydet"
                : "Create New Product"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
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
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white border-0 outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            if (handleAddProduct) handleAddProduct(e);
          }}
          className="flex-1 overflow-y-auto p-8 space-y-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {isTr ? (hasVariants ? "Barkod / Ürün Kodu (Varyantlı Ürün)" : "Barkod / Ürün Kodu *") : (hasVariants ? "Barcode / SKU (Has Variants)" : "Barcode / SKU *")}
                </label>
                {hasVariants && (
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                    {isTr ? "Varyantlar Üzerinden Takip Edilir" : "Tracked via Variants"}
                  </span>
                )}
              </div>
              <input
                type="text"
                name="barcode"
                required={!hasVariants}
                disabled={hasVariants}
                placeholder={hasVariants ? (isTr ? "Varyantlar altındaki kendi barkod/SKU'su geçerlidir" : "Tracked via individual variants") : (isTr ? "Barkod girin veya okutun..." : "SKU code...")}
                className={`w-full px-4 py-3 border-2 rounded-2xl transition-all font-bold ${
                  hasVariants 
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-80" 
                    : "bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-500 focus:ring-0"
                }`}
                defaultValue={editingProduct?.barcode || ""}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Ürün / Hizmet Adı *" : "Product / Service Name *"}
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder={isTr ? "örn: Alçıpan Profili" : "Product name"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-extrabold text-slate-900"
                defaultValue={editingProduct?.name || ""}
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-between">
              <div className="flex justify-between items-center ml-1 mb-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                    className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest cursor-pointer border-0 outline-none"
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
                  placeholder={isTr ? "örn: İnşaat, Yapı Çelikleri" : "Category"}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryTextChange(e.target.value)}
                />
              ) : (
                <div className="relative">
                  <select
                    name="category"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none h-[50px] text-xs"
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

            <div className="space-y-1.5 flex flex-col justify-between">
              <div className="flex justify-between items-center ml-1 mb-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
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
                    className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest cursor-pointer border-0 outline-none"
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
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                />
              ) : (
                <div className="relative">
                  <select
                    name="sub_category"
                    value={selectedSubCategory}
                    onChange={(e) => setSelectedSubCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none h-[50px] text-xs"
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

            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "2. Kategori (İsteğe Bağlı)" : "2nd Category (Optional)"}
              </label>
              <input
                type="text"
                name="category_2"
                placeholder={isTr ? "örn: Soğuk İçecekler" : "2nd Category"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                value={selectedCategory2}
                onChange={(e) => setSelectedCategory2(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "2. Alt Kategori (İsteğe Bağlı)" : "2nd Sub Category (Optional)"}
              </label>
              <input
                type="text"
                name="sub_category_2"
                placeholder={isTr ? "örn: Milkshake & Smoothie" : "2nd Sub Category"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                value={selectedSubCategory2}
                onChange={(e) => setSelectedSubCategory2(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Marka / Üretici" : "Brand"}
              </label>
              <input
                type="text"
                name="brand"
                placeholder={isTr ? "örn: Knauf, Gap" : "Brand name"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.brand || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Ürün Tipi" : "Product Type"}
              </label>
              <select
                name="product_type"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.product_type || "product"}
              >
                <option value="product">{isTr ? "Fiziksel Ürün (Stoklu)" : "Physical Product"}</option>
                <option value="service">{isTr ? "Hizmet / Servis (Stoksuz)" : "Service / Labor"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Birim *" : "Unit *"}
              </label>
              <select
                name="unit"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
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

            {isCafeRestaurant && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                  {isTr ? "Birim Hacmi (ml/gr)" : "Volume per Unit (ml/gr)"}
                </label>
                <input
                  type="number"
                  name="volume_ml"
                  placeholder={isTr ? "örn: 700" : "e.g. 700"}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700"
                  defaultValue={editingProduct?.volume_ml || ""}
                />
                <p className="text-[9px] text-slate-500 font-bold ml-1">
                  {isTr ? "Şişe/Kasa/Paket alımlarını stokta ML/GR bazlı takip etmek için gereklidir." : "Required for tracking Bottle/Case/Pack purchases in ML/GR."}
                </p>
              </div>
            )}

            {isCafeRestaurant && (
              <div className="col-span-2 space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                      {isTr ? "Malzeme Yapısı (Reçete / BOM)" : "Bill of Materials (Recipe)"}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {isTr ? "Bu ürün satıldığında stoktan düşecek malzemeleri tanımlayın." : "Define ingredients to be deducted from stock upon sale."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIngredientSelector(!showIngredientSelector)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all border-0 outline-none flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase">{isTr ? "Malzeme Ekle" : "Add Ingredient"}</span>
                  </button>
                </div>

                {showIngredientSelector && (
                  <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={isTr ? "Malzeme ara (Ürün listesinden)..." : "Search ingredient..."}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        value={ingredientSearch}
                        onChange={(e) => setIngredientSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
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
                            className="w-full text-left p-2 hover:bg-indigo-50 rounded-lg text-[11px] font-bold text-slate-700 flex justify-between items-center"
                          >
                            <span>{p.name} <span className="text-slate-400 font-medium">({p.barcode})</span></span>
                            <span className="text-[9px] px-2 py-0.5 bg-slate-200 rounded-md">{p.unit}</span>
                          </button>
                        ))}
                      {products.length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-2">{isTr ? "Malzeme bulunamadı." : "No ingredients found."}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {recipeItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.ingredient_name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.ingredient_unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-center focus:border-indigo-500 focus:ring-0"
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
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border-0 outline-none"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {recipeItems.length === 0 && !showIngredientSelector && (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-[11px] font-bold text-slate-400">
                        {isTr ? "Henüz malzeme eklenmedi." : "No ingredients added yet."}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Hidden input for form submission if we don't change handleAddProduct */}
                <input type="hidden" name="recipe_data" value={JSON.stringify(recipeItems)} />
              </div>
            )}

            {/* Product Variants Management */}
            <div className="col-span-2 space-y-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 p-3.5 sm:p-4 rounded-2xl border border-indigo-100 overflow-hidden">
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    id="has_variants_toggle"
                    checked={hasVariants}
                    onChange={(e) => {
                      setHasVariants(e.target.checked);
                      if (e.target.checked && variants.length === 0) {
                        if (isCafeRestaurant) {
                          setVariants([
                            { id: 'var_' + Date.now() + '_1', name: 'BANANA', price: '', recipe_items: [] },
                            { id: 'var_' + Date.now() + '_2', name: 'CHOCOLATE', price: '', recipe_items: [] }
                          ]);
                        } else {
                          setVariants([
                            { id: 'var_' + Date.now() + '_1', name: 'Kırmızı / S', color_name: 'Kırmızı', color_code: '#ef4444', size: 'S', barcode: '', sku: '', stock_quantity: '10', price: '', image_url: '' },
                            { id: 'var_' + Date.now() + '_2', name: 'Siyah / M', color_name: 'Siyah', color_code: '#000000', size: 'M', barcode: '', sku: '', stock_quantity: '15', price: '', image_url: '' }
                          ]);
                        }
                        scrollToLatestVariant();
                      }
                    }}
                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="has_variants_toggle" className="text-xs font-black text-slate-800 cursor-pointer select-none min-w-0 leading-tight">
                    {isTr ? "Bu Ürünün Alt Kırılımları (Varyantları) Var" : "Product Has Variants / Options"}
                    <span className="block text-[10px] font-medium text-slate-500 mt-0.5 truncate">
                      {isCafeRestaurant 
                        ? (isTr 
                            ? "Örn: Milkshake (BANANA, CHOCOLATE) - Reçete takibi." 
                            : "e.g. Milkshake (Banana, Chocolate) - Recipe tracking.")
                        : (isTr
                            ? "Örn: T-Shirt (Kırmızı / S, Siyah / M) - Bağımsız stok, renk, beden yönetimi."
                            : "e.g. T-Shirt (Red / S, Black / M) - Independent stock & variant tracking.")}
                    </span>
                  </label>
                </div>
                {hasVariants && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {!isCafeRestaurant && (
                      <button
                        type="button"
                        onClick={() => setShowMatrixGenerator(!showMatrixGenerator)}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-indigo-100/80 text-indigo-800 border border-indigo-200/80 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-200 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                        title={isTr ? "Hızlı Matris Oluşturucu" : "Matrix Generator"}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{isTr ? "Hızlı Matris" : "Matrix"}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newId = 'var_' + Date.now();
                        const newVar = isCafeRestaurant
                          ? { id: newId, name: '', price: '', recipe_items: [], stock_quantity: '0' }
                          : { id: newId, name: '', color_name: '', color_code: '#3b82f6', size: '', barcode: '', sku: '', stock_quantity: '10', price: '', image_url: '' };
                        setVariants((prev) => [...prev, newVar]);
                        scrollToLatestVariant(newId);
                      }}
                      className="px-3 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                      title={isTr ? "Varyant Ekle" : "Add Variant"}
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>{isTr ? "Varyant Ekle" : "Add Variant"}</span>
                    </button>
                  </div>
                )}
              </div>

              {hasVariants && !isCafeRestaurant && showMatrixGenerator && (
                <div className="p-4 bg-indigo-50/60 rounded-2xl border-2 border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      {isTr ? "Hızlı Renk & Beden Varyant Matrisi Oluşturucu" : "Quick Color & Size Matrix Generator"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowMatrixGenerator(false)}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                        {isTr ? "Renkler (Virgülle ayırın)" : "Colors (comma separated)"}
                      </label>
                      <input
                        type="text"
                        placeholder={isTr ? "Örn: Kırmızı, Siyah, Mavi, Beyaz" : "e.g. Red, Black, Blue"}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        value={matrixColors}
                        onChange={(e) => setMatrixColors(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 uppercase">
                        {isTr ? "Bedenler / Ölçüler (Virgülle ayırın)" : "Sizes (comma separated)"}
                      </label>
                      <input
                        type="text"
                        placeholder={isTr ? "Örn: S, M, L, XL veya 38, 39, 40" : "e.g. S, M, L, XL or 38, 39, 40"}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        value={matrixSizes}
                        onChange={(e) => setMatrixSizes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const colors = matrixColors.split(',').map(s => s.trim()).filter(Boolean);
                        const sizes = matrixSizes.split(',').map(s => s.trim()).filter(Boolean);
                        const generated: any[] = [];

                        if (colors.length > 0 && sizes.length > 0) {
                          colors.forEach((c) => {
                            sizes.forEach((s) => {
                              generated.push({
                                id: 'var_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                                name: `${c} / ${s}`,
                                color_name: c,
                                color_code: '#3b82f6',
                                size: s,
                                barcode: '',
                                sku: '',
                                stock_quantity: '10',
                                price: '',
                                image_url: ''
                              });
                            });
                          });
                        } else if (colors.length > 0) {
                          colors.forEach((c) => {
                            generated.push({
                              id: 'var_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                              name: c,
                              color_name: c,
                              color_code: '#3b82f6',
                              barcode: '',
                              sku: '',
                              stock_quantity: '10',
                              price: '',
                              image_url: ''
                            });
                          });
                        } else if (sizes.length > 0) {
                          sizes.forEach((s) => {
                            generated.push({
                              id: 'var_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                              name: s,
                              size: s,
                              barcode: '',
                              sku: '',
                              stock_quantity: '10',
                              price: '',
                              image_url: ''
                            });
                          });
                        }

                        if (generated.length > 0) {
                          const lastGenId = generated[generated.length - 1].id;
                          setVariants((prev) => [...prev, ...generated]);
                          setShowMatrixGenerator(false);
                          setMatrixColors("");
                          setMatrixSizes("");
                          scrollToLatestVariant(lastGenId);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm cursor-pointer"
                    >
                      {isTr ? "Varyant Kombinasyonlarını Oluştur" : "Generate Combinations"}
                    </button>
                  </div>
                </div>
              )}

              {hasVariants && (
                <div className="space-y-4">
                  {variants.map((v, vIdx) => {
                    if (isCafeRestaurant) {
                      let totalVarCost = 0;
                      (v.recipe_items || []).forEach((ri: any) => {
                        const ingProd = products.find(p => String(p.id) === String(ri.ingredient_id));
                        if (ingProd) {
                          const ingCost = Number(ingProd.cost_price) || 0;
                          const volMl = Number(ingProd.volume_ml) || 1;
                          totalVarCost += (ingCost / (volMl > 0 ? volMl : 1)) * (Number(ri.amount) || 0);
                        }
                      });

                      return (
                        <div key={v.id || vIdx} id={`variant_card_${v.id || vIdx}`} className="p-4 bg-slate-50/80 rounded-2xl border-2 border-indigo-100 space-y-3 relative">
                          <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200">
                            <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              Varyant #{vIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setVariants(variants.filter((_, idx) => idx !== vIdx));
                              }}
                              className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isTr ? "Varyantı Sil" : "Remove"}</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                {isTr ? "Varyant / Çeşit Adı *" : "Variant Name *"}
                              </label>
                              <input
                                type="text"
                                required
                                placeholder={isTr ? "örn: BANANA" : "Variant name"}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                                value={v.name || ""}
                                onChange={(e) => {
                                  const newVars = [...variants];
                                  newVars[vIdx].name = e.target.value;
                                  setVariants(newVars);
                                }}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                {isTr ? "Varyant Fiyatı (₺)" : "Variant Price"}
                              </label>
                              <input
                                type="text"
                                placeholder={isTr ? "Boş ise ana ürün fiyatı" : "Default base price"}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                                value={v.price !== undefined ? v.price : ""}
                                onChange={(e) => {
                                  const newVars = [...variants];
                                  newVars[vIdx].price = e.target.value;
                                  setVariants(newVars);
                                }}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                {isTr ? "Stok Adedi" : "Stock Quantity"}
                              </label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                                value={v.stock_quantity !== undefined ? v.stock_quantity : "0"}
                                onChange={(e) => {
                                  const newVars = [...variants];
                                  newVars[vIdx].stock_quantity = e.target.value;
                                  setVariants(newVars);
                                }}
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                {isTr ? "Hesaplanan Reçete Maliyeti" : "Calculated Cost"}
                              </label>
                              <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700">
                                {totalVarCost > 0 ? `${totalVarCost.toFixed(2)} ₺` : (isTr ? "0.00 ₺ (Reçetesiz)" : "0.00")}
                              </div>
                            </div>
                          </div>

                          {/* Variant Ingredients / Semi-finished Materials */}
                          <div className="pt-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                {isTr ? "Varyant Yarı Mamül & Malzemeleri (Reçete)" : "Variant Ingredients"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveVariantIngredientSelector(activeVariantIngredientSelector === v.id ? null : v.id);
                                  setVariantIngredientSearch("");
                                }}
                                className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider border-0 bg-transparent cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>{isTr ? "+ Reçeteye Malzeme Ekle" : "+ Add Ingredient"}</span>
                              </button>
                            </div>

                            {activeVariantIngredientSelector === v.id && (
                              <div className="p-3 bg-white rounded-xl border border-indigo-200 space-y-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder={isTr ? "Yarı mamül / malzeme ara..." : "Search ingredient..."}
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                                    value={variantIngredientSearch}
                                    onChange={(e) => setVariantIngredientSearch(e.target.value)}
                                  />
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {products
                                    .filter(p => p.id !== editingProduct?.id && (p.name.toLowerCase().includes(variantIngredientSearch.toLowerCase()) || (p.barcode && p.barcode.toLowerCase().includes(variantIngredientSearch.toLowerCase()))))
                                    .slice(0, 10)
                                    .map(p => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          const newVars = [...variants];
                                          const curRecItems = newVars[vIdx].recipe_items || [];
                                          if (!curRecItems.find((ri: any) => String(ri.ingredient_id) === String(p.id))) {
                                            newVars[vIdx].recipe_items = [
                                              ...curRecItems,
                                              {
                                                ingredient_id: p.id,
                                                ingredient_name: p.name,
                                                amount: 1,
                                                ingredient_unit: p.unit || 'ml'
                                              }
                                            ];
                                            setVariants(newVars);
                                          }
                                          setActiveVariantIngredientSelector(null);
                                          setVariantIngredientSearch("");
                                        }}
                                        className="w-full text-left p-1.5 hover:bg-indigo-50 rounded text-[10px] font-bold text-slate-700 flex justify-between items-center"
                                      >
                                        <span>{p.name}</span>
                                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded font-medium">{p.unit || 'ml'}</span>
                                      </button>
                                    ))}
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              {(v.recipe_items || []).map((ri: any, riIdx: number) => (
                                <div key={riIdx} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs font-bold">
                                  <span className="flex-1 text-slate-800 truncate">{ri.ingredient_name}</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-16 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-center font-black text-slate-900"
                                    value={ri.amount}
                                    onChange={(e) => {
                                      const newVars = [...variants];
                                      newVars[vIdx].recipe_items[riIdx].amount = parseFloat(e.target.value) || 0;
                                      setVariants(newVars);
                                    }}
                                  />
                                  <span className="text-[10px] font-bold text-slate-500 w-8">{ri.ingredient_unit}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVars = [...variants];
                                      newVars[vIdx].recipe_items = newVars[vIdx].recipe_items.filter((_: any, idx: number) => idx !== riIdx);
                                      setVariants(newVars);
                                    }}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded border-0 outline-none"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {(!v.recipe_items || v.recipe_items.length === 0) && (
                                <p className="text-[10px] text-slate-400 italic py-1">
                                  {isTr ? "Bu varyant için henüz yarı mamül / malzeme reçetesi eklenmedi." : "No recipe ingredients added for this variant."}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ShopLP Retail Product Variant Card
                    return (
                      <div key={v.id || vIdx} id={`variant_card_${v.id || vIdx}`} className="p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-xs space-y-3 relative">
                        <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                              Varyant #{vIdx + 1}: {v.name || (isTr ? "İsimsiz" : "Unnamed")}
                            </span>
                            {v.image_url && (
                              <div className="w-6 h-6 rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                                <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setVariants(variants.filter((_, idx) => idx !== vIdx));
                            }}
                            className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isTr ? "Sil" : "Remove"}</span>
                          </button>
                        </div>

                        {/* Row 1: Name, Color Name, Prominent Color Picker, Size */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="space-y-1 sm:col-span-4">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                              {isTr ? "Varyant Adı *" : "Variant Name *"}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={isTr ? "örn: Kırmızı / M" : "e.g. Red / M"}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white transition-all"
                              value={v.name || ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].name = e.target.value;
                                setVariants(newVars);
                              }}
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                              {isTr ? "Renk Adı" : "Color Name"}
                            </label>
                            <input
                              type="text"
                              placeholder={isTr ? "örn: Kırmızı" : "e.g. Red"}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white transition-all"
                              value={v.color_name || ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].color_name = e.target.value;
                                setVariants(newVars);
                              }}
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                              {isTr ? "Renk Kodu (Palet)" : "Color Code"}
                            </label>
                            <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-300 transition-all">
                              <div
                                className="w-7 h-7 rounded-lg shrink-0 border border-black/15 shadow-2xs flex items-center justify-center relative overflow-hidden cursor-pointer bg-slate-200"
                                style={{ backgroundColor: v.color_code || "#3b82f6" }}
                                title={isTr ? "Renk Paletini Aç" : "Open Color Picker"}
                              >
                                <Palette className="w-3.5 h-3.5 text-white drop-shadow-md pointer-events-none" />
                                <input
                                  type="color"
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  value={v.color_code || "#3b82f6"}
                                  onChange={(e) => {
                                    const newVars = [...variants];
                                    newVars[vIdx].color_code = e.target.value;
                                    setVariants(newVars);
                                  }}
                                />
                              </div>
                              <input
                                type="text"
                                placeholder="#3b82f6"
                                className="w-full px-1.5 py-1 bg-transparent border-0 text-[11px] font-mono font-bold text-slate-800 uppercase focus:ring-0"
                                value={v.color_code || ""}
                                onChange={(e) => {
                                  const newVars = [...variants];
                                  newVars[vIdx].color_code = e.target.value;
                                  setVariants(newVars);
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                              {isTr ? "Beden / Ölçü" : "Size / Spec"}
                            </label>
                            <input
                              type="text"
                              placeholder={isTr ? "örn: M, 42" : "e.g. M, 42"}
                              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white transition-all"
                              value={v.size || ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].size = e.target.value;
                                setVariants(newVars);
                              }}
                            />
                          </div>
                        </div>

                        {/* Row 2: Barcode, SKU, Stock, Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="space-y-1 sm:col-span-4">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                              {isTr ? "Varyant Barkodu" : "Variant Barcode"}
                            </label>
                            <input
                              type="text"
                              placeholder={isTr ? "Barkod no" : "Barcode"}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white transition-all"
                              value={v.barcode || ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].barcode = e.target.value;
                                setVariants(newVars);
                              }}
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                              {isTr ? "Stok Kodu (SKU)" : "SKU"}
                            </label>
                            <input
                              type="text"
                              placeholder={isTr ? "örn: TSH-RED-M" : "e.g. TSH-RED-M"}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white transition-all"
                              value={v.sku || ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].sku = e.target.value;
                                setVariants(newVars);
                              }}
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                              {isTr ? "Stok Adedi *" : "Stock Qty *"}
                            </label>
                            <input
                              type="number"
                              placeholder="10"
                              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white transition-all"
                              value={v.stock_quantity !== undefined ? v.stock_quantity : ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].stock_quantity = e.target.value;
                                setVariants(newVars);
                              }}
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                              {isTr ? "Satış Fiyatı (₺)" : "Price"}
                            </label>
                            <input
                              type="text"
                              placeholder={isTr ? "Boş ise ana fiyat" : "Default base price"}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 focus:bg-white transition-all"
                              value={v.price !== undefined ? v.price : ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].price = e.target.value;
                                setVariants(newVars);
                              }}
                            />
                          </div>
                        </div>

                        {/* Row 3: Image URL & Upload / Camera minimal buttons */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                            {isTr ? "Varyanta / Renge Özel Görsel URL'si" : "Variant Image URL"}
                          </label>
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                            {v.image_url ? (
                              <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-2xs relative group">
                                <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVars = [...variants];
                                    newVars[vIdx].image_url = "";
                                    setVariants(newVars);
                                  }}
                                  className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                  title={isTr ? "Görseli Kaldır" : "Remove Image"}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : null}

                            <input
                              type="text"
                              placeholder={isTr ? "https://... (Varyanta özel fotoğraf linki)" : "https://... (Variant photo link)"}
                              className="flex-1 min-w-[140px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white transition-all"
                              value={v.image_url || ""}
                              onChange={(e) => {
                                const newVars = [...variants];
                                newVars[vIdx].image_url = e.target.value;
                                setVariants(newVars);
                              }}
                            />

                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-200/60 shadow-2xs" title={isTr ? "Dosyadan Yükle" : "Upload File"}>
                                <Upload className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[11px] font-black uppercase tracking-tight">{isTr ? "Dosya" : "File"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleVariantImageUpload(vIdx, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>

                              <label className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-200/60 shadow-2xs" title={isTr ? "Fotoğraf Çek" : "Take Photo"}>
                                <Camera className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-[11px] font-black uppercase tracking-tight">{isTr ? "Kamera" : "Camera"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleVariantImageUpload(vIdx, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <input type="hidden" name="has_variants" value={hasVariants ? "true" : "false"} />
              <input type="hidden" name="variants_data" value={JSON.stringify(variants)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Maliyet Fiyatı" : "Cost Price"}
              </label>
              <input
                type="text"
                name="cost_price"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.cost_price || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Maliyet Para Birimi" : "Cost Currency"}
              </label>
              <select
                name="cost_currency"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.cost_currency || branding?.default_currency || "TRY"}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Satış Fiyatı *" : "Sales Price *"}
              </label>
              <input
                type="text"
                name="price"
                required
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-black text-slate-900"
                defaultValue={editingProduct?.price || ""}
              />
            </div>

            <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Eski Fiyat (Üstü Çizili Fiyat)" : "Old Price (Strikethrough)"}
              </label>
              <input
                type="text"
                name="old_price"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.old_price || ""}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Alternatif Satış Fiyatı (Nakit Fiyatı vb)" : "Backup Sales Price"}
              </label>
              <input
                type="text"
                name="price_2"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.price_2 || ""}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Satış Para Birimi" : "Sales Price Currency"}
              </label>
              <select
                name="currency"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.currency || branding?.default_currency || "TRY"}
              >
                <option value="TRY">TRY (₺)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Varsayılan KDV %" : "VAT %"}
              </label>
              <select
                name="tax_rate"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.tax_rate !== undefined ? String(editingProduct.tax_rate) : "20"}
              >
                <option value="20">%20</option>
                <option value="10">%10</option>
                <option value="1">%1</option>
                <option value="0">%0 (KDV Muaf)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {isTr ? "Mevcut Stok Miktarı" : "Stock Quantity"}
                </label>
                {hasVariants && (
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
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
                className={`w-full px-4 py-3 border-2 rounded-2xl transition-all font-bold ${
                  hasVariants 
                    ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed opacity-90 font-black" 
                    : "bg-slate-50 border-slate-100 text-slate-900 focus:border-indigo-500 focus:ring-0"
                }`}
                value={hasVariants ? variants.reduce((acc, curr) => acc + (parseInt(curr.stock_quantity) || 0), 0) : undefined}
                defaultValue={!hasVariants ? (editingProduct?.stock_quantity !== undefined ? String(editingProduct.stock_quantity) : "0") : undefined}
              />
              {hasVariants && (
                <p className="text-[9px] text-indigo-600 font-bold ml-1">
                  {isTr 
                    ? `Varyant stok adetleri toplamı (${variants.reduce((acc, curr) => acc + (parseInt(curr.stock_quantity) || 0), 0)} adet) otomatik geçerlidir.` 
                    : `Total variant stock (${variants.reduce((acc, curr) => acc + (parseInt(curr.stock_quantity) || 0), 0)} pcs) applied.`}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Kritik Stok Seviyesi" : "Min Stock Level"}
              </label>
              <input
                type="number"
                name="min_stock_level"
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.min_stock_level !== undefined ? String(editingProduct.min_stock_level) : "5"}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Kargo Seçeneği / Kargo Profili (Ürün Özelinde)" : "Shipping Profile"}
              </label>
              <div className="relative">
                <select
                  name="shipping_profile_id"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
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

            <div className="space-y-1.5 col-span-2 bg-slate-50 p-4 rounded-3xl border border-slate-150">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                {isTr ? "Ürün Görseli (Canlı Fotoğraf veya URL)" : "Product Image (Live Photo or URL)"}
              </label>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm bg-cover bg-center">
                  {productImageUrl ? (
                    <img src={productImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">{isTr ? "Görsel Yok" : "Blank"}</span>
                  )}
                </div>
                
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="text"
                    name="image_url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-xs text-slate-750"
                    value={productImageUrl}
                    onChange={(e) => setProductImageUrl(e.target.value)}
                  />
                  
                  <div className="pt-1">
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

            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Ürün Detaylı Açıklaması" : "Detailed Description"}
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder={isTr ? "Ürün teknik özellikleri ve detayları" : "Detailed specs"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-800"
                defaultValue={editingProduct?.description || ""}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Etiketler (Virgülle Ayırın)" : "Labels (Comma separated)"}
              </label>
              <input
                type="text"
                name="labels"
                placeholder={isTr ? "Örn: Kampanya, Fırsat, Yeni" : "e.g. Campaign, Deal, New"}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-semibold text-slate-800"
                defaultValue={
                  Array.isArray(editingProduct?.labels) 
                    ? editingProduct.labels.join(", ") 
                    : (typeof editingProduct?.labels === 'string' ? editingProduct.labels.replace(/[\[\]"]/g, '') : "")
                }
              />
              <p className="text-[10px] text-slate-500 font-medium ml-1">
                {isTr ? "Haftanın fırsatları bölümünde çıkması için 'Kampanya' veya 'Fırsat' ekleyin." : "Add 'Kampanya' or 'Fırsat' to show in Deals of the Week."}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 col-span-2">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <input
                type="checkbox"
                name="is_web_sale"
                id="prod_is_web_sale"
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                defaultChecked={editingProduct?.is_web_sale !== false}
              />
              <label htmlFor="prod_is_web_sale" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                {isTr ? "Bu Ürün Mağaza Web Sitesinde Vitrinde Yayınlansın" : "Publish product in public store showcase page"}
              </label>
            </div>

            {isCafeRestaurant && (
              <div className="flex items-center gap-3 bg-orange-50/60 p-4 rounded-2xl border border-orange-200/60">
                <input
                  type="checkbox"
                  name="is_bestseller"
                  id="prod_is_bestseller"
                  className="h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                  defaultChecked={!!editingProduct?.is_bestseller}
                />
                <label htmlFor="prod_is_bestseller" className="text-xs font-bold text-slate-800 cursor-pointer select-none flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
                  <span>
                    {isTr ? "En Çok Satan Ürün (Dijital Menü 'En Çok Satanlar' Listesinde Öne Çıkarılsın)" : "Bestseller Product (Highlight in Digital Menu 'Best Sellers' list)"}
                  </span>
                </label>
              </div>
            )}
            
            <div className="flex items-center gap-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
              <input
                type="checkbox"
                name="is_sellable"
                id="prod_is_sellable"
                className="h-5 w-5 text-amber-500 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                defaultChecked={editingProduct?.is_sellable !== false}
              />
              <label htmlFor="prod_is_sellable" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                {isTr ? "Bu ürün satışa açıktır (Mamül)" : "This product is available for sale (Finished Good)"}
                <span className="block text-[10px] font-medium text-slate-500 mt-1">
                  {isTr ? "Eğer bu sadece bir malzeme/yarı mamül ise (örn. Sandviç Ekmeği, 1L Votka) bu işareti kaldırın. Böylece sadece reçetelerde ve stoklarda görünür, satış ekranlarında (POS) görünmez." : "Uncheck this if it's only a raw material (e.g. Sandwich Bread). It will only be visible in inventory and recipes, not on the POS screen."}
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowProductModal(false);
                setEditingProduct(null);
              }}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {isTr ? "Ürünü Kaydet" : "Save Product Record"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
