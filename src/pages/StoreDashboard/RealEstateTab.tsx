import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Home, 
  MapPin, 
  Tag, 
  Edit2, 
  Trash2, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Globe, 
  FileCheck, 
  ExternalLink,
  Shield,
  HelpCircle,
  FolderLock,
  X
} from "lucide-react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { RealEstateModal } from "../../components/RealEstateModal";
import { RealEstateProperty } from "../../types";

interface RealEstateTabProps {
  properties: RealEstateProperty[];
  loading: boolean;
  onSave?: (p: Partial<RealEstateProperty>) => void;
  onDelete?: (id: number) => void;
  user?: any; // Contains store_id and role
}

// Fixed mock buyers list for the automated customer matching algorithm
interface BuyerDemand {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationality: 'UK' | 'TR';
  preferredRegions: string[];
  maxBudget: number;
  currency: 'GBP' | 'TRY';
  minSqm: number;
  p_type?: string;
  titleTypePref?: string;
}

const mockBuyers: BuyerDemand[] = [
  {
    id: "buyer_1",
    name: "Alistair Harrison (UK Investor)",
    phone: "+44 7911 123456",
    email: "alistair.h@capitaluk.com",
    nationality: "UK",
    preferredRegions: ["Girne", "İskele"],
    maxBudget: 175000,
    currency: "GBP",
    minSqm: 80,
    titleTypePref: "Türk Koçanı"
  },
  {
    id: "buyer_2",
    name: "Emily Watson",
    phone: "+44 7911 654321",
    email: "emily.watson@yahoo.co.uk",
    nationality: "UK",
    preferredRegions: ["İskele", "Gazimağusa"],
    maxBudget: 220000,
    currency: "GBP",
    minSqm: 90,
    titleTypePref: "Eşdeğer Koçan"
  },
  {
    id: "buyer_3",
    name: "Ahmet Yılmaz",
    phone: "0533 876 54 32",
    email: "ahmet.yilmaz@kibrismail.com",
    nationality: "TR",
    preferredRegions: ["Lefkoşa", "Girne"],
    maxBudget: 130000,
    currency: "GBP",
    minSqm: 100,
    titleTypePref: "Eşdeğer Koçan"
  },
  {
    id: "buyer_4",
    name: "Merve Şahin (İstanbul Yatırımcı)",
    phone: "0532 123 45 67",
    email: "merve.sahin@insaatplus.com",
    nationality: "TR",
    preferredRegions: ["İstanbul", "Kadıköy", "Lefkoşa"],
    maxBudget: 8500000,
    currency: "TRY",
    minSqm: 100
  }
];

const RealEstateTab = ({ properties, loading, onSave, onDelete, user }: RealEstateTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<RealEstateProperty | null>(null);
  
  // State for matching modal
  const [matchingProperty, setMatchingProperty] = useState<RealEstateProperty | null>(null);
  const [matchList, setMatchList] = useState<{ buyer: BuyerDemand; score: number; reason: string }[]>([]);

  // Simple currency conversion helper for the matching algorithm
  const convertToGBP = (price: number, fromCurrency: string): number => {
    const rates: Record<string, number> = {
      GBP: 1,
      TRY: 0.022,  // 1 TRY = 0.022 GBP approx
      USD: 0.80,   // 1 USD = 0.80 GBP approx
      EUR: 0.86    // 1 EUR = 0.86 GBP approx
    };
    return price * (rates[fromCurrency] || 1);
  };

  // Run the smart matching algorithm
  const runMatchingAlgorithm = (property: RealEstateProperty) => {
    const propPriceInGBP = convertToGBP(property.price, property.currency);
    const propSqm = property.square_meters || 0;
    const propLocation = property.location || "";
    const propRegion = property.kktc_region || "";
    const propTitle = property.kktc_title_type || "";

    const matches: { buyer: BuyerDemand; score: number; reason: string }[] = [];

    mockBuyers.forEach(buyer => {
      let score = 50; // base score
      let reasons: string[] = [];
      let isEligible = true;

      // 1. Region Match
      const matchesRegion = buyer.preferredRegions.some(reg => 
        propLocation.toLowerCase().includes(reg.toLowerCase()) ||
        propRegion.toLowerCase().includes(reg.toLowerCase())
      );

      if (matchesRegion) {
        score += 25;
        reasons.push("📍 Tercih edilen bölge uyumlu");
      } else {
        score -= 15;
      }

      // 2. Budget Check (Buyer's budget in GBP vs Property price in GBP)
      const buyerBudgetInGBP = buyer.currency === 'GBP' ? buyer.maxBudget : convertToGBP(buyer.maxBudget, buyer.currency);
      if (propPriceInGBP <= buyerBudgetInGBP) {
        score += 15;
        reasons.push(`💰 Fiyat bütçeye uygun (£${Math.round(propPriceInGBP).toLocaleString()} <= £${Math.round(buyerBudgetInGBP).toLocaleString()})`);
      } else {
        // Over budget
        const pctOver = (propPriceInGBP - buyerBudgetInGBP) / buyerBudgetInGBP;
        if (pctOver > 0.15) {
          isEligible = false; // strictly over budget
        } else {
          score -= 10; // slightly over budget
          reasons.push("⚠️ Fiyat bütçeyi hafif aşıyor");
        }
      }

      // 3. Space Check
      if (propSqm >= buyer.minSqm) {
        score += 10;
        reasons.push(`📐 Metrekare yeterli (${propSqm}m² >= ${buyer.minSqm}m²)`);
      } else {
        score -= 15;
      }

      // 4. KKTC Title Deed match (Koçan Tipi)
      if (property.country === 'KKTC' && buyer.titleTypePref) {
        if (propTitle === buyer.titleTypePref) {
          score += 10;
          reasons.push(`📜 Koçan tipi tam uyumlu (${propTitle})`);
        } else {
          score -= 5;
        }
      }

      if (isEligible && score >= 50) {
        matches.push({
          buyer,
          score: Math.min(score, 100),
          reason: reasons.join(", ")
        });
      }
    });

    return matches.sort((a, b) => b.score - a.score);
  };

  const handleOpenMatching = (property: RealEstateProperty) => {
    const list = runMatchingAlgorithm(property);
    setMatchingProperty(property);
    setMatchList(list);
  };

  const filteredProperties = properties.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
      (p.location && p.location.toLowerCase().includes(search.toLowerCase()));
    
    const matchesRegion = filterRegion === "all" || 
      (filterRegion === "KKTC" && p.country === "KKTC") ||
      (filterRegion === "TR" && p.country === "TR") ||
      (p.kktc_region === filterRegion);

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;

    return matchesSearch && matchesRegion && matchesStatus;
  });

  // Safe checks for user role representation
  const userRole = user?.role || 'admin';
  const isOfficeManager = ["superadmin", "admin", "manager", "owner"].includes(userRole.toLowerCase());

  return (
    <div className="p-6 space-y-6">
      
      {/* KKTC & Türkiye Pilot Başlığı */}
      <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe className="h-60 w-60 text-white" />
        </div>
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="bg-indigo-600 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
            Pilot Operasyon Geliştirme Platformu
          </span>
          <h2 className="text-3xl font-black tracking-tight leading-none">Türkiye & KKTC Emlak CRM</h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            Kuzey Kıbrıs Türk Cumhuriyeti satış ağına özel sterilize edilmiş gayrimenkul veri alanları, Matterport 3D sanal gezinti tetikleyicileri, uluslararası yatırımcı (UK) eşleştirme motoru ve güvenli tapu/DASK evrak saklama modülü aktif.
          </p>
          <div className="flex gap-4 pt-1 text-xs font-bold text-slate-200">
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/10">
              🇨🇾 KKTC Portföy Odaklı
            </span>
            <span className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/10">
              🇬🇧 İngiltere Yatırımcı Teşviki Desteği
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Emlak Listesi</h3>
          <p className="text-xs text-slate-500">Mevcut şubeniz ve tüm pilot bölgelerdeki ilanlar</p>
        </div>
        <button
          onClick={() => {
            setSelectedProperty(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all font-black text-xs uppercase shadow-md hover:shadow-indigo-600/10 active:scale-95 self-start md:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Yeni İlan Ekle
        </button>
      </div>

      {/* Filters and Search Grid */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Başlık, bölge veya açıklama ara..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-0 rounded-xl text-xs font-bold focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all text-slate-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full p-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-1 focus:ring-indigo-500"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <option value="all">Tüm Pilot Bölgeler</option>
            <option value="KKTC">Kuzey Kıbrıs (KKTC) Tamamı</option>
            <option value="Girne">Girne / Kyrenia Bölgesi</option>
            <option value="Lefkoşa">Lefkoşa / Nicosia Bölgesi</option>
            <option value="İskele">İskele / Trikomo Bölgesi</option>
            <option value="Gazimağusa">Gazimağusa Bölgesi</option>
            <option value="TR">Türkiye (TR) Tamamı</option>
          </select>
        </div>
        <div>
          <select
            className="w-full p-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-600 focus:bg-white focus:ring-1 focus:ring-indigo-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tüm Satış Durumları</option>
            <option value="active">Satılık (For Sale)</option>
            <option value="rented">Kiralık (For Rent)</option>
            <option value="optioned">Opsiyonlu (Kapora Alındı)</option>
            <option value="sold">Satıldı (Sold)</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="text-xs text-slate-500 font-bold">Portföy Yükleniyor...</span>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-sm">Aradığınız kriterlere uygun gayrimenkul bulunamadı.</p>
          <p className="text-xs text-slate-400 mt-1">Yeni ilan girerek portföy oluşturabilir ve pilot satışlara devam edebilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(property => {
            const matchesCount = runMatchingAlgorithm(property).length;
            
            return (
              <div 
                key={property.id} 
                className="bg-white rounded-3xl shadow-sm border border-slate-150 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group flex flex-col h-full relative"
              >
                {/* Image Banner */}
                <div className="w-full h-44 bg-slate-100 relative overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                      <Home className="w-12 h-12 stroke-[1.25]" />
                      <span className="text-[10px] uppercase font-black tracking-widest mt-1">Görsel Yok</span>
                    </div>
                  )}

                  {/* Flag Accent */}
                  <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase text-white rounded-lg shadow-sm backdrop-blur-md ${property.country === 'KKTC' ? 'bg-indigo-600/90' : 'bg-red-600/90'}`}>
                      {property.country === 'KKTC' ? '🇨🇾 Kıbrıs (KKTC)' : '🇹🇷 Türkiye'}
                    </span>
                    {property.country === 'KKTC' && (
                      <span className="px-2 py-1 bg-amber-500/90 text-white font-black text-[9px] rounded-lg shadow-sm">
                        🇬🇧 UK Target
                      </span>
                    )}
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase rounded-lg shadow-sm ${
                      property.status === 'active' ? 'bg-emerald-500 text-white' :
                      property.status === 'rented' ? 'bg-blue-500 text-white' :
                      property.status === 'optioned' ? 'bg-amber-500 text-white' :
                      'bg-slate-700 text-white'
                    }`}>
                      {property.status === 'active' ? 'SATILIK' :
                       property.status === 'rented' ? 'KİRALIK' :
                       property.status === 'optioned' ? 'OPSİYONLU (Kapora alındı)' :
                       'SATILDI'}
                    </span>
                  </div>

                  {/* matterport tour is highlighted */}
                  {property.virtual_tour_url && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 text-indigo-700 rounded-lg text-[10px] font-black shadow-lg shadow-indigo-600/20 border border-indigo-100 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
                        3D GEZİNTİ
                      </span>
                    </div>
                  )}
                </div>

                {/* Content body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {property.title}
                      </h4>
                      <p className="text-slate-400 text-[10px] font-bold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 w-3 inline text-slate-400" />
                        {property.location} {property.kktc_region ? `• Bölge: ${property.kktc_region}` : ""}
                      </p>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {property.description || "Açıklama girilmemiş..."}
                    </p>

                    {/* Regional Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {property.kktc_title_type && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-extrabold border border-indigo-100">
                          📜 {property.kktc_title_type}
                        </span>
                      )}
                      {property.block_plot && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-extrabold border border-slate-250">
                          📍 Ada/Parsel {property.block_plot}
                        </span>
                      )}
                      {property.room_count && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                          🚪 Oda: {property.room_count}
                        </span>
                      )}
                      {property.square_meters && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                          📐 {property.square_meters}m² Net {property.sqm_gross ? `/ ${property.sqm_gross}m² Brüt` : ''}
                        </span>
                      )}
                      {property.in_gated_community && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-100">
                          🏡 Site İçi {property.dues ? `• ${property.dues} ${property.dues_currency || 'GBP'} Aidat` : ''}
                        </span>
                      )}
                      {property.facade && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                          🧭 {property.facade} Cephe
                        </span>
                      )}
                    </div>

                    {/* Safe Document Icon indicators for managers only */}
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <FolderLock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Resmî Evraklar:</span>
                      {property.documents && property.documents.length > 0 ? (
                        <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                          ✔ Yüklü ({property.documents.length} adet)
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">Yüklenmemiş</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col space-y-3">
                    
                    {/* Alıcı Portföy & Müşteri Eşleştirme Motoru */}
                    <div 
                      onClick={() => handleOpenMatching(property)}
                      className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 p-2.5 rounded-xl flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                          <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <div className="text-left">
                          <span className="block text-[10px] font-black text-indigo-950 uppercase tracking-wide">Yatırımcı Bulucu Motoru</span>
                          <span className="block text-[9px] text-indigo-600">
                            {matchesCount > 0 ? `🔥 ${matchesCount} Eşleşen Alıcı Bulundu!` : 'Kriterlere uygun alıcı bulunamadı'}
                          </span>
                        </div>
                      </div>
                      {matchesCount > 0 && (
                        <span className="inline-flex items-center gap-1 bg-indigo-600 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                          Eşleştir
                          <Sparkles className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Price and Standard Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="text-slate-900">
                        <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">İLAN BEDELİ</span>
                        <span className="text-base font-black text-indigo-600">
                          {property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺'}{property.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => { setSelectedProperty(property); setIsModalOpen(true); }}
                          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-100"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Bu gayrimenkulü silmek istediğinize emin misiniz?')) {
                              if (onDelete) onDelete(property.id);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MATCHING ALGORITHM OVERLAY MODAL */}
      {matchingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMatchingProperty(null)} />
          <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-xl relative z-10 flex flex-col max-h-[85vh] shadow-2xl transition-all">
            <div className="flex justify-between items-start mb-6 pb-2 border-b">
              <div>
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">AKILLI EŞLEŞTİRME ALGORİTMASI</span>
                <h4 className="text-xl font-bold text-slate-900 leading-tight">Yatırımcı Portföy Uyumu</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-md">Gayrimenkul: {matchingProperty.title}</p>
              </div>
              <button 
                onClick={() => setMatchingProperty(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1 hide-scrollbar">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-1">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wide">Gayrimenkul Kriterleri</span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-bold">
                  <div>• Lokasyon: <span className="text-indigo-600">{matchingProperty.location} ({matchingProperty.kktc_region || 'TR'})</span></div>
                  <div>• Net Alan: <span className="text-indigo-600">{matchingProperty.square_meters || 0} m²</span></div>
                  <div>• Fiyatı: <span className="text-indigo-600">{matchingProperty.currency} {matchingProperty.price.toLocaleString()}</span></div>
                  <div>• Koçan Tipi: <span className="text-indigo-600">{matchingProperty.kktc_title_type || 'Belirtilmedi'}</span></div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="block text-xs font-black text-slate-800">Eşleşen Yatırımcılar ({matchList.length})</span>
                {matchList.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400 bg-slate-50 rounded-xl">
                    Bu gayrimenkule uyan aktif bir alıcı talebi bulunmuyor.
                  </div>
                ) : (
                  matchList.map(({ buyer, score, reason }) => (
                    <div key={buyer.id} className="p-4 bg-slate-50/60 border hover:border-indigo-200 rounded-2xl space-y-3 transition-colors relative">
                      
                      {/* Percent Badge */}
                      <span className="absolute top-4 right-4 bg-indigo-600 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                        %{score} Match
                      </span>

                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${buyer.nationality === 'UK' ? 'bg-blue-600' : 'bg-red-500'}`}>
                            {buyer.nationality === 'UK' ? '🇬🇧 UK' : '🇹🇷 TR'}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900">{buyer.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-none">
                          Tercihler: {buyer.preferredRegions.join(", ")} • Min: {buyer.minSqm}m² • Max Bütçe: {buyer.currency === 'GBP' ? '£' : '₺'}{buyer.maxBudget.toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[10px] font-medium text-slate-600 leading-relaxed">
                        {reason}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => window.open(`mailto:${buyer.email}?subject=LookPrice%20Yat%C4%B1r%C4%B1m%20F%C4%B1rsat%C4%B1&body=Merhaba%20${buyer.name},%20Kriterlerinize%20uygun%20sanal%20gezintisi%20haz%C4%B1r%20olay%20portf%C3%B6y%C3%BC%20inceleyebilirsiniz:%20${matchingProperty.virtual_tour_url || ''}`, '_blank')}
                          className="bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                        >
                          Yatırım PDF Gönder
                        </button>
                        <button
                          onClick={() => window.open(`https://wa.me/${buyer.phone.replace(/\s+/g, '')}?text=Merhaba%20${buyer.name},%20Kriterlerinize%20uygun%20yeni%20KKTC%20portf%C3%B6y%C3%BCm%C3%BCz%20yay%C4%B1mland%C4%B1!%20Sanal%20Tur:%20${matchingProperty.virtual_tour_url || ''}`, '_blank')}
                          className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow"
                        >
                          WhatsApp’tan Paylaş
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t mt-4">
              <button 
                onClick={() => setMatchingProperty(null)}
                className="w-full py-3 bg-slate-900 text-white font-bold text-xs uppercase rounded-xl"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Real Estate Modal component */}
      <RealEstateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        property={selectedProperty}
        userRole={userRole}
        onSave={async (p) => {
          try {
            if (onSave) {
              await onSave(p);
              setIsModalOpen(false);
            }
          } catch (err: any) {
            alert("İlan kaydedilirken bir hata oluştu: " + (err.message || err));
          }
        }}
      />

    </div>
  );
};

export default RealEstateTab;
