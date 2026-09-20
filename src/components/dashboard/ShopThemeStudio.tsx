import React, { useState, useMemo } from "react";
import {
  Palette,
  Sparkles,
  Image as ImageIcon,
  Smartphone,
  Grid3X3,
  ShieldCheck,
  Tag,
  Plus,
  Trash2,
  Upload,
  Layers,
  Check,
  Eye,
  RefreshCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save
} from "lucide-react";
import { DEFAULT_SHOP_THEME, ShopThemeConfig, THEME_PRESETS } from "../../utils/shopThemePresets";

interface ShopThemeStudioProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  lang: string;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
}

export const ShopThemeStudio: React.FC<ShopThemeStudioProps> = ({
  branding,
  onBrandingChange,
  lang,
  onSave,
  saving = false
}) => {
  const [activeTab, setActiveTab] = useState<"presets" | "hero" | "stories" | "bento" | "badges">("presets");

  // Read current themeConfig safely
  const themeConfig: ShopThemeConfig = useMemo(() => {
    const raw = branding?.theme_config || branding?.page_layout_settings?.theme_config;
    if (typeof raw === "string") {
      try { return { ...DEFAULT_SHOP_THEME, ...JSON.parse(raw) }; } catch (e) { return DEFAULT_SHOP_THEME; }
    } else if (raw && typeof raw === "object") {
      return { ...DEFAULT_SHOP_THEME, ...raw };
    }
    return DEFAULT_SHOP_THEME;
  }, [branding?.theme_config, branding?.page_layout_settings?.theme_config]);

  // Helper to update themeConfig field
  const updateThemeConfig = (updates: Partial<ShopThemeConfig>) => {
    const updated = { ...themeConfig, ...updates };
    onBrandingChange("theme_config", updated);
    
    if (updates.show_hero_banner !== undefined) {
      onBrandingChange("show_hero_banner", updates.show_hero_banner);
    }
    if (updates.show_story_ribbon !== undefined) {
      onBrandingChange("show_story_ribbon", updates.show_story_ribbon);
    }
    if (updates.show_bento_grid !== undefined) {
      onBrandingChange("show_bento_grid", updates.show_bento_grid);
    }
    if (updates.show_announcement_bar !== undefined) {
      onBrandingChange("show_announcement_bar", updates.show_announcement_bar);
    }
    if (updates.announcement_text !== undefined) {
      onBrandingChange("announcement_text", updates.announcement_text);
    }
    if (updates.primary_color !== undefined) {
      onBrandingChange("primary_color", updates.primary_color);
    }
    if (updates.accent_color !== undefined) {
      onBrandingChange("accent_color", updates.accent_color);
    }
    if (updates.background_mode !== undefined) {
      onBrandingChange("background_mode", updates.background_mode);
    }
    if (updates.bento_blocks !== undefined) {
      onBrandingChange("bento_blocks", updates.bento_blocks);
    }
    if (updates.stories !== undefined) {
      onBrandingChange("stories", updates.stories);
    }
    if (updates.trust_badges !== undefined) {
      onBrandingChange("trust_badges", updates.trust_badges);
    }
    if (updates.show_trust_badges !== undefined) {
      onBrandingChange("show_trust_badges", updates.show_trust_badges);
    }

    const curLayout = branding?.page_layout_settings || {};
    onBrandingChange("page_layout_settings", {
      ...curLayout,
      theme_config: updated,
      show_hero_banner: updated.show_hero_banner,
      show_story_ribbon: updated.show_story_ribbon,
      show_bento_grid: updated.show_bento_grid,
      announcement_bar: updated.show_announcement_bar,
      show_announcement_bar: updated.show_announcement_bar,
      announcement_text: updated.announcement_text,
      primary_color: updated.primary_color,
      accent_color: updated.accent_color,
      background_mode: updated.background_mode,
      card_style: updated.card_style,
      card_radius: updated.card_radius,
      card_aspect_ratio: updated.card_aspect_ratio,
      card_hover_effect: updated.card_hover_effect,
      bento_blocks: updated.bento_blocks,
      stories: updated.stories
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      updateThemeConfig({
        ...preset,
        preset_name: presetKey as any
      });
    }
  };

  // Banners
  const normalizedBanners = useMemo(() => {
    const list = Array.isArray(branding?.banners) ? branding.banners : [];
    if (list.length === 0) {
      if (branding?.hero_image_url || branding?.hero_title) {
        return [{
          id: "banner_0",
          image_url: branding?.hero_image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80",
          title: branding?.hero_title || (lang === "tr" ? "Yeni Nesil Şıklık" : "Modern Elegance"),
          subtitle: branding?.hero_subtitle || (lang === "tr" ? "En seçkin ürünlerle stilinizi tamamlayın." : "Discover curated pieces."),
          text_position: "center",
          show_store_name: true,
          button_text: lang === "tr" ? "Koleksiyonu İncele" : "Explore Collection",
          button_link: "#catalog"
        }];
      }
      return [];
    }
    return list.map((b: any, idx: number) => {
      if (typeof b === "string") {
        return {
          id: `banner_str_${idx}`,
          image_url: b,
          title: idx === 0 ? (branding?.hero_title || "") : "",
          subtitle: idx === 0 ? (branding?.hero_subtitle || "") : "",
          text_position: "center",
          show_store_name: true,
          button_text: lang === "tr" ? "Koleksiyonu İncele" : "Explore",
          button_link: "#catalog"
        };
      }
      return {
        id: b.id || `banner_${idx}`,
        image_url: b.image_url || b.url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80",
        title: b.title !== undefined ? b.title : "",
        subtitle: b.subtitle !== undefined ? b.subtitle : "",
        text_position: b.text_position || "center",
        show_store_name: b.show_store_name !== false,
        button_text: b.button_text || (lang === "tr" ? "Koleksiyonu İncele" : "Explore"),
        button_link: b.button_link || "#catalog"
      };
    });
  }, [branding?.banners, branding?.hero_image_url, branding?.hero_title, branding?.hero_subtitle, lang]);

  const handleAddBanner = () => {
    const newBanner = {
      id: `banner_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80",
      title: lang === "tr" ? "Özel Fırsatlar & İndirimler" : "Special Offers & Deals",
      subtitle: lang === "tr" ? "Sezon sonu seçili ürünlerde kaçırılmayacak fiyatlar." : "Limited time curated offers.",
      text_position: "center",
      show_store_name: true,
      button_text: lang === "tr" ? "Hemen İncele" : "Shop Now",
      button_link: "#catalog"
    };
    const updated = [...normalizedBanners, newBanner];
    onBrandingChange("banners", updated);
    if (updated.length > 0) {
      onBrandingChange("hero_image_url", updated[0].image_url || "");
      onBrandingChange("hero_title", updated[0].title || "");
      onBrandingChange("hero_subtitle", updated[0].subtitle || "");
    }
  };

  const handleUpdateBanner = (id: string, field: string, value: any) => {
    const updated = normalizedBanners.map((b: any) => (b.id === id ? { ...b, [field]: value } : b));
    onBrandingChange("banners", updated);
    if (updated.length > 0) {
      onBrandingChange("hero_image_url", updated[0].image_url || "");
      onBrandingChange("hero_title", updated[0].title || "");
      onBrandingChange("hero_subtitle", updated[0].subtitle || "");
    }
  };

  const handleRemoveBanner = (id: string) => {
    const updated = normalizedBanners.filter((b: any) => b.id !== id);
    onBrandingChange("banners", updated);
    if (updated.length > 0) {
      onBrandingChange("hero_image_url", updated[0].image_url || "");
      onBrandingChange("hero_title", updated[0].title || "");
      onBrandingChange("hero_subtitle", updated[0].subtitle || "");
    } else {
      onBrandingChange("hero_image_url", "");
      onBrandingChange("hero_title", "");
      onBrandingChange("hero_subtitle", "");
    }
  };

  const handleBannerUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        handleUpdateBanner(id, "image_url", b64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Stories
  const stories = themeConfig.stories || [];

  const handleAddStory = () => {
    const newStory = {
      id: `story_${Date.now()}`,
      title: lang === "tr" ? "Yeni Hikaye" : "New Story",
      image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
      badge: "YENİ",
      link: "#catalog"
    };
    updateThemeConfig({ stories: [...stories, newStory] });
  };

  const handleUpdateStory = (index: number, field: string, value: any) => {
    const updated = [...stories];
    updated[index] = { ...updated[index], [field]: value };
    updateThemeConfig({ stories: updated });
  };

  const handleRemoveStory = (index: number) => {
    const updated = stories.filter((_, idx) => idx !== index);
    updateThemeConfig({ stories: updated });
  };

  const handleStoryImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        handleUpdateStory(index, "image_url", b64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Bento Blocks
  const bentoBlocks = themeConfig.bento_blocks || [];

  const handleAddBento = () => {
    const newBento = {
      id: `bento_${Date.now()}`,
      size: "medium" as const,
      title: lang === "tr" ? "Öne Çıkan Başlık" : "Featured Spotlight",
      subtitle: lang === "tr" ? "Kısa tanıtım ve açıklama yazısı." : "Short capsule description.",
      badge: "TREND",
      image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
      cta_text: lang === "tr" ? "Koleksiyonu Keşfet" : "Explore",
      link: "#catalog"
    };
    updateThemeConfig({ bento_blocks: [...bentoBlocks, newBento] });
  };

  const handleUpdateBento = (index: number, field: string, value: any) => {
    const updated = [...bentoBlocks];
    updated[index] = { ...updated[index], [field]: value };
    updateThemeConfig({ bento_blocks: updated });
  };

  const handleRemoveBento = (index: number) => {
    const updated = bentoBlocks.filter((_, idx) => idx !== index);
    updateThemeConfig({ bento_blocks: updated });
  };

  const handleBentoImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const b64 = ev.target?.result as string;
        handleUpdateBento(index, "image_url", b64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      {/* Micro Compact Studio Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Görsel Tasarım Stüdyosu
                </h2>
                <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-wider">shopLP</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">
                {lang === "tr" ? "Tema konseptleri, renk paletleri ve vitrin bileşenlerini tek ekranda yönetin." : "Manage theme presets, color palettes and storefront components."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{lang === "tr" ? "Kaydet" : "Save"}</span>
              </button>
            )}
            <a
              href={`/s/${branding?.slug || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === "tr" ? "Vitrini Gör" : "Preview"}</span>
            </a>
          </div>
        </div>

        {/* Compact Sub-Nav Strip */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {[
            { id: "presets", label: "Konsept & Renkler", icon: <Palette className="w-3.5 h-3.5" /> },
            { id: "hero", label: "Hero Banner & Afişler", icon: <ImageIcon className="w-3.5 h-3.5" /> },
            { id: "stories", label: "Instagram Hikayeleri", icon: <Smartphone className="w-3.5 h-3.5" /> },
            { id: "bento", label: "Kapsül Blokları (Bento)", icon: <Grid3X3 className="w-3.5 h-3.5" /> },
            { id: "badges", label: "Duyuru & Rozetler", icon: <ShieldCheck className="w-3.5 h-3.5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: KONSEPT & RENKLER */}
      {activeTab === "presets" && (
        <div className="space-y-3">
          {/* Hazır Tema Konseptleri */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  {lang === "tr" ? "Hazır Tema Konseptleri" : "Theme Presets"}
                </h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  {lang === "tr" ? "Sektörünüze özel hazır tasarım şablonunu tek tıkla uygulayın." : "Apply pre-designed aesthetic presets with 1-click."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "minimal_swiss", title: "Minimal Butik", desc: "Beyaz zemin, lüks sadelik", bg: "bg-slate-50 border-slate-200", dot1: "#0f172a", dot2: "#e11d48" },
                { id: "luxury_dark", title: "Lüks & Gece (Dark)", desc: "Antrasit zemin, altın tonu", bg: "bg-slate-900 text-white border-slate-800", dot1: "#f59e0b", dot2: "#d97706" },
                { id: "nordic_warm", title: "İskandinav Sıcak", desc: "Sıcak bej tonları, mat tekstil", bg: "bg-amber-50/70 border-amber-200/80", dot1: "#475569", dot2: "#0d9488" },
                { id: "street_bold", title: "Sokak & Enerjik", desc: "Yüksek kontrast, spor moda", bg: "bg-zinc-100 border-zinc-300", dot1: "#000000", dot2: "#6366f1" }
              ].map((p) => {
                const isSelected = themeConfig.preset_name === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${p.bg} ${
                      isSelected
                        ? "ring-2 ring-indigo-500 border-indigo-600 shadow-2xs"
                        : "hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.dot1 }} />
                        <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.dot2 }} />
                      </div>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          Aktif
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">{p.title}</h4>
                      <p className="text-[10px] opacity-75 font-normal leading-tight mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Renk & Atmosfer + Ürün Kartı Dizaynı Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Renk & Atmosfer */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-600" />
                {lang === "tr" ? "Renk & Atmosfer" : "Colors & Atmosphere"}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Zemin Modu
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "light", label: "Açık (Light)" },
                      { id: "dark", label: "Koyu (Dark)" },
                      { id: "warm", label: "Sıcak Bej" }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => updateThemeConfig({ background_mode: mode.id as any })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer text-center ${
                          themeConfig.background_mode === mode.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hızlı Renk Paletleri */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Hızlı Renk Paletleri
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Lüks Siyah", primary: "#0f172a", accent: "#e11d48" },
                      { name: "Koyu İndigo", primary: "#1e1b4b", accent: "#6366f1" },
                      { name: "Zümrüt Yeşil", primary: "#064e3b", accent: "#10b981" },
                      { name: "Asil Bordo", primary: "#881337", accent: "#f43f5e" },
                      { name: "Sıcak Kehribar", primary: "#451a03", accent: "#d97706" }
                    ].map((swatch, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => updateThemeConfig({ primary_color: swatch.primary, accent_color: swatch.accent })}
                        className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[10px] font-medium text-slate-700 transition-all cursor-pointer"
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: swatch.primary }} />
                        <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: swatch.accent }} />
                        <span>{swatch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Inputs */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Ana Renk
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <input
                        type="color"
                        value={themeConfig.primary_color || "#0f172a"}
                        onChange={(e) => updateThemeConfig({ primary_color: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={themeConfig.primary_color || "#0f172a"}
                        onChange={(e) => updateThemeConfig({ primary_color: e.target.value })}
                        className="w-full bg-transparent text-xs font-mono font-semibold text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Vurgu (Aksan) Rengi
                    </label>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <input
                        type="color"
                        value={themeConfig.accent_color || "#e11d48"}
                        onChange={(e) => updateThemeConfig({ accent_color: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={themeConfig.accent_color || "#e11d48"}
                        onChange={(e) => updateThemeConfig({ accent_color: e.target.value })}
                        className="w-full bg-transparent text-xs font-mono font-semibold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ürün Kartı Dizaynı */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                {lang === "tr" ? "Ürün Kartı Dizaynı" : "Product Card Design"}
              </h3>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Kart Yapısı
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: "minimal", label: "Minimal" },
                      { id: "borderless", label: "Çerçevesiz" },
                      { id: "elevated", label: "Gölgeli" },
                      { id: "glass", label: "Cam Efekti" },
                      { id: "neo", label: "Retro" }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => updateThemeConfig({ card_style: st.id as any })}
                        className={`py-1 px-2.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer ${
                          (themeConfig.card_style || "minimal") === st.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Köşe Yuvarlaklığı
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { id: "none", label: "0px Düz" },
                        { id: "subtle", label: "8px Hafif" },
                        { id: "rounded", label: "16px Zarif" },
                        { id: "pill", label: "24px Oval" }
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => updateThemeConfig({ card_radius: r.id as any })}
                          className={`py-1 px-1.5 text-center rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                            themeConfig.card_radius === r.id
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Hover Efekti
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: "secondary_image", label: "2. Görsel" },
                        { id: "zoom", label: "Zoom" },
                        { id: "glow", label: "Parlama" }
                      ].map((eff) => (
                        <button
                          key={eff.id}
                          type="button"
                          onClick={() => updateThemeConfig({ card_hover_effect: eff.id as any })}
                          className={`py-1 px-1 text-center rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                            themeConfig.card_hover_effect === eff.id
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {eff.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Fotoğraf Oranı
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "portrait", label: "3:4 Dikey Moda" },
                      { id: "square", label: "1:1 Kare Standart" },
                      { id: "wide", label: "16:9 Yatay" }
                    ].map((asp) => (
                      <button
                        key={asp.id}
                        type="button"
                        onClick={() => updateThemeConfig({ card_aspect_ratio: asp.id as any })}
                        className={`py-1 px-2 text-center rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                          themeConfig.card_aspect_ratio === asp.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {asp.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HERO BANNER & AFİŞLER */}
      {activeTab === "hero" && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                {lang === "tr" ? "Hero Banner & Afiş Yönetimi" : "Hero Banner & Slides"}
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {lang === "tr" ? "Hero vitrin afişlerini ve buton bağlantılarını yönetin." : "Manage hero slides, titles and call-to-action buttons."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddBanner}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === "tr" ? "Afiş Ekle" : "Add Slide"}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={themeConfig.show_hero_banner !== false}
                onChange={(e) => updateThemeConfig({ show_hero_banner: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-semibold text-slate-800">
                {lang === "tr" ? "Hero Banner Görünsün" : "Show Hero Banner"}
              </span>
            </label>

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase mr-1">Düzen:</span>
              {[
                { id: "split", label: "Split (Kayan)" },
                { id: "full_banner", label: "Tam Ekran" },
                { id: "editorial", label: "Editoryal" }
              ].map((hl) => (
                <button
                  key={hl.id}
                  type="button"
                  onClick={() => updateThemeConfig({ hero_layout: hl.id as any })}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                    themeConfig.hero_layout === hl.id
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {hl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Banner Items */}
          {normalizedBanners.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-slate-500 text-xs font-normal">
                {lang === "tr" ? "Henüz afiş eklenmedi." : "No banner slides added yet."}
              </p>
              <button
                type="button"
                onClick={handleAddBanner}
                className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                {lang === "tr" ? "İlk Afişi Ekle" : "Add First Slide"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {normalizedBanners.map((banner: any, idx: number) => (
                <div
                  key={banner.id || idx}
                  className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col gap-2.5 relative hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                    <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                      {lang === "tr" ? `SLAYT #${idx + 1}` : `SLIDE #${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBanner(banner.id)}
                      className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === "tr" ? "Sil" : "Delete"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Image */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Görsel
                      </label>
                      <div className="relative h-20 bg-white border border-slate-200 rounded-md overflow-hidden flex items-center justify-center">
                        {banner.image_url ? (
                          <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-1">
                            <Upload className="w-4 h-4 text-slate-300 mx-auto" />
                            <span className="text-[8px] font-semibold text-slate-400 block">Yükle</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleBannerUpload(banner.id, e)}
                        />
                      </div>
                    </div>

                    {/* Text Inputs */}
                    <div className="space-y-2 sm:col-span-2">
                      <div>
                        <input
                          type="text"
                          value={banner.title || ""}
                          onChange={(e) => handleUpdateBanner(banner.id, "title", e.target.value)}
                          placeholder="Afiş Başlığı (Örn: %50 İndirim)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={banner.subtitle || ""}
                          onChange={(e) => handleUpdateBanner(banner.id, "subtitle", e.target.value)}
                          placeholder="Alt Başlık"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons & Alignment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={banner.button_text || ""}
                        onChange={(e) => handleUpdateBanner(banner.id, "button_text", e.target.value)}
                        placeholder="Buton Yazısı"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium"
                      />
                      <input
                        type="text"
                        value={banner.button_link || ""}
                        onChange={(e) => handleUpdateBanner(banner.id, "button_link", e.target.value)}
                        placeholder="Link (#catalog)"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono"
                      />
                    </div>

                    <div className="flex gap-1 items-center">
                      <span className="text-[10px] font-semibold text-slate-400 mr-1">Hizalama:</span>
                      {[
                        { key: "left", icon: <AlignLeft className="w-3.5 h-3.5" /> },
                        { key: "center", icon: <AlignCenter className="w-3.5 h-3.5" /> },
                        { key: "right", icon: <AlignRight className="w-3.5 h-3.5" /> }
                      ].map((pos) => (
                        <button
                          key={pos.key}
                          type="button"
                          onClick={() => handleUpdateBanner(banner.id, "text_position", pos.key)}
                          className={`p-1.5 rounded border transition-colors cursor-pointer ${
                            (banner.text_position || "center") === pos.key
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {pos.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INSTAGRAM HİKAYELERİ */}
      {activeTab === "stories" && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                {lang === "tr" ? "Instagram Hikayeleri" : "Instagram Stories"}
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {lang === "tr" ? "Vitrinde üstte yer alan Instagram hikaye halkalarını yönetin." : "Manage top story bubbles and product links."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.show_story_ribbon !== false}
                  onChange={(e) => updateThemeConfig({ show_story_ribbon: e.target.checked })}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {lang === "tr" ? "Hikayeler Aktif" : "Enable"}
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddStory}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === "tr" ? "Hikaye Ekle" : "Add Story"}</span>
              </button>
            </div>
          </div>

          {/* Stories List */}
          {stories.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-slate-500 text-xs font-normal">
                {lang === "tr" ? "Henüz hikaye eklenmedi." : "No stories added yet."}
              </p>
              <button
                type="button"
                onClick={handleAddStory}
                className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold rounded-md cursor-pointer"
              >
                {lang === "tr" ? "İlk Hikayeyi Ekle" : "Add First Story"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {stories.map((story, idx) => (
                <div
                  key={story.id || idx}
                  className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col gap-2 relative hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">
                      #{idx + 1} HİKAYE
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStory(idx)}
                      className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative group/simg w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-500 shrink-0 overflow-hidden cursor-pointer">
                      <img
                        src={story.image_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover bg-white"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleStoryImageUpload(idx, e)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={story.title || ""}
                        onChange={(e) => handleUpdateStory(idx, "title", e.target.value)}
                        placeholder="Hikaye Başlığı"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800"
                      />
                      <input
                        type="text"
                        value={story.badge || ""}
                        onChange={(e) => handleUpdateStory(idx, "badge", e.target.value)}
                        placeholder="Rozet (Örn: YENİ)"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={story.link || ""}
                      onChange={(e) => handleUpdateStory(idx, "link", e.target.value)}
                      placeholder="Target Link (#catalog)"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-mono text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: KAPSÜL BLOKLARI (BENTO) */}
      {activeTab === "bento" && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Grid3X3 className="w-3.5 h-3.5 text-indigo-600" />
                {lang === "tr" ? "Kapsül Blokları (Bento Grid)" : "Bento Showcase"}
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                {lang === "tr" ? "Öne çıkan koleksiyon ve kategoriler için görsel Bento kartları." : "Promote categories with high-impact bento cards."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.show_bento_grid !== false}
                  onChange={(e) => updateThemeConfig({ show_bento_grid: e.target.checked })}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {lang === "tr" ? "Bento Aktif" : "Enable"}
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddBento}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === "tr" ? "Kapsül Ekle" : "Add Block"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
            <input
              type="text"
              placeholder={lang === "tr" ? "Bölüm Başlığı (Örn: Öne Çıkan Koleksiyonlar)" : "Section Title"}
              value={themeConfig.featured_capsules_title || ""}
              onChange={(e) => updateThemeConfig({ featured_capsules_title: e.target.value })}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-800"
            />
            <input
              type="text"
              placeholder={lang === "tr" ? "Bölüm Alt Başlığı" : "Section Subtitle"}
              value={themeConfig.featured_capsules_subtitle || ""}
              onChange={(e) => updateThemeConfig({ featured_capsules_subtitle: e.target.value })}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700"
            />
          </div>

          {/* Bento Cards List */}
          {bentoBlocks.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <p className="text-slate-500 text-xs font-normal">
                {lang === "tr" ? "Henüz bento bloğu eklenmedi." : "No bento blocks added yet."}
              </p>
              <button
                type="button"
                onClick={handleAddBento}
                className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold rounded-md cursor-pointer"
              >
                {lang === "tr" ? "İlk Bloğu Ekle" : "Add First Block"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bentoBlocks.map((bento, idx) => (
                <div
                  key={bento.id || idx}
                  className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 flex flex-col gap-2 relative hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                    <span className="text-[10px] font-bold text-indigo-600">
                      #{idx + 1} {bento.size === "large" ? "GENİŞ (2x)" : "STANDART (1x)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBento(idx)}
                      className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Size Selector */}
                  <div className="flex gap-1">
                    {[
                      { id: "large", label: "Geniş (2x)" },
                      { id: "medium", label: "Orta (1x)" },
                      { id: "small", label: "Kompakt" }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleUpdateBento(idx, "size", s.id)}
                        className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                          bento.size === s.id
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Image */}
                  <div className="relative h-20 bg-white border border-slate-200 rounded-md overflow-hidden flex items-center justify-center">
                    <img src={bento.image_url} alt="" className="w-full h-full object-cover" />
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleBentoImageUpload(idx, e)}
                    />
                  </div>

                  {/* Inputs */}
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={bento.title || ""}
                      onChange={(e) => handleUpdateBento(idx, "title", e.target.value)}
                      placeholder="Kapsül Başlığı"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900"
                    />
                    <input
                      type="text"
                      value={bento.subtitle || ""}
                      onChange={(e) => handleUpdateBento(idx, "subtitle", e.target.value)}
                      placeholder="Alt Başlık"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-700"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={bento.badge || ""}
                        onChange={(e) => handleUpdateBento(idx, "badge", e.target.value)}
                        placeholder="Rozet"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-indigo-600"
                      />
                      <input
                        type="text"
                        value={bento.cta_text || ""}
                        onChange={(e) => handleUpdateBento(idx, "cta_text", e.target.value)}
                        placeholder="Buton Metni"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800"
                      />
                    </div>
                    <input
                      type="text"
                      value={bento.link || ""}
                      onChange={(e) => handleUpdateBento(idx, "link", e.target.value)}
                      placeholder="Yönlendirme Linki (#catalog)"
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DUYURU & ROZETLER */}
      {activeTab === "badges" && (
        <div className="space-y-3">
          {/* Announcement Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                {lang === "tr" ? "Üst Duyuru Bandı" : "Announcement Ticker"}
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.show_announcement_bar !== false}
                  onChange={(e) => updateThemeConfig({ show_announcement_bar: e.target.checked })}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700">{lang === "tr" ? "Aktif" : "Enabled"}</span>
              </label>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={themeConfig.announcement_text || ""}
                onChange={(e) => updateThemeConfig({ announcement_text: e.target.value })}
                placeholder="Örn: ✨ 1.500 TL Üzeri Ücretsiz Kargo & Aynı Gün Teslimat"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
              />

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.announcement_marquee !== false}
                  onChange={(e) => updateThemeConfig({ announcement_marquee: e.target.checked })}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-xs font-normal text-slate-600">
                  {lang === "tr" ? "Kayan Yazı Animasyonu (Marquee Efekti)" : "Marquee scrolling animation"}
                </span>
              </label>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                {lang === "tr" ? "Güven & Avantaj Rozetleri" : "Trust & Value Badges"}
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.show_trust_badges !== false}
                  onChange={(e) => updateThemeConfig({ show_trust_badges: e.target.checked })}
                  className="w-3.5 h-3.5 text-indigo-600 rounded"
                />
                <span className="text-xs font-semibold text-slate-700">{lang === "tr" ? "Aktif" : "Enabled"}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(themeConfig.trust_badges || DEFAULT_SHOP_THEME.trust_badges || []).map((badge, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">ROZET #{idx + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={badge.title}
                    onChange={(e) => {
                      const list = [...(themeConfig.trust_badges || DEFAULT_SHOP_THEME.trust_badges || [])];
                      list[idx] = { ...list[idx], title: e.target.value };
                      updateThemeConfig({ trust_badges: list });
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-900"
                    placeholder="Rozet Başlığı"
                  />
                  <textarea
                    rows={2}
                    value={badge.description}
                    onChange={(e) => {
                      const list = [...(themeConfig.trust_badges || DEFAULT_SHOP_THEME.trust_badges || [])];
                      list[idx] = { ...list[idx], description: e.target.value };
                      updateThemeConfig({ trust_badges: list });
                    }}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] text-slate-600 resize-none"
                    placeholder="Açıklama"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
