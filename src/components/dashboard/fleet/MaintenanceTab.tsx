import React from 'react';
import { 
  Wrench, 
  Download, 
  Edit2, 
  Plus 
} from 'lucide-react';
import { VehicleMaintenance, Vehicle } from '../../../types';

interface MaintenanceTabProps {
  maintenance: VehicleMaintenance[];
  vehicles: Vehicle[];
  t: any;
  lang: string;
  isViewer: boolean;
  onEdit: (m: VehicleMaintenance) => void;
  safeFormatDate: (date: any, fmt: string) => string;
  getVehiclePlate: (id: number) => string;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  maintenance,
  vehicles,
  t,
  lang,
  isViewer,
  onEdit,
  safeFormatDate,
  getVehiclePlate
}) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-1.5">
        {maintenance.map(m => (
          <div key={m.id} className="bg-white px-3 py-2 rounded-lg border border-slate-200 hover:shadow-sm hover:border-blue-300 transition-all group">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all border border-slate-100 shrink-0">
                  <Wrench className="w-3.5 h-3.5 text-orange-600 group-hover:text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-medium text-slate-900 text-[11px] uppercase tracking-tighter truncate">{m.type}</h4>
                    <span className="shrink-0 font-medium text-blue-600 bg-blue-50 px-1 py-0.5 rounded text-[8px] border border-blue-100">{getVehiclePlate(m.vehicle_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-500">
                    <span className="font-medium">{safeFormatDate(m.date, 'dd.MM.yyyy')}</span>
                    <span className="opacity-30">•</span>
                    <span className="font-medium truncate max-w-[150px]">{m.provider_name}</span>
                    {m.next_maintenance_date && (
                      <>
                        <span className="opacity-30">•</span>
                        <span className="text-amber-600 font-medium">NEXT: {safeFormatDate(m.next_maintenance_date, 'dd.MM.yyyy')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="font-medium text-slate-900 text-[11px] leading-none">{(m.cost || 0).toLocaleString()} <span className="text-[9px] opacity-50">{m.currency}</span></p>
                  <span className={`text-[7px] px-1 rounded-sm font-medium uppercase tracking-widest border inline-block mt-1 ${
                    m.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    {m.status === 'completed' ? t.completed : t.planned}
                  </span>
                </div>
                
                <div className="flex gap-1">
                  {m.invoice_url && (
                    <a 
                      href={m.invoice_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
                      title={t.downloadInvoice}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {!isViewer && (
                    <button 
                      onClick={() => onEdit(m)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                      title={t.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {maintenance.length === 0 && (
        <div className="py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
          <Wrench className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest">{t.noMaintenanceFound}</p>
        </div>
      )}
    </div>

  );
};
