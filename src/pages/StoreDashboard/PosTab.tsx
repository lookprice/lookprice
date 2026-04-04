import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Download,
  CreditCard
} from "lucide-react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface PosTabProps {
  sales: any[];
  loading: boolean;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onViewDetails: (sale: any) => void;
  onDeleteSale: (id: number) => void;
  onExportReport: () => void;
}

const PosTab = ({ 
  sales, 
  loading, 
  statusFilter, 
  onStatusFilterChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onViewDetails,
  onDeleteSale,
  onExportReport
}: PosTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;

  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const paginatedSales = sales.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(sales.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
            <div className="flex flex-col space-y-1.5 flex-1 sm:flex-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.dateRange}</span>
              <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2 py-2 shadow-sm focus-within:ring-4 focus-within:ring-slate-500/5 focus-within:border-slate-400 transition-all">
                <input 
                  type="date" 
                  className="bg-transparent border-none p-1 text-xs font-semibold text-slate-900 focus:ring-0 outline-none w-[16ch]"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
                <span className="text-slate-300 font-bold mx-1">-</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none p-1 text-xs font-semibold text-slate-900 focus:ring-0 outline-none w-[16ch]"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5 flex-1 sm:flex-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t.status}</span>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-slate-700 focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 appearance-none shadow-sm cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                >
                  <option value="all">{t.all}</option>
                  <option value="pending">{t.pending}</option>
                  <option value="completed">{t.completed}</option>
                  <option value="cancelled">{t.cancelled}</option>
                </select>
              </div>
            </div>
          </div>
          <button 
            onClick={onExportReport}
            className="flex items-center justify-center bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            <Download className="h-4 w-4 mr-2" /> {t.cashReport}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto zebra-border border-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.orderCode}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.customer}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.amount}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.status}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm font-medium">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {t.noSales}
                  </td>
                </tr>
              ) : (
                paginatedSales.map((s) => (
                  <tr 
                    key={s.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onViewDetails(s)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">#{s.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{new Date(s.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(s.created_at).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                      {s.customer_name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">
                        {Number(s.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{(s.currency || 'TRY').substring(0, 3)}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight flex items-center mt-0.5">
                        <CreditCard className="h-2.5 w-2.5 mr-1" /> {t[s.payment_method] || s.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        s.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        s.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {t[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center space-x-2 transition-opacity">
                        <button 
                          onClick={() => onViewDetails(s)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                          title={t.viewDetails}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => onDeleteSale(s.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                          title={t.delete}
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              {sales.length} {t.sales}
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                {t.prev}
              </button>
              <div className="text-xs font-bold text-slate-600 tabular-nums">
                {page} <span className="text-slate-300 mx-1">/</span> {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PosTab;
