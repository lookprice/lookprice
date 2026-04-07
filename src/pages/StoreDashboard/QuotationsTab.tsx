import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  Trash2, 
  Edit2,
  ChevronRight,
  Filter,
  Link,
  QrCode,
  CreditCard,
  Wrench,
  ExternalLink
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface QuotationsTabProps {
  quotations: any[];
  isViewer: boolean;
  onViewDetails: (quotation: any) => void;
  onGeneratePDF: (quotation: any) => void;
  onApprove: (id: number) => void;
  onCancel: (id: number) => void;
  onConvertToSale: (quotation: any) => void;
  onEdit: (quotation: any) => void;
  onDelete: (id: number) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onExportReport: () => void;
  statusFilter: string;
  onShowQr: () => void;
}

const QuotationsTab = ({ 
  quotations, 
  isViewer, 
  onViewDetails, 
  onGeneratePDF, 
  onApprove, 
  onCancel,
  onConvertToSale,
  onEdit, 
  onDelete,
  onSearchChange,
  onStatusFilterChange,
  onExportReport,
  statusFilter,
  onShowQr
}: QuotationsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const paginatedQuotations = (quotations || []).slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil((quotations || []).length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 flex gap-3 w-full max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t.searchQuotation}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all text-sm placeholder:text-slate-400"
              value={search}
              onChange={(e) => { setSearch(e.target.value); onSearchChange(e.target.value); setPage(1); }}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select 
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 appearance-none text-xs font-semibold text-slate-700 shadow-sm cursor-pointer"
              value={statusFilter}
              onChange={(e) => { onStatusFilterChange(e.target.value); setPage(1); }}
            >
              <option value="all">{t.allStatuses}</option>
              <option value="pending">{t.pendingStatuses}</option>
              <option value="approved">{t.completedStatuses}</option>
              <option value="cancelled">{t.cancelledStatuses}</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button 
            onClick={onShowQr}
            className="flex-1 md:flex-none flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <QrCode className="h-4 w-4 mr-2 text-slate-500" /> {t.qr}
          </button>
          <button 
            onClick={onExportReport}
            className="flex-1 md:flex-none flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Download className="h-4 w-4 mr-2 text-slate-500" /> {t.export}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden zebra-border">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.customer}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.amount}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.status}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedQuotations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {t.noQuotations}
                  </td>
                </tr>
              ) : (
                paginatedQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-900">{q.customer_name}</div>
                      {q.customer_title && <div className="text-xs text-slate-400 truncate max-w-[240px] mt-0.5">{q.customer_title}</div>}
                      {q.service_id && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">
                            <Wrench className="w-2.5 h-2.5 mr-1" />
                            {lang === 'tr' ? `${q.service_id} nolu Teknik Servis` : `Technical Service #${q.service_id}`}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {new Date(q.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">
                        {Number(q.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{(q.currency || 'TRY').substring(0, 3)}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight flex items-center mt-0.5">
                        <CreditCard className="h-2.5 w-2.5 mr-1" /> {t[q.payment_method] || q.payment_method || t.notSpecified}
                        {q.due_date && (
                          <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md">
                            {t.dueDate} {new Date(q.due_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                          q.status === 'approved' || q.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          q.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {q.status === 'approved' || q.status === 'completed' ? t.completed : 
                           q.status === 'cancelled' ? t.cancelled : t.pending}
                        </span>
                        {q.is_sale && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                            {t.sale}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-1 transition-opacity">
                          <button 
                            onClick={() => onViewDetails(q)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                            title={t.viewDetails}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => onGeneratePDF(q)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                            title={t.downloadPDF}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => {
                              const url = `${window.location.origin}/quotation/${q.id}`;
                              window.open(url, '_blank');
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                            title={lang === 'tr' ? 'Linki Aç' : 'Open Link'}
                          >
                            <ExternalLink className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => {
                              const url = `${window.location.origin}/quotation/${q.id}`;
                              navigator.clipboard.writeText(url);
                              alert(t.quotationLinkCopied);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                            title={t.copyLink}
                          >
                            <Link className="h-5 w-5" />
                          </button>
                          {!isViewer && !q.is_sale && q.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => onConvertToSale(q)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                                title={t.convertToSale}
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </button>
                              <button 
                                onClick={() => onCancel(q.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                                title={t.cancel}
                              >
                                <Trash2 className="h-5 w-5 rotate-45" />
                              </button>
                            </>
                          )}
                          {!isViewer && q.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => onEdit(q)}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-transparent hover:border-amber-100"
                                title={t.edit}
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {!isViewer && (
                            <button 
                              onClick={() => onDelete(q.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
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
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              {quotations.length} {t.quotationSale}
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

export default QuotationsTab;
