import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  CheckCircle2,
  X,
  Barcode,
  Package
} from "lucide-react";
import { translations } from "../translations";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { motion, AnimatePresence } from "motion/react";

interface FastPosTabProps {
  storeId?: number;
  onSaleComplete?: () => void;
}

const FastPosTab = ({ storeId, onSaleComplete }: FastPosTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<number | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    try {
      const res = await api.getProducts(searchTerm, storeId);
      const products = Array.isArray(res) ? res : [];
      setSearchResults(products);
      
      // If exact barcode match, add to cart immediately
      const exactMatch = products.find((p: any) => p.barcode === searchTerm);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm("");
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0.1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) return;
    
    try {
      setCompleting(true);
      const res = await api.createPosSale({
        items: cart,
        total,
        paymentMethod,
        customerName: 'Hızlı Satış',
        notes: 'Hızlı POS Modu'
      }, storeId);

      if (res.success) {
        setLastSaleId(res.saleId);
        setShowSuccess(true);
        setCart([]);
        if (onSaleComplete) onSaleComplete();
        
        setTimeout(() => {
          setShowSuccess(false);
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 3000);
      }
    } catch (error: any) {
      alert(error.message || "Satış tamamlanırken bir hata oluştu.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      {/* Left Side: Product Search & Selection */}
      <div className="lg:col-span-7 flex flex-col space-y-4 overflow-hidden">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder={lang === 'tr' ? "Barkod okutun veya ürün adı yazın..." : "Scan barcode or type product name..."}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  addToCart(searchResults[0]);
                }
              }}
            />
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto p-4">
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-center p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center group"
                >
                  <div className="h-12 w-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="h-10 w-10 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Package className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <span className="text-sm font-bold text-slate-800 line-clamp-1">{product.name}</span>
                  <span className="text-xs font-bold text-indigo-600 mt-1">{product.price} {product.currency || 'TRY'}</span>
                </button>
              ))}
            </div>
          ) : searchTerm.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Search className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm font-medium">{lang === 'tr' ? 'Ürün bulunamadı' : 'No products found'}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Barcode className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-sm font-medium">{lang === 'tr' ? 'Satış yapmak için ürün seçin veya barkod okutun' : 'Select products or scan barcode to start sale'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Cart & Checkout */}
      <div className="lg:col-span-5 flex flex-col space-y-4 overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800">{lang === 'tr' ? 'Satış Sepeti' : 'Sales Cart'}</h3>
            </div>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
              {cart.length} {lang === 'tr' ? 'Kalem' : 'Items'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {cart.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs font-medium text-slate-500">{item.price} {item.currency || 'TRY'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm font-medium">{lang === 'tr' ? 'Sepet boş' : 'Cart is empty'}</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">{lang === 'tr' ? 'Toplam Tutar' : 'Total Amount'}</span>
              <span className="text-3xl font-black text-slate-900">{total.toFixed(2)} ₺</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold ${
                  paymentMethod === 'cash' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <Banknote className="h-5 w-5" />
                {lang === 'tr' ? 'Nakit' : 'Cash'}
              </button>
              <button 
                onClick={() => setPaymentMethod('credit_card')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all font-bold ${
                  paymentMethod === 'credit_card' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                {lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}
              </button>
            </div>

            <button 
              disabled={cart.length === 0 || completing}
              onClick={handleFinalizeSale}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
            >
              {completing ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6" />
                  {lang === 'tr' ? 'Satışı Tamamla' : 'Complete Sale'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">{lang === 'tr' ? 'Satış Başarılı!' : 'Sale Successful!'}</h2>
              <p className="text-slate-500 font-medium mb-6">
                {lang === 'tr' ? `Satış #${lastSaleId} başarıyla kaydedildi.` : `Sale #${lastSaleId} recorded successfully.`}
              </p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                {lang === 'tr' ? 'Devam Et' : 'Continue'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FastPosTab;
