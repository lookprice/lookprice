import React, { useState, useMemo } from "react";
import {
  Palette,
  Sparkles,
  BookOpen,
  Film,
  Layers,
  Check,
  Eye,
  RefreshCw,
  Save,
  Sliders,
  Tv,
  Flame,
  Star,
  Award,
  Crown,
  Clock,
  Tag,
  Quote,
  LayoutGrid,
  RotateCw,
  ExternalLink,
  Megaphone,
  CheckCircle2,
  Info
} from "lucide-react";
import { motion } from "motion/react";
import {
  BookstoreThemeConfig,
  BOOKSTORE_THEME_PRESETS,
  BookstoreThemePreset,
  DEFAULT_BOOKSTORE_THEME,
  getBookstoreThemeConfig
} from "../../data/bookstoreThemePresets";

interface BookstoreThemeStudioProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
  storeId?: number | string;
}

export const BookstoreThemeStudio: React.FC<BookstoreThemeStudioProps> = ({
  branding,
  onBrandingChange,
  lang,
  onSave,
  saving = false,
  storeId
}) => {
  const isTr = lang === "tr";
  const [activeSubTab, setActiveSubTab] = useState<"presets" | "hero" | "rows" | "cards" | "announcement">("presets");

  // Read current bookstore theme config safely
  const themeConfig: BookstoreThemeConfig = useMemo(() => {
    return getBookstoreThemeConfig(branding);
  }, [branding?.bookstore_theme, branding?.page_layout_settings?.bookstore_theme]);

  // Update helper
  const updateThemeConfig = (updates: Partial<BookstoreThemeConfig>) => {
    const updated = { ...themeConfig, ...updates };
    onBrandingChange("bookstore_theme", updated);

    // Also sync standard primary_color and announcement if changed
    if (updates.primary_color !== undefined) {
      onBrandingChange("primary_color", updates.primary_color);
    }
    if (updates.announcement_text !== undefined) {
      onBrandingChange("announcement_text", updates.announcement_text);
    }
    if (updates.show_announcement_bar !== undefined) {
      onBrandingChange("show_announcement_bar", updates.show_announcement_bar);
    }

    const curLayout = branding?.page_layout_settings || {};
    onBrandingChange("page_layout_settings", {
      ...curLayout,
      sector: "bookstore",
      store_concept: "bookstore",
      bookstore_theme: updated
    });
  };

  // Preset applicator
  const applyPreset = (preset: BookstoreThemePreset) => {
    updateThemeConfig({
      preset_id: preset.id,
      primary_color: preset.primaryColor,
      secondary_color: preset.secondaryColor,
      background_mode: preset.backgroundMode
    });
  };

  const activePreset = BOOKSTORE_THEME_PRESETS.find((p) => p.id === themeConfig.preset_id) || BOOKSTORE_THEME_PRESETS[0];

  return (
    <div className="space-y-4">
      {/* Top Header Card: Studio Identity & Save Controls */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>{isTr ? "Kitap Vitrin & Görsel Tasarım Stüdyosu" : "Bookstore Netflix Showcase Studio"}</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-wider">
                  NETFLIX CONCEPT
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isTr
                  ? "Sinematik kitap vitrini, edebi renk atmosferleri, manşet spotları ve raf ızgaralarını yönetin."
                  : "Curate your cinematic book catalog, literary atmospheres, hero spotlight billboard and showcase rows."}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            {branding?.slug && (
              <a
                href={`/store/${branding.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 shadow-xs"
                title={isTr ? "Web Sitesinde Canlı Gör" : "View Live Website"}
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{isTr ? "Vitrine Git" : "View Store"}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}

            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? (isTr ? "Kaydediliyor..." : "Saving...") : (isTr ? "Tasarımı Kaydet" : "Save Design")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "presets", label: isTr ? "Edebi Temalar & Atmosfer" : "Literary Themes", icon: Palette },
            { id: "hero", label: isTr ? "Manşet & Haftanın Eserleri" : "Hero Spotlight", icon: Sparkles },
            { id: "rows", label: isTr ? "Vitrin Izgaraları & Raflar" : "Showcase Shelves", icon: LayoutGrid },
            { id: "cards", label: isTr ? "Kitap Kartı & 3D Deneyim" : "3D Book Cards", icon: BookOpen },
            { id: "announcement", label: isTr ? "Duyuru Şeridi" : "Announcement Bar", icon: Megaphone }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: EDEBİ TEMALAR & SİNEMATİK ATMOSFER */}
      {activeSubTab === "presets" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-red-600" />
                  <span>{isTr ? "Hazır Edebi Tema Konseptleri" : "Ready Literary Presets"}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isTr
                    ? "Kitap vitrininizin ruhuna en uygun sinematik atmosferi tek tıkla seçin."
                    : "Select a curated aesthetic matching your bookstore's soul with one click."}
                </p>
              </div>

              {/* Active Preset Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isTr ? activePreset.nameTr : activePreset.nameEn}</span>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {BOOKSTORE_THEME_PRESETS.map((preset) => {
                const isSelected = themeConfig.preset_id === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`group relative p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-red-600 bg-red-50/20 dark:bg-red-950/20 shadow-md shadow-red-600/10"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
                    }`}
                  >
                    <div>
                      {/* Top Row: Mini Visual Preview Banner */}
                      <div
                        className={`w-full h-16 rounded-lg bg-gradient-to-r ${preset.bgGradient} p-2 flex items-center justify-between border border-white/10 shadow-inner relative overflow-hidden`}
                      >
                        {/* Simulated glowing orb */}
                        <div
                          className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full blur-xl opacity-60"
                          style={{ backgroundColor: preset.primaryColor }}
                        />

                        {/* Simulated mini book cards */}
                        <div className="flex items-center gap-1.5 relative z-10">
                          <div
                            className="w-6 h-9 rounded bg-slate-900 border shadow-md transform -rotate-3"
                            style={{ borderColor: preset.primaryColor }}
                          />
                          <div
                            className="w-7 h-10 rounded bg-slate-950 border shadow-lg transform rotate-2"
                            style={{ borderColor: preset.secondaryColor }}
                          />
                          <div className="w-6 h-9 rounded bg-slate-900 border border-slate-700 shadow-md" />
                        </div>

                        {/* Simulated Badge */}
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm text-white relative z-10"
                          style={{ backgroundColor: preset.primaryColor }}
                        >
                          {isTr ? "SEÇKİ" : "CURATED"}
                        </span>
                      </div>

                      {/* Title & Tagline */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                            {isTr ? preset.nameTr : preset.nameEn}
                          </h4>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {isTr ? preset.taglineTr : preset.taglineEn}
                        </p>
                      </div>
                    </div>

                    {/* Color Swatches */}
                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {preset.previewColors.map((c, i) => (
                          <div
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isSelected ? (isTr ? "Seçili Tema" : "Active") : (isTr ? "Temayı Seç" : "Select")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Palette Overrides */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>{isTr ? "Özel Renk ve Atmosfer İnce Ayarları" : "Custom Color Overrides"}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Primary Accent Color */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {isTr ? "Ana Vurgu Rengi (Butonlar & Rozetler)" : "Primary Accent Color"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeConfig.primary_color || "#e50914"}
                      onChange={(e) => updateThemeConfig({ primary_color: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={themeConfig.primary_color || "#e50914"}
                      onChange={(e) => updateThemeConfig({ primary_color: e.target.value })}
                      className="w-28 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Secondary Star/Rating Accent Color */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {isTr ? "İkincil Vurgu (Puanlar & Yıldızlar)" : "Secondary Accent"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeConfig.secondary_color || "#f59e0b"}
                      onChange={(e) => updateThemeConfig({ secondary_color: e.target.value })}
                      className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={themeConfig.secondary_color || "#f59e0b"}
                      onChange={(e) => updateThemeConfig({ secondary_color: e.target.value })}
                      className="w-28 px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Background Depth Mode */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {isTr ? "Zemin Derinlik Modu" : "Background Depth Mode"}
                  </label>
                  <select
                    value={themeConfig.background_mode}
                    onChange={(e) => updateThemeConfig({ background_mode: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  >
                    <option value="midnight">{isTr ? "Gece Siyahı (Midnight)" : "Midnight Cinema"}</option>
                    <option value="library_dark">{isTr ? "Antik Ahşap & Sahaf (Walnut)" : "Antique Library"}</option>
                    <option value="navy_dark">{isTr ? "Derin Gece Mavisi (Navy)" : "Literary Navy"}</option>
                    <option value="emerald_dark">{isTr ? "Koyu Zümrüt (Emerald)" : "Emerald Salon"}</option>
                    <option value="burgundy_dark">{isTr ? "Asil Bordo (Burgundy)" : "Burgundy Velvet"}</option>
                    <option value="parchment_warm">{isTr ? "Sıcak Parşömen (Parchment)" : "Warm Parchment"}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MANŞET & HAFTANIN ESERLERİ (HERO BILLBOARD) */}
      {activeSubTab === "hero" && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-600" />
                <span>{isTr ? "Manşet & Haftanın Eserleri (Hero Billboard)" : "Hero Spotlight Billboard"}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isTr
                  ? "Web sitesinin en üstünde yer alan sinematik kitap manşeti ve animasyon seçenekleri."
                  : "Configure the top cinematic hero billboard, book rotations and visual overlays."}
              </p>
            </div>

            {/* Master Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {themeConfig.show_hero_billboard ? (isTr ? "Manşet Aktif" : "Hero Active") : (isTr ? "Manşet Pasif" : "Hero Inactive")}
              </span>
              <input
                type="checkbox"
                checked={themeConfig.show_hero_billboard}
                onChange={(e) => updateThemeConfig({ show_hero_billboard: e.target.checked })}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
              />
            </label>
          </div>

          {themeConfig.show_hero_billboard ? (
            <div className="space-y-4">
              {/* Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Hero Badge Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {isTr ? "Manşet Rozet Metni" : "Hero Badge Label"}
                  </label>
                  <input
                    type="text"
                    value={themeConfig.hero_badge_text}
                    onChange={(e) => updateThemeConfig({ hero_badge_text: e.target.value })}
                    placeholder="HAFTANIN ESERLERİ"
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-400">
                    {isTr ? "Kırmızı rozet içinde gösterilen başlık (örn: HAFTANIN ESERLERİ, EDİTÖRÜN GÖZDESİ)" : "Upper glowing badge label"}
                  </span>
                </div>

                {/* Auto Rotate Timer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {isTr ? "Otomatik Kitap Geçiş Süresi" : "Auto-Rotate Interval"}
                  </label>
                  <select
                    value={themeConfig.hero_auto_rotate_seconds}
                    onChange={(e) => updateThemeConfig({ hero_auto_rotate_seconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={2.5}>{isTr ? "2.5 Saniye (Hızlı Dinamik)" : "2.5s (Fast dynamic)"}</option>
                    <option value={3.5}>{isTr ? "3.5 Saniye (Önerilen Sinematik)" : "3.5s (Recommended cinematic)"}</option>
                    <option value={5.0}>{isTr ? "5.0 Saniye (Sakin Okuma)" : "5.0s (Calm reading)"}</option>
                    <option value={0}>{isTr ? "Durdur (Yalnızca Manuel Seçim)" : "Off (Manual only)"}</option>
                  </select>
                  <span className="text-[10px] text-slate-400">
                    {isTr ? "Haftanın kitapları arasında otomatik geçiş hızı" : "Rotation speed between weekly picks"}
                  </span>
                </div>

                {/* Collage Opacity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {isTr ? "Arka Plan Mozaik Kolaj Yoğunluğu" : "Background Collage Opacity"}
                  </label>
                  <select
                    value={themeConfig.hero_collage_opacity}
                    onChange={(e) => updateThemeConfig({ hero_collage_opacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={0.15}>{isTr ? "%15 (Hafif & Gizli)" : "15% (Subtle)"}</option>
                    <option value={0.25}>{isTr ? "%25 (Dengeli Sinematik)" : "25% (Balanced Cinematic)"}</option>
                    <option value={0.4}>{isTr ? "%40 (Belirgin Kitap Duvarı)" : "40% (Prominent Cover Wall)"}</option>
                  </select>
                  <span className="text-[10px] text-slate-400">
                    {isTr ? "Arka plandaki kapak kolajının transparanlık derecesi" : "Opacity of the mosaic book covers"}
                  </span>
                </div>
              </div>

              {/* Toggles Checklist */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isTr ? "Mozaik Kapak Kolajı" : "Mosaic Collage"}
                  </span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_hero_collage}
                    onChange={(e) => updateThemeConfig({ show_hero_collage: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>

                <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isTr ? "3D Hacimli Kitap Kapağı" : "3D Book Cover"}
                  </span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_hero_3d_cover}
                    onChange={(e) => updateThemeConfig({ show_hero_3d_cover: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>

                <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isTr ? "Çarpıcı Alıntı Kartı" : "Spot Quote Card"}
                  </span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_hero_quote}
                    onChange={(e) => updateThemeConfig({ show_hero_quote: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>

                <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isTr ? "Puan & Sayfa Künyesi" : "Rating & Page Count"}
                  </span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_hero_meta_badges}
                    onChange={(e) => updateThemeConfig({ show_hero_meta_badges: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              {isTr
                ? "Manşet billboard'u pasif duruma getirildi. Web sitesi doğrudan üst arama ve raf ızgaraları ile açılacaktır."
                : "Hero billboard is disabled. Showcase will start directly with book rows."}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: VİTRİN IZGARALARI & RAFLAR (SHOWCASE SHELVES) */}
      {activeSubTab === "rows" && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-red-600" />
              <span>{isTr ? "Netflix Tarzı Yatay Raf Izgaraları" : "Netflix Showcase Shelves"}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isTr
                ? "Web sitenizde yer alacak tematik kitap satırlarını açıp kapatın, başlık ve açıklamalarını özelleştirin."
                : "Enable or disable thematic shelves and customize their titles and descriptions."}
            </p>
          </div>

          <div className="space-y-3">
            {/* 1. Çok Satanlar */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-500/20 text-red-500 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isTr ? "Çok Satan Eserler Rafı" : "Bestsellers Shelf"}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>{themeConfig.show_row_bestsellers ? (isTr ? "Aktif" : "Active") : (isTr ? "Pasif" : "Inactive")}</span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_row_bestsellers}
                    onChange={(e) => updateThemeConfig({ show_row_bestsellers: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>
              </div>
              {themeConfig.show_row_bestsellers && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    value={themeConfig.title_bestsellers}
                    onChange={(e) => updateThemeConfig({ title_bestsellers: e.target.value })}
                    placeholder={isTr ? "Raf Başlığı" : "Title"}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={themeConfig.subtitle_bestsellers}
                    onChange={(e) => updateThemeConfig({ subtitle_bestsellers: e.target.value })}
                    placeholder={isTr ? "Raf Açıklaması / Alt Başlık" : "Subtitle"}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* 2. Yeni Çıkanlar */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-500 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isTr ? "Yeni Çıkanlar & Taze Baskılar" : "New Releases Shelf"}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>{themeConfig.show_row_new_arrivals ? (isTr ? "Aktif" : "Active") : (isTr ? "Pasif" : "Inactive")}</span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_row_new_arrivals}
                    onChange={(e) => updateThemeConfig({ show_row_new_arrivals: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>
              </div>
              {themeConfig.show_row_new_arrivals && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    value={themeConfig.title_new_arrivals}
                    onChange={(e) => updateThemeConfig({ title_new_arrivals: e.target.value })}
                    placeholder={isTr ? "Raf Başlığı" : "Title"}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={themeConfig.subtitle_new_arrivals}
                    onChange={(e) => updateThemeConfig({ subtitle_new_arrivals: e.target.value })}
                    placeholder={isTr ? "Raf Açıklaması / Alt Başlık" : "Subtitle"}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* 3. Editörün Seçimi */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isTr ? "Editörün Seçimi Özel Seçkisi" : "Editor's Choice"}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>{themeConfig.show_row_editors_pick ? (isTr ? "Aktif" : "Active") : (isTr ? "Pasif" : "Inactive")}</span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_row_editors_pick}
                    onChange={(e) => updateThemeConfig({ show_row_editors_pick: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>
              </div>
              {themeConfig.show_row_editors_pick && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    value={themeConfig.title_editors_pick}
                    onChange={(e) => updateThemeConfig({ title_editors_pick: e.target.value })}
                    placeholder={isTr ? "Raf Başlığı" : "Title"}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={themeConfig.subtitle_editors_pick}
                    onChange={(e) => updateThemeConfig({ subtitle_editors_pick: e.target.value })}
                    placeholder={isTr ? "Raf Açıklaması / Alt Başlık" : "Subtitle"}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* 4. Ödüllü Eserler */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isTr ? "Ödüllü Eserler & Başyapıtlar" : "Award-Winning Masterpieces"}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>{themeConfig.show_row_award_winning ? (isTr ? "Aktif" : "Active") : (isTr ? "Pasif" : "Inactive")}</span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_row_award_winning}
                    onChange={(e) => updateThemeConfig({ show_row_award_winning: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>
              </div>
              {themeConfig.show_row_award_winning && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    value={themeConfig.title_award_winning}
                    onChange={(e) => updateThemeConfig({ title_award_winning: e.target.value })}
                    placeholder={isTr ? "Raf Başlığı" : "Title"}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={themeConfig.subtitle_award_winning}
                    onChange={(e) => updateThemeConfig({ subtitle_award_winning: e.target.value })}
                    placeholder={isTr ? "Raf Açıklaması / Alt Başlık" : "Subtitle"}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* 5. Yakında Gelecekler & Ön Sipariş */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isTr ? "Yakında Raflarda & Ön Sipariş" : "Coming Soon & Pre-Order"}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>{themeConfig.show_row_coming_soon ? (isTr ? "Aktif" : "Active") : (isTr ? "Pasif" : "Inactive")}</span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_row_coming_soon}
                    onChange={(e) => updateThemeConfig({ show_row_coming_soon: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>
              </div>
              {themeConfig.show_row_coming_soon && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    value={themeConfig.title_coming_soon}
                    onChange={(e) => updateThemeConfig({ title_coming_soon: e.target.value })}
                    placeholder={isTr ? "Raf Başlığı" : "Title"}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={themeConfig.subtitle_coming_soon}
                    onChange={(e) => updateThemeConfig({ subtitle_coming_soon: e.target.value })}
                    placeholder={isTr ? "Raf Açıklaması / Alt Başlık" : "Subtitle"}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* 6. Fırsat & İndirimdekiler */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {isTr ? "Özel Fırsat & İndirimli Eserler" : "Special Deals Shelf"}
                  </span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>{themeConfig.show_row_discounted ? (isTr ? "Aktif" : "Active") : (isTr ? "Pasif" : "Inactive")}</span>
                  <input
                    type="checkbox"
                    checked={themeConfig.show_row_discounted}
                    onChange={(e) => updateThemeConfig({ show_row_discounted: e.target.checked })}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                </label>
              </div>
              {themeConfig.show_row_discounted && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <input
                    type="text"
                    value={themeConfig.title_discounted}
                    onChange={(e) => updateThemeConfig({ title_discounted: e.target.value })}
                    placeholder={isTr ? "Raf Başlığı" : "Title"}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={themeConfig.subtitle_discounted}
                    onChange={(e) => updateThemeConfig({ subtitle_discounted: e.target.value })}
                    placeholder={isTr ? "Raf Açıklaması / Alt Başlık" : "Subtitle"}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* 7. Kategori Rafları */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {isTr ? "Tür & Kategori Bazlı Raflar" : "Genre & Category Shelves"}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isTr ? "Edebiyat, Felsefe, Tarih vb. kategoriler için ayrı yatay satırlar" : "Horizontal rows for bookstore categories"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={themeConfig.max_category_rows}
                  onChange={(e) => updateThemeConfig({ max_category_rows: Number(e.target.value) })}
                  className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value={3}>{isTr ? "3 Kategori Rafı" : "3 Shelves"}</option>
                  <option value={4}>{isTr ? "4 Kategori Rafı" : "4 Shelves"}</option>
                  <option value={6}>{isTr ? "6 Kategori Rafı" : "6 Shelves"}</option>
                  <option value={10}>{isTr ? "Tüm Kategoriler" : "All Categories"}</option>
                </select>
                <input
                  type="checkbox"
                  checked={themeConfig.show_row_categories}
                  onChange={(e) => updateThemeConfig({ show_row_categories: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: KİTAP KARTI & 3D DENEYİM (BOOK CARDS) */}
      {activeSubTab === "cards" && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-red-600" />
              <span>{isTr ? "Kitap Kartı & 3D Etkileşim Deneyimi" : "3D Book Card Experience"}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isTr
                ? "Okurların kitap kapaklarının üzerine geldiklerinde yaşayacağı 3D çevirme ve bilgi kartı davranışlarını yönetin."
                : "Control the interactive 3D flip card, back synopsis and quick purchase options."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Options List */}
            <div className="space-y-3">
              <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {isTr ? "3D Çift Yönlü Kapak Çevirme (Card Flip)" : "3D Card Flip on Hover"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isTr ? "Kartın üzerine gelindiğinde arka kapak tanıtımını gösterir" : "Flips card to reveal synopsis"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={themeConfig.enable_card_flip}
                  onChange={(e) => updateThemeConfig({ enable_card_flip: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
              </label>

              <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {isTr ? "Arka Kapak Tanıtım Metni (Synopsis)" : "Synopsis Snippet"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isTr ? "Arka yüzde eserin çarpıcı edebi özetini gösterir" : "Shows preview text on back cover"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={themeConfig.show_card_synopsis}
                  onChange={(e) => updateThemeConfig({ show_card_synopsis: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
              </label>

              <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {isTr ? "Kapak Üzeri Vitrin Rozetleri" : "Cover Badges"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isTr ? "Çok Satan, Yeni, Ödüllü gibi rozet hapları" : "Display bestseller, new, award tags"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={themeConfig.show_card_badges}
                  onChange={(e) => updateThemeConfig({ show_card_badges: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
              </label>

              <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {isTr ? "Yıldız & Puan Rozeti" : "Rating Star Badge"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isTr ? "Eserin okur değerlendirme puanını gösterir" : "Shows 4.9/5 reader score"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={themeConfig.show_card_rating}
                  onChange={(e) => updateThemeConfig({ show_card_rating: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
              </label>

              <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    {isTr ? "Hızlı Sepete Ekle Butonu" : "Quick Add to Bag Button"}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isTr ? "Arka yüzde tek tıkla sepete ekleme butonu" : "Direct purchase button on card back"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={themeConfig.show_card_quick_add}
                  onChange={(e) => updateThemeConfig({ show_card_quick_add: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                />
              </label>
            </div>

            {/* Visual Live Demonstration / Preview */}
            <div className="p-4 rounded-xl bg-slate-950 text-white flex flex-col items-center justify-center text-center space-y-3 border border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {isTr ? "Canlı Kart Efekti Önizleme" : "Card Effect Preview"}
              </span>

              {/* Simulated 3D Card */}
              <div className="w-36 h-52 rounded-xl bg-slate-900 border-2 border-red-600/50 shadow-2xl relative overflow-hidden flex flex-col justify-between p-3 group transition-transform duration-300 hover:scale-105">
                <div className="flex justify-between items-start">
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-[9px] font-black text-white uppercase">
                    ÇOK SATAN
                  </span>
                  <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                    ★ 4.9
                  </span>
                </div>

                <div className="space-y-1 text-left">
                  <h5 className="text-[11px] font-black text-white leading-tight">Örnek Başyapıt</h5>
                  <p className="text-[9px] text-slate-400 font-semibold">Fyodor Dostoyevski</p>
                  <p className="text-[10px] font-black text-emerald-400">240,00 TRY</p>
                </div>

                <div className="w-full py-1 rounded bg-red-600 text-white text-[9px] font-black uppercase">
                  {isTr ? "SEPETE EKLE" : "ADD TO CART"}
                </div>
              </div>

              <span className="text-[10px] text-slate-400 max-w-xs">
                {isTr
                  ? "Kartlar kitap vitrininde yüksek kontrastlı, parlamalı cilt efekti ve sinematik geçişle sunulur."
                  : "Cards are presented with cinematic lighting and high contrast styling."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: DUYURU & EDEBİ ŞERİT (ANNOUNCEMENT BAR) */}
      {activeSubTab === "announcement" && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-red-600" />
                <span>{isTr ? "Kitabevi Üst Duyuru Şeridi" : "Bookstore Announcement Bar"}</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isTr
                  ? "Web sitenizin en üstünde kargo fırsatları, imza günleri veya edebiyat bülteni duyurusu yayınlayın."
                  : "Display top header announcements for free shipping, book signings and special offers."}
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {themeConfig.show_announcement_bar ? (isTr ? "Şerit Aktif" : "Bar Active") : (isTr ? "Şerit Pasif" : "Bar Inactive")}
              </span>
              <input
                type="checkbox"
                checked={themeConfig.show_announcement_bar}
                onChange={(e) => updateThemeConfig({ show_announcement_bar: e.target.checked })}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
              />
            </label>
          </div>

          {themeConfig.show_announcement_bar && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isTr ? "Duyuru Metni" : "Announcement Text"}
                </label>
                <input
                  type="text"
                  value={themeConfig.announcement_text}
                  onChange={(e) => updateThemeConfig({ announcement_text: e.target.value })}
                  placeholder="📚 250 TL Üzeri Kitap Siparişlerinde Kargo Ücretsiz! • İmzalı Özel Baskılar Raflarda."
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Style Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isTr ? "Şerit Renk Teması" : "Bar Style"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "accent", label: isTr ? "Tema Vurgusu (Canlı Kırmızı/Amber)" : "Theme Accent", bg: "bg-red-600 text-white" },
                    { id: "dark", label: isTr ? "Sinematik Koyu Siyah" : "Velvet Dark", bg: "bg-slate-950 text-slate-200 border border-slate-800" },
                    { id: "gold", label: isTr ? "Altın & Kehribar Zarafeti" : "Golden Amber", bg: "bg-amber-600 text-white" }
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => updateThemeConfig({ announcement_bg_style: style.id as any })}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center border-2 transition-all cursor-pointer ${
                        themeConfig.announcement_bg_style === style.id
                          ? "border-red-600 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg mb-1.5 text-[11px] truncate font-bold ${style.bg}`}>
                        {themeConfig.announcement_text || "📚 Örnek Duyuru Metni"}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Save Action Bar */}
      {onSave && (
        <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">
              {isTr ? "Kitap vitrini görsel ayarları hazır." : "Bookstore showcase settings ready."}
            </span>
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? (isTr ? "Kaydediliyor..." : "Saving...") : (isTr ? "Vitrin Tasarımını Kaydet" : "Save Showcase Design")}</span>
          </button>
        </div>
      )}
    </div>
  );
};
