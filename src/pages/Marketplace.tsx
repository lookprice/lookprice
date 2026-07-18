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
  Maximize2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "../components/RadarShowcaseSlider";
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from "../data/realEstateConfig";
import { SectorSpecs } from "../components/SectorSpecs";

type CategoryFilter = "all" | "vehicle" | "real_estate";

const cleanHtmlText = (text: string) => {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n/g, "<br />");
};

export const Marketplace = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [portalNews, setPortalNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [activeSubSector, setActiveSubSector] = useState<string>("all");
  const [activeVehicleBrand, setActiveVehicleBrand] = useState<string>("all");
  const [activeVehicleModel, setActiveVehicleModel] = useState<string>("all");
  const [activeVehicleYear, setActiveVehicleYear] = useState<string>("all");
  const [activeVehicleFuel, setActiveVehicleFuel] = useState<string>("all");
  const [activeVehicleTransmission, setActiveVehicleTransmission] = useState<string>("all");
  const [activeVehiclePriceRange, setActiveVehiclePriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [selectedListing, setSelectedListing] = useState<any | null>(null);

  // Active real estate filters states
  const [reRegion, setReRegion] = useState<string>("all");
  const [reSubRegion, setReSubRegion] = useState<string>("all");
  const [reType, setReType] = useState<string>("all");
  const [reSubType, setReSubType] = useState<string>("all");
  const [reRooms, setReRooms] = useState<string>("all");
  const [reTrafoBedeli, setReTrafoBedeli] = useState<string>("all");
  const [reKdvStatus, setReKdvStatus] = useState<string>("all");
  const [reCatiTerasi, setReCatiTerasi] = useState<string>("all");
  const [reListingIntent, setReListingIntent] = useState<string>("all");
  const [reFurnished, setReFurnished] = useState<string>("all");
  const [reBillingPeriod, setReBillingPeriod] = useState<string>("all");
  
  // Gallery states
  const [activeDetailImageIndex, setActiveDetailImageIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const modalImages: string[] = [];
  if (selectedListing) {
    if (Array.isArray(selectedListing.images) && selectedListing.images.length > 0) {
      modalImages.push(...selectedListing.images);
    } else if (selectedListing.image_url) {
      modalImages.push(selectedListing.image_url);
    }
  }

  useEffect(() => {
    setActiveDetailImageIndex(0);
  }, [selectedListing]);

  useEffect(() => {
    if (!selectedListing || modalImages.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setActiveDetailImageIndex((prev) => (prev + 1) % modalImages.length);
      } else if (e.key === "ArrowLeft") {
        setActiveDetailImageIndex(
          (prev) => (prev - 1 + modalImages.length) % modalImages.length
        );
      } else if (e.key === "Escape") {
        if (zoomedImage) {
          setZoomedImage(null);
        } else {
          setSelectedListing(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedListing, modalImages.length, zoomedImage]);
  const activeImage = modalImages[activeDetailImageIndex] || selectedListing?.image_url;
  
  // Luxury Slide states
  const [activeSlide, setActiveSlide] = useState(0);
  const [showAdModal, setShowAdModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any | null>(null);

  // Dynamic Customizer Portal settings state
  const [portalSettings, setPortalSettings] = useState<any>({
    portal_title: "Seçkin Mağazalardan Rakipsiz Teklifler & İlanlar",
    portal_description: "Oto galeri, emlak ofisleri ve premium e-ticaret markalarının en güncel, doğrulanmış ilanlarını tek bir ekranda canlı olarak inceleyin.",
    announcement: "",
    primary_color: "#ea580c",
    footer_text: "© 2026 Enrakipsiz.com. Tüm hakları saklıdır.",
    theme_style: "dark_gold",
    font_family: "Inter",
    layout_sections: "[\"hero\",\"announcement\",\"sponsors\",\"vehicles\",\"properties\"]",
    custom_css: ""
  });
  const [dbSlides, setDbSlides] = useState<any[]>([]);
  const [dbAds, setDbAds] = useState<any[]>([]);
  const [featuredStores, setFeaturedStores] = useState<any[]>([]);

  const luxurySlides = dbSlides.length > 0 ? dbSlides.map(s => ({
    image: s.image_url,
    title: s.title,
    subtitle: s.subtitle || "",
    description: s.description || "",
    badge: s.badge || "Enrakipsiz",
    accent: s.accent || "from-rose-500 to-amber-500",
    type: s.type || "vehicle",
    link_url: s.link_url || ""
  })) : [];

  const premiumAds = dbAds.length > 0 ? dbAds.map((ad, idx) => ({
    id: `ad-${ad.id || idx}`,
    title: ad.title,
    broker: ad.broker || "SPONSOR",
    description: ad.description || "",
    profitBadge: ad.profit_badge || "Ayrıcalıklı Teklif",
    actionText: ad.action_text || "İncele",
    icon: Sparkles,
    color: ad.accent || (idx % 3 === 0 ? "from-amber-500/10 to-amber-600/5" : idx % 3 === 1 ? "from-rose-500/10 to-rose-600/5" : "from-cyan-500/10 to-blue-600/5"),
    borderColor: idx % 3 === 0 ? "border-amber-500/20 text-amber-400" : idx % 3 === 1 ? "border-rose-500/20 text-rose-400" : "border-cyan-500/20 text-cyan-400"
  })) : [
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
    if (luxurySlides.length === 0) return;
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
    // Set default portal title on mount
    document.title = "EnRakipsiz | KKTC'nin En Büyük Portföy Portalı";

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
          // Set beautiful dynamic title from settings
          const customTitle = portalRes.settings.seo_title || portalRes.settings.portal_title || "EnRakipsiz | KKTC'nin En Büyük Portföy Portalı";
          document.title = customTitle;
        }
        if (portalRes.slides && portalRes.slides.length > 0) {
          setDbSlides(portalRes.slides);
        }
        if (portalRes.ads && portalRes.ads.length > 0) {
          setDbAds(portalRes.ads);
        }
        if (portalRes.featured_stores) {
          setFeaturedStores(portalRes.featured_stores);
        }
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeCategory !== "vehicle" && activeCategory !== "all") {
      setActiveSubSector("all");
    }
    if (activeCategory !== "real_estate" && activeCategory !== "all") {
      setReRegion("all");
      setReSubRegion("all");
      setReType("all");
      setReSubType("all");
      setReRooms("all");
      setReTrafoBedeli("all");
      setReKdvStatus("all");
      setReCatiTerasi("all");
      setReListingIntent("all");
      setReFurnished("all");
      setReBillingPeriod("all");
    }
  }, [activeCategory]);

  useEffect(() => {
    setReSubRegion("all");
  }, [reRegion]);

  useEffect(() => {
    setReSubType("all");
  }, [reType]);

  // Filter & Sort Logic
  const filteredListings = listings
    .filter(item => {
      // Filter by status: Only show active listings on the marketplace
      if (item.status && item.status !== 'active') return false;

      // Exclude products from enrakipsiz portal
      if (item.listing_type === "product") return false;
      const matchesCategory = activeCategory === "all" || item.listing_type === activeCategory;
      const itemSubSector = String(item.sector_data?.category || (item as any).sub_sector || item.category || "").toLowerCase();
      const matchesSubSector = activeSubSector === "all" || (item.listing_type === "vehicle" && itemSubSector === activeSubSector.toLowerCase());
      
      // Real Estate sub-filters check
      if (item.listing_type === "real_estate") {
        // region
        if (reRegion !== "all") {
          const itemRegion = item.sector_data?.kktc_region || item.sector_data?.city || item.location || "";
          if (itemRegion.toLowerCase() !== reRegion.toLowerCase()) return false;
        }
        // subRegion
        if (reSubRegion !== "all") {
          const itemSubRegion = item.sector_data?.kktc_sub_region || item.sector_data?.district || "";
          if (itemSubRegion.toLowerCase() !== reSubRegion.toLowerCase()) return false;
        }
        // type
        if (reType !== "all") {
          const itemType = item.category || "";
          if (itemType.toLowerCase() !== reType.toLowerCase()) return false;
        }
        // subType
        if (reSubType !== "all") {
          const itemSubType = item.sector_data?.subtype || "";
          if (itemSubType.toLowerCase() !== reSubType.toLowerCase()) return false;
        }
        // rooms
        if (reRooms !== "all") {
          const itemRooms = String(item.sector_data?.rooms || "");
          if (reRooms === "5+") {
            const match = itemRooms.match(/^(\d+)/);
            const roomsNum = match ? parseInt(match[1]) : 0;
            if (roomsNum < 5) return false;
          } else {
            if (itemRooms !== reRooms) return false;
          }
        }
        // listing_intent
        const itemIntent = (item.listing_intent || item.sector_data?.listing_intent || "sale").toLowerCase();
        if (reListingIntent !== "all") {
          if (itemIntent !== reListingIntent.toLowerCase()) return false;
        }

        // trafo_bedeli (only for sale)
        if (itemIntent !== "rent" && reTrafoBedeli !== "all") {
          const isPaid = item.sector_data?.trafo_bedeli === true;
          const targetPaid = reTrafoBedeli === "paid";
          if (isPaid !== targetPaid) return false;
        }
        // kdv_status (only for sale)
        if (itemIntent !== "rent" && reKdvStatus !== "all") {
          const status = item.sector_data?.kdv_status || "to_be_paid";
          if (status !== reKdvStatus) return false;
        }
        // cati_terasi
        if (reCatiTerasi !== "all") {
          const hasTerrace = item.sector_data?.cati_terasi === true;
          const targetTerrace = reCatiTerasi === "yes";
          if (hasTerrace !== targetTerrace) return false;
        }
        // furnished (only for rent)
        if (itemIntent === "rent" && reFurnished !== "all") {
          const isFurnished = item.sector_data?.furnished === true;
          const targetFurnished = reFurnished === "furnished";
          if (isFurnished !== targetFurnished) return false;
        }
        // billing_period (only for rent)
        if (itemIntent === "rent" && reBillingPeriod !== "all") {
          const period = item.sector_data?.billing_period || "monthly";
          if (period !== reBillingPeriod) return false;
        }
      }

      // Add vehicle specific filters
      if (item.listing_type === "vehicle" && (activeCategory === "all" || activeCategory === "vehicle")) {
        // Vehicle Brand
        if (activeVehicleBrand !== "all") {
          const itemBrand = String(item.brand || item.sector_data?.brand || item.sector_data?.brand_name || (item as any).brand || "").toLowerCase();
          if (itemBrand !== activeVehicleBrand.toLowerCase()) return false;
        }
        // Vehicle Model
        if (activeVehicleModel !== "all") {
          const itemModel = String(item.sector_data?.model || item.sector_data?.model_name || item.sector_data?.series || item.model || (item as any).model || "").toLowerCase();
          if (itemModel !== activeVehicleModel.toLowerCase()) return false;
        }
        // Vehicle Year
        if (activeVehicleYear !== "all") {
          const itemYear = String(item.year || item.sector_data?.year || "");
          if (itemYear !== activeVehicleYear) return false;
        }
        // Vehicle Fuel
        if (activeVehicleFuel !== "all") {
          const itemFuel = String(item.fuel_type || item.sector_data?.fuel_type || item.fuel || item.sector_data?.fuel || "").toLowerCase();
          if (itemFuel !== activeVehicleFuel.toLowerCase()) return false;
        }
        // Vehicle Transmission
        if (activeVehicleTransmission !== "all") {
          const itemTrans = String(item.transmission || item.sector_data?.transmission || "").toLowerCase();
          if (itemTrans !== activeVehicleTransmission.toLowerCase()) return false;
        }
        // Vehicle Price Range
        if (activeVehiclePriceRange !== "all") {
          const price = Number(item.price || 0);
          if (activeVehiclePriceRange.endsWith("+")) {
            const limit = Number(activeVehiclePriceRange.replace("+", ""));
            if (price < limit) return false;
          } else {
            const [min, max] = activeVehiclePriceRange.split("-").map(Number);
            if (price < min || price > max) return false;
          }
        }
      }

      const matchesSearch = 
        (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.store_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSubSector && matchesSearch;
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
    total: listings.filter(l => l.listing_type !== "product").length,
    vehicles: listings.filter(l => l.listing_type === "vehicle").length,
    properties: listings.filter(l => l.listing_type === "real_estate").length,
  };

  // Dynamic filter options for Vehicles
  const vehicleBrands = React.useMemo(() => {
    let source = listings.filter(l => l.listing_type === "vehicle");
    if (activeSubSector !== "all") {
      source = source.filter(l => {
        const lSub = String(l.sector_data?.category || (l as any).sub_sector || l.category || "").toLowerCase();
        return lSub === activeSubSector.toLowerCase();
      });
    }
    const brands = source.map(l => l.brand || l.sector_data?.brand || l.sector_data?.brand_name || (l as any).brand).filter(Boolean);
    return Array.from(new Set(brands)).sort((a: any, b: any) => a.localeCompare(b));
  }, [listings, activeSubSector]);

  const vehicleModels = React.useMemo(() => {
    let source = listings.filter(l => l.listing_type === "vehicle");
    if (activeSubSector !== "all") {
      source = source.filter(l => {
        const lSub = String(l.sector_data?.category || (l as any).sub_sector || l.category || "").toLowerCase();
        return lSub === activeSubSector.toLowerCase();
      });
    }
    if (activeVehicleBrand !== "all") {
      source = source.filter(l => {
        const itemBrand = String(l.brand || l.sector_data?.brand || l.sector_data?.brand_name || l.brand_name || (l as any).brand || "").toLowerCase();
        return itemBrand === activeVehicleBrand.toLowerCase();
      });
    }
    const models = source.map(l => l.sector_data?.model || l.sector_data?.model_name || l.sector_data?.series || l.model_name || l.model || (l as any).model).filter(Boolean);
    return Array.from(new Set(models)).sort((a: any, b: any) => a.localeCompare(b));
  }, [listings, activeSubSector, activeVehicleBrand]);

  const vehicleYears = React.useMemo(() => {
    let source = listings.filter(l => l.listing_type === "vehicle");
    if (activeSubSector !== "all") {
      source = source.filter(l => {
        const lSub = String(l.sector_data?.category || (l as any).sub_sector || l.category || "").toLowerCase();
        return lSub === activeSubSector.toLowerCase();
      });
    }
    const years = source.map(l => String(l.year || l.sector_data?.year || (l as any).year)).filter(v => v && v !== 'undefined' && v !== 'null' && v !== '0');
    return Array.from(new Set(years)).sort((a: any, b: any) => Number(b) - Number(a));
  }, [listings, activeSubSector]);

  // Reset model when brand changes
  useEffect(() => {
    if (activeVehicleModel !== "all" && !vehicleModels.includes(activeVehicleModel)) {
      setActiveVehicleModel("all");
    }
  }, [vehicleModels, activeVehicleModel]);

  // Reset filters when category changes
  useEffect(() => {
    setActiveVehicleBrand("all");
    setActiveVehicleModel("all");
    setActiveVehicleYear("all");
    setActiveVehicleFuel("all");
    setActiveVehicleTransmission("all");
    setActiveVehiclePriceRange("all");
  }, [activeSubSector]);

  const themeClasses = {
    theme: "dark_gold",
    shell: "bg-slate-950 text-slate-100",
    card: "bg-slate-900/60 backdrop-blur-md border border-amber-500/20 shadow-lg shadow-amber-950/5",
    accentText: "text-amber-500",
    accentBg: "bg-amber-600",
    accentBgHover: "hover:bg-amber-700",
    accentBorder: "border-amber-500/20",
    heroTitle: "text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    button: "bg-amber-600 hover:bg-amber-700 text-slate-950 shadow-lg shadow-amber-600/30 font-bold",
    announcementBar: "bg-amber-950/35 border-amber-950/15 text-amber-200",
    footer: "bg-slate-950 border-t border-slate-900 text-slate-400"
  };

  const activeFontFamily = portalSettings?.font_family || "Golos Text";
  const fontStyle = { 
    fontFamily: activeFontFamily === "Inter" 
      ? "'Golos Text', 'Inter', sans-serif" 
      : `'${activeFontFamily}', sans-serif`
  };

  const fontImports = `
    @import url('https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
  `;

  const orderedSections = (() => {
    let raw = [];
    try {
      raw = JSON.parse(portalSettings?.layout_sections || '[]');
    } catch(e) {}
    
    if (!Array.isArray(raw) || raw.length === 0) {
      return [
        { id: 'hero', enabled: true },
        { id: 'filters', enabled: true },
        { id: 'announcement', enabled: true },
        { id: 'sponsors', enabled: true },
        { id: 'vehicles', enabled: true },
        { id: 'properties', enabled: true }
      ];
    }
    
    if (typeof raw[0] === 'string') {
      raw = raw.map(id => ({ id, enabled: true }));
    }
    
    const standardKeys = ['hero', 'filters', 'announcement', 'sponsors', 'vehicles', 'properties'];
    standardKeys.forEach(v => {
      if (!raw.some((item: any) => item.id === v)) {
        raw.push({ id: v, enabled: true });
      }
    });
    return raw;
  })();

  return (
    <div className={`min-h-screen ${themeClasses.shell} font-sans antialiased selection:bg-rose-500`} style={fontStyle}>
      <style dangerouslySetInnerHTML={{ __html: `
        ${fontImports}
        ${portalSettings?.custom_css || ""}
      ` }} />
      {/* Premium Obsidian Floating Navigation Bar */}
      <nav className={`sticky top-0 z-40 backdrop-blur-xl border-b ${themeClasses.theme === "editorial_serif" || themeClasses.theme === "swiss_minimal" ? "bg-white/80 border-stone-200" : "bg-slate-900/80 border-slate-800"}`}>
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
            <a 
              href="https://lookprice.net/login" 
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Mağaza Girişi
            </a>
            <a 
              href="https://lookprice.net/register" 
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-rose-950/20 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Hemen Başla
            </a>
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
            <span>Gerçek Portföy Yönetimi..En İyilerin Platformu.</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-tight">
            {portalSettings.portal_title.includes("Rakipsiz") ? (
              <>
                Seçkin Mağazalardan <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 text-transparent bg-clip-text">
                  Rakipsiz Teklifler & İlanlar
                </span>
              </>
            ) : (
              <span className={themeClasses.heroTitle}>{portalSettings.portal_title}</span>
            )}
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            {portalSettings.portal_description}
          </p>
        </div>
      </header>

      {/* Dynamic Sequential Customizer Layout Sections */}
      {orderedSections.filter(sec => sec.enabled).map((sec) => {
        switch(sec.id) {
          case 'filters':
            return (
              <section key="filters" id="enrakipsiz-portal-filters" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
                <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl">
                  <div className="flex flex-col gap-6">
                    
                    {/* Category Pills and Counts */}
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2.5">
                          {[
                            { value: "all", label: "Tüm İlanlar", icon: Filter, count: stats.total },
                            { value: "vehicle", label: "Oto Galeri", icon: Car, count: stats.vehicles },
                            { value: "real_estate", label: "Emlak", icon: Home, count: stats.properties }
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
                        <div className="hidden lg:flex text-[10px] text-slate-400 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-4 py-2 flex items-center gap-2.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-medium">
                            Mağazalarımızdan doğrudan online satın alma veya rezervasyon garantisi verilmektedir.
                          </span>
                        </div>
                      </div>

                      {/* Sub-Sector Filter Row for Vehicles */}
                      {(activeCategory === "all" || activeCategory === "vehicle") && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/50 pt-4">
                          <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider mr-1">Vasıta Türü:</span>
                          {[
                            { value: "all", label: "Tümü" },
                            { value: "otomobil", label: "Otomobil" },
                            { value: "suv", label: "SUV / Arazi Aracı" },
                            { value: "pickup", label: "Pick-up" },
                            { value: "hafif_ticari", label: "Hafif Ticari" },
                            { value: "motorcycle", label: "Motosiklet" },
                            { value: "marine", label: "Deniz Taşıtları" },
                            { value: "construction", label: "İş Makineleri" },
                            { value: "agricultural", label: "Tarım Makineleri" },
                            { value: "other", label: "Diğer Taşıtlar" }
                          ].map((sub) => {
                            const isSubActive = activeSubSector === sub.value;
                            return (
                              <button
                                key={sub.value}
                                onClick={() => setActiveSubSector(sub.value)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all hover:scale-[1.02] ${
                                  isSubActive
                                    ? "bg-rose-500 text-white border border-rose-500 shadow-sm shadow-rose-950/15"
                                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Search and Sort Row */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between border-t border-slate-800/80 pt-5">
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

                    {/* Vehicle Brand and Model Filters */}
                    {(activeCategory === "all" || activeCategory === "vehicle") && (
                      <div className="flex flex-wrap items-center gap-4 border-t border-slate-800/50 pt-4 mt-2">
                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Marka</span>
                          <select
                            value={activeVehicleBrand}
                            onChange={(e) => setActiveVehicleBrand(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                          >
                            <option value="all">Tümü</option>
                            {vehicleBrands.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>

                        {activeVehicleBrand !== "all" && (
                          <div className="flex flex-col gap-1.5 min-w-[140px]">
                            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Model</span>
                            <select
                              value={activeVehicleModel}
                              onChange={(e) => setActiveVehicleModel(e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                            >
                              <option value="all">Tüm Modeller</option>
                              {vehicleModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Model Yılı</span>
                          <select
                            value={activeVehicleYear}
                            onChange={(e) => setActiveVehicleYear(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                          >
                            <option value="all">Tümü</option>
                            {vehicleYears.map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Yakıt</span>
                          <select
                            value={activeVehicleFuel}
                            onChange={(e) => setActiveVehicleFuel(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                          >
                            <option value="all">Tümü</option>
                            <option value="gasoline">Benzin</option>
                            <option value="diesel">Dizel</option>
                            <option value="hybrid">Hibrit</option>
                            <option value="electric">Elektrikli</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Vites</span>
                          <select
                            value={activeVehicleTransmission}
                            onChange={(e) => setActiveVehicleTransmission(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                          >
                            <option value="all">Tümü</option>
                            <option value="manual">Manuel</option>
                            <option value="automatic">Otomatik</option>
                            <option value="semi_automatic">Yarı Otomatik</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Bütçe Aralığı</span>
                          <select
                            value={activeVehiclePriceRange}
                            onChange={(e) => setActiveVehiclePriceRange(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                          >
                            <option value="all">Tümü</option>
                            <option value="0-500000">500.000 TL Altı</option>
                            <option value="500000-1000000">500k - 1.0M TL</option>
                            <option value="1000000-2000000">1.0M - 2.0M TL</option>
                            <option value="2000000-4000000">2.0M - 4.0M TL</option>
                            <option value="4000000+">4.0M TL Üstü</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Real Estate Filter Row / Panel */}
                    {(activeCategory === "real_estate") && (
                      <div className="border-t border-slate-800/50 pt-5 mt-2">
                        <div className="flex items-center gap-2 mb-4">
                          <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                             Detaylı Emlak Filtreleri
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Bölge */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Bölge / Şehir
                            </label>
                            <select
                              value={reRegion}
                              onChange={(e) => setReRegion(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tüm Bölgeler</option>
                              {Object.keys(REAL_ESTATE_REGIONS).map((reg) => (
                                <option key={reg} value={reg}>{reg}</option>
                              ))}
                            </select>
                          </div>

                          {/* Alt Bölge */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Bölge Seçeneği (İlçe/Köy)
                            </label>
                            <select
                              value={reSubRegion}
                              onChange={(e) => setReSubRegion(e.target.value)}
                              disabled={reRegion === "all"}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer disabled:opacity-40"
                            >
                              <option value="all">Tüm Alt Bölgeler</option>
                              {reRegion !== "all" && REAL_ESTATE_REGIONS[reRegion as keyof typeof REAL_ESTATE_REGIONS]?.map((sub: string) => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          </div>

                          {/* Konut Tipi */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Grup / Emlak Tipi
                            </label>
                            <select
                              value={reType}
                              onChange={(e) => setReType(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tümü</option>
                              {Object.keys(EMLAK_TIPI_SUB_TIPLERI).map((tp) => (
                                <option key={tp} value={tp}>{tp}</option>
                              ))}
                            </select>
                          </div>

                          {/* Alt Konut Tipi */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Alt Emlak Detayı
                            </label>
                            <select
                              value={reSubType}
                              onChange={(e) => setReSubType(e.target.value)}
                              disabled={reType === "all"}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer disabled:opacity-40"
                            >
                              <option value="all">Tüm Alt Tipler</option>
                              {reType !== "all" && EMLAK_TIPI_SUB_TIPLERI[reType as keyof typeof EMLAK_TIPI_SUB_TIPLERI]?.map((sub: string) => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          </div>

                          {/* İlan Amacı / Intent */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              İlan Statüsü / Amacı
                            </label>
                            <select
                              value={reListingIntent}
                              onChange={(e) => setReListingIntent(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tümü</option>
                              <option value="satılık">Satılık</option>
                              <option value="kiralık">Kiralık</option>
                              <option value="devren">Devren</option>
                            </select>
                          </div>

                          {/* Oda Sayısı */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Oda Sayısı (Brüt)
                            </label>
                            <select
                              value={reRooms}
                              onChange={(e) => setReRooms(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tümü</option>
                              <option value="Stüdyo">Stüdyo (0+1)</option>
                              <option value="1+1">1+1</option>
                              <option value="2+1">2+1</option>
                              <option value="3+1">3+1</option>
                              <option value="4+1 veya üzeri">4+1 veya daha geniş</option>
                            </select>
                          </div>

                          {/* Eşya Durumu */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Dahili Mobilya / Eşya
                            </label>
                            <select
                              value={reFurnished}
                              onChange={(e) => setReFurnished(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tümü</option>
                              <option value="yes">Eşyalı</option>
                              <option value="no">Eşyasız</option>
                              <option value="partially">Yarı Eşyalı</option>
                            </select>
                          </div>

                          {/* Fatura Periyodu (Kiralıklar için) */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Ödeme Sıklığı / Kira Türü
                            </label>
                            <select
                              value={reBillingPeriod}
                              onChange={(e) => setReBillingPeriod(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tümü</option>
                              <option value="Aylık font-bold">Aylık Kiralama</option>
                              <option value="Yıllık">Peşin / Yıllık Kiralama</option>
                              <option value="Haftalık">Günlük / Haftalık Turistik</option>
                            </select>
                          </div>

                          {/* Trafo Bedeli */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Trafo / Altyapı Katkı Payı
                            </label>
                            <select
                              value={reTrafoBedeli}
                              onChange={(e) => setReTrafoBedeli(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tümü</option>
                              <option value="ödenmiş">Ödenmiş</option>
                              <option value="ödenmemiş">Ödenmemiş (Alıcıya Ait)</option>
                            </select>
                          </div>

                          {/* KDV Durumu */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              KDV Durumu
                            </label>
                            <select
                              value={reKdvStatus}
                              onChange={(e) => setReKdvStatus(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tümü</option>
                              <option value="dahil">KDV Dahil</option>
                              <option value="haric">KDV Hariç</option>
                            </select>
                          </div>

                          {/* Çatı Terası */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                              Çatı Terası
                            </label>
                            <select
                              value={reCatiTerasi}
                              onChange={(e) => setReCatiTerasi(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                            >
                              <option value="all">Tümü</option>
                              <option value="yes">Var</option>
                              <option value="no">Yok</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          case 'hero':
            if (luxurySlides.length === 0) return null;
            return (
              <section key="hero" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
                <div className={`relative h-[480px] rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl bg-slate-105 group ${themeClasses.card}`}>
                  
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
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-955/65 to-transparent" />
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

                          <p className="text-xs md:text-sm font-extrabold tracking-widest text-rose-450 uppercase drop-shadow">
                            {slide.subtitle}
                          </p>

                          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md">
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
                              className="px-6 py-3 bg-white text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 font-mono"
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
                              className="px-6 py-3 bg-slate-900/80 backdrop-blur border border-slate-700 hover:bg-slate-800 text-white text-xs font-black rounded-xl uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all font-mono"
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
                        className={`h-1.5 rounded-full transition-all duration-500 relative ${
                          idx === activeSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Luxury Watermark branding corner */}
                  <div className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur border border-slate-800 pointer-events-none select-none">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-rose-400 to-amber-400 text-transparent bg-clip-text">
                      ENRAKİPSİZ PRESTIGE SELECTION
                    </span>
                  </div>

                </div>
              </section>
            );
          case 'announcement':
            return null;
          case 'sponsors':
            return null;
          case 'vehicles':
            return null;
          case 'properties':
            return null;
          default:
            return null;
        }
      })}

      {/* Main Core Showcase Portal */}
      <main id="enrakipsiz-portal-head" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        
        {/* Filtering and Search Bento Box */}
        {false && (
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
            <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { value: "all", label: "Tüm İlanlar", icon: Filter, count: stats.total },
                    { value: "vehicle", label: "Oto Galeri", icon: Car, count: stats.vehicles },
                    { value: "real_estate", label: "Emlak", icon: Home, count: stats.properties }
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

              {/* Sub-Sector Filter Row for Vehicles */}
              {(activeCategory === "all" || activeCategory === "vehicle") && (
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/50 pt-4">
                  <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider mr-1">Vasıta Türü:</span>
                  {[
                    { value: "all", label: "Tümü" },
                    { value: "otomobil", label: "Otomobil" },
                    { value: "suv", label: "SUV / Arazi Aracı" },
                    { value: "pickup", label: "Pick-up" },
                    { value: "hafif_ticari", label: "Hafif Ticari" },
                    { value: "motorcycle", label: "Motosiklet" },
                    { value: "marine", label: "Deniz Taşıtları" },
                    { value: "construction", label: "İş Makineleri" },
                    { value: "agricultural", label: "Tarım Makineleri" },
                    { value: "other", label: "Diğer Taşıtlar" }
                  ].map((sub) => {
                    const isSubActive = activeSubSector === sub.value;
                    return (
                      <button
                        key={sub.value}
                        onClick={() => setActiveSubSector(sub.value)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-tight transition-all hover:scale-[1.02] ${
                          isSubActive
                            ? "bg-rose-500 text-white border border-rose-500 shadow-sm shadow-rose-950/15"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Vehicle Brand and Model Filters */}
              {(activeCategory === "all" || activeCategory === "vehicle") && (
                <div className="flex flex-wrap items-center gap-4 border-t border-slate-800/50 pt-4 mt-2">
                  <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Marka</span>
                    <select
                      value={activeVehicleBrand}
                      onChange={(e) => setActiveVehicleBrand(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                    >
                      <option value="all">Tümü</option>
                      {vehicleBrands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {activeVehicleBrand !== "all" && (
                    <div className="flex flex-col gap-1.5 min-w-[140px]">
                      <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Model</span>
                      <select
                        value={activeVehicleModel}
                        onChange={(e) => setActiveVehicleModel(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                      >
                        <option value="all">Tüm Modeller</option>
                        {vehicleModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 min-w-[100px]">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Yıl</span>
                    <select
                      value={activeVehicleYear}
                      onChange={(e) => setActiveVehicleYear(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                    >
                      <option value="all">Tümü</option>
                      {vehicleYears.map(y => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Yakıt</span>
                    <select
                      value={activeVehicleFuel}
                      onChange={(e) => setActiveVehicleFuel(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                    >
                      <option value="all">Tümü</option>
                      <option value="gasoline">Benzin</option>
                      <option value="diesel">Dizel</option>
                      <option value="hybrid">Hibrit</option>
                      <option value="electric">Elektrikli</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Vites</span>
                    <select
                      value={activeVehicleTransmission}
                      onChange={(e) => setActiveVehicleTransmission(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                    >
                      <option value="all">Tümü</option>
                      <option value="manual">Manuel</option>
                      <option value="automatic">Otomatik</option>
                      <option value="semi_automatic">Yarı Otomatik</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em]">Bütçe Aralığı</span>
                    <select
                      value={activeVehiclePriceRange}
                      onChange={(e) => setActiveVehiclePriceRange(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 font-bold"
                    >
                      <option value="all">Tümü</option>
                      <option value="0-500000">500.000 TL Altı</option>
                      <option value="500000-1000000">500k - 1.0M TL</option>
                      <option value="1000000-2000000">1.0M - 2.0M TL</option>
                      <option value="2000000-4000000">2.0M - 4.0M TL</option>
                      <option value="4000000+">4.0M TL Üstü</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Real Estate Filter Row / Panel */}
              {(activeCategory === "real_estate") && (
                <div className="border-t border-slate-800/50 pt-5 mt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                      Detaylı Emlak Filtreleri
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Bölge */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Bölge / Şehir
                      </label>
                      <select
                        value={reRegion}
                        onChange={(e) => setReRegion(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="all">Tüm Bölgeler</option>
                        {Object.keys(REAL_ESTATE_REGIONS).map((reg) => (
                          <option key={reg} value={reg}>{reg}</option>
                        ))}
                      </select>
                    </div>

                    {/* Alt Bölge */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Alt Bölge
                      </label>
                      <select
                        value={reSubRegion}
                        onChange={(e) => setReSubRegion(e.target.value)}
                        disabled={reRegion === "all"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <option value="all">Arama Yapılmadı/Tümü</option>
                        {reRegion !== "all" &&
                          REAL_ESTATE_REGIONS[reRegion as keyof typeof REAL_ESTATE_REGIONS]?.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Emlak Tipi */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Emlak Tipi
                      </label>
                      <select
                        value={reType}
                        onChange={(e) => setReType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="all">Tüm Tip ve Kategoriler</option>
                        {Object.keys(EMLAK_TIPI_SUB_TIPLERI).map((typ) => (
                          <option key={typ} value={typ}>{typ}</option>
                        ))}
                      </select>
                    </div>

                    {/* Alt Tip */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Emlak Alt Tipi
                      </label>
                      <select
                        value={reSubType}
                        onChange={(e) => setReSubType(e.target.value)}
                        disabled={reType === "all"}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <option value="all">Tüm Alt Tipler</option>
                        {reType !== "all" &&
                          EMLAK_TIPI_SUB_TIPLERI[reType]?.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))
                        }
                      </select>
                    </div>

                    {/* İlan Tipi (Satılık / Kiralık) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        İlan Tipi
                      </label>
                      <select
                        value={reListingIntent}
                        onChange={(e) => {
                          setReListingIntent(e.target.value);
                          if (e.target.value === "rent") {
                            setReTrafoBedeli("all");
                            setReKdvStatus("all");
                          } else if (e.target.value === "sale") {
                            setReFurnished("all");
                            setReBillingPeriod("all");
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="all">Tümü (Satılık/Kiralık)</option>
                        <option value="sale">Satılık</option>
                        <option value="rent">Kiralık</option>
                      </select>
                    </div>

                    {/* Oda Sayısı */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Oda Sayısı
                      </label>
                      <select
                        value={reRooms}
                        onChange={(e) => setReRooms(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="all">Tümü</option>
                        <option value="1+1">1+1</option>
                        <option value="2+1">2+1</option>
                        <option value="3+1">3+1</option>
                        <option value="4+1">4+1</option>
                        <option value="5+1">5+1</option>
                        <option value="5+">5+ Odalı</option>
                      </select>
                    </div>

                    {reListingIntent === "rent" ? (
                      <>
                        {/* Eşya Durumu */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                            Eşya Durumu
                          </label>
                          <select
                            value={reFurnished}
                            onChange={(e) => setReFurnished(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="all">Tümü</option>
                            <option value="furnished">Eşyalı</option>
                            <option value="unfurnished">Eşyasız</option>
                          </select>
                        </div>

                        {/* Ödeme Periyodu */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                            Ödeme Periyodu
                          </label>
                          <select
                            value={reBillingPeriod}
                            onChange={(e) => setReBillingPeriod(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="all">Tümü</option>
                            <option value="monthly">Aylık</option>
                            <option value="3-monthly">3 Aylık</option>
                            <option value="6-monthly">6 Aylık</option>
                            <option value="yearly">Yıllık</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Trafo Bedeli */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                            Trafo Bedeli
                          </label>
                          <select
                            value={reTrafoBedeli}
                            onChange={(e) => setReTrafoBedeli(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="all">Tümü</option>
                            <option value="paid">Ödendi</option>
                            <option value="not_paid">Ödenmedi / Ödenecek</option>
                          </select>
                        </div>

                        {/* KDV Durumu */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                            KDV Durumu
                          </label>
                          <select
                            value={reKdvStatus}
                            onChange={(e) => setReKdvStatus(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                          >
                            <option value="all">Tümü</option>
                            <option value="paid">Ödendi</option>
                            <option value="to_be_paid">Ödenecek</option>
                          </select>
                        </div>
                      </>
                    )}

                    {/* Çatı Terası */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        Çatı Terası
                      </label>
                      <select
                        value={reCatiTerasi}
                        onChange={(e) => setReCatiTerasi(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="all">Tümü</option>
                        <option value="yes">Var</option>
                        <option value="no">Yok</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
        )}



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
                      to={`${window.location.hostname.includes("enrakipsiz") ? "/s" : "/store"}/${listing.store_slug}/p/${listing.barcode || listing.id}`} 
                      target="_blank" 
                      className="py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      Detayları İncele
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                </article>
              ))}
            </div>
          )}
        </section>

        {/* Öne Çıkan Seçkin Mağazalar / Sponsor Vitrini (5. MADDE) */}
        {featuredStores && featuredStores.length > 0 && (
          <section className="mt-16 mb-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <h2 className="text-xs uppercase font-black tracking-widest text-slate-350">
                  Seçkin Mağaza Vitrin Ortaklarımız
                </h2>
              </div>
              <span className="text-[10px] font-black text-amber-500 bg-amber-950/40 px-3 py-1 rounded-md border border-amber-800">
                PRO SPONSOR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredStores.map((store) => (
                <Link
                  key={store.id}
                  to={`/s/${store.slug}`}
                  className="bg-slate-900/60 backdrop-blur border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-950/10 flex flex-col justify-between h-56 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {store.logo_url ? (
                        <img 
                          src={store.logo_url} 
                          alt={store.name} 
                          className="h-9 w-24 object-contain rounded bg-white p-1 border border-slate-800" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-slate-850 border border-slate-800 flex items-center justify-center font-black text-xs text-amber-500">
                          {store.name ? store.name.substring(0, 2).toUpperCase() : "MA"}
                        </div>
                      )}
                      
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        {store.sub_sector === "vehicle" ? "🚗 Vasıta" : store.sub_sector === "real_estate" ? "🏠 Emlak" : "🛍️ Ticaret"}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-sm tracking-tight mb-1 group-hover:text-amber-500 transition-colors line-clamp-1">
                      {store.name}
                    </h3>

                    {store.enrakipsiz_featured_title ? (
                      <p className="text-xs text-amber-400 font-bold leading-tight mb-2 italic">
                        "{store.enrakipsiz_featured_title}"
                      </p>
                    ) : null}

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                      {store.description || `${store.name} seçkin portföyü ve özel fırsatları ile hizmetinizdedir.`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-850 mt-4">
                    <span className="text-[10px] text-slate-500 font-mono">
                      @{store.slug}
                    </span>
                    <span className="text-xs font-black text-amber-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Portföyü İncele <MoveRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Premium Marka İşbirlikleri & Sponsorlu Alanlar */}
        <section key="sponsors" className="mt-16 mb-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-rose-500 animate-bounce" />
              <h2 className="text-xs uppercase font-black tracking-widest text-slate-350">
                Premium Marka İşbirlikleri & Sponsorlu Alanlar
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-3 py-1 rounded-md border border-slate-855">
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
                  className={`bg-gradient-to-br ${ad.color} border border-slate-800 hover:border-slate-700/80 rounded-3xl p-6 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-955/5 flex flex-col justify-between group cursor-pointer relative overflow-hidden`}
                >
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-500/5 rounded-full filter blur-xl group-hover:bg-rose-500/10 transition-colors" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {ad.broker}
                      </span>
                      <span className="text-[9px] font-black text-rose-450 tracking-wider">
                        SPONSORLU
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-base leading-snug mb-2 group-hover:text-amber-500 transition-colors">
                      {ad.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      {ad.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg bg-slate-950 border ${ad.borderColor}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black text-white">{ad.profitBadge}</span>
                    </div>

                    <span className="text-[11px] font-black text-rose-450 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      {ad.actionText} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bölgesel Canlı Radar Feed (enrakipsiz.com) */}
        {portalNews && portalNews.length > 0 && (
          <section className="mb-14">
            <RadarShowcaseSlider radarNews={portalNews} lang="tr" theme="dark" />
          </section>
        )}
      </main>

      {/* Listing Detail Modal Block */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]">
            
            {/* Left Image Screen */}
            <div className="w-full md:w-1/2 min-h-[350px] md:min-h-0 bg-slate-950 relative border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
              
              {/* Main Image Holder */}
              <div className="flex-1 relative w-full min-h-[260px] md:h-0 group overflow-hidden flex items-center justify-center bg-slate-950">
                {activeImage ? (
                  <img 
                    src={activeImage} 
                    alt={selectedListing.title} 
                    className="w-full h-full object-cover cursor-zoom-in transition-all duration-500 hover:scale-[1.04]" 
                    referrerPolicy="no-referrer"
                    onClick={() => setZoomedImage(activeImage)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950 min-h-[220px]">
                    <Package className="w-16 h-16 opacity-30 text-rose-500" />
                    <span className="text-xs font-bold tracking-widest text-slate-600 mt-2">Detay Görseli Bulunmuyor</span>
                  </div>
                )}

                {/* Subtle visual count badge at top left - does not dim the photo */}
                {activeImage && (
                  <div className="absolute left-3.5 top-3.5 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 text-[10px] font-black text-rose-400 tracking-wider uppercase select-none shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {activeDetailImageIndex + 1} / {modalImages.length}
                  </div>
                )}

                {/* Explicit Expand button (another way to expand) */}
                {activeImage && (
                  <button
                    onClick={() => setZoomedImage(activeImage)}
                    className="absolute right-3.5 top-3.5 z-10 p-2 text-white bg-slate-900/90 hover:bg-rose-600 rounded-xl border border-slate-800 hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase group/btn"
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-slate-900/80 border border-slate-800 text-white flex items-center justify-center hover:bg-rose-500 hover:border-rose-500 transition-all shadow-md active:scale-90"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDetailImageIndex((prev) => (prev + 1) % modalImages.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-slate-900/80 border border-slate-800 text-white flex items-center justify-center hover:bg-rose-500 hover:border-rose-500 transition-all shadow-md active:scale-90"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Thumbnail area for multiple images */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-850">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-rose-500" />
                    Portföy Fotoğrafları
                  </span>
                  {modalImages.length > 0 && (
                    <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
                      {activeDetailImageIndex + 1} / {modalImages.length}
                    </span>
                  )}
                </div>

                {modalImages.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
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
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedListing(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-950/60 hover:bg-rose-600 rounded-full border border-slate-800 hover:border-rose-600 transition z-20"
              >
                ✕
              </button>

              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 inline-block">
                  {selectedListing.listing_type === 'vehicle' ? 'Vasıta' : selectedListing.listing_type === 'real_estate' ? 'Gayrimenkul' : 'Mağaza Ürünü'}
                </span>
                <h2 className="text-2xl font-black text-white mt-3 leading-tight mb-2 tracking-tight">
                  {selectedListing.title}
                </h2>
                <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {selectedListing.store_name} Mağazası Güvencesiyle
                </p>
              </div>

              {/* Price Banner */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 my-2">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">Satış/Talep Bedeli</span>
                <span className="text-2xl font-black text-emerald-400">
                  {Math.round(Number(selectedListing.price) || 0).toLocaleString('tr-TR')} <span className="text-rose-500 font-extrabold text-sm">{selectedListing.currency || 'TRY'}</span>
                </span>
              </div>

              {/* Technical features & parameters summary */}
              <div className="border-t border-b border-slate-800/80 py-4 my-2 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-bold text-[10px] uppercase tracking-wider mb-0.5">Marka/Lokasyon</span>
                  <span className="font-extrabold text-white text-sm">{selectedListing.brand || 'Belirtilmedi'}</span>
                </div>
                {selectedListing.listing_type === 'vehicle' && (
                  <div>
                    <span className="text-slate-500 block font-bold text-[10px] uppercase tracking-wider mb-0.5">Kilometre/Mil</span>
                    <span className="font-extrabold text-white text-sm">
                      {selectedListing.mileage ? `${Math.round(Number(selectedListing.mileage) || 0).toLocaleString('tr-TR')} KM` : 'Yeni Araç'}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block font-bold text-[10px] uppercase tracking-wider mb-0.5">Kategori</span>
                  <span className="font-extrabold text-white text-sm">{selectedListing.category || 'Vasıta & Emlak'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-bold text-[10px] uppercase tracking-wider mb-0.5">Referans ID</span>
                  <span className="font-mono text-rose-500 text-xs font-bold">#{selectedListing.id}</span>
                </div>
              </div>

              {/* Portfolio Description Area */}
              {selectedListing.description && (
                <div className="my-4 border-b border-slate-800/85 pb-6">
                  <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-3">
                    PORTFÖY AÇIKLAMASI
                  </h4>
                  <div 
                    className="text-slate-300 leading-relaxed text-xs font-normal space-y-2 bg-slate-950/45 p-4 rounded-xl border border-slate-850 max-h-[170px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: cleanHtmlText(selectedListing.description) }}
                  />
                </div>
              )}

              {/* Technical Data Sheets / SectorSpecs */}
              {selectedListing.sector_data && (
                <div className="my-2 select-none">
                  <SectorSpecs
                    sector={selectedListing.listing_type === 'vehicle' ? 'automotive' : selectedListing.listing_type === 'real_estate' ? 'real_estate' : 'general'}
                    data={selectedListing.sector_data}
                    category={selectedListing.category}
                    name={selectedListing.title}
                    description={selectedListing.description}
                  />
                </div>
              )}

              {/* Action Sheet */}
              <div className="mt-auto space-y-2 pt-6 border-t border-slate-800">
                <Link 
                  to={`${window.location.hostname.includes("enrakipsiz") ? "/s" : "/store"}/${selectedListing.store_slug}/p/${selectedListing.barcode || selectedListing.id}`} 
                  target="_blank"
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 hover:scale-[1.01] active:scale-[0.99] hover:shadow-xl hover:shadow-rose-950/35 text-white text-center rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2"
                >
                  Detayları İncele
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => {
                    const refMsg = selectedListing.id ? `(Portföy No: ${selectedListing.id}) ` : '';
                    const rawPhone = selectedListing.store_whatsapp || selectedListing.store_phone || "905330000000";
                    const cleanPhone = rawPhone.replace(/\D/g, "");
                    const targetPhone = cleanPhone.startsWith("90") ? cleanPhone : cleanPhone.startsWith("0") ? "90" + cleanPhone.substring(1) : "90" + cleanPhone;
                    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(`Merhaba, enrakipsiz.com üzerindeki ${refMsg}${selectedListing.title} ilanınız ile ilgileniyorum.`)}`, '_blank');
                  }}
                  className="w-full py-3.5 bg-slate-950 border border-slate-850 hover:bg-slate-850 hover:border-slate-700 text-emerald-400 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  Portföy Danışmanına WhatsApp'tan Sor
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Zoomed Image Lightbox */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-4 bg-slate-950/98 backdrop-blur-3xl transition-all duration-300"
          onClick={() => setZoomedImage(null)}
        >
          {/* Top Panel Actions */}
          <div className="w-full flex items-center justify-between z-10 max-w-7xl mx-auto px-4 py-2 mt-2" onClick={(e) => e.stopPropagation()}>
            {/* Index Counter */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl text-xs font-extrabold text-rose-400 shadow-xl flex items-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              {activeDetailImageIndex + 1} / {modalImages.length}
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setZoomedImage(null)}
              className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-rose-600 hover:border-rose-500 hover:scale-105 transition-all duration-300 shadow-xl text-xs font-black active:scale-95 flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-rose-500" />
              <span>Görseli Kapat</span>
            </button>
          </div>

          {/* Main Visual Arena with Side Navigation Controls */}
          <div className="relative flex-1 w-full flex items-center justify-center max-w-7xl mx-auto my-4" onClick={(e) => e.stopPropagation()}>
            
            {/* Prev Image Floating Trigger Button */}
            {modalImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDetailImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
                }}
                className="absolute left-2 md:left-6 z-20 w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center border border-slate-800 hover:border-rose-500 transition-all shadow-2xl active:scale-95"
                title="Önceki Fotoğraf"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            )}

            {/* High-definition Image Canvas */}
            <div 
              className="relative max-w-4xl max-h-[65vh] md:max-h-[70vh] overflow-hidden rounded-3xl border border-slate-800 shadow-2xl bg-slate-950 flex items-center justify-center transition-all duration-300"
              onClick={() => setZoomedImage(null)} 
              title="Kapatmak için tıklayın"
            >
              <img 
                src={activeImage || zoomedImage} 
                alt="Yüksek Çözünürlüklü İlan Detayı" 
                className="w-full h-full max-h-[65vh] md:max-h-[70vh] object-contain select-none cursor-zoom-out hover:scale-[1.01] transition-transform duration-300" 
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Next Image Floating Trigger Button */}
            {modalImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDetailImageIndex((prev) => (prev + 1) % modalImages.length);
                }}
                className="absolute right-2 md:right-6 z-20 w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-900/90 hover:bg-rose-600 text-slate-300 hover:text-white flex items-center justify-center border border-slate-800 hover:border-rose-500 transition-all shadow-2xl active:scale-95"
                title="Sonraki Fotoğraf"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            )}

          </div>

          {/* Interactive Bottom Miniatures Bar */}
          <div className="w-full flex flex-col items-center gap-3 pb-4 z-10" onClick={(e) => e.stopPropagation()}>
            {modalImages.length > 1 && (
              <div className="flex gap-2.5 max-w-[90vw] md:max-w-xl overflow-x-auto pb-2 pt-1 px-4 bg-slate-900/80 backdrop-blur-xl border border-slate-850 rounded-2xl shadow-2xl scrollbar-thin scrollbar-thumb-rose-500/30 scrollbar-track-transparent">
                {modalImages.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDetailImageIndex(i)}
                    className={`relative w-11 h-11 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 ${
                      activeDetailImageIndex === i 
                        ? 'border-rose-500 scale-105 shadow-lg shadow-rose-950/50 opacity-100' 
                        : 'border-slate-800 opacity-50 hover:opacity-100 hover:border-slate-600'
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Zoom Thumbnail ${i + 1}`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="text-slate-500 text-[10px] md:text-xs font-semibold select-none text-center">
              Görselin üzerine veya dışına tıklayarak kapatabilirsiniz. Klavye yön tuşlarını (&larr; &rarr;) kullanabilirsiniz.
            </p>
          </div>
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
            <a href="https://lookprice.net/login" className="hover:text-rose-400 transition">Mağaza Paneli</a>
            <a href="https://lookprice.net/register" className="hover:text-rose-400 transition">Mağaza Oluştur</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
