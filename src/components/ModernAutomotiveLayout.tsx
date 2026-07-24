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
  Share2,
  Search,
  ChevronRight,
} from "lucide-react";
import { Store, Product } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";
import { RadarShowcaseSlider } from "./RadarShowcaseSlider";
import { BlogShowcaseModal } from "./BlogShowcaseModal";
import { StoreMapSection } from "./StoreMapSection";
import { AutomotiveSocialMediaShareModal } from "./AutomotiveSocialMediaShareModal";

interface ModernAutomotiveLayoutProps {
  store: Store;
  products: Product[];
  radarNews?: any[];
  onViewProduct: (product: Product) => void;
}

export const ModernAutomotiveLayout: React.FC<ModernAutomotiveLayoutProps> = ({
  store,
  products,
  radarNews = [],
  onViewProduct,
}) => {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  // Vehicle-specific share modal state
  const [shareProduct, setShareProduct] = useState<Product | null>(null);

  const { lang } = useLanguage();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selectedBlogPost, setSelectedBlogPost] = useState<any>(null);
  const [activeContentMap, setActiveContentMap] = useState<{ title: string; content: string } | null>(null);

  // Active filters states
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeBrand, setActiveBrand] = useState<string>("all");
  const [activeModel, setActiveModel] = useState<string>("all");
  const [activeBudget, setActiveBudget] = useState<string>("all");
  const [activeYear, setActiveYear] = useState<string>("all");
  const [activeFuel, setActiveFuel] = useState<string>("all");
  const [activeTransmission, setActiveTransmission] = useState<string>("all");

  // Pending filter states
  const [pendingCategory, setPendingCategory] = useState<string>("all");
  const [pendingBrand, setPendingBrand] = useState<string>("all");
  const [pendingModel, setPendingModel] = useState<string>("all");
  const [pendingBudget, setPendingBudget] = useState<string>("all");
  const [pendingYear, setPendingYear] = useState<string>("all");
  const [pendingFuel, setPendingFuel] = useState<string>("all");
  const [pendingTransmission, setPendingTransmission] = useState<string>("all");

  const categories = React.useMemo(() => {
    const list = products.map(p => {
      return (p.sector_data?.category || (p as any).sub_sector || p.category || "").toLowerCase();
    }).filter(Boolean);
    return Array.from(new Set(list));
  }, [products]);

  // Filter options derived from vehicle product list
  const brands = React.useMemo(() => {
    let filtered = products;
    if (pendingCategory !== "all") {
      filtered = products.filter(p => {
        const pCat = String(p.sector_data?.category || (p as any).sub_sector || p.category || "").toLowerCase();
        return pCat === pendingCategory.toLowerCase();
      });
    }
    const list = filtered.map(p => {
      return p.brand || p.sector_data?.brand || p.sector_data?.brand_name || (p as any).brand;
    }).filter(Boolean);
    return Array.from(new Set(list)).sort((a: any, b: any) => a.localeCompare(b));
  }, [products, pendingCategory]);

  const models = React.useMemo(() => {
    let filtered = products;
    if (pendingCategory !== "all") {
      filtered = filtered.filter(p => {
        const pCat = String(p.sector_data?.category || (p as any).sub_sector || p.category || "").toLowerCase();
        return pCat === pendingCategory.toLowerCase();
      });
    }
    if (pendingBrand !== "all") {
      filtered = filtered.filter(p => {
        const pBrand = String(p.brand || p.sector_data?.brand || p.sector_data?.brand_name || (p as any).brand || "").toLowerCase();
        return pBrand === pendingBrand.toLowerCase();
      });
    }
    const list = filtered.map(p => {
      return p.sector_data?.model || p.sector_data?.model_name || p.sector_data?.series || (p as any).model;
    }).filter(Boolean);
    return Array.from(new Set(list)).sort((a: any, b: any) => a.localeCompare(b));
  }, [products, pendingCategory, pendingBrand]);

  React.useEffect(() => {
    if (pendingBrand !== "all" && !brands.includes(pendingBrand)) {
      setPendingBrand("all");
    }
  }, [brands, pendingBrand]);

  React.useEffect(() => {
    if (pendingModel !== "all" && !models.includes(pendingModel as any)) {
      setPendingModel("all");
    }
  }, [models, pendingModel]);

  const yearsOptions = React.useMemo(() => {
    const list = products.map(p => {
      return (p.sector_data?.year || (p as any).year || "").toString();
    }).filter(Boolean);
    return Array.from(new Set(list)).sort((a: any, b: any) => Number(b) - Number(a));
  }, [products]);

  const budgetSpecs = React.useMemo(() => {
    const maxVal = Math.max(...products.map(p => p.price || 0), 0);
    const isLiraScale = maxVal > 1500000;
    
    if (isLiraScale) {
      return {
        isLira: true,
        ranges: [
          { value: "all", label: lang === "tr" ? "Tümü" : "All" },
          { value: "0-1000000", label: lang === "tr" ? "1.0M TL Altı" : "Under 1.0M TL" },
          { value: "1000000-2000000", label: "1.0M - 2.0M TL" },
          { value: "2000000-4000000", label: "2.0M - 4.0M TL" },
          { value: "4000000-8000000", label: "4.0M - 8.0M TL" },
          { value: "8000000+", label: lang === "tr" ? "8.0M TL Üstü" : "Over 8.0M TL" },
        ]
      };
    } else {
      return {
        isLira: false,
        ranges: [
          { value: "all", label: lang === "tr" ? "Tümü" : "All" },
          { value: "0-30000", label: lang === "tr" ? "€30,000 Altı" : "Under €30k" },
          { value: "30000-60000", label: "€30k - €60k" },
          { value: "60000-120000", label: "€60k - €120k" },
          { value: "120000-250000", label: "€120k - €250k" },
          { value: "250000+", label: lang === "tr" ? "€250,000 Üstü" : "Over €250k" },
        ]
      };
    }
  }, [products, lang]);

  // Filter implementation
  const filteredProducts = React.useMemo(() => {
    return products.filter(p => {
      // 0. Category match
      if (activeCategory !== "all") {
        const pCat = (p.sector_data?.category || (p as any).sub_sector || p.category || "").toLowerCase();
        if (pCat !== activeCategory.toLowerCase()) return false;
      }
      // 1. Brand match
      if (activeBrand !== "all") {
        const pBrand = String(p.brand || p.sector_data?.brand || p.sector_data?.brand_name || (p as any).brand || "").toLowerCase();
        if (pBrand !== activeBrand.toLowerCase()) {
          return false;
        }
      }
      // 2. Model match
      if (activeModel !== "all") {
        const pModel = String(p.sector_data?.model || p.sector_data?.model_name || p.sector_data?.series || (p as any).model || "").toLowerCase();
        if (pModel !== activeModel.toLowerCase()) {
          return false;
        }
      }
      // 3. Year match
      if (activeYear !== "all") {
        const pYear = (p.sector_data?.year || (p as any).year || "").toString();
        if (pYear !== activeYear) {
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
      // 5. Fuel match
      if (activeFuel !== "all") {
        const pFuel = String(p.sector_data?.fuel || p.sector_data?.fuel_type || (p as any).fuel || "").toLowerCase();
        if (pFuel !== activeFuel.toLowerCase()) return false;
      }
      // 6. Transmission match
      if (activeTransmission !== "all") {
        const pTrans = String(p.sector_data?.transmission || (p as any).transmission || "").toLowerCase();
        if (pTrans !== activeTransmission.toLowerCase()) return false;
      }
      return true;
    });
  }, [products, activeCategory, activeBrand, activeModel, activeYear, activeBudget, activeFuel, activeTransmission]);

  const handleSearchTrigger = () => {
    setActiveCategory(pendingCategory);
    setActiveBrand(pendingBrand);
    setActiveModel(pendingModel);
    setActiveBudget(pendingBudget);
    setActiveYear(pendingYear);
    setActiveFuel(pendingFuel);
    setActiveTransmission(pendingTransmission);
    setIsMobileFiltersOpen(false);
    
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
          : store.consultants && store.consultants.length > 0
            ? store.consultants
            : [];

  const team = teamSource.length > 0
    ? teamSource.map((c: any, idx: number) => ({
        id: c.id?.toString() || `member_${idx}`,
        name: c.name || "Satış Temsilcisi",
        role: c.role || "Danışman",
        image: c.image || c.image_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
      }))
    : [
    {
      id: "1",
      name: store.name || "Mağaza Yöneticisi",
      role: "Genel Müdür",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
    },
  ];

  const content = {
    hero: {
      title: store.name?.toUpperCase() || (lang === "tr" ? "SEÇKİN TAŞIT PORTFÖYÜ" : "ELITE AUTOMOTIVE PORTFOLIO"),
      subtitle: store.description || (lang === "tr" ? "Lüks araç ve prestijli motorlu taşıt portföyleriyle güvendesiniz." : "Delightful range of select luxury and condition-focused vehicles."),
      bgImage: ((store as any).page_layout && typeof (store as any).page_layout === 'object' && !Array.isArray((store as any).page_layout) && ((store as any).page_layout as any).hero_image_url) || store.hero_image_url || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=2000&q=80",
    },
    stats: [
      { value: "1.2B₺", label: lang === "tr" ? "İşlem Hacmi" : "Transaction Volume" },
      { value: products.length.toString(), label: lang === "tr" ? "Aktif Araç" : "Active Vehicles" },
      { value: "15+", label: lang === "tr" ? "Yıllık Güven" : "Years of Trust" },
    ],
    trustSlogan: (store as any).slogan || (lang === "tr" ? "PRESTİJ VE GÜVEN" : "PRESTIGE & CONFIDENCE"),
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
    // Flexible matching for news/radar section IDs
    const section = layoutConfig.sections.find((s: any) => 
      s.id === sectionId || 
      s.type === sectionId ||
      (sectionId === 'news' && (s.id === 'radar' || s.id === 'radarNews' || s.id === 'radar_news' || s.type === 'radar' || s.type === 'radarNews' || s.type === 'radar_news')) ||
      (sectionId === 'radar' && (s.id === 'news' || s.type === 'news'))
    );
    if (section === undefined) return true; // Default to true if not found in custom configuration layout list
    return section.enabled !== false && section.enabled !== "false";
  };

  const [visibleCount, setVisibleCount] = useState(layoutConfig.count || 21);

  useEffect(() => {
    setVisibleCount(layoutConfig.count || 21);
  }, [layoutConfig.count]);

  const handleLinkClick = (e: React.MouseEvent, link: any) => {
    // Standard link click handler
  };

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
          <a href="#portfolio" className="text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white cursor-pointer transition-colors shadow-sm">{lang === 'tr' ? 'PRESTİJLİ GALERİ' : 'PRESTIGE GALLERY'}</a>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer ml-2">MENU</div>
        </div>
        <div className="md:hidden">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer">MENU</div>
        </div>
      </div>

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
                return "Seçkin Otomotiv";
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
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-[12px] font-black text-emerald-300 uppercase tracking-widest">
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
                  {(activeSlide as any).button_text && (
                    <a
                      href={(activeSlide as any).button_link || "#portfolio"}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105"
                    >
                      {(activeSlide as any).button_text}
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
        {/* Advanced Search Strip for Automotive */}
        {isSectionEnabled("search") && (
          <div className="-mt-12 relative z-30 w-full mb-12 md:mb-24">
            {/* Mobile Filter Button */}
            <div className="md:hidden flex justify-center w-full relative z-40">
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 font-black tracking-widest text-xs uppercase"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {lang === "tr" ? "Araç Filtrele" : "Filter Vehicles"}
                </button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:grid bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl grid-cols-7 gap-4">
              {["CATEGORY", "BRAND", "MODEL", "BUDGET", "YEAR", "FUEL", "TRANSMISSION"].map((filt, idx) => {
                let displayTitle = filt;
                let value = "all";
                let onChange = (v: string) => {};
                let options: { value: string; label: string }[] = [];

                if (filt === "CATEGORY") {
                  displayTitle = lang === "tr" ? "ARAÇ TİPİ" : "VEHICLE TYPE";
                  value = pendingCategory;
                  onChange = setPendingCategory;
                  options = [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...categories.map(v => {
                      const lowerV = String(v).toLowerCase();
                      return { 
                        value: String(v), 
                        label: lowerV === 'otomobil' ? (lang === 'tr' ? 'Otomobil' : 'Car') :
                               lowerV === 'hafif_ticari' ? (lang === 'tr' ? 'Hafif Ticari' : 'Light Commercial') :
                               lowerV === 'suv' ? (lang === 'tr' ? 'SUV / Arazi' : 'SUV / Off-Road') :
                               lowerV === 'pickup' ? (lang === 'tr' ? 'Pick-up' : 'Pick-up') : String(v)
                      };
                    })
                  ];
                } else if (filt === "BRAND") {
                  displayTitle = lang === "tr" ? "MARKA" : "BRAND";
                  value = pendingBrand;
                  onChange = setPendingBrand;
                  options = [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...brands.map(v => ({ value: String(v), label: String(v) }))
                  ];
                } else if (filt === "MODEL") {
                  displayTitle = lang === "tr" ? "MODEL" : "MODEL";
                  value = pendingModel;
                  onChange = setPendingModel;
                  options = [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...models.map(v => ({ value: String(v), label: String(v) }))
                  ];
                } else if (filt === "BUDGET") {
                  displayTitle = lang === "tr" ? "BÜTÇE" : "BUDGET";
                  value = pendingBudget;
                  onChange = setPendingBudget;
                  options = budgetSpecs.ranges;
                } else if (filt === "YEAR") {
                  displayTitle = lang === "tr" ? "MODEL YILI" : "YEAR";
                  value = pendingYear;
                  onChange = setPendingYear;
                  options = [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...yearsOptions.map(v => ({ value: String(v), label: String(v) }))
                  ];
                } else if (filt === "FUEL") {
                  displayTitle = lang === "tr" ? "YAKIT" : "FUEL";
                  value = pendingFuel;
                  onChange = setPendingFuel;
                  options = [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    { value: "gasoline", label: lang === "tr" ? "Benzin" : "Gasoline" },
                    { value: "diesel", label: lang === "tr" ? "Dizel" : "Diesel" },
                    { value: "hybrid", label: lang === "tr" ? "Hibrit" : "Hybrid" },
                    { value: "electric", label: lang === "tr" ? "Elektrikli" : "Electric" },
                  ];
                } else if (filt === "TRANSMISSION") {
                  displayTitle = lang === "tr" ? "VİTES" : "TRANS.";
                  value = pendingTransmission;
                  onChange = setPendingTransmission;
                  options = [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    { value: "manual", label: lang === "tr" ? "Manuel" : "Manual" },
                    { value: "automatic", label: lang === "tr" ? "Otomatik" : "Automatic" },
                    { value: "semi_automatic", label: lang === "tr" ? "Yarı Otomatik" : "Semi-Auto" },
                  ];
                }

                return (
                  <div
                    key={filt}
                    className={`group relative ${idx < 6 ? "md:border-r border-slate-200" : ""} px-2 flex flex-col justify-center`}
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
                      <SlidersHorizontal className="absolute right-2 h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors pointer-events-none" />
                    </div>
                  </div>
                );
              })}
              <button 
                onClick={handleSearchTrigger}
                className="col-span-1 md:col-span-7 bg-slate-900 text-white py-4 rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] mt-2 hover:bg-amber-600 transition-all shadow-xl shadow-slate-200 cursor-pointer"
              >
                {lang === "tr" ? "HAYALİNDEKİ ARACI BUL" : "FIND YOUR VEHICLE"}
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
                  <div className="h-1 w-8 bg-amber-500 mx-auto mb-4 rounded-full"></div>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
                    {st.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Portfolio Grid Selector */}
          {isSectionEnabled("portfolio") && (
            <div id="listings-section" className="space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-8 gap-4">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
                    {lang === "tr" ? "GALERİMİZ VE ARAÇLARIMIZ" : "OUR VEHICLES"}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-1 w-12 bg-amber-500 rounded-full"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {lang === "tr" ? "PRESTİJLİ MOTORLU TAŞITLAR" : "SELECT AUTO COLLECTION"}
                    </p>
                  </div>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    {lang === "tr" ? "Aramanıza uygun araç bulunamadı." : "No matching vehicles found."}
                  </p>
                </div>
              ) : (
                <div className={`grid gap-10 ${layoutConfig.grid === 'masonry' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                  {filteredProducts.slice(0, visibleCount).map((p, i) => {
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
                              backgroundImage: `url(${p.image_url || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000"})`,
                            }}
                          ></div>
                          <div className="absolute top-6 left-6 flex gap-2">
                            <span className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                              {p.sector_data?.year || (p as any).year || "2024"} MODEL
                            </span>
                          </div>
                          <div className="absolute top-6 right-6 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareProduct(p);
                              }}
                              className="p-2.5 bg-white/95 backdrop-blur-md hover:bg-amber-100 rounded-xl text-slate-800 hover:text-amber-600 transition-all shadow-md active:scale-95 flex items-center justify-center border border-slate-100/50"
                              title={lang === "tr" ? "Paylaş" : "Share"}
                            >
                              <Share2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-8 space-y-3 px-6 pb-8">
                          <div className="flex items-center justify-between gap-2 text-[10px] font-black tracking-wider uppercase text-slate-400">
                            <span className="font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 font-bold">
                              #{p.reference_no || p.id}
                            </span>
                            <span>
                              {p.sector_data?.brand || (p as any).brand || "CAR"}
                            </span>
                          </div>

                          <h4 className="text-[14px] md:text-[15px] font-extrabold tracking-tight text-slate-900 uppercase group-hover:text-amber-500 transition-colors leading-snug line-clamp-2 min-h-[40px] flex items-center">
                            {p.name}
                          </h4>

                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-100/80">
                            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                            <span className="truncate">
                              {p.location || (lang === 'tr' ? 'Lefkoşa' : 'Nicosia')}
                            </span>
                          </div>

                          {/* Vehicle Specific Details row */}
                          <div className="flex flex-wrap gap-2 py-1.5 border-y border-slate-100 text-[10px] font-bold text-slate-600">
                            {(p.sector_data?.brand || (p as any).brand) && (
                              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">🚗 {p.sector_data?.brand || (p as any).brand}</span>
                            )}
                            {(p.sector_data?.model || (p as any).model) && (
                              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">⚙️ {p.sector_data?.model || (p as any).model}</span>
                            )}
                            {(p.sector_data?.transmission || (p as any).transmission) && (
                              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">⚡ {(() => {
                                const trans = String(p.sector_data?.transmission || (p as any).transmission).toLowerCase();
                                if (trans === 'automatic') return lang === 'tr' ? 'Otomatik' : 'Automatic';
                                if (trans === 'manual') return lang === 'tr' ? 'Manuel' : 'Manual';
                                if (trans === 'semi-automatic' || trans === 'triptonic') return lang === 'tr' ? 'Yarı-Otomatik' : 'Semi-Automatic';
                                return trans.toUpperCase();
                              })()}</span>
                            )}
                            {(p.sector_data?.fuel || p.sector_data?.fuel_type || (p as any).fuel) && (
                              <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">⛽ {(() => {
                                const fuel = String(p.sector_data?.fuel || p.sector_data?.fuel_type || (p as any).fuel).toLowerCase();
                                if (fuel === 'gasoline' || fuel === 'petrol') return lang === 'tr' ? 'Benzin' : 'Gasoline';
                                if (fuel === 'diesel') return lang === 'tr' ? 'Dizel' : 'Diesel';
                                if (fuel === 'hybrid') return lang === 'tr' ? 'Hibrit' : 'Hybrid';
                                if (fuel === 'electric') return lang === 'tr' ? 'Elektrikli' : 'Electric';
                                return fuel.toUpperCase();
                              })()}</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                             <p className="text-xl font-black text-amber-600 tracking-tight">
                                {priceStr}
                             </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {filteredProducts.length > visibleCount && (
                <div className="mt-16 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="px-8 py-3 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 hover:-translate-y-1"
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
              sector="automotive"
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
                    <div className="h-1 w-12 bg-amber-500 rounded-full"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                      {lang === "tr" ? "Otomotiv Gelişmeleri" : "Auto Industry Insights"}
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
                        src={blog.cover_image || "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        alt={blog.title}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(blog.created_at || "").toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </p>
                      <h4 className="text-lg font-black text-slate-900 group-hover:text-amber-500 transition-colors uppercase tracking-tight leading-snug line-clamp-2">
                        {blog.title}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Segment */}
          {isSectionEnabled("team") && (
            <div className="space-y-16">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="h-1 w-16 bg-amber-500 mx-auto"></div>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                  {lang === "tr" ? "HIZMET VE GÜVEN" : "SERVICE & CONFIDENCE"}
                </h3>
                <p className="text-base font-bold text-slate-500 leading-relaxed">
                  {lang === "tr"
                    ? "Satış temsilcilerimizle hayalinizdeki araca güvenli yoldan ulaşın."
                    : "Enabling you to reach your select condition vehicle with complete safety."}
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

      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-24">
        <StoreMapSection store={store} />
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 pt-24 pb-12 text-white mt-32">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12 sm:gap-8 pb-16 border-b border-slate-800 items-start">
            <div className="col-span-1 md:col-span-1 flex flex-col justify-center min-h-[140px] h-full">
              {store.logo_url ? (
                <img src={store.logo_url} className="h-28 md:h-36 lg:h-40 w-auto max-w-full object-contain filter drop-shadow-[0_4px_24px_rgba(255,255,255,0.08)] align-middle self-start" alt={store.name} />
              ) : (
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">{store.name}</h2>
              )}
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{lang === 'tr' ? 'SOSYAL MEDYA' : 'SOCIAL MEDIA'}</h4>
              <div className="flex gap-4 pt-2 flex-wrap">
                {store.facebook_url && (
                  <a href={store.facebook_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:scale-105 duration-300">
                    <Facebook className="w-5 h-5" />
                  </a>
                )}
                {store.twitter_url && (
                  <a href={store.twitter_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:scale-105 duration-300">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {store.instagram_url && (
                  <a href={store.instagram_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:scale-105 duration-300">
                    <Instagram className="w-5 h-5" />
                  </a>
                )}
                {store.youtube_url && (
                  <a href={store.youtube_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:scale-105 duration-300">
                    <Youtube className="w-5 h-5" />
                  </a>
                )}
                {store.linkedin_url && (
                  <a href={store.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:scale-105 duration-300">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {layoutConfig.quickLinks && layoutConfig.quickLinks.length > 0 && (
              <div className="space-y-6 flex-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{lang === 'tr' ? 'Hızlı Erişim' : 'Quick Links'}</h4>
                <ul className="space-y-4 text-sm font-bold text-slate-400">
                  {layoutConfig.quickLinks.map((link: any, idx: number) => {
                    // Robust case-insensitive mapping for automotive websites
                    let label = link.label;
                    const lowerLabel = (label || "").toLowerCase();
                    if (lowerLabel.includes("mülklerimiz") || lowerLabel.includes("portföyümüz") || lowerLabel.includes("emlak")) {
                      label = lang === 'tr' ? "Araçlarımız" : "Our Vehicles";
                    } else if (lowerLabel.includes("bölgelerimiz")) {
                      label = lang === 'tr' ? "Şubelerimiz" : "Our Branches";
                    }

                    return (
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
                          setActiveContentMap({ title: label, content: link.content });
                        }
                      }} 
                      className="hover:text-amber-400 cursor-pointer transition-colors"
                    >
                      {label}
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {layoutConfig.corporateLinks && layoutConfig.corporateLinks.length > 0 && (
              <div className="space-y-6 flex-1">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{lang === 'tr' ? 'Kurumsal' : 'Corporate'}</h4>
                <ul className="space-y-4 text-sm font-bold text-slate-400">
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
                      className="hover:text-amber-400 cursor-pointer transition-colors"
                    >
                      {link.label}
                    </li>
                   ))}
                </ul>
              </div>
            )}

            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{lang === 'tr' ? 'İletişim' : 'Contact'}</h4>
              <div className="space-y-4 text-sm font-bold text-slate-400">
                {store.address && <p>{store.address}</p>}
                <p>T: {store.phone}</p>
                <p>E: {store.email}</p>
              </div>
            </div>
          </div>
          <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">
              © {new Date().getFullYear()} {store.name}. {lang === 'tr' ? 'TÜM HAKLARI SAKLIDIR.' : 'ALL RIGHTS RESERVED.'}
            </p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {lang === "tr" ? "ARAMA FİLTRELERİ" : "SEARCH FILTERS"}
                </h3>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-2 bg-slate-100 rounded-full text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8 pb-10">
                {[
                  { id: "CATEGORY", title: lang === "tr" ? "ARAÇ TİPİ" : "VEHICLE TYPE", value: pendingCategory, onChange: setPendingCategory, options: [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...categories.map(v => {
                      const lowerV = String(v).toLowerCase();
                      return { 
                        value: String(v), 
                        label: lowerV === 'otomobil' ? (lang === 'tr' ? 'Otomobil' : 'Car') :
                               lowerV === 'hafif_ticari' ? (lang === 'tr' ? 'Hafif Ticari' : 'Light Commercial') :
                               lowerV === 'suv' ? (lang === 'tr' ? 'SUV / Arazi' : 'SUV / Off-Road') :
                               lowerV === 'pickup' ? (lang === 'tr' ? 'Pick-up' : 'Pick-up') : String(v)
                      };
                    })
                  ]},
                  { id: "BRAND", title: lang === "tr" ? "MARKA" : "BRAND", value: pendingBrand, onChange: setPendingBrand, options: [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...brands.map(v => ({ value: String(v), label: String(v) }))
                  ]},
                  { id: "MODEL", title: lang === "tr" ? "MODEL" : "MODEL", value: pendingModel, onChange: setPendingModel, options: [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...models.map(v => ({ value: String(v), label: String(v) }))
                  ]},
                  { id: "YEAR", title: lang === "tr" ? "MODEL YILI" : "YEAR", value: pendingYear, onChange: setPendingYear, options: [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    ...yearsOptions.map(v => ({ value: String(v), label: String(v) }))
                  ]},
                  { id: "FUEL", title: lang === "tr" ? "YAKIT" : "FUEL", value: pendingFuel, onChange: setPendingFuel, options: [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    { value: "gasoline", label: lang === "tr" ? "Benzin" : "Gasoline" },
                    { value: "diesel", label: lang === "tr" ? "Dizel" : "Diesel" },
                    { value: "hybrid", label: lang === "tr" ? "Hibrit" : "Hybrid" },
                    { value: "electric", label: lang === "tr" ? "Elektrikli" : "Electric" },
                  ]},
                  { id: "TRANSMISSION", title: lang === "tr" ? "VİTES" : "TRANS.", value: pendingTransmission, onChange: setPendingTransmission, options: [
                    { value: "all", label: lang === "tr" ? "Tümü" : "All" },
                    { value: "manual", label: lang === "tr" ? "Manuel" : "Manual" },
                    { value: "automatic", label: lang === "tr" ? "Otomatik" : "Automatic" },
                    { value: "semi_automatic", label: lang === "tr" ? "Yarı Otomatik" : "Semi-Auto" },
                  ]},
                  { id: "BUDGET", title: lang === "tr" ? "BÜTÇE" : "BUDGET", value: pendingBudget, onChange: setPendingBudget, options: budgetSpecs.ranges },
                ].map((filt) => (
                  <div key={filt.id} className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 tracking-[0.2em]">
                      {filt.title}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {filt.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => filt.onChange(opt.value)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            filt.value === opt.value
                              ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSearchTrigger}
                  className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 active:scale-95 transition-all mt-4"
                >
                  {lang === "tr" ? "HAYALİNDEKİ ARACI BUL" : "FIND YOUR VEHICLE"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {shareProduct && (
        <AutomotiveSocialMediaShareModal
          isOpen={!!shareProduct}
          onClose={() => setShareProduct(null)}
          vehicle={shareProduct}
          branding={store}
        />
      )}

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
