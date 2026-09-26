import React from 'react';
import { X, Receipt, Plus, Printer, AlertTriangle, Clock } from 'lucide-react';
import { HotelRoom } from '../HotelRoomManagement';

interface HotelFolioModalProps {
  checkOutModalRoom: HotelRoom | null;
  onCloseCheckOutModal: () => void;
  computeRoomFolioDetails: (room: HotelRoom) => any;
  checkoutPaymentMethod: string;
  setCheckoutPaymentMethod: (method: string) => void;
  handlePrintFolio: (room: HotelRoom, method: string) => void;
  handleExecuteCheckOut: (room: HotelRoom) => void;
  setAddExpenseModalRoom: (room: HotelRoom | null) => void;
  addExpenseModalRoom: HotelRoom | null;
  manualExpense: { title: string; amount: number };
  setManualExpense: React.Dispatch<React.SetStateAction<{ title: string; amount: number }>>;
  handleAddExpenseToFolio: (e: React.FormEvent) => void;
}

export const HotelFolioModal: React.FC<HotelFolioModalProps> = ({
  checkOutModalRoom,
  onCloseCheckOutModal,
  computeRoomFolioDetails,
  checkoutPaymentMethod,
  setCheckoutPaymentMethod,
  handlePrintFolio,
  handleExecuteCheckOut,
  setAddExpenseModalRoom,
  addExpenseModalRoom,
  manualExpense,
  setManualExpense,
  handleAddExpenseToFolio,
}) => {
  if (!checkOutModalRoom || !checkOutModalRoom.current_guest) return null;

  const details = computeRoomFolioDetails(checkOutModalRoom);
  const todayStr = new Date().toISOString().split('T')[0];
  const guestCheckIn = checkOutModalRoom.current_guest?.check_in || '';
  const guestCheckOut = checkOutModalRoom.current_guest?.check_out || '';
  
  // Is reservation strictly in the future (today is before check-in date)?
  const isFutureStay = Boolean(guestCheckIn && guestCheckIn > todayStr);
  
  // Is the guest physically staying in-house today?
  const isGuestInHouse = checkOutModalRoom.status === 'occupied' && !isFutureStay;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-500" />
                <span>Oda #{checkOutModalRoom.room_number} Folio Hesabı & Check-Out</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Misafir: <strong className="text-slate-800 dark:text-slate-200">{checkOutModalRoom.current_guest.first_name} {checkOutModalRoom.current_guest.last_name}</strong> ({checkOutModalRoom.current_guest.identity_no})
              </p>
            </div>
            <button onClick={onCloseCheckOutModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* WARNING BANNER FOR FUTURE STAY / NOT YET IN-HOUSE */}
          {!isGuestInHouse && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black block">
                  Misafir Henüz Otele Giriş Yapmadı {guestCheckIn ? `(Konaklama Başlangıcı: ${guestCheckIn})` : ''}
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  Konaklama tarihi başlamadığı için adisyon ekleme ve check-out işlemleri pasiftir. Bu işlemler misafirin otele fiili giriş tarihinde ve oda "Dolu" statüsündeyken aktifleşir.
                </span>
              </div>
            </div>
          )}

          {/* STAY DETAILS BADGES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div>
              <span className="text-slate-400 font-medium block">Pansiyon Tipi</span>
              <strong className="text-slate-800 dark:text-slate-200">{details.boardTypeLabel}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Konaklama Süresi</span>
              <strong className="text-slate-800 dark:text-slate-200">{details.nights} Gece</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Kişi Sayısı</span>
              <strong className="text-slate-800 dark:text-slate-200">{details.totalPersons} Kişi</strong>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Giriş / Çıkış</span>
              <strong className="text-slate-800 dark:text-slate-200">{details.checkInDate} / {details.checkOutDate}</strong>
            </div>
          </div>

          {/* ITEM BREAKDOWN */}
          <div className="space-y-3">
            {/* 1. ROOM ACCOMMODATION CHARGE & PERSON BREAKDOWN */}
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                <span>1. Oda Konaklama Hesabı ({details.nights} Gece x {details.totalPersons} Kişi x ₺{details.nightlyRate.toLocaleString('tr-TR')})</span>
                <span>₺{details.totalRawRoomRate.toLocaleString('tr-TR')}</span>
              </div>

              {/* ITEMIZED PERSONS */}
              <div className="space-y-1 pt-1">
                {details.personList.map((p: any, pIdx: number) => (
                  <div key={pIdx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 p-2 rounded-xl border border-blue-100/50 dark:border-blue-900/40">
                    <div>
                      <span className="font-bold">{p.name}</span>
                      {p.isMain && <span className="ml-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold">(Ana Misafir)</span>}
                      <span className="text-[10px] text-slate-500 block">
                        Yaş: {p.age} • {p.category} {p.discountRate > 0 ? `(İndirim: %${p.discountRate})` : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white">₺{p.netRate.toLocaleString('tr-TR')}</div>
                      {p.discountAmount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold">-₺{p.discountAmount.toLocaleString('tr-TR')} indirim</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {details.roomDiscountAmount > 0 && (
                <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pl-2">
                  <span>(-) Toplam Tesis Yaş Grubu İndirimi</span>
                  <span>-₺{details.roomDiscountAmount.toLocaleString('tr-TR')}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white pt-2 border-t border-blue-200/60 dark:border-blue-900/80">
                <span>Net Konaklama Tutarı:</span>
                <span>₺{details.netRoomRate.toLocaleString('tr-TR')}</span>
              </div>
            </div>

            {/* 2. RESTAURANT & CAFE HARCAMALARI */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300 border-b pb-1.5">
                <span>2. Açık Restoran & Kafeterya Harcamaları ({details.restaurantItems?.length || 0} Kalem)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white">₺{details.restaurantTotal.toLocaleString('tr-TR')}</span>
                  <button
                    type="button"
                    disabled={!isGuestInHouse}
                    onClick={() => isGuestInHouse && setAddExpenseModalRoom(checkOutModalRoom)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                      isGuestInHouse
                        ? "bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-300 cursor-pointer shadow-2xs"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                    }`}
                    title={!isGuestInHouse ? "Misafir henüz otele giriş yapmadığı için adisyon eklenemez" : "Adisyon / Minibar Ekle"}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Adisyon / Minibar Ekle</span>
                  </button>
                </div>
              </div>

              {(details.restaurantItems?.length || 0) === 0 ? (
                <div className="text-center py-2 text-[11px] text-slate-400">
                  Odaya aktarılmış açık restoran/kafeterya adisyonu bulunmuyor.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {(details.restaurantItems || []).map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="font-bold">{item.title}</span>
                        <span className="text-[10px] text-slate-400 block">{item.date} • {item.category}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₺{item.finalAmount.toLocaleString('tr-TR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. ADVANCE PAYMENT / KAPORA */}
            {details.advancePayment > 0 && (
              <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <span>(-) Girişte Alınan Kapora / Ön Ödeme:</span>
                <span>-₺{details.advancePayment.toLocaleString('tr-TR')}</span>
              </div>
            )}
          </div>

          {/* GRAND TOTAL BOX */}
          <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs font-extrabold text-slate-400 block uppercase">Tahsil Edilecek Net Balans</span>
              <span className="text-[10px] text-slate-400">
                Net Oda: ₺{details.netRoomRate.toLocaleString('tr-TR')} + Restoran: ₺{details.restaurantTotal.toLocaleString('tr-TR')}
                {details.advancePayment > 0 ? ` (-₺${details.advancePayment.toLocaleString('tr-TR')} Kapora)` : ''}
              </span>
            </div>
            <div className="text-2xl font-black text-amber-400">
              ₺{details.netPayableBalance.toLocaleString('tr-TR')}
            </div>
          </div>

          {/* PAYMENT METHOD SELECTOR */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Tahsilat Ödeme Yöntemi:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'Kredi Kartı', label: '💳 Kredi Kartı' },
                { id: 'Nakit', label: '💵 Nakit' },
                { id: 'Havale / EFT', label: '🏦 Havale' },
                { id: 'Kombine / Cari', label: '📋 Cari / Diğer' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCheckoutPaymentMethod(m.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    checkoutPaymentMethod === m.id
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handlePrintFolio(checkOutModalRoom, checkoutPaymentMethod)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Detaylı Folio Ekstresi Yazdır</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCloseCheckOutModal}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={!isGuestInHouse}
                onClick={() => isGuestInHouse && handleExecuteCheckOut(checkOutModalRoom)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all ${
                  isGuestInHouse
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                }`}
                title={!isGuestInHouse ? "Misafir henüz otele giriş yapmadığı için check-out yapılamaz" : "Folio Kapat & Check-Out"}
              >
                <Receipt className="h-4 w-4" />
                <span>{isGuestInHouse ? "Folio Kapat & Check-Out" : "Check-Out (Giriş Tarihi Bekleniyor)"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD MANUAL EXPENSE */}
      {addExpenseModalRoom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Oda #{addExpenseModalRoom.room_number} Adisyon Ekle
              </h3>
              <button onClick={() => setAddExpenseModalRoom(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              if (!isGuestInHouse) {
                e.preventDefault();
                return;
              }
              handleAddExpenseToFolio(e);
            }} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Harcama Kalemi / Adisyon</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Restoran Adisyon #1092, Mini Bar"
                  value={manualExpense.title}
                  onChange={(e) => setManualExpense({ ...manualExpense, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Tutar (₺)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={manualExpense.amount}
                  onChange={(e) => setManualExpense({ ...manualExpense, amount: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddExpenseModalRoom(null)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Hesaba İşle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
