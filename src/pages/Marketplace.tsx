import React, { useEffect, useState } from "react";
import { 
  MoveRight, 
  MapPin, 
  Tag, 
  Car, 
  Home, 
  Package, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  Filter,
  Sparkles,
  ArrowUpDown,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Award,
  TrendingUp,
  Percent,
  Briefcase,
  HelpCircle,
  Megaphone,
  UserCheck,
  Maximize2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "../components/RadarShowcaseSlider";

type CategoryFilter = "all" | "vehicle" | "real_estate" | "product";

export const Marketplace = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [portalNews, setPortalNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  
  // Gallery states
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    setActiveDetailImageIndex(0);
  }, [selectedListing]);

  const modalImages: string[] = [];
  if (selectedListing) {
    if (Array.isArray(selectedListing.images) && selectedListing.images.length > 0) {
      modalImages.push(...selectedListing.images);
    } else if (selectedListing.image_url) {
      modalImages.push(selectedListing.image_url);
    }
  }
  const activeImage = modalImages[activeDetailImageIndex] || selectedListing?.image_url;
  
  // Luxury Slide states
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);

  const luxurySlides = [
    {
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80",
      title: "Göz Alıcı İhtişam, Mühendislik Harikası",
      subtitle: "YENİ NESİL SÜPER SPOR COUPE COIL",
      description: "Seçkin oto galerilerimizin sertifikalı ultra lüks, eşsiz kondisyondaki araç koleksiyonunu doğrudan inceleyin.",
      badge: "Prestige Motors",
      accent: "from-rose-500 to-amber-500",
      type: "vehicle"
    },
    {
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      title: "Prestij Sahibi Seçkin Malikaneler",
      subtitle: "DENİZE SIFIR AKDENİZ VE BOĞAZ YALILARI",
      description: "Eşsiz manzaralara, tam güvenlik donanımına ve modern mimari çizgilere sahip en değerli akredite portföy.",
      badge: "Elite Properties",
      accent: "from-amber-400 to-yellow-500",
      type: "real_estate"
    },
    {
      image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=80",
      title: "Zamanın Ötesinde Bir Başyapıt",
      subtitle: "HAUTE-HORLOGERIE SINIRLI SAYI SAATLER",
      description: "Dünya mirası butik markaların özel koleksiyoncu serisi mekanik saatlerini ve nadide aksesuarlarını keşfedin.",
      badge: "Grand Boutique",
      accent: "from-purple-500 to-pink-500",
      type: "product"
    }
  ];

  const premiumAds = [
    {
      id: "ad-finance",
      title: "Enrakipsiz Özel Taşıt & Konut Finansmanı",
      broker: "LOOKPRICE BANK PARTNERS",
      description: "Sadece portal müşterilerine lüks gayrimenkul ve araç alımlarında 12 ila 36 ay vadede kişiye özel oranlı prestij kredisi ve takas desteği.",
      profitBadge: "%1.19 Tercihli Faiz",
      actionText: "Anında Başvur",
      icon: DollarSign,
      color: "from-amber-500/10 to-amber-600/5",
      borderColor: "border-amber-500/20 text-amber-400"
    },
    {
      id: "ad-concierge",
      title: "7/24 VIP Concierge & Ekspertiz Sigortası",
      broker: "LOOKPRICE LUXURY CARE",
      description: "Satın aldığınız tüm araç veya villalar için adrese teslimat, noter takibi, sigorta poliçesi ve 12 ay mekanik garanti paketi avantajları.",
      profitBadge: "Full Teminat Güvencesi",
      actionText: "Hizmeti İncele",
      icon: Award,
      color: "from-rose-500/10 to-rose-600/5",
      borderColor: "border-rose-500/20 text-rose-400"
    },
    {
      id: "ad-advertise",
      title: "Burada Yer Alın: Aylık 1.2M+ Nitelikli Ziyaretçi",
      broker: "ENRAKİPSİZ SPONSOR NETWORK",
      description: "Markanızı, projenizi veya özel hizmetlerinizi portalımızda sergileyerek doğrudan Alıcı ve Satıcı premium kitleyle buluşturun.",
      profitBadge: "Yüksek Prestij & Dönüşüm",
      actionText: "Sponsor Ol",
      icon: Megaphone,
      color: "from-cyan-500/10 to-blue-600/5",
      borderColor: "border-cyan-500/20 text-cyan-400"
    }
  ];

  // Auto transition for luxury slider
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % luxurySlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [luxurySlides.length]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + luxurySlides.length) % luxurySlides.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % luxurySlides.length);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getMarketplaceListings().catch(() => []),
      api.getPublicEnrakipsizRadarNews().catch(() => [])
    ])
    .then(([listingsRes, newsRes]) => {
      setListings(listingsRes || []);
      setPortalNews(newsRes || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  // Filter & Sort Logic
  const filteredListings = listings
    .filter(item => {
      const matchesCategory = activeCategory === "all" || item.listing_type === activeCategory;
      const matchesSearch = 
        (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.store_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") {
        return Number(a.price) - Number(b.price);
      }
      if (sortBy === "price_desc") {
        return Number(b.price) - Number(a.price);
      }
      // Newest first (default)
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

  // Calculate statistics for the badges
  const stats = {
    total: listings.length,
    vehicles: listings.filter(l => l.listing_type === "vehicle").length,
    properties: listings.filter(l => l.listing_type === "real_estate").length,
    products: listings.filter(l => l.listing_type === "product").length,
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-rose-500 selection:text-white font-sans antialiased">
      {/* Premium Obsidian Floating Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="group flex items-center gap-2">
              <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-transparent bg-clip-text text-2xl font-black tracking-tighter">
                ENRAKİPSİZ
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                PRO PORTAL
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Mağaza Girişi
            </Link>
            <Link 
              to="/register" 
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-rose-950/20 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Hemen Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* Decorative Aurora Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Hero Visual Section */}
      <header className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="text-center md:text-left max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-6">
            <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
            <span>Türkiye'nin En Ayrıcalıklı Mağaza & İlan Platformu</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Seçkin Mağazalardan <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 text-transparent bg-clip-text">
              Rakipsiz Teklifler & İlanlar
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            Oto galeri, emlak ofisleri ve premium e-ticaret markalarının en güncel, doğrulanmış ilanlarını tek bir ekranda canlı olarak inceleyin.
          </p>
        </div>
      </header>

      {/* Ultra Lux Carousel Banner Slider Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="relative h-[480px] rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl shadow-rose-950/20 bg-slate-950 group">
          
          {/* Individual Slides */}
          {luxurySlides.map((slide, idx) => {
            const isActive = idx === activeSlide;
            return (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out flex flex-col justify-end p-8 md:p-16 ${
                  isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-95 pointer-events-none z-0"
                }`}
              >
                {/* Background Image with Ambient Glow Overlays */}
                <div className="absolute inset-0">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[8000ms]"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle vignette/gradient mapping */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/40" />
                </div>

                {/* Content Overlay Sheet */}
                <div className="relative z-10 max-w-2xl text-left space-y-4">
                  <div className="inline-flex items-center gap-2">
                    <span className={`px-3.5 py-1 text-[10px] font-black tracking-widest uppercase rounded-full text-white bg-gradient-to-r ${slide.accent} shadow-md`}>
                      {slide.badge}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-900/90 text-[10px] font-bold tracking-widest text-slate-300 uppercase rounded-full border border-slate-800">
                      ÖNERİLEN
                    </span>
                  </div>

                  <p className="text-xs md:text-sm font-extrabold tracking-widest text-rose-400 uppercase drop-shadow">
                    {slide.subtitle}
                  </p>

                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                    {slide.title}
                  </h2>

                  <p className="text-slate-300 text-xs md:text-sm max-w-lg leading-relaxed drop-shadow">
                    {slide.description}
                  </p>

                  <div className="pt-3 flex gap-3">
                    <button
                      onClick={() => {
                        setActiveCategory(slide.type as any);
                        const section = document.getElementById("enrakipsiz-portal-head");
                        if (section) section.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-6 py-3 bg-white text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                    >
                      Koleksiyonu İncele
                      <MoveRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAd({
                          title: slide.title,
                          broker: slide.badge,
                          description: slide.description,
                          profitBadge: slide.subtitle,
                          icon: Sparkles
                        });
                        setShowAdModal(true);
                      }}
                      className="px-6 py-3 bg-slate-900/80 backdrop-blur border border-slate-700 hover:bg-slate-800 text-white text-xs font-black rounded-xl uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Hızlı Teklif Al
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Left Arrow Controller */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-slate-900/60 backdrop-blur-md rounded-full border border-slate-800 hover:border-slate-600 hover:bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow Controller */}
          <button
            onClick={handleNextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-slate-900/60 backdrop-blur-md rounded-full border border-slate-800 hover:border-slate-600 hover:bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Progressive Bottom Bar Markers */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {luxurySlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === activeSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          {/* Luxury Watermark branding corner */}
          <div className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 pointer-events-none select-none">
            <span className="text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">
              ENRAKİPSİZ PRESTIGE SELECTION
            </span>
          </div>

        </div>
      </section>

      {/* Main Core Showcase Portal */}
      <main id="enrakipsiz-portal-head" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        
        {/* Kıbrıs İmar, Mevzuat & Bölgesel Gelişmeler Radar Feed (enrakipsiz.com) */}
        {portalNews && portalNews.length > 0 && (
          <section className="mb-14">
            <RadarShowcaseSlider radarNews={portalNews} lang="tr" theme="dark" />
          </section>
        )}

        {/* Filtering and Search Bento Box */}
        <section className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800 mb-10 shadow-xl">
          <div className="flex flex-col gap-6">
            
            {/* Search and Sort Row */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              {/* Modern Search bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İlan adı, marka, kategori veya mağaza ara..."
                  className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-3.5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all placeholder:text-slate-500 text-sm"
                />
              </div>

              {/* Sorting Options */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" /> Sırala:
                </span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-rose-500 text-xs font-semibold cursor-pointer"
                >
                  <option value="newest">En Son Eklenenler</option>
                  <option value="price_asc">Fiyat: Artan</option>
                  <option value="price_desc">Fiyat: Azalan</option>
                </select>
              </div>
            </div>

            {/* Category Pills and Counts */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-5">
              <div className="flex flex-wrap gap-2.5">
                {[
                  { value: "all", label: "Tüm İlanlar", icon: Filter, count: stats.total },
                  { value: "vehicle", label: "Oto Galeri", icon: Car, count: stats.vehicles },
                  { value: "real_estate", label: "Emlak", icon: Home, count: stats.properties },
                  { value: "product", label: "Alışveriş (Ürünler)", icon: Package, count: stats.products }
                ].map((pill) => {
                  const Icon = pill.icon;
                  const isActive = activeCategory === pill.value;
                  return (
                    <button
                      key={pill.value}
                      onClick={() => setActiveCategory(pill.value as CategoryFilter)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all hover:scale-[1.02] ${
                        isActive 
                          ? "bg-slate-200 text-slate-950 shadow-md shadow-white/5" 
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{pill.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isActive ? "bg-slate-950/10 text-slate-950" : "bg-slate-800 text-slate-500"
                      }`}>
                        {pill.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Verified Count Banner */}
              <div className="text-xs text-slate-400 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium">
                  Mağazalarımızdan doğrudan online satın alma veya rezervasyon garantisi verilmektedir.
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* Intermediate Ad Placement Bento Grids (Reklam Gelirleri & Sponsorluk Alanları) */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-rose-500 animate-bounce" />
              <h2 className="text-xs uppercase font-black tracking-widest text-slate-300">
                Premium Marka İşbirlikleri & Sponsorlu Alanlar
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-3 py-1 rounded-md border border-slate-850">
              REKLAM ALANI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {premiumAds.map((ad) => {
              const Icon = ad.icon;
              return (
                <div 
                  key={ad.id}
                  onClick={() => {
                    setSelectedAd(ad);
                    setShowAdModal(true);
                  }}
                  className={`bg-gradient-to-br ${ad.color} border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-950/5 flex flex-col justify-between group cursor-pointer relative overflow-hidden`}
                >
                  {/* Subtle decorative absolute circle */}
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full filter blur-xl group-hover:bg-rose-500/10 transition-colors" />

                  <div>
                    {/* Badge and Sponsor indicator */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-1 rounded border border-slate-850">
                        {ad.broker}
                      </span>
                      <span className="text-[9px] font-black text-rose-400 tracking-wider">
                        SPONSORLU
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-base leading-snug mb-2 group-hover:text-rose-400 transition-colors">
                      {ad.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      {ad.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-slate-950 border ${ad.borderColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-white">{ad.profitBadge}</span>
                    </div>

                    <span className="text-[11px] font-black text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      {ad.actionText} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Listings Grid */}
        <section className="relative">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mb-4" />
              <p className="text-slate-400 font-medium text-sm">Harika teklifler hazırlanıyor...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="py-20 text-center bg-slate-900/40 rounded-3xl border border-slate-800 max-w-2xl mx-auto">
              <SlidersHorizontal className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="font-bold text-white text-lg mb-1">Aradığınız İlan Bulunamadı</h3>
              <p className="text-slate-400 text-sm px-6 max-w-md mx-auto">
                Kriterlerinize uygun aktif ilan bulunmamaktadır. Lütfen arama teriminizi veya kategori filtrelerinizi değiştirmeyi deneyin.
              </p>
              <button 
                onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}
                className="mt-6 px-5 py-2.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 hover:bg-slate-700 transition"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredListings.map((listing: any) => (
                <article 
                  key={listing.id} 
                  className="group bg-slate-900/60 hover:bg-slate-900 rounded-3xl p-4 border border-slate-850 hover:border-slate-700 shadow-xl transition-all duration-300 flex flex-col self-stretch"
                >
                  {/* Image wrapper with relative category indicators */}
                  <div className="aspect-[4/3] bg-slate-950 rounded-2xl mb-4 overflow-hidden relative border border-slate-800/50">
                    {listing.image_url ? (
                      <img 
                        src={listing.image_url} 
                        alt={listing.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950">
                        {listing.listing_type === 'vehicle' ? <Car className="w-10 h-10 opacity-30 text-rose-500" /> : 
                         listing.listing_type === 'real_estate' ? <Home className="w-10 h-10 opacity-30 text-amber-500" /> :
                         <Package className="w-10 h-10 opacity-30 text-indigo-500" />}
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mt-2">Görsel Yok</span>
                      </div>
                    )}
                    
                    {/* Badge types */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/90 backdrop-blur-md rounded-lg text-[9px] font-bold tracking-wider text-rose-400 border border-slate-800">
                      {listing.category}
                    </div>

                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-rose-500/90 to-orange-500/90 text-white backdrop-blur-md rounded-lg text-[9px] font-bold tracking-widest uppercase">
                      {listing.listing_type === 'vehicle' ? 'Vasıta' : listing.listing_type === 'real_estate' ? 'Emlak' : 'Ürün'}
                    </div>
                  </div>
                  
                  {/* Listing description metadata */}
                  <h3 className="font-bold text-white text-sm leading-snug mb-2 line-clamp-2 hover:text-rose-400 transition-colors cursor-pointer" onClick={() => setSelectedListing(listing)}>
                    {listing.title}
                  </h3>
                  
                  {/* Category-Specific Visual Tag Labels (Mileage / Rooms, etc) */}
                  <div className="flex items-center gap-2 mb-4">
                    {listing.listing_type === "vehicle" && (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800/80">
                        KM: {listing.mileage ? Math.round(Number(listing.mileage) || 0).toLocaleString('tr-TR') : 'En Son'}
                      </span>
                    )}
                    {listing.brand && (
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800/80 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-rose-500" />
                        {listing.brand}
                      </span>
                    )}
                  </div>
                  
                  {/* Price & Store Info */}
                  <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 inline" /> {listing.store_name}
                      </p>
                      <p className="font-extrabold text-white text-base">
                        {Math.round(Number(listing.price) || 0).toLocaleString('tr-TR')} <span className="text-xs text-rose-400 font-bold">{listing.currency || 'TRY'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions (Go To Store showcase / Details modal) */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button 
                      onClick={() => setSelectedListing(listing)}
                      className="py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Detaylar
                    </button>
                    <Link 
                      to={`/store/${listing.store_slug}`} 
                      target="_blank" 
                      className="py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      Mağazaya Git
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Listing Detail Modal Block */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Left Image Screen */}
            <div className="w-full md:w-1/2 min-h-[350px] md:min-h-0 bg-slate-950 relative border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
              
              {/* Main Image Holder */}
              <div className="flex-1 relative w-full min-h-[220px] md:h-0 group overflow-hidden flex items-center justify-center">
                {activeImage ? (
                  <img 
                    src={activeImage} 
                    alt={selectedListing.title} 
                    className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]" 
                    referrerPolicy="no-referrer"
                    onDoubleClick={() => setZoomedImage(activeImage)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950 min-h-[220px]">
                    <Package className="w-16 h-16 opacity-30 text-rose-500" />
                    <span className="text-xs font-bold tracking-widest text-slate-600 mt-2">Detay Görseli Bulunmuyor</span>
                  </div>
                )}

                {/* Double click helper overlay */}
                {activeImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="bg-slate-900/95 text-xs text-white px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 font-bold shadow-xl">
                      <Maximize2 className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      Çift Tıklayarak Büyüt
                    </div>
                  </div>
                )}

                {/* Explicit Expand button (another way to expand) */}
                {activeImage && (
                  <button
                    onClick={() => setZoomedImage(activeImage)}
                    className="absolute right-3.5 top-3.5 z-10 p-2 text-white bg-slate-900/90 hover:bg-rose-600 rounded-xl border border-slate-800 hover:scale-105 transition shadow-lg flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase group/btn"
                    title="Büyütmek için tıklayın"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-rose-400 group-hover/btn:text-white" />
                    <span>Büyüt</span>
                  </button>
                )}

                {/* Next / Prev buttons inside the big image */}
                {modalImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDetailImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 text-white flex items-center justify-center hover:bg-rose-500 transition-all shadow"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDetailImageIndex((prev) => (prev + 1) % modalImages.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-slate-900/80 border border-slate-800 text-white flex items-center justify-center hover:bg-rose-500 transition-all shadow"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Thumbnail area for multiple images */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-850">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Portföy Fotoğrafları
                  </span>
                  {modalImages.length > 0 && (
                    <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                      {activeDetailImageIndex + 1} / {modalImages.length}
                    </span>
                  )}
                </div>

                {modalImages.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {modalImages.map((imgUrl, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveDetailImageIndex(i)}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                          activeDetailImageIndex === i 
                            ? 'border-rose-500 scale-105 shadow-lg shadow-rose-950/40' 
                            : 'border-slate-850 opacity-60 hover:opacity-100 hover:border-slate-700'
                        }`}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Thumbnail ${i + 1}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 font-medium">Bu ilanda sadece tek görsel bulunmaktadır.</p>
                )}
              </div>

              {/* Tag overlay for category */}
              <div className="absolute top-4 left-4 min-h-[1.5rem] px-2.5 py-1 bg-slate-950/85 text-rose-400 text-[10px] font-extrabold tracking-wider rounded-lg border border-slate-850 z-10 pointer-events-none">
                {selectedListing.category}
              </div>
            </div>

            {/* Right Information Sheet */}
            <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedListing(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-950/60 rounded-full border border-slate-800 transition"
              >
                ✕
              </button>

              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  {selectedListing.listing_type === 'vehicle' ? 'Vasıta' : selectedListing.listing_type === 'real_estate' ? 'Gayrimenkul' : 'Mağaza Ürünü'}
                </span>
                <h2 className="text-xl font-black text-white mt-3 leading-tight mb-2">
                  {selectedListing.title}
                </h2>
                <p className="text-sm font-bold text-slate-400 flex items-center gap-1 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {selectedListing.store_name} Mağazası Güvencesiyle
                </p>
              </div>

              {/* Technical features & parameters */}
              <div className="border-t border-b border-slate-800 py-4 my-2 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Marka/Lokasyon</span>
                  <span className="font-bold text-white text-sm">{selectedListing.brand || 'Belirtilmedi'}</span>
                </div>
                {selectedListing.listing_type === 'vehicle' && (
                  <div>
                    <span className="text-slate-500 block">Kilometre/Mil</span>
                    <span className="font-bold text-white text-sm">
                      {selectedListing.mileage ? `${Math.round(Number(selectedListing.mileage) || 0).toLocaleString('tr-TR')} KM` : 'Yeni Araç'}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Kategori</span>
                  <span className="font-bold text-white text-sm">{selectedListing.category || 'Vasıta & Emlak'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Referans ID</span>
                  <span className="font-mono text-slate-400 text-xs">#{selectedListing.id}</span>
                </div>
              </div>

              {/* Price Banner */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 my-3">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Satış/Talep Bedeli</span>
                <span className="text-2xl font-black text-white">
                  {Math.round(Number(selectedListing.price) || 0).toLocaleString('tr-TR')} <span className="text-rose-500 font-extrabold text-sm">{selectedListing.currency}</span>
                </span>
              </div>

              {/* Action Sheet */}
              <div className="mt-auto space-y-2 pt-4">
                <Link 
                  to={`/store/${selectedListing.store_slug}`} 
                  target="_blank"
                  className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-95 text-white text-center rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2"
                >
                  Mağazayı Ziyaret Et
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => {
                    setSelectedListing(null);
                    window.open(`https://wa.me/905330000000?text=${encodeURIComponent(`Merhaba, enrakipsiz.com üzerindeki ${selectedListing.title} ilanınız ile ilgileniyorum.`)}`, '_blank');
                  }}
                  className="w-full py-3 bg-slate-950 border border-slate-800 hover:bg-slate-850 text-emerald-400 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  WhatsApp'tan Sor
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Zoomed Image Lightbox */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl transition-all duration-300 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:scale-105 transition shadow-lg text-sm font-bold active:scale-95 animate-pulse"
          >
            ✕ Kapat
          </button>
          <div className="relative max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl border border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img 
              src={zoomedImage} 
              alt="Yüksek Çözünürlüklü İlan Detayı" 
              className="w-full h-full max-h-[85vh] object-contain select-none" 
              referrerPolicy="no-referrer"
              onClick={() => setZoomedImage(null)}
            />
          </div>
          <p className="text-slate-500 text-xs mt-4 select-none">Görselin üzerine veya dışına tıklayarak kapatabilirsiniz.</p>
        </div>
      )}

      {/* Interactive Sponsorship / Ad Unit Modal (Amirallere Özel) */}
      {showAdModal && selectedAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-850 rounded-[2.5rem] p-8 shadow-2xl shadow-rose-950/10 max-h-[90vh] overflow-y-auto">
            {/* Close Cross */}
            <button 
              onClick={() => { setShowAdModal(false); setSelectedAd(null); }}
              className="absolute top-6 right-6 p-2 rounded-full border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="px-3.5 py-1 text-[10px] font-black tracking-widest uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                Sponsorlu İş Ortaklığı
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {selectedAd.broker}
              </span>
            </div>

            <h3 className="text-2xl font-black text-white tracking-tight mb-2">
              {selectedAd.title}
            </h3>

            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {selectedAd.description}
            </p>

            {/* Simulated Statistics Panel */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-850 mb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Fayda / Teklif Tanımı</span>
                <span className="text-sm font-black text-white">{selectedAd.profitBadge}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Sponsorluk Konumu</span>
                <span className="text-sm font-black text-rose-400">Portal Ana Sayfa & Vitrin İçi</span>
              </div>
            </div>

            {/* Interactive sponsorship apply form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                alert("Sponsorluk talebiniz başarıyla kaydedilmiştir! LookPrice Prime ekibimiz sizinle en kısa zamanda iletişime geçecektir.");
                setShowAdModal(false);
                setSelectedAd(null);
              }}
              className="space-y-4"
            >
              <h4 className="text-xs uppercase font-extrabold text-slate-300">İş Ortaklığı Başvuru Formu</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Yetkili Adı Soyadı</label>
                  <input required type="text" placeholder="Giriş yapın" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Şirket / Marka Ünvanı</label>
                  <input required type="text" placeholder="Örn: Elite Motors" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">İletişim E-Posta</label>
                  <input required type="email" placeholder="isim@domain.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Telefon Numarası</label>
                  <input required type="tel" placeholder="+90 533 ..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Bize Mesajınız (Sponsor Olmak İstediğiniz Kategori / İlan Tercihi)</label>
                <textarea rows={2} placeholder="Bizimle paylaşmak istediğiniz iş birliği planı ve beklentilerinizi yazın..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-500 resize-none" />
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 hover:opacity-90 text-white font-extrabold text-xs uppercase rounded-xl transition-all hover:scale-[1.01]"
              >
                Başvurumu İlet & Teklif Kodunu Al
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Block */}
      <footer className="bg-slate-950 border-t border-slate-850 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-slate-400 mb-2">ENRAKİPSİZ PORTAL SİSTEMİ</p>
          <p className="max-w-md mx-auto leading-relaxed mb-6">
            Otomotiv, Gayrimenkul ve E-Ticaret envanter kontrolü. Tüm hakları saklıdır. © 2026.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/" className="hover:text-rose-400 transition">Ana Sayfa</Link>
            <Link to="/login" className="hover:text-rose-400 transition">Mağaza Paneli</Link>
            <Link to="/register" className="hover:text-rose-400 transition">Mağaza Oluştur</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
