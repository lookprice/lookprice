import React, { useState, useMemo } from "react";
import {
  Palette,
  Sparkles,
  SlidersHorizontal,
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
  ArrowRight,
  RefreshCw,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoveUp,
  MoveDown,
  ExternalLink,
  MessageCircle,
  Truck,
  Lock,
  Star,
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

    // Also sync backwards compatibility fields if present
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

  // Helper to apply preset
  const handleApplyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      updateThemeConfig({
        ...preset,
        preset_name: presetKey as any
      });
    }
  };

  // --- Normalized Banners Management ---
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

  // --- Stories Management ---
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

  // --- Bento Blocks Management ---
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
    <div className="space-y-8">
      {/* Studio Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black tracking-widest uppercase text-indigo-200 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>SHOPLP GÖRSEL TASARIM STÜDYOSU</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {lang === "tr" ? "Canlı Vitrin, Konsept & Tema Yönetimi" : "Live Storefront & Concept Studio"}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {lang === "tr"
                ? "E-ticaret sitenizin hazır tema konseptlerini, renk paletini, Instagram hikayelerini, vitrin afişlerini ve öne çıkan kapsül bloklarını buradan tam özgürlükle tasarlayın."
                : "Customize presets, color palettes, Instagram story swatches, hero banners, and bento showcases for your retail store."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{lang === "tr" ? "Tema Ayarlarını Kaydet" : "Save Theme Settings"}</span>
              </button>
            )}
            <a
              href={`/s/${branding?.slug || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{lang === "tr" ? "Vitrini Gör" : "Preview Store"}</span>
            </a>
          </div>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-white/10 no-scrollbar">
          {[
            { id: "presets", label: lang === "tr" ? "Konsept & Renkler" : "Presets & Colors", icon: <Palette className="w-4 h-4" /> },
            { id: "hero", label: lang === "tr" ? "Hero Banner & Afişler" : "Hero & Banners", icon: <ImageIcon className="w-4 h-4" /> },
            { id: "stories", label: lang === "tr" ? "Instagram Hikayeleri" : "Stories", icon: <Smartphone className="w-4 h-4" /> },
            { id: "bento", label: lang === "tr" ? "Kapsül Blokları (Bento)" : "Bento Capsules", icon: <Grid3X3 className="w-4 h-4" /> },
            { id: "badges", label: lang === "tr" ? "Duyuru & Güven Rozetleri" : "Badges & Tickers", icon: <ShieldCheck className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: PRESETS & COLORS */}
      {activeTab === "presets" && (
        <div className="space-y-6">
          {/* Preset Cards */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {lang === "tr" ? "1-TIKLA HAZIR TEMA KONSEPTLERİ" : "1-CLICK THEME PRESETS"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === "tr"
                  ? "Mağazanızın tüm görsel kimliğini sektörünüze uygun hazır estetik şablonlarla anında güncelleyin."
                  : "Switch your entire store's aesthetic with pre-engineered design presets."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: "minimal_swiss",
                  title: lang === "tr" ? "Minimal Butik" : "Minimal Swiss",
                  desc: lang === "tr" ? "Temiz beyaz zemin, keskin tipografi, lüks sadelik." : "Clean layout, high readability, luxury whitespace.",
                  bg: "bg-slate-50 border-slate-200",
                  dot1: "#0f172a",
                  dot2: "#e11d48"
                },
                {
                  id: "luxury_dark",
                  title: lang === "tr" ? "Lüks & Gece (Dark)" : "Luxury Dark",
                  desc: lang === "tr" ? "Koyu antrasit zemin, altın ve kehribar ışıltısı." : "Dark palette, amber accents, VIP atmosphere.",
                  bg: "bg-slate-900 text-white border-slate-800",
                  dot1: "#f59e0b",
                  dot2: "#d97706"
                },
                {
                  id: "nordic_warm",
                  title: lang === "tr" ? "İskandinav Sıcak" : "Nordic Warm",
                  desc: lang === "tr" ? "Doğal toprak tonları, bej zemin, samimi butik." : "Warm beige tones, organic artisan vibes.",
                  bg: "bg-amber-50/60 border-amber-200/80",
                  dot1: "#475569",
                  dot2: "#0d9488"
                },
                {
                  id: "street_bold",
                  title: lang === "tr" ? "Sokak & Enerjik" : "Street Bold",
                  desc: lang === "tr" ? "Yüksek kontrast, keskin köşeler, sokak modası." : "High contrast, sharp corners, streetwear energy.",
                  bg: "bg-zinc-100 border-zinc-300",
                  dot1: "#000000",
                  dot2: "#6366f1"
                }
              ].map((p) => {
                const isSelected = themeConfig.preset_name === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleApplyPreset(p.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between gap-4 ${p.bg} ${
                      isSelected
                        ? "ring-4 ring-indigo-500/20 border-indigo-600 shadow-lg scale-[1.02]"
                        : "hover:border-slate-400 hover:shadow-md"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        {lang === "tr" ? "AKTİF" : "ACTIVE"}
                      </span>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: p.dot1 }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: p.dot2 }} />
                      </div>
                      <h4 className="text-sm font-black tracking-tight">{p.title}</h4>
                      <p className="text-[11px] opacity-75 leading-relaxed">{p.desc}</p>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-black/5 hover:bg-black/10 text-slate-800"
                      }`}
                    >
                      {isSelected ? (lang === "tr" ? "Seçili Konsept" : "Selected") : (lang === "tr" ? "Uygula" : "Apply")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Color & Card Appearance Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colors */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                {lang === "tr" ? "RENK & ATMOSFER" : "COLORS & ATMOSPHERE"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                    {lang === "tr" ? "Zemin Modu" : "Background Mode"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "light", label: lang === "tr" ? "Açık (Light)" : "Light" },
                      { id: "dark", label: lang === "tr" ? "Koyu (Dark)" : "Dark" },
                      { id: "warm", label: lang === "tr" ? "Sıcak Bej (Warm)" : "Warm" }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => updateThemeConfig({ background_mode: mode.id as any })}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          themeConfig.background_mode === mode.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "tr" ? "Ana Renk" : "Primary Color"}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig.primary_color || "#0f172a"}
                        onChange={(e) => updateThemeConfig({ primary_color: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={themeConfig.primary_color || "#0f172a"}
                        onChange={(e) => updateThemeConfig({ primary_color: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "tr" ? "Vurgu / Aksan Rengi" : "Accent Color"}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig.accent_color || "#e11d48"}
                        onChange={(e) => updateThemeConfig({ accent_color: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={themeConfig.accent_color || "#e11d48"}
                        onChange={(e) => updateThemeConfig({ accent_color: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Card Styling */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-5">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                {lang === "tr" ? "ÜRÜN KARTI DİZAYNI" : "PRODUCT CARD STYLING"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                    {lang === "tr" ? "Kart Yapısı & Teması" : "Card Surface Style"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "minimal", label: lang === "tr" ? "Klasik Minimal" : "Minimal" },
                      { id: "borderless", label: lang === "tr" ? "Çerçevesiz Ferah" : "Borderless" },
                      { id: "elevated", label: lang === "tr" ? "Yükseltilmiş Gölge" : "Elevated" },
                      { id: "glass", label: lang === "tr" ? "Cam Efekti (Glass)" : "Glass" },
                      { id: "neo", label: lang === "tr" ? "Retro Neomorfik" : "Neo" }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => updateThemeConfig({ card_style: st.id as any })}
                        className={`py-2 px-2 text-center rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          (themeConfig.card_style || "minimal") === st.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                    {lang === "tr" ? "Köşe Yuvarlaklığı" : "Corner Radius"}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "none", label: "0px (Düz)" },
                      { id: "subtle", label: "8px (Hafif)" },
                      { id: "rounded", label: "16px (Zarif)" },
                      { id: "pill", label: "24px (Yuvarlak)" }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => updateThemeConfig({ card_radius: r.id as any })}
                        className={`py-2 px-2 text-center rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          themeConfig.card_radius === r.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                    {lang === "tr" ? "Görsel Hover / Üzerine Gelme Efekti" : "Card Hover Effect"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "secondary_image", label: lang === "tr" ? "2. Görseli Aç" : "2nd Image" },
                      { id: "zoom", label: lang === "tr" ? "Fotoğraf Zoom" : "Zoom" },
                      { id: "glow", label: lang === "tr" ? "Parlama & Gölge" : "Glow" }
                    ].map((eff) => (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => updateThemeConfig({ card_hover_effect: eff.id as any })}
                        className={`py-2 px-2 text-center rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          themeConfig.card_hover_effect === eff.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {eff.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-2">
                    {lang === "tr" ? "Kart Fotoğraf Oranı" : "Aspect Ratio"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "portrait", label: "3:4 (Dikey Moda)" },
                      { id: "square", label: "1:1 (Kare Standart)" },
                      { id: "wide", label: "16:9 (Yatay)" }
                    ].map((asp) => (
                      <button
                        key={asp.id}
                        type="button"
                        onClick={() => updateThemeConfig({ card_aspect_ratio: asp.id as any })}
                        className={`py-2 px-2 text-center rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          themeConfig.card_aspect_ratio === asp.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
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

      {/* TAB 2: HERO & BANNERS */}
      {activeTab === "hero" && (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                {lang === "tr" ? "HERO SLIDER & AFİŞ YÖNETİMİ" : "HERO SLIDER & BANNER MANAGER"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === "tr"
                  ? "Sitenizin en üstündeki hero vitrin afişlerini ekleyin, metinlerini ve buton bağlantılarını düzenleyin."
                  : "Add hero slides, text overlays, and call-to-action button links."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddBanner}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === "tr" ? "Yeni Afiş Ekle" : "Add Slide"}</span>
            </button>
          </div>

          {/* Banner Layout Style & Visibility */}
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={themeConfig.show_hero_banner !== false}
                onChange={(e) => updateThemeConfig({ show_hero_banner: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {lang === "tr" ? "Hero Banner'ı Göster" : "Show Hero Banner"}
              </span>
            </label>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {lang === "tr" ? "Hero Vitrin Düzeni" : "Hero Layout Style"}
              </span>
              <div className="flex flex-wrap gap-2">
              {[
                { id: "split", label: lang === "tr" ? "Split (Metin + Kayan Görsel)" : "Split Hero" },
                { id: "full_banner", label: lang === "tr" ? "Tam Ekran Banner" : "Full Banner" },
                { id: "editorial", label: lang === "tr" ? "Editoryal / Magazin" : "Editorial" }
              ].map((hl) => (
                <button
                  key={hl.id}
                  type="button"
                  onClick={() => updateThemeConfig({ hero_layout: hl.id as any })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    themeConfig.hero_layout === hl.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {hl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Banner Cards List */}
          {normalizedBanners.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">
                {lang === "tr" ? "Henüz afiş eklemediniz." : "No banner slides added yet."}
              </p>
              <button
                type="button"
                onClick={handleAddBanner}
                className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                {lang === "tr" ? "İlk Afişi Ekle" : "Add First Slide"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {normalizedBanners.map((banner: any, idx: number) => (
                <div
                  key={banner.id || idx}
                  className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-col gap-4 relative hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-black text-indigo-600 tracking-wider flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                        #{idx + 1}
                      </span>
                      {lang === "tr" ? `SLAYT #${idx + 1}` : `SLIDE #${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBanner(banner.id)}
                      className="text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-black cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === "tr" ? "SİL" : "DELETE"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Image */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        {lang === "tr" ? "Afiş Görseli" : "Slide Image"}
                      </label>
                      <div className="relative group/img h-32 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center shadow-xs">
                        {banner.image_url ? (
                          <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-2">
                            <Upload className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <span className="text-[8px] font-black text-slate-400 uppercase block">Görsel Seç</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleBannerUpload(banner.id, e)}
                        />
                      </div>
                      <input
                        type="text"
                        value={banner.image_url || ""}
                        onChange={(e) => handleUpdateBanner(banner.id, "image_url", e.target.value)}
                        placeholder="Görsel URL veya Base64..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono text-slate-700"
                      />
                    </div>

                    {/* Text Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          {lang === "tr" ? "Afiş Başlığı" : "Title"}
                        </label>
                        <input
                          type="text"
                          value={banner.title || ""}
                          onChange={(e) => handleUpdateBanner(banner.id, "title", e.target.value)}
                          placeholder="Örn: %50 Sezon İndirimi"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          {lang === "tr" ? "Afiş Alt Başlığı" : "Subtitle"}
                        </label>
                        <input
                          type="text"
                          value={banner.subtitle || ""}
                          onChange={(e) => handleUpdateBanner(banner.id, "subtitle", e.target.value)}
                          placeholder="Örn: Seçili ürünlerde kaçırılmayacak fırsat"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Buttons & Alignment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        {lang === "tr" ? "Buton Metni & Linki" : "Button CTA & Link"}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={banner.button_text || ""}
                          onChange={(e) => handleUpdateBanner(banner.id, "button_text", e.target.value)}
                          placeholder="İncele"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                        <input
                          type="text"
                          value={banner.button_link || ""}
                          onChange={(e) => handleUpdateBanner(banner.id, "button_link", e.target.value)}
                          placeholder="#catalog"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                        {lang === "tr" ? "Metin Hizalaması" : "Text Alignment"}
                      </label>
                      <div className="flex gap-2">
                        {[
                          { key: "left", icon: <AlignLeft className="w-3.5 h-3.5" />, label: "Sol" },
                          { key: "center", icon: <AlignCenter className="w-3.5 h-3.5" />, label: "Orta" },
                          { key: "right", icon: <AlignRight className="w-3.5 h-3.5" />, label: "Sağ" }
                        ].map((pos) => (
                          <button
                            key={pos.key}
                            type="button"
                            onClick={() => handleUpdateBanner(banner.id, "text_position", pos.key)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                              (banner.text_position || "center") === pos.key
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {pos.icon}
                            <span>{pos.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STORIES */}
      {activeTab === "stories" && (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                {lang === "tr" ? "INSTAGRAM TARZI HİKAYELER (STORIES)" : "INSTAGRAM STORIES MANAGER"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === "tr"
                  ? "Vitrininizin en üstünde beliren Instagram tarzı hikaye halkalarını yönetin ve doğrudan ürünlere bağlayın."
                  : "Manage story bubbles, video/photo slides, and direct product links."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.show_story_ribbon !== false}
                  onChange={(e) => updateThemeConfig({ show_story_ribbon: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-black text-slate-800">
                  {lang === "tr" ? "Hikayeleri Göster" : "Enable Stories"}
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddStory}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === "tr" ? "Hikaye Ekle" : "Add Story"}</span>
              </button>
            </div>
          </div>

          {/* Stories List */}
          {stories.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">
                {lang === "tr" ? "Henüz hikaye eklemediniz." : "No stories added yet."}
              </p>
              <button
                type="button"
                onClick={handleAddStory}
                className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-lg cursor-pointer"
              >
                {lang === "tr" ? "İlk Hikayeyi Ekle" : "Add First Story"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stories.map((story, idx) => (
                <div
                  key={story.id || idx}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3 relative hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                      #{idx + 1} HİKAYE
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStory(idx)}
                      className="text-rose-600 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Circular Preview + File Input */}
                  <div className="flex items-center gap-3">
                    <div className="relative group/simg w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-rose-500 to-amber-500 shrink-0 overflow-hidden">
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
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                      <input
                        type="text"
                        value={story.badge || ""}
                        onChange={(e) => handleUpdateStory(idx, "badge", e.target.value)}
                        placeholder="Rozet (örn: YENİ)"
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={story.link || ""}
                      onChange={(e) => handleUpdateStory(idx, "link", e.target.value)}
                      placeholder="Hedef Link (#catalog veya URL)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BENTO CAPSULES */}
      {activeTab === "bento" && (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-indigo-600" />
                {lang === "tr" ? "BENTO IZGARA & ÖNE ÇIKAN KAPSÜLLER" : "BENTO SHOWCASE BLOCKS"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === "tr"
                  ? "Vitrinde çok satan koleksiyonları veya özel kategorileri vurgulayan görsel Bento Grid kartları."
                  : "Promote collections and capsules using high-impact bento cards."}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <input
                  type="text"
                  placeholder={lang === "tr" ? "Bölüm Başlığı" : "Section Title"}
                  value={themeConfig.featured_capsules_title || ""}
                  onChange={(e) => updateThemeConfig({ featured_capsules_title: e.target.value })}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
                <input
                  type="text"
                  placeholder={lang === "tr" ? "Bölüm Alt Başlığı" : "Section Subtitle"}
                  value={themeConfig.featured_capsules_subtitle || ""}
                  onChange={(e) => updateThemeConfig({ featured_capsules_subtitle: e.target.value })}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.show_bento_grid !== false}
                  onChange={(e) => updateThemeConfig({ show_bento_grid: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-black text-slate-800">
                  {lang === "tr" ? "Bento Izgarayı Göster" : "Enable Bento Grid"}
                </span>
              </label>

              <button
                type="button"
                onClick={handleAddBento}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === "tr" ? "Kapsül Ekle" : "Add Block"}</span>
              </button>
            </div>
          </div>

          {/* Bento Cards List */}
          {bentoBlocks.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Grid3X3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">
                {lang === "tr" ? "Henüz bento bloğu eklemediniz." : "No bento blocks added yet."}
              </p>
              <button
                type="button"
                onClick={handleAddBento}
                className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-lg cursor-pointer"
              >
                {lang === "tr" ? "İlk Bloğu Ekle" : "Add First Block"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bentoBlocks.map((bento, idx) => (
                <div
                  key={bento.id || idx}
                  className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-4 relative hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-black text-indigo-600 tracking-wider">
                      #{idx + 1} {bento.size === "large" ? "GENİŞ BLOK (2 Kolon)" : "STANDART BLOK"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBento(idx)}
                      className="text-rose-600 hover:text-rose-700 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Size Selector */}
                  <div className="flex gap-2">
                    {[
                      { id: "large", label: "Geniş (2x)" },
                      { id: "medium", label: "Orta (1x)" },
                      { id: "small", label: "Kompakt" }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleUpdateBento(idx, "size", s.id)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
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
                  <div className="relative h-28 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
                    <img src={bento.image_url} alt="" className="w-full h-full object-cover" />
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleBentoImageUpload(idx, e)}
                    />
                  </div>

                  {/* Inputs */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={bento.title || ""}
                      onChange={(e) => handleUpdateBento(idx, "title", e.target.value)}
                      placeholder="Başlık (örn: İkonik Saatler)"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                    />
                    <input
                      type="text"
                      value={bento.subtitle || ""}
                      onChange={(e) => handleUpdateBento(idx, "subtitle", e.target.value)}
                      placeholder="Alt Başlık / Açıklama"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={bento.badge || ""}
                        onChange={(e) => handleUpdateBento(idx, "badge", e.target.value)}
                        placeholder="Rozet (ÖZEL)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-indigo-600"
                      />
                      <input
                        type="text"
                        value={bento.cta_text || ""}
                        onChange={(e) => handleUpdateBento(idx, "cta_text", e.target.value)}
                        placeholder="Buton Yazısı"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={bento.link || ""}
                        onChange={(e) => handleUpdateBento(idx, "link", e.target.value)}
                        placeholder="Yönlendirme Linki (Örn: #catalog, /p/urun-slug)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BADGES & TICKERS */}
      {activeTab === "badges" && (
        <div className="space-y-6">
          {/* Announcement Bar */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                {lang === "tr" ? "ÜST DUYURU BANDI (TICKER)" : "ANNOUNCEMENT TICKER"}
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.show_announcement_bar !== false}
                  onChange={(e) => updateThemeConfig({ show_announcement_bar: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">{lang === "tr" ? "Aktif" : "Enabled"}</span>
              </label>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={themeConfig.announcement_text || ""}
                onChange={(e) => updateThemeConfig({ announcement_text: e.target.value })}
                placeholder="Örn: ✨ 1.500 TL Üzeri Ücretsiz Kargo & Aynı Gün Teslimat Fırsatı"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.announcement_marquee !== false}
                  onChange={(e) => updateThemeConfig({ announcement_marquee: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-medium text-slate-600">
                  {lang === "tr" ? "Kayan Yazı Animasyonu (Marquee Efekti)" : "Marquee scrolling animation"}
                </span>
              </label>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                {lang === "tr" ? "GÜVEN & AVANTAJ ROZETLERİ" : "TRUST & VALUE PROPOSITIONS"}
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={themeConfig.show_trust_badges !== false}
                  onChange={(e) => updateThemeConfig({ show_trust_badges: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">{lang === "tr" ? "Aktif" : "Enabled"}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(themeConfig.trust_badges || DEFAULT_SHOP_THEME.trust_badges || []).map((badge, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">ROZET #{idx + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={badge.title}
                    onChange={(e) => {
                      const list = [...(themeConfig.trust_badges || DEFAULT_SHOP_THEME.trust_badges || [])];
                      list[idx] = { ...list[idx], title: e.target.value };
                      updateThemeConfig({ trust_badges: list });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                    placeholder="Başlık"
                  />
                  <textarea
                    rows={2}
                    value={badge.description}
                    onChange={(e) => {
                      const list = [...(themeConfig.trust_badges || DEFAULT_SHOP_THEME.trust_badges || [])];
                      list[idx] = { ...list[idx], description: e.target.value };
                      updateThemeConfig({ trust_badges: list });
                    }}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 resize-none"
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
