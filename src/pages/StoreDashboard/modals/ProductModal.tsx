import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Plus, Trash2, Search } from "lucide-react";
import { MultiImageUploader } from "../../../components/MultiImageUploader";
import { api } from "../../../services/api";

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
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [isNewSubCategoryMode, setIsNewSubCategoryMode] = useState(false);
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientSelector, setShowIngredientSelector] = useState(false);

  const isCafeRestaurant = branding?.store_type === 'cafe_restaurant' || branding?.page_layout_settings?.sector === 'cafe_restaurant';

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
      if (p.category) {
        cats.add(p.category.trim());
      }
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
          if (!map.has(cat)) {
            map.set(cat, new Set());
          }
          map.get(cat)!.add(sub);
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Barkod / Ürün Kodu *" : "Barcode / SKU *"}
              </label>
              <input
                type="text"
                name="barcode"
                required
                placeholder={isTr ? "Barkod girin veya okutun..." : "SKO code..."}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
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
                {isTr ? "Birim" : "Unit"}
              </label>
              <select
                name="unit"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-700 appearance-none text-xs h-[50px]"
                defaultValue={editingProduct?.unit || "Adet"}
              >
                <option value="Adet">{isTr ? "Adet (pcs)" : "Pieces"}</option>
                <option value="Şişe">{isTr ? "Şişe (Bottle)" : "Bottle"}</option>
                <option value="Kasa">{isTr ? "Kasa (Case)" : "Case"}</option>
                <option value="ml">ml</option>
                <option value="cl">cl</option>
                <option value="L">{isTr ? "Litre (L)" : "Liter"}</option>
                <option value="kg">kg</option>
                <option value="gr">gr</option>
                <option value="Paket">{isTr ? "Paket (Pack)" : "Pack"}</option>
                <option value="Koli">{isTr ? "Koli (Box)" : "Box"}</option>
                <option value="Mt">{isTr ? "Metre (Mt)" : "Meter"}</option>
                <option value="Porsiyon">{isTr ? "Porsiyon" : "Portion"}</option>
              </select>
            </div>

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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">
                {isTr ? "Mevcut Stok Miktarı" : "Stock Quantity"}
              </label>
              <input
                type="number"
                name="stock_quantity"
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:ring-0 transition-all font-bold text-slate-900"
                defaultValue={editingProduct?.stock_quantity !== undefined ? String(editingProduct.stock_quantity) : "0"}
              />
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

          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 col-span-2">
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
