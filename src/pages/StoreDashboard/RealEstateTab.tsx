import React, { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "@/translations";
import {
  Globe,
  Building2,
  Share2,
  Lock,
  Plus,
  Search,
  List,
  LayoutGrid,
  SlidersHorizontal,
  Home,
  MapPin,
  FolderLock,
  Users,
  Sparkles,
  FileSignature,
  Printer,
  Calendar,
  Edit2,
  Trash2,
  AlertTriangle,
  Shield,
  Megaphone,
  Send,
  Check,
  RefreshCw,
  Award,
  X,
  MessageSquare,
  Scale,
  FileCheck,
  FileText,
  Cloud
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { ConsultingInsights } from "../../components/ConsultingInsights";
import { RealEstateModal } from "../../components/RealEstateModal";
import { LegalContractModal } from "../../components/LegalContractModal";
import { ArrangeTourModal } from "../../components/ArrangeTourModal";
import { SocialMediaShareModal } from "../../components/SocialMediaShareModal";
interface RealEstateTabProps {
  properties: any[];
  loading: boolean;
  onSave: (p: any) => void;
  onDelete: (id: any) => void;
  user: any;
  branding: any;
  initialStatusFilter: string;
  onResetStatusFilter: () => void;
  storeId?: number;
}

const formatNumberVal = (val: any) => {
  if (val === undefined || val === null || val === '') return '0';
  const cleanVal = val.toString().replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleanVal);
  if (isNaN(parsed)) return val;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(parsed));
};

const RealEstateTab = ({ properties, loading, onSave, onDelete, user, branding, initialStatusFilter, onResetStatusFilter, storeId }: RealEstateTabProps) => {
  const safeProperties = Array.isArray(properties) ? properties : [];

  const handleOpenMatching = (property: any) => {
    setMatchingProperty(property);
  };

  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [driveConnected, setDriveConnected] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  useEffect(() => {
    api.getGoogleDriveSettings().then(res => {
      setDriveConnected(!!res?.connected);
    }).catch(err => console.error("Error fetching drive connected status in RealEstateTab", err));
  }, []);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [filterBranch, setFilterBranch] = useState("all");
  const [branches, setBranches] = useState<any[]>([]);
  const [filterScope, setFilterScope] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractProperty, setContractProperty] = useState<any>(null);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [activeTourProperty, setActiveTourProperty] = useState<any>(null);
  const [matchingProperty, setMatchingProperty] = useState<any>(null);
  const [isSocialShareModalOpen, setIsSocialShareModalOpen] = useState(false);
  const [socialShareProperty, setSocialShareProperty] = useState<any>(null);

  // Missing States for CRM Overlay & Hub tabs
  const [activeHubTab, setActiveHubTab] = useState<string>('matches');
  const [aiAdPlatform, setAiAdPlatform] = useState<string>('portal');
  const [buyerOfferAmount, setBuyerOfferAmount] = useState<number | "">("");
  const [negotiationNotes, setNegotiationNotes] = useState<string>("");
  const [newFeedbackReview, setNewFeedbackReview] = useState<string>("");
  const [newFeedbackRating, setNewFeedbackRating] = useState<number>(5);
  const [selectedSplitBranch, setSelectedSplitBranch] = useState<any>(null);
  const [splitNegotiatedAgent, setSplitNegotiatedAgent] = useState<string>("");
  const [escrowTimeline, setEscrowTimeline] = useState<any[]>([
    { id: "e1", label: "Kaparo Depozito Yatırımı", completed: true, date: "2026-06-02" },
    { id: "e2", label: "Koçan / Hukuki İnceleme", completed: true, date: "2026-06-03" },
    { id: "e3", label: "Yabancı Satın Alım İznine Başvuru", completed: false, date: "Bekliyor" },
    { id: "e4", label: "Devlet Harç ve Damga Pulu Ödemesi", completed: false, date: "Bekliyor" },
    { id: "e5", label: "Tapu Sicil Devir Mukavelesi İmza", completed: false, date: "Bekliyor" }
  ]);
  const cmaElasticityPrice = matchingProperty ? Math.round((matchingProperty.price || 0) * 0.95) : 0;

  const [complianceChecked, setComplianceChecked] = useState<Record<string, boolean>>({});
  const [splitCommissionPercentage, setSplitCommissionPercentage] = useState(3);
  const [splitRatio, setSplitRatio] = useState(50);
  
  const [showingFeedbacks, setShowingFeedbacks] = useState<any[]>([
    {
      id: "demo-f-1",
      agent: "Emrah Ceyhan",
      status: "Sıcak Takip",
      date: "2026-06-01",
      rating: 4,
      review: "Mülk çok iyi konumda, ancak fiyat pazar ortalamasının biraz üzerinde. Alıcı düşünmek için süre istedi."
    },
    {
      id: "demo-f-2",
      agent: "Canan Yılmaz",
      status: "Fiyat Revizesi İstiyor",
      date: "2026-05-30",
      rating: 3,
      review: "Alıcı lokasyonu çok beğendi ama fiyatı yüksek buldu. Eğer biraz esneklik gösterilirse teklif vermeye hazır."
    }
  ]);
  const [showingBufferTime, setShowingBufferTime] = useState<number>(15);
  const [showingWaitlist, setShowingWaitlist] = useState<any[]>([
    {
      id: "wl-1",
      clientName: "Ahmet Yılmaz",
      phone: "+90 533 800 00 00",
      notes: "Kıbrıs satılık arsa / sanayi imarlı arıyor"
    }
  ]);
  const [showingPrep, setShowingPrep] = useState<any>({
    alarmArmed: false,
    lightsOn: true,
    blindsOpen: true,
    acAdjusted: true,
    scentRefreshed: true,
    flyersPresent: true
  });
  const [matchList, setMatchList] = useState<any[]>([]);
  const [activeDripTemplate, setActiveDripTemplate] = useState<any>(null);
  
  const [newFeedbackAgent, setNewFeedbackAgent] = useState("");
  const [newFeedbackStatus, setNewFeedbackStatus] = useState("pending");
  const [statusTabFilter, setStatusTabFilter] = useState<'all' | 'sale' | 'rent' | 'optioned' | 'sold'>('all');

  const uniqueRegions = Array.from(new Set(safeProperties.map(p => p.kktc_region).filter(Boolean))) as string[];

  const filteredProperties = safeProperties.filter(p => {
      const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()) || p.reference_no?.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = filterBranch === 'all' || p.branch_name === filterBranch;
      
      let matchesScope = true;
      if (filterScope === 'shared_pool') matchesScope = p.sharing_scope === 'shared_pool' || !p.sharing_scope;
      else if (filterScope === 'branch_private') matchesScope = p.sharing_scope === 'branch_private';
      else if (filterScope === 'private') matchesScope = p.sharing_scope === 'private';
      else if (filterScope === 'locked') matchesScope = !!p.reserved_by_branch;

      const matchesRegion = filterRegion === 'all' || p.kktc_region === filterRegion;

      return matchesSearch && matchesBranch && matchesScope && matchesRegion;
  });

  const displayedProperties = filteredProperties.filter(p => {
    if (statusTabFilter === 'all') return true;
    if (statusTabFilter === 'sale') return p.listing_intent === 'sale' || !p.listing_intent;
    if (statusTabFilter === 'rent') return p.listing_intent === 'rent';
    if (statusTabFilter === 'optioned') return p.status === 'optioned';
    if (statusTabFilter === 'sold') return p.status === 'sold';
    return true;
  });

  const totalCount = filteredProperties.length;
  const saleCount = filteredProperties.filter(p => p.listing_intent === 'sale' || !p.listing_intent).length;
  const rentCount = filteredProperties.filter(p => p.listing_intent === 'rent').length;
  const optionedCount = filteredProperties.filter(p => p.status === 'optioned').length;
  const soldCount = filteredProperties.filter(p => p.status === 'sold').length;

  const unescapeEntities = (str: string) => {
    if (!str) return '';
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ');
  };

  const unescapeHtmlManual = (html: string) => {
    if (!html) return '';
    // This is for list view - strip all tags
    return unescapeEntities(html).replace(/<[^>]*>?/gm, '');
  };

  const runMatchingAlgorithm = (property: any) => {
    // Placeholder matching logic
    return [];
  };

  // Safe checks for user role representation
  const userRole = (user?.role || 'admin').toString();
  const isOfficeManager = ["superadmin", "admin", "storeadmin", "manager", "owner", "portfolio_manager", "portföy yöneticisi", "consultant", "danışman", "danisman", "editor"].includes((userRole || "admin").toLowerCase());

  const [propertyToPrint, setPropertyToPrint] = useState<any>(null);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPropertyToPrint(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrintProperty = (property: any) => {
    setPropertyToPrint(property);
    setTimeout(() => {
      window.print();
      // Backwards fallback timeout if afterprint listener doesn't trigger
      setTimeout(() => {
        setPropertyToPrint(null);
      }, 3000);
    }, 800);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* ENRAKİPSİZ ÇOK ŞUBELİ CRM STATS BENTO PANEL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Building2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ağ Portföyü</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {formatNumberVal(safeProperties.length)} <span className="text-[10px] text-slate-500 font-bold">Mülk</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Share2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ortak Havuz</span>
            <span className="text-xl font-black text-emerald-600 mt-1 block">
              {formatNumberVal(safeProperties.filter(p => (p.sharing_scope || 'shared_pool') === 'shared_pool').length)} <span className="text-[10px] text-emerald-500 font-bold">Açık</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Lock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Rezervasyon Kilidi</span>
            <span className="text-xl font-black text-rose-600 mt-1 block">
              {formatNumberVal(safeProperties.filter(p => !!p.reserved_by_branch).length)} <span className="text-[10px] text-rose-500 font-bold">Kilitli</span>
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[1.8rem] border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
            <Globe className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Kıbrıs (KKTC)</span>
            <span className="text-xl font-black text-slate-900 mt-1 block">
              {formatNumberVal(safeProperties.filter(p => p.country === 'KKTC').length)} <span className="text-[10px] text-slate-500 font-bold">İlan</span>
            </span>
          </div>
        </div>
      </div>

      {/* ŞUBELER ARASI ENRAKİPSİZ FİLTRE KAPLÜLLERİ */}
      <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-200/40 space-y-3">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Şubeler Arası Portföy Süzgeci</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterBranch("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterBranch === "all" 
                  ? "bg-slate-900 text-white shadow-sm scale-102"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              Tüm Şubeler
            </button>
            {branches.map(b => (
              <button
                key={b.id}
                onClick={() => setFilterBranch(b.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filterBranch === b.name 
                    ? "bg-slate-900 text-white shadow-sm scale-102"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Portföy Listesi</h3>
          <p className="text-xs text-slate-500">Mevcut şubeniz ve tüm pilot bölgelerdeki portföy</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          {driveConnected && (
            <button
              onClick={async () => {
                setIsBackupLoading(true);
                const promise = api.exportToGoogleDrive({ targetType: 'real_estate', format: 'xls' });
                toast.promise(promise, {
                  loading: 'Portföy şeması Google Drive\'a yedekleniyor...',
                  success: 'Emlak Portföy şeması Excel formatında Google Drive\'a başarıyla kaydoldu!',
                  error: 'Google Drive yedeklemesi başarısız oldu.'
                });
                try {
                  await promise;
                } catch (e) {
                  console.error(e);
                } finally {
                  setIsBackupLoading(false);
                }
              }}
              disabled={isBackupLoading}
              className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-300 px-4 py-3 rounded-xl transition-all font-black text-xs uppercase shadow-sm shadow-emerald-50 active:scale-95"
              title="Google Drive'a Doğrudan Excel Yedekle"
            >
              <Cloud className="h-4 w-4 text-emerald-600 animate-pulse font-bold" />
              Drive'a Yedekle
            </button>
          )}
          <button
            onClick={() => {
              setSelectedProperty(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all font-black text-xs uppercase shadow-md hover:shadow-indigo-600/10 active:scale-95 self-start md:self-auto"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Yeni Portföy Ekle
          </button>
        </div>
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
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        <div>
           <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200/50 transition-all text-center"
           >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
              {viewMode === 'grid' ? "Liste Görünümü" : "Izgara Görünümü"}
           </button>
        </div>
      </div>

      {/* Portföy Durum Sekmeleri (Satılık / Kiralık Ayrımı) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-1.5 bg-slate-100/60 border border-slate-200/50 rounded-2xl">
        <div className="flex flex-wrap gap-1 md:gap-1.5">
          <button
            onClick={() => setStatusTabFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              statusTabFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            TÜMÜ ({totalCount})
          </button>
          <button
            onClick={() => setStatusTabFilter('sale')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'sale'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            🏠 SATILIK ({saleCount})
          </button>
          <button
            onClick={() => setStatusTabFilter('rent')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'rent'
                ? 'bg-sky-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            🔑 KİRALIK ({rentCount})
          </button>
          <button
            onClick={() => setStatusTabFilter('optioned')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'optioned'
                ? 'bg-amber-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            ✍ OPSİYONLU ({optionedCount})
          </button>
          <button
            onClick={() => setStatusTabFilter('sold')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'sold'
                ? 'bg-rose-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            ✅ SATILDI ({soldCount})
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
          <span className="text-xs text-slate-500 font-bold">Portföy Yükleniyor...</span>
        </div>
      ) : displayedProperties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Home className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold text-sm">Aradığınız kriterlere uygun gayrimenkul bulunamadı.</p>
          <p className="text-xs text-slate-400 mt-1">Yeni ilan girerek portföy oluşturabilir ve pilot satışlara devam edebilirsiniz.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {displayedProperties.map(property => {
            const matchesCount = runMatchingAlgorithm(property).length;
            
            return (
              <div 
                key={property.id} 
                className={`bg-white rounded-3xl shadow-sm border border-slate-150 overflow-hidden hover:shadow-xl hover:border-slate-300 transition-all group relative ${viewMode === 'grid' ? 'flex flex-col h-full' : 'flex flex-col sm:flex-row'}`}
              >
                {/* Image Banner */}
                <div className={`${viewMode === 'grid' ? 'w-full h-48' : 'w-full sm:w-64 h-64 shrink-0'} bg-slate-100 relative overflow-hidden`}>
                  {property.images && property.images.length > 0 ? (
                    <img 
                      src={property.images[0]} 
                      alt={property.title} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Home className="w-12 h-12 stroke-[1.25]" />
                    </div>
                  )}

                  {/* Minimalistic Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-lg tracking-wide ${
                      property.status === 'optioned' ? 'bg-amber-600 text-white' :
                      property.status === 'sold' ? 'bg-rose-600 text-white' :
                      property.listing_intent === 'rent' ? 'bg-sky-600 text-white' :
                      'bg-emerald-600 text-white'
                    }`}>
                      {property.status === 'optioned' ? '✍ OPSİYONLU' :
                       property.status === 'sold' ? '✅ SATILDI' :
                       property.listing_intent === 'rent' ? '🔑 KİRALIK' : '🏠 SATILIK'}
                    </span>
                  </div>
                </div>


                {/* Content body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Şube ve Paylaşım Bilgisi */}
                    <div className="flex items-center justify-between gap-2 text-[10px] font-black border-b border-dashed border-slate-100 pb-2 mb-1">
                      <span className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                        🏢 {property.branch_name || 'Merkez Ofis'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                        property.sharing_scope === 'private' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        property.sharing_scope === 'branch_private' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                        'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {property.sharing_scope === 'private' ? '🔑 Kişisel' :
                         property.sharing_scope === 'branch_private' ? '🔒 Ofise Özel' :
                         '🌐 Ortak Havuz'}
                      </span>
                    </div>

                    <div>
                      {property.reference_no && (
                        <div className="text-[9.5px] font-black tracking-widest text-slate-500 mb-1 font-mono uppercase bg-slate-100 inline-block px-1.5 py-0.5 rounded-full border border-slate-200 shadow-sm leading-none">
                          REF: {property.reference_no}
                        </div>
                      )}
                      <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {property.title}
                      </h4>
                      <p className="text-slate-400 text-[10px] font-bold flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 inline text-slate-400" />
                          {property.location} {property.kktc_region ? `• Bölge: ${property.kktc_region}` : ""}
                        </span>
                        {property.responsible_agent && (
                          <span className="text-indigo-600 font-extrabold text-[9px] uppercase">
                            👤 Danışman: {property.responsible_agent}
                          </span>
                        )}
                      </p>
                    </div>

                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {property.description ? 
                        unescapeHtmlManual(property.description)
                        : "Açıklama girilmemiş..."
                      }
                    </p>

                    {/* Regional Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {property.listing_intent !== 'rent' && property.kktc_title_type && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-extrabold border border-indigo-100">
                          📜 {property.kktc_title_type}
                        </span>
                      )}
                      {property.listing_intent === 'rent' && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-extrabold border border-amber-100">
                          🛋️ {property.furnished ? 'Tam Eşyalı' : 'Eşyasız'}
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
                          📐 {formatNumberVal(property.square_meters)} m² Net {property.sqm_gross ? `/ ${formatNumberVal(property.sqm_gross)} m² Brüt` : ''}
                        </span>
                      )}
                      {property.in_gated_community && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-bold border border-emerald-100">
                          🏡 Site İçi {property.dues ? `• ${formatNumberVal(property.dues)} ${property.dues_currency || 'GBP'} Aidat` : ''}
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-slate-900">
                        <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">İLAN BEDELİ</span>
                        <span className="text-base font-black text-indigo-600">
                          {property.currency === 'GBP' ? '£' : property.currency === 'USD' ? '$' : property.currency === 'EUR' ? '€' : '₺'}{formatNumberVal(property.price)}
                        </span>
                      </div>

                      <div className="flex gap-1.5 items-center flex-wrap shrink-0 sm:justify-end">
                        <button
                          onClick={() => { setContractProperty(property); setIsContractModalOpen(true); }}
                          className="flex items-center justify-center p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow active:scale-95 border border-slate-950 shrink-0"
                          title="Sözleşme / Resmi Hizmet Oluştur"
                        >
                          <FileSignature className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSocialShareProperty(property); setIsSocialShareModalOpen(true); }}
                          className="flex items-center justify-center p-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all shadow active:scale-95 border border-indigo-100 shrink-0"
                          title="Sosyal Medya Afiş & Paylaşım Sihirbazı"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handlePrintProperty(property)}
                          className="flex items-center justify-center p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all shadow active:scale-95 border border-slate-200 shrink-0"
                          title="Poster Yazdır"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedProperty(property); setIsModalOpen(true); }}
                          className="flex items-center justify-center p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-100 shrink-0"
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
                          className="flex items-center justify-center p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent shrink-0"
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

      {/* MATCHING ALGORITHM OVERLAY MODAL / ENRAKİPSİZ ELİTE CRM HUB */}
      {matchingProperty && (() => {
        const propSqmPrice = matchingProperty.square_meters ? Math.round(matchingProperty.price / matchingProperty.square_meters) : 0;
        
        // Estimatat regional average in KKTC/TR
        let regionalAverage = 1300;
        const loc = (matchingProperty.location || "").toLowerCase();
        const reg = (matchingProperty.kktc_region || "").toLowerCase();
        if (loc.includes("girne") || reg.includes("girne")) regionalAverage = 1750;
        else if (loc.includes("iskele") || reg.includes("iskele")) regionalAverage = 1500;
        else if (loc.includes("lefkoşa") || reg.includes("lefkoşa")) regionalAverage = 950;
        else if (loc.includes("mağusa") || reg.includes("mağusa") || loc.includes("magosa")) regionalAverage = 1100;

        const isUnderpriced = propSqmPrice <= regionalAverage;
        const diffPercent = Math.round(Math.abs((propSqmPrice - regionalAverage) / regionalAverage) * 100);

        // Compliance score calculated
        const checkedCount = Object.values(complianceChecked).filter(Boolean).length;
        const totalCount = Object.keys(complianceChecked).length;
        const complianceScore = Math.round((checkedCount / totalCount) * 100);

        // Commission Split calculations
        const estTotalCommission = Math.round((matchingProperty.price || 0) * (splitCommissionPercentage / 100));
        const firstBranchCommission = Math.round(estTotalCommission * (splitRatio / 100));
        const secondBranchCommission = estTotalCommission - firstBranchCommission;

        // Dynamic Copywriting generator
        const getAICopyText = () => {
          const isRentMatch = matchingProperty.listing_intent === 'rent';
          const priceLabelMatch = isRentMatch ? "Aylık Kira Bedeli" : "Fiyatı";
          const intentWordMatch = isRentMatch ? "kiralık" : "satılık";
          const intentActionMatch = isRentMatch ? "kiracısını bekliyor" : "yeni sahibini arıyor";

          if (aiAdPlatform === 'portal') {
            return `🌟 KAÇIRILMAYACAK FIRSAT! ${matchingProperty.location} bölgesinde ${intentWordMatch} harika ${matchingProperty.type}! 🌟\n\n` +
                   `Özellikler:\n` +
                   `• ${formatNumberVal(matchingProperty.square_meters)} m² Net Yaşam Alanı\n` +
                   `• ${matchingProperty.room_count} Lüks Tasarımlı Oda Sayısı\n` +
                   (isRentMatch 
                     ? `• Eşya Durumu: ${matchingProperty.furnished ? 'Tam Eşyalı & Taşınmaya Hazır' : 'Eşyasız (Zevkinize Göre Tasarım)'}\n`
                     : `• Tapu Statüsü: ${matchingProperty.kktc_title_type || "Eşdeğer Koçan"}\n`) +
                   `• Isınma ve Donanım: Lüks iklimlendirme sistemleri hazır\n\n` +
                   `📍 Konum: Mağaza, deniz hattı ve sosyal yaşam mekanlarına yürüme mesafesinde.\n\n` +
                   `📞 LookPrice çok şubeli ağ güvencesiyle detaylı sunum, dosya inceleme ve mülk yerinde sunumu için hemen iletişime geçin.`;
          } else if (aiAdPlatform === 'social') {
            return `🔥 Göz Alıcı Yatırım Lokasyonu: Kuzey Kıbrıs / ${matchingProperty.kktc_region || "Girne"} 🔥\n\n` +
                   `Uluslararası standartlarda yaşam sunan ${matchingProperty.location} bölgesindeki bu muhteşem ${matchingProperty.type} ${intentActionMatch}!\n\n` +
                   `📈 Bölgesel Analiz: £${formatNumberVal(regionalAverage)}/m²\n` +
                   `🎯 Fırsat ${priceLabelMatch}: ${matchingProperty.currency} ${formatNumberVal(matchingProperty.price)}${isRentMatch ? ' / Aylık' : ''} (${formatNumberVal(matchingProperty.square_meters)} m²)\n` +
                   (isRentMatch
                     ? `🔑 Kiralama Koşulu: Minimum 1 Yıl Resmi Sözleşme Güvencesi\n\n`
                     : `📜 Tapu Güvencesi: ${matchingProperty.kktc_title_type || "Eşdeğer Koçan"}\n\n`) +
                   `Detaylı görsel kataloğumuz ve mülk raporuna profilimizden hemen ulaşabilirsiniz.\n\n` +
                   `💡 Daha fazla bilgi için hemen DM veya profil bağlantımızdan bize ulaşın! ${isRentMatch ? '#kktckiralik #kibriskiralik #realestate #lookpricehub' : '#kktcemlak #kibrisyatirim #realestate #lookpricehub'}`;
          } else {
            return `Merhaba Sayın Yatırımcımız,\n\n` +
                   `LookPrice Emlak Ağının çok şubeli veri tabanından kriterlerinize özel eşleşen yeni bir ${intentWordMatch} mülk fırsatı kaydoldu:\n\n` +
                   `📌 Bölge: ${matchingProperty.location} (${matchingProperty.kktc_region || 'KKTC'})\n` +
                   `🏡 Mülk Tipi: ${formatNumberVal(matchingProperty.square_meters)} m² Net - ${matchingProperty.room_count} - ${matchingProperty.type}\n` +
                   `💰 ${priceLabelMatch}: ${matchingProperty.currency} ${formatNumberVal(matchingProperty.price)}\n` +
                   (isRentMatch
                     ? `🛋️ Eşya Durumu: ${matchingProperty.furnished ? 'Tam Teşekküllü Eşyalı' : 'Eşyasız/Sıfır Daire'}\n\n`
                     : `🔑 Koçan: ${matchingProperty.kktc_title_type || "Eşdeğer Koçan"}\n\n`) +
                   `Mülkle ilgili detaylı görseller ve resmî mülk fizibilite raporuna ulaşmak ve incelemek için bizimle dilediğiniz an iletişime geçebilirsiniz.\n\n` +
                   `Portföy sorumlumuz ile öncelikli randevu ayarlamak için bu mesaja dönüş yapabilirsiniz. Saygılarımızla.`;
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setMatchingProperty(null)} />
            
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl relative z-10 flex flex-col max-h-[90vh] shadow-2xl border border-slate-100 overflow-hidden">
              
              {/* BRAND HEADER */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 relative">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                  <Award className="h-32 w-32" />
                </div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="bg-indigo-600/30 text-indigo-300 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                      🏆 ENRAKİPSİZ CRM & PORTFÖY YÖNETİM HUB
                    </span>
                    <h4 className="text-2xl font-black text-white mt-1.5 leading-none">
                      Elite CRM İşlem Konsolu
                    </h4>
                    <p className="text-slate-300 text-xs mt-1.5 font-medium flex items-center gap-2">
                      <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-white">🏡 {matchingProperty.title}</span>
                      <span>• {matchingProperty.location} ({matchingProperty.kktc_region || 'TR'})</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => setMatchingProperty(null)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub status row */}
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/10 text-[10.5px] font-extrabold text-slate-300">
                  <span>🏢 Sorumlu Ofis: <strong className="text-white">{matchingProperty.branch_name || 'Merkez Ofis'}</strong></span>
                  <span>👤 Portföy Sorumlusu: <strong className="text-indigo-200">{matchingProperty.responsible_agent || 'Belirtilmedi'}</strong></span>
                  <span>🔒 Paylaşım Durumu: <strong className="text-teal-300 uppercase">{matchingProperty.sharing_scope === 'private' ? 'Kişisel' : matchingProperty.sharing_scope === 'branch_private' ? 'Şubeye Özel' : 'Ortak Havuz'}</strong></span>
                </div>
              </div>

              {/* TABS SELECTOR */}
              <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-2 flex flex-wrap gap-1.5 justify-center">
                {[
                  { id: 'matches', label: '🤝 Alıcı Eşleme', icon: Users },
                  { id: 'showings', label: '👁️ Sunum Hazırlığı & Yorumlar', icon: MessageSquare },
                  { id: 'negotiate', label: '⚖️ Pazarlık Pazarı', icon: Scale },
                  { id: 'compliance', label: '🛡️ Mevzuat Uyumu', icon: Shield, badge: `${complianceScore}%` },
                  { id: 'splits', label: '🏢 Şube Paylaşımı', icon: Building2 },
                  { id: 'escrow', label: '📑 Tapu & Kapanış', icon: FileCheck },
                ].map((tb) => {
                  const Icon = tb.icon;
                  const isActive = activeHubTab === tb.id;
                  return (
                    <button
                      key={tb.id}
                      onClick={() => setActiveHubTab(tb.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                          : 'text-slate-600 hover:bg-slate-200 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tb.label}
                      {tb.badge && (
                        <span className={`ml-1 text-[8.5px] px-1 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {tb.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* MODAL MAIN CONTENT SCROLLABLE */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 max-h-[50vh] bg-slate-50/20">
                
                {/* TAB 1: MATCHES */}
                {activeHubTab === 'matches' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-extrabold text-sm text-slate-800">Eşleşen Yatırımcı Adayları</h5>
                        <p className="text-[11px] text-slate-400">Yatırımcı bütçesi, metrekare ve Kıbrıs koçan beklentilerine göre anlık uyum testi.</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {matchList.length === 0 ? (
                        <div className="text-center py-12 text-xs font-bold text-slate-400 bg-white border rounded-3xl p-6">
                          <p>Bu gayrimenkule uyan aktif bir alıcı talebi bulunmuyor.</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-normal">Fiyat rasyolarını veya mülk özelliklerini güncelledikten sonra tekrar test edin.</p>
                        </div>
                      ) : (
                        matchList.map(({ buyer, score, reason }) => (
                          <div key={buyer.id} className="p-5 bg-white border hover:border-indigo-200 rounded-[2rem] space-y-4 transition-all shadow-sm relative overflow-hidden group">
                            
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <div className="flex gap-2 items-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase text-white ${buyer.nationality === 'UK' ? 'bg-blue-600' : 'bg-red-500'}`}>
                                    {buyer.nationality === 'UK' ? '🇬🇧 UK' : '🇹🇷 TR'}
                                  </span>
                                  <span className="font-extrabold text-sm text-slate-900">{buyer.name}</span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Tercihler: <strong className="text-slate-700">{buyer.preferredRegions.join(", ")}</strong> • Min: {formatNumberVal(buyer.minSqm)} m² • Max Bütçe: {buyer.currency === 'GBP' ? '£' : '₺'}{formatNumberVal(buyer.maxBudget)}
                                </p>
                              </div>

                              <span className="bg-indigo-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-sm text-center">
                                %{score} Uyum
                              </span>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10.5px] text-slate-600 leading-relaxed font-semibold">
                              🎯 <span className="text-slate-800">Eşleşme Gerekçesi:</span> {reason}
                            </div>

                            <div className="flex gap-2 justify-end pt-2 border-t border-slate-50">
                              <button
                                onClick={() => {
                                  const subject = encodeURIComponent(`LookPrice Yatırım Teklifi - ${matchingProperty.title}`);
                                  const body = encodeURIComponent(`Sayın ${buyer.name},\n\nİstemiş olduğunuz kriterlere uyum sağlayan yeni portföyümüzü incelemenize sunmaktan memnuniyet duyarız:\n\nMülk Başlığı: ${matchingProperty.title}\nKonum: ${matchingProperty.location}\nLüks Detay: ${formatNumberVal(matchingProperty.square_meters)} m² / ${matchingProperty.room_count}\n\nDetaylı bilgi için şubemizle iletişime geçebilirsiniz.`);
                                  window.open(`mailto:${buyer.email}?subject=${subject}&body=${body}`, '_blank');
                                }}
                                className="bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-extrabold text-[10.5px] px-3.5 py-2 rounded-xl border border-indigo-100 transition-all flex items-center gap-1.5"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Teklif PDF E-Posta Gönder
                              </button>
                              <button
                                onClick={() => {
                                  const text = encodeURIComponent(`Merhaba ${buyer.name}, LookPrice Emlak ağından yazdım. Kriterlerinize birebir uyum sağlayan yeni mülkümüzü ilk olarak sizinle paylaşıyorum!\n\n🏡 Mülk: ${matchingProperty.title}\n📍 Bölge: ${matchingProperty.location}\n💰 Fiyat: ${matchingProperty.currency} ${formatNumberVal(matchingProperty.price)}`);
                                  window.open(`https://wa.me/${buyer.phone.replace(/\s+/g, '')}?text=${text}`, '_blank');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white font-extrabold text-[10.5px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                WhatsApp Sunum Yap
                              </button>
                            </div>

                          </div>
                        ))
                      )}
                    </div>

                    {/* CRM LEAD NURTURING & DRIP SEQUENCE PREVIEW */}
                    <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100/80 space-y-4 shadow-sm mt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="block text-[10px] font-black text-indigo-700 uppercase tracking-wider">CRM & DRIP CAMPAIGNS</span>
                          <h6 className="font-extrabold text-sm text-slate-800">Müşteri Segmentasyonu & Damlama Akışları</h6>
                        </div>
                        <span className="text-[9.5px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                          ⚡ Lead Nurturing Etkin
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                        Kriterleriyle eşleşen alıcıları sıcak tutmak amacıyla tasarlanmış, davranışlara duyarlı, kişiselleştirilmiş çok kanallı takip şablonları.
                      </p>

                      {/* Client tags info */}
                      <div className="flex flex-wrap gap-1.5 py-1">
                        <span className="text-[9.5px] bg-rose-50 border border-rose-100 text-rose-700 font-black px-2 py-0.5 rounded-lg">#SıcakTakip (Saha Ziyareti Hazır)</span>
                        <span className="text-[9.5px] bg-teal-50 border border-teal-100 text-teal-700 font-black px-2 py-0.5 rounded-lg">#DövizBütçeli (£ Sterling Nakit)</span>
                        <span className="text-[9.5px] bg-amber-50 border border-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-lg">#VIP_Investor (Kıbrıs Alıcısı)</span>
                        <span className="text-[9.5px] bg-blue-50 border border-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-lg">#HızlıKapanış (Tapu Hazır)</span>
                      </div>

                      {/* Campaign triggers selector */}
                      <div className="grid grid-cols-3 gap-2 py-2">
                        {[
                          { id: 'intro', label: '1️⃣ İlk Tanıtım & 3D Tur', desc: 'Portföy keşif daveti' },
                          { id: 'pricedrop', label: '2️⃣ Fiyat / Kampanya', desc: 'Sınırlı süre fırsatı' },
                          { id: 'scarcity', label: '3️⃣ Son Çağrı & Aciliyet', desc: 'Teklif alma baskısı' }
                        ].map((drip) => {
                          const isSel = activeDripTemplate === drip.id;
                          return (
                            <button
                              key={drip.id}
                              onClick={() => setActiveDripTemplate(drip.id)}
                              className={`p-2.5 text-left rounded-xl transition-all border ${
                                isSel 
                                  ? 'bg-slate-900 border-slate-950 text-white shadow-md' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span className="block font-extrabold text-[10.5px] leading-tight">{drip.label}</span>
                              <span className={`block text-[9.5px] ${isSel ? 'text-slate-300' : 'text-slate-400 font-medium'} mt-0.5`}>
                                {drip.desc}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Drip Content display with Copy function */}
                      {(() => {
                        let dripSubject = "";
                        let dripBody = "";
                        const firstBuyerName = matchList[0]?.buyer.name || "Değerli Yatırımcımız";

                        if (activeDripTemplate === 'intro') {
                          dripSubject = `Özel Keşif Daveti: ${matchingProperty.location} / ${matchingProperty.title}`;
                          dripBody = `Sayın ${firstBuyerName},\n\nLookPrice portföy havuzuna henüz eklenen ve kriterlerinizle %90+ uyum sağlayan yeni bir fırsatımız var: ${matchingProperty.title}.\n\nMülkün fiziksel sunumundan önce hazırladığımız 3D sanal turumuzla mülk içinde dilediğinizce yürüyebilir, mutfak tezgahı ölçülerini bile alabilirsiniz:\n🔗 Sanal Keşif: ${matchingProperty.virtual_tour_url || 'lookprice-3d-explorer'}\n\nBu özel portföyü ne zaman yerinde görmek istersiniz?`;
                        } else if (activeDripTemplate === 'pricedrop') {
                          dripSubject = `Fiyat / Kampanya Güncellemesi - Önemli Fırsat`;
                          dripBody = `Değerli ${firstBuyerName},\n\nTakip listenizde yer alan ${matchingProperty.title} mülkü için satıcı ile yürüttüğümüz özel pazarlık neticesinde kısa bir süreliğine özel bir esneklik sağlandı!\n\nYeni Liste Değeri: ${matchingProperty.currency} ${formatNumberVal(cmaElasticityPrice || matchingProperty.price || 0)}\n\nBölgesel CMA rasyolarına göre bu fiyat emsallerden yaklaşık %15 daha avantajlıdır. Fırsatı kaçırmamak adına hemen bir geri dönüş yapmanızı öneririm.`;
                        } else {
                          dripSubject = `Kapanış Öncesi Son Çağrı: ${matchingProperty.location}`;
                          dripBody = `Sayın ${firstBuyerName},\n\n${matchingProperty.title} mülkü üzerinde şu anda başka bir şubemizin yürüttüğü sıcak bir pazarlık süreci bulunuyor ve tapu devir (escrow) işleminin bu hafta tamamlanması öngörülüyor.\n\nEğer bu mülkle hâlâ ciddi olarak ilgileniyorsanız, satıcıya resmi karşı teklifimizi sunabileceğimiz son güne girmiş bulunuyoruz. Talebiniz olması halinde teklif kütüğümüzü hemen işleme alabilirim.`;
                        }

                        return (
                          <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl relative">
                            <span className="block text-[8.5px] font-black text-indigo-400 uppercase tracking-widest pl-1 mb-1">DAMLAMA PREVIEW (E-POSTA & WHATSAPP)</span>
                            <div className="text-[10.5px] font-semibold border-b border-white/10 pb-1.5 mb-1.5 text-slate-300">
                              📍 Konu: {dripSubject}
                            </div>
                            <p className="text-[10px] whitespace-pre-line text-slate-200 leading-relaxed font-mono">
                              {dripBody}
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`Konu: ${dripSubject}\n\n${dripBody}`);
                                alert("Sıcak takip mesajı kopyalandı! Doğrudan müşteriye gönderebilirsiniz.");
                              }}
                              className="absolute top-3 right-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow"
                            >
                              Kopyala
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                )}

                {/* TAB: SHOWINGS PREPARATION & FEEDBACK */}
                {activeHubTab === 'showings' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* PREPARATION SYSTEM (Alarm & Look & Scent) */}
                      <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="block text-[10px] font-black text-indigo-600 uppercase tracking-wider">SHOWING OPTIMIZATION</span>
                            <h5 className="font-extrabold text-sm text-slate-800">Saha Gösterim Öncesi Hazırlık Center</h5>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase text-white ${
                            showingPrep.alarmArmed ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-600'
                          }`}>
                            {showingPrep.alarmArmed ? '🚨 Alarm Aktif' : '✅ Hazırlık Yapıldı'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Saha danışmanlarının sunumdan 30 dk önce mülke gidip ilk izlenim 'WOW' faktörünü tetiklemesini sağlayan kontrol listesi.
                        </p>

                        <div className="space-y-3 pt-2">
                          {[
                            { id: 'alarmArmed', label: 'Güvenlik Alarmı Devre Dışı', activeDesc: '30 dk ihbar süresi alındı; alarm geçici olarak kapatıldı.', inactiveDesc: 'Alarm devrede (Giriş için izin bekleniyor).' },
                            { id: 'lightsOn', label: 'Dekoratif Aydınlatmaları Aç', activeDesc: 'Tüm lambalar, şerit LED\'ler ve aydınlatmalar açık durumda.', inactiveDesc: 'Lambalar kapalı' },
                            { id: 'blindsOpen', label: 'Panjur ve Perdeleri Aç', activeDesc: 'Panjurlar tamamen açık; gün ışığı içeri alınıyor.', inactiveDesc: 'Perdeler kapalı' },
                            { id: 'acAdjusted', label: 'İklimlendirme Set Düzeyi', activeDesc: 'Klimatizasyon aktif; sakinleştirici 22°C set edildi.', inactiveDesc: 'Kombiler/Klima kapalı' },
                            { id: 'scentRefreshed', label: 'Ortam Parfümü & Koku Tazele', activeDesc: 'Lavanta & okyanus özlü aktif oda kokusu tazeleyici sıkıldı.', inactiveDesc: 'Koku tazeleyici yapılmadı' },
                            { id: 'flyersPresent', label: 'Yazılı El Broşürleri ve Kalemler', activeDesc: 'Basılı broşürler, teknik şartname ve boş mukaveleler tezgahta.', inactiveDesc: 'Broşürler tezgahta yok' },
                          ].map((item) => {
                            const isVal = (showingPrep as any)[item.id];
                            return (
                              <div 
                                key={item.id}
                                onClick={() => setShowingPrep({ ...showingPrep, [item.id]: !isVal })}
                                className="flex items-start gap-2.5 p-2 px-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all cursor-pointer select-none"
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isVal} 
                                  onChange={() => {}}
                                  className="mt-0.5 h-3.5 w-3.5 text-indigo-600 rounded border-gray-300" 
                                />
                                <div className="text-[11px]">
                                  <span className="font-extrabold text-slate-700 block leading-tight">{item.label}</span>
                                  <span className="text-[9.5px] text-slate-400 mt-0.5 block">
                                    {isVal ? item.activeDesc : item.inactiveDesc}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => {
                            setShowingPrep({
                              alarmArmed: false,
                              lightsOn: true,
                              blindsOpen: true,
                              acAdjusted: true,
                              scentRefreshed: true,
                              flyersPresent: true
                            });
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-sm"
                        >
                          ⚡ Profesyonel Sunum Hazırlığını Tamamla (Tümünü Onayla)
                        </button>
                      </div>

                      {/* SOLICITING SHOWING COPIES & FEEDBACK */}
                      <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 space-y-4 shadow-sm">
                        <div>
                          <span className="block text-[10px] font-black text-indigo-600 uppercase tracking-wider">SHOWING FEEDBACK LOOP</span>
                          <h5 className="font-extrabold text-sm text-slate-800">Sunum Sonrası Gerçek Alıcı Yorumları</h5>
                        </div>

                        {/* Interactive Analyzer */}
                        {(() => {
                          const negativePriceCount = showingFeedbacks.filter(f => (f.review || "").toLowerCase().includes("fiyat") || (f.review || "").toLowerCase().includes("pahalı")).length;
                          const avgRating = Math.round(showingFeedbacks.reduce((acc, f) => acc + f.rating, 0) / showingFeedbacks.length * 10) / 10;
                          return (
                            <div className={`p-3 rounded-xl border flex items-start gap-2 text-[10.5px] font-semibold leading-relaxed ${
                              negativePriceCount >= 2 
                                ? 'bg-rose-50 border-rose-100 text-rose-900' 
                                : 'bg-teal-50 border-teal-100 text-teal-900'
                            }`}>
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="block font-black uppercase text-[9px]">Geri Bildirim Anlık Değerlendirmesi</span>
                                {negativePriceCount >= 2 
                                  ? `KRİTİK UYARI: Son gösterimlerde mülkün fiyatının çevre emsallerinden pazar payı olarak yüksek olduğu vurgulanmıştır. Ortalama puan: ${avgRating}/5. Acil bir fiyat esnekliği (CMA) analizi gerekebilir!` 
                                  : `Sıcak pazar ilgisi tespit edildi! Ortalama puan: ${avgRating}/5. Alıcıların ilgisi yüksek, takip mesajları göndermeye devam edin.`
                                }
                              </div>
                            </div>
                          );
                        })()}

                        {/* Logs list */}
                        <div className="space-y-2 h-44 overflow-y-auto pr-1">
                          {showingFeedbacks.map((item) => (
                            <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10.5px] space-y-1 font-sans">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-800 text-[11px]">{item.agent}</span>
                                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[8.5px] font-bold">{item.status}</span>
                              </div>
                              <div className="flex justify-between text-slate-400 text-[9.5px]">
                                <span>Tarih: {item.date}</span>
                                <span className="text-amber-500 font-extrabold">{"★".repeat(item.rating)}</span>
                              </div>
                              <p className="text-slate-600 leading-relaxed italic">"{item.review}"</p>
                            </div>
                          ))}
                        </div>

                        {/* Add simulated feedback */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-2.5">
                          <span className="block text-[10px] font-black text-slate-500 uppercase">Görüşme Sonucu Ekle</span>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="text" 
                              placeholder="Sorumlu Yetkili" 
                              className="p-1 px-2 text-[10px] font-bold border rounded bg-white focus:outline-indigo-600" 
                              value={newFeedbackAgent}
                              onChange={(e) => setNewFeedbackAgent(e.target.value)}
                            />
                            <select 
                              className="p-1 text-[10px] font-bold border rounded bg-white focus:outline-indigo-600 animate-none"
                              value={newFeedbackStatus}
                              onChange={(e) => setNewFeedbackStatus(e.target.value)}
                            >
                              <option value="Sıcak Takip">Sıcak Takip</option>
                              <option value="Fiyat Revizesi İstiyor">Fiyat Revizesi İstiyor</option>
                              <option value="Teklif Bekleniyor">Teklif Bekleniyor</option>
                              <option value="Olumsuz Elendi">Olumsuz Elendi</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2 font-sans">
                            <input 
                              type="text" 
                              placeholder="Filtrelenmemiş Gerçek Görüşme Notları..." 
                              className="p-1 px-2 text-[10px] border rounded bg-white focus:outline-indigo-600"
                              value={newFeedbackReview}
                              onChange={(e) => setNewFeedbackReview(e.target.value)}
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-bold">Puan:</span>
                              {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                  key={star} 
                                  onClick={() => setNewFeedbackRating(star)}
                                  className={`text-xs ${newFeedbackRating >= star ? 'text-amber-500' : 'text-slate-300'}`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (!newFeedbackReview) return alert("Lütfen görüşme notu girin!");
                              const newF = {
                                id: Date.now(),
                                date: "Bugün",
                                agent: newFeedbackAgent,
                                rating: newFeedbackRating,
                                review: newFeedbackReview,
                                status: newFeedbackStatus
                              };
                              setShowingFeedbacks([newF, ...showingFeedbacks]);
                              setNewFeedbackReview("");
                            }}
                            className="w-full py-1 text-[9.5px] font-extrabold bg-slate-900 text-white rounded hover:bg-slate-800 uppercase"
                          >
                            ☎️ Arayıp Geri Bildirim Al & Sisteme İşle
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* INTELLIGENT SCHEDULING & WAITING LISTS CO-ORDINATOR */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200/80 space-y-4 shadow-sm mt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">INTELLIGENT APPOINTMENT & ROUTE MANAGEMENT</span>
                          <h5 className="font-extrabold text-sm text-slate-800 mt-1">Akıllı Randevu, Yol Payı & Hava Durumu Koordinasyonu</h5>
                          <p className="text-[11px] text-slate-400 mt-1 font-sans">Endless aramalara son verin. Çakışmaları sıfırlayan, yol izinlerini ve anlık bölge iklimini hesaba katan saha yönetim motoru.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                        
                        {/* 1. Travel Buffer & Smart Route Planner */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans">🚗 YOL PAYI VE BUFFER SÜRESİ</span>
                          
                          <div className="space-y-1">
                            <label className="text-[10.5px] font-bold text-slate-600">Gösterimler Arası Geçiş Payı (Geçiş Blokajı)</label>
                            <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 mt-1">
                              {[15, 30, 45, 60].map((mins) => (
                                <button
                                  key={mins}
                                  onClick={() => setShowingBufferTime(mins)}
                                  className={`flex-1 text-center py-1.5 rounded-lg text-xs font-black transition-all ${
                                    showingBufferTime === mins 
                                      ? 'bg-indigo-600 text-white shadow-sm' 
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {mins} Dk
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal font-sans">
                            💡 {showingBufferTime} dakika otomatik yol payı, takvimde çakışmaları engellemek adına sonraki randevuya bloke edilmiştir.
                          </p>
                        </div>

                        {/* 2. Microclimate Weather Watch & Showing Tip */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans">☀️ HAFIZALI BÖLGESEL HAVA KOŞULLARI</span>
                          
                          <div className="bg-amber-50/70 text-amber-950 p-3 rounded-xl border border-amber-100 flex items-start gap-2.5">
                            <span className="text-xl leading-none">☀️</span>
                            <div className="text-[10.5px] font-semibold leading-relaxed">
                              <strong>Kıbrıs / {matchingProperty.kktc_region || "Girne"}:</strong> 25°C Açık & Esintili
                              <span className="block text-[9.5px] text-amber-700 font-sans mt-0.5 font-medium leading-normal">
                                Hava açık; teras, havuz başı ve peyzaj sunumlarına mükemmel elverişli. İç mekanda odaları ferah hissettirmek için klimaları 21°C set edin, perdeleri sonuna kadar açın!
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Showing Waitlist priority manager */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
                          <div>
                            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider font-sans">📋 PORTFÖY TALEP SIRASI (WAITLIST)</span>
                            
                            <div className="space-y-1.5 mt-2 overflow-y-auto max-h-24 pr-1">
                              {showingWaitlist.length === 0 ? (
                                <p className="text-[10px] text-slate-400 font-bold italic py-2">Bekleme listesinde alıcı bulunmuyor.</p>
                              ) : (
                                showingWaitlist.map((w) => (
                                  <div key={w.id} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-[10px] font-sans">
                                    <div className="font-semibold text-slate-800">
                                      {w.name}
                                      <span className="block text-[8.5px] text-indigo-600 mt-0.5">Tarih: {w.date}</span>
                                    </div>
                                    <button
                                      key={w.id}
                                      onClick={() => {
                                        setShowingWaitlist(showingWaitlist.filter(item => item.id !== w.id));
                                        alert(`${w.name} için randevu onaylandı! Müşteriye SMS/Email bilgilendirmesi gönderildi.`);
                                      }}
                                      className="bg-indigo-600 hover:bg-slate-900 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded"
                                    >
                                      Onayla
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const name = prompt("Sıraya eklenecek alıcının adı:");
                              if (!name) return;
                              const phone = prompt("Alıcının cep telefonu:");
                              if (!phone) return;
                              setShowingWaitlist([...showingWaitlist, {
                                id: Date.now().toString(),
                                name,
                                phone,
                                date: "Yarın Alıcı Kararı",
                                status: "Onay Bekliyor"
                              }]);
                            }}
                            className="w-full mt-2 text-center py-1 border border-dashed border-indigo-400/60 hover:border-indigo-600 text-[10px] text-indigo-700 font-bold rounded-lg transition-all"
                          >
                            ➕ Bekleme Listesine Alıcı Ekle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: EMOTION-FREE NEGOTIATION ADVISOR */}
                {activeHubTab === 'negotiate' && (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 space-y-4 shadow-sm">
                      <div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-sans">EMOTION-FREE NEGOTIATOR</span>
                        <h5 className="font-extrabold text-sm text-slate-800 mt-0.5">Yatırımcı Teklif ve Karşı-Teklif Satış Asistanı</h5>
                        <p className="text-[11px] text-slate-400">
                          Sıcak pazarlık süreçlerinde duygusal tepkileri (Overvaluing/Undervaluing) önleyen matematiksel pazar simülasyonu.
                        </p>
                      </div>

                      {/* Input Offer form */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Mülk Liste Fiyatı</label>
                          <div className="text-base font-black text-slate-900 bg-white p-2 border rounded-xl shadow-sm">
                            {matchingProperty.currency} {formatNumberVal(matchingProperty.price)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-indigo-600 mb-1">Alıcıdan Sözel/Yazılı Teklif ({matchingProperty.currency})</label>
                          <input 
                            type="number" 
                            className="p-2 w-full font-black text-indigo-700 bg-white border border-indigo-200 rounded-xl focus:outline-indigo-600 shadow-sm"
                            value={buyerOfferAmount || ""}
                            onChange={(e) => setBuyerOfferAmount(Number(e.target.value))}
                          />
                          <p className="text-[9px] text-indigo-600 mt-1">Önerilen varsayılan: Liste fiyatının %90'ı</p>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Alıcı Şart Notları (Örn: Peşinat oranı)</label>
                          <input 
                            type="text" 
                            placeholder="Örn: %50 peşin, %50 teslimde tapu devrinde." 
                            className="p-2 w-full text-xs font-bold bg-white border rounded-xl focus:outline-indigo-600 shadow-sm"
                            value={negotiationNotes}
                            onChange={(e) => setNegotiationNotes(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Calculations Panel */}
                      {(() => {
                        const initialPriceVal = matchingProperty.price || 0;
                        const currentOfferVal = buyerOfferAmount || Math.round(initialPriceVal * 0.9);
                        const discountAmt = initialPriceVal - currentOfferVal;
                        const discountPercent = initialPriceVal > 0 ? Math.round((discountAmt / initialPriceVal) * 100) : 0;
                        const isUnderBudget = discountPercent < 0; // offers higher than list price

                        // Generate warnings
                        let warningTitle = "";
                        let warningDesc = "";
                        let toneStyle = "";

                        if (isUnderBudget) {
                          warningTitle = "🔥 LİSTE FİYATININ ÜSTÜNDE MÜKEMMEL TEKLİF!";
                          warningDesc = "Bu durum agresif bir rekabet (bidding war) döneminde veya lüks yatırım aşamasında görünür. Alıcıyı kaçırmamak için süreyi sınırlayıp teklifi hemen kabul edin!";
                          toneStyle = "bg-emerald-50 border-emerald-500 text-emerald-950";
                        } else if (discountPercent >= 20) {
                          warningTitle = "⚠️ ALARM: AŞIRI İSKONTO (%20+ Pazarlık Payı)";
                          warningDesc = "DİKKAT! Alıcı mülkü öldürmek ya da panik satış rasyolarınızı test etmek istiyor. Satıcının duygulanıp masadan kalkması en büyük risktir! Doğrudan hayır demek yerine, liste fiyatından %5-8 iskonto yapabileceğinizi gösteren bir karşı mukavele yazın. Alıcının esneyip esnemeyeceğini anlarsınız.";
                          toneStyle = "bg-rose-50 border-rose-500 text-rose-950";
                        } else if (discountPercent > 8 && discountPercent < 20) {
                          warningTitle = "⚖️ DENGELİ ALAN: STANDART PAZARLIK (%9 - %19)";
                          warningDesc = "Bu teklif, pazar şartlarında makul bir açılıştır. Alıcı sizin adınıza bir karşı mukavele bekliyor. Mülkü elde tutmanın maliyeti (holding costs) göz önüne alındığında anlaşma karlı tescillenecektir.";
                          toneStyle = "bg-amber-50 border-amber-500 text-amber-950";
                        } else {
                          warningTitle = "💚 MÜKEMMEL ALAN: SATIŞA ÇOK YAKIN (%1 - %8)";
                          warningDesc = "Harika! Teklif liste değerine çok yakın. Kesinlikle alıcıya gurur yapayıp 'liste fiyatından bir kuruş aşağı inmem' demeyin. Alıcıya küçük bir prestij indirimi sunup sözleşmeyi tapuya bağlamak en karlı yatırımcı refleksidir.";
                          toneStyle = "bg-teal-50 border-teal-500 text-teal-900";
                        }

                        return (
                          <div className="space-y-4 pt-2">
                            
                            {/* DECISION ANALYSIS CARD */}
                            <div className={`p-6 rounded-[2rem] border-l-8 ${toneStyle} space-y-4 shadow-sm`}>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-widest block leading-none font-sans">RASYONEL PAZARLIK ÖNGÖRÜSÜ</span>
                                  <h6 className="font-extrabold text-base leading-tight mt-1">{warningTitle}</h6>
                                </div>
                                <div className="text-left sm:text-right text-[10.5px] font-bold">
                                  <span>İskonto Miktarı:</span> <span className="underline block text-base font-black font-mono mt-0.5">{matchingProperty.currency} {formatNumberVal(discountAmt)} ({discountPercent}%)</span>
                                </div>
                              </div>
                              
                              <p className="text-[12px] leading-relaxed font-semibold font-sans opacity-95">
                                {warningDesc}
                              </p>
                              
                              <div className="pt-4 border-t border-dashed border-current/25 flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div className="text-[11px] font-bold opacity-90">
                                  Teklif Edilen Değer: <span className="font-mono font-black text-xs">{matchingProperty.currency} {formatNumberVal(currentOfferVal)}</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setContractProperty({
                                      ...matchingProperty,
                                      title: `[PAZARLIK PROTOKOLÜ] ` + matchingProperty.title,
                                      price: currentOfferVal,
                                      kktc_title_type: `Pazarlıklı Karşı Teklif Ön Anlaşması (Alıcı Teklifi: ${matchingProperty.currency} ${formatNumberVal(currentOfferVal)})`
                                    } as any);
                                    setIsContractModalOpen(true);
                                    setMatchingProperty(null);
                                  }}
                                  className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase rounded-xl transition-all shadow"
                                >
                                  ✍️ Karşı Teklif Mukavelesi Hazırla ve Yazdır
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })()}

                    </div>
                  </div>
                )}

                {/* TAB 2: COMPLIANCE */}
                {activeHubTab === 'compliance' && (
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <h5 className="font-extrabold text-sm text-slate-800">Tapu, Hukuk & Mevzuat Uygunluk Kontrolü</h5>
                        <p className="text-[11px] text-slate-400">Sözleşmeler, koçan temiz raporu ve Kıbrıs/Türkiye tapu daireleri standartlarına uygunluk skoru.</p>
                      </div>

                      <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                        <span className="text-[10px] font-black text-indigo-950 uppercase">Şu Anki Uyum:</span>
                        <span className={`text-xs font-black ${
                          complianceScore >= 80 ? 'text-emerald-600' : 'text-amber-600'
                        }`}>%{complianceScore} Uyumlu</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          complianceScore >= 80 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${complianceScore}%` }}
                      />
                    </div>

                    {/* Checklist Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {[
                        { 
                          id: 'tapu', 
                          title: 'Tapu/Koçan Sicil Kontrolü', 
                          desc: 'İpotek, şerh, haciz ve takyidat kayıtları KKTC/TR tapu kütüğünden teyit edilmiştir, devire temizdir.' 
                        },
                        { 
                          id: 'dask', 
                          title: 'Zorunlu Deprem Sigortası (DASK)', 
                          desc: 'Maddi hasarlı yapı sigortası ile zorunlu afet teminatları aktiftir ve poliçe numarası sisteme girilmiştir.' 
                        },
                        { 
                          id: 'belediye', 
                          title: 'Belediye Borçsuzluk Belgesi', 
                          desc: 'Belediye emlak vergisi, çevre-altyapı katılım bedeli ve su borcu yoktur belgesi temin edilmiştir.' 
                        },
                        { 
                          id: 'yetki', 
                          title: 'Portföy Yetki Belgesi / Mukavele', 
                          desc: 'Mülk sahibinin ıslak/dijital imzalı LookPrice tek yetkili satış sözleşmesi geçerli sürededir.' 
                        },
                        { 
                          id: 'satinAlmaIzni', 
                          title: 'Müstakbel Yabancı Satın Alma Süreci', 
                          desc: 'Fasıl 109 KKTC Bakanlar Kurulu onay ve tescil yol haritası (UK/Avrupa alıcıları için) planlıdır.' 
                        },
                      ].map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setComplianceChecked({ ...complianceChecked, [item.id]: !complianceChecked[item.id] })}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            complianceChecked[item.id] 
                              ? 'bg-slate-900 text-white border-slate-950' 
                              : 'bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={complianceChecked[item.id]} 
                            onChange={() => {}} // handled by parent click
                            className="mt-1 h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="block font-extrabold text-xs">{item.title}</span>
                            <span className={`block text-[10px] mt-1 leading-relaxed ${
                              complianceChecked[item.id] ? 'text-slate-300' : 'text-slate-400'
                            }`}>{item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200/50 text-[10.5px] text-slate-500 font-bold flex gap-2 items-center">
                      <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span>Bu mülkle ilgili evrak tescilleri ve kontroller şube yetkilisi tarafından dijital zaman damgasıyla imzalanmıştır. Hukuk davalarına karşı koruma altındadır.</span>
                    </div>

                  </div>
                )}

                {/* TAB 4: SPLITS */}
                {activeHubTab === 'splits' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-extrabold text-sm text-slate-800">Çok Şubeli Ağ İçi Gelir Paylaşımı (Commission Splits)</h5>
                        <p className="text-[11px] text-slate-400">Farklı şubelerle ortak gerçekleştirilen satış işlemlerinde komisyon hak haklarını güvenceye alın.</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase">
                        SÖZLEŞME ENTEGRELİ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="space-y-4 bg-white p-5 rounded-[2rem] border border-slate-200/80">
                        <span className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Ortak İşlem Yapılan Şube & Temsilci</span>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Ortak Çalışan Diğer Şube</label>
                            <select 
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-indigo-600"
                              value={selectedSplitBranch}
                              onChange={(e) => setSelectedSplitBranch(e.target.value)}
                            >
                              <option value="Lefkoşa Merkez Ofis">Lefkoşa Merkez Ofis</option>
                              <option value="Girne Harbour Ofisi">Girne Harbour Ofisi</option>
                              <option value="İskele LongBeach Şubesi">İskele LongBeach Şubesi</option>
                              <option value="Gazi Mağusa Ofisi">Gazi Mağusa Ofisi</option>
                              <option value="İstanbul High-End Ofisi">İstanbul High-End Ofisi</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Muhatap Diğer Yetkili</label>
                              <input 
                                type="text"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-indigo-600"
                                value={splitNegotiatedAgent}
                                onChange={(e) => setSplitNegotiatedAgent(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Mülk Toplam Hizmet Bedeli (%)</label>
                              <input 
                                type="number"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-indigo-600"
                                value={splitCommissionPercentage}
                                onChange={(e) => setSplitCommissionPercentage(Number(e.target.value))}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-2 flex justify-between">
                              <span>Komisyon Bölüşüm (Split) Oranı</span>
                              <span className="text-indigo-600 font-black">{splitRatio}% / {100 - splitRatio}%</span>
                            </label>
                            <div className="flex gap-2">
                              {[
                                { val: 50, label: 'Eşit Bölüşüm (%50 / %50)' },
                                { val: 60, label: 'Portföy Sorumlusu Ağırlıklı (%60 / %40)' },
                                { val: 70, label: 'Portföy Sorumlusu Ağırlıklı (%70 / %30)' },
                              ].map((opt) => (
                                <button
                                  key={opt.val}
                                  onClick={() => setSplitRatio(opt.val)}
                                  className={`flex-1 text-center py-2 border rounded-xl text-[9px] font-black uppercase transition-all ${
                                    splitRatio === opt.val 
                                      ? 'bg-indigo-600 text-white border-indigo-600' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CALCULATION DETAILS & PROTOCOL BUTTON */}
                      <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 flex flex-col justify-between">
                        <div className="space-y-4">
                          <span className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Anlık Hak Ediş Hesap Raporu</span>
                          
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center text-xs text-slate-600 font-bold">
                              <span>Hedeflenen Toplam Hizmet Bedeli:</span>
                              <span className="text-slate-900 font-extrabold">{matchingProperty.currency} {formatNumberVal(estTotalCommission)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-600 border-t border-dashed border-slate-100 pt-3 font-semibold">
                              <span className="flex items-center gap-1">🏢 Bizim Şube ({matchingProperty.branch_name || 'Merkez'} - {splitRatio}%):</span>
                              <span className="text-indigo-600 font-black">{matchingProperty.currency} {formatNumberVal(firstBranchCommission)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-600 pt-1 font-semibold">
                              <span className="flex items-center gap-1">🏢 İş Ortağı Şube ({selectedSplitBranch} - {100 - splitRatio}%):</span>
                              <span className="text-teal-600 font-black">{matchingProperty.currency} {formatNumberVal(secondBranchCommission)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => {
                              // Dynamically fill properties to contract model trigger
                              setContractProperty({
                                ...matchingProperty,
                                title: `[${splitRatio}/${100 - splitRatio} SPLIT] ` + matchingProperty.title,
                                kktc_title_type: `Şubeler Arası Split Protocol (${splitRatio}/${100-splitRatio})`
                              } as any);
                              setIsContractModalOpen(true);
                              setMatchingProperty(null);
                            }}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase rounded-xl transition-all shadow border border-slate-950 flex items-center justify-center gap-2"
                          >
                            <FileSignature className="w-4 h-4 stroke-[2.5]" />
                            Şubeler Arası Protokol Mukavalesi Yazdır
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB: ESCROW & PRE-CLOSING TRACKER */}
                {activeHubTab === 'escrow' && (
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-200/80 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center bg-indigo-50/55 p-5 rounded-2xl border border-indigo-100">
                        <div>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block font-sans">SECURE ESCROW TIMELINE</span>
                          <h5 className="font-extrabold text-sm text-slate-800 leading-tight mt-0.5">Güvenceli Tapu & Kapanış Yönetimi</h5>
                          <p className="text-[10px] text-slate-400 mt-1">Sözleşmenin tescilinden tapu koçan devrine kadar olan 6 adımlı tescil takvimi.</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase block">KAPANMA İHTİMALİ</span>
                          <span className="text-xl font-black text-indigo-600">%{escrowTimeline.filter(t => t.checked).length * 16 + 4}</span>
                        </div>
                      </div>

                      {/* Escrow Milestone Items list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {escrowTimeline.map((step) => (
                          <div 
                            key={step.id}
                            onClick={() => {
                              const updated = escrowTimeline.map(s => s.id === step.id ? { ...s, checked: !s.checked } : s);
                              setEscrowTimeline(updated);
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-3 relative overflow-hidden select-none ${
                              step.checked 
                                ? 'bg-slate-900 text-white border-slate-950' 
                                : 'bg-slate-50 border-slate-200/80 text-slate-800 hover:bg-slate-100/70'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={step.checked} 
                              onChange={() => {}}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            />
                            <div className="text-[11px] leading-tight space-y-1">
                              <span className="block font-extrabold">{step.label}</span>
                              <span className={`block text-[9.5px] leading-relaxed ${
                                step.checked ? 'text-slate-300' : 'text-slate-400 font-semibold'
                              }`}>
                                {step.description}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Action trigger to send pre-closing docket */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 font-sans">
                        <div className="text-[10.5px] text-slate-500 font-bold leading-relaxed">
                          ⚠️ <span className="text-slate-700">Tescil Uyarısı:</span> Bu mülke ait tescil listesindeki tüm adımların tamamlanması, Kıbrıs & Türkiye mevzuat uyarınca tescil iptallerini ve vergi cezalarını sıfıra indirir.
                        </div>
                        <button
                          onClick={() => {
                            const stepsCompleted = escrowTimeline.filter(s => s.checked).map(s => `[X] ${s.label}`).join("\n");
                            const stepsPending = escrowTimeline.filter(s => !s.checked).map(s => `[ ] ${s.label}`).join("\n");
                            const subject = encodeURIComponent(`GÜVENLİ ESCROW RAPORU: ${matchingProperty.title}`);
                            const body = encodeURIComponent(`Sayın Temsilci,\n\n${matchingProperty.title} numaralı portföyün kapanış süreçleri ve tapu devir takibi tescil raporu:\n\nTAMAMLANAN ADIMLAR:\n${stepsCompleted}\n\nBEKLEYEN EKSİKLER:\n${stepsPending}\n\nİlgili dosya ve harçların takibini sitemiz üzerinden tamamlayabilirsiniz.\n\nLookPrice Elite Escrow Asistanı.`);
                            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10.5px] px-4 py-2 rounded-xl transition-all shadow"
                        >
                          ✉️ Aktif Tapu Durum Raporunu Yetkililere Gönder
                        </button>
                      </div>

                    </div>
                  </div>
                )}


              </div>

              {/* FOOTER */}
              <div className="bg-slate-50 p-6 border-t flex justify-end gap-3 rounded-b-[2.5rem]">
                <button 
                  onClick={() => setMatchingProperty(null)}
                  className="px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Hub Kapat
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Real Real Estate Modal component */}
      <RealEstateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        property={selectedProperty}
        storeId={storeId || user?.store_id}
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

      {/* Dynamic Bilingual Legal Contract Generator Modal */}
      {contractProperty && (
        <LegalContractModal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false);
            setContractProperty(null);
          }}
          property={contractProperty}
          branding={branding}
          onSaveContract={async (contractDoc) => {
            if (!onSave || !contractProperty) return;
            const existingDocs = contractProperty.documents || [];
            const updatedDocs = [...existingDocs.filter((d: any) => d.id !== contractDoc.id), contractDoc];
            await onSave({
              ...contractProperty,
              documents: updatedDocs
            });
            setContractProperty(prev => prev ? { ...prev, documents: updatedDocs } : null);
          }}
        />
      )}

      {/* Tour Arranger Modal */}
      {isTourModalOpen && activeTourProperty && (
        <ArrangeTourModal
          onClose={() => {
            setIsTourModalOpen(false);
            setActiveTourProperty(null);
          }}
          property={activeTourProperty}
          onSave={() => {
            setIsTourModalOpen(false);
            setActiveTourProperty(null);
          }}
        />
      )}

      {/* Social Media Sharing & Poster Creation Wizard */}
      {isSocialShareModalOpen && socialShareProperty && (
        <SocialMediaShareModal
          isOpen={isSocialShareModalOpen}
          onClose={() => {
            setIsSocialShareModalOpen(false);
            setSocialShareProperty(null);
          }}
          property={socialShareProperty}
          branding={branding}
        />
      )}

      {/* Real Estate Poster Print Component */}
      {propertyToPrint && (
        <div id="print-poster-wrapper" className="hidden print:block bg-white text-slate-900 h-full w-full font-sans p-6">
          <style>
            {`
              @media print {
                .print-description-content * {
                  color: #1e293b !important;
                  background-color: transparent !important;
                  background: none !important;
                  font-family: inherit !important;
                  font-size: 11px !important;
                  line-height: 1.5 !important;
                }
                .print-description-content p {
                  margin-bottom: 4px !important;
                }
              }
            `}
          </style>
          <div className="flex flex-col h-full border-[10px] border-double border-slate-900 p-6 min-h-[267mm]">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-950">
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{branding?.store_name || branding?.name || 'LOOKPRICE'}</h1>
                <p className="text-[10px] font-black tracking-widest text-indigo-600 uppercase">PREMIUM REAL ESTATE</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  LP-{propertyToPrint.reference_no || propertyToPrint.id}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">İlan Tarihi: {new Date(propertyToPrint.created_at || Date.now()).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>

            {/* Title Section */}
            <div className="my-5">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">
                {propertyToPrint.type === 'residence' ? '🏠 KONUT PORTFÖYÜ' : propertyToPrint.type === 'commercial' ? '🏢 TİCARİ PORTFÖY' : '🌿 ARSA PORTFÖYÜ'}
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase font-display">
                {propertyToPrint.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
                  📍 {propertyToPrint.location}
                </span>
                {propertyToPrint.country === 'KKTC' && (
                  <span className="text-sm text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                     KKTC • {propertyToPrint.kktc_region || 'Girne'}
                  </span>
                )}
              </div>
            </div>

            {/* Poster Image */}
            <div className="relative w-full h-[220px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mb-5">
              {propertyToPrint.images && propertyToPrint.images[0] ? (
                <img 
                  src={propertyToPrint.images[0]} 
                  alt={propertyToPrint.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <span className="text-5xl">🏢</span>
                  <span className="text-xs mt-2 font-bold">Görsel Bulunmuyor</span>
                </div>
              )}
              {/* Dynamic Price Plate */}
              <div className="absolute bottom-4 right-4 bg-slate-950 text-white px-5 py-2.5 rounded-xl shadow-2xl border border-slate-800">
                <span className="block text-[8px] font-black tracking-widest text-slate-400 uppercase">
                  {propertyToPrint.listing_intent === 'rent' ? 'AYLIK KİRA BEDELİ' : 'SATIŞ BEDELİ'}
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {propertyToPrint.currency === 'GBP' ? '£' : propertyToPrint.currency === 'USD' ? '$' : propertyToPrint.currency === 'EUR' ? '€' : '₺'}
                  {formatNumberVal(propertyToPrint.price)}
                </span>
              </div>
            </div>

            {/* Basic Spec Table (Fit seamlessly in A4) */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-b border-dashed border-slate-300 py-4 my-2 text-xs font-sans">
              <div className="space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-medium">Metrekare (Net):</span>
                  <span className="text-slate-900 font-extrabold">{propertyToPrint.square_meters ? `${formatNumberVal(propertyToPrint.square_meters)} m²` : 'Belirtilmedi'}</span>
                </div>
                {propertyToPrint.sqm_gross && propertyToPrint.listing_intent !== 'rent' && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Metrekare (Brüt):</span>
                    <span className="text-slate-900 font-extrabold">{formatNumberVal(propertyToPrint.sqm_gross)} m²</span>
                  </div>
                )}
                {propertyToPrint.type !== 'land' && propertyToPrint.room_count && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Oda Sayısı:</span>
                    <span className="text-slate-900 font-extrabold">{propertyToPrint.room_count}</span>
                  </div>
                )}
                {propertyToPrint.type !== 'land' && propertyToPrint.building_age && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Bina Yaşı:</span>
                    <span className="text-slate-900 font-extrabold">{propertyToPrint.building_age}</span>
                  </div>
                )}
                {propertyToPrint.type !== 'land' && propertyToPrint.floor && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Kullanım Katı:</span>
                    <span className="text-slate-900 font-extrabold">{propertyToPrint.floor}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {propertyToPrint.type !== 'land' && propertyToPrint.heating && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Isıtma Sistemi:</span>
                    <span className="text-slate-900 font-extrabold">{propertyToPrint.heating}</span>
                  </div>
                )}
                {propertyToPrint.type !== 'land' && propertyToPrint.furnished !== undefined && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-medium">Eşya Durumu:</span>
                  <span className="text-slate-900 font-extrabold">{propertyToPrint.furnished ? 'Evet / Eşyalı' : 'Hayır / Eşyasız'}</span>
                </div>
                )}
                {propertyToPrint.type !== 'land' && propertyToPrint.in_gated_community !== undefined && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-medium">Site İçi mi:</span>
                  <span className="text-slate-900 font-extrabold">{propertyToPrint.in_gated_community ? 'Evet' : 'Hayır'}</span>
                </div>
                )}
                {propertyToPrint.type !== 'land' && propertyToPrint.dues && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Aidat Bedeli:</span>
                    <span className="text-slate-900 font-extrabold">{formatNumberVal(propertyToPrint.dues)} {propertyToPrint.dues_currency || '₺'}</span>
                  </div>
                )}
                {propertyToPrint.block_plot && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Ada / Parsel:</span>
                    <span className="text-slate-900 font-extrabold">{propertyToPrint.block_plot}</span>
                  </div>
                )}
                {propertyToPrint.facade && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Cephe:</span>
                    <span className="text-slate-900 font-extrabold">{propertyToPrint.facade}</span>
                  </div>
                )}
                {propertyToPrint.listing_intent !== 'rent' && propertyToPrint.kktc_title_type && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Koçan Türü (Tapu):</span>
                    <span className="text-slate-900 font-extrabold text-amber-800">{propertyToPrint.kktc_title_type}</span>
                  </div>
                )}
                {propertyToPrint.subtype && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Alt Tip:</span>
                    <span className="text-slate-900 font-extrabold text-slate-800">{propertyToPrint.subtype}</span>
                  </div>
                )}
                {propertyToPrint.listing_intent === 'rent' && propertyToPrint.deposit !== undefined && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Depozito Tutarı:</span>
                    <span className="text-slate-900 font-extrabold text-indigo-700">
                      {propertyToPrint.currency === 'GBP' ? '£' : propertyToPrint.currency === 'USD' ? '$' : propertyToPrint.currency === 'EUR' ? '€' : '₺'}
                      {formatNumberVal(propertyToPrint.deposit)}
                    </span>
                  </div>
                )}
                {propertyToPrint.listing_intent === 'rent' && propertyToPrint.billing_period && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Ödeme Periyodu:</span>
                    <span className="text-slate-900 font-extrabold text-indigo-700">
                      {propertyToPrint.billing_period === 'yearly' ? 'Yıllık' : 'Aylık'}
                    </span>
                  </div>
                )}
                {propertyToPrint.listing_intent === 'rent' && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500 font-medium">Sözleşme Standardı:</span>
                    <span className="text-slate-900 font-extrabold text-indigo-700">Minimum 1 Yıl Kontrat</span>
                  </div>
                )}
              </div>
            </div>

            {/* Short Marketing Description */}
            {propertyToPrint.description && (
              <div className="my-4 text-[11px] text-slate-700 leading-relaxed font-sans flex-1">
                <span className="block font-black text-slate-900 mb-1 tracking-wider uppercase text-[9px]">AÇIKLAMA VE AYRINTILAR</span>
                <div 
                  className="print-description-content text-[11px]"
                  dangerouslySetInnerHTML={{ __html: unescapeEntities(propertyToPrint.description) }}
                />
              </div>
            )}

            {/* Footer with agent details */}
            <div className="mt-auto pt-4 border-t border-slate-950 flex justify-between items-end">
              <div>
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">SORUMLU PORTFÖY DANIŞMANI</span>
                <h4 className="text-sm font-black text-slate-800 leading-snug mt-1">{propertyToPrint.responsible_agent || 'Tüm Şubeler Yetkili'}</h4>
                <p className="text-[10px] text-slate-500 font-medium mb-1">Yetkili Şube: {propertyToPrint.branch_name || 'Merkez Şube Office'}</p>
                {branding?.phone && (
                  <p className="text-[10px] text-slate-500 font-semibold mb-0.5">📞 {branding.phone}</p>
                )}
                {branding?.address && (
                  <p className="text-[9px] text-slate-400 font-medium max-w-[200px] leading-tight">📍 {branding.address}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">LOOKPRICE PORTAL GÜVENCESİ</p>
                <p className="text-[10px] text-slate-400 mt-1">Sektörün Güvenilir Emlak Yönetim Altyapısı</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RealEstateTab;
