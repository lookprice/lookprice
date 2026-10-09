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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {maintenance.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                  <Wrench className="w-6 h-6 text-orange-600 group-hover:text-white" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900">{m.type}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{getVehiclePlate(m.vehicle_id)}</span>
                    <span className="opacity-30">•</span>
                    <span className="font-bold">{safeFormatDate(m.date, 'dd.MM.yyyy')}</span>
                    <span className="opacity-30">•</span>
                    <span className="font-medium">{m.provider_name}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                <div className="text-left sm:text-right">
                  <p className="font-black text-gray-900 text-lg">{(m.cost || 0).toLocaleString()} {m.currency}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                    m.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {m.status === 'completed' ? t.completed : t.planned}
                  </span>
                </div>
                <div className="flex gap-2">
                  {m.invoice_url && (
                    <a 
                      href={m.invoice_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                      title={t.downloadInvoice}
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}
                  {!isViewer && (
                    <button 
                      onClick={() => onEdit(m)}
                      className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
                      title={t.edit}
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {(m.next_maintenance_date || m.next_maintenance_mileage) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl flex flex-wrap gap-4">
                {m.next_maintenance_date && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.nextDate}</span>
                    <span className="text-xs font-black text-amber-600">{safeFormatDate(m.next_maintenance_date, 'dd.MM.yyyy')}</span>
                  </div>
                )}
                {m.next_maintenance_mileage && (
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.nextKM}</span>
                    <span className="text-xs font-black text-amber-600">{m.next_maintenance_mileage.toLocaleString()} KM</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {maintenance.length === 0 && (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <Wrench className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{t.noMaintenanceFound}</p>
        </div>
      )}
    </div>
  );
};
