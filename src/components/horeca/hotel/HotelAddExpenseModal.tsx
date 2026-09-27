import React from 'react';
import { X, PlusCircle, Utensils, Coffee, Wine, Sparkles } from 'lucide-react';
import { HotelRoom } from '../HotelRoomManagement';

interface HotelAddExpenseModalProps {
  room: HotelRoom | null;
  onClose: () => void;
  manualExpense: { title: string; amount: number; category?: string };
  setManualExpense: React.Dispatch<React.SetStateAction<{ title: string; amount: number; category?: string }>>;
  handleAddExpenseToFolio: (e: React.FormEvent) => void;
}

export const HotelAddExpenseModal: React.FC<HotelAddExpenseModalProps> = ({
  room,
  onClose,
  manualExpense,
  setManualExpense,
  handleAddExpenseToFolio
}) => {
  if (!room) return null;

  const guestName = room.current_guest ? `${room.current_guest.first_name} ${room.current_guest.last_name}` : "Konaklayan Misafir";

  const quickTemplates = [
    { label: "Restoran Adisyon", icon: <Utensils className="h-3 w-3" />, defaultTitle: "Restoran Adisyonu", defaultAmount: 250, cat: "Restoran" },
    { label: "Kafeterya", icon: <Coffee className="h-3 w-3" />, defaultTitle: "Kafeterya Harcaması", defaultAmount: 120, cat: "Kafeterya" },
    { label: "Minibar", icon: <Wine className="h-3 w-3" />, defaultTitle: "Minibar Tüketimi", defaultAmount: 180, cat: "Minibar" },
    { label: "Oda Servisi", icon: <Sparkles className="h-3 w-3" />, defaultTitle: "Oda Servisi (Room Service)", defaultAmount: 300, cat: "Oda Servisi" },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Oda #{room.room_number}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                  Adisyon / Harcama Ekle
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {guestName} • Folio Hesabına Ekstra Harcama İşleme
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QUICK TEMPLATES */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
            Hızlı Harcama Şablonları
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {quickTemplates.map((t, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setManualExpense({
                    title: t.defaultTitle,
                    amount: t.defaultAmount,
                    category: t.cat
                  });
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-amber-700 rounded-xl text-left transition-all flex items-center gap-2 cursor-pointer group"
              >
                <span className="text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400">{t.icon}</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleAddExpenseToFolio} className="space-y-3 pt-1">
          <div>
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Harcama Kalemi / Adisyon Açıklaması *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Örn: Restoran Adisyon #1092, Mini Bar, Kahve..."
              value={manualExpense.title}
              onChange={(e) => setManualExpense(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Kategori
              </label>
              <select
                value={manualExpense.category || "Restoran"}
                onChange={(e) => setManualExpense(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value="Restoran">Restoran</option>
                <option value="Kafeterya">Kafeterya</option>
                <option value="Minibar">Minibar</option>
                <option value="Oda Servisi">Oda Servisi</option>
                <option value="Çamaşırhane">Çamaşırhane</option>
                <option value="Spa / Masaj">Spa / Masaj</option>
                <option value="Diğer">Diğer Ekstra</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Tutar (₺) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                placeholder="0.00"
                value={manualExpense.amount || ""}
                onChange={(e) => setManualExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={!manualExpense.title || Number(manualExpense.amount) <= 0}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Oda Hesabına Ekle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
