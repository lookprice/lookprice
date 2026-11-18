import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle2, X, RefreshCw, ShieldAlert } from 'lucide-react';

interface PosStatusModalProps {
  isOpen: boolean;
  posStatus: 'idle' | 'waiting' | 'approved' | 'failed';
  posMessage: string;
  posErrorCode?: string | null;
  canQueryLastTx?: boolean;
  onRetry?: () => void;
  onQueryLastTx?: () => void;
  lang: string;
  onClose: () => void;
}

export const PosStatusModal: React.FC<PosStatusModalProps> = ({
  isOpen,
  posStatus,
  posMessage,
  posErrorCode,
  canQueryLastTx,
  onRetry,
  onQueryLastTx,
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
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        className="bg-white rounded-3xl p-7 max-w-md w-full text-center shadow-2xl border border-slate-100"
      >
        <div className="relative mb-5">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${
            posStatus === 'waiting' ? 'bg-indigo-50 text-indigo-600' :
            posStatus === 'approved' ? 'bg-emerald-50 text-emerald-600' :
            'bg-rose-50 text-rose-600'
          }`}>
            {posStatus === 'waiting' && <CreditCard className="h-10 w-10 animate-pulse" />}
            {posStatus === 'approved' && <CheckCircle2 className="h-10 w-10" />}
            {posStatus === 'failed' && <X className="h-10 w-10" />}
          </div>
          {posStatus === 'waiting' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-20 w-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <h2 className="text-lg font-black text-slate-900 mb-1.5 uppercase tracking-tight">
          {posStatus === 'waiting' ? (lang === 'tr' ? 'ÖKC İŞLEMİ SÜRÜYOR' : 'POS TRANSACTION') :
           posStatus === 'approved' ? (lang === 'tr' ? 'MALİ ONAY ALINDI' : 'FISCAL APPROVED') :
           (lang === 'tr' ? 'ÖKC İŞLEM HATASI (ADİSYON AÇIK)' : 'POS ERROR (ORDER HELD OPEN)')}
        </h2>

        {posStatus === 'failed' && posErrorCode && (
          <span className="inline-block mb-2 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono text-[10px] font-black">
            HATA KODU: {posErrorCode}
          </span>
        )}

        <p className="text-slate-600 font-bold text-xs leading-relaxed">
          {posMessage}
        </p>

        {posStatus === 'failed' && (
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-800 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{lang === 'tr' ? 'Adisyon & Stok Güvende' : 'Order & Stock Protected'}</span>
            </div>
            <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
              {lang === 'tr'
                ? 'Mali onay alınamadığı için adisyon kapatılmadı ve stok düşülmedi. Cihaz fişi kestiyse "Son İşlemi Sorgula" ile mükerrer fiş kesmeden senkronize edebilirsiniz.'
                : 'Sale was NOT closed and stock was NOT deducted. If the device already printed a receipt, click Last TX Query to recover without duplicating receipts.'}
            </p>
          </div>
        )}

        {posStatus === 'failed' && (
          <div className="mt-5 space-y-2">
            {canQueryLastTx && onQueryLastTx && (
              <button
                type="button"
                onClick={onQueryLastTx}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'tr' ? 'Son İşlemi Sorgula (LAST_TX / Kurtar)' : 'Query Last Transaction (LAST_TX)'}</span>
              </button>
            )}
            <div className="flex gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  {lang === 'tr' ? 'Tekrar Dene' : 'Retry'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
              >
                {lang === 'tr' ? 'Adisyona Dön' : 'Back to Order'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
