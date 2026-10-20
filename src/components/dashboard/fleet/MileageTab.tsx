import React from 'react';
import { 
  History, 
  MapPin, 
  Calendar 
} from 'lucide-react';
import { VehicleMileage, Vehicle } from '../../../types';

interface MileageTabProps {
  mileageLogs: VehicleMileage[];
  vehicles: Vehicle[];
  t: any;
  lang: string;
  safeFormatDate: (date: any, fmt: string) => string;
  getVehiclePlate: (id: number) => string;
}

export const MileageTab: React.FC<MileageTabProps> = ({
  mileageLogs,
  vehicles,
  t,
  lang,
  safeFormatDate,
  getVehiclePlate
}) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {mileageLogs.map(m => (
          <div key={m.id} className="bg-white p-2 rounded-lg border border-slate-200 hover:shadow-sm transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center text-indigo-600 border border-slate-100 shrink-0">
                <History className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-slate-900 text-[10px] leading-none uppercase tracking-tighter">{(m.mileage || 0).toLocaleString()} <span className="text-[7px] text-slate-400">KM</span></p>
                <span className="inline-flex px-1 bg-blue-50 text-blue-600 rounded text-[7px] font-black uppercase border border-blue-100 mt-0.5 leading-none">
                  {getVehiclePlate(m.vehicle_id)}
                </span>
              </div>
            </div>
            <div className="space-y-1 pt-1.5 border-t border-slate-50">
              <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                <Calendar className="w-2.5 h-2.5" />
                {safeFormatDate(m.date, 'dd.MM.yyyy')}
              </div>
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate">{m.location || (lang === 'tr' ? 'N/A' : 'N/A')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {mileageLogs.length === 0 && (
        <div className="py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
          <History className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">{t.noKMRecordsFound}</p>
        </div>
      )}
    </div>

  );
};
