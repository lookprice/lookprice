import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers,
  MapPin,
  MessageCircle,
  Play,
  Printer,
  Share2,
  ShieldCheck,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  UIVERSE_INTERACTION_PRESETS,
  UiversePresetId,
  ARCHITECTURAL_LORA_MODELS,
  resolveArchitecturalAssetUrl,
  sanitizeArchitecturalGalleryRecord
} from "./developer/UiverseAndLoraWebStudio";
import {
  getGoogleDrivePreviewUrl,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  isDirectVideoFileUrl,
  isRenderableImageUrl,
  isYouTubeUrl,
  resolveDisplayImageUrl
} from "./developer/developerProjectUtils";
import resortHeroSunlitAsset from "../assets/images/cyprus_sunlit_resort_hero_1794578840052.jpg";
import marinaLifestyleAsset from "../assets/images/cyprus_marina_lifestyle_1794578840217.jpg";
import penthouseInteriorSunlitAsset from "../assets/images/cyprus_penthouse_interior_1794578840887.jpg";
import masterplanAerialSunlitAsset from "../assets/images/cyprus_villa_masterplan_1794578840537.jpg";
import isometricFloorplanAsset from "../assets/images/lora_isometric_3d_floorplan_1794568366571.jpg";

export type DeveloperThemeId =
  | "mediterranean_resort"
  | "swiss_blueprint"
  | "monolith_obsidian"
  | "cinematic_pavilion";

export interface DeveloperThemeMeta {
  id: DeveloperThemeId;
  index: string;
  name: string;
  subtitle: string;
  inspiration: string;
  isDark: boolean;
  canvasBg: string;
  surfaceBg: string;
  cardBg: string;
  borderClass: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  headingFontClass: string;
}

export const DEVELOPER_ARCHITECTURAL_THEMES: Record<DeveloperThemeId, DeveloperThemeMeta> = {
  mediterranean_resort: {
    id: "mediterranean_resort",
    index: "01",
    name: "Akdeniz Sahil & Traverten (Parlak Vitrin)",
    subtitle: "Güneşli Doğal Taş, Deniz Mavisi & Şampanya Altın",
    inspiration: "Aydınlık Sahil Resort & Prestij Mimari Vitrini",
    isDark: false,
    canvasBg: "bg-[#FAF8F4]",
    surfaceBg: "bg-[#F2EFE8]",
    cardBg: "bg-white",
    borderClass: "border-stone-200",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-500",
    accentBg: "bg-slate-900 text-white hover:bg-slate-800",
    accentText: "text-[#9A7228]",
    accentBorder: "border-[#B68D40]/40",
    headingFontClass: "font-serif tracking-tight"
  },
  swiss_blueprint: {
    id: "swiss_blueprint",
    index: "02",
    name: "Kurumsal Mimari Izgara",
    subtitle: "Aydınlık Beyaz & Safir Mühendislik Vurgusu",
    inspiration: "Teknik Kesit, Net Çizgi & Aydınlık Galeri",
    isDark: false,
    canvasBg: "bg-white",
    surfaceBg: "bg-slate-50",
    cardBg: "bg-white",
    borderClass: "border-slate-200",
    textPrimary: "text-slate-900",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-500",
    accentBg: "bg-sky-700 text-white hover:bg-sky-800",
    accentText: "text-sky-700",
    accentBorder: "border-sky-300",
    headingFontClass: "font-sans tracking-tight"
  },
  monolith_obsidian: {
    id: "monolith_obsidian",
    index: "03",
    name: "Koyu Mermer & Altın Monolit",
    subtitle: "Gece Antrasit & Şampanya Altın",
    inspiration: "Gece Rezidans & Özel Yatırım Kulübü",
    isDark: true,
    canvasBg: "bg-[#090D16]",
    surfaceBg: "bg-[#0F1624]",
    cardBg: "bg-[#131C2E]",
    borderClass: "border-white/10",
    textPrimary: "text-white",
    textSecondary: "text-slate-200",
    textMuted: "text-slate-400",
    accentBg: "bg-[#C5A059] text-slate-950 hover:bg-[#d4b06a]",
    accentText: "text-[#C5A059]",
    accentBorder: "border-[#C5A059]/40",
    headingFontClass: "font-serif tracking-tight"
  },
  cinematic_pavilion: {
    id: "cinematic_pavilion",
    index: "04",
    name: "Sinematik Sahil Panoraması",
    subtitle: "Derin Kontrast & Zümrüt Kıyı Vurgusu",
    inspiration: "Sahne Geçişleri & Mekansal Deneyim",
    isDark: true,
    canvasBg: "bg-slate-950",
    surfaceBg: "bg-slate-900",
    cardBg: "bg-slate-900/95",
    borderClass: "border-slate-800",
    textPrimary: "text-white",
    textSecondary: "text-slate-200",
    textMuted: "text-slate-400",
    accentBg: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
    accentText: "text-emerald-400",
    accentBorder: "border-emerald-500/40",
    headingFontClass: "font-sans tracking-tight"
  }
};

type DisplayCurrency = "GBP" | "EUR" | "USD" | "TRY";

const CURRENCY_FX_APPROX: Record<DisplayCurrency, { symbol: string; rateFromGbp: number; label: string }> = {
  GBP: { symbol: "£", rateFromGbp: 1, label: "GBP (£)" },
  EUR: { symbol: "€", rateFromGbp: 1.18, label: "EUR (€)" },
  USD: { symbol: "$", rateFromGbp: 1.28, label: "USD ($)" },
  TRY: { symbol: "₺", rateFromGbp: 44.5, label: "TRY (₺)" }
};

interface ModernDeveloperProjectLayoutProps {
  store: any;
  products?: any[];
  lang?: string;
}

export const ModernDeveloperProjectLayout: React.FC<ModernDeveloperProjectLayoutProps> = ({
  store
}) => {
  const rawName = store?.branding?.store_name || store?.name || "Cyprus Constructions";
  const companyName = String(rawName).replace(/\s*\(projectLP\)\s*/gi, "").trim();

  const [apiDevConfig, setApiDevConfig] = useState<Record<string, any>>({});

  const savedDevConfig = useMemo(() => {
    const raw =
      store?.branding?.developer_web_config ||
      store?.page_layout_settings?.developer_web_config ||
      store?.branding?.page_layout_settings?.developer_web_config ||
      {};
    let parsed: Record<string, any> = {};
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {};
      }
    } else if (raw && typeof raw === "object") {
      parsed = raw;
    }
    return {
      ...apiDevConfig,
      ...parsed
    };
  }, [store, apiDevConfig]);

  // Default to bright sunlit "mediterranean_resort" theme unless explicitly set otherwise
  const activeThemeId: DeveloperThemeId = useMemo(() => {
    const configured = savedDevConfig?.theme_id as DeveloperThemeId;
    if (configured && DEVELOPER_ARCHITECTURAL_THEMES[configured]) return configured;
    return "mediterranean_resort";
  }, [savedDevConfig?.theme_id]);

  const activeUiverseId: UiversePresetId = useMemo(() => {
    const configured = (savedDevConfig?.uiverse_preset || store?.branding?.uiverse_preset) as UiversePresetId;
    if (configured && UIVERSE_INTERACTION_PRESETS[configured]) return configured;
    return "shimmer_glass";
  }, [savedDevConfig?.uiverse_preset, store?.branding?.uiverse_preset]);

  const uiverse = UIVERSE_INTERACTION_PRESETS[activeUiverseId] || UIVERSE_INTERACTION_PRESETS.shimmer_glass;
  const theme = DEVELOPER_ARCHITECTURAL_THEMES[activeThemeId] || DEVELOPER_ARCHITECTURAL_THEMES.mediterranean_resort;

  const shimmerEnabled = savedDevConfig?.uiverse_cta_shimmer !== false;
  const cardLiftEnabled = savedDevConfig?.uiverse_card_lift !== false;

  const ctaButtonClass = `${uiverse.primaryBtnClass} ${
    shimmerEnabled ? "ring-1 ring-[#C5A059]/60 shadow-[0_8px_22px_rgba(182,141,64,0.28)]" : ""
  }`;
  const cardInteractiveClass = `${uiverse.cardHoverClass} ${
    cardLiftEnabled ? "hover:-translate-y-1 hover:shadow-lg" : ""
  }`;

  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [selectedUnitVisualTab, setSelectedUnitVisualTab] = useState<
    "exterior" | "interior" | "floorplan" | "lifestyle"
  >("exterior");
  const [masterplanSlideIndex, setMasterplanSlideIndex] = useState<number>(0);
  const [selectedUnitVisualIndex, setSelectedUnitVisualIndex] = useState<number>(0);
  const [modalGalleryIndex, setModalGalleryIndex] = useState<number>(0);
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>("all");
  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("all");
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("GBP");

  // Financial & Tax Engineering Simulator States
  const [simulatorTab, setSimulatorTab] = useState<"payment_plan" | "tax_costs">("payment_plan");
  const [simulatorBudget, setSimulatorBudget] = useState<number>(225000);
  const [customDownPct, setCustomDownPct] = useState<number>(35);
  const [customMonths, setCustomMonths] = useState<number>(36);
  const [buyerDeedRate, setBuyerDeedRate] = useState<6 | 12>(6);
  const [includeLegalFee, setIncludeLegalFee] = useState<boolean>(true);

  const [activeMediaModal, setActiveMediaModal] = useState<any>(null);

  const [leadForm, setLeadForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    preferredProject: "",
    preferredUnit: "",
    presentationType: "Canlı 3D Mimari Sunum & Online Görüşme",
    notes: ""
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    const fetchDeveloperPortfolio = async () => {
      setLoading(true);
      try {
        const sid = store?.id || store?.store_id || 1;
        const slugParam = store?.slug || store?.branding?.slug || "cyprus-constructions";
        const res = await fetch(
          `/api/developer-projects/overview?store_id=${sid}&store_slug=${encodeURIComponent(slugParam)}`
        );
        if (res.ok) {
          const data = await res.json();
          const projList = Array.isArray(data.projects) ? data.projects : [];
          const unitList = Array.isArray(data.units) ? data.units : [];
          setProjects(projList);
          setUnits(unitList);
          if (data.activeCompany) setActiveCompany(data.activeCompany);
          if (data.developerWebConfig && typeof data.developerWebConfig === "object") {
            setApiDevConfig(data.developerWebConfig);
          }
          if (projList[0]) {
            setSelectedProjectId(projList[0].id);
            const firstProjUnits = unitList.filter(
              (u: any) => Number(u.project_id) === Number(projList[0].id)
            );
            const initialUnit =
              firstProjUnits.find((u: any) => u.status === "available") ||
              firstProjUnits[0] ||
              unitList[0] ||
              null;
            setSelectedUnit(initialUnit);
            if (initialUnit) {
              setSimulatorBudget(Number(initialUnit.price) || Number(projList[0].starting_price) || 225000);
            }
            setCustomDownPct(Number(projList[0]?.payment_plan?.down_payment_percent) || 35);
            setCustomMonths(Number(projList[0]?.payment_plan?.installment_months) || 36);
            setLeadForm(prev => ({
              ...prev,
              preferredProject: projList[0].name,
              preferredUnit: initialUnit ? `${initialUnit.unit_number} (${initialUnit.unit_type})` : ""
            }));
          }
        }
      } catch (err) {
        console.error("Developer showcase load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeveloperPortfolio();
  }, [store?.id, store?.slug]);

  const activeProject = useMemo(
    () => projects.find(p => Number(p.id) === Number(selectedProjectId)) || projects[0] || null,
    [projects, selectedProjectId]
  );

  const regions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.sub_region) set.add(p.sub_region);
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (selectedRegion === "all") return projects;
    return projects.filter(p => p.sub_region === selectedRegion);
  }, [projects, selectedRegion]);

  const projectUnits = useMemo(() => {
    if (!activeProject) return units;
    return units.filter(u => Number(u.project_id) === Number(activeProject.id));
  }, [units, activeProject]);

  const availableUnitTypes = useMemo(() => {
    const set = new Set<string>();
    projectUnits.forEach(u => {
      if (u.unit_type) set.add(u.unit_type);
    });
    return Array.from(set);
  }, [projectUnits]);

  const filteredProjectUnits = useMemo(() => {
    return projectUnits.filter(u => {
      if (unitTypeFilter !== "all" && u.unit_type !== unitTypeFilter) return false;
      if (unitStatusFilter !== "all" && u.status !== unitStatusFilter) return false;
      return true;
    });
  }, [projectUnits, unitTypeFilter, unitStatusFilter]);

  const formatGbp = (val: number | string) => {
    const n = Number(val) || 0;
    return `£${new Intl.NumberFormat("tr-TR").format(Math.round(n))}`;
  };

  const formatInSelectedCurrency = (gbpVal: number | string) => {
    const base = Number(gbpVal) || 0;
    const cfg = CURRENCY_FX_APPROX[displayCurrency];
    const converted = Math.round(base * cfg.rateFromGbp);
    return `${cfg.symbol}${new Intl.NumberFormat("tr-TR").format(converted)}`;
  };

  const phoneContact =
    activeCompany?.phone || store?.branding?.phone || store?.phone || "+90 548 860 00 01";

  const heroTitle =
    savedDevConfig?.hero_title ||
    store?.hero_title ||
    "Akdeniz Kıyı Şeridinde Ödüllü Sahil Masterplan Projeleri";

  const heroSubtitle =
    savedDevConfig?.hero_subtitle ||
    store?.hero_subtitle ||
    "Esentepe ve Tatlısu sahil hattında özel marina, lagün havuzları ve panoramik deniz manzaralı mimari yaşam alanları.";

  // Bright, luminous Hero image fallback chain (never a dark murky background)
  const resolvedHeroImage = useMemo(() => {
    if (savedDevConfig?.hero_image_url) {
      return resolveArchitecturalAssetUrl(savedDevConfig.hero_image_url);
    }
    return resortHeroSunlitAsset;
  }, [savedDevConfig?.hero_image_url]);

  const heroVideoUrl = savedDevConfig?.hero_video_url || "";

  const showUnitMatrixSection = savedDevConfig?.show_unit_matrix !== false;
  const showLifestyleSection = savedDevConfig?.show_lifestyle !== false;

  const getFallbackVisualForProject = (idx: number = 0) => {
    const cycle = [
      resortHeroSunlitAsset,
      masterplanAerialSunlitAsset,
      marinaLifestyleAsset,
      penthouseInteriorSunlitAsset
    ];
    return cycle[idx % cycle.length];
  };

  const LEGACY_MALDIVES_LOGO_ID = "1BByvpSoIl22UNb4De-Dgna5RyN01_TbD";

  const sanitizeProjectVisualUrl = (rawUrl?: string): string => {
    const raw = String(rawUrl || "").trim();
    if (!raw || raw.includes(LEGACY_MALDIVES_LOGO_ID) || !isRenderableImageUrl(raw)) return "";
    return resolveDisplayImageUrl(raw, "");
  };

  const getMasterplanGalleryForProject = (proj: any, idx: number = 0) => {
    const items: Array<{ title: string; url: string }> = [];
    const seen = new Set<string>();
    const addUnique = (title: string, rawUrl?: string) => {
      const clean = sanitizeProjectVisualUrl(rawUrl);
      if (!clean || seen.has(clean)) return;
      seen.add(clean);
      items.push({ title, url: clean });
    };

    if (proj?.cover_image) {
      addUnique(`${proj.name || "Masterplan"} — Ana Masterplan Görünümü`, proj.cover_image);
    }

    const vault: any[] = Array.isArray(proj?.media_vault) ? proj.media_vault : [];
    vault.forEach((m) => {
      const role = String(m?.media_role || "").toLowerCase();
      const cat = String(m?.category || "").toLowerCase();
      const name = String(m?.name || "").toLowerCase();
      if (
        role === "masterplan" ||
        (m?.type === "photos" && cat.includes("masterplan")) ||
        (role === "photo" && name.includes("masterplan"))
      ) {
        addUnique(m?.name || `${proj?.name || "Proje"} Masterplan`, m?.url);
      }
    });

    if (items.length === 0) {
      items.push({
        title: `${proj?.name || "Proje"} — Ana Masterplan Görünümü`,
        url: getFallbackVisualForProject(idx)
      });
    }
    return items;
  };

  const activeProjectMasterplanGallery = useMemo(() => {
    const idx = Math.max(
      0,
      projects.findIndex((p) => Number(p.id) === Number(activeProject?.id))
    );
    return getMasterplanGalleryForProject(activeProject, idx);
  }, [activeProject, projects]);

  const scrollToElement = (elId: string) => {
    const el = document.getElementById(elId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectProject = (proj: any, shouldScrollToDossier: boolean = true) => {
    setSelectedProjectId(proj.id);
    setMasterplanSlideIndex(0);
    setUnitTypeFilter("all");
    setUnitStatusFilter("all");
    const pUnits = units.filter(u => Number(u.project_id) === Number(proj.id));
    const preferredUnit = pUnits.find(u => u.status === "available") || pUnits[0] || null;
    setSelectedUnit(preferredUnit);
    setSelectedUnitVisualTab("exterior");
    setSelectedUnitVisualIndex(0);
    if (preferredUnit) {
      setSimulatorBudget(Number(preferredUnit.price) || Number(proj.starting_price) || 225000);
    } else if (proj.starting_price) {
      setSimulatorBudget(Number(proj.starting_price));
    }
    setCustomDownPct(Number(proj?.payment_plan?.down_payment_percent) || 35);
    setCustomMonths(Number(proj?.payment_plan?.installment_months) || 36);
    setLeadForm(prev => ({
      ...prev,
      preferredProject: proj.name,
      preferredUnit: preferredUnit ? `${preferredUnit.unit_number} (${preferredUnit.unit_type})` : ""
    }));
    if (shouldScrollToDossier) {
      setTimeout(() => scrollToElement("selected-project-dossier"), 80);
    }
  };

  const handleInspectUnit = (u: any, scrollToShowcase: boolean = true) => {
    setSelectedUnit(u);
    setSelectedUnitVisualTab("exterior");
    setSelectedUnitVisualIndex(0);
    setSimulatorBudget(Number(u.price) || 225000);
    setLeadForm(prev => ({
      ...prev,
      preferredProject: activeProject?.name || prev.preferredProject,
      preferredUnit: `${u.unit_number} · ${u.unit_type}`
    }));
    if (scrollToShowcase) {
      setTimeout(() => scrollToElement("selected-unit-showcase"), 60);
    }
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.fullName.trim() || !leadForm.phone.trim()) {
      toast.error("Lütfen ad soyad ve telefon numaranızı girin.");
      return;
    }
    setLeadSubmitted(true);
    toast.success("VIP Yatırımcı & 3D Mimari Sunum talebiniz proje yönetimine iletildi.");
  };

  const handleWhatsAppDirect = (customText?: string) => {
    const cleanPhone = String(phoneContact).replace(/[^0-9]/g, "");
    const msg =
      customText ||
      `Merhaba ${companyName}, ${activeProject?.name || "projeleriniz"} ${
        selectedUnit ? `(${selectedUnit.unit_number} - ${selectedUnit.unit_type})` : ""
      } hakkında detaylı bilgi, kat planları ve güncel ödeme planını talep ediyorum.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const handlePrintUnitCard = () => {
    window.print();
  };

  // Location & Distance Matrix derived cleanly per active project region
  const locationDistances = useMemo(() => {
    const sub = String(activeProject?.sub_region || "").toLowerCase();
    if (sub.includes("edremit") || sub.includes("merkez")) {
      return [
        { label: "Girne Antik Liman", distance: "7 Dakika" },
        { label: "Escape & Kervansaray Plajı", distance: "5 Dakika" },
        { label: "Uluslararası Okullar & Kolejler", distance: "4 Dakika" },
        { label: "Ercan Uluslararası Havalimanı", distance: "38 Dakika" }
      ];
    }
    if (sub.includes("tatlısu") || sub.includes("bahçeli")) {
      return [
        { label: "Özel Kumsal & Beach Club", distance: "Yürüme Mesafesi (150m)" },
        { label: "Korineum Golf & Resort", distance: "12 Dakika" },
        { label: "Girne Merkez & Yat Limanı", distance: "25 Dakika" },
        { label: "Ercan Uluslararası Havalimanı", distance: "42 Dakika" }
      ];
    }
    return [
      { label: "Özel Marina & Lagün Plajı", distance: "Denize Sıfır / 200m" },
      { label: "Korineum Golf & Country Club", distance: "8 Dakika" },
      { label: "Girne Merkez & Marina", distance: "20 Dakika" },
      { label: "Ercan Uluslararası Havalimanı", distance: "40 Dakika" }
    ];
  }, [activeProject?.sub_region]);

  // Financial & Tax calculations synced to simulatorBudget
  const financialBreakdown = useMemo(() => {
    const downPayment = Math.round((simulatorBudget * customDownPct) / 100);
    const remaining = Math.max(0, simulatorBudget - downPayment);
    const monthly = Math.round(remaining / Math.max(1, customMonths));
    const reservationDeposit = Number(activeProject?.payment_plan?.reservation_deposit_gbp) || 5000;

    // Side Costs & Taxes (KKTC Residential Property Acquisition Standard)
    const vatAmount = Math.round(simulatorBudget * 0.05); // %5 KDV
    const stampDuty = Math.round(simulatorBudget * 0.005); // %0.5 Damga Pulu
    const deedTransferFee = Math.round((simulatorBudget * buyerDeedRate) / 100); // %6 veya %12 Tapu Devir Harcı
    const transformerFee = simulatorBudget >= 450000 ? 3500 : 2500; // Trafo & Altyapı
    const legalFee = includeLegalFee ? 1500 : 0; // Sözleşme & Hukuki Takip
    const totalSideCosts = vatAmount + stampDuty + deedTransferFee + transformerFee + legalFee;
    const turnkeyTotal = simulatorBudget + totalSideCosts;

    const rentalYieldPct = Number(activeProject?.investment_metrics?.annual_rental_yield_percent) || 9.0;
    const annualRentalIncome = Math.round((simulatorBudget * rentalYieldPct) / 100);

    return {
      downPayment,
      remaining,
      monthly,
      reservationDeposit,
      vatAmount,
      stampDuty,
      deedTransferFee,
      transformerFee,
      legalFee,
      totalSideCosts,
      turnkeyTotal,
      rentalYieldPct,
      annualRentalIncome
    };
  }, [simulatorBudget, customDownPct, customMonths, buyerDeedRate, includeLegalFee, activeProject]);

  // Selected Unit Gallery Visuals — dynamically synced with panel media_vault (4 sections)
  const selectedUnitVisuals = useMemo(() => {
    const vault: any[] = Array.isArray(activeProject?.media_vault) ? activeProject.media_vault : [];
    const normUnitNo = String(selectedUnit?.unit_number || "").trim().toLowerCase();
    const normUnitType = String(selectedUnit?.unit_type || "").trim().toLowerCase();
    const isSharedMatch = (m: any) => {
      const t = String(m?.unit_type_match || "").trim().toLowerCase();
      return !t || t === "__common_area__" || t === "common_areas" || t === "all";
    };

    const resolveSectionGallery = (
      role: "exterior" | "interior" | "floorplan" | "lifestyle",
      defaultTitle: string,
      fallbackImg: string
    ) => {
      const results: Array<{ title: string; url: string; isSynced: boolean }> = [];
      const seen = new Set<string>();
      const pushUnique = (itemTitle: string, rawUrl?: string, isSynced = true) => {
        const clean = sanitizeProjectVisualUrl(rawUrl);
        if (!clean || seen.has(clean)) return;
        seen.add(clean);
        results.push({ title: itemTitle, url: clean, isSynced });
      };

      // Priority 1: Unit-number specific items matching role
      if (normUnitNo) {
        vault.forEach((m) => {
          const mUnitNo = String(m?.unit_number_match || "").trim().toLowerCase();
          const mRole = String(m?.media_role || "").toLowerCase();
          if (mUnitNo === normUnitNo && mRole === role) {
            pushUnique(m?.name || defaultTitle, m?.url, true);
          }
        });
      }

      // Priority 2: Property-type specific items matching role
      if (normUnitType) {
        vault.forEach((m) => {
          const mUnitNo = String(m?.unit_number_match || "").trim().toLowerCase();
          const mUnitType = String(m?.unit_type_match || "").trim().toLowerCase();
          const mRole = String(m?.media_role || "").toLowerCase();
          if (!mUnitNo && mUnitType === normUnitType && mRole === role) {
            pushUnique(m?.name || defaultTitle, m?.url, true);
          }
        });

        // Legacy fallback for exterior if property type has generic "photo" uploads
        if (role === "exterior" && results.length === 0) {
          vault.forEach((m) => {
            const mUnitNo = String(m?.unit_number_match || "").trim().toLowerCase();
            const mUnitType = String(m?.unit_type_match || "").trim().toLowerCase();
            const mRole = String(m?.media_role || "").toLowerCase();
            if (!mUnitNo && mUnitType === normUnitType && (mRole === "photo" || m?.type === "photos")) {
              pushUnique(m?.name || defaultTitle, m?.url, true);
            }
          });
        }
      }

      // Priority 3: Shared/Common items matching role (e.g., Sahil & Havuz or Project Masterplan cover for exterior)
      vault.forEach((m) => {
        const mUnitNo = String(m?.unit_number_match || "").trim().toLowerCase();
        const mRole = String(m?.media_role || "").toLowerCase();
        if (!mUnitNo && isSharedMatch(m) && mRole === role) {
          pushUnique(m?.name || defaultTitle, m?.url, true);
        }
      });

      if (role === "exterior" && results.length === 0) {
        activeProjectMasterplanGallery.forEach((mp) => {
          if (sanitizeProjectVisualUrl(mp.url)) {
            pushUnique(mp.title, mp.url, true);
          }
        });
      }

      const syncedCount = results.length;
      if (results.length === 0) {
        results.push({ title: defaultTitle, url: fallbackImg, isSynced: false });
      }

      return {
        title: results[0].title,
        fallback: fallbackImg,
        items: results,
        syncedCount
      };
    };

    const projectName = activeProject?.name || "Proje";
    return {
      exterior: resolveSectionGallery(
        "exterior",
        `${projectName} — Dış Cephe & Çevre Mimarisi`,
        resortHeroSunlitAsset
      ),
      interior: resolveSectionGallery(
        "interior",
        `${selectedUnit?.unit_type || "Ünite"} — İç Mekan & Deniz Manzaralı Teras`,
        penthouseInteriorSunlitAsset
      ),
      floorplan: resolveSectionGallery(
        "floorplan",
        `${selectedUnit?.unit_number || ""} — 3B Ölçekli Kat Kesiti & Yerleşim Planı`,
        isometricFloorplanAsset
      ),
      lifestyle: resolveSectionGallery(
        "lifestyle",
        `${activeProject?.sub_region || "Sahil Hattı"} — Özel Beach Club & Marina`,
        marinaLifestyleAsset
      )
    };
  }, [activeProject?.media_vault, activeProject?.name, activeProject?.sub_region, activeProjectMasterplanGallery, selectedUnit]);

  const readyProjectsCount = useMemo(
    () => projects.filter(p => Number(p.construction_progress) >= 95 || p.status === "ready_to_move").length,
    [projects]
  );

  const totalAvailableUnitsCount = useMemo(
    () => units.filter(u => u.status === "available").length,
    [units]
  );

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "available":
        return {
          label: "Müsait",
          className: theme.isDark
            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            : "bg-emerald-50 text-emerald-800 border-emerald-200"
        };
      case "negotiation":
        return {
          label: "Sonuçlanmakta",
          className: theme.isDark
            ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
            : "bg-sky-50 text-sky-800 border-sky-200"
        };
      case "optioned":
        return {
          label: "Opsiyonlu",
          className: theme.isDark
            ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
            : "bg-amber-50 text-amber-800 border-amber-200"
        };
      default:
        return {
          label: "Satıldı",
          className: theme.isDark
            ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
            : "bg-rose-50 text-rose-800 border-rose-200"
        };
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.canvasBg} ${theme.textPrimary}`}>
      {/* =================================================================== */}
      {/* 1. TOP BAR CONTRACT (Strict 3-Zone Single-Row Architectural Header) */}
      {/* =================================================================== */}
      <header
        className={`sticky top-0 z-40 flex items-center justify-between gap-8 px-6 lg:px-12 py-3.5 border-b backdrop-blur-md transition-colors ${
          theme.isDark
            ? "bg-[#090D16]/90 border-white/10 text-white"
            : "bg-white/95 border-stone-200 text-slate-900"
        }`}
      >
        <a
          href="#top"
          className={`text-lg md:text-xl font-semibold tracking-tight whitespace-nowrap shrink-0 ${theme.headingFontClass}`}
        >
          {companyName}
        </a>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
          <a
            href="#masterplan-portfolio"
            className={`${theme.textSecondary} hover:opacity-75 transition-opacity whitespace-nowrap shrink-0`}
          >
            Masterplan Projeler
          </a>
          {showUnitMatrixSection && (
            <a
              href="#unit-availability"
              className={`${theme.textSecondary} hover:opacity-75 transition-opacity whitespace-nowrap shrink-0`}
            >
              Canlı Envanter & Mülkler
            </a>
          )}
          {showUnitMatrixSection && (
            <a
              href="#financial-simulator"
              className={`${theme.textSecondary} hover:opacity-75 transition-opacity whitespace-nowrap shrink-0`}
            >
              Ödeme & Vergi Motoru
            </a>
          )}
          {showLifestyleSection && (
            <a
              href="#coastal-lifestyle"
              className={`${theme.textSecondary} hover:opacity-75 transition-opacity whitespace-nowrap shrink-0`}
            >
              Yaşam Tarzı & Güven
            </a>
          )}
          <a
            href="#investor-concierge"
            className={`${theme.textSecondary} hover:opacity-75 transition-opacity whitespace-nowrap shrink-0`}
          >
            İletişim
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#investor-concierge"
            className={`px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 ${theme.accentBg} ${ctaButtonClass}`}
          >
            VIP Yatırımcı Sunumu
          </a>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. RADIANT SUNLIT ARCHITECTURAL SHOWCASE HERO ("PARLAK PROJE VİTRİNİ") */}
      {/* =================================================================== */}
      <section id="top" className={`relative w-full overflow-hidden border-b ${theme.borderClass}`}>
        <div className="relative min-h-[560px] lg:min-h-[620px] w-full flex flex-col justify-end">
          {/* Crystal-Clear Sunlit Photography — NO murky full-frame darkening */}
          <div className="absolute inset-0 z-0 overflow-hidden bg-sky-100">
            <img
              src={resolvedHeroImage}
              alt={`${companyName} Akdeniz Sahil Masterplan Projeleri`}
              referrerPolicy="no-referrer"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src = resortHeroSunlitAsset;
              }}
              className="w-full h-full object-cover object-center opacity-100"
            />
            {/* Measured bottom-left editorial scrim ONLY behind headline legibility; sky & pool remain sunlit */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/75 via-slate-950/30 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-amber-200">
                <span>Kuzey Kıbrıs Sahil Masterplan Geliştiricisi</span>
                <span aria-hidden="true">·</span>
                <span>Esentepe & Tatlısu Kıyı Şeridi</span>
                <span aria-hidden="true">·</span>
                <span>Doğrudan İnşaat Güvencesi</span>
              </div>

              <h1
                className={`text-white font-semibold leading-[1.08] tracking-tight max-w-3xl [text-wrap:balance] drop-shadow-sm ${theme.headingFontClass}`}
                style={{ fontSize: "clamp(2.25rem, 4vw, 3.65rem)" }}
              >
                {heroTitle}
              </h1>

              <p className="text-white/95 text-base lg:text-lg max-w-2xl leading-relaxed font-normal drop-shadow-xs">
                {heroSubtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="#masterplan-portfolio"
                  className={`px-6 py-3 bg-[#C5A059] hover:bg-[#d3af67] text-slate-950 text-xs font-semibold tracking-wide flex items-center gap-2 whitespace-nowrap ${ctaButtonClass}`}
                >
                  <span>Masterplan Projeleri Keşfet ({projects.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#unit-availability"
                  className="px-5 py-3 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm transition-colors"
                >
                  <Layers className="w-4 h-4 text-[#9A7228]" />
                  <span>Canlı Fiyat & Envanter</span>
                </a>

                {heroVideoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMediaModal({
                        name: `${companyName} — Sahil Masterplan Tanıtım Filmi`,
                        category: "Tanıtım Videosu",
                        type: "video",
                        videoUrl: heroVideoUrl,
                        cover: resolvedHeroImage,
                        projectName: activeProject?.name || companyName
                      })
                    }
                    className="px-4 py-3 rounded-xl bg-slate-950/65 hover:bg-slate-950/85 backdrop-blur-sm text-white border border-white/30 text-xs font-medium flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tanıtım Filmini İzle</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bright Architectural Spotlight Card for Active Flagship Masterplan */}
            {activeProject && (
              <div className="lg:col-span-4 bg-white/95 backdrop-blur-md border border-white/80 rounded-2xl p-5 text-slate-900 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-[#9A7228]">Öne Çıkan Masterplan</span>
                  <span className="font-mono text-slate-700 font-medium">
                    Teslim: {activeProject.completion_date}
                  </span>
                </div>
                <div>
                  <h2 className={`text-xl font-semibold text-slate-950 ${theme.headingFontClass}`}>
                    {activeProject.name}
                  </h2>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {activeProject.concept_tagline || activeProject.description}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-stone-200 text-center">
                  <div>
                    <div className="text-[11px] text-slate-500">Başlangıç</div>
                    <div className="text-sm font-semibold text-[#9A7228] font-mono tabular-nums mt-0.5">
                      {formatGbp(activeProject.starting_price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Müsait Ünite</div>
                    <div className="text-sm font-semibold text-emerald-700 font-mono tabular-nums mt-0.5">
                      {activeProject.available_units} / {activeProject.total_units}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">İnşaat</div>
                    <div className="text-sm font-semibold text-slate-900 font-mono tabular-nums mt-0.5">
                      %{activeProject.construction_progress}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToElement("selected-project-dossier")}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Masterplan & Kat Planlarını Aç</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Full-Width 4-Column Quantitative Trust & Delivery Proof Strip */}
        <div className={`border-t ${theme.cardBg} ${theme.borderClass}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-xl lg:text-2xl font-semibold font-mono tabular-nums">
                {projects.length || 10} Masterplan Projesi
              </div>
              <div className={`text-xs mt-1 ${theme.textMuted}`}>
                Akdeniz Sıfır Denize Cephe Rezidans & Villa Koleksiyonu
              </div>
            </div>
            <div>
              <div className={`text-xl lg:text-2xl font-semibold font-mono tabular-nums ${theme.accentText}`}>
                {readyProjectsCount} Tamamlanmış Etap
              </div>
              <div className={`text-xs mt-1 ${theme.textMuted}`}>
                Hemen Anahtar Teslim & Aktif Kira Getirili Site Yönetimi
              </div>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-semibold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                {totalAvailableUnitsCount || 42} Müsait Bölüm
              </div>
              <div className={`text-xs mt-1 ${theme.textMuted}`}>
                Canlı Kapı Numarası, Kat, Manzara & Metrekare Seçimi
              </div>
            </div>
            <div>
              <div className="text-xl lg:text-2xl font-semibold text-sky-700 dark:text-sky-400 font-mono tabular-nums">
                %0 Faizli Ödeme Planı
              </div>
              <div className={`text-xs mt-1 ${theme.textMuted}`}>
                36 Aya Varan Doğrudan Şirket İçi Taksit & Şeffaf Vergi Hesabı
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. MASTERPLAN COLLECTION & SELECTED PROJECT SHOWCASE DOSSIER        */}
      {/* =================================================================== */}
      <section id="masterplan-portfolio" className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-10">
        <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 ${theme.borderClass}`}>
          <div className="space-y-1.5">
            <div className={`text-xs font-medium tracking-wide ${theme.accentText}`}>
              01. Masterplan Koleksiyonu & Konum Hakimiyeti
            </div>
            <h2 className={`text-2xl lg:text-4xl font-semibold ${theme.headingFontClass}`}>
              Sahil Rezidansları, Marina & Sağlık Köyü Projeleri
            </h2>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <label className={`text-xs font-medium ${theme.textMuted}`}>Bölge:</label>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer outline-none ${theme.cardBg} ${theme.borderClass} ${theme.textPrimary}`}
            >
              <option value="all">Tüm Bölgeler ({projects.length})</option>
              {regions.map(reg => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Project Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(sk => (
              <div key={sk} className={`rounded-2xl border h-80 animate-pulse ${theme.cardBg} ${theme.borderClass}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((proj, idx) => {
              const isSelected = Number(proj.id) === Number(activeProject?.id);
              const chapterNum = String(idx + 1).padStart(2, "0");
              const fallbackSrc = getFallbackVisualForProject(idx);
              const projGallery = getMasterplanGalleryForProject(proj, idx);
              const cardCoverUrl = projGallery[0]?.url || fallbackSrc;
              return (
                <div
                  key={proj.id}
                  onClick={() => handleSelectProject(proj, true)}
                  className={`group overflow-hidden border cursor-pointer flex flex-col justify-between ${
                    theme.cardBg
                  } ${cardInteractiveClass} ${
                    isSelected
                      ? "ring-2 ring-[#C5A059] border-[#C5A059]"
                      : `${theme.borderClass} hover:border-[#C5A059]/70`
                  }`}
                >
                  <div>
                    <div className="relative aspect-video w-full overflow-hidden bg-stone-200">
                      <img
                        src={cardCoverUrl}
                        alt={proj.name}
                        referrerPolicy="no-referrer"
                        onError={e => {
                          (e.currentTarget as HTMLImageElement).src = fallbackSrc;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs text-white font-mono">
                        <span className="font-semibold text-amber-200">{chapterNum}. Masterplan</span>
                        <span className="bg-slate-950/60 backdrop-blur-xs px-2 py-0.5 rounded text-[11px]">
                          İnşaat %{proj.construction_progress}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white gap-2">
                        <div>
                          <div className="text-[11px] text-white/85">{proj.sub_region}</div>
                          <h3 className={`text-lg font-semibold leading-tight ${theme.headingFontClass}`}>
                            {proj.name}
                          </h3>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="text-[10px] text-white/80">Başlangıç</div>
                          <div className="text-sm font-semibold text-amber-300 tabular-nums">
                            {formatGbp(proj.starting_price)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <div className={`flex flex-wrap items-center gap-2 text-xs ${theme.textMuted}`}>
                        <span>Teslim: {proj.completion_date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{proj.available_units} Müsait Bölüm</span>
                        <span aria-hidden="true">·</span>
                        <span>%{proj.payment_plan?.down_payment_percent || 35} Peşinat</span>
                      </div>

                      <p className={`text-xs leading-relaxed line-clamp-2 ${theme.textSecondary}`}>
                        {proj.concept_tagline || proj.description}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`px-5 py-3 border-t ${theme.borderClass} flex items-center justify-between text-xs font-medium`}
                  >
                    <span className={isSelected ? `${theme.accentText} font-semibold` : theme.textSecondary}>
                      {isSelected ? "Aktif Masterplan Vitrini" : "Projeyi & Kat Planlarını İncele"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs">
                      <span>{isSelected ? "Vitrinde Açık" : "İncele"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Selected Project Dossier + Konum & Masterplan Hakimiyeti */}
        {activeProject && (
          <div
            id="selected-project-dossier"
            className={`rounded-2xl border p-6 lg:p-8 space-y-6 scroll-mt-24 ${theme.cardBg} ${theme.borderClass} shadow-sm`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 5 Cols: Project Sunlit Architectural Visual + Multi-Image Masterplan Carousel + Progress + ROI */}
              <div className="lg:col-span-5 space-y-4">
                {(() => {
                  const mpCount = activeProjectMasterplanGallery.length;
                  const safeMpIdx = mpCount > 0 ? masterplanSlideIndex % mpCount : 0;
                  const currentMpSlide =
                    activeProjectMasterplanGallery[safeMpIdx] || {
                      title: `${activeProject.name} — Ana Masterplan Görünümü`,
                      url: masterplanAerialSunlitAsset
                    };
                  return (
                    <div className="space-y-2.5">
                      <div
                        onClick={() => {
                          setModalGalleryIndex(safeMpIdx);
                          setActiveMediaModal({
                            name: currentMpSlide.title,
                            category: activeProject.sub_region,
                            type: "photos",
                            cover: currentMpSlide.url,
                            gallery: activeProjectMasterplanGallery,
                            projectName: activeProject.name
                          });
                        }}
                        className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-stone-200 cursor-pointer group"
                      >
                        <img
                          src={currentMpSlide.url}
                          alt={currentMpSlide.title}
                          referrerPolicy="no-referrer"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = masterplanAerialSunlitAsset;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {mpCount > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMasterplanSlideIndex((prev) => (prev - 1 + mpCount) % mpCount);
                              }}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-sm cursor-pointer transition-colors"
                              title="Önceki Masterplan Görseli"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMasterplanSlideIndex((prev) => (prev + 1) % mpCount);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-sm cursor-pointer transition-colors"
                              title="Sonraki Masterplan Görseli"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-950/75 text-white font-mono text-[11px] font-medium">
                              {safeMpIdx + 1} / {mpCount}
                            </span>
                          </>
                        )}
                        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-white/95 text-slate-900 text-[11px] font-medium flex items-center gap-1.5 shadow-sm">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tam Ekran İncele</span>
                        </div>
                      </div>

                      {mpCount > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                          {activeProjectMasterplanGallery.map((mpImg, mpIdx) => (
                            <button
                              key={`${mpImg.url}_${mpIdx}`}
                              type="button"
                              onClick={() => setMasterplanSlideIndex(mpIdx)}
                              className={`relative w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                                mpIdx === safeMpIdx
                                  ? "border-[#C5A059] ring-1 ring-[#C5A059]"
                                  : "border-stone-200 opacity-75 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={mpImg.url}
                                alt={mpImg.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Construction Progress & Delivery Proof */}
                <div className={`p-4 rounded-xl border ${theme.surfaceBg} ${theme.borderClass} space-y-2.5`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">İnşaat İlerleme & Teslim Güvencesi</span>
                    <span className="font-mono font-semibold tabular-nums">
                      %{activeProject.construction_progress} · {activeProject.completion_date}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Number(activeProject.construction_progress) || 0)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div>
                      <div className={theme.textMuted}>Yıllık Kira Getirisi</div>
                      <div className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                        %{activeProject.investment_metrics?.annual_rental_yield_percent || "9.2"} GBP
                      </div>
                    </div>
                    <div>
                      <div className={theme.textMuted}>Değer Artışı</div>
                      <div className="font-mono font-semibold tabular-nums">
                        +%{activeProject.investment_metrics?.capital_appreciation_percent || "38"}
                      </div>
                    </div>
                    <div>
                      <div className={theme.textMuted}>Doluluk Ort.</div>
                      <div className="font-mono font-semibold tabular-nums">
                        %{activeProject.investment_metrics?.short_term_occupancy_percent || "84"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 7 Cols: Dossier Header, Location Distance Matrix & Media Vault */}
              <div className="lg:col-span-7 space-y-5">
                <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4 ${theme.borderClass}`}>
                  <div className="space-y-1.5">
                    <div className={`flex flex-wrap items-center gap-2 text-xs font-medium ${theme.accentText}`}>
                      <span>{activeProject.region}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeProject.sub_region}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeProject.available_units} Müsait Bağımsız Bölüm</span>
                    </div>
                    <h3 className={`text-2xl lg:text-3xl font-semibold ${theme.headingFontClass}`}>
                      {activeProject.name}
                    </h3>
                    <p className={`text-sm leading-relaxed ${theme.textSecondary}`}>
                      {activeProject.concept_tagline || activeProject.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(() => {
                      const vault: any[] = Array.isArray(activeProject.media_vault)
                        ? activeProject.media_vault
                        : [];
                      const firstProjectVideo =
                        vault.find((m) => isYouTubeUrl(m?.url)) ||
                        vault.find((m) => m?.type === "video" || m?.media_role === "video");
                      if (!firstProjectVideo) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setModalGalleryIndex(0);
                            setActiveMediaModal({
                              name: firstProjectVideo.name || `${activeProject.name} Tanıtım Filmi`,
                              category: firstProjectVideo.category || "Tanıtım Videosu",
                              type: "video",
                              url: firstProjectVideo.url,
                              videoUrl: firstProjectVideo.url,
                              cover:
                                getYouTubeThumbnailUrl(firstProjectVideo.url) ||
                                activeProjectMasterplanGallery[0]?.url ||
                                masterplanAerialSunlitAsset,
                              projectName: activeProject.name
                            });
                          }}
                          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Proje Videosunu İzle</span>
                        </button>
                      );
                    })()}
                    <a
                      href="#unit-availability"
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${theme.accentBg}`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Mülk & Fiyat Listesine Git</span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        handleWhatsAppDirect(
                          `Merhaba ${companyName}, ${activeProject.name} projesi için katalog, kat planları ve ödeme planı talep ediyorum.`
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Katalog & Teklif Al</span>
                    </button>
                  </div>
                </div>

                {/* Konum & Masterplan Mesafe Hakimiyeti */}
                <div className="space-y-2">
                  <div className={`text-xs font-medium ${theme.textMuted}`}>
                    Konum & Stratejik Mesafe Avantajları
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {locationDistances.map((loc, lIdx) => (
                      <div key={lIdx} className={`p-3 rounded-xl border ${theme.surfaceBg} ${theme.borderClass}`}>
                        <div className={`text-[11px] ${theme.textMuted}`}>{loc.label}</div>
                        <div className="text-xs font-semibold mt-0.5">{loc.distance}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Proje Görselleri, Videolar & 2D Kat Planları */}
                <div className="space-y-2.5">
                  <div className={`text-xs font-medium ${theme.textMuted}`}>
                    Proje Dokümanları, Videolar & Kat Planları ({(activeProject.media_vault || []).length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(() => {
                      const allDocs: any[] = Array.isArray(activeProject.media_vault)
                        ? activeProject.media_vault
                        : [];
                      const videoDocs = allDocs.filter(
                        (d) => d?.type === "video" || d?.media_role === "video" || isYouTubeUrl(d?.url)
                      );
                      const nonVideoDocs = allDocs.filter(
                        (d) => !(d?.type === "video" || d?.media_role === "video" || isYouTubeUrl(d?.url))
                      );
                      return [...videoDocs, ...nonVideoDocs].slice(0, 8);
                    })().map((doc: any, dIdx: number) => {
                      const fallbackMp =
                        activeProjectMasterplanGallery[0]?.url || masterplanAerialSunlitAsset;
                      const isYt = isYouTubeUrl(doc.url);
                      const isVideo = doc.type === "video" || doc.media_role === "video" || isYt;
                      const docCover = isYt
                        ? getYouTubeThumbnailUrl(doc.url) || fallbackMp
                        : isRenderableImageUrl(doc.url) && !String(doc.url || "").includes(LEGACY_MALDIVES_LOGO_ID)
                        ? resolveDisplayImageUrl(doc.url, fallbackMp)
                        : fallbackMp;
                      return (
                        <button
                          key={doc.id || dIdx}
                          type="button"
                          onClick={() => {
                            setModalGalleryIndex(0);
                            setActiveMediaModal({
                              name: doc.name,
                              category: doc.category || "Proje Medyası",
                              type: isVideo ? "video" : doc.type || "photos",
                              url: doc.url,
                              videoUrl: isVideo ? doc.url : undefined,
                              cover: docCover,
                              projectName: activeProject.name
                            });
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${theme.surfaceBg} ${theme.borderClass} hover:border-[#C5A059]`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[11px] font-medium ${theme.accentText}`}>
                                {doc.category || "Mimari Doküman"}
                              </span>
                              {isYt && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-semibold">
                                  YouTube
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-medium truncate">{doc.name}</div>
                          </div>
                          {isVideo ? (
                            <Play className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : doc.type === "pricelist" ? (
                            <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                          ) : (
                            <Eye className="w-4 h-4 opacity-70 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 4. LIVE INVENTORY TABLE (ZERO CLIPPING) + SELECTED UNIT SHOWCASE +  */}
      {/*    PAYMENT PLAN & TAX/SIDE-COST ENGINEERING SIMULATOR               */}
      {/* =================================================================== */}
      {showUnitMatrixSection && (
        <section id="unit-availability" className={`border-y py-16 ${theme.surfaceBg} ${theme.borderClass}`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-10">
            {/* Section Header + Clean Filter Controls */}
            <div className={`flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b pb-6 ${theme.borderClass}`}>
              <div className="space-y-1.5">
                <div className={`text-xs font-medium tracking-wide ${theme.accentText}`}>
                  02. Canlı Envanter, Seçili Mülk Vitrini & Finansal Mühendislik
                </div>
                <h2 className={`text-2xl lg:text-4xl font-semibold ${theme.headingFontClass}`}>
                  {activeProject?.name || "Proje"} — Bağımsız Bölüm & Fiyat Listesi
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={unitTypeFilter}
                  onChange={e => setUnitTypeFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${theme.cardBg} ${theme.borderClass}`}
                >
                  <option value="all">Tüm Mülk Tipleri ({projectUnits.length})</option>
                  {availableUnitTypes.map(tName => (
                    <option key={tName} value={tName}>
                      {tName}
                    </option>
                  ))}
                </select>

                <select
                  value={unitStatusFilter}
                  onChange={e => setUnitStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${theme.cardBg} ${theme.borderClass}`}
                >
                  <option value="all">Tüm Statüler</option>
                  <option value="available">Müsait</option>
                  <option value="negotiation">Sonuçlanmakta</option>
                  <option value="optioned">Opsiyonlu</option>
                  <option value="sold">Satıldı</option>
                </select>

                <select
                  value={displayCurrency}
                  onChange={e => setDisplayCurrency(e.target.value as DisplayCurrency)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer ${theme.cardBg} ${theme.borderClass}`}
                  title="Gösterim Para Birimi"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>
            </div>

            {/* FULL-WIDTH INVENTORY TABLE — Fits all columns comfortably with zero right-side clipping */}
            <div className={`rounded-2xl border overflow-hidden shadow-xs ${theme.cardBg} ${theme.borderClass}`}>
              {filteredProjectUnits.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <p className={`text-sm font-medium ${theme.textSecondary}`}>
                    Seçili mülk tipi veya durum filtresine uygun bağımsız bölüm bulunamadı.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitTypeFilter("all");
                      setUnitStatusFilter("all");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${theme.accentBg}`}
                  >
                    Tüm Üniteleri Göster
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className={`border-b ${theme.surfaceBg} ${theme.borderClass} text-[11px] font-semibold ${theme.textMuted}`}>
                        <th className="py-3.5 px-4">Kapı No & Blok</th>
                        <th className="py-3.5 px-4">Mülk Tipi</th>
                        <th className="py-3.5 px-4">Alan (Brüt / Net / Teras)</th>
                        <th className="py-3.5 px-4">Kat & Manzara</th>
                        <th className="py-3.5 px-4">Liste Fiyatı</th>
                        <th className="py-3.5 px-4">Durum</th>
                        <th className="py-3.5 px-4 text-right">Mülkü İncele & Hesapla</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme.borderClass}`}>
                      {filteredProjectUnits.map(u => {
                        const isUnitSelected = Number(selectedUnit?.id) === Number(u.id);
                        const statusMeta = getStatusBadgeStyle(u.status);
                        return (
                          <tr
                            key={u.id}
                            onClick={() => handleInspectUnit(u, true)}
                            className={`cursor-pointer transition-colors ${
                              isUnitSelected
                                ? theme.isDark
                                  ? "bg-[#C5A059]/15"
                                  : "bg-amber-50/75"
                                : "hover:bg-stone-50 dark:hover:bg-white/5"
                            }`}
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-mono font-semibold text-sm">{u.unit_number}</div>
                              <div className={`text-[11px] ${theme.textMuted}`}>{u.block_name}</div>
                            </td>
                            <td className="py-3.5 px-4 font-medium whitespace-nowrap">{u.unit_type}</td>
                            <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              {u.gross_sqm} m² Brüt · {u.net_sqm} m² Net{" "}
                              <span className={theme.textMuted}>(+{u.terrace_sqm} m²)</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium">{u.floor_level}</div>
                              <div className={`text-[11px] ${theme.textMuted}`}>{u.view_direction}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono tabular-nums whitespace-nowrap">
                              <div className="text-sm font-semibold">{formatGbp(u.price)}</div>
                              {displayCurrency !== "GBP" && (
                                <div className={`text-[11px] ${theme.textMuted}`}>
                                  ≈ {formatInSelectedCurrency(u.price)}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[11px] font-medium ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleInspectUnit(u, true);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                                  isUnitSelected
                                    ? "bg-emerald-600 text-white"
                                    : theme.accentBg
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isUnitSelected ? "Seçili Mülk" : "Mülkü Gör & Hesapla"}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TWO-COLUMN SHOWCASE BELOW TABLE: LEFT = SELECTED PROPERTY VISUAL & SPECS | RIGHT = PAYMENT & TAX SIMULATOR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* LEFT 6 COLS: SHOWSTOPPING SELECTED PROPERTY SHOWCASE */}
              <div
                id="selected-unit-showcase"
                className={`lg:col-span-6 rounded-2xl border p-6 flex flex-col justify-between space-y-5 scroll-mt-24 ${theme.cardBg} ${theme.borderClass} shadow-sm`}
              >
                {selectedUnit ? (
                  <>
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className={`text-xs font-medium ${theme.accentText}`}>
                            Seçili Bağımsız Bölüm Vitrini · {activeProject?.name}
                          </div>
                          <h3 className={`text-2xl font-semibold mt-0.5 ${theme.headingFontClass}`}>
                            {selectedUnit.unit_number} — {selectedUnit.unit_type}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold font-mono tabular-nums">
                            {formatGbp(selectedUnit.price)}
                          </div>
                          {displayCurrency !== "GBP" && (
                            <div className={`text-xs font-mono ${theme.textMuted}`}>
                              ≈ {formatInSelectedCurrency(selectedUnit.price)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Interactive Unit Visual Stage (Exterior, Interior, 3D Floorplan, Lifestyle) */}
                      {(() => {
                        const activeVisual = selectedUnitVisuals[selectedUnitVisualTab];
                        const items = activeVisual.items || [];
                        const itemCount = items.length;
                        const safeSlideIdx = itemCount > 0 ? selectedUnitVisualIndex % itemCount : 0;
                        const currentSlide = items[safeSlideIdx] || {
                          title: activeVisual.title,
                          url: activeVisual.fallback
                        };
                        return (
                          <div className="space-y-2.5">
                            <div
                              onClick={() => {
                                setModalGalleryIndex(safeSlideIdx);
                                setActiveMediaModal({
                                  name: currentSlide.title,
                                  category: `${selectedUnit.unit_number} · ${selectedUnit.unit_type}`,
                                  type: "photos",
                                  cover: currentSlide.url,
                                  gallery: items,
                                  projectName: activeProject?.name || companyName
                                });
                              }}
                              className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-stone-200 cursor-pointer group"
                            >
                              <img
                                src={currentSlide.url}
                                alt={currentSlide.title}
                                referrerPolicy="no-referrer"
                                onError={e => {
                                  (e.currentTarget as HTMLImageElement).src = activeVisual.fallback;
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                              {itemCount > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUnitVisualIndex(
                                        (prev) => (prev - 1 + itemCount) % itemCount
                                      );
                                    }}
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-sm cursor-pointer transition-colors"
                                    title="Önceki Görsel"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedUnitVisualIndex((prev) => (prev + 1) % itemCount);
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-900 shadow-sm cursor-pointer transition-colors"
                                    title="Sonraki Görsel"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-950/75 text-white font-mono text-[11px] font-medium">
                                    {safeSlideIdx + 1} / {itemCount}
                                  </span>
                                </>
                              )}
                              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                                <span className="font-medium truncate pr-3">
                                  {currentSlide.title}
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-white/95 text-slate-900 text-[11px] font-medium shrink-0">
                                  Büyüt
                                </span>
                              </div>
                            </div>

                            {/* Visual Perspective Selector Tabs */}
                            <div className="grid grid-cols-4 gap-2">
                              {(
                                [
                                  { id: "exterior", label: "Dış Cephe" },
                                  { id: "interior", label: "İç Mekan" },
                                  { id: "floorplan", label: "3B Kat Planı" },
                                  { id: "lifestyle", label: "Sahil & Havuz" }
                                ] as const
                              ).map(vTab => {
                                const tabCount = selectedUnitVisuals[vTab.id].syncedCount;
                                return (
                                  <button
                                    key={vTab.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedUnitVisualTab(vTab.id);
                                      setSelectedUnitVisualIndex(0);
                                    }}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors whitespace-nowrap truncate ${
                                      selectedUnitVisualTab === vTab.id
                                        ? `${theme.accentBg} border-transparent`
                                        : `${theme.surfaceBg} ${theme.borderClass} ${theme.textSecondary} hover:opacity-85`
                                    }`}
                                  >
                                    {vTab.label}
                                    {tabCount > 0 ? ` (${tabCount})` : ""}
                                  </button>
                                );
                              })}
                            </div>

                            {itemCount > 1 && (
                              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                                {items.map((thumbItem, tIdx) => (
                                  <button
                                    key={`${thumbItem.url}_${tIdx}`}
                                    type="button"
                                    onClick={() => setSelectedUnitVisualIndex(tIdx)}
                                    className={`relative w-16 h-11 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                                      tIdx === safeSlideIdx
                                        ? "border-[#C5A059] ring-1 ring-[#C5A059]"
                                        : "border-stone-200 opacity-75 hover:opacity-100"
                                    }`}
                                  >
                                    <img
                                      src={thumbItem.url}
                                      alt={thumbItem.title}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Complete Architectural Unit Specs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div className={`p-3 rounded-xl border ${theme.surfaceBg} ${theme.borderClass}`}>
                          <div className={`text-[11px] ${theme.textMuted}`}>Blok & Kat</div>
                          <div className="text-xs font-semibold mt-0.5">{selectedUnit.block_name}</div>
                          <div className={`text-[11px] ${theme.textMuted}`}>{selectedUnit.floor_level}</div>
                        </div>
                        <div className={`p-3 rounded-xl border ${theme.surfaceBg} ${theme.borderClass}`}>
                          <div className={`text-[11px] ${theme.textMuted}`}>Brüt / Net Alan</div>
                          <div className="text-xs font-semibold font-mono tabular-nums mt-0.5">
                            {selectedUnit.gross_sqm} m² Brüt
                          </div>
                          <div className={`text-[11px] font-mono ${theme.textMuted}`}>
                            {selectedUnit.net_sqm} m² Net
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl border ${theme.surfaceBg} ${theme.borderClass}`}>
                          <div className={`text-[11px] ${theme.textMuted}`}>Teras & Bahçe</div>
                          <div className="text-xs font-semibold font-mono tabular-nums mt-0.5">
                            +{selectedUnit.terrace_sqm} m²
                          </div>
                          <div className={`text-[11px] ${theme.textMuted}`}>Özel Açık Alan</div>
                        </div>
                        <div className={`p-3 rounded-xl border ${theme.surfaceBg} ${theme.borderClass}`}>
                          <div className={`text-[11px] ${theme.textMuted}`}>Manzara & Cephe</div>
                          <div className="text-xs font-semibold mt-0.5">{selectedUnit.view_direction}</div>
                          <div className={`text-[11px] ${theme.textMuted}`}>
                            {getStatusBadgeStyle(selectedUnit.status).label}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unit Direct Conversion Actions */}
                    <div className={`pt-4 border-t ${theme.borderClass} flex flex-wrap items-center gap-2.5`}>
                      <button
                        type="button"
                        onClick={() =>
                          handleWhatsAppDirect(
                            `Merhaba ${companyName}, ${activeProject?.name} projesindeki ${selectedUnit.unit_number} (${selectedUnit.unit_type}, ${selectedUnit.gross_sqm} m², ${formatGbp(
                              selectedUnit.price
                            )}) bağımsız bölümü için kat planı ve resmi satış teklifini rica ediyorum.`
                          )
                        }
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Bu Mülk İçin Teklif & Kat Planı İste</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintUnitCard}
                        className={`py-2.5 px-3.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${theme.surfaceBg} ${theme.borderClass} ${theme.textPrimary}`}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Bilgi Kartı Yazdır</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-sm">
                    Detaylarını görmek için yukarıdaki listeden bir bağımsız bölüm seçin.
                  </div>
                )}
              </div>

              {/* RIGHT 6 COLS: FINANCIAL ENGINEERING ENGINE (PAYMENT SIMULATOR + SIDE COSTS & TAXES) */}
              <div
                id="financial-simulator"
                className={`lg:col-span-6 rounded-2xl border p-6 flex flex-col justify-between space-y-5 scroll-mt-24 ${theme.cardBg} ${theme.borderClass} shadow-sm`}
              >
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className={`text-xs font-medium ${theme.accentText}`}>
                        Finansal Mühendislik & Şeffaf Maliyet Analizi
                      </div>
                      <h3 className={`text-2xl font-semibold mt-0.5 ${theme.headingFontClass}`}>
                        {selectedUnit ? `${selectedUnit.unit_number} Finansman Dosyası` : `${activeProject?.name || companyName} Planı`}
                      </h3>
                    </div>

                    {/* 2-Mode Simulator Switcher */}
                    <div className={`inline-flex p-1 rounded-xl border ${theme.surfaceBg} ${theme.borderClass}`}>
                      <button
                        type="button"
                        onClick={() => setSimulatorTab("payment_plan")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                          simulatorTab === "payment_plan" ? theme.accentBg : theme.textSecondary
                        }`}
                      >
                        %0 Faiz Ödeme Planı
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimulatorTab("tax_costs")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                          simulatorTab === "tax_costs" ? theme.accentBg : theme.textSecondary
                        }`}
                      >
                        Yan Maliyet & Vergiler
                      </button>
                    </div>
                  </div>

                  {/* Interactive Property Budget Control */}
                  <div className={`p-4 rounded-xl border ${theme.surfaceBg} ${theme.borderClass} space-y-2.5`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={theme.textSecondary}>Hesaplanan Mülk Bedeli (GBP £):</span>
                      <div className="text-right font-mono tabular-nums">
                        <span className="text-base font-semibold">{formatGbp(simulatorBudget)}</span>
                        {displayCurrency !== "GBP" && (
                          <span className={`ml-2 text-xs ${theme.textMuted}`}>
                            (≈ {formatInSelectedCurrency(simulatorBudget)})
                          </span>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={115000}
                      max={1250000}
                      step={5000}
                      value={simulatorBudget}
                      onChange={e => setSimulatorBudget(Number(e.target.value))}
                      className="w-full accent-[#B68D40] cursor-pointer"
                    />
                  </div>

                  {simulatorTab === "payment_plan" ? (
                    <div className="space-y-4">
                      {/* Down Payment & Term Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`p-3.5 rounded-xl border ${theme.surfaceBg} ${theme.borderClass} space-y-2`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className={theme.textSecondary}>Peşinat Oranı</span>
                            <span className="font-mono font-semibold tabular-nums">%{customDownPct}</span>
                          </div>
                          <input
                            type="range"
                            min={30}
                            max={75}
                            step={5}
                            value={customDownPct}
                            onChange={e => setCustomDownPct(Number(e.target.value))}
                            className="w-full accent-[#B68D40] cursor-pointer"
                          />
                        </div>

                        <div className={`p-3.5 rounded-xl border ${theme.surfaceBg} ${theme.borderClass} space-y-2`}>
                          <div className={`text-xs ${theme.textSecondary}`}>Faizsiz Taksit Vadesi</div>
                          <div className="grid grid-cols-5 gap-1">
                            {[12, 18, 24, 36, 48].map(m => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setCustomMonths(m)}
                                className={`py-1.5 rounded-lg text-xs font-mono font-medium cursor-pointer transition-colors ${
                                  customMonths === m
                                    ? theme.accentBg
                                    : `${theme.cardBg} border ${theme.borderClass} ${theme.textSecondary}`
                                }`}
                              >
                                {m}A
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Payment Breakdown Rows */}
                      <div className="space-y-2.5 text-xs">
                        <div className={`flex justify-between py-2 border-b ${theme.borderClass}`}>
                          <span className={theme.textSecondary}>Rezervasyon Kapora Depozitosu (Opsiyon Kilidi):</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatGbp(financialBreakdown.reservationDeposit)}
                          </span>
                        </div>
                        <div className={`flex justify-between py-2 border-b ${theme.borderClass}`}>
                          <span className={theme.textSecondary}>
                            Sözleşme Peşinatı (%{customDownPct} — Kapora Dahil):
                          </span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatGbp(financialBreakdown.downPayment)}
                          </span>
                        </div>
                        <div className={`flex justify-between py-2 border-b ${theme.borderClass}`}>
                          <span className={theme.textSecondary}>
                            Şirket İçi Faizsiz Kalan Anapara (%{100 - customDownPct}):
                          </span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatGbp(financialBreakdown.remaining)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="font-medium">
                            {customMonths} Ay Sabit Taksit (%0 Faiz):
                          </span>
                          <div className="text-right">
                            <div className={`font-mono text-lg font-semibold tabular-nums ${theme.accentText}`}>
                              {formatGbp(financialBreakdown.monthly)} / Ay
                            </div>
                            {displayCurrency !== "GBP" && (
                              <div className={`text-[11px] font-mono ${theme.textMuted}`}>
                                ≈ {formatInSelectedCurrency(financialBreakdown.monthly)} / Ay
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rental Offset Projection */}
                      <div className={`p-3.5 rounded-xl border ${theme.surfaceBg} ${theme.borderClass} flex items-center justify-between text-xs`}>
                        <span className={theme.textSecondary}>
                          Tahmini Yıllık Kira Getirisi (%{financialBreakdown.rentalYieldPct} GBP):
                        </span>
                        <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          ~{formatGbp(financialBreakdown.annualRentalIncome)} / Yıl
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* TAX & ACQUISITION SIDE-COSTS SIMULATOR */
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setBuyerDeedRate(6)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                              buyerDeedRate === 6
                                ? theme.accentBg
                                : `${theme.surfaceBg} ${theme.borderClass} ${theme.textSecondary}`
                            }`}
                          >
                            İlk Konut / Standart Tapu (%6)
                          </button>
                          <button
                            type="button"
                            onClick={() => setBuyerDeedRate(12)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                              buyerDeedRate === 12
                                ? theme.accentBg
                                : `${theme.surfaceBg} ${theme.borderClass} ${theme.textSecondary}`
                            }`}
                          >
                            Yabancı / İkinci Konut (%12)
                          </button>
                        </div>

                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeLegalFee}
                            onChange={e => setIncludeLegalFee(e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#B68D40]"
                          />
                          <span className={theme.textSecondary}>Hukuki Tescil (£1.500)</span>
                        </label>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className={`flex justify-between py-2 border-b ${theme.borderClass}`}>
                          <span className={theme.textSecondary}>Sözleşme Damga Pulu (%0,5 — Sözleşme Aşaması):</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatGbp(financialBreakdown.stampDuty)}
                          </span>
                        </div>
                        <div className={`flex justify-between py-2 border-b ${theme.borderClass}`}>
                          <span className={theme.textSecondary}>Konut KDV Bedeli (%5 — Anahtar Tesliminde):</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatGbp(financialBreakdown.vatAmount)}
                          </span>
                        </div>
                        <div className={`flex justify-between py-2 border-b ${theme.borderClass}`}>
                          <span className={theme.textSecondary}>
                            Tapu Devir Harcı (%{buyerDeedRate} — Koçan Devri):
                          </span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatGbp(financialBreakdown.deedTransferFee)}
                          </span>
                        </div>
                        <div className={`flex justify-between py-2 border-b ${theme.borderClass}`}>
                          <span className={theme.textSecondary}>Trafo & Altyapı Katkı Payı (Teslimde):</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatGbp(financialBreakdown.transformerFee)}
                          </span>
                        </div>
                        {includeLegalFee && (
                          <div className={`flex justify-between py-2 border-b ${theme.borderClass}`}>
                            <span className={theme.textSecondary}>Avukatlık & Tapu İzin Takip Ücreti (Tahmini):</span>
                            <span className="font-mono font-semibold tabular-nums">
                              {formatGbp(financialBreakdown.legalFee)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className={`p-4 rounded-xl border ${theme.surfaceBg} ${theme.borderClass} space-y-1.5`}>
                        <div className="flex justify-between text-xs">
                          <span className={theme.textSecondary}>Toplam Resmi Vergi & Yan Maliyetler:</span>
                          <span className="font-mono font-semibold tabular-nums">
                            {formatGbp(financialBreakdown.totalSideCosts)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-stone-200/70">
                          <span className="text-xs font-semibold">Anahtar Teslim Toplam Yatırım Bütçesi:</span>
                          <span className={`font-mono text-lg font-semibold tabular-nums ${theme.accentText}`}>
                            {formatGbp(financialBreakdown.turnkeyTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleWhatsAppDirect(
                      `Merhaba ${companyName}, ${activeProject?.name || ""} ${
                        selectedUnit ? `(${selectedUnit.unit_number} - ${selectedUnit.unit_type})` : ""
                      } için ${formatGbp(simulatorBudget)} bütçeli %${customDownPct} peşinatlı ${customMonths} ay %0 faizli ödeme planı (Aylık ${formatGbp(
                        financialBreakdown.monthly
                      )}) ve tahmini ${formatGbp(
                        financialBreakdown.totalSideCosts
                      )} yan maliyet dosyası hakkında resmi teklif almak istiyorum.`
                    )
                  }
                  className={`w-full py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${theme.accentBg}`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Bu Ödeme & Maliyet Dosyasını Resmi Teklife Dönüştür</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 5. DESTINATION & LIFESTYLE SELLING + TRUST & PROOF OF DELIVERY      */}
      {/* =================================================================== */}
      {showLifestyleSection && activeProject && (
        <section id="coastal-lifestyle" className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left 6 Cols: Sunlit Coastal Beach Club Photography */}
            <div className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-stone-200 min-h-[340px]">
              <img
                src={marinaLifestyleAsset}
                alt="Akdeniz Özel Marina, Sahil Plajı & Beach Club Yaşamı"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                <div className="text-xs font-medium text-amber-200">
                  Bölge & Yaşam Tarzı · {activeProject.sub_region}
                </div>
                <h3 className={`text-2xl font-semibold ${theme.headingFontClass}`}>
                  Dört Mevsim Akdeniz Resort Ayrıcalığı
                </h3>
              </div>
            </div>

            {/* Right 6 Cols: Structured Social Facilities & Architectural Specs */}
            <div className={`lg:col-span-6 rounded-2xl border p-6 lg:p-8 flex flex-col justify-between space-y-5 ${theme.cardBg} ${theme.borderClass}`}>
              <div className="space-y-2">
                <div className={`text-xs font-medium ${theme.accentText}`}>
                  03. Bölgeyi & Yaşam Tarzını Deneyimleyin
                </div>
                <h2 className={`text-2xl lg:text-3xl font-semibold ${theme.headingFontClass}`}>
                  {activeProject.name} — Sosyal Tesisler & Mimari Standartlar
                </h2>
                <p className={`text-sm leading-relaxed ${theme.textSecondary}`}>
                  Özel kum plajlar, ısıtmalı kapalı havuzlar, spa & wellness merkezleri ve açık hava sinemasıyla yüksek kira doluluğu sağlayan entegre yaşam konsepti.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ...(activeProject.lifestyle_facilities?.beach_marina || []),
                  ...(activeProject.lifestyle_facilities?.wellness_spa || []),
                  ...(activeProject.lifestyle_facilities?.gastronomy || []),
                  ...(activeProject.lifestyle_facilities?.entertainment || []),
                  ...(activeProject.architectural_specs || [])
                ]
                  .slice(0, 8)
                  .map((facility: string, fIdx: number) => (
                    <div
                      key={fIdx}
                      className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${theme.surfaceBg} ${theme.borderClass}`}
                    >
                      <span className={`font-mono text-xs font-semibold ${theme.accentText}`}>
                        0{fIdx + 1}.
                      </span>
                      <div className="text-xs font-medium leading-snug">{facility}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Trust & Proof of Delivery Strip Across Projects */}
          <div className={`rounded-2xl border p-6 lg:p-8 space-y-5 ${theme.cardBg} ${theme.borderClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className={`text-xs font-medium ${theme.accentText}`}>
                  04. Kurumsal Güven & Teslimat Kanıtı
                </div>
                <h3 className={`text-2xl font-semibold mt-0.5 ${theme.headingFontClass}`}>
                  Tamamlanmış Projeler & Şeffaf Şantiye İlerleme Raporu
                </h3>
              </div>
              <div className={`text-xs ${theme.textMuted}`}>
                1. Sınıf Müteahhitlik Lisansı · Onaylı İnşaat İzinleri & Tapu Güvencesi
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {projects.slice(0, 5).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProject(p, true)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${theme.surfaceBg} ${theme.borderClass} hover:border-[#C5A059]`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold truncate pr-2">{p.name}</span>
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      %{p.construction_progress}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, Number(p.construction_progress) || 0)}%` }}
                    />
                  </div>
                  <div className={`text-[11px] ${theme.textMuted}`}>{p.completion_date}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 6. ARCHITECTURAL VISUALIZATION & INTERIOR DESIGN GALLERY            */}
      {/* =================================================================== */}
      {savedDevConfig?.show_lora_showcase !== false && (
        <section
          id="architectural-lora-gallery"
          className={`border-y py-14 ${theme.surfaceBg} ${theme.borderClass}`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-6">
            <div>
              <div className={`text-xs font-medium ${theme.accentText}`}>
                05. Mimari Görsel, Kat Kesiti & İç Mekan Tasarım Galerisi
              </div>
              <h2 className={`text-2xl lg:text-3xl font-semibold mt-1 ${theme.headingFontClass}`}>
                Dış Cephe Konsepti, Kat Kesiti & İç Mekan Tasarımı
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Array.isArray(savedDevConfig?.lora_generated_gallery) &&
              savedDevConfig.lora_generated_gallery.length > 0
                ? savedDevConfig.lora_generated_gallery
                    .slice(0, 6)
                    .map((item: any, idx: number) => sanitizeArchitecturalGalleryRecord(item, idx))
                : ARCHITECTURAL_LORA_MODELS.map((m, idx) =>
                    sanitizeArchitecturalGalleryRecord(
                      {
                        id: m.id,
                        title: m.defaultTitle,
                        loraUsed: m.category,
                        category: m.category,
                        promptCommand: m.description,
                        imageUrl: m.previewImage
                      },
                      idx
                    )
                  )
              ).map((vis: any, vIdx: number) => {
                const resolvedImgUrl = resolveArchitecturalAssetUrl(vis.imageUrl);
                return (
                  <div
                    key={vis.id || vIdx}
                    onClick={() =>
                      setActiveMediaModal({
                        name: vis.title,
                        category: vis.category || vis.loraUsed || "Mimari Görsel",
                        type: "photos",
                        url: resolvedImgUrl,
                        cover: resolvedImgUrl,
                        projectName: activeProject?.name || companyName
                      })
                    }
                    className={`group border overflow-hidden cursor-pointer flex flex-col justify-between ${theme.cardBg} ${theme.borderClass} ${cardInteractiveClass}`}
                  >
                    <div>
                      <div className="relative aspect-video w-full overflow-hidden bg-stone-200">
                        <img
                          src={resolvedImgUrl}
                          alt={vis.title}
                          referrerPolicy="no-referrer"
                          onError={e => {
                            (e.currentTarget as HTMLImageElement).src = resortHeroSunlitAsset;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                          <span className="font-medium text-amber-200">
                            0{vIdx + 1}. {vis.category || vis.loraUsed || "Mimari Görsel"}
                          </span>
                          <span className="font-mono text-[11px] opacity-90">Tam Ekran İncele</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-1.5">
                        <h4 className={`text-base font-semibold ${theme.headingFontClass}`}>
                          {vis.title}
                        </h4>
                        <p className={`text-xs line-clamp-2 leading-relaxed ${theme.textSecondary}`}>
                          {vis.promptCommand}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-3 border-t ${theme.borderClass} flex items-center justify-between text-xs font-medium`}
                    >
                      <span className={theme.accentText}>Yüksek Çözünürlüklü Görseli Aç</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 7. VIP INVESTOR CONCIERGE & PRIVATE PRESENTATION BOOKING            */}
      {/* =================================================================== */}
      <section id="investor-concierge" className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div
          className={`rounded-3xl border p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 ${theme.cardBg} ${theme.borderClass} shadow-sm`}
        >
          <div className="lg:col-span-5 space-y-5">
            <div className={`text-xs font-medium ${theme.accentText}`}>
              06. VIP Yatırımcı İlişkileri & Mimari Sunum Merkezi
            </div>
            <h2 className={`text-2xl lg:text-4xl font-semibold ${theme.headingFontClass}`}>
              Özel Proje Sunumu & Yerinde İnceleme Randevusu
            </h2>
            <p className={`text-sm leading-relaxed ${theme.textSecondary}`}>
              {companyName} mimari ve yatırım danışmanlarımızla çevrimiçi 3D sunum planlayın veya Kuzey Kıbrıs Esentepe sahil satış ofisimizde projelerimizi yerinde deneyimleyin.
            </p>

            <div className="space-y-3 pt-2 text-sm">
              <div>
                <div className={`text-xs ${theme.textMuted}`}>Doğrudan Satış & Yatırımcı Hattı</div>
                <div className="font-mono font-semibold text-base mt-0.5">{phoneContact}</div>
              </div>
              <div>
                <div className={`text-xs ${theme.textMuted}`}>Merkez Satış Ofisi</div>
                <div className="font-medium mt-0.5">
                  Esentepe — Tatlısu Sahil Yolu, Girne, Kuzey Kıbrıs
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {leadSubmitted ? (
              <div className={`p-8 rounded-2xl border text-center space-y-3 ${theme.surfaceBg} ${theme.borderClass}`}>
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-xl font-semibold">Talebiniz Kaydedildi</h3>
                <p className={`text-sm ${theme.textSecondary}`}>
                  Sayın <strong>{leadForm.fullName}</strong>, <strong>{leadForm.preferredProject}</strong>{" "}
                  {leadForm.preferredUnit ? `(${leadForm.preferredUnit})` : ""} projesi için{" "}
                  {leadForm.presentationType} talebiniz alınmıştır. Yatırım ekibimiz en kısa sürede sizinle iletişime geçecektir.
                </p>
                <button
                  type="button"
                  onClick={() => setLeadSubmitted(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${theme.accentBg}`}
                >
                  Yeni Talep Oluştur
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5">Adınız Soyadınız *</label>
                  <input
                    type="text"
                    required
                    value={leadForm.fullName}
                    onChange={e => setLeadForm({ ...leadForm, fullName: e.target.value })}
                    placeholder="Örn: Ahmet Yılmaz"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${theme.surfaceBg} ${theme.borderClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Telefon / WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={leadForm.phone}
                    onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                    placeholder="+90 5XX XXX XX XX"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${theme.surfaceBg} ${theme.borderClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">Kurumsal E-Posta</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="ornek@eposta.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${theme.surfaceBg} ${theme.borderClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5">İlgilendiğiniz Masterplan Proje</label>
                  <select
                    value={leadForm.preferredProject}
                    onChange={e => setLeadForm({ ...leadForm, preferredProject: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium ${theme.surfaceBg} ${theme.borderClass}`}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.sub_region})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5">Sunum Tercihi</label>
                  <select
                    value={leadForm.presentationType}
                    onChange={e => setLeadForm({ ...leadForm, presentationType: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium ${theme.surfaceBg} ${theme.borderClass}`}
                  >
                    <option value="Canlı 3D Mimari Sunum & Online Görüşme">
                      Canlı 3D Mimari Sunum & Online Görüşme
                    </option>
                    <option value="Kuzey Kıbrıs VIP Karşılama & Yerinde Proje Gezisi">
                      Kuzey Kıbrıs VIP Karşılama & Yerinde Proje Gezisi
                    </option>
                    <option value="PDF Masterplan Katalog & Fiyat Listesi Gönderimi">
                      PDF Masterplan Katalog & Fiyat Listesi Gönderimi
                    </option>
                  </select>
                </div>
                <div className="sm:col-span-2 pt-1">
                  <button
                    type="submit"
                    className={`w-full py-3.5 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${theme.accentBg}`}
                  >
                    VIP Sunum & Fiyat Dosyası Talep Et
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 8. QUIET ARCHITECTURAL FOOTER                                       */}
      {/* =================================================================== */}
      <footer className={`border-t py-10 px-6 lg:px-12 text-xs ${theme.surfaceBg} ${theme.borderClass} ${theme.textMuted}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className={`font-semibold text-sm ${theme.textPrimary} ${theme.headingFontClass}`}>
            {companyName}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#masterplan-portfolio" className="hover:underline">
              Masterplan Projeler
            </a>
            <a href="#unit-availability" className="hover:underline">
              Canlı Envanter & Mülkler
            </a>
            <a href="#financial-simulator" className="hover:underline">
              Ödeme & Vergi Motoru
            </a>
            <a href="#investor-concierge" className="hover:underline">
              İletişim
            </a>
          </div>
          <div>© {new Date().getFullYear()} {companyName}. Tüm hakları saklıdır.</div>
        </div>
      </footer>

      {/* Media & Video Lightbox Modal */}
      {activeMediaModal && (() => {
        const gallery: Array<{ title: string; url: string }> =
          Array.isArray(activeMediaModal.gallery) && activeMediaModal.gallery.length > 0
            ? activeMediaModal.gallery
            : [
                {
                  title: activeMediaModal.name,
                  url: activeMediaModal.cover || resortHeroSunlitAsset
                }
              ];
        const safeIdx = gallery.length > 0 ? modalGalleryIndex % gallery.length : 0;
        const activeSlide = gallery[safeIdx] || gallery[0];
        const displayTitle = activeSlide?.title || activeMediaModal.name;
        const displayImg = activeSlide?.url || activeMediaModal.cover || resortHeroSunlitAsset;

        const activeVideoUrl = String(
          activeMediaModal.videoUrl || (isYouTubeUrl(activeMediaModal.url) ? activeMediaModal.url : "")
        ).trim();
        const isYt = isYouTubeUrl(activeVideoUrl);
        const ytEmbedUrl = isYt ? getYouTubeEmbedUrl(activeVideoUrl, true) : null;
        const isDirectVid =
          !isYt &&
          Boolean(activeVideoUrl) &&
          (isDirectVideoFileUrl(activeVideoUrl) ||
            activeVideoUrl.startsWith("/api/storage/") ||
            activeVideoUrl.startsWith("/uploads/"));
        const drivePreviewUrl =
          !isYt && !isDirectVid && Boolean(activeVideoUrl) ? getGoogleDrivePreviewUrl(activeVideoUrl) : null;
        const shareTargetUrl = activeVideoUrl || activeSlide?.url || activeMediaModal.url || "";

        return (
          <div
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setActiveMediaModal(null)}
          >
            <div
              className="bg-white border border-stone-200 rounded-2xl max-w-4xl w-full p-5 text-slate-900 space-y-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <div className="text-xs text-[#9A7228] font-medium flex items-center gap-2 flex-wrap">
                    <span>
                      {activeMediaModal.projectName} · {activeMediaModal.category}
                      {!activeVideoUrl && gallery.length > 1 ? ` · (${safeIdx + 1} / ${gallery.length})` : ""}
                    </span>
                    {isYt && (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold">
                        YouTube Video
                      </span>
                    )}
                  </div>
                  <h4 className={`text-base font-semibold ${theme.headingFontClass}`}>{displayTitle}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMediaModal(null)}
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                {ytEmbedUrl ? (
                  <div className="aspect-video w-full bg-slate-950">
                    <iframe
                      src={ytEmbedUrl}
                      title={displayTitle}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : isDirectVid ? (
                  <video
                    controls
                    autoPlay
                    playsInline
                    poster={displayImg}
                    className="w-full max-h-[480px] object-cover bg-slate-950"
                  >
                    <source src={activeVideoUrl} type="video/mp4" />
                  </video>
                ) : drivePreviewUrl ? (
                  <div className="aspect-video w-full bg-slate-950">
                    <iframe
                      src={drivePreviewUrl}
                      title={displayTitle}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <img
                    src={displayImg}
                    alt={displayTitle}
                    referrerPolicy="no-referrer"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).src = resortHeroSunlitAsset;
                    }}
                    className="w-full max-h-[480px] object-contain bg-stone-950/5"
                  />
                )}

                {!activeVideoUrl && gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setModalGalleryIndex((prev) => (prev - 1 + gallery.length) % gallery.length)
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-md cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setModalGalleryIndex((prev) => (prev + 1) % gallery.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/95 hover:bg-white text-slate-900 shadow-md cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {!activeVideoUrl && gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {gallery.map((gItem, gIdx) => (
                    <button
                      key={`${gItem.url}_${gIdx}`}
                      type="button"
                      onClick={() => setModalGalleryIndex(gIdx)}
                      className={`relative w-20 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                        gIdx === safeIdx
                          ? "border-[#C5A059] ring-1 ring-[#C5A059]"
                          : "border-stone-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={gItem.url}
                        alt={gItem.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-xs text-slate-500">
                  {isYt
                    ? "YouTube üzerinden canlı akış — linki kopyalayabilir veya WhatsApp ile paylaşabilirsiniz."
                    : "Ortak proje medya havuzu ile senkronize yüksek çözünürlüklü mimari görsel / doküman."}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {shareTargetUrl && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shareTargetUrl);
                          toast.success("Bağlantı panoya kopyalandı.");
                        }}
                        className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-900 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Linki Kopyala</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const shareMsg = `*${companyName} — ${activeMediaModal.projectName || ""}*\n${displayTitle}\n${shareTargetUrl}`;
                          window.open(
                            `https://wa.me/?text=${encodeURIComponent(shareMsg)}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp Paylaş</span>
                      </button>
                    </>
                  )}
                  {(activeVideoUrl || activeSlide?.url || activeMediaModal.url) && (
                    <a
                      href={activeVideoUrl || activeSlide?.url || activeMediaModal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-xl text-white text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                        isYt ? "bg-rose-600 hover:bg-rose-700" : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isYt ? "YouTube'da İzle" : "Orijinal Dosyayı Aç"}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ModernDeveloperProjectLayout;
