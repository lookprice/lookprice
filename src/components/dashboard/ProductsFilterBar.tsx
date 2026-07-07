import React from "react";
import { Search, Filter, Globe } from "lucide-react";
import { translations } from "@/translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface ProductsFilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  categories: string[];
  marketplaceFilter: string;
  setMarketplaceFilter: (value: string) => void;
  includeZeroStock: boolean;
  setIncludeZeroStock: (value: boolean) => void;
  setPage: (value: number) => void;
  t: any;
}

const ProductsFilterBar = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  categories,
  marketplaceFilter,
  setMarketplaceFilter,
  includeZeroStock,
  setIncludeZeroStock,
  setPage,
  t
}: ProductsFilterBarProps) => {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-row flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto sm:max-w-2xl ml-auto">
      <div className="relative w-full sm:w-auto flex-1 group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
        <input 
          type="text" 
          placeholder={t.searchProduct}
          className="os-input w-full pr-10 py-2.5 text-[13px] font-bold truncate"
          style={{ paddingLeft: '2.75rem' }}
          value={search}
          onChange={(e) => { 
            setSearch(e.target.value);
            setPage(1); 
          }}
        />
      </div>
      <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
        <div className="relative w-36 sm:w-44 shrink-0 group">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <select 
            className="os-input w-full pr-8 py-2.5 text-[13px] font-bold appearance-none cursor-pointer truncate"
            style={{ paddingLeft: '2.75rem' }}
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t.allCategories}</option>
            {categories.map((cat: any) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="relative w-36 sm:w-44 shrink-0 group">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          <select 
            className="os-input w-full pr-8 py-2.5 text-[13px] font-bold appearance-none cursor-pointer truncate"
            style={{ paddingLeft: '2.75rem' }}
            value={marketplaceFilter}
            onChange={(e) => {
              setMarketplaceFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{lang === 'tr' ? 'Tüm İlanlar' : 'All Listings'}</option>
            <option value="listed">{lang === 'tr' ? 'Pazarama: İlanda' : 'Pazarama: Listed'}</option>
            <option value="not_listed">{lang === 'tr' ? 'Pazarama: İlanda Değil' : 'Pazarama: Not Listed'}</option>
          </select>
        </div>
      </div>
      <label className="flex items-center cursor-pointer group shrink-0 ml-1">
        <div className="relative flex items-center">
          <input 
            type="checkbox" 
            className="peer h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10 transition-all cursor-pointer"
            checked={includeZeroStock}
            onChange={(e) => setIncludeZeroStock(e.target.checked)}
          />
        </div>
        <span className="ml-2 text-xs font-medium text-slate-600 group-hover:text-slate-800 transition-colors whitespace-nowrap">
          {lang === 'tr' ? '0 Stokları Göster' : 'Show Zero Stock'}
        </span>
      </label>
    </div>
  );
};

export default ProductsFilterBar;
