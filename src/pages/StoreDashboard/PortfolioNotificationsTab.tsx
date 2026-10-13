import React from 'react';
import { useLanguage } from "../../contexts/LanguageContext";
import { useAlerts } from "../../contexts/AlertContext";
import { getAlertIcon } from "../../services/AlertService";

export const PortfolioNotificationsTab = ({ notifications }: { notifications: any }) => {
  const { lang } = useLanguage();
  const { alerts } = useAlerts();
  
  const allAlerts = [
    ...alerts.map(a => ({
      ...a,
      message: a.message,
      timestamp: a.timestamp.toLocaleTimeString()
    })),
    ...(notifications.sales > 0 ? [{ id: 'sales', message: `Yeni ${notifications.sales} Web/Market Siparişi var!`, type: 'info' as const, category: 'order' as const, timestamp: new Date().toLocaleTimeString() }] : []),
    ...(notifications.hotel_reservations > 0 ? [{ id: 'hotel', message: `Yeni ${notifications.hotel_reservations} Rezervasyon var!`, type: 'info' as const, category: 'order' as const, timestamp: new Date().toLocaleTimeString() }] : [])
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 tracking-tighter">
          {lang === 'tr' ? 'Bildirim Merkezi' : 'Notification Center'}
        </h2>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {allAlerts?.length > 0 ? (
          allAlerts.map((alert: any) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div key={alert.id} className="flex items-start gap-4 p-4 rounded-xl border bg-slate-50 border-slate-100">
                 <Icon className="h-5 w-5 text-indigo-500 mt-0.5" />
                 <div className="flex-1">
                   <p className="text-xs font-semibold text-slate-800">{alert.message}</p>
                   <p className="text-[10px] text-slate-400 mt-1">{alert.timestamp}</p>
                 </div>
                 <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                    {lang === 'tr' ? 'Görüntüle' : 'View'}
                 </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            {lang === 'tr' ? 'Yeni bildirim bulunmuyor.' : 'No new notifications.'}
          </div>
        )}
      </div>
    </div>
  );
};
