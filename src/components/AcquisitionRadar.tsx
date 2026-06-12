import React, { useState, useEffect } from 'react';
import { Search, Radar, ExternalLink, User, MapPin, Building2, Sparkles, RefreshCw, ChevronRight } from 'lucide-react';
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

export const AcquisitionRadar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const scanPortals = async () => {
    setLoading(true);
    try {
      const data = await api.getAcquisitionLeads("101evler.com", "individual");
      setLeads(data);
      setLastScan(new Date().toLocaleTimeString());
      toast.success("101evler.com bireysel ilanlar başarıyla tarandı.");
    } catch (error) {
      console.error("Acquisition scan failed:", error);
      toast.error("Tarama sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scanPortals();
  }, []);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radar className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="text-lg font-black uppercase tracking-tight">Mülk Toplama Radarı (Lead Acquisition)</h3>
          </div>
          <p className="text-xs text-indigo-200 font-medium opacity-80">101evler.com üzerindeki son 5 bireysel (sahibinden) ilanı yapay zeka ile canlı tarar.</p>
        </div>
        <button 
          onClick={scanPortals}
          disabled={loading}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/10 active:scale-95"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
          {loading ? "Taranıyor..." : "Yeniden Tara"}
        </button>
      </div>

      <div className="p-6">
        {loading && leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
              <Radar className="w-12 h-12 text-indigo-600 relative z-10" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">101evler.com Taranıyor...</p>
              <p className="text-xs text-slate-400 italic">Bireysel ve yeni ilanlar ayrıştırılıyor</p>
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Herhangi bir ilan bulunamadı.</p>
            <button onClick={scanPortals} className="mt-4 text-indigo-600 font-black text-xs uppercase underline">Tekrar Deneyin</button>
          </div>
        ) : (
          <div className="space-y-4">
            {leads.map((lead) => (
              <div key={lead.id} className="group bg-slate-50 hover:bg-white border border-slate-150 hover:border-indigo-200 rounded-2xl p-4 transition-all hover:shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Bireysel İlan</span>
                    <span className="text-[10px] text-slate-400 font-bold italic">Tespit Edildi: {lastScan}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight">{lead.title}</h4>
                  <div className="flex flex-wrap gap-3 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3 text-indigo-500" /> {lead.type}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-rose-500" /> {lead.location}</span>
                    <span className="flex items-center gap-1 text-slate-900"><User className="w-3 h-3 text-slate-400" /> Sahibi: {lead.owner_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="text-right">
                    <span className="block text-[10px] font-black text-slate-400 uppercase leading-none">FIRSAT FİYATI</span>
                    <span className="text-lg font-black text-indigo-600">{lead.currency === 'GBP' ? '£' : lead.currency === 'USD' ? '$' : '₺'}{new Intl.NumberFormat('tr-TR').format(lead.price)}</span>
                  </div>
                  <a 
                    href={lead.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-slate-900 hover:text-white p-3 rounded-xl border border-slate-200 transition-all shadow-sm active:scale-95 group/btn"
                  >
                    <ExternalLink className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
            
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <p className="text-[11px] text-indigo-900 font-medium">Bu liste, web'deki en güncel 101evler verilerini baz alan bir <strong>Yapay Zeka Taramasıdır</strong>. Portföye almak istediğiniz mülk için ilan sahibiyle iletişime geçebilirsiniz.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
