import React from "react";
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
            <Download className="h-4 w-4 mr-2" /> {lang === 'tr' ? 'Kasa Raporu' : 'Cash Report'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto zebra-border border-2">
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
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {t.noSales}
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr 
                    key={s.id} 
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onViewDetails(s)}
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">#{s.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{new Date(s.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{new Date(s.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">
                      {s.customer_name || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">
                        {Number(s.total_amount).toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{(s.currency || 'TRY').substring(0, 3)}</span>
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
                      <div className="flex justify-end items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4 bg-slate-50/30">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-10 w-10 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium text-sm">{t.loading}</p>
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm">
              {t.noSales}
            </div>
          ) : (
            sales.map((s) => (
              <div 
                key={s.id} 
                className="bg-white rounded-2xl p-5 shadow-sm border-4 zebra-border-bold space-y-4 active:scale-[0.98] transition-all group"
                onClick={() => onViewDetails(s)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="inline-block px-2 py-1 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-bold tracking-wider border border-slate-200">#{s.id}</span>
                    <div className="text-base font-bold text-slate-900 leading-tight">{s.customer_name || (lang === 'tr' ? 'İsimsiz Müşteri' : 'Unnamed Customer')}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(s.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date(s.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-base font-bold text-slate-900 tabular-nums">
                      {Number(s.total_amount).toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-medium">{(s.currency || 'TRY').substring(0, 3)}</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                      s.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      s.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {s.status === 'completed' ? t.completed : s.status === 'cancelled' ? t.cancelled : t.pending}
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 flex gap-2">
                  <button 
                    onClick={() => onViewDetails(s)}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span>{lang === 'tr' ? 'DETAY' : 'DETAILS'}</span>
                  </button>
                  <button 
                    onClick={() => onDeleteSale(s.id)}
                    className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl active:scale-95 transition-all"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PosTab;
