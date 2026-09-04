import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, FileText, Search, Clock, Download, ArrowRight } from "lucide-react";
import { api } from "../../services/api";
import { IrpModal } from "../IrpModal";
import * as XLSX from "xlsx";

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

  const filteredLogs = logs.filter(log => 
    (log.store_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.action?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.details?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (log.user_email?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const exportToExcel = () => {
    if (filteredLogs.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredLogs.map(log => ({
      'Tarih': new Date(log.created_at).toLocaleString('tr-TR'),
      'Mağaza': log.store_name || log.store_slug || '-',
      'Kullanıcı': log.user_email || 'Sistem',
      'İşlem': log.action,
      'Detay': log.details,
      'Varlık': log.entity_type,
      'Varlık ID': log.entity_id || '-'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Denetim Kayıtları");
    XLSX.writeFile(wb, `Denetim_Kayitlari_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <ShieldCheck className="text-indigo-600" />
              {isTr ? 'Kurumsal Güvenlik & Denetim (DPP)' : 'Corporate Security & Audit (DPP)'}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {isTr ? 'Amazon Veri Koruma Politikası (DPP) gereği tüm kritik mağaza işlemleri ve PII maskeleme logları.' : 'All critical store operations and PII masking logs as per Amazon Data Protection Policy (DPP).'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsIrpModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-600 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-rose-500/20 transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              {isTr ? 'Olay Müdahale Planı' : 'Incident Response Plan'}
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={isTr ? "Mağaza, İşlem, Kullanıcı veya Detay ara..." : "Search store, action, user or details..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-4">{isTr ? 'Zaman' : 'Time'}</th>
                <th className="pb-3 px-4">{isTr ? 'Mağaza' : 'Store'}</th>
                <th className="pb-3 px-4">{isTr ? 'Kullanıcı' : 'User'}</th>
                <th className="pb-3 px-4">{isTr ? 'İşlem' : 'Action'}</th>
                <th className="pb-3 px-4">{isTr ? 'Detay' : 'Details'}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {isTr ? 'Yükleniyor...' : 'Loading...'}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    {isTr ? 'Kayıt bulunamadı.' : 'No records found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-slate-500 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {log.store_name || log.store_slug || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.user_email || 'Sistem'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-bold tracking-wider">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
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
