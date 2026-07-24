import React, { useState, useEffect, useRef, useMemo } from "react";
import { LiteRichEditor } from "../../components/LiteRichEditor";
import {
  Layout,
  Palette,
  Settings,
  Eye,
  Globe,
  Map,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Check,
  Users,
  BarChart3,
  Image as ImageIcon,
  Plus,
  Newspaper,
  Save,
  Upload,
  X,
  Type,
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../services/api";

interface SectionConfig {
  id: string;
  label: string;
  icon: any;
  enabled: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}

interface WebContent {
  hero: { title: string; subtitle: string; bgImage: string };
  stats: { value: string; label: string }[];
  trustSlogan: string;
}

export const PortfolioWebsiteGenerator = ({
  storeId,
}: {
  storeId?: number;
}) => {
  const { lang } = useLanguage();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [radarNews, setRadarNews] = useState<any[]>([]);

  const [originalBranding, setOriginalBranding] = useState<any>({});
  const [banners, setBanners] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const isAutomotive = originalBranding?.store_type === 'motor_vehicle' || originalBranding?.page_layout_settings?.sector === 'automotive';

  useEffect(() => {
    if (storeId) {
      // Fetch store data to load existing page_layout
      api
        .getBranding(storeId)
        .then((res) => {
          if (res && !res.error) {
            setOriginalBranding(res);
            if (res.logo_url) setLogoUrl(res.logo_url);
            if (res.favicon_url) setFaviconUrl(res.favicon_url);

            if (res.page_layout) {
              let layout = res.page_layout;
              if (typeof layout === "string") {
                try {
                  layout = JSON.parse(layout);
                } catch (e) {}
              }

              if (
                layout &&
                typeof layout === "object" &&
                !Array.isArray(layout)
              ) {
                if (layout.sections) {
                  setSections((prev) =>
                    prev.map((s) => {
                      const found = (layout.sections as any[]).find(
                        (ls) => ls.id === s.id,
                      );
                      return found ? { ...s, enabled: found.enabled } : s;
                    }),
                  );
                }
                if (layout.grid) setGridLayout(layout.grid);
                if (layout.count) setFeaturedCount(layout.count);
                if (layout.quickLinks) setQuickLinks(layout.quickLinks);
                if (layout.corporateLinks)
                  setCorporateLinks(layout.corporateLinks);
                if (layout.banners && Array.isArray(layout.banners)) {
                  setBanners(layout.banners);
                  if (layout.banners.length > 0) {
                    setContent((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, bgImage: layout.banners[0] },
                    }));
                  }
                }
              } else if (Array.isArray(layout)) {
                setSections((prev) =>
                  prev.map((s) => {
                    const found = (layout as any[]).find(
                      (ls) => ls.id === s.id,
                    );
                    return found ? { ...s, enabled: found.enabled } : s;
                  }),
                );
              }
            }
            if (res.slug) {
              setStoreSlug(res.slug);
              api
                .getPublicRadarNews(res.slug)
                .then((newsRes) => {
                  if (Array.isArray(newsRes)) {
                    setRadarNews(newsRes);
                  }
                })
                .catch(console.error);
            }
            if (res.custom_domain) {
              setCustomDomain(res.custom_domain);
              setUseCustomDomain(true);
            }
            if (res.slogan)
              setContent((prev) => ({ ...prev, trustSlogan: res.slogan }));
            if (res.hero_image_url && (!banners || banners.length === 0)) {
              setContent((prev) => ({
                ...prev,
                hero: { ...prev.hero, bgImage: res.hero_image_url },
              }));
            }

            const isAuto = res.store_type === 'motor_vehicle' || res.page_layout_settings?.sector === 'automotive';
            if (isAuto) {
              setContent((prev) => ({
                ...prev,
                hero: {
                  title: prev.hero.title === "Kuzey Kıbrıs'ın En Seçkin Portföyü" || prev.hero.title === "North Cyprus' Most Exclusive Portfolio"
                    ? (lang === 'tr' ? "Kuzey Kıbrıs'ın En Seçkin Araç Portföyü" : "North Cyprus' Most Exclusive Car Portfolio")
                    : prev.hero.title,
                  subtitle: prev.hero.subtitle === "Yatırım hayallerinizi gerçeğe dönüştüren profesyonel gayrimenkul çözümleri." || prev.hero.subtitle === "Professional real estate solutions turning your investment dreams into reality."
                    ? (lang === 'tr' ? "Seçkin otomobiller ve prestijli taşıt portföyleriyle güvendesiniz." : "Delightful range of select luxury and condition-focused vehicles.")
                    : prev.hero.subtitle,
                  bgImage: prev.hero.bgImage.includes("photo-1600585154340-be6161a56a0c")
                    ? "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=2000&q=80"
                    : prev.hero.bgImage
                },
                stats: prev.stats.map((st, idx) => {
                  if (idx === 1 && st.label === (lang === 'tr' ? "Yönetilen Varlık" : "Assets Managed")) {
                    return { value: "1.2B₺", label: lang === 'tr' ? "İşlem Hacmi" : "Transaction Volume" };
                  }
                  return st;
                })
              }));
            }
          }
        })
        .catch(console.error);

      api
        .getBlogPosts(storeId)
        .then((res) => {
          if (Array.isArray(res)) {
            setBlogs(res.filter((b) => b.is_published).slice(0, 3));
          }
        })
        .catch(console.error);

      api
        .getConsultants(storeId)
        .then((res) => {
          if (Array.isArray(res)) {
            setTeam(
              res.map((c) => ({
                id: c.id.toString(),
                name: c.name,
                role: c.role || "Danışman",
                image:
                  c.image_url ||
                  "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
              })),
            );
          }
        })
        .catch(console.error);
    }
  }, [storeId]);

  const handleSave = async () => {
    if (!storeId) return;
    try {
      const normalizedBanners = (banners || []).map((b: any, idx: number) => {
        if (typeof b === 'string') {
          return {
            id: `slide_${idx}`,
            image_url: b,
            title: content.hero.title,
            subtitle: content.hero.subtitle,
            text_position: "center",
            show_store_name: true,
            button_text: lang === 'tr' ? "İncele" : "Explore",
            button_link: "#portfolio"
          };
        }
        return {
          ...b,
          image_url: b.image_url || b.url || ""
        };
      });

      const updatedLayout = {
        sections: sections.map((s) => ({ id: s.id, enabled: s.enabled })),
        grid: gridLayout,
        count: featuredCount,
        banners: normalizedBanners,
        team: team,
        quickLinks,
        corporateLinks,
      };

      const firstBannerUrl = normalizedBanners.length > 0 ? normalizedBanners[0].image_url : originalBranding.hero_image_url;

      const payload = {
        ...originalBranding,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        page_layout: updatedLayout,
        page_layout_settings: { ...originalBranding.page_layout_settings, web_content: content, team: team },
        team: team,
        slogan: content.trustSlogan,
        slug: storeSlug,
        custom_domain: useCustomDomain ? customDomain : null,
        hero_image_url: firstBannerUrl,
        banners: normalizedBanners,
      };

      await api.updateBranding(payload, storeId);
      alert(
        lang === "tr"
          ? "Ayarlar başarıyla kaydedildi!"
          : "Settings saved successfully!",
      );
    } catch (error) {
      console.error(error);
      alert(
        lang === "tr"
          ? "Kaydedilirken bir hata oluştu."
          : "An error occurred while saving.",
      );
    }
  };
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [activeStep, setActiveStep] = useState(1);
  const [storeSlug, setStoreSlug] = useState("abone");
  const [customDomain, setCustomDomain] = useState("");
  const [useCustomDomain, setUseCustomDomain] = useState(false);
  const [featuredCount, setFeaturedCount] = useState(6);
  const [quickLinks, setQuickLinks] = useState<
    { label: string; url: string; content?: string; type?: "url" | "content" }[]
  >([
    { label: "Mülklerimiz", url: "#portfolio", type: "url" },
    { label: "Bölgelerimiz", url: "#", type: "url" },
    {
      label: "Biz Kimiz?",
      url: "",
      type: "content",
      content: lang === "tr"
        ? `Biz ${originalBranding?.store_name || originalBranding?.name || "Seçkin Mağaza"} ekibi olarak yatırımlarınıza değer katıyoruz.`
        : `As the ${originalBranding?.store_name || originalBranding?.name || "Premium Store"} team, we add value to your investments.`,
    },
    { label: "İletişim", url: "#contact", type: "url" },
  ]);
  const [corporateLinks, setCorporateLinks] = useState<
    { label: string; url: string; content?: string; type?: "url" | "content" }[]
  >([
    {
      label: "Gizlilik Politikası",
      url: "",
      type: "content",
      content: "KVKK ve Gizlilik Politikası şartnameleri...",
    },
    {
      label: "Kullanım Koşulları",
      url: "",
      type: "content",
      content: "Sitemizi kullanım koşulları...",
    },
    {
      label: "KVKK Aydınlatma",
      url: "",
      type: "content",
      content: "KVKK aydınlatma metni...",
    },
  ]);

  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingLinkInfo, setEditingLinkInfo] = useState<{
    list: "quick" | "corporate";
    index: number;
  } | null>(null);

  const editorRef = useRef(null);
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "İçerik girmeye başlayın...",
      height: 400,
    }),
    [],
  );

  const currentUrl =
    useCustomDomain && customDomain
      ? customDomain
      : `lookprice.net/s/${storeSlug}`;
  const [gridLayout, setGridLayout] = useState("standard");
  const [sections, setSections] = useState<SectionConfig[]>([
    {
      id: "hero",
      label: lang === "tr" ? "Karşılama Ekranı" : "Hero Section",
      icon: ImageIcon,
      enabled: true,
    },
    {
      id: "search",
      label: lang === "tr" ? "Akıllı Filtreler" : "Smart Filters",
      icon: Search,
      enabled: true,
    },
    {
      id: "stats",
      label: lang === "tr" ? "Başarı Rakamları" : "Trust Stats",
      icon: BarChart3,
      enabled: true,
    },
    {
      id: "portfolio",
      label: lang === "tr" ? "Portföy Izgarası" : "Portfolio Grid",
      icon: Layout,
      enabled: true,
    },
    {
      id: "news",
      label:
        lang === "tr"
          ? "Bölgesel Haberler & Gelişmeler"
          : "Regional News & Updates",
      icon: Newspaper,
      enabled: true,
    },
    {
      id: "blog",
      label: lang === "tr" ? "Blog Yazıları" : "Blog Posts",
      icon: Newspaper,
      enabled: true,
    },
    {
      id: "team",
      label: lang === "tr" ? "Yönetim & Kadro" : "Team & Staff",
      icon: Users,
      enabled: true,
    },
    {
      id: "map",
      label: lang === "tr" ? "Harita Görünümü" : "Map View",
      icon: Map,
      enabled: true,
    },
  ]);

  const [team, setTeam] = useState<TeamMember[]>([
    {
      id: "1",
      name: "Ahmet Yılmaz",
      role: "CEO / Broker",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400",
    },
    {
      id: "2",
      name: "Ayşe Kaya",
      role: "Satış Danışmanı",
      image:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400",
    },
  ]);

  const [content, setContent] = useState<WebContent>({
    hero: {
      title:
        lang === "tr"
          ? "Kuzey Kıbrıs'ın En Seçkin Portföyü"
          : "North Cyprus' Most Exclusive Portfolio",
      subtitle:
        lang === "tr"
          ? "Yatırım hayallerinizi gerçeğe dönüştüren profesyonel gayrimenkul çözümleri."
          : "Professional real estate solutions turning your investment dreams into reality.",
      bgImage:
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000",
    },
    stats: [
      {
        value: "500+",
        label: lang === "tr" ? "Mutlu Müşteri" : "Happy Clients",
      },
      {
        value: "1.2B₺",
        label: lang === "tr" ? "Yönetilen Varlık" : "Assets Managed",
      },
      {
        value: "12",
        label: lang === "tr" ? "Yıl Tecrübe" : "Years Experience",
      },
      { value: "24", label: lang === "tr" ? "Aktif İlan" : "Active Listings" },
    ],
    trustSlogan: lang === "tr" ? "10 Yıldır Güvenle" : "Trusted for 10 Years",
  });

  const phases = [
    {
      id: 1,
      title: lang === "tr" ? "Kimlik & Marka" : "Identity & Brand",
      icon: Palette,
    },
    {
      id: 2,
      title: lang === "tr" ? "İçerik & Seçki" : "Content & Curation",
      icon: Layout,
    },
    {
      id: 3,
      title: lang === "tr" ? "Altyapı & SEO" : "Infrastructure & SEO",
      icon: Globe,
    },
    { id: 4, title: lang === "tr" ? "Yayınla" : "Launch", icon: Check },
  ];

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  const removeMember = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Header with Roadmap Progress */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 uppercase">
              {lang === "tr"
                ? `${originalBranding?.store_name || originalBranding?.name || "SEÇKİN MAĞAZA"} PORTFÖY ENGINE`
                : `${originalBranding?.store_name || originalBranding?.name || "EXCLUSIVE STORE"} PORTFOLIO ENGINE`}
            </h2>
            <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.3em] leading-none">
              {lang === "tr"
                ? "GÜVEN ODAKLI ÇIKTI SİSTEMİ"
                : "TRUST-DRIVEN OUTPUT SYSTEM"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {lang === "tr" ? "GÜNCEL DURUM" : "CURRENT STATUS"}
              </p>
              <div className="flex items-center gap-2 justify-end">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  {lang === "tr"
                    ? "CLOUDFLARE BAĞLANTISI HAZIR"
                    : "CLOUDFLARE LINK READY"}
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {lang === "tr" ? "AYARLARI KAYDET" : "SAVE SETTINGS"}
            </button>
          </div>
        </div>

        {/* Roadmap Visualization */}
        <div className="grid grid-cols-4 gap-4 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActiveStep(phase.id)}
              className="relative z-10 flex flex-col items-center gap-3 group"
            >
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                  activeStep >= phase.id
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-slate-100 text-slate-300"
                }`}
              >
                <phase.icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${activeStep >= phase.id ? "text-slate-900" : "text-slate-300"}`}
                >
                  {phase.title}
                </p>
                <p
                  className={`text-[8px] font-bold uppercase transition-opacity ${activeStep === phase.id ? "opacity-100 text-indigo-500" : "opacity-0"}`}
                >
                  {lang === "tr" ? "AKTİF FAZ" : "ACTIVE PHASE"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Step-Specific Controls */}
        <div className="xl:col-span-4 space-y-6">
          {activeStep === 1 && (
            <>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-500" />
                  {lang === "tr" ? "MARKA KİMLİĞİ" : "BRAND IDENTITY"}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {["modern", "classic", "dark", "minimal"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTemplate(t)}
                        className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedTemplate === t
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200"
                            : "bg-slate-50 text-slate-400 border-slate-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={content.trustSlogan}
                    onChange={(e) =>
                      setContent({ ...content, trustSlogan: e.target.value })
                    }
                    placeholder={
                      lang === "tr"
                        ? 'Güven Sloganı (Örn: "10 Yıldır Güvenle")'
                        : "Trust Slogan"
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Logo & Favicon Settings */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-indigo-500" />
                  {lang === "tr" ? "LOGO & FAVICON" : "LOGO & FAVICON"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {lang === "tr"
                        ? "Firma Logosu (Navigasyon)"
                        : "Company Logo"}
                    </label>
                    <div className="flex gap-4 items-center">
                      <div className="h-16 w-32 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <label className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border border-slate-200">
                        {lang === "tr" ? "LOGO DEĞİŞTİR" : "CHANGE LOGO"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) =>
                                setLogoUrl(
                                  uploadEvent.target?.result as string,
                                );
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {lang === "tr" ? "Seçme Simgesi (Favicon)" : "Favicon"}
                    </label>
                    <div className="flex gap-4 items-center">
                      <div className="h-10 w-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {faviconUrl ? (
                          <img
                            src={faviconUrl}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                      <label className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors border border-slate-200">
                        {lang === "tr" ? "FAVICON SEÇ" : "SELECT FAVICON"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (uploadEvent) =>
                                setFaviconUrl(
                                  uploadEvent.target?.result as string,
                                );
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  {lang === "tr"
                    ? "EKİP KADROSU & DANIŞMANLAR"
                    : "TEAM & AGENTS"}
                </h3>
                <div className="space-y-4">
                  {team.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4"
                    >
                      {/* Top Row: Preview & Delete Button */}
                      <div className="flex items-center gap-3">
                        <div className="relative group h-12 w-12 bg-slate-200 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                          <img
                            src={member.image}
                            className="h-full w-full object-cover"
                            alt={member.name}
                          />
                          {/* Image Hover overlay */}
                          <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                            <Upload className="h-4 w-4 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (uploadEvent) => {
                                    const base64 = uploadEvent.target
                                      ?.result as string;
                                    setTeam((prev) =>
                                      prev.map((m) =>
                                        m.id === member.id
                                          ? { ...m, image: base64 }
                                          : m,
                                      ),
                                    );
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-900 uppercase">
                            {member.name ||
                              (lang === "tr" ? "Yeni Üye" : "New Agent")}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                            {member.role || "Unvan"}
                          </p>
                        </div>
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-[10px] font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest bg-red-50 px-2 py-1 rounded-md"
                        >
                          {lang === "tr" ? "SİL" : "DEL"}
                        </button>
                      </div>

                      {/* Editing fields in panel */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-150-none">
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">
                            {lang === "tr" ? "AD SOYAD" : "FULL NAME"}
                          </label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) =>
                              setTeam((prev) =>
                                prev.map((m) =>
                                  m.id === member.id
                                    ? { ...m, name: e.target.value }
                                    : m,
                                ),
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">
                            {lang === "tr" ? "UNVAN / ROL" : "POSITION / ROLE"}
                          </label>
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) =>
                              setTeam((prev) =>
                                prev.map((m) =>
                                  m.id === member.id
                                    ? { ...m, role: e.target.value }
                                    : m,
                                ),
                              )
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Choose File Button */}
                      <div>
                        <label className="flex py-1.5 px-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 rounded-xl text-[9px] font-black text-slate-600 text-center cursor-pointer transition-all items-center justify-center gap-1">
                          <Upload className="h-3 w-3 text-slate-400" />
                          <span>
                            {lang === "tr" ? "FOTOĞRAF YÜKLE" : "UPLOAD PHOTO"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (uploadEvent) => {
                                  const base64 = uploadEvent.target
                                    ?.result as string;
                                  setTeam((prev) =>
                                    prev.map((m) =>
                                      m.id === member.id
                                        ? { ...m, image: base64 }
                                        : m,
                                    ),
                                  );
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setTeam((prev) => [
                        ...prev,
                        {
                          id: Math.random().toString(36).substr(2, 9),
                          name: "Yeni Danışman",
                          role: "Satış Temsilcisi",
                          image:
                            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400",
                        },
                      ]);
                    }}
                    className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-500 transition-all uppercase tracking-widest"
                  >
                    <Plus className="h-3 w-3" />
                    {lang === "tr" ? "YÖNETİCİ EKLE" : "ADD LEADER"}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeStep === 2 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-indigo-500" />
                  {lang === "tr"
                    ? "VİTRİN & BANNER (SLIDER)"
                    : "HERO & BANNERS"}
                </h3>
                <div className="space-y-4">
                  {banners.map((banner, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border-2 border-slate-100 aspect-video flex-shrink-0"
                    >
                      <img
                        src={banner}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() =>
                          setBanners((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase text-[9px] font-black tracking-widest shadow-md"
                      >
                        X SİL
                      </button>
                    </div>
                  ))}
                  {(!banners || banners.length < 5) && (
                    <label className="w-full flex-col h-32 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-500 transition-all uppercase tracking-widest cursor-pointer bg-slate-50">
                      <Plus className="h-4 w-4 mb-2" />
                      {lang === "tr" ? "YENİ BANNER YÜKLE" : "UPLOAD BANNER"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (uploadEvent) => {
                              const b64 = uploadEvent.target?.result as string;
                              setBanners((prev) => [...prev, b64]);
                              if (banners.length === 0) {
                                setContent((prev) => ({
                                  ...prev,
                                  hero: { ...prev.hero, bgImage: b64 },
                                }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Layout className="h-4 w-4 text-indigo-500" />
                  {lang === "tr" ? "IZGARA VE BÖLÜMLER" : "GRID & SECTIONS"}
                </h3>
                <div className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        section.enabled
                          ? "bg-indigo-50 border-indigo-200"
                          : "bg-slate-50 border-slate-100 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <section.icon
                          className={`h-4 w-4 ${section.enabled ? "text-indigo-600" : "text-slate-400"}`}
                        />
                        <span
                          className={`text-[11px] font-bold ${section.enabled ? "text-indigo-900" : "text-slate-600"}`}
                        >
                          {section.label}
                        </span>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                          section.enabled
                            ? "bg-indigo-500 border-indigo-500 text-white"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        {section.enabled && <Check className="h-3 w-3" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
                  {lang === "tr" ? "IZGARA AYARLARI" : "GRID SETTINGS"}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {lang === "tr" ? "Görünüm Modu" : "Layout Mode"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {["standard", "masonry"].map((l) => (
                        <button
                          key={l}
                          onClick={() => setGridLayout(l)}
                          className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                            gridLayout === l
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-slate-50 border-slate-100 text-slate-400"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {lang === "tr" ? "İlan Sayısı" : "Listing Count"}:{" "}
                      {featuredCount}
                    </p>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="3"
                      value={featuredCount}
                      onChange={(e) =>
                        setFeaturedCount(parseInt(e.target.value))
                      }
                      className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    {lang === "tr" ? "YAYIN BAĞLANTISI" : "PUBLISH LINK"}
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* LookPrice Slug Link */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {lang === "tr"
                          ? "Standart Mağaza Linki (Ücretsiz)"
                          : "Standard Store Link (Free)"}
                      </label>
                      <div
                        className={`h-4 w-8 rounded-full flex items-center transition-colors p-0.5 cursor-pointer ${!useCustomDomain ? "bg-indigo-500" : "bg-slate-200"}`}
                        onClick={() => setUseCustomDomain(false)}
                      >
                        <div
                          className={`h-3 w-3 bg-white rounded-full shadow-sm transition-transform ${!useCustomDomain ? "translate-x-4" : "translate-x-0"}`}
                        ></div>
                      </div>
                    </div>
                    <div
                      className={`p-4 rounded-2xl border transition-all ${!useCustomDomain ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-100 opacity-50"}`}
                    >
                      <div className="flex items-center">
                        <span className="text-xs font-bold text-slate-400">
                          lookprice.net/s/
                        </span>
                        <input
                          value={storeSlug}
                          onChange={(e) => setStoreSlug(e.target.value)}
                          disabled={useCustomDomain}
                          className="bg-transparent text-xs font-black text-indigo-900 outline-none w-full border-b border-indigo-200/50 focus:border-indigo-400 transition-colors px-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px w-full bg-slate-100"></div>

                  {/* Custom Domain Input */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {lang === "tr"
                          ? "Özel Domain (Cloudflare)"
                          : "Custom Domain (Cloudflare)"}
                        <span className="bg-amber-100 text-amber-600 text-[8px] px-1.5 py-0.5 rounded-md">
                          PRO
                        </span>
                      </label>
                      <div
                        className={`h-4 w-8 rounded-full flex items-center transition-colors p-0.5 cursor-pointer ${useCustomDomain ? "bg-indigo-500" : "bg-slate-200"}`}
                        onClick={() => setUseCustomDomain(true)}
                      >
                        <div
                          className={`h-3 w-3 bg-white rounded-full shadow-sm transition-transform ${useCustomDomain ? "translate-x-4" : "translate-x-0"}`}
                        ></div>
                      </div>
                    </div>

                    <div
                      className={`space-y-4 transition-all ${useCustomDomain ? "opacity-100" : "opacity-40 pointer-events-none"}`}
                    >
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <input
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="ornek-emlak.com"
                          className="bg-transparent text-xs font-black text-slate-900 outline-none w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {lang === "tr" ? "DNS DURUMU" : "DNS STATUS"}
                        </p>
                        <div className="p-3 bg-slate-900 rounded-xl font-mono text-[9px] text-emerald-400 space-y-1">
                          <p>
                            CNAME {customDomain || "domain.com"} →
                            nodes.lookprice.net
                          </p>
                          <p>Status: CLOUDFLARE_PROXY_READY</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <span className="text-[9px] font-black text-emerald-600 uppercase">
                          SSL / TLS
                        </span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase">
                          ENCRYPTED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Search className="h-4 w-4 text-indigo-500" />
                  {lang === "tr"
                    ? "SEO VE GOOGLE ÖNİZLEME"
                    : "SEO & GOOGLE PREVIEW"}
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-blue-700 text-sm font-medium leading-tight mb-1 truncate">
                      {content.hero.title} | {content.trustSlogan}
                    </p>
                    <p className="text-emerald-700 text-[10px] mb-1">
                      https://{currentUrl}
                    </p>
                    <p className="text-slate-500 text-[10px] line-clamp-2">
                      {lang === "tr"
                        ? "Bölgenin en seçkin portföyü. Ekibimizle birlikte güvenli yatırım adımlarını keşfedin."
                        : "The most exclusive portfolio in the region. Discover safe investment steps with our team."}
                    </p>
                  </div>
                  <input
                    placeholder="SEO Meta Title"
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-indigo-500" />
                  {lang === "tr"
                    ? "ALT BİLGİ (FOOTER) LİNKLERİ"
                    : "FOOTER LINKS"}
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {lang === "tr" ? "Hızlı Erişim" : "Quick Links"}
                    </label>
                    <div className="space-y-2">
                      {quickLinks.map((link, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 items-center bg-slate-50 border border-slate-100 rounded-xl p-2"
                        >
                          <input
                            value={link.label}
                            onChange={(e) =>
                              setQuickLinks((prev) =>
                                prev.map((l, i) =>
                                  i === idx
                                    ? { ...l, label: e.target.value }
                                    : l,
                                ),
                              )
                            }
                            placeholder="Label"
                            className="w-1/3 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold shrink-0 outline-none"
                          />
                          {link.type === "content" ? (
                            <button
                              onClick={() => {
                                setEditingLinkInfo({
                                  list: "quick",
                                  index: idx,
                                });
                                setEditorModalOpen(true);
                              }}
                              className="flex-1 p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                            >
                              <Type className="h-3 w-3" /> Düzenle
                            </button>
                          ) : (
                            <input
                              value={link.url}
                              onChange={(e) =>
                                setQuickLinks((prev) =>
                                  prev.map((l, i) =>
                                    i === idx
                                      ? { ...l, url: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                              placeholder="URL (# veya link)"
                              className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                            />
                          )}
                          <select
                            value={link.type || "url"}
                            onChange={(e) =>
                              setQuickLinks((prev) =>
                                prev.map((l, i) =>
                                  i === idx
                                    ? {
                                        ...l,
                                        type: e.target.value as
                                          | "url"
                                          | "content",
                                      }
                                    : l,
                                ),
                              )
                            }
                            className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-lg p-2 outline-none cursor-pointer"
                          >
                            <option value="url">URL</option>
                            <option value="content">İçerik</option>
                          </select>
                          <button
                            onClick={() =>
                              setQuickLinks((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="px-2.5 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors font-black text-[10px]"
                          >
                            X
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setQuickLinks((prev) => [
                            ...prev,
                            { label: "Yeni Link", url: "#", type: "url" },
                          ])
                        }
                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors pt-2"
                      >
                        + {lang === "tr" ? "EKLE" : "ADD"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {lang === "tr" ? "Kurumsal" : "Corporate"}
                    </label>
                    <div className="space-y-2">
                      {corporateLinks.map((link, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 items-center bg-slate-50 border border-slate-100 rounded-xl p-2"
                        >
                          <input
                            value={link.label}
                            onChange={(e) =>
                              setCorporateLinks((prev) =>
                                prev.map((l, i) =>
                                  i === idx
                                    ? { ...l, label: e.target.value }
                                    : l,
                                ),
                              )
                            }
                            placeholder="Label"
                            className="w-1/3 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold shrink-0 outline-none"
                          />
                          {link.type === "content" ? (
                            <button
                              onClick={() => {
                                setEditingLinkInfo({
                                  list: "corporate",
                                  index: idx,
                                });
                                setEditorModalOpen(true);
                              }}
                              className="flex-1 p-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                            >
                              <Type className="h-3 w-3" /> Düzenle
                            </button>
                          ) : (
                            <input
                              value={link.url}
                              onChange={(e) =>
                                setCorporateLinks((prev) =>
                                  prev.map((l, i) =>
                                    i === idx
                                      ? { ...l, url: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                              placeholder="URL (# veya link)"
                              className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                            />
                          )}
                          <select
                            value={link.type || "url"}
                            onChange={(e) =>
                              setCorporateLinks((prev) =>
                                prev.map((l, i) =>
                                  i === idx
                                    ? {
                                        ...l,
                                        type: e.target.value as
                                          | "url"
                                          | "content",
                                      }
                                    : l,
                                ),
                              )
                            }
                            className="bg-white border border-slate-200 text-slate-600 text-[9px] font-bold rounded-lg p-2 outline-none cursor-pointer"
                          >
                            <option value="url">URL</option>
                            <option value="content">İçerik</option>
                          </select>
                          <button
                            onClick={() =>
                              setCorporateLinks((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="px-2.5 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors font-black text-[10px]"
                          >
                            X
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() =>
                          setCorporateLinks((prev) => [
                            ...prev,
                            { label: "Yeni Link", url: "#", type: "url" },
                          ])
                        }
                        className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 transition-colors pt-2"
                      >
                        + {lang === "tr" ? "EKLE" : "ADD"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="bg-white p-8 rounded-3xl border border-slate-900 bg-slate-900 text-white space-y-6">
              <div className="h-16 w-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/50">
                <Check className="h-8 w-8 text-white" />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-lg font-black uppercase tracking-tighter">
                  HER ŞEY HAZIR!
                </h4>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                  Tüm fazlar tamamlandı. Sitenizi yayınladığınızda{" "}
                  <strong className="text-white">
                    {originalBranding?.store_name || originalBranding?.name || "Seçkin Mağaza"} Portföy
                  </strong>{" "}
                  gücüyle yayına girecektir.
                  {useCustomDomain
                    ? " DNS yönlendirmeleri tamamlandıysa siteniz kısa süre içinde aktif olacaktır."
                    : " Mağaza linkiniz hemen aktif olacaktır."}
                </p>
              </div>
              <a
                href={`https://${currentUrl}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 bg-indigo-600 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {lang === "tr" ? "YAYINLA VE CANLIYA AL" : "LAUNCH WEBSITE"}
              </a>
            </div>
          )}
        </div>

        {/* Right Content: The Visual Output (Live Preview) */}
        <div className="xl:col-span-8">
          <div className="bg-slate-900 rounded-[3rem] border-[16px] border-slate-800 shadow-2xl overflow-hidden min-h-[850px] flex flex-col sticky top-6">
            {/* Premium Browser UI */}
            <div className="bg-slate-800 p-5 flex items-center gap-4 border-b border-slate-700/50">
              <div className="flex gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
              </div>
              <div className="bg-slate-900/60 flex-1 py-1.5 rounded-2xl flex items-center justify-center gap-2 group cursor-pointer border border-slate-700/50">
                <Globe className="h-3 w-3 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                <span className="text-[11px] font-bold text-slate-500 tracking-tight">
                  {currentUrl}
                </span>
              </div>
            </div>

            {/* Master Website Live View */}
            <div className="flex-1 bg-white overflow-y-auto max-h-[750px] custom-scrollbar scroll-smooth relative">
              {/* Fake Header/Navbar */}
              <div className="absolute top-0 left-0 w-full z-40 bg-transparent flex flex-col items-start p-6">
                <div className="flex flex-col items-start gap-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      className="h-16 max-w-[240px] md:h-24 md:max-w-[400px] object-contain drop-shadow"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                      <Layout className="h-6 w-6 text-indigo-600" />
                    </div>
                  )}
                  
                  {/* Social Buttons under logo */}
                  <div className="flex gap-2 pl-1">
                    <div className="p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg hover:bg-white/20 transition-colors cursor-pointer">
                      <Instagram className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg hover:bg-white/20 transition-colors cursor-pointer">
                      <Facebook className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg hover:bg-white/20 transition-colors cursor-pointer">
                      <Twitter className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="p-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-lg hover:bg-white/20 transition-colors cursor-pointer">
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>

                <div className="absolute top-6 right-6 flex items-center gap-6">
                  <div className="hidden md:flex items-center gap-6">
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white cursor-pointer transition-colors shadow-sm">
                      {lang === "tr" ? "ANA SAYFA" : "HOME"}
                    </span>
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white cursor-pointer transition-colors shadow-sm">
                      {lang === "tr" ? "PORTFÖY" : "PORTFOLIO"}
                    </span>
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest hover:text-white cursor-pointer transition-colors shadow-sm">
                      {lang === "tr" ? "İLETİŞİM" : "CONTACT"}
                    </span>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer ml-2">
                      MENU
                    </div>
                  </div>
                  <div className="md:hidden">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer">
                      MENU
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Container */}
              {sections.find((s) => s.id === "hero")?.enabled && (
                <div className="h-[450px] relative flex flex-col items-center justify-center p-12 text-center">
                  <div
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{
                      backgroundImage: `url(${banners.length > 0 ? banners[0] : content.hero.bgImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/35 to-white/95"></div>

                  <div className="relative z-10 space-y-8 max-w-2xl transform translate-y-4">
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">
                      {content.hero.title}
                    </h1>
                    <p className="text-white/90 text-base md:text-lg font-bold max-w-lg mx-auto leading-relaxed italic drop-shadow-lg">
                      "{content.hero.subtitle}"
                    </p>
                  </div>
                </div>
              )}

               {/* Advanced Search Strip */}
              {sections.find((s) => s.id === "search")?.enabled && (
                <div className="px-12 -mt-12 relative z-30">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] grid grid-cols-4 gap-6">
                    {(isAutomotive 
                      ? (lang === "tr" ? ["MARKA", "MODEL", "BÜTÇE", "MODEL YILI"] : ["BRAND", "MODEL", "BUDGET", "YEAR"])
                      : (lang === "tr" ? ["LOKASYON", "TÜR", "BÜTÇE", "ODA SAYISI"] : ["LOCATION", "TYPE", "BUDGET", "ROOMS"])
                    ).map(
                      (filt, idx) => (
                        <div
                          key={filt}
                          className={`group cursor-pointer ${idx < 3 ? "border-r border-slate-100" : ""}`}
                        >
                          <p className="text-[9px] font-black text-slate-400 tracking-[0.2em] mb-1">
                            {filt}
                          </p>
                          <div className="flex items-center justify-between pr-4">
                            <span className="text-xs font-black text-slate-900">
                              {lang === "tr" ? "Seçiniz" : "Select"}
                            </span>
                            <SlidersHorizontal className="h-3 w-3 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          </div>
                        </div>
                      ),
                    )}
                    <button className="col-span-4 bg-slate-900 text-white py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] mt-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                      {isAutomotive
                        ? lang === "tr"
                          ? "HAYALİNDEKİ ARACI BUL"
                          : "FIND YOUR VEHICLE"
                        : lang === "tr"
                          ? "HAYALİNDEKİ MÜLKÜ BUL"
                          : "FIND YOUR DREAM"}
                    </button>
                  </div>
                </div>
              )}

              <div className="p-16 space-y-32">
                {/* Stats */}
                {sections.find((s) => s.id === "stats")?.enabled && (
                  <div className="grid grid-cols-4 gap-12 border-y border-slate-50 py-12">
                    {content.stats.map((st, i) => (
                      <div key={i} className="text-center group">
                        <p className="text-4xl font-black text-slate-900 mb-1 group-hover:scale-110 transition-transform">
                          {st.value}
                        </p>
                        <div className="h-1 w-6 bg-indigo-500 mx-auto mb-3 rounded-full"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {st.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Portfolio/Listing Grid Preview */}
                {sections.find((s) => s.id === "portfolio")?.enabled && (
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-50 pb-8 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                          {lang === "tr" ? "GÜNCEL PORTFÖY" : "LATEST LISTINGS"}
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            {lang === "tr"
                              ? `${originalBranding?.store_name || originalBranding?.name || "Seçkin Mağaza"} Entegre Veri Akışı`
                              : `${originalBranding?.store_name || originalBranding?.name || "Premium Store"} Integrated Data Feed`}
                          </p>
                        </div>
                      </div>
                      <button className="px-8 py-3 bg-slate-900 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all flex items-center gap-3">
                        {lang === "tr" ? "TÜMÜNÜ İNCELE" : "EXPLORE ALL"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div
                      className={`grid gap-10 ${gridLayout === "masonry" ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"}`}
                    >
                      {Array.from({ length: featuredCount }).map((_, i) => (
                        <div key={i} className="group cursor-pointer">
                          <div
                            className={`bg-slate-50 rounded-[2.5rem] overflow-hidden relative shadow-2xl shadow-indigo-100/20 group-hover:shadow-indigo-200/40 transition-all duration-500 ${gridLayout === "masonry" && i % 2 === 0 ? "aspect-[3/4]" : "aspect-video md:aspect-[16/11]"}`}
                          >
                            <div
                              className="h-full w-full bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
                              style={{
                                backgroundImage: `url(${
                                  isAutomotive
                                    ? i % 2 === 0
                                      ? "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=80"
                                      : "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=80"
                                    : i % 2 === 0
                                      ? "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop"
                                      : "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop"
                                })`
                              }}
                            ></div>
                            <div className="absolute top-6 left-6 flex gap-2">
                              <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-black text-slate-900 uppercase tracking-widest shadow-sm">
                                {isAutomotive
                                  ? lang === 'tr' ? "YENİ KONDU" : "LIKE NEW"
                                  : i % 2 === 0
                                    ? lang === "tr"
                                      ? "SATILIK"
                                      : "FOR SALE"
                                    : lang === "tr"
                                      ? "KİRALIK"
                                      : "FOR RENT"}
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                              <button className="w-full py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20">
                                {lang === "tr"
                                  ? "DETAYLARI GÖR"
                                  : "VIEW DETAILS"}
                              </button>
                            </div>
                          </div>
                          <div className="mt-6 space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                {isAutomotive
                                  ? i % 2 === 0
                                    ? "Porsche 911 Turbo S Coupe"
                                    : "Mercedes-AMG GT Coupe"
                                  : i % 2 === 0
                                    ? lang === "tr"
                                      ? "Lüks Sahil Villası"
                                      : "Beachfront Villa"
                                    : lang === "tr"
                                      ? "Modern Loft"
                                      : "Urban Loft"}
                              </h4>
                              <div className="text-right">
                                <p className="text-lg font-black text-indigo-600">
                                  {isAutomotive ? `€${185 + i * 95},000` : `€${250 + i * 35},000`}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 line-through">
                                  {isAutomotive ? `€${205 + i * 95},000` : `€${280 + i * 35},000`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                              <span className="flex items-center gap-1.5">
                                <Map className="h-3 w-3 text-indigo-500" />{" "}
                                {isAutomotive ? "GİRNE" : "GIRNE"}
                              </span>
                              <div className="h-3 w-px bg-slate-200"></div>
                              <span className="flex items-center gap-1.5">
                                <Layout className="h-3 w-3 text-indigo-500" />{" "}
                                {isAutomotive ? "2024 MODEL • COUPE" : "4+1 LUXURY"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* News Section */}
                {sections.find((s) => s.id === "news")?.enabled && (
                  <div className="space-y-12 bg-slate-900 -mx-10 px-10 py-16 -mt-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-800 pb-8 gap-4 relative z-10">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                          {lang === "tr" ? "BÖLGESEL RADAR" : "REGIONAL RADAR"}
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            {lang === "tr"
                              ? "Canlı Haber Akışı"
                              : "Live News Feed"}
                          </p>
                        </div>
                      </div>
                      <button className="px-8 py-3 bg-white/10 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center gap-3 backdrop-blur-md border border-white/5">
                        {lang === "tr" ? "TÜMÜNÜ İNCELE" : "READ ALL"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      {(radarNews && radarNews.length > 0
                        ? radarNews.slice(0, 3).map((newsItem) => ({
                            title: newsItem.title,
                            categories:
                              newsItem.tags && newsItem.tags.length > 0
                                ? newsItem.tags.slice(0, 2)
                                : [
                                    lang === "tr"
                                      ? "Bölgesel Gelişme"
                                      : "Haber",
                                  ],
                            date:
                              newsItem.date ||
                              (lang === "tr" ? "Yeni" : "Recent"),
                            img:
                              newsItem.image_url ||
                              "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=800",
                          }))
                        : [
                            {
                              title:
                                lang === "tr"
                                  ? "Girne Yeni İmar Planı Açıklandı, Yatırımcılar Odaklanıyor"
                                  : "Kyrenia New Zoning Plan Announced",
                              categories: ["İmar Durumu", "Sıcak"],
                              date: "2 Saat Önce",
                              img: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=800",
                            },
                            {
                              title:
                                lang === "tr"
                                  ? "Lefkoşa Kredi Faizlerinde Son Durum: Alım Fırsatı Mı?"
                                  : "Nicosia Credit Rates Update: Is it a Buying Opportunity?",
                              categories: ["Finans", "Fırsat"],
                              date: "5 Saat Önce",
                              img: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?q=80&w=800",
                            },
                            {
                              title:
                                lang === "tr"
                                  ? "Yeni Marina Projesi Çevresinde Emlak Değerleri Artıyor"
                                  : "Real Estate Values Rising Around New Marina Project",
                              categories: ["Bölgesel Gelişme", "Vizyon"],
                              date: "1 Gün Önce",
                              img: "https://images.unsplash.com/photo-1563842145396-85750036ee7f?q=80&w=800",
                            },
                          ]
                      ).map((newsItem, i) => (
                        <div
                          key={i}
                          className="group cursor-pointer flex flex-col bg-slate-800/50 border border-slate-700/50 rounded-3xl overflow-hidden hover:bg-slate-800 hover:border-indigo-500/50 transition-all"
                        >
                          <div className="h-48 relative overflow-hidden">
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                              style={{
                                backgroundImage: `url(${newsItem.img})`,
                              }}
                            ></div>
                            <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                              {(newsItem.categories || []).map(
                                (cat: any, ci: number) => (
                                  <div
                                    key={ci}
                                    className="bg-indigo-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest shadow-lg border border-indigo-400/30"
                                  >
                                    {cat}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                          <div className="p-6 space-y-4 flex-1 flex flex-col">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {newsItem.date}
                            </p>
                            <h4 className="text-sm font-black text-white leading-snug group-hover:text-indigo-400 transition-colors">
                              {newsItem.title}
                            </h4>
                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-700/50 text-[10px] font-bold text-slate-400">
                              <span className="uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                                {lang === "tr"
                                  ? "Detayları Okuyun"
                                  : "Read Details"}
                              </span>
                              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform text-indigo-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blog Section */}
                {sections.find((s) => s.id === "blog")?.enabled && (
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-8 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                          {lang === "tr" ? "BLOG YAZILARIMIZ" : "OUR BLOG"}
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="h-1 w-12 bg-rose-500 rounded-full"></div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                            {lang === "tr"
                              ? "Güncel İçerikler"
                              : "Latest Insights"}
                          </p>
                        </div>
                      </div>
                      <button className="px-8 py-3 bg-slate-900 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] hover:bg-rose-500 transition-all flex items-center gap-3">
                        {lang === "tr" ? "DEVAMINI OKU" : "VIEW ALL POSTS"}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(blogs.length > 0
                        ? blogs
                        : [
                            {
                              title:
                                lang === "tr"
                                  ? "Harika Bir Mülk Nasıl Değerlenir?"
                                  : "How to Value a Great Property?",
                              summary:
                                lang === "tr"
                                  ? "Doğru bir değerleme için sektörel tecrübe ve bölge hakimeyi gerekir..."
                                  : "Industry experience is required for an accurate valuation...",
                              date: "12 Eki 2026",
                              img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800",
                            },
                            {
                              title:
                                lang === "tr"
                                  ? "Geleceğin Yatırım Noktaları"
                                  : "Future Investment Spots",
                              summary:
                                lang === "tr"
                                  ? "Yabancı yatırımcıların son dönemde yöneldiği trend lokasyonlar..."
                                  : "Trending locations foreign investors are turning to lately...",
                              date: "08 Eki 2026",
                              img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=800",
                            },
                            {
                              title:
                                lang === "tr"
                                  ? "Ev Sahibi Olacakların Bilmesi Gerekenler"
                                  : "Things to Know Before Buying",
                              summary:
                                lang === "tr"
                                  ? "İlk evinizi alırken hukuksal süreçte eksik adım atmayın..."
                                  : "Do not miss legal steps when buying your first home...",
                              date: "28 Eyl 2026",
                              img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800",
                            },
                          ]
                      ).map((blog, i) => (
                        <div
                          key={i}
                          className="group cursor-pointer flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300"
                        >
                          <div className="h-56 relative overflow-hidden">
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                              style={{
                                backgroundImage: `url(${blog.image_url || blog.img || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800"})`,
                              }}
                            ></div>
                          </div>
                          <div className="p-6 space-y-4 flex-1 flex flex-col">
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                              {blog.date ||
                                new Date(blog.created_at).toLocaleDateString()}
                            </p>
                            <h4 className="text-lg font-black text-slate-900 leading-snug group-hover:text-rose-600 transition-colors">
                              {blog.title}
                            </h4>
                            <p
                              className="text-xs text-slate-500 leading-relaxed max-w-sm line-clamp-2"
                              dangerouslySetInnerHTML={{
                                __html:
                                  blog.summary ||
                                  (blog.content
                                    ? blog.content
                                        .replace(/<[^>]*>?/gm, "")
                                        .substring(0, 100) + "..."
                                    : ""),
                              }}
                            ></p>
                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 text-[10px] font-bold text-slate-400">
                              <span className="uppercase tracking-widest flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                                {lang === "tr"
                                  ? "Okumaya Devam Et"
                                  : "Continue Reading"}
                              </span>
                              <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform text-rose-500" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust Anchor Team Section */}
                {sections.find((s) => s.id === "team")?.enabled && (
                  <div className="space-y-16">
                    <div className="text-center space-y-4 max-w-xl mx-auto">
                      <div className="h-0.5 w-12 bg-indigo-600 mx-auto"></div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                        {lang === "tr"
                          ? "GÜVEN BİZİM GENETİĞİMİZDE VAR"
                          : "TRUST IS IN OUR DNA"}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">
                        {lang === "tr"
                          ? "Brokerlarımızın 10 yıllık tecrübesiyle, her mülk bir hikaye ve doğru yatırımdır."
                          : "Our brokers bring a decade of experience to every listing."}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-12">
                      {team.map((tm, idx) => (
                        <div key={idx} className="group cursor-pointer">
                          <div className="aspect-[3/4] bg-slate-50 rounded-[3rem] overflow-hidden relative shadow-2xl shadow-indigo-100/50 group-hover:-translate-y-4 transition-all duration-700">
                            <img
                              src={tm.image}
                              className="h-full w-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 scale-105"
                              alt={tm.name}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                          <div className="mt-8 text-center space-y-1">
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                              {tm.name}
                            </p>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                              {tm.role}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modern Footer */}
              <div className="bg-slate-900 pt-20 pb-12 px-12 relative overflow-hidden text-white text-left mt-16 rounded-t-[3rem]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 pb-16 border-b border-slate-800">
                    <div className="col-span-1 space-y-6">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          className="h-28 md:h-40 max-w-[320px] object-contain"
                        />
                      ) : (
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                          {originalBranding?.store_name || originalBranding?.name || "SEÇKİN MAĞAZA"}
                        </h2>
                      )}
                      
                      {/* Social Buttons elegant position */}
                      <div className="flex gap-4 pt-1">
                        <div className="p-2.5 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
                          <Instagram className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                        <div className="p-2.5 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
                          <Facebook className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                        <div className="p-2.5 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
                          <Twitter className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                        <div className="p-2.5 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors cursor-pointer group">
                          <MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                        {lang === "tr" ? "Hızlı Erişim" : "Quick Links"}
                      </h4>
                      <ul className="space-y-4 text-xs font-bold text-slate-400">
                        {quickLinks.map((link, idx) => (
                          <li
                            key={idx}
                            className="hover:text-indigo-400 cursor-pointer transition-colors"
                          >
                            {link.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-span-1 space-y-6">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                        {lang === "tr" ? "Kurumsal" : "Corporate"}
                      </h4>
                      <ul className="space-y-4 text-xs font-bold text-slate-400">
                        {corporateLinks.map((link, idx) => (
                          <li
                            key={idx}
                            className="hover:text-indigo-400 cursor-pointer transition-colors"
                          >
                            {link.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8 flex justify-between items-center gap-6">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest break-words w-1/2">
                      © {new Date().getFullYear()}{" "}
                      {originalBranding?.store_name || originalBranding?.name || "SEÇKİN MAĞAZA"}.{" "}
                      {lang === "tr"
                        ? "TÜM HAKLARI SAKLIDIR."
                        : "ALL RIGHTS RESERVED."}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">
                        POWERED BY
                      </span>
                      <a
                        href="https://lookprice.net"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:opacity-80 transition-opacity"
                      >
                        <img
                          src="https://lookprice.master/logo.png"
                          className="h-5 md:h-6 object-contain"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rich Text Editor Modal */}
      {editorModalOpen && editingLinkInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Type className="w-5 h-5 text-indigo-500" />
                {lang === "tr" ? "İçerik Editörü" : "Content Editor"}
              </h3>
              <button
                onClick={() => {
                  setEditorModalOpen(false);
                  setEditingLinkInfo(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-0 flex-1 bg-white">
              <LiteRichEditor
                value={
                  (editingLinkInfo.list === "quick"
                    ? quickLinks
                    : corporateLinks)[editingLinkInfo.index].content || ""
                }
                onChange={(newContent) => {
                  if (editingLinkInfo.list === "quick") {
                    setQuickLinks((prev) =>
                      prev.map((l, i) =>
                        i === editingLinkInfo.index
                          ? { ...l, content: newContent }
                          : l,
                      ),
                    );
                  } else {
                    setCorporateLinks((prev) =>
                      prev.map((l, i) =>
                        i === editingLinkInfo.index
                          ? { ...l, content: newContent }
                          : l,
                      ),
                    );
                  }
                }}
                minHeight="400px"
                placeholder="Sayfa içeriğini buraya giriniz..."
              />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditorModalOpen(false);
                  setEditingLinkInfo(null);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm"
              >
                {lang === "tr" ? "Kaydet & Kapat" : "Save & Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
