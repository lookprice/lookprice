import React, { useState } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  Clock,
  Calendar,
  Gauge,
  RotateCcw
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
  t,
  lang,
  isViewer,
  onReturn,
  safeFormatDate,
  getVehiclePlate
}) => {
  const [returningId, setReturningId] = useState<number | null>(null);

  const handleReturnClick = async (a: VehicleAssignment) => {
    setReturningId(a.id);
    try {
      await onReturn(a);
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      {assignments.map(a => {
        const assigneeLabel = (a as any).driver_name || a.user_email || (lang === 'tr' ? 'Atanmış Sürücü' : 'Assigned Driver');
        const subEmail = (a as any).driver_name && a.user_email && a.user_email !== (a as any).driver_name ? a.user_email : null;
        const isActive = a.status === 'active';

        return (
          <div
            key={a.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group flex flex-col justify-between gap-3"
          >
            {/* Header: Driver & Plate & Status */}
            <div className="flex justify-between items-start gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border shrink-0 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm truncate tracking-tight leading-snug">
                    {assigneeLabel}
                  </h4>
                  {subEmail && (
                    <p className="text-[11px] text-slate-500 truncate">{subEmail}</p>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md text-[11px] font-medium uppercase tracking-wider border border-blue-200 dark:border-blue-800 mt-1">
                    {getVehiclePlate(a.vehicle_id)}
                  </span>
                </div>
              </div>

              <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg font-medium uppercase tracking-wider border shrink-0 ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {isActive ? (
                  <>
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>{t.active}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-slate-500" />
                    <span>{t.returned}</span>
                  </>
                )}
              </span>
            </div>

            {/* Dates & Mileage Bento */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-500" />
                  <span>{t.received}</span>
                </p>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                  {safeFormatDate(a.start_date, 'dd.MM.yyyy')}
                </p>
                <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  <span>{(a.start_mileage || 0).toLocaleString()} KM</span>
                </p>
              </div>

              {a.end_date || !isActive ? (
                <div className="space-y-1 border-l border-slate-200 dark:border-slate-700 pl-3">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{t.returned}</span>
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                    {safeFormatDate(a.end_date, 'dd.MM.yyyy')}
                  </p>
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    <span>{(a.end_mileage || a.start_mileage || 0).toLocaleString()} KM</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center border-l border-slate-200 dark:border-slate-700 pl-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium uppercase tracking-wider">
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>{t.ongoing}</span>
                  </span>
                </div>
              )}
            </div>

            {a.notes && (
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 line-clamp-2">
                {a.notes}
              </p>
            )}

            {/* Action Button */}
            {!isViewer && isActive && (
              <button
                type="button"
                disabled={returningId === a.id}
                onClick={() => handleReturnClick(a)}
                className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-xl text-xs font-medium transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${returningId === a.id ? 'animate-spin' : ''}`} />
                <span>{returningId === a.id ? (lang === 'tr' ? 'İade Alınıyor...' : 'Returning...') : t.returnVehicle}</span>
              </button>
            )}
          </div>
        );
      })}
      {assignments.length === 0 && (
        <div className="col-span-full py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center">
          <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">{t.noAssignmentsFound}</p>
        </div>
      )}
    </div>
  );
};

