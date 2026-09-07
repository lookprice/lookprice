import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  faq: { question: string; answer: string }[];
  lang: string;
}

export const FAQModal: React.FC<FAQModalProps> = ({
  isOpen,
  onClose,
  faq,
  lang
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
            className="bg-white w-full max-w-2xl rounded-[40px] shadow-lg relative z-10 overflow-hidden max-h-[80vh] flex flex-col"
          >
            <div className="p-8 border-b flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-normal">
                {lang === "tr" ? "Sıkça Sorulan Sorular" : "FAQ"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-4">
              {faq?.length ? (
                faq.map((item, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md group">
                    <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {item.question}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                   <p className="text-gray-400 font-medium">
                    {lang === "tr"
                      ? "Henüz soru eklenmemiş."
                      : "No questions added yet."}
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
