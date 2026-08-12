import React, { useEffect, useState } from "react";
import { 
  MoveRight, 
  MapPin, 
  Map as MapIcon,
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
  Phone,
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
  ChevronDown,
  Key,
  Shield,
  RotateCcw
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "../components/RadarShowcaseSlider";
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from "../data/realEstateConfig";
import { SectorSpecs } from "../components/SectorSpecs";
import { IDXSplitMapView } from "../components/IDXSplitMapView";

type MainTab = "real_estate" | "vehicle";
type ViewMode = "rich" | "compact" | "list" | "map";

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

// Helper to format Category / Type accurately (Arsa, Tarla, Dükkan, Daire, Villa, etc.)
function formatCategory(listing: any) {
  if (!listing) return "İlan";
  if (listing.listing_type === "vehicle") {
    return listing.brand || listing.category || listing.sector_data?.model || "Vasıta";
  }
  
  const sec = listing.sector_data || {};
  const rawCatList = [
    sec.property_type,
    sec.propertyType,
    sec.type,
    sec.re_type,
    sec.category,
    sec.sub_category,
    listing.sub_category,
    listing.category,
    listing.type
  ].filter(Boolean).map(s => String(s));

  const rawCat = rawCatList.join(" ");
  const titleLower = (listing.title || "").toLowerCase();
  const rawLower = (rawCat || "").toLowerCase();

  // 1. Arsa Check
  if (rawLower.includes("arsa") || titleLower.includes("arsa") || sec.type === 'land' || sec.property_type === 'land') {
    return "Arsa";
  }

  // 2. Tarla / Arazi Check
  if (rawLower.includes("tarla") || titleLower.includes("tarla") || rawLower.includes("arazi") || titleLower.includes("arazi") || titleLower.includes("dönüm") || titleLower.includes("donum")) {
    return "Tarla / Arazi";
  }

  // 3. Ticari / Dükkan / İşyeri / Ofis Check
  if (
    rawLower.includes("dükkan") || rawLower.includes("dukkan") || 
    rawLower.includes("ofis") || rawLower.includes("işyeri") || rawLower.includes("isyeri") ||
    rawLower.includes("mağaza") || rawLower.includes("magaza") || rawLower.includes("ticari") ||
    sec.type === 'commercial' || titleLower.includes("dükkan") || titleLower.includes("dukkan") ||
    titleLower.includes("ofis") || titleLower.includes("işyeri") || titleLower.includes("isyeri") ||
    titleLower.includes("ticari") || titleLower.includes("mağaza")
  ) {
    return "Ticari / Dükkan";
  }

  // 4. Müstakil / Villa Check
  if (
    rawLower.includes("villa") || rawLower.includes("müstakil") || rawLower.includes("mustakil") ||
    titleLower.includes("villa") || titleLower.includes("müstakil") || titleLower.includes("mustakil") ||
    sec.type === 'villa'
  ) {
    return "Müstakil / Villa";
  }

  // 5. Daire / Konut Check
  if (
    rawLower.includes("daire") || titleLower.includes("daire") || 
    rawLower.includes("penthouse") || titleLower.includes("penthouse") ||
    rawLower.includes("stüdyo") || titleLower.includes("stüdyo") ||
    rawLower.includes("1+1") || rawLower.includes("2+1") || rawLower.includes("3+1") ||
    titleLower.includes("1+1") || titleLower.includes("2+1") || titleLower.includes("3+1") ||
    rawLower.includes("konut") || titleLower.includes("konut")
  ) {
    return "Daire";
  }

  // 6. Bina Check
  if (rawLower.includes("bina") || titleLower.includes("bina")) return "Bina";

  if (sec.property_type && typeof sec.property_type === 'string' && sec.property_type.trim() && sec.property_type.toLowerCase() !== "emlak") {
    return sec.property_type;
  }

  return "Daire";
}

// Helper to format upper and lower location (City / District)
function formatLocation(listing: any) {
  if (!listing) return "LEFKOŞA / Küçük Kaymaklı";
  const sec = listing.sector_data || {};
  let city = sec.kktc_region || sec.city || listing.city || "";
  let district = sec.district || sec.region || sec.neighborhood || listing.district || "";

  if (!city && listing.location && typeof listing.location === "string") {
    const parts = listing.location.split("/").map((s: string) => s.trim());
    if (parts.length >= 2) {
      city = parts[0];
      district = parts[1];
    } else if (parts.length === 1 && !parts[0].toLowerCase().includes("istanbul")) {
      city = parts[0];
    }
  }

  if (!city || city.toLowerCase() === "istanbul") {
    const titleLower = (listing.title || "").toLowerCase();
    if (titleLower.includes("girne") || titleLower.includes("alsancak") || titleLower.includes("lapta") || titleLower.includes("ozanköy")) {
      city = "GİRNE";
      district = titleLower.includes("alsancak") ? "Alsancak" : titleLower.includes("lapta") ? "Lapta" : titleLower.includes("ozanköy") ? "Ozanköy" : "Merkez";
    } else if (titleLower.includes("magusa") || titleLower.includes("mağusa") || titleLower.includes("iskele") || titleLower.includes("yeniboğaziçi")) {
      city = "GAZİMAĞUSA";
      district = titleLower.includes("iskele") ? "İskele" : titleLower.includes("yeniboğaziçi") ? "Yeniboğaziçi" : "Merkez";
    } else if (titleLower.includes("kadıköy") || titleLower.includes("beşiktaş") || titleLower.includes("şişli")) {
      city = "İSTANBUL";
      district = titleLower.includes("kadıköy") ? "Kadıköy" : titleLower.includes("beşiktaş") ? "Beşiktaş" : "Şişli";
    } else {
      city = "LEFKOŞA";
      district = "Küçük Kaymaklı";
    }
  }

  city = city.toUpperCase();
  if (district) {
    return `${city} / ${district}`;
  }
  return city;
}

// Helper to normalize and get listing intent (Satılık vs Kiralık)
function getListingIntent(item: any): "satilik" | "kiralik" {
  if (!item) return "satilik";

  const sec = item.sector_data || {};
  const rawIntent = (
    sec.listing_intent ||
    sec.intent ||
    sec.listing_type_intent ||
    item.listing_intent ||
    item.intent ||
    ""
  ).toString().toLowerCase();

  if (rawIntent.includes("kiralık") || rawIntent.includes("kiralik") || rawIntent.includes("rent")) {
    return "kiralik";
  }
  if (rawIntent.includes("satılık") || rawIntent.includes("satilik") || rawIntent.includes("sale")) {
    return "satilik";
  }

  const category = (item.category || "").toLowerCase();
  const title = (item.title || "").toLowerCase();
  const desc = (item.description || "").toLowerCase();

  if (
    category.includes("kiralık") ||
    category.includes("kiralik") ||
    title.includes("kiralık") ||
    title.includes("kiralik") ||
    title.includes("aylık") ||
    title.includes("depozito") ||
    desc.includes("kiralık") ||
    desc.includes("kiralik")
  ) {
    return "kiralik";
  }

  if (
    category.includes("satılık") ||
    category.includes("satilik") ||
    title.includes("satılık") ||
    title.includes("satilik")
  ) {
    return "satilik";
  }

  if (sec.rental_period || sec.period || item.rental_period || item.period) {
    return "kiralik";
  }

  return "satilik";
}

// Helper component for browsing images on listing cards without opening detail modal
function ListingCardImage({ 
  listing, 
  aspect = "aspect-[16/10]",
  className = "",
  disableCarousel = false,
  disableBadges = false,
  onImageClick 
}: { 
  listing: any; 
  aspect?: string; 
  className?: string;
  disableCarousel?: boolean;
  disableBadges?: boolean;
  onImageClick?: () => void;
}) {
  const images = React.useMemo(() => {
    const list: string[] = [];
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      list.push(...listing.images.filter((i: any) => typeof i === "string" && i.trim()));
    }
    if (listing.image_url && !list.includes(listing.image_url)) {
      list.unshift(listing.image_url);
    }
    return list;
  }, [listing]);

  const [currentIdx, setCurrentIdx] = useState(0);

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const intent = getListingIntent(listing);

  return (
    <div className={`bg-slate-950 overflow-hidden relative border border-slate-800/80 group/img ${aspect} ${className}`}>
      {images.length > 0 ? (
        <img
          src={images[currentIdx]}
          alt={listing.title || 'İlan görseli'}
          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 cursor-pointer"
          onClick={onImageClick}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div 
          onClick={onImageClick}
          className="w-full h-full flex flex-col items-center justify-center text-slate-600 cursor-pointer"
        >
          {listing.listing_type === 'vehicle' ? <Car className="w-8 h-8 opacity-30 text-rose-500" /> : <Home className="w-8 h-8 opacity-30 text-blue-500" />}
          <span className="text-[10px] uppercase font-bold text-slate-500 mt-1">Görsel Yok</span>
        </div>
      )}

      {/* Badges Over Image (Disabled in Table / List View) */}
      {!disableBadges && (
        <>
          {/* Category Tag Badge */}
          <div className="absolute top-2 left-2 px-2.5 py-1 bg-slate-950/90 backdrop-blur-md rounded-lg text-[10px] font-black text-amber-300 border border-slate-800 pointer-events-none z-10 shadow-lg">
            {formatCategory(listing)}
          </div>

          {/* Intent Badge (Satılık / Kiralık) */}
          {listing.listing_type === 'real_estate' && (
            <div className={`absolute top-2 right-2 px-2.5 py-1 backdrop-blur-md rounded-lg text-[10px] font-black border z-10 shadow-lg pointer-events-none ${
              intent === 'kiralik'
                ? "bg-purple-950/95 text-purple-200 border-purple-500/80 ring-2 ring-purple-500/30"
                : "bg-emerald-950/95 text-emerald-200 border-emerald-500/80 ring-2 ring-emerald-500/30"
            }`}>
              {intent === 'kiralik' ? '🔑 KİRALIK' : '🏷️ SATILIK'}
            </div>
          )}
        </>
      )}

      {/* Multiple Images Chevron Nav Buttons & Indicator (Disabled in Table View Mode) */}
      {!disableCarousel && images.length > 1 && (
        <>
          <button
            onClick={prevImg}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/85 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-blue-600 hover:border-blue-400 z-20 cursor-pointer shadow-xl"
            title="Önceki Fotoğraf"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextImg}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-950/85 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-blue-600 hover:border-blue-400 z-20 cursor-pointer shadow-xl"
            title="Sonraki Fotoğraf"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Photo Counter Badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/90 text-white backdrop-blur-md rounded-md text-[10px] font-black border border-white/10 z-10 pointer-events-none">
            {currentIdx + 1}/{images.length}
          </div>

          {/* Dot Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 pointer-events-none">
            {images.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentIdx ? "w-3 bg-amber-400" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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

  // Property Type Filter (for Emlak)
  const [rePropertyType, setRePropertyType] = useState<string>("all");
  const [reSubPropertyType, setReSubPropertyType] = useState<string>("all");
  // Active Tag Filters
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // 4 Grid View Options
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

  // Pagination state: limit initially to 12
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [mainTab, reFihristTab, vehFihristTab, searchQuery, viewMode, activeSubSector, activeVehicleBrand, activeVehicleFuel, activeVehicleTransmission, minPrice, maxPrice, minYear, maxYear, reRegion, reType, reRooms, reFurnished, sortBy, rePropertyType, activeTags]);

  // Modal / Detail / Video Story States
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);

  // Close story modal on Escape key
  useEffect(() => {
    if (!selectedStory) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedStory(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedStory]);

  // Portal Settings from Backend
  const [portalSettings, setPortalSettings] = useState<any>({
    portal_title: "Doğrulanmış Emlak ve Otomotiv Portföy Pazaryeri",
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

  // Custom Logo and Favicon resolution
  const customLogo = portalSettings?.portal_logo_url || localStorage.getItem("enrakipsiz_portal_logo") || "/enrakipsiz-logo.svg";
  const customFavicon = portalSettings?.favicon_url || localStorage.getItem("enrakipsiz_portal_favicon") || "/enrakipsiz-favicon.svg";

  useEffect(() => {
    if (customFavicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = customFavicon;
      }
    }
  }, [customFavicon]);

  useEffect(() => {
    document.title = portalSettings?.seo_title || "EnRakipsiz | Seçkin Emlak ve Otomotiv Portföy Pazaryeri";
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

  const formatDescriptionText = (rawStr?: string) => {
    if (!rawStr) return "";
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawStr, "text/html");
      const text = doc.body.textContent || doc.body.innerText || "";
      return text.replace(/\n\s*\n/g, "\n\n").trim();
    } catch (e) {
      return rawStr.replace(/<[^>]*>?/gm, "").trim();
    }
  };

  const handleCloseModal = () => {
    if (selectedListing) {
      setSelectedListing(null);
      if (window.history.state && window.history.state.marketplaceModal) {
        window.history.back();
      }
    }
  };

  useEffect(() => {
    if (!selectedListing) return;

    setActiveDetailImageIndex(0);

    const modalState = { marketplaceModal: true, listingId: selectedListing.id };
    window.history.pushState(modalState, "");

    const handlePopState = () => {
      setSelectedListing(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedListing?.id]);

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

    // Fihrist Sub-Tab Filtering for Emlak
    if (mainTab === "real_estate") {
      const itemIntent = getListingIntent(item);
      const category = (item.category || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const secData = item.sector_data || {};

      // SATILIK vs KİRALIK
      if (reFihristTab === "satilik" && itemIntent !== "satilik") {
        return false;
      }
      if (reFihristTab === "kiralik" && itemIntent !== "kiralik") {
        return false;
      }

      // Mülk Tipi Filter (Daire, Villa, Arsa, Tarla, Ticari)
      if (rePropertyType !== "all") {
        const catFormatted = formatCategory(item).toLowerCase();
        const categoryStr = (item.category || "").toLowerCase();
        const titleStr = (item.title || "").toLowerCase();
        const secType = String(secData.type || secData.property_type || secData.re_type || "").toLowerCase();

        if (rePropertyType === "daire" || rePropertyType === "konut") {
          const isNotDaire = catFormatted.includes("arsa") || catFormatted.includes("tarla") || catFormatted.includes("arazi") || catFormatted.includes("ticari") || catFormatted.includes("dükkan") || catFormatted.includes("villa") || catFormatted.includes("müstakil");
          if (isNotDaire) return false;

          const isDaire = catFormatted.includes("daire") || categoryStr.includes("daire") || titleStr.includes("daire") || categoryStr.includes("konut") || titleStr.includes("konut") || titleStr.includes("1+1") || titleStr.includes("2+1") || titleStr.includes("3+1") || titleStr.includes("stüdyo");
          if (!isDaire) return false;
        } else if (rePropertyType === "villa") {
          const isVilla = catFormatted.includes("villa") || catFormatted.includes("müstakil") || categoryStr.includes("villa") || titleStr.includes("villa") || titleStr.includes("müstakil");
          if (!isVilla) return false;
        } else if (rePropertyType === "arsa") {
          const isArsa = catFormatted === "arsa" || categoryStr.includes("arsa") || titleStr.includes("arsa") || secType.includes("land") || secType.includes("arsa");
          if (!isArsa) return false;
        } else if (rePropertyType === "tarla") {
          const isTarla = catFormatted.includes("tarla") || catFormatted.includes("arazi") || categoryStr.includes("tarla") || titleStr.includes("tarla") || titleStr.includes("arazi") || titleStr.includes("dönüm");
          if (!isTarla) return false;
        } else if (rePropertyType === "ticari") {
          const isArsaOrTarla = catFormatted.includes("arsa") || catFormatted.includes("tarla") || catFormatted.includes("arazi") || categoryStr.includes("arsa") || categoryStr.includes("tarla") || categoryStr.includes("arazi");
          if (isArsaOrTarla) return false;

          const isTicari = catFormatted.includes("ticari") || catFormatted.includes("dükkan") || categoryStr.includes("dükkan") || categoryStr.includes("ofis") || titleStr.includes("dükkan") || titleStr.includes("ofis") || titleStr.includes("işyeri") || titleStr.includes("ticari") || secType.includes("commercial");
          if (!isTicari) return false;
        }
      }

      // Sub-Property Type Dynamic Filtering
      if (reSubPropertyType !== "all") {
        const titleLower = (item.title || "").toLowerCase();
        const descLower = (item.description || "").toLowerCase();
        const subLower = reSubPropertyType.toLowerCase();
        if (!titleLower.includes(subLower) && !descLower.includes(subLower)) {
          return false;
        }
      }

      // Tag Filtering
      if (activeTags.length > 0) {
        for (const tag of activeTags) {
          if (tag === "öğrenci") {
            const m = title.includes("öğrenci") || title.includes("stüdyo") || title.includes("1+1") || title.includes("eşyalı") || secData.furnished || desc.includes("öğrenci") || desc.includes("kampüs");
            if (!m) return false;
          } else if (tag === "eşyalı") {
            const m = secData.furnished || title.includes("eşyalı") || desc.includes("eşyalı") || category.includes("eşyalı");
            if (!m) return false;
          } else if (tag === "kampüs") {
            const m = title.includes("kampüs") || title.includes("üniversite") || title.includes("ydü") || title.includes("daü") || title.includes("gau") || desc.includes("kampüs") || desc.includes("üniversite");
            if (!m) return false;
          } else if (tag === "hemen") {
            const m = title.includes("hemen") || title.includes("hazır") || desc.includes("hemen") || desc.includes("hazır");
            if (!m) return false;
          } else if (tag === "plaza") {
            const m = title.includes("plaza") || title.includes("işevi") || category.includes("ofis") || desc.includes("plaza");
            if (!m) return false;
          } else if (tag === "deniz") {
            const m = title.includes("deniz") || title.includes("sahil") || desc.includes("deniz") || (item.location || "").toLowerCase().includes("long beach");
            if (!m) return false;
          } else if (tag === "cadde") {
            const m = title.includes("cadde") || title.includes("bulvar") || desc.includes("cadde");
            if (!m) return false;
          } else if (tag === "kredi") {
            const m = title.includes("kredi") || desc.includes("kredi") || secData.deed_type === "Türk Koçanlı" || category.includes("kredi");
            if (!m) return false;
          } else if (tag === "koçan") {
            const m = secData.deed_type || title.includes("koçan") || title.includes("tapu") || desc.includes("koçan");
            if (!m) return false;
          } else if (tag === "otopark") {
            const m = title.includes("otopark") || desc.includes("otopark") || secData.parking;
            if (!m) return false;
          } else if (tag === "havuz") {
            const m = title.includes("havuz") || desc.includes("havuz") || secData.pool;
            if (!m) return false;
          } else if (tag === "manzara") {
            const m = title.includes("manzara") || desc.includes("manzara");
            if (!m) return false;
          } else if (tag === "sıfır") {
            const m = title.includes("sıfır") || title.includes("proje") || title.includes("yeni") || desc.includes("sıfır");
            if (!m) return false;
          }
        }
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

  const stats = React.useMemo(() => {
    const activeListings = listings.filter(i => (!i.status || i.status === 'active') && i.listing_type !== 'product');
    let reCount = 0;
    let vehCount = 0;

    activeListings.forEach(i => {
      if (i.listing_type === 'vehicle' || i.type === 'vehicle' || (i.category && i.category.toLowerCase().includes('vasıta')) || (i.category && i.category.toLowerCase().includes('otomobil'))) {
        vehCount++;
      } else {
        reCount++;
      }
    });

    return {
      total: activeListings.length,
      properties: reCount || (listings.length > 0 ? listings.length - vehCount : 0),
      vehicles: vehCount,
    };
  }, [listings]);

  const bgCanvas = isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900";
  const cardBg = isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-slate-200 shadow-md";
  const headerBg = isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-200 shadow-sm";

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden font-sans transition-colors duration-300 ${bgCanvas}`}>
      
      {/* Dynamic SEO Headings (sr-only for search engines) */}
      <h1 className="sr-only">
        Doğrulanmış Emlak ve Otomotiv Portföy Pazaryeri — Enrakipsiz
      </h1>

      {/* Top Navbar Header */}
      <nav className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${headerBg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Official Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.01]">
            <div className="h-10 md:h-12 flex items-center px-3 py-1 rounded-xl bg-white border border-slate-200/90 shadow-md shadow-slate-900/10">
              <img 
                src={customLogo} 
                alt="Enrakipsiz Logo" 
                className="h-8 md:h-10 w-auto object-contain max-w-full"
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = "/enrakipsiz-logo.svg";
                }}
              />
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

      {/* 📁 PHYSICAL FILE FOLDER TAB SYSTEM */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        
        {/* Top Tier Primary Folder Tabs (EMLAK vs ARAÇLAR) */}
        <div className="grid grid-cols-2 w-full items-end gap-2 border-b-4 border-blue-600 pt-2 px-2 select-none">
          
          {/* EMLAK PRIMARY TAB */}
          <button
            onClick={() => {
              setMainTab("real_estate");
              setReFihristTab("satilik");
            }}
            className={`flex items-center justify-center gap-2 px-3 md:px-8 py-3.5 rounded-t-2xl font-black text-xs sm:text-sm md:text-base transition-all duration-200 border-t-2 border-x-2 relative cursor-pointer ${
              mainTab === "real_estate"
                ? "bg-blue-600 text-white border-blue-500 shadow-2xl translate-y-1 z-10"
                : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
            <span className="uppercase tracking-wider truncate">EMLAK</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black shrink-0 ${
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
            className={`flex items-center justify-center gap-2 px-3 md:px-8 py-3.5 rounded-t-2xl font-black text-xs sm:text-sm md:text-base transition-all duration-200 border-t-2 border-x-2 relative cursor-pointer ${
              mainTab === "vehicle"
                ? "bg-rose-600 text-white border-rose-500 shadow-2xl translate-y-1 z-10"
                : "bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border-slate-700 hover:text-white"
            }`}
          >
            <Car className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
            <span className="uppercase tracking-wider truncate">ARAÇLAR</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black shrink-0 ${
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
            <div className="space-y-4 pb-4 border-b border-slate-800">

              {/* ACTIVE SELECTION BREADCRUMBS & RESET BAR */}
              {(reFihristTab !== "all" || rePropertyType !== "all" || reSubPropertyType !== "all" || reRegion !== "all" || activeTags.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950/90 rounded-2xl border border-blue-500/30">
                  <span className="text-[11px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5 text-blue-400" /> Aktif Seçimler:
                  </span>

                  {/* Selected Satılık / Kiralık Tag */}
                  {reFihristTab !== "all" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-black border border-blue-400 shadow-md">
                      <span>{reFihristTab === "satilik" ? "SATILIK EMLAK" : "KİRALIK EMLAK"}</span>
                      <button 
                        onClick={() => setReFihristTab("all")} 
                        className="ml-1 p-0.5 hover:bg-blue-700 rounded-md transition-colors text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                        title="Seçimi Kaldır ve Değiştir"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="text-[10px]">Geri</span>
                      </button>
                    </div>
                  )}

                  {/* Selected Mülk Tipi Tag */}
                  {rePropertyType !== "all" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 rounded-xl text-xs font-black border border-amber-300 shadow-md">
                      <span>
                        {rePropertyType === "daire" && "Daire"}
                        {rePropertyType === "villa" && "Müstakil / Villa"}
                        {rePropertyType === "arsa" && "Arsa"}
                        {rePropertyType === "tarla" && "Tarla / Arazi"}
                        {rePropertyType === "ticari" && "Ticari / Dükkan"}
                        {rePropertyType === "konut" && "Konut / Daire"}
                      </span>
                      <button 
                        onClick={() => { setRePropertyType("all"); setReSubPropertyType("all"); }} 
                        className="ml-1 p-0.5 hover:bg-amber-600 rounded-md transition-colors text-slate-950 font-bold flex items-center gap-1 cursor-pointer"
                        title="Seçimi Kaldır ve Değiştir"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="text-[10px]">Geri</span>
                      </button>
                    </div>
                  )}

                  {/* Selected Sub Property Type Tag */}
                  {reSubPropertyType !== "all" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 rounded-xl text-xs font-black border border-emerald-300 shadow-md">
                      <span>{reSubPropertyType}</span>
                      <button 
                        onClick={() => setReSubPropertyType("all")} 
                        className="ml-1 p-0.5 hover:bg-emerald-600 rounded-md transition-colors text-slate-950 font-bold flex items-center gap-1 cursor-pointer"
                        title="Seçimi Kaldır"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="text-[10px]">Geri</span>
                      </button>
                    </div>
                  )}

                  {/* Selected Şehir Tag */}
                  {reRegion !== "all" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-black border border-rose-400 shadow-md">
                      <span>📍 {reRegion.toUpperCase()}</span>
                      <button 
                        onClick={() => setReRegion("all")} 
                        className="ml-1 p-0.5 hover:bg-rose-700 rounded-md transition-colors text-white font-bold flex items-center gap-1 cursor-pointer"
                        title="Seçimi Kaldır ve Değiştir"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="text-[10px]">Geri</span>
                      </button>
                    </div>
                  )}

                  {/* Active Tags */}
                  {activeTags.map(tag => (
                    <div key={tag} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-amber-300 rounded-xl text-xs font-bold border border-slate-700">
                      <span>#{tag}</span>
                      <button 
                        onClick={() => setActiveTags(prev => prev.filter(t => t !== tag))} 
                        className="ml-1 hover:text-white cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {/* Reset All Filters Button */}
                  <button
                    onClick={() => {
                      setReFihristTab("all");
                      setRePropertyType("all");
                      setReSubPropertyType("all");
                      setReRegion("all");
                      setActiveTags([]);
                      setSearchQuery("");
                    }}
                    className="ml-auto text-[11px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Filtreleri Temizle</span>
                  </button>
                </div>
              )}

              {/* STEP 1: SATILIK / KİRALIK SEÇİMİ (Seçilince gizlenir) */}
              {reFihristTab === "all" && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    1. Emlak Niyeti Seçin:
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {[
                      { id: "satilik", label: "SATILIK EMLAK", icon: Tag, desc: "Satılık Daire, Villa & Arsa" },
                      { id: "kiralik", label: "KİRALIK EMLAK", icon: Key, desc: "Kiralık Konut & İşyeri" }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setReFihristTab(tab.id)}
                          className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs md:text-sm font-black transition-all duration-200 border cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-blue-600 text-white border-blue-400 hover:bg-blue-500"
                        >
                          <Icon className="w-4 h-4 text-amber-300" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: MÜLK TİPİ SEÇİMİ (Seçilince gizlenir) */}
              {rePropertyType === "all" && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    {reFihristTab === "all" ? "2. Mülk Tipi Filtresi (Opsiyonel):" : "2. Mülk Tipi Seçin:"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "daire", label: "Daire" },
                      { id: "villa", label: "Müstakil / Villa" },
                      { id: "arsa", label: "Arsa" },
                      { id: "tarla", label: "Tarla / Arazi" },
                      { id: "ticari", label: "Ticari / Dükkan" }
                    ].map((pt) => (
                      <button
                        key={pt.id}
                        onClick={() => {
                          setRePropertyType(pt.id);
                          setReSubPropertyType("all");
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-slate-950/90 border-slate-700 text-slate-200 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-400 shadow-sm"
                      >
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2.5: DINAMIK DETAYLI ALT TİP / ODA / KATEGORİ FİLTRELEME */}
              {rePropertyType !== "all" && (
                <div className="space-y-1.5 pt-1 animate-fadeIn">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Detaylı Alt Kriterler ({rePropertyType.toUpperCase()}):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setReSubPropertyType("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        reSubPropertyType === "all"
                          ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                          : "bg-slate-950/90 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      Tümü
                    </button>
                    {(rePropertyType === "daire" || rePropertyType === "konut"
                      ? ["1+1", "2+1", "3+1", "Stüdyo", "Penthouse", "Dubleks"]
                      : rePropertyType === "villa"
                      ? ["Müstakil Villa", "İkiz Villa", "Yazlık", "Residence"]
                      : rePropertyType === "arsa"
                      ? ["İmarlı Arsa", "Bahçeli Arsa", "Turistik Arsa"]
                      : rePropertyType === "tarla"
                      ? ["Tarla", "Zeytinlik", "Arazi"]
                      : rePropertyType === "ticari"
                      ? ["Dükkan", "Ofis", "İş Yeri", "Plaza", "Depo"]
                      : []
                    ).map((sub) => (
                      <button
                        key={sub}
                        onClick={() => setReSubPropertyType(sub)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          reSubPropertyType === sub
                            ? "bg-emerald-600 text-white border-emerald-400 shadow-md"
                            : "bg-slate-950/90 border-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: ŞEHİR / BÖLGE SEÇİMİ (Seçilince gizlenir) */}
              {reRegion === "all" && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    3. Şehir / Bölge Seçin:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "Girne", label: "GİRNE" },
                      { id: "Lefkoşa", label: "LEFKOŞA" },
                      { id: "Gazimağusa", label: "GAZİMAĞUSA" },
                      { id: "İskele", label: "İSKELE" },
                      { id: "Lefke", label: "LEFKE" },
                      { id: "Güzelyurt", label: "GÜZELYURT" }
                    ].map((reg) => (
                      <button
                        key={reg.id}
                        onClick={() => setReRegion(reg.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white hover:border-rose-400 shadow-sm"
                      >
                        📍 {reg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Etiketler Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(reFihristTab === "kiralik"
                  ? [
                      { id: "öğrenci", label: "Öğrenci & Stüdyo" },
                      { id: "eşyalı", label: "Eşyalı Konut" },
                      { id: "kampüs", label: "Kampüse Yakın" },
                      { id: "hemen", label: "Hemen Teslim" },
                      { id: "plaza", label: "Plaza / Ofis" },
                      { id: "deniz", label: "Denize Sıfır" },
                      { id: "cadde", label: "Cadde Üzeri" }
                    ]
                  : [
                      { id: "kredi", label: "Krediye Uygun" },
                      { id: "koçan", label: "Türk Koçanlı" },
                      { id: "otopark", label: "Otoparklı" },
                      { id: "havuz", label: "Yüzme Havuzlu" },
                      { id: "manzara", label: "Manzaralı" },
                      { id: "sıfır", label: "Sıfır / Projeden" }
                    ]
                ).map((tagObj) => {
                  const isSelected = activeTags.includes(tagObj.id);
                  const toggleTag = () => {
                    setActiveTags(prev =>
                      prev.includes(tagObj.id)
                        ? prev.filter(t => t !== tagObj.id)
                        : [...prev, tagObj.id]
                    );
                  };

                  return (
                    <button
                      key={tagObj.id}
                      onClick={toggleTag}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 ${
                        isSelected
                          ? "bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md shadow-amber-500/20"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      <span>{tagObj.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}

                {activeTags.length > 0 && (
                  <button
                    onClick={() => setActiveTags([])}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80 hover:bg-rose-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Temizle ({activeTags.length})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SUB-FIHRIST FOLDER TABS BAR FOR VEHICLE */}
          {mainTab === "vehicle" && (
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-slate-800">
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

          {/* TOOLBAR BAR (4 VIEW SWITCHER + SORTING + COUNT) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mb-6">
            
            {/* View Mode Switcher (4 Farklı Görünüm Modeli) */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
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

              {/* Model 3: Detailed List */}
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
                title="Detaylı Tablo Liste Modeli"
              >
                <ListFilter className="w-4 h-4" />
                <span className="hidden md:inline">Detaylı Liste</span>
              </button>

              {/* Model 4: Map View */}
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === "map"
                    ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
                title="Harita Üzerinde Keşfet"
              >
                <MapIcon className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Haritada Göster</span>
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
                  {filteredListings.slice(0, visibleCount).map((listing: any) => (
                    <article 
                      key={listing.id}
                      className={`group ${cardBg} rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between`}
                    >
                      <div>
                        {/* Cover Image Carousel */}
                        <ListingCardImage 
                          listing={listing} 
                          aspect="aspect-[16/10]" 
                          className="rounded-2xl mb-4" 
                          onImageClick={() => setSelectedListing(listing)} 
                        />

                        {/* Title */}
                        <h3 
                          onClick={() => setSelectedListing(listing)}
                          className={`font-extrabold text-base leading-snug mb-2 line-clamp-2 hover:text-blue-400 cursor-pointer transition-colors ${isDarkMode ? "text-white" : "text-slate-900"}`}
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
                            <span className="text-lg font-black text-slate-900 dark:text-white">
                              {Math.round(Number(listing.price) || 0).toLocaleString('tr-TR')} <span className="text-xs text-blue-600 dark:text-blue-400">{listing.currency || 'TRY'}</span>
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
                  {filteredListings.slice(0, visibleCount).map((listing: any) => (
                    <article 
                      key={listing.id}
                      className={`group ${cardBg} rounded-2xl p-3 hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between`}
                    >
                      <div>
                        <ListingCardImage 
                          listing={listing} 
                          aspect="aspect-[4/3]" 
                          className="rounded-xl mb-2.5" 
                          onImageClick={() => setSelectedListing(listing)} 
                        />

                        <h3 
                          onClick={() => setSelectedListing(listing)}
                          className={`font-bold text-xs line-clamp-2 hover:text-blue-400 cursor-pointer mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
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

              {/* MODEL 3: DETAILED STRUCTURED TABLE VIEW */}
              {viewMode === "list" && (
                <div className={`overflow-x-auto rounded-2xl border ${isDarkMode ? "border-slate-800 bg-slate-950/90 shadow-xl" : "border-slate-200 bg-white shadow-md"}`}>
                  <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                    <thead>
                      <tr className={`${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-800"} border-b font-black uppercase text-[11px] tracking-wider`}>
                        <th className="p-3 w-36 text-center border-r border-slate-800">Fotoğraf</th>
                        {mainTab === "vehicle" ? (
                          <>
                            <th className="p-3 border-r border-slate-800">Marka</th>
                            <th className="p-3 border-r border-slate-800">Seri</th>
                            <th className="p-3 border-r border-slate-800">Model</th>
                            <th className="p-3 border-r border-slate-800 min-w-[220px]">İlan Başlığı</th>
                            <th className="p-3 text-center border-r border-slate-800">Yıl</th>
                            <th className="p-3 text-right border-r border-slate-800">KM</th>
                            <th className="p-3 text-right border-r border-slate-800">Fiyat</th>
                            <th className="p-3 text-center border-r border-slate-800">İlan Tarihi</th>
                            <th className="p-3 border-r border-slate-800">İl / İlçe</th>
                          </>
                        ) : (
                          <>
                            <th className="p-3 border-r border-slate-800">Kategori / Tip</th>
                            <th className="p-3 text-center border-r border-slate-800">Oda</th>
                            <th className="p-3 text-right border-r border-slate-800">m² (Brüt)</th>
                            <th className="p-3 border-r border-slate-800 min-w-[220px]">İlan Başlığı</th>
                            <th className="p-3 text-center border-r border-slate-800">Isınma / Kat</th>
                            <th className="p-3 text-right border-r border-slate-800">Fiyat</th>
                            <th className="p-3 text-center border-r border-slate-800">İlan Tarihi</th>
                            <th className="p-3 border-r border-slate-800">İl / İlçe</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredListings.slice(0, visibleCount).map((listing: any) => {
                        const price = Math.round(Number(listing.price) || 0).toLocaleString('tr-TR');
                        const currency = listing.currency || 'TL';
                        const dateStr = listing.created_at 
                          ? new Date(listing.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '12 Ağustos 2026';
                        const loc = formatLocation(listing);

                        if (mainTab === "vehicle" || listing.listing_type === "vehicle") {
                          const brand = listing.brand || listing.sector_data?.brand || "-";
                          const seri = listing.sector_data?.series || listing.sector_data?.seri || (listing.title ? listing.title.split(' ')[1] : "-");
                          const model = listing.sector_data?.model || listing.category || "-";
                          const year = listing.year || listing.sector_data?.year || listing.sector_data?.model_year || "-";
                          const km = listing.mileage 
                            ? Math.round(Number(listing.mileage)).toLocaleString('tr-TR') 
                            : (listing.sector_data?.km ? Number(listing.sector_data.km).toLocaleString('tr-TR') : "-");

                          return (
                            <tr 
                              key={listing.id} 
                              className="hover:bg-blue-950/30 transition-colors border-b border-slate-800/50 group"
                            >
                              <td className="p-2 border-r border-slate-800/60 align-middle">
                                <ListingCardImage 
                                  listing={listing} 
                                  aspect="aspect-[4/3]" 
                                  className="w-32 h-20 rounded-xl" 
                                  disableCarousel={true}
                                  disableBadges={true}
                                  onImageClick={() => setSelectedListing(listing)} 
                                />
                              </td>
                              <td className="p-3 font-bold text-slate-200 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {brand}
                              </td>
                              <td className="p-3 font-semibold text-blue-400 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {seri}
                              </td>
                              <td className="p-3 text-slate-300 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {model}
                              </td>
                              <td className="p-3 border-r border-slate-800/60 align-middle">
                                <div 
                                  onClick={() => setSelectedListing(listing)} 
                                  className={`font-bold hover:text-blue-400 cursor-pointer line-clamp-2 leading-snug ${isDarkMode ? "text-white" : "text-slate-900"}`}
                                >
                                  {listing.title}
                                </div>
                                {listing.store_name && (
                                  <span className="text-[10px] font-semibold text-amber-400 block mt-1">
                                    {listing.store_name}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center font-bold text-slate-300 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {year}
                              </td>
                              <td className="p-3 text-right font-semibold text-slate-300 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {km}
                              </td>
                              <td className="p-3 text-right font-black text-rose-500 text-sm md:text-base border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {price} {currency}
                              </td>
                              <td className="p-3 text-center text-slate-400 text-[11px] border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {dateStr}
                              </td>
                              <td className="p-3 text-slate-300 text-[11px] align-middle whitespace-nowrap">
                                {loc}
                              </td>
                            </tr>
                          );
                        } else {
                          const reType = formatCategory(listing);
                          const rooms = listing.sector_data?.rooms || listing.sector_data?.oda || "-";
                          const m2 = listing.sector_data?.gross_m2 
                            ? `${listing.sector_data.gross_m2} m²` 
                            : (listing.sector_data?.m2 ? `${listing.sector_data.m2} m²` : "-");
                          const heating = listing.sector_data?.heating || listing.sector_data?.building_age || listing.sector_data?.floor || "-";

                          return (
                            <tr 
                              key={listing.id} 
                              className="hover:bg-blue-950/30 transition-colors border-b border-slate-800/50 group"
                            >
                              <td className="p-2 border-r border-slate-800/60 align-middle">
                                <ListingCardImage 
                                  listing={listing} 
                                  aspect="aspect-[4/3]" 
                                  className="w-32 h-20 rounded-xl" 
                                  disableCarousel={true}
                                  disableBadges={true}
                                  onImageClick={() => setSelectedListing(listing)} 
                                />
                              </td>
                              <td className="p-3 font-bold text-amber-300 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {reType}
                              </td>
                              <td className="p-3 text-center font-bold text-slate-200 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {rooms}
                              </td>
                              <td className="p-3 text-right font-semibold text-slate-300 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {m2}
                              </td>
                              <td className="p-3 border-r border-slate-800/60 align-middle">
                                <div 
                                  onClick={() => setSelectedListing(listing)} 
                                  className={`font-bold hover:text-blue-400 cursor-pointer line-clamp-2 leading-snug ${isDarkMode ? "text-white" : "text-slate-900"}`}
                                >
                                  {listing.title}
                                </div>
                                {listing.store_name && (
                                  <span className="text-[10px] font-semibold text-amber-400 block mt-1">
                                    {listing.store_name}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center text-slate-400 border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {heating}
                              </td>
                              <td className="p-3 text-right font-black text-rose-500 text-sm md:text-base border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {price} {currency}
                              </td>
                              <td className="p-3 text-center text-slate-400 text-[11px] border-r border-slate-800/60 align-middle whitespace-nowrap">
                                {dateStr}
                              </td>
                              <td className="p-3 text-slate-300 text-[11px] align-middle whitespace-nowrap">
                                {loc}
                              </td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* MODEL 4: MAP INTERACTIVE DISCOVERY VIEW */}
              {viewMode === "map" && (
                <div className="w-full h-[700px] md:h-[750px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 my-2">
                  <IDXSplitMapView
                    products={filteredListings as any}
                    store={{
                      id: "enrakipsiz-portal",
                      name: "Enrakipsiz Portföy Pazaryeri",
                      slug: "enrakipsiz-portal",
                      store_type: mainTab,
                      page_layout_settings: { sector: mainTab }
                    } as any}
                    lang="tr"
                    onViewProduct={(item: any) => setSelectedListing(item)}
                    formatPrice={(price: any, curr: any) => `${Number(price || 0).toLocaleString('tr-TR')} ${curr || '₺'}`}
                  />
                </div>
              )}

              {/* PAGINATION / DAHA FAZLA GÖSTER BUTTON */}
              {filteredListings.length > visibleCount && (
                <div className="mt-10 text-center flex flex-col items-center justify-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">
                    Toplam {filteredListings.length} ilandan {Math.min(visibleCount, filteredListings.length)} adedi gösteriliyor
                  </span>
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-600/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border border-blue-400/30"
                  >
                    <span>Daha Fazla İlan Göster (+12)</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
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
              {featuredStores.map((store) => {
                const isAuto = store.store_type === 'motor_vehicle' || store.sector === 'automotive' || store.sub_sector === 'vehicle' || store.store_type === 'vehicle';
                const isGeneral = store.store_type === 'retail' || store.store_type === 'general';
                const partnerSectorLabel = isAuto ? 'Oto Galeri' : isGeneral ? 'Perakende Mağaza' : 'Emlak Ofisi';
                return (
                  <Link
                    key={store.id}
                    to={`/s/${store.slug}`}
                    className={`${cardBg} rounded-2xl p-4 hover:border-amber-500/50 transition-all group flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-amber-400">{store.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{partnerSectorLabel}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {store.enrakipsiz_featured_title || "Kurumsal üye mağazamızı ziyaret ederek özel ilanlarımızı inceleyin."}
                      </p>
                    </div>
                    <span className="mt-4 text-[11px] font-extrabold text-blue-400 group-hover:underline flex items-center gap-1">
                      Mağazayı İncele &rarr;
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 15-Second Short Video Reels Story Strip */}
        <section className="mt-12 mb-8">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <Play className="w-4 h-4 text-rose-500 animate-pulse fill-rose-500" />
              </div>
              <span className="text-slate-900 dark:text-white font-black">
                Canlı Portföy Reels & Video Turlar
              </span>
            </div>
            <span className="text-xs text-amber-400 font-extrabold px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>15 Sn Dikey Turlar</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-5">
            {DEFAULT_STORIES.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className="relative rounded-3xl overflow-hidden border border-slate-800 hover:border-amber-400/70 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-amber-500/20 group cursor-pointer aspect-[9/14] bg-slate-950 flex flex-col justify-between p-3.5 text-left"
              >
                {/* Background Poster Image */}
                <img 
                  src={story.poster} 
                  alt={story.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-90 group-hover:brightness-100" 
                  referrerPolicy="no-referrer"
                />
                
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/50 group-hover:via-slate-950/20 transition-all duration-300" />

                {/* Top Badges */}
                <div className="relative z-10 flex items-center justify-between gap-1 w-full">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-300 border border-white/10 shadow-md">
                    {story.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1 shadow-lg animate-pulse">
                    <Play className="w-2.5 h-2.5 fill-white" /> Live
                  </span>
                </div>

                {/* Center Glassmorphic Play Button */}
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-950/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl group-hover:scale-110 group-hover:bg-amber-400 group-hover:border-amber-300 group-hover:text-slate-950 transition-all duration-300">
                    <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Bottom Detail Overlay */}
                <div className="relative z-10 w-full mt-auto pt-8">
                  <div className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1 truncate mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{story.storeName}</span>
                  </div>
                  <h4 className="text-xs md:text-sm font-black text-white line-clamp-2 leading-tight group-hover:text-amber-200 transition-colors">
                    {story.title}
                  </h4>
                  <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between">
                    <span className="text-xs md:text-sm font-black text-emerald-400">
                      {story.price}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-200 bg-white/15 px-2 py-0.5 rounded-lg group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                      İzle &rarr;
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* REGIONAL RADAR SHOWCASE SLIDER */}
        {portalNews && portalNews.length > 0 && (
          <section className="my-12">
            <RadarShowcaseSlider radarNews={portalNews} />
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
        <div 
          onClick={() => setSelectedStory(null)}
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm h-[80vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between cursor-default"
          >
            
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

      {/* FULLSCREEN IMAGE LIGHTBOX */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 border border-slate-700 text-white hover:bg-rose-600 transition z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={zoomedImage} 
            alt="Büyük Görsel" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-slate-800"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* QUICK DETAIL MODAL (SOFT, PASTEL & LIGHT THEME) */}
      {selectedListing && (() => {
        const modalImages: string[] = [];
        if (Array.isArray(selectedListing.images) && selectedListing.images.length > 0) {
          modalImages.push(...selectedListing.images.filter((i: any) => typeof i === "string" && i.trim()));
        }
        if (selectedListing.image_url && !modalImages.includes(selectedListing.image_url)) {
          modalImages.unshift(selectedListing.image_url);
        }

        const currentImg = modalImages[activeDetailImageIndex] || selectedListing.image_url;
        const intent = getListingIntent(selectedListing);
        const sec = selectedListing.sector_data || {};
        const cleanedDesc = formatDescriptionText(selectedListing.description);

        return (
          <div 
            onClick={handleCloseModal}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto cursor-pointer"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl bg-white text-slate-800 border border-slate-200/90 rounded-3xl p-5 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto my-auto cursor-default"
            >
              
              {/* Close Button */}
              <button 
                onClick={handleCloseModal}
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-rose-100 border border-slate-200 transition cursor-pointer shadow-xs"
                title="Kapat (ESC)"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header Title */}
              <div className="mb-4 pr-12">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedListing.store_name}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-extrabold">
                    {formatCategory(selectedListing)}
                  </span>
                  {selectedListing.listing_type === 'real_estate' && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                      intent === 'kiralik'
                        ? "bg-purple-50 text-purple-800 border-purple-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}>
                      {intent === 'kiralik' ? '🔑 KİRALIK' : '🏷️ SATILIK'}
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                  {selectedListing.title}
                </h2>
              </div>

              {/* Main Photo Canvas & Thumbnails */}
              <div className="space-y-3 mb-6">
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/90 shadow-inner group">
                  <img 
                    src={currentImg} 
                    alt={selectedListing.title} 
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setZoomedImage(currentImg)}
                    referrerPolicy="no-referrer"
                  />
                  
                  {modalImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveDetailImageIndex(prev => prev === 0 ? modalImages.length - 1 : prev - 1); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition shadow-lg cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveDetailImageIndex(prev => prev === modalImages.length - 1 ? 0 : prev + 1); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition shadow-lg cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-900/80 text-white rounded-lg text-xs font-black border border-white/20 backdrop-blur-md shadow-md">
                        {activeDetailImageIndex + 1} / {modalImages.length} Fotoğraf
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails Row */}
                {modalImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {modalImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveDetailImageIndex(idx)}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                          idx === activeDetailImageIndex 
                            ? "border-emerald-500 scale-105 shadow-md shadow-emerald-500/20" 
                            : "border-slate-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Banner */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 mb-6 shadow-xs">
                <div>
                  <span className="text-xs text-amber-900/70 font-bold uppercase block mb-0.5">
                    {intent === 'kiralik' ? 'Aylık Kira Bedeli' : 'Satış Fiyatı'}
                  </span>
                  <div className="text-2xl md:text-3xl font-black text-emerald-700 flex items-baseline gap-2">
                    <span>{Math.round(Number(selectedListing.price) || 0).toLocaleString('tr-TR')}</span>
                    <span className="text-lg text-slate-800">{selectedListing.currency || 'TL'}</span>
                    {intent === 'kiralik' && <span className="text-xs text-slate-500 font-normal">/ Aylık</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    {formatLocation(selectedListing)}
                  </span>
                </div>
              </div>

              {/* Detailed Specs Grid */}
              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  İlan Özellikleri & Detaylar
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedListing.listing_type === 'real_estate' ? (
                    <>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Mülk Tipi</span>
                        <span className="text-xs font-black text-slate-900">{formatCategory(selectedListing)}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Oda Sayısı</span>
                        <span className="text-xs font-black text-blue-700">{sec.rooms || sec.oda || 'Belirtilmedi'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Metrekare (m²)</span>
                        <span className="text-xs font-black text-emerald-700">{sec.gross_m2 || sec.m2 || 'Belirtilmedi'} m²</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Koçan / Tapu</span>
                        <span className="text-xs font-black text-amber-800">{sec.deed_type || 'Türk Koçanlı'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Eşya Durumu</span>
                        <span className="text-xs font-black text-slate-900">{sec.furnished ? 'Eşyalı' : 'Eşyasız'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Bulunduğu Kat</span>
                        <span className="text-xs font-black text-slate-900">{sec.floor || 'Giriş / Bahçe'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Isınma / Soğutma</span>
                        <span className="text-xs font-black text-slate-900">{sec.heating || 'Klima'}</span>
                      </div>
                      {sec.deposit && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Depozito</span>
                          <span className="text-xs font-black text-purple-700">{sec.deposit}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Marka</span>
                        <span className="text-xs font-black text-slate-900">{selectedListing.brand || 'Belirtilmedi'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Model Yılı</span>
                        <span className="text-xs font-black text-blue-700">{selectedListing.year || sec.year || 'Belirtilmedi'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Kilometre (KM)</span>
                        <span className="text-xs font-black text-emerald-700">
                          {selectedListing.mileage ? Math.round(Number(selectedListing.mileage)).toLocaleString('tr-TR') + ' KM' : 'Sıfır'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Yakıt Tipi</span>
                        <span className="text-xs font-black text-amber-800">{sec.fuel_type || 'Benzin'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Vites Tipi</span>
                        <span className="text-xs font-black text-slate-900">{sec.transmission || 'Otomatik'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Description Block (CLEANED TEXT) */}
              {cleanedDesc && (
                <div className="mb-6 bg-slate-50/90 p-4 md:p-5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">İlan Açıklaması</h4>
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                    {cleanedDesc}
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    const rawPhone = selectedListing.store_phone || sec.phone || "905330000000";
                    window.open(`https://wa.me/${rawPhone.replace(/\D/g, "")}`, "_blank");
                  }}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>WhatsApp İletişim</span>
                </button>

                <a
                  href={`tel:${(selectedListing.store_phone || sec.phone || "").replace(/\D/g, "")}`}
                  className="py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Hemen Ara</span>
                </a>

                <Link
                  to={`/s/${selectedListing.store_slug}/p/${selectedListing.barcode || selectedListing.id}`}
                  target="_blank"
                  className="py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs text-center rounded-xl flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Mağaza Sayfasına Git</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </div>
        );
      })()}

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-850 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <div className="h-10 px-4 py-1.5 bg-white rounded-xl border border-slate-800 flex items-center justify-center mb-3">
            <img 
              src={customLogo} 
              alt="Enrakipsiz Logo" 
              className="h-7 w-auto object-contain"
              onError={(e: any) => {
                e.target.onerror = null;
                e.target.src = "/enrakipsiz-logo.svg";
              }}
            />
          </div>
          <p className="font-bold text-slate-300 mb-1">ENRAKİPSİZ PORTAL SİSTEMİ</p>
          <p className="max-w-md mx-auto leading-relaxed mb-6">
            Otomotiv ve Gayrimenkul Portföy Yönetimi. Tüm hakları saklıdır. © 2026 Enrakipsiz.com.
          </p>
          <div className="flex justify-center gap-6 font-semibold">
            <Link to="/" className="hover:text-blue-400">Ana Sayfa</Link>
            <a href="https://lookprice.net/login" className="hover:text-blue-400">Mağaza Paneli</a>
            <a href="https://lookprice.net/register" className="hover:text-blue-400">Mağaza Açın</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
