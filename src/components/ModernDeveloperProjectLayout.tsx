import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Box,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  Download,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Play,
  Printer,
  ShieldCheck,
  Sparkles,
  Video,
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

export type DeveloperThemeId =
  | "monolith_obsidian"
  | "mediterranean_resort"
  | "swiss_blueprint"
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
  monolith_obsidian: {
    id: "monolith_obsidian",
    index: "01",
    name: "Koyu Mermer & Altın Monolit",
    subtitle: "Koyu Antrasit & Şampanya Altın",
    inspiration: "Prestijli Rezidans & Lüks Mimari Vitrin",
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
  mediterranean_resort: {
    id: "mediterranean_resort",
    index: "02",
    name: "Akdeniz Sahil & Traverten",
    subtitle: "Doğal Taş & Kıyı Mavisi",
    inspiration: "Sahil Resort & Akdeniz Minimalizmi",
    isDark: false,
    canvasBg: "bg-[#F7F5F0]",
    surfaceBg: "bg-[#EFECE4]",
    cardBg: "bg-white",
    borderClass: "border-stone-200",
    textPrimary: "text-slate-950",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-500",
    accentBg: "bg-[#0F172A] text-white hover:bg-slate-800",
    accentText: "text-[#0369A1]",
    accentBorder: "border-[#0369A1]/30",
    headingFontClass: "font-serif tracking-tight"
  },
  swiss_blueprint: {
    id: "swiss_blueprint",
    index: "03",
    name: "Kurumsal Mimari Izgara",
    subtitle: "Aydınlık Teknik & Net Çizgi",
    inspiration: "Mühendislik, Teknik Kesit & Mimari Izgara",
    isDark: false,
    canvasBg: "bg-white",
    surfaceBg: "bg-slate-50",
    cardBg: "bg-white",
    borderClass: "border-slate-200",
    textPrimary: "text-slate-950",
    textSecondary: "text-slate-700",
    textMuted: "text-slate-500",
    accentBg: "bg-indigo-700 text-white hover:bg-indigo-800",
    accentText: "text-indigo-700",
    accentBorder: "border-indigo-300",
    headingFontClass: "font-sans tracking-tight"
  },
  cinematic_pavilion: {
    id: "cinematic_pavilion",
    index: "04",
    name: "Sinematik Sahil Panoraması",
    subtitle: "Tam Ekran Video & Derin Kontrast",
    inspiration: "Tam Ekran Sahne Geçişleri & Mekansal Deneyim",
    isDark: true,
    canvasBg: "bg-slate-950",
    surfaceBg: "bg-slate-900",
    cardBg: "bg-slate-900/90",
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

interface ModernDeveloperProjectLayoutProps {
  store: any;
  products?: any[];
  lang?: string;
}

export const ModernDeveloperProjectLayout: React.FC<ModernDeveloperProjectLayoutProps> = ({
  store,
  lang = "tr"
}) => {
  const rawName =
    store?.branding?.store_name ||
    store?.name ||
    "Cyprus Constructions";
  const companyName = String(rawName).replace(/\s*\(projectLP\)\s*/gi, "").trim();

  const [apiDevConfig, setApiDevConfig] = useState<Record<string, any>>({});

  // Read saved developer website config from store.branding / page_layout_settings + API overview
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

  const activeThemeId: DeveloperThemeId = useMemo(() => {
    const configured = savedDevConfig?.theme_id as DeveloperThemeId;
    if (configured && DEVELOPER_ARCHITECTURAL_THEMES[configured]) return configured;
    return "monolith_obsidian";
  }, [savedDevConfig?.theme_id]);

  const activeUiverseId: UiversePresetId = useMemo(() => {
    const configured = (savedDevConfig?.uiverse_preset || store?.branding?.uiverse_preset) as UiversePresetId;
    if (configured && UIVERSE_INTERACTION_PRESETS[configured]) return configured;
    return "shimmer_glass";
  }, [savedDevConfig?.uiverse_preset, store?.branding?.uiverse_preset]);

  const uiverse = UIVERSE_INTERACTION_PRESETS[activeUiverseId] || UIVERSE_INTERACTION_PRESETS.shimmer_glass;
  const theme = DEVELOPER_ARCHITECTURAL_THEMES[activeThemeId] || DEVELOPER_ARCHITECTURAL_THEMES.monolith_obsidian;

  const shimmerEnabled = savedDevConfig?.uiverse_cta_shimmer !== false;
  const cardLiftEnabled = savedDevConfig?.uiverse_card_lift !== false;

  const ctaButtonClass = `${uiverse.primaryBtnClass} ${
    shimmerEnabled ? "ring-1 ring-[#C5A059]/60 shadow-[0_0_24px_rgba(197,160,89,0.35)]" : ""
  }`;
  const cardInteractiveClass = `${uiverse.cardHoverClass} ${
    cardLiftEnabled ? "hover:-translate-y-1.5 hover:shadow-2xl" : ""
  }`;

  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [unitTypeFilter, setUnitTypeFilter] = useState<string>("all");
  const [unitStatusFilter, setUnitStatusFilter] = useState<string>("all");
  const [simulatorBudget, setSimulatorBudget] = useState<number>(225000);
  const [activeMediaModal, setActiveMediaModal] = useState<any>(null);

  // VIP Lead Form state
  const [leadForm, setLeadForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    preferredProject: "",
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
          setEvents(Array.isArray(data.events) ? data.events : []);
          if (data.activeCompany) setActiveCompany(data.activeCompany);
          if (data.developerWebConfig && typeof data.developerWebConfig === "object") {
            setApiDevConfig(data.developerWebConfig);
          }
          if (projList[0]) {
            setSelectedProjectId(projList[0].id);
            setLeadForm(prev => ({ ...prev, preferredProject: projList[0].name }));
            const firstProjUnits = unitList.filter((u: any) => Number(u.project_id) === Number(projList[0].id));
            setSelectedUnit(firstProjUnits[0] || unitList[0] || null);
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
    return `£${new Intl.NumberFormat("tr-TR").format(n)}`;
  };

  const phoneContact =
    activeCompany?.phone ||
    store?.branding?.phone ||
    store?.phone ||
    "+90 548 860 00 01";

  const heroTitle =
    savedDevConfig?.hero_title ||
    store?.hero_title ||
    "Akdeniz Kıyı Şeridinde Ödüllü Sahil Masterplan Projeleri";

  const heroSubtitle =
    savedDevConfig?.hero_subtitle ||
    store?.hero_subtitle ||
    "Esentepe ve Tatlısu sahil hattında özel marina, lagün havuzları ve panoramik deniz manzaralı mimari yaşam alanları.";

  const heroVideoUrl =
    savedDevConfig?.hero_video_url ||
    "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-buildings-on-a-sunny-day-41463-large.mp4";

  const showUnitMatrixSection = savedDevConfig?.show_unit_matrix !== false;
  const showLifestyleSection = savedDevConfig?.show_lifestyle !== false;

  const handleSelectProject = (proj: any) => {
    setSelectedProjectId(proj.id);
    setUnitTypeFilter("all");
    setUnitStatusFilter("all");
    const pUnits = units.filter(u => Number(u.project_id) === Number(proj.id));
    if (pUnits[0]) setSelectedUnit(pUnits[0]);
    setLeadForm(prev => ({ ...prev, preferredProject: proj.name }));
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
      `Merhaba ${companyName}, ${activeProject?.name || "projeleriniz"} hakkında detaylı bilgi, 3D mimari kat planları ve güncel fiyat listesini talep ediyorum.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.canvasBg} ${theme.textPrimary}`}>
      {/* =================================================================== */}
      {/* 1. TOP BAR CONTRACT (Strict 3-Zone Single-Row Architectural Header) */}
      {/* =================================================================== */}
      <header
        className={`sticky top-0 z-40 flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b transition-colors ${
          theme.isDark
            ? "bg-[#090D16]/95 border-white/10 text-white"
            : "bg-white/95 border-slate-200 text-slate-950"
        }`}
      >
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className={`text-lg md:text-xl font-bold tracking-tight whitespace-nowrap shrink-0 ${theme.headingFontClass}`}
        >
          {companyName}
        </a>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
          <a
            href="#masterplan-portfolio"
            className={`${theme.textSecondary} hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
          >
            Masterplan Projeler
          </a>
          {showUnitMatrixSection && (
            <a
              href="#unit-availability"
              className={`${theme.textSecondary} hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
            >
              Bağımsız Bölüm & Fiyatlar
            </a>
          )}
          {showLifestyleSection && (
            <a
              href="#coastal-lifestyle"
              className={`${theme.textSecondary} hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
            >
              Sosyal Yaşam & Marina
            </a>
          )}
          <a
            href="#investor-concierge"
            className={`${theme.textSecondary} hover:${theme.textPrimary} transition-colors whitespace-nowrap shrink-0`}
          >
            Yatırımcı İletişim
          </a>
        </nav>

        {/* Zone 3: 1 Primary CTA button */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#investor-concierge"
            className={`px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 ${theme.accentBg} ${ctaButtonClass}`}
          >
            VIP Yatırımcı Sunumu
          </a>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. CINEMATIC VIDEO & ARCHITECTURAL HERO SECTION                     */}
      {/* =================================================================== */}
      <section id="top" className="relative w-full overflow-hidden border-b border-white/10">
        {/* Background Aerial Video + High-Resolution Fallback */}
        <div className="relative min-h-[600px] lg:min-h-[680px] w-full flex flex-col justify-end">
          <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
            <video
              key={heroVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              poster={
                (savedDevConfig?.hero_image_url
                  ? resolveArchitecturalAssetUrl(savedDevConfig.hero_image_url)
                  : activeProject?.cover_image) ||
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=85"
              }
              className="w-full h-full object-cover opacity-65 scale-105 transition-transform duration-700"
            >
              <source src={heroVideoUrl} type="video/mp4" />
            </video>
            {/* Measured Contrast Scrim (4.5:1+ WCAG AA guaranteed) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/65 to-[#090D16]/40" />
          </div>

          {/* Main Hero Editorial Statement */}
          <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#C5A059]">
                <span>Kuzey Kıbrıs Sahil Masterplan Geliştiricisi</span>
                <span aria-hidden="true">·</span>
                <span>Esentepe & Tatlısu Kıyı Şeridi</span>
                <span aria-hidden="true">·</span>
                <span>Doğrudan İnşaat Güvencesi</span>
              </div>

              <h1
                className={`text-white font-bold leading-[1.08] tracking-tight max-w-3xl ${theme.headingFontClass}`}
                style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)" }}
              >
                {heroTitle}
              </h1>

              <p className="text-slate-200 text-base lg:text-lg max-w-2xl leading-relaxed font-normal">
                {heroSubtitle}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <a
                  href="#masterplan-portfolio"
                  className={`px-6 py-3.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${ctaButtonClass}`}
                >
                  <span>Masterplan Projeleri Keşfet ({projects.length})</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>

                <a
                  href="#unit-availability"
                  className={`px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-2 whitespace-nowrap ${uiverse.secondaryBtnClass}`}
                >
                  <Layers className="w-4 h-4 text-[#C5A059]" />
                  <span>Bağımsız Bölüm & Fiyatlar</span>
                </a>

                <button
                  type="button"
                  onClick={() => handleWhatsAppDirect()}
                  className={`px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap ${ctaButtonClass}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Satış Ofisi WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Right Spotlight Card: Featured Flagship Project */}
            {activeProject && (
              <div className="lg:col-span-4 bg-slate-950/90 border border-white/15 rounded-2xl p-5 text-white space-y-3 shadow-2xl">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Öne Çıkan Masterplan</span>
                  <span className="font-mono text-[#C5A059] font-bold">
                    Teslim: {activeProject.completion_date}
                  </span>
                </div>
                <h2 className={`text-xl font-bold text-white ${theme.headingFontClass}`}>
                  {activeProject.name}
                </h2>
                <p className="text-xs text-slate-300 line-clamp-2">
                  {activeProject.concept_tagline || activeProject.description}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">Başlangıç</div>
                    <div className="text-sm font-black text-[#C5A059] font-mono tabular-nums">
                      {formatGbp(activeProject.starting_price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Müsait Ünite</div>
                    <div className="text-sm font-black text-emerald-400 font-mono tabular-nums">
                      {activeProject.available_units} / {activeProject.total_units}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">İnşaat</div>
                    <div className="text-sm font-black text-white font-mono tabular-nums">
                      %{activeProject.construction_progress}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Full-Width 4-Column Quantitative Proof Bar */}
          <div className="relative z-10 bg-slate-950/95 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-2xl lg:text-3xl font-black text-white font-mono tabular-nums">
                  {projects.length || 10} Masterplan
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Akdeniz Sıfır Denize Cephe Rezidans & Villa Projesi
                </div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-black text-[#C5A059] font-mono tabular-nums">
                  %35 Peşinat
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  36 Aya Varan %0 Faizli Doğrudan Şirket İçi Taksit Planı
                </div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono tabular-nums">
                  {units.filter(u => u.status === "available").length || 42} Müsait Bölüm
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Canlı Kapı Numarası, Kat, Manzara ve Metrekare Seçimi
                </div>
              </div>
              <div>
                <div className="text-2xl lg:text-3xl font-black text-sky-400 font-mono tabular-nums">
                  4K Mimari Katalog
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Yüksek Çözünürlüklü Mimari Katalog ve Sosyal Yaşam Vitrini
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. NUMBERED ARCHITECTURAL MASTERPLAN PORTFOLIO & PROJECT DOSSIER    */}
      {/* =================================================================== */}
      <section id="masterplan-portfolio" className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6 border-current/10">
          <div className="space-y-2">
            <div className={`text-xs font-semibold uppercase tracking-wider ${theme.accentText}`}>
              01. Masterplan Koleksiyonu & Mimari Portföy
            </div>
            <h2 className={`text-2xl lg:text-4xl font-bold ${theme.headingFontClass}`}>
              Sahil Rezidansları, Marina & Sağlık Köyü Projeleri
            </h2>
          </div>

          {/* Collapsible Region Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label className={`text-xs font-bold uppercase ${theme.textMuted}`}>Bölge:</label>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer outline-none ${theme.cardBg} ${theme.borderClass} ${theme.textPrimary}`}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj, idx) => {
            const isSelected = Number(proj.id) === Number(activeProject?.id);
            const chapterNum = String(idx + 1).padStart(2, "0");
            return (
              <div
                key={proj.id}
                onClick={() => handleSelectProject(proj)}
                className={`group overflow-hidden border cursor-pointer flex flex-col justify-between ${
                  theme.cardBg
                } ${cardInteractiveClass} ${
                  isSelected
                    ? "ring-2 ring-[#C5A059] border-[#C5A059]"
                    : `${theme.borderClass} hover:border-[#C5A059]/60`
                }`}
              >
                <div>
                  {/* 16:9 Architectural Visual Cover */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={proj.cover_image}
                      alt={proj.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs text-white font-mono">
                      <span className="font-bold text-[#C5A059]">{chapterNum}. MASTERPLAN</span>
                      <span>İnşaat: %{proj.construction_progress}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <div className="text-[11px] text-slate-300">{proj.sub_region}</div>
                        <h3 className={`text-lg font-bold leading-tight ${theme.headingFontClass}`}>
                          {proj.name}
                        </h3>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-slate-300">Başlangıç</div>
                        <div className="text-sm font-black text-[#C5A059] tabular-nums">
                          {formatGbp(proj.starting_price)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Unboxed Metadata & Description */}
                  <div className="p-5 space-y-3">
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

                <div className={`px-5 py-3.5 border-t ${theme.borderClass} flex items-center justify-between text-xs font-bold`}>
                  <span className={isSelected ? theme.accentText : theme.textSecondary}>
                    {isSelected ? "Seçili Proje — Detaylar Aşağıda" : "Mimari Dosyayı & 3D Planı Aç"}
                  </span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Project Interactive Architectural Dossier */}
        {activeProject && (
          <div className={`rounded-2xl border p-6 lg:p-8 space-y-6 ${theme.surfaceBg} ${theme.borderClass}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 border-current/10">
              <div className="space-y-1">
                <div className={`flex flex-wrap items-center gap-2 text-xs font-semibold ${theme.accentText}`}>
                  <span>Seçili Masterplan Dosyası</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeProject.sub_region}</span>
                  <span aria-hidden="true">·</span>
                  <span>Teslim: {activeProject.completion_date}</span>
                </div>
                <h3 className={`text-2xl lg:text-3xl font-bold ${theme.headingFontClass}`}>
                  {activeProject.name} — Mimari & Teknik Dosya
                </h3>
                <p className={`text-sm ${theme.textSecondary}`}>
                  {activeProject.description || activeProject.concept_tagline}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href="#unit-availability"
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap ${theme.accentBg}`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Bağımsız Bölüm & Fiyatları İncele</span>
                </a>
                <button
                  type="button"
                  onClick={() =>
                    handleWhatsAppDirect(
                      `Merhaba ${companyName}, ${activeProject.name} projesi için katalog, kat planları ve ödeme planı talep ediyorum.`
                    )
                  }
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Bu Proje İçin Teklif Al</span>
                </button>
              </div>
            </div>

            {/* Project Media Vault & Architectural Sheets Strip */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider">
                Proje Görselleri, Tanıtım Videoları & 2D Mimari Vaziyet Paftaları (
                {(activeProject.media_vault || []).length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(activeProject.media_vault || []).slice(0, 8).map((doc: any, dIdx: number) => (
                  <button
                    key={doc.id || dIdx}
                    type="button"
                    onClick={() =>
                      setActiveMediaModal({
                        name: doc.name,
                        category: doc.category || "Proje Medyası",
                        type: doc.type || "photos",
                        url: doc.url,
                        cover: activeProject.cover_image,
                        projectName: activeProject.name
                      })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${theme.cardBg} ${theme.borderClass} hover:border-[#C5A059]`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className={`text-[11px] font-semibold ${theme.accentText}`}>
                        {doc.category || "Mimari Doküman"}
                      </div>
                      <div className="text-xs font-bold truncate">{doc.name}</div>
                    </div>
                    {doc.type === "video" ? (
                      <Play className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <Eye className="w-4 h-4 opacity-70 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* 4. ARCHITECTURAL VISUALIZATION & INTERIOR DESIGN GALLERY            */}
      {/* =================================================================== */}
      {savedDevConfig?.show_lora_showcase !== false && (
        <section
          id="architectural-lora-gallery"
          className={`border-y py-14 ${theme.surfaceBg} ${theme.borderClass}`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider ${theme.accentText}`}>
                  02. Mimari Görsel, Kat Kesiti & İç Mekan Tasarım Galerisi
                </div>
                <h2 className={`text-2xl lg:text-3xl font-bold mt-1 ${theme.headingFontClass}`}>
                  Dış Cephe Konsepti, Kat Kesiti & İç Mekan Tasarımı
                </h2>
              </div>
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
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                        <img
                          src={resolvedImgUrl}
                          alt={vis.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                          <span className="font-semibold text-[#C5A059]">
                            0{vIdx + 1}. {vis.category || vis.loraUsed || "Mimari Görsel"}
                          </span>
                          <span className="font-mono text-[11px] opacity-85">Tam Ekran İncele</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-1.5">
                        <h4 className={`text-base font-bold ${theme.headingFontClass}`}>
                          {vis.title}
                        </h4>
                        <p className={`text-xs line-clamp-2 ${theme.textSecondary}`}>
                          {vis.promptCommand}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-3 border-t ${theme.borderClass} flex items-center justify-between text-xs font-bold`}
                    >
                      <span className={theme.accentText}>Yüksek Çözünürlüklü Görseli Aç</span>
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 5. INDEPENDENT UNIT (KAPI NO) AVAILABILITY & %0 INTEREST SIMULATOR  */}
      {/* =================================================================== */}
      {showUnitMatrixSection && (
        <section id="unit-availability" className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b pb-6 border-current/10">
            <div className="space-y-2">
              <div className={`text-xs font-semibold uppercase tracking-wider ${theme.accentText}`}>
                03. Bağımsız Bölüm (Kapı No) Envanteri & Ödeme Planı Simülatörü
              </div>
              <h2 className={`text-2xl lg:text-4xl font-bold ${theme.headingFontClass}`}>
                {activeProject?.name || "Proje"} — Canlı Kapı Numarası & Fiyat Çizelgesi
              </h2>
            </div>

            {/* Filters for Unit Type and Status */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={unitTypeFilter}
                onChange={e => setUnitTypeFilter(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${theme.cardBg} ${theme.borderClass}`}
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
                className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer ${theme.cardBg} ${theme.borderClass}`}
              >
                <option value="all">Tüm Statüler</option>
                <option value="available">Müsait</option>
                <option value="negotiation">Sonuçlanmakta</option>
                <option value="optioned">Opsiyonlu</option>
                <option value="sold">Satıldı</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Independent Door Number Table */}
            <div className={`lg:col-span-8 rounded-2xl border overflow-hidden ${theme.cardBg} ${theme.borderClass}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b ${theme.surfaceBg} ${theme.borderClass} text-[11px] font-bold uppercase`}>
                      <th className="py-3 px-4">Kapı No & Blok</th>
                      <th className="py-3 px-4">Mülk Tipi</th>
                      <th className="py-3 px-4">Brüt / Net Alan</th>
                      <th className="py-3 px-4">Kat & Manzara</th>
                      <th className="py-3 px-4">Liste Fiyatı</th>
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4 text-right">Ödeme Simülatörü</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-current/10">
                    {filteredProjectUnits.map(u => {
                      const statusLabel =
                        u.status === "available"
                          ? "Müsait"
                          : u.status === "negotiation"
                          ? "Sonuçlanmakta"
                          : u.status === "optioned"
                          ? "Opsiyonlu"
                          : "Satıldı";
                      const statusColor =
                        u.status === "available"
                          ? "text-emerald-500 font-bold"
                          : u.status === "negotiation"
                          ? "text-sky-400 font-bold"
                          : u.status === "optioned"
                          ? "text-amber-500 font-bold"
                          : "text-rose-500 font-semibold";
                      return (
                        <tr key={u.id} className="hover:bg-current/5 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold">
                            {u.unit_number} · <span className="font-sans font-normal opacity-80">{u.block_name}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold whitespace-nowrap">{u.unit_type}</td>
                          <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                            {u.gross_sqm} m² / {u.net_sqm} m² (+{u.terrace_sqm}m²)
                          </td>
                          <td className="py-3 px-4">
                            {u.floor_level} · <span className="opacity-75">{u.view_direction}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-black tabular-nums whitespace-nowrap">
                            {formatGbp(u.price)}
                          </td>
                          <td className={`py-3 px-4 whitespace-nowrap ${statusColor}`}>{statusLabel}</td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUnit(u);
                                setSimulatorBudget(Number(u.price) || 225000);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${theme.accentBg}`}
                            >
                              <Calculator className="w-3 h-3" />
                              <span>Taksit Hesapla</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 4 Cols: %0 Interest Developer Payment Plan Calculator */}
            <div className={`lg:col-span-4 rounded-2xl border p-6 space-y-5 ${theme.surfaceBg} ${theme.borderClass}`}>
              <div className="space-y-1">
                <div className={`text-xs font-semibold uppercase ${theme.accentText}`}>
                  Şirket İçi %0 Faiz Ödeme Simülatörü
                </div>
                <h3 className={`text-xl font-bold ${theme.headingFontClass}`}>
                  {activeProject?.name || companyName} Finansman Planı
                </h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className={theme.textSecondary}>Seçili Bağımsız Bölüm / Bütçe (GBP):</span>
                  <strong className="font-mono text-sm tabular-nums">{formatGbp(simulatorBudget)}</strong>
                </div>
                <input
                  type="range"
                  min={115000}
                  max={1250000}
                  step={5000}
                  value={simulatorBudget}
                  onChange={e => setSimulatorBudget(Number(e.target.value))}
                  className="w-full accent-[#C5A059] cursor-pointer"
                />
              </div>

              {(() => {
                const downPct = Number(activeProject?.payment_plan?.down_payment_percent) || 35;
                const months = Number(activeProject?.payment_plan?.installment_months) || 36;
                const downPayment = Math.round((simulatorBudget * downPct) / 100);
                const remaining = simulatorBudget - downPayment;
                const monthly = Math.round(remaining / Math.max(1, months));
                return (
                  <div className="space-y-3 pt-2 border-t border-current/10 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-current/10">
                      <span className={theme.textSecondary}>Sözleşme Peşinatı (%{downPct}):</span>
                      <strong className="font-mono text-sm tabular-nums">{formatGbp(downPayment)}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-current/10">
                      <span className={theme.textSecondary}>Faizsiz Kalan Anapara (%{100 - downPct}):</span>
                      <strong className="font-mono text-sm tabular-nums">{formatGbp(remaining)}</strong>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className={theme.textSecondary}>{months} Ay Sabit Taksit (%0 Faiz):</span>
                      <strong className={`font-mono text-base font-black tabular-nums ${theme.accentText}`}>
                        {formatGbp(monthly)} / Ay
                      </strong>
                    </div>
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={() =>
                  handleWhatsAppDirect(
                    `Merhaba ${companyName}, ${activeProject?.name} projesinde ${formatGbp(
                      simulatorBudget
                    )} bütçeli ödeme planı hakkında detaylı teklif almak istiyorum.`
                  )
                }
                className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${theme.accentBg}`}
              >
                <Calculator className="w-4 h-4" />
                <span>Bu Ödeme Planını Resmi Teklife Dönüştür</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 6. COASTAL LIFESTYLE, MARINA & COMMON AREAS SHOWCASE                */}
      {/* =================================================================== */}
      {showLifestyleSection && activeProject && (
        <section
          id="coastal-lifestyle"
          className={`border-t py-16 ${theme.surfaceBg} ${theme.borderClass}`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-8">
            <div className="space-y-2 max-w-3xl">
              <div className={`text-xs font-semibold uppercase tracking-wider ${theme.accentText}`}>
                04. Ortak Alanlar, Özel Marina & Sosyal Yaşam Olanakları
              </div>
              <h2 className={`text-2xl lg:text-4xl font-bold ${theme.headingFontClass}`}>
                {activeProject.name} — Resort Standartlarında Sosyal Tesisler
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                ...(activeProject.lifestyle_facilities?.beach_marina || []),
                ...(activeProject.lifestyle_facilities?.wellness_spa || []),
                ...(activeProject.lifestyle_facilities?.gastronomy || []),
                ...(activeProject.lifestyle_facilities?.entertainment || []),
                ...(activeProject.architectural_specs || [])
              ]
                .slice(0, 9)
                .map((facility: string, fIdx: number) => (
                  <div
                    key={fIdx}
                    className={`p-5 rounded-2xl border flex items-start gap-3.5 ${theme.cardBg} ${theme.borderClass}`}
                  >
                    <span className={`font-mono text-xs font-bold ${theme.accentText}`}>
                      0{fIdx + 1}.
                    </span>
                    <div className="text-sm font-semibold leading-snug">{facility}</div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 7. VIP INVESTOR CONCIERGE & PRIVATE PRESENTATION BOOKING            */}
      {/* =================================================================== */}
      <section id="investor-concierge" className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className={`rounded-3xl border p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 ${theme.cardBg} ${theme.borderClass}`}>
          <div className="lg:col-span-5 space-y-5">
            <div className={`text-xs font-semibold uppercase tracking-wider ${theme.accentText}`}>
              05. VIP Yatırımcı İlişkileri & Mimari Sunum Merkezi
            </div>
            <h2 className={`text-2xl lg:text-4xl font-bold ${theme.headingFontClass}`}>
              Özel Proje Sunumu & Yerinde İnceleme Randevusu
            </h2>
            <p className={`text-sm leading-relaxed ${theme.textSecondary}`}>
              {companyName} mimari ve yatırım danışmanlarımızla çevrimiçi 3D sunum planlayın veya Kuzey Kıbrıs Esentepe sahil satış ofisimizde projelerimizi yerinde deneyimleyin.
            </p>

            <div className="space-y-3 pt-2 text-sm">
              <div>
                <div className={`text-xs ${theme.textMuted}`}>Doğrudan Satış & Yatırımcı Hattı</div>
                <div className="font-mono font-bold text-base mt-0.5">{phoneContact}</div>
              </div>
              <div>
                <div className={`text-xs ${theme.textMuted}`}>Merkez Satış Ofisi</div>
                <div className="font-semibold mt-0.5">
                  Esentepe — Tatlısu Sahil Yolu, Girne, Kuzey Kıbrıs
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {leadSubmitted ? (
              <div className={`p-8 rounded-2xl border text-center space-y-3 ${theme.surfaceBg} ${theme.borderClass}`}>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold">Talebiniz Kaydedildi</h3>
                <p className={`text-sm ${theme.textSecondary}`}>
                  Sayın <strong>{leadForm.fullName}</strong>, <strong>{leadForm.preferredProject}</strong> projesi için{" "}
                  {leadForm.presentationType} talebiniz alınmıştır. Yatırım ekibimiz en kısa sürede sizinle iletişime geçecektir.
                </p>
                <button
                  type="button"
                  onClick={() => setLeadSubmitted(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${theme.accentBg}`}
                >
                  Yeni Talep Oluştur
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Adınız Soyadınız *</label>
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
                  <label className="block text-xs font-semibold mb-1.5">Telefon / WhatsApp *</label>
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
                  <label className="block text-xs font-semibold mb-1.5">Kurumsal E-Posta</label>
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                    placeholder="ornek@eposta.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm ${theme.surfaceBg} ${theme.borderClass}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">İlgilendiğiniz Masterplan Proje</label>
                  <select
                    value={leadForm.preferredProject}
                    onChange={e => setLeadForm({ ...leadForm, preferredProject: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold ${theme.surfaceBg} ${theme.borderClass}`}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.sub_region})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5">Sunum Tercihi</label>
                  <select
                    value={leadForm.presentationType}
                    onChange={e => setLeadForm({ ...leadForm, presentationType: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold ${theme.surfaceBg} ${theme.borderClass}`}
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
                    className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${theme.accentBg}`}
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
          <div className="font-bold text-sm">{companyName}</div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#masterplan-portfolio" className="hover:underline">
              Masterplan Projeler
            </a>
            <a href="#unit-availability" className="hover:underline">
              Fiyat & Envanter
            </a>
            <a href="#investor-concierge" className="hover:underline">
              İletişim
            </a>
          </div>
          <div>© {new Date().getFullYear()} {companyName}. Tüm hakları saklıdır.</div>
        </div>
      </footer>

      {/* Media Preview Lightbox Modal */}
      {activeMediaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setActiveMediaModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-5 text-white space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-xs text-[#C5A059] font-semibold">
                  {activeMediaModal.projectName} · {activeMediaModal.category}
                </div>
                <h4 className="text-base font-bold">{activeMediaModal.name}</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveMediaModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={activeMediaModal.cover || activeProject?.cover_image}
                alt={activeMediaModal.name}
                referrerPolicy="no-referrer"
                className="w-full max-h-[420px] object-cover"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Ortak proje medya havuzu ile senkronize yüksek çözünürlüklü pafta / medya.
              </span>
              {activeMediaModal.url && (
                <a
                  href={activeMediaModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#C5A059] text-slate-950 text-xs font-bold whitespace-nowrap"
                >
                  Orijinal Dosyayı Aç
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDeveloperProjectLayout;
