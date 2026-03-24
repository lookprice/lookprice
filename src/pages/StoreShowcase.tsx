import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ShoppingBasket, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  Store as StoreIcon,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  MapPin,
  Phone,
  Info,
  ArrowLeft
} from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category?: string;
  unit?: string;
  barcode?: string;
}

interface StoreInfo {
  id: number;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  slug: string;
  currency?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  about_text?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  address?: string;
  phone?: string;
}

interface BasketItem extends Product {
  quantity: number;
}

const ProductCard: React.FC<{ product: Product, store: StoreInfo | null, t: any, addToBasket: (p: Product) => void }> = ({ product, store, t, addToBasket }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all group"
  >
    <div className="aspect-square bg-gray-50 relative overflow-hidden">
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <Package className="w-12 h-12" />
        </div>
      )}
    </div>
    <div className="p-4">
      <div className="mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
          {product.category || t.dashboard.uncategorized}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 line-clamp-2 h-12 mb-2">
        {product.name}
      </h3>
      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">
            {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
          </span>
          {product.unit && (
            <span className="text-xs text-gray-500">/ {product.unit}</span>
          )}
        </div>
        <button 
          onClick={() => addToBasket(product)}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  </motion.div>
);

const StoreShowcase: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", address: "" });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [storeRes, productsRes] = await Promise.all([
          api.getPublicStore(slug),
          api.getPublicStoreProducts(slug)
        ]);

        if (storeRes.error) throw new Error(storeRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        setStore(storeRes);
        setProducts(productsRes);
      } catch (err: any) {
        setError(err.message || t.dashboard.storeLoadingError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
      else cats.add(t.dashboard.uncategorized);
    });
    return Array.from(cats).sort();
  }, [products, t]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const productCategory = p.category || t.dashboard.uncategorized;
      const matchesCategory = !selectedCategory || productCategory === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory, t]);

  const addToBasket = (product: Product) => {
    setBasket(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromBasket = (productId: number) => {
    setBasket(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const basketTotal = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || basket.length === 0) return;

    setCheckoutStatus('loading');
    try {
      const res = await api.createPublicSale({
        storeId: store.id,
        items: basket.map(item => ({
          productId: item.id,
          name: item.name,
          barcode: item.barcode,
          quantity: item.quantity,
          price: item.price
        })),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        total: basketTotal,
        currency: store.currency,
        paymentMethod: 'credit_card'
      });

      if (res.error) throw new Error(res.error);
      
      setCheckoutStatus('success');
      setBasket([]);
      setTimeout(() => {
        setIsCheckoutModalOpen(false);
        setCheckoutStatus('idle');
      }, 3000);
    } catch (err: any) {
      setCheckoutStatus('error');
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t.dashboard.storeLoading}</p>
        </div>
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.errorOccurred}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate("/")}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {t.dashboard.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-12 w-12 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <StoreIcon className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900">{store?.name}</h1>
          </div>
          
          <div className="relative hidden md:block w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder={t.dashboard.searchProducts}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none"
            />
          </div>

          <button 
            onClick={() => setIsBasketOpen(true)}
            className="relative p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ShoppingBasket className="w-6 h-6 text-gray-700" />
            {basketCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {basketCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder={t.dashboard.searchProducts}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all outline-none"
            />
          </div>
        </div>

        {/* Categories Bar */}
        {categories.length > 0 && (
          <div className="border-t bg-white/50 backdrop-blur-md overflow-x-auto no-scrollbar">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  !selectedCategory 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.dashboard.all}
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        {store?.hero_image_url ? (
          <img 
            src={store.hero_image_url} 
            alt={store.hero_title || store.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <img 
            src="https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=2048&auto=format&fit=crop" 
            alt="Kırtasiye ve Kitap" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-4">
          <div className="max-w-3xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg"
            >
              {store?.hero_title || store?.name}
            </motion.h2>
            {store?.hero_subtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-xl text-white/90 font-medium drop-shadow-md"
              >
                {store.hero_subtitle}
              </motion.p>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">{t.dashboard.noProductsFound}</h3>
            <p className="text-gray-500">{t.dashboard.noProductsDesc}</p>
          </div>
        ) : (
          <div>
            {selectedCategory || searchQuery ? (
              <>
                {selectedCategory && !searchQuery && (
                  <div className="flex items-center gap-4 mb-8">
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900">{selectedCategory}</h2>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} store={store} t={t} addToBasket={addToBasket} />
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-16">
                {categories.map(category => {
                  const categoryProducts = products.filter(p => (p.category || t.dashboard.uncategorized) === category);
                  if (categoryProducts.length === 0) return null;
                  
                  const displayProducts = categoryProducts.slice(0, 5);
                  
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                        {categoryProducts.length > 5 && (
                          <button 
                            onClick={() => setSelectedCategory(category)}
                            className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
                          >
                            {t.dashboard.seeAll} ({categoryProducts.length})
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {displayProducts.map((product) => (
                          <ProductCard key={product.id} product={product} store={store} t={t} addToBasket={addToBasket} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* About Us Section */}
        {store?.about_text && (
          <section className="mt-20 bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Info className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t.dashboard.aboutUs}</h2>
            </div>
            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">
              {store.about_text}
            </p>
          </section>
        )}

        {/* Contact & Social Section */}
        <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{t.dashboard.contactInfo}</h3>
            <div className="space-y-4">
              {store?.address && (
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="text-gray-600">{store.address}</p>
                </div>
              )}
              {store?.phone && (
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <p className="text-gray-600">{store.phone}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{t.dashboard.followUs}</h3>
            <div className="flex flex-wrap gap-4">
              {store?.instagram_url && (
                <a href={store.instagram_url} target="_blank" rel="noopener noreferrer" className="p-4 bg-pink-50 text-pink-600 rounded-2xl hover:scale-110 transition-transform">
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {store?.facebook_url && (
                <a href={store.facebook_url} target="_blank" rel="noopener noreferrer" className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:scale-110 transition-transform">
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {store?.twitter_url && (
                <a href={store.twitter_url} target="_blank" rel="noopener noreferrer" className="p-4 bg-sky-50 text-sky-600 rounded-2xl hover:scale-110 transition-transform">
                  <Twitter className="w-6 h-6" />
                </a>
              )}
              {store?.whatsapp_number && (
                <a href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-4 bg-green-50 text-green-600 rounded-2xl hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* WhatsApp Floating Button */}
      {store?.whatsapp_number && (
        <a 
          href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-24 right-6 z-40 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform md:bottom-6"
        >
          <MessageCircle className="w-8 h-8" />
        </a>
      )}

      {/* Floating Basket Summary (Mobile) */}
      {basketCount > 0 && !isBasketOpen && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-4 right-4 z-40 md:hidden"
        >
          <button 
            onClick={() => setIsBasketOpen(true)}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingBasket className="w-6 h-6" />
              </div>
              <span>{basketCount} {t.dashboard.productsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </motion.div>
      )}

      {/* Basket Sidebar */}
      <AnimatePresence>
        {isBasketOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBasketOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBasket className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold">{t.dashboard.basket}</h2>
                </div>
                <button onClick={() => setIsBasketOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {basket.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBasket className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{t.dashboard.emptyBasket}</h3>
                    <p className="text-gray-500 mt-2">{t.dashboard.startShopping}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {basket.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-blue-600 font-bold mt-1">
                            {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <button 
                              onClick={() => removeFromBasket(item.id)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => addToBasket(item)}
                              className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {basket.length > 0 && (
                <div className="p-6 border-t bg-gray-50">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-gray-600 font-medium">{t.dashboard.total}</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95"
                  >
                    {t.dashboard.checkout}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => checkoutStatus !== 'loading' && setIsCheckoutModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-8">
                {checkoutStatus === 'success' ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.orderReceived}</h2>
                    <p className="text-gray-600">{t.dashboard.orderReceivedDesc}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold text-gray-900">{t.dashboard.orderSummary}</h2>
                      <button 
                        onClick={() => setIsCheckoutModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.dashboard.customerName}</label>
                        <input 
                          required
                          type="text"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none"
                          placeholder={t.dashboard.customerName}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.dashboard.phone}</label>
                        <input 
                          required
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none"
                          placeholder="05xx xxx xx xx"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.dashboard.address}</label>
                        <textarea 
                          required
                          rows={3}
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl transition-all outline-none resize-none"
                          placeholder={t.dashboard.address}
                        />
                      </div>

                      {checkoutStatus === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-6">
                          <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                            <X className="w-4 h-4" />
                            {error || t.dashboard.orderError}
                          </p>
                        </div>
                      )}

                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-2xl">
                          <div className="flex flex-col">
                            <span className="text-blue-900 font-semibold">{t.dashboard.amountToPay}</span>
                            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">{t.dashboard.virtualPos}</span>
                          </div>
                          <span className="text-2xl font-bold text-blue-600">
                            {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                          </span>
                        </div>
                        <button 
                          type="submit"
                          disabled={checkoutStatus === 'loading'}
                          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {checkoutStatus === 'loading' ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin" />
                              {t.dashboard.processing}
                            </>
                          ) : (
                            t.dashboard.payWithCard
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreShowcase;
