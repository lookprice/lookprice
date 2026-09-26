import React, { useState } from "react";
import {
  TrendingUp,
  Users,
  UserCheck,
  Baby,
  Activity,
  Receipt,
  PieChart,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Filter,
  X
} from "lucide-react";
import { HotelRoom } from "./hotelTypes";

export interface HotelCalendarTabProps {
  calculateAgeBreakdownStats: () => any;
  getAnalizDateRange: () => { start: string; end: string; title: string };
  isTr: boolean;
  analysisPeriod: 'next_7' | 'next_14' | 'next_30' | 'next_60' | 'custom';
  setAnalysisPeriod: (period: 'next_7' | 'next_14' | 'next_30' | 'next_60' | 'custom') => void;
  customAnalizStart: string;
  setCustomAnalizStart: (val: string) => void;
  customAnalizEnd: string;
  setCustomAnalizEnd: (val: string) => void;
  setSelectedAgeCategoryModal: (modal: any) => void;
  calendarStartDate: string;
  setCalendarStartDate: (val: string) => void;
  calendarDaysCount: number;
  setCalendarDaysCount: (count: any) => void;
  rooms: HotelRoom[];
  setSelectedReservationModal: (res: any) => void;
  setCheckInModalRoom: (room: HotelRoom | null) => void;
  setGuestForm: React.Dispatch<React.SetStateAction<any>>;
  getNextDayString: (dateStr: string) => string;
  selectedCalendarRoomId?: string | null;
  setSelectedCalendarRoomId?: (id: string | null) => void;
}

export const HotelCalendarTab: React.FC<HotelCalendarTabProps> = ({
  calculateAgeBreakdownStats,
  getAnalizDateRange,
  isTr,
  analysisPeriod,
  setAnalysisPeriod,
  customAnalizStart,
  setCustomAnalizStart,
  customAnalizEnd,
  setCustomAnalizEnd,
  setSelectedAgeCategoryModal,
  calendarStartDate,
  setCalendarStartDate,
  calendarDaysCount,
  setCalendarDaysCount,
  rooms,
  setSelectedReservationModal,
  setCheckInModalRoom,
  setGuestForm,
  getNextDayString,
  selectedCalendarRoomId,
  setSelectedCalendarRoomId,
}) => {
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [internalRoomFilter, setInternalRoomFilter] = useState<string>('all');

  const activeRoomId = selectedCalendarRoomId !== undefined ? selectedCalendarRoomId : (internalRoomFilter !== 'all' ? internalRoomFilter : null);

  const displayedRooms = activeRoomId
    ? rooms.filter(r => r.id === activeRoomId || r.room_number === activeRoomId)
    : rooms;

  const stats = calculateAgeBreakdownStats();
  const { start, end, title } = getAnalizDateRange();

  // Build array of N dates starting from calendarStartDate
  const daysList: Array<{ dateStr: string; dayNum: number; dayName: string; monthName: string; isWeekend: boolean; isToday: boolean }> = [];
  const baseDate = new Date(calendarStartDate);
  const todayStr = new Date().toISOString().split('T')[0];

  for (let i = 0; i < calendarDaysCount; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    const dayNum = d.getDate();
    const dayIndex = d.getDay();
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    const isToday = dateStr === todayStr;

    const monthNamesTr = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Ekim", "Kas", "Ara"];
    const dayNamesTr = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

    daysList.push({
      dateStr,
      dayNum,
      dayName: dayNamesTr[dayIndex],
      monthName: monthNamesTr[d.getMonth()],
      isWeekend,
      isToday
    });
  }

  return (
    <div className="space-y-4">
      {/* COLLAPSIBLE ANALYTICS BAR & DASHBOARD */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white rounded-2xl p-3 sm:p-4 shadow-md border border-emerald-800/60 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-black text-white">
                  {isTr ? "Gelecek Misafir & Yaş Grubu Analizi" : "Guest & Age Group Distribution"}
                </h2>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                  {title} ({start} ~ {end})
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-emerald-200/90 font-bold flex-wrap">
                <span>👥 Toplam: <strong className="text-white font-black">{stats.totalGuests}</strong> Kişi</span>
                <span className="text-emerald-500">•</span>
                <span>🧑 Yetişkin: <strong className="text-white font-black">{stats.totalAdults}</strong></span>
                <span className="text-emerald-500">•</span>
                <span>👶 Çocuk/Bebek: <strong className="text-white font-black">{stats.totalChildrenAll}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Period Selector Buttons */}
            <div className="flex items-center gap-0.5 bg-white/10 p-0.5 rounded-lg border border-white/15 text-[10px]">
              {[
                { id: 'next_7', label: '7G' },
                { id: 'next_14', label: '14G' },
                { id: 'next_30', label: '30G' },
                { id: 'next_60', label: '60G' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAnalysisPeriod(p.id as any)}
                  className={`px-2 py-0.5 rounded font-black cursor-pointer transition-all ${
                    analysisPeriod === p.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
              className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            >
              <span>{isAnalyticsOpen ? "İstatistikleri Gizle" : "İstatistikleri Göster"}</span>
              {isAnalyticsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* EXPANDABLE DRILLDOWN STATS */}
        {isAnalyticsOpen && (
          <div className="pt-3 mt-3 border-t border-white/15 space-y-3">
            {/* ANALYTICS STAT CARDS GRID - INTERACTIVE DRILLDOWNS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* TOTAL EXPECTED GUESTS */}
              <button
                type="button"
                onClick={() => setSelectedAgeCategoryModal({
                  category: 'all',
                  title: `Tüm Misafir Kayıtları (${title})`,
                  badge: `${stats.totalGuests} Kişi`,
                  guests: stats.guestRecords
                })}
                className="p-2.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-2xs"
                title="Tüm kayıtlı misafir listesini görmek için tıklayın"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase text-emerald-200 tracking-wider">Toplam Misafir</p>
                  <Users className="h-3.5 w-3.5 text-emerald-300" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white">{stats.totalGuests}</span>
                  <span className="text-[10px] font-normal text-emerald-200">Kişi</span>
                </div>
              </button>

              {/* ADULTS */}
              <button
                type="button"
                onClick={() => setSelectedAgeCategoryModal({
                  category: 'adults',
                  title: `Yetişkin Misafir Kayıtları (18+ Yaş) - ${title}`,
                  badge: `${stats.totalAdults} Yetişkin`,
                  guests: stats.adultsList
                })}
                className="p-2.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-2xs"
                title="Yetişkin misafir kayıtlarını görmek için tıklayın"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase text-emerald-200 tracking-wider">18+ Yetişkin</p>
                  <UserCheck className="h-3.5 w-3.5 text-emerald-300" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white">{stats.totalAdults}</span>
                  <span className="text-[10px] font-normal text-emerald-200">Kişi</span>
                </div>
              </button>

              {/* TOTAL CHILDREN & INFANTS */}
              <button
                type="button"
                onClick={() => setSelectedAgeCategoryModal({
                  category: 'children_all',
                  title: `Çocuk ve Bebek Misafir Kayıtları (0-17 Yaş) - ${title}`,
                  badge: `${stats.totalChildrenAll} Çocuk/Bebek`,
                  guests: stats.childrenAllList
                })}
                className="p-2.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-2xs"
                title="Tüm çocuk kayıtlarını incelemek için tıklayın"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase text-emerald-200 tracking-wider">0-17 Çocuk & Bebek</p>
                  <Baby className="h-3.5 w-3.5 text-emerald-300" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white">{stats.totalChildrenAll}</span>
                  <span className="text-[10px] font-normal text-emerald-200">Kişi</span>
                </div>
              </button>

              {/* INFANTS */}
              <button
                type="button"
                onClick={() => setSelectedAgeCategoryModal({
                  category: 'infants',
                  title: `Bebek Misafir Kayıtları (0-2 Yaş) - ${title}`,
                  badge: `${stats.infants} Bebek`,
                  guests: stats.infantsList
                })}
                className="p-2.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-2xs"
                title="Bebek kayıtlarını incelemek için tıklayın"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase text-emerald-200 tracking-wider">0-2 Bebek</p>
                  <span className="text-[9px] font-bold text-emerald-300">%100 İnd.</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white">{stats.infants}</span>
                  <span className="text-[10px] font-normal text-emerald-200">Bebek</span>
                </div>
              </button>

              {/* TODDLERS */}
              <button
                type="button"
                onClick={() => setSelectedAgeCategoryModal({
                  category: 'toddlers',
                  title: `Küçük Çocuk Misafir Kayıtları (3-6 Yaş) - ${title}`,
                  badge: `${stats.toddlers} Çocuk`,
                  guests: stats.toddlersList
                })}
                className="p-2.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-2xs"
                title="3-6 Yaş kayıtlarını incelemek için tıklayın"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase text-emerald-200 tracking-wider">3-6 Çocuk</p>
                  <span className="text-[9px] font-bold text-emerald-300">%50 İnd.</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white">{stats.toddlers}</span>
                  <span className="text-[10px] font-normal text-emerald-200">Çocuk</span>
                </div>
              </button>

              {/* SCHOOL TEENS */}
              <button
                type="button"
                onClick={() => setSelectedAgeCategoryModal({
                  category: 'school_teens',
                  title: `Okul & Genç Misafir Kayıtları (7-17 Yaş) - ${title}`,
                  badge: `${stats.schoolTeens} Genç`,
                  guests: stats.schoolTeensList
                })}
                className="p-2.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-2xs"
                title="7-17 Yaş kayıtlarını incelemek için tıklayın"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase text-emerald-200 tracking-wider">7-17 Genç</p>
                  <span className="text-[9px] font-bold text-emerald-300">Standart</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white">{stats.schoolTeens}</span>
                  <span className="text-[10px] font-normal text-emerald-200">Genç</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
      {/* 60-DAY INTERACTIVE RESERVATION GANTT BOARD */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border-2 border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-w-full overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm shrink-0">
              <CalendarRange className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                60 Günlük Müsaitlik & Doluluk Takvimi (Rezervasyon Board)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Oda bazlı günlük müsaitlik durumu. Dolu günlerin üzerine tıklayarak misafir ve yaş detaylarını görebilirsiniz.
              </p>
            </div>
          </div>

          {/* BOARD DATE CONTROL BUTTONS */}
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(calendarStartDate);
                  d.setDate(d.getDate() - 15);
                  setCalendarStartDate(d.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                title="Önceki 15 Gün"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Önceki 15 Gün</span>
                <span className="xs:hidden sm:hidden">-15 Gün</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarStartDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-black cursor-pointer shadow-xs shrink-0"
              >
                Bugün
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date(calendarStartDate);
                  d.setDate(d.getDate() + 15);
                  setCalendarStartDate(d.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1 flex-1 sm:flex-initial"
                title="Sonraki 15 Gün"
              >
                <span className="hidden xs:inline sm:inline">Sonraki 15 Gün</span>
                <span className="xs:hidden sm:hidden">+15 Gün</span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            </div>

            {/* ODA SEÇİM FİLTRESİ */}
            <div className="w-full sm:w-auto">
              <select
                value={activeRoomId || 'all'}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? null : e.target.value;
                  if (setSelectedCalendarRoomId) setSelectedCalendarRoomId(val);
                  setInternalRoomFilter(e.target.value);
                }}
                className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="all">Tüm Odalar ({rooms.length})</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Oda #{r.room_number} ({r.room_type})</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={calendarDaysCount}
                onChange={(e) => setCalendarDaysCount(Number(e.target.value) as any)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value={30}>30 Gün Göster (1 Ay)</option>
                <option value={60}>60 Gün Göster (2 Ay)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTIVE ROOM FILTER BANNER */}
        {activeRoomId && (
          <div className="flex items-center justify-between p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-xs">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Görüntülenen Oda: <strong>Oda #{rooms.find(r => r.id === activeRoomId || r.room_number === activeRoomId)?.room_number}</strong> ({rooms.find(r => r.id === activeRoomId || r.room_number === activeRoomId)?.room_type})</span>
            </span>
            <button
              type="button"
              onClick={() => {
                if (setSelectedCalendarRoomId) setSelectedCalendarRoomId(null);
                setInternalRoomFilter('all');
              }}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[10px] font-black text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <X className="h-3 w-3" />
              <span>Tüm Odaları Göster ({rooms.length})</span>
            </button>
          </div>
        )}

        {/* LEGEND COLOR BAR */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-emerald-500 rounded-md"></div>
            <span>Boş & Müsait (Tıkla -&gt; Giriş Yap)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-rose-600 rounded-md"></div>
            <span>Konaklayan / Dolu Misafir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-amber-500 rounded-md"></div>
            <span>Gelecek Rezervasyon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-slate-400 rounded-md"></div>
            <span>Tadilatta / Servis Dışı</span>
          </div>
        </div>

        {/* HORIZONTAL SCROLLABLE GANTT GRID */}
        <div className="overflow-x-auto border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner max-h-[600px] overflow-y-auto w-full max-w-full">
          <table className="w-full text-left border-collapse min-w-[1800px]">
            {/* CALENDAR HEADER ROW */}
            <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-20 border-b-2 border-slate-300 dark:border-slate-700">
              <tr>
                {/* Sticky Left Room Column Header */}
                <th className="p-3 w-48 bg-slate-200 dark:bg-slate-900 sticky left-0 z-30 font-black text-xs text-slate-900 dark:text-slate-100 border-r-2 border-slate-300 dark:border-slate-700 shadow-md">
                  Oda No
                </th>

                {/* Days Header Columns */}
                {daysList.map(d => (
                  <th
                    key={d.dateStr}
                    className={`p-1.5 text-center w-12 border-r border-slate-200 dark:border-slate-700/80 ${
                      d.isToday 
                        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-500' 
                        : d.isWeekend 
                        ? 'bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold' 
                        : 'text-slate-700 dark:text-slate-300 font-bold'
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-tighter opacity-80">{d.monthName}</div>
                    <div className="text-xs font-black">{d.dayNum}</div>
                    <div className="text-[9px] uppercase font-bold opacity-75">{d.dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* ROOM ROWS */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {displayedRooms.map(room => (
                <tr key={room.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Sticky Left Room Cell */}
                  <td className="p-3 bg-white dark:bg-slate-900 sticky left-0 z-10 border-r-2 border-slate-300 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900 dark:text-white">#{room.room_number}</span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {room.capacity} Kişi
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">{room.room_type}</p>
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 mt-0.5">₺{(room.price_per_night || 2500).toLocaleString('tr-TR')}/gece</p>
                  </td>

                  {/* Calendar Day Cells */}
                  {daysList.map(d => {
                    if (room.status === 'maintenance' || room.status === 'staff' || room.status === 'disabled') {
                      return (
                        <td key={d.dateStr} className="p-1 border-r border-slate-200 dark:border-slate-800 bg-slate-200/60 dark:bg-slate-800/60 text-center">
                          <span className="text-[10px] font-bold text-slate-400">N/A</span>
                        </td>
                      );
                    }

                    const isCurrentGuestStay = room.status === 'occupied' && 
                      room.current_guest && 
                      room.current_guest.check_in_date <= d.dateStr && 
                      room.current_guest.check_out_date > d.dateStr;

                    const reservationMatch = room.reservations?.find(r => r.check_in_date <= d.dateStr && r.check_out_date > d.dateStr);

                    if (isCurrentGuestStay && room.current_guest) {
                      const cg = room.current_guest;
                      const addCount = room.additional_guests?.length || 0;
                      
                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => {
                            setSelectedReservationModal({
                              room,
                              res: {
                                id: cg.id,
                                identity_no: cg.identity_no,
                                first_name: cg.first_name,
                                last_name: cg.last_name,
                                phone: cg.phone,
                                check_in_date: cg.check_in_date,
                                check_out_date: cg.check_out_date,
                                board_type: (cg.board_type as any) || 'BB',
                                main_guest_age: cg.age,
                                guests: room.additional_guests?.map(ag => ({
                                  first_name: ag.first_name,
                                  last_name: ag.last_name,
                                  age: ag.age,
                                  birth_date: ag.birth_date
                                }))
                              }
                            });
                          }}
                          className="p-1 border-r border-slate-200 dark:border-slate-800 bg-rose-600 text-white cursor-pointer hover:opacity-90 transition-all text-center"
                          title={`${cg.first_name} ${cg.last_name} (${cg.check_in_date} ~ ${cg.check_out_date})`}
                        >
                          <div className="text-[10px] font-black truncate leading-tight">{cg.first_name[0]}. {cg.last_name}</div>
                          <div className="text-[8px] font-bold opacity-90">{addCount > 0 ? `1Y+${addCount}Ç` : '1 Yetişkin'}</div>
                        </td>
                      );
                    }

                    if (reservationMatch) {
                      const addCount = reservationMatch.guests?.length || 0;
                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => setSelectedReservationModal({ room, res: reservationMatch })}
                          className="p-1 border-r border-slate-200 dark:border-slate-800 bg-amber-500 text-slate-950 cursor-pointer hover:opacity-90 transition-all text-center"
                          title={`Gelecek Rezervasyon: ${reservationMatch.first_name} ${reservationMatch.last_name}`}
                        >
                          <div className="text-[10px] font-black truncate leading-tight">{reservationMatch.first_name[0]}. {reservationMatch.last_name}</div>
                          <div className="text-[8px] font-extrabold opacity-90">{addCount > 0 ? `1Y+${addCount}Ç` : '1 Yetişkin'}</div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={d.dateStr}
                        onClick={() => {
                          setCheckInModalRoom(room);
                          setGuestForm(prev => ({
                            ...prev,
                            check_in_date: d.dateStr,
                            check_out_date: getNextDayString(d.dateStr)
                          }));
                        }}
                        className="p-1 border-r border-slate-200 dark:border-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer text-center group transition-colors"
                        title={`Oda #${room.room_number} (${d.dateStr}) - Tıkla & Giriş Yap`}
                      >
                        <Plus className="h-3.5 w-3.5 mx-auto text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
