import React from "react";
import { Search, ArrowUpDown, ChevronDown } from "lucide-react";

interface ProductListHeaderProps {
  selectedCategory: string | null;
  t: any;
  productCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: any) => void;
  lang: string;
  isLuxury?: boolean;
}

export const ProductListHeader: React.FC<ProductListHeaderProps> = ({
  selectedCategory,
  t,
  productCount,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  lang,
  isLuxury
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
      <div>
        <h2
          className={`text-4xl md:text-4xl text-slate-900 tracking-tight mb-4 ${isLuxury ? "!font-sans !font-bold" : "font-semibold font-display tracking-tighter"}`}
        >
          {selectedCategory || t.dashboard.allProducts}
        </h2>
        <p className="text-slate-400 font-bold tracking-wide text-[10px]">
          <span className="text-slate-900">{productCount}</span>{" "}
          {t.dashboard.productsFound || "ürün listeleniyor"}
        </p>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="relative flex-1 md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={t.dashboard.searchProducts}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 focus:border-primary rounded-2xl transition-all outline-none text-sm font-medium shadow-sm"
          />
        </div>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <ArrowUpDown className="w-4 h-4" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none pl-11 pr-12 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-50 transition-all shadow-sm min-w-[160px]"
          >
            <option value="default">
              {t.dashboard.newest || (lang === "tr" ? "Varsayılan" : "Default")}
            </option>
            <option value="priceAsc">
              {t.dashboard.priceLow || (lang === "tr" ? "En Düşük Fiyat" : "Price: Low to High")}
            </option>
            <option value="priceDesc">
              {t.dashboard.priceHigh || (lang === "tr" ? "En Yüksek Fiyat" : "Price: High to Low")}
            </option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-gray-900 transition-colors" />
        </div>
      </div>
    </div>
  );
};
