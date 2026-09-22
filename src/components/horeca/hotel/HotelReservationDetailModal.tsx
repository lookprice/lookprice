import React from "react";
import { UserCheck, X, Baby } from "lucide-react";

export interface HotelReservationDetailModalProps {
  selectedReservationModal: any | null;
  onClose: () => void;
  formatDisplayDate: (val: string | null | undefined) => string;
  calculateAgeDetails: (birthDate?: string, manualAge?: number) => any;
}

export const HotelReservationDetailModal: React.FC<HotelReservationDetailModalProps> = ({
  selectedReservationModal,
  onClose,
  formatDisplayDate,
  calculateAgeDetails,
}) => {
  if (!selectedReservationModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Oda #{selectedReservationModal.room.room_number} - Rezervasyon Detayı
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                {selectedReservationModal.room.room_type}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* MAIN GUEST HEADER */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-500">Ana Misafir / Ad Soyad</span>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {selectedReservationModal.res.first_name} {selectedReservationModal.res.last_name}
              </p>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold mt-0.5">
                TC/Pasaport: {selectedReservationModal.res.identity_no || 'Belirtilmedi'} | Tel: {selectedReservationModal.res.phone || 'Yok'}
              </p>
            </div>
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black">
              {selectedReservationModal.res.board_type || 'BB'} Pansiyon
            </span>
          </div>

          {/* DATES & NIGHTS */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">Giriş Tarihi:</span>
              <p className="text-slate-900 dark:text-white text-sm font-black">{formatDisplayDate(selectedReservationModal.res.check_in_date)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black">Çıkış Tarihi:</span>
              <p className="text-slate-900 dark:text-white text-sm font-black">{formatDisplayDate(selectedReservationModal.res.check_out_date)}</p>
            </div>
          </div>

          {/* AGE & GUESTS BREAKDOWN */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
              <Baby className="h-4 w-4 text-amber-500" />
              <span>Konaklayan Yaş & Kişi Kırılımı</span>
            </h4>

            <div className="space-y-1.5">
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                <span>1. {selectedReservationModal.res.first_name} {selectedReservationModal.res.last_name} (Ana Misafir)</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 rounded text-[10px] font-black">
                  {selectedReservationModal.res.main_guest_age || 35} Yaş (Yetişkin)
                </span>
              </div>

              {selectedReservationModal.res.guests?.map((g: any, idx: number) => {
                const ageDetails = calculateAgeDetails(g.birth_date, g.age);
                return (
                  <div key={idx} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                    <span>{idx + 2}. {g.first_name} {g.last_name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-700 dark:text-slate-300">{ageDetails.age} Yaş</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        ageDetails.bracket === 'infant' ? 'bg-rose-100 text-rose-900' :
                        ageDetails.bracket === 'toddler' ? 'bg-emerald-100 text-emerald-900' :
                        ageDetails.bracket === 'child' ? 'bg-sky-100 text-sky-900' : 'bg-slate-200 text-slate-900'
                      }`}>
                        {ageDetails.labelTr} ({ageDetails.discountText})
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
