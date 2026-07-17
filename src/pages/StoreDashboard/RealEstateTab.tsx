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
  LayoutGrid,
  List,
  Home,
  MapPin,
  FolderLock,
  FileSignature,
  Printer,
  Calendar,
  Edit2,
  Trash2,
  Cloud,
  Award,
  CalendarDays,
  Layout
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { ConsultingInsights } from "../../components/ConsultingInsights";
import { RealEstateCalendar } from "../../components/RealEstateCalendar";
import { RealEstateCRM } from "../../components/RealEstateCRM";

const RealEstateModal = React.lazy(() => import("../../components/RealEstateModal").then(m => ({ default: m.RealEstateModal })));
const LegalContractModal = React.lazy(() => import("../../components/LegalContractModal").then(m => ({ default: m.LegalContractModal })));
const ArrangeTourModal = React.lazy(() => import("../../components/ArrangeTourModal").then(m => ({ default: m.ArrangeTourModal })));
const SocialMediaShareModal = React.lazy(() => import("../../components/SocialMediaShareModal").then(m => ({ default: m.SocialMediaShareModal })));
const TapuTakipModal = React.lazy(() => import("../../components/TapuTakipModal").then(m => ({ default: m.TapuTakipModal })));

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

  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [driveConnected, setDriveConnected] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);

  const fetchTasks = async () => {
    const sid = storeId || user?.store_id;
    if (sid) {
      try {
        const res = await api.getTasks(sid);
        if (Array.isArray(res)) setTasks(res);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    }
  };

  useEffect(() => {
    api.getGoogleDriveSettings().then(res => {
      setDriveConnected(!!res?.connected);
    }).catch(err => console.error("Error fetching drive connected status in RealEstateTab", err));

    fetchTasks();
  }, [storeId, user?.store_id]);

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar' | 'pipeline'>('list');
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
  const [isSocialShareModalOpen, setIsSocialShareModalOpen] = useState(false);
  const [socialShareProperty, setSocialShareProperty] = useState<any>(null);
  const [isTapuModalOpen, setIsTapuModalOpen] = useState(false);
  const [tapuProperty, setTapuProperty] = useState<any>(null);

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
  
  const [newFeedbackAgent, setNewFeedbackAgent] = useState("");
  const [newFeedbackStatus, setNewFeedbackStatus] = useState("pending");
  const [statusTabFilter, setStatusTabFilter] = useState<'all' | 'sale' | 'rent' | 'optioned' | 'sold' | 'rented'>('all');

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
    if (statusTabFilter === 'sale') return (p.listing_intent === 'sale' || !p.listing_intent) && p.status !== 'sold';
    if (statusTabFilter === 'rent') return p.listing_intent === 'rent' && p.status !== 'rented';
    if (statusTabFilter === 'optioned') return p.status === 'optioned';
    if (statusTabFilter === 'sold') return p.status === 'sold';
    if (statusTabFilter === 'rented') return p.status === 'rented';
    return true;
  });

  const totalCount = filteredProperties.length;
  const saleCount = filteredProperties.filter(p => (p.listing_intent === 'sale' || !p.listing_intent) && p.status !== 'sold').length;
  const rentCount = filteredProperties.filter(p => p.listing_intent === 'rent' && p.status !== 'rented').length;
  const optionedCount = filteredProperties.filter(p => p.status === 'optioned').length;
  const soldCount = filteredProperties.filter(p => p.status === 'sold').length;
  const rentedCount = filteredProperties.filter(p => p.status === 'rented').length;

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
      setTimeout(() => {
        setPropertyToPrint(null);
      }, 3000);
    }, 800);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      
      {/* ENRAKİPSİZ ÇOK ŞUBELİ CRM STATS BENTO PANEL */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
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
      )}

      {/* ŞUBELER ARASI ENRAKİPSİZ FİLTRE KAPLÜLLERİ */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
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
      )}

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
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            className={`flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl transition-all font-black text-xs uppercase shadow-sm active:scale-95 hover:bg-slate-50 ${viewMode === 'calendar' ? 'ring-2 ring-indigo-500' : ''}`}
            title="Gezi & Randevu Takvimi"
          >
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            Takvim
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'pipeline' ? 'list' : 'pipeline')}
            className={`flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-3 rounded-xl transition-all font-black text-xs uppercase shadow-sm active:scale-95 hover:bg-slate-50 ${viewMode === 'pipeline' ? 'ring-2 ring-indigo-500' : ''}`}
            title="CRM Pipeline"
          >
            <Layout className="h-4 w-4 text-indigo-600" />
            CRM Pipeline
          </button>
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
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
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
            className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
          >
            <option value="all">🌐 Ağ ve Paylaşım Durumu</option>
            <option value="shared_pool">🌐 Ortak Havuz İlanları</option>
            <option value="branch_private">🏢 Sadece Kendi Şubem</option>
            <option value="private">🔑 Sadece Benim Şahsi İlanlarım</option>
            <option value="locked">🔒 Kilitli / Rezerveli İlanlar</option>
          </select>
        </div>
        <div>
          <select
            className="w-full px-3 py-2 bg-slate-50 border-0 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <option value="all">📍 Tüm Bölgeler (Kuzey Kıbrıs)</option>
            {uniqueRegions.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>
      </div>
      )}

      {/* Segmented status filter tab header */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-205/60">
          <button 
            onClick={() => setStatusTabFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-bold scale-[1.01]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            HEPSİ ({totalCount})
          </button>
          <button 
            onClick={() => setStatusTabFilter('sale')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'sale'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
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
            ✍ OPSİYONLANDI ({optionedCount})
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
          <button 
            onClick={() => setStatusTabFilter('rented')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              statusTabFilter === 'rented'
                ? 'bg-sky-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            🔑 KİRALANDI ({rentedCount})
          </button>
        </div>
      </div>
      )}
      
      {viewMode === 'calendar' ? (
        <RealEstateCalendar 
          storeId={storeId || user?.store_id} 
          properties={safeProperties} 
          onClose={() => setViewMode('list')}
        />
      ) : viewMode === 'pipeline' ? (
        <RealEstateCRM
          storeId={storeId || user?.store_id || 0}
          properties={safeProperties}
          tasks={tasks}
          onOpenCalendar={() => setViewMode('calendar')}
          onOpenTourModal={(p) => {
            setActiveTourProperty(p);
            setIsTourModalOpen(true);
          }}
          onRefresh={fetchTasks}
        />
      ) : loading ? (
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
                  <div className="absolute top-3 left-3 z-20">
                    <span className={`font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-lg tracking-wide ${
                      property.status === 'optioned' ? 'bg-amber-600 text-white' :
                      property.status === 'sold' ? 'bg-rose-600 text-white' :
                      property.status === 'rented' ? 'bg-sky-700 text-white' :
                      property.listing_intent === 'rent' ? 'bg-sky-600 text-white' :
                      'bg-emerald-600 text-white'
                    }`}>
                      {property.status === 'optioned' ? '✍ OPSİYONLU' :
                       property.status === 'sold' ? '✅ SATILDI' :
                       property.status === 'rented' ? '🔑 KİRALANDI' :
                       property.listing_intent === 'rent' ? '🔑 KİRALIK' : '🏠 SATILIK'}
                    </span>
                  </div>

                  {/* Diagonal Banner for SOLD/RENTED */}
                  {(property.status === 'sold' || property.status === 'rented') && (
                    <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden z-10 pointer-events-none">
                      <div className={`absolute top-0 right-0 w-[170px] py-1 text-center text-[10px] font-black tracking-[0.2em] text-white shadow-lg transform translate-x-[45px] translate-y-[25px] rotate-45 uppercase ${
                        property.status === 'sold' ? 'bg-rose-600/90' : 'bg-sky-700/90'
                      }`}>
                        {property.status === 'sold' ? 'SATILDI' : 'KİRALANDI'}
                      </div>
                    </div>
                  )}
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
                      {property.is_trade_in_available && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg uppercase tracking-wider">
                          🔄 Takaslı
                        </span>
                      )}
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
                        {property.listing_intent !== "rent" && (
                          <button
                            onClick={() => { setTapuProperty(property); setIsTapuModalOpen(true); }}
                            className="flex items-center justify-center p-2.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl transition-all shadow active:scale-95 border border-amber-600 shrink-0"
                            title="Tapu Süreç & Randevu Takipçisi"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
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
                          onClick={() => { setActiveTourProperty(property); setIsTourModalOpen(true); }}
                          className="flex items-center justify-center p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all shadow active:scale-95 border border-slate-200 shrink-0"
                          title="Temsilci Keşif / Gösterim Turu Planla"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedProperty(property);
                            setIsModalOpen(true);
                          }}
                          className="flex items-center justify-center p-2.5 text-slate-750 hover:bg-slate-100 rounded-xl transition-all border border-transparent shrink-0"
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

      {/* Real Real Estate Modal component */}
      {isModalOpen && (
        <React.Suspense fallback={<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600">İlan Formu Yükleniyor...</p>
          </div>
        </div>}>
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
        </React.Suspense>
      )}

      {/* Dynamic Bilingual Legal Contract Generator Modal */}
      {contractProperty && (
        <React.Suspense fallback={null}>
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
        </React.Suspense>
      )}

      {/* Tapu Süreç & Randevu Takipçisi Modal */}
      {tapuProperty && (
        <React.Suspense fallback={null}>
          <TapuTakipModal
            isOpen={isTapuModalOpen}
            onClose={() => {
              setIsTapuModalOpen(false);
              setTapuProperty(null);
            }}
            property={tapuProperty}
            branding={branding}
            onSaveTrack={async (updatedProperty) => {
              if (!onSave) return;
              await onSave(updatedProperty);
              toast.success("Tapu tescil süreci başarıyla kaydedildi!");
            }}
          />
        </React.Suspense>
      )}

      {/* Tour Arranger Modal */}
      {isTourModalOpen && activeTourProperty && (
        <React.Suspense fallback={null}>
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
        </React.Suspense>
      )}

      {/* Social Media Sharing & Poster Creation Wizard */}
      {isSocialShareModalOpen && socialShareProperty && (
        <React.Suspense fallback={null}>
          <SocialMediaShareModal
            isOpen={isSocialShareModalOpen}
            onClose={() => {
              setIsSocialShareModalOpen(false);
              setSocialShareProperty(null);
            }}
            property={socialShareProperty}
            branding={branding}
          />
        </React.Suspense>
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
                  font-size: 9.5px !important;
                  line-height: 1.4 !important;
                }
                .print-description-content p {
                  margin-bottom: 2px !important;
                }
              }
            `}
          </style>
          <div className="flex flex-col h-full border-[10px] border-double border-slate-900 p-6 min-h-[267mm]">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-950">
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{branding?.store_name || branding?.name || 'SEÇKİN EMLAK'}</h1>
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
                      {propertyToPrint.billing_period === 'yearly' ? 'Yıllık' :
                       propertyToPrint.billing_period === '3-monthly' ? '3 Aylık' :
                       propertyToPrint.billing_period === '6-monthly' ? '6 Aylık' : 'Aylık'}
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
              <div className="my-3 text-slate-700 leading-normal font-sans flex-1 overflow-hidden max-h-[135px] relative">
                <span className="block font-black text-slate-900 mb-1 tracking-wider uppercase text-[9px]">AÇIKLAMA VE AYRINTILAR</span>
                <div 
                  className="print-description-content text-[9.5px] columns-2 gap-x-6 gap-y-1 leading-relaxed max-h-[110px] overflow-hidden"
                  style={{ columnFill: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: unescapeEntities(propertyToPrint.description) }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent pointer-events-none" />
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
