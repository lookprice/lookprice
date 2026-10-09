import React from "react";
import { Check, MessageCircle, Printer } from "lucide-react";
import { CompletedReservationVoucher } from "./cafeTypes";

interface CafeBookingVoucherModalProps {
  voucher: CompletedReservationVoucher | null;
  onClose: () => void;
}

export const CafeBookingVoucherModal: React.FC<CafeBookingVoucherModalProps> = ({
  voucher,
  onClose
}) => {
  if (!voucher) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-lg w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* VOUCHER HEADER */}
        <div className="text-center space-y-2 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <h3 className="text-xl font-black text-stone-900 dark:text-white tracking-tight">
            Rezervasyonunuz Başarıyla Alındı!
          </h3>
          <p className="text-xs text-stone-500 font-bold">
            Rezervasyon Kodunuz: <span className="text-stone-900 dark:text-amber-400 font-mono font-black">{voucher.code}</span>
          </p>
        </div>

        {/* VOUCHER SUMMARY DETAILS */}
        <div className="bg-stone-50 dark:bg-stone-800/80 p-4 rounded-2xl border border-stone-200/80 space-y-3 text-xs">
          <div className="flex justify-between items-center border-b border-stone-200 pb-2">
            <span className="text-stone-500 font-bold">Oda & Tipi</span>
            <span className="font-black text-stone-900 dark:text-stone-100">
              Oda #{voucher.room.room_number} ({voucher.room.room_type})
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-200 pb-2">
            <span className="text-stone-500 font-bold">Tarih / Süre</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">
              {voucher.checkIn} ➔ {voucher.checkOut} ({voucher.nights} Gece)
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-200 pb-2">
            <span className="text-stone-500 font-bold">Pansiyon & Ödeme</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">
              {voucher.boardName} • {voucher.paymentLabel}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-stone-200 pb-2">
            <span className="text-stone-500 font-bold">Misafir</span>
            <span className="font-black text-stone-900 dark:text-stone-100">
              {voucher.guest.first_name} {voucher.guest.last_name}
            </span>
          </div>

          {/* BREAKDOWN DISPLAY */}
          <div className="pt-1">
            <span className="text-[10px] font-black uppercase text-stone-400 block mb-1">Hesap Ekstresi</span>
            <div className="p-2.5 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 space-y-1">
              <div className="flex justify-between font-bold">
                <span>{voucher.adultsCount} Yetişkin Konaklama</span>
                <span>₺{voucher.breakdown.adultsGrossAmount.toLocaleString('tr-TR')}</span>
              </div>
              {voucher.breakdown.childrenDetails.map((ch: any) => (
                <div key={ch.id} className="flex justify-between text-emerald-700 font-bold text-[11px]">
                  <span>{ch.index}. Çocuk ({ch.label}): {ch.discountText}</span>
                  <span>₺{ch.netAmount.toLocaleString('tr-TR')}</span>
                </div>
              ))}
              <div className="border-t border-stone-200 pt-1 flex justify-between font-black text-amber-600 text-sm">
                <span>Toplam Borç</span>
                <span>₺{voucher.breakdown.finalPayableTotal.toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-2 pt-2">
          <a
            href={voucher.waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp İle Teyit İlet</span>
          </a>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Yazdır / PDF İndir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-900 text-white hover:bg-stone-800 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
