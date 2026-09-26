import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBasket, CheckCircle2, Plus, Minus, Trash2, X, MessageSquare, AlertCircle, Edit3, ChevronDown, Check, Search, Keyboard, Flame, Sparkles, UserCheck, FlaskConical, RotateCcw, Clock, Utensils, Zap, Info, ShieldCheck, Smartphone, Send, Coffee } from "lucide-react";
import { translateText } from "../utils/translator";
import { StaffWaiter, getStoreWaiters } from "../utils/staffHelpers";

const ALLERGEN_MAP: Record<string, { labelTr: string; labelEn: string; icon: string }> = {
  gluten: { labelTr: "Gluten", labelEn: "Gluten", icon: "🌾" },
  lactose: { labelTr: "Laktoz", labelEn: "Dairy", icon: "🥛" },
  nuts: { labelTr: "Kuruyemiş", labelEn: "Nuts", icon: "🥜" },
  egg: { labelTr: "Yumurta", labelEn: "Egg", icon: "🥚" },
  soy: { labelTr: "Soya", labelEn: "Soy", icon: "🌱" },
  seafood: { labelTr: "Deniz Ürünü", labelEn: "Seafood", icon: "🦐" },
  fish: { labelTr: "Balık", labelEn: "Fish", icon: "🐟" },
  mustard: { labelTr: "Hardal", labelEn: "Mustard", icon: "🌭" },
  sesame: { labelTr: "Susam", labelEn: "Sesame", icon: "🥯" },
  spicy: { labelTr: "Acı", labelEn: "Spicy", icon: "🌶️" },
  vegan: { labelTr: "Vegan", labelEn: "Vegan", icon: "🥬" },
  vegetarian: { labelTr: "Vejetaryen", labelEn: "Vegetarian", icon: "🥗" },
  sugar_free: { labelTr: "Şekersiz", labelEn: "Sugar-Free", icon: "🍃" },
  pork_free: { labelTr: "Helal / No Pork", labelEn: "Halal", icon: "✨" },
};

export default function DigitalMenuPage() {
  const { storeId, tableId } = useParams();
  const [searchParams] = useSearchParams();
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

  // Waiter Terminal Modes & State
  const [isWaiterMode, setIsWaiterMode] = useState<boolean>(() => {
    return localStorage.getItem(`digitalMenuWaiterMode_${storeId}`) === 'true';
  });
  const [activeWaiter, setActiveWaiter] = useState<StaffWaiter | null>(() => {
    try {
      const raw = localStorage.getItem(`digitalMenuWaiterUser_${storeId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [showWaiterModal, setShowWaiterModal] = useState(false);
  const [waiterPinInput, setWaiterPinInput] = useState('');
  const [waiterPinError, setWaiterPinError] = useState(false);
  const [selectedWaiterForPin, setSelectedWaiterForPin] = useState<StaffWaiter | null>(null);
  const [waiterZoneCategory, setWaiterZoneCategory] = useState<'tables' | 'sunbeds' | 'pool' | 'vip' | 'custom'>('tables');

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

  // URL Auto-Authentication for Waiters (WhatsApp Link Flow)
  useEffect(() => {
    const urlGarsonPin = searchParams.get('garson_pin');
    const urlGarsonId = searchParams.get('garson_id');
    const urlMode = searchParams.get('mode');

    if (store && (urlGarsonPin || urlMode === 'waiter')) {
      const waiters = getStoreWaiters(store?.branding || store);
      let matchedWaiter: StaffWaiter | undefined;
      
      if (urlGarsonId) {
        matchedWaiter = waiters.find(w => w.id === urlGarsonId && (urlGarsonPin ? w.pin === urlGarsonPin : true));
      } else if (urlGarsonPin) {
        matchedWaiter = waiters.find(w => w.pin === urlGarsonPin);
      }

      if (matchedWaiter) {
        setIsWaiterMode(true);
        setActiveWaiter(matchedWaiter);
        localStorage.setItem(`digitalMenuWaiterMode_${storeId}`, 'true');
        localStorage.setItem(`digitalMenuWaiterUser_${storeId}`, JSON.stringify(matchedWaiter));
      } else if (urlMode === 'waiter' && !isWaiterMode) {
        setShowWaiterModal(true);
      }
    }
  }, [store, searchParams, storeId, isWaiterMode]);

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

  const placeOrder = async (waiterPaymentChoice: 'open' | 'cash' | 'credit_card' = 'open') => {
    if (cart.length === 0) return;
    if (!activeTableId) {
      alert(t("Lütfen siparişiniz için bir masa seçin veya 'Garson Masası' seçeneğini işaretleyin.", "Please select a table for your order or check the 'Waiter Table' option.", "Επιλέξτε ένα τραπέζι για την παραγγελία σας ή επιλέξτε την επιλογή 'Τραπέζι Σερβιτόρου'."));
      setShowTableSelector(true);
      setShowCart(false);
      return;
    }
    try {
      const isPaidOnSpot = isWaiterMode && waiterPaymentChoice !== 'open';
      const orderData = {
        storeId: Number(storeId),
        tableNumber: activeTableId,
        customerName: activeTableId ? `${activeTableId}` : (isWaiterMode && activeWaiter ? `Garson: ${activeWaiter.name}` : 'Masa Siparişi'),
        waiterName: isWaiterMode && activeWaiter ? activeWaiter.name : undefined,
        waiterId: isWaiterMode && activeWaiter ? activeWaiter.id : undefined,
        orderSource: isWaiterMode ? 'Garson Terminali' : 'Dijital Menü',
        paymentMethod: isPaidOnSpot ? waiterPaymentChoice : 'cash',
        notes: isPaidOnSpot ? `Şezlongda / Masada Mobil Tahsil Edildi (${waiterPaymentChoice === 'cash' ? 'Nakit' : 'Kredi Kartı / POS'})` : undefined,
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
        status: isPaidOnSpot ? 'completed' : 'pending'
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

  const activeTheme = (
    store?.branding?.digital_menu_settings?.theme ||
    (store as any)?.digital_menu_settings?.theme ||
    store?.branding?.theme ||
    (store as any)?.theme ||
    "modern_light"
  );
  const isDark = activeTheme === "dark_bistro";
  const isAmber = activeTheme === "warm_amber";
  const isEmerald = activeTheme === "fresh_emerald";

  return (
    <div className={`min-h-screen flex justify-center py-0 md:py-8 digital-menu-compact transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" :
      isAmber ? "bg-stone-900 text-stone-900" :
      isEmerald ? "bg-emerald-950 text-slate-900" :
      "bg-slate-100/60 text-slate-900"
    }`}>
      <div className={`w-full max-w-xl md:max-w-md min-h-screen md:min-h-0 p-3.5 pb-24 relative shadow-2xl md:border md:rounded-[2.5rem] overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" :
        isAmber ? "bg-stone-50 border-amber-200 text-stone-900" :
        isEmerald ? "bg-white border-emerald-100 text-slate-900" :
        "bg-slate-50 border-slate-200 text-slate-900"
      }`}>
        {/* Top Right Language Switcher */}
        <div className={`absolute top-4 right-4 z-30 flex items-center gap-1 p-1 rounded-2xl shadow-md border ${
          isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <button
            onClick={() => setLang('tr')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
              lang === 'tr' 
                ? (isAmber ? 'bg-amber-600 text-white' : isEmerald ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white')
                : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900')
            }`}
          >
            TR
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
              lang === 'en' 
                ? (isAmber ? 'bg-amber-600 text-white' : isEmerald ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white')
                : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900')
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang('el')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
              lang === 'el' 
                ? (isAmber ? 'bg-amber-600 text-white' : isEmerald ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white')
                : (isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900')
            }`}
          >
            EL
          </button>
        </div>

        {/* Waiter Terminal Sticky HUD (when logged in as a waiter) */}
        {isWaiterMode && activeWaiter && (
          <div className="mb-3 p-2.5 bg-indigo-950 text-indigo-100 rounded-2xl border border-indigo-500/50 shadow-lg flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-black text-white flex items-center gap-1.5 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>{activeWaiter.name}</span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-indigo-800/80 text-indigo-200 font-normal">
                    {activeWaiter.section || 'Saha'}
                  </span>
                </div>
                <div className="text-[9.5px] text-indigo-300 font-bold truncate">
                  📍 {activeTableId ? `${t('Aktif Konum', 'Active Location', 'Θέση')}: ${activeTableId}` : t('Masa/Şezlong Seçiniz', 'Select Table/Sunbed', 'Επιλέξτε')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowTableSelector(true)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{t('Alan Seç', 'Pick Zone', 'Επιλογή')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWaiterMode(false);
                  setActiveWaiter(null);
                  localStorage.removeItem(`digitalMenuWaiterMode_${storeId}`);
                  localStorage.removeItem(`digitalMenuWaiterUser_${storeId}`);
                }}
                className="p-1 text-indigo-300 hover:text-white hover:bg-indigo-900 rounded-md transition-all cursor-pointer"
                title={t('Garson Modundan Çık', 'Exit Waiter Mode', 'Έξοδος')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Streamlined Compact Brand Header */}
        <header className={`p-2.5 sm:p-3 rounded-2xl shadow-2xs mb-3 border space-y-2 animate-fade-in transition-colors ${
          isDark ? "bg-slate-800/90 border-slate-700/80 text-white" :
          isAmber ? "bg-white border-amber-200/80 text-stone-900" :
          isEmerald ? "bg-white border-emerald-100 text-slate-900" :
          "bg-white border-slate-100 text-slate-900"
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-10 w-10 rounded-xl object-cover border border-slate-100 shrink-0 shadow-2xs" />
              ) : (
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-base shrink-0 ${
                  isDark ? "bg-slate-700 text-amber-400" : isAmber ? "bg-amber-100 text-amber-800" : isEmerald ? "bg-emerald-100 text-emerald-800" : "bg-indigo-50 text-indigo-600"
                }`}>
                  {store.name?.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className={`text-sm font-black tracking-tight truncate leading-tight ${
                  isDark ? "text-white" : "text-slate-800"
                }`}>{store.name}</h1>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {activeTableId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setManualTableInput(activeTableId);
                        setShowTableSelector(true);
                      }}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[9.5px] font-black border border-rose-100/50 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {t('Masa/Alan', 'Table/Zone', 'Τραπέζι')}: {activeTableId}
                      <Edit3 className="w-2.5 h-2.5 text-rose-400" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setManualTableInput("");
                        setShowTableSelector(true);
                      }}
                      className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[9.5px] font-black border border-amber-100/50 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {t('Masa Seçilmedi', 'No Table', 'Δεν επιλέχθηκε')}
                      <AlertCircle className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                    </button>
                  )}

                  {!isWaiterMode && (
                    <button
                      type="button"
                      onClick={() => setShowWaiterModal(true)}
                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[9.5px] font-black border border-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Smartphone className="w-2.5 h-2.5 text-indigo-600" />
                      <span>{t('Garson', 'Waiter', 'Σερβιτόρος')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              placeholder={t("Menüde hızlıca ara...", "Fast search in menu...", "Γρήγορη αναζήτηση στο μενού...")}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-600 focus:bg-white transition-all"
            />
            {productSearchQuery && (
              <button
                onClick={() => setProductSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </header>

        {/* Warning alert if no table is selected */}
        {!activeTableId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 flex items-center justify-between shadow-xs animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-slate-800 text-xs leading-tight">{t('Masa Belirtilmedi', 'No Table Specified', 'Δεν έχει καθοριστεί τραπέζι')}</p>
                <p className="text-[10px] text-slate-500 font-medium leading-tight truncate">{t('Sipariş için masa seçin.', 'Select a table for ordering.', 'Επιλέξτε τραπέζι.')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setManualTableInput("");
                setShowTableSelector(true);
              }}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10.5px] font-bold transition-all shadow-xs cursor-pointer shrink-0 ml-1.5"
            >
              {t('Masa Seç', 'Select Table', 'Επιλογή')}
            </button>
          </div>
        )}

        {/* Table Service Call Quick Buttons */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => handleTableCall('Garson Çağır')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-800 rounded-xl border border-slate-200/80 hover:border-amber-300 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <span className="text-sm">🛎️</span>
            <span className="text-[10.5px] font-black tracking-tight truncate">{t('Garson Çağır', 'Call Waiter', 'Κλήση')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleTableCall('Hesap İste')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 rounded-xl border border-slate-200/80 hover:border-emerald-300 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <span className="text-sm">💳</span>
            <span className="text-[10.5px] font-black tracking-tight truncate">{t('Hesap İste', 'Bill', 'Λογαριασμός')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleTableCall('Yardım')}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-indigo-50 text-slate-800 hover:text-indigo-800 rounded-xl border border-slate-200/80 hover:border-indigo-300 shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <span className="text-sm">🙋</span>
            <span className="text-[10.5px] font-black tracking-tight truncate">{t('Yardım', 'Help', 'Βοήθεια')}</span>
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
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product, idx) => {
            const isBestsellerProduct = product.is_bestseller; // Mark as bestseller based on database flag
            const vars = Array.isArray(product.variants) ? product.variants : (typeof product.variants === 'string' ? JSON.parse(product.variants || '[]') : []);
            const pHasVars = product.has_variants === true || product.has_variants === 'true' || (Array.isArray(vars) && vars.length > 0);
            const cartItem = cart.find((item) => item.id === product.id);
            const recipeList = getRecipeItems(product);
            const hasRecipe = recipeList.length > 0;

            // Parse allergens
            let pAllergens: string[] = [];
            if (Array.isArray(product.allergens)) {
              pAllergens = product.allergens;
            } else if (typeof product.allergens === 'string') {
              try {
                pAllergens = JSON.parse(product.allergens);
              } catch {
                pAllergens = [];
              }
            }
            const hasNutritionsOrAllergens = (pAllergens.length > 0) || (Number(product.calories) > 0) || !!product.portion_size || (Number(product.prep_time_min) > 0);
            const hasDetailsToFlip = hasRecipe || hasNutritionsOrAllergens;
            const isFlipped = flippedProductId === product.id;

            return (
              <div 
                key={`menu-prod-${product.id || idx}-${idx}`} 
                className="w-full relative h-[225px]"
                style={{ perspective: "1000px" }}
              >
                <motion.div
                  animate={
                    isFlipped
                      ? { rotateY: 180 }
                      : (hasDetailsToFlip
                        ? { rotateY: [0, -10, 0, 6, 0] }
                        : { rotateY: 0 })
                  }
                  transition={
                    isFlipped
                      ? { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                      : (hasDetailsToFlip
                        ? { duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }
                        : { duration: 0.3 })
                  }
                  style={{ transformStyle: "preserve-3d" }}
                  className="w-full h-full relative"
                >
                  {/* FRONT SIDE */}
                  <div 
                    onClick={() => {
                      if (pHasVars) handleProductClick(product);
                    }}
                    className={`absolute inset-0 w-full h-full bg-white p-2.5 rounded-2xl shadow-2xs border border-slate-100 flex flex-col hover:shadow-sm transition-all ${pHasVars ? 'cursor-pointer' : ''}`}
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    {/* Bestseller Badge */}
                    {isBestsellerProduct && (
                      <span className="absolute top-1.5 left-1.5 z-10 bg-orange-500 text-white text-[8.5px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                        <Flame className="w-2.5 h-2.5 text-white" />
                        {t("POPÜLER", "POPULAR", "ΔΗΜΟΦΙΛΗ")}
                      </span>
                    )}

                    {/* Animated Recipe / Nutrition Flip Hint Badge */}
                    {hasDetailsToFlip && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlippedProductId(product.id);
                        }}
                        className="absolute top-1.5 right-1.5 z-20 h-5 px-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-black text-[8.5px] rounded-full flex items-center gap-1 shadow-xs border border-white/40 animate-pulse cursor-pointer hover:scale-105 active:scale-90 transition-transform"
                        title={t("İçerik, Kalori ve Alerjen Bilgileri (Çevir)", "Recipe & Nutrition (Flip)", "Συστατικά (Περιστροφή)")}
                      >
                        <Sparkles className="h-2.5 w-2.5 text-amber-200" />
                        <span>{t("Detay 🔄", "Details 🔄", "Detay 🔄")}</span>
                      </button>
                    )}

                    <div className="relative mb-1.5">
                      <img 
                        src={getProductImage(product)} 
                        alt={product.name} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
                        }}
                        className="w-full h-[90px] object-cover rounded-xl shadow-2xs filter contrast-105 saturate-105" 
                      />
                      
                      {Number(product.calories) > 0 && (
                        <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-amber-300 font-black text-[8.5px] px-1 py-0.2 rounded-md flex items-center gap-0.5">
                          <Zap className="w-2 h-2 text-amber-400" />
                          {product.calories} kcal
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-slate-800 text-xs line-clamp-1 leading-tight">{translateText(product.name, lang)}</h3>
                    
                    {product.description ? (
                      <p className="text-[9.5px] text-slate-400 font-medium line-clamp-1 mt-0.5 leading-tight">
                        {translateText(product.description, lang)}
                      </p>
                    ) : (
                      <div className="h-3 mt-0.5">
                        {pAllergens.length > 0 && (
                          <div className="flex gap-1 overflow-hidden">
                            {pAllergens.slice(0, 3).map((alg) => (
                              <span key={alg} className="text-[8.5px] text-slate-500 font-bold bg-slate-100 px-1 py-0.2 rounded" title={ALLERGEN_MAP[alg]?.labelTr || alg}>
                                {ALLERGEN_MAP[alg]?.icon || "⚠️"} {ALLERGEN_MAP[alg]?.labelTr || alg}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-auto pt-1 border-t border-slate-100">
                      <div>
                        <p className="text-indigo-600 font-black text-xs leading-tight">
                          {(() => {
                            let vars: any[] = [];
                            if (product.variants) {
                              if (typeof product.variants === "string") {
                                try { vars = JSON.parse(product.variants); } catch (e) { vars = []; }
                              } else if (Array.isArray(product.variants)) {
                                vars = product.variants;
                              }
                            }
                            const prices = vars.map((v: any) => parseFloat(v.price)).filter((p: number) => !isNaN(p) && p > 0);
                            if (prices.length > 0) {
                              const minPrice = Math.min(...prices);
                              const maxPrice = Math.max(...prices);
                              if (minPrice === maxPrice) {
                                return `${minPrice} ₺`;
                              } else {
                                return `${minPrice} - ${maxPrice} ₺`;
                              }
                            }
                            return `${product.price} ₺`;
                          })()}
                        </p>
                        {product.portion_size && (
                          <p className="text-[8.5px] text-slate-400 font-bold leading-none mt-0.5 truncate">{product.portion_size}</p>
                        )}
                      </div>
                      
                      {/* Dynamic Quantity Selector for fast cart updates */}
                      {cartItem && !pHasVars ? (
                        <div className="flex items-center bg-indigo-50 border border-indigo-100 rounded-lg overflow-hidden shadow-2xs" onClick={(e) => e.stopPropagation()}>
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
                            className="px-2 py-1 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Minus className="h-2.5 w-2.5" />
                          </button>
                          <span className="px-1 text-center text-[11px] font-black text-indigo-700 min-w-[1rem]">{cartItem.quantity}</span>
                          <button 
                            onClick={() => {
                              const cartIdx = cart.findIndex((item) => item.id === product.id);
                              if (cartIdx > -1) {
                                updateQuantity(cartIdx, 1);
                              }
                            }}
                            className="px-2 py-1 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(product);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-2.5 py-1 rounded-lg text-[10.5px] flex items-center gap-0.5 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> {pHasVars ? t("Seç", "Select", "Επιλογή") : t("Ekle", "Add", "Προσθήκη")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BACK SIDE (Secret Recipe, Nutrition & Allergen Details Flip Card) */}
                  <div
                    className="absolute inset-0 w-full h-full bg-slate-900 rounded-2xl p-3 flex flex-col justify-between text-white border border-slate-800"
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
                    }}
                  >
                    <div className="space-y-1.5 shrink-0">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FlaskConical className="h-3.5 w-3.5 text-amber-400 animate-pulse shrink-0" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 truncate">
                            {t("İÇERİK & BESİN DEĞERİ", "RECIPE & NUTRITION", "ΣΥΝΤΑΓΗ & ΔΙΑΤΡΟΦΗ")}
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

                      {/* Quick Nutrition Chips */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {Number(product.calories) > 0 && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                            {product.calories} kcal
                          </span>
                        )}
                        {product.portion_size && (
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Utensils className="w-2.5 h-2.5 text-slate-400" />
                            {product.portion_size}
                          </span>
                        )}
                        {Number(product.prep_time_min) > 0 && (
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            ~{product.prep_time_min} dk
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Scrollable Middle: Recipe bars and Allergen badges */}
                    <div className="flex-1 my-1.5 space-y-2 overflow-y-auto pr-1 select-none scrollbar-none">
                      {/* Recipe Items (if any) */}
                      {recipeList.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">
                            {t("Reçete Malzemeleri", "Recipe Ingredients", "Συστατικά")}
                          </p>
                          {recipeList.map((item: any, itemIdx: number) => {
                            const totalAmount = recipeList.reduce((sum: number, i: any) => sum + (parseFloat(i.amount) || 0), 0);
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
                      )}

                      {/* Allergens badges */}
                      {pAllergens.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-800/80">
                          <p className="text-[8px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {t("Alerjen & Diyet Uyarıları", "Allergens & Dietary", "Αλλεργιογόνα")}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {pAllergens.map((alg) => (
                              <span key={alg} className="text-[9px] font-bold bg-slate-800 text-slate-200 border border-slate-700 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <span>{ALLERGEN_MAP[alg]?.icon || "⚠️"}</span>
                                <span>{ALLERGEN_MAP[alg]?.labelTr || alg}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">HoReCaLP</span>
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
              className="fixed bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100/80 z-50 max-h-[85vh] flex flex-col overflow-hidden"
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

              <div className="p-4 sm:p-6 bg-slate-50/70 border-t border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm font-bold text-slate-500">{t('Sipariş Toplamı', 'Order Total', 'Σύνολο Παραγγελίας')}</span>
                  <span className="text-lg sm:text-xl font-black text-slate-800">{totalCartPrice.toFixed(2)} ₺</span>
                </div>
                
                {isWaiterMode ? (
                  <div className="space-y-2">
                    <button 
                      onClick={() => placeOrder('open')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-700/20 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {t('Mutfağa / Bara İlet (Açık Adisyon)', 'Send to Kitchen/Bar (Open Tab)', 'Αποστολή στην Κουζίνα')}
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button 
                        onClick={() => placeOrder('cash')}
                        className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <span>💵</span>
                        <span>{t('Şezlongda Nakit Alındı', 'Paid Cash on Spot', 'Πληρωμή Μετρητά')}</span>
                      </button>
                      <button 
                        onClick={() => placeOrder('credit_card')}
                        className="py-2.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <span>💳</span>
                        <span>{t('Mobil POS ile Alındı', 'Paid by Mobile POS', 'Πληρωμή POS')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => placeOrder('open')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-100 cursor-pointer"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {t('Siparişi Onayla ve Gönder', 'Confirm and Send Order', 'Επιβεβαίωση και Αποστολή Παραγγελίας')}
                  </button>
                )}
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
              className="fixed bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100/80 z-50 max-h-[85vh] flex flex-col overflow-hidden"
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
                {/* Zone Category Tabs for Waiters & Staff */}
                <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setWaiterZoneCategory('tables')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      waiterZoneCategory === 'tables' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🪑 {t('Masalar', 'Tables', 'Τραπέζια')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaiterZoneCategory('sunbeds')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      waiterZoneCategory === 'sunbeds' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏖️ {t('Şezlong & Havuz', 'Sunbeds & Pool', 'Ξαπλώστρες & Πισίνα')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaiterZoneCategory('vip')}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                      waiterZoneCategory === 'vip' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👑 {t('Loca & Teras', 'Lounge & VIP', 'VIP & Βεράντα')}
                  </button>
                </div>

                {/* Sunbeds & Pool Quick Select */}
                {waiterZoneCategory === 'sunbeds' && (
                  <div className="space-y-3 p-3 bg-cyan-50/70 dark:bg-cyan-950/30 rounded-2xl border border-cyan-200/80">
                    <div className="text-[11px] font-black text-cyan-900 dark:text-cyan-200 uppercase tracking-wider">
                      🏖️ {t('Havuz Kenarı & Şezlong Hızlı Seçim', 'Poolside & Sunbed Quick Pick', 'Επιλογή Ξαπλώστρας')}
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => {
                        const tag = `Şezlong #${num}`;
                        const isSelected = activeTableId === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setActiveTableId(tag);
                              setManualTableInput(tag);
                              setShowTableSelector(false);
                            }}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                              isSelected
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                                : 'bg-white text-slate-700 border-cyan-200 hover:bg-cyan-100/60'
                            }`}
                          >
                            #{num}
                          </button>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {['Havuz Kenarı 1', 'Havuz Kenarı 2', 'Havuz Bar', 'Plaj Locası'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setActiveTableId(tag);
                            setManualTableInput(tag);
                            setShowTableSelector(false);
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                            activeTableId === tag ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-700 border-cyan-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIP & Lounge Quick Select */}
                {waiterZoneCategory === 'vip' && (
                  <div className="space-y-3 p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80">
                    <div className="text-[11px] font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      👑 {t('Özel Loca & Teras Alanları', 'VIP Lounge & Terrace Areas', 'VIP Χώροι')}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {['Loca VIP 1', 'Loca VIP 2', 'Loca VIP 3', 'Teras Köşe', 'Bahçe Kamelya', 'Bar Önü'].map((tag) => {
                        const isSelected = activeTableId === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setActiveTableId(tag);
                              setManualTableInput(tag);
                              setShowTableSelector(false);
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                                : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/60'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Garson / Ayakta Sipariş Option */}
                <div className="bg-amber-50/90 p-3.5 rounded-2xl border border-amber-200/90 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">{t('Garson Masası (Serbest Sipariş)', 'Waiter Floating Order', 'Τραπέζι Σερβιτόρου')}</h3>
                      <p className="text-[10.5px] text-amber-800 font-medium">{t('Masa dışı veya hareketli siparişler için', 'For free floating orders', 'Για παραγγελίες εκτός τραπεζιού')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTableId("Garson Masası");
                      setManualTableInput("Garson Masası");
                      setShowTableSelector(false);
                    }}
                    className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all shrink-0 cursor-pointer ${
                      activeTableId === "Garson Masası"
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-100/50'
                    }`}
                  >
                    {activeTableId === "Garson Masası" ? t("SEÇİLİ", "SELECTED", "ΕΠΙΛΕΓΜΕΝΟ") : t("Seç", "Select", "Επιλογή")}
                  </button>
                </div>

                {/* Custom / Crisis manual input */}
                <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-xs text-rose-800 uppercase tracking-wider">{t('Özel Alan / Masa / Şezlong Yazın', 'Custom Zone / Sunbed / Name', 'Χειροκίνητος Ορισμός')}</h3>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={manualTableInput}
                      onChange={(e) => setManualTableInput(e.target.value)}
                      placeholder={t('Örn: Şezlong 14, Bahçe 2, Loca', 'e.g. Sunbed 14, Garden 2', 'π.χ. Ξαπλώστρα 14')}
                      className="flex-1 px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-rose-500 transition-all"
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
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                    >
                      {t('Onayla', 'Confirm', 'Επιβεβαίωση')}
                    </button>
                  </div>
                </div>

                {/* Pre-defined tables from database */}
                {(waiterZoneCategory === 'tables' || allTables.length > 0) && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">{t('Tanımlı Masalar', 'Defined Tables', 'Ορισμένα Τραπέζια')}</h3>
                      <div className="relative max-w-[140px] w-full">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={tableSearchQuery}
                          onChange={(e) => setTableSearchQuery(e.target.value)}
                          placeholder={t("Masa Ara...", "Search Table...", "Αναζήτηση...")}
                          className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
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
                              className={`p-2.5 rounded-xl border font-bold text-xs transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/20'
                              }`}
                            >
                              <span>{table.table_number}</span>
                              {isSelected && (
                                <Check className="w-3 h-3 absolute top-1 right-1" />
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
              className="fixed bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100/80 z-50 max-h-[85vh] flex flex-col overflow-hidden"
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

      {/* Waiter Terminal PIN Login Modal */}
      <AnimatePresence>
        {showWaiterModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowWaiterModal(false);
                setWaiterPinInput('');
                setWaiterPinError(false);
              }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 15 }}
                className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-[340px] w-full overflow-hidden text-slate-100 pointer-events-auto flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        {t('Garson El Terminali Girişi', 'Waiter Terminal Login', 'Είσοδος Σερβιτόρου')}
                      </div>
                      <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
                        {t('PIN ile Yetkilendirme', 'PIN Authorization', 'Εξουσιοδότηση PIN')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWaiterModal(false);
                      setWaiterPinInput('');
                      setWaiterPinError(false);
                    }}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-3.5 space-y-3">
                  {/* Waiter Roster Quick Selector */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('Personel Seçimi', 'Select Staff', 'Επιλογή Προσωπικού')}
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                      {getStoreWaiters(store?.branding || store).filter(w => w.active).map((w) => {
                        const isSelected = selectedWaiterForPin?.id === w.id;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setSelectedWaiterForPin(w);
                              setWaiterPinInput('');
                              setWaiterPinError(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg border text-left shrink-0 transition-all text-xs font-bold cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 ring-1 ring-indigo-500/40'
                                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <div className="text-[11px] font-extrabold text-slate-200">{w.name}</div>
                            <div className="text-[9px] text-slate-400 font-normal">{w.section || 'Saha'}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* PIN Display */}
                  <div className="py-1 flex flex-col items-center justify-center space-y-1.5">
                    <div className="flex gap-2.5 justify-center">
                      {Array.from({ length: 4 }).map((_, idx) => {
                        const hasChar = waiterPinInput.length > idx;
                        return (
                          <motion.div
                            key={idx}
                            animate={waiterPinError ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                            transition={{ duration: 0.35 }}
                            className={`w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center ${
                              hasChar
                                ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.6)] scale-105'
                                : 'border-slate-700 bg-slate-950/60'
                            }`}
                          >
                            {hasChar && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </motion.div>
                        );
                      })}
                    </div>
                    {waiterPinError && (
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest animate-pulse">
                        ⚠️ {t('Hatalı PIN Kodu!', 'Invalid PIN!', 'Λανθασμένο PIN!')}
                      </p>
                    )}
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (waiterPinInput.length < 4) {
                            setWaiterPinError(false);
                            const newVal = waiterPinInput + num;
                            setWaiterPinInput(newVal);
                            if (newVal.length === 4) {
                              const waiters = getStoreWaiters(store?.branding || store);
                              const targetWaiter = selectedWaiterForPin || waiters.find(w => w.pin === newVal);
                              if (targetWaiter && (targetWaiter.pin === newVal || !selectedWaiterForPin)) {
                                setIsWaiterMode(true);
                                setActiveWaiter(targetWaiter);
                                localStorage.setItem(`digitalMenuWaiterMode_${storeId}`, 'true');
                                localStorage.setItem(`digitalMenuWaiterUser_${storeId}`, JSON.stringify(targetWaiter));
                                setShowWaiterModal(false);
                                setWaiterPinInput('');
                              } else {
                                setWaiterPinError(true);
                                setWaiterPinInput('');
                              }
                            }
                          }
                        }}
                        className="h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-base font-black text-slate-100 rounded-xl border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setWaiterPinInput('');
                        setWaiterPinError(false);
                      }}
                      className="h-10 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    >
                      {t('SİL', 'CLR', 'ΔΙΑΓ')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (waiterPinInput.length < 4) {
                          setWaiterPinError(false);
                          const newVal = waiterPinInput + '0';
                          setWaiterPinInput(newVal);
                          if (newVal.length === 4) {
                            const waiters = getStoreWaiters(store?.branding || store);
                            const targetWaiter = selectedWaiterForPin || waiters.find(w => w.pin === newVal);
                            if (targetWaiter && (targetWaiter.pin === newVal || !selectedWaiterForPin)) {
                              setIsWaiterMode(true);
                              setActiveWaiter(targetWaiter);
                              localStorage.setItem(`digitalMenuWaiterMode_${storeId}`, 'true');
                              localStorage.setItem(`digitalMenuWaiterUser_${storeId}`, JSON.stringify(targetWaiter));
                              setShowWaiterModal(false);
                              setWaiterPinInput('');
                            } else {
                              setWaiterPinError(true);
                              setWaiterPinInput('');
                            }
                          }
                        }
                      }}
                      className="h-10 bg-slate-800 hover:bg-slate-700 active:scale-95 text-base font-black text-slate-100 rounded-xl border border-slate-700/80 transition-all flex items-center justify-center cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const waiters = getStoreWaiters(store?.branding || store);
                        const targetWaiter = selectedWaiterForPin || waiters.find(w => w.pin === waiterPinInput);
                        if (targetWaiter && targetWaiter.pin === waiterPinInput) {
                          setIsWaiterMode(true);
                          setActiveWaiter(targetWaiter);
                          localStorage.setItem(`digitalMenuWaiterMode_${storeId}`, 'true');
                          localStorage.setItem(`digitalMenuWaiterUser_${storeId}`, JSON.stringify(targetWaiter));
                          setShowWaiterModal(false);
                          setWaiterPinInput('');
                        } else {
                          setWaiterPinError(true);
                          setWaiterPinInput('');
                        }
                      }}
                      className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center shadow-md shadow-emerald-700/30 cursor-pointer"
                    >
                      {t('GİRİŞ', 'ENTER', 'ΕΙΣ')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
