import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Keyboard, 
  Plus, 
  Minus,
  ShoppingBag, 
  Trash2, 
  X,
  Camera,
  HelpCircle
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Logo from "../components/Logo";
import Scanner from "../components/Scanner";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";

export default function CustomerScanPage() {
  const { slug } = useParams();
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showAddedToast, setShowAddedToast] = useState(false);
  const [lastAdded, setLastAdded] = useState<any>(null);
  const [basket, setBasket] = useState<any[]>(() => {
    const saved = localStorage.getItem(`basket_${slug}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [showBasket, setShowBasket] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [saleStatus, setSaleStatus] = useState<string>("pending");

  useEffect(() => {
    let interval: any;
    if (orderCompleted && saleId) {
      interval = setInterval(async () => {
        try {
          const res = await api.getSaleStatus(saleId);
          if (res.status === 'completed') {
            setSaleStatus('completed');
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Status check error", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [orderCompleted, saleId]);

  useEffect(() => {
    fetchStore();
  }, [slug]);

  useEffect(() => {
    localStorage.setItem(`basket_${slug}`, JSON.stringify(basket));
  }, [basket, slug]);

  const fetchStore = async () => {
    const res = await api.getPublicStore(slug!);
    if (res.redirect) {
      window.location.href = res.redirect;
      return;
    }
    if (!res.error) setStore(res);
  };

  const handleScan = async (barcode: string) => {
    setScanning(false);
    setLoading(true);
    setError("");
    setShowManual(false);
    
    try {
      const res = await api.getProductBySlug(slug!, barcode);
      if (res.error) {
        setError(res.error);
        if (res.store) setStore(res.store);
      } else {
        setProduct(res);
        if (res.store) setStore(res.store);
      }
    } catch (e) {
      setError("Sunucu hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const addToBasket = (p: any, q: number = 1) => {
    setBasket(prev => {
      const existing = prev.find(item => item.id === p.id);
      if (existing) {
        return prev.map(item => item.id === p.id ? { ...item, quantity: item.quantity + q } : item);
      }
      return [...prev, { ...p, quantity: q }];
    });
    setProduct(null);
    setScanning(true);
    setQuantity(1);
    setLastAdded({ ...p, quantity: q });
    setShowAddedToast(true);
    setTimeout(() => setShowAddedToast(false), 2000);
  };

  const removeFromBasket = (id: number) => {
    setBasket(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setBasket(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = basket.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    const itemCurrency = item.currency || 'TRY';
    const storeCurrency = store?.default_currency || 'TRY';
    
    if (itemCurrency === storeCurrency) {
      return acc + (price * qty);
    }
    
    const rates = store?.currency_rates || { "USD": 45.0, "EUR": 48.5, "GBP": 56.2 }; // Updated default rates for TRY if missing
    let rate = 1;
    
    if (storeCurrency === 'TRY') {
      rate = rates[itemCurrency] || 1;
      return acc + (price * qty * rate);
    } else if (itemCurrency === 'TRY') {
      rate = 1 / (rates[storeCurrency] || 1);
      return acc + (price * qty * rate);
    } else {
      const toTry = rates[itemCurrency] || 1;
      const fromTry = 1 / (rates[storeCurrency] || 1);
      return acc + (price * qty * toTry * fromTry);
    }
  }, 0);

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString('tr-TR', { 
      style: 'currency', 
      currency: currency || 'TRY' 
    });
  };

  const getConvertedPrice = (price: number, fromCurrency: string) => {
    const storeCurrency = store?.default_currency || 'TRY';
    if (fromCurrency === storeCurrency) return null;

    const rates = store?.currency_rates || { "USD": 45.0, "EUR": 48.5, "GBP": 56.2 };
    let rate = 1;

    if (storeCurrency === 'TRY') {
      rate = rates[fromCurrency] || 1;
    } else if (fromCurrency === 'TRY') {
      rate = 1 / (rates[storeCurrency] || 1);
    } else {
      const toTry = rates[fromCurrency] || 1;
      const fromTry = 1 / (rates[storeCurrency] || 1);
      rate = toTry * fromTry;
    }

    return price * rate;
  };

  const [isSendingToPos, setIsSendingToPos] = useState(false);

  const handleCheckout = async () => {
    if (basket.length === 0) return;
    setLoading(true);
    try {
      const res = await api.createPublicSale({
        storeId: store.id,
        items: basket,
        totalAmount,
        currency: store.default_currency || 'TRY',
        customerName: 'Mobil Müşteri'
      });
      if (!res.error) {
        // POS Integration Simulation
        if (store?.fiscal_active) {
          setIsSendingToPos(true);
          // Simulate POS communication delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          setIsSendingToPos(false);
        }

        setSaleId(res.saleId);
        setOrderCompleted(true);
        setBasket([]);
        localStorage.removeItem(`basket_${slug}`);
      } else {
        alert(res.error);
      }
    } catch (e) {
      alert(lang === 'tr' ? "Sipariş oluşturulurken hata oluştu." : "Error creating order.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      handleScan(manualBarcode.trim());
    }
  };

  const getContrastColor = (hexcolor: string) => {
    if (!hexcolor) return 'white';
    const r = parseInt(hexcolor.slice(1, 3), 16);
    const g = parseInt(hexcolor.slice(3, 5), 16);
    const b = parseInt(hexcolor.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  };

  const primaryColor = store?.primary_color || "#4f46e5";
  const contrastColor = getContrastColor(primaryColor);

  if (orderCompleted) {
    return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center justify-center transition-colors duration-500" style={{ backgroundColor: primaryColor }}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white text-gray-900 rounded-[2rem] p-8 w-full max-w-md text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white"
        >
          <div className="bg-emerald-100 text-emerald-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={56} />
          </div>
          <h2 className="text-3xl font-black mb-3 text-gray-900">
            {saleStatus === 'completed' ? (lang === 'tr' ? 'ÖDEME ALINDI!' : 'PAYMENT RECEIVED!') : (t.saleCompleted?.toUpperCase() || 'SALE COMPLETED')}
          </h2>
          <p className="text-gray-600 font-bold mb-8 text-lg">
            {saleStatus === 'completed' ? (lang === 'tr' ? 'Alışverişiniz için teşekkür ederiz.' : 'Thank you for your purchase.') : (t.orderSent || 'Order sent')}
          </p>
          
          <div className="bg-gray-100 p-8 rounded-3xl mb-8 flex flex-col items-center border-2 border-gray-200">
            <p className="text-xs font-black text-gray-500 uppercase mb-4 tracking-[0.2em]">{t.orderCode}</p>
            <div className={`bg-white p-5 rounded-2xl shadow-xl border-4 mb-6 transition-all ${saleStatus === 'completed' ? 'border-emerald-500' : 'border-indigo-500'}`}>
              <QRCodeSVG value={String(saleId)} size={200} />
            </div>
            <p className={`text-4xl font-black tracking-widest ${saleStatus === 'completed' ? 'text-emerald-600' : 'text-indigo-600'}`}>#{saleId}</p>
            {saleStatus === 'pending' && (
              <div className="mt-6 flex items-center px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-black animate-pulse border border-orange-200">
                <Clock size={16} className="mr-2" /> {lang === 'tr' ? 'KASADA ÖDEME BEKLENİYOR' : 'AWAITING PAYMENT AT TILL'}
              </div>
            )}
          </div>

          <button 
            onClick={() => setOrderCompleted(false)}
            className="w-full py-5 rounded-2xl font-black shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:scale-95 transition-all text-xl uppercase tracking-wider"
            style={{ backgroundColor: primaryColor, color: contrastColor }}
          >
            {t.close}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 flex flex-col items-center transition-colors duration-500 relative overflow-hidden font-sans" style={{ backgroundColor: primaryColor }}>
      {/* Zebra/Barcode Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none overflow-hidden select-none flex flex-wrap gap-4 p-4">
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center rotate-12">
            <div className="w-12 h-1 bg-white mb-0.5" />
            <div className="w-12 h-2 bg-white mb-0.5" />
            <div className="w-12 h-0.5 bg-white mb-0.5" />
            <div className="w-12 h-3 bg-white mb-0.5" />
            <div className="text-[8px] font-mono mt-1">USD EUR GBP TRY</div>
          </div>
        ))}
      </div>

      {store?.background_image_url && (
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${store.background_image_url})` }}
        />
      )}
      
      <div className="w-full max-w-md text-center mb-4 md:mb-8 relative z-10">
        {store?.logo_url ? (
          <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-xl inline-block mb-4 md:mb-6 border-4 border-white/20">
            <img src={store.logo_url} alt={store.name} className="h-12 md:h-20 mx-auto object-contain" referrerPolicy="no-referrer" />
          </div>
        ) : (
          <Logo size={60} className="mx-auto mb-4 md:mb-6 text-white drop-shadow-lg" />
        )}
        <h1 className="text-2xl md:text-4xl font-black mb-1 md:mb-2 tracking-tight drop-shadow-md">{store?.name?.toUpperCase() || "PRICE CHECKER"}</h1>
        <p className="text-sm md:text-lg font-bold opacity-90 drop-shadow-sm">Barkodu tarayın, fiyatı görün!</p>
      </div>

      <div className="w-full max-w-md relative z-10">
        {scanning ? (
          <div className="w-full max-w-md space-y-6">
            <Scanner 
              onResult={handleScan} 
              onManualEntry={() => setShowManual(true)}
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full">
                <button 
                  onClick={() => setShowManual(!showManual)}
                  className="w-full flex items-center justify-center px-4 py-5 bg-white/20 hover:bg-white/30 rounded-3xl text-sm font-black transition-all border-2 border-white/40 backdrop-blur-xl shadow-2xl active:scale-95"
                >
                  <Keyboard className="h-5 w-5 mr-2" /> 
                  {showManual ? "KAMERA" : "ELLE GİR"}
                </button>
              </div>

              <div className="w-full">
                <button 
                  onClick={() => setShowTips(!showTips)}
                  className="w-full flex items-center justify-center px-4 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black transition-all border border-white/20 backdrop-blur-xl active:scale-95"
                >
                  <HelpCircle className="h-4 w-4 mr-2" /> 
                  TARAMA YARDIMI VE İPUÇLARI
                </button>
              </div>
  
              <AnimatePresence>
                {lastAdded && scanning && !showManual && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-white/10 backdrop-blur-xl p-4 rounded-3xl border-2 border-white/20 flex items-center space-x-4"
                  >
                    <div className="bg-emerald-500/20 p-2 rounded-xl">
                      <CheckCircle2 className="text-emerald-400" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">SON EKLENEN</p>
                      <p className="text-white font-bold truncate">{lastAdded.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black">{lastAdded.quantity} Adet</p>
                    </div>
                  </motion.div>
                )}

                {showTips && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full bg-indigo-900/40 backdrop-blur-xl p-6 rounded-[2rem] border-2 border-white/20 overflow-hidden"
                  >
                    <h4 className="text-sm font-black mb-4 uppercase tracking-widest text-indigo-200">Tarama İpuçları</h4>
                    <ul className="text-xs space-y-3 text-white/80 font-bold">
                      <li className="flex items-start">
                        <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center mr-3 text-[10px] shrink-0">1</span>
                        Barkodu sarı kutunun tam ortasına hizalayın.
                      </li>
                      <li className="flex items-start">
                        <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center mr-3 text-[10px] shrink-0">2</span>
                        Işığın barkodun üzerine doğrudan geldiğinden emin olun.
                      </li>
                      <li className="flex items-start">
                        <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center mr-3 text-[10px] shrink-0">3</span>
                        Kamera netlemiyorsa cihazı yavaşça yaklaştırıp uzaklaştırın.
                      </li>
                      <li className="flex items-start">
                        <span className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center mr-3 text-[10px] shrink-0">4</span>
                        Barkod hasarlıysa "ELLE GİR" butonunu kullanın.
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showManual && (
                  <motion.form 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onSubmit={handleManualSubmit}
                    className="w-full flex flex-col space-y-4 bg-white/10 backdrop-blur-2xl p-6 rounded-[2.5rem] border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                  >
                    <div className="space-y-2">
                      <label className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] ml-2">BARKOD NUMARASI</label>
                      <input 
                        type="tel" 
                        inputMode="numeric"
                        placeholder="Barkod numarasını yazın..."
                        className="w-full bg-white border-4 border-white/30 rounded-2xl px-6 py-5 text-gray-900 placeholder:text-gray-400 font-black text-2xl shadow-inner focus:ring-8 focus:ring-white/20 outline-none transition-all text-center tracking-[0.2em]"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-white text-gray-900 py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] hover:bg-gray-100"
                    >
                      SORGULA
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white text-gray-900 rounded-[2.5rem] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.4)] border-4 border-white overflow-hidden zebra-border-bold barcode-card"
          >
            {loading ? (
              <div className="text-center py-16 space-y-6">
                <div className="animate-spin h-16 w-16 border-8 border-indigo-600 border-t-transparent rounded-full mx-auto shadow-xl"></div>
                <p className="text-gray-900 font-black text-xl uppercase tracking-widest">Sorgulanıyor...</p>
              </div>
            ) : product ? (
              <div className="space-y-8">
                <div className="flex justify-center">
                  <div className="p-6 rounded-3xl shadow-inner" style={{ backgroundColor: `${primaryColor}15` }}>
                    <Logo size={64} className="text-indigo-600" />
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl font-black text-gray-900 leading-tight uppercase">{product.name}</h2>
                  <p className="text-gray-500 mt-2 font-bold tracking-widest">{lang === 'tr' ? 'BARKOD' : 'BARCODE'}: {product.barcode}</p>
                </div>
                <div className="p-8 rounded-[2.5rem] text-center shadow-[0_20px_40px_rgba(0,0,0,0.2)] transform -rotate-1 relative overflow-hidden" style={{ backgroundColor: primaryColor, color: contrastColor }}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                  <span className="text-xs uppercase font-black tracking-[0.4em] opacity-80 relative z-10">SATIŞ FİYATI</span>
                  <div className="text-6xl font-black mt-2 drop-shadow-2xl relative z-10 tracking-tight">
                    {formatCurrency(product.price, product.currency || store?.default_currency || 'TRY')}
                  </div>
                  {getConvertedPrice(product.price, product.currency || 'TRY') && (
                    <div className="text-xl font-bold mt-2 opacity-80 relative z-10">
                      ≈ {formatCurrency(getConvertedPrice(product.price, product.currency || 'TRY')!, store?.default_currency || 'TRY')}
                    </div>
                  )}
                </div>
                {product.description && (
                  <div className="text-gray-700 text-lg font-medium border-t-2 border-gray-100 pt-6 text-center italic">
                    "{product.description}"
                  </div>
                )}
                
                <div className="flex flex-col space-y-4 pt-4">
                  <div className="flex items-center justify-between bg-gray-100 p-2 rounded-3xl border-2 border-gray-200">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-all"
                    >
                      <Minus className="text-gray-900 h-8 w-8" />
                    </button>
                    <div className="text-center">
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">ADET</span>
                      <span className="text-3xl font-black text-gray-900">{quantity}</span>
                    </div>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-90 transition-all"
                    >
                      <Plus className="text-gray-900 h-8 w-8" />
                    </button>
                  </div>

                  <button 
                    onClick={() => addToBasket(product, quantity)}
                    className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black text-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all uppercase tracking-wider"
                  >
                    <ShoppingBag className="mr-3 h-8 w-8 stroke-[3px]" /> {t.addToBasket}
                  </button>
                  <button 
                    onClick={() => { setProduct(null); setScanning(true); setError(""); setQuantity(1); }}
                    className="w-full bg-gray-100 text-gray-900 py-5 rounded-2xl font-black text-xl active:scale-95 transition-all uppercase tracking-widest border-2 border-gray-200"
                  >
                    {t.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-6">
                <div className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle className="h-16 w-16 text-red-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 uppercase">HATA!</h2>
                <p className="text-gray-600 font-bold text-lg">{error || "Bu barkoda ait bir ürün kaydı bulunamadı."}</p>
                  <button 
                    onClick={() => { setScanning(true); setError(""); }}
                    className="w-full py-6 rounded-2xl font-black text-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest"
                    style={{ backgroundColor: primaryColor, color: contrastColor }}
                  >
                    TEKRAR DENE
                  </button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {basket.length > 0 && (
        <motion.button 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setShowBasket(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white text-gray-900 py-6 px-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 flex items-center justify-between border-4 border-white active:scale-95 transition-all"
          style={{ borderColor: `${primaryColor}60` }}
        >
          <div className="flex items-center space-x-4">
            <div className="relative bg-gray-100 p-3 rounded-2xl shadow-inner">
              <ShoppingBag size={32} className="text-indigo-600" />
              <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs w-7 h-7 rounded-full flex items-center justify-center font-black shadow-lg border-2 border-white">
                {basket.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sepet Toplamı</p>
              <p className="text-2xl font-black text-gray-900">
                {formatCurrency(totalAmount, store?.default_currency || 'TRY')}
              </p>
            </div>
          </div>
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg">
            <Plus size={24} className="rotate-45" />
          </div>
        </motion.button>
      )}

      <AnimatePresence>
        {showBasket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{t.basket}</h3>
                <button onClick={() => setShowBasket(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                {basket.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center shadow-inner zebra-border">
                      <ShoppingBag size={48} className="text-gray-300" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-900 font-black text-xl uppercase tracking-widest">SEPETİNİZ BOŞ</p>
                      <p className="text-gray-500 font-bold text-sm">Henüz bir ürün eklemediniz.</p>
                    </div>
                    <button 
                      onClick={() => setShowBasket(false)}
                      className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      TARAMAYA DÖN
                    </button>
                  </div>
                ) : (
                  basket.map(item => (
                    <div key={item.id} className="flex items-center space-x-4 bg-white border-2 border-gray-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow zebra-border">
                      <div className="flex-1">
                        <h4 className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">{item.name}</h4>
                        <div className="space-y-0.5">
                          <p className="text-sm font-black text-indigo-600 mt-1 tracking-wider">
                            {formatCurrency(item.price, item.currency || store?.default_currency || 'TRY')}
                          </p>
                          {getConvertedPrice(item.price, item.currency || 'TRY') && (
                            <p className="text-[10px] font-bold text-gray-400">
                              ≈ {formatCurrency(getConvertedPrice(item.price, item.currency || 'TRY')!, store?.default_currency || 'TRY')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center bg-gray-100 rounded-2xl p-1 border border-gray-200 shadow-inner">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-900 font-black text-xl active:scale-90 transition-all hover:bg-gray-50"
                          >
                            -
                          </button>
                          <span className="font-black w-10 text-center text-gray-900 text-lg">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-900 font-black text-xl active:scale-90 transition-all hover:bg-gray-50"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromBasket(item.id)}
                          className="text-red-500 p-3 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                        >
                          <Trash2 size={24} className="stroke-[3px]" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-8 bg-gray-100 border-t-4 border-gray-200 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 font-black text-lg uppercase tracking-widest">{t.total}</span>
                  <span className="text-4xl font-black text-gray-900">
                    {formatCurrency(totalAmount, store?.default_currency || 'TRY')}
                  </span>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={loading || basket.length === 0 || isSendingToPos}
                  className="w-full py-6 rounded-2xl font-black text-2xl shadow-[0_15px_30px_rgba(0,0,0,0.2)] flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all uppercase tracking-widest"
                  style={{ 
                    backgroundColor: primaryColor, 
                    color: contrastColor,
                    textShadow: contrastColor === 'white' ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  {isSendingToPos ? (lang === 'tr' ? "POS'A GÖNDERİLİYOR..." : "SENDING TO POS...") : (loading ? (lang === 'tr' ? "İŞLENİYOR..." : "PROCESSING...") : t.checkout)}
                </button>
                <button 
                  onClick={() => setShowBasket(false)}
                  className="w-full py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
                >
                  {lang === 'tr' ? 'ALIŞVERİŞE DEVAM ET' : 'CONTINUE SHOPPING'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showAddedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black shadow-2xl flex items-center space-x-3 uppercase tracking-widest"
          >
            <CheckCircle2 size={24} />
            <span>SEPETE EKLENDİ</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
