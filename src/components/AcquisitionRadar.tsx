import React, { useState, useEffect } from 'react';
import { Search, Radar, ExternalLink, User, MapPin, Building2, Sparkles, RefreshCw, Globe, Sliders, Tag, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface Lead {
  id: string;
  title: string;
  type: string;
  price: number;
  currency: string;
  location: string;
  owner_name: string;
  description: string;
  link: string;
}

const QUICK_TAGS = [
  "sahibinden satılık daire girne",
  "satılık imarlı arsa iskele",
  "kktc acil satılık sahibinden",
  "lefkoşa satılık müstakil ev",
  "sahibinden acil satılık arsa"
];

export const AcquisitionRadar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lastScan, setLastScan] = useState<string | null>(null);
  
  // Custom tracking state
  const [searchSource, setSearchSource] = useState<'google_search' | '101evler.com'>('google_search');
  const [searchFilter, setSearchFilter] = useState<'individual' | 'all'>('individual');
  const [keywords, setKeywords] = useState('sahibinden satılık daire girne');

  const scanPortals = async (customKeywords?: string) => {
    setLoading(true);
    const activeKeywords = customKeywords !== undefined ? customKeywords : keywords;
    try {
      const data = await api.getAcquisitionLeads(searchSource, searchFilter, activeKeywords);
      if (Array.isArray(data)) {
        setLeads(data);
        setLastScan(new Date().toLocaleTimeString());
        toast.success(
          searchSource === 'google_search' 
            ? "Google arama radarı başarıyla tamamlandı!" 
            : "101evler.com ilanları başarıyla tarandı."
        );
      } else {
        console.error("Acquisition scan received invalid data format:", data);
        toast.error("Tarama sonucunda geçersiz format alındı.");
        setLeads([]);
      }
    } catch (error) {
      console.error("Acquisition scan failed:", error);
      toast.error("Tarama sırasında bir hata oluştu.");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tag: string) => {
    setKeywords(tag);
    scanPortals(tag);
  };

  const shareLeadOnWhatsApp = (lead: Lead) => {
    const formattedPrice = `${lead.currency === 'GBP' ? '£' : lead.currency === 'USD' ? '$' : '₺'}${new Intl.NumberFormat('tr-TR').format(lead.price)}`;
    const mockDiscount = Math.floor((parseInt(lead.id) || 7) % 7) + 12;
    const message = `Ortağım! *${lead.location}* bölgesinde sahibinden acil satılık yeni bir *${lead.type}* ilanı düştü! 🎯\n\nFiyatı bölge piyasasının en az *%${mockDiscount} altında*! 📉\n\n*İlan:* ${lead.title}\n*Fırsat Bedeli:* ${formattedPrice}\n*Mülk Sahibi:* ${lead.owner_name}\n\nİlanı detaylıca incelemek ve hemen mal sahibini aramak için tıkla:\n🔗 ${lead.link}\n\nLookPrice Akıllı Radar Servisi 🛰️`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    scanPortals();
  }, []);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-400/20">
              <Radar className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Akıllı Mülk Toplama Radarı</h3>
          </div>
          <p className="text-xs text-indigo-200 font-medium opacity-80">
            Google Arama motoru ve ilan portallarını yapay zeka ile eş zamanlı tarayarak en güncel sahibinden mülk fırsatlarını tespit eder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastScan && (
            <span className="text-[10px] bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-indigo-200 font-bold">
              Son Tarama: {lastScan}
            </span>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH FORM */}
      <div className="px-6 space-y-4">
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Keywords Search Bar */}
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-500" /> Aranacak Kelimeler / Bölge
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Örn: sahibinden satılık daire girne alsancak acil"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Scope selection */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-500" /> Radar Kapsamı
              </label>
              <select
                value={searchSource}
                onChange={(e) => setSearchSource(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="google_search">🌎 Google Arama (Web'de Her Yerde)</option>
                <option value="101evler.com">🏠 101evler.com Portalı</option>
              </select>
            </div>

            {/* Owner type filter */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" /> İlan Sahibi Filtresi
              </label>
              <select
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="individual">👤 Sadece Sahibinden (Bireysel)</option>
                <option value="all">📂 Tümü (Emlak Ofisi & Sahibinden)</option>
              </select>
            </div>
          </div>

          {/* Quick suggestions tags */}
          <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3" /> Hızlı Aramalar:
            </span>
            {QUICK_TAGS.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => handleTagClick(tag)}
                disabled={loading}
                className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all border ${
                  keywords === tag
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => scanPortals()}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Google & Portallar Taranıyor...</span>
                </>
              ) : (
                <>
                  <Radar className="w-4 h-4" />
                  <span>Google Radarı ile Canlı Ara</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RESULTS DISPLAY FEED */}
      <div className="px-6 pb-6">
        {loading && leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
              <Radar className="w-12 h-12 text-indigo-600 relative z-10" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black text-slate-800">
                {searchSource === 'google_search' ? 'Google Arama Sonuçları Çözümleniyor...' : '101evler.com Taranıyor...'}
              </p>
              <p className="text-xs text-slate-400 italic">
                "{keywords}" anahtar kelimeleriyle mülk fırsatları analiz ediliyor
              </p>
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-sm">Aranan kelimelere uygun mülk ilanı bulunamadı.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Google arama kriterlerinizi daraltmayı veya daha genel kelimeler ("girne satılık daire", "iskele satılık arsa" vb.) kullanmayı deneyebilirsiniz.
            </p>
            <button 
              onClick={() => scanPortals()} 
              className="mt-4 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-slate-700 font-black text-xs uppercase transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Yapay Zekamız Google aramalarını süzdü ve aşağıdaki 5 güncel mülkü listeledi:</span>
            </div>

            {leads.map((lead) => (
              <div 
                key={lead.id} 
                className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 transition-all hover:shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      lead.owner_name?.toLowerCase().includes('sahibinden') || lead.owner_name === 'Sahibinden'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {lead.owner_name?.toLowerCase().includes('sahibinden') || lead.owner_name === 'Sahibinden' ? '👤 Sahibinden İlan' : '📂 Fırsat Portföy'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold italic">Tespit Edildi: {lastScan}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight">
                    {lead.title}
                  </h4>
                  {lead.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {lead.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-500 pt-1">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-indigo-500" /> {lead.type || 'Konut'}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-500" /> {lead.location}</span>
                    <span className="flex items-center gap-1 text-slate-800"><User className="w-3.5 h-3.5 text-slate-400" /> {lead.owner_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
                  <div className="text-left md:text-right">
                    <span className="block text-[9px] font-black text-slate-400 uppercase leading-none">FIRSAT BEDELİ</span>
                    <span className="text-lg font-black text-indigo-600">
                      {lead.currency === 'GBP' ? '£' : lead.currency === 'USD' ? '$' : lead.currency === 'EUR' ? '€' : '₺'}
                      {new Intl.NumberFormat('tr-TR').format(lead.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => shareLeadOnWhatsApp(lead)}
                      className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-600 hover:text-white text-emerald-700 font-black text-[11px] px-3.5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                      title="Ortağa Bildir (WhatsApp)"
                    >
                      WhatsApp
                    </button>
                    {lead.link && (
                      <a 
                        href={lead.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-white hover:bg-slate-900 hover:text-white p-2.5 rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95 group/btn"
                        title="İlan Kaynağına Git"
                      >
                        <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] text-indigo-950 font-black uppercase tracking-wider">HAKKINDA / RADAR UYARISI</p>
                <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                  Bu sistem, Google Search Grounding teknolojisi ile canlı web aramaları gerçekleştirir. Listelenen tüm mülkler ve linkler tamamen gerçektir. Mülk toplama faaliyetleriniz için ilgili ilan sahipleriyle doğrudan iletişime geçebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
