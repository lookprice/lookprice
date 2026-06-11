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
    <div className="grid grid-cols-1 gap-4">
      {incidents.map(i => (
        <div key={i.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-red-200 transition-all group">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <AlertTriangle className="w-6 h-6 text-red-600 group-hover:text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="font-black text-gray-900 text-lg">{i.type}</h4>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-wider">
                    {getVehiclePlate(i.vehicle_id)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                    i.is_owner_fault ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {i.is_owner_fault ? (lang === 'tr' ? 'Kusurlu' : 'At Fault') : (lang === 'tr' ? 'Kusursuz' : 'No Fault')}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm font-medium mb-4 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                  "{i.description}"
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-lg">
                    <Calendar className="w-3.5 h-3.5" />
                    {safeFormatDate(i.date, 'dd MMMM yyyy, HH:mm')}
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-100 rounded-lg">
                    <MapPin className="w-3.5 h-3.5" />
                    {i.location}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center justify-between sm:items-end gap-4 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50">
              <div className="text-left sm:text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{lang === 'tr' ? 'HASAR KAYDI' : 'DAMAGE RECORD'}</p>
                <p className="text-xl font-black text-red-600">{(i.cost || 0).toLocaleString()} {i.currency}</p>
              </div>
              {!isViewer && (
                <button
                  onClick={() => onDelete(i.id)}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title={t.delete}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {incidents.length === 0 && (
        <div className="py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t.noIncidentsFound}</h3>
          <p className="text-gray-500 text-sm">{lang === 'tr' ? 'Henüz kaydedilmiş kaza veya olay bulunmuyor.' : 'No incidents or accidents recorded yet.'}</p>
        </div>
      )}
    </div>
  );
};
