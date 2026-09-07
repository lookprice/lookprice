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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mileageLogs.map(m => (
          <div key={m.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <History className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-gray-900 leading-tight">{(m.mileage || 0).toLocaleString()} KM</p>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">
                    {getVehiclePlate(m.vehicle_id)}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Calendar className="w-3 h-3" />
                {safeFormatDate(m.date, 'dd MMMM yyyy, HH:mm')}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <MapPin className="w-3 h-3" />
                {m.location || (lang === 'tr' ? 'Belirtilmedi' : 'Not specified')}
              </div>
            </div>
          </div>
        ))}
      </div>
      {mileageLogs.length === 0 && (
        <div className="py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{t.noKMRecordsFound}</p>
        </div>
      )}
    </div>
  );
};
