import React from "react";
import { 
  Sparkles, 
  ExternalLink, 
  SlidersHorizontal, 
  Globe, 
  Search, 
  Filter, 
  Database, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw, 
  FileImage,
  Store as StoreIcon
} from "lucide-react";
import { StoreFeaturedRow } from "./StoreFeaturedRow";
import { Store, EnrakipsizSettings } from "../../types/superadmin";

interface EnrakipsizPortalManagerProps {
  lang: string;
  st: any;
  enrakipsizSettings: EnrakipsizSettings;
  setEnrakipsizSettings: (settings: any) => void;
  loadingEnrakipsiz: boolean;
  savingSettings: boolean;
  handleSaveSettings: (e: React.FormEvent) => void;
  handleSaveStoreFeatured: (storeId: number, isFeatured: boolean, order: number, title: string) => void;
  savingFeaturedStoreId: number | null;
  featuredSearchTerm: string;
  setFeaturedSearchTerm: (term: string) => void;
  showOnlySponsors: boolean;
  setShowOnlySponsors: (show: boolean) => void;
  stores: Store[];
}

export const EnrakipsizPortalManager: React.FC<EnrakipsizPortalManagerProps> = ({
  enrakipsizSettings,
  setEnrakipsizSettings,
  loadingEnrakipsiz,
  savingSettings,
  handleSaveSettings,
  handleSaveStoreFeatured,
  savingFeaturedStoreId,
  featuredSearchTerm,
  setFeaturedSearchTerm,
  showOnlySponsors,
  setShowOnlySponsors,
  stores,
}) => {
  return (
    <div className="space-y-8">
      {/* Header notification banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold mb-1">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider">KAPTAN KÖŞKÜ YÖNETİMİ</span>
          </div>
          <h2 className="text-xl font-black text-white">enrakipsiz.com Portal Yönetim Paneli</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            enrakipsiz.com portalınızın logosunu, favicon ikonu, SEO meta etiketlerini ve sponsor mağaza vitrinini buradan yönetebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="https://enrakipsiz.com" 
            target="_blank" 
            referrerPolicy="no-referrer"
            className="bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700 flex items-center gap-2 shadow-sm"
          >
            Portalı Canlı Gör <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: LOGO, FAVICON & SEO SETTINGS */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6 h-fit">
          <div>
            <h3 className="text-md font-bold text-gray-900 border-b pb-3 mb-2 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-indigo-600" /> Marka, Logo & SEO Ayarları
            </h3>
            <p className="text-xs text-gray-500 font-medium">Portalınızın görsel kimliğini, arama motoru ayarlarını ve izleme kodlarını düzenleyin.</p>
          </div>

          {loadingEnrakipsiz ? (
            <div className="py-12 text-center text-sm text-gray-450 font-bold animate-pulse">
              Portal Ayarları Yükleniyor...
            </div>
          ) : (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* PORTAL LOGO & FAVICON YÖNETİM BLOĞU */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                    1. Portal Logo & Favicon Yönetimi
                  </h4>
                </div>

                {/* LOGO SECTION */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase">
                    Portal Ana Logosu (Üst Header)
                  </label>
                  
                  {/* Logo Preview */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 px-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center min-w-[100px]">
                        <img 
                          src={enrakipsizSettings.portal_logo_url || "/enrakipsiz-logo.svg"} 
                          alt="Portal Logosu" 
                          className="h-7 w-auto object-contain"
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = "/enrakipsiz-logo.svg";
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {enrakipsizSettings.portal_logo_url ? "Özel Yüklü Logo" : "Sistem Varsayılan Logosu"}
                      </div>
                    </div>

                    {enrakipsizSettings.portal_logo_url && (
                      <button
                        type="button"
                        onClick={() => {
                          setEnrakipsizSettings({ ...enrakipsizSettings, portal_logo_url: "" });
                          localStorage.removeItem("enrakipsiz_portal_logo");
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold bg-rose-500/10 px-2.5 py-1.5 rounded border border-rose-500/20 transition-all shrink-0"
                        title="Varsayılana Sıfırla"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Sıfırla</span>
                      </button>
                    )}
                  </div>

                  {/* URL Input */}
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    value={enrakipsizSettings.portal_logo_url || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setEnrakipsizSettings({...enrakipsizSettings, portal_logo_url: val});
                      if (val) localStorage.setItem("enrakipsiz_portal_logo", val);
                      else localStorage.removeItem("enrakipsiz_portal_logo");
                    }}
                    placeholder="https://.../logo.png veya varsayılan için boş bırakın"
                  />

                  {/* File Upload Trigger */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cihazdan Logo Yükle</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              if (base64) {
                                setEnrakipsizSettings({ ...enrakipsizSettings, portal_logo_url: base64 });
                                localStorage.setItem("enrakipsiz_portal_logo", base64);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* FAVICON SECTION */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase">
                    Tarayıcı Sekme İkonu (Favicon)
                  </label>
                  
                  {/* Favicon Preview */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center p-1">
                        <img 
                          src={enrakipsizSettings.favicon_url || "/enrakipsiz-favicon.svg"} 
                          alt="Favicon" 
                          className="w-full h-full object-contain"
                          onError={(e: any) => {
                            e.target.onerror = null;
                            e.target.src = "/enrakipsiz-favicon.svg";
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {enrakipsizSettings.favicon_url ? "Özel Yüklü Favicon" : "Sistem Faviconu"}
                      </span>
                    </div>

                    {enrakipsizSettings.favicon_url && (
                      <button
                        type="button"
                        onClick={() => {
                          setEnrakipsizSettings({ ...enrakipsizSettings, favicon_url: "" });
                          localStorage.removeItem("enrakipsiz_portal_favicon");
                        }}
                        className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 transition-all shrink-0"
                        title="Varsayılana Sıfırla"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Sıfırla</span>
                      </button>
                    )}
                  </div>

                  {/* URL Input */}
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                    value={enrakipsizSettings.favicon_url || ""}
                    onChange={e => {
                      const val = e.target.value;
                      setEnrakipsizSettings({...enrakipsizSettings, favicon_url: val});
                      if (val) localStorage.setItem("enrakipsiz_portal_favicon", val);
                      else localStorage.removeItem("enrakipsiz_portal_favicon");
                    }}
                    placeholder="https://.../favicon.ico veya boş bırakın"
                  />

                  {/* File Upload Trigger */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition">
                      <FileImage className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cihazdan Favicon Yükle</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              if (base64) {
                                setEnrakipsizSettings({ ...enrakipsizSettings, favicon_url: base64 });
                                localStorage.setItem("enrakipsiz_portal_favicon", base64);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

              </div>

              {/* METİN VE AÇIKLAMA AYARLARI */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  2. Portal Başlık & Metin Ayarları
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Portal Giriş Ana Başlığı</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                    value={enrakipsizSettings.portal_title || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, portal_title: e.target.value})}
                    placeholder="Seçkin Mağazalardan Rakipsiz Teklifler & İlanlar"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Portal Açıklama Metni</label>
                  <textarea 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-20"
                    value={enrakipsizSettings.portal_description || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, portal_description: e.target.value})}
                    placeholder="Emlak ve oto galeri ilanlarını tek ekranda inceleyin..."
                  />
                </div>
              </div>

              {/* SEO & GOOGLE ANALYTICS AYARLARI */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-emerald-600" /> 3. SEO & Google Analytics Entegrasyonu
                </h4>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SEO Sayfa Başlığı (Meta Title)</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium"
                    value={enrakipsizSettings.seo_title || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, seo_title: e.target.value})}
                    placeholder="Örn: EnRakipsiz | Seçkin Emlak ve Otomotiv Portföy Pazaryeri"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SEO Sayfa Açıklaması (Meta Description)</label>
                  <textarea 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs h-20"
                    value={enrakipsizSettings.seo_description || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, seo_description: e.target.value})}
                    placeholder="Örn: Doğrulanmış kurumsal emlak portföyleri ve araç ilanları..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">SEO Anahtar Kelimeler (Meta Keywords)</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    value={enrakipsizSettings.seo_keywords || ""}
                    onChange={e => setEnrakipsizSettings({...enrakipsizSettings, seo_keywords: e.target.value})}
                    placeholder="Örn: emlak, satilik araba, luks yali, oto galeri"
                  />
                </div>

                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-emerald-800 uppercase mb-1">Google Analytics Tracking ID</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
                      value={enrakipsizSettings.google_analytics_id || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, google_analytics_id: e.target.value})}
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-emerald-800 uppercase mb-1">Google Tag Manager ID</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
                      value={enrakipsizSettings.google_tag_manager_id || ""}
                      onChange={e => setEnrakipsizSettings({...enrakipsizSettings, google_tag_manager_id: e.target.value})}
                      placeholder="GTM-XXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-emerald-800 uppercase mb-1">Google Search Console ID</label>
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

              <div className="pt-4 border-t">
                <button 
                  type="submit" 
                  disabled={savingSettings}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {savingSettings ? "Kaydediliyor..." : <><Database className="h-4 w-4" /> AYARLARI KAYDET VE CANLIYA AL</>}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN: SPONSOR STORES (VİTRİN SPONSORLARI) SECTION */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
                <StoreIcon className="h-5 w-5 text-amber-500" /> Sponsor & Öne Çıkan Mağazalar
              </h3>
              <p className="text-xs text-gray-500 font-medium">Portalda üst bantta veya vitrinde gösterilecek öne çıkan mağazaları yönetin.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Mağaza adı veya domain araması..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                value={featuredSearchTerm}
                onChange={e => setFeaturedSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowOnlySponsors(!showOnlySponsors)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shrink-0 ${
                showOnlySponsors 
                  ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              {showOnlySponsors ? 'Sadece Sponsorlar' : 'Tüm Mağazalar'}
            </button>
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
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
                    <p className="text-xs text-gray-400 font-bold">Kriterlere uygun mağaza bulunamadı.</p>
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
  );
};
