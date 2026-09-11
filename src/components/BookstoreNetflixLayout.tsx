import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ShoppingBag, 
  Sparkles, 
  BookOpen, 
  Heart, 
  User, 
  Info, 
  SlidersHorizontal,
  Flame,
  Star,
  Compass,
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Quote,
  X,
  Building2,
  Layers,
  Heart
} from "lucide-react";
import { Product, Store as StoreInfo } from "../types";
import { NetflixBookRow } from "./bookstore/NetflixBookRow";
import { BookCardNetflix } from "./bookstore/BookCardNetflix";
import { StoreFooter } from "./showcase/StoreFooter";
import { getBookCoverFallbackSvg } from "../utils/imageFallback";
import { BOOKSTORE_CATEGORIES, getBookstoreSubcategories } from "../data/bookstoreCategories";
import { bookstoreInteraction } from "../services/bookstoreInteractionService";

interface BookstoreNetflixLayoutProps {
  store: StoreInfo | null;
  products: Product[];
  onViewProduct: (product: Product) => void;
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

export const BookstoreNetflixLayout: React.FC<BookstoreNetflixLayoutProps> = ({
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
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [selectedPublisher, setSelectedPublisher] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"home" | "catalog" | "bestsellers">("home");
  const [favCount, setFavCount] = useState<number>(() => bookstoreInteraction.getFavorites(store?.id).length);

  // Sync favorites count
  useEffect(() => {
    const updateFavs = () => {
      setFavCount(bookstoreInteraction.getFavorites(store?.id).length);
    };
    updateFavs();
    window.addEventListener("bookstore-favorites-changed", updateFavs);
    return () => window.removeEventListener("bookstore-favorites-changed", updateFavs);
  }, [store?.id]);

  const storeName = store?.branding?.store_name || store?.name || (isTr ? "Seçkin Kitabevi" : "Elite Bookstore");
  const storeLogo = store?.branding?.logo_url || store?.logo_url;

  // Extract distinct categories, subcategories, authors, publishers
  const categories = useMemo(() => {
    const set = new Set<string>();
    // First include the official book taxonomy in standard order
    BOOKSTORE_CATEGORIES.forEach((c) => set.add(c.mainCategory));
    // Also include any custom category present in products
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  const subCategories = useMemo(() => {
    const set = new Set<string>();
    // If a main category is selected, get its defined subcategories first
    if (selectedCategory && selectedCategory !== "all") {
      getBookstoreSubcategories(selectedCategory).forEach((sub) => set.add(sub));
    }
    // Also add any subcategory from existing products matching this scope
    products.forEach((p) => {
      if (selectedCategory === "all" || p.category === selectedCategory) {
        const sub = p.sub_category || (p as any).sub_category_2 || (p as any).sector_data?.genre || (p as any).genre;
        if (sub && typeof sub === "string" && sub.trim()) set.add(sub.trim());
      }
    });
    return Array.from(set);
  }, [products, selectedCategory]);

  const authors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const a = p.author || (p as any).sector_data?.author;
      if (a && a.trim()) set.add(a.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  const publishers = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const pub = p.brand || (p as any).sector_data?.publisher;
      if (pub && pub.trim()) set.add(pub.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Weekly Picks (Haftanın Eserleri) for Hero Banner
  const weeklyBooks = useMemo(() => {
    if (!products || products.length === 0) return [];
    const picked = products.filter((p) => {
      const s = (p as any).sector_data;
      return (
        (p as any).is_weekly_pick ||
        s?.is_weekly_pick ||
        (p as any).is_featured_weekly ||
        s?.is_featured_weekly ||
        (p as any).weekly_featured
      );
    });
    if (picked.length > 0) return picked;
    // Fallback to bestsellers or first few products
    const best = products.filter((p) => p.is_bestseller || (p as any).is_featured);
    return best.length > 0 ? best.slice(0, 5) : products.slice(0, 5);
  }, [products]);

  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Auto rotate weekly picks (faster dynamic rotation every 3.5 seconds)
  useEffect(() => {
    if (weeklyBooks.length <= 1 || isHeroHovered) return;
    const interval = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % weeklyBooks.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [weeklyBooks.length, isHeroHovered]);

  const heroBook = weeklyBooks[currentHeroIdx] || weeklyBooks[0] || products[0];

  // Collage background book images (sample up to 12 cover images)
  const collageImages = useMemo(() => {
    const valid = products.map((p) => p.image_url).filter(Boolean) as string[];
    return valid.length > 0 ? valid.slice(0, 12) : [];
  }, [products]);

  // Categorized Rows for Netflix Home
  const bestsellerBooks = useMemo(() => {
    return products.filter((p) => p.is_bestseller || (p.stock_quantity && p.stock_quantity > 10));
  }, [products]);

  const newArrivalBooks = useMemo(() => {
    return [...products].reverse().slice(0, 15);
  }, [products]);

  const awardWinningBooks = useMemo(() => {
    return products.filter((p) => {
      const s = (p as any).sector_data;
      return s?.awards || (s?.rating && Number(s.rating) >= 4.8);
    });
  }, [products]);

  // Catalog filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const pAuthor = (p.author || (p as any).sector_data?.author || "").toLowerCase();
      const pPublisher = (p.brand || (p as any).sector_data?.publisher || "").toLowerCase();
      const pName = (p.name || "").toLowerCase();
      const pBarcode = (p.barcode || "").toLowerCase();
      const pSub = (p.sub_category || (p as any).sub_category_2 || (p as any).sector_data?.genre || (p as any).genre || "").trim();

      const matchesSearch = !query || pName.includes(query) || pAuthor.includes(query) || pPublisher.includes(query) || pBarcode.includes(query);
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchesSubCategory = selectedSubCategory === "all" || pSub === selectedSubCategory || p.sub_category === selectedSubCategory;
      const matchesAuthor = selectedAuthor === "all" || (p.author === selectedAuthor || (p as any).sector_data?.author === selectedAuthor);
      const matchesPublisher = selectedPublisher === "all" || (p.brand === selectedPublisher || (p as any).sector_data?.publisher === selectedPublisher);

      return matchesSearch && matchesCategory && matchesSubCategory && matchesAuthor && matchesPublisher;
    });
  }, [products, searchQuery, selectedCategory, selectedSubCategory, selectedAuthor, selectedPublisher]);

  const isSearchActive = searchQuery.trim().length > 0 || selectedCategory !== "all" || selectedSubCategory !== "all" || selectedAuthor !== "all" || selectedPublisher !== "all" || activeTab === "catalog";

  const basketItemCount = useMemo(() => {
    return basket.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }, [basket]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-red-600 selection:text-white">
      {/* Netflix Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo & Store Name */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab("home"); setSearchQuery(""); }}>
              {storeLogo ? (
                <img src={storeLogo} alt={storeName} className="h-8 md:h-9 object-contain" />
              ) : (
                <div className="flex items-center gap-2 text-red-600 font-black tracking-tighter text-xl sm:text-2xl">
                  <BookOpen className="w-7 h-7" />
                  <span className="text-white tracking-normal font-extrabold text-base sm:text-lg">{storeName}</span>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-bold text-slate-300">
              <button
                type="button"
                onClick={() => { setActiveTab("home"); setSearchQuery(""); }}
                className={`transition-colors hover:text-white cursor-pointer ${activeTab === "home" && !isSearchActive ? "text-white font-black" : "text-slate-400"}`}
              >
                {isTr ? "Ana Sayfa" : "Home"}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("catalog"); }}
                className={`transition-colors hover:text-white cursor-pointer ${activeTab === "catalog" || isSearchActive ? "text-white font-black" : "text-slate-400"}`}
              >
                {isTr ? "Kitap Kataloğu" : "Browse All"}
              </button>
              <button
                type="button"
                onClick={() => { 
                  setActiveTab("catalog"); 
                  setSelectedCategory("all");
                }}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span>{isTr ? "Çok Satanlar" : "Bestsellers"}</span>
              </button>
            </nav>
          </div>

          {/* Search Bar & Actions */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={isTr ? "Kitap, yazar, yayınevi veya ISBN ara..." : "Search books, authors..."}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value && activeTab !== "catalog") {
                    setActiveTab("catalog");
                  }
                }}
                className="w-44 sm:w-64 md:w-72 pl-9 pr-8 py-1.5 bg-slate-900/90 border border-slate-800 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Favorites Button */}
            <button
              type="button"
              onClick={() => {
                if (customer) {
                  onOpenProfile("favorites");
                } else {
                  setShowAuthModal(true);
                }
              }}
              className="relative p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-500 hover:border-rose-500/40 transition-all cursor-pointer"
              title={isTr ? "Favori Kitaplarım" : "My Favorites"}
            >
              <Heart className={`w-4 h-4 ${favCount > 0 ? 'text-rose-500 fill-rose-500/30' : ''}`} />
              {favCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                  {favCount}
                </span>
              )}
            </button>

            {/* Account Profile Button */}
            {customer ? (
              <button
                type="button"
                onClick={() => onOpenProfile("profile")}
                className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <User className="w-4 h-4 text-red-500" />
                <span className="hidden sm:inline max-w-[90px] truncate">{customer.name || customer.email}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={isTr ? "Giriş Yap" : "Login"}
              >
                <User className="w-4 h-4" />
              </button>
            )}

            {/* Shopping Bag Button */}
            <button
              type="button"
              onClick={onCheckout}
              className="relative p-2 rounded-full bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 cursor-pointer"
              title={isTr ? "Sepetim" : "Cart"}
            >
              <ShoppingBag className="w-4 h-4" />
              {basketItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {basketItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {!isSearchActive && activeTab === "home" ? (
        /* HOME VIEW: Cinematic Netflix Hero + Horizontal Streaming Rows */
        <main>
          {/* HAFTANIN ESERLERİ: Multi-Book Dynamic Banner with Glowing Collage Background */}
          {heroBook && (
            <section 
              className="relative w-full overflow-hidden bg-slate-950 border-b border-slate-900"
              onMouseEnter={() => setIsHeroHovered(true)}
              onMouseLeave={() => setIsHeroHovered(false)}
            >
              {/* Background 1: Glowing Book Covers Mosaic Collage */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none opacity-25">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4 p-4 transform -rotate-3 scale-110 blur-[2px]">
                  {collageImages.length > 0 ? (
                    collageImages.concat(collageImages).slice(0, 16).map((imgUrl, i) => (
                      <div 
                        key={`collage-img-${i}`}
                        className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-white/10 opacity-70 transition-all duration-1000 transform hover:scale-105"
                      >
                        <img 
                          src={imgUrl} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 12 }).map((_, i) => (
                      <div key={`collage-ph-${i}`} className="aspect-[2/3] rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/30" />
                    ))
                  )}
                </div>
              </div>

              {/* Background 2: Active Book Ambient Glow & Cinematic Dark Vignette */}
              <div className="absolute inset-0 z-1 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/80" />
              </div>

              {/* Hero Main Content Box */}
              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-12 pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                  
                  {/* Left Column: Book Details & Action Controls */}
                  <div className="lg:col-span-7 xl:col-span-8 space-y-3.5 sm:space-y-4">
                    
                    {/* Header Badges & Switcher Pill */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-red-600/30">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span>{isTr ? "HAFTANIN ESERLERİ" : "WEEKLY PICKS"}</span>
                      </div>

                      {weeklyBooks.length > 1 && (
                        <span className="px-2.5 py-0.5 bg-slate-900/90 border border-slate-700 text-slate-300 text-[11px] font-black rounded-full backdrop-blur-md">
                          {String(currentHeroIdx + 1).padStart(2, "0")} / {String(weeklyBooks.length).padStart(2, "0")}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-bold bg-black/60 border border-amber-500/30 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{(heroBook as any).sector_data?.rating || "4.9"} / 5.0</span>
                      </span>

                      {((heroBook as any).sector_data?.page_count || (heroBook as any).page_count) && (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800">
                          {((heroBook as any).sector_data?.page_count || (heroBook as any).page_count)} {isTr ? "Sayfa" : "Pages"}
                        </span>
                      )}
                    </div>

                    {/* Book Title */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`hero-title-${heroBook.id || currentHeroIdx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                          {heroBook.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold text-slate-300">
                          <span className="text-red-400 font-extrabold">{heroBook.author || (heroBook as any).sector_data?.author || (isTr ? "Seçkin Yazar" : "Featured Author")}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-300">{heroBook.brand || (heroBook as any).sector_data?.publisher || (isTr ? "Seçkin Yayıncılık" : "Publisher")}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-emerald-400 font-black text-sm sm:text-base">
                            {Number(heroBook.price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} {heroBook.currency || "TRY"}
                          </span>
                        </div>

                        {/* Spot Quote (Çarpıcı Alıntı) */}
                        {((heroBook as any).sector_data?.spot_quote || (heroBook as any).spot_quote) && (
                          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 text-amber-300/90 text-xs sm:text-sm italic flex items-start gap-2 max-w-xl backdrop-blur-md">
                            <Quote className="w-4 h-4 shrink-0 mt-0.5 text-amber-400 opacity-75" />
                            <p className="line-clamp-2 font-serif">
                              "{((heroBook as any).sector_data?.spot_quote || (heroBook as any).spot_quote)}"
                            </p>
                          </div>
                        )}

                        {/* Short Description */}
                        <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-2xl font-normal">
                          {heroBook.description || (isTr 
                            ? "Sayfaları çevirdikçe sizi içine çeken, kurgusu ve güçlü anlatımıyla edebiyat dünyasında derin yankı uyandıran eşsiz bir başyapıt." 
                            : "An extraordinary novel with captivating storytelling and profound character development.")}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => onViewProduct(heroBook)}
                        className="px-5 sm:px-6 py-2.5 bg-white hover:bg-slate-200 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-xl cursor-pointer"
                      >
                        <Info className="w-4 h-4" />
                        <span>{isTr ? "Kitabı İncele" : "Explore Details"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addToBasket(heroBook)}
                        className="px-5 sm:px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-red-600/30 cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isTr ? "Sepete Ekle" : "Add to Cart"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: 3D Perspective Hero Book Showcase & Weekly Thumbnail Selector */}
                  <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`hero-cover-${heroBook.id || currentHeroIdx}`}
                        initial={{ opacity: 0, scale: 0.95, rotateY: -10 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        exit={{ opacity: 0, scale: 0.95, rotateY: 10 }}
                        transition={{ duration: 0.35 }}
                        className="relative group cursor-pointer"
                        onClick={() => onViewProduct(heroBook)}
                      >
                        {/* 3D Book Cover Frame */}
                        <div className="relative w-44 sm:w-52 md:w-60 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl shadow-black/80 border-2 border-slate-700/80 bg-slate-900 transform group-hover:scale-105 group-hover:-rotate-1 transition-all duration-300">
                          <img
                            src={heroBook.image_url || getBookCoverFallbackSvg(heroBook.name, heroBook.author)}
                            alt={heroBook.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Gloss & Spine Shine */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/30 pointer-events-none" />
                          <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-gradient-to-r from-black/40 to-transparent pointer-events-none" />

                          {/* Hover Detail Overlay */}
                          <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
                            <span className="text-xs font-black text-white bg-red-600 px-3 py-1.5 rounded-lg shadow-lg">
                              {isTr ? "Detayları İncele" : "View Book"}
                            </span>
                            <span className="text-[11px] text-slate-300 font-semibold">
                              {heroBook.author}
                            </span>
                          </div>
                        </div>

                        {/* Ambient Drop Glow */}
                        <div className="absolute -bottom-4 inset-x-4 h-6 bg-red-600/30 rounded-full blur-xl -z-10" />
                      </motion.div>
                    </AnimatePresence>

                    {/* Weekly Picks Mini Thumbnails Switcher Strip */}
                    {weeklyBooks.length > 1 && (
                      <div className="mt-4 flex items-center justify-center gap-2 max-w-full overflow-x-auto p-1.5 bg-slate-900/60 rounded-xl border border-slate-800/80 backdrop-blur-sm scrollbar-none">
                        {weeklyBooks.map((b, bIdx) => (
                          <button
                            key={`thumb-pick-${b.id || bIdx}`}
                            type="button"
                            onClick={() => setCurrentHeroIdx(bIdx)}
                            className={`relative w-8 sm:w-10 aspect-[2/3] rounded overflow-hidden transition-all shrink-0 cursor-pointer border ${
                              bIdx === currentHeroIdx
                                ? "border-red-500 scale-110 shadow-md shadow-red-500/30 ring-2 ring-red-500/40"
                                : "border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500"
                            }`}
                            title={b.name}
                          >
                            <img
                              src={b.image_url || getBookCoverFallbackSvg(b.name, b.author)}
                              alt={b.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </section>
          )}

          {/* Horizontal Netflix Rows (with clean positive breathing margin) */}
          <div className="relative z-20 mt-6 sm:mt-8 space-y-4 pb-16">
            {/* Row 1: Çok Satanlar (Bestsellers) */}
            <NetflixBookRow
              title={isTr ? "Çok Satan Eserler" : "Top Bestsellers"}
              subtitle={isTr ? "Okurlarımız tarafından en çok tercih edilen ve okunan başyapıtlar" : "Most popular books chosen by readers"}
              badge="TOP 10"
              products={bestsellerBooks.length > 0 ? bestsellerBooks : products.slice(0, 10)}
              store={store}
              lang={lang}
              onViewProduct={onViewProduct}
              addToBasket={addToBasket}
            />

            {/* Row 2: Yeni Gelenler (New Arrivals) */}
            <NetflixBookRow
              title={isTr ? "Yeni Çıkanlar & Raflarda" : "New Releases & Just In"}
              subtitle={isTr ? "Bu hafta raflarımızda yerini alan en taze edebi yayınlar" : "Fresh literary publications that arrived this week"}
              badge={isTr ? "YENİ" : "NEW"}
              products={newArrivalBooks}
              store={store}
              lang={lang}
              onViewProduct={onViewProduct}
              addToBasket={addToBasket}
            />

            {/* Category Specific Rows */}
            {categories.slice(0, 4).map((catName) => {
              const catProducts = products.filter((p) => p.category === catName);
              if (catProducts.length === 0) return null;
              return (
                <NetflixBookRow
                  key={`cat-row-${catName}`}
                  title={catName}
                  subtitle={isTr ? `${catName} kategorisindeki seçkin kitaplar` : `Curated books in ${catName}`}
                  products={catProducts}
                  store={store}
                  lang={lang}
                  onViewProduct={onViewProduct}
                  addToBasket={addToBasket}
                />
              );
            })}
          </div>
        </main>
      ) : (
        /* CATALOG & SEARCH VIEW: Filter Bar + Responsive Card Grid */
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          {/* Header & Filter Bar */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <Compass className="w-6 h-6 text-red-500" />
                  <span>{isTr ? "Kitap Koleksiyonu & Filtreleme" : "Book Collection & Filters"}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isTr ? `Toplam ${filteredProducts.length} eser listeleniyor` : `Showing ${filteredProducts.length} titles`}
                </p>
              </div>

              {/* Clear filters button */}
              {(selectedCategory !== "all" || selectedSubCategory !== "all" || selectedAuthor !== "all" || selectedPublisher !== "all" || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedSubCategory("all");
                    setSelectedAuthor("all");
                    setSelectedPublisher("all");
                    setSearchQuery("");
                  }}
                  className="self-start sm:self-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{isTr ? "Filtreleri Sıfırla" : "Clear Filters"}</span>
                </button>
              )}
            </div>

            {/* Filter Selectors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Bookmark className="w-3 h-3 text-red-500" />
                  <span>{isTr ? "Kategori" : "Category"}</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubCategory("all");
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-red-600 focus:ring-0 transition-all cursor-pointer"
                >
                  <option value="all">{isTr ? "Tüm Kategoriler" : "All Categories"}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Sub Category Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-red-500" />
                  <span>{isTr ? "Alt Kategori / Tür" : "Sub-Category / Genre"}</span>
                </label>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  disabled={subCategories.length === 0}
                  className={`w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-red-600 focus:ring-0 transition-all ${
                    subCategories.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <option value="all">{isTr ? "Tüm Alt Kategoriler" : "All Sub-Categories"}</option>
                  {subCategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Author Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-red-500" />
                  <span>{isTr ? "Yazar" : "Author"}</span>
                </label>
                <select
                  value={selectedAuthor}
                  onChange={(e) => setSelectedAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-red-600 focus:ring-0 transition-all cursor-pointer"
                >
                  <option value="all">{isTr ? "Tüm Yazarlar" : "All Authors"}</option>
                  {authors.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Publisher Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-red-500" />
                  <span>{isTr ? "Yayınevi" : "Publisher"}</span>
                </label>
                <select
                  value={selectedPublisher}
                  onChange={(e) => setSelectedPublisher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:border-red-600 focus:ring-0 transition-all cursor-pointer"
                >
                  <option value="all">{isTr ? "Tüm Yayınevleri" : "All Publishers"}</option>
                  {publishers.map((pub) => (
                    <option key={pub} value={pub}>{pub}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Book Cards Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <BookCardNetflix
                  key={`catalog-book-${product.id}`}
                  product={product}
                  store={store}
                  lang={lang}
                  onView={onViewProduct}
                  addToBasket={addToBasket}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-3 bg-slate-900/50 rounded-3xl border border-slate-800">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
              <h3 className="text-base font-bold text-white">
                {isTr ? "Aradığınız kriterlere uygun kitap bulunamadı" : "No books found matching criteria"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isTr ? "Farklı anahtar kelimelerle arama yapabilir veya filtreleri sıfırlayabilirsiniz." : "Try adjusting your search terms or clearing filters."}
              </p>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <StoreFooter
        store={store}
        lang={lang}
        setShowAboutModal={setShowAboutModal}
        setShowStoreLocatorModal={setShowStoreLocatorModal}
        onOpenProfile={(tab) => onOpenProfile(tab)}
      />
    </div>
  );
};
