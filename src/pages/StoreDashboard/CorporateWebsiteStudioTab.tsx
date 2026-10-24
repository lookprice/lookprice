import React, { useState, useEffect } from "react";
import {
  Globe,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  Eye,
  Save,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Image as ImageIcon,
  FileText,
  Layers,
  Award,
  Palette,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Code,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { api } from "../../services/api";
import {
  CorporateWebsiteConfig,
  CorporateServiceItem,
  CorporateCustomPage,
  CorporateGalleryImage,
  getDefaultCorporateConfig,
} from "../../components/ModernCorporateWebsiteLayout";

interface CorporateWebsiteStudioTabProps {
  branding: any;
  setBranding: (branding: any) => void;
  currentStoreId?: string | number;
  onSaveBranding?: (e: React.FormEvent) => void;
  savingBranding?: boolean;
  onLogoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type StudioSubTab =
  | "hero"
  | "services"
  | "about"
  | "pages"
  | "gallery"
  | "contact"
  | "theme_seo";

export const CorporateWebsiteStudioTab: React.FC<
  CorporateWebsiteStudioTabProps
> = ({
  branding,
  setBranding,
  currentStoreId,
  onLogoUpload,
  onFaviconUpload,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<StudioSubTab>(() => {
    return (
      (localStorage.getItem(
        `corporateStudioSubTab_${currentStoreId || "default"}`
      ) as StudioSubTab) || "hero"
    );
  });

  useEffect(() => {
    localStorage.setItem(
      `corporateStudioSubTab_${currentStoreId || "default"}`,
      activeSubTab
    );
  }, [activeSubTab, currentStoreId]);

  // Defensive normalizer that guarantees all arrays and sections are defined even if partial data exists in DB
  const getNormalizedStudioConfig = (b: any): CorporateWebsiteConfig => {
    const defaults = getDefaultCorporateConfig(b);
    const raw = b?.corporate_config;
    const parsed = typeof raw === "string" ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : (raw || {});

    const services = Array.isArray(parsed.services)
      ? parsed.services
      : Array.isArray(parsed.services_section?.items)
      ? parsed.services_section.items
      : defaults.services || [];

    const gallery = Array.isArray(parsed.gallery)
      ? parsed.gallery
      : Array.isArray(parsed.gallery_section?.images)
      ? parsed.gallery_section.images
      : defaults.gallery || [];

    const custom_pages = Array.isArray(parsed.custom_pages)
      ? parsed.custom_pages
      : defaults.custom_pages || [];

    const heroImages = Array.isArray(parsed.hero?.background_images) && parsed.hero.background_images.length > 0
      ? parsed.hero.background_images
      : Array.isArray(parsed.hero?.hero_images) && parsed.hero.hero_images.length > 0
      ? parsed.hero.hero_images
      : defaults.hero?.background_images || [];

    const heroStats = Array.isArray(parsed.hero?.stats) && parsed.hero.stats.length > 0
      ? parsed.hero.stats
      : defaults.hero?.stats || [];

    const aboutHighlights = Array.isArray(parsed.about?.highlights) && parsed.about.highlights.length > 0
      ? parsed.about.highlights
      : Array.isArray(parsed.about_section?.highlights) && parsed.about_section.highlights.length > 0
      ? parsed.about_section.highlights
      : defaults.about?.highlights || [];

    return {
      ...defaults,
      ...parsed,
      announcement: {
        enabled: parsed.announcement?.enabled !== undefined
          ? parsed.announcement.enabled
          : (parsed.announcement_enabled !== undefined ? parsed.announcement_enabled : defaults.announcement?.enabled ?? true),
        text: parsed.announcement?.text || parsed.announcement_text || defaults.announcement?.text || "",
      },
      hero: {
        ...defaults.hero,
        ...(parsed.hero || {}),
        badge: parsed.hero?.badge || parsed.hero?.badge_text || defaults.hero?.badge || "KURUMSAL GÜVEN & PROFESYONEL HİZMET",
        highlight_word: parsed.hero?.highlight_word || defaults.hero?.highlight_word || "Güvenilir Hizmet",
        title: parsed.hero?.title || defaults.hero?.title || "",
        subtitle: parsed.hero?.subtitle || defaults.hero?.subtitle || "",
        primary_cta_text: parsed.hero?.primary_cta_text || defaults.hero?.primary_cta_text || "Hizmetlerimizi İnceleyin",
        secondary_cta_text: parsed.hero?.secondary_cta_text || defaults.hero?.secondary_cta_text || "WhatsApp İletişim Hattı",
        background_images: heroImages,
        hero_images: heroImages,
        stats: heroStats,
      },
      services_section: {
        ...defaults.services_section,
        ...(parsed.services_section || {}),
        badge: parsed.services_section?.badge || defaults.services_section?.badge || "NELER YAPIYORUZ?",
        title: parsed.services_section?.title || defaults.services_section?.title || "Hizmetlerimiz",
        subtitle: parsed.services_section?.subtitle || defaults.services_section?.subtitle || "",
        items: services,
      },
      services,
      about: {
        ...defaults.about,
        ...(parsed.about || {}),
        badge: parsed.about?.badge || parsed.about_section?.badge || defaults.about?.badge || "KURUMSAL KİMLİĞİMİZ",
        title: parsed.about?.title || parsed.about_section?.title || defaults.about?.title || "Hakkımızda",
        subtitle: parsed.about?.subtitle || parsed.about_section?.subtitle || defaults.about?.subtitle || "",
        content: parsed.about?.content || parsed.about_section?.content || defaults.about?.content || "",
        mission: parsed.about?.mission || parsed.about_section?.mission_text || defaults.about?.mission || "",
        vision: parsed.about?.vision || parsed.about_section?.vision_text || defaults.about?.vision || "",
        image_url: parsed.about?.image_url || parsed.about_section?.image_url || defaults.about?.image_url || "",
        secondary_image_url: parsed.about?.secondary_image_url || parsed.about_section?.secondary_image_url || defaults.about?.secondary_image_url || "",
        experience_years: parsed.about?.experience_years || parsed.about_section?.experience_badge_value || defaults.about?.experience_years || "15+",
        experience_text: parsed.about?.experience_text || parsed.about_section?.experience_badge_label || defaults.about?.experience_text || "Yıllık Güven & Tecrübe",
        highlights: aboutHighlights,
      },
      about_section: {
        ...defaults.about_section,
        ...(parsed.about_section || {}),
        highlights: aboutHighlights,
      },
      custom_pages,
      gallery_section: {
        ...defaults.gallery_section,
        ...(parsed.gallery_section || {}),
        enabled: parsed.gallery_section?.enabled !== undefined ? parsed.gallery_section.enabled : true,
        title: parsed.gallery_section?.title || defaults.gallery_section?.title || "Fotoğraf Galerisi",
        subtitle: parsed.gallery_section?.subtitle || defaults.gallery_section?.subtitle || "",
        images: gallery,
      },
      gallery,
      contact: {
        ...defaults.contact,
        ...(parsed.contact || {}),
        phone_primary: parsed.contact?.phone_primary || b?.phone || defaults.contact?.phone_primary || "",
        phone_secondary: parsed.contact?.phone_secondary || "",
        whatsapp: parsed.contact?.whatsapp || b?.whatsapp_number || b?.phone || defaults.contact?.whatsapp || "",
        email: parsed.contact?.email || b?.email || defaults.contact?.email || "",
        address: parsed.contact?.address || b?.address || defaults.contact?.address || "",
        working_hours: parsed.contact?.working_hours || b?.working_hours_text || defaults.contact?.working_hours || "",
        latitude: parsed.contact?.latitude || b?.latitude || defaults.contact?.latitude || "",
        longitude: parsed.contact?.longitude || b?.longitude || defaults.contact?.longitude || "",
        map_embed_url: parsed.contact?.map_embed_url || defaults.contact?.map_embed_url || "",
        instagram_url: parsed.contact?.instagram_url || b?.instagram_url || "",
        facebook_url: parsed.contact?.facebook_url || b?.facebook_url || "",
        youtube_url: parsed.contact?.youtube_url || b?.youtube_url || "",
      },
      contact_section: {
        ...defaults.contact_section,
        ...(parsed.contact_section || {}),
      },
      seo_marketing: {
        ...defaults.seo_marketing,
        ...(parsed.seo_marketing || {}),
        meta_title: parsed.seo_marketing?.meta_title || defaults.seo_marketing?.meta_title || "",
        meta_description: parsed.seo_marketing?.meta_description || defaults.seo_marketing?.meta_description || "",
        meta_keywords: parsed.seo_marketing?.meta_keywords || defaults.seo_marketing?.meta_keywords || "",
        google_analytics_id: parsed.seo_marketing?.google_analytics_id || b?.meta_settings?.ga_measurement_id || "",
        google_tag_manager_id: parsed.seo_marketing?.google_tag_manager_id || b?.meta_settings?.gtm_id || "",
        google_search_console_code: parsed.seo_marketing?.google_search_console_code || b?.meta_settings?.gsc_id || "",
        meta_pixel_id: parsed.seo_marketing?.meta_pixel_id || b?.meta_settings?.pixel_id || "",
      },
      theme_palette: parsed.theme_palette || parsed.theme_preset || defaults.theme_palette || "emerald_gold",
      theme_preset: parsed.theme_preset || parsed.theme_palette || defaults.theme_preset || "emerald_gold",
    };
  };

  const [config, setConfig] = useState<CorporateWebsiteConfig>(() =>
    getNormalizedStudioConfig(branding)
  );
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Sync when branding store loads initially
  useEffect(() => {
    setConfig(getNormalizedStudioConfig(branding));
  }, [branding?.slug, branding?.corporate_config]);

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const servicesList = config.services || [];
      const galleryList = config.gallery || [];
      const customPagesList = config.custom_pages || [];

      const updatedCorporateConfig: CorporateWebsiteConfig = {
        ...config,
        services: servicesList,
        services_section: {
          ...config.services_section,
          items: servicesList,
        },
        gallery: galleryList,
        gallery_section: {
          ...config.gallery_section,
          images: galleryList,
        },
        custom_pages: customPagesList,
        about: {
          ...config.about,
        },
        about_section: {
          ...config.about_section,
          content: config.about?.content || "",
          badge: config.about?.badge || "",
          title: config.about?.title || "",
          subtitle: config.about?.subtitle || "",
          mission_text: config.about?.mission || "",
          vision_text: config.about?.vision || "",
          image_url: config.about?.image_url || "",
          experience_badge_value: config.about?.experience_years || "15+",
          experience_badge_label: config.about?.experience_text || "Yıllık Güven & Tecrübe",
          highlights: config.about?.highlights || [],
        },
        contact: {
          ...config.contact,
        },
        contact_section: {
          ...config.contact_section,
          working_hours: config.contact?.working_hours || "",
          latitude: config.contact?.latitude || "",
          longitude: config.contact?.longitude || "",
          map_embed_url: config.contact?.map_embed_url || "",
        },
        announcement: {
          ...config.announcement,
        },
        announcement_enabled: config.announcement?.enabled ?? true,
        announcement_text: config.announcement?.text || "",
        theme_preset: config.theme_palette || config.theme_preset || "emerald_gold",
        theme_palette: config.theme_palette || config.theme_preset || "emerald_gold",
      };

      const updatedBranding = {
        ...branding,
        store_name: branding?.store_name || branding?.name || "Kurumsal Hizmet Merkezi",
        hero_title: `${config.hero.title} ${config.hero.highlight_word}`.trim(),
        hero_subtitle: config.hero.subtitle,
        about_text: config.about.content,
        phone: config.contact.phone_primary || branding?.phone || "",
        whatsapp_number: config.contact.whatsapp || branding?.whatsapp_number || "",
        email: config.contact.email || branding?.email || "",
        address: config.contact.address || branding?.address || "",
        working_hours_text: config.contact.working_hours || branding?.working_hours_text || "",
        instagram_url: config.contact.instagram_url || branding?.instagram_url || "",
        facebook_url: config.contact.facebook_url || branding?.facebook_url || "",
        youtube_url: config.contact.youtube_url || branding?.youtube_url || "",
        latitude: config.contact.latitude || branding?.latitude || "",
        longitude: config.contact.longitude || branding?.longitude || "",
        meta_settings: {
          ...(branding?.meta_settings || {}),
          pixel_id: config.seo_marketing.meta_pixel_id,
          ga_measurement_id: config.seo_marketing.google_analytics_id,
          gtm_id: config.seo_marketing.google_tag_manager_id,
          gsc_id: config.seo_marketing.google_search_console_code,
          meta_title: config.seo_marketing.meta_title,
          meta_description: config.seo_marketing.meta_description,
          meta_keywords: config.seo_marketing.meta_keywords,
        },
        corporate_config: updatedCorporateConfig,
      };

      setBranding(updatedBranding);
      await api.updateBranding(updatedBranding, currentStoreId ? Number(currentStoreId) : undefined);
      setSaveMessage({
        type: "success",
        text: "Web sitesi tasarım ve içerik ayarları başarıyla kaydedildi ve yayına alındı!",
      });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error("Failed to save corporate website config:", err);
      setSaveMessage({
        type: "error",
        text: err?.message || "Kaydedilirken bir hata oluştu.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void,
    fieldKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldKey);
    try {
      let uploadedUrl = "";
      if (typeof (api as any).uploadImage === "function") {
        uploadedUrl = await (api as any).uploadImage(file);
      } else {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.uploadFile(formData);
        uploadedUrl = res?.url || res?.data?.url || "";
      }
      if (uploadedUrl) {
        onUploaded(uploadedUrl);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  // Service Helpers
  const addService = () => {
    const newItem: CorporateServiceItem = {
      id: `srv-${Date.now()}`,
      title: "Yeni Hizmet Başlığı",
      subtitle: "Kısa Özet & Slogan",
      description:
        "Sunduğunuz bu hizmetin kapsamını, avantajlarını ve çalışma sürecinizi buraya detaylı olarak yazabilirsiniz.",
      image_url:
        "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=80",
      badge: "Profesyonel Hizmet",
      features: ["Uzman Ekip", "Garantili Hizmet", "7/24 Destek"],
      cta_text: "Detaylı Bilgi & WhatsApp",
      whatsapp_message: "Merhaba, hizmetiniz hakkında bilgi almak istiyorum.",
    };
    setConfig((prev) => ({
      ...prev,
      services: [...prev.services, newItem],
    }));
  };

  const updateService = (
    idx: number,
    patch: Partial<CorporateServiceItem>
  ) => {
    setConfig((prev) => {
      const next = [...prev.services];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, services: next };
    });
  };

  const removeService = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== idx),
    }));
  };

  const moveService = (idx: number, dir: -1 | 1) => {
    setConfig((prev) => {
      const next = [...prev.services];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return { ...prev, services: next };
    });
  };

  // Custom Page Helpers
  const addCustomPage = () => {
    const id = `sayfa-${Date.now().toString().slice(-4)}`;
    const newPage: CorporateCustomPage = {
      id,
      slug: id,
      title: "Yeni Sayfa",
      subtitle: "Sayfa alt başlığı ve kısa açıklama",
      badge: "Bilgilendirme",
      content:
        "Bu özel sayfada müşterilerinize sunmak istediğiniz detaylı bilgileri, çalışma koşullarınızı, sertifikalarınızı veya süreçlerinizi anlatabilirsiniz.",
      image_url:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
      bullet_points: [
        "Kurumsal ve şeffaf hizmet anlayışı",
        "Uzman kadro ile hızlı çözüm",
      ],
      show_in_nav: true,
    };
    setConfig((prev) => ({
      ...prev,
      custom_pages: [...prev.custom_pages, newPage],
    }));
  };

  const updateCustomPage = (
    idx: number,
    patch: Partial<CorporateCustomPage>
  ) => {
    setConfig((prev) => {
      const next = [...prev.custom_pages];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, custom_pages: next };
    });
  };

  const removeCustomPage = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      custom_pages: prev.custom_pages.filter((_, i) => i !== idx),
    }));
  };

  // Gallery Helpers
  const addGalleryImage = (url?: string) => {
    const newImg: CorporateGalleryImage = {
      id: `gal-${Date.now()}`,
      url:
        url ||
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1000&q=80",
      title: "Tesis ve Hizmet Görseli",
      category: "Genel",
    };
    setConfig((prev) => ({
      ...prev,
      gallery: [...prev.gallery, newImg],
    }));
  };

  const publicSiteUrl = branding?.custom_domain
    ? `https://${branding.custom_domain}`
    : branding?.slug
      ? `/${branding.slug}`
      : "/";

  return (
    <div className="space-y-4">
      {/* Top Integrated Header Bar (Single Module Header Rule) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Web Sitesi Tasarım & İçerik Stüdyosu
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Yeni Nesil Kurumsal Web
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Hizmetlerimiz, Hakkımızda, Ek Sayfalar, Galeri, Google Haritalı İletişim ve Meta/Google ayarlarını tek ekrandan yönetin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={publicSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs sm:text-sm font-bold border border-slate-700 transition-all"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            Canlı Web Sitesini Gör
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet & Yayınla"}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-sm font-bold ${
            saveMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Sub-Navigation Pills */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: "hero", label: "1. Vitrin & Ana Ekran", icon: Sparkles },
          {
            id: "services",
            label: `2. Hizmetlerimiz (${(config.services || []).length})`,
            icon: Layers,
          },
          { id: "about", label: "3. Hakkımızda & Değerler", icon: Award },
          {
            id: "pages",
            label: `4. Ek Sayfalar (${(config.custom_pages || []).length})`,
            icon: FileText,
          },
          {
            id: "gallery",
            label: `5. Fotoğraf Galerisi (${(config.gallery || []).length})`,
            icon: ImageIcon,
          },
          {
            id: "contact",
            label: "6. İletişim & Google Harita",
            icon: MapPin,
          },
          {
            id: "theme_seo",
            label: "7. Tema, Logo & Google/Meta",
            icon: Palette,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as StudioSubTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. HERO & VITRIN */}
      {activeSubTab === "hero" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Ana Karşılama Ekranı (Hero) ve Üst Duyuru Bandı
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <div className="sm:col-span-3">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.announcement.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: {
                          ...prev.announcement,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Üst Duyuru Bandı
                </label>
              </div>
              <div className="sm:col-span-9">
                <input
                  type="text"
                  value={config.announcement.text}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      announcement: {
                        ...prev.announcement,
                        text: e.target.value,
                      },
                    }))
                  }
                  placeholder="Örn: 7/24 Kesintisiz Hizmet ve Ücretsiz Danışmanlık Hattımız Aktiftir"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Üst Rozet Metni (Badge)
                </label>
                <input
                  type="text"
                  value={config.hero.badge}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, badge: e.target.value },
                    }))
                  }
                  placeholder="Örn: %100 Güvenilir & Hijyenik Hizmet"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Renkli Vurgulu Başlık Kelimesi
                </label>
                <input
                  type="text"
                  value={config.hero.highlight_word}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, highlight_word: e.target.value },
                    }))
                  }
                  placeholder="Örn: Profesyonel Çözümler"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ana Manşet Başlığı (Hero Title)
              </label>
              <input
                type="text"
                value={config.hero.title}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, title: e.target.value },
                  }))
                }
                placeholder="Örn: Güvenilir, Kurumsal ve"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ana Ekran Açıklama Metni (Alt Başlık)
              </label>
              <textarea
                rows={3}
                value={config.hero.subtitle}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, subtitle: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. Aksiyon Butonu Yazısı
                </label>
                <input
                  type="text"
                  value={config.hero.primary_cta_text}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, primary_cta_text: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Aksiyon Butonu Yazısı (WhatsApp)
                </label>
                <input
                  type="text"
                  value={config.hero.secondary_cta_text}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: {
                        ...prev.hero,
                        secondary_cta_text: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Hero Background Slider Images */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Arka Plan Slayt Görselleri (Otomatik Geçişli)
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingField === "hero-bg"
                    ? "Yükleniyor..."
                    : "Görsel Yükle"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageFileUpload(
                        e,
                        (url) =>
                          setConfig((prev) => ({
                            ...prev,
                            hero: {
                              ...prev.hero,
                              background_images: [
                                ...prev.hero.background_images,
                                url,
                              ],
                            },
                          })),
                        "hero-bg"
                      )
                    }
                  />
                </label>
              </div>

              <div className="space-y-2">
                {(config.hero?.background_images || []).map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <img
                      src={imgUrl}
                      alt=""
                      className="w-14 h-10 rounded-lg object-cover shrink-0 border border-slate-300 dark:border-slate-600"
                    />
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig((prev) => {
                          const next = [...(prev.hero?.background_images || [])];
                          next[idx] = val;
                          return {
                            ...prev,
                            hero: { ...(prev.hero || {}), background_images: next },
                          };
                        });
                      }}
                      placeholder="Görsel URL..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                    {(config.hero?.background_images || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            hero: {
                              ...(prev.hero || {}),
                              background_images:
                                (prev.hero?.background_images || []).filter(
                                  (_, i) => i !== idx
                                ),
                            },
                          }))
                        }
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: {
                        ...(prev.hero || {}),
                        background_images: [
                          ...(prev.hero?.background_images || []),
                          "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80",
                        ],
                      },
                    }))
                  }
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> URL İle Yeni Slayt Görseli Ekle
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Trust Stats Cards */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Sayfada Öne Çıkan Rakamlar & Güven Kartları
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ana ekranın sağında ve altında animasyonlu olarak beliren 4'lü kurumsal güven göstergeleri:
            </p>

            <div className="space-y-3">
              {(config.hero?.stats || []).map((st, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2.5 items-center"
                >
                  <div className="col-span-4">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      Değer / Rakam
                    </label>
                    <input
                      type="text"
                      value={st.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig((prev) => {
                          const next = [...(prev.hero?.stats || [])];
                          next[idx] = { ...next[idx], value: val };
                          return {
                            ...prev,
                            hero: { ...(prev.hero || {}), stats: next },
                          };
                        });
                      }}
                      placeholder="15+ Yıl"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-black text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="col-span-8">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      Açıklama Etiketi
                    </label>
                    <input
                      type="text"
                      value={st.label}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConfig((prev) => {
                          const next = [...prev.hero.stats];
                          next[idx] = { ...next[idx], label: val };
                          return {
                            ...prev,
                            hero: { ...prev.hero, stats: next },
                          };
                        });
                      }}
                      placeholder="Sektörel Tecrübe"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. HİZMETLERİMİZ */}
      {activeSubTab === "services" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  "Hizmetlerimiz" Bölümü Başlıkları & Hizmet Kartları
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Müşterilerinizin web sitenizde inceleyeceği tüm hizmetleri, resimleri ve maddeleriyle özelleştirin.
                </p>
              </div>
              <button
                type="button"
                onClick={addService}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Yeni Hizmet Kartı Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Üst Etiket (Rozet)
                </label>
                <input
                  type="text"
                  value={config.services_section.badge}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      services_section: {
                        ...prev.services_section,
                        badge: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bölüm Ana Başlığı
                </label>
                <input
                  type="text"
                  value={config.services_section.title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      services_section: {
                        ...prev.services_section,
                        title: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bölüm Alt Açıklaması
                </label>
                <input
                  type="text"
                  value={config.services_section.subtitle}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      services_section: {
                        ...prev.services_section,
                        subtitle: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(config.services || []).map((srv, idx) => (
              <div
                key={srv.id || idx}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {srv.title || "Hizmet Kartı"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveService(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Yukarı Taşı"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveService(idx, 1)}
                      disabled={idx === (config.services || []).length - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Aşağı Taşı"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeService(idx)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Hizmeti Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <div className="relative h-36 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={srv.image_url}
                        alt={srv.title}
                        className="w-full h-full object-cover"
                      />
                      <label className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer backdrop-blur-xs">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingField === `srv-${idx}`
                          ? "Yükleniyor..."
                          : "Resim Değiştir"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageFileUpload(
                              e,
                              (url) => updateService(idx, { image_url: url }),
                              `srv-${idx}`
                            )
                          }
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={srv.image_url}
                      onChange={(e) =>
                        updateService(idx, { image_url: e.target.value })
                      }
                      placeholder="Görsel URL..."
                      className="mt-1.5 w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div className="sm:col-span-7 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-8">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          Hizmet Başlığı
                        </label>
                        <input
                          type="text"
                          value={srv.title}
                          onChange={(e) =>
                            updateService(idx, { title: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                          Üst Rozet
                        </label>
                        <input
                          type="text"
                          value={srv.badge || ""}
                          onChange={(e) =>
                            updateService(idx, { badge: e.target.value })
                          }
                          placeholder="Örn: Popüler"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        Kısa Alt Başlık
                      </label>
                      <input
                        type="text"
                        value={srv.subtitle}
                        onChange={(e) =>
                          updateService(idx, { subtitle: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">
                        Detaylı Hizmet Açıklaması
                      </label>
                      <textarea
                        rows={3}
                        value={srv.description}
                        onChange={(e) =>
                          updateService(idx, { description: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Hizmet Maddeleri (Her satıra veya virgülle ayırarak yazın)
                  </label>
                  <input
                    type="text"
                    value={(srv.features || []).join(", ")}
                    onChange={(e) =>
                      updateService(idx, {
                        features: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Örn: Veteriner Kontrolü, Ücretsiz Kesim, Vekaletli Video Gönderimi"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. HAKKIMIZDA */}
      {activeSubTab === "about" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              "Hakkımızda" Yazısı, Misyon & Vizyon Özelleştirme
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bölüm Rozeti
                </label>
                <input
                  type="text"
                  value={config.about.badge}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, badge: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Hakkımızda Ana Başlığı
                </label>
                <input
                  type="text"
                  value={config.about.title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, title: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kısa Özet Сümlesi (Alt Başlık)
              </label>
              <input
                type="text"
                value={config.about.subtitle}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, subtitle: e.target.value },
                  }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Detaylı Hakkımızda Metni (Paragraflar halinde yazabilirsiniz)
              </label>
              <textarea
                rows={7}
                value={config.about.content}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, content: e.target.value },
                  }))
                }
                placeholder="Firmanızın tarihçesini, çalışma ilkelerini ve müşterilerinize sunduğunuz güveni buraya detaylıca yazın..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Misyonumuz
                </label>
                <textarea
                  rows={3}
                  value={config.about.mission}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, mission: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Vizyonumuz
                </label>
                <textarea
                  rows={3}
                  value={config.about.vision}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, vision: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Hakkımızda Görseli & Tecrübe Rozeti
            </h3>

            <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              <img
                src={config.about.image_url}
                alt="Hakkımızda"
                className="w-full h-full object-cover"
              />
              <label className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {uploadingField === "about-img"
                  ? "Yükleniyor..."
                  : "Görsel Yükle"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleImageFileUpload(
                      e,
                      (url) =>
                        setConfig((prev) => ({
                          ...prev,
                          about: { ...prev.about, image_url: url },
                        })),
                      "about-img"
                    )
                  }
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Görsel URL Adresi
              </label>
              <input
                type="text"
                value={config.about.image_url}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    about: { ...prev.about, image_url: e.target.value },
                  }))
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tecrübe Yılı / Değer
                </label>
                <input
                  type="text"
                  value={config.about.experience_years}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: {
                        ...prev.about,
                        experience_years: e.target.value,
                      },
                    }))
                  }
                  placeholder="15+ Yıl"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-black text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tecrübe Alt Yazısı
                </label>
                <input
                  type="text"
                  value={config.about.experience_text}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      about: { ...prev.about, experience_text: e.target.value },
                    }))
                  }
                  placeholder="Güven ve Tecrübe"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Öne Çıkan Kurumsal İlkeler (Neden Biz?)
              </label>
              {(config.about?.highlights || []).map((hl, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5"
                >
                  <input
                    type="text"
                    value={hl.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfig((prev) => {
                        const next = [...(prev.about?.highlights || [])];
                        next[idx] = { ...next[idx], title: val };
                        return {
                          ...prev,
                          about: { ...(prev.about || {}), highlights: next },
                        };
                      });
                    }}
                    placeholder="Başlık"
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={hl.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfig((prev) => {
                        const next = [...prev.about.highlights];
                        next[idx] = { ...next[idx], description: val };
                        return {
                          ...prev,
                          about: { ...prev.about, highlights: next },
                        };
                      });
                    }}
                    placeholder="Açıklama"
                    className="w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. EK SAYFALAR */}
      {activeSubTab === "pages" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Web Sitesi Ek Sayfaları (Menüye Otomatik Eklenir)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Örn: "Kurban Rehberi", "Vekalet & Kesim Süreci", "Sertifikalarımız", "Çiftliğimiz" gibi dilediğiniz kadar özel sayfa ekleyebilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={addCustomPage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Yeni Sayfa Oluştur
            </button>
          </div>

          {(config.custom_pages || []).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Henüz ek bir sayfa eklenmemiş
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Ana sayfa, Hizmetlerimiz, Hakkımızda ve İletişim haricinde üst menüde yer almasını istediğiniz özel sayfaları buradan ekleyebilirsiniz.
              </p>
              <button
                type="button"
                onClick={addCustomPage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> İlk Özel Sayfayı Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(config.custom_pages || []).map((pg, idx) => (
                <div
                  key={pg.id || idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black">
                        Sayfa #{idx + 1}
                      </span>
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pg.show_in_nav}
                          onChange={(e) =>
                            updateCustomPage(idx, {
                              show_in_nav: e.target.checked,
                            })
                          }
                          className="rounded border-slate-300 text-emerald-600"
                        />
                        Üst Menüde Göster
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomPage(idx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Sayfayı Sil
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4 space-y-2">
                      <div className="relative h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        {pg.image_url ? (
                          <img
                            src={pg.image_url}
                            alt={pg.title}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <label className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-slate-900/85 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          {uploadingField === `pg-${idx}`
                            ? "Yükleniyor..."
                            : "Sayfa Görseli Yükle"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleImageFileUpload(
                                e,
                                (url) =>
                                  updateCustomPage(idx, { image_url: url }),
                                `pg-${idx}`
                              )
                            }
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={pg.image_url || ""}
                        onChange={(e) =>
                          updateCustomPage(idx, { image_url: e.target.value })
                        }
                        placeholder="Görsel URL..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="lg:col-span-8 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Menü ve Sayfa Başlığı
                          </label>
                          <input
                            type="text"
                            value={pg.title}
                            onChange={(e) =>
                              updateCustomPage(idx, { title: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Üst Rozet
                          </label>
                          <input
                            type="text"
                            value={pg.badge || ""}
                            onChange={(e) =>
                              updateCustomPage(idx, { badge: e.target.value })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Sayfa Alt Başlığı
                        </label>
                        <input
                          type="text"
                          value={pg.subtitle || ""}
                          onChange={(e) =>
                            updateCustomPage(idx, { subtitle: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Sayfa İçeriği
                        </label>
                        <textarea
                          rows={4}
                          value={pg.content}
                          onChange={(e) =>
                            updateCustomPage(idx, { content: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Önemli Maddeler (Virgülle ayırarak yazın)
                        </label>
                        <input
                          type="text"
                          value={(pg.bullet_points || []).join(", ")}
                          onChange={(e) =>
                            updateCustomPage(idx, {
                              bullet_points: e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. FOTOĞRAF GALERİSİ */}
      {activeSubTab === "gallery" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  Fotoğraf Galerisi & Görsel Tanıtım
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  İşletmenize, tesisinize veya çalışmalarınıza ait fotoğrafları ekleyin.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black cursor-pointer">
                  <Upload className="w-4 h-4" />
                  {uploadingField === "gallery-new"
                    ? "Yükleniyor..."
                    : "Bilgisayardan Fotoğraf Yükle"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleImageFileUpload(
                        e,
                        (url) => addGalleryImage(url),
                        "gallery-new"
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() => addGalleryImage()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> URL Ekle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.gallery_section.enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        gallery_section: {
                          ...prev.gallery_section,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  Galeri Bölümünü Sitede Göster
                </label>
              </div>
              <div>
                <input
                  type="text"
                  value={config.gallery_section.title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      gallery_section: {
                        ...prev.gallery_section,
                        title: e.target.value,
                      },
                    }))
                  }
                  placeholder="Galeri Başlığı"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={config.gallery_section.subtitle}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      gallery_section: {
                        ...prev.gallery_section,
                        subtitle: e.target.value,
                      },
                    }))
                  }
                  placeholder="Galeri Alt Açıklaması"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(config.gallery || []).map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="relative h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        gallery: (prev.gallery || []).filter((_, i) => i !== idx),
                      }))
                    }
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white shadow-sm cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfig((prev) => {
                      const next = [...prev.gallery];
                      next[idx] = { ...next[idx], title: val };
                      return { ...prev, gallery: next };
                    });
                  }}
                  placeholder="Fotoğraf Başlığı"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={item.url}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfig((prev) => {
                      const next = [...prev.gallery];
                      next[idx] = { ...next[idx], url: val };
                      return { ...prev, gallery: next };
                    });
                  }}
                  placeholder="Görsel URL..."
                  className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-600 dark:text-slate-400"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. İLETİŞİM & GOOGLE HARİTA */}
      {activeSubTab === "contact" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              İletişim Bilgileri & Sosyal Medya
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  1. Telefon Numarası (Ana Hat)
                </label>
                <input
                  type="text"
                  value={config.contact.phone_primary}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        phone_primary: e.target.value,
                      },
                    }))
                  }
                  placeholder="+90 532 000 00 00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  2. Yedek / Sabit Telefon
                </label>
                <input
                  type="text"
                  value={config.contact.phone_secondary}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        phone_secondary: e.target.value,
                      },
                    }))
                  }
                  placeholder="+90 212 000 00 00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Hattı
                </label>
                <input
                  type="text"
                  value={config.contact.whatsapp}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, whatsapp: e.target.value },
                    }))
                  }
                  placeholder="905320000000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kurumsal E-Posta Adresi
                </label>
                <input
                  type="email"
                  value={config.contact.email}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value },
                    }))
                  }
                  placeholder="iletisim@alanadiniz.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Açık Adres
              </label>
              <textarea
                rows={2}
                value={config.contact.address}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, address: e.target.value },
                  }))
                }
                placeholder="Mahalle, Cadde, Sokak, No, İlçe / İl"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Çalışma Saatleri Bilgilendirmesi
              </label>
              <input
                type="text"
                value={config.contact.working_hours}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    contact: {
                      ...prev.contact,
                      working_hours: e.target.value,
                    },
                  }))
                }
                placeholder="Pazartesi - Pazar: 08:00 - 22:00 (7/24 Kesintisiz Destek)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Instagram Linki
                </label>
                <input
                  type="text"
                  value={config.contact.instagram_url}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        instagram_url: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://instagram.com/..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Facebook Linki
                </label>
                <input
                  type="text"
                  value={config.contact.facebook_url}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        facebook_url: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://facebook.com/..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  YouTube Linki
                </label>
                <input
                  type="text"
                  value={config.contact.youtube_url}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: {
                        ...prev.contact,
                        youtube_url: e.target.value,
                      },
                    }))
                  }
                  placeholder="https://youtube.com/..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Google Map Integration */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Google Harita (Konum & Yol Tarifi) Ayarları
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              İster Enlem/Boylam koordinatı girin, ister Google Maps "Haritayı yerleştir (iframe)" linkini yapıştırın. Açık adresiniz üzerinden de harita otomatik oluşturulur.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enlem (Latitude)
                </label>
                <input
                  type="text"
                  value={config.contact.latitude}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, latitude: e.target.value },
                    }))
                  }
                  placeholder="Örn: 41.0082"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Boylam (Longitude)
                </label>
                <input
                  type="text"
                  value={config.contact.longitude}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, longitude: e.target.value },
                    }))
                  }
                  placeholder="Örn: 28.9784"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Google Harita Embed URL (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={config.contact.map_embed_url}
                onChange={(e) => {
                  let raw = e.target.value.trim();
                  const srcMatch = raw.match(/src=["']([^"']+)["']/i);
                  if (srcMatch?.[1]) raw = srcMatch[1];
                  setConfig((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, map_embed_url: raw },
                  }));
                }}
                placeholder="https://www.google.com/maps/embed?pb=... veya <iframe> kodu yapıştırın"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Live Map Preview */}
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-56 bg-slate-100 dark:bg-slate-800">
              <iframe
                title="Harita Önizleme"
                src={
                  config.contact.map_embed_url ||
                  (config.contact.latitude && config.contact.longitude
                    ? `https://maps.google.com/maps?q=${config.contact.latitude},${config.contact.longitude}&hl=tr&z=15&output=embed`
                    : `https://maps.google.com/maps?q=${encodeURIComponent(
                        config.contact.address || "İstanbul, Türkiye"
                      )}&hl=tr&z=14&output=embed`)
                }
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. TEMA, LOGO & GOOGLE / META */}
      {activeSubTab === "theme_seo" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-emerald-600" />
              Firma Adı, Logo & Renk Paleti
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Web Sitesinde Görünecek Firma Adı
              </label>
              <input
                type="text"
                value={branding?.store_name || branding?.name || ""}
                onChange={(e) =>
                  setBranding({
                    ...branding,
                    store_name: e.target.value,
                    name: e.target.value,
                  })
                }
                placeholder="Örn: Özçelik Adak & Kurban Satış Merkezi"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>

            {onLogoUpload && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {branding?.logo_url ? (
                      <img
                        src={branding.logo_url}
                        alt="Logo"
                        className="w-12 h-12 rounded-lg object-contain bg-white p-1 border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                        Logo
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Site Logosu
                      </div>
                      <div className="text-[11px] text-slate-500">
                        PNG, SVG veya JPG
                      </div>
                    </div>
                  </div>
                  <label className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer">
                    Yükle
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onLogoUpload}
                    />
                  </label>
                </div>

                {onFaviconUpload && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {branding?.favicon_url ? (
                        <img
                          src={branding.favicon_url}
                          alt="Favicon"
                          className="w-10 h-10 rounded-lg object-contain bg-white p-1 border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                          İkon
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Sekme İkonu (Favicon)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tarayıcı ikonu
                        </div>
                      </div>
                    </div>
                    <label className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer">
                      Yükle
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={onFaviconUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Web Sitesi Renk Teması
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: "emerald_gold",
                    name: "Zümrüt Yeşili & Altın (Doğal / Adak / Hizmet)",
                    dot: "bg-emerald-600",
                  },
                  {
                    id: "royal_cobalt",
                    name: "Kraliyet Mavisi (Kurumsal / Mühendislik / Lojistik)",
                    dot: "bg-blue-600",
                  },
                  {
                    id: "obsidian_luxury",
                    name: "Obsidyen & Kehribar (VIP / Mimari / Danışmanlık)",
                    dot: "bg-amber-600",
                  },
                  {
                    id: "terracotta_warm",
                    name: "Toprak & Turuncu (Üretim / Çiftlik / Gıda)",
                    dot: "bg-orange-600",
                  },
                  {
                    id: "crimson_trust",
                    name: "Kurumsal Kırmızı (Güvenlik / Enerji / Sağlık)",
                    dot: "bg-rose-600",
                  },
                ].map((pal) => (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        theme_palette: pal.id as any,
                      }))
                    }
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      config.theme_palette === pal.id
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-900 dark:text-white ring-2 ring-emerald-500/30"
                        : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full shrink-0 ${pal.dot}`} />
                    <span className="line-clamp-1">{pal.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Google & Meta Integrations */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3.5">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-600" />
              Google & Meta (Facebook/Instagram) Hizmet Tanımlamaları
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Web sitenizin Google aramalarında üst sıralara çıkması ve reklam dönüşümlerini ölçümleyebilmesi için kodlarınızı buraya tanımlayın.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Analytics 4 (GA4) Ölçüm Kimliği
                </label>
                <input
                  type="text"
                  value={config.seo_marketing.google_analytics_id}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      seo_marketing: {
                        ...prev.seo_marketing,
                        google_analytics_id: e.target.value.trim(),
                      },
                    }))
                  }
                  placeholder="G-XXXXXXXXXX"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Tag Manager (GTM) Kimliği
                </label>
                <input
                  type="text"
                  value={config.seo_marketing.google_tag_manager_id}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      seo_marketing: {
                        ...prev.seo_marketing,
                        google_tag_manager_id: e.target.value.trim(),
                      },
                    }))
                  }
                  placeholder="GTM-XXXXXXX"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meta (Facebook / Instagram) Pixel ID
                </label>
                <input
                  type="text"
                  value={config.seo_marketing.meta_pixel_id}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      seo_marketing: {
                        ...prev.seo_marketing,
                        meta_pixel_id: e.target.value.trim(),
                      },
                    }))
                  }
                  placeholder="123456789012345"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Search Console Doğrulama Kodu
                </label>
                <input
                  type="text"
                  value={config.seo_marketing.google_search_console_code}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      seo_marketing: {
                        ...prev.seo_marketing,
                        google_search_console_code: e.target.value.trim(),
                      },
                    }))
                  }
                  placeholder="google-site-verification içeriği"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Arama Başlığı (SEO Meta Title)
                </label>
                <input
                  type="text"
                  value={config.seo_marketing.meta_title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      seo_marketing: {
                        ...prev.seo_marketing,
                        meta_title: e.target.value,
                      },
                    }))
                  }
                  placeholder="Örn: Özçelik Adak ve Kurban Satışı | İstanbul İslami Usullere Uygun Kesim"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Google Arama Açıklaması (SEO Meta Description)
                </label>
                <textarea
                  rows={2}
                  value={config.seo_marketing.meta_description}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      seo_marketing: {
                        ...prev.seo_marketing,
                        meta_description: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Anahtar Kelimeler (Meta Keywords)
                </label>
                <input
                  type="text"
                  value={config.seo_marketing.meta_keywords}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      seo_marketing: {
                        ...prev.seo_marketing,
                        meta_keywords: e.target.value,
                      },
                    }))
                  }
                  placeholder="adak kurban, akika kurbanı, kurumsal hizmet..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateWebsiteStudioTab;
