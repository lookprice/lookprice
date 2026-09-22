import React from "react";
import { motion } from "motion/react";
import { X, FileDown } from "lucide-react";

interface DailyReportModalProps {
  showDailyReportModal: boolean;
  setShowDailyReportModal: (show: boolean) => void;
  dailyReportData: { summary: any[], details: any[] };
  reportStartDate: string;
  setReportStartDate: (d: string) => void;
  reportEndDate: string;
  setReportEndDate: (d: string) => void;
  fetchDailySalesReport: () => void;
  reportLoading: boolean;
  handleDownloadDailyReportExcel: () => void;
  branding: any;
  translations: any;
  lang: string;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  showDailyReportModal,
  setShowDailyReportModal,
  dailyReportData,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  fetchDailySalesReport,
  reportLoading,
  handleDownloadDailyReportExcel,
  branding,
  translations: t,
  lang
}) => {
  if (!showDailyReportModal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{t.dailySalesReport}</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{branding.store_name}</p>
          </div>
          <button onClick={() => setShowDailyReportModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.startDate}</label>
              <input 
                type="date" 
                value={reportStartDate} 
                onChange={(e) => setReportStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-semibold" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.endDate}</label>
              <input 
                type="date" 
                value={reportEndDate} 
                onChange={(e) => setReportEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all text-xs font-semibold" 
              />
            </div>
            <button 
              onClick={fetchDailySalesReport}
              disabled={reportLoading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 text-xs cursor-pointer"
            >
              {reportLoading ? t.loading : t.getReport}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['cash', 'credit_card', 'bank', 'term'].map((method) => {
              const data = (dailyReportData.summary || []).find(d => d.payment_method === method) || { total_amount: 0, transaction_count: 0 };
              return (
                <div key={method} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{t[method] || method}</span>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg">
                      {data.transaction_count} {t.transactionCount}
                    </span>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">
                    {Number(data.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {branding.default_currency?.slice(0, 3)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">{lang === 'tr' ? 'TOPLAM GENEL' : 'GRAND TOTAL'}</p>
                <p className="text-3xl font-bold">
                  {(dailyReportData.summary || []).reduce((acc, curr) => acc + Number(curr.total_amount), 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {branding.default_currency?.slice(0, 3)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">{t.transactionCount}</p>
                <p className="text-xl font-bold">
                  {(dailyReportData.summary || []).reduce((acc, curr) => acc + Number(curr.transaction_count), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button 
            onClick={handleDownloadDailyReportExcel}
            disabled={!dailyReportData.details || dailyReportData.details.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50 text-xs cursor-pointer"
          >
            <FileDown className="h-4 w-4" /> {lang === 'tr' ? 'Excel İndir' : 'Download Excel'}
          </button>
          <button 
            onClick={() => setShowDailyReportModal(false)}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-xs cursor-pointer"
          >
            {t.close || 'Kapat'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
