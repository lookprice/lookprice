import React from "react";
import { motion } from "motion/react";
import { X, Clock, Check } from "lucide-react";

interface ConfirmSaleModalProps {
  showSaleModal: boolean;
  setShowSaleModal: (show: boolean) => void;
  selectedQuotation: any;
  handleConfirmSale: (e: React.FormEvent) => void;
  dueDate: string;
  setDueDate: (d: string) => void;
  saleNotes: string;
  setSaleNotes: (n: string) => void;
  createCompanyFromSale: boolean;
  setCreateCompanyFromSale: (c: boolean) => void;
  isConfirmingSale: boolean;
  translations: any;
  lang: string;
}

export const ConfirmSaleModal: React.FC<ConfirmSaleModalProps> = ({
  showSaleModal,
  setShowSaleModal,
  selectedQuotation,
  handleConfirmSale,
  dueDate,
  setDueDate,
  saleNotes,
  setSaleNotes,
  createCompanyFromSale,
  setCreateCompanyFromSale,
  isConfirmingSale,
  translations: t,
  lang
}) => {
  if (!showSaleModal || !selectedQuotation) return null;

  const isTr = lang === 'tr';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900">{t.convertToSale}</h3>
          <button onClick={() => setShowSaleModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleConfirmSale} className="p-6 space-y-5">
          <div className="p-4 bg-indigo-600 rounded-2xl text-white">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{t.amount}</span>
              <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-lg">#{selectedQuotation.id}</span>
            </div>
            <p className="text-2xl font-bold">
              {Number(selectedQuotation.total_amount).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {selectedQuotation.currency}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isTr ? "Vade Tarihi" : "Due Date"}</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="date" 
                  required 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-xs" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.notes}</label>
              <textarea 
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none text-xs" 
                rows={3}
                placeholder={isTr ? "Fatura notları (opsiyonel)..." : "Invoice notes (optional)..."}
              />
            </div>

            {selectedQuotation.customer_name && !selectedQuotation.company_id && (
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    createCompanyFromSale ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200 group-hover:border-indigo-300'
                  }`}>
                    {createCompanyFromSale && <Check className="h-4 w-4 text-white" />}
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={createCompanyFromSale}
                      onChange={(e) => setCreateCompanyFromSale(e.target.checked)}
                    />
                  </div>
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-tighter">
                    {isTr ? "Müşteriyi Cari Kart Olarak Kaydet" : "Register Customer as Company Chart"}
                  </span>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => setShowSaleModal(false)}
              className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all cursor-pointer"
            >
              {t.cancel}
            </button>
            <button 
              type="submit" 
              disabled={isConfirmingSale}
              className="flex-[2] px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isConfirmingSale ? t.loading : t.confirm}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
