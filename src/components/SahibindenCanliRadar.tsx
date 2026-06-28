import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Plus, 
  MapPin, 
  User, 
  HelpCircle,
  TrendingUp,
  Sparkles,
  Info
} from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

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

export const SahibindenCanliRadar = () => {
  const [source, setSource] = useState<string>("101evler.com");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanningRegion, setScanningRegion] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [importingId, setImportingId] = useState<string | null>(null);

  const fetchLeads = async (platformSource: string) => {
    setLoading(true);
    setScanningRegion("Bağlanıyor...");
    try {
      // Show simulated radar scans for realistic feedback
      const scanSteps = [
        "Portala bağlantı kuruluyor...",
        "Bölgeler taranıyor: Alsancak, Girne...",
        "Alayköy, Lefkoşa sahibinden ilanları analiz ediliyor...",
        "Ötüken, İskele yeni verileri çekiliyor...",
        "Yapay zekâ ile bireysel ilanlar süzülüyor..."
      ];
      
      let stepIndex = 0;
      const interval = setInterval(() => {
        if (stepIndex < scanSteps.length) {
          setScanningRegion(scanSteps[stepIndex]);
          stepIndex++;
        }
      }, 700);

      const res = await api.getAcquisitionLeads(platformSource, "individual");
      clearInterval(interval);
      setLeads(res || []);
      toast.success(`${platformSource} üzerinden en son fırsatlar başarıyla tarandı!`);
    } catch (err) {
      console.error(err);
      toast.error("Canlı radar taranırken bir hata oluştu.");
    } finally {
      setLoading(false);
      setScanningRegion("");
    }
  };

  useEffect(() => {
    fetchLeads(source);
  }, [source]);

  const handleImport = async (lead: Lead) => {
    setImportingId(lead.id);
    try {
      // Map lead properties to actual real estate property fields
      const newProperty = {
        title: lead.title,
        description: lead.description || "Radar tarafından taranan bireysel (sahibinden) ilan.",
        price: lead.price,
        currency: lead.currency || "GBP",
        location: lead.location,
        type: lead.type === "Land" ? "Arsa" : lead.type === "Villa" ? "Villa" : "Daire",
        status: "active",
        sharing_scope: "shared_pool", // Ortak havuz
        responsible_agent: lead.owner_name || "Sahibinden",
        owner_info: {
          fullName: lead.owner_name || "Sahibinden",
          phone: "", // Will be filled by user later
          idNumber: ""
        },
        listing_intent: "sale"
      };

      await api.addProperty(newProperty);
      toast.success("Mülk, portföyünüze başarıyla aktarıldı ve şubelerle paylaşıldı!");
    } catch (err: any) {
      console.error(err);
      toast.error("Portföye eklenirken hata oluştu: " + (err.message || err.error || ""));
    } finally {
      setImportingId(null);
    }
  };

  // Extract unique locations for filtering
  const locations = ["all", ...Array.from(new Set(leads.map(l => {
    const parts = l.location.split(",");
    return parts[0].trim();
  })))];

  const filteredLeads = leads.filter(l => {
    if (locationFilter === "all") return true;
    return l.location.toLowerCase().includes(locationFilter.toLowerCase());
  });

  const formatNumberVal = (val: any) => {
    if (val === undefined || val === null || val === '') return '0';
    const cleanVal = val.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleanVal);
    if (isNaN(parsed)) return val;
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(parsed));
  };

  return (
    <div className="space-y-6" id="sahibinden-radar-container">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30">
            <Sparkles className="w-3 h-3 animate-spin" /> Yapay Zekâ Destekli
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Sahibinden Canlı Radar <span className="text-xs bg-emerald-500 text-slate-950 font-extrabold px-2 py-0.5 rounded-full uppercase">KKTC Aktif</span>
          </h3>
          <p className="text-slate-400 text-xs max-w-xl font-medium leading-relaxed">
            101evler.com, hangiev.com ve Facebook Gayrimenkul Paylaşım Gruplarındaki doğrudan sahibinden girilen acil ilanları yapay zekâ ile tarayarak radarınıza taşır.
          </p>
        </div>

        <button 
          onClick={() => fetchLeads(source)}
          disabled={loading}
          className="relative z-10 bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow active:scale-95 border border-slate-200 flex items-center gap-2 self-start md:self-auto shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          Radarı Yeniden Çalıştır
        </button>
      </div>

      {/* Sources Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "101evler.com", label: "101evler.com", color: "border-orange-500/30 hover:bg-orange-50/50 text-orange-700 bg-orange-50/20" },
            { id: "hangiev.com", label: "hangiev.com", color: "border-emerald-500/30 hover:bg-emerald-50/50 text-emerald-700 bg-emerald-50/20" },
            { id: "facebook", label: "Facebook Grupları", color: "border-blue-500/30 hover:bg-blue-50/50 text-blue-700 bg-blue-50/20" }
          ].map(platform => (
            <button
              key={platform.id}
              onClick={() => setSource(platform.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                source === platform.id 
                  ? "bg-slate-900 text-white border-slate-900 shadow-md scale-102" 
                  : `bg-white text-slate-600 border-slate-200 hover:bg-slate-50`
              }`}
            >
              {platform.label}
            </button>
          ))}
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Bölge:</span>
          <div className="flex flex-wrap gap-1">
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setLocationFilter(loc)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                  locationFilter === loc 
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent"
                }`}
              >
                {loc === "all" ? "Tümü" : loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Radar Scanning UI */}
      {loading && (
        <div className="relative overflow-hidden bg-slate-50 border border-slate-200 p-8 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping"></div>
            <div className="absolute inset-4 rounded-full bg-indigo-500/20 animate-pulse"></div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Zap className="w-5 h-5 animate-bounce" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-slate-800 font-extrabold text-sm uppercase tracking-wide">KKTC Bireysel İlanları Taranıyor...</p>
            <p className="text-indigo-600 text-xs font-black h-4 animate-pulse">{scanningRegion}</p>
          </div>
        </div>
      )}

      {/* Leads List */}
      {!loading && filteredLeads.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
          <Search className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-extrabold text-sm">İlan Bulunamadı</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Seçilen kriterlere uygun bireysel ilan bulunamadı. Radarı yeniden çalıştırarak veya başka bir platform seçerek tekrar deneyebilirsiniz.
          </p>
        </div>
      )}

      {!loading && filteredLeads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="radar-leads-grid">
          {filteredLeads.map(lead => (
            <div 
              key={lead.id} 
              className="bg-white rounded-3xl shadow-sm border border-slate-150 p-5 flex flex-col justify-between space-y-4 hover:shadow-md hover:border-slate-350 transition-all group"
            >
              <div className="space-y-3">
                {/* Meta details */}
                <div className="flex items-center justify-between text-[10px] font-black border-b border-slate-100 pb-2 mb-1">
                  <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    📢 {source.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg uppercase tracking-wider">
                    👤 {lead.owner_name || "Sahibinden"}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="font-extrabold text-sm text-slate-950 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {lead.title}
                  </h4>
                  <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {lead.location}
                  </p>
                </div>

                <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">
                  {lead.description || "Açıklama detayı bulunmuyor."}
                </p>

                {/* Technical stats */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-extrabold border border-slate-200">
                    🏷 {lead.type === "Land" ? "Arsa" : lead.type === "Villa" ? "Villa" : "Konut"}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-extrabold border border-emerald-100">
                    💰 {lead.currency === 'GBP' ? '£' : lead.currency === 'USD' ? '$' : lead.currency === 'EUR' ? '€' : '₺'}{formatNumberVal(lead.price)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <a 
                  href={lead.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-1 px-3 py-2 text-[10px] font-black text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-indigo-100 uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  Orijinal İlana Git <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  onClick={() => handleImport(lead)}
                  disabled={importingId !== null}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow border border-slate-950 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {importingId === lead.id ? "Portföye Alınıyor..." : "Portföye Aktar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advisory Note */}
      <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex gap-3 text-slate-500">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Mülk Edinme ve Portföy Genişletme İpuçları</p>
          <p className="text-[11px] leading-relaxed">
            Radar üzerinden tespit ettiğiniz bireysel satıcılarla iletişime geçerken <strong>"LookPrice Premium VIP Sözleşme"</strong> şablonlarımızı kullanarak hızlıca yetki belgesi oluşturabilirsiniz. Bu sayede ilanları anında yasal güvence altına alarak portföy havuzunuzda yayınlayabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
};
