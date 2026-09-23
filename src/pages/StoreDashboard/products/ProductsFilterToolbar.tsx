import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Filter, 
  X, 
  Flame, 
  Store, 
  AlertTriangle, 
  ExternalLink,
  Sparkles,
  Star,
  Award,
  Crown,
  Clock,
  Tag,
  ChevronDown,
  Check
} from "lucide-react";
import { TableManager } from "@/components/common/TableManager";
import { BOOKSTORE_BADGES } from "@/data/bookstoreBadges";
import { MarketplaceFilterType, MarketplaceModalTab, MarketplaceModalStatus } from "./types";

interface ProductsFilterToolbarProps {
  search: string;
  setSearch: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  categories: string[];
  setPage: (p: number) => void;
  includeZeroStock: boolean;
  setIncludeZeroStock: (inc: boolean) => void;
  tableManager: any;
  paginatedProducts: any[];
  isCafe: boolean;
  isBookstore: boolean;
  isShopLp: boolean;
  connectedMarketplaces: any;
  marketplaceFilter: MarketplaceFilterType;
  setMarketplaceFilter: (filter: MarketplaceFilterType) => void;
  marketplaceActiveCount: number;
  hbActiveCount: number;
  tyActiveCount: number;
  n11ActiveCount: number;
  amzActiveCount: number;
  pzrActiveCount: number;
  marketplaceErrorCount: number;
  setShowMarketplaceListingsModal: (show: boolean) => void;
  setMarketplaceModalTab: (tab: MarketplaceModalTab) => void;
  setMarketplaceModalStatus: (status: MarketplaceModalStatus) => void;
  products: any[];
  getIsBestseller: (p: any) => boolean;
  hasProductBadgeLocal: (p: any, id: string) => boolean;
  lang: string;
  t: any;
  branches?: any[];
  includeBranches?: boolean;
  onToggleIncludeBranches?: (val: boolean) => void;
}

export const ProductsFilterToolbar: React.FC<ProductsFilterToolbarProps> = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  categories,
  setPage,
  includeZeroStock,
  setIncludeZeroStock,
  tableManager,
  paginatedProducts,
  isCafe,
  isBookstore,
  isShopLp,
  connectedMarketplaces,
  marketplaceFilter,
  setMarketplaceFilter,
  marketplaceActiveCount,
  hbActiveCount,
  tyActiveCount,
  n11ActiveCount,
  amzActiveCount,
  pzrActiveCount,
  marketplaceErrorCount,
  setShowMarketplaceListingsModal,
  setMarketplaceModalTab,
  setMarketplaceModalStatus,
  products,
  getIsBestseller,
  hasProductBadgeLocal,
  lang,
  t,
  branches = [],
  includeBranches = false,
  onToggleIncludeBranches
}) => {
  const [isBadgeMenuOpen, setIsBadgeMenuOpen] = useState(false);
  const badgeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (badgeMenuRef.current && !badgeMenuRef.current.contains(e.target as Node)) {
        setIsBadgeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activeBadgeId = selectedCategory.startsWith("badge_")
    ? selectedCategory.replace("badge_", "")
    : null;
  const activeBadgeDef = activeBadgeId
    ? BOOKSTORE_BADGES.find((b) => b.id === activeBadgeId)
    : null;
  const activeBadgeCount = activeBadgeId
    ? products.filter((p) => hasProductBadgeLocal(p, activeBadgeId)).length
    : 0;

  return (
    <div className="space-y-2">
      {/* Row: Search Bar & Primary Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
        {/* Search Input: Expands smoothly with generous room */}
        <div className="relative w-full sm:flex-1 group min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
          <input 
            type="text" 
            placeholder={isCafe ? (lang === 'tr' ? "Ürün / Menü adı ile ara..." : (t.searchProduct || "Search menu product...")) : (lang === 'tr' ? "Ürün adı veya barkod ile ara..." : (t.searchProduct || "Search product name or barcode..."))}
            className="os-input w-full pr-8 py-1.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 shadow-xs"
            style={{ paddingLeft: '2.25rem' }}
            value={search}
            onChange={(e) => { 
              setSearch(e.target.value);
              setPage(1); 
            }}
          />
          {search && (
            <button 
              type="button"
              onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Temizle"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters: Category & 0 Stock Checkbox */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-start">
          <div className="relative flex-1 sm:w-44 sm:flex-initial shrink-0 group min-w-[120px]">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors pointer-events-none" />
            <select 
              className="os-input w-full pr-7 py-1.5 text-xs font-medium appearance-none cursor-pointer truncate shadow-xs"
              style={{ paddingLeft: '2rem' }}
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{t.allCategories}</option>
              {isCafe && <option value="bestsellers">🔥 {lang === 'tr' ? 'En Çok Satanlar' : 'Bestsellers'}</option>}
              {isBookstore && (
                <optgroup label={lang === 'tr' ? "Vitrin Izgara Rozetleri" : "Showcase Badges"}>
                  {BOOKSTORE_BADGES.map((b) => (
                    <option key={`opt-badge-${b.id}`} value={`badge_${b.id}`}>
                      {b.iconName === 'Flame' ? '🔥' : b.iconName === 'Sparkles' ? '✨' : b.iconName === 'Star' ? '⭐' : b.iconName === 'Award' ? '🏆' : b.iconName === 'Crown' ? '👑' : b.iconName === 'Clock' ? '⏳' : '🏷️'} {lang === 'tr' ? b.labelTr : b.labelEn}
                    </option>
                  ))}
                </optgroup>
              )}
              {categories.map((cat: any) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Quick Bestseller Filter Toggle for Cafe */}
          {isCafe && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(selectedCategory === 'bestsellers' ? 'all' : 'bestsellers');
                setPage(1);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shrink-0 border cursor-pointer select-none active:scale-95 ${
                selectedCategory === 'bestsellers'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs'
                  : 'bg-orange-50/80 text-orange-800 hover:bg-orange-100 border-orange-200/80'
              }`}
              title={lang === 'tr' ? 'En Çok Satan Ürünleri Filtrele' : 'Filter Bestsellers'}
            >
              <Flame className={`w-3.5 h-3.5 ${selectedCategory === 'bestsellers' ? 'fill-white text-white' : 'text-orange-500 fill-orange-500'}`} />
              <span className="hidden md:inline">{lang === 'tr' ? 'Çok Satan' : 'Bestseller'}</span>
              <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${selectedCategory === 'bestsellers' ? 'bg-white/20 text-white' : 'bg-orange-200/60 text-orange-900'}`}>
                {products.filter(p => getIsBestseller(p)).length}
              </span>
            </button>
          )}

          {/* Bookstore Showcase Badges - Compact Dropdown Popover */}
          {isBookstore && (
            <div className="relative shrink-0" ref={badgeMenuRef}>
              <button
                type="button"
                onClick={() => setIsBadgeMenuOpen((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer select-none active:scale-95 shadow-xs ${
                  activeBadgeDef
                    ? `${activeBadgeDef.badgeBgClass} border-transparent shadow-sm ring-1 ring-black/10`
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
                title={lang === 'tr' ? 'Vitrin Rozet Filtresi' : 'Showcase Badges Filter'}
              >
                {activeBadgeDef ? (
                  <>
                    {(() => {
                      const IconComp = 
                        activeBadgeDef.iconName === 'Flame' ? Flame :
                        activeBadgeDef.iconName === 'Sparkles' ? Sparkles :
                        activeBadgeDef.iconName === 'Star' ? Star :
                        activeBadgeDef.iconName === 'Award' ? Award :
                        activeBadgeDef.iconName === 'Crown' ? Crown :
                        activeBadgeDef.iconName === 'Clock' ? Clock : Tag;
                      return <IconComp className="w-3.5 h-3.5 text-white shrink-0" />;
                    })()}
                    <span className="truncate max-w-[110px]">
                      {lang === 'tr' ? activeBadgeDef.labelTr : activeBadgeDef.labelEn}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white/20 text-white">
                      {activeBadgeCount}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory('all');
                        setPage(1);
                      }}
                      className="p-0.5 hover:bg-black/20 rounded-full transition-colors ml-0.5"
                      title={lang === 'tr' ? 'Rozet Filtresini Kaldır' : 'Clear Badge Filter'}
                    >
                      <X className="w-3 h-3 text-white" />
                    </span>
                  </>
                ) : (
                  <>
                    <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="hidden md:inline">{lang === 'tr' ? 'Vitrin Rozetleri' : 'Showcase Badges'}</span>
                    <span className="md:hidden">{lang === 'tr' ? 'Rozet' : 'Badge'}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isBadgeMenuOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* Dropdown Popover */}
              {isBadgeMenuOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-3 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{lang === 'tr' ? 'Vitrin Izgara Rozeti' : 'Showcase Badge'}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({products.length} {lang === 'tr' ? 'Kitap' : 'Books'})</span>
                  </div>

                  <div className="p-1 space-y-0.5 max-h-[320px] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setPage(1);
                        setIsBadgeMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        !activeBadgeId 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                        <span>{lang === 'tr' ? 'Tüm Eserler (Filtresiz)' : 'All Books (No Filter)'}</span>
                      </div>
                      {!activeBadgeId && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </button>

                    {BOOKSTORE_BADGES.map((b) => {
                      const filterVal = `badge_${b.id}`;
                      const isSelected = selectedCategory === filterVal;
                      const count = products.filter((p) => hasProductBadgeLocal(p, b.id)).length;
                      const IconComp = 
                        b.iconName === 'Flame' ? Flame :
                        b.iconName === 'Sparkles' ? Sparkles :
                        b.iconName === 'Star' ? Star :
                        b.iconName === 'Award' ? Award :
                        b.iconName === 'Crown' ? Crown :
                        b.iconName === 'Clock' ? Clock : Tag;

                      return (
                        <button
                          key={`menu-badge-${b.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(isSelected ? 'all' : filterVal);
                            setPage(1);
                            setIsBadgeMenuOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer group ${
                            isSelected 
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${b.bgClass}`}>
                              <IconComp className={`w-3.5 h-3.5 ${b.textClass}`} />
                            </div>
                            <span className="truncate">{lang === 'tr' ? b.labelTr : b.labelEn}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              isSelected ? 'bg-indigo-200/60 text-indigo-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {count}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <TableManager 
            manager={tableManager} 
            lang={lang} 
            allRowIds={paginatedProducts.map(p => p.id)} 
          />

          <label className="flex items-center cursor-pointer group shrink-0 select-none px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors">
            <input 
              type="checkbox" 
              className="peer h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
              checked={includeZeroStock}
              onChange={(e) => setIncludeZeroStock(e.target.checked)}
            />
            <span className="ml-1.5 text-xs font-medium text-slate-600 group-hover:text-slate-800 transition-colors whitespace-nowrap">
              {lang === 'tr' ? '0 Stok' : '0 Stock'}
            </span>
          </label>

          {branches && branches.length > 0 && onToggleIncludeBranches && (
            <label className={`flex items-center cursor-pointer group shrink-0 select-none px-2 py-1 rounded-lg border transition-all ${
              includeBranches ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <input 
                type="checkbox" 
                className="peer h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                checked={includeBranches}
                onChange={(e) => onToggleIncludeBranches(e.target.checked)}
              />
              <span className="ml-1.5 text-xs font-semibold whitespace-nowrap flex items-center gap-1">
                <Store className="w-3 h-3 text-indigo-500" />
                {lang === 'tr' ? 'Şube Stokları' : 'Branch Stocks'}
                <span className="px-1 py-0.2 text-[9px] rounded bg-indigo-100 text-indigo-800 font-extrabold">
                  +{branches.length}
                </span>
              </span>
            </label>
          )}
        </div>
      </div>

      {/* E-Marketplace Quick Filter Chips for shopLP (Only visible when connected) */}
      {isShopLp && connectedMarketplaces.hasAnyConnected && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 overflow-x-auto pb-1 scrollbar-none text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Pazaryeri:</span>
            
            <button
              type="button"
              onClick={() => { setMarketplaceFilter('all'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 cursor-pointer ${
                marketplaceFilter === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lang === 'tr' ? 'Tümü' : 'All'}
            </button>

            <button
              type="button"
              onClick={() => { setMarketplaceFilter('listed'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                marketplaceFilter === 'listed'
                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                  : 'bg-white text-orange-800 border-orange-200 hover:bg-orange-50'
              }`}
            >
              <Store className="w-3 h-3" />
              {lang === 'tr' ? 'Satışta' : 'In Marketplace'}
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                marketplaceFilter === 'listed' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-900'
              }`}>
                {marketplaceActiveCount}
              </span>
            </button>

            {connectedMarketplaces.hepsiburada && (
              <button
                type="button"
                onClick={() => { setMarketplaceFilter('hepsiburada'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  marketplaceFilter === 'hepsiburada'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                    : 'bg-white text-orange-900 border-orange-200 hover:bg-orange-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                HB
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  marketplaceFilter === 'hepsiburada' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-900'
                }`}>
                  {hbActiveCount}
                </span>
              </button>
            )}

            {connectedMarketplaces.trendyol && (
              <button
                type="button"
                onClick={() => { setMarketplaceFilter('trendyol'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  marketplaceFilter === 'trendyol'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                TY
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  marketplaceFilter === 'trendyol' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
                }`}>
                  {tyActiveCount}
                </span>
              </button>
            )}

            {connectedMarketplaces.n11 && (
              <button
                type="button"
                onClick={() => { setMarketplaceFilter('n11'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  marketplaceFilter === 'n11'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-red-900 border-red-200 hover:bg-red-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                N11
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  marketplaceFilter === 'n11' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-900'
                }`}>
                  {n11ActiveCount}
                </span>
              </button>
            )}

            {connectedMarketplaces.amazon && (
              <button
                type="button"
                onClick={() => { setMarketplaceFilter('amazon'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  marketplaceFilter === 'amazon'
                    ? 'bg-slate-800 text-amber-300 border-slate-800 shadow-xs'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                AMZ
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  marketplaceFilter === 'amazon' ? 'bg-white/20 text-white' : 'bg-amber-100 text-slate-900'
                }`}>
                  {amzActiveCount}
                </span>
              </button>
            )}

            {connectedMarketplaces.pazarama && (
              <button
                type="button"
                onClick={() => { setMarketplaceFilter('pazarama'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  marketplaceFilter === 'pazarama'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                PZR
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  marketplaceFilter === 'pazarama' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'
                }`}>
                  {pzrActiveCount}
                </span>
              </button>
            )}

            {marketplaceErrorCount > 0 && (
              <button
                type="button"
                onClick={() => { setMarketplaceFilter('errors'); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  marketplaceFilter === 'errors'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                {lang === 'tr' ? 'Hatalı' : 'Marketplace Errors'}
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-200 text-rose-900 animate-pulse">
                  {marketplaceErrorCount}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => { setMarketplaceFilter('not_listed'); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border shrink-0 cursor-pointer ${
                marketplaceFilter === 'not_listed'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lang === 'tr' ? 'Pasif' : 'Not Listed'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setMarketplaceModalTab('hepsiburada');
              setMarketplaceModalStatus('active');
              setShowMarketplaceListingsModal(true);
            }}
            className="text-[11px] font-bold text-orange-700 hover:text-orange-900 hover:underline flex items-center gap-1 shrink-0 ml-auto cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            {lang === 'tr' ? 'E-marketler' : 'Manage All Marketplace Listings'}
          </button>
        </div>
      )}
    </div>
  );
};
