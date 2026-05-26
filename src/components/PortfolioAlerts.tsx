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
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <Bell className="h-4 w-4 text-indigo-600" />
        {lang === 'tr' ? 'Akıllı Uyarılar' : 'Smart Alerts'}
      </h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-xl border ${
            alert.type === 'critical' ? 'bg-red-50 border-red-100' : 
            alert.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
          }`}>
            {alert.type === 'critical' ? <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" /> : 
             alert.type === 'warning' ? <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" /> : 
             <Clock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className={`text-xs font-medium ${
                alert.type === 'critical' ? 'text-red-900' : 
                alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
              }`}>{alert.message}</p>
              <p className="text-[10px] text-slate-400 mt-1">{alert.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
