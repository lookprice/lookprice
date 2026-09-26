import React from "react";
import { BedDouble, X } from "lucide-react";

interface HotelAssignRoomModalProps {
  assignRoomModalRes: any | null;
  onClose: () => void;
  rooms: any[];
  selectedTargetRoomId: string;
  setSelectedTargetRoomId: (id: string) => void;
  formatThousand: (val: number | string) => string;
  handleCheckInOnlineReservation: (res: any, targetRoomId?: string) => void;
}

export const HotelAssignRoomModal: React.FC<HotelAssignRoomModalProps> = ({
  assignRoomModalRes,
  onClose,
  rooms,
  selectedTargetRoomId,
  setSelectedTargetRoomId,
  formatThousand,
  handleCheckInOnlineReservation,
}) => {
  if (!assignRoomModalRes) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-indigo-500" />
            <span>Oda Seçimi & Tahsisi</span>
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          <strong>{assignRoomModalRes.guest_first_name} {assignRoomModalRes.guest_last_name}</strong> isimli misafirin rezervasyonu için bir oda seçiniz:
        </p>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {rooms.map(r => {
            const targetIn = assignRoomModalRes?.check_in_date || new Date().toISOString().split('T')[0];
            const targetOut = assignRoomModalRes?.check_out_date || new Date(Date.now() + 86400000).toISOString().split('T')[0];

            const hasGuestConflict = r.status === 'occupied' && r.current_guest &&
              (r.current_guest.check_in_date < targetOut && r.current_guest.check_out_date > targetIn);

            const currentResId = assignRoomModalRes?.id;
            const currentResCode = assignRoomModalRes?.reservation_code;

            const hasReservationConflict = Array.isArray(r.reservations) &&
              r.reservations.some(res => 
                res.status !== 'cancelled' && 
                res.id !== currentResId && 
                res.reservation_code !== currentResCode &&
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
              statusLabel = '⚠️ Servis Dışı';
            } else if (isConflictForSelectedDates) {
              statusLabel = `🔴 Seçilen Tarihlerde Dolu (${targetIn} — ${targetOut})`;
            } else if (isCurrentlyOccupiedToday && targetIn > todayStr) {
              statusLabel = `🟡 Şu An Dolu (Fakat ${targetIn} İleri Tarihinde Müsait)`;
            } else if (Array.isArray(r.reservations) && r.reservations.filter((res: any) => res.status !== 'cancelled' && res.id !== currentResId && res.reservation_code !== currentResCode).length > 0) {
              statusLabel = '🟢 Müsait (Gelecekte Rezervasyonu Var)';
            }

            return (
              <label 
                key={r.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isConflictForSelectedDates || isMaintenance
                    ? 'opacity-50 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 cursor-not-allowed'
                    : selectedTargetRoomId === r.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500 cursor-pointer'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-400 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="assign_room_select"
                    disabled={isConflictForSelectedDates || isMaintenance}
                    checked={selectedTargetRoomId === r.id}
                    onChange={() => setSelectedTargetRoomId(r.id)}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">
                      Oda #{r.room_number} - {r.room_type}
                    </p>
                    <span className={`text-[10px] font-bold ${isConflictForSelectedDates ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                  ₺{formatThousand(r.price_per_night || 0)} /gece
                </span>
              </label>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            disabled={!selectedTargetRoomId}
            onClick={() => handleCheckInOnlineReservation(assignRoomModalRes, selectedTargetRoomId)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-md cursor-pointer transition-all active:scale-95"
          >
            Seçili Odaya Yerleştir
          </button>
        </div>
      </div>
    </div>
  );
};
