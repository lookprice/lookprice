import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Palette, 
  Sparkles, 
  Layers, 
  Eye, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  Check, 
  Sliders, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Lock,
  Smartphone,
  Laptop,
  Maximize2,
  X,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { DEFAULT_SHOP_THEME, ShopThemeConfig, THEME_PRESETS } from "../../../utils/shopThemePresets";

interface SettingsLayoutTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  storeSlug?: string;
}

export const SettingsLayoutTab: React.FC<SettingsLayoutTabProps> = ({
  branding,
  onBrandingChange,
  storeSlug
}) => {
  // Parse or initialize theme config
  const themeConfig: ShopThemeConfig = React.useMemo(() => {
    const raw = branding?.theme_config || branding?.page_layout_settings?.theme_config;
    if (typeof raw === "string") {
      try { return { ...DEFAULT_SHOP_THEME, ...JSON.parse(raw) }; } catch (e) { return DEFAULT_SHOP_THEME; }
    } else if (raw && typeof raw === "object") {
      return { ...DEFAULT_SHOP_THEME, ...raw };
    }
    return DEFAULT_SHOP_THEME;
  }, [branding]);

  const [activeTab, setActiveTab] = useState<"presets" | "blocks" | "stories" | "bento" | "styling">("presets");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const updateThemeConfig = (updates: Partial<ShopThemeConfig>) => {
    const updated = { ...themeConfig, ...updates };
    onBrandingChange("theme_config", updated);
    
    // Also sync to page_layout_settings
    const currentSettings = branding?.page_layout_settings || {};
    onBrandingChange("page_layout_settings", {
      ...currentSettings,
      theme_config: updated
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (preset) {
      updateThemeConfig({
        ...preset,
        preset_name: presetKey as any
      });
    }
  };

  // Stories management
  const stories = themeConfig.stories || [];
  const addStory = () => {
    const newStory = {
      id: `story_${Date.now()}`,
      title: "Yeni Kapsül",
      image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
      badge: "YENİ",
      link: "#catalog"
    };
    updateThemeConfig({ stories: [...stories, newStory] });
  };

  const updateStory = (id: string, field: string, value: string) => {
    const updated = stories.map(s => s.id === id ? { ...s, [field]: value } : s);
    updateThemeConfig({ stories: updated });
  };

  const removeStory = (id: string) => {
    updateThemeConfig({ stories: stories.filter(s => s.id !== id) });
  };

  // Bento Blocks management
  const bentoBlocks = themeConfig.bento_blocks || [];
  const addBentoBlock = () => {
    const newBlock = {
      id: `bento_${Date.now()}`,
      size: "medium" as const,
      title: "Özel Tasarım Başlığı",
      subtitle: "Koleksiyon detay açıklaması ve vurgusu.",
      badge: "YENİ SEZON",
      image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
      cta_text: "Keşfet",
      link: "#catalog"
    };
    updateThemeConfig({ bento_blocks: [...bentoBlocks, newBlock] });
  };

  const updateBentoBlock = (id: string, field: string, value: any) => {
    const updated = bentoBlocks.map(b => b.id === id ? { ...b, [field]: value } : b);
    updateThemeConfig({ bento_blocks: updated });
  };

  const removeBentoBlock = (id: string) => {
    updateThemeConfig({ bento_blocks: bentoBlocks.filter(b => b.id !== id) });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header & Quick Action */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black uppercase tracking-wider">
              SHOPLP VISUAL STUDIO
            </span>
            <span className="text-xs font-bold text-slate-400">• Swatch & Boutique Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Mağaza Vitrini & Tema Tasarımı
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Minimalist, yüksek çözünürlüklü ve anlık varyant geçişli yeni nesil vitrininizi kolayca özelleştirin.
          </p>
        </div>

        {/* Live Preview Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-xs font-black shadow-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Canlı Önizleme</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "presets", label: "Tema Presetleri", icon: Sparkles },
          { id: "blocks", label: "Sayfa Blokları", icon: Layers },
          { id: "stories", label: "Story (Hikaye) Şeridi", icon: ImageIcon },
          { id: "bento", label: "Bento Grid Kapsülleri", icon: Sliders },
          { id: "styling", label: "Kart & Tipografi", icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Tab: Presets */}
      {activeTab === "presets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preset 1: Minimal Swiss (Swatch / Apple) */}
          <div
            onClick={() => applyPreset("minimal_swiss")}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative ${
              themeConfig.preset_name === "minimal_swiss"
                ? "border-indigo-600 bg-indigo-50/20 shadow-md ring-4 ring-indigo-500/10"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
            }`}
          >
            {themeConfig.preset_name === "minimal_swiss" && (
              <div className="absolute top-4 right-4 p-1.5 bg-indigo-600 text-white rounded-full">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-black text-slate-900 dark:text-white">
                Minimalist Swiss (Swatch & Apple Tarzı)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Ultra temiz beyaz zemin, keskin kontrastlı tipografi, kart üzeri anlık varyant renk butonları ve lüks bento ızgarası.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 border border-white shadow-xs" />
              <span className="w-6 h-6 rounded-full bg-rose-600 border border-white shadow-xs" />
              <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 shadow-xs" />
              <span className="text-[11px] font-bold text-slate-400 ml-2">Açık Zemin • Portre Oran</span>
            </div>
          </div>

          {/* Preset 2: Luxury Dark (Obsidian & Gold) */}
          <div
            onClick={() => applyPreset("luxury_dark")}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative ${
              themeConfig.preset_name === "luxury_dark"
                ? "border-amber-500 bg-amber-500/5 shadow-md ring-4 ring-amber-500/10"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
            }`}
          >
            {themeConfig.preset_name === "luxury_dark" && (
              <div className="absolute top-4 right-4 p-1.5 bg-amber-500 text-slate-950 rounded-full">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-black text-slate-900 dark:text-white">
                Luxury Obsidian (Koyu & Altın Lüks)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Koyu obsidyen arka plan, sıcak altın vurgular, saat ve mücevher vitrinleri için premium atmosfer.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-700 shadow-xs" />
              <span className="w-6 h-6 rounded-full bg-amber-500 border border-slate-700 shadow-xs" />
              <span className="w-6 h-6 rounded-full bg-amber-700 border border-slate-700 shadow-xs" />
              <span className="text-[11px] font-bold text-slate-400 ml-2">Koyu Zemin • Gold Vurgular</span>
            </div>
          </div>

          {/* Preset 3: Nordic Warm */}
          <div
            onClick={() => applyPreset("nordic_warm")}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative ${
              themeConfig.preset_name === "nordic_warm"
                ? "border-teal-600 bg-teal-50/20 shadow-md ring-4 ring-teal-500/10"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
            }`}
          >
            {themeConfig.preset_name === "nordic_warm" && (
              <div className="absolute top-4 right-4 p-1.5 bg-teal-600 text-white rounded-full">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-black text-slate-900 dark:text-white">
                Nordic Warmth (Sıcak Natürel)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Doğal bej ve sıcak gri tonlar, yuvarlak hap şeklinde yumuşak butonlar, organik aksesuar ve moda vitrini.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-600 border border-white shadow-xs" />
              <span className="w-6 h-6 rounded-full bg-teal-600 border border-white shadow-xs" />
              <span className="w-6 h-6 rounded-full bg-stone-200 border border-slate-300 shadow-xs" />
              <span className="text-[11px] font-bold text-slate-400 ml-2">Kare Kart • Yumuşak Hatlar</span>
            </div>
          </div>

          {/* Preset 4: Streetwear Bold */}
          <div
            onClick={() => applyPreset("street_bold")}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative ${
              themeConfig.preset_name === "street_bold"
                ? "border-black dark:border-white bg-slate-50 dark:bg-slate-800 shadow-md"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
            }`}
          >
            {themeConfig.preset_name === "street_bold" && (
              <div className="absolute top-4 right-4 p-1.5 bg-black dark:bg-white text-white dark:text-black rounded-full">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base font-black text-slate-900 dark:text-white">
                Streetwear Bold (Keskin & Neon)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              0px keskin köşeli kartlar, cesur tipografi, neon mor & mavi vurgular, sokak modası ve saat koleksiyonları.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-none bg-black border border-slate-500 shadow-xs" />
              <span className="w-6 h-6 rounded-none bg-indigo-600 border border-slate-500 shadow-xs" />
              <span className="w-6 h-6 rounded-none bg-white border border-slate-300 shadow-xs" />
              <span className="text-[11px] font-bold text-slate-400 ml-2">Keskin Köşe • Glow Hover</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tab: Blocks */}
      {activeTab === "blocks" && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Vitrinde Gösterilecek Sayfa Blokları
          </h3>

          <div className="space-y-4">
            {/* Announcement Marquee Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Üst Duyuru & Kayan Yazı Bandı (Marquee)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  En üstte ücretsiz kargo, kampanya veya duyuru mesajlarını kayan şerit halinde gösterir.
                </p>
              </div>
              <input
                type="checkbox"
                checked={themeConfig.show_announcement_bar}
                onChange={(e) => updateThemeConfig({ show_announcement_bar: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {themeConfig.show_announcement_bar && (
              <div className="pl-6 space-y-2">
                <label className="text-xs font-bold text-slate-500">Duyuru Metni:</label>
                <input
                  type="text"
                  value={themeConfig.announcement_text || ""}
                  onChange={(e) => updateThemeConfig({ announcement_text: e.target.value })}
                  placeholder="✨ 1.500 TL Üzeri Ücretsiz Kargo & Aynı Gün Teslimat Fırsatı"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Story Ribbon Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Instagram / Swatch Tarzı Story (Hikaye) Şeridi
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Üst kısımda 9:16 formatında etkileyici görsel veya video hikaye halkaları sunar.
                </p>
              </div>
              <input
                type="checkbox"
                checked={themeConfig.show_story_ribbon}
                onChange={(e) => updateThemeConfig({ show_story_ribbon: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* Bento Grid Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Bento Grid Kapsül Vitrini
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Özel koleksiyonları, sınırlı üretimleri ve iş birliklerini asimetrik lüks kutularda sergiler.
                </p>
              </div>
              <input
                type="checkbox"
                checked={themeConfig.show_bento_grid}
                onChange={(e) => updateThemeConfig({ show_bento_grid: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>

            {/* Trust Badges Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Güven & Taahhüt Rozetleri (Trust Badges)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Orijinallik Garantisi, Hızlı Kargo, 14 Gün İade ve SSL Güvenli Ödeme avantajlarını listeler.
                </p>
              </div>
              <input
                type="checkbox"
                checked={themeConfig.show_trust_badges}
                onChange={(e) => updateThemeConfig({ show_trust_badges: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Tab: Stories Management */}
      {activeTab === "stories" && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Story (Hikaye) Halkaları Yönetimi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vitrinin en üstünde ziyaretçilerin tıklayıp tam ekran inceleyebileceği hikayeleri belirleyin.
              </p>
            </div>

            <button
              type="button"
              onClick={addStory}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Story Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-4 relative"
              >
                <div className="w-20 h-28 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                  <img
                    src={story.image_url}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Başlık</label>
                    <input
                      type="text"
                      value={story.title}
                      onChange={(e) => updateStory(story.id, "title", e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Görsel URL (9:16)</label>
                    <input
                      type="text"
                      value={story.image_url}
                      onChange={(e) => updateStory(story.id, "image_url", e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Rozet / Etiket</label>
                    <input
                      type="text"
                      value={story.badge || ""}
                      onChange={(e) => updateStory(story.id, "badge", e.target.value)}
                      placeholder="YENİ, LIMITED vb."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeStory(story.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 self-start"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab: Bento Grid */}
      {activeTab === "bento" && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Bento Grid Kapsül Blokları
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ana sayfadaki öne çıkan kapsül koleksiyon kutularını düzenleyin.
              </p>
            </div>

            <button
              type="button"
              onClick={addBentoBlock}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kapsül Bloğu Ekle</span>
            </button>
          </div>

          <div className="space-y-4">
            {bentoBlocks.map((block) => (
              <div
                key={block.id}
                className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6 relative"
              >
                <div className="w-full md:w-48 h-36 rounded-2xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                  <img
                    src={block.image_url}
                    alt={block.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Kapsül Başlığı</label>
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => updateBentoBlock(block.id, "title", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Rozet (Badge)</label>
                    <input
                      type="text"
                      value={block.badge || ""}
                      onChange={(e) => updateBentoBlock(block.id, "badge", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Açıklama / Alt Metin</label>
                    <input
                      type="text"
                      value={block.subtitle || ""}
                      onChange={(e) => updateBentoBlock(block.id, "subtitle", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Görsel URL</label>
                    <input
                      type="text"
                      value={block.image_url}
                      onChange={(e) => updateBentoBlock(block.id, "image_url", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Kutu Boyutu</label>
                    <select
                      value={block.size}
                      onChange={(e) => updateBentoBlock(block.id, "size", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="large">Geniş (2 Sütun Kaplar)</option>
                      <option value="medium">Orta (1 Sütun)</option>
                      <option value="small">Küçük (1 Sütun)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeBentoBlock(block.id)}
                  className="text-slate-400 hover:text-rose-600 p-2 absolute top-4 right-4"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tab: Styling */}
      {activeTab === "styling" && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Kart & Görsel Tercihleri
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card Aspect Ratio */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Görsel Oranı (Aspect Ratio)</label>
              <select
                value={themeConfig.card_aspect_ratio}
                onChange={(e) => updateThemeConfig({ card_aspect_ratio: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
              >
                <option value="portrait">3:4 Portre (Saat & Moda için İdeal)</option>
                <option value="square">1:1 Kare (Genel Perakende & Aksesuar)</option>
                <option value="wide">16:10 Geniş (Elektronik & Yatay)</option>
              </select>
            </div>

            {/* Card Radius */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Kart Köşe Yuvarlaklığı</label>
              <select
                value={themeConfig.card_radius}
                onChange={(e) => updateThemeConfig({ card_radius: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
              >
                <option value="none">0px - Keskin Köşeli (Streetwear)</option>
                <option value="subtle">8px - Hafif Kavisli</option>
                <option value="rounded">16px - Modern Lüks (Önerilen)</option>
                <option value="pill">24px - Tam Yuvarlak</option>
              </select>
            </div>

            {/* Card Hover Effect */}
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block">Kart Hover Efekti</label>
              <select
                value={themeConfig.card_hover_effect}
                onChange={(e) => updateThemeConfig({ card_hover_effect: e.target.value as any })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
              >
                <option value="secondary_image">İkinci Görseli Göster (Lookbook)</option>
                <option value="zoom">Görseli Yumuşakça Yakınlaştır</option>
                <option value="glow">Kartı Parlat (Glow)</option>
              </select>
            </div>

            {/* Swatches Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Kart Üzerinde Anlık Varyant Renkleri
                </h4>
                <p className="text-[11px] text-slate-400">
                  Kullanıcı karttan ayrılmadan renkleri tıklar ve fotoğraf anında değişir.
                </p>
              </div>
              <input
                type="checkbox"
                checked={themeConfig.show_swatches_on_card}
                onChange={(e) => updateThemeConfig({ show_swatches_on_card: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 text-white">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black uppercase tracking-wider">Canlı Vitrin Önizleme</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono">
                  CANLI
                </span>
              </div>

              {/* Device Selector */}
              <div className="flex items-center bg-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-2 rounded-lg transition-colors ${previewDevice === "desktop" ? "bg-white text-slate-950" : "text-white"}`}
                >
                  <Laptop className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-2 rounded-lg transition-colors ${previewDevice === "mobile" ? "bg-white text-slate-950" : "text-white"}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              <div
                className={`bg-white dark:bg-slate-950 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
                  previewDevice === "mobile" ? "w-[380px] h-[720px] border-8 border-slate-800" : "w-full h-full"
                }`}
              >
                <iframe
                  src={storeSlug ? `/${storeSlug}?preview=true` : "/?preview=true"}
                  className="w-full h-full border-0"
                  title="Storefront Preview"
                />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
