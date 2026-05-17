import React, { useState, useDeferredValue } from "react";
import { 
  Plus, 
  Search, 
  Store, 
  ChevronRight, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Download,
  Trash2,
  Edit2
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface CompaniesTabProps {
  companies: any[];
  isViewer: boolean;
  onViewTransactions: (company: any) => void;
  onEdit: (company: any) => void;
  onDelete: (id: any) => void;
  onExportReport: () => void;
  includeZero: boolean;
  onIncludeZeroChange: (val: boolean) => void;
  defaultCurrency?: string;
}

const CompaniesTab = ({ 
  companies, 
  isViewer, 
  onViewTransactions, 
  onEdit,
  onDelete,
  onExportReport,
  includeZero,
  onIncludeZeroChange,
  defaultCurrency = 'TRY'
}: CompaniesTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const normalizeSearch = (text: string) => {
    if (!text) return "";
    return text.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase();
  };

  const filteredCompanies = companies.filter(c => {
    const searchTerms = normalizeSearch(deferredSearch).split(' ').filter(Boolean);
    const matchesSearch = searchTerms.length === 0 ? true : searchTerms.every(term => 
      normalizeSearch(c.title).includes(term) || (c.tax_number || "").includes(term)
    );
    
    const hasBalance = Object.values(c.balances || {}).some(bal => Number(bal) !== 0);
    
    if (!includeZero && !hasBalance) {
      return false;
    }
    
    return matchesSearch;
  });

  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t.searchCompany}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all text-sm placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onExportReport}
            className="flex-1 md:flex-none flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Download className="h-4 w-4 mr-2 text-slate-500" /> {t.export}
          </button>
          <label className="flex items-center cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10 transition-all cursor-pointer"
                checked={includeZero}
                onChange={(e) => onIncludeZeroChange(e.target.checked)}
              />
            </div>
            <span className="ml-2 text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{t.showZeroBalance}</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden zebra-border">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.companyName}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.contactPerson}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.contact}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.balance}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Store size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-medium">{t.noCompaniesFound}</p>
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{c.title}</div>
                          <div className="text-xs text-slate-500">{c.tax_office || '-'} / {c.tax_number || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{c.representative || c.contact_person || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{c.phone || '-'}</div>
                      <div className="text-xs text-slate-500">{c.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                        {Object.entries(c.balances || {}).some(([_, bal]) => Number(bal) !== 0) ? (
                          Object.entries(c.balances || {}).map(([currency, bal]) => {
                            const numBal = Number(bal);
                            if (numBal === 0) return null;
                            const isDebt = numBal > 0;
                            return (
                              <div key={currency} className={`flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg border transition-all ${isDebt ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                <div className="flex flex-col items-end leading-none">
                                  <span className="text-xs font-black tabular-nums">
                                    {Math.abs(numBal).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                  </span>
                                  <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">
                                    {isDebt ? t.statements.debt : t.statements.credit}
                                  </span>
                                </div>
                                <div className={`px-1.5 py-0.5 rounded md text-[10px] font-black ${isDebt ? 'bg-rose-600/10' : 'bg-emerald-600/10'}`}>
                                  {currency.substring(0, 3)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg border bg-slate-50 border-slate-100 text-slate-400 opacity-60">
                            <span className="text-xs font-black">0</span>
                            <div className="px-1.5 py-0.5 rounded md text-[10px] font-black bg-slate-200">
                              {defaultCurrency}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => onViewTransactions(c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={t.viewTransactions}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {!isViewer && (
                          <>
                            <button 
                              onClick={() => onEdit(c)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                              title={t.edit}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => onDelete(c.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title={t.delete}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
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
              {filteredCompanies.length} {t.companies}
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

export default CompaniesTab;
