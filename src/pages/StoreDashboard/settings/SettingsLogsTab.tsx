import React, { useState, useEffect } from "react";
import { History, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { api } from "../../../services/api";

interface SettingsLogsTabProps {
  currentStoreId: string;
  lang: string;
}

export const SettingsLogsTab = ({ currentStoreId, lang }: SettingsLogsTabProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.getAuditLogs(currentStoreId ? Number(currentStoreId) : undefined);
      setLogs(res || []);
    } catch (error) {
      console.error("Logs fetch error:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentStoreId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-slate-100 rounded-2xl">
              <History className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'tr' ? 'İşlem ve Entegrasyon Günlüğü' : 'Integration & Audit Logs'}
              </h2>
              <p className="text-sm text-slate-500">
                {lang === 'tr' ? 'Son yapılan işlemler ve pazar yeri senkronizasyon detayları' : 'Recent activities and marketplace sync details'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-5 w-5 ${loadingLogs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-4">
          {loadingLogs ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-8 w-8 text-slate-300 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {lang === 'tr' ? 'Kayıt bulunamadı.' : 'No logs found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-4 pl-4">{lang === 'tr' ? 'Tarih' : 'Date'}</th>
                    <th className="pb-4">{lang === 'tr' ? 'İşlem' : 'Action'}</th>
                    <th className="pb-4 text-center">{lang === 'tr' ? 'Detay' : 'Details'}</th>
                    <th className="pb-4 pr-4 text-right">{lang === 'tr' ? 'Veri' : 'Data'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 pl-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                        {new Date(log.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          log.action?.includes('error') ? 'bg-rose-50 text-rose-600' :
                          log.action?.includes('warning') ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 text-slate-700 max-w-xs truncate font-medium" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        {log.metadata ? (
                          <button 
                            type="button"
                            onClick={() => alert(JSON.stringify(log.metadata, null, 2))}
                            className="text-xs text-blue-600 hover:underline font-bold"
                          >
                            {lang === 'tr' ? 'HAM VERİ' : 'RAW DATA'}
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
