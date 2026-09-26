import React from "react";
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
  Plus
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
}) => {
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
    <div className="space-y-6">
      {/* ANALYTICS CONTROL & AGE GROUP SUMMARY SECTION */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md space-y-5 max-w-full overflow-hidden border border-emerald-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/15 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-300 shrink-0" />
              <span>{isTr ? "Gelecek Misafir & Yaş Grubu Dağılımı" : "Guest & Age Group Distribution"}</span>
            </h2>
            <p className="text-xs text-emerald-100/70 font-medium mt-0.5">
              {isTr 
                ? `Seçilen dönem (${title}: ${start} ~ ${end}) yaş kırılımları ve oda doluluk analizi` 
                : `Guest age categories and occupancy for selected period (${title})`}
            </p>
          </div>

          {/* PERIOD SELECTOR BUTTONS */}
          <div className="flex flex-wrap items-center gap-1 bg-white/10 backdrop-blur-xs p-1 rounded-xl border border-white/15 w-full md:w-auto">
            {[
              { id: 'next_7', label: isTr ? '7 Gün' : '7 Days' },
              { id: 'next_14', label: isTr ? '14 Gün' : '14 Days' },
              { id: 'next_30', label: isTr ? '30 Gün' : '30 Days' },
              { id: 'next_60', label: isTr ? '60 Gün' : '60 Days' },
              { id: 'custom', label: isTr ? 'Özel' : 'Custom' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setAnalysisPeriod(p.id as any)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial text-center whitespace-nowrap ${
                  analysisPeriod === p.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* CUSTOM DATE INPUTS IF CUSTOM SELECTED */}
        {analysisPeriod === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/15">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-100">Başlangıç:</span>
              <input
                type="date"
                value={customAnalizStart}
                onChange={(e) => setCustomAnalizStart(e.target.value)}
                className="px-3 py-1.5 bg-slate-900/80 border border-white/20 rounded-lg text-xs font-bold text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-100">Bitiş:</span>
              <input
                type="date"
                value={customAnalizEnd}
                onChange={(e) => setCustomAnalizEnd(e.target.value)}
                className="px-3 py-1.5 bg-slate-900/80 border border-white/20 rounded-lg text-xs font-bold text-white"
              />
            </div>
          </div>
        )}

        {/* ANALYTICS STAT CARDS GRID - INTERACTIVE DRILLDOWNS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* TOTAL EXPECTED GUESTS */}
          <button
            type="button"
            onClick={() => setSelectedAgeCategoryModal({
              category: 'all',
              title: `Tüm Misafir Kayıtları (${title})`,
              badge: `${stats.totalGuests} Kişi`,
              guests: stats.guestRecords
            })}
            className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-xs"
            title="Tüm kayıtlı misafir listesini görmek için tıklayın"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase text-emerald-200 tracking-wider">Toplam Misafir</p>
              <Users className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{stats.totalGuests}</span>
              <span className="text-xs font-normal text-emerald-200">Kişi</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">({title})</p>
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
            className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-xs"
            title="Yetişkin misafir kayıtlarını görmek için tıklayın"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase text-emerald-200 tracking-wider">18+ Yetişkin</p>
              <UserCheck className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{stats.totalAdults}</span>
              <span className="text-xs font-normal text-emerald-200">Kişi</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">Yetişkin Kayıtları</p>
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
            className="p-3.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-xs"
            title="Tüm çocuk kayıtlarını incelemek için tıklayın"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase text-emerald-200 tracking-wider">0-17 Çocuk & Bebek</p>
              <Baby className="h-4 w-4 text-emerald-300" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{stats.totalChildrenAll}</span>
              <span className="text-xs font-normal text-emerald-200">Kişi</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">Tüm Çocuklar</p>
          </button>

          {/* AGE BREAKDOWN DETAIL ITEM 1: INFANTS (0-2 YRS) */}
          <button
            type="button"
            onClick={() => setSelectedAgeCategoryModal({
              category: 'infants',
              title: `0 - 2 Yaş Misafir Listesi - ${title}`,
              badge: `${stats.totalInfants} Kişi (Ücretsiz)`,
              guests: stats.infantsList
            })}
            className="p-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-xs"
            title="0-2 yaş kayıtlarını incelemek için tıklayın"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase text-emerald-200 tracking-wider">0-2 Yaş</p>
              <span className="px-1.5 py-0.5 bg-white/20 text-white rounded text-[9px] font-bold">Ücretsiz</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white">{stats.totalInfants}</span>
              <span className="text-xs font-normal text-emerald-200">Kişi</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">%100 İndirim</p>
          </button>

          {/* AGE BREAKDOWN DETAIL ITEM 2: TODDLERS (3-6 YRS) */}
          <button
            type="button"
            onClick={() => setSelectedAgeCategoryModal({
              category: 'toddlers',
              title: `3 - 6 Yaş Misafir Listesi - ${title}`,
              badge: `${stats.totalToddlers} Kişi`,
              guests: stats.toddlersList
            })}
            className="p-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-xs"
            title="3-6 yaş kayıtlarını incelemek için tıklayın"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase text-emerald-200 tracking-wider">3-6 Yaş</p>
              <span className="px-1.5 py-0.5 bg-white/20 text-white rounded text-[9px] font-bold">İndirimli</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white">{stats.totalToddlers}</span>
              <span className="text-xs font-normal text-emerald-200">Kişi</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">Okul Öncesi</p>
          </button>

          {/* AGE BREAKDOWN DETAIL ITEM 3: SCHOOL AGE (7-12 YRS & TEENS) */}
          <button
            type="button"
            onClick={() => setSelectedAgeCategoryModal({
              category: 'school_age',
              title: `7 - 17 Yaş Misafir Listesi - ${title}`,
              badge: `${stats.totalChildren + stats.totalTeens} Kişi`,
              guests: stats.schoolAgeList
            })}
            className="p-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl space-y-1 text-left transition-all cursor-pointer group shadow-xs"
            title="7-17 yaş misafir kayıtlarını incelemek için tıklayın"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase text-emerald-200 tracking-wider">7-17 Yaş</p>
              <span className="px-1.5 py-0.5 bg-white/20 text-white rounded text-[9px] font-bold">%50</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white">{stats.totalChildren + stats.totalTeens}</span>
              <span className="text-xs font-normal text-emerald-200">Kişi</span>
            </div>
            <p className="text-[10px] text-white/70 font-medium">Öğrenci & Genç</p>
          </button>
        </div>

        {/* ESTIMATED OCCUPANCY & REVENUE SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-200">Dönem Doluluk Oranı</p>
              <p className="text-2xl font-black text-white">%{stats.occupancyPercentage}</p>
            </div>
            <Activity className="h-7 w-7 text-emerald-300" />
          </div>

          <div className="p-3.5 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-200">Tahmini Dönem Oda Geliri</p>
              <p className="text-2xl font-black text-white">₺{stats.estimatedRevenue.toLocaleString('tr-TR')}</p>
            </div>
            <Receipt className="h-7 w-7 text-emerald-300" />
          </div>

          <div className="p-3.5 bg-white/10 backdrop-blur-xs border border-white/15 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-200">Pansiyon Dağılımı</p>
              <div className="flex flex-col gap-1 mt-2 min-w-[140px]">
                {Object.entries({
                  RO: isTr ? "Sadece Oda" : "Room Only",
                  BB: isTr ? "Oda Kahvaltı" : "Bed & Breakfast",
                  HB: isTr ? "Yarım Pansiyon" : "Half Board",
                  FB: isTr ? "Tam Pansiyon" : "Full Board",
                  AI: isTr ? "Her Şey Dahil" : "All Inclusive",
                  UAI: isTr ? "Ultra Her Şey" : "Ultra All Inc."
                }).map(([key, label]) => {
                  const count = stats.boardCounts[key] || 0;
                  if (count === 0) return null;
                  return (
                    <div key={key} className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 border border-white/15 rounded text-white font-bold text-[10px] justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-emerald-300 font-black text-[9px]">{key}</span>
                        <span className="text-white/60">•</span>
                        <span className="text-[9px] font-medium text-white/90">{label}</span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded text-[9px] font-black">{count} Oda</span>
                    </div>
                  );
                })}
                {Object.values(stats.boardCounts).reduce((a: number, b: any) => a + Number(b), 0) === 0 && (
                  <p className="text-[9px] text-white/50 italic font-medium">Aktif kayıt bulunmuyor</p>
                )}
              </div>
            </div>
            <PieChart className="h-7 w-7 text-emerald-300 self-start mt-1" />
          </div>
        </div>
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
                  Oda No / Tipi
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
              {rooms.map(room => (
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
