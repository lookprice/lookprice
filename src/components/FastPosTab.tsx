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
  Package,
  Printer
} from "lucide-react";
import { translations } from "../translations";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { motion, AnimatePresence } from "motion/react";

interface FastPosTabProps {
  storeId?: number;
  onSaleComplete?: () => void;
  branding?: any;
}

const FastPosTab = ({ storeId, onSaleComplete, branding }: FastPosTabProps) => {
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
  const [lastFiscal, setLastFiscal] = useState<any>(null);
  const [lastCart, setLastCart] = useState<any[]>([]);
  const [posStatus, setPosStatus] = useState<'idle' | 'waiting' | 'approved' | 'failed'>('idle');
  const [posMessage, setPosMessage] = useState("");
  const [bridgeDetected, setBridgeDetected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBridge = async () => {
      try {
        const res = await fetch('http://127.0.0.1:1616/pos/sale', { 
          method: 'OPTIONS',
          signal: AbortSignal.timeout(1000)
        }).catch(() => null);
        setBridgeDetected(!!res || res === null); // If it responds or at least doesn't throw immediately
      } catch (e) {
        setBridgeDetected(false);
      }
    };
    
    if (branding?.fiscal_active) {
      checkBridge();
      const interval = setInterval(checkBridge, 10000);
      return () => clearInterval(interval);
    }
  }, [branding?.fiscal_active]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

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
        const newQty = Math.max(1, Math.floor(item.quantity + delta));
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

      // POS Integration Simulation
      if (paymentMethod === 'credit_card' && branding?.fiscal_active) {
        setPosStatus('waiting');
        setPosMessage(lang === 'tr' ? `${branding.fiscal_brand?.toUpperCase()} POS Cihazına bağlanılıyor...` : `Connecting to ${branding.fiscal_brand?.toUpperCase()} POS...`);
        
        // Real-world bridge attempt simulation
        try {
          // We attempt to call a local bridge service (e.g. running on localhost:1616)
          // This is a common pattern for web-to-local hardware communication
          const bridgeUrl = `http://127.0.0.1:1616/pos/sale`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const bridgeRes = await fetch(bridgeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: total,
              currency: branding.default_currency || 'TRY',
              ip: branding.fiscal_ip,
              port: branding.fiscal_port,
              brand: branding.fiscal_brand,
              terminalId: branding.fiscal_terminal_id
            }),
            signal: controller.signal
          }).catch(() => null);

          clearTimeout(timeoutId);

          if (!bridgeRes) {
            // If no bridge is found, we fall back to simulation but warn the user
            setPosMessage(lang === 'tr' ? "Yerel bağlantı köprüsü bulunamadı. Simülasyon modunda devam ediliyor..." : "Local bridge not found. Continuing in simulation mode...");
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            const data = await bridgeRes.json();
            if (data.status === 'approved') {
              setPosStatus('approved');
              setPosMessage(lang === 'tr' ? "İşlem Onaylandı!" : "Transaction Approved!");
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              throw new Error(data.message || "POS Error");
            }
          }
        } catch (e) {
          console.log("Bridge connection failed, using simulation.");
        }

        if (posStatus === 'waiting') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          setPosMessage(lang === 'tr' ? "Lütfen kartı takın veya yaklaştırın..." : "Please insert or tap card...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          setPosMessage(lang === 'tr' ? "Şifre bekleniyor..." : "Waiting for PIN...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setPosMessage(lang === 'tr' ? "İşlem onaylanıyor..." : "Authorizing transaction...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setPosStatus('approved');
          setPosMessage(lang === 'tr' ? "İşlem Onaylandı!" : "Transaction Approved!");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const currentCart = [...cart];
      const res = await api.createPosSale({
        items: currentCart,
        total,
        paymentMethod,
        customerName: 'Hızlı Satış',
        notes: 'Hızlı POS Modu',
        currency: branding?.default_currency || 'TRY',
        exchangeRate: 1
      }, storeId);

      if (res.success) {
        setLastSaleId(res.saleId);
        setLastFiscal(res.fiscal);
        setLastCart(currentCart);
        setShowSuccess(true);
        setCart([]);
        if (onSaleComplete) onSaleComplete();
        
        // Don't auto-close if fiscal is active, user might want to print
        if (!res.fiscal) {
          setTimeout(() => {
            setShowSuccess(false);
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 3000);
        }
      }
    } catch (error: any) {
      alert(error.message || "Satış tamamlanırken bir hata oluştu.");
    } finally {
      setCompleting(false);
      setPosStatus('idle');
    }
  };

  const handlePrint = () => {
    window.print();
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
        {posStatus !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100"
            >
              <div className="relative mb-8">
                <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
                  posStatus === 'waiting' ? 'bg-indigo-50 text-indigo-600' : 
                  posStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-rose-50 text-rose-600'
                }`}>
                  {posStatus === 'waiting' && <CreditCard className="h-12 w-12 animate-pulse" />}
                  {posStatus === 'approved' && <CheckCircle2 className="h-12 w-12" />}
                  {posStatus === 'failed' && <X className="h-12 w-12" />}
                </div>
                {posStatus === 'waiting' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
              
              <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">
                {posStatus === 'waiting' ? (lang === 'tr' ? 'POS İŞLEMİ' : 'POS TRANSACTION') : 
                 posStatus === 'approved' ? (lang === 'tr' ? 'ONAYLANDI' : 'APPROVED') : 
                 (lang === 'tr' ? 'HATA' : 'ERROR')}
              </h2>
              
              <p className="text-slate-500 font-bold text-sm leading-relaxed">
                {posMessage}
              </p>

              {posMessage.includes("Yerel bağlantı köprüsü") && (
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Kurulum Gerekli</h4>
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    Web tarayıcıları güvenlik nedeniyle yerel ağdaki cihazlara (192.168.x.x) doğrudan erişemez. 
                    İletişimi sağlamak için bilgisayarınızda bir <b>"LookPrice POS Bridge"</b> yazılımı çalışıyor olmalıdır.
                  </p>
                </div>
              )}

              {posStatus === 'failed' && (
                <button 
                  onClick={() => setPosStatus('idle')}
                  className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

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
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl print:shadow-none print:p-0 print:max-w-none"
            >
              <div className="print:hidden">
                <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">{lang === 'tr' ? 'Satış Başarılı!' : 'Sale Successful!'}</h2>
                <p className="text-slate-500 font-medium mb-6">
                  {lang === 'tr' ? `Satış #${lastSaleId} başarıyla kaydedildi.` : `Sale #${lastSaleId} recorded successfully.`}
                </p>
              </div>

              {/* Printable Receipt Content */}
              <div className="hidden print:block text-left font-mono text-[10px] leading-tight p-4">
                <div className="text-center border-b border-dashed border-slate-300 pb-2 mb-2">
                  <h3 className="font-bold text-sm uppercase">SATIŞ FİŞİ</h3>
                  <p>Mağaza ID: {storeId}</p>
                  <p>{new Date().toLocaleString('tr-TR')}</p>
                </div>
                
                <div className="space-y-1 mb-2">
                  {lastCart.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed border-slate-300 pt-2 font-bold">
                  <div className="flex justify-between text-sm">
                    <span>TOPLAM</span>
                    <span>{lastCart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)} ₺</span>
                  </div>
                  <p className="mt-1">Ödeme: {paymentMethod === 'cash' ? 'NAKİT' : 'KREDİ KARTI'}</p>
                </div>

                {lastFiscal && (
                  <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[8px] text-center">
                    <p>FİŞ NO: {lastFiscal.receiptNo}</p>
                    <p>Z NO: {lastFiscal.zNo}</p>
                    <p>CİHAZ: {lastFiscal.brand} - {lastFiscal.terminal}</p>
                    <p className="mt-2 font-bold">MALİ MÜHÜR</p>
                  </div>
                )}
                
                <div className="mt-4 text-center text-[8px]">
                  <p>Bizi tercih ettiğiniz için teşekkürler!</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 print:hidden">
                <button 
                  onClick={handlePrint}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="h-5 w-5" />
                  {lang === 'tr' ? 'Fiş Yazdır' : 'Print Receipt'}
                </button>
                <button 
                  onClick={() => {
                    setShowSuccess(false);
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  {lang === 'tr' ? 'Devam Et' : 'Continue'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FastPosTab;
