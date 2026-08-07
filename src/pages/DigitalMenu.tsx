import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBasket, CheckCircle2, Plus, Minus, Trash2, X, MessageSquare, AlertCircle, Edit3, ChevronDown, Check, Search, Keyboard, Flame, Sparkles, UserCheck, FlaskConical, RotateCcw } from "lucide-react";
import { translateText } from "../utils/translator";

export default function DigitalMenuPage() {
  const { storeId, tableId } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [activeTableId, setActiveTableId] = useState<string>("");
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [manualTableInput, setManualTableInput] = useState("");
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");
  const [variantModalProduct, setVariantModalProduct] = useState<any | null>(null);
  const [flippedProductId, setFlippedProductId] = useState<string | number | null>(null);

  const getRecipeItems = (prod: any) => {
    let recipe = prod.recipe_items;
    if (typeof recipe === "string") {
      try {
        recipe = JSON.parse(recipe);
      } catch (e) {
        recipe = [];
      }
    }
    if (Array.isArray(recipe) && recipe.length > 0) {
      return recipe;
    }
    
    const nameLower = (prod.name || "").toLowerCase();
    if (nameLower.includes("lookprice")) {
      if (nameLower.includes("coctail") || nameLower.includes("cocktail") || nameLower.includes("kokteyl")) {
        return [
          { ingredient_name: "Yarı Mamül X (Lookprice Özel)", amount: 100, ingredient_unit: "cc" },
          { ingredient_name: "Yarı Mamül Y (Premium Nektar)", amount: 200, ingredient_unit: "cc" },
          { ingredient_name: "Yarı Mamül Z (Aromatik Esans)", amount: 30, ingredient_unit: "cc" },
        ];
      }
      return [
        { ingredient_name: "Yarı Mamül (Lookprice Özel)", amount: 50, ingredient_unit: "g" },
        { ingredient_name: "Premium Aroma (Lookprice Özel)", amount: 10, ingredient_unit: "ml" }
      ];
    }
    
    return [];
  };

  useEffect(() => {
    if (tableId) {
      setActiveTableId(tableId);
      setManualTableInput(tableId);
    }
  }, [tableId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      
      const cachedStore = localStorage.getItem(`digitalMenuStore_${storeId}`);
      const cachedProducts = localStorage.getItem(`digitalMenuProducts_${storeId}`);
      
      if (cachedStore && cachedProducts) {
        setStore(JSON.parse(cachedStore));
        setProducts(JSON.parse(cachedProducts));
        setLoading(false);
      }

      try {
        const [storeRes, productsRes, tablesRes] = await Promise.all([
          api.getPublicDigitalMenuInfo(storeId),
          api.getPublicDigitalMenuProducts(storeId),
          api.getPublicDigitalMenuTables(storeId).catch(() => [])
        ]);
        
        setStore(storeRes);
        localStorage.setItem(`digitalMenuStore_${storeId}`, JSON.stringify(storeRes));

        const rawProds = Array.isArray(productsRes) ? productsRes : [];
        const parsedProds = rawProds
          .filter((p: any) => p.is_sellable !== false)
          .map((p: any) => {
            let vars = p.variants;
            if (typeof vars === 'string') {
              try { vars = JSON.parse(vars); } catch (e) { vars = []; }
            }
            const hasVars = p.has_variants === true || p.has_variants === 'true' || (Array.isArray(vars) && vars.length > 0);
            return {
              ...p,
              has_variants: hasVars,
              variants: Array.isArray(vars) ? vars : []
            };
          });
        setProducts(parsedProds);
        localStorage.setItem(`digitalMenuProducts_${storeId}`, JSON.stringify(parsedProds));

        setAllTables(Array.isArray(tablesRes) ? tablesRes : []);
        setLoading(false);
      } catch (error) {
        console.error("Fetch digital menu error:", error);
        // If fetch fails and no cache, let the error UI handle it
        if (!cachedStore) {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [storeId]);

  const handleProductClick = (product: any) => {
    let vars = product.variants;
    if (typeof vars === 'string') {
      try { vars = JSON.parse(vars); } catch (e) { vars = []; }
    }
    const pHasVars = product.has_variants === true || product.has_variants === 'true' || (Array.isArray(vars) && vars.length > 0);
    if (pHasVars && Array.isArray(vars) && vars.length > 0) {
      setVariantModalProduct({ ...product, variants: vars });
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: any, selectedVariant?: any) => {
    setCart(prev => {
      const variantName = selectedVariant ? selectedVariant.name : null;
      const existingIndex = prev.findIndex(item => 
        item.id === product.id && 
        ((!item.selectedVariant && !variantName) || (item.selectedVariant && item.selectedVariant.name === variantName))
      );

      const rawPrice = selectedVariant && selectedVariant.price && parseFloat(selectedVariant.price) > 0 
        ? selectedVariant.price 
        : product.price;

      const displayName = selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name;

      if (existingIndex > -1) {
        return prev.map((item, idx) => 
          idx === existingIndex 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { 
        ...product, 
        name: displayName, 
        price: rawPrice, 
        quantity: 1, 
        note: "",
        selectedVariant: selectedVariant || null,
        selected_variant_name: selectedVariant ? selectedVariant.name : null
      }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateNote = (index: number, note: string) => {
    setCart(prev => prev.map((item, idx) => 
      idx === index ? { ...item, note } : item
    ));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== index));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (!activeTableId) {
      alert(t("Lütfen siparişiniz için bir masa seçin veya 'Garson Masası' seçeneğini işaretleyin.", "Please select a table for your order or check the 'Waiter Table' option.", "Επιλέξτε ένα τραπέζι για την παραγγελία σας ή επιλέξτε την επιλογή 'Τραπέζι Σερβιτόρου'."));
      setShowTableSelector(true);
      setShowCart(false);
      return;
    }
    try {
      const orderData = {
        storeId: Number(storeId),
        tableNumber: activeTableId,
        // If note is specified, attach it to product name so it appears in kitchen, cashier and invoices seamlessly
        items: cart.map(p => ({
          productId: p.id,
          name: p.note.trim() ? `${p.name} (${p.note.trim()})` : p.name,
          price: p.price,
          quantity: p.quantity,
          selectedVariant: p.selectedVariant || null,
          selected_variant_name: p.selected_variant_name || (p.selectedVariant ? p.selectedVariant.name : null)
        })),
        total: cart.reduce((sum, p) => sum + (Number(p.price) * p.quantity), 0),
        status: 'pending'
      };
      await api.createPublicPosSale(orderData, Number(storeId));
      setCart([]);
      setShowCart(false);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (error) {
      console.error("Order error:", error);
      alert(t("Sipariş verilirken bir hata oluştu. Lütfen tekrar deneyin.", "An error occurred while placing the order. Please try again.", "Παρουσιάστηκε σφάλμα κατά την παραγγελία. Παρακαλώ δοκιμάστε ξανά."));
    }
  };

  const handleTableCall = (callType: 'Garson Çağır' | 'Hesap İste' | 'Yardım') => {
    const tableToUse = activeTableId || "Garson Masası";
    const existingCalls = JSON.parse(localStorage.getItem(`storeTableCalls_${storeId}`) || '[]');
    const newCall = {
      id: Date.now(),
      tableId: tableToUse,
      type: callType,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    localStorage.setItem(`storeTableCalls_${storeId}`, JSON.stringify([newCall, ...existingCalls]));
    alert(t(
      `"${callType}" talebiniz masanız (${tableToUse}) adına kasaya ve hızlı POS terminaline iletildi. Garsonumuz yönlendiriliyor!`,
      `Your "${callType}" request for table (${tableToUse}) has been sent to the cashier. Our waiter is on the way!`,
      `Το αίτημά σας "${callType}" για το τραπέζι (${tableToUse}) στάλθηκε στο ταμείο.`
    ));
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  const [lang, setLang] = useState<'tr' | 'en' | 'el'>('tr');
  const isTr = lang === "tr";
  
  const t = (trText: string, enText: string, elText: string) => {
    if (lang === 'en') return enText;
    if (lang === 'el') return elText;
    return trText;
  };

  const getProductImage = (prod: any) => {
    if (prod.image_url && typeof prod.image_url === 'string' && prod.image_url.trim() !== '' && !prod.image_url.includes('undefined') && !prod.image_url.includes('null')) {
      return prod.image_url;
    }
    const name = (prod.name || '').toLowerCase();
    const cat = (prod.category || '').toLowerCase();
    if (name.includes('kahve') || name.includes('coffee') || name.includes('espresso') || name.includes('latte') || name.includes('cappuccino') || name.includes('americano')) {
      return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('cocktail') || name.includes('kokteyl') || name.includes('drink') || name.includes('içecek') || name.includes('mojito') || name.includes('bira') || name.includes('beer')) {
      return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('pizza') || name.includes('pide') || name.includes('lahmacun')) {
      return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('burger') || name.includes('hamburger') || name.includes('sandwich') || name.includes('tost')) {
      return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80';
    }
    if (name.includes('tatlı') || name.includes('dessert') || name.includes('cake') || name.includes('pasta') || name.includes('waffle')) {
      return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80';
    }
    if (cat.includes('kahve') || cat.includes('içecek') || cat.includes('bar')) {
      return 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
  };

  const translateCategory = (cat: string) => {
    if (!cat) return "";
    const lower = cat.toLowerCase();
    if (lang === 'en') {
      if (lower.includes('kahve') || lower.includes('coffee')) return 'Coffees';
      if (lower.includes('kokteyl') || lower.includes('cocktail')) return 'Cocktails';
      if (lower.includes('tatlı') || lower.includes('dessert')) return 'Desserts';
      if (lower.includes('sıcak') || lower.includes('hot')) return 'Hot Drinks';
      if (lower.includes('soğuk') || lower.includes('cold')) return 'Cold Drinks';
      if (lower.includes('yiyecek') || lower.includes('food') || lower.includes('yemek')) return 'Food & Meals';
      if (lower.includes('bira') || lower.includes('beer')) return 'Beers';
    } else if (lang === 'el') {
      if (lower.includes('kahve') || lower.includes('coffee')) return 'Καφέδες';
      if (lower.includes('kokteyl') || lower.includes('cocktail')) return 'Κοκτέιλ';
      if (lower.includes('tatlı') || lower.includes('dessert')) return 'Γλυκά';
      if (lower.includes('sıcak') || lower.includes('hot')) return 'Ζεστά Ροφήματα';
      if (lower.includes('soğuk') || lower.includes('cold')) return 'Κρύα Ροφήματα';
      if (lower.includes('yiyecek') || lower.includes('food') || lower.includes('yemek')) return 'Φαγητά';
      if (lower.includes('bira') || lower.includes('beer')) return 'Μπύρες';
    }
    return cat;
  };

  // Group products by category dynamically (including primary category AND secondary category_2)
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) cats.add(p.category.trim());
      if (p.category_2 && p.category_2.trim()) cats.add(p.category_2.trim());
    });
    return Array.from(cats);
  }, [products]);

  // Group subcategories dynamically for each category (including sub_category and sub_category_2)
  const subcategoriesMap = React.useMemo(() => {
    const map = new Map<string, string[]>();
    products.forEach((p) => {
      const addSub = (cat: string, sub: string) => {
        if (!cat || !sub) return;
        const trimmedCat = cat.trim();
        const trimmedSub = sub.trim();
        const subs = map.get(trimmedCat) || [];
        if (!subs.includes(trimmedSub)) {
          subs.push(trimmedSub);
          map.set(trimmedCat, subs);
        }
      };
      if (p.category && p.sub_category) addSub(p.category, p.sub_category);
      if (p.category_2 && p.sub_category_2) addSub(p.category_2, p.sub_category_2);
    });
    return map;
  }, [products]);

  // Available subcategories for selected category
  const availableSubCategories = React.useMemo(() => {
    if (selectedCategory === "all" || selectedCategory === "bestsellers") return [];
    return subcategoriesMap.get(selectedCategory) || [];
  }, [selectedCategory, subcategoriesMap]);

  // Combined full-featured search & category/subcategory filter
  const filteredProducts = React.useMemo(() => {
    let list = [...products];

    // If there is an active search, perform a global menu-wide search
    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase().trim();
      return list.filter((p) => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sub_category && p.sub_category.toLowerCase().includes(q)) ||
        (p.category_2 && p.category_2.toLowerCase().includes(q)) ||
        (p.sub_category_2 && p.sub_category_2.toLowerCase().includes(q))
      );
    }

    // Otherwise, apply category and subcategory filtering
    if (selectedCategory === "bestsellers") {
      const explicitBestsellers = list.filter((p) => p.is_bestseller);
      if (explicitBestsellers.length > 0) {
        return explicitBestsellers;
      }
      return list.slice(0, 6);
    } else if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory || p.category_2 === selectedCategory);
      if (selectedSubCategory !== "all") {
        list = list.filter((p) => 
          (p.category === selectedCategory && p.sub_category === selectedSubCategory) ||
          (p.category_2 === selectedCategory && p.sub_category_2 === selectedSubCategory)
        );
      }
    }

    return list;
  }, [products, productSearchQuery, selectedCategory, selectedSubCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">{t('Menü yükleniyor...', 'Loading menu...', 'Φόρτωση μενού...')}</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <p className="text-slate-800 font-bold text-lg">{t('Mağaza bulunamadı.', 'Store not found.', 'Το κατάστημα δεν βρέθηκε.')}</p>
        <p className="text-slate-500 text-sm mt-1">{t('QR kodu taratarak tekrar giriş yapmayı deneyebilirsiniz.', 'You can try to log in again by scanning the QR code.', 'Μπορείτε να δοκιμάσετε να συνδεθείτε ξανά σαρώνοντας τον κωδικό QR.')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 flex justify-center py-0 md:py-8">
      <div className="w-full max-w-xl md:max-w-md min-h-screen md:min-h-0 bg-slate-50 p-4 pb-28 relative shadow-2xl md:border md:border-slate-200 md:rounded-[3rem] overflow-hidden">
        {/* Top Right Language Switcher */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1 bg-white p-1 rounded-2xl shadow-md border border-slate-200">
          <button
            onClick={() => setLang('tr')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${lang === 'tr' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            TR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${lang === 'en' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('el')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${lang === 'el' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            EL
          </button>
        </div>

        {/* Brand Header */}
        <header className="bg-white p-4 rounded-3xl shadow-sm mb-4 border border-slate-100 space-y-3.5 animate-fade-in pr-20">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-14 w-14 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-sm" />
            ) : (
              <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-extrabold text-xl shrink-0">
                {store.name?.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-extrabold text-slate-800 tracking-tight truncate leading-tight">{store.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {activeTableId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setManualTableInput(activeTableId);
                      setShowTableSelector(true);
                    }}
                    className="px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full text-[10px] font-black border border-rose-100/50 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {t('Masa', 'Table', 'Τραπέζι')}: {activeTableId}
                    <Edit3 className="w-2.5 h-2.5 text-rose-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setManualTableInput("");
                      setShowTableSelector(true);
                    }}
                    className="px-2.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-full text-[10px] font-black border border-amber-100/50 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {t('Masa Seçilmedi', 'No Table Selected', 'Δεν επιλέχθηκε τραπέζι')}
                    <AlertCircle className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                  </button>
                )}
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('Dijital Menü', 'Digital Menu', 'Ψηφιακό Μενού')}</span>
              </div>
            </div>
          </div>

          {/* Full-featured Search Bar inside Logo Section */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              placeholder={t("Menüde hızlıca ara...", "Fast search in menu...", "Γρήγορη αναζήτηση στο μενού...")}
              className="w-full pl-9.5 pr-8 py-2 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner animate-fade-in"
            />
            {productSearchQuery && (
              <button
                onClick={() => setProductSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </header>

        {/* Warning alert if no table is selected */}
        {!activeTableId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 text-sm">{t('Masa Belirtilmedi', 'No Table Specified', 'Δεν έχει καθοριστεί τραπέζι')}</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5 leading-tight">{t('Siparişinizin mutfağa iletilebilmesi için masa seçin.', 'Select a table so your order can be sent to the kitchen.', 'Επιλέξτε ένα τραπέζι για να σταλεί η παραγγελία σας στην κουζίνα.')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setManualTableInput("");
                setShowTableSelector(true);
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-100 cursor-pointer shrink-0 ml-2"
            >
              {t('Masa Seç', 'Select Table', 'Επιλογή Τραπεζιού')}
            </button>
          </div>
        )}

        {/* Table Service Call Quick Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            type="button"
            onClick={() => handleTableCall('Garson Çağır')}
            className="flex flex-col items-center justify-center p-3 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-800 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span className="text-lg mb-1">🛎️</span>
            <span className="text-[11px] font-extrabold tracking-tight">{t('Garson Çağır', 'Call Waiter', 'Κλήση Σερβιτόρου')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleTableCall('Hesap İste')}
            className="flex flex-col items-center justify-center p-3 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span className="text-lg mb-1">💳</span>
            <span className="text-[11px] font-extrabold tracking-tight">{t('Hesap İste', 'Request Bill', 'Αίτημα Λογαριασμού')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleTableCall('Yardım')}
            className="flex flex-col items-center justify-center p-3 bg-white hover:bg-indigo-50 text-slate-800 hover:text-indigo-800 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <span className="text-lg mb-1">🙋</span>
            <span className="text-[11px] font-extrabold tracking-tight">{t('Yardım', 'Help', 'Βοήθεια')}</span>
          </button>
        </div>

        {/* Category & Subcategory Navigation Section */}
        <div className="mb-5 space-y-2">
          {/* Main Categories Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none scroll-smooth">
            {/* 🔥 Trendler Button */}
            <button
              onClick={() => {
                setSelectedCategory(selectedCategory === "bestsellers" ? "all" : "bestsellers");
                setSelectedSubCategory("all");
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                selectedCategory === "bestsellers" && !productSearchQuery
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 border-indigo-600"
                  : "bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50"
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${selectedCategory === "bestsellers" && !productSearchQuery ? "text-orange-300 animate-pulse" : "text-orange-500"}`} />
              {t("Trendler", "Trending", "Τάσεις")}
            </button>

            {/* Dynamic Categories */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat && !productSearchQuery;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat ? "all" : cat);
                    setSelectedSubCategory("all");
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 border-indigo-600"
                      : "bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50"
                  }`}
                >
                  {translateText(cat, lang)}
                </button>
              );
            })}
          </div>

          {/* Subcategories Row (Renders if availableSubCategories exist) */}
          <AnimatePresence>
            {availableSubCategories.length > 0 && !productSearchQuery && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 overflow-x-auto py-1 -mx-4 px-4 scrollbar-none"
              >
                {/* Subcategory Pills */}
                {availableSubCategories.map((sub) => {
                  const isSelected = selectedSubCategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubCategory(selectedSubCategory === sub ? "all" : sub)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {translateText(sub, lang)}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            {productSearchQuery ? (
              <>
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                {t("Arama Sonuçları", "Search Results", "Αποτελέσματα Αναζήτησης")}
              </>
            ) : selectedCategory === "bestsellers" ? (
              <>
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {t("Trendler", "Trending", "Τάσεις")}
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {selectedCategory === "all" ? t("Tüm Menü", "Full Menu", "Πλήρες Μενού") : translateText(selectedCategory, lang)}
                {selectedSubCategory !== "all" && ` / ${translateText(selectedSubCategory, lang)}`}
              </>
            )}
          </h2>
          <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
            {filteredProducts.length} {t("Ürün", "Products", "Προϊόντα")}
          </span>
        </div>

        {/* Product List */}
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product, idx) => {
            const isBestsellerProduct = product.is_bestseller; // Mark as bestseller based on database flag
            const vars = Array.isArray(product.variants) ? product.variants : (typeof product.variants === 'string' ? JSON.parse(product.variants || '[]') : []);
            const pHasVars = product.has_variants === true || product.has_variants === 'true' || (Array.isArray(vars) && vars.length > 0);
            const cartItem = cart.find((item) => item.id === product.id);
            const hasRecipe = getRecipeItems(product).length > 0;
            const isFlipped = flippedProductId === product.id;

            return (
              <div 
                key={product.id} 
                className="w-full relative h-[270px]"
                style={{ perspective: "1000px" }}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="w-full h-full relative"
                >
                  {/* FRONT SIDE */}
                  <div 
                    onClick={() => {
                      if (pHasVars) handleProductClick(product);
                    }}
                    className={`absolute inset-0 w-full h-full bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all ${pHasVars ? 'cursor-pointer' : ''}`}
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    {/* Bestseller Badge */}
                    {isBestsellerProduct && (
                      <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                        <Flame className="w-2.5 h-2.5 text-white" />
                        {t("POPÜLER", "POPULAR", "ΔΗΜΟΦΙΛΗ")}
                      </span>
                    )}

                    {/* Recipe Flask Button */}
                    {hasRecipe && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlippedProductId(product.id);
                        }}
                        className="absolute top-2 right-2 z-20 h-7 w-7 bg-slate-900/80 hover:bg-amber-500 text-amber-400 hover:text-slate-950 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 border border-white/10"
                        title={t("Reçeteyi Gör", "See Recipe", "Δείτε τη Συνταγή")}
                      >
                        <FlaskConical className="h-3.5 w-3.5 animate-pulse" />
                      </button>
                    )}

                    <img 
                      src={getProductImage(product)} 
                      alt={product.name} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-[120px] object-cover rounded-xl mb-2 shadow-xs" 
                    />
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">{translateText(product.name, lang)}</h3>
                    
                    {product.description && (
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5 leading-tight">
                        {translateText(product.description, lang)}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-auto pt-1.5 border-t border-slate-100/70">
                      <p className="text-indigo-600 font-black text-sm">{product.price} ₺</p>
                      
                      {/* Dynamic Quantity Selector for fast cart updates */}
                      {cartItem && !pHasVars ? (
                        <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden shadow-sm" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => {
                              const cartIdx = cart.findIndex((item) => item.id === product.id);
                              if (cartIdx > -1) {
                                if (cart[cartIdx].quantity === 1) {
                                  removeFromCart(cartIdx);
                                } else {
                                  updateQuantity(cartIdx, -1);
                                }
                              }
                            }}
                            className="px-2.5 py-1.5 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-1.5 text-center text-xs font-black text-indigo-700 min-w-[1.25rem]">{cartItem.quantity}</span>
                          <button 
                            onClick={() => {
                              const cartIdx = cart.findIndex((item) => item.id === product.id);
                              if (cartIdx > -1) {
                                updateQuantity(cartIdx, 1);
                              }
                            }}
                            className="px-2.5 py-1.5 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(product);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> {pHasVars ? t("Seçenek Seç", "Select Option", "Επιλογή") : t("Ekle", "Add", "Προσθήκη")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BACK SIDE (Secret Recipe Details Flip Card) */}
                  <div
                    className="absolute inset-0 w-full h-full bg-slate-900 rounded-2xl p-3 flex flex-col justify-between text-white border border-slate-800"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                    }}
                  >
                    <div className="space-y-2 shrink-0">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FlaskConical className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 truncate">
                            {t("REÇETE", "RECIPE", "ΣΥΝΤΑΓΗ")}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFlippedProductId(null);
                          }}
                          className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer border border-slate-700 shrink-0"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </div>
                      <h4 className="font-extrabold text-white text-xs truncate leading-tight">
                        {product.name}
                      </h4>
                    </div>

                    {/* Recipe lists with interactive dynamic bars */}
                    <div className="flex-1 my-2 space-y-2 overflow-y-auto pr-1 select-none scrollbar-none">
                      {getRecipeItems(product).map((item: any, itemIdx: number) => {
                        const itemsList = getRecipeItems(product);
                        const totalAmount = itemsList.reduce((sum: number, i: any) => sum + (parseFloat(i.amount) || 0), 0);
                        const percent = totalAmount > 0 ? ((parseFloat(item.amount) || 0) / totalAmount * 100).toFixed(0) : "35";
                        return (
                          <div key={itemIdx} className="space-y-0.5">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-300 truncate max-w-[70%]">{item.ingredient_name}</span>
                              <span className="text-amber-400 font-mono text-[9px] shrink-0">{item.amount} {item.ingredient_unit}</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden flex">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: isFlipped ? `${percent}%` : 0 }}
                                transition={{ duration: 0.6, delay: itemIdx * 0.08 }}
                                className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Lookprice Blend</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[9px] flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" /> {pHasVars ? t("Seç", "Select", "Επιλογή") : t("Ekle", "Add", "Προσθήκη")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-12 px-4 bg-white rounded-3xl border border-slate-100 shadow-xs">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">
                {t("Eşleşen ürün bulunamadı.", "No matching products found.", "Δεν βρέθηκαν προϊόντα που να ταιριάζουν.")}
              </p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t("Farklı bir arama kelimesi yazmayı veya kategorileri incelemeyi deneyebilirsiniz.", "Try typing another search term or exploring other categories.", "Δοκιμάστε να πληκτρολογήσετε έναν άλλο όρο αναζήτησης ή να εξερευνήσετε άλλες κατηγορίες.")}
              </p>
            </div>
          )}
        </div>

      {/* Floating Order Cart Bar */}
      {cart.length > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[calc(36rem-2rem)] bg-white p-4 rounded-2xl shadow-xl border border-indigo-100 flex justify-between items-center z-40"
        >
          <button 
            onClick={() => setShowCart(true)}
            className="flex items-center gap-2.5 text-left outline-none"
          >
            <div className="relative bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <ShoppingBasket className="h-6 w-6" />
              <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-bold leading-none">{t('Toplam Tutar', 'Total Amount', 'Συνολικό Ποσό')}</span>
              <span className="text-base font-black text-slate-800">{totalCartPrice.toFixed(2)} ₺</span>
            </div>
          </button>
          
          <button 
            onClick={() => setShowCart(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-100"
          >
            {t('Siparişi İncele', 'Review Order', 'Επανεξέταση Παραγγελίας')}
          </button>
        </motion.div>
      )}

      {/* Cart Review Slide-up Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCart(false)}
              className="fixed inset-0 bg-black z-50"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-t-[2.5rem] shadow-2xl border-t border-slate-100 z-50 max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{t('Siparişinizi İnceleyin', 'Review Your Order', 'Ελέγξτε την Παραγγελία σας')}</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{t('Özel isteklerinizi ürün bazında belirtebilirsiniz', 'You can specify special requests on a per-product basis', 'Μπορείτε να καθορίσετε ειδικά αιτήματα ανά προϊόν')}</p>
                </div>
                <button 
                  onClick={() => setShowCart(false)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{translateText(item.name, lang)}</h4>
                        <span className="text-xs text-indigo-600 font-bold mt-1 block">{(Number(item.price) * item.quantity).toFixed(2)} ₺</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <button 
                            onClick={() => updateQuantity(idx, -1)}
                            className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(idx, 1)}
                            className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(idx)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Special Request / Notes section for Kitchen */}
                    <div className="flex items-center gap-2 bg-white border border-slate-150 rounded-xl px-3 py-1.5 shadow-sm">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input 
                        type="text"
                        value={item.note}
                        onChange={(e) => updateNote(idx, e.target.value)}
                        placeholder={t('Özel istek / Not ekleyin (örn: Açık, demli, bol soslu)', 'Add special request / Note (e.g., Light, strong, extra sauce)', 'Προσθήκη ειδικού αιτήματος / Σημείωση (π.χ. Ελαφρύ, δυνατό, επιπλέον σάλτσα)')}
                        className="w-full bg-transparent border-none text-xs font-medium text-slate-600 outline-none placeholder-slate-400"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">{t('Sipariş Toplamı', 'Order Total', 'Σύνολο Παραγγελίας')}</span>
                  <span className="text-xl font-black text-slate-800">{totalCartPrice.toFixed(2)} ₺</span>
                </div>
                
                <button 
                  onClick={placeOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-100"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {t('Siparişi Onayla ve Gönder', 'Confirm and Send Order', 'Επιβεβαίωση και Αποστολή Παραγγελίας')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modern Toast/Notification for successful orders */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[calc(36rem-3rem)] bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-emerald-500"
          >
            <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
            <div>
              <p className="font-extrabold text-sm">{t('Siparişiniz Alındı!', 'Order Received!', 'Λήφθηκε η Παραγγελία!')}</p>
              <p className="text-xs text-emerald-100 mt-0.5">{t('Siparişiniz başarıyla mutfağa ve kasaya iletildi.', 'Your order was successfully sent to the kitchen and checkout.', 'Η παραγγελία σας στάλθηκε επιτυχώς στην κουζίνα και στο ταμείο.')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Selector Drawer */}
      <AnimatePresence>
        {showTableSelector && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTableSelector(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-t-[2.5rem] shadow-2xl border-t border-slate-100 z-50 max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">{t('Masa Seçimi / Girişi', 'Table Selection / Entry', 'Επιλογή / Εισαγωγή Τραπεζιού')}</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{t('Siparişinizin hangi masaya ait olduğunu belirleyin', 'Determine which table your order belongs to', 'Καθορίστε σε ποιο τραπέζι ανήκει η παραγγελία σας')}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowTableSelector(false)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Garson / Ayakta Sipariş Option */}
                <div className="bg-amber-50/90 p-4 rounded-2xl border border-amber-200/90 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">{t('Garson Masası (Masa Seçilmeden)', 'Waiter Table (No Table Selected)', 'Τραπέζι Σερβιτόρου (Χωρίς Επιλογή Τραπεζιού)')}</h3>
                      <p className="text-[11px] text-amber-800 font-medium">{t('Masa belli değilse veya garson tarafından alınıyorsa seçin', 'Select if the table is unknown or taken by the waiter', 'Επιλέξτε εάν το τραπέζι είναι άγνωστο ή λαμβάνεται από τον σερβιτόρο')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTableId("Garson Masası");
                      setManualTableInput("Garson Masası");
                      setShowTableSelector(false);
                    }}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all shrink-0 cursor-pointer ${
                      activeTableId === "Garson Masası"
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-100/50'
                    }`}
                  >
                    {activeTableId === "Garson Masası" ? t("SEÇİLİ", "SELECTED", "ΕΠΙΛΕΓΜΕΝΟ") : t("Garson Seç", "Select Waiter", "Επιλογή Σερβιτόρου")}
                  </button>
                </div>

                {/* Custom / Crisis manual input */}
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-xs text-rose-800 uppercase tracking-wider">{t('Manuel Masa Tanımlama', 'Manual Table Definition', 'Χειροκίνητος Ορισμός Τραπεζιού')}</h3>
                  </div>
                  <p className="text-xs text-rose-600/80 font-medium leading-relaxed">
                    {t('QR kod okunamadıysa veya listede olmayan özel bir masa ise aşağıya manuel olarak masa numarası veya adını yazıp onaylayabilirsiniz.', 'If the QR code cannot be read or it is a special table not on the list, you can manually type the table number or name below and confirm.', 'Εάν ο κωδικός QR δεν μπορεί να διαβαστεί ή πρόκειται για ειδικό τραπέζι εκτός λίστας, μπορείτε να πληκτρολογήσετε χειροκίνητα τον αριθμό ή το όνομα του τραπεζιού παρακάτω και να επιβεβαιώσετε.')}
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={manualTableInput}
                      onChange={(e) => setManualTableInput(e.target.value)}
                      placeholder={t('Örn: 5, Bahçe 2, VIP', 'e.g. 5, Garden 2, VIP', 'π.χ. 5, Κήπος 2, VIP')}
                      className="flex-1 px-4 py-2.5 bg-white border border-rose-200 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = manualTableInput.trim();
                        if (trimmed) {
                          setActiveTableId(trimmed);
                          setShowTableSelector(false);
                        } else {
                          alert(t("Lütfen geçerli bir masa adı veya numarası girin.", "Please enter a valid table name or number.", "Εισαγάγετε ένα έγκυρο όνομα ή αριθμό τραπεζιού."));
                        }
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                    >
                      {t('Onayla', 'Confirm', 'Επιβεβαίωση')}
                    </button>
                  </div>
                </div>

                {/* Pre-defined tables from database */}
                {allTables.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{t('Tanımlı Masalar', 'Defined Tables', 'Ορισμένα Τραπέζια')}</h3>
                      <div className="relative max-w-[150px] w-full">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={tableSearchQuery}
                          onChange={(e) => setTableSearchQuery(e.target.value)}
                          placeholder={t("Masa Ara...", "Search Table...", "Αναζήτηση Τραπεζιού...")}
                          className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-slate-350 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-1">
                      {allTables
                        .filter(t => t.table_number.toLowerCase().includes(tableSearchQuery.toLowerCase()))
                        .map((table) => {
                          const isSelected = activeTableId === table.table_number;
                          return (
                            <button
                              key={table.id}
                              type="button"
                              onClick={() => {
                                setActiveTableId(table.table_number);
                                setManualTableInput(table.table_number);
                                setShowTableSelector(false);
                              }}
                              className={`p-3 rounded-xl border font-bold text-sm transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-100'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-rose-200 hover:bg-rose-50/20'
                              }`}
                            >
                              <span>{table.table_number}</span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 absolute top-1 right-1" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Variant Selection Modal */}
      <AnimatePresence>
        {variantModalProduct && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setVariantModalProduct(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-t-[2.5rem] shadow-2xl border-t border-slate-100 z-50 max-h-[85vh] flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-tight">{translateText(variantModalProduct.name, lang)}</h3>
                    <p className="text-xs text-indigo-600 font-bold mt-0.5">
                      {t('Lütfen seçenek seçiniz', 'Please select an option', 'Παρακαλώ επιλέξτε μια επιλογή')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setVariantModalProduct(null)} 
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  {t('Seçenekler', 'Options', 'Επιλογές')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(variantModalProduct.variants || []).map((v: any, idx: number) => {
                    const varPrice = v.price && parseFloat(v.price) > 0 ? v.price : variantModalProduct.price;

                    return (
                      <div
                        key={v.id || idx}
                        className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/30 transition-all flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div>
                          <span className="text-sm font-black text-slate-800 block">{translateText(v.name, lang)}</span>
                          <span className="text-xs font-extrabold text-indigo-600 mt-0.5 block">
                            {varPrice} ₺
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            addToCart(variantModalProduct, v);
                            setVariantModalProduct(null);
                          }}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('Ekle', 'Add', 'Προσθήκη')}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setVariantModalProduct(null)}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all text-xs cursor-pointer"
                >
                  {t('Kapat', 'Close', 'Κλείσιμο')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
