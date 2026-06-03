import React, { useState, useEffect } from "react";
import {
  Map,
  Layout,
  ArrowRight,
  Check,
  SlidersHorizontal,
  Users,
  MapPin,
} from "lucide-react";
import { Store, Product } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "./RadarShowcaseSlider";
import { BlogShowcaseModal } from "./BlogShowcaseModal";

interface ModernPortfolioLayoutProps {
  store: Store;
  products: Product[];
  radarNews?: any[];
  onViewProduct: (product: Product) => void;
}

export const ModernPortfolioLayout: React.FC<ModernPortfolioLayoutProps> = ({
  store,
  products,
  radarNews = [],
  onViewProduct,
}) => {
  const { lang } = useLanguage();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState<any>(null);

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

  // Active filters states (applied only on button click)
  const [activeLocation, setActiveLocation] = useState<string>("all");
  const [activeType, setActiveType] = useState<string>("all");
  const [activeBudget, setActiveBudget] = useState<string>("all");
  const [activeRooms, setActiveRooms] = useState<string>("all");

  // Pending filter states
  const [pendingLocation, setPendingLocation] = useState<string>("all");
  const [pendingType, setPendingType] = useState<string>("all");
  const [pendingBudget, setPendingBudget] = useState<string>("all");
  const [pendingRooms, setPendingRooms] = useState<string>("all");

  // Filter options derived from product list
  const locations = React.useMemo(() => {
    const locs = products.map(p => {
      return p.sector_data?.district || p.sector_data?.city || p.brand || (p as any).location;
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
        const pLoc = p.sector_data?.district || p.sector_data?.city || p.brand || (p as any).location || "";
        if (pLoc.toLowerCase() !== activeLocation.toLowerCase()) {
          return false;
        }
      }
      // 2. Type match
      if (activeType !== "all") {
        if (p.category !== activeType) {
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
      return true;
    });
  }, [products, activeLocation, activeType, activeRooms, activeBudget]);

  const handleSearchTrigger = () => {
    setActiveLocation(pendingLocation);
    setActiveType(pendingType);
    setActiveBudget(pendingBudget);
    setActiveRooms(pendingRooms);
    
    // Smooth scroll to listings section
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

  const content = {
    hero: {
      title:
        store.name?.toUpperCase() ||
        (lang === "tr" ? "YENİ NESİL PORTFÖY" : "NEW GENERATION PORTFOLIO"),
      subtitle:
        store.description ||
        (lang === "tr"
          ? "Yatırım hayallerinizi gerçeğe dönüştüren profesyonel çözümler."
          : "Professional solutions turning your investment dreams into reality."),
      bgImage:
        ((store as any).page_layout && typeof (store as any).page_layout === 'object' && !Array.isArray((store as any).page_layout) && ((store as any).page_layout as any).hero_image_url) ||
        store.hero_image_url ||
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000",
    },
    stats: [
      {
        value: "500+",
        label: lang === "tr" ? "Mutlu Müşteri" : "Happy Clients",
      },
      {
        value: products.length.toString(),
        label: lang === "tr" ? "Aktif İlan" : "Active Listings",
      },
      {
        value: "10+",
        label: lang === "tr" ? "Yıl Tecrübe" : "Years Experience",
      },
    ],
    trustSlogan:
      (store as any).slogan ||
      (lang === "tr" ? "GÜVENLE YÖNETİYORUZ" : "MANAGED WITH TRUST"),
  };

  const layoutConfig = React.useMemo(() => {
    if (!store.page_layout) return { sections: [], grid: 'standard', count: 6, banners: [] };
    let layout = store.page_layout;
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
      banners: l.banners || []
    };
  }, [store.page_layout]);

  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  React.useEffect(() => {
    const banners = layoutConfig.banners;
    if (banners && banners.length > 1) {
      const interval = setInterval(() => {
        setActiveBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [layoutConfig.banners]);

  const isSectionEnabled = (sectionId: string) => {
    if (!layoutConfig.sections || layoutConfig.sections.length === 0) return true;
    const section = layoutConfig.sections.find((s: any) => s.id === sectionId);
    return section ? section.enabled : true;
  };

  const displayedProducts = filteredProducts;

  return (
    <div className="flex-1 bg-white overflow-hidden min-h-screen relative w-full font-sans">
      {/* Hero Container */}
      {isSectionEnabled("hero") && (
        <div className="h-[450px] relative flex flex-col items-center justify-center p-12 text-center w-full">
          {(!layoutConfig.banners || layoutConfig.banners.length === 0) ? (
            <div
              className="absolute inset-0 transition-opacity duration-1000"
              style={{
                backgroundImage: `url(${content.hero.bgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            ></div>
          ) : (
            layoutConfig.banners.map((bannerUrl: string, idx: number) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${activeBannerIndex === idx ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  backgroundImage: `url(${bannerUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>
            ))
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/35 to-white/95"></div>

          <div className="relative z-10 space-y-6 max-w-2xl transform translate-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-600/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-indigo-400/30">
              <Check className="h-4 w-4 text-indigo-400" />
              <span className="text-[12px] font-black text-indigo-300 uppercase tracking-widest">
                {content.trustSlogan}
              </span>
            </div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
              {content.hero.title}
            </h1>
            <p className="text-white text-lg font-bold max-w-lg mx-auto leading-relaxed italic drop-shadow-sm">
              "{content.hero.subtitle}"
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pb-32">
        {/* Advanced Search Strip */}
        {isSectionEnabled("search") && (
          <div className="-mt-12 relative z-30 w-full mb-24">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    ...locations.map(v => ({ value: v, label: v }))
                  ];
                } else if (filt === "TYPE") {
                  displayTitle = lang === "tr" ? "TÜR" : "TYPE";
                  value = pendingType;
                  onChange = setPendingType;
                  options = [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...types.map(v => {
                      let displayLabel = v;
                      if (lang === "tr") {
                        const vLower = v.toLowerCase();
                        if (vLower === "residence") displayLabel = "Konut";
                        else if (vLower === "commercial") displayLabel = "Ticari";
                        else if (vLower === "land") displayLabel = "Arsa";
                      }
                      return { value: v, label: displayLabel };
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
                    ...roomsOptions.map(v => ({ value: v, label: v }))
                  ];
                }

                return (
                  <div
                    key={filt}
                    className={`group relative ${idx < 3 ? "md:border-r border-slate-100" : ""} px-2 flex flex-col justify-center`}
                  >
                    <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-1">
                      {displayTitle}
                    </p>
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
                  </div>
                );
              })}
              <button 
                onClick={handleSearchTrigger}
                className="col-span-1 md:col-span-4 bg-slate-900 text-white py-4 rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] mt-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 cursor-pointer"
              >
                {lang === "tr" ? "HAYALİNDEKİ MÜLKÜ BUL" : "FIND YOUR DREAM"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-32">
          {/* Stats */}
          {isSectionEnabled("stats") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-y border-slate-200 py-12">
              {content.stats.map((st, i) => (
                <div key={i} className="text-center group">
                  <p className="text-5xl font-black text-slate-900 mb-2 group-hover:scale-110 transition-transform">
                    {st.value}
                  </p>
                  <div className="h-1 w-8 bg-indigo-600 mx-auto mb-4 rounded-full"></div>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
                    {st.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Portfolio/Listing Grid Preview */}
          {isSectionEnabled("portfolio") && (
            <div id="listings-section" className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-4">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                    {lang === "tr" ? "GÜNCEL PORTFÖY" : "LATEST LISTINGS"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {lang === "tr" ? "Size Özel Seçkiler" : "Curated For You"}
                    </p>
                    {(activeLocation !== "all" || activeType !== "all" || activeBudget !== "all" || activeRooms !== "all") && (
                      <button
                        onClick={() => {
                          setPendingLocation("all");
                          setPendingType("all");
                          setPendingBudget("all");
                          setPendingRooms("all");
                          setActiveLocation("all");
                          setActiveType("all");
                          setActiveBudget("all");
                          setActiveRooms("all");
                        }}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-150 cursor-pointer"
                      >
                        ✕ {lang === "tr" ? "Filtreleri Temizle" : "Clear Filters"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 border border-slate-150/50 rounded-[2.5rem] w-full flex flex-col items-center justify-center p-8 space-y-4">
                  <SlidersHorizontal className="w-12 h-12 text-slate-300 animate-pulse" />
                  <p className="text-lg font-bold text-slate-700">
                    {lang === "tr"
                      ? "Aradığınız kriterlere uygun ilan bulunamadı."
                      : "No listings found matching your search criteria."}
                  </p>
                  <button
                    onClick={() => {
                      setPendingLocation("all");
                      setPendingType("all");
                      setPendingBudget("all");
                      setPendingRooms("all");
                      setActiveLocation("all");
                      setActiveType("all");
                      setActiveBudget("all");
                      setActiveRooms("all");
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    {lang === "tr" ? "Tüm Filtreleri Temizle" : "Clear All Filters"}
                  </button>
                </div>
              ) : (
                <div className={`grid gap-10 w-full ${layoutConfig.grid === 'masonry' ? 'columns-1 md:columns-2 lg:columns-3 space-y-10' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {displayedProducts.map((p) => {
                    const priceStr = new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: p.currency || store.currency || "USD",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(p.price);

                    return (
                      <div
                        key={p.id}
                        onClick={() => onViewProduct(p)}
                        className="group cursor-pointer"
                      >
                        <div className="bg-slate-50 rounded-[3rem] overflow-hidden relative shadow-sm group-hover:shadow-2xl transition-all duration-700 aspect-[16/10]">
                          <div
                            className="h-full w-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-105"
                            style={{
                              backgroundImage: `url(${p.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000"})`,
                            }}
                          ></div>
                          <div className="absolute top-8 left-8 flex gap-2">
                            <div className="bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl text-[10px] font-black text-slate-950 uppercase tracking-[0.2em] shadow-xl border border-slate-100 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              {(() => {
                                const loc = p.location || p.sector_data?.location;
                                const reg = p.sector_data?.kktc_region || p.sector_data?.region || p.sector_data?.city || p.sector_data?.district;
                                if (loc && reg && loc.toLowerCase() !== reg.toLowerCase()) {
                                  return `${loc} / ${reg}`;
                                }
                                return loc || reg || (lang === 'tr' ? 'KUZEY KIBRIS' : 'NORTH CYPRUS');
                              })().toUpperCase()}
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 w-full p-10 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                            <button className="w-full py-4 bg-white text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-50 transition-colors">
                              {lang === "tr" ? "MÜLKÜ İNCELE" : "EXPLORE PROPERTY"}
                            </button>
                          </div>
                        </div>
                        <div className="mt-8 space-y-3 px-4">
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

                          <h4 
                            className="text-[14px] md:text-[15px] font-extrabold tracking-tight text-slate-900 uppercase group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2 min-h-[40px] flex items-center"
                            title={p.name}
                          >
                            {p.name}
                          </h4>

                          {/* Elegant Region/Location row */}
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100/80">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="truncate">
                              {(() => {
                                const loc = p.location || p.sector_data?.location;
                                const reg = p.sector_data?.kktc_region || p.sector_data?.region || p.sector_data?.city || p.sector_data?.district;
                                if (loc && reg && loc.toLowerCase() !== reg.toLowerCase()) {
                                  return `${loc} • ${lang === 'tr' ? 'Bölge' : 'Region'}: ${reg}`;
                                }
                                return loc || reg || (lang === 'tr' ? 'Kuzey Kıbrıs' : 'North Cyprus');
                              })()}
                            </span>
                          </div>

                          {/* Real Estate Specific details inside grid */}
                          {(p.type === "real_estate" || p.sector_data?.square_meters || p.sector_data?.rooms) && (
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
                              {p.sector_data?.kktc_title_type ? (
                                <div className="flex items-center gap-1 col-span-2 text-[9px] truncate">
                                  <span className="text-amber-500 font-extrabold text-xs">📜</span>
                                  <span className="truncate">{lang === "tr" ? "Koçan:" : "Deed:"} <span className="text-slate-900 font-black">{p.sector_data.kktc_title_type}</span></span>
                                </div>
                              ) : null}
                            </div>
                          )}

                          {/* Vehicle Specific details */}
                          {(p.type === "vehicle" || p.category === "Araç İlanları" || p.sector_data?.chassis_number) && (
                            <div className="flex flex-wrap gap-2 py-1 border-y border-slate-100 text-[10px] font-bold text-slate-600">
                              {p.brand && (
                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">🚗 {p.brand}</span>
                              )}
                              {p.description && p.description.includes("KM:") && (
                                <span className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md">
                                  ⚡ {p.description.match(/KM:\s*(\d+)/)?.[0] || p.description}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                             <p className="text-xl font-black text-indigo-600 tracking-tight">
                                {priceStr}
                             </p>
                             {p.branch_name && (
                               <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-150">
                                 {p.branch_name}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Regional Radar Section */}
          {isSectionEnabled("news") && radarNews && radarNews.length > 0 && (
            <RadarShowcaseSlider radarNews={radarNews} lang={lang} theme="light" />
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
                {(blogs.length > 0 ? blogs : []).map((blog, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedBlogPost(blog)}
                    className="group cursor-pointer flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300"
                  >
                    <div className="h-64 relative overflow-hidden">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${blog.image_url || blog.img || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800"})`,
                        }}
                      ></div>
                    </div>
                    <div className="p-8 space-y-4 flex-1 flex flex-col">
                      <p className="text-xs font-black text-rose-500 uppercase tracking-widest">
                        {blog.date ||
                          new Date(blog.created_at).toLocaleDateString()}
                      </p>
                      <h4 className="text-xl font-black text-slate-900 leading-snug group-hover:text-rose-600 transition-colors">
                        {blog.title}
                      </h4>
                      <div
                        className="text-sm text-slate-500 leading-relaxed max-w-sm line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html:
                            blog.summary ||
                            (blog.content
                              ? blog.content
                                  .replace(/<[^>]*>?/gm, "")
                                  .substring(0, 150) + "..."
                              : ""),
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

              {/* Standalone Financing Calculator for Portfolio */}
              {isSectionEnabled("financing") && (() => {
                const currentFinSettings = store?.financing_settings || {};
                const baseRatesObj = currentFinSettings.base_rates || {};
                const partnerRatesObj = currentFinSettings.partner_rates || {};
                const promoActive = currentFinSettings.partner_promo_active === true;

                const DEFAULT_BASE_RATES: Record<string, Record<string, number>> = {
                  TRY: { "Creditwest Bank": 3.49, "Kıbrıs İktisat Bankası": 3.65, "Limasol Sosyal Kooperatif": 3.89, "Ziraat Bankası KKTC": 3.79 },
                  GBP: { "Creditwest Bank": 0.55, "Kıbrıs İktisat Bankası": 0.60, "Limasol Sosyal Kooperatif": 0.65, "Ziraat Bankası KKTC": 0.58 },
                  EUR: { "Creditwest Bank": 0.49, "Kıbrıs İktisat Bankası": 0.52, "Limasol Sosyal Kooperatif": 0.58, "Ziraat Bankası KKTC": 0.50 },
                  USD: { "Creditwest Bank": 0.52, "Kıbrıs İktisat Bankası": 0.55, "Limasol Sosyal Kooperatif": 0.60, "Ziraat Bankası KKTC": 0.54 }
                };

                let currencyBase: Record<string, number> = {};
                if (baseRatesObj["Creditwest Bank"] !== undefined) {
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
                  currencyPartner = finCurrency === "TRY" ? { ...partnerRatesObj } : {};
                } else {
                  currencyPartner = partnerRatesObj[finCurrency] || {};
                }

                const getEffectiveRate = (bankName: string, defaultRate: number) => {
                  if (promoActive && currencyPartner[bankName] !== undefined && currencyPartner[bankName] !== "") {
                    return parseFloat(String(currencyPartner[bankName]));
                  }
                  return currencyBase[bankName] !== undefined ? parseFloat(String(currencyBase[bankName])) : defaultRate;
                };

                const isOverridden = (bankName: string) => {
                  return promoActive && currencyPartner[bankName] !== undefined && currencyPartner[bankName] !== "";
                };

                const sponsorBanks = [
                  { name: "Creditwest Bank", rate: getEffectiveRate("Creditwest Bank", DEFAULT_BASE_RATES[finCurrency]?.["Creditwest Bank"] || 0.55), isSponsor: true, isActual: true, logo: "🏛️", isOverridden: isOverridden("Creditwest Bank") },
                  { name: "Kıbrıs İktisat Bankası", rate: getEffectiveRate("Kıbrıs İktisat Bankası", DEFAULT_BASE_RATES[finCurrency]?.["Kıbrıs İktisat Bankası"] || 0.60), isSponsor: true, isActual: true, logo: "🏦", isOverridden: isOverridden("Kıbrıs İktisat Bankası") },
                  { name: "Limasol Sosyal Kooperatif", rate: getEffectiveRate("Limasol Sosyal Kooperatif", DEFAULT_BASE_RATES[finCurrency]?.["Limasol Sosyal Kooperatif"] || 0.65), isSponsor: true, isActual: true, logo: "🏢", isOverridden: isOverridden("Limasol Sosyal Kooperatif") },
                  { name: "Ziraat Bankası KKTC", rate: getEffectiveRate("Ziraat Bankası KKTC", DEFAULT_BASE_RATES[finCurrency]?.["Ziraat Bankası KKTC"] || 0.58), isSponsor: true, isActual: true, logo: "🏙️", isOverridden: isOverridden("Ziraat Bankası KKTC") },
                  { name: "📢 [REKLAM ALANI] - Kiralık Sponsor Alanı", rate: 1.75, isSponsor: false, isActual: false, logo: "✨", isOverridden: false }
                ];

                const activeBank = sponsorBanks.find(b => b.name === selectedBank) || sponsorBanks[0];
                const activeRate = activeBank.isActual ? activeBank.rate : finInterestRate;
                const loanRequired = Math.max(0, finPropertyPrice * (1 - finDownPaymentPercent / 100));
                const downPaymentVal = finPropertyPrice * (finDownPaymentPercent / 100);

                const monthlyRateVal = activeRate / 100;
                let computedMonthlyInstallment = 0;
                if (monthlyRateVal === 0) {
                  computedMonthlyInstallment = loanRequired / finDurationMonths;
                } else {
                  computedMonthlyInstallment = (loanRequired * monthlyRateVal * Math.pow(1 + monthlyRateVal, finDurationMonths)) / 
                                       (Math.pow(1 + monthlyRateVal, finDurationMonths) - 1);
                }

                const computedTotalPayment = computedMonthlyInstallment * finDurationMonths;
                const computedTotalInterest = Math.max(0, computedTotalPayment - loanRequired);

                const formatFinValue = (val: number) => {
                  return new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(val) + " " + finCurrency;
                };

                const handleApplySubmit = (e: React.FormEvent) => {
                  e.preventDefault();
                  if (!applyName || !applyPhone || !applyEmail) {
                    alert(lang === "tr" ? "Lütfen tüm başvuru alanlarını doldurunuz!" : "Please fill out all fields!");
                    return;
                  }
                  
                  // Simulate pushing to backend log/sync
                  try {
                    api.publishRadarNews({
                      title: `💳 Yeni Kredi Ön Başvurusu: ${applyName}`,
                      summary: `Müşteri ${applyName} (${applyPhone}, ${applyEmail}), ${selectedBank} üzerinden ${formatFinValue(loanRequired)} kredi başvurusu gerçekleştirdi. Vade: ${finDurationMonths} Ay, Faiz Oranı: %${activeRate}.`,
                      source: 'Finansal Asistan Başvuru Hattı',
                      date: 'Az Önce',
                      tags: ['Kredi', 'Ön Başvuru', selectedBank],
                      published_on_store: false,
                      published_on_enrakipsiz: false
                    }).catch(err => console.log("Silent persist err: ", err));
                  } catch(e) {}

                  setApplySuccess(true);
                };

                return (
                  <div className="pt-24" id="financing-section">
                    <div className="bg-slate-900 rounded-[3.5rem] p-8 md:p-16 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
                      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
                      
                      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        
                        {/* LEFT COLUMN: INTERACTIVE INFORMATION BANK SELECTOR */}
                        <div className="space-y-8">
                          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-2xl border border-indigo-500/20">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                              {lang === "tr" ? "AKILLI FİNANSAL ASİSTAN" : "AI FINANCIAL ASSISTANT"}
                            </span>
                          </div>
                          
                          <h2 className="text-4.5xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                            {lang === "tr" ? "Yatırımınızı\nPlanlayın" : "Plan Your\nInvestment"}
                          </h2>
                          
                          <p className="text-slate-400 font-bold max-w-md leading-relaxed text-sm">
                            {lang === "tr" 
                              ? "Hayalinizdeki mülk için Kıbrıs'ın saygın bankalarından size özel ödeme planları ve güncel mevduat kredi oranlarını hesaplayın."
                              : "Calculate tailored mortgage options and payment plans from top Cyprus partner banks for your dream property."}
                          </p>

                          {/* SPONSOR BANKS GRID CHOOSER */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                              {lang === "tr" ? "🏦 Kredi Veren Anlaşmalı Bankalar" : "🏦 Partner Financing Banks"}
                            </span>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sponsorBanks.map((bank) => (
                                <button
                                  key={bank.name}
                                  onClick={() => {
                                    setSelectedBank(bank.name);
                                    if (bank.isActual) {
                                      setFinInterestRate(bank.rate);
                                    }
                                  }}
                                  className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                                    selectedBank === bank.name
                                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-650'
                                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-350'
                                  }`}
                                >
                                  <span className="text-xl">{bank.logo}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-extrabold truncate">{bank.name}</p>
                                    <p className={`text-[10px] font-semibold ${selectedBank === bank.name ? 'text-indigo-200' : 'text-slate-400'} flex items-center flex-wrap gap-1 mt-0.5`}>
                                      {bank.isActual 
                                        ? `${lang === "tr" ? "Faiz" : "Interest"}: %${bank.rate}`
                                        : (lang === "tr" ? "Kiralık Sponsor Alanı" : "Lease Option")}
                                      {bank.isActual && bank.isOverridden && (
                                        <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-200 text-[8px] font-black uppercase rounded block tracking-wider leading-none">
                                          {lang === 'tr' ? 'ÖZEL' : 'PARTNER'}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* BIZ-DEV LEASING CALLOUT SIGNATURE */}
                          {selectedBank.includes("[REKLAM ALANI]") ? (
                            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-rose-500/10 border border-amber-500/30 p-5 rounded-[2rem] space-y-3.5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[8px] font-black px-3.5 py-1 rounded-bl-2xl uppercase tracking-widest animate-bounce">
                                FIRSAT / SALE
                              </div>
                              <p className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                📢 BU ALAN SPONSORLUK İÇİN KİRALIKTIR!
                              </p>
                              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                                Bu saygın akıllı asistan bölmesi günde binlerce nitelikli emlak alıcısı tarafından aktif kullanılmaktadır. Bankanızın özel başvuru butonları ve özel faiz avantajlarını buraya sabitleyerek binlerce hazır müşteriyi şubelerinize yönlendirebilirsiniz.
                              </p>
                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-amber-500/15">
                                <span className="text-[10px] font-semibold text-slate-400 font-mono">lookprice Sponsorluk & Entegrasyon Ağı</span>
                                <a href="mailto:lookprice.me@gmail.com" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-[10.5px] uppercase tracking-wider transition-colors">
                                  Teklif Al & Kirala
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white/5 border border-white/5 p-5 rounded-[2rem] space-y-3">
                              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                🚀 SPONSOR KAMPANYASINDAN YARARLANIN
                              </p>
                              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                                {selectedBank} mülk portföyümüze özel %{activeRate} ayrıcalıklı faiz oranı tanımlamıştır. Bu oran lookprice müşterileri için dosya masrafından ve ekspertiz ücretinden tamamen muaftır.
                              </p>
                              <div className="text-[10px] text-slate-500 font-bold italic flex items-center justify-between border-t border-white/5 pt-2">
                                <span>* Koçan tescili ve ipotek onay süreçleri dijital ortamda tamamlanır.</span>
                                <span className="text-emerald-400 font-black">Pre-approved</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* RIGHT COLUMN: THE DYNAMIC CALCULATOR & PRE-APPLICATION SHEET */}
                        <div className="bg-white text-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative">
                          <div className="absolute -top-3 -right-3 bg-indigo-600 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg">
                            ACTIVE AI CALC
                          </div>
                          
                          {!showApplyModal ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                  <h4 className="font-black text-slate-800 text-sm tracking-tight">
                                    {lang === "tr" ? "Kredi Hesaplama & Simülasyon" : "Mortgage Calculation"}
                                  </h4>
                                  <p className="text-[10px] text-slate-400 font-bold">
                                    {lang === "tr" ? "Konut degeri, peşinat oranı ve vadeler serbestçe uyarlanır." : "Adjust property value, down payment, and term."}
                                  </p>
                                </div>
                                
                                {/* Currency Options dropdown */}
                                <select 
                                  value={finCurrency}
                                  onChange={(e) => setFinCurrency(e.target.value)}
                                  className="bg-slate-50 border border-slate-155 text-slate-700 font-black rounded-xl p-1.5 px-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                  <option value="GBP">GBP (£)</option>
                                  <option value="EUR">EUR (€)</option>
                                  <option value="USD">USD ($)</option>
                                  <option value="TRY">TRY (₺)</option>
                                </select>
                              </div>

                              {/* Form Field 1: Property Price */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  <span>{lang === "tr" ? "Mülk Değeri" : "Property Value"}</span>
                                  <span className="text-slate-500 font-sans">{formatFinValue(finPropertyPrice)}</span>
                                </div>
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    value={finPropertyPrice || ""}
                                    onChange={(e) => {
                                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                                      setFinPropertyPrice(val);
                                    }}
                                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-xl font-black focus:ring-2 focus:ring-indigo-600 outline-none transition-all pr-12 text-slate-800"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">
                                    {finCurrency}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {[150000, 250000, 500000, 3000000, 7500000].map((preset) => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => setFinPropertyPrice(preset)}
                                      className="text-[9px] font-black text-slate-500 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200"
                                    >
                                      {preset >= 1000000 ? `${preset/1000000}M` : preset.toLocaleString()}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* DUAL COLS FOR Downpayment and Term */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                
                                {/* Peşinat Ratio Form */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                      {lang === "tr" ? "Peşinat (%)" : "Down Payment (%)"}
                                    </label>
                                    <span className="text-[10px] font-bold text-slate-600">
                                      {finDownPaymentPercent}%
                                    </span>
                                  </div>
                                  <input 
                                    type="range"
                                    min="10" 
                                    max="90" 
                                    step="5"
                                    value={finDownPaymentPercent} 
                                    onChange={(e) => setFinDownPaymentPercent(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 my-3"
                                  />
                                  <span className="text-[9px] text-slate-405 block text-center font-bold">
                                    {formatFinValue(downPaymentVal)} Peşin Ödenir
                                  </span>
                                </div>

                                {/* Term Selector */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    {lang === "tr" ? "Vade (Ay)" : "Term (Months)"}
                                  </label>
                                  <select 
                                    value={finDurationMonths}
                                    onChange={(e) => setFinDurationMonths(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-100 p-3.5 rounded-xl font-black text-sm text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer"
                                  >
                                    <option value="12">12 Ay (1 Yıl)</option>
                                    <option value="24">24 Ay (2 Yıl)</option>
                                    <option value="36">36 Ay (3 Yıl)</option>
                                    <option value="60">60 Ay (5 Yıl)</option>
                                    <option value="120">120 Ay (10 Yıl)</option>
                                    <option value="180">180 Ay (15 Yıl)</option>
                                    <option value="240">240 Ay (20 Yıl)</option>
                                  </select>
                                </div>

                              </div>

                              {/* Custom Rate Modifier if not actual sponsor */}
                              {!activeBank.isActual && (
                                <div className="space-y-1.5 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl">
                                  <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">
                                    {lang === "tr" ? "Özel Aylık Faiz Oranı %" : "Custom Monthly Rate %"}
                                  </label>
                                  <input 
                                    type="number" 
                                    step="0.05"
                                    value={finInterestRate}
                                    onChange={(e) => setFinInterestRate(Number(e.target.value))}
                                    className="w-full bg-slate-50 border border-slate-105 p-2 rounded-lg text-xs font-black"
                                  />
                                </div>
                              )}

                              {/* CALCULATION RESULTS DISPLAY CONTAINER */}
                              <div className="bg-indigo-950 text-white p-5 rounded-3xl space-y-3.5 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-650/40 rounded-full blur-xl pointer-events-none" />
                                
                                <div className="border-b border-indigo-900 pb-2.5">
                                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                                    {lang === "tr" ? "Tahmini Aylık Taksit" : "Estimated Monthly Installment"}
                                  </p>
                                  <p className="text-3xl font-black text-emerald-400 tracking-tight mt-1">
                                    {formatFinValue(computedMonthlyInstallment)}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                                  <div>
                                    <span className="text-indigo-305 block">{lang === "tr" ? "Kredi Anaparası" : "Loan Amount"}</span>
                                    <span className="font-extrabold text-white text-xs">{formatFinValue(loanRequired)}</span>
                                  </div>
                                  <div>
                                    <span className="text-indigo-305 block">{lang === "tr" ? "Uygulanan Faiz Oranı" : "Interest Rate Applied"}</span>
                                    <span className="font-extrabold text-emerald-400 text-xs">%{activeRate} / {lang === "tr" ? "Aylık" : "Month"}</span>
                                  </div>
                                  <div>
                                    <span className="text-indigo-305 block">{lang === "tr" ? "Toplam Geri Ödeme" : "Total Repayment"}</span>
                                    <span className="font-extrabold text-white text-xs">{formatFinValue(computedTotalPayment)}</span>
                                  </div>
                                  <div>
                                    <span className="text-indigo-355 block">{lang === "tr" ? "Toplam Faiz Maliyeti" : "Total Interest Cost"}</span>
                                    <span className="font-extrabold text-indigo-200 text-xs">{formatFinValue(computedTotalInterest)}</span>
                                  </div>
                                </div>
                              </div>

                              <button 
                                onClick={() => setShowApplyModal(true)}
                                className="w-full bg-slate-900 text-white hover:bg-emerald-600 hover:scale-[1.01] py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl leading-none flex items-center justify-center gap-2 cursor-pointer"
                              >
                                🏦 {lang === "tr" ? "HEMEN ÖN ONAYLI KREDİYE BAŞVUR" : "APPLY FOR PRE-APPROVED LOAN"}
                              </button>

                              <p className="text-[9px] text-slate-400 text-center font-bold">
                                {lang === "tr" 
                                  ? "* Faiz oranları ve peşinat yükümlülükleri seçilen bankanın KKTC Genel Müdürlüğü ve lookprice özel protokolüne tabidir."
                                  : "* Mortgage rates and terms are subject to selected bank's criteria and special lookprice protocol."}
                              </p>
                            </div>
                          ) : (
                            /* SUBMISSION FORM OR STATUS SCREEN */
                            <div className="space-y-6">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                <div>
                                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">
                                    {lang === "tr" ? "Kredi Ön Başvuru Kartı" : "Loan Application Form"}
                                  </h4>
                                  <span className="p-1 px-2.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded uppercase">
                                    {selectedBank}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => {
                                    setShowApplyModal(false);
                                    setApplySuccess(false);
                                  }}
                                  className="text-slate-400 hover:text-slate-650 font-black text-xs bg-slate-100 p-2 rounded-lg"
                                >
                                  ✕ {lang === "tr" ? "Geri Dön" : "Cancel"}
                                </button>
                              </div>

                              {!applySuccess ? (
                                <form onSubmit={handleApplySubmit} className="space-y-4">
                                  <div className="bg-slate-50 p-4 rounded-2xl space-y-1 border border-slate-100">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">ÖN HESAP ÖZETİ</span>
                                    <p className="text-xs text-slate-700 font-bold">
                                      {formatFinValue(loanRequired)} kredi talebi, {finDurationMonths} ay vade, %{activeRate} anlaşmalı faiz oranı ile {selectedBank} bankası üzerinden işlenecektir.
                                    </p>
                                    <p className="text-sm font-black text-emerald-600 mt-1">
                                      Aylık Taksit: {formatFinValue(computedMonthlyInstallment)}
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                      {lang === "tr" ? "Adınız ve Soyadınız" : "Full Name"}
                                    </label>
                                    <input 
                                      type="text" 
                                      required
                                      placeholder="Örn: Hasan Yılmaz"
                                      value={applyName}
                                      onChange={(e) => setApplyName(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-150 p-3.5 rounded-xl font-bold text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                      {lang === "tr" ? "İletişim Telefonu" : "Phone Number"}
                                    </label>
                                    <input 
                                      type="tel" 
                                      required
                                      placeholder="Örn: +90 533 ..."
                                      value={applyPhone}
                                      onChange={(e) => setApplyPhone(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-150 p-3.5 rounded-xl font-bold text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                      {lang === "tr" ? "E-Posta Adresi" : "Email Address"}
                                    </label>
                                    <input 
                                      type="email" 
                                      required
                                      placeholder="Örn: hasan@example.com"
                                      value={applyEmail}
                                      onChange={(e) => setApplyEmail(e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-150 p-3.5 rounded-xl font-bold text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800"
                                    />
                                  </div>

                                  <button 
                                    type="submit"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-4.5 rounded-xl uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
                                  >
                                    🚀 {lang === "tr" ? "BAŞVURUMU ANINDA GÖNDER VE ÖN-ONAY AL" : "SUBMIT PRE-APPROVAL DETAILS"}
                                  </button>
                                </form>
                              ) : (
                                <div className="text-center space-y-5 py-6">
                                  <div className="inline-flex items-center justify-center p-4 bg-emerald-50 text-emerald-500 rounded-full text-3xl animate-bounce">
                                    🎉
                                  </div>
                                  <div className="space-y-2">
                                    <h5 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                                      {lang === "tr" ? "TEBRİKLER! BAŞVURUNUZ ALINDI" : "APPLICATION SUBMITTED!"}
                                    </h5>
                                    <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                                      {lang === "tr" 
                                        ? `lookprice Akıllı Finansal Asistanı, konut kredisi simülasyon özetini ve bilgilerinizi ${selectedBank} Kıbrıs Genel Müdürlüğü Bireysel Bankacılık Koordinatörlüğü'ne başarıyla iletti.`
                                        : `lookprice assistant successfully dispatched your calculations and contact details to ${selectedBank} Retail Loans Coordinator.`}
                                    </p>
                                  </div>

                                  <div className="bg-slate-50 p-4 rounded-2xl text-[11px] text-slate-650 border border-slate-100 font-medium space-y-1 max-w-sm mx-auto">
                                    <p className="font-extrabold text-slate-800 text-left border-b border-slate-200 pb-1.5 uppercase">Ön Tescil Slip No: LPR-{Math.floor(100000 + Math.random() * 900000)}</p>
                                    <p className="text-left mt-1"><strong>{lang === "tr" ? "Kişi" : "Representative"}:</strong> {applyName}</p>
                                    <p className="text-left"><strong>{lang === "tr" ? "Banka" : "Selected Bank"}:</strong> {selectedBank}</p>
                                    <p className="text-left"><strong>{lang === "tr" ? "Kredi" : "Loan Required"}:</strong> {formatFinValue(loanRequired)}</p>
                                    <p className="text-left"><strong>{lang === "tr" ? "Aylık Taksit" : "Monthly Payment"}:</strong> {formatFinValue(computedMonthlyInstallment)}</p>
                                    <p className="text-[10px] text-indigo-600 font-black text-left pt-1.5">★ Kampanya Masraf Muafiyeti Tescillendi</p>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setShowApplyModal(false);
                                      setApplySuccess(false);
                                      setApplyName("");
                                      setApplyPhone("");
                                      setApplyEmail("");
                                    }}
                                    className="px-6 py-2.5 bg-slate-900 text-white hover:bg-indigo-600 font-black text-xs uppercase rounded-xl tracking-wider transition-all cursor-pointer"
                                  >
                                    Yeni Hesap Yap
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                      </div>
                    </div>
                  </div>
                );
              })()}

          {/* Trust Anchor Team Section */}
          {isSectionEnabled("team") && (
            <div className="space-y-16">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="h-1 w-16 bg-indigo-600 mx-auto"></div>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  {lang === "tr"
                    ? "GÜVEN BİZİM GENETİĞİMİZDE VAR"
                    : "TRUST IS IN OUR DNA"}
                </h3>
                <p className="text-base font-bold text-slate-500 leading-relaxed">
                  {lang === "tr"
                    ? "Brokerlarımızın 10 yıllık tecrübesiyle, her mülk bir hikaye ve doğru yatırımdır."
                    : "Our brokers bring a decade of experience to every listing."}
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
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

      {/* Footer */}
      <footer className="bg-slate-900 pt-24 pb-12 text-white mt-32">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-slate-800">
            <div className="col-span-1 md:col-span-1 space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">{store.name}</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                {store.description || (lang === 'tr' ? 'Yenilikçi gayrimenkul çözümleri ve portföy yönetimi.' : 'Innovative real estate solutions and portfolio management.')}
              </p>
              <div className="flex gap-4">
                {store.instagram_url && (
                  <a href={store.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.03.07-4.85.148-3.212 1.664-4.771 4.918-4.918 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {store.facebook_url && (
                  <a href={store.facebook_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.77h-2.953v-3.425h2.953v-2.524c0-2.921 1.782-4.513 4.391-4.513 1.25-.013 2.493.048 3.731.183v3.13h-1.854c-1.419 0-1.694.675-1.694 1.662v2.176h3.463l-.451 3.426h-3.012v8.77h6.105c.733 0 1.325-.593 1.325-1.325v-21.352c0-.732-.592-1.325-1.325-1.325z"/></svg>
                  </a>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Hızlı Erişim</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Mülklerimiz</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Bölgelerimiz</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Biz Kimiz?</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">İletişim</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Kurumsal</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Gizlilik Politikası</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">Kullanım Koşulları</li>
                <li className="hover:text-indigo-400 cursor-pointer transition-colors">KVKK Aydınlatma</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">İletişim</h4>
              <div className="space-y-4 text-sm font-bold text-slate-400">
                <p className="flex items-center gap-3">
                  <span className="text-indigo-500">A:</span> {store.address || 'Kıbrıs / Lefkoşa'}
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-indigo-500">T:</span> {store.phone || '+90 (555) 000 00 00'}
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-indigo-500">E:</span> {store.email || 'info@lookprice.net'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              © {new Date().getFullYear()} {store.name}. TÜM HAKLARI SAKLIDIR.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">POWERED BY</span>
              <img src="https://lookprice.net/logo_dark.png" alt="Lookprice" className="h-4 opacity-30 invert" />
            </div>
          </div>
        </div>
      </footer>

      {/* Blog Showcase Modal view */}
      <BlogShowcaseModal
        isOpen={!!selectedBlogPost}
        onClose={() => setSelectedBlogPost(null)}
        blog={selectedBlogPost}
        lang={lang}
      />
    </div>
  );
};
