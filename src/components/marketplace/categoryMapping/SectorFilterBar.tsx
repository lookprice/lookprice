import React from 'react';
import { Filter, Laptop, Smartphone, Tv, Shirt, Home, Wrench, LayoutGrid } from 'lucide-react';
import { MARKETPLACE_SECTORS, MarketplaceCategory } from '@/data/marketplaceCategoriesData';

interface SectorFilterBarProps {
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  currentAvailableMarketCats: (MarketplaceCategory & { sector?: string })[];
  sectorFilteredMarketCats: (MarketplaceCategory & { sector?: string })[];
  lang?: string;
}

export const getSectorIcon = (sectorId: string) => {
  switch (sectorId) {
    case 'computer': return <Laptop className="h-3.5 w-3.5" />;
    case 'phone': return <Smartphone className="h-3.5 w-3.5" />;
    case 'electronics': return <Tv className="h-3.5 w-3.5" />;
    case 'fashion': return <Shirt className="h-3.5 w-3.5" />;
    case 'home': return <Home className="h-3.5 w-3.5" />;
    case 'auto': return <Wrench className="h-3.5 w-3.5" />;
    default: return <LayoutGrid className="h-3.5 w-3.5" />;
  }
};

export const SectorFilterBar: React.FC<SectorFilterBarProps> = ({
  selectedSector,
  setSelectedSector,
  currentAvailableMarketCats,
  sectorFilteredMarketCats,
  lang = 'tr',
}) => {
  return (
    <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-200/80">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
          <Filter className="h-3 w-3 text-indigo-600" />
          {lang === 'tr' ? 'Pazaryeri Sektör Filtresi:' : 'Marketplace Sector Filter:'}
        </span>
        <span className="text-[9px] text-slate-400 font-medium">
          {sectorFilteredMarketCats.length} {lang === 'tr' ? 'kategori listeleniyor' : 'categories available'}
        </span>
      </div>

      <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {MARKETPLACE_SECTORS.map((sector) => {
          const isCurrent = selectedSector === sector.id;
          const sectorCatsCount = sector.id === 'all' 
            ? currentAvailableMarketCats.length 
            : currentAvailableMarketCats.filter((c) => c.sector === sector.id).length;

          return (
            <button
              key={sector.id}
              type="button"
              onClick={() => setSelectedSector(sector.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 whitespace-nowrap cursor-pointer border ${
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
              title={sector.description}
            >
              {getSectorIcon(sector.id)}
              <span>{sector.name}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {sectorCatsCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
