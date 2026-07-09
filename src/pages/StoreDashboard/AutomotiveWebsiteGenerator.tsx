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
import { compressImageToWebP } from "../../utils/imageUtils";
import { ContentCurationStep } from "../../components/website/ContentCurationStep";
import { WebsitePreview } from "../../components/website/WebsitePreview";

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

export const AutomotiveWebsiteGenerator = ({
  storeId,
}: {
  storeId?: number;
}) => {
  const { lang } = useLanguage();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [radarNews, setRadarNews] = useState<any[]>([]);

  const [originalBranding, setOriginalBranding] = useState<any>({});
  const [banners, setBanners] = useState<any[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");

  const isAutomotive = true;

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

            if (res.slogan) {
              setContent((prev) => ({ ...prev, trustSlogan: res.slogan }));
            }

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

            const dbBanners = res.banners || (res.page_layout && typeof res.page_layout === 'object' && !Array.isArray(res.page_layout) ? res.page_layout.banners : null);
            if (dbBanners && Array.isArray(dbBanners)) {
              const isTr = lang === 'tr';
              const normalized = dbBanners.map((b: any, idx: number) => {
                if (typeof b === 'string') {
                  return {
                    id: `slide_legacy_${idx}`,
                    image_url: b,
                    title: "",
                    subtitle: "",
                    text_position: "center",
                    show_store_name: true,
                    button_text: isTr ? "İncele" : "Explore",
                    button_link: "#portfolio"
                  };
                }
                return b;
              });
              setBanners(normalized);
              if (normalized.length > 0) {
                setContent((prev) => ({
                  ...prev,
                  hero: { ...prev.hero, bgImage: normalized[0].image_url },
                }));
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

              // Migration for real estate terms and platform names in quick links
              setQuickLinks(prev => prev.map(link => {
                if (link.label === "Mülklerimiz" || link.label === "Portföyümüz") return { ...link, label: lang === 'tr' ? "Araçlarımız" : "Our Vehicles" };
                if (link.label === "Bölgelerimiz") return { ...link, label: lang === 'tr' ? "Şubelerimiz" : "Our Branches" };
                if (link.content?.includes("gayrimenkul") || link.content?.includes("LookPrice")) {
                  return { 
                    ...link, 
                    content: link.content.replace(/gayrimenkul/gi, lang === 'tr' ? "otomotiv" : "automotive")
                                       .replace(/mülk/gi, lang === 'tr' ? "araç" : "vehicle")
                                       .replace(/LookPrice/gi, res.store_name || res.name || (lang === 'tr' ? "Seçkin Otomotiv" : "Premium Automotive"))
                  };
                }
                return link;
              }));

              setCorporateLinks(prev => prev.map(link => {
                if (link.content?.includes("gayrimenkul") || link.content?.includes("LookPrice")) {
                  return { 
                    ...link, 
                    content: link.content.replace(/gayrimenkul/gi, lang === 'tr' ? "otomotiv" : "automotive")
                                       .replace(/LookPrice/gi, res.store_name || res.name || (lang === 'tr' ? "Seçkin Otomotiv" : "Premium Automotive"))
                  };
                }
                return link;
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
      const updatedLayout = {
        sections: sections.map((s) => ({ id: s.id, enabled: s.enabled })),
        grid: gridLayout,
        count: featuredCount,
        banners: banners,
        quickLinks,
        corporateLinks,
      };

      const firstBannerUrl = banners.length > 0 ? (typeof banners[0] === 'string' ? banners[0] : banners[0].image_url) : originalBranding.hero_image_url;

      const payload = {
        ...originalBranding,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        page_layout: updatedLayout,
        page_layout_settings: { ...originalBranding.page_layout_settings, web_content: content },
        slogan: content.trustSlogan,
        slug: storeSlug,
        custom_domain: useCustomDomain ? customDomain : null,
        hero_image_url: firstBannerUrl,
        banners: banners,
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
    { label: lang === "tr" ? "Araç Galerimiz" : "Our Car Gallery", url: "#portfolio", type: "url" },
    { label: lang === "tr" ? "Ekspertiz Hizmetleri" : "Expertise Services", url: "#", type: "url" },
    {
      label: lang === "tr" ? "Biz Kimiz?" : "Who We Are",
      url: "",
      type: "content",
      content: lang === "tr" 
        ? "Biz Seçkin Otomotiv ekibi olarak araç yatırımlarınıza değer katıyoruz. Profesyonel kadromuzla yanınızdayız."
        : "As the Seçkin Otomotiv team, we add value to your vehicle investments with our professional staff.",
    },
    { label: lang === "tr" ? "Takas Başvurusu" : "Trade-in Application", url: "#contact", type: "url" },
  ]);
  const [corporateLinks, setCorporateLinks] = useState<
    { label: string; url: string; content?: string; type?: "url" | "content" }[]
  >([
    {
      label: lang === "tr" ? "Gizlilik Politikası" : "Privacy Policy",
      url: "",
      type: "content",
      content: lang === "tr" ? "KVKK ve Gizlilik Politikası şartnameleri..." : "Privacy policy terms...",
    },
    {
      label: lang === "tr" ? "Kullanım Koşulları" : "Terms of Use",
      url: "",
      type: "content",
      content: lang === "tr" ? "Sitemizi kullanım koşulları..." : "Site terms of use...",
    },
  ]);

  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingLinkInfo, setEditingLinkInfo] = useState<{
    list: "quick" | "corporate";
    index: number;
  } | null>(null);

  const openEditor = (list: "quick" | "corporate", index: number) => {
    setEditingLinkInfo({ list, index });
    setEditorModalOpen(true);
  };

  const removeLink = (list: "quick" | "corporate", index: number) => {
    const setter = list === "quick" ? setQuickLinks : setCorporateLinks;
    setter((prev: any) => prev.filter((_: any, i: any) => i !== index));
  };

  const addLink = (list: "quick" | "corporate") => {
    const setter = list === "quick" ? setQuickLinks : setCorporateLinks;
    setter((prev: any) => [...prev, { label: "Yeni Link", url: "#", type: "url" }]);
  };

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
          ? "Kuzey Kıbrıs'ın En Seçkin Araç Portföyü"
          : "North Cyprus' Most Exclusive Car Portfolio",
      subtitle:
        lang === "tr"
          ? "Prestijli otomobiller ve güvenilir motorlu taşıt çözümleri."
          : "Professional automotive solutions and prestigious vehicle collections.",
      bgImage:
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=2000&q=80",
    },
    stats: [
      {
        value: "500+",
        label: lang === "tr" ? "Mutlu Sürücü" : "Happy Drivers",
      },
      {
        value: "1.2B₺",
        label: lang === "tr" ? "İşlem Hacmi" : "Transaction Volume",
      },
      {
        value: "15+",
        label: lang === "tr" ? "Yıllık Güven" : "Years of Trust",
      },
      { value: "50+", label: lang === "tr" ? "Aktif Araç" : "Active Vehicles" },
    ],
    trustSlogan: lang === "tr" ? "Hız ve Karakter" : "Speed and Character",
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
                ? `${originalBranding?.store_name || originalBranding?.name || "SEÇKİN OTOMOTİV"} PORTFÖY ENGINE`
                : `${originalBranding?.store_name || originalBranding?.name || "PREMIUM AUTOMOTIVE"} PORTFOLIO ENGINE`}
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
            <ContentCurationStep
              lang={lang}
              banners={banners}
              setBanners={setBanners}
              sections={sections}
              setSections={setSections}
              gridLayout={gridLayout}
              setGridLayout={setGridLayout}
              featuredCount={featuredCount}
              setFeaturedCount={setFeaturedCount}
              setContent={setContent}
            />
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
                        ? "Bölgenin en seçkin araç portföyü. Ekibimizle birlikte güvenli alım-satım adımlarını keşfedin."
                        : "The most exclusive vehicle portfolio in the region. Discover safe trading steps with our team."}
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
                    {originalBranding?.store_name || originalBranding?.name || "Seçkin Otomotiv"} Portföy
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
          <WebsitePreview 
            lang={lang}
            originalBranding={originalBranding}
            logoUrl={logoUrl}
            content={content}
            sections={sections}
            gridLayout={gridLayout}
            featuredCount={featuredCount}
            blogs={blogs}
            radarNews={radarNews}
            team={team}
            quickLinks={quickLinks}
            corporateLinks={corporateLinks}
            openEditor={openEditor}
            removeLink={removeLink}
            addLink={addLink}
            banners={banners}
          />
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
