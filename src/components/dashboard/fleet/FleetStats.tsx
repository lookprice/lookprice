import React from 'react';
import { 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  Wrench,
  Search,
  Filter
} from 'lucide-react';
import { Vehicle } from '../../../types';

interface FleetStatsProps {
  vehicles: Vehicle[];
  t: any;
  lang: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  setCurrentPage: (val: number) => void;
}

export const FleetStats: React.FC<FleetStatsProps> = ({
  vehicles,
  t,
  lang,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  setCurrentPage,
}) => {
  const expiringDocsCount = vehicles.reduce((acc, v) => acc + (Number(v.expiring_docs) || 0), 0);
  const maintenanceDueCount = vehicles.reduce((acc, v) => acc + (Number(v.maintenance_due) || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Car className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">{t.totalVehicles}</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-gray-900">{vehicles.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">{t.activeVehicles}</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-gray-900">
            {vehicles.filter(v => v.status === 'active').length}
          </span>
        </div>
        <div className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-1 ${expiringDocsCount > 0 ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-2 mb-1 ${expiringDocsCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">{t.documentAlert}</span>
          </div>
          <span className={`text-2xl sm:text-3xl font-black ${expiringDocsCount > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
            {expiringDocsCount}
          </span>
        </div>
        <div className={`bg-white p-4 rounded-2xl border shadow-sm flex flex-col gap-1 ${maintenanceDueCount > 0 ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'}`}>
          <div className={`flex items-center gap-2 mb-1 ${maintenanceDueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            <Wrench className="w-4 h-4" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-70">{t.maintenanceAlert}</span>
          </div>
          <span className={`text-2xl sm:text-3xl font-black ${maintenanceDueCount > 0 ? 'text-red-600' : 'text-gray-300'}`}>
            {maintenanceDueCount}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder={`${t.plate}, ${t.brand?.toLowerCase() || ''} or ${t.model?.toLowerCase() || ''}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-48 pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none font-medium text-gray-700"
            >
              <option value="all">{t.allStatuses}</option>
              <option value="active">{t.active}</option>
              <option value="in_service">{t.inService}</option>
              <option value="broken">{t.broken}</option>
              <option value="for_sale">{lang === 'tr' ? 'Satışta' : 'For Sale'}</option>
              <option value="sold">{t.sold}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
