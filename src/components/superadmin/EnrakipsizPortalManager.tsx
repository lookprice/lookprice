import React from "react";
import { 
  Megaphone, 
  Sparkles, 
  ExternalLink, 
  SlidersHorizontal, 
  Layout, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Globe,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Database
} from "lucide-react";
import { StoreFeaturedRow } from "./StoreFeaturedRow";
import { Store, EnrakipsizSettings, EnrakipsizSlide, EnrakipsizAd } from "../../types/superadmin";

interface EnrakipsizPortalManagerProps {
  lang: string;
  st: any;
  enrakipsizSettings: EnrakipsizSettings;
  setEnrakipsizSettings: (settings: any) => void;
  enrakipsizSlides: EnrakipsizSlide[];
  enrakipsizAds: EnrakipsizAd[];
  loadingEnrakipsiz: boolean;
  savingSettings: boolean;
  handleSaveSettings: (e: React.FormEvent) => void;
  handleDeleteSlide: (id: number) => void;
  handleDeleteAd: (id: number) => void;
  handleSaveStoreFeatured: (storeId: number, isFeatured: boolean, order: number, title: string) => void;
  savingFeaturedStoreId: number | null;
  setEditingSlide: (slide: any) => void;
  setShowSlideModal: (show: boolean) => void;
  setEditingAd: (ad: any) => void;
  setShowAdModal: (show: boolean) => void;
  featuredSearchTerm: string;
  setFeaturedSearchTerm: (term: string) => void;
  showOnlySponsors: boolean;
  setShowOnlySponsors: (show: boolean) => void;
  stores: Store[];
  draggedIndex: number | null;
  setDraggedIndex: (idx: number | null) => void;
  dragOverIndex: number | null;
  setDragOverIndex: (idx: number | null) => void;
  getParsedSections: () => { id: string; enabled: boolean }[];
  moveSection: (index: number, direction: 'up' | 'down') => void;
  handleDrop: (e: React.DragEvent, targetIdx: number) => void;
  toggleSectionEnabled: (id: string) => void;
}

export const EnrakipsizPortalManager: React.FC<EnrakipsizPortalManagerProps> = ({
  lang,
  st,
  enrakipsizSettings,
  setEnrakipsizSettings,
  enrakipsizSlides,
  enrakipsizAds,
  loadingEnrakipsiz,
  savingSettings,
  handleSaveSettings,
  handleDeleteSlide,
  handleDeleteAd,
  handleSaveStoreFeatured,
  savingFeaturedStoreId,
  setEditingSlide,
  setShowSlideModal,
  setEditingAd,
  setShowAdModal,
  featuredSearchTerm,
  setFeaturedSearchTerm,
  showOnlySponsors,
  setShowOnlySponsors,
  stores,
  draggedIndex,
  setDraggedIndex,
  dragOverIndex,
  setDragOverIndex,
  getParsedSections,
  moveSection,
  handleDrop,
  toggleSectionEnabled
}) => {
  return (
    <div className="space-y-8">
      {/* Header notification banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold mb-1">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider">CTO KONTROL SİSTEMİ</span>
          </div>
          <h2 className="text-xl font-black">enrakipsiz.com Portal Yönetim Sistemi</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            lookprice altyapısı üzerinde koşan enrakipsiz.com portal vitrinini, sponsor reklam alanlarını ve tüm görsel temayı tek panelden yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="/marketplace" 
            target="_blank" 
            referrerPolicy="no-referrer"
            className="bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-1.5"
          >
            Portalı Canlı Gör <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUMN 1: PORTAL CORE SETTINGS */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6 h-fit">
          <div>
            <h3 className="text-md font-bold text-gray-900 border-b pb-3 mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-indigo-600" /> Portal Tema & Metin Ayarları
            </h3>
            <p className="text-xs text-gray-550 mb-4 font-medium">Portaldaki başlıkları, renkleri ve duyuru alanlarını dilediğinizce değiştirin.</p>
          </div>

          {loadingEnrakipsiz ? (
            <div className="py-12 text-center text-sm text-gray-450 font-bold animate-pulse">
              Ayarlar Yükleniyor...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Portal Giriş Ana Başlığı</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={enrakipsizSettings.portal_title || ""}
                  onChange={e => setEnrakipsizSettings({...enrakipsizSettings, portal_title: e.target.value})}
                  placeholder="Seçkin Mağazalardan Rakipsiz Teklifler & İlanlar"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Giriş Alt Başlık Açıklaması</label>
                <textarea 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-24"
                  value={enrakipsizSettings.portal_description || ""}
                  onChange={e => setEnrakipsizSettings({...enrakipsizSettings, portal_description: e.target.value})}
                  placeholder="En seçkin ilanlar..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bar Duyuru & Kampanya Barı Metni</label>
                <textarea 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-24"
                  value={enrakipsizSettings.announcement || ""}
                  onChange={e => setEnrakipsizSettings({...enrakipsizSettings, announcement: e.target.value})}
                  placeholder="Kişiye özel prestij kredisi..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Footer / Telif Hakkı Yazısı</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={enrakipsizSettings.footer_text || ""}
                  onChange={e => setEnrakipsizSettings({...enrakipsizSettings, footer_text: e.target.value})}
                  placeholder="© 2026 Enrakipsiz.com. Tüm hakları saklıdır."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Portal Tema Vurgu Rengi</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    className="h-10 w-10 border border-gray-200 rounded-xl p-0.5 cursor-pointer"
                    value={enrakipsizSettings.primary_color || "#4f46e5"}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, primary_color: e.target.value})}
                  />
                  <input 
                    type="text" 
                    className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs uppercase font-mono"
                    value={enrakipsizSettings.primary_color || "#4f46e5"}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, primary_color: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Portal Ana Domaini (Bağlanacak Domain)</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono"
                  value={enrakipsizSettings.portal_domain || ""}
                  onChange={e => setEnrakipsizSettings({...enrakipsizSettings, portal_domain: e.target.value})}
                  placeholder="enrakipsiz.com"
                />
                <p className="text-[9px] text-gray-400 mt-1 italic leading-tight">Bu domaine gelen trafik otomatik olarak Market/Portal sayfasına yönlendirilir.</p>
              </div>

              {/* INTERAKTİF REORDERING GRIDS */}
              <div className="border-t pt-4 mt-6">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layout className="h-4 w-4 text-indigo-500 animate-pulse" /> 5. Sürükle-Bırak Portal Sayfa Düzeni (Layout Builder)
                </h4>
                <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
                  Portaldaki modüllerin yerleşim sırasını <strong>sürükleyip bırakarak</strong> veya yön butonlarıyla serbestçe değiştirebilirsiniz. Göz ikonu ile modülü gizleyin/gösterin.
                </p>

                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {(() => {
                    const sectionLabels: { [key: string]: { title: string; desc: string } } = {
                      hero: { title: "✨ Lüks Slayt Gösterisi & Arama", desc: "Hero slider, arama motoru, ilan filtreleri" },
                      announcement: { title: "📣 Finans & Takas Duyuru Barı", desc: "Kredi oranları ve takas ilanları şeridi" },
                      sponsors: { title: "🏆 Sponsor Network Reklamları", desc: "Seçkin mağaza logoları ve ortaklık kartları" },
                      vehicles: { title: "🚗 Premium Otomobil Vitrini", desc: "Vasıta ilanları, marka logoları ve vitrin" },
                      properties: { title: "🏡 Seçkin Gayrimenkul Vitrini", desc: "Emlak ilanları, harita ve portföy vitrini" }
                    };
                    return getParsedSections().map((sec, idx, arr) => {
                      const info = sectionLabels[sec.id] || { title: sec.id, desc: "" };
                      const isDragged = draggedIndex === idx;
                      const isDragOver = dragOverIndex === idx;
                      return (
                        <div 
                          key={sec.id} 
                          draggable="true"
                          onDragStart={(e) => {
                            setDraggedIndex(idx);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverIndex !== idx) setDragOverIndex(idx);
                          }}
                          onDragEnd={() => {
                            setDraggedIndex(null);
                            setDragOverIndex(null);
                          }}
                          onDrop={(e) => handleDrop(e, idx)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-[11px] font-semibold transition-all duration-200 select-none ${
                            isDragged 
                              ? "opacity-30 border-dashed border-indigo-400 bg-indigo-50/20 scale-95" 
                              : isDragOver
                              ? "border-t-2 border-t-indigo-600 bg-indigo-50/10 scale-[1.01] shadow-md"
                              : sec.enabled 
                              ? "bg-white border-slate-200 text-slate-700 shadow-sm hover:border-slate-300" 
                              : "bg-slate-100 border-slate-200 text-slate-400 line-through"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 transition-colors shrink-0" title="Sürükle">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate font-bold text-slate-800">{info.title}</span>
                              {info.desc && (
                                <span className={`block text-[9px] font-medium leading-tight mt-0.5 ${sec.enabled ? "text-slate-400" : "text-slate-400"}`}>
                                  {info.desc}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, 'up')}
                              className="p-1 hover:bg-slate-100 rounded text-slate-650 disabled:opacity-20 transition-colors"
                              title="Yukarı Taşı"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === arr.length - 1}
                              onClick={() => moveSection(idx, 'down')}
                              className="p-1 hover:bg-slate-100 rounded text-slate-650 disabled:opacity-20 transition-colors"
                              title="Aşağı Taşı"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSectionEnabled(sec.id)}
                              className={`p-1 rounded transition-colors ${
                                sec.enabled 
                                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                                  : "bg-rose-50 text-rose-500 hover:bg-rose-100"
                              }`}
                              title={sec.enabled ? "Gizle" : "Göster"}
                            >
                              {sec.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* SEO & GOOGLE ANALYTICS AYARLARI */}
              <div className="border-t pt-4 mt-6 space-y-4">
                <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                  <Globe className="h-4 w-4" /> SEO & Google Analytics Kaptan Köşkü
                </h4>
                <p className="text-[10px] text-gray-400 italic">
                  enrakipsiz.com için Google arama motoru optimizasyonunu, anahtar kelimeleri ve analytics izleme kodlarını buradan yönetin.
                </p>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">SEO Sayfa Başlığı (Meta Title)</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                    value={enrakipsizSettings.seo_title || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, seo_title: e.target.value})}
                    placeholder="Örn: EnRakipsiz | KKTC'nin En Büyük Portföy Portalı"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">SEO Sayfa Açıklaması (Meta Description)</label>
                  <textarea 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-20"
                    value={enrakipsizSettings.seo_description || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, seo_description: e.target.value})}
                    placeholder="Örn: KKTC'nin en seçkin emlak yalı ve lüks vasıta ilanları..."
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">SEO Anahtar Kelimeler (Meta Keywords)</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    value={enrakipsizSettings.seo_keywords || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, seo_keywords: e.target.value})}
                    placeholder="Örn: kktc emlak, satilik araba, luks yali"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Google Arama Favicon / Özel Logo URL (İsteğe Bağlı)</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    value={enrakipsizSettings.favicon_url || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, favicon_url: e.target.value})}
                    placeholder="Boş bırakılırsa varsayılan EnRakipsiz ikonu kullanılır (https://enrakipsiz.com/favicon-512x512.png)"
                  />
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-emerald-700 uppercase mb-1">Google Analytics ID</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
                      value={enrakipsizSettings.google_analytics_id || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, google_analytics_id: e.target.value})}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-emerald-700 uppercase mb-1">Google Tag Manager ID</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
                      value={enrakipsizSettings.google_tag_manager_id || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, google_tag_manager_id: e.target.value})}
                      placeholder="GTM-XXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-emerald-700 uppercase mb-1">Google Search Console Verification ID</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
                      value={enrakipsizSettings.google_search_console_id || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, google_search_console_id: e.target.value})}
                      placeholder="sc-verification-code"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t mt-8">
                <button 
                  type="submit" 
                  disabled={savingSettings}
                  className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {savingSettings ? "Kaydediliyor..." : <><Database className="h-4 w-4" /> PORTAL AYARLARINI GÜNCELLE</>}
                </button>
                <p className="text-[9px] text-center text-gray-400 mt-3 font-medium uppercase tracking-widest">Sistem Konfigürasyonu</p>
              </div>
            </form>
          )}
        </div>

        {/* COLUMN 2-4: SLIDES & ADS & SPONSORS */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* SLIDES SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Layout className="h-5 w-5 text-indigo-600" /> 1. Ana Vitrin Slaytları (Hero Slider)
                </h3>
                <p className="text-xs text-gray-500 font-medium">Portal ana sayfasındaki en büyük slayt alanını buradan yönetin.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingSlide({ title: "", subtitle: "", image_url: "", is_active: true, accent: "from-indigo-500 to-purple-500" });
                  setShowSlideModal(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Yeni Slayt Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrakipsizSlides.length === 0 ? (
                <div className="col-span-2 py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 font-bold">Henüz hiç slayt eklenmemiş.</p>
                </div>
              ) : (
                enrakipsizSlides.map(slide => (
                  <div key={slide.id} className="relative group border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="h-40 overflow-hidden relative">
                      <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      {!slide.is_active && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">PASİF</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <span className="bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-md border border-white/20 uppercase tracking-tighter">{slide.type || 'genel'}</span>
                        {slide.badge && <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm uppercase tracking-tighter">{slide.badge}</span>}
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{slide.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{slide.subtitle}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setEditingSlide(slide);
                              setShowSlideModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSlide(slide.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-[9px] font-mono text-slate-300 uppercase">SLIDE ID: #{slide.id}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ADS SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-rose-500" /> 2. Statik Sponsor Reklam Alanları
                </h3>
                <p className="text-xs text-gray-500 font-medium">İlanlar arasına veya yan sütunlara yerleştirilen banner reklamları yönetin.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingAd({ title: "", broker: "", is_active: true, position: "middle", media_type: "image" });
                  setShowAdModal(true);
                }}
                className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Yeni Reklam Ekle
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {enrakipsizAds.length === 0 ? (
                <div className="col-span-3 py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <p className="text-sm text-gray-400 font-bold">Henüz hiç reklam eklenmemiş.</p>
                </div>
              ) : (
                enrakipsizAds.map(ad => (
                  <div key={ad.id} className="border border-gray-150 rounded-2xl overflow-hidden bg-slate-50/50 shadow-sm transition-all hover:bg-white hover:shadow-md border-b-2 border-b-rose-100">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded uppercase tracking-wider">{ad.position}</span>
                        <div className={`h-2 w-2 rounded-full ${ad.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`}></div>
                      </div>
                      <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{ad.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-tighter">@{ad.broker}</p>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setEditingAd(ad);
                              setShowAdModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAd(ad.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="text-[9px] font-mono text-slate-300">AD ID: #{ad.id}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SPONSOR STORES (VİTRİN SPONSORLARI) SECTION */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> 3. Sponsor Mağazalar (Şerit Vitrini)
                </h3>
                <p className="text-xs text-gray-500 font-medium">Sistemdeki mağazaları portalda "Sponsor" olarak öne çıkarın ve sloganlarını yönetin.</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Mağaza adına veya kullanıcı adına göre ara..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 transition-all"
                  value={featuredSearchTerm}
                  onChange={e => setFeaturedSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowOnlySponsors(!showOnlySponsors)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                  showOnlySponsors 
                    ? 'bg-amber-100 border-amber-200 text-amber-700 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                {showOnlySponsors ? 'Sadece Sponsorları Gösteriliyor' : 'Filtrele: Tüm Mağazalar'}
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {(() => {
                const searchTokens = featuredSearchTerm.toLowerCase().split(' ').filter(Boolean);
                const list = stores.filter(s => {
                  const matchesSearch = searchTokens.length === 0 || searchTokens.every(t => 
                    s.name.toLowerCase().includes(t) || s.slug.toLowerCase().includes(t)
                  );
                  const matchesSponsor = !showOnlySponsors || s.is_enrakipsiz_featured;
                  return matchesSearch && matchesSponsor;
                });

                if (list.length === 0) {
                  return (
                    <div className="py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <p className="text-sm text-gray-400 font-bold">Aradığınız kriterlere uygun mağaza bulunamadı.</p>
                    </div>
                  );
                }

                return list.sort((a,b) => {
                  if (a.is_enrakipsiz_featured && !b.is_enrakipsiz_featured) return -1;
                  if (!a.is_enrakipsiz_featured && b.is_enrakipsiz_featured) return 1;
                  return (a.enrakipsiz_featured_order || 999) - (b.enrakipsiz_featured_order || 999);
                }).map(store => (
                  <StoreFeaturedRow 
                    key={store.id} 
                    store={store} 
                    onSave={handleSaveStoreFeatured} 
                    isSaving={savingFeaturedStoreId === store.id} 
                  />
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
