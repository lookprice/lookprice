import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, FileText, Search, Clock, Download, ArrowRight } from "lucide-react";
import { api } from "../../services/api";
import { IrpModal } from "../IrpModal";
import * as XLSX from "xlsx";
import { formatDateTimeTR, formatFileDateTR } from "../../utils/formatUtils";

export function SuperAdminAuditLogs({ lang }: { lang: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isIrpModalOpen, setIsIrpModalOpen] = useState(false);

  const isTr = lang === 'tr';

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getGlobalAuditLogs();
      setLogs(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const safeLogs = Array.isArray(logs) ? logs : [];
  const filteredLogs = safeLogs.filter(log => 
    (log.store_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.action?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.details?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.user_email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const exportToExcel = () => {
    if (filteredLogs.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredLogs.map(log => ({
      'Tarih': formatDateTimeTR(log.created_at),
      'Mağaza': log.store_name || log.store_slug || '-',
      'Kullanıcı': log.user_email || 'Sistem',
      'İşlem': log.action,
      'Detay': log.details,
      'Varlık': log.entity_type,
      'Varlık ID': log.entity_id || '-'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Denetim Kayıtları");
    XLSX.writeFile(wb, `Denetim_Kayitlari_${formatFileDateTR()}.xlsx`);
  };

  return (
    <div className="space-y-3 max-w-6xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 sm:p-4 shadow-2xs border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 shrink-0">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight">
                {isTr ? 'Kurumsal Güvenlik & Denetim İzleri (DPP)' : 'Corporate Security & Audit (DPP)'}
              </h2>
              <p className="text-[10.5px] text-slate-500 font-medium">
                {isTr ? 'Kritik mağaza işlemleri ve PII denetim logları' : 'Critical store operations and PII audit logs'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setIsIrpModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {isTr ? 'Olay Müdahale Planı' : 'IRP'}
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isTr ? "Mağaza, işlem, kullanıcı veya detay ara..." : "Search store, action, user or details..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-3">{isTr ? 'Zaman' : 'Time'}</th>
                <th className="py-2 px-3">{isTr ? 'Mağaza' : 'Store'}</th>
                <th className="py-2 px-3">{isTr ? 'Kullanıcı' : 'User'}</th>
                <th className="py-2 px-3">{isTr ? 'İşlem' : 'Action'}</th>
                <th className="py-2 px-3">{isTr ? 'Detay' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    {isTr ? 'Yükleniyor...' : 'Loading...'}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                    {isTr ? 'Kayıt bulunamadı.' : 'No records found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatDateTimeTR(log.created_at)}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {log.store_name || log.store_slug || '-'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">
                      {log.user_email || 'Sistem'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IrpModal isOpen={isIrpModalOpen} onClose={() => setIsIrpModalOpen(false)} lang={lang} />
    </div>
  );
}
