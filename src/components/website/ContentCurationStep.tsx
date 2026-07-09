import React from "react";
import { ImageIcon, Layout, SlidersHorizontal, Plus, Check } from "lucide-react";
import { SectionConfig, WebContent } from "../../types/websiteGenerator";

interface ContentCurationStepProps {
  lang: string;
  banners: string[];
  setBanners: (b: string[] | ((prev: string[]) => string[])) => void;
  sections: SectionConfig[];
  setSections: (s: SectionConfig[] | ((prev: SectionConfig[]) => SectionConfig[])) => void;
  gridLayout: string;
  setGridLayout: (l: string) => void;
  featuredCount: number;
  setFeaturedCount: (c: number) => void;
  setContent: (c: WebContent | ((prev: WebContent) => WebContent)) => void;
}

export const ContentCurationStep: React.FC<ContentCurationStepProps> = ({
  lang,
  banners,
  setBanners,
  sections,
  setSections,
  gridLayout,
  setGridLayout,
  featuredCount,
  setFeaturedCount,
  setContent,
}) => {
  const isTr = lang === "tr";

  const toggleSection = (id: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-indigo-500" />
          {isTr ? "VİTRİN & BANNER (SLIDER)" : "HERO & BANNERS"}
        </h3>
        <div className="space-y-4">
          {banners.map((banner, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-slate-100 aspect-video flex-shrink-0">
              <img src={banner} className="h-full w-full object-cover" alt={`Banner ${idx + 1}`} />
              <button
                onClick={() => setBanners((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase text-[9px] font-black tracking-widest shadow-md"
              >
                X SİL
              </button>
            </div>
          ))}
          {(!banners || banners.length < 5) && (
            <label className="w-full flex-col h-32 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-500 transition-all uppercase tracking-widest cursor-pointer bg-slate-50">
              <Plus className="h-4 w-4 mb-2" />
              {isTr ? "YENİ BANNER YÜKLE" : "UPLOAD BANNER"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (uploadEvent) => {
                      const b64 = uploadEvent.target?.result as string;
                      setBanners((prev) => [...prev, b64]);
                      if (banners.length === 0) {
                        setContent((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, bgImage: b64 },
                        }));
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Layout className="h-4 w-4 text-indigo-500" />
          {isTr ? "IZGARA VE BÖLÜMLER" : "GRID & SECTIONS"}
        </h3>
        <div className="space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                section.enabled
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-slate-50 border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <section.icon className={`h-4 w-4 ${section.enabled ? "text-indigo-600" : "text-slate-400"}`} />
                <span className={`text-[11px] font-bold ${section.enabled ? "text-indigo-900" : "text-slate-600"}`}>
                  {section.label}
                </span>
              </div>
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                  section.enabled ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white border-slate-200"
                }`}
              >
                {section.enabled && <Check className="h-3 w-3" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
          {isTr ? "IZGARA AYARLARI" : "GRID SETTINGS"}
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isTr ? "Görünüm Modu" : "Layout Mode"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["standard", "masonry"].map((l) => (
                <button
                  key={l}
                  onClick={() => setGridLayout(l)}
                  className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                    gridLayout === l ? "bg-indigo-600 border-indigo-600 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {isTr ? "İlan Sayısı" : "Listing Count"}: {featuredCount}
            </p>
            <input
              type="range"
              min="3"
              max="12"
              step="3"
              value={featuredCount}
              onChange={(e) => setFeaturedCount(parseInt(e.target.value))}
              className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
