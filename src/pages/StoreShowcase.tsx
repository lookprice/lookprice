import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getExchangeRate } from "../services/currencyService";
import {
  Check,
  Lock,
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
  Shield,
  Globe,
  Truck,
  ExternalLink,
  RotateCcw,
  Star,
  Eye,
  Filter,
  ArrowUpDown,
  Tag,
  ShoppingBag,
  Mail,
  Share2,
  Sparkles,
  Link2,
  MessageSquare,
  BookOpen,
  Navigation,
  Compass,
  Map as MapIcon,
  Maximize2
} from "lucide-react";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  Map3D,
  MapMode
} from "@vis.gl/react-google-maps";
import {
  CreditCard,
  User,
  LogOut,
  Edit3,
  Building2,
  Home,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";
import { ModernRealEstateLayout } from "../components/ModernRealEstateLayout";
import { ModernAutomotiveLayout } from "../components/ModernAutomotiveLayout";
import { RadarShowcaseSlider } from "../components/RadarShowcaseSlider";

import ErrorBoundary from "../components/ErrorBoundary";
import { PageBuilder } from "../components/PageBuilder";
import {
  Product,
  Store as StoreInfo,
  FAQEntry,
  BlogPost,
  LegalPage,
} from "../types";
import SEO from "../components/SEO";
import { ProductCard } from "../components/ProductCard";
import { SectorSpecs } from "../components/SectorSpecs";
import { ListingFinancingCalculator } from "../components/ListingFinancingCalculator";
import { AuthModal } from '../components/showcase/AuthModal';
import { CheckoutModal } from '../components/showcase/CheckoutModal';
import { BasketSidebar } from '../components/showcase/BasketSidebar';
import { DigitalSignature } from '../components/showcase/DigitalSignature';
import { DiscoverModal } from '../components/showcase/DiscoverModal';
import { FAQModal } from '../components/showcase/FAQModal';
import { BlogModal } from '../components/showcase/BlogModal';
import { LegalModal } from '../components/showcase/LegalModal';
import { AboutModal } from '../components/showcase/AboutModal';
import { StoreHeader } from '../components/showcase/StoreHeader';
import { NewsletterSection } from '../components/showcase/NewsletterSection';
import { StoreFooter } from '../components/showcase/StoreFooter';
const StoreMapSection = React.lazy(() => import("../components/StoreMapSection").then(m => ({ default: m.StoreMapSection })));
import { MobileFiltersModal } from '../components/showcase/MobileFiltersModal';
import { StoreProfile } from '../components/showcase/StoreProfile';
const PropertyMapTour = React.lazy(() => import("../components/PropertyMapTour").then(m => ({ default: m.PropertyMapTour })));
const ProductDetailModal = React.lazy(() => import("../components/ProductDetailModal").then(m => ({ default: m.ProductDetailModal })));
const StoreLocatorModal = React.lazy(() => import("../components/StoreLocatorModal").then(m => ({ default: m.StoreLocatorModal })));
const KktcAiDioramaModal = React.lazy(() => import("../components/KktcAiDioramaModal").then(m => ({ default: m.KktcAiDioramaModal })));

interface BasketItem extends Product {
  quantity: number;
}

const getLabels = (labels: any): string[] => {
  if (Array.isArray(labels)) return labels;
  if (typeof labels === "string") {
    try {
      const parsed = JSON.parse(labels);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};

const formatPrice = (price: number, currency: string, sector: string, storeType?: string) => {
  const isPortfolio = storeType === "real_estate" || storeType === "motor_vehicle" || sector === "real_estate" || sector === "automotive";
  const decimals = isPortfolio ? 0 : 2;
  return `${Number(price).toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency || "TRY"}`;
};

// @ts-ignore
const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || "";
console.log("Maps API Key loaded:", !!MAP_KEY ? "Present" : "Missing");



const StoreShowcase: React.FC<{ customSlug?: string }> = ({ customSlug }) => {
  const { slug: urlSlug, barcode: urlBarcode } = useParams<{
    slug: string;
    barcode?: string;
  }>();
  const slug = customSlug || urlSlug;
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const t = translations[lang];
  const isTr = lang === "tr";

  const getStorePath = (path: string = "") => {
    if (customSlug) {
      return path.startsWith("/") ? path : `/${path}`;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/s/${slug}${cleanPath === "/" ? "" : cleanPath}`;
  };

  const isProfileView = location.pathname.endsWith("/profile");
  const isOrdersView = location.pathname.endsWith("/orders");
  const isReturnView = location.pathname.endsWith("/return");

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [radarNews, setRadarNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = React.useRef<HTMLDivElement>(null);

  const brandLabel = store?.brand_label || (lang === "tr" ? "Marka" : "Brand");
  const brandsLabel = store?.brand_label
    ? store.brand_label.toUpperCase()
    : lang === "tr"
      ? "MARKALAR"
      : "BRANDS";
  const categoryLabel =
    store?.category_label || (lang === "tr" ? "Kategori" : "Category");
  const categoriesLabel = store?.category_label
    ? store.category_label.toUpperCase()
    : lang === "tr"
      ? "KATEGORİLER"
      : "CATEGORIES";
  const productLabel =
    store?.product_label || (lang === "tr" ? "Ürün" : "Product");
  const stockLabel = store?.stock_label || (lang === "tr" ? "Stok" : "Stock");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [checkoutStatus, setCheckoutStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const basketByBranch = useMemo(() => {
    const groups: Record<string, BasketItem[]> = {};
    basket.forEach((item) => {
      const branch = item.branch_name || store?.name || "Ana Şube";
      if (!groups[branch]) groups[branch] = [];
      groups[branch].push(item);
    });
    return groups;
  }, [basket, store?.name]);
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(
    localStorage.getItem("customerToken"),
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState<any>({});
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Portfolio-specific filter states
  const [portfolioType, setPortfolioType] = useState<
    "all" | "real_estate" | "car" | "motorcycle" | "marine" | "construction" | "agricultural" | "other"
  >("all");
  const [portfolioMinPrice, setPortfolioMinPrice] = useState("");
  const [portfolioMaxPrice, setPortfolioMaxPrice] = useState("");
  const [portfolioRooms, setPortfolioRooms] = useState("all");
  const [portfolioMinM2, setPortfolioMinM2] = useState("");

  useEffect(() => {
    if ((isProfileView || isOrdersView || isReturnView) && !customerToken) {
      setShowAuthModal(true);
    }
  }, [isProfileView, isOrdersView, isReturnView, customerToken]);

  useEffect(() => {
    if (isProfileView && customerToken) {
      api.getCustomerProfile().then((res) => {
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
    name: "",
    surname: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    passwordConfirm: "",
    country: "",
    city: "",
    tc_id: "",
    is_corporate: false,
    marketing_email: false,
    marketing_sms: false,
    accept_terms: false,
    createAccount: false,
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null,
  );
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "priceAsc" | "priceDesc">(
    "default",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    | "credit_card"
    | "bank_transfer"
    | "cash_on_delivery"
    | "payoneer"
    | "paypal"
    | "iyzico"
    | "store_reservation"
  >("credit_card");
  const [iyzicoPaymentUrl, setIyzicoPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (store?.payment_settings) {
      if (store.payment_settings.cod_enabled) {
        setPaymentMethod("cash_on_delivery");
      } else if (store.payment_settings.bank_transfer_enabled) {
        setPaymentMethod("bank_transfer");
      } else if (store.payment_settings.iyzico_enabled) {
        setPaymentMethod("iyzico");
      } else if (store.payment_settings.paypal_enabled) {
        setPaymentMethod("paypal");
      } else if (store.payment_settings.payoneer_enabled) {
        setPaymentMethod("payoneer");
      }
    }
  }, [store]);
  const [customer, setCustomer] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [showKktcDiorama, setShowKktcDiorama] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showFaq, setShowFaq] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(
    null,
  );
  const [showLegal, setShowLegal] = useState<"sales" | "kvkk" | "pre_info" | null>(null);
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
    const savedCustomer = localStorage.getItem("customer");
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }
  }, []);

  const formatPrice = (price: number, currency?: string) => {
    const isPortfolio = (store?.store_type === "real_estate" || store?.store_type === "motor_vehicle") || store?.sector === "real_estate" || store?.sector === "automotive" || layoutSettings?.sector === "real_estate" || layoutSettings?.sector === "automotive";
    const decimals = isPortfolio ? 0 : 2;
    return `${Number(price).toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency || store?.currency || "TRY"}`;
  };

  const layoutSettings = store?.page_layout_settings || {
    show_announcement: true,
    show_stories: true,
    show_campaigns: true,
    show_testimonials: true,
    show_newsletter: true,
    enable_live_activity: true,
    theme_variety: "modern",
    sector: "general",
  };

  const isLuxury =
    layoutSettings.theme_variety === "luxury" ||
    layoutSettings.theme_variety === "minimal";
  const isModern = layoutSettings.theme_variety === "modern";
  const isBold = layoutSettings.theme_variety === "bold";

  const sector = layoutSettings.sector || "general";
  const isAuto = sector === "automotive";
  const isFashion = sector === "fashion" || isLuxury;
  const isTech = sector === "tech";

  const primaryColor =
    store?.primary_color || (isLuxury ? "#8B7355" : "#3b82f6"); // Elegant bronze for luxury
  const secondaryColor =
    store?.secondary_color || (isLuxury ? "#000000" : "#1e293b");

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showStoreLocatorModal, setShowStoreLocatorModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      console.log(`Fetching store data for slug: ${slug}`);
      try {
        const [storeRes, productsRes, radarNewsRes] = await Promise.all([
          api.getPublicStore(slug),
          api.getPublicStoreProducts(slug),
          api.getPublicRadarNews(slug).catch((err: any) => {
            console.error("Failed to load radar news:", err);
            return [];
          })
        ]);

        console.log("Store response:", storeRes);
        console.log("Products response:", productsRes);
        console.log("Radar news response:", radarNewsRes);

        if (storeRes.redirect) {
          navigate(storeRes.redirect, { replace: true });
          return;
        }

        if (storeRes.error) throw new Error(storeRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        let parsedLayout = storeRes.page_layout;
        if (typeof parsedLayout === "string" && parsedLayout) {
          try {
            parsedLayout = JSON.parse(parsedLayout);
          } catch (e) {
            parsedLayout = null;
          }
        }

        if (parsedLayout) {
          storeRes.page_layout_full = parsedLayout;
          const defaultSectionIds = ['hero', 'search', 'stats', 'portfolio', 'news', 'blog', 'team', 'financing', 'calculator', 'map', 'social'];
          
          if (parsedLayout && typeof parsedLayout === "object" && !Array.isArray(parsedLayout)) {
            if (Array.isArray(parsedLayout.sections)) {
              storeRes.page_layout = parsedLayout.sections.map((s: any) => ({
                id: s.id || s.type,
                type: s.type || s.id,
                enabled: s.enabled !== false
              }));
            } else {
              storeRes.page_layout = defaultSectionIds.map(defId => ({ id: defId, type: defId, enabled: true }));
            }
          } else if (Array.isArray(parsedLayout)) {
            storeRes.page_layout = parsedLayout.map((s: any) => ({
              id: s.id || s.type,
              type: s.type || s.id,
              enabled: s.enabled !== false
            }));
          } else {
            storeRes.page_layout = defaultSectionIds.map(defId => ({ id: defId, type: defId, enabled: true }));
          }
        } else {
          storeRes.page_layout = [];
        }

        if (typeof storeRes.menu_links === "string") {
          try {
            storeRes.menu_links = JSON.parse(storeRes.menu_links);
          } catch (e) {
            storeRes.menu_links = [];
          }
        }

        storeRes.currency = storeRes.default_currency || "TRY";
        console.log("Store data fetched:", storeRes);
        setStore(storeRes);

        // Update favicon
        if (storeRes.favicon_url) {
          const link =
            (document.querySelector("link[rel~='icon']") as HTMLLinkElement) ||
            document.createElement("link");
          link.rel = "icon";
          link.href = storeRes.favicon_url;
          document.head.appendChild(link);
        }

        document.title = storeRes.name || "Store";
        setProducts(
          productsRes.filter((p: Product) => p.is_web_sale !== false),
        );
        
        // Filter radar news by sector
        const currentSector = storeRes.store_type === 'motor_vehicle' || storeRes.store_type === 'automotive' ? 'automotive' : 'real_estate';
        const filteredNews = Array.isArray(radarNewsRes) 
          ? radarNewsRes.filter((n: any) => {
              // If news has no sector, show it everywhere (general news)
              if (!n.sector) return true;
              return n.sector === currentSector || 
                     (currentSector === 'automotive' && n.sector === 'motor_vehicle');
            })
          : [];
        setRadarNews(filteredNews);

        // If we have a barcode in the URL and haven't selected a product yet, try to find it
        if (urlBarcode) {
          const cleanBarcode = urlBarcode.toString().trim().toLowerCase();
          const product = productsRes.find(
            (p: Product) =>
              (p.barcode &&
                p.barcode.toString().trim().toLowerCase() === cleanBarcode) ||
              p.id.toString() === cleanBarcode,
          );
          if (product) {
            setSelectedProduct(product);
          }
        }

        // If customer is logged in, sync their info to checkout
        if (customer) {
          setCustomerInfo((prev) => ({
            ...prev,
            name: customer.name || "",
            surname: customer.surname || "",
            phone: customer.phone || "",
            address: customer.address || "",
            email: customer.email || "",
            country: customer.country || "",
            city: customer.city || "",
            tc_id: customer.tc_id || "",
            is_corporate: customer.is_corporate || false,
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

  useEffect(() => {
    if (store?.id) {
      fetch("/api/public/analytics/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          entity_type: "store_home",
          entity_id: null,
          event_type: "impression",
          referer: document.referrer || null
        })
      }).catch(e => console.error("Telemetry failed:", e));
    }
  }, [store?.id]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateCustomerProfile(profileEditForm);
      if (res.error) throw new Error(res.error);
      setCustomerProfile(res.customer);
      setCustomer(res.customer);
      localStorage.setItem("customer", JSON.stringify(res.customer));
      setIsEditingProfile(false);
      alert(
        lang === "tr"
          ? "Profil başarıyla güncellendi!"
          : "Profile updated successfully!",
      );
    } catch (err: any) {
      alert(
        err.message ||
          (lang === "tr"
            ? "Profil güncellenirken bir hata oluştu."
            : "An error occurred while updating profile."),
      );
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.customerLogin({
        email: customerInfo.email,
        password: customerInfo.password,
        storeId: store?.id,
      });
      if (res.error) throw new Error(res.error);
      setCustomer(res.customer);
      setBasket([]); // Clear basket on login
      localStorage.setItem("customer", JSON.stringify(res.customer));
      localStorage.setItem("customerToken", res.token);
      setCustomerToken(res.token);
      setShowAuthModal(false);
      setCustomerInfo((prev) => ({
        ...prev,
        name: res.customer.name,
        surname: res.customer.surname,
        phone: res.customer.phone,
        address: res.customer.address,
        email: res.customer.email,
        country: res.customer.country,
        city: res.customer.city,
        tc_id: res.customer.tc_id,
        is_corporate: res.customer.is_corporate,
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customerInfo.password !== customerInfo.passwordConfirm) {
      alert(lang === "tr" ? "Şifreler eşleşmiyor" : "Passwords do not match");
      return;
    }
    if (!customerInfo.accept_terms) {
      alert(
        lang === "tr"
          ? "Üyelik sözleşmesini kabul etmelisiniz"
          : "You must accept the membership agreement",
      );
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
        storeId: store?.id,
      });
      if (res.error) throw new Error(res.error);

      // Auto login after registration
      const loginRes = await api.customerLogin({
        email: customerInfo.email,
        password: customerInfo.password,
        storeId: store?.id,
      });

      if (loginRes.error) throw new Error(loginRes.error);

      setCustomer(loginRes.customer);
      setBasket([]); // Clear basket on register
      setCustomerInfo((prev) => ({
        ...prev,
        name: loginRes.customer.name,
        surname: loginRes.customer.surname,
        phone: loginRes.customer.phone,
        address: loginRes.customer.address,
        email: loginRes.customer.email,
        country: loginRes.customer.country,
        city: loginRes.customer.city,
        tc_id: loginRes.customer.tc_id,
        is_corporate: loginRes.customer.is_corporate,
      }));
      localStorage.setItem("customer", JSON.stringify(loginRes.customer));
      localStorage.setItem("customerToken", loginRes.token);
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
      name: "",
      surname: "",
      phone: "",
      address: "",
      email: "",
      password: "",
      passwordConfirm: "",
      country: "",
      city: "",
      tc_id: "",
      is_corporate: false,
      marketing_email: false,
      marketing_sms: false,
      accept_terms: false,
      createAccount: false,
    });
    localStorage.removeItem("customer");
    localStorage.removeItem("customerToken");
    localStorage.removeItem("basket"); // Just in case it was there
    if (isProfileView || isOrdersView || isReturnView) {
      navigate(`/s/${slug}`);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
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
      const hashA = (Number(a.id) * 15485863) % 1000000;
      const hashB = (Number(b.id) * 15485863) % 1000000;
      return hashA - hashB;
    });
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Map<string, Set<string>>();
    products.forEach((p) => {
      const cat = p.category || t.dashboard.uncategorized;
      if (!cats.has(cat)) cats.set(cat, new Set());
      if (p.sub_category) cats.get(cat)!.add(p.sub_category);
    });
    return cats;
  }, [products, t]);

  const brands = useMemo(() => {
    const b = new Set<string>();
    products.forEach((p) => {
      if (p.brand) b.add(p.brand);
    });
    return Array.from(b).sort();
  }, [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    const baseProducts =
      sortBy === "default" &&
      !searchQuery &&
      !selectedCategory &&
      !selectedBrand
        ? shuffledProducts
        : products;

    let result = baseProducts.filter((p) => {
      const searchTerms = searchQuery.toLowerCase().split(" ").filter(Boolean);
      const matchesSearch =
        searchTerms.length === 0 ||
        searchTerms.every(
          (term) =>
            p.name.toLowerCase().includes(term) ||
            (p.barcode && p.barcode.toLowerCase().includes(term)) ||
            (p.description && p.description.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term)) ||
            (p.brand && p.brand.toLowerCase().includes(term)) ||
            (p.author && p.author.toLowerCase().includes(term)) ||
            (p.branch_name && p.branch_name.toLowerCase().includes(term)),
        );

      const productCategory = p.category || t.dashboard.uncategorized;
      const matchesCategory =
        !selectedCategory || productCategory === selectedCategory;
      const matchesSubCategory =
        !selectedSubCategory || p.sub_category === selectedSubCategory;
      const matchesBrand = !selectedBrand || p.brand === selectedBrand;

      // Portfolio fields filter
      let matchesPortfolioType = true;
      if (
        store?.store_type === "real_estate" || store?.store_type === "motor_vehicle" ||
        p.type === "real_estate" ||
        p.type === "vehicle"
      ) {
        if (portfolioType === "real_estate") {
          matchesPortfolioType = p.type === "real_estate";
        } else if (portfolioType !== "all") {
          // If a specific sub-category (other than all/real_estate) is selected
          matchesPortfolioType = p.sector_data?.sub_sector === portfolioType;
        }
      }

      let matchesMinPrice = true;
      if (portfolioMinPrice) {
        matchesMinPrice = p.price >= Number(portfolioMinPrice);
      }

      let matchesMaxPrice = true;
      if (portfolioMaxPrice) {
        matchesMaxPrice = p.price <= Number(portfolioMaxPrice);
      }

      let matchesRooms = true;
      if (portfolioRooms !== "all" && p.type === "real_estate") {
        const pRooms = Number(p.sector_data?.rooms);
        if (portfolioRooms === "1") matchesRooms = pRooms === 1;
        else if (portfolioRooms === "2") matchesRooms = pRooms === 2;
        else if (portfolioRooms === "3") matchesRooms = pRooms === 3;
        else if (portfolioRooms === "4+") matchesRooms = pRooms >= 4;
      }

      let matchesMinM2 = true;
      if (portfolioMinM2 && p.type === "real_estate") {
        matchesMinM2 =
          Number(p.sector_data?.square_meters) >= Number(portfolioMinM2);
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubCategory &&
        matchesBrand &&
        matchesPortfolioType &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesRooms &&
        matchesMinM2
      );
    });

    if (sortBy === "priceAsc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "priceDesc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [
    products,
    shuffledProducts,
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedBrand,
    sortBy,
    portfolioType,
    portfolioMinPrice,
    portfolioMaxPrice,
    portfolioRooms,
    portfolioMinM2,
    store?.store_type,
    t,
  ]);

  const totalPages = Math.ceil(
    sortedAndFilteredProducts.length / ITEMS_PER_PAGE,
  );
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredProducts, currentPage]);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);
  const newArrivals = useMemo(
    () => [...products].reverse().slice(0, 8),
    [products],
  );
  const bestSellers = useMemo(
    () => [...products].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 8),
    [products],
  );

  const seoKeywords = useMemo(() => {
    const categories = Array.from(
      new Set(products.map((p) => p.category)),
    ).filter(Boolean);
    const brands = Array.from(new Set(products.map((p) => p.brand))).filter(
      Boolean,
    );
    return [
      store?.name,
      store?.hero_title,
      ...categories,
      ...brands,
      lang === "tr"
        ? "online alışveriş, en iyi fiyatlar, kaliteli ürünler"
        : "online shopping, best prices, quality products",
    ]
      .filter(Boolean)
      .join(", ");
  }, [products, store, lang]);

  const storeSchema = store
    ? {
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        name: store.name,
        description: store.description,
        url: window.location.href,
        logo: store.logo_url,
        address: {
          "@type": "PostalAddress",
          streetAddress: store.address,
        },
      }
    : undefined;

  const addToBasket = (product: Product) => {
    setBasket((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromBasket = (productId: number | string) => {
    setBasket((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        );
      }
      return prev.filter((item) => item.id !== productId);
    });
  };

  const [basketTotal, setBasketTotal] = useState(0);
  const [basketSubtotal, setBasketSubtotal] = useState(0);
  const [basketShippingTotal, setBasketShippingTotal] = useState(0);
  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  const [basketItemPrices, setBasketItemPrices] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    const calculateTotal = async () => {
      if (!store?.currency) return;
      let subtotal = 0;
      let maxShippingCost = 0;
      const newPrices: Record<number, number> = {};

      for (const item of basket) {
        const itemPrice = Number(item.price) || 0;
        let shippingCost = 0;

        let matchedProfile: any = null;

        if (item.shipping_profile_id && store.shipping_profiles) {
          matchedProfile = store.shipping_profiles.find(
            (p: any) => String(p.id) === String(item.shipping_profile_id),
          );
        }

        // Fallback to Category / Subcategory collective matching if no specific product profile is assigned
        if (!matchedProfile && store.shipping_profiles) {
          const itemCat = String(item.category || "").trim().toLowerCase();
          const itemSubcat = String(item.sub_category || "").trim().toLowerCase();

          for (const p of store.shipping_profiles) {
            // Check subcategory match first
            if (p.sub_categories_str && itemSubcat) {
              const subcats = p.sub_categories_str.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
              if (subcats.includes(itemSubcat)) {
                matchedProfile = p;
                break; // Found matching subcategory, prioritize this
              }
            }
            // Check category match
            if (p.categories_str && itemCat) {
              const cats = p.categories_str.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
              if (cats.includes(itemCat)) {
                matchedProfile = p;
              }
            }
          }
        }

        if (matchedProfile) {
          let profileCost = Number(matchedProfile.cost) || 0;
          if (matchedProfile.currency && matchedProfile.currency !== store.currency) {
            const sRate = await getExchangeRate(
              matchedProfile.currency,
              store.currency,
            );
            profileCost = profileCost * sRate;
          }
          shippingCost = profileCost;
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

    const formData = new FormData(e.target as HTMLFormElement);
    const selectedLocation = formData.get("selected_store_location");

    if (
      paymentMethod === "store_reservation" &&
      ((store?.locations && store.locations.length > 0) ||
        (store?.branches && store.branches.length > 0)) &&
      !selectedLocation
    ) {
      setError(
        lang === "tr" ? "Lütfen bir mağaza seçin." : "Please select a store.",
      );
      return;
    }

    // Iyzico zorunluluğu kontrolü
    if (store.payment_settings?.iyzico_enabled && paymentMethod !== "iyzico") {
      setError(
        lang === "tr"
          ? "Lütfen ödeme yöntemi olarak iyzico seçin."
          : "Please select iyzico as payment method.",
      );
      return;
    }

    setCheckoutStatus("loading");
    try {
      // Calculate converted prices for items
      const itemsWithConvertedPrices = await Promise.all(
        basket.map(async (item) => {
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
            price: finalPrice,
            branch_name: item.branch_name,
            branch_id: item.store_id,
          };
        }),
      );

      if (basketShippingTotal > 0) {
        itemsWithConvertedPrices.push({
          productId: null as any,
          name: lang === "tr" ? "Kargo Ücreti" : "Shipping Fee",
          barcode: "SHIPPING",
          quantity: 1,
          price: basketShippingTotal,
          branch_name: "",
          branch_id: 0,
        });
      }

      const res = await api.createPublicSale({
        storeId: store.id,
        items: itemsWithConvertedPrices,
        customerName: `${customerInfo.name} ${customerInfo.surname}`.trim(),
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        customerAddress:
          paymentMethod === "store_reservation"
            ? `Mağazadan Teslim: ${selectedLocation}`
            : customerInfo.address,
        customerCity: customerInfo.city,
        customerCountry: customerInfo.country,
        customerTcId: customerInfo.tc_id,
        total: basketTotal,
        currency: store.currency,
        paymentMethod: paymentMethod,
        createAccount: customerInfo.createAccount,
        customerId: customer?.id,
      });

      if (res.error) throw new Error(res.error);

      if (res.paymentProvider === "iyzico" && res.initializeUrl) {
        const initRes = await fetch(res.initializeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ saleId: res.saleId, paymentMethod: "iyzico" }),
        });
        const initData = await initRes.json();
        if (initData.paymentPageUrl) {
          setIyzicoPaymentUrl(initData.paymentPageUrl + "&iframe=true");
          setCheckoutStatus("idle");
          return;
        } else {
          throw new Error(initData.error || "Ödeme başlatılamadı.");
        }
      }

      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }

      setCheckoutStatus("success");
      setBasket([]);
      setTimeout(() => {
        setIsCheckoutModalOpen(false);
        setCheckoutStatus("idle");
      }, 3000);
    } catch (err: any) {
      setCheckoutStatus("error");
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">
            {t.dashboard.storeLoading}
          </p>
        </div>
      </div>
    );
  }

  if (error && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.dashboard.errorOccurred}
          </h2>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t.dashboard.errorOccurred}
          </h2>
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

  const isPortfolioOverride =
    (store as any)?.store_type === "portfolio" ||
    (store as any)?.store_type === "real_estate" ||
    (store as any)?.store_type === "motor_vehicle" ||
    (store as any)?.store_type === "automotive" ||
    (store as any)?.sector === "real_estate" ||
    (store as any)?.sector === "automotive";
  if (isPortfolioOverride) {
    const isAutoStore = (store as any)?.store_type === 'motor_vehicle' || (store as any)?.store_type === 'automotive' || (store as any)?.page_layout_settings?.sector === 'automotive' || (store as any)?.sector === 'automotive';
    return (
      <ErrorBoundary lang={lang}>
        <div className="relative min-h-screen bg-slate-50 overflow-x-hidden font-sans">
          {isAutoStore ? (
            <ModernAutomotiveLayout
              store={store}
              products={products}
              radarNews={radarNews}
              onViewProduct={(p) => setSelectedProduct(p)}
            />
          ) : (
            <ModernRealEstateLayout
              store={store}
              products={products}
              radarNews={radarNews}
              onViewProduct={(p) => setSelectedProduct(p)}
            />
          )}

          <AnimatePresence>
            {selectedProduct && (
              <ProductDetailModal
                product={selectedProduct}
                store={store}
                t={t}
                slug={slug}
                addToBasket={() => {}}
                primaryColor="#4f46e5"
                showAboutModal={false}
                setShowAboutModal={() => {}}
                onClose={() => {
                  setSelectedProduct(null);
                  if (urlBarcode) {
                    const isCustomDomain =
                      !window.location.pathname.startsWith("/s/");
                    const cleanSlug = store?.slug || slug || urlSlug;
                    if (isCustomDomain) {
                      navigate("/", { replace: true });
                    } else {
                      navigate(`/s/${cleanSlug}`, { replace: true });
                    }
                  }
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary lang={lang}>
      <div className="min-h-screen bg-white pb-24 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
        <SEO
          title={
            selectedBlogPost
              ? `${selectedBlogPost.title} | ${store.name}`
              : store.name
          }
          description={
            selectedBlogPost ? selectedBlogPost.excerpt : store.description
          }
          ogImage={
            selectedBlogPost ? selectedBlogPost.image_url : store.logo_url
          }
          ogType={selectedBlogPost ? "article" : "website"}
          keywords={seoKeywords}
          siteName={store.name}
          schemaData={
            selectedBlogPost
              ? {
                  "@context": "https://schema.org",
                  "@type": "BlogPosting",
                  headline: selectedBlogPost.title,
                  image: selectedBlogPost.image_url,
                  datePublished: selectedBlogPost.date,
                  description: selectedBlogPost.excerpt,
                }
              : storeSchema
          }
        />

        {layoutSettings.show_announcement && (
          <div className="bg-gray-900 overflow-hidden py-1.5">
            <div className="flex whitespace-nowrap animate-marquee">
              <div className="flex gap-8 text-[10px] sm:text-xss font-semibold text-white/80 tracking-wide px-4">
                <span className="flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  {layoutSettings.announcement_text ||
                    (lang === "tr"
                      ? "Anneler Gününüz Kutlu Olsun"
                      : "Happy Mother's Day")}
                </span>
                {/* Repeat to ensure smooth flow */}
                <span className="flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  {layoutSettings.announcement_text ||
                    (lang === "tr"
                      ? "Anneler Gününüz Kutlu Olsun"
                      : "Happy Mother's Day")}
                </span>
              </div>
            </div>
          </div>
        )}
        {/* Header */}
        <StoreHeader
          store={store}
          lang={lang}
          primaryColor={primaryColor}
          getStorePath={getStorePath}
          t={t}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          customer={customer}
          isAccountMenuOpen={isAccountMenuOpen}
          setIsAccountMenuOpen={setIsAccountMenuOpen}
          accountMenuRef={accountMenuRef}
          handleLogout={handleLogout}
          setAuthMode={setAuthMode}
          setShowAuthModal={setShowAuthModal}
          setIsBasketOpen={setIsBasketOpen}
          basketCount={basketCount}
          setShowBlog={setShowBlog}
        />

        {/* Premium Category Showcase */}
        {layoutSettings.show_stories &&
          Array.from(categories.keys()).length > 0 && (
            <section className="bg-white py-16 overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
                  <div className="space-y-2">
                    <h3
                      className={`text-[10px] font-semibold uppercase tracking-[0.4em] mb-2 ${isLuxury ? "text-amber-500" : "text-indigo-600"}`}
                    >
                      {lang === "tr" ? "KOLEKSİYONLAR" : "COLLECTIONS"}
                    </h3>
                    <h2
                      className={`text-4xl md:text-4xl md:text-4xl tracking-tight text-slate-900 ${isLuxury ? "!font-sans !font-bold" : "font-semibold font-display tracking-tighter"}`}
                    >
                      {categoriesLabel}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-xss font-bold text-slate-400 tracking-wide">
                    <div className="w-12 h-[1px] bg-slate-200"></div>
                    {lang === "tr" ? "Seçkin Seçkiler" : "Curated Selections"}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {Array.from(categories.keys())
                    .sort()
                    .map((cat, idx) => {
                      const firstProduct = products.find(
                        (p) => p.category === cat,
                      );
                      const isLarge = idx % 5 === 0;
                      return (
                        <motion.div
                          key={`cat-grid-${cat}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          viewport={{ once: true }}
                          onClick={() => {
                            setSelectedCategory(cat);
                            document
                              .getElementById("products-grid")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`group relative overflow-hidden rounded-xl cursor-pointer bg-slate-50 transition-all duration-700 hover:shadow-lg hover:-translate-y-2 ${isLarge ? "md:col-span-2 md:row-span-1" : ""}`}
                          style={{ height: isLarge ? "260px" : "260px" }}
                        >
                          <div className="absolute inset-0 z-0">
                            {firstProduct?.image_url ? (
                              <img
                                src={firstProduct.image_url}
                                alt={cat}
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                <Tag className="w-12 h-12" />
                              </div>
                            )}
                            <div
                              className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-90`}
                            />
                          </div>

                          <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                            <span className="text-[10px] font-semibold text-white/60 tracking-wide mb-1 group-hover:text-white transition-colors">
                              {
                                products.filter((p) => p.category === cat)
                                  .length
                              }{" "}
                              {productLabel}
                            </span>
                            <h4
                              className={`text-xsl md:text-2xl font-semibold text-white tracking-tight leading-tight group-hover:translate-x-2 transition-transform duration-500`}
                            >
                              {cat}
                            </h4>
                            <div className="mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                              <div className="flex items-center gap-2 text-white text-[10px] font-semibold tracking-wide">
                                {lang === "tr" ? "Keşfet" : "Discover"}
                                <Plus className="w-3 h-3" />
                              </div>
                            </div>
                          </div>

                          {selectedCategory === cat && (
                            <div className="absolute top-6 right-6 z-20 w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-900 shadow-xl border border-white/50">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            </section>
          )}

        {/* Main Content Area */}
        {!isProfileView && !isOrdersView && !isReturnView ? (
          <>
            {/* Hero Section */}
            <section className="relative min-h-[60vh] md:min-h-[85vh] flex items-center overflow-hidden bg-slate-950">
              <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.95 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0 z-0"
              >
                {store?.hero_image_url ? (
                  <img
                    src={store.hero_image_url}
                    alt={store.hero_title || store.name}
                    className="w-full h-full object-cover brightness-[0.80] contrast-[1.05]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2048&auto=format&fit=crop"
                    alt="Store Hero"
                    className="w-full h-full object-cover brightness-[0.80] contrast-[1.05]"
                    referrerPolicy="no-referrer"
                  />
                )}
              </motion.div>

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 via-slate-950/10 to-black/30 z-10" />
              <div className="absolute inset-0 bg-slate-950/10 z-10" />

              <div className="container max-w-7xl mx-auto px-4 md:px-8 relative z-20">
                <div className="max-w-4xl">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-4 mb-8"
                  >
                    <div className="w-12 h-0.5 bg-white/40" />
                    <span className="text-white/80 text-xss font-semibold uppercase tracking-[0.4em]">
                      {store?.name}
                    </span>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className={`text-4xl md:text-4xl md:text-9xl text-white mb-6 leading-[0.85] tracking-tight text-balance ${isLuxury ? "!font-sans !font-bold" : "font-semibold font-display tracking-tighter"}`}
                  >
                    {store?.hero_title || store?.name}
                  </motion.h2>

                  {store?.hero_subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9, duration: 0.8 }}
                      className="text-xsl md:text-3xl text-white/60 font-medium max-w-2xl leading-relaxed mb-12 text-balance"
                    >
                      {store.hero_subtitle}
                    </motion.p>
                  )}

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.1 }}
                    className="flex flex-wrap gap-4"
                  >
                    <button
                      onClick={() => setShowDiscoverModal(true)}
                      className="px-10 py-5 bg-white text-slate-950 rounded-lg font-semibold text-sm tracking-wide hover:bg-opacity-90 transition-all active:scale-95 shadow-lg flex items-center gap-3"
                    >
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      {lang === "tr" ? "Keşfet" : "Discover Now"}
                    </button>
                  </motion.div>
                </div>
              </div>

              {/* Scroll Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-4 text-white/40"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
                  {lang === "tr" ? "Kaydır" : "Scroll"}
                </span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent" />
              </motion.div>
            </section>

            {/* Featured / Campaign Section */}
            {layoutSettings.show_campaigns && (
              <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-32">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
                  <div className="space-y-3">
                    <h3
                      className={`text-[10px] font-semibold uppercase tracking-[0.5em] mb-2 ${isLuxury ? "text-amber-500" : "text-blue-600"}`}
                    >
                      {lang === "tr"
                        ? "HAFTANIN FIRSATLARI"
                        : "DEALS OF THE WEEK"}
                    </h3>
                    <h2
                      className={`text-4xl md:text-4xl md:text-4xl tracking-tight text-slate-900 ${isLuxury ? "!font-sans !font-bold" : "font-semibold font-display tracking-tighter"}`}
                    >
                      {lang === "tr"
                        ? "Kampanyalı Ürünler"
                        : "Special Campaigns"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4 text-xss font-bold text-slate-400 tracking-wide">
                    <span className="w-16 h-[1px] bg-slate-100"></span>
                    <span className="text-slate-900 font-semibold">
                      {products.length}
                    </span>{" "}
                    {lang === "tr" ? "Parça" : "Items"}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {(products.some(
                    (p) =>
                      p.labels?.includes("Kampanya") ||
                      p.labels?.includes("Fırsat"),
                  )
                    ? products.filter(
                        (p) =>
                          p.labels?.includes("Kampanya") ||
                          p.labels?.includes("Fırsat"),
                      )
                    : products
                  )
                    .slice(0, 4)
                    .map((product, idx) => (
                      <motion.div
                        key={`featured-${product.id}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, duration: 0.8 }}
                        viewport={{ once: true }}
                        className="group relative cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="aspect-[1/1] rounded-2xl overflow-hidden bg-white mb-8 relative shadow-sm group-hover:shadow-lg group-hover:-translate-y-2 transition-all duration-700 font-sans border border-slate-100">
                          {/* Discount Badge */}
                          {product.old_price && (
                            <div className="absolute top-8 right-8 z-10 w-14 h-14 bg-white rounded-lg flex items-center justify-center text-red-600 text-xss font-semibold shadow-xl">
                              -
                              {Math.round(
                                (1 - product.price / product.old_price) * 100,
                              )}
                              %
                            </div>
                          )}

                          <img
                            src={
                              product.image_url ||
                              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop"
                            }
                            alt={product.name}
                            className="w-full h-full object-contain p-6 transition-transform duration-1000 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-700" />

                          <div className="absolute bottom-8 left-8 right-8 flex justify-center translate-y-20 group-hover:translate-y-0 transition-transform duration-700">
                            <button className="w-full py-4 bg-white text-slate-950 rounded-2xl font-semibold text-[10px] tracking-wide shadow-lg">
                              {lang === "tr" ? "İncele" : "View Details"}
                            </button>
                          </div>
                        </div>

                        <div className="px-4 text-center">
                          <h4
                            className={`text-xsl text-slate-900 mb-2 truncate ${isLuxury ? "!font-sans !font-medium" : "font-semibold"}`}
                          >
                            {product.name}
                          </h4>
                          {(() => {
                            let labels: string[] = [];

                            if (Array.isArray(product.labels)) {
                              labels = product.labels;
                            } else if (typeof product.labels === "string") {
                              // Remove all non-alphanumeric characters except spaces and Turkish chars,
                              // treat as comma separated to extract clean labels.
                              labels = (product.labels as string)
                                .replace(/[^a-zA-Z0-9çÇğĞışİÖöÜü\s,]/g, "")
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                            }

                            if (labels.length === 0) return null;

                            return (
                              <div className="flex flex-wrap gap-1 justify-center mb-2">
                                {labels.map((label, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] uppercase font-black rounded-md tracking-wider"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            );
                          })()}
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-xsl font-semibold text-slate-900 font-sans tracking-tight">
                              {formatPrice(product.price, store?.currency || product.currency || '')}
                            </span>
                            {product.old_price && (
                              <span className="text-sm font-medium text-slate-400 line-through decoration-red-500/50 font-sans tracking-tight">
                                {formatPrice(product.old_price || 0, store?.currency || product.currency || '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </section>
            )}

            {/* Removed category boxes section */}

            <main
              className="max-w-7xl mx-auto px-4 md:px-8 py-8"
              id="products-grid"
            >
              {/* Search Bar & Filters */}
              <div className="mb-12">
                {(store?.store_type === "real_estate" || store?.store_type === "motor_vehicle") && (
                  <div className="bg-slate-50/50 rounded-3xl p-6 md:p-8 border border-slate-100 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-indigo-600" />
                      {lang === "tr"
                        ? "Detaylı Arama / Filtreleme"
                        : "Advanced Search & Filters"}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Filter 1: Listing Type */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === "tr" ? "İlan Türü" : "Listing Type"}
                        </label>
                        <div className="relative">
                          <select
                            value={portfolioType}
                            onChange={(e) =>
                              setPortfolioType(e.target.value as any)
                            }
                            className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none appearance-none shadow-sm cursor-pointer"
                          >
                            <option value="all">
                              {lang === "tr" ? "Tüm İlanlar" : "All Listings"}
                            </option>
                            <option value="real_estate">
                              {lang === "tr" ? "Gayrimenkul" : "Real Estate"}
                            </option>
                            <option value="car">
                              {lang === "tr" ? "Otomobil & Hafif Ticari" : "Car & Light Commercial"}
                            </option>
                            <option value="motorcycle">
                              {lang === "tr" ? "Motosiklet" : "Motorcycle"}
                            </option>
                            <option value="marine">
                              {lang === "tr" ? "Deniz Taşıtları" : "Marine"}
                            </option>
                            <option value="construction">
                              {lang === "tr" ? "İş Makineleri" : "Construction Equipment"}
                            </option>
                            <option value="agricultural">
                              {lang === "tr" ? "Tarım Makineleri" : "Agricultural Equipment"}
                            </option>
                            <option value="other">
                              {lang === "tr" ? "Diğer" : "Other"}
                            </option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Filter 2: Min Price */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === "tr" ? "Min Fiyat" : "Min Price"} (
                          {store?.currency || "TRY"})
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={portfolioMinPrice}
                          onChange={(e) => setPortfolioMinPrice(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none shadow-sm"
                        />
                      </div>

                      {/* Filter 3: Max Price */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === "tr" ? "Max Fiyat" : "Max Price"} (
                          {store?.currency || "TRY"})
                        </label>
                        <input
                          type="number"
                          placeholder="∞"
                          value={portfolioMaxPrice}
                          onChange={(e) => setPortfolioMaxPrice(e.target.value)}
                          className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none shadow-sm"
                        />
                      </div>

                      {/* Filter 4: Room Count (Conditional) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === "tr"
                            ? "Oda Sayısı (Emlak)"
                            : "Rooms (Estate)"}
                        </label>
                        <div className="relative">
                          <select
                            disabled={portfolioType !== "all" && portfolioType !== "real_estate"}
                            value={portfolioRooms}
                            onChange={(e) => setPortfolioRooms(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none appearance-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="all">
                              {lang === "tr" ? "Tümü" : "All"}
                            </option>
                            <option value="1">1 Oda</option>
                            <option value="2">2 Oda</option>
                            <option value="3">3 Oda</option>
                            <option value="4+">4+ Oda</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Filter 5: Min Area */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === "tr"
                            ? "Min Alan (Emlak)"
                            : "Min Area (Estate)"}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            disabled={portfolioType !== "all" && portfolioType !== "real_estate"}
                            placeholder="m²"
                            value={portfolioMinM2}
                            onChange={(e) => setPortfolioMinM2(e.target.value)}
                            className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clear filters trigger */}
                    {(portfolioType !== "all" ||
                      portfolioMinPrice ||
                      portfolioMaxPrice ||
                      portfolioRooms !== "all" ||
                      portfolioMinM2) && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => {
                            setPortfolioType("all");
                            setPortfolioMinPrice("");
                            setPortfolioMaxPrice("");
                            setPortfolioRooms("all");
                            setPortfolioMinM2("");
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          {lang === "tr"
                            ? "Filtreleri Temizle"
                            : "Clear Filters"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                  <div>
                    <h2
                      className={`text-4xl md:text-4xl md:text-4xl text-slate-900 tracking-tight mb-4 ${isLuxury ? "!font-sans !font-bold" : "font-semibold font-display tracking-tighter"}`}
                    >
                      {selectedCategory || t.dashboard.allProducts}
                    </h2>
                    <p className="text-slate-400 font-bold tracking-wide text-[10px]">
                      <span className="text-slate-900">
                        {sortedAndFilteredProducts.length}
                      </span>{" "}
                      {t.dashboard.productsFound || "ürün listeleniyor"}
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
                        <option value="default">
                          {t.dashboard.newest ||
                            (lang === "tr" ? "Varsayılan" : "Default")}
                        </option>
                        <option value="priceAsc">
                          {t.dashboard.priceLow ||
                            (lang === "tr"
                              ? "En Düşük Fiyat"
                              : "Price: Low to High")}
                        </option>
                        <option value="priceDesc">
                          {t.dashboard.priceHigh ||
                            (lang === "tr"
                              ? "En Yüksek Fiyat"
                              : "Price: High to Low")}
                        </option>
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
                    document
                      .getElementById("products-grid")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`flex-shrink-0 px-6 py-2.5 rounded-lg text-xss font-semibold transition-all border whitespace-nowrap ${
                    !selectedCategory
                      ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                      : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  {t.dashboard.all}
                </button>

                {Array.from(categories.keys())
                  .sort()
                  .map((cat) => (
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
                      className={`flex-shrink-0 px-6 py-2.5 rounded-lg text-xss font-semibold transition-all border whitespace-nowrap ${
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
                  className="flex-shrink-0 w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all ml-2 sticky right-0 shadow-lg"
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
                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
                        <Filter className="w-4 h-4" />
                        {categoriesLabel}
                      </h3>

                      {/* Removed sidebar category search bar */}

                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setSelectedCategory(null);
                            setSelectedSubCategory(null);
                            document
                              .getElementById("products-grid")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className={`w-full text-left px-5 py-3 rounded-xl text-xss font-bold transition-all flex items-center justify-between group ${
                            !selectedCategory
                              ? "bg-gray-900 text-white shadow-xl"
                              : "text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <div
                              className={`w-1 h-1 rounded-lg ${!selectedCategory ? "bg-primary" : "bg-gray-300"}`}
                            ></div>
                            {t.dashboard.all}
                          </span>
                          <span className="text-[9px] opacity-50">
                            {products.length}
                          </span>
                        </button>

                        <div className="space-y-1">
                          {Array.from(categories.keys())
                            .filter((cat) =>
                              cat
                                .toLowerCase()
                                .includes(categorySearch.toLowerCase()),
                            )
                            .sort()
                            .slice(0, showAllCategories ? undefined : 5)
                            .map((cat) => (
                              <div key={cat} className="space-y-1">
                                <button
                                  onClick={() => {
                                    if (selectedCategory === cat) {
                                      toggleCategory(cat);
                                    } else {
                                      setSelectedCategory(cat);
                                      setSelectedSubCategory(null);
                                      if (!expandedCategories.has(cat))
                                        toggleCategory(cat);
                                      document
                                        .getElementById("products-grid")
                                        ?.scrollIntoView({
                                          behavior: "smooth",
                                        });
                                    }
                                  }}
                                  className={`w-full text-left px-5 py-3 rounded-xl text-xss font-bold transition-all flex items-center justify-between group ${
                                    selectedCategory === cat
                                      ? "bg-gray-100 text-gray-900"
                                      : "text-gray-500 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-1 h-1 rounded-lg transition-colors ${selectedCategory === cat ? "bg-primary" : "bg-gray-300 group-hover:bg-gray-400"}`}
                                    ></div>
                                    <span className="truncate">{cat}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] opacity-50">
                                      {
                                        products.filter(
                                          (p) => p.category === cat,
                                        ).length
                                      }
                                    </span>
                                    {categories.get(cat)!.size > 0 && (
                                      <ChevronRight
                                        className={`w-3 h-3 transition-transform duration-300 ${expandedCategories.has(cat) ? "rotate-90" : ""}`}
                                      />
                                    )}
                                  </div>
                                </button>
                                <AnimatePresence>
                                  {expandedCategories.has(cat) &&
                                    categories.get(cat)!.size > 0 && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden pl-8 space-y-1"
                                      >
                                        {Array.from(categories.get(cat)!)
                                          .sort()
                                          .map((sub) => (
                                            <button
                                              key={sub}
                                              onClick={() => {
                                                setSelectedSubCategory(sub);
                                                document
                                                  .getElementById(
                                                    "products-grid",
                                                  )
                                                  ?.scrollIntoView({
                                                    behavior: "smooth",
                                                  });
                                              }}
                                              className={`w-full text-left px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${
                                                selectedSubCategory === sub
                                                  ? "text-primary bg-primary/5"
                                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                              }`}
                                            >
                                              <div
                                                className={`w-1 h-1 rounded-lg ${selectedSubCategory === sub ? "bg-primary" : "bg-transparent"}`}
                                              ></div>
                                              <span className="truncate">
                                                {sub}
                                              </span>
                                            </button>
                                          ))}
                                      </motion.div>
                                    )}
                                </AnimatePresence>
                              </div>
                            ))}

                          {Array.from(categories.keys()).length > 5 && (
                            <button
                              onClick={() =>
                                setShowAllCategories(!showAllCategories)
                              }
                              className="w-full text-center py-1.5 text-[10px] font-semibold text-primary tracking-wide hover:bg-primary/5 rounded-lg transition-all"
                            >
                              {showAllCategories
                                ? lang === "tr"
                                  ? "Daha Az"
                                  : "Show Less"
                                : lang === "tr"
                                  ? "Tümünü Gör"
                                  : "Show All"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Brands */}
                    {brands.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-3">
                          <Tag className="w-4 h-4" />
                          {brandsLabel}
                        </h3>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                          <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder={
                                  lang === "tr"
                                    ? `${brandLabel} Ara...`
                                    : `Search ${brandLabel}...`
                                }
                                value={brandSearch}
                                onChange={(e) => setBrandSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                              />
                            </div>
                          </div>

                          <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-wrap gap-2">
                              {brands
                                .filter((brand) =>
                                  brand
                                    .toLowerCase()
                                    .includes(brandSearch.toLowerCase()),
                                )
                                .map((brand) => (
                                  <button
                                    key={brand}
                                    onClick={() => {
                                      setSelectedBrand(
                                        brand === selectedBrand ? null : brand,
                                      );
                                      setSearchQuery("");
                                      document
                                        .getElementById("products-grid")
                                        ?.scrollIntoView({
                                          behavior: "smooth",
                                        });
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                                      selectedBrand === brand
                                        ? "bg-gray-900 text-white border-gray-900 shadow-md"
                                        : "bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                                    }`}
                                  >
                                    {brand}
                                  </button>
                                ))}
                              {brands.filter((brand) =>
                                brand
                                  .toLowerCase()
                                  .includes(brandSearch.toLowerCase()),
                              ).length === 0 && (
                                <div className="w-full text-center py-4 text-gray-400 text-sm">
                                  {lang === "tr"
                                    ? `${brandLabel} bulunamadı.`
                                    : `No ${brandLabel.toLowerCase()}s found.`}
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
                          case "hero":
                            return (
                              <section
                                key={section.id}
                                className="relative h-[650px] flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl border border-white/5"
                              >
                                <img
                                  src={store.hero_image_url}
                                  className="absolute inset-0 w-full h-full object-cover brightness-[0.85] contrast-[1.05]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                                <div className="absolute inset-0 bg-black/25" />
                                <div className="relative z-10 text-center text-white px-6 py-12 max-w-3xl bg-slate-950/35 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl mx-4">
                                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-3 block">
                                    {store.name}
                                  </span>
                                  <h1 className="text-4xl md:text-5xl font-semibold font-display tracking-tight text-white mb-4">
                                    {store.hero_title}
                                  </h1>
                                  <p className="text-slate-300 font-medium leading-relaxed">
                                    {store.hero_subtitle}
                                  </p>
                                </div>
                              </section>
                            );
                          case "featured":
                            return (
                              <section key={section.id}>
                                <h2 className="text-3xl font-semibold text-gray-900 mb-10">
                                  {t.dashboard.featuredProducts}
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                  {featuredProducts.map((p) => (
                                    <ProductCard
                                      key={p.id}
                                      product={p}
                                      store={store}
                                      t={t}
                                      addToBasket={addToBasket}
                                      onView={setSelectedProduct}
                                      primaryColor={primaryColor}
                                      isLuxury={isLuxury}
                                      sector={sector}
                                    />
                                  ))}
                                </div>
                              </section>
                            );
                          case "blog":
                            return (
                              <section
                                key={section.id}
                                id="blog"
                                className="py-12"
                              >
                                <div className="flex items-center justify-between mb-10">
                                  <h2 className="text-4xl font-semibold text-gray-900 tracking-tight">
                                    {isTr ? "Blog Yazıları" : "Blog Posts"}
                                  </h2>
                                  <div className="hidden md:flex items-center space-x-2 text-sm font-semibold text-indigo-600 tracking-wide">
                                    <Sparkles className="w-4 h-4" />
                                    <span>
                                      {isTr ? "YENİ İÇERİKLER" : "NEW CONTENT"}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                  {store.blog_posts?.map((post) => (
                                    <motion.div
                                      key={post.id}
                                      whileHover={{ y: -8 }}
                                      onClick={() => setSelectedBlogPost(post)}
                                      className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-500"
                                    >
                                      <div className="relative h-64 overflow-hidden">
                                        <img
                                          src={
                                            post.image_url ||
                                            "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60"
                                          }
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                          <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-lg text-xss font-semibold text-indigo-600 tracking-wide">
                                            {isTr
                                              ? "Okumaya Devam Et"
                                              : "Read More"}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="p-8">
                                        <div className="flex items-center gap-3 mb-4">
                                          <span className="text-[10px] font-semibold text-indigo-600 tracking-wide bg-indigo-50 px-2 py-1 rounded-md">
                                            {post.date}
                                          </span>
                                          <span className="w-1 h-1 rounded-lg bg-gray-300" />
                                          <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                                            {Math.ceil(
                                              (post.content?.length || 0) /
                                                1000,
                                            )}{" "}
                                            {isTr ? "DAKİKA" : "MIN READ"}
                                          </span>
                                        </div>
                                        <h4 className="text-xsl font-semibold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                          {post.title}
                                        </h4>
                                        <p className="text-gray-500 text-sm leading-relaxed font-medium line-clamp-3">
                                          {post.excerpt}
                                        </p>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </section>
                            );
                          case "news":
                            if (!radarNews || radarNews.length === 0) return null;
                            return (
                              <section key={section.id} className="py-6 border-t border-slate-150 bg-slate-50/50 px-4">
                                <RadarShowcaseSlider radarNews={radarNews} lang={lang} theme="light" />
                              </section>
                            );
                            /*
                            return (
                              <section key={section.id} className="py-4 border-t border-slate-100 bg-slate-50/50 px-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-[10px] uppercase tracking-widest whitespace-nowrap">
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {lang === "tr" ? "RADAR" : "RADAR"}
                                  </div>
                                  <div className="flex-1 relative overflow-hidden h-8 bg-white border border-slate-100 rounded-full my-4 flex items-center">
                                    <motion.div 
                                      className="flex items-center h-full cursor-grab"
                                      animate={{ x: ["0%", "-50%"] }}
                                      transition={{
                                        repeat: Infinity,
                                        duration: 60,
                                        ease: "linear"
                                      }}
                                      whileHover={{ animationPlayState: "paused" }}
                                      style={{ width: "200%", display: "flex", flexWrap: "nowrap" }}
                                    >
                                      {[...radarNews, ...radarNews].map((newsItem, index) => (
                                        <div 
                                          key={`${newsItem.id}-${index}`} 
                                          className="flex-none px-6 text-[11px] font-bold text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer"
                                          style={{ width: "33.333%" }}
                                        >
                                          {newsItem.title}
                                        </div>
                                      ))}
                                    </motion.div>
                                  </div>
                                </div>
                              </section>
                            );
                            */
                          case "about":
                            return (
                              <section
                                key={section.id}
                                id="about"
                                className="bg-gray-50 p-8 rounded-2xl"
                              >
                                <h2 className="text-3xl font-semibold text-gray-900 mb-6">
                                  {lang === "tr" ? "Hakkımızda" : "About Us"}
                                </h2>
                                <p className="text-gray-600 leading-relaxed">
                                  {store.about_text}
                                </p>
                              </section>
                            );
                          case "contact":
                            return (
                              <section
                                key={section.id}
                                id="contact"
                                className="bg-gray-900 text-white p-8 rounded-2xl"
                              >
                                <h2 className="text-3xl font-semibold mb-6">
                                  {lang === "tr" ? "İletişim" : "Contact"}
                                </h2>
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
                  ) : // Fallback to original layout if no page_layout
                  sortedAndFilteredProducts.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-6">
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
                              isLuxury={isLuxury}
                              sector={sector}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-2">
                          {/* ... pagination buttons logic ... */}
                        </div>
                      )}

                      {/* Blog Posts in Fallback Layout */}
                      {store?.blog_posts && store.blog_posts.length > 0 && (
                        <section className="mt-32">
                          <div className="flex items-center justify-between mb-10">
                            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                              {lang === "tr" ? "Blog Yazıları" : "Blog Posts"}
                            </h2>
                            <button
                              onClick={() => setShowBlog(true)}
                              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                            >
                              {lang === "tr" ? "Tümünü Gör" : "See All"}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {store.blog_posts.slice(0, 3).map((post) => (
                              <motion.div
                                key={post.id}
                                whileHover={{ y: -8 }}
                                onClick={() => {
                                  setSelectedBlogPost(post);
                                  setShowBlog(true);
                                }}
                                className="group cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500"
                              >
                                <div className="relative h-48 overflow-hidden">
                                  <img
                                    src={
                                      post.image_url ||
                                      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60"
                                    }
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                  />
                                </div>
                                <div className="p-6">
                                  <span className="text-[10px] font-semibold text-indigo-600 tracking-wide mb-2 block">
                                    {post.date}
                                  </span>
                                  <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                                    {post.title}
                                  </h4>
                                  <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed">
                                    {post.excerpt || post.content}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </section>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center shadow-xl mb-8">
                        <Package className="w-12 h-12 text-gray-200" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {store?.store_type === "real_estate" || store?.store_type === "motor_vehicle"
                          ? lang === "tr"
                            ? "İlan bulunamadı"
                            : "No listings found"
                          : t.dashboard.noProductsFound}
                      </h3>
                      <p className="text-gray-400 font-medium max-w-xs">
                        {store?.store_type === "real_estate" || store?.store_type === "motor_vehicle"
                          ? lang === "tr"
                            ? "Arama kriterlerinize uygun ilan veya portföy bulunmuyor."
                            : "No listings or portfolios match your search criteria."
                          : t.dashboard.noProductsDesc}
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* New Arrivals Section */}
              {!selectedCategory && !searchQuery && newArrivals.length > 0 && (
                <section className="mt-32">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                        {t.dashboard.newArrivals}
                      </h2>
                      <div
                        className="h-1.5 w-20 mt-2 rounded-lg"
                        style={{ backgroundColor: primaryColor }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {newArrivals.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        store={store}
                        t={t}
                        addToBasket={addToBasket}
                        onView={setSelectedProduct}
                        primaryColor={primaryColor}
                        isLuxury={isLuxury}
                        sector={sector}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Best Sellers Section */}
              {!selectedCategory && !searchQuery && bestSellers.length > 0 && (
                <section className="mt-32">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">
                        {t.dashboard.bestSellers}
                      </h2>
                      <div
                        className="h-1.5 w-20 mt-2 rounded-lg"
                        style={{ backgroundColor: primaryColor }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {bestSellers.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        store={store}
                        t={t}
                        addToBasket={addToBasket}
                        onView={setSelectedProduct}
                        primaryColor={primaryColor}
                        isLuxury={isLuxury}
                        sector={sector}
                      />
                    ))}
                  </div>
                </section>
              )}
            </main>
          </>
        ) : (
          <main className="max-w-7xl mx-auto px-4 md:px-8 py-1.54">
            {isProfileView && (
              <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-50">
                  <div className="grid grid-cols-1 lg:grid-cols-3">
                    {/* Profile Sidebar */}
                    <div className="bg-gray-50 p-6 md:p-8 border-r border-gray-100">
                      <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-24 h-24 bg-white rounded-xl shadow-xl flex items-center justify-center mb-6 border-4 border-white">
                          <User className="w-10 h-10 text-gray-900" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tighter mb-1">
                          {customerProfile?.name} {customerProfile?.surname}
                        </h2>
                        <p className="text-gray-400 text-xss font-bold tracking-wide">
                          {customerProfile?.email}
                        </p>
                      </div>

                      <nav className="space-y-2">
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            navigate(`/s/${slug}/profile`);
                          }}
                          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${isProfileView ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-white"}`}
                        >
                          <User className="w-5 h-5" />
                          {lang === "tr" ? "Profil Bilgilerim" : "My Profile"}
                        </button>
                        <button
                          onClick={() => navigate(`/s/${slug}/orders`)}
                          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${isOrdersView ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-white"}`}
                        >
                          <ShoppingBag className="w-5 h-5" />
                          {lang === "tr" ? "Siparişlerim" : "My Orders"}
                        </button>
                        <button
                          onClick={() => navigate(`/s/${slug}/return`)}
                          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${isReturnView ? "bg-gray-900 text-white shadow-xl" : "text-gray-500 hover:bg-white"}`}
                        >
                          <RotateCcw className="w-5 h-5" />
                          {lang === "tr"
                            ? "İade Taleplerim"
                            : "Return Requests"}
                        </button>
                        <div className="pt-8">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold text-sm text-red-500 hover:bg-red-50 transition-all"
                          >
                            <LogOut className="w-5 h-5" />
                            {lang === "tr" ? "Çıkış Yap" : "Logout"}
                          </button>
                        </div>
                      </nav>
                    </div>

                    {/* Profile Content */}
                    <div className="lg:col-span-2 p-6 md:p-16">
                      <div className="flex items-center justify-between mb-12">
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tighter">
                          {isEditingProfile
                            ? lang === "tr"
                              ? "Profili Düzenle"
                              : "Edit Profile"
                            : lang === "tr"
                              ? "Hesap Detayları"
                              : "Account Details"}
                        </h3>
                        {!isEditingProfile && (
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold text-xss transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                            {lang === "tr" ? "Düzenle" : "Edit"}
                          </button>
                        )}
                      </div>

                      {customerProfile ? (
                        isEditingProfile ? (
                          <form
                            onSubmit={handleProfileUpdate}
                            className="space-y-8"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                                  {lang === "tr" ? "ADINIZ" : "NAME"}
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={profileEditForm.name || ""}
                                  onChange={(e) =>
                                    setProfileEditForm((prev) => ({
                                      ...prev,
                                      name: e.target.value,
                                    }))
                                  }
                                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                                  {lang === "tr" ? "SOYADINIZ" : "SURNAME"}
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={profileEditForm.surname || ""}
                                  onChange={(e) =>
                                    setProfileEditForm((prev) => ({
                                      ...prev,
                                      surname: e.target.value,
                                    }))
                                  }
                                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                                  E-POSTA
                                </label>
                                <input
                                  required
                                  type="email"
                                  value={profileEditForm.email || ""}
                                  onChange={(e) =>
                                    setProfileEditForm((prev) => ({
                                      ...prev,
                                      email: e.target.value,
                                    }))
                                  }
                                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                                  {t.dashboard.phone}
                                </label>
                                <input
                                  required
                                  type="tel"
                                  value={profileEditForm.phone || ""}
                                  onChange={(e) =>
                                    setProfileEditForm((prev) => ({
                                      ...prev,
                                      phone: e.target.value,
                                    }))
                                  }
                                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                                  {lang === "tr" ? "ÜLKE" : "COUNTRY"}
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={profileEditForm.country || ""}
                                  onChange={(e) =>
                                    setProfileEditForm((prev) => ({
                                      ...prev,
                                      country: e.target.value,
                                    }))
                                  }
                                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                                  {lang === "tr" ? "İL" : "CITY"}
                                </label>
                                <input
                                  required
                                  type="text"
                                  value={profileEditForm.city || ""}
                                  onChange={(e) =>
                                    setProfileEditForm((prev) => ({
                                      ...prev,
                                      city: e.target.value,
                                    }))
                                  }
                                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                                  {lang === "tr"
                                    ? "T.C. KİMLİK NUMARASI"
                                    : "TC ID"}
                                </label>
                                <input
                                  type="text"
                                  value={profileEditForm.tc_id || ""}
                                  onChange={(e) =>
                                    setProfileEditForm((prev) => ({
                                      ...prev,
                                      tc_id: e.target.value,
                                    }))
                                  }
                                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-gray-100 rounded-2xl transition-all outline-none font-bold text-gray-900"
                                />
                              </div>
                              <div className="space-y-2 flex flex-col justify-center">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1 mb-2">
                                  {lang === "tr"
                                    ? "HESAP TÜRÜ"
                                    : "ACCOUNT TYPE"}
                                </label>
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="edit_is_corporate"
                                      checked={!profileEditForm.is_corporate}
                                      onChange={() =>
                                        setProfileEditForm((prev) => ({
                                          ...prev,
                                          is_corporate: false,
                                        }))
                                      }
                                      className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold text-gray-700">
                                      {lang === "tr"
                                        ? "Bireysel"
                                        : "Individual"}
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="edit_is_corporate"
                                      checked={profileEditForm.is_corporate}
                                      onChange={() =>
                                        setProfileEditForm((prev) => ({
                                          ...prev,
                                          is_corporate: true,
                                        }))
                                      }
                                      className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold text-gray-700">
                                      {lang === "tr" ? "Kurumsal" : "Corporate"}
                                    </span>
                                  </label>
                                </div>
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide ml-1">
                                  {t.dashboard.address}
                                </label>
                                <textarea
                                  required
                                  value={profileEditForm.address || ""}
                                  onChange={(e) =>
                                    setProfileEditForm((prev) => ({
                                      ...prev,
                                      address: e.target.value,
                                    }))
                                  }
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
                                className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-semibold transition-all"
                              >
                                {lang === "tr" ? "İptal" : "Cancel"}
                              </button>
                              <button
                                type="submit"
                                className="flex-1 py-5 text-white rounded-2xl font-semibold transition-all shadow-xl active:scale-95"
                                style={{
                                  backgroundColor: primaryColor,
                                  boxShadow: `0 10px 25px -5px ${primaryColor}40`,
                                }}
                              >
                                {lang === "tr" ? "Kaydet" : "Save"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-8">
                              <div>
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide mb-2 block">
                                  Kişisel Bilgiler
                                </label>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                      <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xss text-gray-400 font-bold tracking-wide">
                                        {lang === "tr"
                                          ? "Ad Soyad"
                                          : "Full Name"}
                                      </p>
                                      <p className="text-base font-semibold text-gray-900">
                                        {customerProfile.name}{" "}
                                        {customerProfile.surname}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                      <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xss text-gray-400 font-bold tracking-wide">
                                        E-posta
                                      </p>
                                      <p className="text-base font-semibold text-gray-900">
                                        {customerProfile.email}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                      <CreditCard className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xss text-gray-400 font-bold tracking-wide">
                                        {lang === "tr"
                                          ? "T.C. Kimlik No"
                                          : "TC ID"}
                                      </p>
                                      <p className="text-base font-semibold text-gray-900">
                                        {customerProfile.tc_id || "-"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                      <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xss text-gray-400 font-bold tracking-wide">
                                        {lang === "tr"
                                          ? "Hesap Türü"
                                          : "Account Type"}
                                      </p>
                                      <p className="text-base font-semibold text-gray-900">
                                        {customerProfile.is_corporate
                                          ? lang === "tr"
                                            ? "Kurumsal"
                                            : "Corporate"
                                          : lang === "tr"
                                            ? "Bireysel"
                                            : "Individual"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-8">
                              <div>
                                <label className="text-[10px] font-semibold text-gray-400 tracking-wide mb-2 block">
                                  Adres Bilgileri
                                </label>
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                      <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xss text-gray-400 font-bold tracking-wide">
                                        {lang === "tr" ? "Konum" : "Location"}
                                      </p>
                                      <p className="text-base font-semibold text-gray-900">
                                        {customerProfile.city},{" "}
                                        {customerProfile.country}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 mt-1">
                                      <Home className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-xss text-gray-400 font-bold tracking-wide">
                                        {lang === "tr"
                                          ? "Tam Adres"
                                          : "Full Address"}
                                      </p>
                                      <p className="text-base font-semibold text-gray-900 leading-tight">
                                        {customerProfile.address}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-center py-16">
                          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-gray-500 font-bold">
                            {lang === "tr" ? "Yükleniyor..." : "Loading..."}
                          </p>
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
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tighter">
                    {lang === "tr" ? "Siparişlerim" : "My Orders"}
                  </h2>
                  <div className="px-4 py-1.5 bg-gray-100 rounded-lg text-[10px] font-semibold text-gray-500 tracking-wide">
                    {orders.length} {lang === "tr" ? "SİPARİŞ" : "ORDERS"}
                  </div>
                </div>

                {loadingOrders ? (
                  <div className="bg-white rounded-lg p-20 text-center border border-gray-100">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500 font-bold">
                      {lang === "tr"
                        ? "Siparişler yükleniyor..."
                        : "Loading orders..."}
                    </p>
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
                                <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
                                  #{order.id}
                                </span>
                                <span className="w-1 h-1 rounded-lg bg-gray-300"></span>
                                <span className="text-[10px] font-bold text-gray-500">
                                  {new Date(
                                    order.created_at,
                                  ).toLocaleDateString(
                                    lang === "tr" ? "tr-TR" : "en-US",
                                  )}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">
                                {order.items_count || order.items?.length || 1}{" "}
                                {lang === "tr" ? "Ürün" : "Items"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center flex-wrap gap-4 md:gap-8">
                            <div className="hidden sm:block">
                              <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1">
                                {lang === "tr" ? "ÖDEME" : "PAYMENT"}
                              </p>
                              <p className="text-xss font-bold text-gray-600 flex items-center gap-1.5">
                                <CreditCard className="w-3 h-3" />
                                {order.payment_method === "iyzico"
                                  ? "iyzico"
                                  : order.payment_method === "bank_transfer"
                                    ? lang === "tr"
                                      ? "Havale"
                                      : "Transfer"
                                    : order.payment_method ===
                                        "cash_on_delivery"
                                      ? lang === "tr"
                                        ? "Kapıda"
                                        : "COD"
                                      : order.payment_method}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1">
                                {lang === "tr" ? "TUTAR" : "TOTAL"}
                              </p>
                              <p className="text-sm font-semibold text-primary">
                                {order.total_amount?.toLocaleString(
                                  lang === "tr" ? "tr-TR" : "en-US",
                                  { minimumFractionDigits: 2 },
                                )}{" "}
                                {order.currency}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 tracking-wide mb-1 text-right">
                                {lang === "tr" ? "DURUM" : "STATUS"}
                              </p>
                              <span
                                className={`inline-flex px-3 py-1 rounded-lg text-[9px] font-semibold tracking-wide border transition-colors ${
                                  order.status === "completed" ||
                                  order.status === "delivered"
                                    ? "bg-green-50 text-green-600 border-green-100"
                                    : order.status === "shipped" ||
                                        order.status === "processing"
                                      ? "bg-blue-50 text-blue-600 border-blue-100"
                                      : order.status === "cancelled" ||
                                          order.status === "returned"
                                        ? "bg-red-50 text-red-600 border-red-100"
                                        : "bg-orange-50 text-orange-600 border-orange-100"
                                }`}
                              >
                                {order.status === "pending"
                                  ? lang === "tr"
                                    ? "Bekliyor"
                                    : "Pending"
                                  : order.status === "processing"
                                    ? lang === "tr"
                                      ? "Hazırlanıyor"
                                      : "Preparing"
                                    : order.status === "shipped"
                                      ? lang === "tr"
                                        ? "Kargoda"
                                        : "Shipped"
                                      : order.status === "delivered"
                                        ? lang === "tr"
                                          ? "Teslim Edildi"
                                          : "Delivered"
                                        : order.status === "completed"
                                          ? lang === "tr"
                                            ? "Tamamlandı"
                                            : "Completed"
                                          : order.status === "cancelled"
                                            ? lang === "tr"
                                              ? "İptal Edildi"
                                              : "Cancelled"
                                            : order.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {order.notes && (
                          <div className="px-4 py-2 bg-blue-50/30 border-t border-gray-100 italic text-xss text-gray-500">
                            {lang === "tr" ? "Not: " : "Note: "}
                            {order.notes}
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
                                <p className="text-[9px] font-semibold text-gray-400 tracking-wide">
                                  {lang === "tr"
                                    ? "KARGO BİLGİSİ"
                                    : "SHIPPING INFO"}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xss font-semibold text-gray-700">
                                    {order.shipping_carrier ||
                                      (lang === "tr"
                                        ? "Standart Kargo"
                                        : "Standard Shipping")}
                                  </span>
                                  {order.tracking_number && (
                                    <>
                                      <span className="w-1 h-1 rounded-lg bg-gray-300"></span>
                                      <span className="text-xss font-mono font-bold text-primary select-all">
                                        {order.tracking_number}
                                      </span>
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
                                  const carrier =
                                    order.shipping_carrier?.toLowerCase();
                                  let url = "";
                                  if (carrier?.includes("aras"))
                                    url = `https://www.araskargo.com.tr/takipp-detay?kargo_no=${order.tracking_number}`;
                                  else if (carrier?.includes("yurtiçi"))
                                    url = `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${order.tracking_number}`;
                                  else if (carrier?.includes("mng"))
                                    url = `https://www.mngkargo.com.tr/gonderitakip/${order.tracking_number}`;
                                  else if (carrier?.includes("ptt"))
                                    url = `https://gonderitakip.ptt.gov.tr/Track/Verify?id=${order.tracking_number}`;
                                  else if (carrier?.includes("ups"))
                                    url = `https://www.ups.com/track?tracknum=${order.tracking_number}`;

                                  if (url) window.open(url, "_blank");
                                }}
                                className="px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-semibold text-gray-600 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {lang === "tr"
                                  ? "KARGO TAKİP"
                                  : "TRACK SHIPPING"}
                              </a>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-20 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-bold">
                      {lang === "tr"
                        ? "Henüz bir siparişiniz bulunmuyor."
                        : "You don't have any orders yet."}
                    </p>
                  </div>
                )}
              </div>
            )}
            {isReturnView && (
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-8 border border-gray-100">
                <h2 className="text-3xl font-semibold text-gray-900 mb-8">
                  {lang === "tr" ? "İade Taleplerim" : "My Return Requests"}
                </h2>
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <RotateCcw className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold">
                    {lang === "tr"
                      ? "Aktif bir iade veya değişim talebiniz bulunmuyor."
                      : "You don't have any active return or exchange requests."}
                  </p>
                </div>
              </div>
            )}
          </main>
        )}

        {/* Mobile Filters Modal */}
        <MobileFiltersModal
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          products={products}
          selectedCategory={selectedCategory}
          categories={categories}
          selectedSubCategory={selectedSubCategory}
          setSelectedSubCategory={setSelectedSubCategory}
          t={t}
          brandsLabel={brandsLabel}
          brandLabel={brandLabel}
          brandSearch={brandSearch}
          setBrandSearch={setBrandSearch}
          brands={brands}
          selectedBrand={selectedBrand}
          setSelectedBrand={setSelectedBrand}
          setSelectedCategory={setSelectedCategory}
        />

        {/* Newsletter Section */}
        <NewsletterSection
          show={layoutSettings.show_newsletter || false}
          lang={lang}
        />

        {/* Footer */}
        <StoreFooter
          store={store}
          lang={lang}
          setShowAboutModal={setShowAboutModal}
          setShowStoreLocatorModal={setShowStoreLocatorModal}
        />

        {/* Floating Basket Summary (Mobile) */}
        {basketCount > 0 && !isBasketOpen && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-6 left-4 right-4 z-40 md:hidden"
          >
            <button
              onClick={() => setIsBasketOpen(true)}
              className="w-full text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-bold"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 10px 25px -5px ${primaryColor}40`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <ShoppingBasket className="w-6 h-6" />
                </div>
                <span>
                  {basketCount} {t.dashboard.productsCount}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>
                  {basketTotal.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {store?.currency || "TL"}
                </span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}

        {/* Basket Sidebar */}
        <AnimatePresence>
{isBasketOpen && (
        <BasketSidebar
          isOpen={isBasketOpen}
          onClose={() => setIsBasketOpen(false)}
          basket={basket}
          setBasket={setBasket}
          basketCount={basketCount}
          basketItemPrices={basketItemPrices}
          basketSubtotal={basketSubtotal}
          basketShippingTotal={basketShippingTotal}
          basketTotal={basketTotal}
          store={store}
          t={t}
          theme={{}}
          onCheckout={() => {
            setIsBasketOpen(false);
            setIsCheckoutModalOpen(true);
          }}
        />
      )}
        </AnimatePresence>

        {/* FAQ Modal */}
        <FAQModal
          isOpen={showFaq}
          onClose={() => setShowFaq(false)}
          faq={store?.faq || []}
          lang={lang}
        />

        {/* Blog Modal */}
        <BlogModal
          isOpen={showBlog}
          onClose={() => setShowBlog(false)}
          lang={lang}
          isTr={isTr}
          selectedBlogPost={selectedBlogPost}
          setSelectedBlogPost={setSelectedBlogPost}
          blogPosts={store?.blog_posts}
        />

        {/* Legal Modal */}
        <LegalModal
          isOpen={showLegal}
          onClose={() => setShowLegal(null)}
          lang={lang}
          legalPages={store?.legal_pages}
        />

        {/* Auth Modal */}
        <AnimatePresence>
{showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          authMode={authMode}
          setAuthMode={setAuthMode}
          lang={lang}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          onLogin={(e) => handleCustomerLogin(e)}
          onRegister={(e) => handleCustomerRegister(e)}
          theme={{
            primaryColor: undefined,
            borderFocusColor: undefined
          }}
        />
      )}
        </AnimatePresence>

        {/* Product Detail Modal */}
        <AnimatePresence>
          {selectedProduct && (
            <ProductDetailModal
              product={selectedProduct}
              store={store}
              t={t}
              slug={slug}
              onClose={() => {
                setSelectedProduct(null);
                // Safely pop barcode / direct product param out of browser URI to unlock close action
                if (urlBarcode) {
                  const isCustomDomain =
                    !window.location.pathname.startsWith("/s/");
                  const cleanSlug = store?.slug || slug || urlSlug;
                  if (isCustomDomain) {
                    navigate("/", { replace: true });
                  } else if (cleanSlug) {
                    navigate(`/s/${cleanSlug}`, { replace: true });
                  } else {
                    navigate(-1);
                  }
                }
              }}
              addToBasket={addToBasket}
              primaryColor={primaryColor}
              isLuxury={isLuxury}
              sector={sector}
              showAboutModal={showAboutModal}
              setShowAboutModal={setShowAboutModal}
            />
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
{isCheckoutModalOpen && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          store={store}
          lang={lang}
          currency={store?.currency || 'TL'}
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          basketByBranch={basketByBranch}
          basketTotal={basketTotal}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          checkoutStatus={checkoutStatus}
          orderError={error}
          orderSummary={{}}
          handleCheckout={handleCheckout}
          iyzicoPaymentUrl={iyzicoPaymentUrl}
          theme={{}}
        />
      )}
        </AnimatePresence>
      </div>
      {/* WhatsApp Button */}
      {store?.whatsapp_number && (
        <a
          href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9+]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-28 md:bottom-24 right-4 md:right-8 z-[100] bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg shadow-xl flex items-center gap-3 transition-all active:scale-95"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="text-sm font-bold hidden md:block">
            {lang === "tr" ? "Yardım Al" : "WhatsApp"}
          </span>
        </a>
      )}

      {store && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-24">
          <Suspense fallback={null}>
            <StoreMapSection store={store} />
          </Suspense>
        </div>
      )}

      {/* Small Footer for Compliance */}
      <div className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-400 text-xs font-semibold">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 uppercase tracking-widest">
            <a
              href={`/api/public/store/${store?.slug}/about-us`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              {lang === "tr" ? "Hakkımızda" : "About Us"}
            </a>
            {store?.store_type !== "real_estate" && store?.store_type !== "motor_vehicle" && (
              <>
                <a
                  href={`/api/public/store/${store?.slug}/return-policy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black transition-colors"
                >
                  {lang === "tr" ? "İade Politikası" : "Return Policy"}
                </a>
                <a
                  href={`/api/public/store/${store?.slug}/shipping-policy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black transition-colors"
                >
                  {lang === "tr" ? "Teslimat Politikası" : "Shipping Policy"}
                </a>
              </>
            )}
            <a
              href={`/api/public/store/${store?.slug}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              {lang === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
            </a>
          </div>
          <div className="text-center md:text-right">
            &copy; {new Date().getFullYear()} {store?.name}.{" "}
            {lang === "tr" ? "Tüm hakları saklıdır." : "All rights reserved."}
          </div>
        </div>
      </div>

      {showStoreLocatorModal && store?.locations && (
        <StoreLocatorModal
          locations={store.locations}
          onClose={() => setShowStoreLocatorModal(false)}
        />
      )}

      {/* Discover Stories Modal */}
      <AnimatePresence>
        {showDiscoverModal && (
          <DiscoverModal
            products={products.slice(0, 10)}
            onClose={() => setShowDiscoverModal(false)}
            onViewProduct={(p) => {
              setSelectedProduct(p);
              // Optionally fetch details...
            }}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        lang={lang}
        store={store}
      />
      </ErrorBoundary>
  );
};

export default StoreShowcase;
