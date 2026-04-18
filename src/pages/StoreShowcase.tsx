import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getExchangeRate } from "../services/currencyService";
import { 
  Search, 
  ShoppingBasket, 
  Plus, 
  Minus, 
  X, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
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
  ExternalLink,
  RotateCcw,
  Star,
  Eye,
  Filter,
  ArrowUpDown,
  Tag,
  ShoppingBag,
  Mail
} from "lucide-react";
import { CreditCard, User, LogOut, Edit3, Building2, Home } from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "../contexts/LanguageContext";
import { translations } from "@/translations";
import ErrorBoundary from "../components/ErrorBoundary";
import { PageBuilder } from "../components/PageBuilder";

interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
  currency: string;
  cost_price: number;
  cost_currency: string;
  tax_rate: number;
  description?: string;
  stock_quantity: number;
  min_stock_level: number;
  unit?: string;
  category?: string;
  sub_category?: string;
  brand?: string;
  author?: string;
  labels?: string[];
  is_web_sale?: boolean;
  image_url?: string;
  shipping_profile_id?: string;
  updated_at: string;
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
  default_currency?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image_url?: string;
  about_text?: string;
  description?: string;
  email?: string;
  phone?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  address?: string;
  faq?: FAQEntry[];
  blog_posts?: BlogPost[];
  payment_settings?: {
    iyzico_enabled: boolean;
    paypal_enabled: boolean;
    payoneer_enabled: boolean;
  };
  legal_pages?: {
    kvkk?: LegalPage;
    privacy?: LegalPage;
    sales_agreement?: LegalPage;
    pre_info?: LegalPage;
  };
  page_layout?: any[];
  menu_links?: any[];
  footer_links?: any[];
  shipping_profiles?: any[];
}

interface BasketItem extends Product {
  quantity: number;
}

const getLabels = (labels: any): string[] => {
  if (Array.isArray(labels)) return labels;
  if (typeof labels === 'string') {
    try {
      const parsed = JSON.parse(labels);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const ProductCard: React.FC<{ 
  product: Product, 
  store: StoreInfo | null, 
  t: any, 
  addToBasket: (p: Product) => void,
  onView: (p: Product) => void,
  primaryColor: string
}> = ({ product, store, t, addToBasket, onView, primaryColor }) => {
  const { lang } = useLanguage();
  const [convertedPrice, setConvertedPrice] = useState<number>(product.price);

  useEffect(() => {
    if (store?.currency && product.currency && product.currency !== store.currency) {
      getExchangeRate(product.currency, store.currency).then(rate => {
        setConvertedPrice(product.price * rate);
      });
    } else {
      setConvertedPrice(product.price);
    }
  }, [product.price, product.currency, store?.currency]);

  return (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 group relative flex flex-col h-full"
  >
    <div className="aspect-square bg-gray-50 relative overflow-hidden">
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-200">
          <Package className="w-16 h-16" />
        </div>
      )}
      
      {/* Product Labels */}
      {getLabels(product.labels).length > 0 && (
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
          {getLabels(product.labels).map((label, idx) => (
            <span 
              key={idx} 
              className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm"
              style={{ color: primaryColor }}
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
        <button 
          onClick={() => addToBasket(product)}
          className="w-full py-3.5 bg-white text-gray-900 rounded-2xl font-bold text-sm shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {t.dashboard.addToBasket}
        </button>
      </div>
    </div>
    <div className="p-6 flex flex-col flex-1">
      <div className="mb-3 flex items-center justify-between">
        <span 
          className="text-[10px] uppercase tracking-[0.15em] font-black"
          style={{ color: primaryColor }}
        >
          {product.category || t.dashboard.uncategorized}
        </span>
        <div className="flex items-center gap-1 text-yellow-400">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-[10px] font-bold text-gray-400">4.8</span>
        </div>
      </div>

      <h3 
        className="font-display font-bold text-gray-900 line-clamp-2 h-12 mb-3 transition-colors cursor-pointer group-hover:text-primary text-base leading-tight" 
        onClick={() => onView(product)}
      >
        {product.name}
      </h3>
      
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">{t.dashboard.price}</span>
          <span className="text-xl font-display font-black text-gray-900">
            {convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {store?.currency || product.currency}
          </span>
        </div>
        <button 
          onClick={() => onView(product)}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all"
        >
          <Eye className="w-5 h-5" />
        </button>
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
  const [convertedPrice, setConvertedPrice] = useState<number>(product?.price || 0);

  useEffect(() => {
    if (product && store?.currency && product.currency && product.currency !== store.currency) {
      getExchangeRate(product.currency, store.currency).then(rate => {
        setConvertedPrice(product.price * rate);
      });
    } else if (product) {
      setConvertedPrice(product.price);
    }
  }, [product?.price, product?.currency, store?.currency]);

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
        className="fixed inset-0 bg-black/40 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 bg-white/80 backdrop-blur-md hover:bg-white rounded-full transition-all z-20 shadow-lg active:scale-95"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="md:w-1/2 bg-gray-50 relative overflow-hidden h-80 md:h-auto">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <Package className="w-32 h-32" />
            </div>
          )}
        </div>

        <div className="md:w-1/2 p-10 md:p-14 overflow-y-auto no-scrollbar">
          <div className="mb-6 flex flex-wrap gap-2">
            {getLabels(product.labels).map((label, idx) => (
              <span 
                key={idx}
                className="text-[10px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {label}
              </span>
            ))}
            <span 
              className="text-[10px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-full"
              style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}
            >
              {product.category || t.dashboard.uncategorized}
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-black text-gray-900 mb-4 leading-[1.1] tracking-tighter">
            {product.name}
          </h2>

          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-4xl font-display font-black text-gray-900">
              {convertedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {store?.currency || product.currency}
            </span>
            {product.unit && (
              <span className="text-xl text-gray-400 font-medium">/ {product.unit}</span>
            )}
          </div>

          <div className="prose prose-gray max-w-none mb-10">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">{t.dashboard.description}</h4>
            <p className="text-gray-500 leading-relaxed text-lg font-medium">
              {product.description || t.dashboard.noProductsDesc}
            </p>
          </div>

          {branchStocks.length > 0 && (
            <div className="mb-10">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">{lang === 'tr' ? 'MAĞAZA STOKLARI' : 'STORE STOCKS'}</h4>
              <div className="grid grid-cols-1 gap-3">
                {branchStocks.map((branch, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold text-gray-900">{branch.branch_name}</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${branch.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {branch.stock > 0 ? `${branch.stock} ${t.dashboard.inStock || 'Stokta'}` : t.dashboard.outOfStock}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <Truck className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">{t.dashboard.fastDelivery}</span>
                <span className="text-xs text-gray-500">24-48 Saat</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">{t.dashboard.securePayment}</span>
                <span className="text-xs text-gray-500">SSL Encrypted</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              addToBasket(product);
              onClose();
            }}
            className="w-full py-6 text-white rounded-[2rem] font-black text-xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 group"
            style={{ backgroundColor: primaryColor, boxShadow: `0 20px 40px -10px ${primaryColor}60` }}
          >
            <ShoppingBag className="w-7 h-7 group-hover:scale-110 transition-transform" />
            {t.dashboard.addToCart}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const StoreShowcase: React.FC<{ customSlug?: string }> = ({ customSlug }) => {
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const slug = customSlug || urlSlug;
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  const getStorePath = (path: string = "") => {
    if (customSlug) {
      return path.startsWith("/") ? path : `/${path}`;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/s/${slug}${cleanPath === "/" ? "" : cleanPath}`;
  };

  const isProfileView = location.pathname.endsWith('/profile');
  const isOrdersView = location.pathname.endsWith('/orders');
  const isReturnView = location.pathname.endsWith('/return');
  
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(localStorage.getItem('customerToken'));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState<any>({});
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    if ((isProfileView || isOrdersView || isReturnView) && !customerToken) {
      setShowAuthModal(true);
    }
  }, [isProfileView, isOrdersView, isReturnView, customerToken]);

  useEffect(() => {
    if (isProfileView && customerToken) {
      api.getCustomerProfile().then(res => {
        if (!res.error) {
          setCustomerProfile(res);
          setProfileEditForm(res);
        }
      });
    }
  }, [isProfileView, customerToken]);

  useEffect(() => {
    const savedBasket = localStorage.getItem(`basket_${slug}`);
    if (savedBasket) {
      try {
        setBasket(JSON.parse(savedBasket));
      } catch (e) {
        console.error("Failed to parse saved basket", e);
      }
    }
  }, [slug]);

  useEffect(() => {
    if (basket.length > 0) {
      localStorage.setItem(`basket_${slug}`, JSON.stringify(basket));
    } else {
      localStorage.removeItem(`basket_${slug}`);
    }
  }, [basket, slug]);

  const [customerInfo, setCustomerInfo] = useState({ 
    name: "", surname: "", phone: "", address: "", email: "", password: "", passwordConfirm: "",
    country: "", city: "", tc_id: "", is_corporate: false, marketing_email: false, marketing_sms: false, accept_terms: false, createAccount: false
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'bank_transfer' | 'cash_on_delivery' | 'payoneer' | 'paypal' | 'iyzico'>('credit_card');
  const [iyzicoPaymentUrl, setIyzicoPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (store?.payment_settings) {
      if (store.payment_settings.iyzico_enabled) {
        setPaymentMethod('iyzico');
      } else if (store.payment_settings.paypal_enabled) {
        setPaymentMethod('paypal');
      } else if (store.payment_settings.payoneer_enabled) {
        setPaymentMethod('payoneer');
      }
    }
  }, [store]);
  const [customer, setCustomer] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showFaq, setShowFaq] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [showLegal, setShowLegal] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const ITEMS_PER_PAGE = 20;
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (isOrdersView && customerToken) {
        setLoadingOrders(true);
        try {
          const res = await api.getCustomerOrders();
          setOrders(res || []);
        } catch (error) {
          console.error("Error fetching orders:", error);
        } finally {
          setLoadingOrders(false);
        }
      }
    };
    fetchOrders();
  }, [isOrdersView, customerToken]);

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
      console.log(`Fetching store data for slug: ${slug}`);
      try {
        const [storeRes, productsRes] = await Promise.all([
          api.getPublicStore(slug),
          api.getPublicStoreProducts(slug)
        ]);

        console.log('Store response:', storeRes);
        console.log('Products response:', productsRes);

        if (storeRes.redirect) {
          navigate(storeRes.redirect, { replace: true });
          return;
        }

        if (storeRes.error) throw new Error(storeRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        if (typeof storeRes.page_layout === 'string') {
          try {
            storeRes.page_layout = JSON.parse(storeRes.page_layout);
          } catch (e) {
            storeRes.page_layout = [];
          }
        }
        
        if (typeof storeRes.menu_links === 'string') {
          try {
            storeRes.menu_links = JSON.parse(storeRes.menu_links);
          } catch (e) {
            storeRes.menu_links = [];
          }
        }
        
        storeRes.currency = storeRes.default_currency || 'TRY';
        setStore(storeRes);
        document.title = storeRes.name || 'Store';
        setProducts(productsRes.filter((p: Product) => p.is_web_sale !== false));
        
        // If customer is logged in, sync their info to checkout
        if (customer) {
          setCustomerInfo(prev => ({
            ...prev,
            name: customer.name || "",
            surname: customer.surname || "",
            phone: customer.phone || "",
            address: customer.address || "",
            email: customer.email || "",
            country: customer.country || "",
            city: customer.city || "",
            tc_id: customer.tc_id || "",
            is_corporate: customer.is_corporate || false
          }));
        }
      } catch (err: any) {
        setError(err.message || t.dashboard.storeLoadingError);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, customer?.id]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateCustomerProfile(profileEditForm);
      if (res.error) throw new Error(res.error);
      setCustomerProfile(res.customer);
      setCustomer(res.customer);
      localStorage.setItem('customer', JSON.stringify(res.customer));
      setIsEditingProfile(false);
      alert(lang === 'tr' ? 'Profil başarıyla güncellendi!' : 'Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || (lang === 'tr' ? 'Profil güncellenirken bir hata oluştu.' : 'An error occurred while updating profile.'));
    }
  };

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
      setBasket([]); // Clear basket on login
      localStorage.setItem('customer', JSON.stringify(res.customer));
      localStorage.setItem('customerToken', res.token);
      setCustomerToken(res.token);
      setShowAuthModal(false);
      setCustomerInfo(prev => ({
        ...prev,
        name: res.customer.name,
        surname: res.customer.surname,
        phone: res.customer.phone,
        address: res.customer.address,
        email: res.customer.email,
        country: res.customer.country,
        city: res.customer.city,
        tc_id: res.customer.tc_id,
        is_corporate: res.customer.is_corporate
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customerInfo.password !== customerInfo.passwordConfirm) {
      alert(lang === 'tr' ? 'Şifreler eşleşmiyor' : 'Passwords do not match');
      return;
    }
    if (!customerInfo.accept_terms) {
      alert(lang === 'tr' ? 'Üyelik sözleşmesini kabul etmelisiniz' : 'You must accept the membership agreement');
      return;
    }
    try {
      const res = await api.customerRegister({
        name: customerInfo.name,
        surname: customerInfo.surname,
        email: customerInfo.email,
        password: customerInfo.password,
        phone: customerInfo.phone,
        address: customerInfo.address,
        country: customerInfo.country,
        city: customerInfo.city,
        tc_id: customerInfo.tc_id,
        is_corporate: customerInfo.is_corporate,
        marketing_email: customerInfo.marketing_email,
        marketing_sms: customerInfo.marketing_sms,
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
      setBasket([]); // Clear basket on register
      setCustomerInfo(prev => ({
        ...prev,
        name: loginRes.customer.name,
        surname: loginRes.customer.surname,
        phone: loginRes.customer.phone,
        address: loginRes.customer.address,
        email: loginRes.customer.email,
        country: loginRes.customer.country,
        city: loginRes.customer.city,
        tc_id: loginRes.customer.tc_id,
        is_corporate: loginRes.customer.is_corporate
      }));
      localStorage.setItem('customer', JSON.stringify(loginRes.customer));
      localStorage.setItem('customerToken', loginRes.token);
      setCustomerToken(loginRes.token);
      setShowAuthModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = () => {
    setCustomer(null);
    setCustomerToken(null);
    setBasket([]);
    setCustomerInfo({ 
      name: "", surname: "", phone: "", address: "", email: "", password: "", passwordConfirm: "",
      country: "", city: "", tc_id: "", is_corporate: false, marketing_email: false, marketing_sms: false, accept_terms: false, createAccount: false
    });
    localStorage.removeItem('customer');
    localStorage.removeItem('customerToken');
    localStorage.removeItem('basket'); // Just in case it was there
    if (isProfileView || isOrdersView || isReturnView) {
      navigate(`/s/${slug}`);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

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

  const brands = useMemo(() => {
    const b = new Set<string>();
    products.forEach(p => {
      if (p.brand) b.add(p.brand);
    });
    return Array.from(b).sort();
  }, [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    const baseProducts = sortBy === 'default' && !searchQuery && !selectedCategory && !selectedBrand ? shuffledProducts : products;
    
    let result = baseProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const productCategory = p.category || t.dashboard.uncategorized;
      const matchesCategory = !selectedCategory || productCategory === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || p.sub_category === selectedSubCategory;
      const matchesBrand = !selectedBrand || p.brand === selectedBrand;
      
      return matchesSearch && matchesCategory && matchesSubCategory && matchesBrand;
    });

    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, shuffledProducts, searchQuery, selectedCategory, selectedSubCategory, selectedBrand, sortBy, t]);

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

  const [basketTotal, setBasketTotal] = useState(0);
  const [basketSubtotal, setBasketSubtotal] = useState(0);
  const [basketShippingTotal, setBasketShippingTotal] = useState(0);
  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  const [basketItemPrices, setBasketItemPrices] = useState<Record<number, number>>({});

  useEffect(() => {
    const calculateTotal = async () => {
      if (!store?.currency) return;
      let subtotal = 0;
      let maxShippingCost = 0;
      const newPrices: Record<number, number> = {};
      
      for (const item of basket) {
        const itemPrice = Number(item.price) || 0;
        let shippingCost = 0;
        
        if (item.shipping_profile_id && store.shipping_profiles) {
          const profile = store.shipping_profiles.find((p: any) => String(p.id) === String(item.shipping_profile_id));
          if (profile) {
            let profileCost = Number(profile.cost) || 0;
            if (profile.currency && profile.currency !== store.currency) {
              const sRate = await getExchangeRate(profile.currency, store.currency);
              profileCost = profileCost * sRate;
            }
            shippingCost = profileCost;
          }
        }

        if (shippingCost > maxShippingCost) {
          maxShippingCost = shippingCost;
        }

        let convertedItemPrice = itemPrice;
        if (item.currency && item.currency !== store.currency) {
          const rate = await getExchangeRate(item.currency, store.currency);
          convertedItemPrice = itemPrice * rate;
        }

        const finalPrice = convertedItemPrice;
        newPrices[item.id] = finalPrice;
        
        subtotal += convertedItemPrice * item.quantity;
      }
      
      setBasketItemPrices(newPrices);
      setBasketSubtotal(subtotal);
      setBasketShippingTotal(maxShippingCost);
      setBasketTotal(subtotal + maxShippingCost);
    };
    calculateTotal();
  }, [basket, store?.currency, store?.shipping_profiles]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || basket.length === 0) return;

    // Iyzico zorunluluğu kontrolü
    if (store.payment_settings?.iyzico_enabled && paymentMethod !== 'iyzico') {
      setError(lang === 'tr' ? 'Lütfen ödeme yöntemi olarak iyzico seçin.' : 'Please select iyzico as payment method.');
      return;
    }

    setCheckoutStatus('loading');
    try {
      // Calculate converted prices for items
      const itemsWithConvertedPrices = await Promise.all(basket.map(async (item) => {
        let itemPrice = Number(item.price) || 0;

        let finalPrice = itemPrice;
        if (item.currency && item.currency !== store.currency) {
          const rate = await getExchangeRate(item.currency, store.currency);
          finalPrice = itemPrice * rate;
        }
        return {
          productId: item.id,
          name: item.name,
          barcode: item.barcode,
          quantity: item.quantity,
          price: finalPrice
        };
      }));

      if (basketShippingTotal > 0) {
        itemsWithConvertedPrices.push({
          productId: null as any,
          name: lang === 'tr' ? 'Kargo Ücreti' : 'Shipping Fee',
          barcode: 'SHIPPING',
          quantity: 1,
          price: basketShippingTotal
        });
      }

      const res = await api.createPublicSale({
        storeId: store.id,
        items: itemsWithConvertedPrices,
        customerName: `${customerInfo.name} ${customerInfo.surname}`.trim(),
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        customerAddress: customerInfo.address,
        customerCity: customerInfo.city,
        customerCountry: customerInfo.country,
        customerTcId: customerInfo.tc_id,
        total: basketTotal,
        currency: store.currency,
        paymentMethod: paymentMethod,
        createAccount: customerInfo.createAccount,
        customerId: customer?.id
      });

      if (res.error) throw new Error(res.error);
      
      if (res.paymentProvider === 'iyzico' && res.initializeUrl) {
        const initRes = await fetch(res.initializeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId: res.saleId, paymentMethod: 'iyzico' })
        });
        const initData = await initRes.json();
        if (initData.paymentPageUrl) {
          setIyzicoPaymentUrl(initData.paymentPageUrl + "&iframe=true");
          setCheckoutStatus('idle');
          return;
        } else {
          throw new Error(initData.error || "Ödeme başlatılamadı.");
        }
      }
      
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }

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
            onClick={() => navigate(getStorePath("/"))}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            {t.dashboard.backToHome}
          </button>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.errorOccurred}</h2>
          <p className="text-gray-600 mb-6">{t.dashboard.storeNotFound}</p>
          <button 
            onClick={() => navigate(getStorePath("/"))}
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
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-[60] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-8">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate(getStorePath("/"))}>
            {store?.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-10 w-auto object-contain group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
            ) : (
              <div 
                className="h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform"
                style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
              >
                <StoreIcon className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-xl font-display font-black text-gray-900 tracking-tighter hidden sm:block">{store?.name}</h1>
          </div>
          
          {/* Menu Links */}
          <div className="hidden md:flex items-center gap-6">
            {(store?.menu_links || []).map((link: any, index: number) => (
              <a key={index} href={link.url} className="text-sm font-bold text-gray-600 hover:text-primary transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="flex-1 max-w-xl relative hidden md:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text"
              placeholder={t.dashboard.searchProducts}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-full transition-all outline-none text-sm font-medium"
              style={{ '--tw-ring-color': primaryColor } as any}
            />
          </div>

          <div className="flex items-center gap-3">
            {customer ? (
              <div className="relative" ref={accountMenuRef}>
                <button 
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded-full transition-all flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md" style={{ backgroundColor: primaryColor }}>
                    {customer.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-gray-700 hidden sm:block">{lang === 'tr' ? 'Hesabım' : 'My Account'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
                    >
                      <button onClick={() => { navigate(getStorePath("/profile")); setIsAccountMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm font-bold flex items-center gap-2">
                        <User className="w-4 h-4" /> {lang === 'tr' ? 'Profilim' : 'My Profile'}
                      </button>
                      <button onClick={() => { navigate(getStorePath("/orders")); setIsAccountMenuOpen(false); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 text-sm font-bold flex items-center gap-2">
                        <Package className="w-4 h-4" /> {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
                      </button>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-sm font-bold flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> {lang === 'tr' ? 'Çıkış Yap' : 'Logout'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full transition-all group"
              >
                <User className="w-5 h-5 text-gray-700 group-hover:text-primary transition-colors" />
                <span className="text-sm font-bold text-gray-700 hidden sm:block">{lang === 'tr' ? 'Giriş Yap' : 'Login'}</span>
              </button>
            )}
            <button 
              onClick={() => setIsBasketOpen(true)}
              className="relative p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-95 group"
            >
              <ShoppingBag className="w-6 h-6 text-gray-700 group-hover:text-primary transition-colors" />
              {basketCount > 0 && (
                <span 
                  className="absolute top-1 right-1 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  {basketCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {!isProfileView && !isOrdersView && !isReturnView ? (
        <>
          {/* Hero Section */}
          <section className="relative h-[300px] md:h-[450px] overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-center p-8 md:p-24">
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-8"
                >
                  <span 
                    className="px-5 py-2 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full backdrop-blur-md border border-white/20"
                    style={{ backgroundColor: `${primaryColor}80` }}
                  >
                    {store?.name}
                  </span>
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-8xl font-display font-black text-white mb-8 leading-[0.9] tracking-tighter text-balance"
                >
                  {store?.hero_title || store?.name}
                </motion.h2>
                {store?.hero_subtitle && (
                  <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg md:text-2xl text-white/80 font-medium max-w-xl leading-relaxed mb-12 text-balance"
                  >
                    {store.hero_subtitle}
                  </motion.p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <button 
                    onClick={() => document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-10 py-5 bg-white text-gray-900 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all shadow-2xl active:scale-95 flex items-center gap-3 group"
                  >
                    {t.dashboard.startShopping}
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Removed category boxes section */}

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8" id="products-grid">
        {/* Search Bar & Filters */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div>
              <h2 className="text-4xl font-display font-black text-gray-900 tracking-tighter mb-2">
                {selectedCategory || t.dashboard.allProducts}
              </h2>
              <p className="text-gray-400 font-medium">
                {sortedAndFilteredProducts.length} {t.dashboard.productsFound || 'ürün bulundu'}
              </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text"
                  placeholder={t.dashboard.searchProducts}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 focus:border-primary rounded-2xl transition-all outline-none text-sm font-medium shadow-sm"
                />
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-11 pr-12 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-50 transition-all shadow-sm min-w-[160px]"
                >
                  <option value="default">{t.dashboard.newest || (lang === 'tr' ? 'Varsayılan' : 'Default')}</option>
                  <option value="priceAsc">{t.dashboard.priceLow || (lang === 'tr' ? 'En Düşük Fiyat' : 'Price: Low to High')}</option>
                  <option value="priceDesc">{t.dashboard.priceHigh || (lang === 'tr' ? 'En Yüksek Fiyat' : 'Price: High to Low')}</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-900 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Category Scroll */}
        <div className="lg:hidden mb-8 -mx-4 px-4 overflow-x-auto custom-scrollbar flex items-center gap-2 pb-2">
          <button
            onClick={() => { 
                setSelectedCategory(null); 
                setSelectedSubCategory(null);
                document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex-shrink-0 px-6 py-2.5 rounded-full text-xs font-black transition-all border whitespace-nowrap ${
                !selectedCategory 
                ? "bg-gray-900 text-white border-gray-900 shadow-lg" 
                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
            }`}
          >
            {t.dashboard.all}
          </button>
          
          {Array.from(categories.keys()).sort().map(cat => (
            <button
              key={cat}
              onClick={() => {
                if (selectedCategory === cat) {
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                } else {
                    setSelectedCategory(cat);
                    setSelectedSubCategory(null);
                }
              }}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full text-xs font-black transition-all border whitespace-nowrap ${
                selectedCategory === cat 
                ? "bg-gray-900 text-white border-gray-900 shadow-lg" 
                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
              }`}
            >
              {cat}
            </button>
          ))}

          <button 
            onClick={() => setShowMobileFilters(true)}
            className="flex-shrink-0 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all ml-2 sticky right-0 shadow-lg"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sidebar */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-12">
              {/* Categories */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
                  <Filter className="w-4 h-4" />
                  {t.dashboard.categories}
                </h3>
                
                {/* Removed sidebar category search bar */}

                <div className="space-y-1">
                  <button
                    onClick={() => { 
                      setSelectedCategory(null); 
                      setSelectedSubCategory(null);
                      document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                      !selectedCategory ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <div className={`w-1 h-1 rounded-full ${!selectedCategory ? "bg-primary" : "bg-gray-300"}`}></div>
                      {t.dashboard.all}
                    </span>
                    <span className="text-[9px] opacity-50">{products.length}</span>
                  </button>

                  <div className="space-y-1">
                    {Array.from(categories.keys())
                      .filter(cat => cat.toLowerCase().includes(categorySearch.toLowerCase()))
                      .sort()
                      .slice(0, showAllCategories ? undefined : 5)
                      .map(cat => (
                      <div key={cat} className="space-y-1">
                        <button
                          onClick={() => {
                            if (selectedCategory === cat) {
                              toggleCategory(cat);
                            } else {
                              setSelectedCategory(cat);
                              setSelectedSubCategory(null);
                              if (!expandedCategories.has(cat)) toggleCategory(cat);
                              document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className={`w-full text-left px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between group ${
                            selectedCategory === cat ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-1 rounded-full transition-colors ${selectedCategory === cat ? "bg-primary" : "bg-gray-300 group-hover:bg-gray-400"}`}></div>
                            <span className="truncate">{cat}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] opacity-50">{products.filter(p => p.category === cat).length}</span>
                            {categories.get(cat)!.size > 0 && (
                              <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${expandedCategories.has(cat) ? "rotate-90" : ""}`} />
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {expandedCategories.has(cat) && categories.get(cat)!.size > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pl-8 space-y-1"
                            >
                              {Array.from(categories.get(cat)!).sort().map(sub => (
                                <button
                                  key={sub}
                                  onClick={() => {
                                    setSelectedSubCategory(sub);
                                    document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className={`w-full text-left px-4 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                                    selectedSubCategory === sub ? "text-primary bg-primary/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className={`w-1 h-1 rounded-full ${selectedSubCategory === sub ? "bg-primary" : "bg-transparent"}`}></div>
                                  <span className="truncate">{sub}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    
                    {Array.from(categories.keys()).length > 5 && (
                      <button 
                        onClick={() => setShowAllCategories(!showAllCategories)}
                        className="w-full text-center py-2 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 rounded-lg transition-all"
                      >
                        {showAllCategories ? (lang === 'tr' ? 'Daha Az' : 'Show Less') : (lang === 'tr' ? 'Tümünü Gör' : 'Show All')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Brands */}
              {brands.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
                    <Tag className="w-4 h-4" />
                    {lang === 'tr' ? 'MARKALAR' : 'BRANDS'}
                  </h3>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={lang === 'tr' ? 'Marka Ara...' : 'Search Brands...'}
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar">
                      <div className="flex flex-wrap gap-2">
                        {brands
                          .filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase()))
                          .map(brand => (
                          <button
                            key={brand}
                            onClick={() => {
                              setSelectedBrand(brand === selectedBrand ? null : brand);
                              setSearchQuery("");
                              document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                              selectedBrand === brand 
                                ? "bg-gray-900 text-white border-gray-900 shadow-md" 
                                : "bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {brand}
                          </button>
                        ))}
                        {brands.filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                          <div className="w-full text-center py-4 text-gray-400 text-sm">
                            {lang === 'tr' ? 'Marka bulunamadı.' : 'No brands found.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {store?.page_layout && store.page_layout.length > 0 ? (
              <div className="space-y-24">
                {store.page_layout.map((section: any) => {
                  switch (section.type) {
                    case 'hero':
                      return (
                        <section key={section.id} className="relative h-[600px] flex items-center justify-center rounded-[3rem] overflow-hidden">
                          <img src={store.hero_image_url} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40" />
                          <div className="relative z-10 text-center text-white p-8">
                            <h1 className="text-6xl font-black mb-4">{store.hero_title}</h1>
                            <p className="text-xl">{store.hero_subtitle}</p>
                          </div>
                        </section>
                      );
                    case 'featured':
                      return (
                        <section key={section.id}>
                          <h2 className="text-3xl font-black text-gray-900 mb-10">{t.dashboard.featuredProducts}</h2>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {featuredProducts.map(p => (
                              <ProductCard key={p.id} product={p} store={store} t={t} addToBasket={addToBasket} onView={setSelectedProduct} primaryColor={primaryColor} />
                            ))}
                          </div>
                        </section>
                      );
                    case 'blog':
                      return (
                        <section key={section.id}>
                          <h2 className="text-3xl font-black text-gray-900 mb-10">Blog</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {store.blog_posts?.map(post => (
                              <div key={post.id} className="bg-gray-50 p-6 rounded-3xl">
                                <h4 className="font-black text-gray-900 mb-2">{post.title}</h4>
                                <p className="text-gray-500 text-sm">{post.excerpt}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      );
                    case 'about':
                      return (
                        <section key={section.id} id="about" className="bg-gray-50 p-12 rounded-[3rem]">
                          <h2 className="text-3xl font-black text-gray-900 mb-6">{lang === 'tr' ? 'Hakkımızda' : 'About Us'}</h2>
                          <p className="text-gray-600 leading-relaxed">{store.about_text}</p>
                        </section>
                      );
                    case 'contact':
                      return (
                        <section key={section.id} id="contact" className="bg-gray-900 text-white p-12 rounded-[3rem]">
                          <h2 className="text-3xl font-black mb-6">{lang === 'tr' ? 'İletişim' : 'Contact'}</h2>
                          <p>{store.address}</p>
                          <p>{store.email}</p>
                          <p>{store.phone}</p>
                        </section>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ) : (
              // Fallback to original layout if no page_layout
              sortedAndFilteredProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
                    <AnimatePresence mode="popLayout">
                      {paginatedProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          store={store} 
                          t={t} 
                          onView={setSelectedProduct}
                          addToBasket={addToBasket}
                          primaryColor={primaryColor}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  {/* ... pagination ... */}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-8">
                    <Package className="w-12 h-12 text-gray-200" />
                  </div>
                  <h3 className="text-2xl font-display font-black text-gray-900 mb-2">{t.dashboard.noProductsFound}</h3>
                  <p className="text-gray-400 font-medium max-w-xs">{t.dashboard.noProductsDesc}</p>
                </div>
              )
            )}
          </div>
        </div>

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
        {/* Trust Badges */}
        <section className="mt-40 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div 
                className="w-16 h-16 rounded-3xl mb-8 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
              >
                <Truck className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-display font-black text-gray-900 mb-2 uppercase tracking-tight">{t.dashboard.fastDelivery || 'Hızlı Teslimat'}</h4>
              <p className="text-gray-400 font-medium leading-relaxed">Tüm siparişlerinizde hızlı ve güvenli teslimat avantajı.</p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div 
                className="w-16 h-16 rounded-3xl mb-8 flex items-center justify-center text-green-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                style={{ backgroundColor: '#10b98110' }}
              >
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-display font-black text-gray-900 mb-2 uppercase tracking-tight">{t.dashboard.securePayment}</h4>
              <p className="text-gray-400 font-medium leading-relaxed">256-bit SSL sertifikası ile %100 güvenli ödeme altyapısı.</p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
              <div 
                className="w-16 h-16 rounded-3xl mb-8 flex items-center justify-center text-purple-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                style={{ backgroundColor: '#8b5cf610' }}
              >
                <RotateCcw className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-display font-black text-gray-900 mb-2 uppercase tracking-tight">{t.dashboard.returnPolicy}</h4>
              <p className="text-gray-400 font-medium leading-relaxed">14 gün içerisinde koşulsuz şartsız kolay iade imkanı.</p>
            </div>
          </div>
        </section>
      </main>
      </>
      ) : (
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-24">
          {isProfileView && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-3">
                  {/* Profile Sidebar */}
                  <div className="bg-gray-50 p-10 md:p-12 border-r border-gray-100">
                    <div className="flex flex-col items-center text-center mb-10">
                      <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center mb-6 border-4 border-white">
                        <User className="w-10 h-10 text-gray-900" />
                      </div>
                      <h2 className="text-2xl font-display font-black text-gray-900 tracking-tighter mb-1">
                        {customerProfile?.name} {customerProfile?.surname}
                      </h2>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{customerProfile?.email}</p>
                    </div>

                    <nav className="space-y-2">
                      <button 
                        onClick={() => { setIsEditingProfile(false); navigate(`/s/${slug}/profile`); }}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${isProfileView ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-white'}`}
                      >
                        <User className="w-5 h-5" />
                        {lang === 'tr' ? 'Profil Bilgilerim' : 'My Profile'}
                      </button>
                      <button 
                        onClick={() => navigate(`/s/${slug}/orders`)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${isOrdersView ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-white'}`}
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
                      </button>
                      <button 
                        onClick={() => navigate(`/s/${slug}/return`)}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${isReturnView ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-500 hover:bg-white'}`}
                      >
                        <RotateCcw className="w-5 h-5" />
                        {lang === 'tr' ? 'İade Taleplerim' : 'Return Requests'}
                      </button>
                      <div className="pt-8">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-red-500 hover:bg-red-50 transition-all"
                        >
                          <LogOut className="w-5 h-5" />
                          {lang === 'tr' ? 'Çıkış Yap' : 'Logout'}
                        </button>
                      </div>
                    </nav>
                  </div>

                  {/* Profile Content */}
                  <div className="lg:col-span-2 p-10 md:p-16">
                    <div className="flex items-center justify-between mb-12">
                      <h3 className="text-3xl font-display font-black text-gray-900 tracking-tighter">
                        {isEditingProfile ? (lang === 'tr' ? 'Profili Düzenle' : 'Edit Profile') : (lang === 'tr' ? 'Hesap Detayları' : 'Account Details')}
                      </h3>
                      {!isEditingProfile && (
                        <button 
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-black text-xs transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                          {lang === 'tr' ? 'Düzenle' : 'Edit'}
                        </button>
                      )}
                    </div>

                    {customerProfile ? (
                      isEditingProfile ? (
                        <form onSubmit={handleProfileUpdate} className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ADINIZ' : 'NAME'}</label>
                              <input 
                                required
                                type="text"
                                value={profileEditForm.name || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'SOYADINIZ' : 'SURNAME'}</label>
                              <input 
                                required
                                type="text"
                                value={profileEditForm.surname || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, surname: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-POSTA</label>
                              <input 
                                required
                                type="email"
                                value={profileEditForm.email || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.dashboard.phone}</label>
                              <input 
                                required
                                type="tel"
                                value={profileEditForm.phone || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ÜLKE' : 'COUNTRY'}</label>
                              <input 
                                required
                                type="text"
                                value={profileEditForm.country || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, country: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'İL' : 'CITY'}</label>
                              <input 
                                required
                                type="text"
                                value={profileEditForm.city || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, city: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'T.C. KİMLİK NUMARASI' : 'TC ID'}</label>
                              <input 
                                type="text"
                                value={profileEditForm.tc_id || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, tc_id: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                              />
                            </div>
                            <div className="space-y-2 flex flex-col justify-center">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">{lang === 'tr' ? 'HESAP TÜRÜ' : 'ACCOUNT TYPE'}</label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="edit_is_corporate" 
                                    checked={!profileEditForm.is_corporate} 
                                    onChange={() => setProfileEditForm(prev => ({ ...prev, is_corporate: false }))}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                  />
                                  <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Bireysel' : 'Individual'}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="edit_is_corporate" 
                                    checked={profileEditForm.is_corporate} 
                                    onChange={() => setProfileEditForm(prev => ({ ...prev, is_corporate: true }))}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                  />
                                  <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Kurumsal' : 'Corporate'}</span>
                                </label>
                              </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.dashboard.address}</label>
                              <textarea 
                                required
                                value={profileEditForm.address || ''}
                                onChange={(e) => setProfileEditForm(prev => ({ ...prev, address: e.target.value }))}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900 resize-none"
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="flex gap-4 pt-6">
                            <button 
                              type="button"
                              onClick={() => {
                                setIsEditingProfile(false);
                                setProfileEditForm(customerProfile);
                              }}
                              className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-black transition-all"
                            >
                              {lang === 'tr' ? 'İptal' : 'Cancel'}
                            </button>
                            <button 
                              type="submit"
                              className="flex-1 py-5 text-white rounded-2xl font-black transition-all shadow-xl active:scale-95"
                              style={{ backgroundColor: primaryColor, boxShadow: `0 10px 25px -5px ${primaryColor}40` }}
                            >
                              {lang === 'tr' ? 'Kaydet' : 'Save'}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-8">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Kişisel Bilgiler</label>
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{lang === 'tr' ? 'Ad Soyad' : 'Full Name'}</p>
                                    <p className="text-base font-black text-gray-900">{customerProfile.name} {customerProfile.surname}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <Mail className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">E-posta</p>
                                    <p className="text-base font-black text-gray-900">{customerProfile.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <CreditCard className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{lang === 'tr' ? 'T.C. Kimlik No' : 'TC ID'}</p>
                                    <p className="text-base font-black text-gray-900">{customerProfile.tc_id || '-'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <Building2 className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{lang === 'tr' ? 'Hesap Türü' : 'Account Type'}</p>
                                    <p className="text-base font-black text-gray-900">{customerProfile.is_corporate ? (lang === 'tr' ? 'Kurumsal' : 'Corporate') : (lang === 'tr' ? 'Bireysel' : 'Individual')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Adres Bilgileri</label>
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                    <MapPin className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{lang === 'tr' ? 'Konum' : 'Location'}</p>
                                    <p className="text-base font-black text-gray-900">{customerProfile.city}, {customerProfile.country}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 mt-1">
                                    <Home className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{lang === 'tr' ? 'Tam Adres' : 'Full Address'}</p>
                                    <p className="text-base font-black text-gray-900 leading-tight">{customerProfile.address}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-500 font-bold">{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {isOrdersView && (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-display font-black text-gray-900 tracking-tighter">
                  {lang === 'tr' ? 'Siparişlerim' : 'My Orders'}
                </h2>
                <div className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {orders.length} {lang === 'tr' ? 'SİPARİŞ' : 'ORDERS'}
                </div>
              </div>
              
              {loadingOrders ? (
                <div className="bg-white rounded-3xl p-20 text-center border border-gray-100">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-gray-500 font-bold">{lang === 'tr' ? 'Siparişler yükleniyor...' : 'Loading orders...'}</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <motion.div 
                      key={order.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group bg-white rounded-2xl border border-gray-100 hover:border-primary/20 transition-all shadow-sm hover:shadow-xl overflow-hidden"
                    >
                      <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{order.id}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-[10px] font-bold text-gray-500">{new Date(order.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}</span>
                            </div>
                            <p className="text-sm font-black text-gray-900">
                              {order.items_count || (order.items?.length || 1)} {lang === 'tr' ? 'Ürün' : 'Items'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-4 md:gap-12">
                          <div className="hidden sm:block">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'ÖDEME' : 'PAYMENT'}</p>
                            <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                              <CreditCard className="w-3 h-3" />
                              {order.payment_method === 'iyzico' ? 'iyzico' : 
                               order.payment_method === 'bank_transfer' ? (lang === 'tr' ? 'Havale' : 'Transfer') :
                               order.payment_method === 'cash_on_delivery' ? (lang === 'tr' ? 'Kapıda' : 'COD') : order.payment_method}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'TUTAR' : 'TOTAL'}</p>
                            <p className="text-sm font-black text-primary">
                              {order.total_amount?.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {order.currency}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-right">{lang === 'tr' ? 'DURUM' : 'STATUS'}</p>
                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${
                              order.status === 'completed' || order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-100' :
                              order.status === 'shipped' || order.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                              order.status === 'cancelled' || order.status === 'returned' ? 'bg-red-50 text-red-600 border-red-100' :
                              'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                              {order.status === 'pending' ? (lang === 'tr' ? 'Bekliyor' : 'Pending') :
                               order.status === 'processing' ? (lang === 'tr' ? 'Hazırlanıyor' : 'Preparing') :
                               order.status === 'shipped' ? (lang === 'tr' ? 'Kargoda' : 'Shipped') :
                               order.status === 'delivered' ? (lang === 'tr' ? 'Teslim Edildi' : 'Delivered') :
                               order.status === 'completed' ? (lang === 'tr' ? 'Tamamlandı' : 'Completed') :
                               order.status === 'cancelled' ? (lang === 'tr' ? 'İptal Edildi' : 'Cancelled') : order.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {order.notes && (
                        <div className="px-6 py-3 bg-blue-50/30 border-t border-gray-100 italic text-xs text-gray-500">
                          {lang === 'tr' ? 'Not: ' : 'Note: '}{order.notes}
                        </div>
                      )}
                      
                      {/* Shipping Info */}
                      {(order.tracking_number || order.shipping_carrier) && (
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{lang === 'tr' ? 'KARGO BİLGİSİ' : 'SHIPPING INFO'}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-700">{order.shipping_carrier || (lang === 'tr' ? 'Standart Kargo' : 'Standard Shipping')}</span>
                                {order.tracking_number && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                    <span className="text-xs font-mono font-bold text-primary select-all">{order.tracking_number}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {order.tracking_number && (
                            <a 
                              href={`#`} // You can add logic for carrier specific tracking URLs if needed
                              onClick={(e) => {
                                e.preventDefault();
                                // Most Turkish carriers have a tracking query page
                                const carrier = order.shipping_carrier?.toLowerCase();
                                let url = '';
                                if (carrier?.includes('aras')) url = `https://www.araskargo.com.tr/takipp-detay?kargo_no=${order.tracking_number}`;
                                else if (carrier?.includes('yurtiçi')) url = `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${order.tracking_number}`;
                                else if (carrier?.includes('mng')) url = `https://www.mngkargo.com.tr/gonderitakip/${order.tracking_number}`;
                                else if (carrier?.includes('ptt')) url = `https://gonderitakip.ptt.gov.tr/Track/Verify?id=${order.tracking_number}`;
                                else if (carrier?.includes('ups')) url = `https://www.ups.com/track?tracknum=${order.tracking_number}`;
                                
                                if (url) window.open(url, '_blank');
                              }}
                              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {lang === 'tr' ? 'KARGO TAKİP' : 'TRACK SHIPPING'}
                            </a>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-20 text-center border border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-bold">{lang === 'tr' ? 'Henüz bir siparişiniz bulunmuyor.' : 'You don\'t have any orders yet.'}</p>
                  <button 
                    onClick={() => navigate(getStorePath("/"))}
                    className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all"
                  >
                    {t.dashboard.startShopping}
                  </button>
                </div>
              )}
            </div>
          )}
          {isReturnView && (
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-8">{lang === 'tr' ? 'İade Taleplerim' : 'My Return Requests'}</h2>
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RotateCcw className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-400 font-bold">{lang === 'tr' ? 'Aktif bir iade veya değişim talebiniz bulunmuyor.' : 'You don\'t have any active return or exchange requests.'}</p>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-white rounded-t-[3rem] z-[101] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Filtrele</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{products.length} Ürün Mevcut</p>
                </div>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                {/* Mobile Subcategories */}
                {selectedCategory && categories.get(selectedCategory)!.size > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">{t.dashboard.subCategories || 'ALT KATEGORİLER'}</h4>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedSubCategory(null)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                !selectedSubCategory ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-500 border-gray-100"
                            }`}
                        >
                            Hepsi
                        </button>
                        {Array.from(categories.get(selectedCategory)!).sort().map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubCategory(sub)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    selectedSubCategory === sub ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-500 border-gray-100"
                                }`}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Brands */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">{lang === 'tr' ? 'MARKALAR' : 'BRANDS'}</h4>
                  <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Marka Ara..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedBrand(null)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            !selectedBrand ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-500 border-gray-100"
                        }`}
                    >
                        Hepsi
                    </button>
                    {brands
                      .filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase()))
                      .map(brand => (
                        <button
                          key={brand}
                          onClick={() => setSelectedBrand(brand)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedBrand === brand ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-gray-500 border-gray-100"
                          }`}
                        >
                          {brand}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50">
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-gray-900/20 active:scale-95 transition-all"
                >
                  Sonuçları Gör
                </button>
                <button 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubCategory(null);
                    setSelectedBrand(null);
                    setShowMobileFilters(false);
                  }}
                  className="w-full mt-4 py-2 text-gray-400 text-xs font-bold hover:text-gray-600 transition-all"
                >
                  Filtreleri Temizle
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {store?.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="h-8 w-auto" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: primaryColor }}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xl font-display font-black tracking-tighter text-gray-900">{store?.name}</span>
              </div>
              <p className="text-gray-500 text-sm font-medium max-w-md leading-relaxed">
                {store?.description || 'En kaliteli ürünleri en uygun fiyatlarla sizlere sunuyoruz. Müşteri memnuniyeti bizim için her zaman önceliklidir.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">{lang === 'tr' ? 'Hızlı Menü' : 'Quick Menu'}</h4>
              <ul className="space-y-2">
                {(store?.menu_links || []).map((link: any, index: number) => (
                  <li key={index}>
                    <a href={link.url} className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors" style={{ '--tw-text-opacity': 1, ':hover': { color: primaryColor } } as any}>{link.label}</a>
                  </li>
                ))}
                {(!store?.menu_links || store.menu_links.length === 0) && (
                  <li><span className="text-gray-400 text-sm">{lang === 'tr' ? 'Menü bulunamadı.' : 'No menu links.'}</span></li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">İletişim</h4>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {store?.email || 'destek@lookprice.net'}
                </li>
                <li className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {store?.phone || '+90 212 000 00 00'}
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 font-medium text-xs">
              © {new Date().getFullYear()} {store?.name}. Tüm hakları saklıdır.
            </p>
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              {(store?.footer_links || []).map((page: any, index: number) => (
                <a key={index} href={page.url} className="text-gray-400 hover:text-gray-900 text-xs font-medium transition-colors">{page.label}</a>
              ))}
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
                              {(basketItemPrices[item.id] || item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}
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
                      <span>{basketSubtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {store?.currency || "TL"}</span>
                    </div>
                    <div className="flex items-center justify-between text-green-600 text-sm font-bold uppercase tracking-widest">
                      <span>{t.dashboard.shipping}</span>
                      <span>
                        {basketShippingTotal > 0 
                          ? `${basketShippingTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${store?.currency || "TL"}`
                          : t.dashboard.freeShipping
                        }
                      </span>
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
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-y-auto max-h-[90vh]"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setAuthMode('login')}
                      className={`text-2xl font-black tracking-tight transition-colors ${authMode === 'login' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                      {lang === 'tr' ? 'GİRİŞ YAP' : 'LOGIN'}
                    </button>
                    <button 
                      onClick={() => setAuthMode('register')}
                      className={`text-2xl font-black tracking-tight transition-colors ${authMode === 'register' ? 'text-gray-900' : 'text-gray-300 hover:text-gray-500'}`}
                    >
                      {lang === 'tr' ? 'ÜYE OL' : 'REGISTER'}
                    </button>
                  </div>
                  <button onClick={() => setShowAuthModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6" /></button>
                </div>

                <form onSubmit={authMode === 'login' ? handleCustomerLogin : handleCustomerRegister} className="space-y-4">
                  {authMode === 'register' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ADINIZ' : 'NAME'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'SOYADINIZ' : 'SURNAME'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.surname}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, surname: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                      </div>
                    </>
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
                  <div className="grid grid-cols-2 gap-4">
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
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ŞİFRE TEKRAR' : 'PASSWORD CONFIRM'}</label>
                        <input 
                          required
                          type="password"
                          value={customerInfo.passwordConfirm}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                          className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                          style={{ borderFocusColor: primaryColor } as any}
                        />
                      </div>
                    )}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ÜLKE' : 'COUNTRY'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.country}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, country: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'İL' : 'CITY'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'T.C. KİMLİK NUMARASI' : 'TC ID'}</label>
                          <input 
                            type="text"
                            value={customerInfo.tc_id}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, tc_id: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                          />
                        </div>
                        <div className="space-y-1 flex flex-col justify-center">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2">{lang === 'tr' ? 'HESAP TÜRÜ' : 'ACCOUNT TYPE'}</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="is_corporate" 
                                checked={!customerInfo.is_corporate} 
                                onChange={() => setCustomerInfo(prev => ({ ...prev, is_corporate: false }))}
                                className="w-4 h-4 text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Bireysel' : 'Individual'}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="radio" 
                                name="is_corporate" 
                                checked={customerInfo.is_corporate} 
                                onChange={() => setCustomerInfo(prev => ({ ...prev, is_corporate: true }))}
                                className="w-4 h-4 text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Kurumsal' : 'Corporate'}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-4 bg-gray-50 p-4 rounded-2xl">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={customerInfo.marketing_email}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, marketing_email: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-medium text-gray-600 leading-tight">
                            {lang === 'tr' ? 'Kampanyalardan haberdar olmak için elektronik ileti almak istiyorum.' : 'I want to receive electronic messages to be informed about campaigns.'}
                          </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={customerInfo.marketing_sms}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, marketing_sms: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-medium text-gray-600 leading-tight">
                            {lang === 'tr' ? 'Kampanyalardan haberdar olmak için SMS almak istiyorum.' : 'I want to receive SMS to be informed about campaigns.'}
                          </span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            required
                            checked={customerInfo.accept_terms}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, accept_terms: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-medium text-gray-600 leading-tight">
                            {lang === 'tr' ? 'Üyelik sözleşmesini ve kişisel verilerin işlenmesine ilişkin aydınlatma metnini okudum, kabul ediyorum.' : 'I have read and accept the membership agreement and the clarification text on the processing of personal data.'}
                          </span>
                        </label>
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

                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">
                      {lang === 'tr' ? 'VEYA' : 'OR'}
                    </span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        alert(lang === 'tr' ? 'Google ile giriş yakında eklenecek!' : 'Google login coming soon!');
                      }}
                      className="w-full py-4 bg-white border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        <path fill="none" d="M1 1h22v22H1z" />
                      </svg>
                      {lang === 'tr' ? 'Google ile Devam Et' : 'Continue with Google'}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => {
                        setShowAuthModal(false);
                        setIsCheckoutModalOpen(true);
                      }}
                      className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
                    >
                      {lang === 'tr' ? 'Misafir Olarak Devam Et' : 'Continue as Guest'}
                    </button>
                  </div>
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
                {iyzicoPaymentUrl ? (
                  <div className="w-full flex flex-col h-[70vh] min-h-[500px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <h2 className="text-xl font-black text-gray-900 uppercase tracking-wider">{lang === 'tr' ? 'Güvenli Ödeme' : 'Secure Payment'}</h2>
                      <button 
                        onClick={() => {
                          setIyzicoPaymentUrl(null);
                          setIsCheckoutModalOpen(false);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <iframe 
                      src={iyzicoPaymentUrl} 
                      className="w-full flex-1 border-0 rounded-2xl"
                      title="Iyzico Payment"
                    />
                  </div>
                ) : checkoutStatus === 'success' ? (
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
                            placeholder={lang === 'tr' ? 'Ad' : 'First Name'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'SOYAD' : 'SURNAME'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.surname}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, surname: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                            placeholder={lang === 'tr' ? 'Soyad' : 'Surname'}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'T.C. KİMLİK NO' : 'IDENTITY NUMBER'}</label>
                          <input 
                            required
                            type="text"
                            maxLength={11}
                            value={customerInfo.tc_id}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, tc_id: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            style={{ borderFocusColor: primaryColor } as any}
                            placeholder="11111111111"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'E-POSTA' : 'EMAIL'}</label>
                        <input 
                          required
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                          style={{ borderFocusColor: primaryColor } as any}
                          placeholder="email@example.com"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ŞEHİR' : 'CITY'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.city}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            placeholder={lang === 'tr' ? 'Şehir' : 'City'}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ÜLKE' : 'COUNTRY'}</label>
                          <input 
                            required
                            type="text"
                            value={customerInfo.country}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, country: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl transition-all outline-none font-bold text-gray-900"
                            placeholder={lang === 'tr' ? 'Ülke' : 'Country'}
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

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={customerInfo.createAccount}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, createAccount: e.target.checked }))}
                            className="w-4 h-4 rounded text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-gray-700">{lang === 'tr' ? 'Hesap oluştur' : 'Create an account'}</span>
                        </label>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{lang === 'tr' ? 'ÖDEME YÖNTEMİ' : 'PAYMENT METHOD'}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {/* 1. Iyzico (Primary Credit Card if enabled) */}
                          {store?.payment_settings?.iyzico_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('iyzico')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'iyzico' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'iyzico' ? primaryColor : undefined }}
                            >
                              <ShieldCheck className={`w-6 h-6 mb-2 ${paymentMethod === 'iyzico' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'iyzico' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xs text-center ${paymentMethod === 'iyzico' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</span>
                            </button>
                          )}

                          {/* 2. Generic Credit Card - ONLY if iyzico is NOT enabled AND some other POS is enabled */}
                          {!store?.payment_settings?.iyzico_enabled && (store?.payment_settings?.paypal_enabled || store?.payment_settings?.payoneer_enabled) && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('credit_card')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'credit_card' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'credit_card' ? primaryColor : undefined }}
                            >
                              <ShieldCheck className={`w-6 h-6 mb-2 ${paymentMethod === 'credit_card' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'credit_card' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xs text-center ${paymentMethod === 'credit_card' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Kredi Kartı' : 'Credit Card'}</span>
                            </button>
                          )}

                          {/* 3. Payoneer */}
                          {store?.payment_settings?.payoneer_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('payoneer')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'payoneer' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'payoneer' ? primaryColor : undefined }}
                            >
                              <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'payoneer' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'payoneer' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xs text-center ${paymentMethod === 'payoneer' ? 'text-gray-900' : 'text-gray-500'}`}>Payoneer</span>
                            </button>
                          )}

                          {/* 4. PayPal */}
                          {store?.payment_settings?.paypal_enabled && (
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('paypal')}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                              style={{ borderColor: paymentMethod === 'paypal' ? primaryColor : undefined }}
                            >
                              <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === 'paypal' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'paypal' ? primaryColor : undefined }} />
                              <span className={`font-bold text-xs text-center ${paymentMethod === 'paypal' ? 'text-gray-900' : 'text-gray-500'}`}>PayPal</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank_transfer')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'bank_transfer' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                            style={{ borderColor: paymentMethod === 'bank_transfer' ? primaryColor : undefined }}
                          >
                            <RotateCcw className={`w-6 h-6 mb-2 ${paymentMethod === 'bank_transfer' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'bank_transfer' ? primaryColor : undefined }} />
                            <span className={`font-bold text-xs text-center ${paymentMethod === 'bank_transfer' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Havale / EFT' : 'Bank Transfer'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash_on_delivery')}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                            style={{ borderColor: paymentMethod === 'cash_on_delivery' ? primaryColor : undefined }}
                          >
                            <Truck className={`w-6 h-6 mb-2 ${paymentMethod === 'cash_on_delivery' ? 'text-blue-600' : 'text-gray-400'}`} style={{ color: paymentMethod === 'cash_on_delivery' ? primaryColor : undefined }} />
                            <span className={`font-bold text-xs text-center ${paymentMethod === 'cash_on_delivery' ? 'text-gray-900' : 'text-gray-500'}`}>{lang === 'tr' ? 'Kapıda Ödeme' : 'Cash on Delivery'}</span>
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
