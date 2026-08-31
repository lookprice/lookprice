export interface ShopThemeConfig {
  preset_name: "minimal_swiss" | "luxury_dark" | "nordic_warm" | "street_bold" | "custom";
  primary_color: string;
  accent_color: string;
  background_mode: "light" | "dark" | "warm";
  card_radius: "none" | "subtle" | "rounded" | "pill"; // 0px, 8px, 16px, 24px
  card_aspect_ratio: "square" | "portrait" | "wide"; // 1:1, 3:4, 16:9
  card_hover_effect: "zoom" | "secondary_image" | "glow";
  show_story_ribbon: boolean;
  show_bento_grid: boolean;
  show_announcement_bar: boolean;
  show_hero_banner: boolean;
  featured_capsules_title?: string;
  featured_capsules_subtitle?: string;
  announcement_text?: string;
  announcement_marquee?: boolean;
  hero_layout: "split" | "full_banner" | "slider" | "editorial";
  show_trust_badges: boolean;
  show_quick_view: boolean;
  show_swatches_on_card: boolean;
  stories?: Array<{
    id: string;
    title: string;
    image_url: string;
    video_url?: string;
    badge?: string;
    link?: string;
  }>;
  bento_blocks?: Array<{
    id: string;
    size: "large" | "medium" | "small";
    title: string;
    subtitle?: string;
    badge?: string;
    image_url: string;
    link?: string;
    cta_text?: string;
  }>;
  trust_badges?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export const DEFAULT_SHOP_THEME: ShopThemeConfig = {
  preset_name: "minimal_swiss",
  primary_color: "#0f172a",
  accent_color: "#e11d48",
  background_mode: "light",
  card_radius: "rounded",
  card_aspect_ratio: "portrait",
  card_hover_effect: "secondary_image",
  show_story_ribbon: true,
  show_bento_grid: true,
  show_announcement_bar: true,
  show_hero_banner: true,
  featured_capsules_title: "ÖNE ÇIKAN KAPSÜLLER",
  featured_capsules_subtitle: "Zamanın ve Tarzın Ötesinde",
  announcement_text: "✨ Yeni Koleksiyon Yayında! 1.500 TL Üzeri Ücretsiz Kargo & Aynı Gün Teslimat Fırsatı",
  announcement_marquee: true,
  hero_layout: "split",
  show_trust_badges: true,
  show_quick_view: true,
  show_swatches_on_card: true,
  stories: [
    {
      id: "story_1",
      title: "Yeni Sezon",
      image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
      badge: "YENİ",
      link: "#catalog"
    },
    {
      id: "story_2",
      title: "Özel Kapsül",
      image_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80",
      badge: "LIMITED",
      link: "#catalog"
    },
    {
      id: "story_3",
      title: "Çok Satanlar",
      image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
      badge: "TREND",
      link: "#catalog"
    },
    {
      id: "story_4",
      title: "Aksesuarlar",
      image_url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80",
      link: "#catalog"
    }
  ],
  bento_blocks: [
    {
      id: "bento_1",
      size: "large",
      title: "Kusursuz Mühendislik & Minimalizm",
      subtitle: "Saat, takı ve modern aksesuarlarda zamanın ötesinde çizgiler.",
      badge: "ÖZEL KOLEKSİYON",
      image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85",
      cta_text: "Koleksiyonu Keşfet",
      link: "#catalog"
    },
    {
      id: "bento_2",
      size: "medium",
      title: "İkonik Renkler",
      subtitle: "Canlı kadranlar ve suya dayanıklı gövdeler.",
      badge: "YENİ",
      image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
      cta_text: "Modelleri İncele",
      link: "#catalog"
    },
    {
      id: "bento_3",
      size: "small",
      title: "Hızlı Teslimat",
      subtitle: "Aynı gün özenli paketleme.",
      badge: "PREMIUM",
      image_url: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&q=80",
      cta_text: "Göz At",
      link: "#catalog"
    }
  ],
  trust_badges: [
    {
      icon: "ShieldCheck",
      title: "%100 Orijinallik Garantisi",
      description: "Tüm ürünlerimiz resmi distribütör ve sertifikalı üretici güvencesindedir."
    },
    {
      icon: "Truck",
      title: "Aynı Gün & Ücretsiz Kargo",
      description: "Saat 15:00'a kadar verilen siparişlerde aynı gün hızlı kargo avantajı."
    },
    {
      icon: "RefreshCw",
      title: "14 Gün Koşulsuz İade",
      description: "Memnun kalmadığınız ürünlerde anında ve zahmetsiz değişim/iade."
    },
    {
      icon: "Lock",
      title: "256-Bit SSL Güvenli Ödeme",
      description: "Kredi kartı, Havale/EFT ve Kapıda Ödeme ile uçtan uca koruma."
    }
  ]
};

export const THEME_PRESETS: Record<string, Partial<ShopThemeConfig>> = {
  minimal_swiss: {
    preset_name: "minimal_swiss",
    primary_color: "#0f172a",
    accent_color: "#e11d48",
    background_mode: "light",
    card_radius: "rounded",
    card_aspect_ratio: "portrait",
    card_hover_effect: "secondary_image"
  },
  luxury_dark: {
    preset_name: "luxury_dark",
    primary_color: "#f59e0b",
    accent_color: "#d97706",
    background_mode: "dark",
    card_radius: "subtle",
    card_aspect_ratio: "portrait",
    card_hover_effect: "zoom"
  },
  nordic_warm: {
    preset_name: "nordic_warm",
    primary_color: "#475569",
    accent_color: "#0d9488",
    background_mode: "warm",
    card_radius: "pill",
    card_aspect_ratio: "square",
    card_hover_effect: "secondary_image"
  },
  street_bold: {
    preset_name: "street_bold",
    primary_color: "#000000",
    accent_color: "#6366f1",
    background_mode: "light",
    card_radius: "none",
    card_aspect_ratio: "portrait",
    card_hover_effect: "glow"
  }
};
