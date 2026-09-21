import React, { useState, useMemo } from "react";
import {
  QrCode,
  UtensilsCrossed,
  Sparkles,
  Wifi,
  Bell,
  Clock,
  ShieldAlert,
  Flame,
  Save,
  RefreshCw,
  ExternalLink,
  Eye,
  Check,
  ChefHat,
  Upload,
  Image,
  Building2,
  CheckCircle2,
  Trash2,
  Instagram,
  Heart,
  Plus,
  Calendar,
  MapPin
} from "lucide-react";
import { motion } from "motion/react";

interface HorecaThemeStudioProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
  storeId?: number | string;
}

export const HorecaThemeStudio: React.FC<HorecaThemeStudioProps> = ({
  branding,
  onBrandingChange,
  lang,
  onSave,
  saving = false,
  storeId
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"visual" | "table_order" | "hours" | "wifi" | "tables_qr" | "instagram">("visual");

  const txt = (tr: string, en: string, el: string) => {
    if (lang === "tr") return tr;
    if (lang === "el") return el;
    return en;
  };

  // Curated vibrant food & restaurant hero images
  const PRESET_HERO_IMAGES = [
    {
      title: txt("Lüks Restoran & Bistro", "Luxury Bistro & Fine Dining", "Πολυτελές Εστιατόριο"),
      url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
    },
    {
      title: txt("Modern Kafe & Kahve", "Modern Cafe & Artisan Coffee", "Μοντέρνο Καφέ"),
      url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1600&q=80"
    },
    {
      title: txt("İtalyan & Taş Fırın Pizza", "Italian Trattoria & Pizza", "Ιταλικό & Πίτσα"),
      url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80"
    },
    {
      title: txt("Gurme Burger & Izgara", "Gourmet Grill & Burgers", "Γκουρμέ Μπέργκερ"),
      url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=80"
    },
    {
      title: txt("Deniz Ürünleri & Akdeniz", "Mediterranean Seafood", "Θαλασσινά & Μεσόγειος"),
      url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1600&q=80"
    },
    {
      title: txt("Tatlı & Butik Fırın", "Artisan Bakery & Desserts", "Γλυκά & Αρτοποιείο"),
      url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1600&q=80"
    }
  ];

  // Safe reading of digital menu settings
  const horecaConfig = useMemo(() => {
    const raw = branding?.digital_menu_settings || branding?.page_layout_settings?.digital_menu_settings || {};
    return {
      theme: raw.theme || branding?.theme || "modern_light",
      font_family: raw.font_family || branding?.font_family || "Plus Jakarta Sans",
      primary_color: raw.primary_color || branding?.primary_color || "#4f46e5",
      accent_color: raw.accent_color || branding?.accent_color || "#f59e0b",
      card_style: raw.card_style || "grid", // grid | list | compact
      corner_radius: raw.corner_radius || "xl", // lg | xl | 2xl | full
      header_style: raw.header_style || "banner", // banner | centered | minimalist
      menu_title: raw.menu_title || branding?.hero_title || (lang === "tr" ? "Lezzet Dolu Bir Deneyim" : "A Tasteful Experience"),
      menu_subtitle: raw.menu_subtitle || branding?.hero_subtitle || (lang === "tr" ? "Özenle seçilmiş taze malzemelerle hazırlanan lezzetlerimizi keşfedin." : "Explore our culinary delights crafted with the finest ingredients."),
      allow_table_orders: raw.allow_table_orders !== false,
      allow_waiter_call: raw.allow_waiter_call !== false,
      allow_bill_request: raw.allow_bill_request !== false,
      show_allergens: raw.show_allergens !== false,
      show_calories: raw.show_calories !== false,
      estimated_prep_time: raw.estimated_prep_time || "15-20",
      wifi_ssid: raw.wifi_ssid || branding?.wifi_ssid || "",
      wifi_password: raw.wifi_password || branding?.wifi_password || "",
      table_count: branding?.page_layout_settings?.table_count || raw.table_count || 12,
      cover_image: raw.cover_image || branding?.hero_image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80"
    };
  }, [branding?.digital_menu_settings, branding?.page_layout_settings, branding?.hero_title, branding?.hero_subtitle, branding?.hero_image_url, branding?.wifi_ssid, branding?.wifi_password, branding?.theme, branding?.font_family, branding?.primary_color, lang]);

  const updateHorecaConfig = (updates: Partial<typeof horecaConfig>) => {
    const updated = { ...horecaConfig, ...updates };
    onBrandingChange("digital_menu_settings", updated);
    
    if (updates.theme !== undefined) {
      onBrandingChange("theme", updates.theme);
      if (updates.theme === "dark_bistro") onBrandingChange("primary_color", "#f59e0b");
      else if (updates.theme === "warm_amber") onBrandingChange("primary_color", "#d97706");
      else if (updates.theme === "fresh_emerald") onBrandingChange("primary_color", "#059669");
      else if (updates.theme === "royal_gold") onBrandingChange("primary_color", "#eab308");
      else if (updates.theme === "cyber_neon") onBrandingChange("primary_color", "#06b6d4");
      else if (updates.theme === "italian_trattoria") onBrandingChange("primary_color", "#b91c1c");
      else if (updates.theme === "vintage_diner") onBrandingChange("primary_color", "#db2777");
      else if (updates.theme === "ocean_blue") onBrandingChange("primary_color", "#0284c7");
      else if (updates.theme === "sunset_terracotta") onBrandingChange("primary_color", "#c2410c");
      else if (updates.theme === "nordic_minimal") onBrandingChange("primary_color", "#334155");
      else if (updates.theme === "rose_gold_bistro") onBrandingChange("primary_color", "#e11d48");
      else onBrandingChange("primary_color", "#4f46e5");
    }
    if (updates.font_family !== undefined) onBrandingChange("font_family", updates.font_family);
    if (updates.primary_color !== undefined) onBrandingChange("primary_color", updates.primary_color);
    if (updates.menu_title !== undefined) onBrandingChange("hero_title", updates.menu_title);
    if (updates.menu_subtitle !== undefined) onBrandingChange("hero_subtitle", updates.menu_subtitle);
    if (updates.cover_image !== undefined) onBrandingChange("hero_image_url", updates.cover_image);
    if (updates.wifi_ssid !== undefined) onBrandingChange("wifi_ssid", updates.wifi_ssid);
    if (updates.wifi_password !== undefined) onBrandingChange("wifi_password", updates.wifi_password);
    if (updates.table_count !== undefined) {
      onBrandingChange("page_layout_settings", {
        ...(branding?.page_layout_settings || {}),
        table_count: updates.table_count,
        sector: "cafe_restaurant"
      });
    }
  };

  const THEMES = [
    {
      id: "modern_light",
      name: txt("Modern & Ferah (Açık)", "Clean & Modern (Light)", "Μοντέρνο & Καθαρό"),
      desc: txt("Beyaz ve açık gri tonlarında minimalist menü.", "Minimalist menu with crisp white & subtle slate.", "Μινιμαλιστικό μενού."),
      tag: "Popüler"
    },
    {
      id: "dark_bistro",
      name: txt("Koyu Gurme & Bistro", "Dark Bistro & Lounge", "Σκοτεινό Μπιστρό"),
      desc: txt("Siyah ve antrasit arka plan, şık altın/amber vurgular.", "Deep black & charcoal tones with warm gold.", "Αριστοκρατικό μαύρο φόντο."),
      tag: "Fine Dining"
    },
    {
      id: "warm_amber",
      name: txt("Sıcak Ahşap & Kahve", "Warm Amber & Cafe", "Ζεστό Καφέ"),
      desc: txt("Sıcak amber ve kahve tonları.", "Cozy amber & roasted coffee tones.", "Ζεστό κεχριμπάρι."),
      tag: "Kafe & Bakery"
    },
    {
      id: "fresh_emerald",
      name: txt("Taze Yeşil & Botanik", "Fresh Botanical", "Φρέσκο Βοτανικό"),
      desc: txt("Organik ve ferah zümrüt yeşili konsept.", "Organic emerald green for wholesome dining.", "Οργανικό σμαραγδί."),
      tag: "Sağlıklı"
    },
    {
      id: "royal_gold",
      name: txt("Kraliyet Altın & Siyah", "Royal Gold & Black", "Βασιλικό Χρυσό"),
      desc: txt("Lüks oteller ve prestijli restoranlar için altın detaylar.", "Luxury gold accents for elite venues.", "Πολυτελές χρυσό."),
      tag: "Lüks"
    },
    {
      id: "cyber_neon",
      name: txt("Neon Cyberpunk Bistro", "Cyber Neon Bistro", "Cyber Neon"),
      desc: txt("Koyu zemin üzerinde canlı turkuaz ve fuşya neonlar.", "Vibrant cyan & magenta neon glows.", "Neon στυλ."),
      tag: "Modern Bar"
    },
    {
      id: "italian_trattoria",
      name: txt("İtalyan Trattoria", "Italian Trattoria", "Ιταλική Τρατορία"),
      desc: txt("Sıcak terracotta ve klasik İtalyan bistro havası.", "Warm terracotta and rustic Italian vibes.", "Ιταλική ατμόσφαιρα."),
      tag: "Pizzeria"
    },
    {
      id: "vintage_diner",
      name: txt("Vintage Retro Diner", "Vintage Retro Diner", "Retro Diner"),
      desc: txt("50'ler nostaljik amerikan lokantası konsepti.", "Classic retro 1950s diner palette.", "Vintage στυλ."),
      tag: "Burger & Shake"
    },
    {
      id: "ocean_blue",
      name: txt("Okyanus Mavisi", "Ocean Blue & Marine", "Ωκεανός"),
      desc: txt("Deniz ürünleri ve ferah yazlık mekanlar için mavi tonlar.", "Crisp marine blue for seafood & coastal dining.", "Θαalassinό."),
      tag: "Balık & Deniz"
    },
    {
      id: "sunset_terracotta",
      name: txt("Gün Batımı Terracotta", "Sunset Terracotta", "Ηλιοβασίλεμα"),
      desc: txt("Sıcak turuncu ve gün batımı gradyanları.", "Warm sunset orange and earthy tones.", "Ζεστά χρώματα."),
      tag: "Terrace Bar"
    },
    {
      id: "nordic_minimal",
      name: txt("İskandinav Minimal", "Nordic Minimal", "Σκανδιναβικό"),
      desc: txt("Soğuk gri, taş ve yalın İskandinav tasarımı.", "Scandi clean stone & slate minimalism.", "Minimal."),
      tag: "Butik Kafe"
    },
    {
      id: "rose_gold_bistro",
      name: txt("Rose Gold & Kadife", "Rose Gold & Velvet", "Rose Gold"),
      desc: txt("Zarif gül kurusu ve şık tasarım detayları.", "Sophisticated rose gold and velvet accents.", "Zarif."),
      tag: "Patisserie"
    }
  ];

  const FONT_FAMILIES = [
    { id: "Plus Jakarta Sans", name: "Plus Jakarta Sans (Modern & Clean)" },
    { id: "Playfair Display", name: "Playfair Display (Classic Serif / Fine Dining)" },
    { id: "Inter", name: "Inter (Tech & Crisp)" },
    { id: "Lora", name: "Lora (Artistic Serif)" },
    { id: "Montserrat", name: "Montserrat (Geometric Bold)" },
    { id: "Cinzel", name: "Cinzel (Luxury Roman)" },
    { id: "Merriweather", name: "Merriweather (Readable Serif)" },
    { id: "Poppins", name: "Poppins (Friendly Rounded)" }
  ];

  const currentStoreTargetId = storeId || branding?.id || branding?.slug || "";
  const waiterUrl = `${window.location.origin}/digital-menu/${currentStoreTargetId}/garson`;

  // Working Hours Helper
  const wh = typeof branding?.working_hours === 'object' ? branding.working_hours : {};

  return (
    <div className="space-y-3.5 text-slate-800">
      {/* Bright & Clean Minimalist Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  HoReCaLP
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {txt("QR Menü Stüdyosu", "QR Menu Studio", "Στούντιο Μενού")}
                </span>
              </div>
              <h2 className="text-sm md:text-base font-extrabold tracking-tight text-slate-900 uppercase mt-0.5">
                {branding?.store_name || branding?.name || txt("Restoran & Kafe Menüsü", "Restaurant & Cafe Menu", "Μενού Еστιατορίου")}
              </h2>
            </div>
          </div>

          {/* Action Buttons: "Menüyü Canlı Aç" button REMOVED */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <a
              href={waiterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-slate-500" />
              <span>{txt("Garson Paneli", "Waiter Screen", "Οθόνη Σερβιτόρου")}</span>
            </a>

            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[11px] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saving ? txt("Kaydediliyor...", "Saving...", "Αποθήκευση...") : txt("Kaydet", "Save", "Αποθήκευση")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Light Sub Navigation Bar */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 overflow-x-auto no-scrollbar">
          {[
            { id: "visual", label: txt("Tema & Fotoğraflar", "Theme & Photos", "Θέμα & Φωτογραφίες"), icon: Sparkles },
            { id: "hours", label: txt("Çalışma Saatleri", "Opening Hours", "Ώρες Λειτουργίας"), icon: Clock },
            { id: "table_order", label: txt("Sipariş & Servis", "Ordering & Service", "Παραγγελίες"), icon: UtensilsCrossed },
            { id: "wifi", label: txt("Müşteri Wi-Fi", "Guest Wi-Fi", "Wi-Fi"), icon: Wifi },
            { id: "tables_qr", label: txt("Masa QR", "Table QR", "QR Τραπεζιών"), icon: QrCode },
            { id: "instagram", label: txt("Instagram", "Instagram", "Instagram"), icon: Instagram },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBTAB 1: TEMA VE GÖRSEL TASARIM */}
      {activeSubTab === "visual" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Preset Theme Selection Cards (12 Professional Themes) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {txt("QR Menü ve Web Sitesi Görsel Teması (12 Seçenek)", "Visual Theme (12 Options)", "Οπτικό Θέμα")}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {txt("Tam Sektörel Esneklik", "Full Flexibility", "Πλήρης Ευελιξία")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {THEMES.map((theme) => {
                const isSelected = horecaConfig.theme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => updateHorecaConfig({ theme: theme.id })}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500 shadow-2xs"
                        : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-700 rounded">
                        {theme.tag}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-[11px] text-slate-900 truncate">{theme.name}</h4>
                      <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">{theme.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ADVANCED CUSTOMIZATION PANEL (Font, Colors, Card Styles, Radius) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-indigo-600" />
                {txt("Gelişmiş Tipografi, Renk ve Stil Yönetimi", "Advanced Typography, Color & Style Management", "Προηγμένη Διαχείριση Στυλ")}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {txt("Değişiklikler anında vitrine yansır", "Instant live preview", "Άμεση προεπισκόπηση")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Font Family */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  {txt("Yazı Tipi (Font)", "Font Family", "Γραμματοσειρά")}
                </label>
                <select
                  value={horecaConfig.font_family}
                  onChange={(e) => updateHorecaConfig({ font_family: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                >
                  {FONT_FAMILIES.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Primary Color Picker */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  {txt("Ana Vurgu Rengi", "Primary Accent Color", "Χρώμα Έμφασης")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={horecaConfig.primary_color}
                    onChange={(e) => updateHorecaConfig({ primary_color: e.target.value })}
                    className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-slate-50"
                  />
                  <input
                    type="text"
                    value={horecaConfig.primary_color}
                    onChange={(e) => updateHorecaConfig({ primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Card Style */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  {txt("Ürün Kart Stili", "Product Card Layout", "Στυλ Κάρτας")}
                </label>
                <select
                  value={horecaConfig.card_style}
                  onChange={(e) => updateHorecaConfig({ card_style: e.target.value } as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="grid">{txt("2 Sütunlu Kartlar (Grid)", "2-Column Cards (Grid)", "Πλέγμα 2 στηλών")}</option>
                  <option value="list">{txt("Yatay Liste (List)", "Horizontal List (List)", "Οριζόντια Λίστα")}</option>
                  <option value="compact">{txt("Kompakt Liste", "Compact Minimalist", "Συμπαγής")}</option>
                </select>
              </div>

              {/* Corner Radius */}
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  {txt("Köşe Yuvarlaklığı", "Corner Roundness", "Γωνίες")}
                </label>
                <select
                  value={horecaConfig.corner_radius}
                  onChange={(e) => updateHorecaConfig({ corner_radius: e.target.value } as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                >
                  <option value="lg">{txt("Orta (LG)", "Medium (LG)", "Μεσαίο")}</option>
                  <option value="xl">{txt("Yumuşak (XL)", "Smooth (XL)", "Ομαλό")}</option>
                  <option value="2xl">{txt("Geniş (2XL)", "Rounded (2XL)", "Στρογγυλό")}</option>
                  <option value="full">{txt("Tam Hap (Pill)", "Full Pill", "Χάπι")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Curated High-Vibrancy Hero Photos Gallery */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-slate-500" />
                {txt("Canlı Kapak & Hero Fotoğrafı Seçimi", "Vibrant Hero / Cover Photo Selection", "Εικόνα Εξωφύλλου")}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {txt("Tek tıkla seçin veya özel URL girin", "1-Click pick or paste URL", "Επιλέξτε")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {PRESET_HERO_IMAGES.map((preset, idx) => {
                const isSelected = horecaConfig.cover_image === preset.url;
                return (
                  <div
                    key={idx}
                    onClick={() => updateHorecaConfig({ cover_image: preset.url })}
                    className={`group relative rounded-xl overflow-hidden aspect-video border cursor-pointer transition-all ${
                      isSelected ? "ring-2 ring-emerald-500 border-emerald-500 shadow-xs" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-1.5">
                      <span className="text-[9px] font-bold text-white line-clamp-1">{preset.title}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 shrink-0">
                {txt("Özel Kapak URL'si:", "Custom Cover URL:", "Ειδικό URL:")}
              </span>
              <input
                type="text"
                value={horecaConfig.cover_image}
                onChange={(e) => updateHorecaConfig({ cover_image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Menu Title, Slogan and Cover Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-slate-500" />
                {txt("Karşılama Metinleri", "Welcome Texts", "Τίτλος Υποδοχής")}
              </span>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    {txt("Menü Başlığı", "Menu Heading", "Επικεφαλίδα")}
                  </label>
                  <input
                    type="text"
                    value={horecaConfig.menu_title}
                    onChange={(e) => updateHorecaConfig({ menu_title: e.target.value })}
                    placeholder={txt("Örn: Gurme Lezzetler", "e.g. Gourmet Flavors", "π.χ. Γκουρμέ Γεύσεις")}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    {txt("Alt Açıklama / Slogan", "Subtitle", "Υπότιτλος")}
                  </label>
                  <input
                    type="text"
                    value={horecaConfig.menu_subtitle}
                    onChange={(e) => updateHorecaConfig({ menu_subtitle: e.target.value })}
                    placeholder={txt("Taze lezzetler...", "Explore fresh dishes...", "Ανακαλύψτε γεύσεις...")}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* STORE LOGO & FAVICON */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-slate-500" />
                {txt("Mağaza Logosu & Favicon", "Store Logo & Favicon", "Λογότυπο & Favicon")}
              </span>

              <div className="space-y-2">
                {/* LOGO */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-1 shrink-0 shadow-2xs">
                    {branding?.logo_url ? (
                      <img src={branding.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[8px] font-bold text-slate-400">Logo Yok</span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <input
                      type="file"
                      id="horeca_logo_upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            onBrandingChange("logo_url", reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById("horeca_logo_upload")?.click()}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <Upload className="w-3 h-3" /> Logo Yükle
                      </button>
                      {branding?.logo_url && (
                        <button
                          type="button"
                          onClick={() => onBrandingChange("logo_url", "")}
                          className="px-2 py-1 text-rose-600 hover:text-rose-700 text-[10px] font-bold cursor-pointer"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* FAVICON */}
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center p-1 shrink-0 shadow-2xs">
                    {branding?.favicon_url ? (
                      <img src={branding.favicon_url} alt="Favicon" className="w-6 h-6 object-contain" />
                    ) : (
                      <span className="text-[8px] font-bold text-slate-400">Favicon</span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <input
                      type="file"
                      id="horeca_favicon_upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            onBrandingChange("favicon_url", reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("horeca_favicon_upload")?.click()}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <Upload className="w-3 h-3" /> Favicon Yükle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps & Hotel Concept */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Google Maps Pin URL
              </span>
              <input
                type="text"
                placeholder="https://maps.app.goo.gl/..."
                value={branding?.google_maps_url || ""}
                onChange={(e) => onBrandingChange("google_maps_url", e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Otel Konsept Modülü
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(branding?.hotel_module_enabled)}
                    onChange={(e) => onBrandingChange("hotel_module_enabled", e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-100 border-slate-300 text-emerald-600 accent-emerald-600"
                  />
                  <span className="text-[10px] font-bold text-slate-700">Aktif</span>
                </label>
              </div>
              {Boolean(branding?.hotel_module_enabled) && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Check-In: 14:00"
                    value={branding?.check_in_time || "14:00"}
                    onChange={(e) => onBrandingChange("check_in_time", e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Check-Out: 12:00"
                    value={branding?.check_out_time || "12:00"}
                    onChange={(e) => onBrandingChange("check_out_time", e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-bold text-slate-900"
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB: ÇALIŞMA SAATLERİ (WORKING HOURS) */}
      {activeSubTab === "hours" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {txt("Restoran & Kafe Çalışma Saatleri", "Restaurant & Cafe Operating Hours", "Ώρες Λειτουργίας")}
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                {txt("Web sitesi ve QR menüde anlık canlı açık/kapalı durumu hesaplanır", "Live open/closed status displayed on website & QR menu", "Ζωντανή κατάσταση")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Weekdays */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                  {txt("Hafta İçi (Pzt - Cuma)", "Weekdays (Mon - Fri)", "Καθημερινές")}
                </label>
                <input
                  type="text"
                  value={wh.weekdays || "08:30 - 23:00"}
                  onChange={(e) => onBrandingChange("working_hours", { ...wh, weekdays: e.target.value })}
                  placeholder="08:30 - 23:00"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Saturday */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                    {txt("Cumartesi", "Saturday", "Σάββατο")}
                  </label>
                  <label className="flex items-center gap-1 text-[9px] font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(wh.is_saturday_closed)}
                      onChange={(e) => onBrandingChange("working_hours", { ...wh, is_saturday_closed: e.target.checked })}
                      className="w-3 h-3 accent-rose-600 rounded"
                    />
                    <span>Kapalı</span>
                  </label>
                </div>
                {!wh.is_saturday_closed ? (
                  <input
                    type="text"
                    value={wh.saturday || "09:00 - 23:30"}
                    onChange={(e) => onBrandingChange("working_hours", { ...wh, saturday: e.target.value })}
                    placeholder="09:00 - 23:30"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-200">
                    Kapalı
                  </div>
                )}
              </div>

              {/* Sunday */}
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                    {txt("Pazar", "Sunday", "Κυριακή")}
                  </label>
                  <label className="flex items-center gap-1 text-[9px] font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(wh.is_sunday_closed)}
                      onChange={(e) => onBrandingChange("working_hours", { ...wh, is_sunday_closed: e.target.checked })}
                      className="w-3 h-3 accent-rose-600 rounded"
                    />
                    <span>Kapalı</span>
                  </label>
                </div>
                {!wh.is_sunday_closed ? (
                  <input
                    type="text"
                    value={wh.sunday || "09:00 - 22:30"}
                    onChange={(e) => onBrandingChange("working_hours", { ...wh, sunday: e.target.value })}
                    placeholder="09:00 - 22:30"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-200">
                    Kapalı
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                {txt("Özel Çalışma Saati Notu (İsteğe Bağlı)", "Special Hours Note (Optional)", "Σημείωση")}
              </label>
              <input
                type="text"
                value={wh.note || ""}
                onChange={(e) => onBrandingChange("working_hours", { ...wh, note: e.target.value })}
                placeholder={txt("Örn: Mutfak kapanış saatimiz 22:30'dur. Pazar günleri brunch servisimiz vardır.", "e.g. Kitchen closes at 22:30. Sunday brunch available.", "π.χ. Η κουζίνα κλείνει στις 22:30.")}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 2: SİPARİŞ VE SERVİS MODLARI */}
      {activeSubTab === "table_order" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
              {txt("Masadan Sipariş & Servis Modları", "Table Ordering & Service Modes", "Λειτουργίες Παραγγελίας")}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Table Ordering */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{txt("Masadan Sipariş", "Table Order", "Παραγγελία")}</span>
                  <input
                    type="checkbox"
                    checked={horecaConfig.allow_table_orders}
                    onChange={(e) => updateHorecaConfig({ allow_table_orders: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Müşteri sepete ekleyip sipariş gönderebilir.
                </p>
              </div>

              {/* Waiter Call */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{txt("Garson Çağırma", "Call Waiter", "Κλήση")}</span>
                  <input
                    type="checkbox"
                    checked={horecaConfig.allow_waiter_call}
                    onChange={(e) => updateHorecaConfig({ allow_waiter_call: e.target.checked })}
                    className="w-4 h-4 cursor-pointer accent-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Tek tıkla garson ve hesap bildirimleri.
                </p>
              </div>

              {/* Prep Time */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">{txt("Hazırlık Süresi", "Prep Time", "Χρόνος")}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={horecaConfig.estimated_prep_time}
                    onChange={(e) => updateHorecaConfig({ estimated_prep_time: e.target.value })}
                    placeholder="15-20"
                    className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-extrabold text-slate-900 text-center"
                  />
                  <span className="text-[10px] text-slate-500 font-bold">dakika</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" /> Alerjen Gösterimi
                </span>
                <input
                  type="checkbox"
                  checked={horecaConfig.show_allergens}
                  onChange={(e) => updateHorecaConfig({ show_allergens: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-slate-500" /> Kalori Bilgisi
                </span>
                <input
                  type="checkbox"
                  checked={horecaConfig.show_calories}
                  onChange={(e) => updateHorecaConfig({ show_calories: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 3: WI-FI AYARLARI */}
      {activeSubTab === "wifi" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              {txt("Müşteri Wi-Fi Paylaşım Ayarları", "Guest Wi-Fi Settings", "Ρυθμίσεις Wi-Fi")}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Wi-Fi Ağ Adı (SSID)
                </label>
                <input
                  type="text"
                  value={horecaConfig.wifi_ssid}
                  onChange={(e) => updateHorecaConfig({ wifi_ssid: e.target.value })}
                  placeholder="Bistro_Wifi"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Wi-Fi Şifresi
                </label>
                <input
                  type="text"
                  value={horecaConfig.wifi_password}
                  onChange={(e) => updateHorecaConfig({ wifi_password: e.target.value })}
                  placeholder="Şifre..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 4: MASA QR KODLARI */}
      {activeSubTab === "tables_qr" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                {txt("Masa QR Bağlantıları", "Table QR Links", "Κωδικοί QR")}
              </span>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-500">Toplam Masa:</label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={horecaConfig.table_count}
                  onChange={(e) => updateHorecaConfig({ table_count: parseInt(e.target.value) || 12 })}
                  className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center text-slate-900 focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {Array.from({ length: horecaConfig.table_count || 12 }, (_, i) => i + 1).map((tableNum) => {
                const tableUrl = `${window.location.origin}/digital-menu/${currentStoreTargetId}/${tableNum}`;
                return (
                  <a
                    key={tableNum}
                    href={tableUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col items-center justify-center text-center gap-1"
                  >
                    <span className="text-xs font-black text-slate-900">M{tableNum}</span>
                    <span className="text-[9px] text-slate-500 font-bold flex items-center gap-0.5 hover:text-emerald-600">
                      <Eye className="w-2.5 h-2.5" /> Test
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBTAB 5: INSTAGRAM AKIŞI */}
      {activeSubTab === "instagram" && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 md:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-rose-500" />
                Instagram Profil & Akış
              </span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding?.instagram_feed_enabled !== false}
                  onChange={(e) => onBrandingChange("instagram_feed_enabled", e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-100 border-slate-300 text-rose-500 accent-rose-500"
                />
                <span className="text-[10px] font-bold text-slate-700">Web Sitemde Göster</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Kullanıcı Adı (@)
                </label>
                <input
                  type="text"
                  placeholder="kullaniciadi"
                  value={(branding?.instagram_username || "").replace(/^@/, "")}
                  onChange={(e) => onBrandingChange("instagram_username", e.target.value.trim().replace(/^@/, ""))}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                  Instagram Profil Linki
                </label>
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={branding?.instagram_url || ""}
                  onChange={(e) => onBrandingChange("instagram_url", e.target.value.trim())}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HorecaThemeStudio;
