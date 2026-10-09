import React from "react";
import { ImageIcon, Layout, SlidersHorizontal, Plus, Check, AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";
import { SectionConfig, WebContent } from "../../types/websiteGenerator";

interface ContentCurationStepProps {
  lang: string;
  banners: any[];
  setBanners: (b: any[] | ((prev: any[]) => any[])) => void;
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

  // Normalize banners array to support both string lists and rich objects
  const displayBanners = React.useMemo(() => {
    return (banners || []).map((b, idx) => {
      if (typeof b === "string") {
        return {
          id: `slide_legacy_${idx}`,
          image_url: b,
          title: "",
          subtitle: "",
          text_position: "center",
          show_store_name: true,
          button_text: isTr ? "İncele" : "Explore",
          button_link: "#portfolio"
        };
      }
      return {
        id: b.id || `slide_${idx}_${Date.now()}`,
        image_url: b.image_url || b.imageUrl || "",
        title: b.title || "",
        subtitle: b.subtitle || "",
        text_position: b.text_position || "center",
        show_store_name: b.show_store_name !== false,
        button_text: b.button_text || "",
        button_link: b.button_link || ""
      };
    });
  }, [banners, isTr]);

  const handleUpdateBannerField = (bannerId: string, field: string, value: any) => {
    const updated = displayBanners.map((b) => {
      if (b.id === bannerId) {
        return { ...b, [field]: value };
      }
      return b;
    });
    setBanners(updated);
  };

  const handleRemoveBanner = (bannerId: string) => {
    const updated = displayBanners.filter((b) => b.id !== bannerId);
    setBanners(updated);
  };

  const handleAddBanner = (imageUrl: string) => {
    const newItem = {
      id: `slide_${Date.now()}`,
      image_url: imageUrl,
      title: "",
      subtitle: "",
      text_position: "center",
      show_store_name: true,
      button_text: isTr ? "Portföyü İncele" : "View Portfolio",
      button_link: "#portfolio"
    };
    setBanners([...displayBanners, newItem]);
    
    if (displayBanners.length === 0) {
      setContent((prev) => ({
        ...prev,
        hero: { ...prev.hero, bgImage: imageUrl },
      }));
    }
  };

  const toggleSection = (id: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  return (
    <div className="space-y-6">
      {/* Slider Management Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-4">
          <ImageIcon className="h-4 w-4 text-indigo-500" />
          {isTr ? "SÜRGÜLÜ AFİŞ & SLIDER YÖNETİMİ" : "SLIDER & BANNER MANAGEMENT"}
        </h3>

        <div className="space-y-6">
          {displayBanners.map((slide, idx) => (
            <div key={slide.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-4 relative group hover:border-indigo-200 transition-all">
              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemoveBanner(slide.id)}
                className="absolute top-4 right-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl p-2 transition-colors shadow-sm"
                title={isTr ? "Afişi Sil" : "Delete Slide"}
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-200">
                  <img src={slide.image_url} className="h-full w-full object-cover" alt={`Slide ${idx + 1}`} />
                </div>
                
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] font-black text-indigo-600 tracking-wider block uppercase">
                    {isTr ? `${idx + 1}. AFİŞ AYARLARI` : `SLIDE ${idx + 1} SETTINGS`}
                  </span>
                  
                  {/* Text alignment controls */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2">
                      {isTr ? "Hizalama:" : "Align:"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateBannerField(slide.id, "text_position", "left")}
                      className={`p-1.5 rounded-lg border transition-all ${
                        slide.text_position === "left"
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBannerField(slide.id, "text_position", "center")}
                      className={`p-1.5 rounded-lg border transition-all ${
                        slide.text_position === "center"
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBannerField(slide.id, "text_position", "right")}
                      className={`p-1.5 rounded-lg border transition-all ${
                        slide.text_position === "right"
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                    </button>

                    {/* Show store name checkbox */}
                    <button
                      type="button"
                      onClick={() => handleUpdateBannerField(slide.id, "show_store_name", !slide.show_store_name)}
                      className={`ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border transition-all ${
                        slide.show_store_name
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-slate-100 border-slate-200 text-slate-400"
                      }`}
                    >
                      {isTr ? "Mağaza Adı Açık" : "Store Name On"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {isTr ? "AFİŞ BAŞLIĞI" : "SLIDE TITLE"}
                  </label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => handleUpdateBannerField(slide.id, "title", e.target.value)}
                    placeholder={isTr ? "Karşılama başlığı girin..." : "Enter slide title..."}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {isTr ? "AFİŞ ALT BAŞLIĞI" : "SLIDE SUBTITLE"}
                  </label>
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) => handleUpdateBannerField(slide.id, "subtitle", e.target.value)}
                    placeholder={isTr ? "Açıklayıcı slogan girin..." : "Enter slide subtitle..."}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              {/* Button customization */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {isTr ? "BUTON METNİ" : "BUTTON TEXT"}
                  </label>
                  <input
                    type="text"
                    value={slide.button_text}
                    onChange={(e) => handleUpdateBannerField(slide.id, "button_text", e.target.value)}
                    placeholder={isTr ? "Örn: İletişime Geç" : "e.g., Contact Us"}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {isTr ? "BUTON LİNKİ" : "BUTTON LINK"}
                  </label>
                  <input
                    type="text"
                    value={slide.button_link}
                    onChange={(e) => handleUpdateBannerField(slide.id, "button_link", e.target.value)}
                    placeholder="Örn: #portfolio veya #contact"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Upload Button */}
          {(!displayBanners || displayBanners.length < 5) && (
            <label className="w-full flex flex-col h-28 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-500 hover:bg-slate-50/50 transition-all uppercase tracking-widest cursor-pointer bg-slate-50">
              <Plus className="h-5 w-5 text-slate-400" />
              {isTr ? "YENİ AFİŞ / BANNER YÜKLE" : "UPLOAD NEW SLIDE"}
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
                      handleAddBanner(b64);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Sections Config */}
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

      {/* Grid Settings */}
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
