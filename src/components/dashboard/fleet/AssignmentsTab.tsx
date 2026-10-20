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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
      {assignments.map(a => (
        <div key={a.id} className="bg-white p-2.5 rounded-lg border border-slate-200 hover:shadow-sm hover:border-purple-300 transition-all group flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-slate-50 rounded flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all border border-slate-100 shrink-0">
                <UserCheck className="w-3.5 h-3.5 text-purple-600 group-hover:text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-slate-900 text-[10px] truncate uppercase tracking-tighter leading-tight">{a.user_email}</h4>
                <span className="inline-flex px-1 bg-blue-50 text-blue-600 rounded text-[7px] font-black uppercase tracking-widest border border-blue-100 mt-0.5">
                  {getVehiclePlate(a.vehicle_id)}
                </span>
              </div>
            </div>
            <span className={`text-[6px] px-1 py-0.5 rounded-sm font-black uppercase tracking-widest border ${
              a.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {a.status === 'active' ? t.active : t.returned}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50/50 rounded-lg mb-2 border border-slate-100/50 flex-1">
            <div className="space-y-0.5">
              <p className="text-[6px] text-slate-400 font-black uppercase tracking-widest leading-none">{t.received}</p>
              <div>
                <p className="text-[9px] font-black text-slate-700">{safeFormatDate(a.start_date, 'dd.MM.yyyy')}</p>
                <p className="text-[8px] font-bold text-blue-600 leading-none mt-0.5">{(a.start_mileage || 0).toLocaleString()} KM</p>
              </div>
            </div>
            {a.end_date ? (
              <div className="space-y-0.5 border-l border-slate-200 pl-2">
                <p className="text-[6px] text-slate-400 font-black uppercase tracking-widest leading-none">{t.returned}</p>
                <div>
                  <p className="text-[9px] font-black text-slate-700">{safeFormatDate(a.end_date, 'dd.MM.yyyy')}</p>
                  <p className="text-[8px] font-bold text-blue-600 leading-none mt-0.5">{(a.end_mileage || 0).toLocaleString()} KM</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center border-l border-slate-200 pl-2">
                <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest animate-pulse">{t.ongoing}</span>
              </div>
            )}
          </div>

          {!isViewer && a.status === 'active' && (
            <button
              onClick={() => onReturn(a)}
              className="w-full py-1 bg-white border border-slate-200 rounded text-[9px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider"
            >
              {t.returnVehicle}
            </button>
          )}
        </div>
      ))}
      {assignments.length === 0 && (
        <div className="col-span-full py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
          <UserCheck className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">{t.noAssignmentsFound}</p>
        </div>
      )}
    </div>

  );
};
