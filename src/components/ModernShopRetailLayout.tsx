import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag, 
  Search, 
  User, 
  Heart, 
  SlidersHorizontal, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Lock, 
  ChevronRight, 
  Menu, 
  X, 
  ArrowRight,
  Eye,
  Store as StoreIcon,
  Phone,
  MessageCircle,
  Clock,
  Compass,
  Grid3X3,
  Grid2X2,
  Package
} from "lucide-react";
import { Product, Store as StoreInfo } from "../types";
import { DEFAULT_SHOP_THEME, ShopThemeConfig } from "../utils/shopThemePresets";
import { getLabels } from "../utils/showcase";
import { ShopRetailProductCard } from "./showcase/ShopRetailProductCard";
import { ShopDrawerCart } from "./showcase/ShopDrawerCart";
import { ShopFilterSidebar, ShopFilterState } from "./showcase/ShopFilterSidebar";
import { ShopStoryViewerModal } from "./showcase/ShopStoryViewerModal";

interface ModernShopRetailLayoutProps {
  store: StoreInfo;
  products: Product[];
  onViewProduct: (p: Product) => void;
  addToBasket: (p: any) => void;
  basket: any[];
  setBasket: React.Dispatch<React.SetStateAction<any[]>>;
  basketTotal: number;
  basketSubtotal: number;
  basketShippingTotal: number;
  onCheckout: () => void;
  lang: string;
  t: any;
  setShowAboutModal?: (val: boolean) => void;
  setShowStoreLocatorModal?: (val: boolean) => void;
  setShowAuthModal?: (val: boolean) => void;
}

export const ModernShopRetailLayout: React.FC<ModernShopRetailLayoutProps> = ({
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
  setShowAboutModal,
  setShowStoreLocatorModal,
  setShowAuthModal
}) => {
  // 1. Theme Configuration
  const themeConfig: ShopThemeConfig = useMemo(() => {
    const brandingObj = (store.branding as any) || {};
    const layoutObj = brandingObj.page_layout_settings || (store as any).page_layout_settings || {};
    const rawConfig = brandingObj.theme_config || layoutObj.theme_config || (store as any).theme_config || {};

    let base: ShopThemeConfig = { ...DEFAULT_SHOP_THEME };
    if (typeof rawConfig === "string") {
      try {
        const parsed = JSON.parse(rawConfig);
        base = { ...DEFAULT_SHOP_THEME, ...parsed };
      } catch (e) {}
    } else if (rawConfig && typeof rawConfig === "object") {
      base = { ...DEFAULT_SHOP_THEME, ...rawConfig };
    }

    // Hero Banner visibility
    if (brandingObj.show_hero_banner !== undefined) base.show_hero_banner = Boolean(brandingObj.show_hero_banner);
    else if (layoutObj.show_hero_banner !== undefined) base.show_hero_banner = Boolean(layoutObj.show_hero_banner);
    else if ((store as any).show_hero_banner !== undefined) base.show_hero_banner = Boolean((store as any).show_hero_banner);
    else if (rawConfig?.show_hero_banner !== undefined) base.show_hero_banner = Boolean(rawConfig.show_hero_banner);

    // Story Ribbon visibility
    if (brandingObj.show_story_ribbon !== undefined) base.show_story_ribbon = Boolean(brandingObj.show_story_ribbon);
    else if (layoutObj.show_story_ribbon !== undefined) base.show_story_ribbon = Boolean(layoutObj.show_story_ribbon);
    else if ((store as any).show_story_ribbon !== undefined) base.show_story_ribbon = Boolean((store as any).show_story_ribbon);
    else if (rawConfig?.show_story_ribbon !== undefined) base.show_story_ribbon = Boolean(rawConfig.show_story_ribbon);

    // Bento Grid visibility
    if (brandingObj.show_bento_grid !== undefined) base.show_bento_grid = Boolean(brandingObj.show_bento_grid);
    else if (layoutObj.show_bento_grid !== undefined) base.show_bento_grid = Boolean(layoutObj.show_bento_grid);
    else if ((store as any).show_bento_grid !== undefined) base.show_bento_grid = Boolean((store as any).show_bento_grid);
    else if (rawConfig?.show_bento_grid !== undefined) base.show_bento_grid = Boolean(rawConfig.show_bento_grid);

    // Announcement Bar visibility
    if (brandingObj.show_announcement_bar !== undefined) base.show_announcement_bar = Boolean(brandingObj.show_announcement_bar);
    else if (layoutObj.show_announcement_bar !== undefined) base.show_announcement_bar = Boolean(layoutObj.show_announcement_bar);
    else if (layoutObj.announcement_bar !== undefined) base.show_announcement_bar = Boolean(layoutObj.announcement_bar);
    else if ((store as any).show_announcement_bar !== undefined) base.show_announcement_bar = Boolean((store as any).show_announcement_bar);
    else if (rawConfig?.show_announcement_bar !== undefined) base.show_announcement_bar = Boolean(rawConfig.show_announcement_bar);

    // Announcement Text
    if (brandingObj.announcement_text !== undefined) base.announcement_text = brandingObj.announcement_text;
    else if (layoutObj.announcement_text !== undefined) base.announcement_text = layoutObj.announcement_text;
    else if (rawConfig?.announcement_text !== undefined) base.announcement_text = rawConfig.announcement_text;
    else if ((store as any).announcement_text !== undefined) base.announcement_text = (store as any).announcement_text;

    // Colors & Atmosphere
    if (brandingObj.primary_color) base.primary_color = brandingObj.primary_color;
    else if (layoutObj.primary_color) base.primary_color = layoutObj.primary_color;
    else if ((store as any).primary_color) base.primary_color = (store as any).primary_color;

    if (brandingObj.accent_color) base.accent_color = brandingObj.accent_color;
    else if (layoutObj.accent_color) base.accent_color = layoutObj.accent_color;
    else if ((store as any).accent_color) base.accent_color = (store as any).accent_color;

    if (brandingObj.background_mode) base.background_mode = brandingObj.background_mode;
    else if (layoutObj.background_mode) base.background_mode = layoutObj.background_mode;

    // Product Card Design Properties
    if (brandingObj.card_style) base.card_style = brandingObj.card_style;
    else if (layoutObj.card_style) base.card_style = layoutObj.card_style;

    if (brandingObj.card_radius) base.card_radius = brandingObj.card_radius;
    else if (layoutObj.card_radius) base.card_radius = layoutObj.card_radius;

    if (brandingObj.card_aspect_ratio) base.card_aspect_ratio = brandingObj.card_aspect_ratio;
    else if (layoutObj.card_aspect_ratio) base.card_aspect_ratio = layoutObj.card_aspect_ratio;

    if (brandingObj.card_hover_effect) base.card_hover_effect = brandingObj.card_hover_effect;
    else if (layoutObj.card_hover_effect) base.card_hover_effect = layoutObj.card_hover_effect;

    // Content Arrays
    if (brandingObj.stories && Array.isArray(brandingObj.stories)) base.stories = brandingObj.stories;
    else if (layoutObj.stories && Array.isArray(layoutObj.stories)) base.stories = layoutObj.stories;
    else if (rawConfig?.stories && Array.isArray(rawConfig.stories)) base.stories = rawConfig.stories;

    if (brandingObj.bento_blocks !== undefined && Array.isArray(brandingObj.bento_blocks)) {
      base.bento_blocks = brandingObj.bento_blocks;
    } else if (layoutObj.bento_blocks !== undefined && Array.isArray(layoutObj.bento_blocks)) {
      base.bento_blocks = layoutObj.bento_blocks;
    } else if (rawConfig?.bento_blocks !== undefined && Array.isArray(rawConfig.bento_blocks)) {
      base.bento_blocks = rawConfig.bento_blocks;
    }

    if (brandingObj.trust_badges && Array.isArray(brandingObj.trust_badges)) base.trust_badges = brandingObj.trust_badges;
    else if (layoutObj.trust_badges && Array.isArray(layoutObj.trust_badges)) base.trust_badges = layoutObj.trust_badges;
    else if (rawConfig?.trust_badges && Array.isArray(rawConfig.trust_badges)) base.trust_badges = rawConfig.trust_badges;

    if (brandingObj.show_trust_badges !== undefined) base.show_trust_badges = Boolean(brandingObj.show_trust_badges);
    else if (layoutObj.show_trust_badges !== undefined) base.show_trust_badges = Boolean(layoutObj.show_trust_badges);

    if (brandingObj.featured_capsules_title) base.featured_capsules_title = brandingObj.featured_capsules_title;
    else if (layoutObj.featured_capsules_title) base.featured_capsules_title = layoutObj.featured_capsules_title;

    if (brandingObj.featured_capsules_subtitle) base.featured_capsules_subtitle = brandingObj.featured_capsules_subtitle;
    else if (layoutObj.featured_capsules_subtitle) base.featured_capsules_subtitle = layoutObj.featured_capsules_subtitle;

    return base;
  }, [store.branding, (store as any).page_layout_settings, (store as any).theme_config, (store as any).announcement_text, (store as any).primary_color, (store as any).accent_color]);

  // 2. State Management
  const [isDrawerCartOpen, setIsDrawerCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [gridColumns, setGridColumns] = useState<3 | 4>(4);
  const [wishlist, setWishlist] = useState<Set<string | number>>(new Set());

  // Filter State
  const [filters, setFilters] = useState<ShopFilterState>({
    search: "",
    category: null,
    subCategory: null,
    brand: null,
    color: null,
    size: null,
    selectedAttributes: {},
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
    onSaleOnly: false,
    bestsellerOnly: false,
    sortBy: "default"
  });

  const handleFilterChange = (key: keyof ShopFilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      category: null,
      subCategory: null,
      brand: null,
      color: null,
      size: null,
      selectedAttributes: {},
      minPrice: "",
      maxPrice: "",
      inStockOnly: false,
      onSaleOnly: false,
      bestsellerOnly: false,
      sortBy: "default"
    });
  };

  const toggleWishlist = (id: string | number) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 3. Computed Available Categories & Subcategories
  const availableCategories = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (p.is_web_sale === false) return;
      const cat = p.category;
      if (cat && cat.trim()) {
        map.set(cat.trim(), (map.get(cat.trim()) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [products]);

  const availableSubCategories = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (p.is_web_sale === false) return;
      if (filters.category && p.category !== filters.category && p.category_2 !== filters.category) {
        return;
      }
      const sub = p.sub_category || p.sub_category_2;
      if (sub && sub.trim()) {
        map.set(sub.trim(), (map.get(sub.trim()) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [products, filters.category]);

  // 4. Computed Products Filter
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    let result = products.filter((p) => {
      if (!p) return false;
      // Exclude explicitly disabled web products
      if (p.is_web_sale === false) return false;

      // Search Query
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchesName = (p.name || "").toLowerCase().includes(query);
        const matchesBrand = (p.brand || "").toLowerCase().includes(query);
        const matchesCategory = (p.category || "").toLowerCase().includes(query);
        const matchesSubCategory = (p.sub_category || "").toLowerCase().includes(query);
        const matchesBarcode = (p.barcode || "").toString().includes(query);
        if (!matchesName && !matchesBrand && !matchesCategory && !matchesSubCategory && !matchesBarcode) return false;
      }

      // Category
      if (filters.category && p.category !== filters.category && p.category_2 !== filters.category) return false;

      // Sub Category
      if (filters.subCategory && p.sub_category !== filters.subCategory && p.sub_category_2 !== filters.subCategory) return false;

      // Brand
      if (filters.brand && p.brand !== filters.brand) return false;

      // Min/Max Price
      const pPrice = Number(p.price) || 0;
      if (filters.minPrice && pPrice < Number(filters.minPrice)) return false;
      if (filters.maxPrice && pPrice > Number(filters.maxPrice)) return false;

      // In Stock
      if (filters.inStockOnly) {
        let vars: any[] = [];
        if (p.variants) {
          if (typeof p.variants === "string") {
            try { vars = JSON.parse(p.variants); } catch (e) { vars = []; }
          } else if (Array.isArray(p.variants)) {
            vars = p.variants;
          }
        }
        const totalStock = vars.length > 0 
          ? vars.reduce((sum, v) => sum + (Number(v.stock_quantity) || Number(v.stock) || 0), 0)
          : (Number(p.stock_quantity) || 0);
        if (totalStock <= 0) return false;
      }

      // On Sale
      if (filters.onSaleOnly) {
        const pLabels = getLabels(p.labels);
        const hasDiscount = pLabels.some((l: string) => l.includes("%") || l.toLowerCase().includes("indirim") || l.toLowerCase().includes("sale"));
        if (!hasDiscount) return false;
      }

      // Bestseller
      if (filters.bestsellerOnly) {
        const pLabels = getLabels(p.labels);
        const isBest = p.is_bestseller || pLabels.some((l: string) => l.toLowerCase().includes("bestseller") || l.toLowerCase().includes("çoksatan"));
        if (!isBest) return false;
      }

      // Color Variant Filter
      if (filters.color) {
        let vars: any[] = [];
        if (p.variants) {
          if (typeof p.variants === "string") {
            try { vars = JSON.parse(p.variants); } catch (e) { vars = []; }
          } else if (Array.isArray(p.variants)) {
            vars = p.variants;
          }
        }
        const hasColor = Array.isArray(vars) && vars.some((v) => {
          if (!v) return false;
          const cName = v.color_name || (v.attributes ? (v.attributes['Renk'] || v.attributes['Color']) : undefined);
          return cName === filters.color;
        });
        if (!hasColor) return false;
      }

      // Size Variant Filter
      if (filters.size) {
        let vars: any[] = [];
        if (p.variants) {
          if (typeof p.variants === "string") {
            try { vars = JSON.parse(p.variants); } catch (e) { vars = []; }
          } else if (Array.isArray(p.variants)) {
            vars = p.variants;
          }
        }
        const hasSize = Array.isArray(vars) && vars.some((v) => {
          if (!v) return false;
          const sName = v.size || (v.attributes ? (v.attributes['Beden'] || v.attributes['Size'] || v.attributes['Kasa Çapı'] || v.attributes['Numara'] || v.attributes['Hafıza']) : undefined);
          return sName === filters.size;
        });
        if (!hasSize) return false;
      }

      // Dynamic Variant Attributes Filter
      if (filters.selectedAttributes && Object.keys(filters.selectedAttributes).length > 0) {
        let vars: any[] = [];
        if (p.variants) {
          if (typeof p.variants === "string") {
            try { vars = JSON.parse(p.variants); } catch (e) { vars = []; }
          } else if (Array.isArray(p.variants)) {
            vars = p.variants;
          }
        }
        const matchesAllAttrs = Object.entries(filters.selectedAttributes).every(([attrKey, attrVal]) => {
          return vars.some(v => v.attributes && v.attributes[attrKey] === attrVal);
        });
        if (!matchesAllAttrs) return false;
      }

      return true;
    });

    // Sorting
    if (filters.sortBy === "priceAsc") {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (filters.sortBy === "priceDesc") {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (filters.sortBy === "newest") {
      result.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    }

    return result;
  }, [products, filters]);

  const basketCount = basket.reduce((sum, item) => sum + item.quantity, 0);

  // Active Banners List
  const activeBanners = useMemo(() => {
    const brandingObj = (store.branding as any) || {};
    const bList = brandingObj.banners;
    if (Array.isArray(bList)) {
      return bList;
    }
    const storeBanners = (store as any).banners;
    if (Array.isArray(storeBanners)) {
      return storeBanners;
    }
    return [
      {
        id: "default-1",
        image_url: brandingObj.hero_image_url || store.hero_image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=85",
        title: brandingObj.hero_title || store.hero_title || store.name,
        subtitle: brandingObj.hero_subtitle || store.hero_subtitle || (lang === "tr" ? "Özenle seçilmiş en yeni koleksiyonlar ve özel tasarım ürünler." : "Carefully curated collections and iconic designs."),
        button_text: lang === "tr" ? "Koleksiyonu İncele" : "Explore Collection",
        button_link: "#catalog",
        text_position: "center",
      }
    ];
  }, [store, lang]);

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[activeSlide] || activeBanners[0];
  const heroImage = currentBanner?.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=85";
  const heroTitle = currentBanner?.title || store.name;
  const heroSubtitle = currentBanner?.subtitle || (lang === "tr" ? "Özenle seçilmiş en yeni koleksiyonlar ve özel tasarım ürünler." : "Carefully curated collections and iconic designs.");

  const bgModeClass = 
    themeConfig.background_mode === "warm" 
      ? "bg-[#faf7f2] text-slate-900" 
      : themeConfig.background_mode === "dark" 
      ? "bg-slate-950 text-white" 
      : "bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100";

  return (
    <div className={`min-h-screen ${bgModeClass} font-sans selection:bg-indigo-500 selection:text-white pb-24 md:pb-12`}>
      {/* 1. Announcement Bar */}
      {themeConfig.show_announcement_bar && (
        <div 
          style={{ backgroundColor: themeConfig.primary_color || "#0f172a" }}
          className="text-white text-xs py-2.5 px-4 overflow-hidden border-b border-white/10 shadow-xs"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 overflow-hidden">
              {themeConfig.announcement_marquee !== false ? (
                <div className="whitespace-nowrap animate-marquee flex items-center gap-8 text-[11px] font-extrabold tracking-wide uppercase">
                  <span>{themeConfig.announcement_text || "✨ 1.500 TL Üzeri Ücretsiz Kargo & 24 Saatte Hızlı Teslimat"}</span>
                  <span>•</span>
                  <span>%100 Orijinallik Garantisi</span>
                  <span>•</span>
                  <span>Koşulsuz 14 Gün İade</span>
                  <span>•</span>
                  <span>{store.name} Güvencesiyle</span>
                </div>
              ) : (
                <div className="text-center text-[11px] font-extrabold tracking-wide uppercase truncate">
                  {themeConfig.announcement_text || "✨ 1.500 TL Üzeri Ücretsiz Kargo & 24 Saatte Hızlı Teslimat"}
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-4 text-[11px] font-bold text-white/80 shrink-0">
              {setShowStoreLocatorModal && (
                <button
                  onClick={() => setShowStoreLocatorModal(true)}
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>{lang === "tr" ? "Mağazalarımız" : "Stores"}</span>
                </button>
              )}
              {store.phone && (
                <a href={`tel:${store.phone}`} className="hover:text-white transition-colors flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{store.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Minimalist Luxury Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu & Category Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Brand Logo or Name */}
            <a href="#top" className="flex items-center gap-3 group">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                    {store.name.slice(0, 1)}
                  </div>
                  <span className="text-lg sm:text-xl font-black tracking-tight text-slate-950 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {store.name}
                  </span>
                </div>
              )}
            </a>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-black tracking-wider uppercase text-slate-600 dark:text-slate-300">
              <a href="#catalog" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                {lang === "tr" ? "Koleksiyonlar" : "Collections"}
              </a>
              <button
                type="button"
                onClick={() => handleFilterChange("bestsellerOnly", true)}
                className="hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === "tr" ? "Çok Satanlar" : "Top Sellers"}</span>
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange("onSaleOnly", true)}
                className="hover:text-rose-600 transition-colors text-rose-600"
              >
                {lang === "tr" ? "Fırsatlar" : "Deals"}
              </button>
              {setShowAboutModal && (
                <button
                  type="button"
                  onClick={() => setShowAboutModal(true)}
                  className="hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  {lang === "tr" ? "Hikayemiz" : "About"}
                </button>
              )}
            </nav>
          </div>

          {/* Right: Actions (Search, Wishlist, User, Cart) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Input Bar (Expandable) */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <input
                type="text"
                placeholder={lang === "tr" ? "Ürün veya model ara..." : "Search catalog..."}
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Auth / Account */}
            {setShowAuthModal && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="p-2.5 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={lang === "tr" ? "Giriş Yap / Üye Ol" : "Account"}
              >
                <User className="w-5 h-5" />
              </button>
            )}

            {/* Drawer Cart Trigger */}
            <button
              onClick={() => setIsDrawerCartOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-full text-xs font-black shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === "tr" ? "Sepetim" : "Cart"}</span>
              <span className="px-1.5 py-0.5 bg-indigo-500 text-white rounded-full text-[10px] font-mono leading-none">
                {basketCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Dropdown Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden px-4 pb-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder={lang === "tr" ? "Model, marka veya ürün ara..." : "Search..."}
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 3. Story Highlights Ribbon (Instagram/Swatch format) */}
      {themeConfig.show_story_ribbon && themeConfig.stories && themeConfig.stories.length > 0 && (
        <section className="py-6 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
              {themeConfig.stories.map((story, idx) => (
                <div
                  key={story.id}
                  onClick={() => setSelectedStoryIndex(idx)}
                  className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group select-none"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-500 group-hover:scale-105 transition-transform duration-300 shadow-md">
                    <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-100">
                      <img
                        src={story.image_url}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 text-center max-w-[76px] truncate tracking-tight">
                    {story.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. High-Impact Hero Showcase */}
      {themeConfig.show_hero_banner && activeBanners.length > 0 && (
        themeConfig.hero_layout === "split" ? (
          <section className="relative bg-slate-900 text-white overflow-hidden py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black tracking-widest uppercase text-white border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "tr" ? "LOOKPRICE ÖZEL SEÇKİ" : "EXCLUSIVE CAPSULE"}</span>
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  {heroTitle}
                </h1>
                <p className="text-sm sm:text-base text-slate-300 max-w-xl font-medium leading-relaxed">
                  {heroSubtitle}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href={currentBanner?.button_link || "#catalog"}
                    className="px-8 py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-2xl hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <span>{currentBanner?.button_text || (lang === "tr" ? "Koleksiyonu İncele" : "Explore Collection")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange("onSaleOnly", true);
                      const el = document.getElementById("catalog");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-2xl backdrop-blur-md border border-white/20 transition-all"
                  >
                    {lang === "tr" ? "Fırsat Ürünleri" : "Special Deals"}
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 relative h-[360px] sm:h-[440px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src={heroImage}
                  alt={heroTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </div>
            </div>
          </section>
        ) : themeConfig.hero_layout === "editorial" ? (
          <section className="relative bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 py-16 sm:py-24 overflow-hidden">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
              <span className="text-[11px] font-black tracking-[0.3em] uppercase text-indigo-600 dark:text-indigo-400">
                {lang === "tr" ? "EDİTÖRÜN SEÇİMİ • YENİ SEZON" : "EDITORIAL CHOICE • NEW SEASON"}
              </span>
              <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-slate-950 dark:text-white leading-none">
                {heroTitle}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
                {heroSubtitle}
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <a
                  href={currentBanner?.button_link || "#catalog"}
                  className="px-8 py-3.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs uppercase tracking-widest rounded-full shadow-lg hover:opacity-90 transition-opacity"
                >
                  {currentBanner?.button_text || (lang === "tr" ? "Kataloğu Aç" : "View Catalog")}
                </a>
              </div>
            </div>
          </section>
        ) : (
          <section className="relative overflow-hidden bg-slate-900 text-white min-h-[460px] sm:min-h-[520px] flex items-center">
            {/* Background Image with Ambient Gradient */}
            <div className="absolute inset-0 z-0">
              <img
                src={heroImage}
                alt={heroTitle}
                className="w-full h-full object-cover object-center opacity-65 scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
            </div>

            {/* Multiple Slides Indicator Controls */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {activeBanners.map((_, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => setActiveSlide(sIdx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      sIdx === activeSlide ? "w-6 bg-white" : "bg-white/40 hover:bg-white/70"
                    }`}
                    aria-label={`Slide ${sIdx + 1}`}
                  />
                ))}
              </div>
            )}

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
              <div className={`max-w-2xl space-y-6 ${currentBanner?.text_position === "right" ? "ml-auto text-right" : currentBanner?.text_position === "center" ? "mx-auto text-center" : ""}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black tracking-widest uppercase text-white border border-white/15">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === "tr" ? "LOOKPRICE ÖZEL SEÇKİ" : "EXCLUSIVE CAPSULE"}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
                  {heroTitle}
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-xl font-medium leading-relaxed">
                  {heroSubtitle}
                </p>

                <div className={`flex flex-wrap items-center gap-4 pt-2 ${currentBanner?.text_position === "center" ? "justify-center" : currentBanner?.text_position === "right" ? "justify-end" : ""}`}>
                  <a
                    href={currentBanner?.button_link || "#catalog"}
                    className="px-8 py-4 bg-white text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-2xl hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <span>{currentBanner?.button_text || (lang === "tr" ? "Koleksiyonu İncele" : "Explore Collection")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange("onSaleOnly", true);
                      const el = document.getElementById("catalog");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-2xl backdrop-blur-md border border-white/20 transition-all"
                  >
                    {lang === "tr" ? "Fırsat Ürünleri" : "Special Deals"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )
      )}

      {/* 5. Bento Grid Showcase (Featured Blocks) */}
      {themeConfig.show_bento_grid && themeConfig.bento_blocks && themeConfig.bento_blocks.length > 0 && (
        <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                {themeConfig.featured_capsules_title || (lang === "tr" ? "ÖNE ÇIKAN KAPSÜLLER" : "FEATURED CAPSULES")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                {themeConfig.featured_capsules_subtitle || (lang === "tr" ? "Zamanın ve Tarzın Ötesinde" : "Timeless & Iconic")}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themeConfig.bento_blocks.map((bento, idx) => {
              const isLarge = idx === 0 || bento.size === "large";
              return (
                <div
                  key={bento.id}
                  className={`group relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800 min-h-[320px] ${
                    isLarge ? "md:col-span-2" : "md:col-span-1"
                  } flex flex-col justify-end p-8`}
                >
                  <img
                    src={bento.image_url}
                    alt={bento.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                  <div className="relative z-10 space-y-3 max-w-md">
                    {bento.badge && (
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20">
                        {bento.badge}
                      </span>
                    )}
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {bento.title}
                    </h3>
                    {bento.subtitle && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {bento.subtitle}
                      </p>
                    )}
                    <a
                      href={bento.link || "#catalog"}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-white hover:text-indigo-400 transition-colors uppercase tracking-wider pt-1"
                    >
                      <span>{bento.cta_text || (lang === "tr" ? "Keşfet" : "Explore")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Main Catalog & Dynamic Facet Filter Section */}
      <section id="catalog" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-64 shrink-0 sticky top-28 z-10">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar">
              <ShopFilterSidebar
                products={products}
                filterState={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                lang={lang}
                currency={store.currency || "TRY"}
              />
            </div>
          </div>

          {/* Product Grid & Controls */}
          <div className="flex-1 min-w-0">
            {/* Catalog Control Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 mb-6">
              {/* Product Count & Active Indicators */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-extrabold"
                >
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  <span>{lang === "tr" ? "Filtreler" : "Filters"}</span>
                </button>

                <span className="hidden sm:inline text-xs font-extrabold text-slate-500">
                  <strong className="text-slate-900 dark:text-white font-black">{filteredProducts.length}</strong> {lang === "tr" ? "ürün listelendi" : "products found"}
                </span>
              </div>

              {/* Sorting & Grid Layout Toggle */}
              <div className="flex items-center gap-3">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="default">{lang === "tr" ? "Önerilen Sıralama" : "Featured"}</option>
                  <option value="priceAsc">{lang === "tr" ? "Fiyat: Düşükten Yükseğe" : "Price: Low to High"}</option>
                  <option value="priceDesc">{lang === "tr" ? "Fiyat: Yüksekten Düşüğe" : "Price: High to Low"}</option>
                  <option value="newest">{lang === "tr" ? "En Yeniler" : "Newest Arrivals"}</option>
                </select>

                <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setGridColumns(3)}
                    className={`p-1.5 rounded-lg transition-colors ${gridColumns === 3 ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                    title="3 Sütun"
                  >
                    <Grid2X2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridColumns(4)}
                    className={`p-1.5 rounded-lg transition-colors ${gridColumns === 4 ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                    title="4 Sütun"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Category & Sub-Category Horizontal Selector */}
            {availableCategories.length > 1 && (
              <div className="hidden md:block mb-6 space-y-3">
                {/* Main Category Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange("category", null);
                      handleFilterChange("subCategory", null);
                    }}
                    className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      filters.category === null
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-400"
                    }`}
                  >
                    {lang === "tr" ? "Tüm Kategoriler" : "All Categories"}
                  </button>

                  {availableCategories.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        handleFilterChange("category", cat.name === filters.category ? null : cat.name);
                        handleFilterChange("subCategory", null);
                      }}
                      className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        filters.category === cat.name
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-slate-400"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">({cat.count})</span>
                    </button>
                  ))}
                </div>

                {/* Subcategory Pills Bar (When Subcategories exist) */}
                {availableSubCategories.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1 pl-1 no-scrollbar bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2 shrink-0">
                      {lang === "tr" ? "Alt Kategori:" : "Subcategory:"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFilterChange("subCategory", null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        filters.subCategory === null
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {lang === "tr" ? "Tümü" : "All"}
                    </button>

                    {availableSubCategories.map((sub) => (
                      <button
                        key={sub.name}
                        type="button"
                        onClick={() => handleFilterChange("subCategory", sub.name === filters.subCategory ? null : sub.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                          filters.subCategory === sub.name
                            ? "bg-indigo-600 text-white font-black shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:border-slate-400"
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span className="text-[10px] opacity-70 font-mono">({sub.count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Filter Tags */}
            {(filters.category || filters.subCategory || filters.brand || filters.color || filters.size || (filters.selectedAttributes && Object.keys(filters.selectedAttributes).length > 0) || filters.inStockOnly || filters.onSaleOnly || filters.bestsellerOnly) && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {filters.category && (
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span>{filters.category}</span>
                    <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => handleFilterChange("category", null)} />
                  </span>
                )}
                {filters.subCategory && (
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-100 border border-indigo-300 dark:border-indigo-700 rounded-full text-xs font-black flex items-center gap-1.5">
                    <span>{filters.subCategory}</span>
                    <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => handleFilterChange("subCategory", null)} />
                  </span>
                )}
                {filters.brand && (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span>{lang === "tr" ? "Marka: " : "Brand: "}{filters.brand}</span>
                    <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => handleFilterChange("brand", null)} />
                  </span>
                )}
                {filters.color && (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span>{lang === "tr" ? "Renk: " : "Color: "}{filters.color}</span>
                    <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => handleFilterChange("color", null)} />
                  </span>
                )}
                {filters.size && (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span>{lang === "tr" ? "Beden: " : "Size: "}{filters.size}</span>
                    <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => handleFilterChange("size", null)} />
                  </span>
                )}
                {filters.selectedAttributes && Object.entries(filters.selectedAttributes).map(([attrKey, attrVal]) => (
                  <span key={attrKey} className="px-3 py-1 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span>{attrKey}: {attrVal}</span>
                    <X
                      className="w-3.5 h-3.5 cursor-pointer"
                      onClick={() => {
                        const updated = { ...filters.selectedAttributes };
                        delete updated[attrKey];
                        handleFilterChange("selectedAttributes", updated);
                      }}
                    />
                  </span>
                ))}
                {filters.inStockOnly && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span>{lang === "tr" ? "Sadece Stoktakiler" : "In Stock"}</span>
                    <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => handleFilterChange("inStockOnly", false)} />
                  </span>
                )}
                {filters.onSaleOnly && (
                  <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span>{lang === "tr" ? "İndirimli Ürünler" : "On Sale"}</span>
                    <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => handleFilterChange("onSaleOnly", false)} />
                  </span>
                )}
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 underline underline-offset-2 ml-1 cursor-pointer"
                >
                  {lang === "tr" ? "Tümünü Temizle" : "Clear All"}
                </button>
              </div>
            )}

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="py-20 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                  <Package className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                  {lang === "tr" ? "Aradığınız kriterlere uygun ürün bulunamadı" : "No products match your criteria"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6">
                  {lang === "tr" ? "Filtreleri sıfırlayarak mağazamızdaki diğer ürünleri inceleyebilirsiniz." : "Try adjusting or clearing your filters to discover other items in our collection."}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-xs font-black hover:bg-slate-800 transition-colors"
                >
                  {lang === "tr" ? "Filtreleri Sıfırla" : "Reset Filters"}
                </button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  gridColumns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4"
                } gap-4 sm:gap-6`}
              >
                {filteredProducts.map((prod) => (
                  <ShopRetailProductCard
                    key={prod.id}
                    product={prod}
                    store={store}
                    themeConfig={themeConfig}
                    t={t}
                    lang={lang}
                    onView={onViewProduct}
                    addToBasket={(p) => {
                      addToBasket(p);
                      setIsDrawerCartOpen(true);
                    }}
                    isWishlisted={wishlist.has(prod.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 7. Trust Badges Section */}
      {themeConfig.show_trust_badges && themeConfig.trust_badges && (
        <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800 my-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {themeConfig.trust_badges.map((badge, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                    {idx === 0 && <ShieldCheck className="w-6 h-6" />}
                    {idx === 1 && <Truck className="w-6 h-6" />}
                    {idx === 2 && <RefreshCw className="w-6 h-6" />}
                    {idx === 3 && <Lock className="w-6 h-6" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {badge.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Slide-Over Drawer Cart */}
      <ShopDrawerCart
        isOpen={isDrawerCartOpen}
        onClose={() => setIsDrawerCartOpen(false)}
        basket={basket}
        setBasket={setBasket}
        basketTotal={basketTotal}
        basketSubtotal={basketSubtotal}
        basketShippingTotal={basketShippingTotal}
        store={store}
        lang={lang}
        t={t}
        onCheckout={() => {
          setIsDrawerCartOpen(false);
          onCheckout();
        }}
      />

      {/* 9. Story Viewer Modal */}
      {selectedStoryIndex !== null && themeConfig.stories && (
        <ShopStoryViewerModal
          isOpen={selectedStoryIndex !== null}
          onClose={() => setSelectedStoryIndex(null)}
          stories={themeConfig.stories}
          initialIndex={selectedStoryIndex}
          onSelectStoryLink={(link) => {
            const el = document.getElementById(link.replace("#", ""));
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}

      {/* 10. Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-[110] lg:hidden overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"
            >
              <ShopFilterSidebar
                products={products}
                filterState={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                lang={lang}
                currency={store.currency || "TRY"}
                isMobileDrawer
                onCloseMobile={() => setIsMobileFiltersOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. Mobile Bottom Navigation Dock */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 py-2 px-4 shadow-lg">
        <div className="flex items-center justify-around">
          <a
            href="#top"
            className="flex flex-col items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors p-1"
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-wider">{lang === "tr" ? "Vitrin" : "Home"}</span>
          </a>

          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors p-1"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-wider">{lang === "tr" ? "Filtrele" : "Filter"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerCartOpen(true)}
            className="relative flex flex-col items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors p-1"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              {basketCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                  {basketCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider">{lang === "tr" ? "Sepetim" : "Cart"}</span>
          </button>

          {setShowAuthModal && (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="flex flex-col items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors p-1"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider">{lang === "tr" ? "Hesap" : "Account"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
