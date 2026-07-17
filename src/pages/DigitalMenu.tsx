import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBasket, CheckCircle2, Plus, Minus, Trash2, X, MessageSquare, AlertCircle, Edit3, ChevronDown, Check, Search, Keyboard } from "lucide-react";

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

  useEffect(() => {
    if (tableId) {
      setActiveTableId(tableId);
      setManualTableInput(tableId);
    }
  }, [tableId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!storeId) return;
      try {
        const [storeRes, productsRes, tablesRes] = await Promise.all([
          api.getBranding(Number(storeId)),
          api.getProducts("", Number(storeId), false),
          api.getRestaurantTables(Number(storeId)).catch(() => [])
        ]);
        setStore(storeRes);
        setProducts(Array.isArray(productsRes) ? productsRes : []);
        setAllTables(Array.isArray(tablesRes) ? tablesRes : []);
      } catch (error) {
        console.error("Fetch digital menu error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [storeId]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id);
      if (existingIndex > -1) {
        return prev.map((item, idx) => 
          idx === existingIndex 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, note: "" }];
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
          quantity: p.quantity
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
      alert("Sipariş verilirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Menü yükleniyor...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-2" />
        <p className="text-slate-800 font-bold text-lg">Mağaza bulunamadı.</p>
        <p className="text-slate-500 text-sm mt-1">QR kodu taratarak tekrar giriş yapmayı deneyebilirsiniz.</p>
      </div>
    );
  }

  const totalCartPrice = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-28 relative">
      {/* Brand Header */}
      <header className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex items-center gap-4 border border-slate-100">
        {store.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="h-14 w-14 rounded-2xl object-cover border border-slate-100" />
        ) : (
          <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl">
            {store.name?.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">{store.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {activeTableId ? (
              <button
                type="button"
                onClick={() => {
                  setManualTableInput(activeTableId);
                  setShowTableSelector(true);
                }}
                className="px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full text-xs font-bold border border-rose-100/50 transition-all flex items-center gap-1 cursor-pointer"
              >
                Masa: {activeTableId}
                <Edit3 className="w-3 h-3 text-rose-400" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setManualTableInput("");
                  setShowTableSelector(true);
                }}
                className="px-2.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-100/50 transition-all flex items-center gap-1 cursor-pointer"
              >
                Masa Seçilmedi
                <AlertCircle className="w-3 h-3 text-amber-500 animate-pulse" />
              </button>
            )}
            <span className="text-xs text-slate-400 font-medium">Dijital Menü</span>
          </div>
        </div>
      </header>

      {/* Warning alert if no table is selected */}
      {!activeTableId && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Masa Belirtilmedi</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Siparişinizin mutfağa iletilebilmesi için masa seçin.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setManualTableInput("");
              setShowTableSelector(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-amber-100 cursor-pointer shrink-0"
          >
            Masa Seç
          </button>
        </div>
      )}
      
      {/* Product List */}
      <div className="grid grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-28 object-cover rounded-xl mb-3" />
            ) : (
              <div className="w-full h-28 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-300 font-bold text-sm">
                Görsel Yok
              </div>
            )}
            <h3 className="font-bold text-slate-800 text-sm flex-grow line-clamp-2 leading-snug">{product.name}</h3>
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
              <p className="text-indigo-600 font-black text-sm">{product.price} ₺</p>
              <button 
                onClick={() => addToCart(product)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Ekle
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Order Cart Bar */}
      {cart.length > 0 && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-xl border border-indigo-100 flex justify-between items-center z-40"
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
              <span className="block text-xs text-slate-400 font-bold leading-none">Toplam Tutar</span>
              <span className="text-base font-black text-slate-800">{totalCartPrice.toFixed(2)} ₺</span>
            </div>
          </button>
          
          <button 
            onClick={() => setShowCart(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-100"
          >
            Siparişi İncele
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
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl border-t border-slate-100 z-50 max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Siparişinizi İnceleyin</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Özel isteklerinizi ürün bazında belirtebilirsiniz</p>
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
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{item.name}</h4>
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
                        placeholder="Özel istek / Not ekleyin (örn: Açık, demli, bol soslu)"
                        className="w-full bg-transparent border-none text-xs font-medium text-slate-600 outline-none placeholder-slate-400"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Sipariş Toplamı</span>
                  <span className="text-xl font-black text-slate-800">{totalCartPrice.toFixed(2)} ₺</span>
                </div>
                
                <button 
                  onClick={placeOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-100"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Siparişi Onayla ve Gönder
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
            className="fixed top-6 left-6 right-6 bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-emerald-500"
          >
            <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
            <div>
              <p className="font-extrabold text-sm">Siparişiniz Alındı!</p>
              <p className="text-xs text-emerald-100 mt-0.5">Siparişiniz başarıyla mutfağa ve kasaya iletildi.</p>
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
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl border-t border-slate-100 z-50 max-h-[85vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800">Masa Seçimi / Girişi</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Siparişinizin hangi masaya ait olduğunu belirleyin</p>
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
                {/* Custom / Crisis manual input */}
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-xs text-rose-800 uppercase tracking-wider">Manuel Masa Tanımlama</h3>
                  </div>
                  <p className="text-xs text-rose-600/80 font-medium leading-relaxed">
                    QR kod okunamadıysa veya listede olmayan özel bir masa ise aşağıya manuel olarak masa numarası veya adını yazıp onaylayabilirsiniz.
                  </p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={manualTableInput}
                      onChange={(e) => setManualTableInput(e.target.value)}
                      placeholder="Örn: 5, Bahçe 2, VIP"
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
                          alert("Lütfen geçerli bir masa adı veya numarası girin.");
                        }
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                    >
                      Onayla
                    </button>
                  </div>
                </div>

                {/* Pre-defined tables from database */}
                {allTables.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Tanımlı Masalar</h3>
                      <div className="relative max-w-[150px] w-full">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={tableSearchQuery}
                          onChange={(e) => setTableSearchQuery(e.target.value)}
                          placeholder="Masa Ara..."
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
    </div>
  );
}
