import React from 'react';
import { motion } from 'motion/react';
import { Gift } from 'lucide-react';

interface PosIkramNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  ikramNote: string;
  setIkramNote: (note: string) => void;
  pendingIkramAction: (() => void) | null;
  setPendingIkramAction: (action: (() => void) | null) => void;
}

export const PosIkramNoteModal: React.FC<PosIkramNoteModalProps> = ({
  isOpen,
  onClose,
  lang,
  ikramNote,
  setIkramNote,
  pendingIkramAction,
  setPendingIkramAction,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -10 }}
        className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full overflow-hidden"
      >
        <div className="p-5 flex flex-col gap-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-1">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-center text-lg font-black text-slate-800 tracking-tight">
            {lang === 'tr' ? 'İkram Detayı Gerekli' : 'Complimentary Note Required'}
          </h3>
          <p className="text-center text-xs font-medium text-slate-500 px-2">
            {lang === 'tr' 
              ? 'Adisyonda ikram ürün bulunuyor. Lütfen ikramın kime/hangi kuruma yapıldığını belirtin.' 
              : 'Cart contains complimentary items. Please provide details (who received it).'}
          </p>
          <textarea
            value={ikramNote}
            onChange={(e) => setIkramNote(e.target.value)}
            placeholder={lang === 'tr' ? 'Örn: Ahmet Bey (Müdür) veya X Firması için...' : 'e.g. Mr. John (Manager)...'}
            className="w-full mt-2 p-3 text-sm border border-slate-300 rounded-xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all min-h-[80px]"
          />
        </div>
        <div className="flex bg-slate-50 border-t border-slate-100 p-3 gap-2">
          <button
            onClick={() => {
              onClose();
              setPendingIkramAction(null);
            }}
            className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            {lang === 'tr' ? 'İptal' : 'Cancel'}
          </button>
          <button
            disabled={ikramNote.trim().length < 3}
            onClick={() => {
              onClose();
              if (pendingIkramAction) {
                pendingIkramAction();
                setPendingIkramAction(null);
              }
            }}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            {lang === 'tr' ? 'Kaydet ve Devam Et' : 'Save & Continue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
