import React from "react";
import { CheckCircle2, X, Printer } from "lucide-react";

interface HotelCheckoutReceiptModalProps {
  completedCheckoutData: any | null;
  onClose: () => void;
  handlePrintFolio: (room: any, paymentMethod: string) => void;
}

export const HotelCheckoutReceiptModal: React.FC<HotelCheckoutReceiptModalProps> = ({
  completedCheckoutData,
  onClose,
  handlePrintFolio,
}) => {
  if (!completedCheckoutData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-black">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Check-Out Tamamlandı & Folio Kapatıldı
              </h3>
              <p className="text-xs text-slate-500">
                Oda #{completedCheckoutData.room.room_number} başarıyla boşaltıldı ve müşteri ekstresi oluşturuldu.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CUSTOMER & STAY CARD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <div>
            <span className="text-slate-400 font-medium block">Misafir</span>
            <strong className="text-slate-800 dark:text-slate-200">{completedCheckoutData.guest.first_name} {completedCheckoutData.guest.last_name}</strong>
            <span className="text-[10px] text-slate-400 block">{completedCheckoutData.guest.identity_no}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Konaklama</span>
            <strong className="text-slate-800 dark:text-slate-200">{completedCheckoutData.details.nights} Gece • {completedCheckoutData.details.totalPersons} Kişi</strong>
            <span className="text-[10px] text-slate-400 block">{completedCheckoutData.details.boardTypeLabel}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Tarihler</span>
            <strong className="text-slate-800 dark:text-slate-200">{completedCheckoutData.details.checkInDate}</strong>
            <span className="text-[10px] text-slate-400 block">{completedCheckoutData.details.checkOutDate}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Ödeme Yöntemi</span>
            <strong className="text-emerald-600 font-bold">{completedCheckoutData.paymentMethod}</strong>
            <span className="text-[10px] text-slate-400 block">Tahsil Edildi</span>
          </div>
        </div>

        {/* DETAILED STATEMENT BREAKDOWN */}
        <div className="space-y-2.5">
          {/* ACCOMMODATION ITEMIZATION */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between text-xs font-bold text-blue-950 dark:text-blue-200 mb-2">
              <span>1. Konaklama Dökümü ({completedCheckoutData.details.nights} Gece x {completedCheckoutData.details.totalPersons} Kişi)</span>
              <span>₺{completedCheckoutData.details.totalRawRoomRate.toLocaleString('tr-TR')}</span>
            </div>
            <div className="space-y-1">
              {completedCheckoutData.details.personList.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-[11px] bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">Yaş: {p.age} ({p.category})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">₺{p.netRate.toLocaleString('tr-TR')}</span>
                    {p.discountAmount > 0 && (
                      <span className="text-[10px] text-emerald-600 ml-1.5 font-semibold">(-₺{p.discountAmount.toLocaleString('tr-TR')})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white pt-2 mt-2 border-t border-blue-200/60 dark:border-blue-900/60">
              <span>Net Oda Bedeli:</span>
              <span>₺{completedCheckoutData.details.netRoomRate.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          {/* RESTAURANT CHARGES */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              <span>2. Restoran & Kafeterya Harcamaları ({completedCheckoutData.details.restaurantItems?.length || 0} Kalem)</span>
              <span>₺{completedCheckoutData.details.restaurantTotal.toLocaleString('tr-TR')}</span>
            </div>
            {(completedCheckoutData.details.restaurantItems?.length || 0) === 0 ? (
              <p className="text-[11px] text-slate-400 py-1">Kayıtlı restoran harcaması bulunmuyor.</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {(completedCheckoutData.details.restaurantItems || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">{item.date} • {item.category}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">₺{item.finalAmount.toLocaleString('tr-TR')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADVANCE PAYMENT */}
          {completedCheckoutData.details.advancePayment > 0 && (
            <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span>(-) Girişte Alınan Kapora / Ön Ödeme:</span>
              <span>-₺{completedCheckoutData.details.advancePayment.toLocaleString('tr-TR')}</span>
            </div>
          )}
        </div>

        {/* TOTAL COLLECTED BOX */}
        <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs font-extrabold text-slate-400 block uppercase">Tahsil Edilen Net Tutar</span>
            <span className="text-[10px] text-slate-400">
              {completedCheckoutData.paymentMethod} ile tahsil edildi • Oda boş ve temizliğe hazır
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ₺{completedCheckoutData.details.netPayableBalance.toLocaleString('tr-TR')}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => handlePrintFolio(completedCheckoutData.room, completedCheckoutData.paymentMethod)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Müşteri Ekstresini Tekrar Yazdır</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer shadow-md"
          >
            Kapat ve Odaya Dön
          </button>
        </div>
      </div>
    </div>
  );
};
