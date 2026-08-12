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
  X,
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
  Maximize2,
  Grid3X3,
  LayoutGrid,
  ListFilter,
  Moon,
  Sun,
  Play,
  Flame,
  TrendingDown,
  GraduationCap,
  Building2,
  Fuel,
  Eye,
  Share2,
  FileText,
  Check,
  Layers,
  Compass,
  Calendar,
  Sliders,
  ChevronDown
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "../components/RadarShowcaseSlider";
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from "../data/realEstateConfig";
import { SectorSpecs } from "../components/SectorSpecs";

type MainTab = "real_estate" | "vehicle";
type ViewMode = "rich" | "compact" | "list";

// High quality short video reels for story bar
const DEFAULT_STORIES = [
  {
    id: "story-1",
    storeName: "Seçkin Gayrimenkul",
    storeSlug: "seckin-emlak",
    title: "Lüks Havuzlu Dubleks Villa — Girne",
    price: "385.000 GBP",
    category: "Villa",
    type: "real_estate",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-modern-luxury-house-exterior-42930-large.mp4",
    poster: "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&auto=format&fit=crop"
  },
  {
    id: "story-2",
    storeName: "Prestij Oto Galeri",
    storeSlug: "prestij-oto",
    title: "Mercedes-Benz E200 AMG Line 2023",
    price: "2.450.000 TL",
    category: "Otomobil",
    type: "vehicle",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-luxury-black-car-driving-at-night-41527-large.mp4",
    poster: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop"
  },
  {
    id: "story-3",
    storeName: "Kampüs Emlak & Öğrenci",
    storeSlug: "kampus-emlak",
    title: "Üniversite Yakını Eşyalı 1+1 Daire",
    price: "18.500 TL/Ay",
    category: "Daire",
    type: "real_estate",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-interior-of-a-modern-living-room-41528-large.mp4",
    poster: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop"
  },
  {
    id: "story-4",
    storeName: "Bora Motors VIP",
    storeSlug: "bora-motors",
    title: "Porsche Cayenne Coupe GTS 2024",
    price: "4.850.000 TL",
    category: "SUV",
    type: "vehicle",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-white-car-driving-on-the-highway-41524-large.mp4",
    poster: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop"
  },
  {
    id: "story-5",
    storeName: "Kıbrıs Premium Land",
    storeSlug: "kibris-land",
    title: "Deniz Manzaralı İmarlı Arsa — Alsancak",
    price: "195.000 GBP",
    category: "Arsa",
    type: "real_estate",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beach-and-the-ocean-41529-large.mp4",
    poster: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop"
  }
];

const cleanHtmlText = (text: string) => {
  if (!text) return "";
  let cleaned = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n/g, "<br />");

  cleaned = cleaned.replace(/style="[^"]*color\s*:\s*[^";]+;?[^"]*"/gi, (match) => {
    return match.replace(/color\s*:\s*[^";]+;?/gi, '');
  });
  cleaned = cleaned.replace(/style='[^']*color\s*:\s*[^';]+;?[^']*'/gi, (match) => {
    return match.replace(/color\s*:\s*[^';]+;?/gi, '');
  });

  return cleaned;
};

export const Marketplace = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [portalNews, setPortalNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("enrakipsiz_theme");
    return saved ? saved === "dark" : true;
  });

  // Top Level Primary Folder Tab
  const [mainTab, setMainTab] = useState<MainTab>("real_estate");

  // Secondary Fihrist Index Tab Selection
  // For Emlak: "satilik" | "kiralik" | "ogrenci" | "ticari" | "proje" | "all"
  // For Vehicle: "latest" | "fiyati-dusen" | "ilk-arabam" | "az-yakan" | "suv-ticari" | "all"
  const [reFihristTab, setReFihristTab] = useState<string>("satilik");
  const [vehFihristTab, setVehFihristTab] = useState<string>("latest");

  // 3 Grid View Options
  const [viewMode, setViewMode] = useState<ViewMode>("rich");

  // Slide-Over Right Filter Drawer State
  const [isRightFilterOpen, setIsRightFilterOpen] = useState(false);

  // Detailed Filter Controls
  const [activeSubSector, setActiveSubSector] = useState<string>("all");
  const [activeVehicleBrand, setActiveVehicleBrand] = useState<string>("all");
  const [activeVehicleFuel, setActiveVehicleFuel] = useState<string>("all");
  const [activeVehicleTransmission, setActiveVehicleTransmission] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minYear, setMinYear] = useState<string>("");
  const [maxYear, setMaxYear] = useState<string>("");
  const [reRegion, setReRegion] = useState<string>("all");
  const [reType, setReType] = useState<string>("all");
  const [reRooms, setReRooms] = useState<string>("all");
  const [reFurnished, setReFurnished] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");

  // Modal / Detail / Video Story States
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  // Portal Settings from Backend
  const [portalSettings, setPortalSettings] = useState<any>({
    portal_title: "Türkiye'nin Seçkin Emlak ve Otomotiv Portföy Pazaryeri",
    portal_description: "Doğrulanmış kurumsal emlak ofisleri ve oto galerilerin güncel ilanlarını tek çatı altında fihrist düzeninde keşfedin.",
    primary_color: "#2563eb",
    footer_text: "© 2026 Enrakipsiz.com — Tüm hakları saklıdır."
  });
  const [featuredStores, setFeaturedStores] = useState<any[]>([]);

  // Toggle Theme
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("enrakipsiz_theme", next ? "dark" : "light");
      return next;
    });
  };

  useEffect(() => {
    document.title = "EnRakipsiz | Seçkin Emlak ve Otomotiv Portföy Pazaryeri";
    setLoading(true);
    Promise.all([
      api.getMarketplaceListings().catch(() => []),
      api.getPublicEnrakipsizRadarNews().catch(() => []),
      api.getPublicEnrakipsizPortal().catch(() => null)
    ])
    .then(([listingsRes, newsRes, portalRes]) => {
      setListings(listingsRes || []);
      setPortalNews(newsRes || []);
      if (portalRes && !portalRes.error) {
        if (portalRes.settings) {
          setPortalSettings(portalRes.settings);
        }
        if (portalRes.featured_stores) {
          setFeaturedStores(portalRes.featured_stores);
        }
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  const modalImages: string[] = [];
  if (selectedListing) {
    if (Array.isArray(selectedListing.images) && selectedListing.images.length > 0) {
      modalImages.push(...selectedListing.images);
    } else if (selectedListing.image_url) {
      modalImages.push(selectedListing.image_url);
    }
  }

  const handleCloseModal = () => {
    setSelectedListing(null);
  };

  // Filter & Sort Logic
  const filteredListings = listings.filter(item => {
    if (item.status && item.status !== 'active') return false;
    if (item.listing_type === "product") return false;

    // Primary Sector Filter
    if (mainTab === "real_estate" && item.listing_type !== "real_estate") return false;
    if (mainTab === "vehicle" && item.listing_type !== "vehicle") return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (item.title || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const store = (item.store_name || "").toLowerCase();
      const brand = (item.brand || "").toLowerCase();
      const city = (item.sector_data?.city || item.location || "").toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !store.includes(q) && !brand.includes(q) && !city.includes(q)) {
        return false;
      }
    }

    // Fihrist Sub-Tab Filtering
    if (mainTab === "real_estate") {
      const intent = (item.sector_data?.listing_intent || item.category || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const title = (item.title || "").toLowerCase();

      if (reFihristTab === "satilik" && !intent.includes("satılık") && !intent.includes("satilik") && !category.includes("satılık")) {
        // Fallback check
        if (intent.includes("kiralık") || intent.includes("kiralik")) return false;
      }
      if (reFihristTab === "kiralik" && !intent.includes("kiralık") && !intent.includes("kiralik") && !category.includes("kiralık")) {
        if (intent.includes("satılık") || intent.includes("satilik")) return false;
      }
      if (reFihristTab === "ogrenci") {
        const isStudent = title.includes("öğrenci") || title.includes("stüdyo") || title.includes("1+1") || title.includes("eşyalı") || item.sector_data?.furnished;
        if (!isStudent) return false;
      }
      if (reFihristTab === "ticari") {
        const isCommercial = category.includes("arsa") || category.includes("ticari") || category.includes("ofis") || category.includes("dükkan") || category.includes("arazi");
        if (!isCommercial) return false;
      }
      if (reFihristTab === "proje") {
        const isProject = category.includes("proje") || category.includes("villa") || category.includes("müstakil") || title.includes("proje") || title.includes("lansman");
        if (!isProject) return false;
      }
    }

    if (mainTab === "vehicle") {
      const isPriceDrop = item.sector_data?.price_drop || item.price_dropped;
      const isLowBudget = Number(item.price) > 0 && Number(item.price) <= 650000;
      const isEcoFuel = (item.sector_data?.fuel_type || "").toLowerCase().includes("dizel") || (item.sector_data?.fuel_type || "").toLowerCase().includes("hibrit") || (item.sector_data?.fuel_type || "").toLowerCase().includes("elektrik");
      const category = (item.category || "").toLowerCase();

      if (vehFihristTab === "fiyati-dusen" && !isPriceDrop) return false;
      if (vehFihristTab === "ilk-arabam" && !isLowBudget) return false;
      if (vehFihristTab === "az-yakan" && !isEcoFuel) return false;
      if (vehFihristTab === "suv-ticari") {
        const isSuvOrCommercial = category.includes("suv") || category.includes("ticari") || category.includes("pickup") || category.includes("van");
        if (!isSuvOrCommercial) return false;
      }
    }

    // Detailed Filter Drawer Checks
    if (minPrice && Number(item.price) < Number(minPrice)) return false;
    if (maxPrice && Number(item.price) > Number(maxPrice)) return false;

    if (mainTab === "real_estate") {
      if (reRegion !== "all") {
        const reg = (item.sector_data?.kktc_region || item.sector_data?.city || item.location || "").toLowerCase();
        if (!reg.includes(reRegion.toLowerCase())) return false;
      }
      if (reType !== "all") {
        const t = (item.category || "").toLowerCase();
        if (!t.includes(reType.toLowerCase())) return false;
      }
      if (reRooms !== "all") {
        const r = String(item.sector_data?.rooms || "");
        if (reRooms === "5+" && !r.includes("5") && !r.includes("6")) return false;
        if (reRooms !== "5+" && !r.includes(reRooms)) return false;
      }
      if (reFurnished !== "all") {
        const f = item.sector_data?.furnished ? "yes" : "no";
        if (f !== reFurnished) return false;
      }
    }

    if (mainTab === "vehicle") {
      if (activeVehicleBrand !== "all") {
        const b = (item.brand || "").toLowerCase();
        if (!b.includes(activeVehicleBrand.toLowerCase())) return false;
      }
      if (activeVehicleFuel !== "all") {
        const f = (item.sector_data?.fuel_type || "").toLowerCase();
        if (!f.includes(activeVehicleFuel.toLowerCase())) return false;
      }
      if (activeVehicleTransmission !== "all") {
        const t = (item.sector_data?.transmission || "").toLowerCase();
        if (!t.includes(activeVehicleTransmission.toLowerCase())) return false;
      }
      if (minYear && Number(item.year) < Number(minYear)) return false;
      if (maxYear && Number(item.year) > Number(maxYear)) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (sortBy === "price_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const stats = {
    total: listings.filter(i => i.status === 'active' && i.listing_type !== 'product').length,
    properties: listings.filter(i => i.status === 'active' && i.listing_type === 'real_estate').length,
    vehicles: listings.filter(i => i.status === 'active' && i.listing_type === 'vehicle').length,
  };

  const bgCanvas = isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900";
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-md";
  const headerBg = isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200 shadow-sm";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${bgCanvas}`}>
      
      {/* Dynamic SEO Headings (sr-only for search engines) */}
      <h1 className="sr-only">
        Türkiye'nin Seçkin Emlak ve Otomotiv Portföy Pazaryeri — Enrakipsiz
      </h1>

      {/* Top Navbar Header */}
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Crown Emblem */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg md:text-xl tracking-tight bg-gradient-to-r from-blue-500 via-amber-400 to-rose-500 text-transparent bg-clip-text">
                  ENRAKİPSİZ
                </span>
                <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase hidden sm:block">
                Seçkin Portföy Pazaryeri
              </p>
            </div>
          </Link>

          {/* Quick Search Bar */}
          <div className="flex-1 max-w-md hidden md:block relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İlan başlığı, şehir, marka veya mağaza ara..." 
              className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl outline-none transition-all ${
                isDarkMode 
                  ? "bg-slate-950 border border-slate-800 text-white focus:border-blue-500" 
                  : "bg-slate-100 border border-slate-300 text-slate-900 focus:border-blue-600"
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700" 
                  : "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300"
              }`}
              title={isDarkMode ? "Gündüz Moduna Geç" : "Koyu Moda Geç"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden lg:inline">{isDarkMode ? "Aydınlık Mod" : "Koyu Mod"}</span>
            </button>

            {/* Slide-over Filter Trigger Button */}
            <button
              onClick={() => setIsRightFilterOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Detaylı Filtrele</span>
            </button>

            {/* Merchant Access */}
            <a 
              href="https://lookprice.net/login" 
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mağaza Girişi</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Visual Banner */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sadece Doğrulanmış Kurumsal Mağaza Portföyleri</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Emlak & Vasıta <span className="bg-gradient-to-r from-blue-500 via-amber-400 to-rose-500 text-transparent bg-clip-text">Fihrist Klasörü</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{stats.total} Aktif İlan Yayında</span>
          </div>
        </div>

        {/* 15-Second Short Video Reels Story Strip */}
        <div className="mt-6 mb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
              <Play className="w-3.5 h-3.5 text-rose-500 animate-pulse fill-rose-500" />
              <span>Canlı Portföy Reels & Video Turlar</span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold">15 Sn Dikey Turlar</span>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {DEFAULT_STORIES.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer text-left"
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-blue-500 group-hover:scale-105 transition-transform shadow-lg">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 relative">
                    <img 
                      src={story.poster} 
                      alt={story.title} 
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white fill-white shadow-md" />
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold text-slate-300 max-w-[80px] truncate group-hover:text-amber-400 transition-colors text-center">
                  {story.storeName}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 📁 PHYSICAL FILE FOLDER TAB SYSTEM ("FİHRİST GÖRÜNÜMLÜ AYRAÇLAR") */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Top Tier Primary Folder Tabs (EMLAK vs ARAÇLAR) */}
        <div className="flex items-end gap-2 border-b-4 border-blue-600 pt-2 px-2 overflow-x-auto select-none">
          
          {/* EMLAK PRIMARY TAB */}
          <button
            onClick={() => {
              setMainTab("real_estate");
              setReFihristTab("satilik");
            }}
            className={`flex items-center gap-2.5 px-6 md:px-8 py-3.5 rounded-t-2xl font-black text-sm md:text-base transition-all duration-200 border-t-2 border-x-2 relative cursor-pointer ${
              mainTab === "real_estate"
                ? "bg-blue-600 text-white border-blue-500 shadow-2xl translate-y-1 z-10"
                : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700 hover:text-white"
            }`}
          >
            <Home className="w-5 h-5 text-amber-300" />
            <span className="uppercase tracking-wider">EMLAK FİHRİSTİ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              mainTab === "real_estate" ? "bg-white/20 text-white" : "bg-slate-900 text-slate-400"
            }`}>
              {stats.properties}
            </span>
          </button>

          {/* ARAÇLAR PRIMARY TAB */}
          <button
            onClick={() => {
              setMainTab("vehicle");
              setVehFihristTab("latest");
            }}
            className={`flex items-center gap-2.5 px-6 md:px-8 py-3.5 rounded-t-2xl font-black text-sm md:text-base transition-all duration-200 border-t-2 border-x-2 relative cursor-pointer ${
              mainTab === "vehicle"
                ? "bg-rose-600 text-white border-rose-500 shadow-2xl translate-y-1 z-10"
                : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700 hover:text-white"
            }`}
          >
            <Car className="w-5 h-5 text-amber-300" />
            <span className="uppercase tracking-wider">ARAÇLAR FİHRİSTİ</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              mainTab === "vehicle" ? "bg-white/20 text-white" : "bg-slate-900 text-slate-400"
            }`}>
              {stats.vehicles}
            </span>
          </button>

        </div>

        {/* Secondary Folder File Sub-Tabs Panel */}
        <div className={`p-4 md:p-6 rounded-b-3xl border-x-2 border-b-2 shadow-2xl transition-colors ${
          mainTab === "real_estate"
            ? "bg-slate-900 border-blue-600"
            : "bg-slate-900 border-rose-600"
        }`}>
          
          {/* SUB-FIHRIST FOLDER TABS BAR FOR EMLAK */}
          {mainTab === "real_estate" && (
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800">
              <span className="text-xs text-blue-400 font-black uppercase tracking-wider mr-2 flex items-center gap-1">
                <FileText className="w-4 h-4" /> Emlak Klasörleri:
              </span>

              {[
                { id: "satilik", label: "SATILIK", icon: Tag, desc: "Daire, Villa & Müstakil" },
                { id: "kiralik", label: "KİRALIK", icon: Key, desc: "Konut & İşyeri" },
                { id: "ogrenci", label: "ÖĞRENCİ & STÜDYO", icon: GraduationCap, desc: "Kampüse Yakın & Eşyalı" },
                { id: "ticari", label: "TİCARİ & ARSA", icon: Building2, desc: "Ofis, Dükkan & Arsa" },
                { id: "proje", label: "PROJELER & LÜKS", icon: Sparkles, desc: "Lüks Konut & Proje" }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = reFihristTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setReFihristTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 border cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/50"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-blue-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* SUB-FIHRIST FOLDER TABS BAR FOR VEHICLE */}
          {mainTab === "vehicle" && (
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800">
              <span className="text-xs text-rose-400 font-black uppercase tracking-wider mr-2 flex items-center gap-1">
                <FileText className="w-4 h-4" /> Araç Klasörleri:
              </span>

              {[
                { id: "latest", label: "SON GELENLER", icon: Sparkles, desc: "En Yeni Galeri İlanları" },
                { id: "fiyati-dusen", label: "FİYATI DÜŞENLER", icon: TrendingDown, desc: "Fırsat & Kelepir Araçlar" },
                { id: "ilk-arabam", label: "İLK ARABAM / UYGUN", icon: DollarSign, desc: "Bütçe Dostu Otomobiller" },
                { id: "az-yakan", label: "AZ YAKAN / EKONOMİK", icon: Fuel, desc: "Dizel, Hibrit & Elektrik" },
                { id: "suv-ticari", label: "SUV & TİCARİ", icon: Shield, desc: "Pick-up, SUV & Van" }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = vehFihristTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setVehFihristTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 border cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                      isActive
                        ? "bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30 ring-2 ring-rose-400/50"
                        : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-300" : "text-rose-400"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TOOLBAR BAR (3 GRID VIEW SWITCHER + SORTING + COUNT) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mb-6">
            
            {/* View Mode Switcher (3 Farklı Izgara Modeli) */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-2 hidden sm:inline">
                Izgara Modeli:
              </span>

              {/* Model 1: Rich Cards */}
              <button
                onClick={() => setViewMode("rich")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "rich"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
                title="Vitrin Kart Modeli (Bento Grid)"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden md:inline">Vitrin</span>
              </button>

              {/* Model 2: Compact Grid */}
              <button
                onClick={() => setViewMode("compact")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "compact"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
                title="Yoğun 4'lü Izgara Modeli"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden md:inline">Yoğun</span>
              </button>

              {/* Model 3: Split Row / Detailed List */}
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
                title="Detaylı Yatay Liste Modeli"
              >
                <ListFilter className="w-4 h-4" />
                <span className="hidden md:inline">Detaylı Liste</span>
              </button>
            </div>

            {/* Sort & Count */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">
                <strong className="text-white">{filteredListings.length}</strong> ilan gösteriliyor
              </span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="newest">En Yeniler İlk</option>
                <option value="price_asc">Fiyat (Önce En Düşük)</option>
                <option value="price_desc">Fiyat (Önce En Yüksek)</option>
              </select>
            </div>

          </div>

          {/* LISTINGS CONTAINER (RENDERS ACCORDING TO VIEW MODE) */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
              <p className="text-slate-400 font-medium text-sm">Fihrist klasörleri taranıyor...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="py-20 text-center bg-slate-950/60 rounded-3xl border border-slate-800 max-w-2xl mx-auto">
              <SlidersHorizontal className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="font-bold text-white text-lg mb-1">Bu Klasörde İlan Bulunamadı</h3>
              <p className="text-slate-400 text-sm px-6 max-w-md mx-auto">
                Seçtiğiniz fihrist ayraçında aktif ilan bulunmuyor. Lütfen diğer sekmeleri inceleyin veya filtreleri sıfırlayın.
              </p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setMinPrice("");
                  setMaxPrice("");
                  setReRegion("all");
                  setReType("all");
                  setActiveVehicleBrand("all");
                }}
                className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            <div>
              
              {/* MODEL 1: RICH BENTO GRID (3 COLUMN) */}
              {viewMode === "rich" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((listing: any) => (
                    <article 
                      key={listing.id}
                      className={`group ${cardBg} rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between`}
                    >
                      <div>
                        {/* Cover Image */}
                        <div className="aspect-[16/10] bg-slate-950 rounded-2xl mb-4 overflow-hidden relative border border-slate-800/80">
                          {listing.image_url ? (
                            <img 
                              src={listing.image_url} 
                              alt={listing.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                              {listing.listing_type === 'vehicle' ? <Car className="w-10 h-10 opacity-30 text-rose-500" /> : <Home className="w-10 h-10 opacity-30 text-blue-500" />}
                              <span className="text-[10px] uppercase font-bold text-slate-500 mt-2">Görsel Yok</span>
                            </div>
                          )}

                          {/* Category Tag Badge */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/90 backdrop-blur-md rounded-lg text-[10px] font-extrabold text-amber-300 border border-slate-800">
                            {listing.category || (listing.listing_type === "vehicle" ? "Vasıta" : "Emlak")}
                          </div>

                          {/* Verified Badge */}
                          <div className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-500/90 text-white backdrop-blur-md rounded-lg text-[9px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Doğrulanmış</span>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 
                          onClick={() => setSelectedListing(listing)}
                          className="font-extrabold text-white text-base leading-snug mb-2 line-clamp-2 hover:text-blue-400 cursor-pointer transition-colors"
                        >
                          {listing.title}
                        </h3>

                        {/* Attribute Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {listing.listing_type === "vehicle" && (
                            <>
                              <span className="text-[11px] font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                KM: {listing.mileage ? Math.round(Number(listing.mileage)).toLocaleString('tr-TR') : 'Sıfır'}
                              </span>
                              {listing.brand && (
                                <span className="text-[11px] font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                  {listing.brand}
                                </span>
                              )}
                            </>
                          )}

                          {listing.listing_type === "real_estate" && (
                            <>
                              {listing.sector_data?.rooms && (
                                <span className="text-[11px] font-bold text-blue-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                  {listing.sector_data.rooms} Oda
                                </span>
                              )}
                              {(listing.sector_data?.city || listing.location) && (
                                <span className="text-[11px] font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-rose-500" />
                                  {listing.sector_data?.city || listing.location}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Footer Price & Store Buttons */}
                      <div className="pt-4 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Satıcı Mağaza</span>
                            <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {listing.store_name}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-black text-white">
                              {Math.round(Number(listing.price) || 0).toLocaleString('tr-TR')} <span className="text-xs text-blue-400">{listing.currency || 'TRY'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setSelectedListing(listing)}
                            className="py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 transition"
                          >
                            Hızlı İncele
                          </button>
                          <Link 
                            to={`/s/${listing.store_slug}/p/${listing.barcode || listing.id}`}
                            target="_blank"
                            className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold text-center transition flex items-center justify-center gap-1"
                          >
                            <span>Mağazaya Git</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* MODEL 2: COMPACT GRID (4 COLUMN) */}
              {viewMode === "compact" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredListings.map((listing: any) => (
                    <article 
                      key={listing.id}
                      className={`group ${cardBg} rounded-2xl p-3 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between`}
                    >
                      <div>
                        <div className="aspect-[4/3] bg-slate-950 rounded-xl mb-2.5 overflow-hidden relative">
                          {listing.image_url ? (
                            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700">Görsel Yok</div>
                          )}
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/90 text-white rounded text-[9px] font-bold">
                            {listing.category || "İlan"}
                          </span>
                        </div>

                        <h3 
                          onClick={() => setSelectedListing(listing)}
                          className="font-bold text-white text-xs line-clamp-2 hover:text-blue-400 cursor-pointer mb-2"
                        >
                          {listing.title}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs font-black text-amber-400">
                          {Math.round(Number(listing.price) || 0).toLocaleString('tr-TR')} {listing.currency || 'TL'}
                        </span>
                        <button 
                          onClick={() => setSelectedListing(listing)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg"
                        >
                          Detay
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* MODEL 3: DETAILED LIST / SPLIT ROW VIEW */}
              {viewMode === "list" && (
                <div className="space-y-4">
                  {filteredListings.map((listing: any) => (
                    <article 
                      key={listing.id}
                      className={`${cardBg} rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-blue-500/50 transition-all`}
                    >
                      <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="w-full md:w-48 h-36 bg-slate-950 rounded-2xl overflow-hidden flex-shrink-0 relative border border-slate-800">
                          {listing.image_url ? (
                            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700">Görsel Yok</div>
                          )}
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/90 text-amber-300 rounded text-[10px] font-bold">
                            {listing.category || "İlan"}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase text-blue-400 block mb-1">
                            {listing.store_name} — Doğrulanmış Mağaza
                          </span>
                          <h3 
                            onClick={() => setSelectedListing(listing)}
                            className="text-base font-black text-white hover:text-blue-400 cursor-pointer mb-2"
                          >
                            {listing.title}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-2 max-w-xl">
                            {listing.description ? cleanHtmlText(listing.description).replace(/<[^>]*>?/gm, '') : 'İlan açıklaması için tıklayın.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                        <span className="text-xl font-black text-white">
                          {Math.round(Number(listing.price) || 0).toLocaleString('tr-TR')} <span className="text-xs text-blue-400">{listing.currency || 'TL'}</span>
                        </span>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <button 
                            onClick={() => setSelectedListing(listing)}
                            className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                          >
                            İncele
                          </button>
                          <Link 
                            to={`/s/${listing.store_slug}/p/${listing.barcode || listing.id}`}
                            target="_blank"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1"
                          >
                            <span>Mağaza</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* ÖNE ÇIKAN SPONSOR MAĞAZALAR VİTRİNİ */}
        {featuredStores && featuredStores.length > 0 && (
          <section className="mt-12 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Seçkin Mağaza Vitrin Ortaklarımız
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredStores.map((store) => (
                <Link
                  key={store.id}
                  to={`/s/${store.slug}`}
                  className={`${cardBg} rounded-2xl p-4 hover:border-amber-500/50 transition-all group flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-amber-400">{store.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{store.sub_sector === 'vehicle' ? 'Oto Galeri' : 'Emlak Ofisi'}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {store.enrakipsiz_featured_title || "Kurumsal üye mağazamızı ziyaret ederek özel ilanlarımızı inceleyin."}
                    </p>
                  </div>
                  <span className="mt-4 text-[11px] font-extrabold text-blue-400 group-hover:underline flex items-center gap-1">
                    Mağazayı İncele &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* REGIONAL RADAR SHOWCASE SLIDER */}
        {portalNews && portalNews.length > 0 && (
          <section className="my-12">
            <RadarShowcaseSlider newsItems={portalNews} />
          </section>
        )}

        {/* SEO COMPLIANT ~500+ WORD TEXT & FAQ SECTION */}
        <section className={`my-16 p-8 rounded-3xl border ${cardBg}`}>
          <div className="max-w-4xl mx-auto space-y-6 text-sm leading-relaxed text-slate-400">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-black text-white mb-2">
                Türkiye'nin Doğrulanmış Emlak ve Otomotiv Portföy Pazaryeri — Enrakipsiz.com
              </h2>
              <p>
                <strong>Enrakipsiz.com</strong>, Türkiye ve KKTC genelindeki yetkili emlak danışmanları, inşaat firmaları ve kurumsal oto galeri mağazalarının güncel portföylerini tek bir dijital fihrist çatısı altında buluşturan yenilikçi bir ilan ve pazar yeridir. Sistemimiz üzerinde yer alan tüm satılık daire, kiralık konut, arsa, işyeri ve ikinci el vasıta ilanları, doğrudan yetkili üye mağazalarımız tarafından anlık olarak güncellenmektedir.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-extrabold text-amber-400 mb-2">🏠 Emlak & Gayrimenkul Klasörü</h3>
                <p className="text-xs leading-relaxed">
                  Emlak fihristimiz altında satılık konutlar, eşyalı kiralık daireler, kampüslere yakın öğrenci stüdyoları, deniz manzaralı villalar, arsa ve ticari mülkler kategorize edilmiş olarak sunulmaktadır. Filtreleme seçeneklerimiz sayesinde oda sayısı, eşya durumu, bölge ve fiyat aralıklarına göre saniyeler içinde aradığınız mülke ulaşabilirsiniz.
                </p>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-rose-400 mb-2">🚗 Vasıta & Oto Galeri Klasörü</h3>
                <p className="text-xs leading-relaxed">
                  Otomotiv fihristimizde son gelen ikinci el araçlar, acil satılık ve fiyatı düşen otomobiller, ilk araç alacaklara özel bütçe dostu seçenekler, az yakan dizel ve hibrit modeller ile SUV ve ticari araçlar yer alır. Tüm araçlar mağaza güvencesiyle sergilenir.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-base font-extrabold text-white mb-3">Sıkça Sorulan Sorular (SSS)</h3>
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-200">1. Enrakipsiz portalındaki ilanlar güvenilir mi?</h4>
                  <p className="mt-1">
                    Evet. Portalımızda yalnızca onaylı ve yetkili kurumsal mağazaların portföyleri yayınlanır. Bireysel sahte ilanlara izin verilmez.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">2. Mağaza açarak ilanlarımı nasıl yayınlayabilirim?</h4>
                  <p className="mt-1">
                    Emlak ofisiniz veya oto galeriniz için mağaza paneliniz üzerinden portföyünüzü eklediğinizde ilanlarınız otomatik olarak enrakipsiz.com portalında yayına alınır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* SLIDE-OVER RIGHT FILTER DRAWER ("EKRANIN SAĞINDAN ÇIKAN FİLTRE PANELİ") */}
      {isRightFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsRightFilterOpen(false)}
          />

          <aside className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className={`w-screen max-w-md ${cardBg} shadow-2xl flex flex-col justify-between p-6 overflow-y-auto`}>
              
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-black text-white">Detaylı Portföy Filtrele</h3>
                  </div>
                  <button 
                    onClick={() => setIsRightFilterOpen(false)}
                    className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sector Switch */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6">
                  <button
                    onClick={() => setMainTab("real_estate")}
                    className={`py-2 text-xs font-black rounded-lg transition ${
                      mainTab === "real_estate" ? "bg-blue-600 text-white" : "text-slate-400"
                    }`}
                  >
                    Emlak Filtreleri
                  </button>
                  <button
                    onClick={() => setMainTab("vehicle")}
                    className={`py-2 text-xs font-black rounded-lg transition ${
                      mainTab === "vehicle" ? "bg-rose-600 text-white" : "text-slate-400"
                    }`}
                  >
                    Araç Filtreleri
                  </button>
                </div>

                {/* Price Range Controls */}
                <div className="space-y-4 mb-6">
                  <label className="text-xs font-black text-slate-300 uppercase block">Fiyat Aralığı (TL / Döviz)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min Fiyat"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                    <input 
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max Fiyat"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Emlak Filters */}
                {mainTab === "real_estate" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-300 uppercase block mb-1">Şehir / Bölge</label>
                      <select 
                        value={reRegion}
                        onChange={(e) => setReRegion(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="all">Tüm Bölgeler</option>
                        <option value="Girne">Girne</option>
                        <option value="Lefkoşa">Lefkoşa</option>
                        <option value="İskele">İskele</option>
                        <option value="Gazimağusa">Gazimağusa</option>
                        <option value="Güzelyurt">Güzelyurt</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-300 uppercase block mb-1">Konut Tipi</label>
                      <select 
                        value={reType}
                        onChange={(e) => setReType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="all">Tüm Tipler</option>
                        <option value="Daire">Daire</option>
                        <option value="Villa">Villa</option>
                        <option value="Müstakil">Müstakil Ev</option>
                        <option value="Arsa">Arsa / Arazi</option>
                        <option value="Ofis">Ofis / Ticari</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-300 uppercase block mb-1">Oda Sayısı</label>
                      <select 
                        value={reRooms}
                        onChange={(e) => setReRooms(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="all">Tümü</option>
                        <option value="1+1">1+1 Stüdyo</option>
                        <option value="2+1">2+1 Konut</option>
                        <option value="3+1">3+1 Konut</option>
                        <option value="4+1">4+1 Lüks</option>
                        <option value="5+">5+ Villa</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Vehicle Filters */}
                {mainTab === "vehicle" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-300 uppercase block mb-1">Marka</label>
                      <input 
                        type="text"
                        value={activeVehicleBrand === "all" ? "" : activeVehicleBrand}
                        onChange={(e) => setActiveVehicleBrand(e.target.value || "all")}
                        placeholder="Örn: BMW, Mercedes, Audi..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-300 uppercase block mb-1">Yakıt Tipi</label>
                      <select 
                        value={activeVehicleFuel}
                        onChange={(e) => setActiveVehicleFuel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="all">Tüm Yakıtlar</option>
                        <option value="Benzin">Benzin</option>
                        <option value="Dizel">Dizel</option>
                        <option value="Hibrit">Hibrit</option>
                        <option value="Elektrik">Elektrik</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-300 uppercase block mb-1">Model Yılı Aralığı</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="number"
                          value={minYear}
                          onChange={(e) => setMinYear(e.target.value)}
                          placeholder="Min Yıl"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                        <input 
                          type="number"
                          value={maxYear}
                          onChange={(e) => setMaxYear(e.target.value)}
                          placeholder="Max Yıl"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Bottom Actions */}
              <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    setReRegion("all");
                    setReType("all");
                    setReRooms("all");
                    setActiveVehicleBrand("all");
                    setActiveVehicleFuel("all");
                    setMinYear("");
                    setMaxYear("");
                  }}
                  className="py-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl"
                >
                  Sıfırla
                </button>

                <button
                  onClick={() => setIsRightFilterOpen(false)}
                  className="py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-lg"
                >
                  Uygula ({filteredListings.length})
                </button>
              </div>

            </div>
          </aside>
        </div>
      )}

      {/* FULLSCREEN REELS STORY VIDEO MODAL */}
      {selectedStory && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm h-[80vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between">
            
            {/* Header Overlay */}
            <div className="absolute top-0 inset-x-0 p-4 z-20 bg-gradient-to-b from-slate-950/90 to-transparent flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-amber-400 block">{selectedStory.storeName}</span>
                <span className="text-[10px] text-white/80 font-bold">{selectedStory.title}</span>
              </div>
              <button 
                onClick={() => setSelectedStory(null)}
                className="p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Canvas */}
            <video 
              src={selectedStory.videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Bottom Overlay Action */}
            <div className="absolute bottom-0 inset-x-0 p-4 z-20 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">{selectedStory.price}</span>
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">{selectedStory.category}</span>
              </div>

              <Link
                to={`/s/${selectedStory.storeSlug}`}
                target="_blank"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Mağazaya Git ve İncele</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      )}

      {/* QUICK DETAIL MODAL */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-slate-800">
              <img src={selectedListing.image_url} alt={selectedListing.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>

            <span className="text-xs font-black text-amber-400 uppercase block mb-1">
              {selectedListing.store_name} — Portföy İlanı
            </span>
            <h3 className="text-xl font-black text-white mb-2">{selectedListing.title}</h3>
            
            <p className="text-2xl font-black text-blue-400 mb-4">
              {Math.round(Number(selectedListing.price) || 0).toLocaleString('tr-TR')} {selectedListing.currency || 'TL'}
            </p>

            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
              <Link
                to={`/s/${selectedListing.store_slug}/p/${selectedListing.barcode || selectedListing.id}`}
                target="_blank"
                className="py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs text-center rounded-xl flex items-center justify-center gap-1"
              >
                <span>Tüm Detayları Gör</span>
                <ExternalLink className="w-4 h-4" />
              </Link>

              <button
                onClick={() => {
                  const rawPhone = selectedListing.store_phone || "905330000000";
                  window.open(`https://wa.me/${rawPhone.replace(/\D/g, "")}`, "_blank");
                }}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1"
              >
                <PhoneCall className="w-4 h-4" />
                <span>WhatsApp İletişim</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-850 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-slate-300 mb-1">ENRAKİPSİZ PORTAL SİSTEMİ</p>
          <p className="max-w-md mx-auto leading-relaxed mb-6">
            Otomotiv ve Gayrimenkul Portföy Yönetimi. Tüm hakları saklıdır. © 2026 Enrakipsiz.com.
          </p>
          <div className="flex justify-center gap-6 font-semibold">
            <Link to="/" className="hover:text-blue-400">Ana Sayfa</Link>
            <a href="https://lookprice.net/login" className="hover:text-blue-400">Mağaza Paneli</a>
            <a href="https://lookprice.net/register" className="hover:text-blue-400">Mağaza Açın</a>
            <a href="/llms.txt" target="_blank" className="hover:text-blue-400">AI Index (llms.txt)</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
