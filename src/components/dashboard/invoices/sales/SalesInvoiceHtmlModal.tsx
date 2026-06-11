import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Loader2 } from 'lucide-react';

interface SalesInvoiceHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  htmlLoading: boolean;
  isTr: boolean;
}

export const SalesInvoiceHtmlModal: React.FC<SalesInvoiceHtmlModalProps> = ({
  isOpen,
  onClose,
  htmlContent,
  htmlLoading,
  isTr
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden border border-slate-200 flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-xl font-bold text-slate-900">{isTr ? 'E-Fatura Görseli' : 'E-Invoice Preview'}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                   const win = window.open('', '_blank');
                   if (win) {
                     win.document.write(htmlContent);
                     win.document.close();
                     setTimeout(() => win.print(), 500);
                   }
                }} 
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 flex items-center gap-2 text-sm font-bold"
              >
                <Printer className="h-4 w-4" />
                {isTr ? 'Yazdır' : 'Print'}
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4 bg-slate-100 flex justify-center">
            {htmlLoading ? (
               <div className="flex flex-col items-center justify-center h-full gap-4">
                 <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                 <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">{isTr ? 'Görsel Hazırlanıyor...' : 'Preparing Preview...'}</p>
               </div>
            ) : (
              <div 
                className="w-full h-full bg-white shadow-inner p-4 min-h-screen"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
