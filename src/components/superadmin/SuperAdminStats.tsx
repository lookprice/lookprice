import React from "react";
import { Store, Activity, Scan, Users } from "lucide-react";

interface SuperAdminStatsProps {
  stats: {
    totalStores: number;
    activeStores: number;
    totalScans: number;
    scansLast24h: number;
  };
  st: any;
}

export const SuperAdminStats: React.FC<SuperAdminStatsProps> = ({ stats, st }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 group">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-indigo-50 p-2.5 rounded-xl group-hover:bg-indigo-100 transition-colors">
            <Store className="h-6 w-6 text-indigo-600" />
          </div>
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider">
            SİSTEM GENELİ
          </span>
        </div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{st.totalStores}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalStores}</p>
          <span className="text-xs font-bold text-gray-400">MAĞAZA</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm transition-all hover:shadow-md hover:border-emerald-100 group">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-emerald-50 p-2.5 rounded-xl group-hover:bg-emerald-100 transition-colors">
            <Activity className="h-6 w-6 text-emerald-600" />
          </div>
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wider">
            YAYINDA
          </span>
        </div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{st.activeStores}</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-black text-gray-900 leading-none">{stats.activeStores}</p>
          <span className="text-xs font-bold text-gray-400">AKTİF</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm transition-all hover:shadow-md hover:border-amber-100 group">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-amber-50 p-2.5 rounded-xl group-hover:bg-amber-100 transition-colors">
            <Scan className="h-6 w-6 text-amber-600" />
          </div>
          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">
            TOPLAM ETKİLEŞİM
          </span>
        </div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">TOPLAM QR TARAMA</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalScans}</p>
          <span className="text-xs font-bold text-gray-400">TARAMA</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm transition-all hover:shadow-md hover:border-rose-100 group">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-rose-50 p-2.5 rounded-xl group-hover:bg-rose-100 transition-colors">
            <Users className="h-6 w-6 text-rose-600" />
          </div>
          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-full uppercase tracking-wider">
            SON 24 SAAT
          </span>
        </div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">CANLI TRAFİK</h3>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-black text-gray-900 leading-none">{stats.scansLast24h}</p>
          <span className="text-xs font-bold text-gray-400">TARAMA</span>
        </div>
      </div>
    </div>
  );
};
