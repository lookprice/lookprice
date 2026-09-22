import React from 'react';
import { 
  CheckCircle2, ChevronRight, Sparkles, SlidersHorizontal, 
  Trash2, Search, Percent, FolderTree 
} from 'lucide-react';
import { 
  MarketplaceCategory, 
  MARKETPLACE_SECTORS,
  suggestMarketplaceCategory,
  normalizeCategoryText,
  matchCategorySearchToken
} from '@/data/marketplaceCategoriesData';
import { LocalCategoryItem, MarketplaceType } from './types';

interface CategoryMappingRowProps {
  item: LocalCategoryItem;
  activeMarketplace: MarketplaceType;
  activeMarketplaceConfig: {
    title: string;
    badgeBg: string;
    activeTabBg: string;
    ringColor: string;
    accentColor: string;
    tag: string;
  };
  mappedId?: string;
  matchedMarketCat?: MarketplaceCategory;
  currentCatAttrs: Record<string, any>;
  categoryMarkups: Record<MarketplaceType, Record<string, { commissionRate?: number; fixedFee?: number }>>;
  defaultCommissionRates: Record<MarketplaceType, number>;
  defaultFixedFees: Record<MarketplaceType, number>;
  calculateSimulatedPrice: (basePrice: number, commissionRate: number, fixedFee: number) => number;
  openDropdownFor: string | null;
  setOpenDropdownFor: (val: string | null) => void;
  catSearchTerm: string;
  setCatSearchTerm: (val: string) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  sectorFilteredMarketCats: (MarketplaceCategory & { sector?: string })[];
  currentAvailableMarketCats: (MarketplaceCategory & { sector?: string })[];
  handleSelectMapping: (localCat: string, marketCatId: string | number) => void;
  handleRemoveMapping: (localCat: string) => void;
  handleOpenAttributes: (localCat: string, marketCatId: string | number) => void;
  handleUpdateCategoryMarkup: (localCat: string, field: 'commissionRate' | 'fixedFee', val: number | undefined) => void;
  lang?: string;
}

export const CategoryMappingRow: React.FC<CategoryMappingRowProps> = ({
  item,
  activeMarketplace,
  activeMarketplaceConfig,
  mappedId,
  matchedMarketCat,
  currentCatAttrs,
  categoryMarkups,
  defaultCommissionRates,
  defaultFixedFees,
  calculateSimulatedPrice,
  openDropdownFor,
  setOpenDropdownFor,
  catSearchTerm,
  setCatSearchTerm,
  selectedSector,
  setSelectedSector,
  sectorFilteredMarketCats,
  currentAvailableMarketCats,
  handleSelectMapping,
  handleRemoveMapping,
  handleOpenAttributes,
  handleUpdateCategoryMarkup,
  lang = 'tr'
}) => {
  const localCat = item.key;
  const prodCount = item.productCount;
  const isDropdownOpen = openDropdownFor === localCat;
  const configuredAttrCount = Object.keys(currentCatAttrs).length;

  // Suggestion pill if unmapped (prioritizes active sector pool if available)
  const suggestionPool = sectorFilteredMarketCats.length > 0 ? sectorFilteredMarketCats : currentAvailableMarketCats;
  const suggestion = !mappedId ? suggestMarketplaceCategory(localCat, suggestionPool).bestMatch : null;

  // Filter marketplace categories for dropdown (sector filtered first, fallback to all if search term used)
  const primaryPool = sectorFilteredMarketCats.length > 0 ? sectorFilteredMarketCats : currentAvailableMarketCats;

  let filteredMarketCats = primaryPool.filter((c) => {
    if (!catSearchTerm.trim()) return true;
    const normSearch = normalizeCategoryText(catSearchTerm);
    if (!normSearch) return true;

    const catIdStr = String(c.id || (c as any).categoryId || '');
    if (catIdStr === catSearchTerm.trim()) return true;

    const fullTextNorm = normalizeCategoryText(`${c.name || ''} ${c.displayName || ''} ${(c.paths || []).join(' ')}`);
    const tokens = normSearch.split(' ').filter(Boolean);
    return tokens.every((token) => matchCategorySearchToken(fullTextNorm, token));
  });

  // Smart Fallback: If sector search returned zero results, search across all categories
  if (filteredMarketCats.length === 0 && catSearchTerm.trim() && selectedSector !== 'all') {
    filteredMarketCats = currentAvailableMarketCats.filter((c) => {
      const normSearch = normalizeCategoryText(catSearchTerm);
      if (!normSearch) return true;
      const catIdStr = String(c.id || (c as any).categoryId || '');
      if (catIdStr === catSearchTerm.trim()) return true;

      const fullTextNorm = normalizeCategoryText(`${c.name || ''} ${c.displayName || ''} ${(c.paths || []).join(' ')}`);
      const tokens = normSearch.split(' ').filter(Boolean);
      return tokens.every((token) => matchCategorySearchToken(fullTextNorm, token));
    });
  }

  return (
    <div 
      className={`p-2.5 rounded-xl border transition-all ${
        mappedId 
          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs' 
          : 'bg-slate-50/60 border-slate-200/80'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        
        {/* STORE CATEGORY COLUMN (HIERARCHICAL & SUBCATEGORY AWARE) */}
        <div className="lg:w-1/3 space-y-0.5">
          {item.isSubCategory ? (
            <div>
              <div className="flex items-center space-x-1 text-[10px] font-semibold text-slate-400">
                <FolderTree className="h-2.5 w-2.5 text-purple-500 shrink-0" />
                <span>{item.mainCategory}</span>
                <span>&gt;</span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="font-black text-slate-900 text-xs">{item.subCategory}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                  {lang === 'tr' ? 'Alt Kategori' : 'Sub-Category'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                  {prodCount} {lang === 'tr' ? 'Ürün' : 'Prod'}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 text-xs">{item.mainCategory}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {lang === 'tr' ? 'Ana Kategori' : 'Main'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                  {prodCount} {lang === 'tr' ? 'Ürün' : 'Prod'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {lang === 'tr' ? 'Mağaza ana kategorisi' : 'Store category'}
              </p>
            </div>
          )}
        </div>

        {/* MARKETPLACE MAPPING SELECTOR COLUMN */}
        <div className="lg:w-1/2 relative">
          {mappedId && matchedMarketCat ? (
            <div className="flex items-center justify-between p-1.5 px-2.5 bg-slate-50/90 rounded-lg border border-slate-200">
              <div className="space-y-0.5 pr-2 min-w-0">
                <div className="flex items-center space-x-1.5 truncate">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-900 truncate">
                    {matchedMarketCat.displayName || matchedMarketCat.name}
                  </span>
                </div>
                {matchedMarketCat.paths && matchedMarketCat.paths.length > 0 && (
                  <p className="text-[9px] text-slate-500 font-medium pl-5 truncate max-w-xs md:max-w-md">
                    {matchedMarketCat.paths.join(' > ')}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-1 shrink-0">
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                  #{mappedId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdownFor(localCat);
                    setCatSearchTerm('');
                  }}
                  className="text-[10px] text-indigo-600 font-bold hover:underline px-1.5 py-0.5 cursor-pointer"
                >
                  {lang === 'tr' ? 'Değiştir' : 'Change'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveMapping(localCat)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title={lang === 'tr' ? 'Eşleştirmeyi Kaldır' : 'Remove'}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setOpenDropdownFor(isDropdownOpen ? null : localCat);
                  setCatSearchTerm('');
                }}
                className="w-full text-left px-3 py-1.5 bg-white border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg text-[11px] font-bold text-slate-600 flex items-center justify-between cursor-pointer transition-all"
              >
                <span className="flex items-center gap-1 truncate">
                  <span>{lang === 'tr' ? `${activeMarketplaceConfig.title} Kategorisi Seç...` : 'Select category...'}</span>
                  {selectedSector !== 'all' && (
                    <span className="text-[10px] font-normal text-indigo-600 truncate">
                      ({MARKETPLACE_SECTORS.find((s) => s.id === selectedSector)?.name})
                    </span>
                  )}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
              </button>

              {/* SMART SUGGESTION PILL */}
              {suggestion && (
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <span className="text-slate-400 font-medium">
                    {lang === 'tr' ? 'Öneri:' : 'Suggestion:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectMapping(localCat, suggestion.id)}
                    className="px-2 py-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-purple-600" />
                    <span>{suggestion.displayName || suggestion.name} (#{suggestion.id})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DROPDOWN SEARCH MENU WITH SECTOR QUICK SWITCH */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 space-y-1.5 max-h-72 flex flex-col">
              
              {/* Mini Sector Switcher inside dropdown */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[9px] font-bold border-b border-slate-100">
                {MARKETPLACE_SECTORS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSector(s.id)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer whitespace-nowrap ${
                      selectedSector === s.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder={lang === 'tr' ? 'Kategori ara (örn: USB Bellek, Kart Okuyucu)...' : 'Search category...'}
                  value={catSearchTerm}
                  onChange={(e) => setCatSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
                <Search className="h-3 w-3 text-slate-400 absolute left-2 top-2" />
              </div>

              <div className="overflow-y-auto flex-1 space-y-1 max-h-48 pr-1">
                {filteredMarketCats.length === 0 ? (
                  <div className="text-center py-3 space-y-1">
                    <p className="text-[11px] text-slate-400">
                      {lang === 'tr' ? 'Seçili sektörde uygun kategori bulunamadı' : 'No categories found'}
                    </p>
                    {selectedSector !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setSelectedSector('all')}
                        className="text-[10px] text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        {lang === 'tr' ? 'Tüm sektörleri göster' : 'Show all sectors'}
                      </button>
                    )}
                  </div>
                ) : (
                  filteredMarketCats.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectMapping(localCat, c.id)}
                      className="w-full text-left p-1.5 hover:bg-slate-50 rounded-lg text-[11px] transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                          {c.displayName || c.name}
                        </p>
                        {c.paths && c.paths.length > 0 && (
                          <p className="text-[9px] text-slate-400 truncate">{c.paths.join(' > ')}</p>
                        )}
                      </div>
                      <span className="font-mono text-[9px] bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-700 px-1.5 py-0.2 rounded border border-slate-200 shrink-0 ml-1">
                        #{c.id}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-slate-100 pt-1.5 flex justify-between items-center text-[10px] text-slate-400">
                <span>{filteredMarketCats.length} {lang === 'tr' ? 'kategori' : 'categories'}</span>
                <button
                  type="button"
                  onClick={() => setOpenDropdownFor(null)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-800 px-2 py-0.5 cursor-pointer"
                >
                  {lang === 'tr' ? 'Kapat' : 'Close'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ATTRIBUTES BUTTON COLUMN */}
        <div className="lg:w-auto flex items-center justify-end">
          {mappedId ? (
            <button
              type="button"
              onClick={() => handleOpenAttributes(localCat, mappedId)}
              title={
                configuredAttrCount > 0 
                  ? `${configuredAttrCount} özellik ayarlandı. Düzenlemek için tıklayın.` 
                  : 'Pazaryeri zorunlu özelliklerini ayarla'
              }
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer border ${
                configuredAttrCount > 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span className="hidden sm:inline">
                {configuredAttrCount > 0 
                  ? `${configuredAttrCount} ${lang === 'tr' ? 'Özellik' : 'Attrs'}` 
                  : (lang === 'tr' ? 'Özellikler' : 'Attributes')}
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-bold ${
                configuredAttrCount > 0 ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-800'
              }`}>
                {configuredAttrCount}
              </span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 italic">
              {lang === 'tr' ? 'Önce kategori eşleyin' : 'Map first'}
            </span>
          )}
        </div>

      </div>

      {/* CATEGORY COMMISSION & REVERSE MARGIN PRICING BAR */}
      <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <Percent className="h-2.5 w-2.5 text-indigo-500" />
            <span>{lang === 'tr' ? 'Özel Komisyon:' : 'Category Markup:'}</span>
          </span>
          
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'tr' ? 'Kom' : 'Comm'}</span>
            <div className="flex items-center">
              <span className="text-[10px] font-bold text-indigo-600 mr-0.5">%</span>
              <input
                type="number"
                min="0"
                max="99"
                step="0.5"
                placeholder={String(defaultCommissionRates[activeMarketplace] ?? 18)}
                value={categoryMarkups[activeMarketplace]?.[localCat]?.commissionRate ?? ''}
                onChange={(e) => handleUpdateCategoryMarkup(localCat, 'commissionRate', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                className="w-9 bg-transparent text-[10px] font-bold text-slate-800 focus:outline-hidden text-right"
              />
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase">{lang === 'tr' ? 'Sabit' : 'Fixed'}</span>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                step="1"
                placeholder={String(defaultFixedFees[activeMarketplace] ?? 20)}
                value={categoryMarkups[activeMarketplace]?.[localCat]?.fixedFee ?? ''}
                onChange={(e) => handleUpdateCategoryMarkup(localCat, 'fixedFee', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                className="w-9 bg-transparent text-[10px] font-bold text-slate-800 focus:outline-hidden text-right"
              />
              <span className="text-[9px] font-bold text-slate-500 ml-0.5">TL</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[9px]">
          {(() => {
            const customComm = categoryMarkups[activeMarketplace]?.[localCat]?.commissionRate;
            const customFee = categoryMarkups[activeMarketplace]?.[localCat]?.fixedFee;
            const comm = customComm !== undefined && !isNaN(Number(customComm)) ? Number(customComm) : (defaultCommissionRates[activeMarketplace] ?? 18);
            const fee = customFee !== undefined && !isNaN(Number(customFee)) ? Number(customFee) : (defaultFixedFees[activeMarketplace] ?? 20);
            const sim = calculateSimulatedPrice(1000, comm, fee);
            const hasCustom = customComm !== undefined || customFee !== undefined;
            return (
              <span className={`px-1.5 py-0.5 rounded font-mono font-bold flex items-center space-x-1 border ${
                hasCustom 
                  ? 'bg-purple-50 text-purple-700 border-purple-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <span className="text-[8px] uppercase">{hasCustom ? 'Özel:' : 'Varsayılan:'}</span>
                <span>1.000 TL ➔ {sim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
