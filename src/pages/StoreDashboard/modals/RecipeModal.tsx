import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Sparkles, Loader } from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";

interface RecipeModalProps {
  product: any;
  products: any[];
  onClose: () => void;
  lang: string;
}

export const RecipeModal = ({ product, products, onClose, lang }: RecipeModalProps) => {
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isTr = lang === 'tr';

  // State for new ingredient form
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("Adet");

  // Fetch recipe on mount
  useEffect(() => {
    const fetchRecipe = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/store/products/${product.id}/recipe`);
        if (res && res.success) {
          // Map incoming amount to quantity for local state if needed, or just use amount
          const mappedItems = (res.items || []).map((item: any) => ({
            ...item,
            ingredient_product_id: item.ingredient_id,
            quantity: item.amount
          }));
          setRecipeItems(mappedItems);
        } else {
          toast.error(isTr ? "Reçete yüklenirken hata oluştu." : "Failed to load recipe.");
        }
      } catch (error) {
        console.error("Fetch recipe error:", error);
        toast.error(isTr ? "Sistem hatası." : "System error.");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [product.id, isTr]);

  // Handle adding an ingredient locally
  const handleAddIngredient = () => {
    if (!selectedIngredientId || !quantity || parseFloat(quantity) <= 0) {
      toast.warning(isTr ? "Lütfen geçerli bir malzeme ve miktar seçin." : "Please select a valid ingredient and quantity.");
      return;
    }

    const ingredientIdNum = parseInt(selectedIngredientId);
    if (ingredientIdNum === product.id) {
      toast.error(isTr ? "Bir ürün kendisinin malzemesi olamaz!" : "A product cannot be an ingredient of itself!");
      return;
    }

    // Check if already in recipe
    if (recipeItems.some(item => item.ingredient_product_id === ingredientIdNum)) {
      toast.warning(isTr ? "Bu malzeme zaten reçetede mevcut!" : "This ingredient is already in the recipe!");
      return;
    }

    const ingredientProd = products.find(p => p.id === ingredientIdNum);
    if (!ingredientProd) return;

    const newItem = {
      ingredient_id: ingredientIdNum,
      ingredient_product_id: ingredientIdNum, // keep for UI compatibility if needed
      ingredient_name: ingredientProd.name,
      ingredient_unit: ingredientProd.unit || 'Adet',
      ingredient_stock: ingredientProd.stock_quantity || 0,
      amount: parseFloat(quantity),
      quantity: parseFloat(quantity), // keep for UI compatibility
      unit: unit
    };

    setRecipeItems(prev => [...prev, newItem]);
    // Clear form
    setSelectedIngredientId("");
    setQuantity("");
  };

  // Remove ingredient locally
  const handleRemoveIngredient = (index: number) => {
    setRecipeItems(prev => prev.filter((_, i) => i !== index));
  };

  // Save to database
  const handleSaveRecipe = async () => {
    setSaving(true);
    try {
      const itemsToSave = recipeItems.map(item => ({
        ingredient_id: item.ingredient_id || item.ingredient_product_id,
        amount: item.amount || item.quantity,
        unit: item.unit
      }));

      const res = await api.post(`/api/store/products/${product.id}/recipe`, { items: itemsToSave });
      if (res && res.success) {
        toast.success(isTr ? "Reçete başarıyla kaydedildi." : "Recipe successfully saved.");
        onClose();
      } else {
        toast.error(isTr ? "Reçete kaydedilemedi." : "Failed to save recipe.");
      }
    } catch (error) {
      console.error("Save recipe error:", error);
      toast.error(isTr ? "Sistem hatası." : "System error.");
    } finally {
      setSaving(false);
    }
  };

  // Filter out products that can be selected as ingredients (exclude the recipe product itself)
  const availableIngredients = products.filter(p => p.id !== product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                {isTr ? "Ürün Reçetesi (Birleşik Ürün)" : "Product Recipe (Composite Product)"}
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                {product.name}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Info Alert */}
          <div className="p-4 bg-indigo-50 border border-indigo-100/50 rounded-2xl flex items-start gap-3">
            <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">i</div>
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              {isTr 
                ? "Bu birleşik ürün satıldığında (örneğin POS üzerinden), aşağıda tanımlayacağınız malzemeler belirtilen miktarlarda stoktan otomatik olarak düşecektir." 
                : "When this composite product is sold, the ingredients defined below will be automatically deducted from stock based on their defined quantities."}
            </p>
          </div>

          {/* Add Ingredient Form */}
          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {isTr ? "Yeni Malzeme Ekle" : "Add New Ingredient"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              
              {/* Product Selection */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {isTr ? "Malzeme Ürün" : "Ingredient Product"}
                </label>
                <select
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                >
                  <option value="">{isTr ? "-- Malzeme Seçin --" : "-- Select Ingredient --"}</option>
                  {availableIngredients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({isTr ? 'Stok' : 'Stock'}: {p.stock_quantity} {p.unit || 'Adet'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {isTr ? "Miktar" : "Quantity"}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                />
              </div>

              {/* Unit */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {isTr ? "Birim" : "Unit"}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                >
                  <option value="Adet">{isTr ? 'Adet' : 'pcs'}</option>
                  <option value="ml">ml</option>
                  <option value="cl">cl</option>
                  <option value="cc">cc</option>
                  <option value="Litre">{isTr ? 'Litre' : 'Liters'}</option>
                  <option value="gr">gr</option>
                  <option value="kg">kg</option>
                </select>
              </div>

              {/* Add Button */}
              <div className="md:col-span-1">
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="w-full h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                  title={isTr ? "Malzemeyi Listeye Ekle" : "Add Ingredient to List"}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Ingredient List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {isTr ? "Reçete İçeriği" : "Recipe Content"}
            </h4>
            
            {loading ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                <Loader className="h-8 w-8 animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest">{isTr ? 'YÜKLENİYOR...' : 'LOADING...'}</span>
              </div>
            ) : recipeItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl italic text-xs uppercase tracking-widest">
                {isTr ? "Bu ürün için henüz reçete tanımlanmamış." : "No recipe defined for this product yet."}
              </div>
            ) : (
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                {recipeItems.map((item, index) => (
                  <div key={index} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {item.ingredient_name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                        {isTr ? 'GÜNCEL STOK' : 'CURRENT STOCK'}: 
                        <span className={item.ingredient_stock <= 0 ? "text-rose-500 font-black" : "text-slate-600 font-black"}>
                          {item.ingredient_stock} {item.ingredient_unit}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-mono font-black text-slate-900 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title={isTr ? "Malzemeyi Sil" : "Delete Ingredient"}
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            {isTr ? "İptal" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSaveRecipe}
            className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-600 active:scale-95 transition-all shadow-lg flex items-center gap-2"
          >
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isTr ? "Reçeteyi Kaydet" : "Save Recipe"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
