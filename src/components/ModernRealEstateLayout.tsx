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
} from "lucide-react";
import { Store, Product } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "./RadarShowcaseSlider";
import { BlogShowcaseModal } from "./BlogShowcaseModal";
import { ListingFinancingCalculator } from "./ListingFinancingCalculator";
import { REAL_ESTATE_REGIONS, EMLAK_TIPI_SUB_TIPLERI } from "../data/realEstateConfig";

import { StoreMapSection } from "./StoreMapSection";

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

  const budgetSpecs = React.useMemo(() => {
    const maxVal = Math.max(...products.map(p => p.price || 0), 0);
    const isLiraScale = maxVal > 1500000;
    
    if (isLiraScale) {
      return {
        isLira: true,
        ranges: [
          { value: "all", label: lang === "tr" ? "Tümü" : "All" },
          { value: "0-3000000", label: lang === "tr" ? "3 Milyon TL Altı" : "Under 3M TL" },
          { value: "3000000-6000000", label: "3M - 6M TL" },
          { value: "6000000-12000000", label: "6M - 12M TL" },
          { value: "12000000-25000000", label: "12M - 25M TL" },
          { value: "25000000+", label: lang === "tr" ? "25 Milyon TL Üstü" : "Over 25M TL" },
        ]
      };
    } else {
      return {
        isLira: false,
        ranges: [
          { value: "all", label: lang === "tr" ? "Tümü" : "All" },
          { value: "0-150000", label: lang === "tr" ? "150k Altı" : "Under 150k" },
          { value: "150000-300000", label: "150k - 300k" },
          { value: "300000-500000", label: "300k - 500k" },
          { value: "500000-1000000", label: "500k - 1M" },
          { value: "1000000+", label: lang === "tr" ? "1M Üstü" : "Over 1M" },
        ]
      };
    }
  }, [products, lang]);

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

  const team = store.consultants && store.consultants.length > 0 
    ? store.consultants.map(c => ({
        id: c.id?.toString() || c.name,
        name: c.name,
        role: c.role || "Danışman",
        image: c.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
      }))
    : [
    {
      id: "1",
      name: store.name || "Broker",
      role: "Broker / Manager",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
    },
  ];

  const webContent = (store as any).page_layout_settings?.web_content;
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
    const customBanners = (store as any).branding?.banners || [];
    if (customBanners.length > 0) {
      return customBanners;
    }
    const configBanners = layoutConfig.banners || [];
    if (configBanners.length > 0) {
      return configBanners.map((url: string, i: number) => ({
        id: `config_${i}`,
        image_url: url,
        title: content.hero.title,
        subtitle: content.hero.subtitle,
        text_position: 'center',
        show_store_name: true,
      }));
    }
    return [{
      id: "fallback",
      image_url: content.hero.bgImage,
      title: content.hero.title,
      subtitle: content.hero.subtitle,
      text_position: 'center',
      show_store_name: true,
    }];
  }, [(store as any).branding?.banners, layoutConfig.banners, content.hero]);

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
    return filteredProducts.filter(p => {
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
  }, [filteredProducts, listingTypeFilter]);

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
    <div className="flex-1 bg-white overflow-hidden min-h-screen relative w-full font-sans">
      {/* Top Navbar */}
      <div className="absolute top-0 left-0 w-full z-40 bg-transparent flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          {store.logo_url ? (
            <img src={store.logo_url} className="h-12 md:h-16 max-w-[240px] md:max-w-[300px] object-contain drop-shadow" alt={store.name} />
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
              <a href="#financing-section" className="text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white cursor-pointer transition-colors shadow-sm">{lang === 'tr' ? 'FİNANSMAN' : 'FINANCING'}</a>
            </>
          )}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer ml-2">MENU</div>
        </div>
        <div className="md:hidden">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer">MENU</div>
        </div>
      </div>

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

      {/* Hero Container */}
      {isSectionEnabled("hero") && (
        <div className="h-[480px] relative flex flex-col items-center justify-center w-full overflow-hidden rounded-3xl shadow-xl border border-white/5">
          {banners.map((slide: any, idx: number) => {
            const isActive = activeBannerIndex === idx;
            return (
              <div
                key={slide.id || idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  backgroundImage: `url(${slide.image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  zIndex: isActive ? 1 : 0
                }}
              ></div>
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/35 to-slate-950/90" style={{ zIndex: 2 }}></div>

          {/* Active slide details overlay */}
          {(() => {
            const activeSlide = banners[activeBannerIndex] || banners[0];
            if (!activeSlide) return null;
            const rawName = (store as any)?.branding?.store_name || (store as any)?.branding?.name || store?.name || "";
            const getDisplayStoreName = (name: string) => {
              if (!name || name.toLowerCase().includes("lookprice")) {
                return "Seçkin Emlak";
              }
              return name;
            };
            const displayName = getDisplayStoreName(rawName);

            return (
              <div 
                className={`relative w-full h-full flex items-center px-8 md:px-16 py-12 ${
                  activeSlide.text_position === 'left' 
                    ? 'justify-start text-left' 
                    : activeSlide.text_position === 'right' 
                      ? 'justify-end text-right' 
                      : 'justify-center text-center'
                }`}
                style={{ zIndex: 10 }}
              >
                <div className={`max-w-2xl flex flex-col space-y-4 ${
                  activeSlide.text_position === 'left' 
                    ? 'items-start' 
                    : activeSlide.text_position === 'right' 
                      ? 'items-end' 
                      : 'items-center'
                }`}>
                  {activeSlide.show_store_name !== false && (
                    <div className="inline-flex items-center gap-2 bg-indigo-600/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-indigo-400/30">
                      <Check className="h-4 w-4 text-indigo-400" />
                      <span className="text-[12px] font-black text-indigo-300 uppercase tracking-widest">
                        {displayName}
                      </span>
                    </div>
                  )}
                  <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[0.95] drop-shadow-2xl">
                    {activeSlide.title || content.hero.title}
                  </h1>
                  <p className="text-slate-300 text-sm md:text-base font-medium max-w-lg leading-relaxed italic drop-shadow-sm">
                    "{activeSlide.subtitle || content.hero.subtitle}"
                  </p>
                  {activeSlide.button_text && (
                    <a
                      href={activeSlide.button_link || "#portfolio"}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105"
                    >
                      {activeSlide.button_text}
                    </a>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Slide dots indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-6 right-6 z-20 flex gap-2">
              {banners.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeBannerIndex === idx ? "bg-white scale-125 w-4" : "bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-32">
        {/* Advanced Search Strip */}
        {isSectionEnabled("search") && (
          <div className="-mt-12 relative z-30 w-full mb-12 md:mb-24">
            {/* Mobile Filter Button */}
            <div className="md:hidden flex justify-center w-full relative z-40">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 font-black tracking-widest text-xs uppercase"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {lang === "tr" ? "Filtrele" : "Filters"}
                </button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
              <div 
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors" 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <SlidersHorizontal className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 leading-none">
                      {lang === "tr" ? "DETAYLI ARAMA & FİLTRELER" : "DETAILED SEARCH & FILTERS"}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {isFiltersOpen 
                        ? (lang === "tr" ? "Filtreleri Gizlemek İçin Tıklayın" : "Click to Hide Filters")
                        : (lang === "tr" ? "Filtreleri Göstermek İçin Tıklayın" : "Click to Show Filters")
                      }
                    </p>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs transition-transform duration-200" style={{ transform: isFiltersOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  ▼
                </div>
              </div>
              
              <div className={`${isFiltersOpen ? "block border-t border-slate-100" : "hidden"} transition-all`}>
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
                  {["LOCATION", "TYPE", "BUDGET", "ROOMS"].map((filt, idx) => {
                    let displayTitle = filt;
                    let value = "all";
                    let onChange = (v: string) => {};
                    let options: { value: string; label: string }[] = [];

                    if (filt === "LOCATION") {
                      displayTitle = lang === "tr" ? "LOKASYON" : "LOCATION";
                      value = pendingLocation;
                      onChange = setPendingLocation;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...locations.map(v => ({ value: String(v), label: String(v) }))
                      ];
                    } else if (filt === "TYPE") {
                      displayTitle = lang === "tr" ? "TÜR" : "TYPE";
                      value = pendingType;
                      onChange = setPendingType;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...types.map(v => {
                          let displayLabel = String(v);
                          if (lang === "tr") {
                            const vLower = String(v).toLowerCase();
                            if (vLower === "residence") displayLabel = "Konut";
                            else if (vLower === "commercial") displayLabel = "Ticari";
                            else if (vLower === "land") displayLabel = "Arsa";
                          }
                          return { value: String(v), label: displayLabel };
                        })
                      ];
                    } else if (filt === "BUDGET") {
                      displayTitle = lang === "tr" ? "BÜTÇE" : "BUDGET";
                      value = pendingBudget;
                      onChange = setPendingBudget;
                      options = budgetSpecs.ranges;
                    } else if (filt === "ROOMS") {
                      displayTitle = lang === "tr" ? "ODA SAYISI" : "ROOMS";
                      value = pendingRooms;
                      onChange = setPendingRooms;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...roomsOptions.map(v => ({ value: String(v), label: String(v) }))
                      ];
                    }

                    return (
                      <div
                        key={filt}
                        className={`group relative ${idx < 3 ? "md:border-r border-slate-200" : ""} px-2 flex flex-col justify-center`}
                      >
                        <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1">
                          {displayTitle}
                        </p>
                      {filt === "LOCATION" ? (
                        <>
                          <select
                            value={pendingLocation}
                            onChange={(e) => { setPendingLocation(e.target.value); setPendingSubRegion("all"); }}
                            className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                          >
                             <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                             {Object.keys(REAL_ESTATE_REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1 mt-2">ALT BÖLGE</p>
                          <select
                            value={pendingSubRegion}
                            onChange={(e) => setPendingSubRegion(e.target.value)}
                            className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                          >
                             <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                             {REAL_ESTATE_REGIONS[pendingLocation as keyof typeof REAL_ESTATE_REGIONS]?.map(sr => <option key={sr} value={sr}>{sr}</option>)}
                          </select>
                        </>
                      ) : filt === "TYPE" ? (
                        <>
                          <select
                            value={pendingType}
                            onChange={(e) => { setPendingType(e.target.value); setPendingSubType("all"); }}
                            className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                          >
                             <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                             <option value="residence">Konut</option>
                             <option value="commercial">Ticari</option>
                             <option value="land">Arsa</option>
                          </select>
                          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1 mt-2">ALT TİP</p>
                          <select
                            value={pendingSubType}
                            onChange={(e) => setPendingSubType(e.target.value)}
                            className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                          >
                             <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                             {EMLAK_TIPI_SUB_TIPLERI[pendingType === 'residence' ? 'Konut' : pendingType === 'commercial' ? 'Ticari' : 'Arsa']?.map(st => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </>
                      ) : (
                        <div className="relative flex items-center justify-between pr-4">
                          <select
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                          >
                            {options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <SlidersHorizontal className="absolute right-2 h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                        </div>
                      )}
                      </div>
                    );
                  })}

                  {/* Extra filters row within the dropdown */}
                  <div className="col-span-1 md:col-span-4 border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {listingTypeFilter === 'rent' ? (
                      <>
                        <div className="group relative px-2 flex flex-col justify-center">
                          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1 uppercase">
                            {lang === "tr" ? "EŞYA DURUMU" : "FURNISHED STATUS"}
                          </p>
                          <div className="relative flex items-center justify-between pr-4">
                            <select
                              value={pendingFurnished}
                              onChange={(e) => setPendingFurnished(e.target.value)}
                              className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                            >
                              <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                              <option value="furnished">{lang === "tr" ? "Eşyalı" : "Furnished"}</option>
                              <option value="unfurnished">{lang === "tr" ? "Eşyasız" : "Unfurnished"}</option>
                            </select>
                            <SlidersHorizontal className="absolute right-2 h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                          </div>
                        </div>

                        <div className="group relative px-2 flex flex-col justify-center md:border-l md:border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1 uppercase">
                            {lang === "tr" ? "ÖDEME PERİYODU" : "BILLING PERIOD"}
                          </p>
                          <div className="relative flex items-center justify-between pr-4">
                            <select
                              value={pendingBillingPeriod}
                              onChange={(e) => setPendingBillingPeriod(e.target.value)}
                              className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                            >
                              <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                              <option value="monthly">{lang === "tr" ? "Aylık" : "Monthly"}</option>
                              <option value="3-monthly">{lang === "tr" ? "3 Aylık" : "3-Monthly"}</option>
                              <option value="6-monthly">{lang === "tr" ? "6 Aylık" : "6-Monthly"}</option>
                              <option value="yearly">{lang === "tr" ? "Yıllık" : "Yearly"}</option>
                            </select>
                            <SlidersHorizontal className="absolute right-2 h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="group relative px-2 flex flex-col justify-center">
                          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1 uppercase">
                            {lang === "tr" ? "TRAFO BEDELİ" : "TRANSFORMER FEE"}
                          </p>
                          <div className="relative flex items-center justify-between pr-4">
                            <select
                              value={pendingTrafoBedeli}
                              onChange={(e) => setPendingTrafoBedeli(e.target.value)}
                              className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                            >
                              <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                              <option value="paid">{lang === "tr" ? "Ödendi" : "Paid"}</option>
                              <option value="not_paid">{lang === "tr" ? "Ödenmedi / Ödenecek" : "Not Paid"}</option>
                            </select>
                            <SlidersHorizontal className="absolute right-2 h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                          </div>
                        </div>

                        <div className="group relative px-2 flex flex-col justify-center md:border-l md:border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1 uppercase">
                            {lang === "tr" ? "KDV DURUMU" : "VAT STATUS"}
                          </p>
                          <div className="relative flex items-center justify-between pr-4">
                            <select
                              value={pendingKdvStatus}
                              onChange={(e) => setPendingKdvStatus(e.target.value)}
                              className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                            >
                              <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                              <option value="paid">{lang === "tr" ? "Ödendi" : "Paid"}</option>
                              <option value="to_be_paid">{lang === "tr" ? "Ödenecek" : "To Be Paid"}</option>
                            </select>
                            <SlidersHorizontal className="absolute right-2 h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="group relative px-2 flex flex-col justify-center md:border-l md:border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1 uppercase">
                        {lang === "tr" ? "ÇATI TERASI" : "ROOF TERRACE"}
                      </p>
                      <div className="relative flex items-center justify-between pr-4">
                        <select
                          value={pendingCatiTerasi}
                          onChange={(e) => setPendingCatiTerasi(e.target.value)}
                          className="w-full bg-transparent text-sm font-black text-slate-900 focus:outline-none appearance-none cursor-pointer pr-8 py-1"
                        >
                          <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
                          <option value="yes">{lang === "tr" ? "Var" : "Available"}</option>
                          <option value="no">{lang === "tr" ? "Yok" : "None"}</option>
                        </select>
                        <SlidersHorizontal className="absolute right-2 h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleSearchTrigger}
                    className="col-span-1 md:col-span-4 bg-slate-900 text-white py-4 rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] mt-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 cursor-pointer"
                  >
                    {lang === "tr" ? "HAYALİNDEKİ MÜLKÜ BUL" : "FIND YOUR DREAM"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[201] md:hidden shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-xl z-10">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                    {lang === "tr" ? "Gayrimenkul Filtrele" : "Filter Properties"}
                  </h3>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {["LOCATION", "TYPE", "BUDGET", "ROOMS"].map((filt, idx) => {
                    let displayTitle = filt;
                    let value = "all";
                    let onChange = (v: string) => {};
                    let options: { value: string; label: string }[] = [];
                    
                    if (filt === "LOCATION") {
                      displayTitle = lang === "tr" ? "LOKASYON" : "LOCATION";
                      value = pendingLocation;
                      onChange = setPendingLocation;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...locations.map(v => ({ value: String(v), label: String(v) }))
                      ];
                    } else if (filt === "TYPE") {
                      displayTitle = lang === "tr" ? "TÜR" : "TYPE";
                      value = pendingType;
                      onChange = setPendingType;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...types.map(v => {
                          let displayLabel = String(v);
                          if (lang === "tr") {
                            if (displayLabel === "sale") displayLabel = "Satılık";
                            if (displayLabel === "rent") displayLabel = "Kiralık";
                          }
                          return { value: String(v), label: displayLabel };
                        })
                      ];
                    } else if (filt === "BUDGET") {
                      displayTitle = lang === "tr" ? "BÜTÇE" : "BUDGET";
                      value = pendingBudget;
                      onChange = setPendingBudget;
                      options = budgetSpecs.ranges;
                    } else if (filt === "ROOMS") {
                      displayTitle = lang === "tr" ? "ODA SAYISI" : "ROOMS";
                      value = pendingRooms;
                      onChange = setPendingRooms;
                      options = [
                        { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                        ...roomsOptions.map(v => ({ value: String(v), label: String(v) }))
                      ];
                    }

                    return (
                      <div key={filt} className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {displayTitle}
                        </label>
                        <select
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                        >
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-6 border-t border-slate-100 bg-white pb-safe">
                  <button 
                    onClick={() => {
                      setActiveLocation(pendingLocation);
                      setActiveType(pendingType);
                      setActiveBudget(pendingBudget);
                      setActiveRooms(pendingRooms);
                      setIsMobileFiltersOpen(false);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-600/20 active:scale-95"
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
            <div id="listings-section" className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-4">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                    {lang === "tr" ? "PORTFÖYÜMÜZ" : "OUR PORTFOLIO"}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {lang === "tr" ? "SEÇKİN YAŞAM ALANLARI" : "EXCLUSIVE LISTINGS"}
                    </p>
                  </div>
                </div>

                {/* Filter Selector Tabs */}
                <div className="flex items-center gap-3 self-start md:self-end bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <button
                    onClick={() => setListingTypeFilter("all")}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      listingTypeFilter === "all"
                        ? "bg-slate-900 text-white shadow-md shadow-slate-950/20"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {lang === "tr" ? "TÜMÜ" : "ALL"}
                  </button>
                  <button
                    onClick={() => setListingTypeFilter("sale")}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      listingTypeFilter === "sale"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-650/20"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {lang === "tr" ? "SATILIK" : "FOR SALE"}
                  </button>
                  <button
                    onClick={() => setListingTypeFilter("rent")}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      listingTypeFilter === "rent"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-650/20"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {lang === "tr" ? "KİRALIK" : "FOR RENT"}
                  </button>
                </div>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    {lang === "tr" ? "Aramanıza uygun portföy bulunamadı." : "No matching portfolios found."}
                  </p>
                </div>
              ) : (
                <div className={`grid gap-10 ${layoutConfig.grid === 'masonry' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {displayedProducts.slice(0, visibleCount).map((p, i) => {
                    const priceStr = formatPrice(p.price, store?.currency || p.currency);
                    return (
                      <div
                        key={p.id}
                        onClick={() => onViewProduct(p)}
                        className="group bg-white rounded-[3rem] overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-pointer flex flex-col justify-between"
                      >
                        <div className={`relative overflow-hidden ${layoutConfig.grid === 'masonry' ? (i % 2 === 0 ? 'aspect-[3/4]' : 'aspect-square') : 'aspect-[16/11]'}`}>
                          <div
                            className="h-full w-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
                            style={{
                              backgroundImage: `url(${p.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"})`,
                            }}
                          ></div>
                          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                            {/* Listing Type Badge */}
                            <span className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-slate-900 uppercase tracking-widest shadow-sm border border-slate-100">
                              {p.sector_data?.listing_intent === 'rent' || p.category?.toLowerCase().includes('kira') || p.category?.toLowerCase().includes('rent')
                                ? (lang === "tr" ? "KİRALIK" : "FOR RENT")
                                : (lang === "tr" ? "SATILIK" : "FOR SALE")}
                            </span>

                            {/* Finalized Status Badge/Overlay */}
                            {(p.status === 'rented' || (p as any).status === 'rented') && (
                              <span className="bg-emerald-600/90 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg animate-pulse">
                                {lang === "tr" ? "KİRALANDI" : "RENTED"}
                              </span>
                            )}
                            {(p.status === 'sold' || (p as any).status === 'sold') && (
                              <span className="bg-rose-600/90 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg animate-pulse">
                                {lang === "tr" ? "SATILDI" : "SOLD"}
                              </span>
                            )}
                            {p.status === 'optioned' && (
                              <span className="bg-amber-500/90 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-lg">
                                {lang === "tr" ? "OPSİYONLU" : "OPTIONED"}
                              </span>
                            )}
                          </div>
                          
                          {/* Sold/Rented Overlay on image */}
                          {(p.status === 'sold' || p.status === 'rented') && (
                            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-grayscale-[0.5]">
                               <div className="border-4 border-white/40 px-8 py-4 -rotate-12">
                                  <span className="text-3xl font-black text-white uppercase tracking-[0.2em] drop-shadow-2xl">
                                     {p.status === 'sold' ? (lang === 'tr' ? 'SATILDI' : 'SOLD') : (lang === 'tr' ? 'KİRALANDI' : 'RENTED')}
                                  </span>
                               </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-8 space-y-3 px-6 pb-8">
                          <div className="flex items-center justify-between gap-2 text-[10px] font-black tracking-wider uppercase text-slate-400">
                            {p.reference_no ? (
                              <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                                #{p.reference_no}
                              </span>
                            ) : <span></span>}
                            <span>
                              {lang === "tr" ? (p.category === "residence" ? "KONUT / RESIDENCE" : p.category === "commercial" ? "TİCARİ" : p.category === "land" ? "ARSA / LAND" : p.category) : p.category}
                            </span>
                          </div>

                          <h4 className="text-[14px] md:text-[15px] font-extrabold tracking-tight text-slate-900 uppercase group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2 min-h-[40px] flex items-center">
                            {p.name}
                          </h4>

                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100/80">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="truncate">
                              {p.location || p.sector_data?.location || p.sector_data?.district || (lang === 'tr' ? 'Kuzey Kıbrıs' : 'North Cyprus')}
                            </span>
                          </div>

                          {/* Real Estate Specific details inside grid */}
                          <div className="grid grid-cols-2 gap-2 py-1 border-y border-slate-100 text-[10px] font-bold text-slate-600">
                            {p.sector_data?.rooms ? (
                              <div className="flex items-center gap-1">
                                <span className="text-indigo-500 font-extrabold text-xs">🛏️</span>
                                <span>{lang === "tr" ? "Oda:" : "Rooms:"} <span className="text-slate-900 font-black">{p.sector_data.rooms}</span></span>
                              </div>
                            ) : null}
                            {p.sector_data?.square_meters ? (
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-500 font-extrabold text-xs">📏</span>
                                <span>{lang === "tr" ? "Net:" : "Net:"} <span className="text-slate-900 font-black">{p.sector_data.square_meters} m²</span></span>
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                             <p className="text-xl font-black text-indigo-600 tracking-tight">
                                {priceStr}
                             </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {displayedProducts.length > visibleCount && (
                <div className="mt-16 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="px-8 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 hover:-translate-y-1"
                  >
                    {lang === "tr" ? "Daha Fazla Göster" : "Load More"}
                  </button>
                </div>
              )}
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

          {/* Real estate Financing Calculator */}
          {isSectionEnabled("financing") && (
            <div id="financing-section" className="scroll-mt-6 border border-slate-100 rounded-[3rem] bg-gradient-to-br from-indigo-50/20 via-white to-indigo-50/10 shadow-2xl relative overflow-hidden">
              <div 
                className="p-8 flex justify-between items-center cursor-pointer border-b border-slate-100/50 hover:bg-slate-50 transition-colors" 
                onClick={() => setIsFinancingOpen(!isFinancingOpen)}
              >
                <div>
                  <h3 className="text-2xl font-black text-indigo-950 uppercase tracking-tighter leading-none">
                    {lang === "tr" ? "AKILLI KONUT KREDİSİ HESAPLAYICI" : "SMART HOUSING FINANCE CALCULATOR"}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {isFinancingOpen
                      ? (lang === "tr" ? "Hesaplayıcıyı Gizlemek İçin Tıklayın" : "Click to Hide Calculator")
                      : (lang === "tr" ? "Hesaplayıcıyı Açmak İçin Tıklayın" : "Click to Open Calculator")
                    }
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-indigo-50/80 flex items-center justify-center text-indigo-600 font-bold text-xs transition-transform duration-200" style={{ transform: isFinancingOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  ▼
                </div>
              </div>
              <div className={`p-8 md:p-14 ${isFinancingOpen ? 'block' : 'hidden'} transition-all`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase">
                      {lang === "tr"
                        ? "Mülk değerine ve bütçenize göre Kıbrıs'ın saygın bankalarından ön onaylı kredi oranlarını karşılaştırın."
                        : "Simulate and apply directly to prominent Cypriot banks with pre-calculated rates."}
                    </p>
                  </div>
                  <div className="lg:col-span-12 xl:col-span-7">
                    <ListingFinancingCalculator 
                      price={products.length > 0 ? products[0].price : 100000} 
                      currency={store.currency || "TRY"} 
                      lang={lang} 
                      store={store} 
                      defaultOpen={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Segment */}
          {isSectionEnabled("team") && (
            <div className="space-y-16">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="h-1 w-16 bg-indigo-600 mx-auto"></div>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  {lang === "tr" ? "GÜVEN BİZİM GENETİĞİMİZDE VAR" : "TRUST IS IN OUR DNA"}
                </h3>
                <p className="text-base font-bold text-slate-500 leading-relaxed">
                  {lang === "tr"
                    ? "Brokerlarımızın tecrübesiyle, her mülk doğru yatırımdır."
                    : "Our brokers bring experience to every transaction."}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {team.map((tm, idx) => (
                  <div key={idx} className="group cursor-pointer">
                    <div className="aspect-[3/4] bg-slate-100 rounded-[3rem] overflow-hidden relative shadow-xl hover:-translate-y-4 transition-all duration-700">
                      <img
                        src={tm.image}
                        className="h-full w-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 scale-105"
                        alt={tm.name}
                      />
                    </div>
                    <div className="mt-8 text-center space-y-2">
                      <p className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        {tm.name}
                      </p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {tm.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {isSectionEnabled("stats") && (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 mt-16">
          <div className="grid grid-cols-3 gap-2 md:gap-12 border-y border-slate-200 py-4 md:py-12">
            {content.stats.map((st, i) => (
              <div key={i} className="text-center group flex flex-col justify-between">
                <p className="text-xl sm:text-3xl md:text-5xl font-black text-slate-900 mb-0.5 md:mb-2 group-hover:scale-110 transition-transform">
                  {st.value}
                </p>
                <div className="h-0.5 w-4 md:w-8 bg-indigo-600 mx-auto mb-1 md:mb-4 rounded-full"></div>
                <p className="text-[8px] sm:text-[10px] md:text-[12px] font-black text-slate-400 uppercase tracking-tight leading-tight sm:tracking-widest truncate">
                  {st.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-24">
        <StoreMapSection store={store} />
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 pt-12 pb-8 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-8 border-b border-slate-800 items-start">
            <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
              <div className="flex flex-row items-center justify-between gap-4 w-full flex-nowrap">
                {store.logo_url ? (
                  <img src={store.logo_url} className="h-10 sm:h-16 md:h-20 w-auto max-w-[50%] object-contain filter drop-shadow-[0_4px_24px_rgba(255,255,255,0.08)] align-middle shrink-0" alt={store.name} />
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
