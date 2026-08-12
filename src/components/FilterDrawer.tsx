import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Filter } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-slate-950 z-50 shadow-2xl border-l border-slate-800 overflow-y-auto"
          >
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Filter className="w-5 h-5" /> Detaylı Arama
              </h2>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
