import React from "react";
import { Palette, Sliders } from "lucide-react";

interface MultiTenancyDesignTabProps {
  configForm: any;
  setConfigForm: React.Dispatch<React.SetStateAction<any>>;
}

export const MultiTenancyDesignTab: React.FC<MultiTenancyDesignTabProps> = ({
  configForm,
  setConfigForm
}) => {
  return (
    <div className="space-y-5 pt-2">
      {/* Preset Selector Cards */}
      <div>
        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
          Hazır Tasarım & Tema Önayarı (Preset)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: "shoplp_minimal",
              name: "Minimalist Perakende",
              desc: "Temiz, bento grid & yüksek dönüşüm",
              color: "#0f172a"
            },
            {
              id: "modern_tech",
              name: "Modern Siber / Dark",
              desc: "Teknoloji, neon vurgulu karanlık mod",
              color: "#2563eb"
            },
            {
              id: "bookstore_netflix",
              name: "Netflix Sinematik (Kitap)",
              desc: "Kayan eser şeritleri & koyu tema",
              color: "#e11d48"
            },
            {
              id: "luxury_auto",
              name: "Lüks Galeri (AutoLP)",
              desc: "Geniş video banner & altın detaylar",
              color: "#d97706"
            },
            {
              id: "real_estate_idx",
              name: "Akıllı Harita IDX (Emlak)",
              desc: "Bölünmüş harita & filtre motoru",
              color: "#0284c7"
            },
            {
              id: "horeca_bistro",
              name: "Bistro & Menü (HoReCa)",
              desc: "QR dijital menü ve kategori kartları",
              color: "#ea580c"
            }
          ].map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                setConfigForm((prev: any) => ({
                  ...prev,
                  branding: {
                    ...(prev.branding || {}),
                    active_preset: preset.id,
                    page_layout_settings: {
                      ...(prev.branding?.page_layout_settings || {}),
                      active_preset: preset.id
                    }
                  }
                }));
              }}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                configForm.branding?.active_preset === preset.id
                  ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {preset.name}
                </span>
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-900 shadow-xs"
                  style={{ backgroundColor: preset.color }}
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {preset.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Visual Assets & Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Primary & Accent Color */}
        <div className="space-y-3 p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-indigo-500" /> Marka Renk Paleti
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Ana Renk (Primary)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  value={configForm.branding?.primary_color || "#0f172a"}
                  onChange={(e) =>
                    setConfigForm((prev: any) => ({
                      ...prev,
                      branding: {
                        ...(prev.branding || {}),
                        primary_color: e.target.value,
                        theme_color: e.target.value
                      }
                    }))
                  }
                />
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  value={configForm.branding?.primary_color || "#0f172a"}
                  onChange={(e) =>
                    setConfigForm((prev: any) => ({
                      ...prev,
                      branding: {
                        ...(prev.branding || {}),
                        primary_color: e.target.value,
                        theme_color: e.target.value
                      }
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Vurgu Rengi (Accent)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  value={configForm.branding?.accent_color || "#3b82f6"}
                  onChange={(e) =>
                    setConfigForm((prev: any) => ({
                      ...prev,
                      branding: {
                        ...(prev.branding || {}),
                        accent_color: e.target.value
                      }
                    }))
                  }
                />
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  value={configForm.branding?.accent_color || "#3b82f6"}
                  onChange={(e) =>
                    setConfigForm((prev: any) => ({
                      ...prev,
                      branding: {
                        ...(prev.branding || {}),
                        accent_color: e.target.value
                      }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Dark Mode & Font */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Varsayılan Koyu Tema (Dark Mode)
            </span>
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              checked={Boolean(configForm.branding?.page_layout_settings?.dark_mode)}
              onChange={(e) =>
                setConfigForm((prev: any) => ({
                  ...prev,
                  branding: {
                    ...(prev.branding || {}),
                    page_layout_settings: {
                      ...(prev.branding?.page_layout_settings || {}),
                      dark_mode: e.target.checked
                    }
                  }
                }))
              }
            />
          </div>
        </div>

        {/* Logo & Banner URLs */}
        <div className="space-y-3 p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sliders className="h-4 w-4 text-purple-500" /> Görsel Varlıklar
          </h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Logo Görseli URL
            </label>
            <input
              type="text"
              placeholder="https://.../logo.png"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
              value={configForm.branding?.logo_url || ""}
              onChange={(e) =>
                setConfigForm((prev: any) => ({
                  ...prev,
                  branding: {
                    ...(prev.branding || {}),
                    logo_url: e.target.value
                  }
                }))
              }
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Hero / Vitrin Banner URL
            </label>
            <input
              type="text"
              placeholder="https://.../banner.jpg"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
              value={configForm.branding?.hero_banner_url || ""}
              onChange={(e) =>
                setConfigForm((prev: any) => ({
                  ...prev,
                  branding: {
                    ...(prev.branding || {}),
                    hero_banner_url: e.target.value
                  }
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
