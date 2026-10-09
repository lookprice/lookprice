import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle2, X } from 'lucide-react';

interface PosStatusModalProps {
  isOpen: boolean;
  posStatus: 'idle' | 'waiting' | 'approved' | 'failed';
  posMessage: string;
  lang: string;
  onClose: () => void;
}

export const PosStatusModal: React.FC<PosStatusModalProps> = ({
  isOpen,
  posStatus,
  posMessage,
  lang,
  onClose,
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
        className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100"
      >
        <div className="relative mb-8">
          <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
            posStatus === 'waiting' ? 'bg-indigo-50 text-indigo-600' : 
            posStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
            'bg-rose-50 text-rose-600'
          }`}>
            {posStatus === 'waiting' && <CreditCard className="h-12 w-12 animate-pulse" />}
            {posStatus === 'approved' && <CheckCircle2 className="h-12 w-12" />}
            {posStatus === 'failed' && <X className="h-12 w-12" />}
          </div>
          {posStatus === 'waiting' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-24 w-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        
        <h2 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">
          {posStatus === 'waiting' ? (lang === 'tr' ? 'POS İŞLEMİ' : 'POS TRANSACTION') : 
           posStatus === 'approved' ? (lang === 'tr' ? 'ONAYLANDI' : 'APPROVED') : 
           (lang === 'tr' ? 'HATA' : 'ERROR')}
        </h2>
        
        <p className="text-slate-500 font-bold text-sm leading-relaxed">
          {posMessage}
        </p>

        {posMessage.includes("Yerel bağlantı köprüsü") && (
          <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
              {lang === 'tr' ? 'Kurulum Gerekli' : 'Setup Required'}
            </h4>
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              {lang === 'tr' 
                ? 'Web tarayıcıları güvenlik nedeniyle yerel ağdaki cihazlara (192.168.x.x) doğrudan erişemez. İletişimi sağlamak için bilgisayarınızda bir "LookPrice POS Bridge" yazılımı çalışıyor olmalıdır.'
                : 'Web browsers cannot directly communicate with local network devices due to security policies. You need the "LookPrice POS Bridge" running on your computer.'}
            </p>
          </div>
        )}

        {posStatus === 'failed' && (
          <button 
            onClick={onClose}
            className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            {lang === 'tr' ? 'Kapat' : 'Close'}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};
