import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { LegalPage } from '../../types';

interface LegalModalProps {
  isOpen: 'kvkk' | 'sales' | 'pre_info' | null;
  onClose: () => void;
  lang: string;
  legalPages?: {
    kvkk?: LegalPage;
    sales_agreement?: LegalPage;
    pre_info?: LegalPage;
  };
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  lang,
  legalPages
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-3xl rounded-[40px] shadow-lg relative z-10 overflow-hidden max-h-[85vh] flex flex-col"
          >
            <div className="p-8 border-b flex items-center justify-between shrink-0">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-normal">
                {isOpen === "kvkk"
                  ? lang === "tr"
                    ? "KVKK ve Gizlilik Politikası"
                    : "Privacy Policy"
                  : isOpen === "sales"
                    ? lang === "tr"
                      ? "Mesafeli Satış Sözleşmesi"
                      : "Sales Agreement"
                    : lang === "tr"
                      ? "Ön Bilgilendirme Formu"
                      : "Pre-Information Form"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 prose prose-slate prose-indigo max-w-none text-gray-600 leading-relaxed">
              {isOpen === "kvkk"
                ? legalPages?.kvkk?.content
                : isOpen === "sales"
                  ? legalPages?.sales_agreement?.content
                  : legalPages?.pre_info?.content}
              {!legalPages?.[isOpen === "kvkk" ? "kvkk" : isOpen === "sales" ? "sales_agreement" : "pre_info" ] && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">
                    {lang === "tr"
                      ? "İçerik henüz eklenmemiş."
                      : "Content not added yet."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
