import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Cpu,
  Eye,
  Image as ImageIcon,
  Layers,
  Palette,
  RefreshCw,
  Save,
  Sliders,
  Sparkles,
  Wand2,
  Zap
} from "lucide-react";
import { toast } from "sonner";

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
  description: string;
  primaryBtnClass: string;
  secondaryBtnClass: string;
  cardHoverClass: string;
  badgeText: string;
}

export const UIVERSE_INTERACTION_PRESETS: Record<UiversePresetId, UiversePresetMeta> = {
  shimmer_glass: {
    id: "shimmer_glass",
    index: "01",
    name: "Obsidian Glass & Gold Shimmer",
    subtitle: "Uiverse Işık Yansımalı Lüks Cam Etkileşimi",
    description:
      "Buton üzerinde diyagonal ışık hüzmesi geçişi, kartlarda buzlu cam derinliği ve 200ms pürüzsüz yükselme efekti.",
    primaryBtnClass:
      "relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_-5px_rgba(197,160,89,0.45)] active:translate-y-0",
    secondaryBtnClass:
      "backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C5A059]/60",
    cardHoverClass:
      "transition-all duration-200 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.35)]",
    badgeText: "Lüks & Prestij Odaklı"
  },
  tactile_3d: {
    id: "tactile_3d",
    index: "02",
    name: "Isometric 3D Tactile Press",
    subtitle: "Uiverse 3B Mekanik Basınç & Mimari Kütle Hissi",
    description:
      "Tıklama anında fiziksel derinlik hissi veren 3 boyutlu alt gölge (bevel) ve kartlarda izometrik çerçeve vurgusu.",
    primaryBtnClass:
      "transition-all duration-150 shadow-[0_4px_0_0_rgba(15,23,42,0.85)] hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_rgba(15,23,42,0.85)] active:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(15,23,42,0.85)]",
    secondaryBtnClass:
      "transition-all duration-150 shadow-[0_3px_0_0_rgba(148,163,184,0.4)] active:translate-y-[2px] active:shadow-none",
    cardHoverClass:
      "transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(197,160,89,0.55)]",
    badgeText: "Mühendislik & 3D Hissi"
  },
  kinetic_spotlight: {
    id: "kinetic_spotlight",
    index: "03",
    name: "Kinetic Spotlight & Magnetic Arrow",
    subtitle: "Uiverse Manyetik Kenarlık & İkon Kayma Efekti",
    description:
      "Kartların üzerine gelindiğinde altın/kobalt odak halkası (ring glow) ve buton içindeki ok ikonlarının ileri doğru manyetik ivmelenmesi.",
    primaryBtnClass:
      "group transition-all duration-200 hover:ring-2 hover:ring-[#C5A059] hover:ring-offset-2 hover:ring-offset-slate-950",
    secondaryBtnClass:
      "group transition-all duration-200 hover:ring-1 hover:ring-[#C5A059]/80",
    cardHoverClass:
      "transition-all duration-200 hover:ring-2 hover:ring-[#C5A059]/80 hover:shadow-[0_24px_48px_-12px_rgba(197,160,89,0.22)]",
    badgeText: "Yüksek Dönüşüm (CRO)"
  },
  swiss_hairline: {
    id: "swiss_hairline",
    index: "04",
    name: "Swiss Editorial Hairline",
    subtitle: "Saf Kurumsal İsviçre Mimari Çizgisi",
    description:
      "Gölgesiz, jilet keskinliğinde 1px mimari kenarlıklar ve 150ms içinde gerçekleşen yüksek kontrastlı kurumsal renk dönüşümü.",
    primaryBtnClass:
      "transition-colors duration-150 border border-transparent hover:border-current",
    secondaryBtnClass:
      "transition-colors duration-150 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-950",
    cardHoverClass:
      "transition-colors duration-150 hover:border-slate-950 dark:hover:border-white",
    badgeText: "Minimalist & Kurumsal"
  }
};

export interface LoraModelPreset {
  id: string;
  name: string;
  loraTag: string;
  defaultWeight: number;
  category: string;
  description: string;
  defaultPrompt: string;
  previewImage: string;
}

export const ARCHITECTURAL_LORA_MODELS: LoraModelPreset[] = [
  {
    id: "cyprus_mediterranean_arch",
    name: "Kıbrıs & Akdeniz Sahil Mimari LoRA",
    loraTag: "lora:cyprus_mediterranean_arch",
    defaultWeight: 0.85,
    category: "Dış Cephe & Masterplan Render",
    description:
      "Traverten taş, sıcak sedir ahşap konsollar, sonsuzluk havuzu ve Akdeniz gün batımı ışığında fotogerçekçi dış cephe üretir.",
    defaultPrompt:
      "Ultra-luxury Mediterranean coastal villa in Northern Cyprus Esentepe, white travertine stone and warm cedar wood cantilevers, infinity pool overlooking the turquoise sea at golden hour twilight",
    previewImage: "/src/assets/images/lora_cyprus_villa_twilight_1794568366585.jpg"
  },
  {
    id: "isometric_3d_floorplan_v2",
    name: "2D Plan → 3D İzometrik Kat Kesiti LoRA",
    loraTag: "lora:isometric_3d_floorplan_v2",
    defaultWeight: 0.9,
    category: "3D Mimari Kat Planı & Kesit",
    description:
      "2 boyutlu daire/villa kat planlarını teras, havuz, meşe parke ve mermer banyo detaylarıyla 3 boyutlu izometrik makete dönüştürür.",
    defaultPrompt:
      "Clean architectural 3D isometric cutaway floorplan render of a luxury 2-bedroom beachfront loft apartment with panoramic terrace and plunge pool, warm oak flooring, marble bathroom",
    previewImage: "/src/assets/images/lora_isometric_3d_floorplan_1794568366571.jpg"
  },
  {
    id: "luxury_interior_staging",
    name: "Sanal Eşyalandırma (Virtual Staging) LoRA",
    loraTag: "lora:luxury_interior_staging",
    defaultWeight: 0.8,
    category: "İç Mekan & Sanal Dekorasyon",
    description:
      "Boş veya kaba inşaat halindeki salon ve yatak odalarını İtalyan tasarım mobilyalar ve doğal gün ışığıyla eşyalandırır.",
    defaultPrompt:
      "High-end interior architectural photography of a Mediterranean penthouse living room with floor-to-ceiling glass sliding doors opening to a sea-view terrace, travertine marble wall, Italian sofa",
    previewImage: "/src/assets/images/lora_virtual_staging_interior_1794568367265.jpg"
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
  sectorLabel = "Web Vitrini"
}) => {
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

  const updateStudioConfig = (patch: Record<string, any>) => {
    const nextDevConfig = {
      ...devConfig,
      ...patch
    };
    onBrandingChange("developer_web_config", nextDevConfig);
    if (patch.uiverse_preset) {
      onBrandingChange("uiverse_preset", patch.uiverse_preset);
    }
    const currentLayout =
      typeof branding?.page_layout_settings === "object" && branding?.page_layout_settings
        ? branding.page_layout_settings
        : {};
    onBrandingChange("page_layout_settings", {
      ...currentLayout,
      uiverse_preset: patch.uiverse_preset || activePresetId,
      developer_web_config: nextDevConfig
    });
  };

  // LoRA Cloud API Generator State
  const [selectedLoraId, setSelectedLoraId] = useState<string>(ARCHITECTURAL_LORA_MODELS[0].id);
  const selectedLora =
    ARCHITECTURAL_LORA_MODELS.find(m => m.id === selectedLoraId) || ARCHITECTURAL_LORA_MODELS[0];

  const [loraWeight, setLoraWeight] = useState<number>(selectedLora.defaultWeight);
  const [customPrompt, setCustomPrompt] = useState<string>(selectedLora.defaultPrompt);
  const [forgeApiUrl, setForgeApiUrl] = useState<string>(devConfig.forge_api_url || "");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResults, setGeneratedResults] = useState<
    Array<{
      id: string;
      title: string;
      loraUsed: string;
      promptCommand: string;
      imageUrl: string;
      createdAt: string;
    }>
  >(() => {
    const saved = devConfig.lora_generated_gallery;
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return [
      {
        id: "seed-1",
        title: "Esentepe Sahil Villası — Gün Batımı Dış Cephe Render",
        loraUsed: "lora:cyprus_mediterranean_arch:0.85",
        promptCommand:
          "Ultra-luxury Mediterranean coastal villa in Northern Cyprus Esentepe, white travertine stone, infinity pool, lora:cyprus_mediterranean_arch:0.85",
        imageUrl: "/src/assets/images/lora_cyprus_villa_twilight_1794568366585.jpg",
        createdAt: "Hazır Mimari Paket"
      },
      {
        id: "seed-2",
        title: "2+1 Beachfront Loft — 3D İzometrik Kat Kesiti Paftası",
        loraUsed: "lora:isometric_3d_floorplan_v2:0.90",
        promptCommand:
          "Clean architectural 3D isometric cutaway floorplan render of a luxury 2-bedroom beachfront loft apartment, lora:isometric_3d_floorplan_v2:0.90",
        imageUrl: "/src/assets/images/lora_isometric_3d_floorplan_1794568366571.jpg",
        createdAt: "Hazır Mimari Paket"
      },
      {
        id: "seed-3",
        title: "Penthouse Salon — Sanal Eşyalandırma (Virtual Staging)",
        loraUsed: "lora:luxury_interior_staging:0.80",
        promptCommand:
          "High-end interior architectural photography of a Mediterranean penthouse living room, travertine marble wall, lora:luxury_interior_staging:0.80",
        imageUrl: "/src/assets/images/lora_virtual_staging_interior_1794568367265.jpg",
        createdAt: "Hazır Mimari Paket"
      }
    ];
  });

  const handleSelectLoraModel = (model: LoraModelPreset) => {
    setSelectedLoraId(model.id);
    setLoraWeight(model.defaultWeight);
    setCustomPrompt(model.defaultPrompt);
  };

  const fullLoraCommand = `${customPrompt.trim()}, <${selectedLora.loraTag}:${loraWeight.toFixed(2)}>`;

  const handleGenerateViaCloudApi = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/developer-projects/ai-lora-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: branding?.id || 1,
          lora_id: selectedLora.id,
          lora_tag: selectedLora.loraTag,
          lora_weight: loraWeight,
          prompt: customPrompt,
          forge_api_url: forgeApiUrl.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bulut LoRA API üretimi sırasında hata oluştu.");
      }

      const newEntry = {
        id: `lora-${Date.now()}`,
        title: data.title || selectedLora.name,
        loraUsed: `${selectedLora.loraTag}:${loraWeight.toFixed(2)}`,
        promptCommand: data.promptCommand || fullLoraCommand,
        imageUrl: data.imageUrl || selectedLora.previewImage,
        createdAt: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      };

      const nextGallery = [newEntry, ...generatedResults].slice(0, 9);
      setGeneratedResults(nextGallery);
      updateStudioConfig({
        lora_generated_gallery: nextGallery,
        forge_api_url: forgeApiUrl.trim()
      });

      toast.success(
        data.usedExternalForge
          ? "Harici Bulut Forge GPU API üzerinden LoRA görseli üretildi!"
          : "Bulut Mimari LoRA Stüdyosu üzerinden görsel üretildi ve vitrin galerisine eklendi!"
      );
    } catch (err: any) {
      toast.error(err.message || "Görsel üretilemedi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAsHeroBanner = (imageUrl: string, title: string) => {
    onBrandingChange("hero_image_url", imageUrl);
    onBrandingChange("background_image_url", imageUrl);
    updateStudioConfig({ hero_poster_url: imageUrl });
    toast.success(`"${title}" görseli web sitesi ana kapak (Hero) görseli olarak atandı.`);
  };

  const activePreset = UIVERSE_INTERACTION_PRESETS[activePresetId];

  return (
    <div className="space-y-4">
      {/* =================================================================== */}
      {/* 1. UIVERSE.IO MICRO-INTERACTION & COMPONENT ANIMATION ENGINE        */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                Uiverse.io Etkileşim Motoru
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                • Sıfır Harici Paket Şişkinliği (Saf Tailwind + React)
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white mt-1">
              {sectorLabel} — Uiverse.io Buton, Kart & Mikro-Animasyon Paketi Seçimi
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mağazanızın dışa açık web sitesindeki kartların, aksiyon butonlarının ve filtre geçişlerinin fiziksel tepki stilini seçin.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-xs font-bold whitespace-nowrap">
              Aktif Paket: {activePreset.name}
            </span>
            {onSaveBranding && (
              <button
                type="button"
                onClick={onSaveBranding}
                disabled={savingBranding}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingBranding ? "Kaydediliyor..." : "Seçimi Kaydet"}</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Selectable Uiverse Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.values(UIVERSE_INTERACTION_PRESETS) as UiversePresetMeta[]).map(preset => {
            const isSelected = activePresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => updateStudioConfig({ uiverse_preset: preset.id })}
                className={`rounded-xl border p-3.5 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-600 shadow-xs"
                    : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-black text-indigo-600 dark:text-indigo-400">
                      {preset.index}. UIVERSE PAKETİ
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      {preset.badgeText}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-black text-slate-950 dark:text-white">
                      {preset.name}
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 mt-0.5">
                      {preset.subtitle}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                {/* Mini Live Interactive Uiverse Button inside the Card */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      updateStudioConfig({ uiverse_preset: preset.id });
                      toast.success(`"${preset.name}" etkileşim paketi seçildi!`);
                    }}
                    className={`w-full py-2 px-3 rounded-lg bg-slate-900 text-[#C5A059] text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${preset.primaryBtnClass}`}
                  >
                    <span>Üzerime Gel & Test Et</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="flex items-center justify-between text-[11px] font-black">
                    <span className={isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500"}>
                      {isSelected ? "Vitrin İçin Aktif" : "Bu Paketi Seç"}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fine-Grained Uiverse Micro-Feature Switches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div className="pr-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Diyagonal Buton Işık Efekti (Shimmer)
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Ana CTA butonlarında Uiverse ışık süzmesi geçişi
              </div>
            </div>
            <input
              type="checkbox"
              checked={devConfig.uiverse_cta_shimmer !== false}
              onChange={e => updateStudioConfig({ uiverse_cta_shimmer: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 shrink-0"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div className="pr-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                3D Perspektif Kart Yükselmesi
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Proje ve ürün kartlarında 200ms derinlik tepkisi
              </div>
            </div>
            <input
              type="checkbox"
              checked={devConfig.uiverse_card_lift !== false}
              onChange={e => updateStudioConfig({ uiverse_card_lift: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 shrink-0"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <div className="pr-2">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Web Sitesinde LoRA Mimari Galeri Vitrini
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                Üretilen 3D kesit ve mimari renderları sitede sergile
              </div>
            </div>
            <input
              type="checkbox"
              checked={devConfig.show_lora_showcase !== false}
              onChange={e => updateStudioConfig({ show_lora_showcase: e.target.checked })}
              className="w-4 h-4 accent-indigo-600 shrink-0"
            />
          </label>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. CLOUD API FORGE UI & LORA ARCHITECTURAL ASSET PRODUCTION LINE    */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                Bulut API • Forge UI & LoRA Üretim Hattı
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                • Yerel Kurulumsuz (Headless API Modu)
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-950 dark:text-white mt-1">
              Mimari Konsept Render, 3D İzometrik Kat Kesiti & Sanal Eşyalandırma (LoRA) Stüdyosu
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bilgisayarınıza hiçbir program kurmadan; sektöre özel eğitilmiş LoRA ağırlıklarıyla (`0.50 – 1.00`) web siteniz ve projeleriniz için üst düzey mimari görseller üretin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 5 Cols: LoRA Model Selector & API Prompt Controls */}
          <div className="lg:col-span-5 space-y-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
            <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              1. Sektörel LoRA Modeli Seçin (.safetensors)
            </div>

            <div className="space-y-2">
              {ARCHITECTURAL_LORA_MODELS.map(model => {
                const isSelected = selectedLora.id === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleSelectLoraModel(model)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-2 border-indigo-600 shadow-2xs"
                        : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {model.category} · &lt;{model.loraTag}:{model.defaultWeight}&gt;
                      </div>
                      <div className="text-xs font-black text-slate-950 dark:text-white truncate">
                        {model.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                        {model.description}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* LoRA Weight Slider (0.50 to 1.00) */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  LoRA Etki Ağırlığı (Weight):
                </span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {loraWeight.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.0}
                step={0.05}
                value={loraWeight}
                onChange={e => setLoraWeight(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Prompt Input */}
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
                2. Mimari Sahne Komutu (Prompt)
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white"
              />
              <div className="p-2 rounded-lg bg-slate-900 text-amber-300 font-mono text-[10px] break-all">
                API Komutu: {fullLoraCommand}
              </div>
            </div>

            {/* Optional Custom Headless Forge GPU Endpoint */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Özel Bulut GPU / Forge API URL (Opsiyonel — Boş Bırakılırsa LookPrice Cloud Çalışır)
              </label>
              <input
                type="url"
                value={forgeApiUrl}
                onChange={e => setForgeApiUrl(e.target.value)}
                placeholder="https://gpu-forge.sirketiniz.com/sdapi/v1/txt2img"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateViaCloudApi}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Bulut LoRA Motoru Üretiyor...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>API ile Mimari LoRA Görseli Üret</span>
                </>
              )}
            </button>
          </div>

          {/* Right 7 Cols: Generated High-Res LoRA Architectural Assets Gallery */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Üretilen LoRA Mimari Render & 3D Kesit Havuzu ({generatedResults.length})
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Tek tıkla web sitesi kapağına veya proje vitrinine atayın
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {generatedResults.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video w-full bg-slate-900 overflow-hidden group">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white font-mono">
                        <span className="text-amber-400 font-bold truncate">{item.loraUsed}</span>
                        <span>{item.createdAt}</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-1">
                      <div className="text-xs font-black text-slate-950 dark:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.promptCommand}
                      </div>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyAsHeroBanner(item.imageUrl, item.title)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-[11px] font-bold cursor-pointer whitespace-nowrap"
                    >
                      Web Hero Kapağı Yap
                    </button>
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold whitespace-nowrap"
                    >
                      Tam Ekran
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UiverseAndLoraWebStudio;
