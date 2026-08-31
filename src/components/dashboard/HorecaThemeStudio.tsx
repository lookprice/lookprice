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
  Coffee,
  Wine,
  Save,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Eye,
  Check,
  Download,
  Share2,
  Sliders,
  Layers,
  ChefHat
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
  const [activeSubTab, setActiveSubTab] = useState<"visual" | "table_order" | "wifi" | "tables_qr">("visual");

  const txt = (tr: string, en: string, el: string) => {
    if (lang === "tr") return tr;
    if (lang === "el") return el;
    return en;
  };

  // Safe reading of digital menu settings
  const horecaConfig = useMemo(() => {
    const raw = branding?.digital_menu_settings || branding?.page_layout_settings?.digital_menu_settings || {};
    return {
      theme: raw.theme || "modern_light", // modern_light | dark_bistro | warm_amber | fresh_emerald
      menu_title: raw.menu_title || branding?.hero_title || (lang === "tr" ? "Lezzet Dolu Bir Deneyim" : "A Tasteful Experience"),
      menu_subtitle: raw.menu_subtitle || branding?.hero_subtitle || (lang === "tr" ? "Özenle seçilmiş taze malzemelerle hazırlanan lezzetlerimizi keşfedin." : "Explore our culinary delights crafted with the finest ingredients."),
      allow_table_orders: raw.allow_table_orders !== false, // default true
      allow_waiter_call: raw.allow_waiter_call !== false, // default true
      allow_bill_request: raw.allow_bill_request !== false, // default true
      show_allergens: raw.show_allergens !== false, // default true
      show_calories: raw.show_calories !== false, // default true
      estimated_prep_time: raw.estimated_prep_time || "15-20",
      wifi_ssid: raw.wifi_ssid || branding?.wifi_ssid || "",
      wifi_password: raw.wifi_password || branding?.wifi_password || "",
      table_count: branding?.page_layout_settings?.table_count || raw.table_count || 12,
      cover_image: raw.cover_image || branding?.hero_image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
    };
  }, [branding?.digital_menu_settings, branding?.page_layout_settings, branding?.hero_title, branding?.hero_subtitle, branding?.hero_image_url, branding?.wifi_ssid, branding?.wifi_password, lang]);

  const updateHorecaConfig = (updates: Partial<typeof horecaConfig>) => {
    const updated = { ...horecaConfig, ...updates };
    onBrandingChange("digital_menu_settings", updated);
    
    // Also sync relevant root fields for compatibility
    if (updates.menu_title !== undefined) {
      onBrandingChange("hero_title", updates.menu_title);
    }
    if (updates.menu_subtitle !== undefined) {
      onBrandingChange("hero_subtitle", updates.menu_subtitle);
    }
    if (updates.cover_image !== undefined) {
      onBrandingChange("hero_image_url", updates.cover_image);
    }
    if (updates.wifi_ssid !== undefined) {
      onBrandingChange("wifi_ssid", updates.wifi_ssid);
    }
    if (updates.wifi_password !== undefined) {
      onBrandingChange("wifi_password", updates.wifi_password);
    }
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
      desc: txt("Beyaz ve açık gri tonlarında pürüzsüz, minimalist menü.", "Smooth minimalist menu with crisp white & subtle slate.", "Μινιμαλιστικό μενού σε λευκούς τόνους."),
      bgPreview: "bg-white border-slate-200 text-slate-900",
      accent: "bg-amber-500",
      tag: "Popüler"
    },
    {
      id: "dark_bistro",
      name: txt("Koyu Gurme & Bistro", "Dark Bistro & Luxury Lounge", "Σκοτεινό Μπιστρό"),
      desc: txt("Siyah ve antrasit arka plan, altın sarısı şık vurgular.", "Deep black & charcoal tones with warm golden highlights.", "Αριστοκρατικό μαύρο φόντο με χρυσές λεπτομέρειες."),
      bgPreview: "bg-slate-950 border-slate-800 text-white",
      accent: "bg-amber-400",
      tag: "Fine Dining"
    },
    {
      id: "warm_amber",
      name: txt("Sıcak Ahşap & Kahve", "Warm Amber & Rustic Cafe", "Ζεστό Καφέ"),
      desc: txt("Sıcak amber, kahve tonları ve samimi kafe atmosferi.", "Cozy amber, roasted coffee tones with artisanal vibes.", "Ζεστό κεχριμπάρι και τόνοι καβουρδισμένου καφέ."),
      bgPreview: "bg-amber-950 border-amber-800 text-amber-50",
      accent: "bg-amber-600",
      tag: "Kafe & Bakery"
    },
    {
      id: "fresh_emerald",
      name: txt("Taze Yeşil & Botanik", "Fresh Botanical & Green", "Φρέσκο Βοτανικό"),
      desc: txt("Organik, sağlıklı ve ferah zümrüt yeşili konsept.", "Organic, crisp emerald green for wholesome dining.", "Οργανικό σμαραγδί για υγιεινή διατροφή."),
      bgPreview: "bg-emerald-950 border-emerald-800 text-emerald-50",
      accent: "bg-emerald-500",
      tag: "Sağlıklı / Vegan"
    }
  ];

  const currentStoreTargetId = storeId || branding?.id || branding?.slug || "";
  const publicMenuUrl = `${window.location.origin}/digital-menu/${currentStoreTargetId}`;
  const waiterUrl = `${window.location.origin}/digital-menu/${currentStoreTargetId}/garson`;

  return (
    <div className="space-y-6">
      {/* Studio Header & Live Status */}
      <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6 md:p-8 rounded-[2.5rem] border border-amber-500/20 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <ChefHat className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HoReCaLP
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {txt("Dijital QR Menü Stüdyosu", "Digital QR Menu Studio", "Στούντιο Ψηφιακού Μενού")}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mt-1">
                {branding?.store_name || branding?.name || txt("Restoran & Kafe Menüsü", "Restaurant & Cafe Menu", "Μενού Εστιατορίου")}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={publicMenuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/15"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>{txt("Menüyü Canlı Aç", "Open Live Menu", "Άνοιγμα Μενού")}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>

            <a
              href={waiterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Bell className="w-4 h-4" />
              <span>{txt("Garson Paneli", "Waiter Screen", "Οθόνη Σερβιτόρου")}</span>
            </a>

            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? txt("Kaydediliyor...", "Saving...", "Αποθήκευση...") : txt("Değişiklikleri Kaydet", "Save Changes", "Αποθήκευση")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveSubTab("visual")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === "visual"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{txt("Görsel Tema & Başlıklar", "Visual Theme & Headings", "Οπτικό Θέμα & Επικεφαλίδες")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("table_order")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === "table_order"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>{txt("Masadan Sipariş & Servis", "Table Ordering & Service", "Παραγγελίες Τραπεζιού")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("wifi")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === "wifi"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>{txt("Müşteri Wi-Fi Paylaşımı", "Customer Wi-Fi Sharing", "Κοινή Χρήση Wi-Fi")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("tables_qr")}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === "tables_qr"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>{txt("Masa QR Kodları", "Table QR Codes", "Κωδικοί QR Τραπεζιών")}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Visual Themes & Cover Header */}
      {activeSubTab === "visual" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Preset Theme Selection Cards */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                  {txt("QR Menü Görsel Tasarım Teması", "QR Menu Visual Theme", "Οπτικό Θέμα Μενού")}
                </h3>
                <p className="text-xs text-slate-500">
                  {txt("Müşterilerinizin telefonunda açılacak QR menünün renk paleti ve ambiyansı.", "The color palette and ambiance of your QR menu on customer devices.", "Η χρωματική παλέτα του μενού στις συσκευές των πελατών.")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {THEMES.map((theme) => {
                const isSelected = horecaConfig.theme === theme.id;
                return (
                  <div
                    key={theme.id}
                    onClick={() => updateHorecaConfig({ theme: theme.id })}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/20 shadow-lg shadow-amber-500/10"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 rounded-md">
                        {theme.tag}
                      </span>
                      {isSelected && (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mb-4">
                      <h4 className="font-extrabold text-sm text-slate-900">{theme.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{theme.desc}</p>
                    </div>

                    {/* Visual Miniature Preview */}
                    <div className={`w-full h-12 rounded-xl border p-2 flex items-center justify-between ${theme.bgPreview}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${theme.accent}`} />
                        <div className="w-16 h-2 rounded bg-current opacity-30" />
                      </div>
                      <div className="w-10 h-3 rounded-full bg-current opacity-20" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Menu Title, Slogan and Cover Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-500" />
                {txt("Karşılama Başlığı ve Slogan", "Welcome Title & Slogan", "Τίτλος Υποδοχής & Σλόγκαν")}
              </h3>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  {txt("Menü Karşılama Başlığı", "Menu Welcome Heading", "Επικεφαλίδα Μενού")}
                </label>
                <input
                  type="text"
                  value={horecaConfig.menu_title}
                  onChange={(e) => updateHorecaConfig({ menu_title: e.target.value })}
                  placeholder={txt("Örn: Gurme Lezzetler & Keyifli Anlar", "e.g. Gourmet Flavors & Cozy Moments", "π.χ. Γκουρμέ Γεύσεις")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  {txt("Alt Açıklama / Slogan", "Subtitle / Description", "Υπότιτλος")}
                </label>
                <textarea
                  rows={3}
                  value={horecaConfig.menu_subtitle}
                  onChange={(e) => updateHorecaConfig({ menu_subtitle: e.target.value })}
                  placeholder={txt("Usta şeflerimizin özenle hazırladığı taze lezzetleri keşfedin...", "Explore fresh dishes masterfully crafted by our chefs...", "Ανακαλύψτε τις γεύσεις των σεφ μας...")}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all resize-none"
                />
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                {txt("Menü Kapak / Arka Plan Görseli", "Menu Cover Image", "Εικόνα Εξωφύλλου")}
              </h3>

              <div className="space-y-3">
                <div className="w-full h-36 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100">
                  <img
                    src={horecaConfig.cover_image}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-4">
                    <p className="text-white text-xs font-extrabold truncate">
                      {horecaConfig.menu_title}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                    {txt("Görsel URL Adresi", "Image URL", "URL Εικόνας")}
                  </label>
                  <input
                    type="text"
                    value={horecaConfig.cover_image}
                    onChange={(e) => updateHorecaConfig({ cover_image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Table Ordering, Waiter Call & Badges */}
      {activeSubTab === "table_order" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                  {txt("Masadan Sipariş & Servis Modları", "Table Ordering & Service Modes", "Λειτουργίες Παραγγελίας")}
                </h3>
                <p className="text-xs text-slate-500">
                  {txt("Müşterilerinizin QR menüden verebileceği aksiyonları ve servis bildirimlerini yapılandırın.", "Configure interactive actions and alerts available to customers from their phone.", "Διαμορφώστε τις επιλογές παραγγελίας των πελατών.")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Allow Table Orders */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                      <UtensilsCrossed className="w-4 h-4" />
                    </span>
                    <input
                      type="checkbox"
                      checked={horecaConfig.allow_table_orders}
                      onChange={(e) => updateHorecaConfig({ allow_table_orders: e.target.checked })}
                      className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                  <h4 className="font-black text-sm text-slate-900">{txt("Masadan Sipariş Verme", "Table Ordering", "Παραγγελία από Τραπέζι")}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {txt("Açık olduğunda müşteri masadan sepet oluşturup doğrudan mutfağa sipariş gönderebilir.", "Allows customers to build a basket and send orders straight to the kitchen.", "Επιτρέπει την αποστολή παραγγελιών στην κουζίνα.")}
                  </p>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                  {horecaConfig.allow_table_orders ? txt("✓ Aktif (Sipariş Açık)", "✓ Active", "✓ Ενεργό") : txt("✕ Pasif (Sadece Katalog)", "✕ View Only", "✕ Ανενεργό")}
                </div>
              </div>

              {/* Allow Waiter Call */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                      <Bell className="w-4 h-4" />
                    </span>
                    <input
                      type="checkbox"
                      checked={horecaConfig.allow_waiter_call}
                      onChange={(e) => updateHorecaConfig({ allow_waiter_call: e.target.checked })}
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                  <h4 className="font-black text-sm text-slate-900">{txt("Garson Çağırma Butonu", "Call Waiter Button", "Κουμπί Σερβιτόρου")}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {txt("Müşteri telefonundan tek dokunuşla 'Garson Çağır' veya 'Hesap İste' bildirimi gönderebilir.", "Enables instant one-tap 'Call Waiter' or 'Request Bill' alerts.", "Επιτρέπει την κλήση σερβιτόρου με ένα άγγιγμα.")}
                  </p>
                </div>
                <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                  {horecaConfig.allow_waiter_call ? txt("✓ Aktif", "✓ Active", "✓ Ενεργό") : txt("✕ Pasif", "✕ Disabled", "✕ Ανενεργό")}
                </div>
              </div>

              {/* Prep Time */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-slate-900">{txt("Ortalama Hazırlık Süresi", "Average Prep Time", "Χρόνος Προετοιμασίας")}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {txt("Müşterinin menü üst kısmında göreceği tahmini servis süresi (dk).", "Estimated prep duration shown on the digital menu header.", "Εκτιμώμενος χρόνος σερβιρίσματος.")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={horecaConfig.estimated_prep_time}
                    onChange={(e) => updateHorecaConfig({ estimated_prep_time: e.target.value })}
                    placeholder="15-20"
                    className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 text-center"
                  />
                  <span className="text-xs font-bold text-slate-500">{txt("dakika", "mins", "λεπτά")}</span>
                </div>
              </div>
            </div>

            {/* Badges and Diet Filters */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <div>
                    <h5 className="text-xs font-black text-slate-900">{txt("Alerjen Rozetleri Gösterimi", "Show Allergen Badges", "Εμφάνιση Αλλεργιογόνων")}</h5>
                    <p className="text-[11px] text-slate-500">{txt("Gluten, laktoz, fındık vb. alerjen uyarılarını ürün kartında göster.", "Display gluten, dairy, nuts alerts on product cards.", "Εμφάνιση ειδοποιήσεων αλλεργιογόνων.")}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={horecaConfig.show_allergens}
                  onChange={(e) => updateHorecaConfig({ show_allergens: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-rose-500" />
                  <div>
                    <h5 className="text-xs font-black text-slate-900">{txt("Kalori & Besin Bilgisi", "Show Calories / Nutrition", "Θερμίδες & Διατροφή")}</h5>
                    <p className="text-[11px] text-slate-500">{txt("Ürünlerde tanımlı kcal ve gramaj bilgilerini göster.", "Display kcal and portion weights when available.", "Εμφάνιση θερμίδων και μερίδων.")}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={horecaConfig.show_calories}
                  onChange={(e) => updateHorecaConfig({ show_calories: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 3: Customer Wi-Fi Info */}
      {activeSubTab === "wifi" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                  {txt("Müşteri Wi-Fi Paylaşım Ayarları", "Guest Wi-Fi Sharing Settings", "Ρυθμίσεις Wi-Fi Επισκεπτών")}
                </h3>
                <p className="text-xs text-slate-500">
                  {txt("Müşterilerinizin QR menü içerisinden tek tıkla mekanın Wi-Fi ağına bağlanmasını sağlayın.", "Enable guest customers to view or copy Wi-Fi credentials with a single tap.", "Επιτρέψτε στους πελάτες να συνδέονται εύκολα στο Wi-Fi.")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  {txt("Wi-Fi Ağ Adı (SSID)", "Wi-Fi Network Name (SSID)", "Όνομα Δικτύου Wi-Fi")}
                </label>
                <input
                  type="text"
                  value={horecaConfig.wifi_ssid}
                  onChange={(e) => updateHorecaConfig({ wifi_ssid: e.target.value })}
                  placeholder={txt("Örn: Bistro_Guest_Wifi", "e.g. Bistro_Guest_Wifi", "π.χ. Bistro_Guest_Wifi")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                  {txt("Wi-Fi Şifresi", "Wi-Fi Password", "Κωδικός Wi-Fi")}
                </label>
                <input
                  type="text"
                  value={horecaConfig.wifi_password}
                  onChange={(e) => updateHorecaConfig({ wifi_password: e.target.value })}
                  placeholder={txt("Şifresiz ise boş bırakın", "Leave empty if open", "Αφήστε κενό αν είναι ανοιχτό")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
                />
              </div>
            </div>

            {horecaConfig.wifi_ssid && (
              <div className="mt-6 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-indigo-950">
                      {txt("QR Menüde Görünecek Wi-Fi Rozeti:", "Wi-Fi Badge Shown on QR Menu:", "Κονκάρδα Wi-Fi στο Μενού:")}
                    </p>
                    <p className="text-[11px] text-indigo-700 font-mono">
                      SSID: <span className="font-bold">{horecaConfig.wifi_ssid}</span> | Şifre: <span className="font-bold">{horecaConfig.wifi_password || "(Şifresiz)"}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 4: Table QR Codes & Fast Links */}
      {activeSubTab === "tables_qr" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                    {txt("Masa Bazlı QR Kodlar & Hızlı Bağlantılar", "Table Specific QR Codes & Links", "Κωδικοί QR Τραπεζιών")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {txt("Her masaya özel QR kod bağlantısı ile müşteriler doğrudan kendi masa numaralarıyla sipariş verir.", "Each table has a dedicated QR code directly identifying the table number.", "Κάθε τραπέζι έχει μοναδικό QR κωδικό.")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500">{txt("Toplam Masa:", "Total Tables:", "Σύνολο:")}</label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={horecaConfig.table_count}
                  onChange={(e) => updateHorecaConfig({ table_count: parseInt(e.target.value) || 12 })}
                  className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center"
                />
              </div>
            </div>

            {/* General Direct QR Menu Link */}
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                  {txt("Genel QR Menü Bağlantısı (Masa Seçimsiz)", "General QR Menu Link (No Table Preselected)", "Γενικός Σύνδεσμος Μενού")}
                </span>
                <p className="text-xs font-mono font-bold text-slate-900 break-all">
                  {publicMenuUrl}
                </p>
              </div>
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{txt("Menüyü Test Et", "Test Menu", "Δοκιμή")}</span>
              </a>
            </div>

            {/* Table QR Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: horecaConfig.table_count || 12 }, (_, i) => i + 1).map((tableNum) => {
                const tableUrl = `${window.location.origin}/digital-menu/${currentStoreTargetId}/${tableNum}`;
                return (
                  <div
                    key={tableNum}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col items-center justify-between text-center space-y-2 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                      M{tableNum}
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {txt(`Masa ${tableNum}`, `Table ${tableNum}`, `Τραπέζι ${tableNum}`)}
                    </span>
                    <a
                      href={tableUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-2 bg-white group-hover:bg-amber-50 text-slate-600 group-hover:text-amber-700 rounded-lg text-[10px] font-bold border border-slate-200 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{txt("Aç", "Open", "Άνοιγμα")}</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
