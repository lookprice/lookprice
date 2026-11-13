import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  Layers,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";
import { toast } from "sonner";
import resortHeroSunlitAsset from "../../assets/images/cyprus_sunlit_resort_hero_1794578840052.jpg";
import marinaLifestyleAsset from "../../assets/images/cyprus_marina_lifestyle_1794578840217.jpg";
import penthouseInteriorSunlitAsset from "../../assets/images/cyprus_penthouse_interior_1794578840887.jpg";
import masterplanAerialSunlitAsset from "../../assets/images/cyprus_villa_masterplan_1794578840537.jpg";
import villaTwilightAsset from "../../assets/images/lora_cyprus_villa_twilight_1794568366585.jpg";
import isometricFloorplanAsset from "../../assets/images/lora_isometric_3d_floorplan_1794568366571.jpg";
import interiorStagingAsset from "../../assets/images/lora_virtual_staging_interior_1794568367265.jpg";
import resortMasterplanAsset from "../../assets/images/cyprus_launch_banner_1790708092704.jpg";
import modernResidenceAsset from "../../assets/images/restate_bg_1785752020453.jpg";
import terraceLoungeAsset from "../../assets/images/horeca_bg_1785752045736.jpg";

export type UiversePresetId =
  | "shimmer_glass"
  | "tactile_3d"
  | "kinetic_spotlight"
  | "swiss_hairline";

export interface UiversePresetMeta {
  id: UiversePresetId;
  index: string;
  name: string;
  subtitle: string;
  badge: string;
  description: string;
  primaryBtnClass: string;
  secondaryBtnClass: string;
  cardHoverClass: string;
  badgeClass: string;
  previewBtnStyleClass: string;
}

export const UIVERSE_INTERACTION_PRESETS: Record<UiversePresetId, UiversePresetMeta> = {
  shimmer_glass: {
    id: "shimmer_glass",
    index: "01",
    name: "Altın Yansımalı Koyu Cam",
    subtitle: "Işık Geçişli Cam Yüzey & Altın Kenarlık",
    badge: "Prestij & Lüks",
    description:
      "Butonlarda yumuşak altın kenarlık vurgusu, kartlarda cam derinliği ve pürüzsüz yükselme geçişi.",
    primaryBtnClass:
      "relative overflow-hidden rounded-xl shadow-[0_10px_28px_-6px_rgba(197,160,89,0.55)] ring-1 ring-[#C5A059]/60 hover:shadow-[0_14px_34px_-4px_rgba(197,160,89,0.75)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200",
    secondaryBtnClass:
      "rounded-xl backdrop-blur-md border border-white/25 hover:border-[#C5A059] hover:bg-white/15 transition-all duration-200",
    cardHoverClass:
      "rounded-2xl transition-all duration-300 hover:shadow-[0_22px_45px_-12px_rgba(197,160,89,0.28)] hover:border-[#C5A059]",
    badgeClass:
      "rounded-lg border border-amber-400/40 bg-amber-500/10 text-amber-400",
    previewBtnStyleClass:
      "rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-[#C5A059] border border-[#C5A059]/60 shadow-[0_8px_20px_-4px_rgba(197,160,89,0.45)] hover:-translate-y-0.5"
  },
  tactile_3d: {
    id: "tactile_3d",
    index: "02",
    name: "3 Boyutlu Rölyef Buton & Çerçeve",
    subtitle: "3B Mekanik Basınç & Kütle Derinliği",
    badge: "3B Rölyef Stil",
    description:
      "Tıklama anında fiziksel derinlik hissi veren 3 boyutlu alt gölge katmanı ve kartlarda belirgin rölyef çerçeve.",
    primaryBtnClass:
      "rounded-xl border-2 border-slate-950/30 shadow-[0_5px_0_0_rgba(15,23,42,0.85)] hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_rgba(15,23,42,0.85)] active:translate-y-1 active:shadow-[0_1px_0_0_rgba(15,23,42,0.85)] transition-all duration-150",
    secondaryBtnClass:
      "rounded-xl border-2 border-current shadow-[0_4px_0_0_rgba(148,163,184,0.45)] active:translate-y-0.5 active:shadow-none transition-all duration-150",
    cardHoverClass:
      "rounded-2xl border-2 transition-all duration-200 shadow-[6px_6px_0px_0px_rgba(197,160,89,0.25)] hover:shadow-[8px_8px_0px_0px_rgba(197,160,89,0.5)]",
    badgeClass:
      "rounded-md border-b-2 border-indigo-400 bg-indigo-950/80 text-indigo-200",
    previewBtnStyleClass:
      "rounded-xl bg-amber-500 text-slate-950 border-2 border-slate-950 shadow-[0_5px_0_0_#0f172a] hover:-translate-y-0.5 hover:shadow-[0_7px_0_0_#0f172a] active:translate-y-1 active:shadow-[0_1px_0_0_#0f172a]"
  },
  kinetic_spotlight: {
    id: "kinetic_spotlight",
    index: "03",
    name: "Parlak Çerçeve & Hareketli İkon",
    subtitle: "Odak Halkası & İleri Kayan Yön İkonu",
    badge: "Dinamik Odak",
    description:
      "Kartların üzerine gelindiğinde parlak odak halkası ve buton içindeki ok ikonlarının ileri doğru ivmelenmesi.",
    primaryBtnClass:
      "group rounded-full ring-2 ring-amber-300/80 shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:ring-4 hover:shadow-[0_0_32px_rgba(245,158,11,0.75)] transition-all duration-200",
    secondaryBtnClass:
      "group rounded-full hover:ring-2 hover:ring-[#C5A059]/70 transition-all duration-200",
    cardHoverClass:
      "rounded-3xl transition-all duration-300 hover:ring-2 hover:ring-[#C5A059] hover:shadow-[0_0_35px_rgba(197,160,89,0.28)]",
    badgeClass:
      "rounded-full ring-1 ring-emerald-400/50 bg-emerald-500/10 text-emerald-300",
    previewBtnStyleClass:
      "group rounded-full bg-indigo-950 text-amber-300 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:ring-4"
  },
  swiss_hairline: {
    id: "swiss_hairline",
    index: "04",
    name: "Keskin Kurumsal Çizgi",
    subtitle: "Gölgesiz Net Mimari Çerçeve",
    badge: "Minimalist & Net",
    description:
      "Gölgesiz, keskin köşeli mimari kenarlıklar ve yüksek kontrastlı kurumsal renk dönüşümü.",
    primaryBtnClass:
      "rounded-none border-2 border-current uppercase tracking-widest hover:invert transition-all duration-150",
    secondaryBtnClass:
      "rounded-none border-2 border-current uppercase tracking-wider hover:bg-slate-900 hover:text-white transition-colors duration-150",
    cardHoverClass:
      "rounded-none border-2 transition-colors duration-150 hover:border-slate-950 dark:hover:border-white",
    badgeClass:
      "rounded-none border border-current uppercase tracking-widest",
    previewBtnStyleClass:
      "rounded-none bg-white text-slate-950 border-2 border-slate-950 uppercase tracking-widest hover:bg-slate-950 hover:text-white"
  }
};

export interface ArchitecturalLoraModel {
  id: string;
  name: string;
  category: string;
  defaultTitle: string;
  defaultPrompt: string;
  description: string;
  previewImage: string;
}

export function resolveArchitecturalAssetUrl(rawUrl: any): string {
  const s = String(rawUrl || "").trim();
  if (!s) return resortHeroSunlitAsset;
  if (s.includes("cyprus_sunlit_resort_hero")) return resortHeroSunlitAsset;
  if (s.includes("cyprus_marina_lifestyle")) return marinaLifestyleAsset;
  if (s.includes("cyprus_penthouse_interior")) return penthouseInteriorSunlitAsset;
  if (s.includes("cyprus_villa_masterplan")) return masterplanAerialSunlitAsset;
  if (s.includes("lora_cyprus_villa_twilight")) return villaTwilightAsset;
  if (s.includes("lora_isometric_3d_floorplan")) return isometricFloorplanAsset;
  if (s.includes("lora_virtual_staging_interior")) return interiorStagingAsset;
  if (s.includes("cyprus_launch_banner")) return resortMasterplanAsset;
  if (s.includes("restate_bg")) return modernResidenceAsset;
  if (s.includes("horeca_bg")) return terraceLoungeAsset;
  if (s.startsWith("/src/assets/images/")) {
    return s.replace("/src/assets/images/", "/assets/images/");
  }
  return s;
}

export function sanitizeArchitecturalGalleryRecord(item: any, idx: number = 0) {
  const rawCategory = String(item?.loraUsed || item?.category || "").trim();
  const cleanCategory =
    !rawCategory || /lora:|safetensors|forge|uiverse/i.test(rawCategory)
      ? idx % 3 === 1
        ? "3B Kat Kesiti & Plan"
        : idx % 3 === 2
        ? "İç Mekan Tasarımı"
        : "Dış Cephe & Masterplan"
      : rawCategory;

  const rawDesc = String(item?.promptCommand || item?.description || "").trim();
  const cleanDesc =
    !rawDesc || /ultra-luxury|photorealistic|8k|lora:|archdaily|isometric 3d architectural cutaway/i.test(rawDesc)
      ? idx % 3 === 1
        ? "Ölçekli oda dağılımı, teras havuzu bağlantısı ve bağımsız bölüm yerleşim detayı."
        : idx % 3 === 2
        ? "Akdeniz manzaralı panoramik salon, doğal taş zemin ve modern iç mekan kurgusu."
        : "Doğal traverten taş cephe, sonsuzluk havuzu ve Akdeniz kıyı peyzajı ile bütünleşik mimari tasarım."
      : rawDesc;

  const rawTitle = String(item?.title || "").trim();
  const cleanTitle =
    rawTitle
      .replace(/\(Virtual Staging\)/gi, "")
      .replace(/Forge GPU Render\s*\([^)]*\)/gi, "Özel Mimari Görsel Tasarımı")
      .replace(/LoRA/gi, "")
      .trim() || "Sahil Masterplan — Mimari Görsel Tasarımı";

  return {
    id: item?.id || `arch-vis-${idx + 1}`,
    title: cleanTitle,
    loraUsed: cleanCategory,
    category: cleanCategory,
    promptCommand: cleanDesc,
    description: cleanDesc,
    imageUrl: resolveArchitecturalAssetUrl(item?.imageUrl),
    createdAt: item?.createdAt || "Hazır Görsel"
  };
}

export const ARCHITECTURAL_LORA_MODELS: ArchitecturalLoraModel[] = [
  {
    id: "cyprus_mediterranean_arch",
    name: "Dış Cephe & Sahil Masterplan Görünümü",
    category: "Dış Cephe & Masterplan",
    defaultTitle: "Esentepe Sahil Rezidansları — Güneşli Dış Cephe & Lagün Havuzu",
    defaultPrompt:
      "Doğal traverten taş cephe, turkuaz lagün yüzme havuzu, Akdeniz gün ışığı ve sahil palmiye peyzajı",
    description:
      "Doğal traverten taş cephe, sonsuzluk havuzu ve Akdeniz kıyı peyzajı ile bütünleşik aydınlık mimari tasarım.",
    previewImage: resortHeroSunlitAsset
  },
  {
    id: "isometric_3d_floorplan_v2",
    name: "3 Boyutlu Kat Kesiti & Teras Planı",
    category: "3B Kat Kesiti & Plan",
    defaultTitle: "2+1 Penthouse — 3 Boyutlu Kat Kesiti & Teras Havuz Planı",
    defaultPrompt:
      "Ölçekli oda dağılımı, geniş çatı terası, özel havuz bağlantısı ve ebeveyn banyolu yatak odası yerleşimi",
    description:
      "Ölçekli oda dağılımı, teras havuzu bağlantısı ve bağımsız bölüm yerleşim detayı.",
    previewImage: isometricFloorplanAsset
  },
  {
    id: "luxury_interior_staging",
    name: "İç Mekan & Panoramik Salon Tasarımı",
    category: "İç Mekan Tasarımı",
    defaultTitle: "Akdeniz Sahil Penthouse — Panoramik Teras & Salon Tasarımı",
    defaultPrompt:
      "Gün ışığı alan panoramik deniz manzaralı salon, doğal traverten mermer zemin ve özel teras havuzu",
    description:
      "Akdeniz manzaralı panoramik salon, doğal taş zemin ve aydınlık modern iç mekan kurgusu.",
    previewImage: penthouseInteriorSunlitAsset
  }
];

interface UiverseAndLoraWebStudioProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding?: () => void;
  savingBranding?: boolean;
  sectorLabel?: string;
}

export const UiverseAndLoraWebStudio: React.FC<UiverseAndLoraWebStudioProps> = ({
  branding,
  onBrandingChange,
  onSaveBranding,
  savingBranding,
  sectorLabel = "Kurumsal Mağaza"
}) => {
  const cleanSectorLabel = String(sectorLabel || "Kurumsal Mağaza")
    .replace(/\s*\(projectLP\)\s*/gi, "")
    .replace(/\s*\(shopLP\)\s*/gi, "")
    .replace(/\s*\(horecaLP\)\s*/gi, "")
    .trim();

  const devConfig = (() => {
    const raw =
      branding?.developer_web_config ||
      branding?.page_layout_settings?.developer_web_config ||
      {};
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw || {};
  })();

  const activePresetId: UiversePresetId =
    devConfig.uiverse_preset && UIVERSE_INTERACTION_PRESETS[devConfig.uiverse_preset as UiversePresetId]
      ? (devConfig.uiverse_preset as UiversePresetId)
      : branding?.uiverse_preset && UIVERSE_INTERACTION_PRESETS[branding.uiverse_preset as UiversePresetId]
      ? (branding.uiverse_preset as UiversePresetId)
      : "shimmer_glass";

  const [selectedModelId, setSelectedModelId] = useState<string>(ARCHITECTURAL_LORA_MODELS[0].id);
  const activeModel =
    ARCHITECTURAL_LORA_MODELS.find(m => m.id === selectedModelId) || ARCHITECTURAL_LORA_MODELS[0];

  const [customTitle, setCustomTitle] = useState<string>(activeModel.defaultTitle);
  const [customPrompt, setCustomPrompt] = useState<string>(activeModel.defaultPrompt);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const defaultGallery = [
    {
      id: "arch-vis-1",
      title: "Esentepe Sahil Rezidansları — Güneşli Dış Cephe & Lagün Havuzu",
      loraUsed: "Dış Cephe & Masterplan",
      category: "Dış Cephe & Masterplan",
      promptCommand:
        "Doğal traverten taş cephe, sonsuzluk havuzu ve Akdeniz kıyı peyzajı ile bütünleşik aydınlık mimari tasarım.",
      imageUrl: resortHeroSunlitAsset,
      createdAt: "Hazır Görsel"
    },
    {
      id: "arch-vis-2",
      title: "2+1 Penthouse — 3 Boyutlu Kat Kesiti & Teras Planı",
      loraUsed: "3B Kat Kesiti & Plan",
      category: "3B Kat Kesiti & Plan",
      promptCommand:
        "Ölçekli oda dağılımı, teras havuzu bağlantısı ve bağımsız bölüm yerleşim detayı.",
      imageUrl: isometricFloorplanAsset,
      createdAt: "Hazır Görsel"
    },
    {
      id: "arch-vis-3",
      title: "Akdeniz Sahil Penthouse — Panoramik Teras & Salon",
      loraUsed: "İç Mekan Tasarımı",
      category: "İç Mekan Tasarımı",
      promptCommand:
        "Akdeniz manzaralı panoramik salon, doğal taş zemin ve aydınlık modern iç mekan kurgusu.",
      imageUrl: penthouseInteriorSunlitAsset,
      createdAt: "Hazır Görsel"
    }
  ];

  const [generatedResults, setGeneratedResults] = useState<
    Array<{
      id: string;
      title: string;
      loraUsed: string;
      category?: string;
      promptCommand: string;
      imageUrl: string;
      createdAt: string;
    }>
  >(() => {
    const saved = devConfig.lora_generated_gallery;
    if (Array.isArray(saved) && saved.length > 0) {
      return saved.map((item, idx) => sanitizeArchitecturalGalleryRecord(item, idx));
    }
    return defaultGallery;
  });

  const persistToBackendSilently = async (nextDevConfig: Record<string, any>) => {
    try {
      await fetch("/api/developer-projects/save-web-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: branding?.id || branding?.store_id || 1,
          developer_web_config: nextDevConfig
        })
      });
    } catch {
      // Local state still updated
    }
  };

  const updateDevConfig = (patch: Record<string, any>, autoPersist: boolean = true) => {
    const nextDevConfig = {
      ...devConfig,
      ...patch
    };
    onBrandingChange("developer_web_config", nextDevConfig);
    if (patch.uiverse_preset) {
      onBrandingChange("uiverse_preset", patch.uiverse_preset);
    }

    const currentLayoutSettings =
      typeof branding?.page_layout_settings === "object" && branding?.page_layout_settings
        ? branding.page_layout_settings
        : {};

    onBrandingChange("page_layout_settings", {
      ...currentLayoutSettings,
      developer_web_config: nextDevConfig,
      uiverse_preset: patch.uiverse_preset || activePresetId
    });

    if (autoPersist) {
      persistToBackendSilently(nextDevConfig);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    const found = ARCHITECTURAL_LORA_MODELS.find(m => m.id === modelId);
    if (found) {
      setCustomTitle(found.defaultTitle);
      setCustomPrompt(found.defaultPrompt);
    }
  };

  const handleGenerateArchitecturalVisual = async () => {
    if (!customPrompt.trim() && !customTitle.trim()) {
      toast.error("Lütfen oluşturulacak mimari sahne için başlık veya açıklama girin.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/developer-projects/ai-lora-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: branding?.id || branding?.store_id || 1,
          lora_id: activeModel.id,
          custom_title: customTitle.trim(),
          prompt: customPrompt.trim(),
          existing_urls: generatedResults.map(r => r.imageUrl)
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) {
        throw new Error(data.error || "Görsel oluşturulamadı");
      }

      const newEntry = sanitizeArchitecturalGalleryRecord(
        data.item || {
          id: `arch-${Date.now()}`,
          title: data.title || customTitle.trim() || activeModel.defaultTitle,
          loraUsed: data.category || activeModel.category,
          category: data.category || activeModel.category,
          promptCommand: data.promptCommand || customPrompt.trim(),
          imageUrl: data.imageUrl || activeModel.previewImage,
          createdAt: "Az Önce Üretildi"
        },
        0
      );

      const nextGallery = [newEntry, ...generatedResults];
      setGeneratedResults(nextGallery);
      updateDevConfig({ lora_generated_gallery: nextGallery }, true);

      toast.success("Yeni mimari görsel oluşturuldu ve web sitesi galerisine eklendi.");
    } catch (err: any) {
      toast.error(err?.message || "Görsel oluşturulurken bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteGalleryItem = (id: string) => {
    const nextGallery = generatedResults.filter(item => item.id !== id);
    setGeneratedResults(nextGallery);
    updateDevConfig({ lora_generated_gallery: nextGallery }, true);
    toast.success("Görsel galeriden kaldırıldı.");
  };

  const handleApplyAsHeroBanner = (imgUrl: string, title: string) => {
    const resolved = resolveArchitecturalAssetUrl(imgUrl);
    onBrandingChange("hero_image_url", resolved);
    onBrandingChange("background_image_url", resolved);
    updateDevConfig({ hero_image_url: resolved }, true);
    toast.success(`"${title}" web sitesi ana kapak görseli olarak uygulandı.`);
  };

  const shimmerEnabled = devConfig.uiverse_cta_shimmer !== false;
  const cardLiftEnabled = devConfig.uiverse_card_lift !== false;
  const galleryShowcaseEnabled = devConfig.show_lora_showcase !== false;

  return (
    <div className="space-y-4">
      {/* =================================================================== */}
      {/* 1. BUTTON & CARD INTERACTION STYLE SELECTOR                         */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white">
              {cleanSectorLabel} — Web Sitesi Buton & Kart Görünüm Stili
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Web sitenizdeki aksiyon butonlarının, proje kartlarının ve çerçevelerin görünüm stilini seçin. Seçiminiz anında kaydedilir.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
              Aktif Stil: {UIVERSE_INTERACTION_PRESETS[activePresetId]?.name}
            </span>
            {onSaveBranding && (
              <button
                type="button"
                onClick={onSaveBranding}
                disabled={savingBranding}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingBranding ? "Kaydediliyor..." : "Kaydet"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Interactive Button & Card Style Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.values(UIVERSE_INTERACTION_PRESETS) as UiversePresetMeta[]).map(pItem => {
            const isSelected = activePresetId === pItem.id;
            return (
              <div
                key={pItem.id}
                onClick={() => {
                  updateDevConfig({ uiverse_preset: pItem.id }, true);
                  toast.success(`"${pItem.name}" görünüm stili web sitesine uygulandı.`);
                }}
                className={`p-3.5 border cursor-pointer flex flex-col justify-between space-y-3 transition-all ${
                  pItem.id === "swiss_hairline" ? "rounded-none" : "rounded-xl"
                } ${
                  cardLiftEnabled ? "hover:-translate-y-1 hover:shadow-md" : ""
                } ${
                  isSelected
                    ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-2 border-indigo-600 shadow-xs"
                    : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {pItem.index}. STİL
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      {pItem.badge}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-black text-slate-950 dark:text-white">
                      {pItem.name}
                    </div>
                    <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">
                      {pItem.subtitle}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {pItem.description}
                  </p>
                </div>

                {/* Live Interactive Button Demo Inside Each Style Card */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      updateDevConfig({ uiverse_preset: pItem.id }, true);
                      toast.success(`"${pItem.name}" stili seçildi ve web sitesine uygulandı.`);
                    }}
                    className={`w-full py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      pItem.previewBtnStyleClass
                    } ${shimmerEnabled ? "ring-1 ring-amber-400/50" : ""}`}
                  >
                    <span>Stili Test Et & Uygula</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1.5" />
                  </button>

                  <div className="flex items-center justify-between text-[11px] font-black">
                    <span
                      className={
                        isSelected
                          ? "text-indigo-700 dark:text-indigo-300"
                          : "text-slate-500 dark:text-slate-400"
                      }
                    >
                      {isSelected ? "Aktif Web Stili" : "Bu Stili Seç"}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fine-Grained Visual Behavior Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Buton Işık Vurgusu
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Ana aksiyon butonlarında parlak çerçeve ve ışık vurgusu
              </div>
            </div>
            <input
              type="checkbox"
              checked={shimmerEnabled}
              onChange={e => {
                updateDevConfig({ uiverse_cta_shimmer: e.target.checked }, true);
                toast.success(
                  e.target.checked
                    ? "Buton ışık vurgusu aktif edildi."
                    : "Buton ışık vurgusu kapatıldı."
                );
              }}
              className="w-4 h-4 accent-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Kart Yükselme Efekti
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Proje ve galeri kartlarının üzerine gelindiğinde yükselme hareketi
              </div>
            </div>
            <input
              type="checkbox"
              checked={cardLiftEnabled}
              onChange={e => {
                updateDevConfig({ uiverse_card_lift: e.target.checked }, true);
                toast.success(
                  e.target.checked
                    ? "Kart yükselme efekti aktif edildi."
                    : "Kart yükselme efekti kapatıldı."
                );
              }}
              className="w-4 h-4 accent-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Web Sitesinde Mimari Görsel Galerisi
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Hazırlanan dış cephe, kat kesiti ve iç mekan görsellerini sitede sergile
              </div>
            </div>
            <input
              type="checkbox"
              checked={galleryShowcaseEnabled}
              onChange={e => {
                updateDevConfig({ show_lora_showcase: e.target.checked }, true);
                toast.success(
                  e.target.checked
                    ? "Mimari görsel galerisi web sitesinde açıldı."
                    : "Mimari görsel galerisi web sitesinde gizlendi."
                );
              }}
              className="w-4 h-4 accent-indigo-600"
            />
          </label>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. ARCHITECTURAL VISUAL & INTERIOR DESIGN STUDIO                    */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white">
              Mimari Görsel, Kat Kesiti & İç Mekan Tasarım Stüdyosu
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Projeniz için dış cephe, 3 boyutlu kat kesiti veya iç mekan görseli oluşturun ve tek tıkla web sitenizin galerisine ya da kapak alanına uygulayın.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left 5 Cols: Clean Turkish Architectural Visual Generator Form */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                1. Mimari Görsel Türü Seçin
              </label>
              <select
                value={selectedModelId}
                onChange={e => handleSelectModel(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {ARCHITECTURAL_LORA_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                {activeModel.description}
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                2. Görsel Başlığı (Web Sitesinde Görünecek Başlık)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="Örn: Esentepe Sahil Villası — Gün Batımı Cephe Görünümü"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                3. Mimari Detay & Sahne Açıklaması
              </label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="Örn: Doğal traverten taş cephe, sonsuzluk havuzu ve Akdeniz kıyı peyzajı..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateArchitecturalVisual}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Mimari Görsel Hazırlanıyor...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Yeni Mimari Görsel Oluştur & Galeriye Ekle</span>
                </>
              )}
            </button>
          </div>

          {/* Right 7 Cols: Architectural Assets Gallery */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Mimari Görsel & İç Mekan Galerisi ({generatedResults.length})
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Web sitesinde aktif olarak sergilenen mimari görseller
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {generatedResults.map((item, idx) => {
                const resolvedImg = resolveArchitecturalAssetUrl(item.imageUrl);
                return (
                  <div
                    key={item.id || idx}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video w-full bg-slate-900 overflow-hidden group">
                        <img
                          src={resolvedImg}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white font-semibold">
                          <span className="text-amber-400 font-bold truncate">
                            {item.category || item.loraUsed || "Mimari Görsel"}
                          </span>
                          <span>{item.createdAt}</span>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <div className="text-xs font-black text-slate-950 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                          {item.promptCommand}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 pb-3 pt-1 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyAsHeroBanner(resolvedImg, item.title)}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-bold cursor-pointer whitespace-nowrap"
                      >
                        Web Kapak Görseli Yap
                      </button>
                      <a
                        href={resolvedImg}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold whitespace-nowrap"
                      >
                        Tam Ekran
                      </a>
                      {generatedResults.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGalleryItem(item.id)}
                          title="Görseli Kaldır"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UiverseAndLoraWebStudio;
