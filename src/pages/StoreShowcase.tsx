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
  ChevronLeft,
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
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Eye,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "../translations";
import ErrorBoundary from "../components/ErrorBoundary";

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category?: string;
  sub_category?: string;
  brand?: string;
  author?: string;
  labels?: string[];
  unit?: string;
  barcode?: string;
}

interface FAQEntry {
  question: string;
  answer: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url?: string;
  date: string;
}

interface LegalPage {
  title: string;
  content: string;
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
  faq?: FAQEntry[];
  blog_posts?: BlogPost[];
  legal_pages?: {
    kvkk?: LegalPage;
    privacy?: LegalPage;
    sales_agreement?: LegalPage;
    pre_info?: LegalPage;
  };
}

interface BasketItem extends Product {
  quantity: number;
}

const ProductCard: React.FC<{ 
  product: Product, 
  store: StoreInfo | null, 
  t: any, 
  addToBasket: (p: Product) => void,
  onView: (p: Product) => void,
  primaryColor: string
}> = ({ product, store, t, addToBasket, onView, primaryColor }) => {
  const { lang } = useLanguage();
  return (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group relative"
  >
    <div className="aspect-square bg-gray-50 relative overflow-hidden">
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <Package className="w-12 h-12" />
        </div>
      )}
      
      {/* Product Labels */}
      {product.labels && product.labels.length > 0 && (
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.labels.map((label, idx) => (
            <span 
              key={idx} 
              className="px-2 py-1 bg-white/90 backdrop-blur-sm text-[9px] font-black uppercase tracking-widest rounded shadow-sm"
              style={{ color: primaryColor }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button 
          onClick={() => onView(product)}
          className="p-3 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button 
          onClick={() => addToBasket(product)}
          className="p-3 text-white rounded-full transition-colors shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span 
            className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded w-fit"
            style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}
          >
            {product.category || t.dashboard.uncategorized}
          </span>
          {product.sub_category && (
            <span className="text-[9px] text-gray-400 font-medium mt-0.5 ml-1">
              {product.sub_category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-[10px] font-bold text-gray-500">4.8</span>
        </div>
      </div>
      
      {product.brand && (
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          {lang === 'tr' ? 'MARKA' : 'BRAND'}: {product.brand}
        </div>
      )}

      <h3 
        className="font-semibold text-gray-900 line-clamp-2 h-10 mb-1 transition-colors cursor-pointer group-hover:opacity-80 text-sm" 
        onClick={() => onView(product)}
        style={{ color: primaryColor }}
      >
        {product.name}
      </h3>

      {product.author && (
        <div className="text-[10px] text-gray-400 italic mb-2">
          {lang === 'tr' ? 'YAZAR' : 'AUTHOR'}: {product.author}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-900">
            {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
          </span>
          {product.unit && (
            <span className="text-xs text-gray-500">/ {product.unit}</span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
  );
};

const ProductDetailModal: React.FC<{
  product: Product | null;
  store: StoreInfo | null;
  t: any;
  onClose: () => void;
  addToBasket: (p: Product) => void;
  primaryColor: string;
}> = ({ product, store, t, onClose, addToBasket, primaryColor }) => {
  const { lang } = useLanguage();
  const [branchStocks, setBranchStocks] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    if (product?.barcode && store?.slug) {
      setLoadingBranches(true);
      api.getPublicProductBranchStock(store.slug, product.barcode)
        .then(res => {
          if (!res.error) setBranchStocks(res);
        })
        .finally(() => setLoadingBranches(false));
    }
  }, [product?.barcode, store?.slug]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-md hover:bg-white rounded-full transition-colors z-20 shadow-lg"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="md:w-1/2 bg-gray-50 relative overflow-hidden h-64 md:h-auto">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package className="w-24 h-24" />
            </div>
          )}
        </div>

        <div className="md:w-1/2 p-8 overflow-y-auto">
          <div className="mb-4 flex flex-wrap gap-2">
            {product.labels?.map((label, idx) => (
              <span 
                key={idx}
                className="text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {label}
              </span>
            ))}
            <span 
              className="text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full"
              style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}
            >
              {product.category || t.dashboard.uncategorized}
            </span>
            {product.sub_category && (
              <span className="text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                {product.sub_category}
              </span>
            )}
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight">
            {product.name}
          </h2>
          {(product.brand || product.author) && (
            <div className="flex flex-col gap-1 mb-4">
              {product.brand && (
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {lang === 'tr' ? 'MARKA' : 'BRAND'}: <span className="text-gray-900">{product.brand}</span>
                </div>
              )}
              {product.author && (
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {lang === 'tr' ? 'YAZAR' : 'AUTHOR'}: <span className="text-gray-900">{product.author}</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-extrabold" style={{ color: primaryColor }}>
              {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
            </span>
            {product.unit && (
              <span className="text-lg text-gray-400">/ {product.unit}</span>
            )}
          </div>

          <div className="prose prose-blue max-w-none mb-8">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">{t.dashboard.description}</h4>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {product.description || t.dashboard.noProductsDesc}
            </p>
          </div>

          {/* Branch Availability Section */}
          {branchStocks.length > 0 && (
            <div className="mb-8 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                <MapPin className="w-3 h-3 mr-1.5" style={{ color: primaryColor }} />
                Mağaza Stok Durumu
              </h4>
              <div className="space-y-3">
                {branchStocks.map((bs, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${bs.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-400'}`}></div>
                      <span className="text-xs font-bold text-gray-700">{bs.store_name}</span>
                    </div>
                    <span className={`text-xs font-black ${bs.stock_quantity > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {bs.stock_quantity > 0 ? `${bs.stock_quantity} Adet` : 'Tükendi'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <Truck className="w-5 h-5" style={{ color: primaryColor }} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">{t.dashboard.fastDelivery}</span>
                <span className="text-[10px] text-gray-500">24-48 Saat</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-900">{t.dashboard.securePayment}</span>
                <span className="text-[10px] text-gray-500">SSL Encrypted</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              addToBasket(product);
              onClose();
            }}
            className="w-full py-4 text-white rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
          >
            <ShoppingBasket className="w-6 h-6" />
            {t.dashboard.addToCart}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", address: "", email: "", password: "" });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer' | 'cash_on_delivery'>('credit_card');
  const [customer, setCustomer] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showFaq, setShowFaq] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [showLegal, setShowLegal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [storeRes, productsRes] = await Promise.all([
          api.getPublicStore(slug),
          api.getPublicStoreProducts(slug)
        ]);

        if (storeRes.redirect) {
          navigate(storeRes.redirect, { replace: true });
          return;
        }

        if (storeRes.error) throw new Error(storeRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        setStore(storeRes);
        setProducts(productsRes);
        
        // If customer is logged in, sync their info to checkout
        if (customer) {
          setCustomerInfo({
            name: customer.name || "",
            phone: customer.phone || "",
            address: customer.address || "",
            email: customer.email || "",
            password: ""
          });
        }
      } catch (err: any) {
        setError(err.message || t.dashboard.storeLoadingError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, customer?.id]);

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.customerLogin({
        email: customerInfo.email,
        password: customerInfo.password,
        storeId: store?.id
      });
      if (res.error) throw new Error(res.error);
      setCustomer(res.customer);
      localStorage.setItem('customer', JSON.stringify(res.customer));
      localStorage.setItem('customerToken', res.token);
      setShowAuthModal(false);
      setCustomerInfo(prev => ({
        ...prev,
        name: res.customer.name,
        phone: res.customer.phone,
        address: res.customer.address
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.customerRegister({
        name: customerInfo.name,
        email: customerInfo.email,
        password: customerInfo.password,
        phone: customerInfo.phone,
        address: customerInfo.address,
        storeId: store?.id
      });
      if (res.error) throw new Error(res.error);
      
      // Auto login after registration
      const loginRes = await api.customerLogin({
        email: customerInfo.email,
        password: customerInfo.password,
        storeId: store?.id
      });
      
      if (loginRes.error) throw new Error(loginRes.error);
      
      setCustomer(loginRes.customer);
      localStorage.setItem('customer', JSON.stringify(loginRes.customer));
      localStorage.setItem('customerToken', loginRes.token);
      setShowAuthModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    setCustomer(null);
    localStorage.removeItem('customer');
    localStorage.removeItem('customerToken');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const shuffledProducts = useMemo(() => {
    if (!products.length) return [];
    // Stable shuffle based on product ID to avoid jumping items on re-renders but still feel "mixed"
    return [...products].sort((a, b) => {
      const hashA = (a.id * 15485863) % 1000000;
      const hashB = (b.id * 15485863) % 1000000;
      return hashA - hashB;
    });
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Map<string, Set<string>>();
    products.forEach(p => {
      const cat = p.category || t.dashboard.uncategorized;
      if (!cats.has(cat)) cats.set(cat, new Set());
      if (p.sub_category) cats.get(cat)!.add(p.sub_category);
    });
    return cats;
  }, [products, t]);

  const sortedAndFilteredProducts = useMemo(() => {
    const baseProducts = sortBy === 'default' && !searchQuery && !selectedCategory ? shuffledProducts : products;
    
    let result = baseProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const productCategory = p.category || t.dashboard.uncategorized;
      const matchesCategory = !selectedCategory || productCategory === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || p.sub_category === selectedSubCategory;
      
      return matchesSearch && matchesCategory && matchesSubCategory;
    });

    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, shuffledProducts, searchQuery, selectedCategory, sortBy, t]);

  const totalPages = Math.ceil(sortedAndFilteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredProducts, currentPage]);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);
  const newArrivals = useMemo(() => [...products].reverse().slice(0, 8), [products]);
  const bestSellers = useMemo(() => [...products].sort((a, b) => b.id - a.id).slice(0, 8), [products]);

  const primaryColor = store?.primary_color || "#2563eb"; // Default blue-600

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
    <ErrorBoundary lang={lang}>
      <div className="min-h-screen bg-white pb-24 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-[60] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/s/${slug}`)}>
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-10 w-10 md:h-12 md:w-12 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div 
                className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
              >
                <StoreIcon className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-lg md:text-xl font-black text-gray-900 tracking-tight hidden sm:block">{store?.name}</h1>
          </div>
          
          <div className="flex-1 max-w-2xl relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder={t.dashboard.searchProducts}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none text-sm font-medium focus:border-blue-500"
              style={{ borderFocusColor: primaryColor } as any}
            />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {customer ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate(`/s/${slug}/profile`)}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all flex items-center gap-2"
                >
                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                    {customer.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-gray-700 hidden lg:block">{customer.name}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-3 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all flex items-center gap-2 group"
              >
                <ShieldCheck className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-bold text-gray-700 hidden lg:block">{t.dashboard.login || 'Giriş Yap'}</span>
              </button>
            )}
            <button 
              onClick={() => setIsBasketOpen(true)}
              className="relative p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all active:scale-95 group"
            >
              <ShoppingBasket className="w-6 h-6 text-gray-700 group-hover:text-blue-600 transition-colors" style={{ color: basketCount > 0 ? primaryColor : undefined }} />
              {basketCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {basketCount}
                </span>
              )}
            </button>
          </div>
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
              className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none text-sm font-medium"
            />
          </div>
        </div>

        {/* Categories Bar */}
        {categories.size > 0 && (
          <div className="border-t bg-white overflow-x-auto no-scrollbar">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedCategory(null); setSelectedSubCategory(null); }}
                  className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest ${
                    !selectedCategory 
                      ? "text-white shadow-xl" 
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  style={{ 
                    backgroundColor: !selectedCategory ? primaryColor : undefined,
                    boxShadow: !selectedCategory ? `0 10px 25px -5px ${primaryColor}40` : undefined
                  }}
                >
                  {t.dashboard.all}
                </button>
                {Array.from(categories.keys()).sort().map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSelectedSubCategory(null); }}
                    className={`px-5 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest ${
                      selectedCategory === cat
                        ? "text-white shadow-xl" 
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                    style={{ 
                      backgroundColor: selectedCategory === cat ? primaryColor : undefined,
                      boxShadow: selectedCategory === cat ? `0 10px 25px -5px ${primaryColor}40` : undefined
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              {/* Sub-categories row */}
              {selectedCategory && categories.get(selectedCategory)!.size > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 pl-4 border-l-2 border-gray-100 ml-2"
                >
                  <button
                    onClick={() => setSelectedSubCategory(null)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all uppercase tracking-wider ${
                      !selectedSubCategory 
                        ? "bg-gray-900 text-white" 
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    {t.dashboard.all || 'Hepsi'}
                  </button>
                  {Array.from(categories.get(selectedCategory)!).sort().map(sub => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubCategory(sub)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all uppercase tracking-wider ${
                        selectedSubCategory === sub
                          ? "bg-gray-900 text-white" 
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[600px] overflow-hidden">
        {store?.hero_image_url ? (
          <img 
            src={store.hero_image_url} 
            alt={store.hero_title || store.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2048&auto=format&fit=crop" 
            alt="Store Hero" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center text-center p-4">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 inline-block"
            >
              <span 
                className="px-4 py-1.5 text-white text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-2xl"
                style={{ backgroundColor: primaryColor }}
              >
                {store?.name}
              </span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter"
            >
              {store?.hero_title || store?.name}
            </motion.h2>
            {store?.hero_subtitle && (
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-2xl text-white/80 font-medium max-w-2xl mx-auto leading-relaxed"
              >
                {store.hero_subtitle}
              </motion.p>
            )}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10"
            >
              <button 
                onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-2xl active:scale-95"
              >
                {t.dashboard.startShopping}
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-50 border-y py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-5 group">
            <div 
              className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"
              style={{ color: primaryColor }}
            >
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-black text-gray-900 uppercase tracking-wider text-sm">{t.dashboard.fastDelivery}</h4>
              <p className="text-gray-500 text-xs mt-1">Tüm siparişlerde hızlı teslimat</p>
            </div>
          </div>
          <div className="flex items-center gap-5 group">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-green-600 shadow-xl group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-black text-gray-900 uppercase tracking-wider text-sm">{t.dashboard.securePayment}</h4>
              <p className="text-gray-500 text-xs mt-1">256-bit SSL güvenli ödeme altyapısı</p>
            </div>
          </div>
          <div className="flex items-center gap-5 group">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-xl group-hover:scale-110 transition-transform">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-black text-gray-900 uppercase tracking-wider text-sm">{t.dashboard.returnPolicy}</h4>
              <p className="text-gray-500 text-xs mt-1">14 gün içinde kolay iade garantisi</p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-16" id="products-grid">
        {/* Shop By Category Section */}
        {!selectedCategory && !searchQuery && categories.size > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.dashboard.shopByCategory}</h2>
                <div className="h-1.5 w-20 mt-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from(categories.keys()).sort().map((cat, idx) => (
                <motion.button
                  key={cat}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedCategory(cat)}
                  className="bg-gray-50 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 group"
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                  >
                    <Package className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-gray-900 text-sm text-center group-hover:text-blue-600 transition-colors">{cat}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {!selectedCategory && !searchQuery && featuredProducts.length > 0 && (
          <section className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.dashboard.featuredProducts}</h2>
                <div className="h-1.5 w-20 mt-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map(p => (
                <ProductCard key={p.id} product={p} store={store} t={t} addToBasket={addToBasket} onView={setSelectedProduct} primaryColor={primaryColor} />
              ))}
            </div>
          </section>
        )}

        {/* Sorting & Filter Header */}
        {(selectedCategory || searchQuery) && (
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div className="flex items-center gap-4">
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
              )}
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                {selectedCategory || (searchQuery ? `"${searchQuery}"` : t.dashboard.all)}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-10 pr-10 py-2.5 bg-gray-100 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                  <option value="default">{t.dashboard.sort}</option>
                  <option value="priceAsc">{t.dashboard.priceLowToHigh}</option>
                  <option value="priceDesc">{t.dashboard.priceHighToLow}</option>
                </select>
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {sortedAndFilteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">{t.dashboard.noProductsFound}</h3>
            <p className="text-gray-500 max-w-xs mx-auto">{t.dashboard.noProductsDesc}</p>
            <button 
              onClick={() => { setSearchQuery(""); setSelectedCategory(null); }}
              className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Tüm Ürünleri Gör
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  store={store} 
                  t={t} 
                  addToBasket={addToBasket} 
                  onView={setSelectedProduct} 
                  primaryColor={primaryColor}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-4 bg-white border-2 border-gray-100 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (totalPages > 7) {
                      if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                        if (page === 2 || page === totalPages - 1) return <span key={page} className="px-2 text-gray-400">...</span>;
                        return null;
                      }
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => {
                          setCurrentPage(page);
                          document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-12 h-12 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                          currentPage === page 
                            ? "text-white shadow-xl" 
                            : "bg-white border-2 border-gray-100 text-gray-500 hover:bg-gray-50"
                        }`}
                        style={{ 
                          backgroundColor: currentPage === page ? primaryColor : undefined,
                          boxShadow: currentPage === page ? `0 10px 25px -5px ${primaryColor}40` : undefined
                        }}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-4 bg-white border-2 border-gray-100 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </>
        )}

        {/* New Arrivals Section */}
        {!selectedCategory && !searchQuery && newArrivals.length > 0 && (
          <section className="mt-32">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.dashboard.newArrivals}</h2>
                <div className="h-1.5 w-20 mt-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.map(p => (
                <ProductCard key={p.id} product={p} store={store} t={t} addToBasket={addToBasket} onView={setSelectedProduct} primaryColor={primaryColor} />
              ))}
            </div>
          </section>
        )}

        {/* Best Sellers Section */}
        {!selectedCategory && !searchQuery && bestSellers.length > 0 && (
          <section className="mt-32">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.dashboard.bestSellers}</h2>
                <div className="h-1.5 w-20 mt-2 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {bestSellers.map(p => (
                <ProductCard key={p.id} product={p} store={store} t={t} addToBasket={addToBasket} onView={setSelectedProduct} primaryColor={primaryColor} />
              ))}
            </div>
          </section>
        )}

        {/* Testimonials Section */}
        {!selectedCategory && !searchQuery && (
          <section className="mt-32">
            <div className="flex flex-col items-center text-center mb-16">
              <h2 className="text-4xl font-black text-gray-900 mb-4">{t.dashboard.testimonials}</h2>
              <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: primaryColor }}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Ahmet Y.", comment: "Ürünler çok kaliteli ve hızlı geldi. Teşekkürler!", rating: 5 },
                { name: "Selin K.", comment: "Müşteri hizmetleri çok ilgili. Kesinlikle tavsiye ederim.", rating: 5 },
                { name: "Mehmet A.", comment: "Fiyat performans açısından harika ürünler.", rating: 4 }
              ].map((testi, i) => (
                <div key={i} className="bg-gray-50 p-8 rounded-[32px] relative">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testi.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 italic mb-6 leading-relaxed">"{testi.comment}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <span className="font-bold text-gray-900">{testi.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About Us Section */}
        {store?.about_text && (
          <section className="mt-32 bg-gray-900 rounded-[40px] p-8 md:p-20 text-white relative overflow-hidden">
            <div 
              className="absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full"
              style={{ backgroundColor: `${primaryColor}20` }}
            ></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full"></div>
            
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center"
                  style={{ color: primaryColor }}
                >
                  <Info className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-widest">{t.dashboard.aboutUs}</h2>
              </div>
              <p className="text-white/70 leading-relaxed text-xl font-medium whitespace-pre-wrap italic">
                "{store.about_text}"
              </p>
            </div>
          </section>
        )}
        {/* Newsletter Section */}
        {!selectedCategory && !searchQuery && (
          <section className="mt-32 bg-gray-50 rounded-[40px] p-8 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px]" style={{ backgroundColor: `${primaryColor}20` }}></div>
            <div className="max-w-xl">
              <h2 className="text-4xl font-black text-gray-900 mb-4 leading-tight">{t.dashboard.newsletter}</h2>
              <p className="text-gray-500 text-lg font-medium">{t.dashboard.newsletterDesc}</p>
            </div>
            <div className="w-full max-w-md">
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="E-posta adresiniz" 
                  className="flex-1 px-6 py-4 bg-white border-2 border-transparent rounded-2xl outline-none font-medium shadow-sm transition-all"
                  style={{ borderFocusColor: primaryColor } as any}
                />
                <button 
                  className="px-8 py-4 text-white rounded-2xl font-black transition-all shadow-xl active:scale-95 whitespace-nowrap"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                >
                  {t.dashboard.subscribe}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 pt-20 pb-10 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                {store?.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="h-12 w-12 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                    <StoreIcon className="w-6 h-6" />
                  </div>
                )}
                <h3 className="text-2xl font-black text-gray-900">{store?.name}</h3>
              </div>
              <p className="text-gray-500 max-w-md leading-relaxed mb-8">
                {store?.hero_subtitle || "Mağazamızın en kaliteli ürünlerini en uygun fiyatlarla sizlere sunuyoruz."}
              </p>
              <div className="flex gap-4">
                {store?.instagram_url && (
                  <a href={store.instagram_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-100 transition-all shadow-sm">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {store?.facebook_url && (
                  <a href={store.facebook_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {store?.twitter_url && (
                  <a href={store.twitter_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-600 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 transition-all shadow-sm">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-6">{t.dashboard.contactInfo}</h4>
              <ul className="space-y-4">
                {store?.address && (
                  <li className="flex items-start gap-3 text-gray-500 text-sm">
                    <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                    <span>{store.address}</span>
                  </li>
                )}
                {store?.phone && (
                  <li className="flex items-center gap-3 text-gray-500 text-sm">
                    <Phone className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
                    <span>{store.phone}</span>
                  </li>
                )}
                {store?.whatsapp_number && (
                  <li className="flex items-center gap-3 text-gray-500 text-sm">
                    <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>{store.whatsapp_number}</span>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm mb-6">{t.dashboard.categories}</h4>
              <ul className="space-y-3">
                {Array.from(categories.keys()).sort().slice(0, 5).map(cat => (
                  <li key={cat}>
                    <button 
                      onClick={() => { setSelectedCategory(cat); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-10 border-t flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-gray-400 text-xs font-medium">
                © 2026 {store?.name}. Tüm hakları saklıdır.
              </p>
              <div className="flex items-center gap-4 text-gray-400">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  %100 GÜVENLİ ALIŞVERİŞ
                </div>
                <div className="h-4 w-px bg-gray-300 mx-1"></div>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                  <CreditCard className="w-4 h-4" />
                  KART / HAVALE / KAPIDA ÖDEME
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                Powered by <StoreIcon className="w-3 h-3" /> LookPrice
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Basket Summary (Mobile) */}
      {basketCount > 0 && !isBasketOpen && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-6 left-4 right-4 z-40 md:hidden"
        >
          <button 
            onClick={() => setIsBasketOpen(true)}
            className="w-full text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between font-bold"
            style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
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
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
            >
              <div className="p-8 border-b flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 text-white rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                  >
                    <ShoppingBasket className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-wider">{t.dashboard.cart}</h2>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{basketCount} {t.dashboard.product}</p>
                  </div>
                </div>
                <button onClick={() => setIsBasketOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {basket.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-6">
                      <ShoppingBasket className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">{t.dashboard.emptyBasket}</h3>
                    <p className="text-gray-500 mt-2 max-w-[200px]">{t.dashboard.startShopping}</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {basket.map((item) => (
                      <div key={item.id} className="flex gap-6 group">
                        <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-10 h-10" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:opacity-80 transition-colors" style={{ color: primaryColor }}>{item.name}</h4>
                            <p className="font-black mt-1" style={{ color: primaryColor }}>
                              {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                              <button 
                                onClick={() => removeFromBasket(item.id)}
                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm active:scale-90"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-black w-8 text-center text-sm">{item.quantity}</span>
                              <button 
                                onClick={() => addToBasket(item)}
                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-50 rounded-lg transition-all shadow-sm active:scale-90"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button 
                              onClick={() => {
                                setBasket(prev => prev.filter(i => i.id !== item.id));
                              }}
                              className="text-red-400 hover:text-red-600 p-2 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {basket.length > 0 && (
                <div className="p-8 border-t bg-gray-50 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-gray-500 text-sm font-bold uppercase tracking-widest">
                      <span>{t.dashboard.subtotal}</span>
                      <span>{basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}</span>
                    </div>
                    <div className="flex items-center justify-between text-green-600 text-sm font-bold uppercase tracking-widest">
                      <span>{t.dashboard.shipping}</span>
                      <span>{t.dashboard.freeShipping}</span>
                    </div>
                    <div className="h-px bg-gray-200 my-4"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-black uppercase tracking-widest">{t.dashboard.total}</span>
                      <span className="text-3xl font-black" style={{ color: primaryColor }}>
                        {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutModalOpen(true)}
                    className="w-full py-5 text-white rounded-2xl font-black text-xl transition-all shadow-2xl active:scale-95 uppercase tracking-widest"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                  >
                    {t.dashboard.checkout}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAQ Modal */}
      <AnimatePresence>
        {showFaq && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFaq(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-8 border-b flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">{lang === 'tr' ? 'Sıkça Sorulan Sorular' : 'FAQ'}</h2>
                <button onClick={() => setShowFaq(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto space-y-4">
                {store?.faq?.length ? store.faq.map((item, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-3xl">
                    <h4 className="font-black text-gray-900 mb-2">{item.question}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
                  </div>
                )) : (
                  <p className="text-center text-gray-400 py-10">{lang === 'tr' ? 'Henüz soru eklenmemiş.' : 'No questions added yet.'}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blog Modal */}
      <AnimatePresence>
        {showBlog && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlog(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">{lang === 'tr' ? 'Blog' : 'Blog'}</h2>
                <button onClick={() => setShowBlog(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto">
                {selectedBlogPost ? (
                  <div className="space-y-6">
                    <button onClick={() => setSelectedBlogPost(null)} className="text-blue-600 font-bold flex items-center gap-2 mb-4">
                      <ChevronLeft className="w-4 h-4" /> {lang === 'tr' ? 'Geri Dön' : 'Back'}
                    </button>
                    {selectedBlogPost.image_url && <img src={selectedBlogPost.image_url} alt={selectedBlogPost.title} className="w-full h-64 object-cover rounded-3xl" />}
                    <h3 className="text-3xl font-black text-gray-900">{selectedBlogPost.title}</h3>
                    <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
                      {selectedBlogPost.content}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {store?.blog_posts?.length ? store.blog_posts.map((post, i) => (
                      <div key={i} onClick={() => setSelectedBlogPost(post)} className="group cursor-pointer bg-gray-50 rounded-3xl overflow-hidden hover:shadow-xl transition-all">
                        {post.image_url && <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />}
                        <div className="p-6">
                          <h4 className="font-black text-gray-900 mb-2 line-clamp-2">{post.title}</h4>
                          <p className="text-gray-500 text-sm line-clamp-3">{post.content}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="col-span-full text-center text-gray-400 py-10">{lang === 'tr' ? 'Henüz blog yazısı eklenmemiş.' : 'No blog posts added yet.'}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legal Modal */}
      <AnimatePresence>
        {showLegal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLegal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="p-8 border-b flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">
                  {showLegal === 'kvkk' ? (lang === 'tr' ? 'KVKK ve Gizlilik Politikası' : 'Privacy Policy') : 
                   showLegal === 'sales' ? (lang === 'tr' ? 'Mesafeli Satış Sözleşmesi' : 'Sales Agreement') : 
                   (lang === 'tr' ? 'Ön Bilgilendirme Formu' : 'Pre-Information Form')}
                </h2>
                <button onClick={() => setShowLegal(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-8 overflow-y-auto prose prose-blue max-w-none text-gray-600 leading-relaxed">
                {showLegal === 'kvkk' ? store?.legal_pages?.kvkk?.content : 
                 showLegal === 'sales' ? store?.legal_pages?.sales_agreement?.content : 
                 store?.legal_pages?.pre_info?.content}
                {!store?.legal_pages?.[showLegal === 'kvkk' ? 'kvkk' : showLegal === 'sales' ? 'sales_agreement' : 'pre_info'] && (
                  <p className="text-center text-gray-400 py-10">{lang === 'tr' ? 'İçerik henüz eklenmemiş.' : 'Content not added yet.'}</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">
                    {authMode === 'login' ? (lang === 'tr' ? 'GİRİŞ YAP' : 'LOGIN') : (lang === 'tr' ? 'KAYIT OL' : 'REGISTER')}
                  </h2>
                  <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={authMode === 'login' ? handleCustomerLogin : handleCustomerRegister} className="space-y-4">
                  {authMode === 'register' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.dashboard.customerName}</label>
                      <input 
                        required
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                        style={{ borderFocusColor: primaryColor } as any}
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-POSTA</label>
                    <input 
                      required
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                      style={{ borderFocusColor: primaryColor } as any}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ŞİFRE</label>
                    <input 
                      required
                      type="password"
                      value={customerInfo.password}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                      style={{ borderFocusColor: primaryColor } as any}
                    />
                  </div>
                  {authMode === 'register' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.dashboard.phone}</label>
                        <input 
                          required
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                          style={{ borderFocusColor: primaryColor } as any}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.dashboard.address}</label>
                        <textarea 
                          required
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900 resize-none"
                          rows={2}
                          style={{ borderFocusColor: primaryColor } as any}
                        />
                      </div>
                    </>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-5 text-white rounded-2xl font-black text-xl transition-all shadow-2xl active:scale-95 mt-4"
                    style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                  >
                    {authMode === 'login' ? (lang === 'tr' ? 'GİRİŞ YAP' : 'LOGIN') : (lang === 'tr' ? 'KAYIT OL' : 'REGISTER')}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="w-full text-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mt-4"
                  >
                    {authMode === 'login' ? (lang === 'tr' ? 'Hesabınız yok mu? Kayıt olun' : "Don't have an account? Register") : (lang === 'tr' ? 'Zaten hesabınız var mı? Giriş yapın' : 'Already have an account? Login')}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct} 
            store={store} 
            t={t} 
            onClose={() => setSelectedProduct(null)} 
            addToBasket={addToBasket} 
            primaryColor={primaryColor}
          />
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => checkoutStatus !== 'loading' && setIsCheckoutModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 md:p-8 overflow-y-auto no-scrollbar">
                {checkoutStatus === 'success' ? (
                  <div className="text-center py-10">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-100">
                      <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">{t.dashboard.orderReceived}</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">{t.dashboard.orderReceivedDesc}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wider">{t.dashboard.orderSummary}</h2>
                        <div className="h-1 w-12 mt-1 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                      </div>
                      <button 
                        onClick={() => setIsCheckoutModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <form onSubmit={handleCheckout} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.dashboard.customerName}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                            placeholder={t.dashboard.customerName}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.dashboard.phone}</label>
                          <input 
                            required
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                            placeholder="05xx xxx xx xx"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.dashboard.address}</label>
                        <textarea 
                          required
                          rows={2}
                          value={customerInfo.address}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none resize-none font-bold text-gray-900"
                          style={{ borderFocusColor: primaryColor } as any}
                          placeholder={t.dashboard.address}
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ÖDEME YÖNTEMİ' : 'PAYMENT METHOD'}</label>
                        <div className="grid grid-cols-1 gap-3">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('credit_card')}
                            className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${paymentMethod === 'credit_card' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                            style={{ borderColor: paymentMethod === 'credit_card' ? primaryColor : undefined }}
                          >
                            <div className="flex items-center gap-3">
                              <ShieldCheck className={`w-5 h-5 ${paymentMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'credit_card' ? primaryColor : undefined }} />
                              <span className={`font-bold text-sm ${paymentMethod === 'credit_card' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Kredi / Banka Kartı' : 'Credit / Debit Card'}</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${paymentMethod === 'bank_transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                            style={{ borderColor: paymentMethod === 'bank_transfer' ? primaryColor : undefined }}
                          >
                            <div className="flex items-center gap-3">
                              <RotateCcw className={`w-5 h-5 ${paymentMethod === 'bank_transfer' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'bank_transfer' ? primaryColor : undefined }} />
                              <span className={`font-bold text-sm ${paymentMethod === 'bank_transfer' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Havale / EFT' : 'Bank Transfer'}</span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash_on_delivery')}
                            className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                            style={{ borderColor: paymentMethod === 'cash_on_delivery' ? primaryColor : undefined }}
                          >
                            <div className="flex items-center gap-3">
                              <Truck className={`w-5 h-5 ${paymentMethod === 'cash_on_delivery' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'cash_on_delivery' ? primaryColor : undefined }} />
                              <span className={`font-bold text-sm ${paymentMethod === 'cash_on_delivery' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {checkoutStatus === 'error' && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <p className="text-red-600 text-sm font-bold">
                            {error || t.dashboard.orderError}
                          </p>
                        </div>
                      )}

                      <div className="pt-6">
                        <div 
                          className="flex items-center justify-between mb-6 p-5 rounded-2xl text-white shadow-xl"
                          style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                        >
                          <div className="flex flex-col">
                            <span className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t.dashboard.amountToPay}</span>
                            <span className="text-xs font-bold flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3" />
                              {t.dashboard.securePayment}
                            </span>
                          </div>
                          <span className="text-2xl font-black">
                            {basketTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
                          </span>
                        </div>
                        <button 
                          type="submit"
                          disabled={checkoutStatus === 'loading'}
                          className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest"
                        >
                          {checkoutStatus === 'loading' ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin" />
                              {t.dashboard.processing}
                            </>
                          ) : (
                            <>
                              <ShoppingBasket className="w-6 h-6" />
                              {t.dashboard.checkout}
                            </>
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
    {/* WhatsApp Button */} 
    {store?.whatsapp_number && (
      <a 
        href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9+]/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-28 md:bottom-8 right-4 md:right-8 z-[100] bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-xl flex items-center gap-3 transition-all active:scale-95"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="text-sm font-bold hidden md:block">{lang === 'tr' ? 'Yardım Al' : 'Get Help'}</span>
      </a>
    )}
    </ErrorBoundary>
  );
};

export default StoreShowcase;
