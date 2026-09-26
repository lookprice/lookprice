import React from "react";
import {
  X,
  Building2,
  ShieldCheck,
  Calculator,
  Baby,
  Check
} from "lucide-react";
import { HotelRoom } from "../hotel/hotelTypes";
import { BoardOptionKey, BookingChildGuest } from "./cafeTypes";

interface CafeRoomBookingModalProps {
  room: HotelRoom | null;
  onClose: () => void;
  onExecuteReservation: (e: React.FormEvent) => void;
  currentNights: number;
  searchCheckIn: string;
  searchCheckOut: string;
  searchAdults: number;
  searchChildrenList: BookingChildGuest[];
  selectedBoardOption: BoardOptionKey;
  setSelectedBoardOption: (board: BoardOptionKey) => void;
  getSelectedBoardPrice: (room: HotelRoom, board: BoardOptionKey) => number;
  isNonRefundableRate: boolean;
  setIsNonRefundableRate: (val: boolean) => void;
  computeDetailedBreakdown: (room: HotelRoom) => any;
  bookingGuestForm: {
    first_name: string;
    last_name: string;
    identity_no: string;
    phone: string;
    email: string;
    special_requests: string;
  };
  setBookingGuestForm: React.Dispatch<React.SetStateAction<{
    first_name: string;
    last_name: string;
    identity_no: string;
    phone: string;
    email: string;
    special_requests: string;
  }>>;
  availableHotelPaymentMethods: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
  }>;
  selectedPaymentMethod: 'bank_transfer' | 'credit_card' | 'pay_at_hotel' | string;
  setSelectedPaymentMethod: (id: any) => void;
  creditCardForm: {
    cardHolder: string;
    cardNumber: string;
    expiry: string;
    cvc?: string;
    cvv?: string;
  };
  setCreditCardForm: React.Dispatch<React.SetStateAction<any>>;
  isHotelCreditCardActive: boolean;
  isHotelBankTransferActive: boolean;
  hotelBankDetailsText: string;
  computeTotalBookingPrice: (room: HotelRoom) => number;
}

export const CafeRoomBookingModal: React.FC<CafeRoomBookingModalProps> = ({
  room,
  onClose,
  onExecuteReservation,
  currentNights,
  searchCheckIn,
  searchCheckOut,
  searchAdults,
  searchChildrenList,
  selectedBoardOption,
  setSelectedBoardOption,
  getSelectedBoardPrice,
  isNonRefundableRate,
  setIsNonRefundableRate,
  computeDetailedBreakdown,
  bookingGuestForm,
  setBookingGuestForm,
  availableHotelPaymentMethods,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  creditCardForm,
  setCreditCardForm,
  isHotelCreditCardActive,
  isHotelBankTransferActive,
  hotelBankDetailsText,
  computeTotalBookingPrice
}) => {
  if (!room) return null;

  const breakdown = computeDetailedBreakdown(room);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 max-w-xl w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div>
            <h3 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Oda #{room.room_number} Online Rezervasyon
            </h3>
            <p className="text-xs text-stone-500 font-bold">
              {room.room_type} • {currentNights} Gece Konaklama
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onExecuteReservation} className="space-y-4">
          
          {/* DATES & NIGHTS SUMMARY */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2 text-xs font-bold text-amber-900 dark:text-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-amber-700 uppercase font-black">Tarih Aralığı</span>
                <span>{searchCheckIn} ➔ {searchCheckOut}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-amber-700 uppercase font-black">Süre & Misafir</span>
                <span className="text-amber-800 dark:text-amber-300 font-extrabold">
                  {currentNights} Gece • {searchAdults} Yetişkin{searchChildrenList.length > 0 ? `, ${searchChildrenList.length} Çocuk` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* BOARD OPTION SELECTOR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase text-stone-500 tracking-wider">
                1. Pansiyon Tipinizi Seçin ({currentNights} Gece İçin)
              </label>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                Seçili: {
                  selectedBoardOption === 'RO' ? 'Sadece Oda (RO)' :
                  selectedBoardOption === 'BB' ? 'Oda & Kahvaltı (BB)' :
                  selectedBoardOption === 'HB' ? 'Yarım Pansiyon (HB)' :
                  selectedBoardOption === 'FB' ? 'Tam Pansiyon (FB)' :
                  selectedBoardOption === 'AI' ? 'Her Şey Dahil (AI)' : 'Ultra Her Şey Dahil (UAI)'
                }
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(() => {
                const allDefinitions: Array<{ key: BoardOptionKey; label: string; desc: string }> = [
                  { key: 'RO', label: 'Sadece Oda (RO)', desc: 'Yalnızca oda konaklaması' },
                  { key: 'BB', label: 'Oda & Kahvaltı (BB)', desc: 'Zengin serpme/açık büfe kahvaltı dahil' },
                  { key: 'HB', label: 'Yarım Pansiyon (HB)', desc: 'Kahvaltı + Akşam yemeği dahil' },
                  { key: 'FB', label: 'Tam Pansiyon (FB)', desc: 'Kahvaltı + Öğle + Akşam yemeği dahil' },
                  { key: 'AI', label: 'Her Şey Dahil (AI)', desc: 'Tüm ana & ara öğünler + içecekler dahil' },
                  { key: 'UAI', label: 'Ultra Her Şey Dahil (UAI)', desc: '24 saat kesintisiz premium yiyecek & içecek' }
                ];

                const bp = room.board_prices;
                const activeSpecial = Array.isArray(room.special_prices)
                  ? room.special_prices.find(sp => sp.start_date <= searchCheckIn && sp.end_date >= searchCheckIn)
                  : null;

                const filtered = allDefinitions.filter(opt => {
                  const spVal = activeSpecial?.board_prices ? (activeSpecial.board_prices as any)[
                    opt.key === 'RO' ? 'room_only' :
                    opt.key === 'BB' ? 'bed_breakfast' :
                    opt.key === 'HB' ? 'half_board' :
                    opt.key === 'FB' ? 'full_board' :
                    opt.key === 'AI' ? 'all_inclusive' : 'ultra_all_inclusive'
                  ] : undefined;

                  const stdVal = bp ? (bp as any)[
                    opt.key === 'RO' ? 'room_only' :
                    opt.key === 'BB' ? 'bed_breakfast' :
                    opt.key === 'HB' ? 'half_board' :
                    opt.key === 'FB' ? 'full_board' :
                    opt.key === 'AI' ? 'all_inclusive' : 'ultra_all_inclusive'
                  ] : (opt.key === 'BB' ? room.price_per_night : undefined);

                  const isSet = (spVal !== undefined && Number(spVal) > 0) || (stdVal !== undefined && Number(stdVal) > 0);
                  const rate = getSelectedBoardPrice(room, opt.key);
                  return isSet && rate > 0;
                });

                const displayList = filtered.length > 0 ? filtered : [allDefinitions[1]]; // fallback to BB

                return displayList.map(opt => {
                  const nightlyPrice = getSelectedBoardPrice(room, opt.key);
                  const totalOptionPrice = nightlyPrice * currentNights;
                  const isSelected = selectedBoardOption === opt.key;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelectedBoardOption(opt.key)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white border-amber-800 shadow-md ring-2 ring-amber-500/30"
                          : "bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                            <span className="font-black text-xs truncate">{opt.label}</span>
                          </div>
                          <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-amber-100' : 'text-stone-500 dark:text-stone-400'}`}>
                            {opt.desc}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`block text-xs font-black font-mono ${isSelected ? 'text-white' : 'text-stone-900 dark:text-white'}`}>
                            ₺{nightlyPrice.toLocaleString('tr-TR')}
                            <span className="text-[9px] font-normal opacity-80">/gece</span>
                          </span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-200' : 'text-amber-700 dark:text-amber-400'}`}>
                            Top. ₺{totalOptionPrice.toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* REFUNDABLE RATE TOGGLE */}
          {room.non_refundable_discount && (
            <div
              onClick={() => setIsNonRefundableRate(!isNonRefundableRate)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs font-bold ${
                isNonRefundableRate
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-stone-50 border-stone-200 text-stone-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${isNonRefundableRate ? 'text-emerald-600' : 'text-stone-400'}`} />
                <div>
                  <span className="block font-black">⚡ İptal Edilemez Fiyat (%{room.non_refundable_discount} Ek İndirim)</span>
                  <span className="text-[10px] text-stone-500 font-medium">Anında ödeme onayında geçerlidir</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isNonRefundableRate}
                onChange={() => {}}
                className="h-4 w-4 rounded accent-emerald-600"
              />
            </div>
          )}

          {/* TRANSPARENT CALCULATION BREAKDOWN TABLE */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
              <span className="font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <Calculator className="w-3.5 h-3.5 text-amber-600" /> Detaylı Hesap Tablosu
              </span>
              <span className="text-[10px] font-bold text-amber-700">Şeffaf Fiyatlandırma</span>
            </div>

            <div className="space-y-1 text-stone-700 dark:text-stone-300">
              <div className="flex justify-between items-center font-medium">
                {breakdown.isPerPerson ? (
                  <span>{breakdown.adultsCount} Yetişkin x ₺{breakdown.baseNightlyPrice.toLocaleString('tr-TR')} x {breakdown.nights} Gece</span>
                ) : (
                  <span>Oda Konaklaması (Sabit Fiyat) x {breakdown.nights} Gece</span>
                )}
                <span className="font-black">₺{breakdown.adultsGrossAmount.toLocaleString('tr-TR')}</span>
              </div>

              {breakdown.isPerPerson && breakdown.childrenDetails.map((ch: any) => (
                <div key={ch.id} className="flex justify-between items-center text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                  <span className="flex items-center gap-1">
                    <Baby className="w-3 h-3 text-emerald-600 shrink-0" />
                    {ch.index}. Çocuk ({ch.label}): {ch.discountText}
                  </span>
                  <span>
                    <span className="line-through text-stone-400 mr-1.5 text-[10px]">₺{ch.grossAmount.toLocaleString('tr-TR')}</span>
                    <span className="font-black">₺{ch.netAmount.toLocaleString('tr-TR')}</span>
                  </span>
                </div>
              ))}
              
              {!breakdown.isPerPerson && breakdown.childrenDetails.length > 0 && (
                <div className="flex justify-between items-center text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                  <span className="flex items-center gap-1">
                    <Baby className="w-3 h-3 text-emerald-600 shrink-0" />
                    {breakdown.childrenDetails.length} Çocuk Misafir
                  </span>
                  <span className="font-black text-[10px]">(Oda Fiyatına Dahil)</span>
                </div>
              )}

              {breakdown.flexDiscountAmount > 0 && (
                <div className="flex justify-between items-center font-bold text-emerald-700 dark:text-emerald-400">
                  <span>Esnek İptalsiz İndirimi (%{room.non_refundable_discount})</span>
                  <span>-₺{breakdown.flexDiscountAmount.toLocaleString('tr-TR')}</span>
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 dark:border-stone-700 pt-2 flex justify-between items-center font-black text-stone-900 dark:text-white">
              <span className="uppercase text-[10px] tracking-wider">Toplam Ödenecek Tutar</span>
              <span className="text-base text-amber-600 font-mono">₺{breakdown.finalPayableTotal.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          {/* GUEST DETAILS FORM */}
          <div className="space-y-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
            <label className="text-[10px] font-black uppercase text-stone-500">2. İletişim & Konaklayan Bilgileri</label>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Adınız *"
                value={bookingGuestForm.first_name}
                onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, first_name: e.target.value })}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
              />
              <input
                type="text"
                required
                placeholder="Soyadınız *"
                value={bookingGuestForm.last_name}
                onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, last_name: e.target.value })}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  required
                  placeholder="TC / Pasaport No *"
                  value={bookingGuestForm.identity_no}
                  onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, identity_no: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Telefon (+90 5XX) *"
                  value={bookingGuestForm.phone}
                  onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <textarea
                rows={1}
                placeholder="Özel İstekler (Balayı süslemesi, deniz manzarası vb.)"
                value={bookingGuestForm.special_requests}
                onChange={(e) => setBookingGuestForm({ ...bookingGuestForm, special_requests: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          {/* PAYMENT METHOD SELECTION */}
          <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-stone-800">
            <label className="text-[10px] font-black uppercase text-stone-500">3. Ödeme Yöntemi Seçimi</label>
            
            {availableHotelPaymentMethods.length > 0 ? (
              <div className={`grid ${availableHotelPaymentMethods.length === 1 ? 'grid-cols-1' : availableHotelPaymentMethods.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
                {availableHotelPaymentMethods.map(pm => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(pm.id)}
                    className={`p-2.5 rounded-xl border text-center text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedPaymentMethod === pm.id
                        ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {pm.icon}
                    <span>{pm.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                Rezervasyon ve ödeme yöntemleri için lütfen işletmemizle doğrudan iletişime geçiniz.
              </div>
            )}

            {/* CONDITIONAL PAYMENT INPUTS */}
            {selectedPaymentMethod === 'credit_card' && isHotelCreditCardActive && (
              <div className="p-3 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-stone-500 block">Sanal POS Kredi Kartı Bilgileri</span>
                <input
                  type="text"
                  placeholder="Kart Üzerindeki İsim"
                  value={creditCardForm.cardHolder}
                  onChange={(e) => setCreditCardForm({ ...creditCardForm, cardHolder: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="4543 **** **** 1234"
                    value={creditCardForm.cardNumber}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, cardNumber: e.target.value })}
                    className="col-span-2 px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold font-mono"
                  />
                  <input
                    type="text"
                    placeholder="AA/YY"
                    value={creditCardForm.expiry}
                    onChange={(e) => setCreditCardForm({ ...creditCardForm, expiry: e.target.value })}
                    className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-bold text-center"
                  />
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'bank_transfer' && isHotelBankTransferActive && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-900 space-y-1.5">
                <span className="block text-[10px] uppercase font-black text-amber-700">Otel Banka Hesap Bilgileri (IBAN)</span>
                <p className="font-mono text-[11px] whitespace-pre-line select-all bg-white/80 p-2.5 rounded-xl border border-amber-200/80 font-semibold text-slate-800 leading-relaxed">{hotelBankDetailsText}</p>
                <p className="text-[10px] font-medium text-amber-800">Açıklamaya adınızı ve oda numaranızı (#101) yazınız.</p>
              </div>
            )}
          </div>

          {/* TOTAL AMOUNT & CONFIRMATION SUBMIT */}
          <div className="p-4 bg-stone-900 text-white rounded-2xl flex items-center justify-between shadow-lg pt-3">
            <div>
              <span className="block text-[10px] uppercase font-bold text-stone-400">Toplam Konaklama Tutarı</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                ₺{computeTotalBookingPrice(room).toLocaleString('tr-TR')}
              </span>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Rezervasyonu Tamamla</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
