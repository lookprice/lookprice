import React from 'react';
import { 
  Layers, X, Sparkles, FolderTree, Search 
} from 'lucide-react';
import { MarketplaceType } from './types';

interface CategoryMappingHeaderProps {
  onClose: () => void;
  activeMarketplace: MarketplaceType;
  setActiveMarketplace: (m: MarketplaceType) => void;
  mappings: Record<MarketplaceType, Record<string, string>>;
  localCategories: string[];
  handleAutoMatch: () => void;
  localScopeFilter: 'all' | 'sub' | 'main' | 'unmapped';
  setLocalScopeFilter: (scope: 'all' | 'sub' | 'main' | 'unmapped') => void;
  totalCount: number;
  subCategoryCount: number;
  mainCategoryCount: number;
  unmappedCount: number;
  completionPercent: number;
  mappedCount: number;
  searchFilter: string;
  setSearchFilter: (val: string) => void;
  lang?: string;
}

export const CategoryMappingHeader: React.FC<CategoryMappingHeaderProps> = ({
  onClose,
  activeMarketplace,
  setActiveMarketplace,
  mappings,
  localCategories,
  handleAutoMatch,
  localScopeFilter,
  setLocalScopeFilter,
  totalCount,
  subCategoryCount,
  mainCategoryCount,
  unmappedCount,
  completionPercent,
  mappedCount,
  searchFilter,
  setSearchFilter,
  lang = 'tr'
}) => {
  return (
    <>
      {/* MODAL TITLE HEADER */}
      <div className="px-4 py-2.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-slate-900 text-white rounded-xl shadow-xs">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>{lang === 'tr' ? 'Pazaryeri Kategori & Özellik Eşleştirme' : 'Marketplace Category & Attribute Mapping'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Hiyerarşik Alt Kategori Destekli
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {lang === 'tr' 
                ? 'Ürünlerinizin alt kategorilerini resmi pazaryeri kategorileriyle sektörel olarak eşleştirin.' 
                : 'Map store sub-categories with official marketplace categories using sector-based filtering.'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* MARKETPLACE TABS SELECTOR */}
      <div className="px-4 py-1.5 bg-white border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          {(['hepsiburada', 'trendyol', 'amazon', 'pazarama'] as MarketplaceType[]).map((m) => {
            const count = localCategories.filter((c) => !!mappings[m]?.[c]).length;
            const isSelected = activeMarketplace === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMarketplace(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="capitalize">{m === 'amazon' ? 'Amazon TR' : m}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}/{totalCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleAutoMatch}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer"
            title="Alt kategori ve ana kategori isimlerine göre otomatik akıllı eşleme yap"
          >
            <Sparkles className="h-3 w-3" />
            <span>{lang === 'tr' ? 'Akıllı Otomatik Eşleştir' : 'Auto Match'}</span>
          </button>
        </div>
      </div>

      {/* PROGRESS, SEARCH & SCOPE TABS */}
      <div className="px-4 py-1.5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* SCOPE TABS */}
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setLocalScopeFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
              localScopeFilter === 'all' 
                ? 'bg-slate-200 text-slate-900' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {lang === 'tr' ? 'Tümü' : 'All'} ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setLocalScopeFilter('sub')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer ${
              localScopeFilter === 'sub' 
                ? 'bg-purple-100 text-purple-900' 
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <FolderTree className="h-3 w-3" />
            <span>{lang === 'tr' ? 'Alt Kategoriler' : 'Sub-Categories'} ({subCategoryCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setLocalScopeFilter('main')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
              localScopeFilter === 'main' 
                ? 'bg-blue-100 text-blue-900' 
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            {lang === 'tr' ? 'Ana' : 'Main'} ({mainCategoryCount})
          </button>
          <button
            type="button"
            onClick={() => setLocalScopeFilter('unmapped')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
              localScopeFilter === 'unmapped' 
                ? 'bg-rose-100 text-rose-900' 
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            {lang === 'tr' ? 'Eşleşmemiş' : 'Unmapped'} ({unmappedCount})
          </button>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="flex items-center space-x-1.5">
            <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="font-mono font-bold text-slate-800 text-[10px]">
              %{completionPercent} ({mappedCount}/{totalCount})
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder={lang === 'tr' ? 'Kategori ara...' : 'Filter categories...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:ring-2 focus:ring-indigo-500/20 w-36 transition-all"
            />
            <Search className="h-3 w-3 text-slate-400 absolute left-2 top-1.5" />
          </div>
        </div>
      </div>
    </>
  );
};
