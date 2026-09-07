import React from 'react';
import { MapPin } from 'lucide-react';
import { StoreLocation } from '../types';

interface StoreLocatorProps {
  locations: StoreLocation[];
}

export const StoreLocator: React.FC<StoreLocatorProps> = ({ locations }) => {
  if (!locations || locations.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-amber-500" />
        Size En Yakın Mağazalarımız
      </h3>
      <div className="space-y-4">
        {locations.map((loc, idx) => (
          <div key={idx} className="p-4 bg-slate-50 rounded-xl">
             <h4 className="font-bold text-sm text-slate-900">{loc.name}</h4>
             <p className="text-xs text-slate-500 mt-1">{loc.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
