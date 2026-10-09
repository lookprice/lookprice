import React from 'react';
import { Store, SlidersHorizontal, RefreshCw, X, Layers, ExternalLink } from 'lucide-react';
import { MarketplaceKey, MarketplaceConfig, MARKETPLACES } from './marketplaceTypes';

interface MarketplaceListingsHeaderProps {
  isTr: boolean;
  selectedMarketplace: MarketplaceKey;
  setSelectedMarketplace: (mp: MarketplaceKey) => void;
  currentMpConfig?: MarketplaceConfig;
  onOpenCategoryMapping: () => void;
  onRefresh?: () => void;
  onClose: () => void;
}

export const MarketplaceListingsHeader: React.FC<MarketplaceListingsHeaderProps> = ({
  isTr,
  selectedMarketplace,
  setSelectedMarketplace,
  currentMpConfig,
  onOpenCategoryMapping,
  onRefresh,
  onClose,
}) => {
  return (
    <>
      {/* Modal Top Header */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-200 dark:border-orange-900/50 flex items-center justify-center text-orange-600 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {isTr ? "e-Marketler" : "e-Marketplaces"}
              <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md">
                {selectedMarketplace === 'all' ? (isTr ? 'TÜMÜ' : 'ALL') : currentMpConfig?.shortName || currentMpConfig?.name.toUpperCase()}
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category & Attribute Mapping Quick Icon */}
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenCategoryMapping(); }}
            className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-all cursor-pointer border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs"
            title={isTr ? "Kategoriler, Nitelikler ve Komisyon Oranları" : "Categories, Attributes & Commission Rates"}
            aria-label={isTr ? "Kategoriler ve Nitelikler" : "Categories & Attributes"}
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
          {onRefresh && (
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRefresh(); }}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title={isTr ? "Yenile" : "Refresh"}
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
          )}
          <button 
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
            title={isTr ? "Kapat" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Marketplace Selector Tabs */}
      <div className="px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-hide whitespace-nowrap w-full">
        <button
          type="button"
          onClick={() => setSelectedMarketplace('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border cursor-pointer ${
            selectedMarketplace === 'all'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900 shadow-xs'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {isTr ? "Tümü" : "All"}
        </button>

        {MARKETPLACES.map(mp => {
          const isActive = selectedMarketplace === mp.key;
          return (
            <div key={mp.key} className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMarketplace(mp.key)}
                title={mp.name}
                className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? `${mp.bgLight} ${mp.color} font-black`
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-orange-500 animate-pulse' : 'bg-slate-400'}`}></span>
                {mp.shortName}
              </button>
              <a
                href={mp.merchantPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 border-l border-slate-200 dark:border-slate-700 text-slate-400 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                title={isTr ? `${mp.name} Satıcı Paneline (Merchant Portal) Git` : `Open ${mp.name} Merchant Portal`}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        })}

        {/* Direct Link Icon for Categories, Attributes & Commission Rates */}
        <button
          type="button"
          onClick={onOpenCategoryMapping}
          className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
          title={isTr ? "Kategoriler, Nitelikler ve Komisyon Oranları" : "Categories, Attributes & Commission Rates"}
          aria-label={isTr ? "Kategoriler ve Nitelikler" : "Categories & Attributes"}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
};
