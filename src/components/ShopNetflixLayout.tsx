import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ShoppingBag, 
  Sparkles, 
  Tag, 
  Heart, 
  User, 
  Info, 
  SlidersHorizontal,
  Flame,
  Star,
  Compass,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Package,
  ShieldCheck,
  Truck,
  RefreshCw,
  Lock,
  ArrowRight,
  ArrowLeft,
  Layers,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Sun,
  Moon,
  Clock
} from "lucide-react";
import { Product, Store as StoreInfo } from "../types";
import { StoreFooter } from "./showcase/StoreFooter";
import { getLabels } from "../utils/showcase";

export const getProductImageUrl = (p: Product): string => {
  let url = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
  if (!p) return url;
  if (p.image_url && typeof p.image_url === "string" && p.image_url.trim()) url = p.image_url.trim();
  else if ((p as any)?.cover_image && typeof (p as any).cover_image === "string" && (p as any).cover_image.trim()) url = (p as any).cover_image.trim();
  else if (Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === "string" && p.images[0].trim()) {
    url = p.images[0].trim();
  } else if (typeof p.images === "string" && p.images.trim()) {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
        url = String(parsed[0]).trim();
      }
    } catch (e) {
      if (p.images.startsWith("http") || p.images.startsWith("/")) url = p.images.trim();
    }
  } else {
    const rawPhotos = (p as any).photos;
    if (Array.isArray(rawPhotos) && rawPhotos.length > 0 && rawPhotos[0]) {
      url = String(rawPhotos[0]).trim();
    }
  }

  if (!url) return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

  // Normalize absolute domain URLs containing /api/storage/ to relative path so it loads from active domain
  if (url.includes("/api/storage/")) {
    url = url.replace(/^https?:\/\/[^\/]+\/api\/storage\//, '/api/storage/');
  }

  // Pre-emptively proxy domains known to enforce strict Hotlink / NotSameOrigin 403 blocks
  if (url && (url.includes("extrememobiles.com.cy") || url.includes("wp-content/uploads/woocommerce"))) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export const getProductStockCount = (p: Product): number => {
  if (!p) return 0;
  if (typeof p.stock_quantity === "number") return p.stock_quantity;
  if (typeof (p as any).stock === "number") return (p as any).stock;
  if (typeof (p as any).quantity === "number") return (p as any).quantity;
  if (typeof (p as any).total_stock === "number") return (p as any).total_stock;
  return 0;
};

interface ShopNetflixLayoutProps {
  store: StoreInfo | null;
  products: Product[];
  onViewProduct: (product: Product, rowProducts?: Product[]) => void;
  addToBasket: (product: Product) => void;
  basket: any[];
  setBasket: (b: any[]) => void;
  basketTotal: number;
  basketSubtotal: number;
  basketShippingTotal: number;
  onCheckout: () => void;
  lang: string;
  t: any;
  customer: any;
  onOpenProfile: (tab?: string) => void;
  onLogout: () => void;
  setShowAboutModal: (s: boolean) => void;
  setShowStoreLocatorModal: (s: boolean) => void;
  setShowAuthModal: (s: boolean) => void;
  theme?: 'light' | 'dark';
  setTheme?: (t: 'light' | 'dark') => void;
  onToggleTheme?: () => void;
}

export const ShopNetflixLayout: React.FC<ShopNetflixLayoutProps> = ({
  store,
  products,
  onViewProduct,
  addToBasket,
  basket,
  setBasket,
  basketTotal,
  basketSubtotal,
  basketShippingTotal,
  onCheckout,
  lang,
  t,
  customer,
  onOpenProfile,
  onLogout,
  setShowAboutModal,
  setShowStoreLocatorModal,
  setShowAuthModal,
  theme = 'dark',
  setTheme,
  onToggleTheme
}) => {
  const isTr = lang === "tr";

  // Load initial states from URL search params to preserve operator workflow on refresh (Rule 7)
  const [searchQuery, setSearchQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || "all";
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("sub_category") || "all";
  });
  const [selectedBrand, setSelectedBrand] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("brand") || "all";
  });
  const [selectedBadge, setSelectedBadge] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("badge") || "all";
  });
  const [sortBy, setSortBy] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("sortBy") || "default";
  });
  const [activeTab, setActiveTab] = useState<"home" | "catalog" | "bestsellers">((() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "home" || tab === "catalog" || tab === "bestsellers") return tab;
    return "home";
  })());

  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Synchronize state changes to URL search params (Rule 7: Operator UX Continuity & Persistence)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (searchQuery) params.set("q", searchQuery); else params.delete("q");
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory); else params.delete("category");
    if (selectedSubCategory && selectedSubCategory !== "all") params.set("sub_category", selectedSubCategory); else params.delete("sub_category");
    if (selectedBrand && selectedBrand !== "all") params.set("brand", selectedBrand); else params.delete("brand");
    if (selectedBadge && selectedBadge !== "all") params.set("badge", selectedBadge); else params.delete("badge");
    if (sortBy && sortBy !== "default") params.set("sortBy", sortBy); else params.delete("sortBy");
    if (activeTab && activeTab !== "home") params.set("tab", activeTab); else params.delete("tab");
    
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? "?" + newSearch : ""}`;
    window.history.replaceState(window.history.state, "", newUrl);
  }, [searchQuery, selectedCategory, selectedSubCategory, selectedBrand, selectedBadge, sortBy, activeTab]);

  // Reset visibleCount on filter change
  useEffect(() => {
    setVisibleCount(30);
  }, [searchQuery, selectedCategory, selectedSubCategory, selectedBrand, selectedBadge, sortBy, activeTab]);

  const storeName = store?.branding?.store_name || store?.name || (isTr ? "Seçkin Mağaza" : "Elite Store");
  const storeLogo = store?.branding?.logo_url || store?.logo_url;

  // Pre-process products to dynamically ensure that we never show 0 products in any of the Netflix rows!
  const processedProducts = useMemo(() => {
    let featuredCount = 0;
    let bestsellerCount = 0;
    let discountedCount = 0;

    products.forEach((p) => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      if (p.is_bestseller || labels.some(l => l.includes("cok satan") || l.includes("çoksatan") || l.includes("bestseller") || l.includes("trend"))) {
        bestsellerCount++;
      }
      if (labels.some(l => l.includes("one cikan") || l.includes("öne çıkan") || l.includes("featured") || l.includes("haftanin") || l.includes("editor"))) {
        featuredCount++;
      }
      if ((p.old_price && p.old_price > p.price) || (p as any).discount_rate > 0 || labels.some(l => l.includes("indirim") || l.includes("firsat") || l.includes("kampanya") || l.includes("discount"))) {
        discountedCount++;
      }
    });

    return products.map((p, index) => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      
      let isBestseller = p.is_bestseller || labels.some(l => l.includes("cok satan") || l.includes("çoksatan") || l.includes("bestseller") || l.includes("trend"));
      let isFeatured = labels.some(l => l.includes("one cikan") || l.includes("öne çıkan") || l.includes("featured") || l.includes("haftanin") || l.includes("editor"));
      let hasDiscount = (p.old_price && p.old_price > p.price) || (p as any).discount_rate > 0 || labels.some(l => l.includes("indirim") || l.includes("firsat") || l.includes("kampanya") || l.includes("discount"));
      
      let oldPrice = p.old_price;

      // Rule-based fallback if the store database lacks explicitly tagged products
      if (bestsellerCount < 4) {
        if (!isBestseller && index % 4 === 0) {
          isBestseller = true;
        }
      }
      if (featuredCount < 4) {
        if (!isFeatured && index % 5 === 2) {
          isFeatured = true;
        }
      }
      if (discountedCount < 4) {
        if (!hasDiscount && index % 3 === 1) {
          hasDiscount = true;
          oldPrice = Math.round((p.price * 1.25) / 5) * 5;
        }
      }

      // Add dynamic tag labels if they were added as fallback
      const finalLabels = [...getLabels(p.labels || (p as any).tags || (p as any).badges || [])];
      if (isFeatured && !finalLabels.some(l => l.toLowerCase().includes("öne") || l.toLowerCase().includes("one") || l.toLowerCase().includes("featured"))) {
        finalLabels.push(isTr ? "Öne Çıkan" : "Featured");
      }
      if (isBestseller && !finalLabels.some(l => l.toLowerCase().includes("satan") || l.toLowerCase().includes("bestseller"))) {
        finalLabels.push(isTr ? "Çok Satan" : "Bestseller");
      }
      if (hasDiscount && !finalLabels.some(l => l.toLowerCase().includes("indirim") || l.toLowerCase().includes("fırsat") || l.toLowerCase().includes("discount"))) {
        finalLabels.push(isTr ? "Fırsat Ürünü" : "Special Offer");
      }

      return {
        ...p,
        is_bestseller: isBestseller,
        old_price: oldPrice,
        labels: finalLabels
      };
    });
  }, [products, isTr]);

  // Extract distinct categories, subcategories, brands from processedProducts
  const categories = useMemo(() => {
    const set = new Set<string>();
    processedProducts.forEach((p) => {
      if (p.category && typeof p.category === "string" && p.category.trim()) set.add(p.category.trim());
      if (p.category_2 && typeof p.category_2 === "string" && p.category_2.trim()) set.add(p.category_2.trim());
    });
    return Array.from(set).sort();
  }, [processedProducts]);

  const subCategories = useMemo(() => {
    const set = new Set<string>();
    processedProducts.forEach((p) => {
      if (selectedCategory === "all" || p.category === selectedCategory || p.category_2 === selectedCategory) {
        const sub = p.sub_category || (p as any).sub_category_2;
        if (sub && typeof sub === "string" && sub.trim()) set.add(sub.trim());
      }
    });
    return Array.from(set).sort();
  }, [processedProducts, selectedCategory]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    processedProducts.forEach((p) => {
      if (p.brand && typeof p.brand === "string" && p.brand.trim()) set.add(p.brand.trim());
    });
    return Array.from(set).sort();
  }, [processedProducts]);

  // Featured / Cinematic Hero Products
  const heroProducts = useMemo(() => {
    const filtered = processedProducts.filter(p => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      const isHeroTagged = labels.some(l => l.includes("one cikan") || l.includes("öne çıkan") || l.includes("featured") || l.includes("bestseller") || l.includes("cok satan") || l.includes("fırsat"));
      return isHeroTagged || p.is_bestseller || (p.price && p.price > 500);
    });
    return (filtered.length > 0 ? filtered : processedProducts).slice(0, 6);
  }, [processedProducts]);

  const [heroIndex, setHeroIndex] = useState(0);

  // Netflix Architecture Configuration from branding
  const netflixConfig = useMemo(() => {
    const raw = store?.branding?.netflix_config;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return (raw && typeof raw === "object") ? raw : {};
  }, [store?.branding?.netflix_config]);

  const showHero = netflixConfig.hero_enabled !== false;
  const showHeroBadges = netflixConfig.show_hero_badges !== false;
  const heroIntervalSec = Number(netflixConfig.hero_autoplay_interval) || 6;
  const showBestsellers = netflixConfig.show_bestsellers_row !== false;
  const bestsellersTitle = (netflixConfig.bestsellers_title || (isTr ? "Çok Satanlar & Popüler Ürünler" : "Bestsellers & Popular")).replace(/^[🔥⭐🏷️✨📦]+\s*/, '');
  const showFeatured = netflixConfig.show_featured_row !== false;
  const featuredTitle = (netflixConfig.featured_title || (isTr ? "Öne Çıkan Koleksiyon" : "Featured Collection")).replace(/^[🔥⭐🏷️✨📦]+\s*/, '');
  const showDiscounted = netflixConfig.show_discounted_row !== false;
  const discountedTitle = (netflixConfig.discounted_title || (isTr ? "Fırsatlar & Kampanyalı Ürünler" : "Special Offers & Discounts")).replace(/^[🔥⭐🏷️✨📦]+\s*/, '');
  const showNewArrivals = netflixConfig.show_new_arrivals_row !== false;
  const newArrivalsTitle = (netflixConfig.new_arrivals_title || (isTr ? "Yeni Gelen Ürünler" : "New Arrivals")).replace(/^[🔥⭐🏷️✨📦]+\s*/, '');
  const showCategoryRows = netflixConfig.show_category_rows !== false;
  const enableHoverZoom = netflixConfig.enable_hover_zoom !== false;
  const showQuickAddCart = netflixConfig.show_quick_add_cart !== false;
  const showStockBadge = netflixConfig.show_stock_badge !== false;
  const showOldPrice = netflixConfig.show_old_price !== false;
  const showThemeToggle = netflixConfig.show_theme_toggle !== false;
  const showAnnouncementBar = netflixConfig.show_announcement_bar !== false && !!(netflixConfig.announcement_text || store?.branding?.announcement_text);
  const announcementText = netflixConfig.announcement_text || store?.branding?.announcement_text || "";
  const accentColor = netflixConfig.accent_color || store?.branding?.accent_color || "#3b82f6";

  useEffect(() => {
    if (heroProducts.length <= 1 || !showHero) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroProducts.length);
    }, heroIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [heroProducts.length, showHero, heroIntervalSec]);

  const currentHero = heroProducts[heroIndex] || processedProducts[0];

  // Limit New Arrivals in Catalog to the top 24 newest products
  const newArrivalsCatalog = useMemo(() => {
    return [...processedProducts].sort((a, b) => new Date((b as any).created_at || b.created_at || 0).getTime() - new Date((a as any).created_at || a.created_at || 0).getTime()).slice(0, 24);
  }, [processedProducts]);

  // Filtered catalog products with guaranteed non-empty fallback (Rule 26)
  const filteredProducts = useMemo(() => {
    const initialMatch = processedProducts.filter(p => {
      if (selectedCategory !== "all" && p.category !== selectedCategory && p.category_2 !== selectedCategory) return false;
      if (selectedSubCategory !== "all" && p.sub_category !== selectedSubCategory && (p as any).sub_category_2 !== selectedSubCategory) return false;
      if (selectedBrand !== "all" && p.brand !== selectedBrand) return false;
      if (selectedBadge !== "all") {
        const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
        const tagMatch = labels.some(l => l.includes(selectedBadge.toLowerCase()));
        const isBestsellerMatch = (selectedBadge === "bestseller" || selectedBadge === "best_sellers") && (
          p.is_bestseller || labels.some(l => l.includes("cok satan") || l.includes("çoksatan") || l.includes("bestseller") || l.includes("trend"))
        );
        const isFeaturedMatch = selectedBadge === "featured" && (
          labels.some(l => l.includes("one cikan") || l.includes("öne çıkan") || l.includes("featured") || l.includes("haftanin") || l.includes("editor"))
        );
        const isDiscountMatch = selectedBadge === "discount" && (
          (p.old_price && p.old_price > p.price) || 
          (p as any).discount_rate > 0 || 
          labels.some(l => l.includes("indirim") || l.includes("firsat") || l.includes("kampanya") || l.includes("discount"))
        );
        const isNewMatch = selectedBadge === "new" && newArrivalsCatalog.some(na => na.id === p.id);
        
        if (!tagMatch && !isBestsellerMatch && !isFeaturedMatch && !isDiscountMatch && !isNewMatch) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchCat = (p.category || "").toLowerCase().includes(q) || (p.category_2 || "").toLowerCase().includes(q);
        const matchBrand = (p.brand || "").toLowerCase().includes(q);
        const matchBarcode = (p.barcode || "").toLowerCase().includes(q);
        const matchLabels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).some(l => l.toLowerCase().includes(q));
        if (!matchName && !matchCat && !matchBrand && !matchBarcode && !matchLabels) return false;
      }
      return true;
    });

    if (initialMatch.length > 0) return initialMatch;

    // Fallback when a badge is selected but zero products matched strict tags
    if (selectedBadge !== "all" && !searchQuery.trim()) {
      if (selectedBadge === "discount") {
        return processedProducts.map(p => ({
          ...p,
          old_price: (p.old_price && p.old_price > p.price) ? p.old_price : Math.round((p.price || 100) * 1.25)
        }));
      }
      if (selectedBadge === "new") {
        return newArrivalsCatalog;
      }
      return processedProducts;
    }

    return initialMatch;
  }, [processedProducts, selectedCategory, selectedSubCategory, selectedBrand, selectedBadge, searchQuery, newArrivalsCatalog]);

  // Final list of products including custom badge-specific sorting rules (like newest first for new arrivals)
  const finalProductsList = useMemo(() => {
    let result = [...filteredProducts];
    if (selectedBadge === "new") {
      result.sort((a, b) => new Date((b as any).created_at || b.created_at || 0).getTime() - new Date((a as any).created_at || a.created_at || 0).getTime());
    } else if (sortBy === "priceAsc") {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "priceDesc") {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    return result;
  }, [filteredProducts, selectedBadge, sortBy]);

  // Rows for Netflix style with smart fallbacks so rows are NEVER empty (Constitution Rule 26)
  const bestsellerProducts = useMemo(() => {
    const list = processedProducts.filter(p => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      return p.is_bestseller || labels.some(l => l.includes("cok satan") || l.includes("çoksatan") || l.includes("bestseller") || l.includes("trend"));
    });
    return (list.length > 0 ? list : processedProducts).slice(0, 16);
  }, [processedProducts]);

  const featuredProducts = useMemo(() => {
    const list = processedProducts.filter(p => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      return labels.some(l => l.includes("one cikan") || l.includes("öne çıkan") || l.includes("featured") || l.includes("haftanin") || l.includes("editor"));
    });
    return (list.length > 0 ? list : processedProducts).slice(0, 16);
  }, [processedProducts]);

  const discountedProducts = useMemo(() => {
    const list = processedProducts.filter(p => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      return (p.old_price && p.old_price > p.price) || (p as any).discount_rate > 0 || labels.some(l => l.includes("indirim") || l.includes("firsat") || l.includes("kampanya") || l.includes("discount"));
    });
    const source = list.length > 0 ? list : processedProducts;
    return source.map(p => ({
      ...p,
      old_price: (p.old_price && p.old_price > p.price) ? p.old_price : Math.round((p.price || 100) * 1.25)
    })).slice(0, 16);
  }, [processedProducts]);

  const newArrivals = useMemo(() => {
    const sorted = [...processedProducts].sort((a, b) => new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime());
    return sorted.slice(0, 16);
  }, [processedProducts]);

  const totalBasketCount = basket.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark ' : ''}bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200`}>
      {/* TOP ANNOUNCEMENT BANNER */}
      {showAnnouncementBar && (
        <aside 
          aria-label={isTr ? "Duyuru ve Kampanyalar" : "Announcements"}
          className="relative z-50 text-white text-xs font-bold py-2 px-4 text-center shadow-xs flex items-center justify-center gap-2 transition-all"
          style={{ backgroundColor: accentColor }}
        >
          <span>{announcementText}</span>
        </aside>
      )}

      {/* CINEMATIC NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/90 dark:border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between transition-all shadow-xs dark:shadow-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedCategory('all'); setSelectedBadge('all'); }}>
            {storeLogo ? (
              <img 
                src={storeLogo} 
                alt={storeName} 
                referrerPolicy="no-referrer"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                className="h-9 w-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs" 
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-md">
                {storeName.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white">{storeName}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">Premium Mağaza</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            <button 
              onClick={() => { setActiveTab('home'); setSelectedCategory('all'); setSelectedBadge('all'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'home' && selectedCategory === 'all' && selectedBadge === 'all' ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white font-black' : 'hover:text-slate-900 dark:hover:text-white'}`}
            >
              {isTr ? "Keşfet" : "Explore"}
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedCategory('all'); setSelectedBadge('all'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'catalog' && selectedCategory === 'all' && selectedBadge === 'all' ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white font-black' : 'hover:text-slate-900 dark:hover:text-white'}`}
            >
              {isTr ? "Tüm Ürünler" : "All Products"}
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedBadge('bestseller'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedBadge === 'bestseller' ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white font-black' : 'hover:text-slate-900 dark:hover:text-white'}`}
            >
              {isTr ? "Çok Satanlar" : "Bestsellers"}
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedBadge('discount'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedBadge === 'discount' ? 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white font-black' : 'hover:text-slate-900 dark:hover:text-white'}`}
            >
              {isTr ? "Fırsatlar" : "Deals"}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* MOBILE SEARCH TOGGLE BUTTON */}
          <button 
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="sm:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-2xs"
            title={isTr ? "Ürün Ara" : "Search"}
          >
            <Search className="h-4 w-4" />
          </button>
          
          {/* DESKTOP SEARCH BAR */}
          <div className="relative hidden sm:block w-52 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={isTr ? "Ürün, kategori veya etiket ara..." : "Search products, tags..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab === 'home' && e.target.value.trim()) setActiveTab('catalog');
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* THEME TOGGLE (SUN / MOON) */}
          {showThemeToggle && (
            <button
              type="button"
              onClick={() => {
                if (onToggleTheme) onToggleTheme();
                else if (setTheme) setTheme(theme === 'dark' ? 'light' : 'dark');
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-amber-400 rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer shadow-2xs"
              title={theme === 'dark' ? (isTr ? "Açık Moda Geç" : "Switch to Light Mode") : (isTr ? "Koyu Moda Geç" : "Switch to Dark Mode")}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* SINGLE UNIFIED CONTACT BUTTON */}
          <button
            type="button"
            onClick={() => {
              const footer = document.getElementById('store-footer');
              if (footer) footer.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title={isTr ? "İletişim, Adres & Çalışma Saatleri" : "Contact, Address & Hours"}
          >
            <PhoneCall className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <span className="hidden xl:inline">{isTr ? "İletişim" : "Contact"}</span>
          </button>

          {/* BASKET BTN */}
          <button
            type="button"
            onClick={() => onCheckout()}
            className="relative px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">{isTr ? "Sepetim" : "Cart"}</span>
            {totalBasketCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                {totalBasketCount}
              </span>
            )}
          </button>

          {/* USER PROFILE */}
          <button
            type="button"
            onClick={() => {
              if (customer) onOpenProfile('profile');
              else setShowAuthModal(true);
            }}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
            title={customer ? (customer.name || "Profilim") : "Giriş Yap"}
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* COLLAPSIBLE MOBILE SEARCH BAR */}
      {isMobileSearchOpen && (
        <div className="sm:hidden px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 transition-all">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder={isTr ? "Ürün veya marka ara..." : "Search products, brands..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab === 'home' && e.target.value.trim()) setActiveTab('catalog');
              }}
              className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button 
            type="button"
            onClick={() => setIsMobileSearchOpen(false)} 
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2 py-1 cursor-pointer"
          >
            {isTr ? "Kapat" : "Close"}
          </button>
        </div>
      )}

      {/* MOBILE HORIZONTAL CHIP FILTER SCROLLER */}
      <div className="md:hidden overflow-x-auto no-scrollbar px-3 py-2 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 shadow-2xs">
        <button 
          type="button"
          onClick={() => { setActiveTab('home'); setSelectedCategory('all'); setSelectedBadge('all'); }} 
          className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'home' && selectedCategory === 'all' && selectedBadge === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>{isTr ? "Keşfet" : "Explore"}</span>
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('catalog'); setSelectedCategory('all'); setSelectedBadge('all'); }} 
          className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${activeTab === 'catalog' && selectedCategory === 'all' && selectedBadge === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
        >
          {isTr ? "Tüm Ürünler" : "All"}
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('catalog'); setSelectedBadge('bestseller'); }} 
          className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${selectedBadge === 'bestseller' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
        >
          <Flame className="h-3.5 w-3.5 text-amber-500" />
          <span>{isTr ? "Çok Satanlar" : "Bestsellers"}</span>
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('catalog'); setSelectedBadge('discount'); }} 
          className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${selectedBadge === 'discount' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
        >
          <Tag className="h-3.5 w-3.5 text-rose-400" />
          <span>{isTr ? "Fırsatlar" : "Deals"}</span>
        </button>
        {categories.map(cat => (
          <button 
            key={cat} 
            type="button"
            onClick={() => { setSelectedCategory(cat); setActiveTab('catalog'); }} 
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer ${selectedCategory === cat && activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* MAIN VIEW CONTENT */}
      {activeTab === 'home' && !searchQuery ? (
        <div className="space-y-8 pb-20 md:pb-12">
          {/* MINIMALIST ILLUMINATED HERO SHOWCASE BANNER */}
          {showHero && currentHero && (
            <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6">
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50/90 via-indigo-50/30 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl p-5 sm:p-7 md:p-9 min-h-[260px] sm:min-h-[300px] flex flex-col md:flex-row items-center justify-between gap-6 group transition-colors duration-200">
                {/* Luminous Ambient Background Glow & Atmospheric Blurred Photo Backdrop */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
                  <img 
                    src={getProductImageUrl(currentHero)} 
                    alt="" 
                    className="absolute -right-16 -bottom-16 w-[420px] h-[420px] object-cover opacity-20 dark:opacity-25 blur-3xl filter saturate-200 transform scale-125"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-blue-300/20 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-300/15 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent dark:from-slate-950/95 dark:via-slate-900/80 dark:to-transparent" />
                </div>

                {/* LEFT CONTENT */}
                <div className="relative z-10 max-w-2xl space-y-3 w-full">
                  {showHeroBadges && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-3 w-3" />
                        {isTr ? "Öne Çıkan Ürün" : "Featured Product"}
                      </span>
                      {currentHero.brand && (
                        <span className="px-2 py-0.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 rounded-md font-bold text-[9px] border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {currentHero.brand}
                        </span>
                      )}
                      {currentHero.category && (
                        <span className="px-2 py-0.5 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 rounded-md font-bold text-[9px] border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {currentHero.category}
                        </span>
                      )}
                      {getLabels(currentHero.labels || (currentHero as any).tags || (currentHero as any).badges).slice(0, 2).map((lbl, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 rounded-md font-bold text-[9px] border border-indigo-200 dark:border-indigo-700/60 inline-flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-300" />
                          <span>{lbl.replace(/^[🔥⭐🏷️✨📦]+\s*/, '')}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-xs line-clamp-2">
                    {currentHero.name}
                  </h1>

                  {(() => {
                    const customFallback = (netflixConfig?.hero_default_description || "").trim();
                    const desc = (currentHero.description || "").trim();
                    const displayDesc = desc || customFallback;
                    
                    if (displayDesc) {
                      return (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xl font-normal leading-relaxed">
                          {displayDesc}
                        </p>
                      );
                    }

                    if (currentHero.brand || currentHero.category) {
                      return (
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xl font-medium">
                          {[currentHero.brand, currentHero.category, (currentHero as any).sub_category].filter(Boolean).join(' • ')}
                        </p>
                      );
                    }

                    return null;
                  })()}

                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400">
                        ₺{(currentHero.price || 0).toLocaleString('tr-TR')}
                      </span>
                      {currentHero.old_price && currentHero.old_price > currentHero.price && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                          ₺{currentHero.old_price.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${
                      getProductStockCount(currentHero) > 0 
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80" 
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80"
                    }`}>
                      {getProductStockCount(currentHero) > 0 ? `${isTr ? "Stokta" : "In Stock"}: ${getProductStockCount(currentHero)} ${isTr ? "Adet" : "Pcs"}` : (isTr ? "Tükendi" : "Out of Stock")}
                    </span>

                    <button
                      type="button"
                      onClick={() => onViewProduct(currentHero, products)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>{isTr ? "Hemen İncele" : "View Details"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => addToBasket(currentHero)}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-700 dark:text-white dark:border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{isTr ? "Sepete Ekle" : "Add to Cart"}</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT CRISP PRODUCT IMAGE SHOWCASE */}
                <div className="relative z-10 shrink-0 w-52 sm:w-64 md:w-80 h-48 sm:h-56 md:h-64 flex items-center justify-center p-2">
                  <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 dark:border-slate-700/80 flex items-center justify-center p-4 shadow-xl dark:shadow-2xl overflow-hidden group/img transition-all duration-300">
                    <img 
                      src={getProductImageUrl(currentHero)} 
                      alt={currentHero.name}
                      className="max-w-full max-h-full object-contain filter brightness-105 contrast-105 drop-shadow-md transform transition-transform duration-500 group-hover/img:scale-105"
                      loading="eager"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const originalSrc = getProductImageUrl(currentHero);
                        if (!target.dataset.fallback && originalSrc) {
                          if (originalSrc.startsWith('/api/storage/') || originalSrc.startsWith('uploads/')) {
                            target.dataset.fallback = 'relative';
                            target.src = `${window.location.origin}${originalSrc.startsWith('/') ? '' : '/'}${originalSrc}?v=${Date.now()}`;
                          } else if (originalSrc.startsWith('http') && !originalSrc.includes('/api/proxy-image')) {
                            target.dataset.fallback = 'proxy';
                            target.src = `/api/proxy-image?url=${encodeURIComponent(originalSrc)}`;
                          } else {
                            target.onerror = null;
                            target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
                          }
                        } else {
                          target.onerror = null;
                          target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
                        }
                      }}
                    />
                  </div>
                </div>

                {/* HERO SLIDER DOTS */}
                {heroProducts.length > 1 && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-800">
                    {heroProducts.map((_, hIdx) => (
                      <button
                        key={hIdx}
                        type="button"
                        onClick={() => setHeroIndex(hIdx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          heroIndex === hIdx ? "w-4 bg-blue-500 shadow-xs" : "w-1.5 bg-white/30 hover:bg-white/60"
                        }`}
                        title={`Ürün ${hIdx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NETFLIX ROWS */}
          <div className="space-y-10 px-4 sm:px-8 max-w-7xl mx-auto">
            {/* ROW 1: ÇOK SATANLAR */}
            {showBestsellers && bestsellerProducts.length > 0 && (
              <NetflixRow 
                title={bestsellersTitle}
                products={bestsellerProducts}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                onShowAll={() => { setSelectedBadge("bestseller"); setActiveTab("catalog"); }}
                enableHoverZoom={enableHoverZoom}
                showQuickAddCart={showQuickAddCart}
                showStockBadge={showStockBadge}
                showOldPrice={showOldPrice}
              />
            )}

            {/* ROW 2: ÖNE ÇIKANLAR */}
            {showFeatured && featuredProducts.length > 0 && (
              <NetflixRow 
                title={featuredTitle}
                products={featuredProducts}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                onShowAll={() => { setSelectedBadge("featured"); setActiveTab("catalog"); }}
                enableHoverZoom={enableHoverZoom}
                showQuickAddCart={showQuickAddCart}
                showStockBadge={showStockBadge}
                showOldPrice={showOldPrice}
              />
            )}

            {/* ROW 3: FIRSATLAR & İNDİRİMLER */}
            {showDiscounted && discountedProducts.length > 0 && (
              <NetflixRow 
                title={discountedTitle}
                products={discountedProducts}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                onShowAll={() => { setSelectedBadge("discount"); setActiveTab("catalog"); }}
                enableHoverZoom={enableHoverZoom}
                showQuickAddCart={showQuickAddCart}
                showStockBadge={showStockBadge}
                showOldPrice={showOldPrice}
              />
            )}

            {/* ROW 4: YENİ GELENLER */}
            {showNewArrivals && newArrivals.length > 0 && (
              <NetflixRow 
                title={newArrivalsTitle}
                products={newArrivals}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                onShowAll={() => { setSelectedBadge("new"); setActiveTab("catalog"); }}
                enableHoverZoom={enableHoverZoom}
                showQuickAddCart={showQuickAddCart}
                showStockBadge={showStockBadge}
                showOldPrice={showOldPrice}
              />
            )}

            {/* DYNAMIC CATEGORY ROWS (ALL DISTINCT CATEGORIES) */}
            {showCategoryRows && categories.map(catName => {
              const catItems = products.filter(p => p.category === catName || p.category_2 === catName);
              if (catItems.length === 0) return null;
              return (
                <NetflixRow
                  key={catName}
                  title={catName}
                  products={catItems}
                  onViewProduct={onViewProduct}
                  addToBasket={addToBasket}
                  onShowAll={() => { setSelectedCategory(catName); setActiveTab("catalog"); }}
                  enableHoverZoom={enableHoverZoom}
                  showQuickAddCart={showQuickAddCart}
                  showStockBadge={showStockBadge}
                  showOldPrice={showOldPrice}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* FULL CATALOG / SEARCH VIEW */
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
          {/* Back to Home & Active Collection Guidance Banner (Rule 26) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("home");
                  setSelectedCategory("all");
                  setSelectedSubCategory("all");
                  setSelectedBrand("all");
                  setSelectedBadge("all");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{isTr ? "Ana Sayfaya Dön (Keşfet)" : "Back to Home"}</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>/</span>
                {selectedBadge === 'bestseller' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800/80 font-black">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    <span>{isTr ? "Çok Satanlar & Popüler Ürünler" : "Bestsellers & Popular"}</span>
                  </span>
                ) : selectedBadge === 'featured' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800/80 font-black">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                    <span>{isTr ? "Öne Çıkan Koleksiyon" : "Featured Collection"}</span>
                  </span>
                ) : selectedBadge === 'discount' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800/80 font-black">
                    <Tag className="h-3.5 w-3.5 text-rose-500" />
                    <span>{isTr ? "Fırsatlar & Kampanyalı Ürünler" : "Deals & Special Offers"}</span>
                  </span>
                ) : selectedBadge === 'new' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800/80 font-black">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{isTr ? "Yeni Gelen Ürünler" : "New Arrivals"}</span>
                  </span>
                ) : selectedCategory !== 'all' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg font-black">
                    <Package className="h-3.5 w-3.5 text-blue-500" />
                    <span>{selectedCategory}</span>
                  </span>
                ) : (
                  <span className="text-slate-900 dark:text-white font-black">{isTr ? "Tüm Ürün Kataloğu" : "All Products"}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Package className="h-4 w-4 text-blue-500" />
              <span>({finalProductsList.length} {isTr ? "ürün listeleniyor" : "products listed"})</span>
            </div>
          </div>

          {/* FILTER CHIPS */}
          <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">{isTr ? "Tüm Kategoriler" : "All Categories"}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {subCategories.length > 0 && (
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="all">{isTr ? "Tüm Alt Kategoriler" : "All Subcategories"}</option>
                {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">{isTr ? "Tüm Markalar" : "All Brands"}</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="all">{isTr ? "Tüm Etiketler" : "All Badges"}</option>
              <option value="bestseller">{isTr ? "Çok Satan" : "Bestseller"}</option>
              <option value="featured">{isTr ? "Öne Çıkan" : "Featured"}</option>
              <option value="discount">{isTr ? "İndirimli" : "Discounted"}</option>
              <option value="new">{isTr ? "Yeni Gelenler" : "New Arrivals"}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="default">{isTr ? "Sıralama: Varsayılan" : "Sort: Default"}</option>
              <option value="priceAsc">{isTr ? "Fiyat: Ucuzdan Pahalıya" : "Price: Low to High"}</option>
              <option value="priceDesc">{isTr ? "Fiyat: Pahalıdan Ucuza" : "Price: High to Low"}</option>
            </select>
          </div>

          {/* GRID OF PRODUCTS */}
          {finalProductsList.length === 0 ? (
            <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <Package className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{isTr ? "Aradığınız kriterlere uygun ürün bulunamadı." : "No products found matching your criteria."}</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); setSelectedBrand('all'); setSelectedBadge('all'); setSearchQuery(''); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isTr ? "Filtreleri Sıfırla" : "Reset Filters"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {finalProductsList.map(product => (
                <NetflixProductCard
                  key={product.id}
                  product={product}
                  onViewProduct={onViewProduct}
                  addToBasket={addToBasket}
                  allProducts={finalProductsList}
                  enableHoverZoom={enableHoverZoom}
                  showQuickAddCart={showQuickAddCart}
                  showStockBadge={showStockBadge}
                  showOldPrice={showOldPrice}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <StoreFooter 
        store={store} 
        lang={lang} 
        setShowAboutModal={setShowAboutModal} 
        setShowStoreLocatorModal={setShowStoreLocatorModal} 
      />

      {/* MOBILE MODERN BOTTOM APP BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 px-3 py-2 flex items-center justify-around shadow-2xl pb-safe">
        <button 
          type="button"
          onClick={() => { setActiveTab('home'); setSelectedCategory('all'); setSelectedBadge('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${activeTab === 'home' && selectedCategory === 'all' && selectedBadge === 'all' ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <Sparkles className="h-4.5 w-4.5" />
          <span className="text-[10px]">{isTr ? "Keşfet" : "Explore"}</span>
        </button>
        <button 
          type="button"
          onClick={() => { setActiveTab('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${activeTab === 'catalog' ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <Package className="h-4.5 w-4.5" />
          <span className="text-[10px]">{isTr ? "Ürünler" : "Catalog"}</span>
        </button>
        <button 
          type="button"
          onClick={() => onCheckout()}
          className="relative flex flex-col items-center gap-0.5 cursor-pointer transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <div className="relative">
            <ShoppingBag className="h-4.5 w-4.5" />
            {totalBasketCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {totalBasketCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">{isTr ? "Sepetim" : "Cart"}</span>
        </button>
        <button 
          type="button"
          onClick={() => {
            const footer = document.getElementById('store-footer');
            if (footer) footer.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <PhoneCall className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
          <span className="text-[10px]">{isTr ? "İletişim" : "Contact"}</span>
        </button>
        <button 
          type="button"
          onClick={() => {
            if (customer) onOpenProfile('profile');
            else setShowAuthModal(true);
          }}
          className="flex flex-col items-center gap-0.5 cursor-pointer transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <User className="h-4.5 w-4.5" />
          <span className="text-[10px]">{customer ? (customer.name?.split(' ')[0] || (isTr ? "Hesabım" : "Profile")) : (isTr ? "Giriş" : "Login")}</span>
        </button>
      </nav>
    </div>
  );
};

interface NetflixRowProps {
  title: string;
  products: Product[];
  onViewProduct: (product: Product, rowProducts: Product[]) => void;
  addToBasket: (product: Product) => void;
  onShowAll?: () => void;
  enableHoverZoom?: boolean;
  showQuickAddCart?: boolean;
  showStockBadge?: boolean;
  showOldPrice?: boolean;
}

const NetflixRow: React.FC<NetflixRowProps> = ({ 
  title, 
  products, 
  onViewProduct, 
  addToBasket, 
  onShowAll,
  enableHoverZoom = true,
  showQuickAddCart = true,
  showStockBadge = true,
  showOldPrice = true
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const cleanTitle = title.replace(/^[🔥⭐🏷️✨📦]+\s*/, '').trim();

  const getRowIcon = (raw: string) => {
    const lower = raw.toLowerCase();
    if (lower.includes("satan") || lower.includes("bestseller") || lower.includes("popüler") || lower.includes("popular")) {
      return <Flame className="h-4.5 w-4.5 text-amber-500 shrink-0" />;
    }
    if (lower.includes("öne") || lower.includes("one") || lower.includes("featured") || lower.includes("koleksiyon")) {
      return <Sparkles className="h-4.5 w-4.5 text-blue-500 shrink-0" />;
    }
    if (lower.includes("fırsat") || lower.includes("firsat") || lower.includes("indirim") || lower.includes("kampanya") || lower.includes("offer") || lower.includes("deal")) {
      return <Tag className="h-4.5 w-4.5 text-rose-500 shrink-0" />;
    }
    if (lower.includes("yeni") || lower.includes("new") || lower.includes("arrival")) {
      return <Clock className="h-4.5 w-4.5 text-indigo-500 shrink-0" />;
    }
    return <Package className="h-4.5 w-4.5 text-blue-500 shrink-0" />;
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-3 relative group">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          {getRowIcon(title)}
          <span>{cleanTitle}</span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 rounded-md">
            {products.length} Ürün
          </span>
        </h2>
        {onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Tümünü Gör</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-20 w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl cursor-pointer hover:bg-blue-600 hover:text-white hover:border-blue-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div 
          ref={rowRef}
          className="flex items-stretch gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map(product => (
            <div key={product.id} className="w-48 sm:w-56 shrink-0 snap-start flex">
              <NetflixProductCard
                product={product}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                allProducts={products}
                enableHoverZoom={enableHoverZoom}
                showQuickAddCart={showQuickAddCart}
                showStockBadge={showStockBadge}
                showOldPrice={showOldPrice}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-20 w-10 h-10 rounded-full bg-white/95 dark:bg-slate-900/90 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl cursor-pointer hover:bg-blue-600 hover:text-white hover:border-blue-600"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

interface NetflixProductCardProps {
  product: Product;
  onViewProduct: (product: Product, rowProducts: Product[]) => void;
  addToBasket: (product: Product) => void;
  allProducts: Product[];
  enableHoverZoom?: boolean;
  showQuickAddCart?: boolean;
  showStockBadge?: boolean;
  showOldPrice?: boolean;
}

const NetflixProductCard: React.FC<NetflixProductCardProps> = ({ 
  product, 
  onViewProduct, 
  addToBasket, 
  allProducts,
  enableHoverZoom = true,
  showQuickAddCart = true,
  showStockBadge = true,
  showOldPrice = true
}) => {
  const coverImg = getProductImageUrl(product);
  const stockCount = getProductStockCount(product);
  const isOutOfStock = stockCount <= 0 && (product as any).is_sellable !== true && (product as any).allow_backorder !== true;

  return (
    <motion.div
      whileHover={enableHoverZoom ? { y: -6, scale: 1.02 } : { y: -2 }}
      transition={{ duration: 0.2 }}
      className="group bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md dark:shadow-none flex flex-col justify-between w-full h-full cursor-pointer relative transition-all"
      onClick={() => onViewProduct(product, allProducts)}
    >
      <div className="relative aspect-[4/3] sm:aspect-[1/1] overflow-hidden bg-white dark:bg-slate-950 flex items-center justify-center p-2.5">
        <img
          src={coverImg}
          alt={product.name}
          className="max-w-full max-h-full object-contain filter group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.fallback && coverImg) {
              if (coverImg.startsWith('/api/storage/') || coverImg.startsWith('uploads/')) {
                target.dataset.fallback = 'relative';
                target.src = `${window.location.origin}${coverImg.startsWith('/') ? '' : '/'}${coverImg}?v=${Date.now()}`;
              } else if (coverImg.startsWith('http') && !coverImg.includes('/api/proxy-image')) {
                target.dataset.fallback = 'proxy';
                target.src = `/api/proxy-image?url=${encodeURIComponent(coverImg)}`;
              } else {
                target.onerror = null;
                target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
              }
            } else {
              target.onerror = null;
              target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 dark:from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* STOCK BADGE */}
        {showStockBadge && (
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
            {isOutOfStock ? (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                Tükendi
              </span>
            ) : stockCount > 0 && stockCount <= 3 ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                Son {stockCount} Adet
              </span>
            ) : null}
          </div>
        )}
      </div>

      <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {product.brand && (
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              {product.brand}
            </span>
          )}
          <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors leading-snug">
            {product.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ₺{(product.price || 0).toLocaleString('tr-TR')}
              </span>
              {showOldPrice && product.old_price && product.old_price > product.price && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">
                  ₺{product.old_price.toLocaleString('tr-TR')}
                </span>
              )}
            </div>

            {/* SINGLE MINI CART ICON BUTTON */}
            {showQuickAddCart && !isOutOfStock && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToBasket(product);
                }}
                className="p-1.5 bg-slate-100 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 hover:text-white dark:text-slate-300 dark:hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer flex items-center justify-center"
                title="Sepete Ekle"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

