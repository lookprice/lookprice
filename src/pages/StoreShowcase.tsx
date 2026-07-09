import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getExchangeRate } from "../services/currencyService";
import {
  ShoppingBasket,
  ChevronRight,
  MessageCircle,
  Package,
  AlertCircle,
  Loader2
} from "lucide-react";
import { api } from "../services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/translations";
import { ModernRealEstateLayout } from "../components/ModernRealEstateLayout";
import { ModernAutomotiveLayout } from "../components/ModernAutomotiveLayout";
import ErrorBoundary from "../components/ErrorBoundary";

// Types
import {
  Product,
  Store as StoreInfo,
  BlogPost
} from "../types";

// Modular Components
import { AuthModal } from '../components/showcase/AuthModal';
import { CheckoutModal } from '../components/showcase/CheckoutModal';
import { BasketSidebar } from '../components/showcase/BasketSidebar';
import { DiscoverModal } from '../components/showcase/DiscoverModal';
import { FAQModal } from '../components/showcase/FAQModal';
import { BlogModal } from '../components/showcase/BlogModal';
import { LegalModal } from '../components/showcase/LegalModal';
import { AboutModal } from '../components/showcase/AboutModal';
import { StoreHeader } from '../components/showcase/StoreHeader';
import { StoreFooter } from '../components/showcase/StoreFooter';
import { CustomerAccountView } from '../components/showcase/CustomerAccountView';
import { NewsletterSection } from '../components/showcase/NewsletterSection';
import { ShowcaseSidebar } from '../components/showcase/ShowcaseSidebar';
import { MobileFiltersModal } from '../components/showcase/MobileFiltersModal';
import { PortfolioFilters } from '../components/showcase/PortfolioFilters';
import { ProductListHeader } from '../components/showcase/ProductListHeader';
import { StoreBlogPosts } from '../components/showcase/StoreBlogPosts';
import { StoreSections } from '../components/showcase/StoreSections';
import { Pagination } from '../components/showcase/Pagination';
import { ProductCard } from "../components/ProductCard";

// Utilities
import { getStoreType } from "../utils/storeType";

const StoreMapSection = React.lazy(() => import("../components/StoreMapSection").then(m => ({ default: m.StoreMapSection })));
const ProductDetailModal = React.lazy(() => import("../components/ProductDetailModal").then(m => ({ default: m.ProductDetailModal })));
const StoreLocatorModal = React.lazy(() => import("../components/StoreLocatorModal").then(m => ({ default: m.StoreLocatorModal })));

interface BasketItem extends Product {
  quantity: number;
}

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
    if (customSlug) return path.startsWith("/") ? path : `/${path}`;
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
  const brandsLabel = store?.brand_label ? store.brand_label.toUpperCase() : (lang === "tr" ? "MARKALAR" : "BRANDS");
  const categoriesLabel = store?.category_label ? store.category_label.toUpperCase() : (lang === "tr" ? "KATEGORİLER" : "CATEGORIES");

  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
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
  const [customerToken, setCustomerToken] = useState<string | null>(localStorage.getItem("customerToken"));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState<any>({});
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Portfolio-specific filter states
  const [portfolioType, setPortfolioType] = useState<"all" | "real_estate" | "car" | "motorcycle" | "marine" | "construction" | "agricultural" | "other">("all");
  const [portfolioMinPrice, setPortfolioMinPrice] = useState("");
  const [portfolioMaxPrice, setPortfolioMaxPrice] = useState("");
  const [portfolioRooms, setPortfolioRooms] = useState("all");
  const [portfolioMinM2, setPortfolioMinM2] = useState("");

  const [customerInfo, setCustomerInfo] = useState({
    name: "", surname: "", phone: "", address: "", email: "", password: "", passwordConfirm: "",
    country: "", city: "", tc_id: "", is_corporate: false, marketing_email: false, marketing_sms: false,
    accept_terms: false, createAccount: false,
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "priceAsc" | "priceDesc">("default");
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "bank_transfer" | "cash_on_delivery" | "payoneer" | "paypal" | "iyzico" | "store_reservation">("credit_card");
  const [iyzicoPaymentUrl, setIyzicoPaymentUrl] = useState<string | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showFaq, setShowFaq] = useState(false);
  const [showBlog, setShowBlog] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [showLegal, setShowLegal] = useState<"sales" | "kvkk" | "pre_info" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const ITEMS_PER_PAGE = 20;
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showStoreLocatorModal, setShowStoreLocatorModal] = useState(false);

  const layoutSettings = useMemo(() => store?.page_layout_settings || {
    show_announcement: true,
    show_stories: true,
    show_campaigns: true,
    show_testimonials: true,
    show_newsletter: true,
    enable_live_activity: true,
    theme_variety: "modern",
    sector: "general",
  }, [store]);

  const primaryColor = store?.primary_color || (layoutSettings.theme_variety === "luxury" ? "#8B7355" : "#3b82f6");
  const isLuxury = layoutSettings.theme_variety === "luxury" || layoutSettings.theme_variety === "minimal";
  const sector = layoutSettings.sector || "general";

  useEffect(() => {
    const savedCustomer = localStorage.getItem("customer");
    if (savedCustomer) setCustomer(JSON.parse(savedCustomer));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const [storeRes, productsRes, radarNewsRes] = await Promise.all([
          api.getPublicStore(slug),
          api.getPublicStoreProducts(slug),
          api.getPublicRadarNews(slug).catch(() => [])
        ]);

        if (storeRes.redirect) {
          navigate(storeRes.redirect, { replace: true });
          return;
        }

        if (storeRes.error) throw new Error(storeRes.error);
        if (productsRes.error) throw new Error(productsRes.error);

        let parsedLayout = storeRes.page_layout;
        if (typeof parsedLayout === "string" && parsedLayout) {
          try { parsedLayout = JSON.parse(parsedLayout); } catch (e) { parsedLayout = null; }
        }

        if (parsedLayout) {
          storeRes.page_layout_full = parsedLayout;
          const defaultSectionIds = ['hero', 'search', 'stats', 'portfolio', 'news', 'blog', 'team', 'financing', 'calculator', 'map', 'social'];
          if (parsedLayout && typeof parsedLayout === "object" && !Array.isArray(parsedLayout)) {
            storeRes.page_layout = Array.isArray(parsedLayout.sections) 
              ? parsedLayout.sections.map((s: any) => ({ id: s.id || s.type, type: s.type || s.id, enabled: s.enabled !== false }))
              : defaultSectionIds.map(defId => ({ id: defId, type: defId, enabled: true }));
          } else if (Array.isArray(parsedLayout)) {
            storeRes.page_layout = parsedLayout.map((s: any) => ({ id: s.id || s.type, type: s.type || s.id, enabled: s.enabled !== false }));
          } else {
            storeRes.page_layout = defaultSectionIds.map(defId => ({ id: defId, type: defId, enabled: true }));
          }
        } else {
          storeRes.page_layout = [];
        }

        if (typeof storeRes.menu_links === "string") {
          try { storeRes.menu_links = JSON.parse(storeRes.menu_links); } catch (e) { storeRes.menu_links = []; }
        }

        storeRes.currency = storeRes.default_currency || "TRY";
        setStore(storeRes);

        if (storeRes.favicon_url) {
          const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement("link");
          link.rel = "icon";
          link.href = storeRes.favicon_url;
          document.head.appendChild(link);
        }

        document.title = storeRes.name || "Store";
        setProducts(productsRes.filter((p: Product) => p.is_web_sale !== false));
        
        const currentSector = storeRes.store_type === 'motor_vehicle' || storeRes.store_type === 'automotive' ? 'automotive' : 'real_estate';
        setRadarNews(Array.isArray(radarNewsRes) ? radarNewsRes.filter((n: any) => !n.sector || n.sector === currentSector || (currentSector === 'automotive' && n.sector === 'motor_vehicle')) : []);

        if (urlBarcode) {
          const cleanBarcode = urlBarcode.toString().trim().toLowerCase();
          const product = productsRes.find((p: Product) => (p.barcode && p.barcode.toString().trim().toLowerCase() === cleanBarcode) || p.id.toString() === cleanBarcode);
          if (product) setSelectedProduct(product);
        }

        if (customer) {
          setCustomerInfo(prev => ({
            ...prev, name: customer.name || "", surname: customer.surname || "", phone: customer.phone || "",
            address: customer.address || "", email: customer.email || "", country: customer.country || "",
            city: customer.city || "", tc_id: customer.tc_id || "", is_corporate: customer.is_corporate || false,
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

  const addToBasket = (product: Product) => {
    setBasket((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
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
        let matchedProfile: any = null;

        if (item.shipping_profile_id && store.shipping_profiles) {
          matchedProfile = store.shipping_profiles.find((p: any) => String(p.id) === String(item.shipping_profile_id));
        }

        if (!matchedProfile && store.shipping_profiles) {
          const itemCat = String(item.category || "").trim().toLowerCase();
          const itemSubcat = String(item.sub_category || "").trim().toLowerCase();
          for (const p of store.shipping_profiles) {
            if (p.sub_categories_str && itemSubcat) {
              const subcats = p.sub_categories_str.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
              if (subcats.includes(itemSubcat)) { matchedProfile = p; break; }
            }
            if (p.categories_str && itemCat) {
              const cats = p.categories_str.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
              if (cats.includes(itemCat)) matchedProfile = p;
            }
          }
        }

        if (matchedProfile) {
          let profileCost = Number(matchedProfile.cost) || 0;
          if (matchedProfile.currency && matchedProfile.currency !== store.currency) {
            const sRate = await getExchangeRate(matchedProfile.currency, store.currency);
            profileCost = profileCost * sRate;
          }
          shippingCost = profileCost;
        }

        if (shippingCost > maxShippingCost) maxShippingCost = shippingCost;
        let convertedItemPrice = itemPrice;
        if (item.currency && item.currency !== store.currency) {
          const rate = await getExchangeRate(item.currency, store.currency);
          convertedItemPrice = itemPrice * rate;
        }
        newPrices[item.id] = convertedItemPrice;
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

    if (paymentMethod === "store_reservation" && ((store?.locations && store.locations.length > 0) || (store?.branches && store.branches.length > 0)) && !selectedLocation) {
      setError(lang === "tr" ? "Lütfen bir mağaza seçin." : "Please select a store.");
      return;
    }

    setCheckoutStatus("loading");
    try {
      const itemsWithConvertedPrices = await Promise.all(basket.map(async (item) => {
        let finalPrice = Number(item.price) || 0;
        if (item.currency && item.currency !== store.currency) {
          const rate = await getExchangeRate(item.currency, store.currency);
          finalPrice = finalPrice * rate;
        }
        return {
          productId: item.id, name: item.name, barcode: item.barcode, quantity: item.quantity,
          price: finalPrice, branch_name: item.branch_name, branch_id: item.store_id,
        };
      }));

      if (basketShippingTotal > 0) {
        itemsWithConvertedPrices.push({
          productId: null as any, name: lang === "tr" ? "Kargo Ücreti" : "Shipping Fee", barcode: "SHIPPING",
          quantity: 1, price: basketShippingTotal, branch_name: "", branch_id: 0,
        });
      }

      const res = await api.createPublicSale({
        storeId: store.id, items: itemsWithConvertedPrices,
        customerName: `${customerInfo.name} ${customerInfo.surname}`.trim(),
        customerPhone: customerInfo.phone, customerEmail: customerInfo.email,
        customerAddress: paymentMethod === "store_reservation" ? `Mağazadan Teslim: ${selectedLocation}` : customerInfo.address,
        customerCity: customerInfo.city, customerCountry: customerInfo.country, customerTcId: customerInfo.tc_id,
        total: basketTotal, currency: store.currency, paymentMethod: paymentMethod,
        createAccount: customerInfo.createAccount, customerId: customer?.id,
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
        } else throw new Error(initData.error || "Ödeme başlatılamadı.");
      }

      if (res.redirectUrl) { window.location.href = res.redirectUrl; return; }
      setCheckoutStatus("success");
      setBasket([]);
      setTimeout(() => { setIsCheckoutModalOpen(false); setCheckoutStatus("idle"); }, 3000);
    } catch (err: any) {
      setCheckoutStatus("error");
      setError(err.message);
    }
  };

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
    products.forEach((p) => { if (p.brand) b.add(p.brand); });
    return Array.from(b).sort();
  }, [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const isPortfolio = p.type === "real_estate" || p.type === "vehicle";
      if (isPortfolio && p.status && p.status !== 'active') return false;

      const searchTerms = searchQuery.toLowerCase().split(" ").filter(Boolean);
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
        p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) || (p.brand && p.brand.toLowerCase().includes(term))
      );

      const productCategory = p.category || t.dashboard.uncategorized;
      const matchesCategory = !selectedCategory || productCategory === selectedCategory;
      const matchesSubCategory = !selectedSubCategory || p.sub_category === selectedSubCategory;
      const matchesBrand = !selectedBrand || p.brand === selectedBrand;

      let matchesPortfolioType = true;
      if (isPortfolio) {
        if (portfolioType === "real_estate") matchesPortfolioType = p.type === "real_estate";
        else if (portfolioType !== "all") matchesPortfolioType = p.sector_data?.sub_sector === portfolioType;
      }

      let matchesMinPrice = !portfolioMinPrice || p.price >= Number(portfolioMinPrice);
      let matchesMaxPrice = !portfolioMaxPrice || p.price <= Number(portfolioMaxPrice);
      let matchesRooms = true;
      if (portfolioRooms !== "all" && p.type === "real_estate") {
        const pRooms = Number(p.sector_data?.rooms);
        if (portfolioRooms === "1") matchesRooms = pRooms === 1;
        else if (portfolioRooms === "2") matchesRooms = pRooms === 2;
        else if (portfolioRooms === "3") matchesRooms = pRooms === 3;
        else if (portfolioRooms === "4+") matchesRooms = pRooms >= 4;
      }
      let matchesMinM2 = !portfolioMinM2 || (p.type === "real_estate" && Number(p.sector_data?.square_meters) >= Number(portfolioMinM2));

      return matchesSearch && matchesCategory && matchesSubCategory && matchesBrand && matchesPortfolioType && matchesMinPrice && matchesMaxPrice && matchesRooms && matchesMinM2;
    });

    if (sortBy === "priceAsc") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "priceDesc") result.sort((a, b) => b.price - a.price);
    return result;
  }, [products, searchQuery, selectedCategory, selectedSubCategory, selectedBrand, sortBy, portfolioType, portfolioMinPrice, portfolioMaxPrice, portfolioRooms, portfolioMinM2, t]);

  const totalPages = Math.ceil(sortedAndFilteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedAndFilteredProducts, currentPage]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">{t.dashboard.storeLoading}</p>
      </div>
    </div>
  );

  if (!store || error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.errorOccurred}</h2>
        <p className="text-gray-600 mb-6">{error || t.dashboard.storeNotFound}</p>
        <button onClick={() => navigate("/")} className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          {t.dashboard.backToHome}
        </button>
      </div>
    </div>
  );

  const storeType = getStoreType(store);
  const isPortfolio = storeType === "real_estate" || storeType === "automotive";

  if (isPortfolio) {
    return (
      <ErrorBoundary lang={lang}>
        <div className="relative min-h-screen bg-slate-50 overflow-x-hidden font-sans">
          {storeType === "automotive" ? (
            <ModernAutomotiveLayout store={store} products={products} radarNews={radarNews} onViewProduct={setSelectedProduct} />
          ) : (
            <ModernRealEstateLayout store={store} products={products} radarNews={radarNews} onViewProduct={setSelectedProduct} />
          )}
          <AnimatePresence>
            {selectedProduct && (
              <ProductDetailModal
                product={selectedProduct} store={store} t={t} slug={slug}
                onClose={() => setSelectedProduct(null)} addToBasket={addToBasket}
                primaryColor={primaryColor} isLuxury={isLuxury} sector={sector}
                showAboutModal={showAboutModal} setShowAboutModal={setShowAboutModal}
              />
            )}
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary lang={lang}>
      <div className="min-h-screen bg-white">
        <StoreHeader
          store={store} lang={lang} basketCount={basketCount}
          setIsBasketOpen={setIsBasketOpen} isAccountMenuOpen={isAccountMenuOpen}
          setIsAccountMenuOpen={setIsAccountMenuOpen} customer={customer}
          handleLogout={() => { setCustomer(null); localStorage.removeItem("customer"); }}
          getStorePath={getStorePath} setShowAuthModal={setShowAuthModal}
          setAuthMode={setAuthMode} primaryColor={primaryColor}
          t={t} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          accountMenuRef={accountMenuRef} setShowBlog={setShowBlog}
        />

        {!isProfileView && !isOrdersView && !isReturnView ? (
          <main className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
            {isPortfolio && (
              <PortfolioFilters
                lang={lang} store={store} portfolioType={portfolioType} setPortfolioType={setPortfolioType}
                portfolioMinPrice={portfolioMinPrice} setPortfolioMinPrice={setPortfolioMinPrice}
                portfolioMaxPrice={portfolioMaxPrice} setPortfolioMaxPrice={setPortfolioMaxPrice}
                portfolioRooms={portfolioRooms} setPortfolioRooms={setPortfolioRooms}
                portfolioMinM2={portfolioMinM2} setPortfolioMinM2={setPortfolioMinM2}
              />
            )}

            <ProductListHeader
              selectedCategory={selectedCategory} t={t} productCount={sortedAndFilteredProducts.length}
              searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortBy={sortBy} setSortBy={setSortBy}
              lang={lang} isLuxury={isLuxury}
            />

            <div className="flex flex-col lg:flex-row gap-16">
              <ShowcaseSidebar
                categories={categories} products={products} selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory} selectedSubCategory={selectedSubCategory}
                setSelectedSubCategory={setSelectedSubCategory} expandedCategories={expandedCategories}
                toggleCategory={(cat) => setExpandedCategories(prev => {
                  const next = new Set(prev);
                  if (next.has(cat)) next.delete(cat); else next.add(cat);
                  return next;
                })}
                categorySearch={categorySearch} setCategorySearch={setCategorySearch}
                showAllCategories={showAllCategories} setShowAllCategories={setShowAllCategories}
                brands={brands} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand}
                brandSearch={brandSearch} setBrandSearch={setBrandSearch} lang={lang} t={t}
                categoriesLabel={categoriesLabel} brandsLabel={translations[lang].stats.brands} brandLabel={brandLabel}
              />

              <div className="flex-1">
                <StoreSections
                  store={store} featuredProducts={products.slice(0, 8)} t={t} addToBasket={addToBasket}
                  setSelectedProduct={setSelectedProduct} setSelectedBlogPost={setSelectedBlogPost}
                  primaryColor={primaryColor} isLuxury={isLuxury} sector={sector} isTr={isTr}
                  radarNews={radarNews} lang={lang}
                />

                {sortedAndFilteredProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-6 mt-12">
                      <AnimatePresence mode="popLayout">
                        {paginatedProducts.map((product) => (
                          <ProductCard
                            key={product.id} product={product} store={store} t={t}
                            onView={setSelectedProduct} addToBasket={addToBasket}
                            primaryColor={primaryColor} isLuxury={isLuxury} sector={sector}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    <StoreBlogPosts blogPosts={store.blog_posts || []} lang={lang} setShowBlog={setShowBlog} setSelectedBlogPost={setSelectedBlogPost} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-12">
                    <Package className="w-12 h-12 text-gray-200 mb-8" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.noProductsFound}</h3>
                    <p className="text-gray-400 font-medium max-w-xs">{t.dashboard.noProductsDesc}</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : (
          <CustomerAccountView
            isProfileView={isProfileView} isOrdersView={isOrdersView} isReturnView={isReturnView}
            customerProfile={customerProfile} profileEditForm={profileEditForm} setProfileEditForm={setProfileEditForm}
            isEditingProfile={isEditingProfile} setIsEditingProfile={setIsEditingProfile}
            handleProfileUpdate={async () => {}} orders={orders} loadingOrders={loadingOrders}
            lang={lang} t={t} navigate={navigate} handleLogout={() => {}} getStorePath={getStorePath}
          />
        )}

        <NewsletterSection show={layoutSettings.show_newsletter || false} lang={lang} />
        <StoreFooter store={store} lang={lang} setShowAboutModal={setShowAboutModal} setShowStoreLocatorModal={setShowStoreLocatorModal} />

        <AnimatePresence>
          {isBasketOpen && (
            <BasketSidebar
              isOpen={isBasketOpen} onClose={() => setIsBasketOpen(false)} basket={basket}
              setBasket={setBasket} basketCount={basketCount} basketItemPrices={basketItemPrices}
              basketSubtotal={basketSubtotal} basketShippingTotal={basketShippingTotal}
              basketTotal={basketTotal} store={store} t={t} theme={{}}
              onCheckout={() => { setIsBasketOpen(false); setIsCheckoutModalOpen(true); }}
            />
          )}
        </AnimatePresence>

        <FAQModal isOpen={showFaq} onClose={() => setShowFaq(false)} faq={store?.faq || []} lang={lang} />
        <BlogModal
          isOpen={showBlog} onClose={() => setShowBlog(false)} lang={lang} isTr={isTr}
          selectedBlogPost={selectedBlogPost} setSelectedBlogPost={setSelectedBlogPost} blogPosts={store?.blog_posts}
        />
        <LegalModal isOpen={showLegal} onClose={() => setShowLegal(null)} lang={lang} legalPages={store?.legal_pages} />

        <AnimatePresence>
          {showAuthModal && (
            <AuthModal
              isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} authMode={authMode}
              setAuthMode={setAuthMode} lang={lang} customerInfo={customerInfo} setCustomerInfo={setCustomerInfo}
              onLogin={async () => {}} onRegister={async () => {}} theme={{}}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedProduct && (
            <ProductDetailModal
              product={selectedProduct} store={store} t={t} slug={slug}
              onClose={() => setSelectedProduct(null)} addToBasket={addToBasket}
              primaryColor={primaryColor} isLuxury={isLuxury} sector={sector}
              showAboutModal={showAboutModal} setShowAboutModal={setShowAboutModal}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCheckoutModalOpen && (
            <CheckoutModal
              isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)} store={store}
              lang={lang} currency={store?.currency || 'TL'} customerInfo={customerInfo}
              setCustomerInfo={setCustomerInfo} basketByBranch={basketByBranch} basketTotal={basketTotal}
              paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} checkoutStatus={checkoutStatus}
              orderError={error} orderSummary={{}} handleCheckout={handleCheckout}
              iyzicoPaymentUrl={iyzicoPaymentUrl} theme={{}}
            />
          )}
        </AnimatePresence>

        {store?.whatsapp_number && (
          <a href={`https://wa.me/${store.whatsapp_number.replace(/[^0-9+]/g, "")}`} target="_blank" rel="noopener noreferrer"
             className="fixed bottom-28 md:bottom-24 right-4 md:right-8 z-[100] bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg shadow-xl flex items-center gap-3 transition-all active:scale-95">
            <MessageCircle className="w-7 h-7" />
            <span className="text-sm font-bold hidden md:block">{lang === "tr" ? "Yardım Al" : "WhatsApp"}</span>
          </a>
        )}

        {store && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-24">
            <Suspense fallback={null}>
              <StoreMapSection store={store} />
            </Suspense>
          </div>
        )}

        <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} lang={lang} store={store} />
      </div>
    </ErrorBoundary>
  );
};

export default StoreShowcase;
