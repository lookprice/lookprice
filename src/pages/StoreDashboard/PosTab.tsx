import React, { useState } from "react";
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ChevronLeft,
  Download,
  CreditCard,
  Trash2,
  FileText,
  Calendar,
  Truck,
  UserCheck
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
  const isTr = lang === 'tr';

  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const paginatedSales = sales.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(sales.length / itemsPerPage);

  const handleSetLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };

  const handleClearDates = () => {
    onStartDateChange('');
    onEndDateChange('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button onClick={handleSetLast30Days} className="px-2.5 py-1 bg-white shadow-xs text-indigo-700 rounded-lg text-[11px] font-bold transition-all border border-slate-200">
              {isTr ? 'Son 30 Gün' : '30D'}
            </button>
            <button onClick={handleSetThisMonth} className="px-2.5 py-1 hover:bg-white text-slate-700 rounded-lg text-[11px] font-bold transition-all">
              {isTr ? 'Bu Ay' : 'Month'}
            </button>
            <button onClick={handleClearDates} className="px-2.5 py-1 hover:bg-white text-slate-700 rounded-lg text-[11px] font-bold transition-all">
              {isTr ? 'Tümü' : 'All'}
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-0.5" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent border-none p-0 text-[11px] font-bold text-slate-900 focus:ring-0 outline-none cursor-pointer w-24"
            />
            <span className="text-slate-300">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent border-none p-0 text-[11px] font-bold text-slate-900 focus:ring-0 outline-none cursor-pointer w-24"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select 
              className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-7 py-1.5 text-[11px] font-bold text-slate-900 hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500/30 appearance-none shadow-xs cursor-pointer transition-all"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              <option value="all">{t.all}</option>
              <option value="pending">{t.pending}</option>
              <option value="completed">{t.completed}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
            <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </div>

        <button 
          onClick={onExportReport}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95 group"
        >
          <Download className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" /> 
          <span>{t.cashReport}</span>
        </button>
      </div>

      <div className="os-panel overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3.5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.orderCode}</th>
                <th className="px-3.5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.date}</th>
                <th className="px-3.5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{lang === 'tr' ? 'Masa' : 'Table'}</th>
                <th className="px-3.5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.amount}</th>
                <th className="px-2 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-center w-[50px]">{t.status}</th>
                <th className="px-3.5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{lang === 'tr' ? 'İptal Sebebi' : 'Cancel Reason'}</th>
                <th className="px-3.5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-5"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    {t.noSales}
                  </td>
                </tr>
              ) : (
                paginatedSales.map((s) => (
                  <tr 
                    key={s.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-default"
                  >
                    <td className="px-3.5 py-4">
                      <span className="font-mono text-[10px] font-black text-slate-900 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm tracking-widest">#{s.id}</span>
                    </td>
                    <td className="px-3.5 py-4">
                      <div className="text-[12px] font-black text-slate-900 leading-none">{new Date(s.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      <div className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-tighter tabular-nums flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(s.created_at).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-3.5 py-4 text-[12px] font-black text-slate-700 uppercase tracking-tight max-w-[120px] truncate">
                      {s.customer_name?.toLowerCase().includes('garson') || s.customer_name === 'Masa Siparişi' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 text-[10px]" title={s.customer_name}>
                          <UserCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>{lang === 'tr' ? 'Garson' : 'Waiter'}</span>
                        </span>
                      ) : (
                        s.customer_name || (lang === 'tr' ? 'Masa' : 'Table')
                      )}
                    </td>
                    <td className="px-3.5 py-4 whitespace-nowrap">
                      <div className="text-[14px] font-black text-slate-900 mono-data tracking-tighter">
                        {Number(s.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-[10px] text-slate-400 font-bold tracking-normal ml-0.5">{(s.currency || 'TRY').substring(0, 3)}</span>
                      </div>
                      <div className="text-[8px] text-indigo-500 uppercase font-black tracking-[0.1em] flex items-center mt-1">
                        <div className="w-2.5 h-2.5 bg-indigo-50 border border-indigo-100 rounded flex items-center justify-center mr-1">
                          <CreditCard className="h-2 w-2" />
                        </div>
                        {t[s.payment_method] || s.payment_method}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center" title={t[s.status] || s.status}>
                        {s.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : s.status === 'cancelled' ? (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        ) : s.status === 'processing' ? (
                          <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                        ) : s.status === 'shipped' ? (
                          <Truck className="w-5 h-5 text-indigo-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      {s.sales_invoice_id && (
                        <div className="mt-1 flex items-center justify-center">
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100" title={`${lang === 'tr' ? 'Faturalandı' : 'Invoiced'}: ${s.sales_invoice_number}`}>
                            #{s.sales_invoice_number}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3.5 py-4 max-w-[200px]">
                      {s.status === 'cancelled' ? (
                        <div title={s.cancellation_reason || s.cancel_reason || s.notes || ''}>
                          <p className="text-[11px] font-bold text-rose-600 truncate bg-rose-50/80 px-2.5 py-1.5 rounded-lg border border-rose-100">
                            {s.cancellation_reason || s.cancel_reason || s.notes || (lang === 'tr' ? 'Belirtilmedi' : 'N/A')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 font-medium ml-2">-</span>
                      )}
                    </td>
                    <td className="px-3.5 py-4 text-right">
                      <div className="flex justify-end items-center space-x-1.5">
                        <button 
                          onClick={() => onViewDetails(s)}
                          className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-90"
                          title={t.viewDetails}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        {!isViewer && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSale(s.id);
                            }}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 active:scale-90"
                            title={t.delete}
                          >
                            <Trash2 className="h-4 w-4" />
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
          <div className="px-4 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">
              {sales.length} {lang === 'tr' ? 'SATIŞ KAYDI' : 'RECORDS'}
            </p>
            <div className="flex items-center space-x-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-all shadow-sm"
                title={t.prev}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-[10px] font-black text-slate-900 tabular-nums tracking-widest flex items-center bg-white px-3 py-2 border border-slate-200 rounded-xl shadow-inner">
                <span className="text-slate-400 mr-1.5">INDEX</span>
                <span className="font-mono font-black">{page} <span className="text-slate-300 mx-0.5">/</span> {totalPages}</span>
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-all shadow-sm"
                title={t.next}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PosTab;
