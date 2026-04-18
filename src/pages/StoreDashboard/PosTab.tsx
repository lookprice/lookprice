import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Download,
  CreditCard,
  Trash2
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
  isViewer?: boolean;
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
  isViewer = false,
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
    <div className="space-y-10">
      <div className="os-panel p-6 bg-slate-950 border-indigo-500/20 shadow-2xl shadow-indigo-900/10">
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 flex-1">
            <div className="flex flex-col space-y-2 flex-1 sm:flex-none">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Archive_Temporal_Range</span>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 shadow-inner focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/30 transition-all">
                <input 
                  type="date" 
                  className="bg-transparent border-none p-1 text-[11px] font-black text-white focus:ring-0 outline-none w-[16ch] cursor-pointer"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
                <span className="text-slate-700 font-bold mx-2 italic">—</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none p-1 text-[11px] font-black text-white focus:ring-0 outline-none w-[16ch] cursor-pointer"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-2 flex-1 sm:flex-none">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Log_Status_Filter</span>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors pointer-events-none" />
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-[11px] font-black text-white hover:bg-white/10 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 appearance-none shadow-sm cursor-pointer transition-all uppercase tracking-widest"
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                >
                  <option value="all" className="bg-slate-900">{t.all}</option>
                  <option value="pending" className="bg-slate-900">{t.pending}</option>
                  <option value="completed" className="bg-slate-900">{t.completed}</option>
                  <option value="cancelled" className="bg-slate-900">{t.cancelled}</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgb(99,102,241)]" />
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={onExportReport}
            className="os-btn-primary py-4 px-8 text-xs flex items-center justify-center gap-3 active:scale-95 group"
          >
            <Download className="h-4.5 w-4.5 group-hover:translate-y-0.5 transition-transform" /> 
            <span>{t.cashReport}</span>
          </button>
        </div>
      </div>

      <div className="os-panel overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.orderCode}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.date}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.customer}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.amount}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.status}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-5"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    {t.noSales}
                  </td>
                </tr>
              ) : (
                paginatedSales.map((s) => (
                  <tr 
                    key={s.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-default"
                  >
                    <td className="px-6 py-5">
                      <span className="font-mono text-[10px] font-black text-slate-900 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm tracking-widest">#{s.id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[13px] font-black text-slate-900 leading-none">{new Date(s.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400 font-black mt-1.5 uppercase tracking-tighter tabular-nums flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {new Date(s.created_at).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[13px] font-black text-slate-500 uppercase tracking-tight">
                      {s.customer_name || "WALK_IN_CUSTOMER"}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[15px] font-black text-slate-900 mono-data tracking-tighter">
                        {Number(s.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-[11px] text-slate-400 font-bold tracking-normal ml-1">{(s.currency || 'TRY').substring(0, 3)}</span>
                      </div>
                      <div className="text-[9px] text-indigo-500 uppercase font-black tracking-[0.15em] flex items-center mt-1.5">
                        <div className="w-3 h-3 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center mr-1.5">
                          <CreditCard className="h-2 w-2" />
                        </div>
                        {t[s.payment_method] || s.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${
                        s.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        s.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                        s.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-[0_0_12px_rgba(37,99,235,0.1)]' :
                        s.status === 'shipped' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        <div className={`w-1 h-1 rounded-full mr-2 ${
                            s.status === 'completed' ? 'bg-emerald-500' : 
                            s.status === 'cancelled' ? 'bg-rose-500' : 
                            'bg-indigo-500 animate-pulse'
                          }`} />
                        {t[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button 
                          onClick={() => onViewDetails(s)}
                          className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200 active:scale-90"
                          title={t.viewDetails}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        {!isViewer && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSale(s.id);
                            }}
                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 active:scale-90"
                            title={t.delete}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {sales.length} RECORDS_PARSED
            </p>
            <div className="flex items-center space-x-6">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="os-btn-secondary px-6 py-2.5 text-[11px] disabled:opacity-30"
              >
                <span>{t.prev}</span>
              </button>
              <div className="text-[11px] font-black text-slate-900 tabular-nums tracking-widest flex items-center">
                <span>INDEX</span>
                <span className="mx-2 px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-inner font-mono">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="os-btn-secondary px-6 py-2.5 text-[11px] disabled:opacity-30"
              >
                <span>{t.next}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PosTab;
