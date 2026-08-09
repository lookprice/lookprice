import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Map,
  Layout,
  ArrowRight,
  Check,
  SlidersHorizontal,
  Users,
  MapPin,
  X,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Grid,
  List,
} from "lucide-react";
import { Store, Product } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "./RadarShowcaseSlider";
import { BlogShowcaseModal } from "./BlogShowcaseModal";
import { ListingFinancingCalculator } from "./ListingFinancingCalculator";
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from "../data/realEstateConfig";

import { StoreMapSection } from "./StoreMapSection";
import { IDXSplitMapView } from "./IDXSplitMapView";

interface ModernRealEstateLayoutProps {
  store: Store;
  products: Product[];
  radarNews?: any[];
  onViewProduct: (product: Product) => void;
}

export const ModernRealEstateLayout: React.FC<ModernRealEstateLayoutProps> = ({
  store,
  products,
  radarNews = [],
  onViewProduct,
}) => {
  const { lang } = useLanguage();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState<any>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Financing Calculator States
  const [finPropertyPrice, setFinPropertyPrice] = useState<number>(5000000);
  const [finDownPaymentPercent, setFinDownPaymentPercent] = useState<number>(30);
  const [finDurationMonths, setFinDurationMonths] = useState<number>(120);
  const [finInterestRate, setFinInterestRate] = useState<number>(1.89);
  const [finCurrency, setFinCurrency] = useState<string>("GBP");
  const [selectedBank, setSelectedBank] = useState<string>("Creditwest Bank");
  const [isFinancingApplied, setIsFinancingApplied] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [applyName, setApplyName] = useState<string>("");
  const [applyPhone, setApplyPhone] = useState<string>("");
  const [applyEmail, setApplyEmail] = useState<string>("");
  const [applySuccess, setApplySuccess] = useState<boolean>(false);

  // Property Submission / Sell-Rent Modal States
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellOwnerName, setSellOwnerName] = useState("");
  const [sellPhone, setSellPhone] = useState("");
  const [sellEmail, setSellEmail] = useState("");
  const [sellRegion, setSellRegion] = useState("Girne");
  const [sellPropType, setSellPropType] = useState("Daire");
  const [sellExpectedPrice, setSellExpectedPrice] = useState("");
  const [sellNotes, setSellNotes] = useState("");
  const [sellSubmitting, setSellSubmitting] = useState(false);
  const [sellSuccess, setSellSuccess] = useState(false);

  const handlePropertySubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellOwnerName || !sellPhone) {
      alert("Lütfen adınızı ve telefon numaranızı giriniz.");
      return;
    }
    setSellSubmitting(true);
    try {
      await fetch('/api/public/property-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug: store.slug,
          ownerName: sellOwnerName,
          ownerPhone: sellPhone,
          ownerEmail: sellEmail,
          propertyType: sellPropType,
          location: sellRegion,
          expectedPrice: sellExpectedPrice,
          notes: sellNotes
        })
      });
      setSellSuccess(true);
    } catch (err) {
      alert("İşlem sırasında bir hata oluştu.");
    } finally {
      setSellSubmitting(false);
    }
  };

  // Sync interest rate from store.financing_settings dynamically by active currency (e.g., TRY, GBP, EUR, USD)
  useEffect(() => {
    if (selectedBank === "📢 [REKLAM ALANI] - Kiralık Sponsor Alanı") return;
    const currentFinSettings = store?.financing_settings || {};
    const baseRatesObj = currentFinSettings.base_rates || {};
    const partnerRatesObj = currentFinSettings.partner_rates || {};
    const promoActive = currentFinSettings.partner_promo_active === true;

    // Default rates fallback by currency
    const DEFAULT_BASE_RATES: Record<string, Record<string, number>> = {
      TRY: { "Creditwest Bank": 3.49, "Kıbrıs İktisat Bankası": 3.65, "Limasol Sosyal Kooperatif": 3.89, "Ziraat Bankası KKTC": 3.79 },
      GBP: { "Creditwest Bank": 0.55, "Kıbrıs İktisat Bankası": 0.60, "Limasol Sosyal Kooperatif": 0.65, "Ziraat Bankası KKTC": 0.58 },
      EUR: { "Creditwest Bank": 0.49, "Kıbrıs İktisat Bankası": 0.52, "Limasol Sosyal Kooperatif": 0.58, "Ziraat Bankası KKTC": 0.50 },
      USD: { "Creditwest Bank": 0.52, "Kıbrıs İktisat Bankası": 0.55, "Limasol Sosyal Kooperatif": 0.60, "Ziraat Bankası KKTC": 0.54 }
    };

    // Get rates object for the active currency
    let currencyBase: Record<string, number> = {};
    if (baseRatesObj["Creditwest Bank"] !== undefined) {
      // Legacy flat base rates, treat as TRY
      currencyBase = finCurrency === "TRY" 
        ? {
            "Creditwest Bank": Number(baseRatesObj["Creditwest Bank"] || 1.89),
            "Kıbrıs İktisat Bankası": Number(baseRatesObj["Kıbrıs İktisat Bankası"] || 2.05),
            "Limasol Sosyal Kooperatif": Number(baseRatesObj["Limasol Sosyal Kooperatif"] || 2.19),
            "Ziraat Bankası KKTC": Number(baseRatesObj["Ziraat Bankası KKTC"] || 1.99)
          }
        : DEFAULT_BASE_RATES[finCurrency] || DEFAULT_BASE_RATES.GBP;
    } else {
      currencyBase = baseRatesObj[finCurrency] || DEFAULT_BASE_RATES[finCurrency] || DEFAULT_BASE_RATES.GBP;
    }

    let currencyPartner: Record<string, any> = {};
    if (partnerRatesObj["Creditwest Bank"] !== undefined) {
      // Legacy flat partner rates, treat as TRY
      currencyPartner = finCurrency === "TRY" ? { ...partnerRatesObj } : {};
    } else {
      currencyPartner = partnerRatesObj[finCurrency] || {};
    }

    const baseVal = currencyBase[selectedBank] !== undefined ? parseFloat(String(currencyBase[selectedBank])) : (DEFAULT_BASE_RATES[finCurrency]?.[selectedBank] || 0.55);
    const partnerVal = currencyPartner[selectedBank] !== undefined && currencyPartner[selectedBank] !== "" ? parseFloat(String(currencyPartner[selectedBank])) : null;

    const rate = (promoActive && partnerVal !== null && !isNaN(partnerVal)) ? partnerVal : baseVal;

    if (!isNaN(rate)) {
      setFinInterestRate(rate);
    }
  }, [store?.financing_settings, selectedBank, finCurrency]);

  // Active filters states
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [activeLocation, setActiveLocation] = useState<string>("all");
  const [activeSubRegion, setActiveSubRegion] = useState<string>("all");
  const [activeType, setActiveType] = useState<string>("all");
  const [activeSubType, setActiveSubType] = useState<string>("all");
  const [activeBudget, setActiveBudget] = useState<string>("all");
  const [activeRooms, setActiveRooms] = useState<string>("all");
  const [activeTrafoBedeli, setActiveTrafoBedeli] = useState<string>("all");
  const [activeKdvStatus, setActiveKdvStatus] = useState<string>("all");
  const [activeCatiTerasi, setActiveCatiTerasi] = useState<string>("all");
  const [activeFurnished, setActiveFurnished] = useState<string>("all");
  const [activeBillingPeriod, setActiveBillingPeriod] = useState<string>("all");

  // Pending filter states
  const [pendingLocation, setPendingLocation] = useState<string>("all");
  const [pendingSubRegion, setPendingSubRegion] = useState<string>("all");
  const [pendingType, setPendingType] = useState<string>("all");
  const [pendingSubType, setPendingSubType] = useState<string>("all");
  const [pendingBudget, setPendingBudget] = useState<string>("all");
  const [pendingRooms, setPendingRooms] = useState<string>("all");
  const [pendingTrafoBedeli, setPendingTrafoBedeli] = useState<string>("all");
  const [pendingKdvStatus, setPendingKdvStatus] = useState<string>("all");
  const [pendingCatiTerasi, setPendingCatiTerasi] = useState<string>("all");
  const [pendingFurnished, setPendingFurnished] = useState<string>("all");
  const [pendingBillingPeriod, setPendingBillingPeriod] = useState<string>("all");

  // Custom UI & Experience states
  const [viewedStories, setViewedStories] = useState<(string | number)[]>([]);
  const [sortBy, setSortBy] = useState<string>("default");
  const [viewType, setViewType] = useState<"grid" | "list">("grid");

  const clearAllFilters = () => {
    setPendingLocation("all");
    setPendingSubRegion("all");
    setPendingType("all");
    setPendingSubType("all");
    setPendingBudget("all");
    setPendingRooms("all");
    setPendingTrafoBedeli("all");
    setPendingKdvStatus("all");
    setPendingCatiTerasi("all");
    setPendingFurnished("all");
    setPendingBillingPeriod("all");
    
    setActiveLocation("all");
    setActiveSubRegion("all");
    setActiveType("all");
    setActiveSubType("all");
    setActiveBudget("all");
    setActiveRooms("all");
    setActiveTrafoBedeli("all");
    setActiveKdvStatus("all");
    setActiveCatiTerasi("all");
    setActiveFurnished("all");
    setActiveBillingPeriod("all");
    setListingTypeFilter("all");
  };

  // Filter options derived from product list
  const locations = React.useMemo(() => {
    const locs = products.map(p => {
      return p.sector_data?.district || p.sector_data?.city || (p as any).location;
    }).filter(Boolean);
    return Array.from(new Set(locs));
  }, [products]);

  const types = React.useMemo(() => {
    const tps = products.map(p => p.category).filter(Boolean);
    return Array.from(new Set(tps));
  }, [products]);

  const roomsOptions = React.useMemo(() => {
    const rms = products.map(p => p.sector_data?.rooms?.toString()).filter(Boolean);
    return Array.from(new Set(rms)).sort();
  }, [products]);

  // Budget ranges are strictly in GBP (£) as per real estate market standards
  const budgetSpecs = React.useMemo(() => {
    return {
      isLira: false,
      ranges: [
        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
        { value: "0-150000", label: lang === "tr" ? "150.000 GBP Altı" : "Under £150k" },
        { value: "150000-300000", label: "£150k - £300k" },
        { value: "300000-500000", label: "£300k - £500k" },
        { value: "500000-1000000", label: "£500k - £1M" },
        { value: "1000000+", label: lang === "tr" ? "1M GBP Üstü" : "Over £1M" },
      ]
    };
  }, [lang]);

  // Filter implementation
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      // 1. Location match
      if (activeLocation !== "all") {
        const pLoc = p.sector_data?.kktc_region || p.sector_data?.city || p.location || "";
        if (pLoc.toLowerCase() !== activeLocation.toLowerCase()) {
          return false;
        }
      }
      // SubRegion match
      if (activeSubRegion !== "all") {
          const pSubLoc = p.sector_data?.kktc_sub_region || p.sector_data?.district || "";
          if (pSubLoc.toLowerCase() !== activeSubRegion.toLowerCase()) {
            return false;
          }
      }
      
      // 2. Type match
      if (activeType !== "all") {
        if (p.category !== activeType) {
          return false;
        }
      }
      // SubType match
      if (activeSubType !== "all") {
          const pSub = p.sector_data?.subtype || (p.sector_data as any)?.subtype || "";
          if (pSub !== activeSubType) {
              return false;
          }
      }
      
      // 3. Rooms match
      if (activeRooms !== "all") {
        const pRooms = p.sector_data?.rooms?.toString() || "";
        if (pRooms !== activeRooms) {
          return false;
        }
      }
      // 4. Budget match
      if (activeBudget !== "all") {
        const price = p.price;
        if (activeBudget.endsWith("+")) {
          const limit = Number(activeBudget.replace("+", ""));
          if (price < limit) return false;
        } else {
          const [min, max] = activeBudget.split("-").map(Number);
          if (price < min || price > max) return false;
        }
      }

      // 5. Trafo Bedeli match (only if not rent filter)
      if (listingTypeFilter !== 'rent' && activeTrafoBedeli !== "all") {
        const isPaid = p.sector_data?.trafo_bedeli === true;
        const targetPaid = activeTrafoBedeli === "paid";
        if (isPaid !== targetPaid) return false;
      }

      // 6. KDV Status match (only if not rent filter)
      if (listingTypeFilter !== 'rent' && activeKdvStatus !== "all") {
        const status = p.sector_data?.kdv_status || "to_be_paid";
        if (status !== activeKdvStatus) return false;
      }

      // 7. Cati Terasi match
      if (activeCatiTerasi !== "all") {
        const hasTerrace = p.sector_data?.cati_terasi === true;
        const targetTerrace = activeCatiTerasi === "yes";
        if (hasTerrace !== targetTerrace) return false;
      }

      // 8. Rental Specific - Furnished match
      if (listingTypeFilter === 'rent' && activeFurnished !== "all") {
        const isFurnished = p.sector_data?.furnished === true;
        const targetFurnished = activeFurnished === "furnished";
        if (isFurnished !== targetFurnished) return false;
      }

      // 9. Rental Specific - Billing Period match
      if (listingTypeFilter === 'rent' && activeBillingPeriod !== "all") {
        const period = p.sector_data?.billing_period || "monthly";
        if (period !== activeBillingPeriod) return false;
      }

      return true;
    });
  }, [products, activeLocation, activeSubRegion, activeType, activeSubType, activeRooms, activeBudget, activeTrafoBedeli, activeKdvStatus, activeCatiTerasi, activeFurnished, activeBillingPeriod, listingTypeFilter]);

  const handleSearchTrigger = () => {
    setActiveLocation(pendingLocation);
    setActiveSubRegion(pendingSubRegion);
    setActiveType(pendingType);
    setActiveSubType(pendingSubType);
    setActiveBudget(pendingBudget);
    setActiveRooms(pendingRooms);
    setActiveTrafoBedeli(pendingTrafoBedeli);
    setActiveKdvStatus(pendingKdvStatus);
    setActiveCatiTerasi(pendingCatiTerasi);
    setActiveFurnished(pendingFurnished);
    setActiveBillingPeriod(pendingBillingPeriod);
    
    setTimeout(() => {
      const el = document.getElementById("listings-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  useEffect(() => {
    if (store.slug) {
      api
        .getPublicBlogPosts(store.slug)
        .then((res) => {
          if (Array.isArray(res)) {
            setBlogs(res.slice(0, 3));
          }
        })
        .catch(console.error);
    }
  }, [store.slug]);

  const teamSource = 
    (store as any).page_layout_settings?.team && Array.isArray((store as any).page_layout_settings.team) && (store as any).page_layout_settings.team.length > 0
      ? (store as any).page_layout_settings.team
      : (store as any).branding?.team && Array.isArray((store as any).branding.team) && (store as any).branding.team.length > 0
        ? (store as any).branding.team
        : (store as any).team && Array.isArray((store as any).team) && (store as any).team.length > 0
          ? (store as any).team
          : (store as any).agents && Array.isArray((store as any).agents) && (store as any).agents.length > 0
            ? (store as any).agents
            : store.consultants && store.consultants.length > 0
              ? store.consultants
              : [];

  const team = teamSource.length > 0
    ? teamSource.map((c: any, idx: number) => {
        const rawImg = c.image || c.image_url || c.photo_url || c.avatar_url || c.photo || c.avatar || c.picture;
        const validImg = typeof rawImg === 'string' && rawImg.trim().length > 0
          ? rawImg
          : "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400";
        return {
          id: c.id?.toString() || `member_${idx}`,
          name: c.name || c.full_name || "Danışman",
          role: c.role || c.title || "Broker / Danışman",
          image: validImg,
        };
      })
    : [
    {
      id: "1",
      name: store.name || "Broker",
      role: "Broker / Manager",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
    },
  ];

  const getContrastColor = (hex: string) => {
    if (!hex) return "#ffffff";
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length !== 6) return "#ffffff";
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? "#090d16" : "#ffffff";
  };

  const pageLayoutSettings = (store as any).page_layout_settings || {};
  const primaryColor = pageLayoutSettings.primary_color || "#0F172A";
  const accentColor = pageLayoutSettings.accent_color || "#4f46e5";
  const bgColor = pageLayoutSettings.bg_color || "#ffffff";

  const webContent = pageLayoutSettings.web_content;
  const content = {
    hero: {
      title: webContent?.hero?.title || store.name?.toUpperCase() || (lang === "tr" ? "YENİ NESİL PORTFÖY" : "NEW GENERATION PORTFOLIO"),
      subtitle: webContent?.hero?.subtitle || store.description || (lang === "tr" ? "Yatırım hayallerinizi gerçeğe dönüştüren profesyonel çözümler." : "Professional solutions turning your investment dreams into reality."),
      bgImage: webContent?.hero?.bgImage || ((store as any).page_layout && typeof (store as any).page_layout === 'object' && !Array.isArray((store as any).page_layout) && ((store as any).page_layout as any).hero_image_url) || store.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000",
    },
    stats: [
      { value: "500+", label: lang === "tr" ? "Mutlu Müşteri" : "Happy Clients" },
      { value: products.length.toString(), label: lang === "tr" ? "Aktif İlan" : "Active Listings" },
      { value: "10+", label: lang === "tr" ? "Yıl Tecrübe" : "Years Experience" },
    ],
    trustSlogan: webContent?.trustSlogan || (store as any).slogan || (lang === "tr" ? "GÜVENLE YÖNETİYORUZ" : "MANAGED WITH TRUST"),
  };

  const layoutConfig = React.useMemo(() => {
    let layout = (store as any).page_layout_full || store.page_layout;
    if (!layout) return { sections: [], grid: 'standard', count: 6, banners: [] };
    if (typeof layout === "string") {
      try {
        layout = JSON.parse(layout);
      } catch (e) {
        return { sections: [], grid: 'standard', count: 6, banners: [] };
      }
    }
    
    if (Array.isArray(layout)) {
      return { sections: layout, grid: 'standard', count: 6, banners: [] };
    }
    
    const l = layout as any;
    return {
      sections: l.sections || [],
      grid: l.grid || 'standard',
      count: l.count || 6,
      banners: l.banners || [],
      quickLinks: l.quickLinks || [],
      corporateLinks: l.corporateLinks || []
    };
  }, [store.page_layout_full, store.page_layout]);

  const banners = React.useMemo(() => {
    const rawBanners = 
      (store as any).banners || 
      (store as any).branding?.banners || 
      layoutConfig.banners || 
      [];

    if (!Array.isArray(rawBanners) || rawBanners.length === 0) {
      return [{
        id: "fallback",
        image_url: content.hero.bgImage,
        title: content.hero.title,
        subtitle: content.hero.subtitle,
        text_position: 'center',
        show_store_name: true,
      }];
    }

    return rawBanners.map((b: any, i: number) => {
      if (typeof b === 'string') {
        return {
          id: `banner_${i}`,
          image_url: b,
          title: content.hero.title,
          subtitle: content.hero.subtitle,
          text_position: 'center',
          show_store_name: true,
        };
      }
      return {
        id: b.id || `banner_${i}`,
        image_url: b.image_url || b.url || (typeof b === 'string' ? b : content.hero.bgImage),
        title: b.title || content.hero.title,
        subtitle: b.subtitle || content.hero.subtitle,
        text_position: b.text_position || 'center',
        show_store_name: b.show_store_name !== false,
        button_text: b.button_text,
        button_link: b.button_link,
      };
    });
  }, [(store as any).banners, (store as any).branding?.banners, layoutConfig.banners, content.hero]);

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    if (banners && banners.length > 1) {
      const interval = setInterval(() => {
        setActiveBannerIndex((prev) => (prev + 1) % banners.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  const isSectionEnabled = (sectionId: string) => {
    if (!layoutConfig.sections || !Array.isArray(layoutConfig.sections) || layoutConfig.sections.length === 0) return true;
    // Flexible matching for news/radar/financing/calculator section IDs
    const section = layoutConfig.sections.find((s: any) => 
      s.id === sectionId || 
      s.type === sectionId ||
      (sectionId === 'news' && (s.id === 'radar' || s.id === 'radarNews' || s.id === 'radar_news' || s.type === 'radar' || s.type === 'radarNews' || s.type === 'radar_news')) ||
      (sectionId === 'radar' && (s.id === 'news' || s.type === 'news')) ||
      (sectionId === 'financing' && (s.id === 'calculator' || s.type === 'calculator')) ||
      (sectionId === 'calculator' && (s.id === 'financing' || s.type === 'financing'))
    );
    if (section === undefined) return true; // Default to true if not found in custom configuration layout list
    return section.enabled !== false && section.enabled !== "false";
  };
  const [visibleCount, setVisibleCount] = useState(layoutConfig.count || 21);

  useEffect(() => {
    setVisibleCount(layoutConfig.count || 21);
  }, [layoutConfig.count]);

  const displayedProducts = React.useMemo(() => {
    let result = filteredProducts.filter(p => {
      // Determine if property is for rent or sale
      const isRentalIntent = p.sector_data?.listing_intent === 'rent' || 
                            p.category?.toLowerCase().includes('kira') || 
                            p.category?.toLowerCase().includes('rent');
      
      const isSaleIntent = p.sector_data?.listing_intent === 'sale' || 
                          p.category?.toLowerCase().includes('satı') || 
                          p.category?.toLowerCase().includes('sale');

      // Visibility filter: Generally show active ones. 
      // If we want to show sold/rented as "Archive" or "Recently Done", we'd handle it differently.
      // But based on user request, they want active "Kiralık" (For Rent) to be visible.
      const isActuallyRented = p.status === 'rented' || (p as any).status === 'rented';
      const isActuallySold = p.status === 'sold' || (p as any).status === 'sold';

      if (listingTypeFilter === 'all') {
        // If "All" is selected, we usually show everything that isn't finalized, 
        // or we show everything with badges.
        return true;
      }

      if (listingTypeFilter === 'sale') {
        // Show active sale listings. 
        // If status is 'sold', we might want to hide it if user says "tam tersi" (meaning only show available)
        return isSaleIntent && !isActuallySold;
      }

      if (listingTypeFilter === 'rent') {
        // Show active rent listings.
        // User says "kiralandı" (rented) should be off, "kiralık" (for rent) should be on.
        return isRentalIntent && !isActuallyRented;
      }

      return true;
    });

    // Apply Advanced Sorting
    if (sortBy === "price_desc") {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "price_asc") {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "date_desc") {
      result.sort((a, b) => {
        const valA = new Date(a.created_at || (a as any).createdAt || 0).getTime() || Number(a.id) || 0;
        const valB = new Date(b.created_at || (b as any).createdAt || 0).getTime() || Number(b.id) || 0;
        return valB - valA;
      });
    } else if (sortBy === "date_asc") {
      result.sort((a, b) => {
        const valA = new Date(a.created_at || (a as any).createdAt || 0).getTime() || Number(a.id) || 0;
        const valB = new Date(b.created_at || (b as any).createdAt || 0).getTime() || Number(b.id) || 0;
        return valA - valB;
      });
    }

    return result;
  }, [filteredProducts, listingTypeFilter, sortBy]);

  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [activeContentMap, setActiveContentMap] = useState<{title: string, content: string}|null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);
  const [isFastAccessOpen, setIsFastAccessOpen] = useState(false);
  const [isCorporateOpen, setIsCorporateOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent, link: any) => {
    if (link.type === 'content' && link.content) {
      e.preventDefault();
      setActiveContentMap({ title: link.label, content: link.content });
      setIsContentModalOpen(true);
    }
  };

  // Convert/format prices correctly
  const formatPrice = (value: number, curr?: string) => {
    const symbol = curr === "EUR" ? "€" : curr === "USD" ? "$" : curr === "TRY" ? "₺" : "£";
    return `${symbol}${Math.round(value).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="flex-1 bg-white overflow-hidden min-h-screen relative w-full font-sans store-theme-scoped">
      <style dangerouslySetInnerHTML={{ __html: `
        .store-theme-scoped {
          --store-primary: ${primaryColor};
          --store-accent: ${accentColor};
          --store-bg: ${bgColor};
          --store-text-on-accent: ${getContrastColor(accentColor)};
          --store-text-on-primary: ${getContrastColor(primaryColor)};
        }
        
        .store-theme-scoped {
          background-color: var(--store-bg) !important;
        }
        
        .store-theme-scoped .bg-indigo-600, 
        .store-theme-scoped .bg-indigo-700, 
        .store-theme-scoped .bg-amber-500, 
        .store-theme-scoped .bg-amber-600,
        .store-theme-scoped .bg-indigo-600\\/90,
        .store-theme-scoped .bg-amber-500\\/90 {
          background-color: var(--store-accent) !important;
          color: var(--store-text-on-accent) !important;
        }
        
        .store-theme-scoped .text-indigo-600, 
        .store-theme-scoped .text-indigo-500, 
        .store-theme-scoped .text-amber-500 {
          color: var(--store-accent) !important;
        }
        
        .store-theme-scoped .border-indigo-600, 
        .store-theme-scoped .border-indigo-500,
        .store-theme-scoped .border-amber-500 {
          border-color: var(--store-accent) !important;
        }
        
        .store-theme-scoped .bg-slate-950, 
        .store-theme-scoped .bg-slate-900, 
        .store-theme-scoped .bg-slate-900\\/95, 
        .store-theme-scoped .bg-slate-950\\/95 {
          background-color: var(--store-primary) !important;
          color: var(--store-text-on-primary) !important;
        }
        
        .store-theme-scoped .text-slate-900, 
        .store-theme-scoped .text-slate-850,
        .store-theme-scoped .text-slate-800,
        .store-theme-scoped h1,
        .store-theme-scoped h2,
        .store-theme-scoped h3 {
          color: var(--store-primary) !important;
        }
      ` }} />
      {/* Top Navbar */}
      <div className="sticky top-0 left-0 w-full z-50 bg-slate-950/95 backdrop-blur-md text-white flex items-center justify-between px-4 sm:px-8 py-1 md:py-1.5 border-b border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3">
          {store.logo_url ? (
            <img src={store.logo_url} className="h-28 md:h-36 max-w-[320px] md:max-w-[400px] object-contain drop-shadow -my-8 md:-my-10" alt={store.name} />
          ) : (
            <div className="h-10 w-10 md:h-12 md:w-12 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <Layout className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
            </div>
          )}
          {!store.logo_url && <span className="text-white font-black uppercase tracking-widest text-sm md:text-base drop-shadow-md">{store.name}</span>}
        </div>
        <div className="hidden md:flex items-center gap-6">
          {layoutConfig.quickLinks && layoutConfig.quickLinks.length > 0 ? (
            layoutConfig.quickLinks.slice(0, 4).map((link: any, idx: number) => (
              <a 
                key={idx} 
                href={link.url || '#'} 
                onClick={(e) => handleLinkClick(e, link)}
                className="text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white cursor-pointer transition-colors shadow-sm"
              >
                {link.label}
              </a>
            ))
          ) : (
            <>
              <a href="#portfolio" className="text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white cursor-pointer transition-colors shadow-sm">{lang === 'tr' ? 'PORTFÖY' : 'PORTFOLIO'}</a>
            </>
          )}
          <button 
            onClick={() => { setIsSellModalOpen(true); setSellSuccess(false); }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-[10px] uppercase tracking-wider shadow-lg transition-all flex items-center gap-1 active:scale-95"
          >
            🏠 {lang === 'tr' ? 'MÜLKÜNÜ SAT / KİRALA' : 'SELL PROPERTY'}
          </button>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer ml-2">MENU</div>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <button 
            onClick={() => { setIsSellModalOpen(true); setSellSuccess(false); }}
            className="bg-amber-500 text-slate-950 font-black px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-tight shadow flex items-center gap-1 active:scale-95"
          >
            🏠 {lang === 'tr' ? 'MÜLKÜNÜ SAT / KİRALA' : 'SELL / RENT'}
          </button>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer">MENU</div>
        </div>
      </div>

      {/* Mülkünü Sat / Kirala Modal */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 relative">
            <div className="bg-slate-900 p-6 text-white relative">
              <button 
                onClick={() => setIsSellModalOpen(false)}
                className="absolute top-5 right-5 h-8 w-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mb-2 border border-amber-500/30">
                🏡 MÜLK SAHİBİ BAŞVURU FORMU
              </div>
              <h3 className="text-xl font-black tracking-tight text-white">Mülkünüzü Ücretsiz Değerlendirelim</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Mülkünüzü profesyonel pazarlama ağımıza ekleyelim, doğru alıcı ve kiracılarla en hızlı şekilde buluşturalım.
              </p>
            </div>

            <div className="p-6">
              {sellSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">Talebiniz Alındı!</h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Gayrimenkul uzmanımız mülkünüzün analizi ve ekspertiz süreci için en kısa sürede sizinle iletişime geçecektir.
                  </p>
                  <button 
                    onClick={() => setIsSellModalOpen(false)}
                    className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl uppercase tracking-wider"
                  >
                    Kapat
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePropertySubmission} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Ad Soyad *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={sellOwnerName}
                      onChange={(e) => setSellOwnerName(e.target.value)}
                      placeholder="Örn: Ahmet Yılmaz"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Telefon / WhatsApp *
                      </label>
                      <input 
                        type="tel" 
                        required
                        value={sellPhone}
                        onChange={(e) => setSellPhone(e.target.value)}
                        placeholder="+90 533 ..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        E-Posta (İsteğe Bağlı)
                      </label>
                      <input 
                        type="email" 
                        value={sellEmail}
                        onChange={(e) => setSellEmail(e.target.value)}
                        placeholder="ornek@email.com"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Bölge / Şehir
                      </label>
                      <select 
                        value={sellRegion}
                        onChange={(e) => setSellRegion(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Girne">Girne</option>
                        <option value="Lefkoşa">Lefkoşa</option>
                        <option value="Gazimağusa">Gazimağusa</option>
                        <option value="İskele">İskele</option>
                        <option value="Güzelyurt">Güzelyurt</option>
                        <option value="Lefke">Lefke</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Mülk Tipi
                      </label>
                      <select 
                        value={sellPropType}
                        onChange={(e) => setSellPropType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Daire">Daire / Penthouse</option>
                        <option value="Villa">Villa / Müstakil Ev</option>
                        <option value="Arsa">Arsa / Arazi</option>
                        <option value="Ticari">Ticari Dükkan / Ofis</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Beklenen Satış/Kira Fiyatı & Not
                    </label>
                    <input 
                      type="text" 
                      value={sellExpectedPrice}
                      onChange={(e) => setSellExpectedPrice(e.target.value)}
                      placeholder="Örn: £120,000 veya Satılık 3+1 Daire"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={sellSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
                  >
                    {sellSubmitting ? "Gönderiliyor..." : "🚀 Ücretsiz Değerleme ve Portföy Başvurusu Yap"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {isContentModalOpen && activeContentMap && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 shrink-0">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{activeContentMap.title}</h3>
              <button onClick={() => setIsContentModalOpen(false)} className="h-8 w-8 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full flex items-center justify-center transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div 
              className="flex-1 overflow-y-auto p-5 sm:p-6 text-sm sm:text-base text-slate-700 font-medium leading-relaxed
                [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6
                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4
                [&_p]:mb-4 [&_p:last-child]:mb-0
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                [&_a]:text-indigo-600 [&_a]:underline
                [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl"
              style={{ wordBreak: 'break-word' }}
              dangerouslySetInnerHTML={{ __html: activeContentMap.content }}
            />
          </div>
        </div>
      )}



      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 pt-2 pb-24">
        
        {/* Mobile Filters Modal */}
        <AnimatePresence>
          {isMobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFiltersOpen(false)}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] md:hidden"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-xl bg-white rounded-[2.5rem] z-[201] md:hidden shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-10">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    {lang === "tr" ? "Gayrimenkul Filtrele" : "Filter Properties"}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        clearAllFilters();
                      }}
                      className="text-[10px] font-black text-indigo-600 hover:text-indigo-850 uppercase tracking-widest px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all"
                    >
                      {lang === "tr" ? "TEMİZLE" : "CLEAR"}
                    </button>
                    <button
                      onClick={() => setIsMobileFiltersOpen(false)}
                      className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Step 1: Portfolio Type (Tipi) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {lang === "tr" ? "PORTFÖY TİPİ" : "PORTFOLIO TYPE"}
                    </label>
                    <select
                      value={pendingType}
                      onChange={(e) => { setPendingType(e.target.value); setPendingSubType("all"); }}
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                      <option value="residence">{lang === "tr" ? "Konut" : "Residential"}</option>
                      <option value="commercial">{lang === "tr" ? "Ticari" : "Commercial"}</option>
                      <option value="land">{lang === "tr" ? "Arsa" : "Land"}</option>
                    </select>
                  </div>

                  {/* Step 1b: Alt Tip (SubType) */}
                  {pendingType !== "all" && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {lang === "tr" ? "ALT TİP" : "SUB TYPE"}
                      </label>
                      <select
                        value={pendingSubType}
                        onChange={(e) => setPendingSubType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                      >
                        <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                        {EMLAK_TIPI_SUB_TIPLERI[pendingType === 'residence' ? 'Konut' : pendingType === 'commercial' ? 'Ticari' : 'Arsa']?.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Step 2: Satılık / Kiralık */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {lang === "tr" ? "DURUM (SATILIK/KİRALIK)" : "INTENT (FOR SALE/RENT)"}
                    </label>
                    <select
                      value={listingTypeFilter}
                      onChange={(e) => setListingTypeFilter(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                      <option value="sale">{lang === "tr" ? "Satılık" : "For Sale"}</option>
                      <option value="rent">{lang === "tr" ? "Kiralık" : "For Rent"}</option>
                    </select>
                  </div>

                  {/* Step 3: Location (Ana Lokasyon) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {lang === "tr" ? "ANA LOKASYON" : "MAIN LOCATION"}
                    </label>
                    <select
                      value={pendingLocation}
                      onChange={(e) => { setPendingLocation(e.target.value); setPendingSubRegion("all"); }}
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                      {Object.keys(REAL_ESTATE_REGIONS).map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 3b: Alt Bölge (Subregion) */}
                  {pendingLocation !== "all" && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {lang === "tr" ? "ALT BÖLGE" : "SUB REGION"}
                      </label>
                      <select
                        value={pendingSubRegion}
                        onChange={(e) => setPendingSubRegion(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                      >
                        <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                        {REAL_ESTATE_REGIONS[pendingLocation as keyof typeof REAL_ESTATE_REGIONS]?.map(sr => (
                          <option key={sr} value={sr}>{sr}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Step 4: Budget in GBP */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {lang === "tr" ? "BÜTÇE (GBP)" : "BUDGET (GBP)"}
                    </label>
                    <select
                      value={pendingBudget}
                      onChange={(e) => setPendingBudget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer"
                    >
                      {budgetSpecs.ranges.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="p-6 border-t border-slate-100 bg-white pb-safe">
                  <button 
                    onClick={() => {
                      setActiveLocation(pendingLocation);
                      setActiveSubRegion(pendingSubRegion);
                      setActiveType(pendingType);
                      setActiveSubType(pendingSubType);
                      setActiveBudget(pendingBudget);
                      setIsMobileFiltersOpen(false);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-600/20 active:scale-95 cursor-pointer"
                  >
                    {lang === "tr" ? "SONUÇLARI GÖSTER" : "SHOW RESULTS"}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="space-y-32">

          {/* Portfolio/Listing Grid Preview */}
          {isSectionEnabled("portfolio") && (
            <div id="listings-section" className="space-y-4">
              {/* High-End IDX Split View Component */}
              <IDXSplitMapView
                products={products}
                store={store}
                lang={lang}
                onViewProduct={onViewProduct}
                formatPrice={formatPrice}
                onOpenSellModal={() => { setIsSellModalOpen(true); setSellSuccess(false); }}
              />
            </div>
          )}

          {/* Regional Radar Section */}
          {isSectionEnabled("news") && radarNews && radarNews.length > 0 && (
            <RadarShowcaseSlider 
              radarNews={radarNews} 
              lang={lang} 
              theme="light" 
              sector="real_estate"
            />
          )}

          {/* Blog Section */}
          {isSectionEnabled("blog") && (
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-4">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                    {lang === "tr" ? "BLOG YAZILARIMIZ" : "OUR BLOG"}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-rose-500 rounded-full"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {lang === "tr" ? "Güncel İçerikler" : "Latest Insights"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {blogs.map((blog, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedBlogPost(blog)}
                    className="group cursor-pointer space-y-4"
                  >
                    <div className="aspect-video bg-slate-100 rounded-3xl overflow-hidden relative">
                      <img
                        src={blog.cover_image || "https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=600"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={blog.title}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(blog.created_at || "").toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </p>
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-snug line-clamp-2">
                        {blog.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>



      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-24">
        <StoreMapSection store={store} />
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 pt-12 pb-8 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Güven ve Referanslar Bölümü - Full Width Bar */}
          <div className="py-8 bg-slate-800/80 rounded-[2rem] border border-slate-700/60 shadow-xl mb-12 backdrop-blur-md">
            <h2 className="text-xl font-black text-amber-400 text-center mb-6 uppercase tracking-widest">Güvenin Adresi</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 px-6">
              <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-slate-700/40">
                <div className="text-amber-400 font-black text-3xl mb-1">500+</div>
                <h3 className="font-bold text-white text-sm mb-0.5">Başarılı İşlem</h3>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">Tecrübeli Portföy</p>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-slate-700/40">
                <div className="text-emerald-400 font-black text-3xl mb-1">%98</div>
                <h3 className="font-bold text-white text-sm mb-0.5">Memnuniyet</h3>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">Şeffaf Süreç</p>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-2xl border border-slate-700/40">
                <div className="text-indigo-400 font-black text-3xl mb-1">15+</div>
                <h3 className="font-bold text-white text-sm mb-0.5">Yıllık Deneyim</h3>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold">Köklü Güven</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-8 border-b border-slate-800 items-start">
            <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
              <div className="flex flex-row items-center justify-between gap-4 w-full flex-nowrap">
                {store.logo_url ? (
                  <img src={store.logo_url} className="h-20 sm:h-32 md:h-40 w-auto max-w-[50%] object-contain filter drop-shadow-[0_4px_24px_rgba(255,255,255,0.08)] align-middle shrink-0" alt={store.name} />
                ) : (
                  <h2 className="text-lg sm:text-2xl font-black italic tracking-tighter uppercase text-white shrink-0 truncate max-w-[50%]">{store.name}</h2>
                )}
                {/* Social Media next to logo strictly aligned on same row */}
                <div className="flex gap-1.5 sm:gap-2 items-center shrink-0 flex-nowrap">
                  {store.facebook_url && (
                    <a href={store.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/50 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition-all">
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {store.instagram_url && (
                    <a href={store.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/50 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition-all">
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {store.twitter_url && (
                    <a href={store.twitter_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/50 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition-all">
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {store.youtube_url && (
                    <a href={store.youtube_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/50 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition-all">
                      <Youtube className="w-4 h-4" />
                    </a>
                  )}
                  {store.linkedin_url && (
                    <a href={store.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/50 rounded-lg hover:bg-indigo-600 text-slate-400 hover:text-white transition-all">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
              {store.description && (
                <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase max-w-md hidden md:block">
                  {store.description}
                </p>
              )}
            </div>

            {layoutConfig.quickLinks && layoutConfig.quickLinks.length > 0 && (
              <div className="hidden md:block space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{lang === 'tr' ? 'Hızlı Erişim' : 'Quick Links'}</h4>
                <ul className="space-y-3 text-sm font-bold text-slate-400">
                  {layoutConfig.quickLinks.map((link: any, idx: number) => (
                    <li 
                      key={idx} 
                      onClick={() => {
                        if (link.label === "İletişim" || link.label === "Contact") {
                          setActiveContentMap({ 
                            title: lang === 'tr' ? 'İletişim' : 'Contact', 
                            content: `<div class="space-y-4 text-slate-700">
                                        <p><strong>Adres:</strong> ${store.address || 'Belirtilmedi'}</p>
                                        <p><strong>Telefon:</strong> ${store.phone || ''}</p>
                                        <p><strong>E-posta:</strong> ${store.email || ''}</p>
                                      </div>` 
                          });
                          setIsContentModalOpen(true);
                          return;
                        }
                        if (link.type === 'url' || (link.url && link.url.length > 0)) {
                          if (link.url.startsWith('#')) {
                            const el = document.querySelector(link.url);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            window.open(link.url, '_blank');
                          }
                        } else {
                          setActiveContentMap({ title: link.label, content: link.content });
                        }
                      }} 
                      className="hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {link.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {layoutConfig.corporateLinks && layoutConfig.corporateLinks.length > 0 && (
              <div className="hidden md:block space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{lang === 'tr' ? 'Kurumsal' : 'Corporate'}</h4>
                <ul className="space-y-3 text-sm font-bold text-slate-400">
                  {layoutConfig.corporateLinks.map((link: any, idx: number) => (
                    <li 
                      key={idx} 
                      onClick={() => {
                        if (link.type === 'url' || (link.url && link.url.length > 0)) {
                          if (link.url.startsWith('#')) {
                            const el = document.querySelector(link.url);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            window.open(link.url, '_blank');
                          }
                        } else {
                          setActiveContentMap({ title: link.label, content: link.content });
                        }
                      }} 
                      className="hover:text-indigo-400 cursor-pointer transition-colors"
                    >
                      {link.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{lang === 'tr' ? 'İletişim' : 'Contact'}</h4>
              <div className="space-y-3 text-sm font-bold text-slate-400">
                {store.address && <p className="text-xs leading-relaxed">{store.address}</p>}
                <p className="text-xs">T: {store.phone}</p>
                <p className="text-xs">E: {store.email}</p>
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">
              © {new Date().getFullYear()} {store.name}. {lang === 'tr' ? 'TÜM HAKLARI SAKLIDIR.' : 'ALL RIGHTS RESERVED.'}
            </p>
          </div>
        </div>
      </footer>

      {/* Content Modal for Quick/Corporate Links */}
      <AnimatePresence>
        {activeContentMap && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{activeContentMap.title}</h3>
                <button 
                  onClick={() => setActiveContentMap(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div 
                  className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed
                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6
                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4
                    [&_p]:mb-4 [&_p:last-child]:mb-0
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                    [&_a]:text-indigo-600 [&_a]:underline"
                  style={{ wordBreak: 'break-word' }}
                  dangerouslySetInnerHTML={{ __html: activeContentMap.content }}
                />
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setActiveContentMap(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BlogShowcaseModal
        isOpen={!!selectedBlogPost}
        onClose={() => setSelectedBlogPost(null)}
        blog={selectedBlogPost}
        lang={lang}
      />
    </div>
  );
};
