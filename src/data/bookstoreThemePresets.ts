export interface BookstoreThemeConfig {
  preset_id: "netflix_midnight" | "antique_library" | "literary_navy" | "modern_emerald" | "burgundy_renaissance" | "parchment_ivory";
  primary_color: string;
  secondary_color: string;
  background_mode: "midnight" | "library_dark" | "navy_dark" | "emerald_dark" | "burgundy_dark" | "parchment_warm";
  
  // Hero / Manşet billboard settings
  show_hero_billboard: boolean;
  hero_title: string;
  hero_badge_text: string;
  hero_auto_rotate_seconds: number; // 0 for off, 2.5, 3.5, 5
  show_hero_collage: boolean;
  hero_collage_opacity: number; // 0.15, 0.25, 0.40
  show_hero_quote: boolean;
  show_hero_3d_cover: boolean;
  show_hero_meta_badges: boolean;

  // Showcase rows / Izgara satırları
  show_row_bestsellers: boolean;
  title_bestsellers: string;
  subtitle_bestsellers: string;
  title_weekly_picks?: string;
  subtitle_weekly_picks?: string;

  show_row_new_arrivals: boolean;
  title_new_arrivals: string;
  subtitle_new_arrivals: string;

  show_row_editors_pick: boolean;
  title_editors_pick: string;
  subtitle_editors_pick: string;

  show_row_award_winning: boolean;
  title_award_winning: string;
  subtitle_award_winning: string;

  show_row_coming_soon: boolean;
  title_coming_soon: string;
  subtitle_coming_soon: string;

  show_row_discounted: boolean;
  title_discounted: string;
  subtitle_discounted: string;

  show_row_categories: boolean;
  max_category_rows: number; // 3, 5, 10

  // Book card settings
  enable_card_flip: boolean;
  show_card_synopsis: boolean;
  show_card_badges: boolean;
  show_card_rating: boolean;
  show_card_quick_add: boolean;

  // Announcement bar
  show_announcement_bar: boolean;
  announcement_text: string;
  announcement_bg_style: "accent" | "dark" | "gold";
}

export interface BookstoreThemePreset {
  id: "netflix_midnight" | "antique_library" | "literary_navy" | "modern_emerald" | "burgundy_renaissance" | "parchment_ivory";
  nameTr: string;
  nameEn: string;
  taglineTr: string;
  taglineEn: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundMode: "midnight" | "library_dark" | "navy_dark" | "emerald_dark" | "burgundy_dark" | "parchment_warm";
  bgGradient: string;
  badgeBg: string;
  cardBorder: string;
  previewColors: string[];
}

export const BOOKSTORE_THEME_PRESETS: BookstoreThemePreset[] = [
  {
    id: "netflix_midnight",
    nameTr: "Netflix Gece Sineması",
    nameEn: "Netflix Midnight Cinema",
    taglineTr: "Sinematik gece siyahı arka plan, dinamik kırmızı butonlar ve yüksek kontrastlı modern kapaklar.",
    taglineEn: "Cinematic velvet black background with bold crimson accents and high contrast streaming aesthetics.",
    primaryColor: "#e50914",
    secondaryColor: "#f59e0b",
    backgroundMode: "midnight",
    bgGradient: "from-slate-950 via-slate-950/95 to-slate-900",
    badgeBg: "bg-red-600 text-white",
    cardBorder: "border-slate-800 hover:border-red-600/50",
    previewColors: ["#030712", "#e50914", "#f59e0b", "#1e293b"]
  },
  {
    id: "antique_library",
    nameTr: "Antik Sahaf & Kütüphane",
    nameEn: "Antique Library & Amber",
    taglineTr: "Sıcak ceviz & eskitme kütüphane tonları, kehribar ışıltısı, nostaljik sahaf ve ciltli başyapıt atmosferi.",
    taglineEn: "Warm walnut library wood, glowing golden amber, antique book smells and leather-bound masterpiece charm.",
    primaryColor: "#d97706",
    secondaryColor: "#fbbf24",
    backgroundMode: "library_dark",
    bgGradient: "from-[#0c0a09] via-[#1c130e] to-[#120d09]",
    badgeBg: "bg-amber-600 text-white",
    cardBorder: "border-amber-900/40 hover:border-amber-500/60",
    previewColors: ["#0c0a09", "#d97706", "#fbbf24", "#291b12"]
  },
  {
    id: "literary_navy",
    nameTr: "Klasik Edebiyat & Gece Mavisi",
    nameEn: "Literary Royal Navy",
    taglineTr: "Asil lacivert & safir tonları, dünya klasikleri, akademi, felsefe ve edebi zarafet.",
    taglineEn: "Deep sapphire night navy tones, world classics, philosophy and prestigious academic elegance.",
    primaryColor: "#0284c7",
    secondaryColor: "#38bdf8",
    backgroundMode: "navy_dark",
    bgGradient: "from-[#030712] via-[#071329] to-[#0b1b36]",
    badgeBg: "bg-sky-600 text-white",
    cardBorder: "border-sky-950 hover:border-sky-500/50",
    previewColors: ["#030712", "#0284c7", "#38bdf8", "#0f2347"]
  },
  {
    id: "modern_emerald",
    nameTr: "Modern Kitabevi & Zümrüt",
    nameEn: "Modern Bookstore Emerald",
    taglineTr: "Taze ve çağdaş yayınevi stili, koyu zümrüt yeşili zarafet ve ilham verici okuma salonu estetiği.",
    taglineEn: "Contemporary independent bookstore feel, deep emerald green serenity and reading salon aesthetics.",
    primaryColor: "#059669",
    secondaryColor: "#10b981",
    backgroundMode: "emerald_dark",
    bgGradient: "from-[#02130e] via-[#042017] to-[#072d21]",
    badgeBg: "bg-emerald-600 text-white",
    cardBorder: "border-emerald-950 hover:border-emerald-500/50",
    previewColors: ["#02130e", "#059669", "#34d399", "#0b392b"]
  },
  {
    id: "burgundy_renaissance",
    nameTr: "Rönesans Bordo & Gül Kurusu",
    nameEn: "Burgundy Renaissance",
    taglineTr: "Şiir, tiyatro ve dramatik edebi klasikler için asil bordo kadife, altın ve gül kurusu detaylar.",
    taglineEn: "Noble velvet wine red and rose gold details tailored for poetry, theatre and dramatic literary gems.",
    primaryColor: "#e11d48",
    secondaryColor: "#fb7185",
    backgroundMode: "burgundy_dark",
    bgGradient: "from-[#15050a] via-[#220712] to-[#2c0b17]",
    badgeBg: "bg-rose-600 text-white",
    cardBorder: "border-rose-950 hover:border-rose-500/50",
    previewColors: ["#15050a", "#e11d48", "#fb7185", "#390e1e"]
  },
  {
    id: "parchment_ivory",
    nameTr: "Sıcak Parşömen & Fildişi",
    nameEn: "Warm Parchment & Ivory",
    taglineTr: "Eski parşömen, sıcak kahve, antika cilt dokunuşları ve fildişi zarafeti.",
    taglineEn: "Aged parchment tones, warm coffee accents, antique leather touches and ivory warmth.",
    primaryColor: "#b45309",
    secondaryColor: "#f59e0b",
    backgroundMode: "parchment_warm",
    bgGradient: "from-[#181512] via-[#241f1a] to-[#1c1813]",
    badgeBg: "bg-orange-700 text-white",
    cardBorder: "border-orange-950/60 hover:border-orange-500/50",
    previewColors: ["#181512", "#b45309", "#d97706", "#322a22"]
  }
];

export const DEFAULT_BOOKSTORE_THEME: BookstoreThemeConfig = {
  preset_id: "netflix_midnight",
  primary_color: "#e50914",
  secondary_color: "#f59e0b",
  background_mode: "midnight",

  show_hero_billboard: true,
  hero_title: "HAFTANIN ESERLERİ",
  hero_badge_text: "HAFTANIN ESERLERİ",
  hero_auto_rotate_seconds: 3.5,
  show_hero_collage: true,
  hero_collage_opacity: 0.25,
  show_hero_quote: true,
  show_hero_3d_cover: true,
  show_hero_meta_badges: true,

  show_row_bestsellers: true,
  title_bestsellers: "Çok Satan Eserler",
  subtitle_bestsellers: "Okurların en çok tercih ettiği, haftanın zirvedeki popüler kitapları",

  show_row_new_arrivals: true,
  title_new_arrivals: "Yeni Çıkanlar & Raflarda",
  subtitle_new_arrivals: "Edebiyat dünyasından en son çıkan taze baskılar ve yeni tercümeler",

  show_row_editors_pick: true,
  title_editors_pick: "Editörün Seçimi",
  subtitle_editors_pick: "Edebiyat danışmanlarımız ve editörlerimiz tarafından özenle seçilen özel seçki",

  show_row_award_winning: true,
  title_award_winning: "Ödüllü Eserler & Başyapıtlar",
  subtitle_award_winning: "Ulusal ve uluslararası prestijli edebiyat ödülleriyle taçlandırılmış eserler",

  show_row_coming_soon: true,
  title_coming_soon: "Yakında Raflarda & Ön Sipariş",
  subtitle_coming_soon: "Baskı aşamasında olan ve merakla beklenen yeni yayınlar",

  show_row_discounted: true,
  title_discounted: "Özel Fırsat & İndirimli Eserler",
  subtitle_discounted: "Kaçırılmayacak fiyat avantajlarıyla okurlarını bekleyen seçili kitaplar",

  show_row_categories: true,
  max_category_rows: 4,

  enable_card_flip: true,
  show_card_synopsis: true,
  show_card_badges: true,
  show_card_rating: true,
  show_card_quick_add: true,

  show_announcement_bar: true,
  announcement_text: "📚 250 TL Üzeri Siparişlerde Kargo Ücretsiz! • İmzalı Özel Baskılar ve Yeni Çeviriler Raflarda.",
  announcement_bg_style: "accent"
};

export function getBookstoreThemeConfig(branding: any): BookstoreThemeConfig {
  const raw = branding?.bookstore_theme || branding?.page_layout_settings?.bookstore_theme;
  if (typeof raw === "string") {
    try {
      return { ...DEFAULT_BOOKSTORE_THEME, ...JSON.parse(raw) };
    } catch (e) {
      return DEFAULT_BOOKSTORE_THEME;
    }
  } else if (raw && typeof raw === "object") {
    return { ...DEFAULT_BOOKSTORE_THEME, ...raw };
  }
  return DEFAULT_BOOKSTORE_THEME;
}
