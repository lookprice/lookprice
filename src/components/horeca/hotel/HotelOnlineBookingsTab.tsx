import React from "react";
import {
  Bell,
  UserCheck,
  CheckCircle2,
  CalendarRange,
  CreditCard,
  Search,
  Phone,
  Mail,
  Calendar,
  BedDouble,
  FileText,
  Eye,
  CheckCheck,
  XCircle,
  RefreshCw,
  Users
} from "lucide-react";
import { HotelRoom } from "./hotelTypes";

export interface HotelOnlineBookingsTabProps {
  onlineReservations: any[];
  loadingReservations: boolean;
  fetchOnlineReservations: () => void;
  onlineReservationSearch: string;
  setOnlineReservationSearch: (val: string) => void;
  onlineReservationFilter: 'all' | 'pending_action' | 'checked_in' | 'confirmed' | 'cancelled';
  setOnlineReservationFilter: (val: 'all' | 'pending_action' | 'checked_in' | 'confirmed' | 'cancelled') => void;
  formatThousand: (val: number | string | undefined | null) => string;
  formatDisplayDate: (val: string | undefined | null) => string;
  isTr: boolean;
  rooms: HotelRoom[];
  setSelectedOnlineResModal: (res: any) => void;
  handleCheckInOnlineReservation: (res: any) => void;
  handleConfirmOnlineReservation: (res: any) => void;
  handleAcknowledgeOnlineReservation: (res: any) => void;
  handleCancelOnlineReservation: (res: any) => void;
  setActiveViewMode: (mode: 'grid' | 'calendar' | 'guests' | 'online_reservations') => void;
  setSelectedRoomDetailModal: (room: HotelRoom | null) => void;
}

export const HotelOnlineBookingsTab: React.FC<HotelOnlineBookingsTabProps> = ({
  onlineReservations,
  loadingReservations,
  fetchOnlineReservations,
  onlineReservationSearch,
  setOnlineReservationSearch,
  onlineReservationFilter,
  setOnlineReservationFilter,
  formatThousand,
  formatDisplayDate,
  isTr,
  rooms,
  setSelectedOnlineResModal,
  handleCheckInOnlineReservation,
  handleConfirmOnlineReservation,
  handleAcknowledgeOnlineReservation,
  handleCancelOnlineReservation,
  setActiveViewMode,
  setSelectedRoomDetailModal,
}) => {
  let list = [...(onlineReservations || [])];

  if (onlineReservationFilter !== 'all') {
    list = list.filter(r => r?.status === onlineReservationFilter);
  }

  if (onlineReservationSearch && onlineReservationSearch.trim()) {
    const s = onlineReservationSearch.toLowerCase();
    list = list.filter(r => {
      if (!r) return false;
      const name = `${r.guest_first_name || ''} ${r.guest_last_name || ''} ${r.guest_name || ''}`.toLowerCase();
      const phone = (r.guest_phone || '').toLowerCase();
      const code = (r.reservation_code || '').toLowerCase();
      const roomNo = (r.room_number || '').toLowerCase();
      const idNo = (r.guest_identity_no || '').toLowerCase();
      return name.includes(s) || phone.includes(s) || code.includes(s) || roomNo.includes(s) || idNo.includes(s);
    });
  }

  const pendingCount = (onlineReservations || []).filter(r => r?.status === 'pending_action').length;
  const checkedInCount = (onlineReservations || []).filter(r => r?.status === 'checked_in').length;
  const confirmedCount = (onlineReservations || []).filter(r => r?.status === 'confirmed').length;
  const cancelledCount = (onlineReservations || []).filter(r => r?.status === 'cancelled').length;
  const totalRev = (onlineReservations || [])
    .filter(r => r?.status !== 'cancelled')
    .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* TOP HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0">
            🔔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {isTr ? "Web Rezervasyon Talepleri & Çevrim İçi Bildirimler" : "Online Web Booking Inquiries"}
              </h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 bg-rose-600 text-white font-black text-xs rounded-full animate-pulse shadow-xs">
                  {pendingCount} {isTr ? "Bekleyen" : "Pending"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isTr 
                ? "Otel web siteniz üzerinden gelen rezervasyon talepleri, misafir iletişim bilgileri ve oda tahsis yönetimi." 
                : "Manage online room bookings, assign rooms, and complete guest check-ins."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => fetchOnlineReservations()}
            disabled={loadingReservations}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-500 ${loadingReservations ? 'animate-spin' : ''}`} />
            <span>{isTr ? "Yenile" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => setOnlineReservationFilter('pending_action')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
            onlineReservationFilter === 'pending_action'
              ? 'bg-amber-500 text-slate-950 border-amber-600 ring-2 ring-amber-400 shadow-md'
              : 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 hover:bg-amber-500/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wider">
              {isTr ? "Aksiyon Bekleyen" : "Pending Action"}
            </p>
            {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black">{pendingCount}</span>
            <Bell className="h-5 w-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setOnlineReservationFilter('checked_in')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
            onlineReservationFilter === 'checked_in'
              ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-300'
          }`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            {isTr ? "Check-In Yapılan" : "Checked-In"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{checkedInCount}</span>
            <UserCheck className="h-5 w-5 text-emerald-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setOnlineReservationFilter('confirmed')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
            onlineReservationFilter === 'confirmed'
              ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300'
          }`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            {isTr ? "Onaylananlar" : "Confirmed"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{confirmedCount}</span>
            <CheckCircle2 className="h-5 w-5 text-indigo-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setOnlineReservationFilter('all')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
            onlineReservationFilter === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-2 ring-slate-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-400'
          }`}
        >
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            {isTr ? "Toplam Talep" : "Total Requests"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{(onlineReservations || []).length}</span>
            <CalendarRange className="h-5 w-5 text-slate-400" />
          </div>
        </button>

        <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase text-indigo-300 tracking-wider">
            {isTr ? "Rezervasyon Hacmi" : "Total Volume"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-emerald-400">₺{formatThousand(totalRev)}</span>
            <CreditCard className="h-5 w-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={isTr ? "Rezervasyon kodu, misafir adı, telefon, TC veya oda no ile ara..." : "Search by code, guest name, phone, TC, room..."}
            value={onlineReservationSearch}
            onChange={(e) => setOnlineReservationSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setOnlineReservationFilter('pending_action')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all whitespace-nowrap cursor-pointer ${
              onlineReservationFilter === 'pending_action'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {isTr ? "🔔 Bekleyenler" : "Pending"} ({pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setOnlineReservationFilter('checked_in')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all whitespace-nowrap cursor-pointer ${
              onlineReservationFilter === 'checked_in'
                ? 'bg-emerald-600 text-white font-black shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {isTr ? "🟢 Check-In" : "Checked-In"} ({checkedInCount})
          </button>

          <button
            type="button"
            onClick={() => setOnlineReservationFilter('confirmed')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all whitespace-nowrap cursor-pointer ${
              onlineReservationFilter === 'confirmed'
                ? 'bg-indigo-600 text-white font-black shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {isTr ? "🔵 Onaylananlar" : "Confirmed"} ({confirmedCount})
          </button>

          <button
            type="button"
            onClick={() => setOnlineReservationFilter('cancelled')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all whitespace-nowrap cursor-pointer ${
              onlineReservationFilter === 'cancelled'
                ? 'bg-rose-600 text-white font-black shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {isTr ? "⚪ İptaller" : "Cancelled"} ({cancelledCount})
          </button>

          <button
            type="button"
            onClick={() => setOnlineReservationFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all whitespace-nowrap cursor-pointer ${
              onlineReservationFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {isTr ? "Tümü" : "All"} ({(onlineReservations || []).length})
          </button>
        </div>
      </div>

      {/* RESERVATIONS LIST */}
      {list.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-3xl">
            📭
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
            {isTr ? "Rezervasyon Kaydı Bulunamadı" : "No Reservations Found"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isTr 
              ? "Seçili filtre kriterlerine uygun web rezervasyonu bulunmuyor. Web sitenizden yeni bir rezervasyon yapıldığında burada anında listelenecek ve sesli uyarı verilecektir." 
              : "No online booking requests match the current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((res: any) => {
            const isPending = res.status === 'pending_action';
            const isCheckedIn = res.status === 'checked_in';
            const isConfirmed = res.status === 'confirmed';
            const isCancelled = res.status === 'cancelled';

            const matchedRoom = rooms.find(r => r.id === res.room_id || (r.room_number && r.room_number === res.room_number));
            const isRoomOccupied = matchedRoom?.status === 'occupied';

            const guestFullName = `${res.guest_first_name || ''} ${res.guest_last_name || ''}`.trim() || res.guest_name || 'Misafir';

            return (
              <div 
                key={res.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border-2 transition-all p-5 shadow-xs space-y-4 ${
                  isPending
                    ? 'border-amber-500/80 bg-gradient-to-r from-amber-500/5 via-white to-amber-500/5 dark:via-slate-900 ring-2 ring-amber-400/50'
                    : isCheckedIn
                    ? 'border-emerald-500/50'
                    : isConfirmed
                    ? 'border-indigo-500/40'
                    : 'border-slate-200 dark:border-slate-800 opacity-75'
                }`}
              >
                {/* CARD HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-slate-900 text-amber-400 dark:bg-slate-800 rounded-xl font-mono font-black text-xs shadow-xs">
                      {res.reservation_code || `#REZ-${res.id.slice(0, 8)}`}
                    </span>

                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase flex items-center gap-1.5 shadow-xs ${
                      isPending
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : isCheckedIn
                        ? 'bg-emerald-600 text-white'
                        : isConfirmed
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {isPending && <span>🔔 {isTr ? "Aksiyon Bekliyor" : "Pending Action"}</span>}
                      {isCheckedIn && <span>🟢 {isTr ? "Odaya Alındı (Check-In)" : "Checked-In"}</span>}
                      {isConfirmed && <span>🔵 {isTr ? "Onaylandı" : "Confirmed"}</span>}
                      {isCancelled && <span>⚪ {isTr ? "İptal Edildi" : "Cancelled"}</span>}
                    </span>

                    <span className="text-[11px] font-bold text-slate-400">
                      {res.created_at ? new Date(res.created_at).toLocaleString('tr-TR') : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                      {res.payment_method === 'pay_at_hotel' || res.payment_method === 'hotel_pay'
                        ? (isTr ? '🏨 Otelde Öde' : 'Pay at Hotel')
                        : res.payment_method === 'bank_transfer'
                        ? (isTr ? '🏦 Banka / Havale' : 'Bank Transfer')
                        : (isTr ? '💳 Kredi Kartı' : 'Credit Card')}
                    </span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      ₺{formatThousand(res.total_amount)}
                    </span>
                  </div>
                </div>

                {/* CARD DETAILS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* GUEST INFO */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{isTr ? "Misafir Bilgileri" : "Guest Info"}</span>
                    </p>
                    <p className="font-black text-slate-900 dark:text-white text-sm">
                      {guestFullName}
                    </p>
                    <div className="space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="font-bold">{res.guest_phone || '-'}</span>
                      </p>
                      {res.guest_email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{res.guest_email}</span>
                        </p>
                      )}
                      {res.guest_identity_no && (
                        <p className="text-[11px] font-mono text-slate-500">
                          TC/Pasaport: <strong className="text-slate-800 dark:text-slate-200">{res.guest_identity_no}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ROOM & STAY INFO */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" />
                      <span>{isTr ? "Oda & Konaklama" : "Room & Stay"}</span>
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-900 dark:text-white text-sm">
                        {res.room_type || 'Standart Oda'}
                      </p>
                      {res.room_number ? (
                        <span className="px-2 py-0.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg font-black text-xs">
                          #{res.room_number}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg font-black text-[10px]">
                          {isTr ? "Oda Atanacak" : "Unassigned"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                      <p className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{formatDisplayDate(res.check_in_date)} → {formatDisplayDate(res.check_out_date)}</span>
                      </p>
                      <p className="flex items-center justify-between text-[11px]">
                        <span>Süre: <strong>{res.nights || 1} Gece</strong></span>
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-md font-bold">
                          {res.board_name || res.board_type || 'Oda Kahvaltı'}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Kişi: <strong>{res.adults || 1} Yetişkin</strong> {res.children > 0 ? `+ ${res.children} Çocuk` : ''}
                      </p>
                    </div>
                  </div>

                  {/* SPECIAL REQUESTS & NOTES */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
                    <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{isTr ? "Özel İstekler & Notlar" : "Special Requests"}</span>
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-3 font-medium">
                      {res.special_requests || res.notes || (isTr ? "Özel bir not belirtilmemiş." : "No special requests.")}
                    </p>
                    {matchedRoom && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700 text-[11px] flex items-center justify-between">
                        <span className="text-slate-500">Oda Durumu:</span>
                        <span className={`font-black ${isRoomOccupied ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {isRoomOccupied ? '⚠️ Oda Şu An Dolu' : '🟢 Oda Boş & Hazır'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* OPERATOR ACTIONS BAR */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOnlineResModal(res)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>{isTr ? "Detay Kartı" : "View Details"}</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCheckInOnlineReservation(res)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{isTr ? "✅ Odaya Check-In Yap (Yerleştir)" : "Check-In to Room"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmOnlineReservation(res)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{isTr ? "📌 Odaya Rezerve Et" : "Reserve Room"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAcknowledgeOnlineReservation(res)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          title="İşlem yapıldı olarak işaretle ve uyarıyı pasife al"
                        >
                          <CheckCheck className="h-3.5 w-3.5 text-amber-400" />
                          <span>{isTr ? "✓ Pasife Al" : "Dismiss"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelOnlineReservation(res)}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{isTr ? "İptal Et" : "Cancel"}</span>
                        </button>
                      </>
                    )}

                    {isCheckedIn && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{isTr ? "Misafir odada konaklıyor" : "In-house"}</span>
                        </span>
                        {matchedRoom && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveViewMode('grid');
                              setSelectedRoomDetailModal(matchedRoom);
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs cursor-pointer"
                          >
                            {isTr ? "Oda Kartına Git →" : "View Room Card →"}
                          </button>
                        )}
                      </div>
                    )}

                    {isConfirmed && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCheckInOnlineReservation(res)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>{isTr ? "Şimdi Check-In Yap" : "Check-In Now"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
