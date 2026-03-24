import React, { useState } from "react";
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
}

const CompaniesTab = ({ 
  companies, 
  isViewer, 
  onViewTransactions, 
  onEdit,
  onDelete,
  onExportReport,
  includeZero,
  onIncludeZeroChange
}: CompaniesTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");

  const filteredCompanies = companies.filter(c => 
    c.title.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) || 
    c.tax_number?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={lang === 'tr' ? 'Şirket ara...' : 'Search company...'}
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
            <Download className="h-4 w-4 mr-2 text-slate-500" /> {lang === 'tr' ? 'Dışa Aktar' : 'Export'}
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
            <span className="ml-2 text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{lang === 'tr' ? 'Bakiyesi 0 olanları göster' : 'Show zero balance'}</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden zebra-border">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Şirket Ünvanı' : 'Company Name'}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Yetkili' : 'Contact Person'}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'İletişim' : 'Contact'}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{lang === 'tr' ? 'Bakiye' : 'Balance'}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{lang === 'tr' ? 'İşlemler' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Store size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-sm font-medium">{lang === 'tr' ? 'Henüz bir şirket kaydı bulunmuyor.' : 'No company records found yet.'}</p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => (
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
                      <div className={`text-sm font-bold tabular-nums ${Number(c.balance) > 0 ? 'text-rose-600' : Number(c.balance) < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {Math.abs(Number(c.balance)).toLocaleString('tr-TR')} <span className="text-[10px] font-medium ml-0.5">{c.currency || 'TRY'}</span>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                        {Number(c.balance) > 0 ? (lang === 'tr' ? 'Borç' : 'Debit') : Number(c.balance) < 0 ? (lang === 'tr' ? 'Alacak' : 'Credit') : (lang === 'tr' ? 'Dengeli' : 'Balanced')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => onViewTransactions(c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={lang === 'tr' ? 'Hareketleri Gör' : 'View Transactions'}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {!isViewer && (
                          <>
                            <button 
                              onClick={() => onEdit(c)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                              title={lang === 'tr' ? 'Düzenle' : 'Edit'}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => onDelete(c.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title={lang === 'tr' ? 'Sil' : 'Delete'}
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

        {/* Mobile Compact List View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm">
              {lang === 'tr' ? 'Henüz bir şirket kaydı bulunmuyor.' : 'No company records found yet.'}
            </div>
          ) : (
            filteredCompanies.map((c) => (
              <div key={c.id} className="p-4 bg-white active:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="text-sm font-bold text-slate-900 truncate">{c.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{c.tax_office || '-'} / {c.tax_number || '-'}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400 font-medium">{c.representative || c.contact_person || '-'}</span>
                      <span className="text-[10px] text-slate-400 font-medium">•</span>
                      <span className="text-[10px] text-slate-400 font-medium">{c.phone || '-'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold tabular-nums ${Number(c.balance) > 0 ? 'text-rose-600' : Number(c.balance) < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {Math.abs(Number(c.balance)).toLocaleString('tr-TR')} <span className="text-[10px] font-medium ml-0.5">{c.currency || 'TRY'}</span>
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-tighter opacity-60">
                      {Number(c.balance) > 0 ? (lang === 'tr' ? 'Borç' : 'Debit') : Number(c.balance) < 0 ? (lang === 'tr' ? 'Alacak' : 'Credit') : (lang === 'tr' ? 'Dengeli' : 'Balanced')}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-2">
                      <button 
                        onClick={() => onViewTransactions(c)}
                        className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl active:scale-90 transition-all"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      {!isViewer && (
                        <>
                          <button 
                            onClick={() => onEdit(c)}
                            className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl active:scale-90 transition-all"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => onDelete(c.id)}
                            className="p-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl active:scale-90 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesTab;
