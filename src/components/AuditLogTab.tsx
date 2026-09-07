import React, { useState, useEffect } from "react";
import { 
  History, 
  User, 
  Calendar, 
  Info,
  Search,
  Filter
} from "lucide-react";
import { translations } from "../translations";
import { useLanguage } from "../contexts/LanguageContext";
import { api } from "../services/api";

interface AuditLogTabProps {
  storeId?: number;
}

const AuditLogTab = ({ storeId }: AuditLogTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [storeId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(storeId);
      setLogs(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionLabel = (action: string) => {
    const labels: any = {
      product_update: lang === 'tr' ? 'Ürün Güncelleme' : 'Product Update',
      product_delete: lang === 'tr' ? 'Ürün Silme' : 'Product Delete',
      product_delete_all: lang === 'tr' ? 'Tüm Ürünleri Silme' : 'Delete All Products',
      bulk_price_update: lang === 'tr' ? 'Toplu Fiyat Güncelleme' : 'Bulk Price Update',
      bulk_tax_update: lang === 'tr' ? 'Toplu KDV Güncelleme' : 'Bulk Tax Update',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (action.includes('update')) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-indigo-600 bg-indigo-50 border-indigo-100';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={lang === 'tr' ? "İşlem veya kullanıcı ara..." : "Search actions or users..."}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select 
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">{lang === 'tr' ? 'Tüm İşlemler' : 'All Actions'}</option>
            <option value="product_update">{lang === 'tr' ? 'Ürün Güncelleme' : 'Product Update'}</option>
            <option value="product_delete">{lang === 'tr' ? 'Ürün Silme' : 'Product Delete'}</option>
            <option value="bulk_price_update">{lang === 'tr' ? 'Toplu Fiyat' : 'Bulk Price'}</option>
            <option value="bulk_tax_update">{lang === 'tr' ? 'Toplu KDV' : 'Bulk Tax'}</option>
          </select>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
        >
          <History className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Tarih' : 'Date'}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Kullanıcı' : 'User'}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'İşlem' : 'Action'}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Detay' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm font-medium">{t.loading}</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {lang === 'tr' ? 'Henüz bir işlem kaydı bulunmuyor.' : 'No audit logs found yet.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs font-medium text-slate-900">
                        <Calendar className="h-3 w-3 mr-2 text-slate-400" />
                        {new Date(log.created_at).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs font-semibold text-slate-700">
                        <User className="h-3 w-3 mr-2 text-slate-400" />
                        {log.user_email || 'System'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-3 w-3 mt-0.5 text-slate-400 flex-shrink-0" />
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogTab;
