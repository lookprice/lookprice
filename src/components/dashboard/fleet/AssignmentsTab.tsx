import React from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { VehicleAssignment, Vehicle } from '../../../types';

interface AssignmentsTabProps {
  assignments: VehicleAssignment[];
  vehicles: Vehicle[];
  t: any;
  lang: string;
  isViewer: boolean;
  onReturn: (assignment: VehicleAssignment) => void;
  safeFormatDate: (date: any, fmt: string) => string;
  getVehiclePlate: (id: number) => string;
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = ({
  assignments,
  vehicles,
  t,
  lang,
  isViewer,
  onReturn,
  safeFormatDate,
  getVehiclePlate
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {assignments.map(a => (
        <div key={a.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-purple-200 transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                <UserCheck className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <div>
                <h4 className="font-black text-gray-900">{a.user_email}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase tracking-wider">
                    {getVehiclePlate(a.vehicle_id)}
                  </span>
                </div>
              </div>
            </div>
            <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
              a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {a.status === 'active' ? t.active : t.returned}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl mb-4">
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.received}</p>
              <div className="space-y-1">
                <p className="text-sm font-black text-gray-800">{safeFormatDate(a.start_date, 'dd.MM.yyyy')}</p>
                <p className="text-xs font-bold text-blue-600">{(a.start_mileage || 0).toLocaleString()} KM</p>
              </div>
            </div>
            {a.end_date ? (
              <div className="space-y-2 border-l border-gray-200 pl-6">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{t.returned}</p>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-800">{safeFormatDate(a.end_date, 'dd.MM.yyyy')}</p>
                  <p className="text-xs font-bold text-blue-600">{(a.end_mileage || 0).toLocaleString()} KM</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center border-l border-gray-200 pl-6">
                <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{t.ongoing}</span>
              </div>
            )}
          </div>

          {!isViewer && a.status === 'active' && (
            <button
              onClick={() => onReturn(a)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 rounded-xl text-xs font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t.returnVehicle}
            </button>
          )}
        </div>
      ))}
      {assignments.length === 0 && (
        <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <UserCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-bold">{t.noAssignmentsFound}</p>
        </div>
      )}
    </div>
  );
};
