import React, { useMemo } from "react";
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
  Hash,
  Copy
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
  rentedCount
}) => {
  const refCounters = useMemo(() => {
    return computeRealEstateRefCounters(safeProperties, "Rodel Investment");
  }, [safeProperties]);

  const handleCopyRef = (refCode: string, typeName: string) => {
    if (!refCode || refCode === "-") return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(refCode);
      toast.success(`${typeName} Ref Kodu kopyalandı: ${refCode}`);
    }
  };

  return (
    <>
      {/* TOP NAVIGATION BAR FOR PIPELINE & CALENDAR MODES */}
      {(viewMode === 'pipeline' || viewMode === 'calendar') && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200/80 rounded-xl p-2 sm:p-2.5 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <button
              onClick={() => setViewMode('list')}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span>← Portföy Listesine Dön</span>
            </button>
            <span className="text-xs font-black uppercase text-slate-800 tracking-tight shrink-0 flex items-center gap-1.5 font-mono">
              {viewMode === 'calendar' ? (
                <>
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <span>Gezi & Randevu Takvimi</span>
                </>
              ) : (
                <>
                  <Layout className="w-4 h-4 text-indigo-600" />
                  <span>Gayrimenkul CRM & Pipeline</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                (viewMode as string) === 'list' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Takvim</span>
            </button>
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'pipeline' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
          </div>
        </div>
      )}

      {/* MINIMALIST & FUTURISTIC ULTRA-COMPACT CONTROL BAR */}
      {viewMode !== 'pipeline' && viewMode !== 'calendar' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-2.5 md:p-3 shadow-2xs space-y-2">
          {/* Row 1: Title, Mini Stat Pills, and Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-xs md:text-sm font-black uppercase text-slate-900 tracking-tight shrink-0">
                Portföy
              </span>

              {/* Inline Futuristic Micro Stats */}
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md flex items-center gap-1" title="Ağ Portföyü">
                  <Building2 className="w-3 h-3 text-indigo-600" />
                  <span>{formatNumberVal(safeProperties.length)} Ağ</span>
                </span>

                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md flex items-center gap-1" title="Ortak Havuz">
                  <Share2 className="w-3 h-3 text-emerald-600" />
                  <span>{formatNumberVal(safeProperties.filter(p => (p.sharing_scope || 'shared_pool') === 'shared_pool').length)} Havuz</span>
                </span>

                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-md flex items-center gap-1" title="Kilitli / Rezerveli">
                  <Lock className="w-3 h-3 text-rose-600" />
                  <span>{formatNumberVal(safeProperties.filter(p => !!p.reserved_by_branch).length)} Kilitli</span>
                </span>

                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 border border-cyan-200/80 rounded-md flex items-center gap-1" title="Kıbrıs (KKTC)">
                  <Globe className="w-3 h-3 text-cyan-600" />
                  <span>{formatNumberVal(safeProperties.filter(p => p.country === 'KKTC').length)} KKTC</span>
                </span>
              </div>
            </div>

            {/* Compact Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
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
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Google Drive'a Excel Yedekle"
                >
                  <Cloud className="w-3 h-3 text-emerald-600" />
                  <span>Drive</span>
                </button>
              )}

              <button
                onClick={() => setViewMode((v) => v === 'calendar' ? 'list' : 'calendar')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Takvim Görünümü"
              >
                <CalendarDays className="w-3 h-3 text-indigo-600" />
                <span>Takvim</span>
              </button>

              <button
                onClick={() => setViewMode((v) => v === 'pipeline' ? 'list' : 'pipeline')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="CRM Pipeline"
              >
                <Layout className="w-3 h-3 text-indigo-600" />
                <span>Pipeline</span>
              </button>

              <button
                onClick={() => onAddNewProperty()}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Portföy</span>
              </button>
            </div>
          </div>

          {/* Row 1.5: REFERENCE COUNTER WIDGET (KİRALIK & SATILIK ARDIŞIK SAYAÇ GÖSTERGESİ) */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl border border-slate-700/80 shadow-xs">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Header / Label */}
              <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-700/80 text-[10px] font-black uppercase tracking-wider text-amber-400">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>Portföy Ref Sayaç</span>
              </div>

              {/* Kiralık Sayacı (K-428 -> 429) */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-amber-500/40 text-xs">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-tight">Kiralık:</span>
                <span className="text-[10px] font-medium text-slate-300">
                  Son: <strong className="font-mono font-bold text-amber-300">#{refCounters.rent.lastNum || "-"}</strong>
                </span>
                <span className="text-slate-500 text-[10px]">→</span>
                <span className="text-[10px] font-bold text-slate-300">Devam/Yeni:</span>
                <button
                  type="button"
                  onClick={() => handleCopyRef(refCounters.rent.suggestedRef, "Kiralık")}
                  className="font-mono font-black text-[11px] bg-amber-400 hover:bg-amber-300 text-slate-950 px-2 py-0.5 rounded shadow-2xs border border-amber-300 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  title="Kiralık Ref Kodunu Kopyala"
                >
                  <span>{refCounters.rent.suggestedRef}</span>
                  <Copy className="w-2.5 h-2.5 opacity-70" />
                </button>
                <button
                  type="button"
                  onClick={() => onAddNewProperty('rent', refCounters.rent.suggestedRef)}
                  className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded text-[10px] font-black transition-colors cursor-pointer flex items-center gap-0.5"
                  title="Bu Ref No ile Yeni Kiralık İlanı Aç"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Kiralık Ekle</span>
                </button>
              </div>

              {/* Satılık Sayacı (S-301 -> 302) */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-indigo-500/40 text-xs">
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-tight">Satılık:</span>
                <span className="text-[10px] font-medium text-slate-300">
                  Son: <strong className="font-mono font-bold text-indigo-200">#{refCounters.sale.lastNum || "-"}</strong>
                </span>
                <span className="text-slate-500 text-[10px]">→</span>
                <span className="text-[10px] font-bold text-slate-300">Devam/Yeni:</span>
                <button
                  type="button"
                  onClick={() => handleCopyRef(refCounters.sale.suggestedRef, "Satılık")}
                  className="font-mono font-black text-[11px] bg-indigo-500 hover:bg-indigo-400 text-white px-2 py-0.5 rounded shadow-2xs border border-indigo-400 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  title="Satılık Ref Kodunu Kopyala"
                >
                  <span>{refCounters.sale.suggestedRef}</span>
                  <Copy className="w-2.5 h-2.5 opacity-70" />
                </button>
                <button
                  type="button"
                  onClick={() => onAddNewProperty('sale', refCounters.sale.suggestedRef)}
                  className="px-1.5 py-0.5 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded text-[10px] font-black transition-colors cursor-pointer flex items-center gap-0.5"
                  title="Bu Ref No ile Yeni Satılık İlanı Aç"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">Satılık Ekle</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] font-medium text-slate-400 hidden xl:flex items-center gap-1">
              <span>Son kullanılan numaralardan otomatik devam eden ardışık sayaç</span>
            </div>
          </div>

          {/* Row 2: Search Input & Filter Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <div className="relative md:col-span-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="İlan / başlık ara..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <select
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value)}
              >
                <option value="all">Ağ ve Havuz</option>
                <option value="shared_pool">Ortak Havuz</option>
                <option value="branch_private">Sadece Kendi Şubem</option>
                <option value="private">Şahsi İlanlarım</option>
                <option value="locked">Kilitli / Rezerveli</option>
              </select>
            </div>

            <div>
              <select
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
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
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 cursor-pointer"
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                >
                  <option value="all">Tüm Şubeler</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {/* Row 3: Compact Segmented Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusTabFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusTabFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              HEPSİ ({totalCount})
            </button>

            <button
              onClick={() => setStatusTabFilter('sale')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusTabFilter === 'sale'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              SATILIK ({saleCount})
            </button>

            <button
              onClick={() => setStatusTabFilter('rent')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusTabFilter === 'rent'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              KİRALIK ({rentCount})
            </button>

            <button
              onClick={() => setStatusTabFilter('optioned')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusTabFilter === 'optioned'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              OPSİYONLU ({optionedCount})
            </button>

            <button
              onClick={() => setStatusTabFilter('sold')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusTabFilter === 'sold'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              SATILDI ({soldCount})
            </button>

            <button
              onClick={() => setStatusTabFilter('rented')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusTabFilter === 'rented'
                  ? 'bg-sky-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              KİRALANDI ({rentedCount})
            </button>
          </div>
        </div>
      )}
    </>
  );
};
