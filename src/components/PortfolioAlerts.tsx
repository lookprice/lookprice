import React from 'react';
import { Bell, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext'; // Adjust path

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

interface PortfolioAlertsProps {
  alerts: Alert[];
}

export const PortfolioAlerts: React.FC<PortfolioAlertsProps> = ({ alerts }) => {
  const { lang } = useLanguage();

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          {lang === 'tr' ? 'Akıllı Uyarı & Operasyon Radarı' : 'Smart Operation Radar'}
        </h3>
        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
          {alerts.length} {lang === 'tr' ? 'Aktif Alarm' : 'Active Alerts'}
        </span>
      </div>
      <div className="space-y-1.5">
        {alerts.map((alert) => (
          <div key={alert.id} className={`flex items-start gap-2 p-2 rounded-lg border text-[11px] ${
            alert.type === 'critical' ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/60' : 
            alert.type === 'warning' ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/60' : 
            'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-900/60'
          }`}>
            {alert.type === 'critical' ? <AlertCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" /> : 
             alert.type === 'warning' ? <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" /> : 
             <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold ${
                alert.type === 'critical' ? 'text-rose-950 dark:text-rose-200' : 
                alert.type === 'warning' ? 'text-amber-950 dark:text-amber-200' : 'text-indigo-950 dark:text-indigo-200'
              }`}>{alert.message}</p>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{alert.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
