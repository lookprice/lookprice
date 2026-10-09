import React from "react";
import { Users, X } from "lucide-react";

export interface HotelAgeCategoryDrilldownModalProps {
  selectedAgeCategoryModal: {
    category: string;
    title: string;
    badge: string;
    guests: any[];
  } | null;
  onClose: () => void;
  formatDisplayDate: (val: string | null | undefined) => string;
  setInspectGuestModal: (guest: any) => void;
}

export const HotelAgeCategoryDrilldownModal: React.FC<HotelAgeCategoryDrilldownModalProps> = ({
  selectedAgeCategoryModal,
  onClose,
  formatDisplayDate,
  setInspectGuestModal,
}) => {
  if (!selectedAgeCategoryModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full border-2 border-indigo-200 dark:border-indigo-800 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {selectedAgeCategoryModal.title}
              </h3>
              <span className="inline-block px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-full mt-0.5">
                {selectedAgeCategoryModal.badge}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1">
          {(selectedAgeCategoryModal.guests?.length || 0) === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold">
              Bu kategoride kayıtlı misafir bulunamadı.
            </div>
          ) : (
            <div className="space-y-3">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase">
                    <th className="p-3">Oda</th>
                    <th className="p-3">Misafir Adı</th>
                    <th className="p-3">Yaş & İndirim</th>
                    <th className="p-3">Tarihler</th>
                    <th className="p-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedAgeCategoryModal.guests || []).map((g: any) => (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold">
                        <span className="px-2 py-1 bg-slate-900 text-white rounded-lg font-black text-xs">
                          #{g.room_number}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-black text-slate-900 dark:text-white">{g.full_name}</p>
                        <span className="text-[10px] text-slate-400">{g.role_label}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold rounded">
                          {g.age} Yaş • {g.age_category_label}
                        </span>
                        {g.discount_text && (
                          <p className="text-[10px] text-amber-600 font-semibold">{g.discount_text}</p>
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-600 dark:text-slate-400">
                        {formatDisplayDate(g.check_in_date)} - {formatDisplayDate(g.check_out_date)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectGuestModal(g);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-black cursor-pointer shadow-xs"
                        >
                          Detayları İncele
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-bold">
            Toplam {selectedAgeCategoryModal.guests?.length || 0} misafir kaydı listelendi
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
