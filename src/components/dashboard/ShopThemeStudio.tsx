import React, { useState, useMemo } from "react";
import {
  Palette,
  Sparkles,
  Film,
  Sun,
  Moon,
  Flame,
  Star,
  Tag,
  SlidersHorizontal,
  Megaphone,
  Check,
  Eye,
  RefreshCw,
  Save,
  Layers,
  CheckCircle2,
  Zap,
  ShoppingBag,
  Clock,
  LayoutGrid
} from "lucide-react";
import { DEFAULT_SHOP_THEME, ShopThemeConfig, THEME_PRESETS } from "../../utils/shopThemePresets";

interface ShopThemeStudioProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
}

type StudioTab = "rows" | "hero" | "visuals" | "cards" | "announcement";

export const ShopThemeStudio: React.FC<ShopThemeStudioProps> = ({
  branding,
  onBrandingChange,
  lang,
  onSave,
  saving = false
}) => {
  const isTr = lang === "tr";
  const [activeTab, setActiveTab] = useState<StudioTab>("rows");

  // Read current netflixConfig safely
  const netflixConfig = useMemo(() => {
    const raw = branding?.netflix_config || branding?.page_layout_settings?.netflix_config;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return (raw && typeof raw === "object") ? raw : {};
  }, [branding?.netflix_config, branding?.page_layout_settings?.netflix_config]);

  // Read current themeConfig safely
  const themeConfig: ShopThemeConfig = useMemo(() => {
    const raw = branding?.theme_config || branding?.page_layout_settings?.theme_config;
    if (typeof raw === "string") {
      try { return { ...DEFAULT_SHOP_THEME, ...JSON.parse(raw) }; } catch { return DEFAULT_SHOP_THEME; }
    } else if (raw && typeof raw === "object") {
      return { ...DEFAULT_SHOP_THEME, ...raw };
    }
    return DEFAULT_SHOP_THEME;
  }, [branding?.theme_config, branding?.page_layout_settings?.theme_config]);

  // Helper to update Netflix Configuration & persist to page_layout_settings
  const updateNetflixConfig = (updates: any) => {
    const merged = { ...netflixConfig, ...updates };
    onBrandingChange("netflix_config", merged);
    
    const curLayout = branding?.page_layout_settings || {};
    onBrandingChange("page_layout_settings", {
      ...curLayout,
      netflix_config: merged,
      theme_default: merged.theme_mode || curLayout.theme_default,
      theme_mode: merged.theme_mode || curLayout.theme_mode,
      show_hero_banner: merged.hero_enabled !== false,
      show_announcement_bar: merged.show_announcement_bar,
      announcement_bar: merged.show_announcement_bar,
      announcement_text: merged.announcement_text
    });

    if (updates.show_announcement_bar !== undefined) {
      onBrandingChange("show_announcement_bar", updates.show_announcement_bar);
    }
    if (updates.announcement_text !== undefined) {
      onBrandingChange("announcement_text", updates.announcement_text);
    }
    if (updates.theme_mode !== undefined) {
      onBrandingChange("theme_mode", updates.theme_mode);
    }
    if (updates.primary_color !== undefined) {
      onBrandingChange("primary_color", updates.primary_color);
    }
    if (updates.accent_color !== undefined) {
      onBrandingChange("accent_color", updates.accent_color);
    }
  };

  // Helper for applying curated Netflix style presets
  const handleApplyNetflixPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      const netflixUpdates: any = {
        theme_mode: preset.netflix_theme_mode || (preset.background_mode === "dark" ? "dark" : "light"),
        hero_enabled: true,
        hero_autoplay_interval: preset.netflix_hero_timer || 6,
        hero_glow_effect: preset.netflix_hero_glow !== false,
        card_density: preset.netflix_card_density || "standard",
        enable_hover_zoom: true,
        show_quick_add_cart: true,
        show_stock_badge: true,
        show_old_price: true,
        show_bestsellers_row: preset.netflix_show_bestsellers !== false,
        show_featured_row: preset.netflix_show_featured !== false,
        show_discounted_row: preset.netflix_show_discounted !== false,
        show_new_arrivals_row: preset.netflix_show_new_arrivals !== false,
        primary_color: preset.primary_color,
        accent_color: preset.accent_color
      };
      updateNetflixConfig(netflixUpdates);
      onBrandingChange("primary_color", preset.primary_color);
      onBrandingChange("accent_color", preset.accent_color);
    }
  };

  return (
    <div className="space-y-3">
      {/* Studio Header & Sub-Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {isTr ? "Yeni Nesil Vitrin & Görsel Tasarım Stüdyosu" : "Next-Gen Visual Theme Studio"}
                </h2>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Netflix Modu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                {isTr
                  ? "Sinematik ürün vitrini, yatay karuseller, aydınlatma modları ve alışveriş deneyimi kontrolleri."
                  : "Cinematic product showcase, horizontal carousels, lighting modes and shopping experience controls."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isTr ? "Değişiklikleri Kaydet" : "Save Changes"}</span>
              </button>
            )}
            <a
              href={`/s/${branding?.slug || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{isTr ? "Canlı Vitrini Aç" : "Live Store"}</span>
            </a>
          </div>
        </div>

        {/* Compact Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { id: "rows", label: isTr ? "Vitrin Karuselleri" : "Showcase Rows", icon: <Film className="w-3.5 h-3.5 text-blue-500" /> },
            { id: "hero", label: isTr ? "Sinematik Hero" : "Cinematic Hero", icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
            { id: "visuals", label: isTr ? "Tema & Renkler" : "Theme & Colors", icon: <Palette className="w-3.5 h-3.5 text-indigo-500" /> },
            { id: "cards", label: isTr ? "Ürün Kartı & Sepet" : "Cards & Shopping", icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" /> },
            { id: "announcement", label: isTr ? "Duyuru Çubuğu" : "Announcement Bar", icon: <Megaphone className="w-3.5 h-3.5 text-rose-500" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as StudioTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VİTRİN KARUSELLERİ & SIRALAMA (ROWS)                               */}
      {/* ========================================================================= */}
      {activeTab === "rows" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{isTr ? "Netflix Yatay Karusel Sıraları" : "Netflix Horizontal Showcase Rows"}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {isTr
                    ? "Ana sayfada alt alta dizilen Netflix tarzı yatay kaydırmalı ürün bantlarının başlıklarını ve görünürlüklerini özelleştirin."
                    : "Customize the titles and visibility of Netflix-style horizontal product rows on your homepage."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Row 1: Bestsellers */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {isTr ? "Çok Satanlar & Popüler Ürünler Sırası" : "Bestsellers & Popular Row"}
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      {isTr ? "En çok satan ve talep gören ürünleri ilk sırada sergiler." : "Displays top-selling and trending products."}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="🔥 Çok Satanlar & Popüler Ürünler"
                    value={netflixConfig.bestsellers_title || ""}
                    onChange={(e) => updateNetflixConfig({ bestsellers_title: e.target.value })}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white w-56 outline-none focus:border-blue-500"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={netflixConfig.show_bestsellers_row !== false}
                      onChange={(e) => updateNetflixConfig({ show_bestsellers_row: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{isTr ? "Aktif" : "Active"}</span>
                  </label>
                </div>
              </div>

              {/* Row 2: Featured Collection */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {isTr ? "Öne Çıkan Koleksiyon Sırası" : "Featured Collection Row"}
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      {isTr ? "Öne çıkan etiketi taşıyan veya vitrinde vurgulanan ürünler." : "Products marked as featured or spotlighted."}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="⭐ Öne Çıkan Koleksiyon"
                    value={netflixConfig.featured_title || ""}
                    onChange={(e) => updateNetflixConfig({ featured_title: e.target.value })}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white w-56 outline-none focus:border-blue-500"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={netflixConfig.show_featured_row !== false}
                      onChange={(e) => updateNetflixConfig({ show_featured_row: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{isTr ? "Aktif" : "Active"}</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Deals & Discounts */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {isTr ? "Fırsatlar & Kampanyalı Ürünler Sırası" : "Deals & Discounts Row"}
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      {isTr ? "İndirimli veya eski fiyatı olan kampanyalı ürünler." : "Discounted items and special promotion offers."}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="🏷️ Fırsatlar & Kampanyalı Ürünler"
                    value={netflixConfig.discounted_title || ""}
                    onChange={(e) => updateNetflixConfig({ discounted_title: e.target.value })}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white w-56 outline-none focus:border-blue-500"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={netflixConfig.show_discounted_row !== false}
                      onChange={(e) => updateNetflixConfig({ show_discounted_row: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{isTr ? "Aktif" : "Active"}</span>
                  </label>
                </div>
              </div>

              {/* Row 4: New Arrivals */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {isTr ? "Yeni Gelen Ürünler Sırası" : "New Arrivals Row"}
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      {isTr ? "En son eklenen yeni ürünleri vitrinde sergiler." : "Displays recently added catalog items."}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="✨ Yeni Gelen Ürünler"
                    value={netflixConfig.new_arrivals_title || ""}
                    onChange={(e) => updateNetflixConfig({ new_arrivals_title: e.target.value })}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white w-56 outline-none focus:border-blue-500"
                  />
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={netflixConfig.show_new_arrivals_row !== false}
                      onChange={(e) => updateNetflixConfig({ show_new_arrivals_row: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{isTr ? "Aktif" : "Active"}</span>
                  </label>
                </div>
              </div>

              {/* Row 5: Dynamic Category Rows */}
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {isTr ? "Otomatik Kategori Sıraları" : "Automatic Category Rows"}
                    </span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                      {isTr ? "Mağazanızdaki her ana kategori için ana sayfada otomatik yatay karusel bandı açar." : "Creates separate horizontal rows for each main product category."}
                    </span>
                  </div>
                </div>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={netflixConfig.show_category_rows !== false}
                    onChange={(e) => updateNetflixConfig({ show_category_rows: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{isTr ? "Kategori Sıraları Aktif" : "Active"}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SİNEMATİK HERO VİTRİNİ (HERO)                                     */}
      {/* ========================================================================= */}
      {activeTab === "hero" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isTr ? "Netflix Sinematik Hero Vitrini" : "Netflix Cinematic Hero Showcase"}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {isTr
                    ? "Ana sayfanın üstünde yer alan, dinamik ve akıcı slayt geçişli ürün manşetini yapılandırın."
                    : "Configure the top dynamic cinematic product carousel and subtitle policy."}
                </p>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={netflixConfig.hero_enabled !== false}
                  onChange={(e) => updateNetflixConfig({ hero_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-800 dark:text-white">{isTr ? "Hero Vitrini Aktif" : "Hero Active"}</span>
              </label>
            </div>

            {netflixConfig.hero_enabled !== false && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isTr ? "Otomatik Slayt Geçiş Süresi" : "Autoplay Slide Interval"}</span>
                    </label>
                    <select
                      value={netflixConfig.hero_autoplay_interval || 6}
                      onChange={(e) => updateNetflixConfig({ hero_autoplay_interval: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value={4}>{isTr ? "4 Saniyede Bir Otomatik Geç" : "4 Seconds (Fast)"}</option>
                      <option value={6}>{isTr ? "6 Saniyede Bir Otomatik Geç (Önerilen)" : "6 Seconds (Recommended)"}</option>
                      <option value={8}>{isTr ? "8 Saniyede Bir Otomatik Geç" : "8 Seconds (Relaxed)"}</option>
                      <option value={10}>{isTr ? "10 Saniyede Bir Otomatik Geç" : "10 Seconds"}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isTr ? "Hero Vurgu Rozetleri" : "Hero Highlight Badges"}</span>
                    </label>
                    <div className="flex items-center h-10 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={netflixConfig.show_hero_badges !== false}
                          onChange={(e) => updateNetflixConfig({ show_hero_badges: e.target.checked })}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isTr ? "Öne Çıkan, Çok Satan rozetlerini göster" : "Show Featured & Bestseller badges"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Slogan / Fallback Description Policy */}
                <div className="space-y-1.5 p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {isTr ? "Açıklamasız Ürünler İçin Kurumsal Slogan (Opsiyonel)" : "Fallback Slogan for Products Without Description"}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">{isTr ? "İsteğe Bağlı" : "Optional"}</span>
                  </div>
                  <input
                    type="text"
                    value={netflixConfig.hero_default_description || ""}
                    onChange={(e) => updateNetflixConfig({ hero_default_description: e.target.value })}
                    placeholder={isTr ? "Boş bırakılırsa sadece ürün detayları gösterilir (yapay metin üretilmez)" : "Leave blank to display pure product info"}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                    {isTr
                      ? "💡 Ürünün kendi orijinal açıklaması yoksa burada yazdığınız kurumsal karşılama gösterilir. Boş bırakırsanız hiçbir yapay veya uyumsuz pazarlama cümlesi eklenmez."
                      : "💡 When a product lacks its own description, your custom store slogan will appear. If left empty, clean details are displayed without synthetic marketing text."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEMA MODU & RENKLER (VISUALS)                                      */}
      {/* ========================================================================= */}
      {activeTab === "visuals" && (
        <div className="space-y-3">
          {/* Lighting Mode */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>{isTr ? "Aydınlatma & Tema Modu (Açık / Koyu Zemin)" : "Lighting & Theme Mode"}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {isTr
                    ? "Gap Bilişim gibi beyaz ürün arka planına sahip teknoloji mağazaları için Açık Mod önerilir."
                    : "Light Mode is recommended for stores with white background product photos."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => updateNetflixConfig({ theme_mode: "light" })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  netflixConfig.theme_mode === "light"
                    ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/20 shadow-xs dark:bg-amber-950/40 dark:border-amber-500"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>{isTr ? "Açık Mod (Light)" : "Light Mode"}</span>
                  </span>
                  {netflixConfig.theme_mode === "light" && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isTr
                    ? "Temiz beyaz zemin, yüksek kontrast. Beyaz arkaplanlı ürün fotoğraflarıyla kristal netliğinde uyum sağlar."
                    : "Clean light background. Seamless fit for white-backdrop product catalogs."}
                </p>
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => updateNetflixConfig({ theme_mode: "dark" })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  netflixConfig.theme_mode === "dark" || !netflixConfig.theme_mode
                    ? "bg-slate-900 text-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs dark:bg-slate-950"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-blue-400" />
                    <span>{isTr ? "Koyu Mod (Dark Sinematik)" : "Dark Mode"}</span>
                  </span>
                  {(netflixConfig.theme_mode === "dark" || !netflixConfig.theme_mode) && (
                    <Check className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 leading-relaxed">
                  {isTr
                    ? "Netflix sinematik gece ambiyansı, antrasit zemin ve neon ışıltılı odak noktaları."
                    : "Cinematic night ambiance with deep dark background and neon glows."}
                </p>
              </button>

              {/* Auto Mode */}
              <button
                type="button"
                onClick={() => updateNetflixConfig({ theme_mode: "auto" })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  netflixConfig.theme_mode === "auto"
                    ? "bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/20 shadow-xs dark:bg-indigo-950/40 dark:border-indigo-500"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-indigo-500" />
                    <span>{isTr ? "Sistem / Otomatik (Auto)" : "System Auto"}</span>
                  </span>
                  {netflixConfig.theme_mode === "auto" && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isTr
                    ? "Müşterinin telefon veya bilgisayar işletim sistemi tema tercihiyle tam otomatik senkronize çalışır."
                    : "Automatically syncs with visitor's operating system preferences."}
                </p>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={netflixConfig.show_theme_toggle !== false}
                  onChange={(e) => updateNetflixConfig({ show_theme_toggle: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isTr ? "Web Vitrininde Ziyaretçi Tema Değiştirme (Güneş / Ay) Butonunu Göster" : "Show Theme Toggle (Sun/Moon) on Storefront"}
                </span>
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {isTr ? "Ziyaretçiler tek tıkla açık/koyu mod geçişi yapabilir." : "Visitors can toggle dark/light mode with 1-click."}
              </span>
            </div>
          </div>

          {/* Curated Netflix Style Presets */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <span>{isTr ? "Hazır Netflix Stil & Renk Paketleri" : "Netflix Curated Color Presets"}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {isTr ? "Sektörünüze uygun sinematik paleti tek tıkla vitrininize uygulayın." : "Apply ready-to-use color schemes with 1-click."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "netflix_cyber_blue", title: "Netflix Siber Mavi", desc: "Bilişim & Teknoloji", dot1: "#0f172a", dot2: "#3b82f6" },
                { id: "netflix_luxury_gold", title: "Netflix Asil Altın", desc: "Lüks & Premium Takı", dot1: "#0f172a", dot2: "#f59e0b" },
                { id: "netflix_original", title: "Netflix Orijinal Kırmızı", desc: "Moda, Trend & Dinamik", dot1: "#0f172a", dot2: "#e50914" },
                { id: "netflix_minimal_light", title: "Netflix Minimal Açık", desc: "Temiz Aydınlık Zemin", dot1: "#ffffff", dot2: "#4f46e5" },
              ].map((p) => {
                const isSelected = netflixConfig.accent_color === p.dot2;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyNetflixPreset(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? "ring-2 ring-blue-500 border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: p.dot1 }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: p.dot2 }} />
                      </div>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8.5px] font-black uppercase tracking-wider flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          Aktif
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{p.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {isTr ? "Vurgu (Aksan) Rengi" : "Accent Color"}
                </label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
                  <input
                    type="color"
                    value={netflixConfig.accent_color || branding?.accent_color || "#3b82f6"}
                    onChange={(e) => {
                      updateNetflixConfig({ accent_color: e.target.value });
                      onBrandingChange("accent_color", e.target.value);
                    }}
                    className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={netflixConfig.accent_color || branding?.accent_color || "#3b82f6"}
                    onChange={(e) => {
                      updateNetflixConfig({ accent_color: e.target.value });
                      onBrandingChange("accent_color", e.target.value);
                    }}
                    className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  {isTr ? "Ana Marka Rengi" : "Primary Brand Color"}
                </label>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5">
                  <input
                    type="color"
                    value={netflixConfig.primary_color || branding?.primary_color || "#0f172a"}
                    onChange={(e) => {
                      updateNetflixConfig({ primary_color: e.target.value });
                      onBrandingChange("primary_color", e.target.value);
                    }}
                    className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={netflixConfig.primary_color || branding?.primary_color || "#0f172a"}
                    onChange={(e) => {
                      updateNetflixConfig({ primary_color: e.target.value });
                      onBrandingChange("primary_color", e.target.value);
                    }}
                    className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ÜRÜN KARTLARI & SEPET ETKİLEŞİMİ (CARDS)                          */}
      {/* ========================================================================= */}
      {activeTab === "cards" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                  <span>{isTr ? "Ürün Kartları & Alışveriş Deneyimi" : "Product Cards & Shopping Experience"}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {isTr
                    ? "Karusellerde ve ürün kataloğunda kartların buton, rozet ve animasyon davranışlarını yönetin."
                    : "Configure button, badge, and hover animation behaviors across all product cards."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Hover Zoom */}
              <label className="flex items-center gap-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={netflixConfig.enable_hover_zoom !== false}
                  onChange={(e) => updateNetflixConfig({ enable_hover_zoom: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    {isTr ? "Netflix Hover Zoom Animasyonu" : "Netflix Hover Zoom Animation"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isTr ? "Fare ile kart üzerine gelindiğinde akıcı büyüme ve sinematik gölge efekti." : "Smooth card expansion on hover."}
                  </span>
                </div>
              </label>

              {/* Quick Add Cart */}
              <label className="flex items-center gap-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={netflixConfig.show_quick_add_cart !== false}
                  onChange={(e) => updateNetflixConfig({ show_quick_add_cart: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    {isTr ? "Hızlı 'Sepete Ekle' Butonu" : "Quick 'Add to Cart' Button"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isTr ? "Müşterilerin detay sayfasına girmeden tek tıkla sepete eklemesini sağlar." : "Allows 1-click cart addition directly on the card."}
                  </span>
                </div>
              </label>

              {/* Stock Badge */}
              <label className="flex items-center gap-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={netflixConfig.show_stock_badge !== false}
                  onChange={(e) => updateNetflixConfig({ show_stock_badge: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    {isTr ? "Stok Durumu & Adet Rozeti" : "Stock Status & Badge"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isTr ? "Stokta kalan adet veya 'Tükendi' ibaresini kart üzerinde gösterir." : "Displays remaining stock counts or sold out badge."}
                  </span>
                </div>
              </label>

              {/* Old Price Strikethrough */}
              <label className="flex items-center gap-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={netflixConfig.show_old_price !== false}
                  onChange={(e) => updateNetflixConfig({ show_old_price: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    {isTr ? "Eski Fiyat ve İndirim Vurgusu" : "Old Price Strikethrough"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isTr ? "İndirimli ürünlerde üstü çizili eski fiyatı ve kazancı sergiler." : "Displays original price with strikethrough."}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DUYURU ÇUBUĞU (ANNOUNCEMENT)                                       */}
      {/* ========================================================================= */}
      {activeTab === "announcement" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-rose-500" />
                  <span>{isTr ? "Üst Duyuru & Kampanya Bandı" : "Top Announcement Banner"}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {isTr
                    ? "Web sitenizin en üstünde ziyaretçileri karşılayan duyuru metnini yönetin."
                    : "Manage top banner message for special campaigns or free shipping notices."}
                </p>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={netflixConfig.show_announcement_bar !== false}
                  onChange={(e) => updateNetflixConfig({ show_announcement_bar: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs font-black text-slate-800 dark:text-white">{isTr ? "Duyuru Bandı Aktif" : "Banner Active"}</span>
              </label>
            </div>

            {netflixConfig.show_announcement_bar !== false && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {isTr ? "Duyuru / Kampanya Metni *" : "Announcement Text *"}
                  </label>
                  <input
                    type="text"
                    value={netflixConfig.announcement_text || branding?.announcement_text || ""}
                    onChange={(e) => updateNetflixConfig({ announcement_text: e.target.value })}
                    placeholder="Örn: 🚀 Tüm Türkiye'ye 1.000 TL Üzeri Ücretsiz Kargo & Hızlı Teslimat"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                {/* Live Preview of Announcement Bar */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                    {isTr ? "Canlı Görünüm Önizlemesi:" : "Live Preview:"}
                  </span>
                  <div
                    className="py-1.5 px-4 text-center text-xs font-bold text-white rounded-lg transition-all shadow-xs"
                    style={{ backgroundColor: netflixConfig.accent_color || branding?.accent_color || "#3b82f6" }}
                  >
                    {netflixConfig.announcement_text || branding?.announcement_text || "🚀 Tüm Türkiye'ye 1.000 TL Üzeri Ücretsiz Kargo & Hızlı Teslimat"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
