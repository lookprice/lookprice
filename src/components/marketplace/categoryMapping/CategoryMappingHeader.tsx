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
    <div className="shrink-0 bg-white">
      {/* MODAL TITLE HEADER */}
      <div className="px-3 sm:px-4 py-2 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          <div className="p-1 sm:p-1.5 bg-slate-900 text-white rounded-lg sm:rounded-xl shadow-xs shrink-0">
            <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span className="truncate">{lang === 'tr' ? 'Pazaryeri Kategori & Özellik Eşleştirme' : 'Marketplace Category & Attribute Mapping'}</span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                Hiyerarşik Alt Kategori Destekli
              </span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
              {lang === 'tr' 
                ? 'Ürünlerinizin alt kategorilerini resmi pazaryeri kategorileriyle eşleştirin.' 
                : 'Map store sub-categories with official marketplace categories.'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* MARKETPLACE TABS SELECTOR */}
      <div className="px-3 sm:px-4 py-1.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 shrink-0 scrollbar-none">
          {(['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama'] as MarketplaceType[]).map((m) => {
            const count = localCategories.filter((c) => !!mappings[m]?.[c]).length;
            const isSelected = activeMarketplace === m;
            const label = m === 'amazon' ? 'Amazon TR' : (m === 'n11' ? 'N11.com' : (m === 'hepsiburada' ? 'Hepsiburada' : (m === 'trendyol' ? 'Trendyol' : 'Pazarama')));
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMarketplace(m)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/20 text-white font-bold' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}/{totalCount}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleAutoMatch}
            className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1 cursor-pointer shrink-0"
            title="Alt kategori ve ana kategori isimlerine göre otomatik akıllı eşleme yap"
          >
            <Sparkles className="h-3 w-3" />
            <span>{lang === 'tr' ? 'Otomatik Eşle' : 'Auto Match'}</span>
          </button>
        </div>
      </div>

      {/* PROGRESS, SEARCH & SCOPE TABS */}
      <div className="px-3 sm:px-4 py-1.5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* SCOPE TABS */}
        <div className="flex items-center space-x-1 overflow-x-auto py-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setLocalScopeFilter('all')}
            className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
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
            className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors flex items-center space-x-1 cursor-pointer shrink-0 ${
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
            className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
              localScopeFilter === 'main' 
                ? 'bg-blue-100 text-blue-900' 
                : 'text-blue-700 hover:bg-blue-50'
            }`}
          >
            {lang === 'tr' ? 'Ana Kategoriler' : 'Main'} ({mainCategoryCount})
          </button>
          <button
            type="button"
            onClick={() => setLocalScopeFilter('unmapped')}
            className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
              localScopeFilter === 'unmapped' 
                ? 'bg-amber-100 text-amber-900' 
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            {lang === 'tr' ? 'Eşleşmemiş' : 'Unmapped'} ({unmappedCount})
          </button>
        </div>

        {/* SEARCH & PROGRESS BAR */}
        <div className="flex items-center space-x-3">
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              placeholder={lang === 'tr' ? 'Kategorilerde ara...' : 'Search categories...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-7 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800"
            />
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2 top-2" />
          </div>

          <div className="hidden lg:flex items-center space-x-2 shrink-0">
            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-600 font-mono">
              %{completionPercent} ({mappedCount}/{totalCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
