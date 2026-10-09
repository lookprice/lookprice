import React from 'react';
import { motion } from 'framer-motion';
import { Tag, X, Trash2, CheckCircle2 } from 'lucide-react';

interface PosTableNicknameModalProps {
  activeNicknameModal: string | null;
  setActiveNicknameModal: (val: string | null) => void;
  activeNicknameInput: string;
  setActiveNicknameInput: (val: string) => void;
  lang: string;
  storeId?: string | number;
  tableNicknames: Record<string, string>;
  saveTableNickname: (storeId: string | number, tableNo: string, name: string) => void;
  clearStoredTableNickname: (storeId: string | number, tableNo: string) => void;
}

export const PosTableNicknameModal: React.FC<PosTableNicknameModalProps> = ({
  activeNicknameModal,
  setActiveNicknameModal,
  activeNicknameInput,
  setActiveNicknameInput,
  lang,
  storeId,
  tableNicknames,
  saveTableNickname,
  clearStoredTableNickname,
}) => {
  if (!activeNicknameModal) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={() => setActiveNicknameModal(null)}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-200">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {activeNicknameModal} — {lang === 'tr' ? 'Geçici Masa Takma Adı' : 'Table Nickname / Note'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {lang === 'tr' ? 'Hesap kapatılana kadar masayı kolayca tanımanızı sağlar' : 'Helps identify the table until checkout'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveNicknameModal(null)}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <label className="block text-xs font-bold text-slate-700">
            {lang === 'tr' ? 'Masa Takma Adı / Müşteri Notu (Örn: Selçuk Bey, VIP Köşe):' : 'Table Nickname / Note (e.g. Selçuk Bey, VIP Corner):'}
          </label>
          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder={lang === 'tr' ? 'Örn: Selçuk Bey, Mavi Gömlekli...' : 'e.g. Selçuk Bey, Blue Shirt...'}
              value={activeNicknameInput}
              onChange={(e) => setActiveNicknameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (storeId) saveTableNickname(storeId, activeNicknameModal, activeNicknameInput);
                  setActiveNicknameModal(null);
                }
                if (e.key === 'Escape') setActiveNicknameModal(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
            />
            {activeNicknameInput && (
              <button
                type="button"
                onClick={() => setActiveNicknameInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Tag className="h-3 w-3 text-amber-500" />
            <span>{lang === 'tr' ? 'Hızlı Seçenekler:' : 'Quick Suggestions:'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Selçuk Bey', 'Ahmet Bey', 'Mehmet Bey', 'VIP Grup', 'Balkon Köşe', "Bahçe 4'lü", 'Mavi Gömlekli', 'Aile Masası', 'Toplantı', 'Rezervasyon'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setActiveNicknameInput(preset)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
                  activeNicknameInput === preset
                    ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-100 hover:bg-amber-50 hover:border-amber-200 text-slate-700 border-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Actions footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          {(() => {
            const cleanNum = activeNicknameModal.replace(/^Masa\s+/i, '').trim();
            const hasNick = tableNicknames[cleanNum] || tableNicknames[activeNicknameModal];
            if (hasNick) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    if (storeId) clearStoredTableNickname(storeId, activeNicknameModal);
                    setActiveNicknameModal(null);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{lang === 'tr' ? 'İsmi Kaldır' : 'Remove Name'}</span>
                </button>
              );
            }
            return <div />;
          })()}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveNicknameModal(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (storeId) saveTableNickname(storeId, activeNicknameModal, activeNicknameInput);
                setActiveNicknameModal(null);
              }}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-200 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{lang === 'tr' ? 'Kaydet' : 'Save'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
