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
  Layers,
  CheckCircle2,
  PhoneCall,
  MapPin
} from "lucide-react";
import { Product, Store as StoreInfo } from "../types";
import { StoreFooter } from "./showcase/StoreFooter";
import { getLabels } from "../utils/showcase";

export const getProductImageUrl = (p: Product): string => {
  if (!p) return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
  if (p.image_url && typeof p.image_url === "string" && p.image_url.trim()) return p.image_url.trim();
  if (p.cover_image && typeof p.cover_image === "string" && p.cover_image.trim()) return p.cover_image.trim();
  if (Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === "string" && p.images[0].trim()) {
    return p.images[0].trim();
  }
  if (typeof p.images === "string" && p.images.trim()) {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
        return String(parsed[0]).trim();
      }
    } catch (e) {
      if (p.images.startsWith("http") || p.images.startsWith("/")) return p.images.trim();
    }
  }
  const rawPhotos = (p as any).photos;
  if (Array.isArray(rawPhotos) && rawPhotos.length > 0 && rawPhotos[0]) {
    return String(rawPhotos[0]).trim();
  }
  return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
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
  setShowAuthModal
}) => {
  const isTr = lang === "tr";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedBadge, setSelectedBadge] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"home" | "catalog" | "bestsellers">("home");
  const [visibleCount, setVisibleCount] = useState<number>(30);

  // Reset visibleCount on filter change
  useEffect(() => {
    setVisibleCount(30);
  }, [searchQuery, selectedCategory, selectedSubCategory, selectedBrand, selectedBadge, activeTab]);

  const storeName = store?.branding?.store_name || store?.name || (isTr ? "Seçkin Mağaza" : "Elite Store");
  const storeLogo = store?.branding?.logo_url || store?.logo_url;

  // Extract distinct categories, subcategories, brands
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && typeof p.category === "string" && p.category.trim()) set.add(p.category.trim());
      if (p.category_2 && typeof p.category_2 === "string" && p.category_2.trim()) set.add(p.category_2.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  const subCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (selectedCategory === "all" || p.category === selectedCategory || p.category_2 === selectedCategory) {
        const sub = p.sub_category || (p as any).sub_category_2;
        if (sub && typeof sub === "string" && sub.trim()) set.add(sub.trim());
      }
    });
    return Array.from(set).sort();
  }, [products, selectedCategory]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand && typeof p.brand === "string" && p.brand.trim()) set.add(p.brand.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Featured / Cinematic Hero Products
  const heroProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      const isHeroTagged = labels.some(l => l.includes("one cikan") || l.includes("öne çıkan") || l.includes("featured") || l.includes("bestseller") || l.includes("cok satan") || l.includes("fırsat"));
      return isHeroTagged || p.is_bestseller || (p.price && p.price > 500);
    });
    return (filtered.length > 0 ? filtered : products).slice(0, 6);
  }, [products]);

  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    if (heroProducts.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroProducts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const currentHero = heroProducts[heroIndex] || products[0];

  // Filtered catalog products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (selectedCategory !== "all" && p.category !== selectedCategory && p.category_2 !== selectedCategory) return false;
      if (selectedSubCategory !== "all" && p.sub_category !== selectedSubCategory && (p as any).sub_category_2 !== selectedSubCategory) return false;
      if (selectedBrand !== "all" && p.brand !== selectedBrand) return false;
      if (selectedBadge !== "all") {
        const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
        const tagMatch = labels.some(l => l.includes(selectedBadge.toLowerCase()));
        const isBestsellerMatch = selectedBadge === "bestseller" && p.is_bestseller;
        const isDiscountMatch = selectedBadge === "discount" && (p.old_price && p.old_price > p.price);
        if (!tagMatch && !isBestsellerMatch && !isDiscountMatch) return false;
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
  }, [products, selectedCategory, selectedSubCategory, selectedBrand, selectedBadge, searchQuery]);

  // Rows for Netflix style
  const bestsellerProducts = useMemo(() => {
    return products.filter(p => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      return p.is_bestseller || labels.some(l => l.includes("cok satan") || l.includes("çoksatan") || l.includes("bestseller") || l.includes("trend"));
    }).slice(0, 16);
  }, [products]);

  const featuredProducts = useMemo(() => {
    return products.filter(p => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      return labels.some(l => l.includes("one cikan") || l.includes("öne çıkan") || l.includes("featured") || l.includes("haftanin") || l.includes("editor"));
    }).slice(0, 16);
  }, [products]);

  const discountedProducts = useMemo(() => {
    return products.filter(p => {
      const labels = getLabels(p.labels || (p as any).tags || (p as any).badges || []).map(l => l.toLowerCase());
      return (p.old_price && p.old_price > p.price) || (p as any).discount_rate > 0 || labels.some(l => l.includes("indirim") || l.includes("firsat") || l.includes("kampanya") || l.includes("discount"));
    }).slice(0, 16);
  }, [products]);

  const newArrivals = useMemo(() => {
    return [...products].sort((a, b) => new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()).slice(0, 16);
  }, [products]);

  const totalBasketCount = basket.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* CINEMATIC NAVIGATION BAR */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedCategory('all'); setSelectedBadge('all'); }}>
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="h-9 w-9 rounded-xl object-cover border border-slate-700 shadow-sm" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white shadow-md">
                {storeName.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-white">{storeName}</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Premium Mağaza</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-300">
            <button 
              onClick={() => { setActiveTab('home'); setSelectedCategory('all'); setSelectedBadge('all'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'home' && selectedCategory === 'all' && selectedBadge === 'all' ? 'bg-white/10 text-white font-black' : 'hover:text-white'}`}
            >
              {isTr ? "Keşfet" : "Explore"}
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedCategory('all'); setSelectedBadge('all'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${activeTab === 'catalog' && selectedCategory === 'all' && selectedBadge === 'all' ? 'bg-white/10 text-white font-black' : 'hover:text-white'}`}
            >
              {isTr ? "Tüm Ürünler" : "All Products"}
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedBadge('bestseller'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedBadge === 'bestseller' ? 'bg-white/10 text-white font-black' : 'hover:text-white'}`}
            >
              {isTr ? "Çok Satanlar" : "Bestsellers"}
            </button>
            <button 
              onClick={() => { setActiveTab('catalog'); setSelectedBadge('discount'); }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${selectedBadge === 'discount' ? 'bg-white/10 text-white font-black' : 'hover:text-white'}`}
            >
              {isTr ? "Fırsatlar" : "Deals"}
            </button>
            <button 
              onClick={() => {
                const footer = document.getElementById('store-footer');
                if (footer) footer.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg transition-colors cursor-pointer hover:text-white flex items-center gap-1 text-slate-300"
              title={isTr ? "İletişim & Mağaza Bilgileri" : "Contact & Store Info"}
            >
              <PhoneCall className="h-3.5 w-3.5 text-blue-400" />
              <span>{isTr ? "İletişim" : "Contact"}</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH BAR */}
          <div className="relative hidden sm:block w-56 lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={isTr ? "Ürün, kategori veya etiket ara..." : "Search products, tags..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab === 'home' && e.target.value.trim()) setActiveTab('catalog');
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* CONTACT QUICK BTN */}
          <button
            type="button"
            onClick={() => {
              const footer = document.getElementById('store-footer');
              if (footer) footer.scrollIntoView({ behavior: 'smooth' });
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title={isTr ? "İletişim, Adres & Çalışma Saatleri" : "Contact, Address & Hours"}
          >
            <PhoneCall className="h-4 w-4 text-blue-400" />
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
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">
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
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all cursor-pointer"
            title={customer ? (customer.name || "Profilim") : "Giriş Yap"}
          >
            <User className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* MAIN VIEW CONTENT */}
      {activeTab === 'home' && !searchQuery ? (
        <div className="space-y-8 pb-20">
          {/* MINIMALIST ILLUMINATED HERO SHOWCASE BANNER */}
          {currentHero && (
            <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6">
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-7 md:p-9 min-h-[260px] sm:min-h-[300px] flex flex-col md:flex-row items-center justify-between gap-6 group">
                {/* Luminous Ambient Background Glow */}
                <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -top-10 -left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* LEFT CONTENT */}
                <div className="relative z-10 max-w-2xl space-y-3 w-full">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-md font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      Öne Çıkan Ürün
                    </span>
                    {currentHero.brand && (
                      <span className="px-2 py-0.5 bg-slate-800/90 text-slate-300 rounded-md font-bold text-[9px] border border-slate-700">
                        {currentHero.brand}
                      </span>
                    )}
                    {currentHero.category && (
                      <span className="px-2 py-0.5 bg-slate-800/90 text-slate-300 rounded-md font-bold text-[9px] border border-slate-700">
                        {currentHero.category}
                      </span>
                    )}
                    {getLabels(currentHero.labels || (currentHero as any).tags || (currentHero as any).badges).slice(0, 2).map((lbl, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-indigo-900/80 text-indigo-200 rounded-md font-bold text-[9px] border border-indigo-700/60">
                        🏷️ {lbl}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-xs line-clamp-2">
                    {currentHero.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-xl font-normal leading-relaxed">
                    {currentHero.description || (isTr ? "Bu sezona damga vuran premium ürünümüzü hemen keşfedin ve avantajlı fiyatlardan yararlanın." : "Discover our premium product defining this season with exceptional value.")}
                  </p>

                  <div className="flex items-center gap-3 pt-1 flex-wrap">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg sm:text-2xl font-black text-blue-400">
                        ₺{(currentHero.price || 0).toLocaleString('tr-TR')}
                      </span>
                      {currentHero.old_price && currentHero.old_price > currentHero.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₺{currentHero.old_price.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${
                      getProductStockCount(currentHero) > 0 
                        ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/80" 
                        : "bg-rose-950/60 text-rose-300 border-rose-800/80"
                    }`}>
                      {getProductStockCount(currentHero) > 0 ? `Stokta: ${getProductStockCount(currentHero)} Adet` : "Tükendi"}
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
                      className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{isTr ? "Sepete Ekle" : "Add to Cart"}</span>
                    </button>
                  </div>
                </div>

                {/* RIGHT CRISP PRODUCT IMAGE SHOWCASE */}
                <div className="relative z-10 shrink-0 w-48 sm:w-60 md:w-72 h-44 sm:h-52 md:h-60 flex items-center justify-center p-2">
                  <div className="w-full h-full rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-center p-3 shadow-inner overflow-hidden">
                    <img 
                      src={getProductImageUrl(currentHero)} 
                      alt={currentHero.name}
                      className="max-w-full max-h-full object-contain filter brightness-105 contrast-105 drop-shadow-xl transform transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
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
            {bestsellerProducts.length > 0 && (
              <NetflixRow 
                title={isTr ? "🔥 Çok Satanlar & Popüler Ürünler" : "🔥 Bestsellers & Popular"}
                products={bestsellerProducts}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                onShowAll={() => { setSelectedBadge("bestseller"); setActiveTab("catalog"); }}
              />
            )}

            {/* ROW 2: ÖNE ÇIKANLAR */}
            {featuredProducts.length > 0 && (
              <NetflixRow 
                title={isTr ? "⭐ Öne Çıkan Koleksiyon" : "⭐ Featured Collection"}
                products={featuredProducts}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                onShowAll={() => { setSelectedBadge("featured"); setActiveTab("catalog"); }}
              />
            )}

            {/* ROW 3: FIRSATLAR & İNDİRİMLER */}
            {discountedProducts.length > 0 && (
              <NetflixRow 
                title={isTr ? "🏷️ Fırsatlar & Kampanyalı Ürünler" : "🏷️ Special Offers & Discounts"}
                products={discountedProducts}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                onShowAll={() => { setSelectedBadge("discount"); setActiveTab("catalog"); }}
              />
            )}

            {/* ROW 4: YENİ GELENLER */}
            {newArrivals.length > 0 && (
              <NetflixRow 
                title={isTr ? "✨ Yeni Gelen Ürünler" : "✨ New Arrivals"}
                products={newArrivals}
                onViewProduct={onViewProduct}
                addToBasket={addToBasket}
                onShowAll={() => { setActiveTab("catalog"); }}
              />
            )}

            {/* DYNAMIC CATEGORY ROWS (ALL DISTINCT CATEGORIES) */}
            {categories.map(catName => {
              const catItems = products.filter(p => p.category === catName || p.category_2 === catName);
              if (catItems.length === 0) return null;
              return (
                <NetflixRow
                  key={catName}
                  title={`📦 ${catName}`}
                  products={catItems}
                  onViewProduct={onViewProduct}
                  addToBasket={addToBasket}
                  onShowAll={() => { setSelectedCategory(catName); setActiveTab("catalog"); }}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* FULL CATALOG / SEARCH VIEW */
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-black text-white">{isTr ? "Ürün Kataloğu" : "Product Catalog"}</span>
              <span className="text-xs text-slate-400 font-bold">({filteredProducts.length} {isTr ? "ürün listeleniyor" : "products"})</span>
            </div>

            {/* FILTER CHIPS */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="all">{isTr ? "Tüm Kategoriler" : "All Categories"}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              {subCategories.length > 0 && (
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="all">{isTr ? "Tüm Alt Kategoriler" : "All Subcategories"}</option>
                  {subCategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}

              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="all">{isTr ? "Tüm Markalar" : "All Brands"}</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <select
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                <option value="all">{isTr ? "Tüm Etiketler" : "All Badges"}</option>
                <option value="bestseller">{isTr ? "Çok Satan" : "Bestseller"}</option>
                <option value="featured">{isTr ? "Öne Çıkan" : "Featured"}</option>
                <option value="discount">{isTr ? "İndirimli" : "Discounted"}</option>
              </select>
            </div>
          </div>

          {/* GRID OF PRODUCTS */}
          {filteredProducts.length === 0 ? (
            <div className="p-16 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <Package className="h-12 w-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">{isTr ? "Aradığınız kriterlere uygun ürün bulunamadı." : "No products found matching your criteria."}</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); setSelectedBrand('all'); setSelectedBadge('all'); setSearchQuery(''); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                {isTr ? "Filtreleri Sıfırla" : "Reset Filters"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <NetflixProductCard
                  key={product.id}
                  product={product}
                  onViewProduct={onViewProduct}
                  addToBasket={addToBasket}
                  allProducts={filteredProducts}
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
    </div>
  );
};

interface NetflixRowProps {
  title: string;
  products: Product[];
  onViewProduct: (product: Product, rowProducts: Product[]) => void;
  addToBasket: (product: Product) => void;
  onShowAll?: () => void;
}

const NetflixRow: React.FC<NetflixRowProps> = ({ title, products, onViewProduct, addToBasket, onShowAll }) => {
  const rowRef = useRef<HTMLDivElement>(null);

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
        <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
          <span>{title}</span>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md">
            {products.length} Ürün
          </span>
        </h2>
        {onShowAll && (
          <button
            type="button"
            onClick={onShowAll}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Tümünü Gör</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-20 w-10 h-10 rounded-full bg-slate-900/90 text-white border border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl cursor-pointer hover:bg-blue-600"
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
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-20 w-10 h-10 rounded-full bg-slate-900/90 text-white border border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl cursor-pointer hover:bg-blue-600"
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
}

const NetflixProductCard: React.FC<NetflixProductCardProps> = ({ product, onViewProduct, addToBasket, allProducts }) => {
  const coverImg = getProductImageUrl(product);
  const stockCount = getProductStockCount(product);
  const isOutOfStock = stockCount <= 0 && (product as any).is_sellable !== true && (product as any).allow_backorder !== true;

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between w-full h-full cursor-pointer relative"
      onClick={() => onViewProduct(product, allProducts)}
    >
      <div className="relative aspect-[4/3] sm:aspect-[1/1] overflow-hidden bg-slate-950 flex items-center justify-center p-2">
        <img
          src={coverImg}
          alt={product.name}
          className="max-w-full max-h-full object-contain filter brightness-105 contrast-105 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* FLOATING ICON-ONLY ADD TO BASKET (QUICK ACTION) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addToBasket(product);
          }}
          className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all active:scale-90 cursor-pointer"
          title="Sepete Ekle"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {product.brand && (
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
              {product.brand}
            </span>
          )}
          <h3 className="font-bold text-xs text-white line-clamp-2 group-hover:text-blue-300 transition-colors leading-snug">
            {product.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-black text-white">
                ₺{(product.price || 0).toLocaleString('tr-TR')}
              </span>
              {product.old_price && product.old_price > product.price && (
                <span className="text-[10px] text-slate-400 line-through">
                  ₺{product.old_price.toLocaleString('tr-TR')}
                </span>
              )}
            </div>

            {/* SECONDARY MINI CART ICON BUTTON */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToBasket(product);
              }}
              className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer flex items-center justify-center"
              title="Sepete Ekle"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
              !isOutOfStock
                ? "text-emerald-300 bg-emerald-950/60 border border-emerald-800/60"
                : "text-rose-400 bg-rose-950/60 border border-rose-800/60"
            }`}>
              {!isOutOfStock ? (stockCount > 0 ? `Stokta: ${stockCount}` : "Stokta Var") : "Tükendi"}
            </span>

            {product.category && (
              <span className="text-[9px] text-slate-400 truncate max-w-[90px]">
                {product.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

