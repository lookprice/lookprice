import React, { useMemo, useState } from "react";
import {
  Building2,
  Share2,
  Lock,
  Globe,
  Plus,
  Search,
  Cloud,
  Calendar,
  CalendarDays,
  Layout,
  ArrowLeft,
  List,
  LayoutGrid,
  Hash,
  Copy,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Handshake,
  FileSignature,
  FileCheck,
  X
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { RealEstateViewMode, RealEstateStatusFilter } from "./types";
import { formatNumberVal } from "./RealEstatePrintPoster";
import { computeRealEstateRefCounters } from "@/utils/referenceCounter";

interface RealEstateHeaderToolbarProps {
  viewMode: RealEstateViewMode;
  setViewMode: React.Dispatch<React.SetStateAction<RealEstateViewMode>>;
  safeProperties: any[];
  driveConnected: boolean;
  isBackupLoading: boolean;
  setIsBackupLoading: (loading: boolean) => void;
  onAddNewProperty: (intent?: 'sale' | 'rent', suggestedRef?: string) => void;
  search: string;
  setSearch: (s: string) => void;
  filterScope: string;
  setFilterScope: (s: string) => void;
  filterRegion: string;
  setFilterRegion: (s: string) => void;
  uniqueRegions: string[];
  filterBranch: string;
  setFilterBranch: (s: string) => void;
  branches: any[];
  statusTabFilter: RealEstateStatusFilter;
  setStatusTabFilter: (s: RealEstateStatusFilter) => void;
  totalCount: number;
  saleCount: number;
  rentCount: number;
  optionedCount: number;
  soldCount: number;
  rentedCount: number;
  onOpenPartnerPortal?: () => void;
  onOpenPrePortfolioAuth?: (templateId: 'exclusivity_agreement' | 'rental_authorization' | 'sales_authorization') => void;
}

export const RealEstateHeaderToolbar: React.FC<RealEstateHeaderToolbarProps> = ({
  viewMode,
  setViewMode,
  safeProperties,
  driveConnected,
  isBackupLoading,
  setIsBackupLoading,
  onAddNewProperty,
  search,
  setSearch,
  filterScope,
  setFilterScope,
  filterRegion,
  setFilterRegion,
  uniqueRegions,
  filterBranch,
  setFilterBranch,
  branches,
  statusTabFilter,
  setStatusTabFilter,
  totalCount,
  saleCount,
  rentCount,
  optionedCount,
  soldCount,
  rentedCount,
  onOpenPartnerPortal,
  onOpenPrePortfolioAuth
}) => {
  // Default collapsed for both Dashboard Stats/Ref Counter and Search/Filter panel
  const [isRefAndStatsOpen, setIsRefAndStatsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const refCounters = useMemo(() => {
    return computeRealEstateRefCounters(safeProperties, "Rodel Investment");
  }, [safeProperties]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim().length > 0) count++;
    if (filterScope !== "all") count++;
    if (filterRegion !== "all") count++;
    if (filterBranch !== "all") count++;
    return count;
  }, [search, filterScope, filterRegion, filterBranch]);

  const handleCopyRef = (refCode: string, typeName: string) => {
    if (!refCode || refCode === "-") return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refCode);
      toast.success(`${typeName} Ref Kodu kopyalandı: ${refCode}`);
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilterScope("all");
    setFilterRegion("all");
    setFilterBranch("all");
  };

  const sharedPoolCount = useMemo(
    () => safeProperties.filter(p => (p.sharing_scope || 'shared_pool') === 'shared_pool').length,
    [safeProperties]
  );
  const lockedCount = useMemo(
    () => safeProperties.filter(p => !!p.reserved_by_branch).length,
    [safeProperties]
  );
  const kktcCount = useMemo(
    () => safeProperties.filter(p => p.country === 'KKTC').length,
    [safeProperties]
  );

  return (
    <>
      {/* TOP NAVIGATION BAR FOR PIPELINE & CALENDAR MODES */}
      {(viewMode === 'pipeline' || viewMode === 'calendar') && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200/80 rounded-xl p-2 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <button
              onClick={() => setViewMode('list')}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>Portföy Listesi</span>
            </button>
            <span className="text-xs font-black uppercase text-slate-900 tracking-tight shrink-0 flex items-center gap-1.5">
              {viewMode === 'calendar' ? (
                <>
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Gezi & Randevu Takvimi</span>
                </>
              ) : (
                <>
                  <Layout className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Gayrimenkul CRM & Pipeline</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                (viewMode as string) === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <List className="w-3 h-3" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Takvim</span>
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-2 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'pipeline' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layout className="w-3 h-3" />
              <span>Pipeline</span>
            </button>
          </div>
        </div>
      )}

      {/* ULTRA-COMPACT HIGH-DENSITY PORTFOLIO CONTROL BAR */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-2 shadow-2xs space-y-1.5">
          {/* Row 1: Single-Line Header + Collapsible Stats/Ref + Collapsible Filter Trigger + Actions */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            {/* Left: Title + Collapsible Stats & Ref Trigger + Collapsible Search/Filter Trigger */}
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-xs font-black uppercase text-slate-950 tracking-tight shrink-0 px-1">
                Portföy
              </span>

              {/* Collapsible Stats & Ref Counter Trigger (Default Hidden to Save Space) */}
              <button
                type="button"
                onClick={() => setIsRefAndStatsOpen(prev => !prev)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                  isRefAndStatsOpen
                    ? "bg-slate-900 text-amber-300 border-slate-900 shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-200"
                }`}
                title="Ağ İstatistikleri ve Ardışık Referans Sayacını Aç / Gizle"
              >
                <Hash className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="hidden xs:inline">{formatNumberVal(safeProperties.length)} İlan</span>
                <span className="hidden xs:inline text-slate-400">·</span>
                <span className="font-mono text-amber-600">K:{refCounters.rent.nextNum || "-"}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-indigo-600">S:{refCounters.sale.nextNum || "-"}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    isRefAndStatsOpen ? "rotate-180 text-amber-400" : "text-slate-400"
                  }`}
                />
              </button>

              {/* Collapsible Search & Filter Drawer Trigger */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(prev => !prev)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                  isFilterOpen || activeFilterCount > 0
                    ? "bg-indigo-50 text-indigo-900 border-indigo-300"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200"
                }`}
                title="Arama ve Bölge / Havuz Filtrelerini Aç / Gizle"
              >
                <SlidersHorizontal className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>Ara & Filtre</span>
                {activeFilterCount > 0 && (
                  <span className="px-1 py-0.2 bg-indigo-600 text-white rounded text-[9px] font-mono">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    isFilterOpen ? "rotate-180 text-indigo-600" : "text-slate-400"
                  }`}
                />
              </button>

              {/* Quick Inline Search on Desktop when filter drawer is closed */}
              {!isFilterOpen && (
                <div className="relative hidden md:block w-44">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Hızlı ref / başlık ara..."
                    className="w-full pl-6 pr-5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right: View Switcher + Drive + Calendar + Pipeline + New Property */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Compact List vs Grid View Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'list' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Kompakt Liste Görünümü"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Kart / Izgara Görünümü"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {driveConnected && (
                <button
                  onClick={async () => {
                    setIsBackupLoading(true);
                    const promise = api.exportToGoogleDrive({ targetType: 'real_estate', format: 'xls' });
                    toast.promise(promise, {
                      loading: 'Google Drive yedekleniyor...',
                      success: 'Emlak Portföyü Google Drive\'a yedeklendi!',
                      error: 'Google Drive yedeklemesi başarısız.'
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
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Google Drive'a Excel Yedekle"
                >
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span className="hidden sm:inline">Drive</span>
                </button>
              )}

              {onOpenPartnerPortal && (
                <button
                  type="button"
                  onClick={onOpenPartnerPortal}
                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                  title="Paydaş Portföyleri & Bakiye Takibi"
                >
                  <Handshake className="w-3 h-3 text-amber-700" />
                  <span className="hidden sm:inline">Paydaşlar</span>
                </button>
              )}

              <button
                onClick={() => setViewMode('calendar')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                title="Takvim Görünümü"
              >
                <CalendarDays className="w-3 h-3 text-indigo-600" />
                <span className="hidden sm:inline">Takvim</span>
              </button>

              <button
                onClick={() => setViewMode('pipeline')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                title="CRM Pipeline"
              >
                <Layout className="w-3 h-3 text-indigo-600" />
                <span className="hidden sm:inline">Pipeline</span>
              </button>

              {onOpenPrePortfolioAuth && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenPrePortfolioAuth('sales_authorization')}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                    title="Henüz Portföye Alınmamış Satılık Mülk İçin Yetkili Satış Sözleşmesi (Hizmet Bedeli Eklenerek) Al (Ön Portföy Oluşturur)"
                  >
                    <FileSignature className="w-3 h-3 text-indigo-700" />
                    <span className="hidden sm:inline">Satış Yetki Al</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPrePortfolioAuth('rental_authorization')}
                    className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                    title="Henüz Portföye Alınmamış Kiralık Mülk İçin Kiralama Yetki Belgesi Al (Ön Portföy Oluşturur)"
                  >
                    <FileCheck className="w-3 h-3 text-teal-700" />
                    <span className="hidden sm:inline">Kira Yetki Al</span>
                  </button>
                </>
              )}

              <button
                onClick={() => onAddNewProperty()}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Portföy</span>
              </button>
            </div>
          </div>

          {/* COLLAPSIBLE DRAWER 1: NETWORK STATS & SEQUENTIAL REF COUNTER (Default Closed) */}
          {isRefAndStatsOpen && (
            <div className="p-2 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800 pb-1.5">
                {/* Inline Network Breakdown */}
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                  <span className="flex items-center gap-1 text-slate-200">
                    <Building2 className="w-3 h-3 text-indigo-400" />
                    <span>{formatNumberVal(safeProperties.length)} Ağ</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Share2 className="w-3 h-3 text-emerald-400" />
                    <span>{formatNumberVal(sharedPoolCount)} Ortak Havuz</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-rose-300">
                    <Lock className="w-3 h-3 text-rose-400" />
                    <span>{formatNumberVal(lockedCount)} Kilitli</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>{formatNumberVal(kktcCount)} KKTC</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRefAndStatsOpen(false)}
                  className="text-slate-400 hover:text-white flex items-center gap-0.5 text-[9px] font-bold cursor-pointer"
                >
                  <span>Kapat</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {/* Kiralık Ref */}
                <div className="flex items-center justify-between gap-1.5 bg-slate-800/90 px-2 py-1 rounded-lg border border-amber-500/30 text-[10px]">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span className="font-black text-amber-400 uppercase">Kira:</span>
                    <span className="text-slate-300 font-mono">Son #{refCounters.rent.lastNum || "-"}</span>
                    <span className="text-slate-500">→</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyRef(refCounters.rent.suggestedRef, "Kiralık")}
                      className="font-mono font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                      title="Kiralık Ref Kodunu Kopyala"
                    >
                      <span className="truncate max-w-[110px]">{refCounters.rent.suggestedRef}</span>
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddNewProperty('rent', refCounters.rent.suggestedRef)}
                      className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded font-black cursor-pointer"
                    >
                      + Ekle
                    </button>
                  </div>
                </div>

                {/* Satılık Ref */}
                <div className="flex items-center justify-between gap-1.5 bg-slate-800/90 px-2 py-1 rounded-lg border border-indigo-500/30 text-[10px]">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span className="font-black text-indigo-300 uppercase">Satış:</span>
                    <span className="text-slate-300 font-mono">Son #{refCounters.sale.lastNum || "-"}</span>
                    <span className="text-slate-500">→</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyRef(refCounters.sale.suggestedRef, "Satılık")}
                      className="font-mono font-black bg-indigo-500 hover:bg-indigo-400 text-white px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                      title="Satılık Ref Kodunu Kopyala"
                    >
                      <span className="truncate max-w-[110px]">{refCounters.sale.suggestedRef}</span>
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddNewProperty('sale', refCounters.sale.suggestedRef)}
                      className="px-1.5 py-0.5 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded font-black cursor-pointer"
                    >
                      + Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COLLAPSIBLE DRAWER 2: SEARCH & FILTER BAR (Default Closed) */}
          {isFilterOpen && (
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="İlan, ref veya açıklama ara..."
                    className="w-full pl-7 pr-6 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none focus:border-indigo-600"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div>
                  <select
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none focus:border-indigo-600 cursor-pointer"
                    value={filterScope}
                    onChange={(e) => setFilterScope(e.target.value)}
                  >
                    <option value="all">Ağ ve Havuz (Tümü)</option>
                    <option value="has_partner">Paydaşlı Portföyler</option>
                    <option value="shared_pool">Ortak Havuz</option>
                    <option value="branch_private">Sadece Kendi Şubem</option>
                    <option value="private">Şahsi İlanlarım</option>
                    <option value="locked">Kilitli / Rezerveli</option>
                  </select>
                </div>

                <div>
                  <select
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none focus:border-indigo-600 cursor-pointer"
                    value={filterRegion}
                    onChange={(e) => setFilterRegion(e.target.value)}
                  >
                    <option value="all">Tüm Bölgeler (KKTC)</option>
                    {uniqueRegions.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                {branches && branches.length > 0 ? (
                  <div>
                    <select
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-slate-900 outline-none focus:border-indigo-600 cursor-pointer"
                      value={filterBranch}
                      onChange={(e) => setFilterBranch(e.target.value)}
                    >
                      <option value="all">Tüm Şubeler</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1">
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-black cursor-pointer"
                      >
                        Filtreleri Temizle ({activeFilterCount})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[10px] font-black cursor-pointer"
                    >
                      Gizle
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Row 2: Ultra-Slim Status Filter Tabs */}
          <div className="flex items-center justify-between gap-1 bg-slate-100/90 p-0.5 rounded-lg overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setStatusTabFilter('all')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  statusTabFilter === 'all'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Hepsi ({totalCount})
              </button>

              <button
                onClick={() => setStatusTabFilter('sale')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  statusTabFilter === 'sale'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Satılık ({saleCount})
              </button>

              <button
                onClick={() => setStatusTabFilter('rent')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  statusTabFilter === 'rent'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Kiralık ({rentCount})
              </button>

              <button
                onClick={() => setStatusTabFilter('optioned')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  statusTabFilter === 'optioned'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Opsiyonlu ({optionedCount})
              </button>

              <button
                onClick={() => setStatusTabFilter('sold')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  statusTabFilter === 'sold'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Satıldı ({soldCount})
              </button>

              <button
                onClick={() => setStatusTabFilter('rented')}
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  statusTabFilter === 'rented'
                    ? 'bg-sky-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                Kiralandı ({rentedCount})
              </button>
            </div>

            {activeFilterCount > 0 && !isFilterOpen && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-1.5 py-0.5 text-[9px] font-black text-rose-700 hover:bg-rose-50 rounded whitespace-nowrap cursor-pointer shrink-0"
              >
                Filtreyi Sıfırla ✕
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
