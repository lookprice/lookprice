import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, X } from 'lucide-react';

interface PosTransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string | null;
  allTables: any[];
  transferLoading: boolean;
  onTableTransfer: (targetTableNumber: string) => void;
  lang: string;
}

export const PosTransferTableModal: React.FC<PosTransferTableModalProps> = ({
  isOpen,
  onClose,
  selectedTable,
  allTables,
  transferLoading,
  onTableTransfer,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col border border-slate-100 max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">{lang === 'tr' ? 'Masa Taşıma / Değiştirme' : 'Table Transfer / Change'}</h3>
              <p className="text-xs text-slate-400 font-semibold">{lang === 'tr' ? `${selectedTable} masasındaki adisyonu taşıyın` : `Transfer bill from ${selectedTable}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-8 gap-2">
            {allTables.map((table) => (
              <button
                key={table.id}
                disabled={table.status === 'occupied' || table.table_number === selectedTable || transferLoading}
                onClick={() => onTableTransfer(table.table_number)}
                className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 group relative cursor-pointer ${
                  table.table_number === selectedTable ? 'border-indigo-600 bg-indigo-50 opacity-50' :
                  table.status === 'occupied' ? 'border-rose-100 bg-rose-50 opacity-50 cursor-not-allowed' :
                  'border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/40'
                }`}
              >
                <span className={`text-xs font-black truncate w-full text-center ${table.status === 'occupied' ? 'text-rose-600' : 'text-slate-900'}`}>{table.table_number}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                  {table.status === 'occupied' ? (lang === 'tr' ? 'DOLU' : 'FULL') : (lang === 'tr' ? 'BOŞ' : 'EMPTY')}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer"
          >
            {lang === 'tr' ? 'İptal' : 'Cancel'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
