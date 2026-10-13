import React, { useMemo, useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Trash2, 
  Bed, 
  Utensils, 
  Coffee, 
  Sparkles, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Edit3, 
  RotateCcw, 
  Info,
  DollarSign
} from 'lucide-react';
import { HotelRoom } from '../HotelRoomManagement';
import { formatDateTR } from '../../../utils/formatUtils';

export const normalizeBoardCode = (code?: string): string => {
  if (!code) return 'BB';
  const c = code.toLowerCase().trim();
  if (c === 'ro' || c === 'room_only' || c === 'sadece_oda' || c === 'sadece oda') return 'RO';
  if (c === 'bb' || c === 'bed_breakfast' || c === 'oda_kahvalti' || c === 'oda kahvaltı' || c === 'oda_kahvaltı' || c === 'oda + kahvaltı') return 'BB';
  if (c === 'hb' || c === 'half_board' || c === 'yarim_pansiyon' || c === 'yarım pansiyon' || c === 'yarim pansiyon') return 'HB';
  if (c === 'fb' || c === 'full_board' || c === 'tam_pansiyon' || c === 'tam pansiyon') return 'FB';
  if (c === 'ai' || c === 'all_inclusive' || c === 'her_sey_dahil' || c === 'her şey dahil' || c === 'hersey dahil') return 'AI';
  if (c === 'uai' || c === 'ultra_all_inclusive' || c === 'ultra') return 'UAI';
  return code.toUpperCase();
};

interface HotelCheckInModalProps {
  checkInModalRoom: HotelRoom | null;
  setCheckInModalRoom: (room: HotelRoom | null) => void;
  rooms: HotelRoom[];
  guestForm: {
    identity_no: string;
    phone: string;
    email?: string;
    first_name: string;
    last_name: string;
    birth_date: string;
    check_in_date: string;
    check_out_date: string;
    board_type?: string;
    custom_nightly_rate?: number;
    advance_payment?: number;
    payment_method?: string;
    notes?: string;
    additionalGuests?: any[];
  };
  setGuestForm: (form: any) => void;
  handleExecuteCheckIn: (e: React.FormEvent) => void;
  handleAdminCheckInChange: (val: string) => void;
  getNextDayString: (startDateStr: string) => string;
  calculateAgeDetails: (birthDateStr: string, fallbackAge?: number) => any;
  handleAddAdditionalGuestField: () => void;
  handleRemoveAdditionalGuestField: (index: number) => void;
}

export const HotelCheckInModal: React.FC<HotelCheckInModalProps> = ({
  checkInModalRoom,
  setCheckInModalRoom,
  rooms,
  guestForm,
  setGuestForm,
  handleExecuteCheckIn,
  handleAdminCheckInChange,
  getNextDayString,
  calculateAgeDetails,
  handleAddAdditionalGuestField,
  handleRemoveAdditionalGuestField,
}) => {
  const [isCustomPriceActive, setIsCustomPriceActive] = useState(
    Boolean(guestForm.custom_nightly_rate && guestForm.custom_nightly_rate > 0)
  );

  useEffect(() => {
    if (checkInModalRoom) {
      setIsCustomPriceActive(Boolean(guestForm.custom_nightly_rate && guestForm.custom_nightly_rate > 0));
    }
  }, [checkInModalRoom, guestForm.custom_nightly_rate]);

  // Nights calculation
  const nights = useMemo(() => {
    try {
      const cin = new Date(guestForm.check_in_date || new Date());
      const cout = new Date(guestForm.check_out_date || new Date(Date.now() + 86400000));
      const diffTime = cout.getTime() - cin.getTime();
      return Math.max(1, Math.round(diffTime / (1000 * 3600 * 24)));
    } catch {
      return 1;
    }
  }, [guestForm.check_in_date, guestForm.check_out_date]);

  if (!checkInModalRoom) return null;


  // Helper to extract board price for a given room and board code
  const getBoardPrice = (room: HotelRoom, code: string): number => {
    const norm = normalizeBoardCode(code);
    const bp = room.board_prices || {};
    const base = Number(room.price_per_night) || Number(bp.bed_breakfast) || 2500;

    if (norm === 'RO') {
      return Number(bp.room_only ?? room.price_room_only) || Math.round(base * 0.88);
    }
    if (norm === 'BB') {
      return Number(bp.bed_breakfast ?? room.price_per_night) || base;
    }
    if (norm === 'HB') {
      return Number(bp.half_board ?? room.price_half_board) || Math.round(base * 1.28);
    }
    if (norm === 'FB') {
      return Number(bp.full_board ?? room.price_full_board) || Math.round(base * 1.56);
    }
    if (norm === 'AI') {
      return Number(bp.all_inclusive ?? room.price_all_inclusive) || Math.round(base * 1.92);
    }
    if (norm === 'UAI') {
      return Number(bp.ultra_all_inclusive ?? room.price_ultra_all_inclusive) || Math.round(base * 2.30);
    }
    return base;
  };

  // Board options definitions with rich metadata
  const BOARD_OPTIONS = [
    { 
      code: 'RO', 
      label: 'Sadece Oda', 
      sub: 'Yemek Hariç', 
      desc: 'Yalnızca oda konaklaması, yiyecek & içecek ekstradır.',
      icon: <Bed className="h-4 w-4" /> 
    },
    { 
      code: 'BB', 
      label: 'Oda & Kahvaltı', 
      sub: 'Açık Büfe Kahvaltı', 
      desc: 'Zengin açık büfe / serpme sabah kahvaltısı dahil.',
      icon: <Coffee className="h-4 w-4" /> 
    },
    { 
      code: 'HB', 
      label: 'Yarım Pansiyon', 
      sub: 'Kahvaltı + Akşam', 
      desc: 'Sabah kahvaltısı ve zengin akşam yemeği dahil.',
      icon: <Utensils className="h-4 w-4" /> 
    },
    { 
      code: 'FB', 
      label: 'Tam Pansiyon', 
      sub: '3 Öğün Açık Büfe', 
      desc: 'Sabah kahvaltısı, öğle ve akşam yemeği dahil.',
      icon: <Utensils className="h-4 w-4" /> 
    },
    { 
      code: 'AI', 
      label: 'Her Şey Dahil', 
      sub: 'Tüm Öğünler + İçecek', 
      desc: '3 ana öğün, ara ikramlar ve yerli içecekler dahil.',
      icon: <Sparkles className="h-4 w-4" /> 
    },
    { 
      code: 'UAI', 
      label: 'Ultra Her Şey Dahil', 
      sub: '7/24 Premium Servis', 
      desc: '24 saat kesintisiz premium yiyecek, içecek ve oda servisi.',
      icon: <Sparkles className="h-4 w-4" /> 
    },
  ];

  const selectedBoardCode = normalizeBoardCode(guestForm.board_type || 'BB');
  const standardNightlyRate = getBoardPrice(checkInModalRoom, selectedBoardCode);
  const currentNightlyRate = (isCustomPriceActive && Number(guestForm.custom_nightly_rate) > 0)
    ? Number(guestForm.custom_nightly_rate)
    : standardNightlyRate;


  const totalGuestsCount = 1 + (guestForm.additionalGuests?.length || 0);
  const isPerPerson = checkInModalRoom.pricing_type === 'per_person';
  const totalStayAmount = currentNightlyRate * nights * (isPerPerson ? totalGuestsCount : 1);
  const advancePayment = Number(guestForm.advance_payment) || 0;
  const remainingBalance = Math.max(0, totalStayAmount - advancePayment);

  const activeBoardObj = BOARD_OPTIONS.find(o => o.code === selectedBoardCode) || BOARD_OPTIONS[1];

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    return formatDateTR(dStr);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Oda #{checkInModalRoom.room_number} Misafir Girişi (Check-In)
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {checkInModalRoom.room_type}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Maks Kapasite: <strong className="text-slate-700 dark:text-slate-200">{checkInModalRoom.capacity} Kişi</strong> • {checkInModalRoom.bed_info || 'Standart Yatak'}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setCheckInModalRoom(null)} 
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SCROLLABLE FORM BODY */}
        <form onSubmit={handleExecuteCheckIn} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/40 dark:bg-slate-900/50">
          
          {/* 1. ODA SEÇİMİ */}
          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
            <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase flex items-center justify-between">
              <span>Tahsis Edilen Oda</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Maks: {checkInModalRoom.capacity} Kişi</span>
            </label>
            <select
              value={checkInModalRoom.id}
              onChange={(e) => {
                const sel = rooms.find(r => r.id === e.target.value);
                if (sel) setCheckInModalRoom(sel);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {rooms.map(r => {
                const targetIn = guestForm.check_in_date || new Date().toISOString().split('T')[0];
                const targetOut = guestForm.check_out_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

                const hasGuestConflict = r.status === 'occupied' && r.current_guest &&
                  (r.current_guest.check_in_date < targetOut && r.current_guest.check_out_date > targetIn);

                const activeResId = (checkInModalRoom as any)?.active_res_id || (checkInModalRoom as any)?.res_id || (checkInModalRoom as any)?.id;
                const activeResCode = (checkInModalRoom as any)?.reservation_code;

                const hasReservationConflict = Array.isArray(r.reservations) &&
                  r.reservations.some(res => 
                    (res as any).status !== 'cancelled' && 
                    (res as any).id !== activeResId && 
                    (res as any).reservation_code !== activeResCode &&
                    res.check_in_date < targetOut && 
                    res.check_out_date > targetIn
                  );

                const isConflictForSelectedDates = hasGuestConflict || hasReservationConflict;
                const isMaintenance = r.status === 'maintenance' || r.status === 'staff' || r.status === 'disabled';

                const todayStr = new Date().toISOString().split('T')[0];
                const isCurrentlyOccupiedToday = r.status === 'occupied' && r.current_guest &&
                  (r.current_guest.check_in_date <= todayStr && r.current_guest.check_out_date > todayStr);

                let statusLabel = '🟢 Boş & Hazır';
                if (isMaintenance) {
                  statusLabel = '⚠️ Servis Dışı / Bakımda';
                } else if (isConflictForSelectedDates) {
                  statusLabel = `🔴 Seçilen Tarihlerde Dolu (${targetIn} — ${targetOut})`;
                } else if (isCurrentlyOccupiedToday && targetIn > todayStr) {
                  statusLabel = `🟡 Şu An Dolu (Fakat ${targetIn} İleri Tarihinde Müsait)`;
                } else if (Array.isArray(r.reservations) && r.reservations.filter((res: any) => (res as any).status !== 'cancelled' && (res as any).id !== activeResId && (res as any).reservation_code !== activeResCode).length > 0) {
                  statusLabel = '🟢 Müsait (Gelecek Tarihte Rezervasyonlu)';
                }

                return (
                  <option key={r.id} value={r.id} disabled={isConflictForSelectedDates || isMaintenance}>
                    Oda #{r.room_number} - {r.room_type} ({statusLabel})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. PANSİYON TİPİ & RESEPSİYON FİYAT MATRİSİ */}
          <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800/80 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-indigo-100 dark:border-indigo-900/60 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Utensils className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Pansiyon Seçenekleri & Fiyat Tarifesi
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Kapıdan gelen misafire teklif edilecek gecelik ve toplam konaklama fiyatları
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomPriceActive(!isCustomPriceActive);
                    if (isCustomPriceActive) {
                      setGuestForm({ ...guestForm, custom_nightly_rate: undefined });
                    } else {
                      setGuestForm({ ...guestForm, custom_nightly_rate: standardNightlyRate });
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-1 cursor-pointer ${
                    isCustomPriceActive
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                  title="Pazarlık / Özel İndirimli Gecelik Fiyat Belirle"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>{isCustomPriceActive ? 'Özel Fiyat Aktif' : 'Özel/Pazarlık Fiyatı Gir'}</span>
                </button>
              </div>
            </div>

            {/* PANSİYON KARTLARI (6 SEÇENEK) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BOARD_OPTIONS.map((opt) => {
                const price = getBoardPrice(checkInModalRoom, opt.code);
                const isSelected = selectedBoardCode === opt.code;
                const totalForStay = price * nights * (isPerPerson ? totalGuestsCount : 1);

                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => {
                      setGuestForm({ 
                        ...guestForm, 
                        board_type: opt.code,
                        ...(isCustomPriceActive ? { custom_nightly_rate: guestForm.custom_nightly_rate ?? price } : {})
                      });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-md shadow-indigo-600/25 ring-2 ring-indigo-400'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        }`}>
                          {opt.code}
                        </span>
                        <span className={`text-[9px] font-bold truncate max-w-[90px] ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                          {opt.sub}
                        </span>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
                      ) : (
                        <span className="opacity-0"></span>
                      )}
                    </div>

                    <div>
                      <div className="font-black text-xs leading-tight">{opt.label}</div>
                      <div className={`text-[9px] line-clamp-1 mt-0.5 ${isSelected ? 'text-indigo-100 opacity-90' : 'text-slate-400'}`}>
                        {opt.desc}
                      </div>
                    </div>

                    <div className={`pt-1.5 border-t flex flex-col gap-0.5 ${
                      isSelected ? 'border-indigo-400/50' : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex items-baseline justify-between">
                        <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          ₺{price.toLocaleString('tr-TR')}
                        </span>
                        <span className={`text-[9px] font-normal ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                          /gece
                        </span>
                      </div>
                      <div className={`text-[9px] font-bold truncate ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {nights} Gece: ₺{totalForStay.toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ÖZEL FİYAT GİRİŞ ALANI (MANUEL PAZARLIK FİYATI) */}
            {isCustomPriceActive && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-amber-950 dark:text-amber-200 block">
                      Özel Gecelik Fiyat / İndirim
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400">
                      Standart {selectedBoardCode} pansiyon fiyatı: ₺{standardNightlyRate.toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-36">
                    <span className="absolute left-2.5 top-1.5 text-xs font-bold text-amber-700">₺</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder={String(standardNightlyRate)}
                      value={guestForm.custom_nightly_rate ?? ''}
                      onChange={(e) => setGuestForm({ 
                        ...guestForm, 
                        custom_nightly_rate: e.target.value ? Number(e.target.value) : undefined 
                      })}
                      className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-black text-amber-950 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuestForm({ ...guestForm, custom_nightly_rate: standardNightlyRate })}
                    className="p-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-100 text-[10px] font-bold cursor-pointer"
                    title="Standart Pansiyon Fiyatına Sıfırla"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. TARİHLER (CHECK-IN & CHECK-OUT) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                Giriş Tarihi (Check-In)
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={guestForm.check_in_date}
                onChange={(e) => handleAdminCheckInChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                Çıkış Tarihi (Check-Out)
              </label>
              <input
                type="date"
                required
                min={getNextDayString(guestForm.check_in_date)}
                value={guestForm.check_out_date}
                onChange={(e) => setGuestForm({ ...guestForm, check_out_date: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          {/* 4. CANLI RESEPSİYON KONAKLAMA HESAPLAMA & FİYAT ÖZETİ */}
          <div className="p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-2xl border border-indigo-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  Konaklama & Fiyat Özeti
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 bg-indigo-600/40 text-indigo-200 border border-indigo-400/40 rounded-lg text-[10px] font-black">
                  {activeBoardObj.label} ({selectedBoardCode})
                </span>
                <span className="px-2.5 py-0.5 bg-white/10 text-white border border-white/20 rounded-lg text-[10px] font-black">
                  {nights} Gece • {totalGuestsCount} Misafir
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-400 text-[10px] block">Gecelik Pansiyon</span>
                <span className="font-bold text-white text-sm">₺{currentNightlyRate.toLocaleString('tr-TR')}</span>
                {isCustomPriceActive && (
                  <span className="text-[9px] text-amber-400 block font-bold">Özel Fiyat</span>
                )}
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-400 text-[10px] block">Konaklama Süresi</span>
                <span className="font-bold text-white text-sm">{nights} Gece</span>
                <span className="text-[9px] text-slate-400 block">{isPerPerson ? 'Kişi Başı' : 'Oda Başı'}</span>
              </div>
              <div className="p-2.5 bg-emerald-950/50 rounded-xl border border-emerald-500/30">
                <span className="text-emerald-300 text-[10px] block font-bold">Toplam Tutar</span>
                <span className="font-black text-emerald-400 text-base">₺{totalStayAmount.toLocaleString('tr-TR')}</span>
                <span className="text-[9px] text-emerald-300/70 block">KDV Dahil</span>
              </div>
              <div className="p-2.5 bg-amber-950/50 rounded-xl border border-amber-500/30">
                <span className="text-amber-300 text-[10px] block font-bold">Kalan Bakiye</span>
                <span className="font-black text-amber-300 text-base">₺{remainingBalance.toLocaleString('tr-TR')}</span>
                <span className="text-[9px] text-amber-300/70 block">Ön Ödeme Sonrası</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1 text-indigo-300">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>{activeBoardObj.desc}</span>
              </span>
              <span className="font-mono">{formatDisplayDate(guestForm.check_in_date)} ➔ {formatDisplayDate(guestForm.check_out_date)}</span>
            </div>
          </div>

          {/* 5. ÖN ÖDEME & ÖDEME YÖNTEMİ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">
                Alınan Ön Ödeme (Kapora / ₺)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₺</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  placeholder="0"
                  value={guestForm.advance_payment || ''}
                  onChange={(e) => setGuestForm({ ...guestForm, advance_payment: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block mb-1 flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-slate-500" />
                <span>Ödeme Yöntemi</span>
              </label>
              <select
                value={guestForm.payment_method || "credit_card"}
                onChange={(e) => setGuestForm({ ...guestForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                <option value="credit_card">💳 Kredi Kartı</option>
                <option value="cash">💵 Nakit</option>
                <option value="bank_transfer">🏦 Havale / EFT</option>
                <option value="company_account">🏢 Cari / Şirket Hesabı</option>
              </select>
            </div>
          </div>

          {/* 6. MİSAFİR KİMLİK BİLGİLERİ */}
          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
            <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase block border-b border-slate-100 dark:border-slate-700 pb-1.5">
              Ana Misafir Kimlik & İletişim
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
                  <span>TC / Pasaport No</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="11 Haneli TC / Pasaport"
                  value={guestForm.identity_no}
                  onChange={(e) => setGuestForm({ ...guestForm, identity_no: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">Telefon</label>
                <input
                  type="text"
                  placeholder="+90 5XX XXX XX XX"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
                  <span>Misafir Adı</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Adı"
                  value={guestForm.first_name}
                  onChange={(e) => setGuestForm({ ...guestForm, first_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
                  <span>Soyadı</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Soyadı"
                  value={guestForm.last_name}
                  onChange={(e) => setGuestForm({ ...guestForm, last_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* BIRTHDATE & AUTO AGE DISCOUNT */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block mb-1">Doğum Tarihi</label>
                <input
                  type="date"
                  required
                  value={guestForm.birth_date}
                  onChange={(e) => setGuestForm({ ...guestForm, birth_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                {guestForm.birth_date && (() => {
                  const details = calculateAgeDetails(guestForm.birth_date);
                  return (
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-white border border-indigo-200 dark:border-indigo-800">
                      <span>Yaş: {details.age} ({details.category})</span>
                      {details.discountRate > 0 && (
                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                          💡 Restoran %{details.discountRate} İndirimli
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 7. EK MİSAFİRLER (ÇOCUK / BEBEK / EŞ) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Ek Misafirler (Çocuk / Bebek / Eş)</span>
              </div>
              <button
                type="button"
                onClick={handleAddAdditionalGuestField}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 shadow-2xs"
              >
                + Ek Misafir Ekle
              </button>
            </div>

            {(guestForm.additionalGuests || []).map((ag, idx) => {
              const agAgeDetails = ag.birth_date ? calculateAgeDetails(ag.birth_date, ag.age) : null;
              return (
                <div key={idx} className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl space-y-2.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-1.5">
                    <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-300">
                      {idx + 2}. Ek Misafir {agAgeDetails ? `(${agAgeDetails.age} Yaş - ${agAgeDetails.labelTr})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdditionalGuestField(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-colors"
                      title="Misafiri Kaldır"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                        <span>TC / Pasaport No</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Kimlik / Pasaport"
                        value={ag.identity_no}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].identity_no = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                        <span>Adı</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Adı"
                        value={ag.first_name}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].first_name = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                        <span>Soyadı</span>
                        <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Soyadı"
                        value={ag.last_name}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].last_name = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400">🎂 Doğum Tarihi (İndirim Hesabı)</label>
                      <input
                        type="date"
                        value={ag.birth_date}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].birth_date = e.target.value;
                          if (e.target.value) {
                            const details = calculateAgeDetails(e.target.value);
                            list[idx].age = details.age;
                            list[idx].age_category = details.category;
                            list[idx].discount_rate = details.discountRate;
                          }
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">Cinsiyet</label>
                      <select
                        value={ag.gender || "Kadın"}
                        onChange={(e) => {
                          const list = [...(guestForm.additionalGuests || [])];
                          list[idx].gender = e.target.value;
                          setGuestForm({ ...guestForm, additionalGuests: list });
                        }}
                        className="w-full mt-0.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="Erkek">Erkek</option>
                        <option value="Kadın">Kadın</option>
                        <option value="Çocuk">Çocuk / Bebek</option>
                      </select>
                    </div>
                  </div>

                  {agAgeDetails && (
                    <div className="p-2 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between border border-indigo-100 dark:border-indigo-900">
                      <span>Yaş: {agAgeDetails.age} ({agAgeDetails.labelTr})</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">
                        💡 {agAgeDetails.discountText} (Restoran %{agAgeDetails.discountRate} İndirimli)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 8. ÖZEL İSTEKLER / NOTLAR */}
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1">
            <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block">
              Resepsiyon & Özel İstek Notu
            </label>
            <input
              type="text"
              placeholder="Örn: Sessiz oda talebi, bebek yatağı eklendi, geç check-out..."
              value={guestForm.notes || ''}
              onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Toplam: <strong className="text-indigo-600 dark:text-indigo-400 font-black text-sm">₺{totalStayAmount.toLocaleString('tr-TR')}</strong>
              <span className="text-[10px] text-slate-400 ml-1">({nights} Gece • {activeBoardObj.code})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCheckInModalRoom(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Giriş Yap (Check-In)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
