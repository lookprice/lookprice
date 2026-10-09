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
  brandFilter: string;
  setBrandFilter: (val: string) => void;
  modelFilter: string;
  setModelFilter: (val: string) => void;
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
  brandFilter,
  setBrandFilter,
  modelFilter,
  setModelFilter,
  setCurrentPage,
}) => {
  const expiringDocsCount = vehicles.reduce((acc, v) => acc + (Number(v.expiring_docs) || 0), 0);
  const maintenanceDueCount = vehicles.reduce((acc, v) => acc + (Number(v.maintenance_due) || 0), 0);

  // Dynamic cascading filter options based on portfolio
  const uniqueBrands = Array.from(new Set((vehicles || []).map(v => v.brand).filter(Boolean))).sort();
  const uniqueModels = brandFilter && brandFilter !== 'all'
    ? Array.from(new Set((vehicles || []).filter(v => v.brand === brandFilter).map(v => v.model).filter(Boolean))).sort()
    : [];

  return (
    <div className="flex flex-col gap-2">
      {/* Micro Stats Chips Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-600">
            <Car className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{t.totalVehicles}</span>
          </div>
          <span className="text-sm font-bold text-gray-900">{vehicles.length}</span>
        </div>

        <div className="bg-white px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{t.activeVehicles}</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {vehicles.filter(v => v.status === 'active').length}
          </span>
        </div>

        <div className={`bg-white px-3 py-1.5 rounded-xl border shadow-2xs flex items-center justify-between ${expiringDocsCount > 0 ? 'border-amber-200 bg-amber-50/40' : 'border-gray-200/80'}`}>
          <div className={`flex items-center gap-1.5 ${expiringDocsCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{t.documentAlert}</span>
          </div>
          <span className={`text-sm font-bold ${expiringDocsCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {expiringDocsCount}
          </span>
        </div>

        <div className={`bg-white px-3 py-1.5 rounded-xl border shadow-2xs flex items-center justify-between ${maintenanceDueCount > 0 ? 'border-red-200 bg-red-50/40' : 'border-gray-200/80'}`}>
          <div className={`flex items-center gap-1.5 ${maintenanceDueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            <Wrench className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{t.maintenanceAlert}</span>
          </div>
          <span className={`text-sm font-bold ${maintenanceDueCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
            {maintenanceDueCount}
          </span>
        </div>
      </div>

      {/* Micro Single-Row Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-1.5 rounded-xl border border-gray-200/80 shadow-2xs">
        {/* Search Input */}
        <div className="relative sm:col-span-5 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder={`${t.plate}, ${t.brand?.toLowerCase() || ''} or ${t.model?.toLowerCase() || ''}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50/60 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Brand Filter */}
        <div className="relative sm:col-span-3">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setModelFilter('all');
              setCurrentPage(1);
            }}
            className="w-full pl-7 pr-6 py-1.5 bg-gray-50/60 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="all">{lang === 'tr' ? 'Tüm Markalar' : 'All Brands'}</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Model Filter */}
        <div className="relative sm:col-span-2">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <select
            value={modelFilter}
            onChange={(e) => {
              setModelFilter(e.target.value);
              setCurrentPage(1);
            }}
            disabled={!brandFilter || brandFilter === 'all'}
            className="w-full pl-7 pr-6 py-1.5 bg-gray-50/60 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none disabled:bg-gray-100/60 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="all">
              {brandFilter && brandFilter !== 'all'
                ? (lang === 'tr' ? 'Tüm Modeller' : 'All Models')
                : (lang === 'tr' ? 'Önce Marka' : 'Select Brand')}
            </option>
            {uniqueModels.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative sm:col-span-2">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-7 pr-6 py-1.5 bg-gray-50/60 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer"
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
  );
};
