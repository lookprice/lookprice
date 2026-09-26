import React from "react";
import {
  Users,
  Printer,
  Settings2,
  Search,
  X,
  Hotel,
  Info,
  Receipt
} from "lucide-react";
import { formatBoardType } from "./hotelTypes";

export interface HotelGuestsTabProps {
  calculateAgeBreakdownStats: () => any;
  guestListCategoryFilter: string;
  setGuestListCategoryFilter: (cat: any) => void;
  guestListSearch: string;
  setGuestListSearch: (val: string) => void;
  handlePrintKbsManifest: () => void;
  setIsAgePolicyModalOpen: (open: boolean) => void;
  formatDisplayDate: (dateStr: string | null | undefined) => string;
  setInspectGuestModal: (guest: any) => void;
  setCheckOutModalRoom: (room: any) => void;
}

export const HotelGuestsTab: React.FC<HotelGuestsTabProps> = ({
  calculateAgeBreakdownStats,
  guestListCategoryFilter,
  setGuestListCategoryFilter,
  guestListSearch,
  setGuestListSearch,
  handlePrintKbsManifest,
  setIsAgePolicyModalOpen,
  formatDisplayDate,
  setInspectGuestModal,
  setCheckOutModalRoom,
}) => {
  const stats = calculateAgeBreakdownStats();
  let filteredGuests = Array.isArray(stats?.guestRecords) ? stats.guestRecords : [];

  // Apply Category Filter Chip
  if (guestListCategoryFilter === 'adults') {
    filteredGuests = filteredGuests.filter(g => g && g.age >= 18);
  } else if (guestListCategoryFilter === 'children_all') {
    filteredGuests = filteredGuests.filter(g => g && g.age < 18);
  } else if (guestListCategoryFilter === 'infants') {
    filteredGuests = filteredGuests.filter(g => g && g.age <= 2);
  } else if (guestListCategoryFilter === 'toddlers') {
    filteredGuests = filteredGuests.filter(g => g && g.age >= 3 && g.age <= 6);
  } else if (guestListCategoryFilter === 'school_teens') {
    filteredGuests = filteredGuests.filter(g => g && g.age >= 7 && g.age <= 17);
  } else if (guestListCategoryFilter === 'occupied_only') {
    filteredGuests = filteredGuests.filter(g => g && g.room_status === 'occupied');
  }

  // Apply Search Text
  if (guestListSearch.trim()) {
    const q = guestListSearch.toLowerCase().trim();
    filteredGuests = filteredGuests.filter(g => 
      g && (
        (g.full_name || '').toLowerCase().includes(q) ||
        (g.room_number || '').toLowerCase().includes(q) ||
        (g.room_type || '').toLowerCase().includes(q) ||
        (g.identity_no && (g.identity_no || '').toLowerCase().includes(q)) ||
        (g.phone && (g.phone || '').toLowerCase().includes(q))
      )
    );
  }

  // Sort guests so that occupants of the same room stay grouped together with adults first
  const sortedGuests = [...filteredGuests].sort((a, b) => {
    const roomA = String(a?.room_number || '');
    const roomB = String(b?.room_number || '');
    if (roomA !== roomB) {
      return roomA.localeCompare(roomB, undefined, { numeric: true });
    }
    return (b?.age || 0) - (a?.age || 0);
  });

  // Clean corporate theme for room separation
  const getRoomTheme = (_roomNumber: string | number) => {
    return {
      rowBg: 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60',
      leftBorder: 'border-l-4 border-l-emerald-600 dark:border-l-emerald-500',
      badgeBg: 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs',
    };
  };

  return (
    <div className="space-y-6">
      {/* TOP ROSTER HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md space-y-4 border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
              <Users className="h-7 w-7 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Konaklayan Misafirler & Yaş Dökümü</h2>
                <span className="px-2 py-0.5 bg-emerald-400 text-slate-950 rounded-md text-xs font-bold">
                  {stats.totalGuests} Misafir
                </span>
              </div>
              <p className="text-xs text-emerald-100/70 font-medium">
                Oteldeki aktif konaklayan misafirler, ek kişiler, bebek ve çocukların tüm kimlik, oda ve folyo detayları
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrintKbsManifest()}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>KBS Bildirim Listesi</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAgePolicyModalOpen(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs backdrop-blur-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Settings2 className="h-4 w-4 text-emerald-300" />
              <span>Yaş & İndirim Politikası</span>
            </button>
          </div>
        </div>

        {/* QUICK STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          <div 
            onClick={() => setGuestListCategoryFilter('all')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${guestListCategoryFilter === 'all' ? 'bg-white text-slate-900 border-emerald-400 font-bold ring-2 ring-emerald-300 shadow-xs' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'}`}
          >
            <p className="text-[10px] uppercase font-bold text-emerald-200">Toplam Misafir</p>
            <p className="text-xl font-black">{stats.totalGuests} <span className="text-xs font-normal opacity-80">Kişi</span></p>
          </div>
          <div 
            onClick={() => setGuestListCategoryFilter('adults')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${guestListCategoryFilter === 'adults' ? 'bg-white text-slate-900 border-emerald-400 font-bold ring-2 ring-emerald-300 shadow-xs' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'}`}
          >
            <p className="text-[10px] uppercase font-bold text-emerald-200">18+ Yetişkin</p>
            <p className="text-xl font-black">{stats.totalAdults} <span className="text-xs font-normal opacity-80">Kişi</span></p>
          </div>
          <div 
            onClick={() => setGuestListCategoryFilter('children_all')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${guestListCategoryFilter === 'children_all' ? 'bg-white text-slate-900 border-emerald-400 font-bold ring-2 ring-emerald-300 shadow-xs' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'}`}
          >
            <p className="text-[10px] uppercase font-bold text-emerald-200">0-17 Çocuk & Bebek</p>
            <p className="text-xl font-black">{stats.totalChildrenAll} <span className="text-xs font-normal opacity-80">Kişi</span></p>
          </div>
          <div 
            onClick={() => setGuestListCategoryFilter('infants')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${guestListCategoryFilter === 'infants' ? 'bg-white text-slate-900 border-emerald-400 font-bold ring-2 ring-emerald-300 shadow-xs' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'}`}
          >
            <p className="text-[10px] uppercase font-bold text-emerald-200">0-2 Yaş</p>
            <p className="text-xl font-black">{stats.totalInfants} <span className="text-xs font-normal opacity-80">Kişi</span></p>
          </div>
          <div 
            onClick={() => setGuestListCategoryFilter('toddlers')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${guestListCategoryFilter === 'toddlers' ? 'bg-white text-slate-900 border-emerald-400 font-bold ring-2 ring-emerald-300 shadow-xs' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'}`}
          >
            <p className="text-[10px] uppercase font-bold text-emerald-200">3-6 Yaş</p>
            <p className="text-xl font-black">{stats.totalToddlers} <span className="text-xs font-normal opacity-80">Kişi</span></p>
          </div>
          <div 
            onClick={() => setGuestListCategoryFilter('school_teens')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${guestListCategoryFilter === 'school_teens' ? 'bg-white text-slate-900 border-emerald-400 font-bold ring-2 ring-emerald-300 shadow-xs' : 'bg-white/10 text-white border-white/15 hover:bg-white/15'}`}
          >
            <p className="text-[10px] uppercase font-bold text-emerald-200">7-17 Yaş</p>
            <p className="text-xl font-black">{stats.totalChildren + stats.totalTeens} <span className="text-xs font-normal opacity-80">Kişi</span></p>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Misafir adı, oda no, T.C./Kimlik veya telefon ile ara..."
            value={guestListSearch}
            onChange={(e) => setGuestListSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {guestListSearch && (
            <button 
              onClick={() => setGuestListSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setGuestListCategoryFilter(guestListCategoryFilter === 'occupied_only' ? 'all' : 'occupied_only')}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${guestListCategoryFilter === 'occupied_only' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            <Hotel className="h-3.5 w-3.5" />
            <span>Sadece Şu An Otelde Kalanlar</span>
          </button>
        </div>
      </div>

      {/* GUEST LIST TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-3.5">Oda No</th>
                <th className="p-3.5">Misafir Adı & Rolü</th>
                <th className="p-3.5">Yaş & Kategori</th>
                <th className="p-3.5">Doğum Tarihi</th>
                <th className="p-3.5">T.C. / Kimlik</th>
                <th className="p-3.5">Telefon</th>
                <th className="p-3.5">Giriş - Çıkış</th>
                <th className="p-3.5">Pansiyon</th>
                <th className="p-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {(sortedGuests?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-bold">
                    {guestListSearch ? 'Arama kriterlerine uygun misafir kaydı bulunamadı.' : 'Kayıtlı misafir bulunmuyor.'}
                  </td>
                </tr>
              ) : (
                (sortedGuests || []).map((g) => {
                  const theme = getRoomTheme(g.room_number);
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isStayingToday = g.room_status === 'occupied' && (!g.check_in_date || g.check_in_date <= todayStr) && (!g.check_out_date || g.check_out_date >= todayStr);
                  
                  return (
                    <tr key={g.id} className={`${theme.rowBg} ${theme.leftBorder} border-b border-slate-200/60 dark:border-slate-800/80 transition-colors`}>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 ${theme.badgeBg} rounded-lg font-black text-xs shrink-0`}>
                            Oda #{g.room_number}
                          </span>
                          <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isStayingToday ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                            {isStayingToday ? '🟢 Konaklıyor' : '🟡 Gelecek Rezervasyon'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <p className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{g.full_name}</span>
                        </p>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {g.role_label}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-black text-xs ${
                            g.age <= 2 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200' 
                              : g.age <= 6 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                              : g.age <= 17 
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200' 
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}>
                            {g.age} Yaş • {g.age_category_label}
                          </span>
                          {g.discount_text && (
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              {g.discount_text}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                        {g.birth_date ? formatDisplayDate(g.birth_date) : '-'}
                      </td>

                      <td className="p-3.5 font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">
                        {g.identity_no || '-'}
                      </td>

                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-bold">
                        {g.phone || '-'}
                      </td>

                      <td className="p-3.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <div className="space-y-0.5">
                          <p className="text-emerald-600 dark:text-emerald-400">Giriş: {formatDisplayDate(g.check_in_date)}</p>
                          <p className="text-rose-600 dark:text-rose-400">Çıkış: {formatDisplayDate(g.check_out_date)}</p>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded font-black text-xs border border-indigo-200 dark:border-indigo-800">
                          {formatBoardType(g.board_type)}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectGuestModal(g)}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl font-black text-xs flex items-center gap-1 cursor-pointer transition-all"
                            title="Tüm Misafir Detaylarını & Künyesini Gör"
                          >
                            <Info className="h-3.5 w-3.5" />
                            <span>Detay</span>
                          </button>

                          {isStayingToday && g.age >= 18 && (
                            <button
                              type="button"
                              onClick={() => setCheckOutModalRoom(g.room)}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-all active:scale-95"
                              title="Oda Foliosunu Kapat ve Çıkış Yap"
                            >
                              <Receipt className="h-3.5 w-3.5" />
                              <span>Folyo & Çıkış</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
