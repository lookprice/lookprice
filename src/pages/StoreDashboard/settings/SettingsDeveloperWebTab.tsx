import React, { useState } from "react";
import {
  Box,
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  Globe,
  Image as ImageIcon,
  Layers,
  Mail,
  Palette,
  Phone,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X
} from "lucide-react";
import {
  DEVELOPER_ARCHITECTURAL_THEMES,
  DeveloperThemeId,
  DeveloperThemeMeta,
  ModernDeveloperProjectLayout
} from "../../../components/ModernDeveloperProjectLayout";
import { UiverseAndLoraWebStudio } from "../../../components/developer/UiverseAndLoraWebStudio";

interface SettingsDeveloperWebTabProps {
  branding: any;
  onBrandingChange: (field: string, value: any) => void;
  onSaveBranding: () => void;
  savingBranding?: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  emails: string[];
  phones: string[];
  updateEmail: (index: number, value: string) => void;
  removeEmail: (index: number) => void;
  addEmail: () => void;
  updatePhone: (index: number, value: string) => void;
  removePhone: (index: number) => void;
  addPhone: () => void;
}

export const SettingsDeveloperWebTab: React.FC<SettingsDeveloperWebTabProps> = ({
  branding,
  onBrandingChange,
  onSaveBranding,
  savingBranding,
  onLogoUpload,
  onFaviconUpload,
  emails,
  phones,
  updateEmail,
  removeEmail,
  addEmail,
  updatePhone,
  removePhone,
  addPhone
}) => {
  const rawName = branding?.store_name || branding?.name || "Cyprus Constructions";
  const companyDisplayName = String(rawName).replace(/\s*\(projectLP\)\s*/gi, "").trim();

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

  const activeThemeId: DeveloperThemeId =
    devConfig.theme_id && DEVELOPER_ARCHITECTURAL_THEMES[devConfig.theme_id as DeveloperThemeId]
      ? (devConfig.theme_id as DeveloperThemeId)
      : "monolith_obsidian";

  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);

  const updateDevConfig = (patch: Record<string, any>) => {
    const nextConfig = {
      ...devConfig,
      ...patch
    };
    onBrandingChange("developer_web_config", nextConfig);
    const currentLayoutSettings =
      typeof branding?.page_layout_settings === "object" && branding?.page_layout_settings
        ? branding.page_layout_settings
        : {};
    onBrandingChange("page_layout_settings", {
      ...currentLayoutSettings,
      sector: "developer_project",
      developer_web_config: nextConfig
    });
  };

  const storeSlug = branding?.slug || "cyprus-constructions";
  const publicStoreUrl = `/s/${storeSlug}`;

  return (
    <div className="space-y-4">
      {/* Top Executive Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-wider">
              projectLP Kurumsal Mimari Web Stüdyosu
            </span>
            <span className="text-xs font-bold text-emerald-700">
              • HTML5 Video, Uiverse & Cloud LoRA Aktif
            </span>
          </div>
          <h2 className="text-base font-black text-slate-950">
            {companyDisplayName} — Üst Düzey İnşaat & Masterplan Web Sitesi Yönetimi
          </h2>
          <p className="text-xs text-slate-600">
            Standart e-ticaret veya emlak vitrinlerinden tamamen bağımsız; uluslararası yatırımcılar için tasarlanmış 4 mimari konsept, HTML5 drone video sahnesi ve Uiverse / Cloud LoRA görsel stüdyosunu buradan yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowLivePreviewModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Stüdyo İçi Canlı Önizleme</span>
          </button>

          <a
            href={publicStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black flex items-center gap-1.5 whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Web Sitesini Yeni Sekmede Aç</span>
          </a>

          <button
            type="button"
            onClick={onSaveBranding}
            disabled={savingBranding}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingBranding ? "Kaydediliyor..." : "Web Tasarımını Kaydet"}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 4 ARCHITECTURAL WEBSITE DESIGN CONCEPTS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div>
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>1. Mimari Web Sitesi Tasarım Konsepti Seçimi (4 Profesyonel Tema)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Seçtiğiniz tasarım konsepti firmanızın resmi web sitesine anında uygulanır.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            Aktif Konsept: {DEVELOPER_ARCHITECTURAL_THEMES[activeThemeId]?.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.values(DEVELOPER_ARCHITECTURAL_THEMES) as DeveloperThemeMeta[]).map(tItem => {
            const isSelected = activeThemeId === tItem.id;
            return (
              <div
                key={tItem.id}
                onClick={() => updateDevConfig({ theme_id: tItem.id })}
                className={`rounded-xl border p-3.5 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-indigo-50/70 border-2 border-indigo-600 shadow-sm"
                    : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="space-y-2">
                  {/* Visual Theme Swatch Preview */}
                  <div
                    className={`h-24 rounded-lg border p-2.5 flex flex-col justify-between ${
                      tItem.isDark
                        ? "bg-slate-950 border-slate-800 text-white"
                        : "bg-[#F7F5F0] border-stone-300 text-slate-950"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-amber-500">{tItem.index}. KONSEPT</span>
                      <span>{tItem.isDark ? "Koyu Lüks Mimari" : "Gün Işığı Mermer"}</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold truncate">{tItem.name}</div>
                      <div className="text-[10px] opacity-75 truncate">{tItem.subtitle}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-black text-slate-950">
                      {tItem.index}. {tItem.name}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                      {tItem.inspiration}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-black ${
                      isSelected ? "text-indigo-700" : "text-slate-500"
                    }`}
                  >
                    {isSelected ? "Seçili Web Konsepti" : "Bu Konsepti Seç"}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: HTML5 VIDEO HERO, HEADLINES & INTERACTIVE 3D MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-amber-600" />
              <span>2. HTML5 Sinematik Video & Ana Sahne (Hero) İçeriği</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Web sitesinin açılışında tam ekran oynatılacak drone çekimi MP4/WebM video ve kurumsal manşet metinleri
            </p>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Görünür Şirket Adı (Web Başlığı)
              </label>
              <input
                type="text"
                value={companyDisplayName}
                onChange={e => onBrandingChange("store_name", e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Ana Manşet Başlığı (Hero Headline)
              </label>
              <input
                type="text"
                value={
                  devConfig.hero_title ??
                  branding?.hero_title ??
                  "Akdeniz Kıyı Şeridinde Ödüllü Sahil Masterplan Projeleri"
                }
                onChange={e => {
                  onBrandingChange("hero_title", e.target.value);
                  updateDevConfig({ hero_title: e.target.value });
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Alt Açıklama Metni (Hero Subtitle)
              </label>
              <textarea
                rows={2}
                value={
                  devConfig.hero_subtitle ??
                  branding?.hero_subtitle ??
                  "Esentepe ve Tatlısu sahil hattında özel marina, lagün havuzları ve panoramik deniz manzaralı mimari yaşam alanları."
                }
                onChange={e => {
                  onBrandingChange("hero_subtitle", e.target.value);
                  updateDevConfig({ hero_subtitle: e.target.value });
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                HTML5 Arka Plan Drone / Tanıtım Video URL (MP4 / WebM)
              </label>
              <input
                type="text"
                placeholder="https://.../drone-showcase.mp4"
                value={
                  devConfig.hero_video_url ??
                  "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-buildings-on-a-sunny-day-41463-large.mp4"
                }
                onChange={e => updateDevConfig({ hero_video_url: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Interactive Website Sections & Logo/Identity */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-600" />
              <span>3. İnteraktif Web Modülleri & Kurumsal Kimlik</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Web sitesinde yatırımcılara sunulacak interaktif mühendislik ve satış modülleri
            </p>
          </div>

          <div className="space-y-2">

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <div className="text-xs font-black text-slate-900">
                  Canlı Bağımsız Bölüm (Kapı No) & %0 Faiz Simülatörü
                </div>
                <div className="text-[10px] text-slate-500">
                  Müsait daire/villaların kapı noları ve 36 ay taksit hesaplayıcısı
                </div>
              </div>
              <input
                type="checkbox"
                checked={devConfig.show_unit_matrix !== false}
                onChange={e => updateDevConfig({ show_unit_matrix: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <div className="text-xs font-black text-slate-900">
                  Ortak Alanlar, Marina & Sosyal Yaşam Vitrini
                </div>
                <div className="text-[10px] text-slate-500">
                  Plaj, spa, açık hava sineması ve sosyal tesis özellikleri
                </div>
              </div>
              <input
                type="checkbox"
                checked={devConfig.show_lifestyle !== false}
                onChange={e => updateDevConfig({ show_lifestyle: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
            </label>
          </div>

          {/* Corporate Contact & Logo quick fields */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Satış Ofisi Telefon / WhatsApp
              </label>
              <input
                type="text"
                value={phones[0] || branding?.phone || "+90 548 860 00 01"}
                onChange={e => updatePhone(0, e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-700 mb-1">
                Kurumsal E-Posta
              </label>
              <input
                type="email"
                value={emails[0] || branding?.email || "info@cyprusconstructions.com"}
                onChange={e => updateEmail(0, e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: UIVERSE.IO MICRO-INTERACTION PRESETS & CLOUD LORA STUDIO */}
      <UiverseAndLoraWebStudio
        branding={branding}
        onBrandingChange={onBrandingChange}
        onSaveBranding={onSaveBranding}
        savingBranding={savingBranding}
        sectorLabel={`${companyDisplayName} (projectLP)`}
      />

      {/* Fullscreen Live Website Preview Modal */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="bg-slate-900 border-b border-slate-700 px-4 py-2.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black">
                CANLI ÖNİZLEME
              </span>
              <span className="text-xs font-bold">
                {companyDisplayName} — {DEVELOPER_ARCHITECTURAL_THEMES[activeThemeId]?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSaveBranding}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Bu Tasarımı Kaydet
              </button>
              <button
                type="button"
                onClick={() => setShowLivePreviewModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Kapat</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ModernDeveloperProjectLayout store={{ ...branding, branding }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsDeveloperWebTab;
