import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MarketplaceListingGrid } from "../components/marketplace/MarketplaceListingGrid";
import { FilterDrawer } from "../components/FilterDrawer";
import { TagFilter } from "../components/marketplace/TagFilter";
import { aggregateTags, getListingIntent, isRentalListing } from "../utils/marketplace";
import { formatFuelType, formatTransmission, formatTitleDeedType, normalizeVehicleCategory, getVehicleCategoryDisplayName } from "../utils/formatUtils";
import { useMarketplaceLogic } from "../hooks/useMarketplaceLogic";
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
  Settings,
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
  ChevronUp,
  Key,
  Shield,
  RotateCcw
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "../components/RadarShowcaseSlider";
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI, getAvailableSubTypes, getAvailableSubRegions } from "../data/realEstateConfig";
import { SectorSpecs } from "../components/SectorSpecs";
import { IDXSplitMapView } from "../components/IDXSplitMapView";

type MainTab = "real_estate" | "vehicle";
type ViewMode = "rich" | "list";

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

  // 1. House Indicators
  const hasHouseIndicator = titleLower.includes("müstakil") || titleLower.includes("mustakil") || titleLower.includes("villa") || titleLower.includes("ev") || titleLower.includes("daire") || titleLower.includes("penthouse") || titleLower.includes("1+1") || titleLower.includes("2+1") || titleLower.includes("3+1") || titleLower.includes("4+1") || titleLower.includes("apartman") || titleLower.includes("stüdyo") || titleLower.includes("studio") || titleLower.includes("rezidans");

  // 2. Arsa Check
  if (rawLower.includes("arsa") || (titleLower.includes("arsa") && !hasHouseIndicator) || sec.type === 'land' || sec.property_type === 'land' || listing.type === 'land') {
    if (!rawLower.includes("residence") && !rawLower.includes("konut") && !rawLower.includes("villa") && !rawLower.includes("müstakil")) {
      return listing.subtype || sec.subtype || "Arsa";
    }
  }

  // 3. Tarla / Arazi Check
  if (rawLower.includes("tarla") || (titleLower.includes("tarla") && !hasHouseIndicator) || rawLower.includes("arazi") || (titleLower.includes("arazi") && !hasHouseIndicator) || titleLower.includes("dönüm") || titleLower.includes("donum")) {
    if (!rawLower.includes("residence") && !rawLower.includes("konut") && !rawLower.includes("villa") && !rawLower.includes("müstakil")) {
      return "Tarla / Arazi";
    }
  }

  // 4. Ticari / Dükkan / İşyeri / Ofis Check
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

  // 5. Müstakil / Villa Check
  if (
    rawLower.includes("villa") || rawLower.includes("müstakil") || rawLower.includes("mustakil") || rawLower.includes("müstaki̇l") ||
    titleLower.includes("villa") || titleLower.includes("müstakil") || titleLower.includes("mustakil") || titleLower.includes("müstaki̇l") ||
    sec.type === 'villa' || titleLower.includes("müstakil ev") || titleLower.includes("müstaki̇l ev")
  ) {
    return "Müstakil Ev / Villa";
  }

  // 6. Daire / Konut Check
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

function getSquareMeters(listing: any) {
  const sec = listing.sector_data || {};
  const structured = listing.square_meters || sec.net_m2 || sec.m2 || listing.sqm_gross || sec.gross_m2;
  if (structured) return structured;
  
  // Try to find m2 in description with even more robust regex
  const desc = (listing.description || "").toLowerCase().replace('²', '2').replace('metrekare', 'm2');
  // Match things like 90m2, 90 m2, 90.0 m2, 90,5 m2, 90 m 2
  const match = desc.match(/(\d+([.,]\d+)?)\s*m\s*2/);
  
  return match ? match[1].replace(',', '.') : null;
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
          onError={(e: any) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"; }}
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
  const {
    isFilterDrawerOpen, setIsFilterDrawerOpen,
    listings, setListings,
    portalNews, setPortalNews,
    loading, setLoading,
    searchQuery, setSearchQuery,
    mainTab, setMainTab,
    reFihristTab, setReFihristTab,
    vehFihristTab, setVehFihristTab,
    rePropertyType, setRePropertyType,
    reSubPropertyType, setReSubPropertyType,
    reSubPropertyTypes, setReSubPropertyTypes,
    reSubRegions, setReSubRegions,
    reRooms, setReRooms,
    activeTags, setActiveTags,
    viewMode, setViewMode,
    activeSubSector, setActiveSubSector,
    activeVehicleCategory, setActiveVehicleCategory,
    activeVehicleBrand, setActiveVehicleBrand,
    activeVehicleModel, setActiveVehicleModel,
    activeVehicleFuel, setActiveVehicleFuel,
    activeVehicleTransmission, setActiveVehicleTransmission,
    activeVehicleYear, setActiveVehicleYear,
    activeVehicleBodyType, setActiveVehicleBodyType,
    activeVehicleTradeIn, setActiveVehicleTradeIn,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    minYear, setMinYear,
    maxYear, setMaxYear,
    reRegion, setReRegion,
    reType, setReType,
    isDarkMode, setIsDarkMode
  } = useMarketplaceLogic();
  const navigate = useNavigate();
  const [reFurnished, setReFurnished] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [reKocanType, setReKocanType] = useState<string>("all");
  const [isSubTypeDropdownOpen, setIsSubTypeDropdownOpen] = useState<boolean>(false);
  const [isRoomsDropdownOpen, setIsRoomsDropdownOpen] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);
  const [isVehicleMobileFiltersOpen, setIsVehicleMobileFiltersOpen] = useState<boolean>(false);

  // Derived Vehicle Options from AutoLP stores portfolio
  const vehicleListings = React.useMemo(() => {
    const list = Array.isArray(listings) ? listings : [];
    return list.filter(i => {
      return i.listing_type === 'vehicle' || i.type === 'vehicle' || (i.category && (i.category.toLowerCase().includes('vasıta') || i.category.toLowerCase().includes('otomobil') || i.category.toLowerCase().includes('araç') || i.category.toLowerCase().includes('suv') || i.category.toLowerCase().includes('pickup') || i.category.toLowerCase().includes('ticari')));
    });
  }, [listings]);

  const vehicleCategories = React.useMemo(() => {
    const defaultCategories = ['otomobil', 'suv', 'hafif_ticari', 'pickup'];
    const dynamicList = vehicleListings.map(p => {
      const cat = p.category || p.sector_data?.category || p.sub_sector || p.vehicle_category || "";
      return normalizeVehicleCategory(cat);
    }).filter(c => c && !['vasıta', 'oto galeri', 'vehicle', 'all'].includes(c));
    return Array.from(new Set([...defaultCategories, ...dynamicList]));
  }, [vehicleListings]);

  const vehicleBrands = React.useMemo(() => {
    let filtered = vehicleListings;
    if (activeVehicleCategory !== "all") {
      const targetCat = normalizeVehicleCategory(activeVehicleCategory);
      filtered = filtered.filter(p => {
        const c = normalizeVehicleCategory(p.category || p.sector_data?.category || p.sub_sector || p.vehicle_category || p.body_type || "");
        return c === targetCat || c.includes(targetCat) || targetCat.includes(c);
      });
    }
    const list = filtered.map(p => p.brand || p.sector_data?.brand || p.sector_data?.brand_name).filter(Boolean);
    return Array.from(new Set(list)).sort((a: any, b: any) => a.localeCompare(b));
  }, [vehicleListings, activeVehicleCategory]);

  const vehicleModels = React.useMemo(() => {
    let filtered = vehicleListings;
    if (activeVehicleCategory !== "all") {
      const targetCat = normalizeVehicleCategory(activeVehicleCategory);
      filtered = filtered.filter(p => {
        const c = normalizeVehicleCategory(p.category || p.sector_data?.category || p.sub_sector || p.vehicle_category || p.body_type || "");
        return c === targetCat || c.includes(targetCat) || targetCat.includes(c);
      });
    }
    if (activeVehicleBrand !== "all") {
      filtered = filtered.filter(p => {
        const b = (p.brand || p.sector_data?.brand || p.sector_data?.brand_name || "").toLowerCase();
        return b === activeVehicleBrand.toLowerCase();
      });
    }
    const list = filtered.map(p => p.model || p.sector_data?.model || p.sector_data?.model_name || p.sector_data?.series).filter(Boolean);
    return Array.from(new Set(list)).sort((a: any, b: any) => a.localeCompare(b));
  }, [vehicleListings, activeVehicleCategory, activeVehicleBrand]);

  const vehicleYears = React.useMemo(() => {
    const list = vehicleListings.map(p => String(p.year || p.sector_data?.year || p.sector_data?.model_year || "")).filter(Boolean);
    return Array.from(new Set(list)).sort((a, b) => Number(b) - Number(a));
  }, [vehicleListings]);

  // Pagination state: limit initially to 12
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [mainTab, reFihristTab, vehFihristTab, searchQuery, viewMode, activeSubSector, activeVehicleCategory, activeVehicleBrand, activeVehicleModel, activeVehicleFuel, activeVehicleTransmission, activeVehicleYear, activeVehicleBodyType, activeVehicleTradeIn, minPrice, maxPrice, minYear, maxYear, reRegion, reSubRegions, reType, reRooms, reFurnished, priceRange, reKocanType, sortBy, rePropertyType, activeTags]);

  // Modal / Detail / Video Story States
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [showFeaturedStores, setShowFeaturedStores] = useState<boolean>(false);

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

  // Sync Theme class on document.documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

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
  const filteredListings = (Array.isArray(listings) ? listings : []).filter(item => {
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

      // Mülk Tipi Filter (residence, commercial, land)
      if (rePropertyType !== "all") {
        const catLower = (item.type || item.category || "").toLowerCase();
        const titleLower = (item.title || item.name || "").toLowerCase();
        const secType = String(secData.type || secData.property_type || secData.re_type || "").toLowerCase();

        // Let's normalize catLower to either 'residence', 'commercial', or 'land'
        let normCat = "residence";
        const hasHouseIndicator = titleLower.includes("müstakil") || titleLower.includes("mustakil") || titleLower.includes("villa") || titleLower.includes("ev") || titleLower.includes("daire") || titleLower.includes("penthouse") || titleLower.includes("1+1") || titleLower.includes("2+1") || titleLower.includes("3+1") || titleLower.includes("4+1") || titleLower.includes("apartman") || titleLower.includes("stüdyo") || titleLower.includes("studio") || titleLower.includes("rezidans");

        if (catLower.includes("land") || catLower.includes("arsa") || catLower.includes("tarla") || catLower.includes("arazi") || secType.includes("land") || secType.includes("arsa") || (titleLower.includes("arsa") && !hasHouseIndicator)) {
          normCat = "land";
        } else if (catLower.includes("commercial") || catLower.includes("ticari") || catLower.includes("dükkan") || catLower.includes("dukkan") || catLower.includes("isyeri") || catLower.includes("işyeri") || catLower.includes("ofis") || secType.includes("commercial") || titleLower.includes("dükkan") || titleLower.includes("ofis") || titleLower.includes("işyeri") || titleLower.includes("ticari")) {
          normCat = "commercial";
        } else {
          normCat = "residence";
        }

        if (normCat !== rePropertyType) {
          return false;
        }
      }

      // Sub-Property Type Dynamic Filtering (Multi-Select & Single-Select compatibility)
      const selectedSubTypes: string[] = Array.isArray(reSubPropertyTypes) && reSubPropertyTypes.length > 0
        ? reSubPropertyTypes
        : (reSubPropertyType && reSubPropertyType !== "all" ? [reSubPropertyType] : []);

      if (selectedSubTypes.length > 0) {
        const itemSub = (item.subtype || secData.subtype || "").trim().toLowerCase();
        const titleLower = (item.title || item.name || "").toLowerCase();
        const descLower = (item.description || "").toLowerCase();
        
        const matchesAnySub = selectedSubTypes.some(st => {
          const subLower = st.toLowerCase();
          return itemSub.includes(subLower) || titleLower.includes(subLower) || descLower.includes(subLower);
        });

        if (!matchesAnySub) {
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
            const isRent = item.listing_intent === "rent" || item.intent === "rent" || secData.listing_intent === "rent" || secData.intent === "rent" || item.fihrist_type === "kiralik" || reFihristTab === "kiralik";
            if (isRent) return false;
            const m = item.kocan_type || item.kktc_title_type || secData.kocan_type || secData.kktc_title_type || secData.deed_type || title.includes("koçan") || title.includes("tapu") || desc.includes("koçan");
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
      const fuelRaw = (item.fuel_type || item.fuel || item.sector_data?.fuel_type || item.sector_data?.fuel || "").toLowerCase();
      const isEcoFuel = fuelRaw.includes("dizel") || fuelRaw.includes("diesel") || fuelRaw.includes("hibrit") || fuelRaw.includes("hybrid") || fuelRaw.includes("elektrik") || fuelRaw.includes("electric");
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
      const secData = item.sector_data || {};
      const titleLower = (item.title || "").toLowerCase();
      const descLower = (item.description || "").toLowerCase();

      if (reRegion !== "all") {
        const reg = (secData.kktc_region || secData.city || item.location || item.brand || "").toLowerCase();
        if (!reg.includes(reRegion.toLowerCase())) return false;
      }

      // Sub-Regions Multi-Select Filtering
      const selectedSubs: string[] = Array.isArray(reSubRegions) ? reSubRegions : [];

      if (selectedSubs.length > 0) {
        const subReg = (secData.kktc_sub_region || secData.district || secData.neighborhood || item.location || "").toLowerCase();
        const matchesAnySubRegion = selectedSubs.some(sub => {
          const target = sub.toLowerCase();
          return subReg.includes(target) || titleLower.includes(target) || descLower.includes(target);
        });
        if (!matchesAnySubRegion) return false;
      }

      if (reType !== "all") {
        const t = (item.category || "").toLowerCase();
        if (!t.includes(reType.toLowerCase())) return false;
      }

      // Room Counts Multi-Select Filtering
      const selectedRoomList: string[] = Array.isArray(reRooms)
        ? reRooms
        : (typeof reRooms === 'string' && reRooms !== "all" && reRooms !== "" ? [reRooms] : []);

      if (selectedRoomList.length > 0) {
        const r = String(secData.rooms || secData.room_count || item.rooms || item.room_count || "").toLowerCase();
        const matchesAnyRoom = selectedRoomList.some(room => {
          if (room === "5+") {
            return r.includes("5") || r.includes("6") || r.includes("7") || titleLower.includes("5+1") || titleLower.includes("6+1");
          } else if (room === "Penthouse") {
            return titleLower.includes("penthouse") || String(secData.subtype || "").toLowerCase().includes("penthouse");
          } else if (room === "1+0") {
            return r.includes("1+0") || r.includes("stüdyo") || titleLower.includes("1+0") || titleLower.includes("stüdyo") || titleLower.includes("studio");
          } else {
            return r.includes(room.toLowerCase()) || titleLower.includes(room.toLowerCase());
          }
        });
        if (!matchesAnyRoom) return false;
      }

      if (priceRange !== "all") {
        const p = Number(item.price) || 0;
        if (priceRange === "0-150000" && p > 150000) return false;
        if (priceRange === "150000-300000" && (p < 150000 || p > 300000)) return false;
        if (priceRange === "300000-500000" && (p < 300000 || p > 500000)) return false;
        if (priceRange === "500000+" && p < 500000) return false;
      }

      if (reFurnished !== "all") {
        const isFurnished = secData.furnished || titleLower.includes("eşyalı") || descLower.includes("eşyalı");
        if (reFurnished === "yes" && !isFurnished) return false;
        if (reFurnished === "no" && isFurnished) return false;
      }

      if (reKocanType !== "all" && reFihristTab !== "kiralik") {
        const isRent = item.listing_intent === "rent" || item.intent === "rent" || secData.listing_intent === "rent" || secData.intent === "rent" || item.fihrist_type === "kiralik";
        if (!isRent) {
          const deed = (item.kocan_type || item.kktc_title_type || item.deed_type || secData.kocan_type || secData.kktc_title_type || secData.deed_type || secData.kocan || "").toLowerCase();
          const target = reKocanType.toLowerCase();
          if (!deed.includes(target) && !titleLower.includes(target) && !descLower.includes(target)) return false;
        }
      }
    }

    if (mainTab === "vehicle") {
      const secData = item.sector_data || {};
      const titleLower = (item.title || "").toLowerCase();
      const descLower = (item.description || "").toLowerCase();

      if (activeVehicleCategory !== "all") {
        const targetCat = normalizeVehicleCategory(activeVehicleCategory);
        const itemCat = normalizeVehicleCategory(item.category || secData.category || secData.vehicle_category || item.sub_sector || secData.sub_sector || item.vehicle_category || item.body_type || secData.body_type || "");
        if (itemCat !== targetCat && !itemCat.includes(targetCat) && !targetCat.includes(itemCat)) {
          return false;
        }
      }
      if (activeVehicleBrand !== "all") {
        const b = (item.brand || secData.brand || secData.brand_name || "").toLowerCase();
        if (b !== activeVehicleBrand.toLowerCase()) return false;
      }
      if (activeVehicleModel !== "all") {
        const m = (item.model || secData.model || secData.model_name || secData.series || "").toLowerCase();
        if (m !== activeVehicleModel.toLowerCase()) return false;
      }
      if (activeVehicleTransmission !== "all") {
        const t = (item.transmission || secData.transmission || secData.vites || "").toLowerCase();
        const target = activeVehicleTransmission.toLowerCase();
        const isAuto = target === "automatic" || target === "otomatik";
        const isMan = target === "manual" || target === "manuel";
        const isSemi = target === "semi_automatic" || target === "semi-automatic" || target.includes("yarı");
        if (isSemi) {
          if (!t.includes("semi") && !t.includes("yarı")) return false;
        } else if (isAuto) {
          if (!t.includes("auto") && !t.includes("otomatik")) return false;
        } else if (isMan) {
          if (!t.includes("man")) return false;
        } else if (!t.includes(target)) return false;
      }
      if (activeVehicleFuel !== "all") {
        const f = (item.fuel_type || item.fuel || secData.fuel_type || secData.fuel || "").toLowerCase();
        const target = activeVehicleFuel.toLowerCase();
        const isGas = target === "gasoline" || target === "benzin";
        const isDiesel = target === "diesel" || target === "dizel";
        const isHybrid = target === "hybrid" || target === "hibrit";
        const isElec = target === "electric" || target === "elektrik";
        const isLpg = target === "lpg";
        if (isGas) {
          if (!f.includes("gas") && !f.includes("benzin")) return false;
        } else if (isDiesel) {
          if (!f.includes("diesel") && !f.includes("dizel")) return false;
        } else if (isHybrid) {
          if (!f.includes("hyb") && !f.includes("hibrit")) return false;
        } else if (isElec) {
          if (!f.includes("elec") && !f.includes("elektrik")) return false;
        } else if (isLpg) {
          if (!f.includes("lpg")) return false;
        } else if (!f.includes(target)) return false;
      }
      if (activeVehicleYear !== "all") {
        const y = String(item.year || secData.year || secData.model_year || "");
        if (y !== activeVehicleYear) return false;
      }
      if (activeVehicleBodyType !== "all") {
        const bt = (item.body_type || secData.body_type || secData.kasa_tipi || "").toLowerCase();
        if (!bt.includes(activeVehicleBodyType.toLowerCase())) return false;
      }
      if (activeVehicleTradeIn === "yes") {
        const tradeIn = item.is_trade_in_available || secData.is_trade_in_available || secData.takas || titleLower.includes("takas") || descLower.includes("takas");
        if (!tradeIn) return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (sortBy === "price_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const stats = React.useMemo(() => {
    const list = Array.isArray(listings) ? listings : [];
    const activeListings = list.filter(i => (!i.status || i.status === 'active') && i.listing_type !== 'product');
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
      properties: reCount || (list.length > 0 ? list.length - vehCount : 0),
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
              {/* EMLAK PORTFÖY FİLTRE BAR (RESTATED MODEL) */}
              <div className="bg-slate-950/80 p-4 md:p-5 rounded-2xl border border-blue-500/20 shadow-xl space-y-4">
                <div className={`${isMobileFiltersOpen ? 'block' : 'hidden md:block'} space-y-4`}>
                {/* PRIMARY EMLAK SELECT CONTROLS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {/* 1. İLAN NİYETİ (SATILIK / KİRALIK / TÜMÜ) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3 text-blue-400" /> Durum
                    </label>
                    <div className="flex p-0.5 bg-slate-900 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setReFihristTab("all")}
                        className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                          reFihristTab === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Tümü
                      </button>
                      <button
                        onClick={() => setReFihristTab("satilik")}
                        className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                          reFihristTab === "satilik" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Satılık
                      </button>
                      <button
                        onClick={() => setReFihristTab("kiralik")}
                        className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                          reFihristTab === "kiralik" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Kiralık
                      </button>
                    </div>
                  </div>

                  {/* 2. MÜLK TİPİ */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-400" /> Mülk Tipi
                    </label>
                    <select
                      value={rePropertyType}
                      onChange={(e) => {
                        setRePropertyType(e.target.value);
                        setReSubPropertyType("all");
                      }}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Tipler</option>
                      <option value="residence">🏢 Konut / Residence</option>
                      <option value="commercial">🏪 Ticari</option>
                      <option value="land">🏞️ Arsa</option>
                    </select>
                  </div>

                  {/* 3. ALT MÜLK TİPİ (MULTI-SELECT) */}
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-emerald-400" /> Alt Tip
                      </span>
                      {reSubPropertyTypes.length > 0 && (
                        <span className="text-[9px] text-emerald-400 font-bold">
                          {reSubPropertyTypes.length} Seçili
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubTypeDropdownOpen(!isSubTypeDropdownOpen);
                        setIsRoomsDropdownOpen(false);
                      }}
                      className={`w-full p-2 bg-slate-900 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        reSubPropertyTypes.length > 0 
                          ? "border-emerald-500/80 text-emerald-300 ring-1 ring-emerald-500/30" 
                          : "border-slate-800 text-white hover:border-slate-700"
                      }`}
                    >
                      <span className="truncate">
                        {reSubPropertyTypes.length === 0 
                          ? "Tüm Alt Tipler" 
                          : reSubPropertyTypes.length === 1 
                            ? reSubPropertyTypes[0] 
                            : `${reSubPropertyTypes.length} Alt Tip Seçili`}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSubTypeDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
                    </button>

                    {isSubTypeDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 space-y-1.5 backdrop-blur-md">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] font-bold">
                          <span className="text-slate-400">Alt Mülk Tipleri</span>
                          {reSubPropertyTypes.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setReSubPropertyTypes([])}
                              className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                            >
                              Temizle
                            </button>
                          )}
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {getAvailableSubTypes(rePropertyType).map((sub) => {
                            const isChecked = reSubPropertyTypes.includes(sub);
                            return (
                              <label
                                key={sub}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setReSubPropertyTypes(prev =>
                                    prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
                                  );
                                }}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-emerald-950/80 text-emerald-200 border border-emerald-800/80 font-bold"
                                    : "text-slate-300 hover:bg-slate-900 border border-transparent"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-600 focus:ring-0 bg-slate-900 cursor-pointer pointer-events-none"
                                />
                                <span className="truncate">{sub}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. ŞEHİR */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" /> Şehir
                    </label>
                    <select
                      value={reRegion}
                      onChange={(e) => {
                        setReRegion(e.target.value);
                        setReSubRegions([]);
                      }}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Şehirler</option>
                      <option value="girne">Girne</option>
                      <option value="lefkoşa">Lefkoşa</option>
                      <option value="gazimağusa">Gazimağusa</option>
                      <option value="iskele">İskele</option>
                      <option value="lefke">Lefke</option>
                      <option value="güzelyurt">Güzelyurt</option>
                    </select>
                  </div>

                  {/* 5. ODA SAYISI (MULTI-SELECT) */}
                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Home className="w-3 h-3 text-cyan-400" /> Oda Sayısı
                      </span>
                      {reRooms.length > 0 && (
                        <span className="text-[9px] text-cyan-400 font-bold">
                          {reRooms.length} Seçili
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRoomsDropdownOpen(!isRoomsDropdownOpen);
                        setIsSubTypeDropdownOpen(false);
                      }}
                      className={`w-full p-2 bg-slate-900 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        reRooms.length > 0 
                          ? "border-cyan-500/80 text-cyan-300 ring-1 ring-cyan-500/30" 
                          : "border-slate-800 text-white hover:border-slate-700"
                      }`}
                    >
                      <span className="truncate">
                        {reRooms.length === 0 
                          ? "Tüm Odalar" 
                          : reRooms.length === 1 
                            ? reRooms[0] 
                            : `${reRooms.length} Oda Seçili`}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isRoomsDropdownOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
                    </button>

                    {isRoomsDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 space-y-1.5 backdrop-blur-md">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[10px] font-bold">
                          <span className="text-slate-400">Oda Seçenekleri</span>
                          {reRooms.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setReRooms([])}
                              className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
                            >
                              Temizle
                            </button>
                          )}
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                          {["1+0", "1+1", "2+1", "3+1", "4+1", "5+", "Penthouse"].map((room) => {
                            const isChecked = reRooms.includes(room);
                            return (
                              <label
                                key={room}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setReRooms(prev =>
                                    prev.includes(room) ? prev.filter(r => r !== room) : [...prev, room]
                                  );
                                }}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                  isChecked
                                    ? "bg-cyan-950/80 text-cyan-200 border border-cyan-800/80 font-bold"
                                    : "text-slate-300 hover:bg-slate-900 border border-transparent"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-600 focus:ring-0 bg-slate-900 cursor-pointer pointer-events-none"
                                />
                                <span className="truncate">{room === "1+0" ? "1+0 (Stüdyo)" : room === "5+" ? "5+1 ve üzeri" : room}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. FİYAT ARALIĞI */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Fiyat
                    </label>
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Fiyatlar</option>
                      <option value="0-150000">£150.000 Altı</option>
                      <option value="150000-300000">£150k - £300k</option>
                      <option value="300000-500000">£300k - £500k</option>
                      <option value="500000+">£500.000 Üstü Lüks</option>
                    </select>
                  </div>
                </div>

                {/* COMPACT 2 SÜTUNLU ALT İLÇE & BÖLGE SEÇ KUTULARI ROW (Only if city selected) */}
                {reRegion !== "all" && (() => {
                  const availableSubRegions = getAvailableSubRegions(reRegion);
                  if (availableSubRegions.length === 0) return null;
                  return (
                    <div className="pt-3 space-y-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" /> 📍 {reRegion.toUpperCase()} İLÇE VE BÖLGELERİ ({reSubRegions.length > 0 ? `${reSubRegions.length} Bölge Seçili` : 'Tümü'}):
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <button
                            onClick={() => setReSubRegions(availableSubRegions)}
                            className="text-purple-400 hover:text-purple-200 cursor-pointer"
                          >
                            Tümünü Seç
                          </button>
                          <span className="text-slate-600">•</span>
                          <button
                            onClick={() => setReSubRegions([])}
                            className="text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            Temizle
                          </button>
                        </div>
                      </div>

                      {/* Tek Satırda 2 Bölge Kompakt Seç Kutuları */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-950/70 rounded-xl border border-slate-800">
                        {availableSubRegions.map((sub) => {
                          const isSelected = reSubRegions.includes(sub);
                          return (
                            <label
                              key={sub}
                              onClick={(e) => {
                                e.preventDefault();
                                setReSubRegions(prev => 
                                  prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
                                );
                              }}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none ${
                                isSelected
                                  ? "bg-purple-950/80 border-purple-500 text-purple-200 font-bold shadow-sm"
                                  : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-0 bg-slate-900 cursor-pointer pointer-events-none"
                              />
                              <span className="truncate">{sub}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* ACTIVE SELECTION TAGS & RESET BAR */}
                {(reFihristTab !== "all" || rePropertyType !== "all" || reSubPropertyTypes.length > 0 || (reSubPropertyType && reSubPropertyType !== "all") || reRegion !== "all" || reSubRegions.length > 0 || reRooms.length > 0 || priceRange !== "all" || reFurnished !== "all" || reKocanType !== "all" || activeTags.length > 0) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-blue-400" /> Aktif Filtreler:
                    </span>
                    
                    {reFihristTab !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-600/30 text-blue-300 rounded-lg text-[11px] font-bold border border-blue-500/40">
                        {reFihristTab === "satilik" ? "Satılık" : "Kiralık"}
                        <button onClick={() => setReFihristTab("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {rePropertyType !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/30">
                        {rePropertyType === "residence" ? "Konut" : rePropertyType === "commercial" ? "Ticari" : "Arsa"}
                        <button onClick={() => { setRePropertyType("all"); setReSubPropertyTypes([]); }} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {reSubPropertyTypes.map((st) => (
                      <span key={st} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-500/30">
                        {st}
                        <button onClick={() => setReSubPropertyTypes(prev => prev.filter(s => s !== st))} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    ))}

                    {reRegion !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-500/20 text-rose-300 rounded-lg text-[11px] font-bold border border-rose-500/30">
                        📍 {reRegion.toUpperCase()}
                        <button onClick={() => { setReRegion("all"); setReSubRegions([]); }} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {reSubRegions.map((sub) => (
                      <span key={sub} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-lg text-[11px] font-bold border border-purple-500/30">
                        {sub}
                        <button onClick={() => setReSubRegions(prev => prev.filter(s => s !== sub))} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    ))}

                    {reRooms.map((room) => (
                      <span key={room} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-[11px] font-bold border border-cyan-500/30">
                        {room}
                        <button onClick={() => setReRooms(prev => prev.filter(r => r !== room))} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    ))}

                    {priceRange !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-500/30">
                        {priceRange}
                        <button onClick={() => setPriceRange("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {activeTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-800 text-amber-300 rounded-lg text-[11px] font-bold border border-slate-700">
                        #{tag}
                        <button onClick={() => setActiveTags(prev => prev.filter(t => t !== tag))} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    ))}

                    <button
                      onClick={() => {
                        setReFihristTab("all");
                        setRePropertyType("all");
                        setReSubPropertyTypes([]);
                        setReRegion("all");
                        setReSubRegions([]);
                        setReRooms([]);
                        setPriceRange("all");
                        setReFurnished("all");
                        setReKocanType("all");
                        setActiveTags([]);
                        setSearchQuery("");
                      }}
                      className="ml-auto text-[10px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Filtreleri Temizle</span>
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-FIHRIST FOLDER TABS BAR FOR VEHICLE & VEHICLE PORTFOLIO FILTER BAR */}
          {mainTab === "vehicle" && (
            <div className="space-y-4 pb-4 border-b border-slate-800">
              {/* VEHICLE PORTFOLIO FILTER BAR */}
              <div className="bg-slate-950/80 p-4 md:p-5 rounded-2xl border border-rose-500/20 shadow-xl space-y-4">
                <div className={`${isVehicleMobileFiltersOpen ? 'block' : 'hidden md:block'} space-y-4`}>
                {/* PRIMARY VEHICLE SELECT CONTROLS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2.5">
                  {/* 1. İLAN KATEGORİSİ */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Tag className="w-3 h-3 text-rose-400" /> İlan Kategorisi
                    </label>
                    <select
                      value={activeVehicleCategory}
                      onChange={(e) => {
                        setActiveVehicleCategory(e.target.value);
                        setActiveVehicleModel("all");
                      }}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Kategoriler</option>
                      <option value="otomobil">Otomobil</option>
                      <option value="suv">SUV / Arazi Aracı</option>
                      <option value="hafif_ticari">Hafif Ticari</option>
                      <option value="pickup">Pick-up</option>
                      {vehicleCategories.map(cat => {
                        const norm = normalizeVehicleCategory(cat);
                        if (['otomobil', 'suv', 'hafif_ticari', 'pickup', 'all', ''].includes(norm)) return null;
                        return (
                          <option key={cat} value={norm}>{getVehicleCategoryDisplayName(cat)}</option>
                        );
                      })}
                    </select>
                  </div>

                  {/* 2. MARKA */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-400" /> Marka
                    </label>
                    <select
                      value={activeVehicleBrand}
                      onChange={(e) => {
                        setActiveVehicleBrand(e.target.value);
                        setActiveVehicleModel("all");
                      }}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Markalar</option>
                      {vehicleBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. MODEL ADI */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-emerald-400" /> Model Adı
                    </label>
                    <select
                      value={activeVehicleModel}
                      onChange={(e) => setActiveVehicleModel(e.target.value)}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Modeller</option>
                      {vehicleModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. ŞANZIMAN TİPİ */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Settings className="w-3 h-3 text-cyan-400" /> Şanzıman Tipi
                    </label>
                    <select
                      value={activeVehicleTransmission}
                      onChange={(e) => setActiveVehicleTransmission(e.target.value)}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Şanzımanlar</option>
                      <option value="automatic">Otomatik</option>
                      <option value="manual">Manuel</option>
                      <option value="semi_automatic">Yarı Otomatik</option>
                    </select>
                  </div>

                  {/* 5. YAKIT TÜRÜ */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-amber-400" /> Yakıt Türü
                    </label>
                    <select
                      value={activeVehicleFuel}
                      onChange={(e) => setActiveVehicleFuel(e.target.value)}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Yakıt Türleri</option>
                      <option value="gasoline">Benzin</option>
                      <option value="diesel">Dizel</option>
                      <option value="hybrid">Hibrit</option>
                      <option value="electric">Elektrik</option>
                      <option value="lpg">LPG</option>
                    </select>
                  </div>

                  {/* 6. ÜRETİM YILI */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-400" /> Üretim Yılı
                    </label>
                    <select
                      value={activeVehicleYear}
                      onChange={(e) => setActiveVehicleYear(e.target.value)}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Yıllar</option>
                      {vehicleYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {/* 7. KASA TİPİ */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Car className="w-3 h-3 text-blue-400" /> Kasa Tipi
                    </label>
                    <select
                      value={activeVehicleBodyType}
                      onChange={(e) => setActiveVehicleBodyType(e.target.value)}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tüm Kasa Tipleri</option>
                      <option value="sedan">Sedan</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="suv">SUV</option>
                      <option value="coupe">Kupe</option>
                      <option value="cabrio">Cabrio</option>
                      <option value="pickup">Pick-up</option>
                      <option value="station">Station Wagon</option>
                    </select>
                  </div>

                  {/* 8. TAKAS KABUL EDİLİYOR */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Takas
                    </label>
                    <select
                      value={activeVehicleTradeIn}
                      onChange={(e) => setActiveVehicleTradeIn(e.target.value)}
                      className="w-full p-2 bg-slate-900 rounded-xl border border-slate-800 text-white text-xs font-bold focus:border-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tümü</option>
                      <option value="yes">Takas Kabul Edilir</option>
                    </select>
                  </div>
                </div>

                {/* ACTIVE FILTER TAGS & RESET BAR FOR VEHICLES */}
                {(activeVehicleCategory !== "all" || activeVehicleBrand !== "all" || activeVehicleModel !== "all" || activeVehicleTransmission !== "all" || activeVehicleFuel !== "all" || activeVehicleYear !== "all" || activeVehicleBodyType !== "all" || activeVehicleTradeIn !== "all") && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-rose-400" /> Aktif Araç Filtreleri:
                    </span>

                    {activeVehicleCategory !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-600/30 text-rose-300 rounded-lg text-[11px] font-bold border border-rose-500/40">
                        Kategori: {getVehicleCategoryDisplayName(activeVehicleCategory)}
                        <button onClick={() => setActiveVehicleCategory("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {activeVehicleBrand !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-lg text-[11px] font-bold border border-amber-500/30">
                        Marka: {activeVehicleBrand}
                        <button onClick={() => setActiveVehicleBrand("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {activeVehicleModel !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-500/30">
                        Model: {activeVehicleModel}
                        <button onClick={() => setActiveVehicleModel("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {activeVehicleTransmission !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-[11px] font-bold border border-cyan-500/30">
                        Şanzıman: {activeVehicleTransmission}
                        <button onClick={() => setActiveVehicleTransmission("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {activeVehicleFuel !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-lg text-[11px] font-bold border border-purple-500/30">
                        Yakıt: {activeVehicleFuel}
                        <button onClick={() => setActiveVehicleFuel("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {activeVehicleYear !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-lg text-[11px] font-bold border border-blue-500/30">
                        Yıl: {activeVehicleYear}
                        <button onClick={() => setActiveVehicleYear("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {activeVehicleBodyType !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-lg text-[11px] font-bold border border-indigo-500/30">
                        Kasa: {activeVehicleBodyType}
                        <button onClick={() => setActiveVehicleBodyType("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    {activeVehicleTradeIn !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-600/20 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-500/30">
                        Takas Kabul Edilir
                        <button onClick={() => setActiveVehicleTradeIn("all")} className="hover:text-white cursor-pointer ml-1">✕</button>
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setActiveVehicleCategory("all");
                        setActiveVehicleBrand("all");
                        setActiveVehicleModel("all");
                        setActiveVehicleTransmission("all");
                        setActiveVehicleFuel("all");
                        setActiveVehicleYear("all");
                        setActiveVehicleBodyType("all");
                        setActiveVehicleTradeIn("all");
                      }}
                      className="ml-auto text-[10px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Filtreleri Temizle</span>
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* TOOLBAR BAR (4 VIEW SWITCHER + SORTING + COUNT) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 mb-6">
            
            {/* View Mode Switcher & Filter Icon Buttons */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Model 1: Rich Cards */}
              <button
                onClick={() => setViewMode("rich")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "rich"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850"
                }`}
                title="Vitrin Kart Modeli (Bento Grid)"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden md:inline">Vitrin</span>
              </button>

              {/* Model 3: Detailed List */}
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850"
                }`}
                title="Detaylı Tablo Liste Modeli"
              >
                <ListFilter className="w-4 h-4" />
                <span className="hidden md:inline">Detaylı Liste</span>
              </button>

              <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-800 mx-0.5" />

              {/* Toggle Filters Icon Button */}
              <button
                onClick={() => {
                  if (mainTab === "real_estate") {
                    setIsMobileFiltersOpen(prev => !prev);
                  } else {
                    setIsVehicleMobileFiltersOpen(prev => !prev);
                  }
                }}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  (mainTab === "real_estate" ? isMobileFiltersOpen : isVehicleMobileFiltersOpen)
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850"
                }`}
                title={(mainTab === "real_estate" ? isMobileFiltersOpen : isVehicleMobileFiltersOpen) ? "Filtreleri Gizle" : "Filtreleri Aç"}
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* Advanced Filters Icon Button */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 transition-all cursor-pointer flex items-center justify-center"
                title="Gelişmiş Filtreler"
              >
                <SlidersHorizontal className="w-4 h-4" />
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
                <>
                  <MarketplaceListingGrid 
                    listings={filteredListings}
                    visibleCount={visibleCount}
                    viewMode={viewMode}
                    isDarkMode={isDarkMode}
                    cardBg={cardBg}
                    setSelectedListing={setSelectedListing}
                    mainTab={mainTab}
                    rePropertyType={rePropertyType}
                  />
                </>
              )}

              {/* MODEL 3: DETAILED STRUCTURED TABLE VIEW */}
              {viewMode === "list" && (
                <div className={`overflow-x-auto rounded-2xl border ${isDarkMode ? "border-slate-800 bg-slate-950/90 shadow-xl" : "border-slate-200 bg-white shadow-md"}`}>
                  <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                    <thead>
                      <tr className={`${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"} border-b font-black uppercase text-[11px] tracking-wider`}>
                        <th className={`p-3 text-right font-black uppercase text-[11px] tracking-wider text-rose-600 dark:text-rose-400 border-r sticky left-0 z-20 shadow-md ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"} min-w-[130px]`}>
                          Fiyat
                        </th>
                        <th className={`p-3 w-36 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Fotoğraf</th>
                        {mainTab === "vehicle" ? (
                          <>
                            <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Marka</th>
                            <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Yakıt</th>
                            <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Model</th>
                            <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"} min-w-[220px]`}>İlan Başlığı</th>
                            <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Yıl</th>
                            <th className={`p-3 text-right border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>KM</th>
                            <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Vites Tipi</th>
                            <th className={`p-3 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>İl / İlçe</th>
                          </>
                        ) : (
                          <>
                            <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Kategori / Tip</th>
                            {rePropertyType === "land" ? (
                              <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Koçan Tipi</th>
                            ) : (
                              <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Oda</th>
                            )}
                            <th className={`p-3 text-right border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>{rePropertyType === "land" ? "Arsa Alanı" : "m² (Net)"}</th>
                            <th className={`p-3 border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"} min-w-[220px]`}>İlan Başlığı</th>
                            {rePropertyType === "land" ? (
                              <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>İmar Durumu</th>
                            ) : (
                              <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>Isınma / Kat</th>
                            )}
                            <th className={`p-3 text-center border-r ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>İlan Tarihi</th>
                            <th className={`p-3 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>İl / İlçe</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? "divide-slate-800/60" : "divide-slate-200"}`}>
                      {filteredListings.slice(0, visibleCount).map((listing: any, idx: number) => {
                        const price = Math.round(Number(listing.price) || 0).toLocaleString('tr-TR');
                        const currency = listing.currency || 'TL';
                        const dateStr = listing.created_at 
                          ? new Date(listing.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '12 Ağustos 2026';
                        const loc = formatLocation(listing);

                        if (mainTab === "vehicle" || listing.listing_type === "vehicle") {
                          const brand = listing.brand || listing.sector_data?.brand || "-";
                          
                          const rawFuel = listing.fuel_type || listing.sector_data?.fuel_type || listing.sector_data?.fuel || listing.fuel;
                          const fuelType = formatFuelType(rawFuel);

                          const rawTrans = listing.transmission || listing.sector_data?.transmission || listing.sector_data?.vites || listing.vites;
                          const transType = formatTransmission(rawTrans);

                          const model = listing.sector_data?.model || listing.category || "-";
                          const year = listing.year || listing.sector_data?.year || listing.sector_data?.model_year || "-";
                          const km = listing.mileage 
                            ? Math.round(Number(listing.mileage)).toLocaleString('tr-TR') 
                            : (listing.sector_data?.km ? Number(listing.sector_data.km).toLocaleString('tr-TR') : "-");

                          return (
                            <tr 
                              key={`marketplace-vehicle-${listing.id || idx}-${idx}`} 
                              className={`transition-colors border-b ${isDarkMode ? "hover:bg-blue-950/30 border-slate-800/50" : "hover:bg-slate-50 border-slate-200"} group`}
                            >
                              <td className={`p-3 text-right font-black text-rose-600 dark:text-rose-500 text-sm md:text-base border-r ${isDarkMode ? "border-slate-800/60 bg-slate-950 group-hover:bg-blue-950/40" : "border-slate-200 bg-white group-hover:bg-slate-50"} sticky left-0 z-10 shadow-md align-middle whitespace-nowrap`}>
                                {price} {currency}
                              </td>
                              <td className={`p-2 border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle`}>
                                <ListingCardImage 
                                  listing={listing} 
                                  aspect="aspect-[4/3]" 
                                  className="w-32 h-20 rounded-xl" 
                                  disableCarousel={true}
                                  disableBadges={true}
                                  onImageClick={() => setSelectedListing(listing)} 
                                />
                              </td>
                              <td className={`p-3 font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {brand}
                              </td>
                              <td className={`p-3 font-semibold ${isDarkMode ? "text-amber-400" : "text-amber-600"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {fuelType}
                              </td>
                              <td className={`p-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {model}
                              </td>
                              <td className={`p-3 border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle`}>
                                <div 
                                  onClick={() => setSelectedListing(listing)} 
                                  className={`font-bold hover:text-blue-400 cursor-pointer line-clamp-2 leading-snug ${isDarkMode ? "text-white" : "text-slate-900"}`}
                                >
                                  {listing.title}
                                </div>
                                {listing.store_name && (
                                  <span className={`text-[10px] font-semibold block mt-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                                    {listing.store_name}
                                  </span>
                                )}
                              </td>
                              <td className={`p-3 text-center font-bold ${isDarkMode ? "text-slate-300" : "text-slate-800"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {year}
                              </td>
                              <td className={`p-3 text-right font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-800"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {km}
                              </td>
                              <td className={`p-3 text-center font-bold ${isDarkMode ? "text-blue-400" : "text-blue-600"} text-xs border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {transType}
                              </td>
                              <td className={`p-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"} text-[11px] align-middle whitespace-nowrap`}>
                                {loc}
                              </td>
                            </tr>
                          );
                        } else {
                          const reType = formatCategory(listing);
                          const rooms = listing.room_count || listing.sector_data?.rooms || listing.sector_data?.oda || "-";
                          
                          const sqVal = getSquareMeters(listing);
                          const isLand = listing.sector_data?.type === 'land' || listing.sector_data?.property_type === 'land' || listing.type === 'land' || (listing.category || '').toLowerCase().includes('land') || (listing.category || '').toLowerCase().includes('arsa');
                          const m2 = sqVal ? (isLand ? `${sqVal}` : `${sqVal} m²`) : "-";

                          const isRent = listing.listing_intent === 'rent' || listing.intent === 'rent' || listing.sector_data?.listing_intent === 'rent' || listing.sector_data?.intent === 'rent' || listing.fihrist_type === 'kiralik' || reFihristTab === 'kiralik';

                          const rawKocan = listing.kocan_type || listing.kktc_title_type || listing.deed_type || listing.sector_data?.kocan_type || listing.sector_data?.kktc_title_type || listing.sector_data?.deed_type || listing.sector_data?.kocan || listing.sector_data?.title_deed;
                          const kocanTipi = isRent ? "-" : (rawKocan || "-");

                          const rawImar = listing.zoning_status || listing.imar_durumu || listing.zoning || listing.sector_data?.zoning_status || listing.sector_data?.imar_durumu || listing.sector_data?.zoning || listing.sector_data?.zoning_type;
                          const imarDurumu = rawImar || "-";

                          const heating = listing.sector_data?.heating || listing.sector_data?.building_age || listing.sector_data?.floor || "-";

                          return (
                            <tr 
                              key={`marketplace-re-${listing.id || idx}-${idx}`} 
                              className={`transition-colors border-b ${isDarkMode ? "hover:bg-blue-950/30 border-slate-800/50" : "hover:bg-slate-50 border-slate-200"} group`}
                            >
                              <td className={`p-3 text-right font-black text-rose-600 dark:text-rose-500 text-sm md:text-base border-r ${isDarkMode ? "border-slate-800/60 bg-slate-950 group-hover:bg-blue-950/40" : "border-slate-200 bg-white group-hover:bg-slate-50"} sticky left-0 z-10 shadow-md align-middle whitespace-nowrap`}>
                                {price} {currency}
                              </td>
                              <td className={`p-2 border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle`}>
                                <ListingCardImage 
                                  listing={listing} 
                                  aspect="aspect-[4/3]" 
                                  className="w-32 h-20 rounded-xl" 
                                  disableCarousel={true}
                                  disableBadges={true}
                                  onImageClick={() => setSelectedListing(listing)} 
                                />
                              </td>
                              <td className={`p-3 font-bold ${isDarkMode ? "text-amber-300" : "text-amber-600"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {reType}
                              </td>
                              {rePropertyType === "land" ? (
                                <td className={`p-3 text-center font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                  {kocanTipi}
                                </td>
                              ) : (
                                <td className={`p-3 text-center font-bold ${isDarkMode ? "text-slate-200" : "text-slate-800"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                  {rooms}
                                </td>
                              )}
                              <td className={`p-3 text-right font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-800"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {m2}
                              </td>
                              <td className={`p-3 border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle`}>
                                <div 
                                  onClick={() => setSelectedListing(listing)} 
                                  className={`font-bold hover:text-blue-400 cursor-pointer line-clamp-2 leading-snug ${isDarkMode ? "text-white" : "text-slate-900"}`}
                                >
                                  {listing.title}
                                </div>
                                {listing.store_name && (
                                  <span className={`text-[10px] font-semibold block mt-1 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}>
                                    {listing.store_name}
                                  </span>
                                )}
                              </td>
                              {rePropertyType === "land" ? (
                                <td className={`p-3 text-center ${isDarkMode ? "text-slate-400" : "text-slate-600"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                  {imarDurumu}
                                </td>
                              ) : (
                                <td className={`p-3 text-center ${isDarkMode ? "text-slate-400" : "text-slate-600"} border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                  {heating}
                                </td>
                              )}
                              <td className={`p-3 text-center ${isDarkMode ? "text-slate-400" : "text-slate-600"} text-[11px] border-r ${isDarkMode ? "border-slate-800/60" : "border-slate-200"} align-middle whitespace-nowrap`}>
                                {dateStr}
                              </td>
                              <td className={`p-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"} text-[11px] align-middle whitespace-nowrap`}>
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
          <section className="mt-12 mb-8 bg-slate-100/80 dark:bg-slate-900/60 p-4 md:p-5 rounded-3xl border border-amber-500/20 shadow-md">
            <div 
              onClick={() => setShowFeaturedStores(!showFeaturedStores)}
              className="flex items-center justify-between cursor-pointer select-none group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-500 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Ortaklarımız</span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black border border-amber-500/30">
                      {featuredStores.length} Mağaza
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                    Doğrulanmış kurumsal emlak ve oto galeri partner mağazalarımız
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-black border border-amber-500/30 transition-all cursor-pointer shrink-0"
              >
                <span>{showFeaturedStores ? "Gizle" : "Göster"}</span>
                {showFeaturedStores ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showFeaturedStores && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80">
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
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400">{store.name}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{partnerSectorLabel}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {store.enrakipsiz_featured_title || "Kurumsal üye mağazamızı ziyaret ederek özel ilanlarımızı inceleyin."}
                        </p>
                      </div>
                      <span className="mt-4 text-[11px] font-extrabold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1">
                        Mağazayı İncele &rarr;
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
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
        <section className={`my-16 p-6 md:p-8 rounded-3xl border ${cardBg}`}>
          <div className="max-w-4xl mx-auto space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-slate-900 dark:text-white font-black">Enrakipsiz.com</strong>, Türkiye ve KKTC genelindeki yetkili emlak danışmanları, inşaat firmaları ve kurumsal oto galeri mağazalarının güncel portföylerini tek bir dijital fihrist çatısı altında buluşturan yenilikçi bir ilan ve pazar yeridir. Sistemimiz üzerinde yer alan tüm satılık daire, kiralık konut, arsa, işyeri ve ikinci el vasıta ilanları, doğrudan yetkili üye mağazalarımız tarafından anlık olarak güncellenmektedir.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base font-extrabold text-amber-600 dark:text-amber-400 mb-2">🏠 Emlak & Gayrimenkul Klasörü</h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Emlak fihristimiz altında satılık konutlar, eşyalı kiralık daireler, kampüslere yakın öğrenci stüdyoları, deniz manzaralı villalar, arsa ve ticari mülkler kategorize edilmiş olarak sunulmaktadır. Filtreleme seçeneklerimiz sayesinde oda sayısı, eşya durumu, bölge ve fiyat aralıklarına göre saniyeler içinde aradığınız mülke ulaşabilirsiniz.
                </p>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400 mb-2">🚗 Vasıta & Oto Galeri Klasörü</h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  Otomotiv fihristimizde son gelen ikinci el araçlar, acil satılık ve fiyatı düşen otomobiller, ilk araç alacaklara özel bütçe dostu seçenekler, az yakan dizel ve hibrit modeller ile SUV ve ticari araçlar yer alır. Tüm araçlar mağaza güvencesiyle sergilenir.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Sıkça Sorulan Sorular (SSS)</span>
              </h3>
              <div className="space-y-4 text-xs md:text-sm">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">1. Enrakipsiz portalındaki ilanlar güvenilir mi?</h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    Evet. Portalımızda yalnızca onaylı ve yetkili kurumsal mağazaların portföyleri yayınlanır. Bireysel sahte ilanlara izin verilmez.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">2. Mağaza açarak ilanlarımı nasıl yayınlayabilirim?</h4>
                  <p className="mt-1 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                    Emlak ofisiniz veya oto galeriniz için mağaza paneliniz üzerinden portföyünüzü eklediğinizde ilanlarınız otomatik olarak enrakipsiz.com portalında yayına alınır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right side pull-tab trigger for filter drawer */}
        <div 
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 cursor-pointer group"
          onMouseEnter={() => setIsFilterDrawerOpen(true)}
          onClick={() => setIsFilterDrawerOpen(true)}
        >
          <div className={`flex items-center gap-2 py-4 px-2.5 ${mainTab === 'vehicle' ? 'bg-rose-600 hover:bg-rose-500 border-rose-400/50' : 'bg-blue-600 hover:bg-blue-500 border-blue-400/50'} text-white rounded-l-2xl shadow-2xl transition-all duration-300 border-l border-t border-b group-hover:pl-4 group-hover:scale-105`}>
            <Filter className="w-5 h-5 text-white shrink-0 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 hidden sm:inline">
              DETAYLI FİLTRE
            </span>
          </div>
        </div>

        {/* GLOBAL FILTER DRAWER FOR BOTH EMLAK AND ARAÇLAR */}
        <FilterDrawer 
          isOpen={isFilterDrawerOpen} 
          onClose={() => setIsFilterDrawerOpen(false)}
          activeSector={mainTab === 'vehicle' ? 'araclar' : 'emlak'}
          reFihristTab={reFihristTab}
          setReFihristTab={setReFihristTab}
          rePropertyType={rePropertyType}
          setRePropertyType={setRePropertyType}
          reSubPropertyTypes={reSubPropertyTypes}
          setReSubPropertyTypes={setReSubPropertyTypes}
          reRegion={reRegion}
          setReRegion={setReRegion}
          reSubRegions={reSubRegions}
          setReSubRegions={setReSubRegions}
          reRooms={reRooms}
          setReRooms={setReRooms}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          reFurnished={reFurnished}
          setReFurnished={setReFurnished}
          reKocanType={reKocanType}
          setReKocanType={setReKocanType}
          activeTags={activeTags}
          setActiveTags={setActiveTags}
          EMLAK_TIPI_SUB_TIPLERI={EMLAK_TIPI_SUB_TIPLERI}
          REAL_ESTATE_REGIONS={REAL_ESTATE_REGIONS}
          activeVehicleCategory={activeVehicleCategory}
          setActiveVehicleCategory={setActiveVehicleCategory}
          activeVehicleBrand={activeVehicleBrand}
          setActiveVehicleBrand={setActiveVehicleBrand}
          activeVehicleModel={activeVehicleModel}
          setActiveVehicleModel={setActiveVehicleModel}
          activeVehicleTransmission={activeVehicleTransmission}
          setActiveVehicleTransmission={setActiveVehicleTransmission}
          activeVehicleFuel={activeVehicleFuel}
          setActiveVehicleFuel={setActiveVehicleFuel}
          activeVehicleYear={activeVehicleYear}
          setActiveVehicleYear={setActiveVehicleYear}
          activeVehicleBodyType={activeVehicleBodyType}
          setActiveVehicleBodyType={setActiveVehicleBodyType}
          activeVehicleTradeIn={activeVehicleTradeIn}
          setActiveVehicleTradeIn={setActiveVehicleTradeIn}
          vehicleBrands={vehicleBrands}
          vehicleModels={vehicleModels}
          vehicleYears={vehicleYears}
        />

      </main>

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

              {/* Main Photo Canvas & Thumbnails (Mobile 80% Screen Height + Swipeable Finger Gestures) */}
              <div className="space-y-3 mb-6">
                <div className="relative h-[80vh] min-h-[480px] max-h-[82vh] md:aspect-[16/9] md:h-auto md:min-h-0 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/90 shadow-inner group select-none touch-pan-y">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.img 
                      key={currentImg}
                      src={currentImg} 
                      alt={selectedListing.title} 
                      className="w-full h-full object-cover md:object-cover cursor-grab active:cursor-grabbing pointer-events-auto"
                      referrerPolicy="no-referrer"
                      onError={(e: any) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"; }}
                      initial={{ opacity: 0.4, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0.4, scale: 0.98 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(_e, { offset, velocity }) => {
                        const swipe = offset.x;
                        const speed = velocity.x;
                        if (Math.abs(swipe) > 40 || Math.abs(speed) > 400) {
                          if (swipe > 0 || speed > 400) {
                            setActiveDetailImageIndex(prev => prev === 0 ? modalImages.length - 1 : prev - 1);
                          } else {
                            setActiveDetailImageIndex(prev => prev === modalImages.length - 1 ? 0 : prev + 1);
                          }
                        }
                      }}
                    />
                  </AnimatePresence>
                  
                  {/* Subtle Swipe Guide & Image Counter Overlay */}
                  {modalImages.length > 1 && (
                    <>
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/75 text-white/90 rounded-full text-[10px] font-bold border border-white/10 backdrop-blur-md shadow-md flex items-center gap-1.5 pointer-events-none">
                        <span>👈 Sağa / Sola Kaydırın 👉</span>
                      </div>

                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-slate-950/80 text-white rounded-lg text-xs font-black border border-white/20 backdrop-blur-md shadow-md pointer-events-none">
                        {activeDetailImageIndex + 1} / {modalImages.length}
                      </div>

                      {/* Dot Indicators on Mobile */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 pointer-events-none">
                        {modalImages.slice(0, 10).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              idx === activeDetailImageIndex
                                ? "w-5 bg-amber-400"
                                : "w-1.5 bg-white/40"
                            }`}
                          />
                        ))}
                        {modalImages.length > 10 && (
                          <span className="text-[9px] text-white/60 font-bold ml-0.5">+{modalImages.length - 10}</span>
                        )}
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
                        <img src={img} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e: any) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"; }} />
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
                    (() => {
                      const isLand = sec.type === 'land' || 
                        sec.property_type === 'land' || 
                        selectedListing.type === 'land' || 
                        (selectedListing.category || '').toLowerCase().includes('land') || 
                        (selectedListing.category || '').toLowerCase().includes('arsa') || 
                        (selectedListing.category || '').toLowerCase().includes('tarla') ||
                        (selectedListing.title || '').toLowerCase().includes('arsa') ||
                        (selectedListing.title || '').toLowerCase().includes('tarla');

                      if (isLand) {
                        return (
                          <>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Mülk Tipi</span>
                              <span className="text-xs font-black text-slate-900">{formatCategory(selectedListing)}</span>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Arsa Alanı</span>
                              <span className="text-xs font-black text-emerald-700">
                                {(() => {
                                  const sqVal = getSquareMeters(selectedListing);
                                  if (!sqVal) return 'Belirtilmedi';
                                  return `${sqVal} m²`;
                                })()}
                              </span>
                            </div>
                            {(() => {
                              const isRent = selectedListing.listing_intent === 'rent' || selectedListing.intent === 'rent' || sec.listing_intent === 'rent' || sec.intent === 'rent' || selectedListing.fihrist_type === 'kiralik' || reFihristTab === 'kiralik';
                              if (isRent) return null;
                              const titleType = selectedListing.kocan_type || selectedListing.kktc_title_type || sec.kocan_type || sec.kktc_title_type || sec.deed_type || sec.kocan;
                              if (!titleType) return null;
                              return (
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Koçan / Tapu</span>
                                  <span className="text-xs font-black text-amber-800">{formatTitleDeedType(titleType)}</span>
                                </div>
                              );
                            })()}
                            {(sec.island || sec.plot) && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ada / Parsel</span>
                                <span className="text-xs font-black text-slate-900">{sec.island || '---'} / {sec.plot || '---'}</span>
                              </div>
                            )}
                            {sec.kaks && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Emsal / KAKS</span>
                                <span className="text-xs font-black text-slate-900">{sec.kaks}</span>
                              </div>
                            )}
                            {sec.gabari && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Gabari / Kat Sınırı</span>
                                <span className="text-xs font-black text-slate-900">{sec.gabari}</span>
                              </div>
                            )}
                            {sec.elektrik_var !== undefined && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Elektrik Altyapısı</span>
                                <span className="text-xs font-black text-emerald-700">{sec.elektrik_var ? 'Altyapı Var' : 'Yok'}</span>
                              </div>
                            )}
                            {sec.su_var !== undefined && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Su Altyapısı</span>
                                <span className="text-xs font-black text-emerald-700">{sec.su_var ? 'Altyapı Var' : 'Yok'}</span>
                              </div>
                            )}
                            {sec.yol_var !== undefined && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Kadastro Yolu</span>
                                <span className="text-xs font-black text-emerald-700">{sec.yol_var ? 'Kadastro Yolu Var' : 'Yok'}</span>
                              </div>
                            )}
                            {sec.trafo_bedeli !== undefined && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Trafo Bedeli</span>
                                <span className="text-xs font-black text-slate-900">{sec.trafo_bedeli ? 'Ödendi' : 'Ödenmedi'}</span>
                              </div>
                            )}
                          </>
                        );
                      }

                      return (
                        <>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Mülk Tipi</span>
                            <span className="text-xs font-black text-slate-900">{formatCategory(selectedListing)}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Oda Sayısı</span>
                            <span className="text-xs font-black text-blue-700">{selectedListing.room_count || sec.rooms || sec.oda || 'Belirtilmedi'}</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Metrekare (Net)</span>
                            <span className="text-xs font-black text-emerald-700">
                              {(() => {
                                const sqVal = getSquareMeters(selectedListing);
                                if (!sqVal) return 'Belirtilmedi';
                                return `${sqVal} m²`;
                              })()}
                            </span>
                          </div>
                          {(() => {
                            const isRent = selectedListing.listing_intent === 'rent' || selectedListing.intent === 'rent' || sec.listing_intent === 'rent' || sec.intent === 'rent' || selectedListing.fihrist_type === 'kiralik' || reFihristTab === 'kiralik';
                            if (isRent) return null;
                            const titleType = selectedListing.kocan_type || selectedListing.kktc_title_type || sec.kocan_type || sec.kktc_title_type || sec.deed_type || sec.kocan;
                            if (!titleType) return null;
                            return (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Koçan / Tapu</span>
                                <span className="text-xs font-black text-amber-800">{formatTitleDeedType(titleType)}</span>
                              </div>
                            );
                          })()}
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
                      );
                    })()
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
                        <span className="text-xs font-black text-amber-800">
                          {formatFuelType(
                            selectedListing.fuel_type || 
                            selectedListing.fuel || 
                            sec.fuel_type || 
                            sec.fuel || 
                            sec.yakit
                          )}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Vites Tipi</span>
                        <span className="text-xs font-black text-slate-900">
                          {formatTransmission(
                            selectedListing.transmission || 
                            selectedListing.vites || 
                            sec.transmission || 
                            sec.vites || 
                            'automatic'
                          )}
                        </span>
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
