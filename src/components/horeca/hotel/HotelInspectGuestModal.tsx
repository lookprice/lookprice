import React from "react";
import { UserCheck, X, Plus, Receipt } from "lucide-react";

export interface HotelInspectGuestModalProps {
  inspectGuestModal: any | null;
  onClose: () => void;
  formatDisplayDate: (val: string | null | undefined) => string;
  setAddExpenseModalRoom: (room: any) => void;
  setCheckOutModalRoom: (room: any) => void;
  setSelectedAgeCategoryModal: (modal: any) => void;
}

export const HotelInspectGuestModal: React.FC<HotelInspectGuestModalProps> = ({
  inspectGuestModal,
  onClose,
  formatDisplayDate,
  setAddExpenseModalRoom,
  setCheckOutModalRoom,
  setSelectedAgeCategoryModal,
}) => {
  if (!inspectGuestModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-sm">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {inspectGuestModal.full_name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  Oda #{inspectGuestModal.room_number} • {inspectGuestModal.room_type}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-black text-slate-700 dark:text-slate-300">
                  {inspectGuestModal.role_label}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* AGE & DISCOUNT HIGHLIGHT CARD */}
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-indigo-950/40 dark:to-emerald-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-900 dark:text-indigo-300 tracking-wider">Yaş Grubu & İndirim Hak Edişi</p>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {inspectGuestModal.age} Yaş • {inspectGuestModal.age_category_label}
              </p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black">
                %{inspectGuestModal.discount_rate || 0} İndirim
              </span>
            </div>
          </div>
          {inspectGuestModal.discount_text && (
            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
              {inspectGuestModal.discount_text}
            </p>
          )}
        </div>

        {/* DOSSIER GRID */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">Doğum Tarihi</span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              {inspectGuestModal.birth_date ? formatDisplayDate(inspectGuestModal.birth_date) : 'Belirtilmedi'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">T.C. / Kimlik / Pasaport</span>
            <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">
              {inspectGuestModal.identity_no || '-'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">İletişim Telefonu</span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              {inspectGuestModal.phone || '-'}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">Pansiyon Tipi</span>
            <p className="font-bold text-slate-900 dark:text-white mt-0.5">
              {inspectGuestModal.board_type}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">Giriş Tarihi</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatDisplayDate(inspectGuestModal.check_in_date)}
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">Çıkış Tarihi</span>
            <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {formatDisplayDate(inspectGuestModal.check_out_date)}
            </p>
          </div>
        </div>

        {/* ROOM FOLIO SUMMARY */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Oda Güncel Folyo Durumu</p>
              <p className="text-xl font-black text-amber-300">
                ₺{(inspectGuestModal.room?.folio?.total_amount || 0).toLocaleString('tr-TR')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-300">
                {inspectGuestModal.room?.folio?.items?.length || 0} Adet Adisyon/Harcama
              </span>
            </div>
          </div>
        </div>

        {/* MODAL ACTIONS */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
          >
            Kapat
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const r = inspectGuestModal.room;
                onClose();
                setSelectedAgeCategoryModal(null);
                setAddExpenseModalRoom(r);
              }}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Adisyon Ekle</span>
            </button>

            {inspectGuestModal.room_status === 'occupied' && inspectGuestModal.age >= 18 && (
              <button
                type="button"
                onClick={() => {
                  const r = inspectGuestModal.room;
                  onClose();
                  setSelectedAgeCategoryModal(null);
                  setCheckOutModalRoom(r);
                }}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Receipt className="h-4 w-4" />
                <span>Folyo Kapat & Check-Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
