import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "motion/react";
import { LookPriceFooterBadge } from "./common/LookPriceFooterBadge";
import {
  Phone,
  MessageCircle,
  MapPin,
  Mail,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Award,
  Users,
  ArrowUpRight,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Send,
  X,
  Menu,
  Sun,
  Moon,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  BookOpen,
  Navigation,
  ExternalLink,
  Check,
  Star,
  HeartHandshake,
  Building2,
  Compass
} from "lucide-react";
import { Store as StoreInfo, BlogPost } from "../types";

const StoreMapSection = React.lazy(() =>
  import("./StoreMapSection").then((m) => ({ default: m.StoreMapSection }))
);

export interface CorporateServiceItem {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  image_url: string;
  badge?: string;
  features?: string[];
  cta_text?: string;
  whatsapp_message?: string;
}

export interface CorporateCustomPage {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  content: string;
  image_url?: string;
  badge?: string;
  show_in_nav: boolean;
  bullet_points?: string[];
}

export interface CorporateGalleryImage {
  id: string;
  url: string;
  title: string;
  category?: string;
}

export interface CorporateWebsiteConfig {
  [key: string]: any;
  theme_preset?: "emerald_gold" | "royal_cobalt" | "obsidian_luxury" | "terracotta_warm" | "crimson_trust";
  default_color_mode?: "light" | "dark";
  announcement_enabled?: boolean;
  announcement_text?: string;
  nav_labels?: {
    home?: string;
    services?: string;
    about?: string;
    gallery?: string;
    faq?: string;
    blog?: string;
    contact?: string;
    cta_button?: string;
  };
  hero?: {
    [key: string]: any;
    badge_text?: string;
    badge?: string;
    title?: string;
    highlight_word?: string;
    subtitle?: string;
    primary_cta_text?: string;
    secondary_cta_text?: string;
    hero_images?: string[];
    background_images?: string[];
    stats?: Array<{ value: string; label: string; sublabel?: string }>;
  };
  services_section?: {
    enabled?: boolean;
    badge?: string;
    title?: string;
    subtitle?: string;
    items?: CorporateServiceItem[];
  };
  about_section?: {
    enabled?: boolean;
    badge?: string;
    title?: string;
    subtitle?: string;
    content?: string;
    mission_title?: string;
    mission_text?: string;
    vision_title?: string;
    vision_text?: string;
    image_url?: string;
    secondary_image_url?: string;
    experience_badge_value?: string;
    experience_badge_label?: string;
    highlights?: Array<{ title: string; description: string }>;
  };
  custom_pages?: CorporateCustomPage[];
  gallery_section?: {
    enabled?: boolean;
    badge?: string;
    title?: string;
    subtitle?: string;
    images?: CorporateGalleryImage[];
  };
  contact_section?: {
    badge?: string;
    title?: string;
    subtitle?: string;
    working_hours?: string;
    map_embed_url?: string;
    latitude?: string | number;
    longitude?: string | number;
    show_contact_form?: boolean;
  };
  floating_actions?: {
    show_whatsapp?: boolean;
    show_call_button?: boolean;
    whatsapp_welcome_text?: string;
  };
}

export const getDefaultCorporateConfig = (store?: Partial<StoreInfo> | any): CorporateWebsiteConfig => {
  const storeName =
    (store?.branding?.store_name && !/^lookprice$/i.test(store.branding.store_name))
      ? store.branding.store_name
      : (store?.name && !/^lookprice$/i.test(store.name))
      ? store.name
      : "Seçkin Kurumsal Hizmetler";

  const defaultServices: CorporateServiceItem[] = [
    {
      id: "srv-1",
      title: "Adak, Akika & Şükür Kurbanı Hizmeti",
      subtitle: "İslami Usullere Tam Uygun & Veteriner Kontrollü",
      description:
        "Tesisimizde veteriner hekim kontrolünde yetiştirilen sağlıklı kurbanlıklarımız, İslami usullere ve hijyen kurallarına tam riayet edilerek uzman kasaplarımız tarafından hazırlanır.",
      image_url:
        "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1000&q=80",
      badge: "En Çok Tercih Edilen",
      features: [
        "Veteriner Hekim Onaylı Sağlıklı Seçenekler",
        "Hijyenik Kesimhane & İslami Usullere Tam Uygunluk",
        "Eşit Paylama, Parçalama ve Özel Paketleme",
        "Yerinde Görerek Seçim veya Görüntülü Vekalet İmkanı",
      ],
      cta_text: "Detaylı Bilgi & Fiyat Al",
      whatsapp_message: "Merhaba, Adak ve Akika hizmetleriniz hakkında detaylı bilgi almak istiyorum.",
    },
    {
      id: "srv-2",
      title: "Görüntülü Vekalet & Canlı Video Teslimat",
      subtitle: "Yurt İçi ve Yurt Dışı Uzaktan Güvenli Süreç",
      description:
        "Tesisimize gelemeyen misafirlerimiz için görüntülü görüşme veya isme özel kesim videosu ile vekalet sürecini şeffaf biçimde tamamlıyor, dilediğiniz adrese veya hayır kurumlarına ulaştırıyoruz.",
      image_url:
        "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1000&q=80",
      badge: "Video Kanıtlı Hizmet",
      features: [
        "WhatsApp Üzerinden Canlı Bağlantı veya Video Gönderimi",
        "İsme Özel Okuma ve Şeffaf Süreç Yönetimi",
        "İsteğe Göre Adrese Teslim veya Aşevi/Kurum Dağıtımı",
        "Aynı Gün İçerisinde Hızlı Organizasyon",
      ],
      cta_text: "Vekalet Sürecini Sorun",
      whatsapp_message: "Merhaba, görüntülü vekalet ve video gönderimli hizmetiniz hakkında bilgi almak istiyorum.",
    },
    {
      id: "srv-3",
      title: "Hijyenik Paketleme & Soğuk Zincir Dağıtım",
      subtitle: "Özel Muhafazalı Teslimat & Paylama Desteği",
      description:
        "Hazırlanan tüm paylar modern soğuk hava standartlarında dinlendirilir, özel gıda ambalajlarıyla hijyenik olarak paketlenir ve zamanında teslim edilir.",
      image_url:
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80",
      badge: "%100 Hijyen Standardı",
      features: [
        "Gıda Kodeksine Uygun Steril Kesim ve Paketleme",
        "İsteğe Göre Yemeklik veya Porsiyonluk Hazırlık",
        "Randevulu Sıra Beklemeden Hızlı Teslimat",
        "Misafir Ağırlama Alanı ve Ücretsiz İkramlar",
      ],
      cta_text: "Randevu & Bilgi Al",
      whatsapp_message: "Merhaba, tesisinizden randevu ve paketleme hizmetiniz hakkında bilgi almak istiyorum.",
    },
  ];

  const defaultGallery: CorporateGalleryImage[] = [
    {
      id: "gal-1",
      url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1000&q=80",
      title: "Modern ve Doğal Tesis Alanımız",
      category: "Tesisimiz",
    },
    {
      id: "gal-2",
      url: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1000&q=80",
      title: "Veteriner Kontrollü Sağlıklı Seçenekler",
      category: "Hizmetlerimiz",
    },
    {
      id: "gal-3",
      url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80",
      title: "Hijyenik Hazırlık ve Paketleme Standartlarımız",
      category: "Hijyen & Paketleme",
    },
  ];

  const heroImages = [
    store?.hero_image_url ||
      store?.branding?.hero_image_url ||
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=85",
  ];

  const heroStats = [
    { value: "15+ Yıl", label: "Sektörel Tecrübe", sublabel: "Köklü ve güvenilir geçmiş" },
    { value: "%100", label: "Müşteri Memnuniyeti", sublabel: "Şeffaf ve garantili süreç" },
    { value: "7/24", label: "Canlı Destek & İletişim", sublabel: "Her an ulaşılabilir uzman ekip" },
    { value: "10.000+", label: "Mutlu Müşteri", sublabel: "Türkiye genelinde referans" },
  ];

  const aboutContent =
    store?.about_text ||
    store?.branding?.about_text ||
    `${storeName} olarak kurulduğumuz ilk günden bu yana temel önceliğimiz; müşterilerimize güvene dayalı, şeffaf, sağlıklı ve kusursuz bir hizmet sunmaktır.\n\nModern tesislerimizde uzman kadromuz ile tüm süreçleri titizlikle yürütüyor, hijyen ve kalite standartlarından ödün vermeden beklentilerinizin ötesinde bir deneyim sağlıyoruz. Bizi tercih eden binlerce ailemizin memnuniyeti ve referansı en büyük motivasyon kaynağımızdır.`;

  const aboutHighlights = [
    {
      title: "Resmî & Denetimli Tesis",
      description: "Tüm süreçlerimiz veteriner hekim ve ilgili kurum standartlarına uygun yürütülür.",
    },
    {
      title: "Şeffaf ve Güvenilir Süreç",
      description: "Başlangıçtan teslimata kadar her aşamada bilgilendirme ve tam şeffaflık.",
    },
    {
      title: "Uzman & Güler Yüzlü Kadro",
      description: "Alanında deneyimli profesyonellerle hızlı, temiz ve eksiksiz hizmet.",
    },
    {
      title: "Kolay Ulaşım & Harita Konumu",
      description: "Merkezi lokasyonumuz ve geniş otopark alanımızla rahat ziyaret imkanı.",
    },
  ];

  const announcementText = `${storeName} — Profesyonel Hizmet, %100 Güven ve Kurumsal Çözüm Merkezi • 7/24 İletişim Hattımız Aktiftir`;

  const primaryPhone =
    store?.phone ||
    store?.branding?.phone ||
    "+90 548 890 23 09";

  const whatsappPhone =
    store?.whatsapp_number ||
    store?.branding?.whatsapp_number ||
    primaryPhone;

  const emailAddr =
    store?.email ||
    store?.branding?.email ||
    "info@kurumsal.com";

  const addressText =
    store?.address ||
    store?.branding?.address ||
    "Merkez Mah. Atatürk Cad. No: 12";

  const workingHours =
    store?.working_hours_text ||
    store?.branding?.working_hours_text ||
    "Pazartesi - Pazar: 07:30 - 22:00 (Haftanın 7 Günü Açık)";

  const latitudeVal = store?.latitude || store?.branding?.latitude || "";
  const longitudeVal = store?.longitude || store?.branding?.longitude || "";

  return {
    theme_preset: "emerald_gold",
    theme_palette: "emerald_gold",
    default_color_mode: "light",
    header_tagline: store?.branding?.tagline || "Kurumsal Hizmet & Tanıtım",
    typography: {
      font_family: "inter",
      heading_weight: "bold",
      body_weight: "normal",
      hero_title_size: "lg",
      section_title_size: "md",
      highlight_underline: "wavy",
    },
    custom_colors: {
      enabled: false,
      primary_color: "#059669",
      accent_color: "#f59e0b",
      hero_text_color: "#ffffff",
      hero_highlight_color: "#fbbf24",
    },
    announcement: {
      enabled: true,
      text: announcementText,
    },
    announcement_enabled: true,
    announcement_text: announcementText,
    nav_labels: {
      home: "Ana Sayfa",
      services: "Hizmetlerimiz",
      about: "Hakkımızda",
      gallery: "Galeri",
      faq: "S.S.S.",
      blog: "Blog & Duyurular",
      contact: "İletişim",
      cta_button: "Hemen Bize Ulaşın",
    },
    hero: {
      badge: "KURUMSAL GÜVEN & PROFESYONEL HİZMET",
      badge_text: "KURUMSAL GÜVEN & PROFESYONEL HİZMET",
      overlay_opacity: 15,
      title: `${storeName} İle Kaliteli ve Güvenilir Hizmet Deneyimi`,
      highlight_word: "Güvenilir Hizmet",
      subtitle:
        store?.hero_subtitle ||
        store?.branding?.hero_subtitle ||
        "Alanında uzman ekibimiz, modern tesislerimiz ve şeffaf hizmet anlayışımızla ihtiyaçlarınıza en hızlı, hijyenik ve güvenilir çözümleri sunuyoruz.",
      primary_cta_text: "Hizmetlerimizi İnceleyin",
      secondary_cta_text: "WhatsApp İletişim Hattı",
      hero_images: heroImages,
      background_images: heroImages,
      stats: heroStats,
    },
    services_section: {
      enabled: true,
      badge: "NELER YAPIYORUZ?",
      title: "Hizmetlerimiz",
      subtitle:
        "Size özel sunduğumuz tüm profesyonel hizmetlerimizde en yüksek kalite, hijyen ve güven standartlarını uyguluyoruz.",
      items: defaultServices,
    },
    services: defaultServices,
    about: {
      badge: "KURUMSAL KİMLİĞİMİZ",
      title: "Hakkımızda",
      subtitle: "Yılların verdiği tecrübe, dürüstlük ilkesi ve modern tesis altyapımızla yanınızdayız.",
      content: aboutContent,
      mission:
        "Etik değerlere, hijyen kurallarına ve müşteri memnuniyetine tam bağlılıkla; her zaman ulaşılabilir, şeffaf ve birinci sınıf hizmet sunmak.",
      vision:
        "Sektörümüzde yenilikçi uygulamalarımız, modern tesis yapımız ve sarsılmaz güven anlayışımızla bölgenin en çok tercih edilen öncü kurumu olmak.",
      image_url:
        "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=85",
      secondary_image_url:
        "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
      experience_years: "15+",
      experience_text: "Yıllık Güven & Tecrübe",
      highlights: aboutHighlights,
    },
    about_section: {
      enabled: true,
      badge: "KURUMSAL KİMLİĞİMİZ",
      title: "Hakkımızda",
      subtitle: "Yılların verdiği tecrübe, dürüstlük ilkesi ve modern tesis altyapımızla yanınızdayız.",
      content: aboutContent,
      mission_title: "Misyonumuz",
      mission_text:
        "Etik değerlere, hijyen kurallarına ve müşteri memnuniyetine tam bağlılıkla; her zaman ulaşılabilir, şeffaf ve birinci sınıf hizmet sunmak.",
      vision_title: "Vizyonumuz",
      vision_text:
        "Sektörümüzde yenilikçi uygulamalarımız, modern tesis yapımız ve sarsılmaz güven anlayışımızla bölgenin en çok tercih edilen öncü kurumu olmak.",
      image_url:
        "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=85",
      secondary_image_url:
        "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
      experience_badge_value: "15+",
      experience_badge_label: "Yıllık Güven & Tecrübe",
      highlights: aboutHighlights,
    },
    custom_pages: [],
    gallery_section: {
      enabled: true,
      badge: "TESİSİMİZ & ÇALIŞMALARIMIZ",
      title: "Fotoğraf Galerisi",
      subtitle: "Tesisimizden, hizmet süreçlerimizden ve çalışmalarımızdan güncel kareler.",
      images: defaultGallery,
    },
    gallery: defaultGallery,
    contact: {
      badge: "BİZE ULAŞIN",
      title: "İletişim & Harita Konumumuz",
      subtitle:
        "Sorularınız, randevu talepleriniz veya tesisimizi ziyaret etmek için aşağıdaki iletişim kanallarımızdan bize 7/24 ulaşabilirsiniz.",
      phone_primary: primaryPhone,
      phone_secondary: "",
      whatsapp: whatsappPhone,
      email: emailAddr,
      address: addressText,
      working_hours: workingHours,
      instagram_url: store?.instagram_url || store?.branding?.instagram_url || "",
      facebook_url: store?.facebook_url || store?.branding?.facebook_url || "",
      youtube_url: store?.youtube_url || store?.branding?.youtube_url || "",
      latitude: latitudeVal,
      longitude: longitudeVal,
      map_embed_url: "",
    },
    contact_section: {
      badge: "BİZE ULAŞIN",
      title: "İletişim & Harita Konumumuz",
      subtitle:
        "Sorularınız, randevu talepleriniz veya tesisimizi ziyaret etmek için aşağıdaki iletişim kanallarımızdan bize 7/24 ulaşabilirsiniz.",
      working_hours: workingHours,
      map_embed_url: "",
      latitude: latitudeVal,
      longitude: longitudeVal,
      show_contact_form: true,
    },
    seo_marketing: {
      meta_title: `${storeName} | Profesyonel Kurumsal Hizmet ve Çözüm Merkezi`,
      meta_description: `${storeName} kurumsal web sitesi; hizmetlerimiz, referanslarımız, kurumsal bilgilerimiz ve 7/24 iletişim kanallarımız.`,
      meta_keywords: "kurumsal web sitesi, profesyonel hizmet, güvenilir hizmet, iletişim, danışmanlık",
      google_analytics_id: store?.branding?.meta_settings?.ga_measurement_id || "",
      google_tag_manager_id: store?.branding?.meta_settings?.gtm_id || "",
      google_search_console_code: store?.branding?.meta_settings?.gsc_id || "",
      meta_pixel_id: store?.branding?.meta_settings?.pixel_id || "",
    },
    floating_actions: {
      show_whatsapp: true,
      show_call_button: true,
      whatsapp_welcome_text: `Merhaba ${storeName}, web siteniz üzerinden ulaşıyorum. Hizmetleriniz hakkında bilgi almak istiyorum.`,
    },
  };
};

const THEME_PALETTES = {
  emerald_gold: {
    name: "Zümrüt & Altın (Güven ve Doğallık)",
    primaryBg: "bg-emerald-700 hover:bg-emerald-800",
    primaryText: "text-emerald-700 dark:text-emerald-400",
    primaryBorder: "border-emerald-600/30",
    accentBg: "bg-amber-500 hover:bg-amber-600 text-slate-950",
    accentText: "text-amber-500",
    badgeBg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    gradientHero: "from-slate-950/45 via-slate-950/15 to-transparent",
    gradientAccent: "from-emerald-600 to-teal-700",
    ringColor: "focus:ring-emerald-500",
  },
  royal_cobalt: {
    name: "Kraliyet Mavisi (Kurumsal & Prestij)",
    primaryBg: "bg-blue-700 hover:bg-blue-800",
    primaryText: "text-blue-700 dark:text-blue-400",
    primaryBorder: "border-blue-600/30",
    accentBg: "bg-sky-500 hover:bg-sky-600 text-white",
    accentText: "text-sky-400",
    badgeBg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
    gradientHero: "from-slate-950/45 via-blue-950/15 to-transparent",
    gradientAccent: "from-blue-600 to-indigo-700",
    ringColor: "focus:ring-blue-500",
  },
  obsidian_luxury: {
    name: "Obsidyen & Champagne Gold (VIP Kurumsal)",
    primaryBg: "bg-amber-600 hover:bg-amber-700",
    primaryText: "text-amber-600 dark:text-amber-400",
    primaryBorder: "border-amber-500/30",
    accentBg: "bg-amber-500 hover:bg-amber-400 text-slate-950",
    accentText: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
    gradientHero: "from-neutral-950/45 via-stone-950/15 to-transparent",
    gradientAccent: "from-amber-600 to-yellow-600",
    ringColor: "focus:ring-amber-500",
  },
  terracotta_warm: {
    name: "Anadolu Toprak & Bakır (Sıcak & Samimi)",
    primaryBg: "bg-orange-700 hover:bg-orange-800",
    primaryText: "text-orange-700 dark:text-orange-400",
    primaryBorder: "border-orange-600/30",
    accentBg: "bg-amber-500 hover:bg-amber-600 text-slate-950",
    accentText: "text-amber-400",
    badgeBg: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/25",
    gradientHero: "from-stone-950/45 via-orange-950/15 to-transparent",
    gradientAccent: "from-orange-600 to-amber-700",
    ringColor: "focus:ring-orange-500",
  },
  crimson_trust: {
    name: "Bordo & Antrasit (Güçlü & Resmi)",
    primaryBg: "bg-rose-700 hover:bg-rose-800",
    primaryText: "text-rose-700 dark:text-rose-400",
    primaryBorder: "border-rose-600/30",
    accentBg: "bg-rose-600 hover:bg-rose-700 text-white",
    accentText: "text-rose-400",
    badgeBg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
    gradientHero: "from-slate-950/45 via-rose-950/15 to-transparent",
    gradientAccent: "from-rose-600 to-red-700",
    ringColor: "focus:ring-rose-500",
  },
};

interface ModernCorporateWebsiteLayoutProps {
  store: StoreInfo | any;
  lang?: string;
}

export const ModernCorporateWebsiteLayout: React.FC<ModernCorporateWebsiteLayoutProps> = ({
  store,
  lang = "tr",
}) => {
  // Merge saved corporate_config with defaults safely
  const config: CorporateWebsiteConfig = useMemo(() => {
    const defaults = getDefaultCorporateConfig(store);
    const rawCorp = store?.corporate_config || store?.branding?.corporate_config || {};
    const parsedCorp = typeof rawCorp === "string" ? (() => { try { return JSON.parse(rawCorp); } catch { return {}; } })() : rawCorp;

    const heroImagesList =
      Array.isArray(parsedCorp?.hero?.hero_images) && parsedCorp.hero.hero_images.filter(Boolean).length > 0
        ? parsedCorp.hero.hero_images.filter(Boolean)
        : Array.isArray(parsedCorp?.hero?.background_images) && parsedCorp.hero.background_images.filter(Boolean).length > 0
        ? parsedCorp.hero.background_images.filter(Boolean)
        : defaults.hero?.hero_images || [];

    const heroStatsList =
      Array.isArray(parsedCorp?.hero?.stats) && parsedCorp.hero.stats.length > 0
        ? parsedCorp.hero.stats
        : defaults.hero?.stats || [];

    const servicesList =
      Array.isArray(parsedCorp?.services) && parsedCorp.services.length > 0
        ? parsedCorp.services
        : Array.isArray(parsedCorp?.services_section?.items) && parsedCorp.services_section.items.length > 0
        ? parsedCorp.services_section.items
        : defaults.services_section?.items || [];

    const galleryImagesList =
      Array.isArray(parsedCorp?.gallery) && parsedCorp.gallery.length > 0
        ? parsedCorp.gallery
        : Array.isArray(parsedCorp?.gallery_section?.images) && parsedCorp.gallery_section.images.length > 0
        ? parsedCorp.gallery_section.images
        : defaults.gallery_section?.images || [];

    const aboutHighlightsList =
      Array.isArray(parsedCorp?.about?.highlights) && parsedCorp.about.highlights.length > 0
        ? parsedCorp.about.highlights
        : Array.isArray(parsedCorp?.about_section?.highlights) && parsedCorp.about_section.highlights.length > 0
        ? parsedCorp.about_section.highlights
        : defaults.about_section?.highlights || [];

    const resolvedHeroBadge =
      parsedCorp?.hero?.badge !== undefined
        ? parsedCorp.hero.badge
        : parsedCorp?.hero?.badge_text !== undefined
        ? parsedCorp.hero.badge_text
        : defaults.hero?.badge;

    return {
      ...defaults,
      ...parsedCorp,
      header_tagline:
        parsedCorp?.header_tagline !== undefined
          ? parsedCorp.header_tagline
          : store?.branding?.tagline !== undefined
          ? store.branding.tagline
          : defaults.header_tagline,
      typography: {
        ...defaults.typography,
        ...(parsedCorp?.typography || {}),
      },
      custom_colors: {
        ...defaults.custom_colors,
        ...(parsedCorp?.custom_colors || {}),
      },
      nav_labels: { ...defaults.nav_labels, ...(parsedCorp?.nav_labels || {}) },
      hero: {
        ...defaults.hero,
        ...(parsedCorp?.hero || {}),
        badge: resolvedHeroBadge,
        badge_text: resolvedHeroBadge,
        overlay_opacity:
          parsedCorp?.hero?.overlay_opacity !== undefined
            ? Number(parsedCorp.hero.overlay_opacity)
            : defaults.hero?.overlay_opacity ?? 15,
        title: parsedCorp?.hero?.title !== undefined ? parsedCorp.hero.title : defaults.hero?.title,
        highlight_word: parsedCorp?.hero?.highlight_word !== undefined ? parsedCorp.hero.highlight_word : defaults.hero?.highlight_word,
        subtitle: parsedCorp?.hero?.subtitle !== undefined ? parsedCorp.hero.subtitle : defaults.hero?.subtitle,
        primary_cta_text: parsedCorp?.hero?.primary_cta_text || defaults.hero?.primary_cta_text,
        secondary_cta_text: parsedCorp?.hero?.secondary_cta_text || defaults.hero?.secondary_cta_text,
        hero_images: heroImagesList,
        background_images: heroImagesList,
        stats: heroStatsList,
      },
      services_section: {
        ...defaults.services_section,
        ...(parsedCorp?.services_section || {}),
        badge: parsedCorp?.services_section?.badge || defaults.services_section?.badge,
        title: parsedCorp?.services_section?.title || defaults.services_section?.title,
        subtitle: parsedCorp?.services_section?.subtitle || defaults.services_section?.subtitle,
        items: servicesList,
      },
      about_section: {
        ...defaults.about_section,
        ...(parsedCorp?.about_section || {}),
        badge: parsedCorp?.about?.badge || parsedCorp?.about_section?.badge || defaults.about_section?.badge,
        title: parsedCorp?.about?.title || parsedCorp?.about_section?.title || defaults.about_section?.title,
        subtitle: parsedCorp?.about?.subtitle || parsedCorp?.about_section?.subtitle || defaults.about_section?.subtitle,
        content:
          parsedCorp?.about?.content ||
          parsedCorp?.about_section?.content ||
          store?.about_text ||
          store?.branding?.about_text ||
          defaults.about_section?.content,
        mission_text:
          parsedCorp?.about?.mission ||
          parsedCorp?.about_section?.mission_text ||
          defaults.about_section?.mission_text,
        vision_text:
          parsedCorp?.about?.vision ||
          parsedCorp?.about_section?.vision_text ||
          defaults.about_section?.vision_text,
        image_url:
          parsedCorp?.about?.image_url ||
          parsedCorp?.about_section?.image_url ||
          defaults.about_section?.image_url,
        secondary_image_url:
          parsedCorp?.about?.secondary_image_url ||
          parsedCorp?.about_section?.secondary_image_url ||
          defaults.about_section?.secondary_image_url,
        experience_badge_value:
          parsedCorp?.about?.experience_years ||
          parsedCorp?.about_section?.experience_badge_value ||
          defaults.about_section?.experience_badge_value,
        experience_badge_label:
          parsedCorp?.about?.experience_text ||
          parsedCorp?.about_section?.experience_badge_label ||
          defaults.about_section?.experience_badge_label,
        highlights: aboutHighlightsList,
      },
      custom_pages: Array.isArray(parsedCorp?.custom_pages) ? parsedCorp.custom_pages : defaults.custom_pages || [],
      gallery_section: {
        ...defaults.gallery_section,
        ...(parsedCorp?.gallery_section || {}),
        enabled: parsedCorp?.gallery_section?.enabled !== undefined ? parsedCorp.gallery_section.enabled : true,
        title: parsedCorp?.gallery_section?.title || defaults.gallery_section?.title,
        subtitle: parsedCorp?.gallery_section?.subtitle || defaults.gallery_section?.subtitle,
        images: galleryImagesList,
      },
      contact_section: {
        ...defaults.contact_section,
        ...(parsedCorp?.contact_section || {}),
        working_hours:
          parsedCorp?.contact?.working_hours ||
          parsedCorp?.contact_section?.working_hours ||
          store?.working_hours_text ||
          store?.branding?.working_hours_text ||
          defaults.contact_section?.working_hours,
        map_embed_url:
          parsedCorp?.contact?.map_embed_url ||
          parsedCorp?.contact_section?.map_embed_url ||
          defaults.contact_section?.map_embed_url,
        latitude:
          parsedCorp?.contact?.latitude ||
          parsedCorp?.contact_section?.latitude ||
          store?.latitude ||
          store?.branding?.latitude ||
          defaults.contact_section?.latitude,
        longitude:
          parsedCorp?.contact?.longitude ||
          parsedCorp?.contact_section?.longitude ||
          store?.longitude ||
          store?.branding?.longitude ||
          defaults.contact_section?.longitude,
      },
      floating_actions: {
        ...defaults.floating_actions,
        ...(parsedCorp?.floating_actions || {}),
      },
      theme_preset: parsedCorp?.theme_palette || parsedCorp?.theme_preset || defaults.theme_preset || "emerald_gold",
      theme_palette: parsedCorp?.theme_palette || parsedCorp?.theme_preset || defaults.theme_palette || "emerald_gold",
      announcement_enabled:
        parsedCorp?.announcement?.enabled !== undefined
          ? parsedCorp.announcement.enabled
          : (parsedCorp?.announcement_enabled !== undefined ? parsedCorp.announcement_enabled : defaults.announcement_enabled),
      announcement_text:
        parsedCorp?.announcement?.text ||
        parsedCorp?.announcement_text ||
        defaults.announcement_text,
      seo_marketing: {
        ...defaults.seo_marketing,
        ...(parsedCorp?.seo_marketing || {}),
      },
    };
  }, [store]);

  const palette = THEME_PALETTES[config.theme_preset || (config as any).theme_palette || "emerald_gold"] || THEME_PALETTES.emerald_gold;

  // Typography & Custom Color Dynamic Helpers
  const fontFamilyStyle = useMemo(() => {
    const f = config.typography?.font_family || "inter";
    switch (f) {
      case "poppins":
        return "'Poppins', sans-serif";
      case "montserrat":
        return "'Montserrat', sans-serif";
      case "playfair":
        return "'Playfair Display', serif";
      case "jakarta":
        return "'Plus Jakarta Sans', sans-serif";
      default:
        return "'Inter', system-ui, sans-serif";
    }
  }, [config.typography?.font_family]);

  const headingWeightClass = useMemo(() => {
    const w = config.typography?.heading_weight || "bold";
    switch (w) {
      case "normal":
        return "font-normal";
      case "medium":
        return "font-medium";
      case "semibold":
        return "font-semibold";
      case "bold":
        return "font-bold";
      case "black":
        return "font-black";
      default:
        return "font-bold";
    }
  }, [config.typography?.heading_weight]);

  const bodyWeightClass = useMemo(() => {
    const w = config.typography?.body_weight || "normal";
    switch (w) {
      case "light":
        return "font-light";
      case "medium":
        return "font-medium";
      default:
        return "font-normal";
    }
  }, [config.typography?.body_weight]);

  const heroTitleSizeClass = useMemo(() => {
    const s = config.typography?.hero_title_size || "lg";
    switch (s) {
      case "sm":
        return "text-lg sm:text-3xl lg:text-4xl";
      case "md":
        return "text-xl sm:text-4xl lg:text-5xl";
      case "xl":
        return "text-2xl sm:text-5xl lg:text-7xl";
      default:
        return "text-xl sm:text-4xl md:text-5xl lg:text-6xl";
    }
  }, [config.typography?.hero_title_size]);

  const customColors = config.custom_colors;
  const hasCustomColors = Boolean(customColors?.enabled);

  // Color Mode (Light/Dark)
  const [colorMode, setColorMode] = useState<"light" | "dark">(() => {
    return config.default_color_mode || "light";
  });

  useEffect(() => {
    if (config.default_color_mode) {
      setColorMode(config.default_color_mode);
    }
  }, [config.default_color_mode]);

  const isDark = colorMode === "dark";

  // Display store name (Rule 1: Never show raw lookprice slug)
  const displayStoreName = useMemo(() => {
    const rawStoreName = (store?.branding?.store_name || store?.store_name || "").trim();
    const rawName = (store?.name || store?.branding?.name || "").trim();
    if (rawStoreName && !/^lookprice$/i.test(rawStoreName)) return rawStoreName;
    if (rawName && !/^lookprice$/i.test(rawName)) return rawName;
    return "Seçkin Kurumsal Hizmetler";
  }, [store]);

  const logoUrl = store?.logo_url || store?.branding?.logo_url || store?.branding?.logo || "";
  const faviconUrl = store?.favicon_url || store?.branding?.favicon_url || logoUrl;

  // Contact numbers & WhatsApp (Includes both Primary and Secondary / Backup phones)
  const primaryPhone = useMemo(() => {
    const corpPrimary = (config as any).contact?.phone_primary;
    if (corpPrimary && String(corpPrimary).trim()) return String(corpPrimary).trim();
    const phones = store?.phones || store?.branding?.phones;
    if (Array.isArray(phones) && phones.filter(Boolean).length > 0) return phones.filter(Boolean)[0];
    return store?.phone || store?.branding?.phone || "";
  }, [store, config]);

  const secondaryPhone = useMemo(() => {
    const corpSecondary = (config as any).contact?.phone_secondary;
    if (corpSecondary && String(corpSecondary).trim()) return String(corpSecondary).trim();
    const phones = store?.phones || store?.branding?.phones;
    if (Array.isArray(phones) && phones.filter(Boolean).length > 1) return phones.filter(Boolean)[1];
    return "";
  }, [store, config]);

  const allPhones: string[] = useMemo(() => {
    const list: string[] = [];
    if (primaryPhone) list.push(primaryPhone);
    if (secondaryPhone && !list.includes(secondaryPhone)) list.push(secondaryPhone);
    const phones = store?.phones || store?.branding?.phones;
    if (Array.isArray(phones)) {
      phones.filter(Boolean).forEach((p: string) => {
        const trimmed = String(p).trim();
        if (trimmed && !list.includes(trimmed)) list.push(trimmed);
      });
    }
    return list;
  }, [store, primaryPhone, secondaryPhone]);

  const whatsappNumber = useMemo(() => {
    const raw =
      (config as any).contact?.whatsapp ||
      store?.whatsapp_number ||
      store?.branding?.whatsapp_number ||
      primaryPhone ||
      "";
    return String(raw).replace(/[^0-9]/g, "");
  }, [store, config, primaryPhone]);

  const primaryEmail = useMemo(() => {
    const corpEmail = (config as any).contact?.email;
    if (corpEmail && String(corpEmail).trim()) return String(corpEmail).trim();
    const emails = store?.emails || store?.branding?.emails;
    if (Array.isArray(emails) && emails.filter(Boolean).length > 0) return emails.filter(Boolean)[0];
    return store?.email || store?.branding?.email || "";
  }, [store, config]);

  const storeAddress = useMemo(() => {
    return (config as any).contact?.address || store?.address || store?.branding?.address || "";
  }, [store, config]);

  const getWhatsAppUrl = (customMsg?: string) => {
    const msg =
      customMsg ||
      config.floating_actions?.whatsapp_welcome_text ||
      `Merhaba ${displayStoreName}, web siteniz üzerinden bilgi almak istiyorum.`;
    if (!whatsappNumber) return "#iletisim";
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  };

  // Hero Slider State
  const heroImages = config.hero?.hero_images || [];
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);

  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Active Navigation / Custom Page View State
  const [activeCustomPage, setActiveCustomPage] = useState<CorporateCustomPage | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedServiceModal, setSelectedServiceModal] = useState<CorporateServiceItem | null>(null);
  const [lightboxImage, setLightboxImage] = useState<CorporateGalleryImage | null>(null);
  const [galleryCategory, setGalleryCategory] = useState<string>("all");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);

  // Contact Form State
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadSubject, setLeadSubject] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const handleLeadFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedMsg = `*Yeni Web Sitesi İletişim Formu*\n*İsim:* ${leadName}\n*Telefon:* ${leadPhone}\n*Konu / Hizmet:* ${leadSubject || "Genel Bilgi"}\n*Mesaj:* ${leadMessage}`;
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(formattedMsg)}`, "_blank");
    }
    setLeadSubmitted(true);
    setTimeout(() => setLeadSubmitted(false), 5000);
  };

  // Scroll helper
  const scrollToSection = (sectionId: string) => {
    setActiveCustomPage(null);
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 60);
  };

  // FAQ & Blog items from store
  const faqList: Array<{ q?: string; question?: string; a?: string; answer?: string }> = useMemo(() => {
    const raw = store?.faq || store?.branding?.faq;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return [
      {
        question: "Hizmetlerinizden nasıl yararlanabilirim ve randevu alabilir miyim?",
        answer:
          "Web sitemiz üzerindeki telefon numaralarımızdan veya WhatsApp hattımızdan 7/24 bizimle iletişime geçerek anında detaylı bilgi ve randevu alabilirsiniz.",
      },
      {
        question: "Tesisinizi yerinde ziyaret edebilir miyiz?",
        answer:
          "Elbette. Haftanın 7 günü çalışma saatlerimiz içerisinde tesisimizi ziyaret edebilir, süreçlerimizi yerinde inceleyebilirsiniz. İletişim bölümümüzdeki Google Harita konumundan tek tıkla yol tarifi alabilirsiniz.",
      },
      {
        question: "Şehir dışından veya yurt dışından hizmet talep edebilir miyiz?",
        answer:
          "Evet, şehir dışında veya yurt dışında bulunan misafirlerimiz için görüntülü görüşme ve video kaydı ile tam şeffaf şekilde hizmet veriyor, tüm süreci adım adım paylaşıyoruz.",
      },
    ];
  }, [store]);

  const blogPosts: BlogPost[] = useMemo(() => {
    const raw = store?.blog_posts || store?.branding?.blog_posts;
    return Array.isArray(raw) ? raw : [];
  }, [store]);

  // Gallery categories
  const galleryCategories = useMemo(() => {
    const cats = new Set<string>();
    (config.gallery_section?.images || []).forEach((img) => {
      if (img.category) cats.add(img.category);
    });
    return Array.from(cats);
  }, [config.gallery_section?.images]);

  const filteredGalleryImages = useMemo(() => {
    const imgs = config.gallery_section?.images || [];
    if (galleryCategory === "all") return imgs;
    return imgs.filter((i) => i.category === galleryCategory);
  }, [config.gallery_section?.images, galleryCategory]);

  // Google Maps Embed URL resolution
  const resolvedMapEmbedUrl = useMemo(() => {
    const customUrl = (config.contact_section?.map_embed_url || "").trim();
    if (customUrl) {
      // If user pasted full <iframe src="...">, extract src
      const srcMatch = customUrl.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) return srcMatch[1];
      if (customUrl.startsWith("http")) return customUrl;
    }
    const lat = config.contact_section?.latitude || store?.latitude || store?.branding?.latitude;
    const lng = config.contact_section?.longitude || store?.longitude || store?.branding?.longitude;
    if (lat && lng) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    if (storeAddress) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(storeAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(displayStoreName + " Türkiye")}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
  }, [config.contact_section, store, storeAddress, displayStoreName]);

  const directionsUrl = useMemo(() => {
    const lat = config.contact_section?.latitude || store?.latitude || store?.branding?.latitude;
    const lng = config.contact_section?.longitude || store?.longitude || store?.branding?.longitude;
    if (lat && lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    }
    if (storeAddress) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeAddress)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayStoreName)}`;
  }, [config.contact_section, store, storeAddress, displayStoreName]);

  // Marketing & Analytics IDs (Meta Pixel, GA4, GTM, Search Console)
  const metaSettings = useMemo(() => {
    const ms = store?.meta_settings || store?.branding?.meta_settings;
    if (typeof ms === "string") {
      try { return JSON.parse(ms); } catch { return {}; }
    }
    return ms || {};
  }, [store]);

  const gaMeasurementId = (config as any).seo_marketing?.google_analytics_id || metaSettings?.ga_measurement_id || "";
  const gtmId = (config as any).seo_marketing?.google_tag_manager_id || metaSettings?.gtm_id || "";
  const gscId = (config as any).seo_marketing?.google_search_console_code || metaSettings?.gsc_id || "";
  const metaPixelId = (config as any).seo_marketing?.meta_pixel_id || metaSettings?.pixel_id || "";

  const seoTitle = (config as any).seo_marketing?.meta_title
    ? (config as any).seo_marketing.meta_title
    : (activeCustomPage
      ? `${activeCustomPage.title} | ${displayStoreName}`
      : `${displayStoreName} | ${config.hero?.title || "Kurumsal Tanıtım ve Hizmet Web Sitesi"}`);

  const seoDescription = (config as any).seo_marketing?.meta_description
    ? (config as any).seo_marketing.meta_description
    : (activeCustomPage
      ? activeCustomPage.subtitle || activeCustomPage.content?.slice(0, 160)
      : config.hero?.subtitle || `${displayStoreName} resmi web sitesi. Hizmetlerimiz, hakkımızda ve iletişim bilgilerimiz.`);

  const renderHighlightedTitle = (title: string = "", highlight?: string) => {
    if (!highlight || !title.includes(highlight)) return title;
    const parts = title.split(highlight);
    const underlinePref = config.typography?.highlight_underline || "wavy";
    const underlineClass =
      underlinePref === "none"
        ? ""
        : underlinePref === "solid"
        ? "underline decoration-amber-400/70 decoration-2 underline-offset-8"
        : "underline decoration-amber-400/50 decoration-wavy underline-offset-8";
    const customHighlightColor = hasCustomColors && customColors?.hero_highlight_color
      ? customColors.hero_highlight_color
      : undefined;

    return (
      <>
        {parts[0]}
        <span
          className={`text-amber-400 ${underlineClass}`}
          style={customHighlightColor ? { color: customHighlightColor, textDecorationColor: customHighlightColor } : undefined}
        >
          {highlight}
        </span>
        {parts.slice(1).join(highlight)}
      </>
    );
  };

  return (
    <div
      style={{ fontFamily: fontFamilyStyle }}
      className={`min-h-screen transition-colors duration-300 selection:bg-emerald-600 selection:text-white ${bodyWeightClass} ${
        isDark ? "bg-slate-950 text-slate-100" : "bg-stone-50 text-slate-900"
      }`}
    >
      {/* SEO, Meta Pixel & Google Analytics / GTM / Search Console Helmet */}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
        />
        {heroImages[0] && <meta property="og:image" content={heroImages[0]} />}
        {faviconUrl && <link rel="icon" href={faviconUrl} />}
        {gscId && <meta name="google-site-verification" content={gscId} />}

        {/* Schema.org LocalBusiness / Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: displayStoreName,
            description: seoDescription,
            telephone: primaryPhone,
            email: primaryEmail || undefined,
            image: heroImages[0] || logoUrl || undefined,
            address: storeAddress
              ? {
                  "@type": "PostalAddress",
                  streetAddress: storeAddress,
                }
              : undefined,
          })}
        </script>

        {/* Google Analytics 4 (gtag.js) */}
        {gaMeasurementId && (
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
        )}
        {gaMeasurementId && (
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}');
            `}
          </script>
        )}

        {/* Google Tag Manager */}
        {gtmId && (
          <script>
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </script>
        )}

        {/* Meta Pixel */}
        {metaPixelId && (
          <script>
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </script>
        )}
      </Helmet>

      {/* Top Announcement & Quick Contact Ribbon */}
      {config.announcement_enabled !== false && (
        <div className="bg-slate-950 text-slate-200 border-b border-white/10 text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-semibold tracking-tight text-[11px] sm:text-xs text-slate-200">
                {config.announcement_text || `${displayStoreName} — Kurumsal Tanıtım & Hizmet Web Sitesi`}
              </span>
            </div>
            <div className="flex items-center gap-4 shrink-0 text-[11px] font-bold">
              {primaryPhone && (
                <a
                  href={`tel:${primaryPhone}`}
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{primaryPhone}</span>
                </a>
              )}
              {whatsappNumber && (
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Destek</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Glassmorphic Corporate Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-2xl border-b transition-all duration-200 ${
          isDark
            ? "bg-slate-950/85 border-slate-800/80 text-white"
            : "bg-white/90 border-slate-200/80 text-slate-900 shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <button
            type="button"
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-3.5 text-left group cursor-pointer focus:outline-none"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={displayStoreName}
                className="h-12 md:h-14 w-auto object-contain rounded-xl transition-transform group-hover:scale-105"
              />
            ) : (
              <div
                className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${palette.gradientAccent} text-white flex items-center justify-center font-black text-lg shadow-md`}
              >
                {displayStoreName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <span className={`block text-base sm:text-lg ${headingWeightClass} tracking-tight leading-none`}>
                {displayStoreName}
              </span>
              {config.header_tagline !== "" && (
                <span
                  className={`block text-[10px] font-semibold uppercase tracking-widest mt-1 ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {config.header_tagline ?? "Kurumsal Hizmet & Tanıtım"}
                </span>
              )}
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            <button
              type="button"
              onClick={() => scrollToSection("hero")}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                !activeCustomPage
                  ? isDark
                    ? "text-white bg-white/10"
                    : "text-slate-900 bg-slate-100"
                  : isDark
                  ? "text-slate-300 hover:text-white hover:bg-white/5"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              {config.nav_labels?.home || "Ana Sayfa"}
            </button>

            {config.services_section?.enabled !== false && (
              <button
                type="button"
                onClick={() => scrollToSection("hizmetlerimiz")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/5"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {config.nav_labels?.services || "Hizmetlerimiz"}
              </button>
            )}

            {config.about_section?.enabled !== false && (
              <button
                type="button"
                onClick={() => scrollToSection("hakkimizda")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/5"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {config.nav_labels?.about || "Hakkımızda"}
              </button>
            )}

            {/* Dynamic Custom Pages in Navbar */}
            {(config.custom_pages || [])
              .filter((p) => p.show_in_nav !== false && p.title)
              .map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setActiveCustomPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    activeCustomPage?.id === page.id
                      ? `${palette.primaryBg} text-white shadow-sm`
                      : isDark
                      ? "text-slate-300 hover:text-white hover:bg-white/5"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {page.title}
                </button>
              ))}

            {config.gallery_section?.enabled !== false &&
              (config.gallery_section?.images || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => scrollToSection("galeri")}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    isDark
                      ? "text-slate-300 hover:text-white hover:bg-white/5"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  {config.nav_labels?.gallery || "Galeri"}
                </button>
              )}

            {faqList.length > 0 && (
              <button
                type="button"
                onClick={() => scrollToSection("sss")}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                  isDark
                    ? "text-slate-300 hover:text-white hover:bg-white/5"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {config.nav_labels?.faq || "S.S.S."}
              </button>
            )}

            <button
              type="button"
              onClick={() => scrollToSection("iletisim")}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-white/5"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              {config.nav_labels?.contact || "İletişim"}
            </button>
          </nav>

          {/* Right CTA & Theme Switcher */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setColorMode(isDark ? "light" : "dark")}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
              title={isDark ? "Açık Tema" : "Koyu Tema"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {whatsappNumber ? (
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{config.nav_labels?.cta_button || "WhatsApp İletişim"}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => scrollToSection("iletisim")}
                className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white shadow-md transition-all hover:scale-[1.02] cursor-pointer ${palette.primaryBg}`}
              >
                <Phone className="w-4 h-4" />
                <span>{config.nav_labels?.cta_button || "Bize Ulaşın"}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2.5 rounded-xl border ${
                isDark ? "border-slate-800 bg-slate-900 text-white" : "border-slate-200 bg-slate-100 text-slate-900"
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`lg:hidden overflow-hidden border-t ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              <div className="px-4 py-4 space-y-1.5">
                <button
                  type="button"
                  onClick={() => scrollToSection("hero")}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/10 block"
                >
                  {config.nav_labels?.home || "Ana Sayfa"}
                </button>
                {config.services_section?.enabled !== false && (
                  <button
                    type="button"
                    onClick={() => scrollToSection("hizmetlerimiz")}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/10 block"
                  >
                    {config.nav_labels?.services || "Hizmetlerimiz"}
                  </button>
                )}
                {config.about_section?.enabled !== false && (
                  <button
                    type="button"
                    onClick={() => scrollToSection("hakkimizda")}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/10 block"
                  >
                    {config.nav_labels?.about || "Hakkımızda"}
                  </button>
                )}
                {(config.custom_pages || []).map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => {
                      setActiveCustomPage(page);
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/10 block"
                  >
                    {page.title}
                  </button>
                ))}
                {config.gallery_section?.enabled !== false && (
                  <button
                    type="button"
                    onClick={() => scrollToSection("galeri")}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/10 block"
                  >
                    {config.nav_labels?.gallery || "Galeri"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => scrollToSection("iletisim")}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/10 block"
                >
                  {config.nav_labels?.contact || "İletişim"}
                </button>

                <div className="pt-3 grid grid-cols-2 gap-2 border-t border-slate-200 dark:border-slate-800">
                  {primaryPhone && (
                    <a
                      href={`tel:${primaryPhone}`}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-black"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Hemen Ara</span>
                    </a>
                  )}
                  {whatsappNumber && (
                    <a
                      href={getWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-black"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* IF A CUSTOM PAGE IS SELECTED, RENDER DEDICATED CUSTOM PAGE VIEW */}
      {activeCustomPage ? (
        <main className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <button
              type="button"
              onClick={() => setActiveCustomPage(null)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                isDark
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </button>

            <div
              className={`rounded-3xl overflow-hidden border shadow-xl ${
                isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
              }`}
            >
              {activeCustomPage.image_url && (
                <div className="relative h-56 sm:h-80 md:h-96 w-full overflow-hidden">
                  <img
                    src={activeCustomPage.image_url}
                    alt={activeCustomPage.title}
                    className="w-full h-full object-cover object-center brightness-105 contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
                    {activeCustomPage.badge && (
                      <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest bg-amber-500 text-slate-950 mb-2 sm:mb-3">
                        {activeCustomPage.badge}
                      </span>
                    )}
                    <h1 className="text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-snug">
                      {activeCustomPage.title}
                    </h1>
                    {activeCustomPage.subtitle && (
                      <p className="text-xs sm:text-base text-slate-200 mt-1 sm:mt-2 max-w-3xl line-clamp-2 sm:line-clamp-none">
                        {activeCustomPage.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="p-6 sm:p-10 space-y-6">
                {!activeCustomPage.image_url && (
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
                    {activeCustomPage.badge && (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border mb-3 ${palette.badgeBg}`}>
                        {activeCustomPage.badge}
                      </span>
                    )}
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                      {activeCustomPage.title}
                    </h1>
                    {activeCustomPage.subtitle && (
                      <p className="text-base text-slate-500 dark:text-slate-400 mt-2">
                        {activeCustomPage.subtitle}
                      </p>
                    )}
                  </div>
                )}

                <div className="prose dark:prose-invert max-w-none space-y-4 text-sm sm:text-base leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {activeCustomPage.content}
                </div>

                {Array.isArray(activeCustomPage.bullet_points) &&
                  activeCustomPage.bullet_points.filter(Boolean).length > 0 && (
                    <div
                      className={`p-6 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-3.5 ${
                        isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200/80"
                      }`}
                    >
                      {activeCustomPage.bullet_points.filter(Boolean).map((pt, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-sm font-semibold">{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Direct Contact Bar inside Custom Page */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-black">Bu konu hakkında detaylı bilgi almak ister misiniz?</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Uzman ekibimiz sorularınızı yanıtlamak için hazır.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {primaryPhone && (
                      <a
                        href={`tel:${primaryPhone}`}
                        className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black text-white shadow-md ${palette.primaryBg}`}
                      >
                        <Phone className="w-4 h-4" />
                        <span>Hemen Ara: {primaryPhone}</span>
                      </a>
                    )}
                    {whatsappNumber && (
                      <a
                        href={getWhatsAppUrl(`Merhaba, "${activeCustomPage.title}" sayfası hakkında bilgi almak istiyorum.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp ile Sorun</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      ) : (
        /* MAIN LANDING PAGE VIEW */
        <main>
          {/* 1. KINETIC HERO SECTION */}
          <section id="hero" className="relative min-h-[420px] sm:min-h-[600px] lg:min-h-[82vh] flex items-center overflow-hidden">
            {/* Animated Background Image Slider - High Brightness & Clarity on Mobile & Desktop */}
            <div className="absolute inset-0 z-0">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentHeroIdx}
                  src={
                    heroImages[currentHeroIdx] ||
                    "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1800&q=85"
                  }
                  alt={displayStoreName}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="w-full h-full object-cover object-center brightness-105 contrast-105"
                />
              </AnimatePresence>
              {/* Configurable light contrast veil so banner photo remains bright & crystal clear */}
              <div
                className="absolute inset-0 bg-slate-950 pointer-events-none transition-opacity duration-300"
                style={{ opacity: Math.min(Math.max(Number(config.hero?.overlay_opacity ?? 15), 0), 85) / 100 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent sm:bg-gradient-to-r sm:from-slate-950/55 sm:via-slate-950/20 sm:to-transparent pointer-events-none" />
              <div className="hidden sm:block absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/70 to-transparent pointer-events-none" />
            </div>

            {/* Hero Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-28 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-10 lg:gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                  className="lg:col-span-8 space-y-3 sm:space-y-6 text-white pt-10 sm:pt-0"
                >
                  {Boolean(config.hero?.badge_text && config.hero.badge_text.trim() !== "") && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 }}
                      className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-slate-950/55 backdrop-blur-md border border-white/25 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg"
                      style={
                        hasCustomColors && customColors?.accent_color
                          ? { color: customColors.accent_color, borderColor: `${customColors.accent_color}66` }
                          : undefined
                      }
                    >
                      <Sparkles
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0"
                        style={hasCustomColors && customColors?.accent_color ? { color: customColors.accent_color } : undefined}
                      />
                      <span>{config.hero.badge_text}</span>
                    </motion.div>
                  )}

                  <h1
                    className={`${heroTitleSizeClass} ${headingWeightClass} tracking-tight leading-[1.15] sm:leading-[1.12] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.75)]`}
                    style={hasCustomColors && customColors?.hero_text_color ? { color: customColors.hero_text_color } : undefined}
                  >
                    {renderHighlightedTitle(
                      config.hero?.title || `${displayStoreName} — Kurumsal Hizmet Merkezi`,
                      config.hero?.highlight_word
                    )}
                  </h1>

                  <p className={`text-xs sm:text-lg lg:text-xl text-white/95 ${bodyWeightClass} leading-relaxed max-w-2xl line-clamp-3 sm:line-clamp-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]`}>
                    {config.hero?.subtitle}
                  </p>

                  {/* Hero CTA Buttons */}
                  <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-3.5">
                    <motion.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => scrollToSection("hizmetlerimiz")}
                      style={
                        hasCustomColors && customColors?.primary_color
                          ? { backgroundColor: customColors.primary_color, color: "#ffffff" }
                          : undefined
                      }
                      className={`px-4 py-2.5 sm:px-7 sm:py-4 rounded-xl sm:rounded-2xl ${headingWeightClass} text-xs sm:text-base shadow-xl flex items-center gap-1.5 sm:gap-2.5 cursor-pointer transition-all ${palette.accentBg}`}
                    >
                      <span>{config.hero?.primary_cta_text || "Hizmetlerimizi İnceleyin"}</span>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    {whatsappNumber && (
                      <motion.a
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        href={getWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 sm:px-7 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-xl shadow-emerald-600/25 flex items-center gap-1.5 sm:gap-2.5 transition-all"
                      >
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{config.hero?.secondary_cta_text || "WhatsApp İletişim"}</span>
                      </motion.a>
                    )}

                    {primaryPhone && (
                      <motion.a
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        href={`tel:${primaryPhone}`}
                        className="px-3.5 py-2.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-base bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/25 flex items-center gap-1.5 sm:gap-2.5 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                        <span>{primaryPhone}</span>
                      </motion.a>
                    )}
                  </div>
                </motion.div>

                {/* Right Floating Interactive Contact & Quick Info Card (Desktop lg+, compact on mobile so banner image stays visible) */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="lg:col-span-4"
                >
                  <div className="bg-slate-900/75 sm:bg-slate-900/80 backdrop-blur-xl border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-2xl space-y-3 sm:space-y-5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5 sm:pb-4">
                      <div>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                          HIZLI ERİŞİM & RANDEVU
                        </span>
                        <h3 className="text-sm sm:text-lg font-black text-white mt-0.5">{displayStoreName}</h3>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-1 gap-2 sm:gap-3 text-[11px] sm:text-xs">
                      <div className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-400 block font-semibold">Çalışma Saatlerimiz</span>
                          <span className="text-white font-bold mt-0.5 block">
                            {config.contact_section?.working_hours || "Haftanın 7 Günü: 08:00 - 22:00"}
                          </span>
                        </div>
                      </div>

                      {storeAddress && (
                        <div className="hidden sm:flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 block font-semibold">Adres & Konum</span>
                            <span className="text-white font-bold mt-0.5 block line-clamp-2">
                              {storeAddress}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 pt-0.5 sm:pt-1">
                      {primaryPhone && (
                        <a
                          href={`tel:${primaryPhone}`}
                          className="w-full py-2.5 sm:py-3.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg transition-all"
                        >
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                          <span className="truncate">Hemen Ara</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => scrollToSection("iletisim")}
                        className="w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 border border-white/15 transition-all cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">Yol Tarifi Al</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Hero Slider Controls (if multiple images) */}
              {heroImages.length > 1 && (
                <div className="mt-5 sm:mt-10 flex items-center gap-2">
                  {heroImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentHeroIdx(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        currentHeroIdx === idx ? "w-8 sm:w-10 bg-amber-400" : "w-2 sm:w-2.5 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Slayt ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Quantitative Trust Metrics Bar */}
              {Array.isArray(config.hero?.stats) && config.hero.stats.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="mt-6 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5"
                >
                  {config.hero.stats.map((st, i) => (
                    <div
                      key={i}
                      className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-950/50 sm:bg-white/10 backdrop-blur-xl border border-white/15 text-white hover:bg-white/15 transition-all"
                    >
                      <div className="text-lg sm:text-3xl font-black text-amber-400 tracking-tight">
                        {st.value}
                      </div>
                      <div className="text-[11px] sm:text-sm font-extrabold text-white mt-0.5 sm:mt-1">{st.label}</div>
                      {st.sublabel && (
                        <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 line-clamp-1">{st.sublabel}</div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>

          {/* 2. HİZMETLERİMİZ (SERVICES SECTION) */}
          {config.services_section?.enabled !== false && (
            <section
              id="hizmetlerimiz"
              className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-8 ${
                isDark ? "bg-slate-950" : "bg-white"
              }`}
            >
              <div className="max-w-7xl mx-auto space-y-14">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto space-y-3">
                  {config.services_section?.badge && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${palette.badgeBg}`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{config.services_section.badge}</span>
                    </span>
                  )}
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                    {config.services_section?.title || "Hizmetlerimiz"}
                  </h2>
                  {config.services_section?.subtitle && (
                    <p
                      className={`text-sm sm:text-base leading-relaxed ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {config.services_section.subtitle}
                    </p>
                  )}
                </div>

                {/* Services Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                  {(config.services_section?.items || []).map((srv, idx) => (
                    <motion.div
                      key={srv.id || idx}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, delay: idx * 0.08 }}
                      whileHover={{ y: -6 }}
                      className={`group rounded-3xl overflow-hidden border transition-all duration-300 flex flex-col ${
                        isDark
                          ? "bg-slate-900/90 border-slate-800 hover:border-emerald-500/40 shadow-xl"
                          : "bg-stone-50/70 border-slate-200/90 hover:border-emerald-600/40 hover:shadow-2xl shadow-md"
                      }`}
                    >
                      {/* Service Cover Image */}
                      <div
                        onClick={() => setSelectedServiceModal(srv)}
                        className="relative h-60 w-full overflow-hidden bg-slate-900 cursor-pointer"
                      >
                        <img
                          src={
                            srv.image_url ||
                            "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1000&q=80"
                          }
                          alt={srv.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                        {srv.badge && (
                          <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 shadow-md">
                            {srv.badge}
                          </span>
                        )}
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="text-xl font-black tracking-tight leading-snug group-hover:text-amber-300 transition-colors">
                            {srv.title}
                          </h3>
                          {srv.subtitle && (
                            <p className="text-xs text-slate-200 font-semibold mt-0.5">{srv.subtitle}</p>
                          )}
                        </div>
                      </div>

                      {/* Service Body */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                        <div className="space-y-4">
                          <p
                            className={`text-sm leading-relaxed line-clamp-4 ${
                              isDark ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {srv.description}
                          </p>

                          {Array.isArray(srv.features) && srv.features.filter(Boolean).length > 0 && (
                            <ul className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                              {srv.features
                                .filter(Boolean)
                                .slice(0, 4)
                                .map((feat, fIdx) => (
                                  <li key={fIdx} className="flex items-start gap-2 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className={isDark ? "text-slate-200" : "text-slate-700"}>
                                      {feat}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>

                        {/* Service Action Buttons */}
                        <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5">
                          <a
                            href={getWhatsAppUrl(
                              srv.whatsapp_message ||
                                `Merhaba ${displayStoreName}, "${srv.title}" hizmetiniz hakkında bilgi almak istiyorum.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{srv.cta_text || "WhatsApp Bilgi Al"}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setSelectedServiceModal(srv)}
                            className={`px-3.5 py-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                              isDark
                                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                            title="Detayları Gör"
                          >
                            Detay
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 3. HAKKIMIZDA (ABOUT US & CORPORATE TRUST SECTION) */}
          {config.about_section?.enabled !== false && (
            <section
              id="hakkimizda"
              className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t ${
                isDark
                  ? "bg-slate-900/50 border-slate-800/80"
                  : "bg-stone-100/80 border-slate-200/70"
              }`}
            >
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  {/* Left Visual Composition */}
                  <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="lg:col-span-5 relative"
                  >
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 aspect-[4/5]">
                      <img
                        src={
                          config.about_section?.image_url ||
                          "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=85"
                        }
                        alt={config.about_section?.title || "Hakkımızda"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    </div>

                    {/* Floating Experience Badge */}
                    {config.about_section?.experience_badge_value && (
                      <motion.div
                        whileHover={{ scale: 1.04 }}
                        className={`absolute -bottom-6 -right-4 sm:right-6 p-5 sm:p-6 rounded-3xl text-white shadow-2xl bg-gradient-to-br ${palette.gradientAccent} border-2 border-white/20 max-w-[230px]`}
                      >
                        <div className="text-3xl sm:text-4xl font-black text-amber-300 leading-none">
                          {config.about_section.experience_badge_value}
                        </div>
                        <div className="text-xs sm:text-sm font-bold text-white mt-1.5 leading-snug">
                          {config.about_section.experience_badge_label || "Yıllık Güven & Tecrübe"}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Right Story, Mission, Vision & Highlights */}
                  <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="lg:col-span-7 space-y-6"
                  >
                    {config.about_section?.badge && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${palette.badgeBg}`}
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>{config.about_section.badge}</span>
                      </span>
                    )}

                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                      {config.about_section?.title || "Hakkımızda"}
                    </h2>

                    {config.about_section?.subtitle && (
                      <p className={`text-base sm:text-lg font-bold ${palette.primaryText}`}>
                        {config.about_section.subtitle}
                      </p>
                    )}

                    <div
                      className={`space-y-4 text-sm sm:text-base leading-relaxed whitespace-pre-line ${
                        isDark ? "text-slate-300" : "text-slate-600"
                      }`}
                    >
                      {config.about_section?.content}
                    </div>

                    {/* Mission & Vision Cards */}
                    {(config.about_section?.mission_text || config.about_section?.vision_text) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        {config.about_section?.mission_text && (
                          <div
                            className={`p-5 rounded-2xl border ${
                              isDark
                                ? "bg-slate-900 border-slate-800"
                                : "bg-white border-slate-200/90 shadow-xs"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <ShieldCheck className="w-5 h-5 text-emerald-500" />
                              <h4 className="text-sm font-black uppercase tracking-wider">
                                {config.about_section.mission_title || "Misyonumuz"}
                              </h4>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                              {config.about_section.mission_text}
                            </p>
                          </div>
                        )}
                        {config.about_section?.vision_text && (
                          <div
                            className={`p-5 rounded-2xl border ${
                              isDark
                                ? "bg-slate-900 border-slate-800"
                                : "bg-white border-slate-200/90 shadow-xs"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Compass className="w-5 h-5 text-amber-500" />
                              <h4 className="text-sm font-black uppercase tracking-wider">
                                {config.about_section.vision_title || "Vizyonumuz"}
                              </h4>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                              {config.about_section.vision_text}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Why Choose Us Highlights */}
                    {Array.isArray(config.about_section?.highlights) &&
                      config.about_section.highlights.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                          {config.about_section.highlights.map((hl, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-4 h-4 stroke-[3]" />
                              </div>
                              <div>
                                <h5 className="text-sm font-black">{hl.title}</h5>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  {hl.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </motion.div>
                </div>
              </div>
            </section>
          )}

          {/* 4. CUSTOM PAGES SHOWCASE (EK SAYFALAR & BİLGİ REHBERİ) */}
          {Array.isArray(config.custom_pages) && config.custom_pages.length > 0 && (
            <section
              className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/70"
              }`}
            >
              <div className="max-w-7xl mx-auto space-y-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${palette.badgeBg}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>KURUMSAL BİLGİ & REHBER SAYFALARI</span>
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-2">
                      Bilgi Merkezi & Özel Sayfalarımız
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {config.custom_pages.map((page) => (
                    <motion.div
                      key={page.id}
                      whileHover={{ y: -4 }}
                      onClick={() => {
                        setActiveCustomPage(page);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`rounded-3xl overflow-hidden border cursor-pointer transition-all flex flex-col justify-between ${
                        isDark
                          ? "bg-slate-900 border-slate-800 hover:border-amber-500/40"
                          : "bg-stone-50 border-slate-200 hover:shadow-xl"
                      }`}
                    >
                      <div>
                        {page.image_url && (
                          <div className="h-48 w-full overflow-hidden">
                            <img
                              src={page.image_url}
                              alt={page.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="p-6 space-y-2.5">
                          {page.badge && (
                            <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${palette.badgeBg}`}>
                              {page.badge}
                            </span>
                          )}
                          <h3 className="text-lg font-black">{page.title}</h3>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                            {page.subtitle || page.content}
                          </p>
                        </div>
                      </div>
                      <div className="px-6 pb-5 pt-2 flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400">
                        <span>Sayfayı İncele</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 5. FOTOĞRAF GALERİSİ (PHOTO GALLERY WITH LIGHTBOX) */}
          {config.gallery_section?.enabled !== false &&
            (config.gallery_section?.images || []).length > 0 && (
              <section
                id="galeri"
                className={`py-20 sm:py-24 px-4 sm:px-6 lg:px-8 border-t ${
                  isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200/70"
                }`}
              >
                <div className="max-w-7xl mx-auto space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                      {config.gallery_section?.badge && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${palette.badgeBg}`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{config.gallery_section.badge}</span>
                        </span>
                      )}
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                        {config.gallery_section?.title || "Fotoğraf Galerisi"}
                      </h2>
                      {config.gallery_section?.subtitle && (
                        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                          {config.gallery_section.subtitle}
                        </p>
                      )}
                    </div>

                    {galleryCategories.length > 1 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGalleryCategory("all")}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            galleryCategory === "all"
                              ? `${palette.primaryBg} text-white`
                              : isDark
                              ? "bg-slate-900 text-slate-400 hover:text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          Tümü
                        </button>
                        {galleryCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setGalleryCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              galleryCategory === cat
                                ? `${palette.primaryBg} text-white`
                                : isDark
                                ? "bg-slate-900 text-slate-400 hover:text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredGalleryImages.map((img, i) => (
                      <motion.div
                        key={img.id || i}
                        whileHover={{ y: -4 }}
                        onClick={() => setLightboxImage(img)}
                        className="group relative h-64 sm:h-72 rounded-3xl overflow-hidden cursor-pointer border border-slate-200/80 dark:border-slate-800 shadow-md"
                      >
                        <img
                          src={img.url}
                          alt={img.title || displayStoreName}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          {img.category && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                              {img.category}
                            </span>
                          )}
                          <h4 className="text-sm sm:text-base font-bold">{img.title}</h4>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            )}

          {/* 6. BLOG & DUYURULAR (IF STORE HAS BLOG POSTS) */}
          {blogPosts.length > 0 && (
            <section
              id="blog"
              className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${
                isDark ? "bg-slate-900/40 border-slate-800" : "bg-stone-100/70 border-slate-200"
              }`}
            >
              <div className="max-w-7xl mx-auto space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${palette.badgeBg}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>GÜNCEL BİLGİLER & DUYURULAR</span>
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                    Blog & Bilgilendirme Yazılarımız
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {blogPosts.slice(0, 6).map((post, idx) => (
                    <div
                      key={post.id || idx}
                      onClick={() => setSelectedBlogPost(post)}
                      className={`rounded-3xl overflow-hidden border cursor-pointer transition-all hover:-translate-y-1 ${
                        isDark
                          ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                          : "bg-white border-slate-200 shadow-sm hover:shadow-xl"
                      }`}
                    >
                      {post.image_url && (
                        <div className="h-48 w-full overflow-hidden">
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6 space-y-2.5">
                        <h3 className="text-base font-black line-clamp-2">{post.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                          {post.summary || post.content}
                        </p>
                        <div className="pt-2 text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span>Devamını Oku</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 7. SIKÇA SORULAN SORULAR (FAQ SECTION) */}
          {faqList.length > 0 && (
            <section
              id="sss"
              className={`py-20 px-4 sm:px-6 lg:px-8 border-t ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-stone-50 border-slate-200/70"
              }`}
            >
              <div className="max-w-4xl mx-auto space-y-10">
                <div className="text-center space-y-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${palette.badgeBg}`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>MERAK EDİLENLER</span>
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                    Sıkça Sorulan Sorular
                  </h2>
                </div>

                <div className="space-y-3">
                  {faqList.map((item, idx) => {
                    const q = item.question || item.q || "";
                    const a = item.answer || item.a || "";
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border overflow-hidden transition-all ${
                          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/90 shadow-2xs"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base cursor-pointer"
                        >
                          <span>{q}</span>
                          <ChevronDown
                            className={`w-5 h-5 shrink-0 transition-transform ${
                              isOpen ? "rotate-180 text-emerald-500" : "text-slate-400"
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                                {a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* 8. İLETİŞİM & GOOGLE HARİTA (CONTACT & GOOGLE MAPS SECTION) */}
          <section
            id="iletisim"
            className={`py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t ${
              isDark ? "bg-slate-900/70 border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                {config.contact_section?.badge && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${palette.badgeBg}`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{config.contact_section.badge}</span>
                  </span>
                )}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                  {config.contact_section?.title || "İletişim & Konum Bilgilerimiz"}
                </h2>
                {config.contact_section?.subtitle && (
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
                    {config.contact_section.subtitle}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Contact Credentials & Quick Lead Form */}
                <div className="lg:col-span-5 space-y-5">
                  <div
                    className={`p-6 sm:p-7 rounded-3xl border space-y-5 ${
                      isDark ? "bg-slate-900 border-slate-800" : "bg-stone-50 border-slate-200/90"
                    }`}
                  >
                    <h3 className="text-lg font-black flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-500" />
                      <span>Doğrudan İletişim Kanallarımız</span>
                    </h3>

                    <div className="space-y-3.5">
                      {allPhones.map((ph, idx) => (
                        <a
                          key={idx}
                          href={`tel:${ph}`}
                          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
                            isDark
                              ? "bg-slate-950 border-slate-800 hover:border-emerald-500/50"
                              : "bg-white border-slate-200 hover:border-emerald-500 shadow-2xs"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Telefon Hattımız {allPhones.length > 1 ? `#${idx + 1}` : ""}
                            </span>
                            <span className="text-sm sm:text-base font-black">{ph}</span>
                          </div>
                        </a>
                      ))}

                      {whatsappNumber && (
                        <a
                          href={getWhatsAppUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/15 transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                              7/24 WhatsApp Destek & Bilgi
                            </span>
                            <span className="text-sm sm:text-base font-black">
                              WhatsApp Üzerinden Mesaj Gönderin
                            </span>
                          </div>
                        </a>
                      )}

                      {storeAddress && (
                        <div
                          className={`flex items-start gap-3.5 p-3.5 rounded-2xl border ${
                            isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Tesis & Merkez Adresimiz
                            </span>
                            <span className="text-xs sm:text-sm font-bold leading-relaxed block mt-0.5">
                              {storeAddress}
                            </span>
                          </div>
                        </div>
                      )}

                      {config.contact_section?.working_hours && (
                        <div
                          className={`flex items-start gap-3.5 p-3.5 rounded-2xl border ${
                            isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Çalışma Saatlerimiz
                            </span>
                            <span className="text-xs sm:text-sm font-bold block mt-0.5">
                              {config.contact_section.working_hours}
                            </span>
                          </div>
                        </div>
                      )}

                      {primaryEmail && (
                        <a
                          href={`mailto:${primaryEmail}`}
                          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border ${
                            isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              E-Posta Adresimiz
                            </span>
                            <span className="text-xs sm:text-sm font-bold">{primaryEmail}</span>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Quick Callback / Message Form */}
                  {config.contact_section?.show_contact_form !== false && (
                    <form
                      onSubmit={handleLeadFormSubmit}
                      className={`p-6 sm:p-7 rounded-3xl border space-y-4 ${
                        isDark ? "bg-slate-900 border-slate-800" : "bg-stone-50 border-slate-200/90"
                      }`}
                    >
                      <div>
                        <h4 className="text-base font-black">Hızlı Bilgi & Geri Arama Formu</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Bilgilerinizi bırakın veya doğrudan WhatsApp üzerinden bize iletin.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Adınız Soyadınız"
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                            isDark
                              ? "bg-slate-950 border-slate-800 text-white"
                              : "bg-white border-slate-200 text-slate-900"
                          }`}
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Telefon Numaranız"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                            isDark
                              ? "bg-slate-950 border-slate-800 text-white"
                              : "bg-white border-slate-200 text-slate-900"
                          }`}
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="İlgilendiğiniz Hizmet / Konu"
                        value={leadSubject}
                        onChange={(e) => setLeadSubject(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none ${
                          isDark
                            ? "bg-slate-950 border-slate-800 text-white"
                            : "bg-white border-slate-200 text-slate-900"
                        }`}
                      />

                      <textarea
                        rows={3}
                        required
                        placeholder="Mesajınız veya sorunuz..."
                        value={leadMessage}
                        onChange={(e) => setLeadMessage(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none resize-none ${
                          isDark
                            ? "bg-slate-950 border-slate-800 text-white"
                            : "bg-white border-slate-200 text-slate-900"
                        }`}
                      />

                      <button
                        type="submit"
                        className={`w-full py-3.5 px-6 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all ${palette.primaryBg}`}
                      >
                        <Send className="w-4 h-4" />
                        <span>Mesajı Gönder & İletişime Geç</span>
                      </button>

                      {leadSubmitted && (
                        <p className="text-xs font-bold text-emerald-500 text-center">
                          ✓ Mesajınız iletildi! En kısa sürede dönüş yapılacaktır.
                        </p>
                      )}
                    </form>
                  )}
                </div>

                {/* Right Interactive Google Map */}
                <div className="lg:col-span-7 space-y-4">
                  <div
                    className={`rounded-3xl overflow-hidden border shadow-xl ${
                      isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="p-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black">{displayStoreName} — Harita Konumu</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Google Haritalar üzerinden yol tarifi alabilirsiniz
                          </p>
                        </div>
                      </div>

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-xs"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Yol Tarifi Al</span>
                      </a>
                    </div>

                    <div className="w-full h-[420px] sm:h-[500px] bg-slate-100 dark:bg-slate-950 relative">
                      <iframe
                        title={`${displayStoreName} Google Harita`}
                        src={resolvedMapEmbedUrl}
                        width="100%"
                        height="100%"
                        className="w-full h-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  {/* Optional multi-branch StoreMapSection if store has multiple locations configured */}
                  {store?.locations && store.locations.length > 0 && (
                    <Suspense fallback={null}>
                      <StoreMapSection store={store} />
                    </Suspense>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* CORPORATE FOOTER */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-800/80">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={displayStoreName} className="h-11 w-auto object-contain rounded-lg" />
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${palette.gradientAccent} text-white flex items-center justify-center font-black`}
                >
                  {displayStoreName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-lg font-black text-white">{displayStoreName}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              {config.hero?.subtitle ||
                `${displayStoreName}, kaliteli, güvenilir ve kurumsal hizmet anlayışıyla yanınızda.`}
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              {(store?.instagram_url || store?.branding?.instagram_url) && (
                <a
                  href={store?.instagram_url || store?.branding?.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {(store?.facebook_url || store?.branding?.facebook_url) && (
                <a
                  href={store?.facebook_url || store?.branding?.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              {(store?.twitter_url || store?.branding?.twitter_url) && (
                <a
                  href={store?.twitter_url || store?.branding?.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">Hızlı Menü</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li>
                <button onClick={() => scrollToSection("hero")} className="hover:text-white cursor-pointer">
                  {config.nav_labels?.home || "Ana Sayfa"}
                </button>
              </li>
              {config.services_section?.enabled !== false && (
                <li>
                  <button
                    onClick={() => scrollToSection("hizmetlerimiz")}
                    className="hover:text-white cursor-pointer"
                  >
                    {config.nav_labels?.services || "Hizmetlerimiz"}
                  </button>
                </li>
              )}
              {config.about_section?.enabled !== false && (
                <li>
                  <button
                    onClick={() => scrollToSection("hakkimizda")}
                    className="hover:text-white cursor-pointer"
                  >
                    {config.nav_labels?.about || "Hakkımızda"}
                  </button>
                </li>
              )}
              {(config.custom_pages || []).map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setActiveCustomPage(p);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-white cursor-pointer"
                  >
                    {p.title}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => scrollToSection("iletisim")}
                  className="hover:text-white cursor-pointer"
                >
                  {config.nav_labels?.contact || "İletişim & Harita"}
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">İletişim Bilgilerimiz</h4>
            <div className="space-y-2.5 text-xs">
              {allPhones.map((ph, idx) => (
                <p key={idx} className="flex items-center gap-2 text-slate-200 font-bold">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <a href={`tel:${ph}`} className="hover:text-white transition-colors">
                    {ph}
                  </a>
                </p>
              ))}
              {whatsappNumber && (
                <p className="flex items-center gap-2 text-slate-200 font-bold">
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    WhatsApp: +90 {whatsappNumber.replace(/^90/, "")}
                  </a>
                </p>
              )}
              {primaryEmail && (
                <p className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                  <a href={`mailto:${primaryEmail}`} className="hover:text-white transition-colors">
                    {primaryEmail}
                  </a>
                </p>
              )}
              {storeAddress && (
                <p className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{storeAddress}</span>
                </p>
              )}
              {config.contact_section?.working_hours && (
                <p className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{config.contact_section.working_hours}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} <strong className="text-slate-300">{displayStoreName}</strong>. Tüm
            hakları saklıdır.
          </p>
          <p className="text-[11px]">Kurumsal Web & Dijital Hizmet Altyapısı</p>
        </div>

        {/* LookPrice.net Parlak Yanıp-Sönen İmza */}
        <LookPriceFooterBadge />
      </footer>

      {/* FLOATING CALL & WHATSAPP ACTION BUTTONS (ICON-ONLY, SIDE-BY-SIDE) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-row items-center gap-2.5">
        {config.floating_actions?.show_call_button !== false && primaryPhone && (
          <motion.a
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            href={`tel:${primaryPhone}`}
            title={`Hemen Ara: ${primaryPhone}`}
            aria-label="Hemen Ara"
            className="w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-400 border border-white/15 shadow-2xl flex items-center justify-center transition-colors"
          >
            <Phone className="w-5 h-5" />
          </motion.a>
        )}

        {config.floating_actions?.show_whatsapp !== false && whatsappNumber && (
          <motion.a
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp İletişim"
            aria-label="WhatsApp İletişim"
            className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-2xl shadow-emerald-600/40 flex items-center justify-center transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.a>
        )}
      </div>

      {/* SERVICE DETAIL MODAL */}
      <AnimatePresence>
        {selectedServiceModal && (
          <div
            onClick={() => setSelectedServiceModal(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-2xl w-full rounded-3xl overflow-hidden border shadow-2xl max-h-[90vh] flex flex-col ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="relative h-64 w-full shrink-0">
                <img
                  src={selectedServiceModal.image_url}
                  alt={selectedServiceModal.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                <button
                  type="button"
                  onClick={() => setSelectedServiceModal(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-950 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-5 left-6 right-6 text-white">
                  {selectedServiceModal.badge && (
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase bg-amber-500 text-slate-950 mb-2">
                      {selectedServiceModal.badge}
                    </span>
                  )}
                  <h3 className="text-2xl font-black">{selectedServiceModal.title}</h3>
                  {selectedServiceModal.subtitle && (
                    <p className="text-xs sm:text-sm text-slate-200 mt-1">{selectedServiceModal.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {selectedServiceModal.description}
                </p>

                {Array.isArray(selectedServiceModal.features) &&
                  selectedServiceModal.features.filter(Boolean).length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Öne Çıkan Özellikler & Standartlarımız
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedServiceModal.features.filter(Boolean).map((feat, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs sm:text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
                  {whatsappNumber && (
                    <a
                      href={getWhatsAppUrl(
                        selectedServiceModal.whatsapp_message ||
                          `Merhaba ${displayStoreName}, "${selectedServiceModal.title}" hizmetiniz hakkında detaylı bilgi almak istiyorum.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp ile Bilgi & Fiyat Al</span>
                    </a>
                  )}
                  {primaryPhone && (
                    <a
                      href={`tel:${primaryPhone}`}
                      className={`py-3.5 px-5 rounded-xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 ${palette.primaryBg}`}
                    >
                      <Phone className="w-4 h-4" />
                      <span>Hemen Ara</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GALLERY LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <div
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="w-full max-h-[78vh] object-contain bg-slate-950"
              />
              {lightboxImage.title && (
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    {lightboxImage.category && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                        {lightboxImage.category}
                      </span>
                    )}
                    <h4 className="text-sm font-bold">{lightboxImage.title}</h4>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BLOG POST READER MODAL */}
      <AnimatePresence>
        {selectedBlogPost && (
          <div
            onClick={() => setSelectedBlogPost(null)}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-3xl w-full rounded-3xl overflow-hidden border shadow-2xl max-h-[90vh] flex flex-col ${
                isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              {selectedBlogPost.image_url && (
                <div className="relative h-64 w-full shrink-0">
                  <img
                    src={selectedBlogPost.image_url}
                    alt={selectedBlogPost.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedBlogPost(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl sm:text-2xl font-black">{selectedBlogPost.title}</h3>
                  {!selectedBlogPost.image_url && (
                    <button
                      type="button"
                      onClick={() => setSelectedBlogPost(null)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">
                  {selectedBlogPost.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
