import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  MapPin, 
  Calendar 
} from 'lucide-react';
import { VehicleIncident, Vehicle } from '../../../types';

interface IncidentsTabProps {
  incidents: VehicleIncident[];
  vehicles: Vehicle[];
  t: any;
  lang: string;
  isViewer: boolean;
  onDelete: (id: number) => void;
  safeFormatDate: (date: any, fmt: string) => string;
  getVehiclePlate: (id: number) => string;
}

export const IncidentsTab: React.FC<IncidentsTabProps> = ({
  incidents,
  vehicles,
  t,
  lang,
  isViewer,
  onDelete,
  safeFormatDate,
  getVehiclePlate
}) => {
  return (
    <div className="space-y-1.5">
      {incidents.map(i => (
        <div key={i.id} className="bg-white px-3 py-2 rounded-lg border border-slate-200 hover:shadow-sm transition-all group">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all border border-slate-100 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 group-hover:text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 text-[11px] uppercase tracking-tighter truncate">{i.type}</h4>
                  <span className="shrink-0 px-1 bg-blue-50 text-blue-600 rounded text-[7px] font-medium uppercase border border-blue-100">
                    {getVehiclePlate(i.vehicle_id)}
                  </span>
                  <span className={`shrink-0 px-1 rounded text-[7px] font-medium uppercase border ${
                    i.is_owner_fault ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    {i.is_owner_fault ? (lang === 'tr' ? 'Kusurlu' : 'At Fault') : (lang === 'tr' ? 'Kusursuz' : 'No Fault')}
                  </span>
                </div>
                
                <p className="text-slate-500 text-[9px] font-medium mb-1 line-clamp-1 italic">
                  {i.description}
                </p>

                <div className="flex items-center gap-3 text-[8px] font-medium text-slate-400 uppercase tracking-tighter">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {safeFormatDate(i.date, 'dd.MM.yyyy, HH:mm')}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[200px]">{i.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-[6px] font-medium text-slate-400 uppercase tracking-widest leading-none">{lang === 'tr' ? 'HASAR' : 'DAMAGE'}</p>
                <p className="text-[11px] font-medium text-red-600 mt-0.5">{(i.cost || 0).toLocaleString()} <span className="text-[9px] opacity-50">{i.currency}</span></p>
              </div>
              {!isViewer && (
                <button
                  onClick={() => onDelete(i.id)}
                  className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                  title={t.delete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {incidents.length === 0 && (
        <div className="py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
          <AlertTriangle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest">{t.noIncidentsFound}</p>
        </div>
      )}
    </div>

  );
};
