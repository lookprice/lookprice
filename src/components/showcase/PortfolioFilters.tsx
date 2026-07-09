import React from "react";
import { ChevronDown, X } from "lucide-react";

interface PortfolioFiltersProps {
  lang: string;
  store: any;
  portfolioType: string;
  setPortfolioType: (type: any) => void;
  portfolioMinPrice: string;
  setPortfolioMinPrice: (price: string) => void;
  portfolioMaxPrice: string;
  setPortfolioMaxPrice: (price: string) => void;
  portfolioRooms: string;
  setPortfolioRooms: (rooms: string) => void;
  portfolioMinM2: string;
  setPortfolioMinM2: (m2: string) => void;
}

export const PortfolioFilters: React.FC<PortfolioFiltersProps> = ({
  lang,
  store,
  portfolioType,
  setPortfolioType,
  portfolioMinPrice,
  setPortfolioMinPrice,
  portfolioMaxPrice,
  setPortfolioMaxPrice,
  portfolioRooms,
  setPortfolioRooms,
  portfolioMinM2,
  setPortfolioMinM2,
}) => {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 mb-12 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Filter 1: Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === "tr" ? "İlan Türü" : "Listing Type"}
          </label>
          <div className="relative">
            <select
              value={portfolioType}
              onChange={(e) => setPortfolioType(e.target.value as any)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none appearance-none shadow-sm cursor-pointer"
            >
              <option value="all">{lang === "tr" ? "Tüm İlanlar" : "All Listings"}</option>
              <option value="real_estate">{lang === "tr" ? "Gayrimenkul" : "Real Estate"}</option>
              <option value="car">{lang === "tr" ? "Otomobil & Hafif Ticari" : "Car & Light Commercial"}</option>
              <option value="motorcycle">{lang === "tr" ? "Motosiklet" : "Motorcycle"}</option>
              <option value="marine">{lang === "tr" ? "Deniz Taşıtları" : "Marine"}</option>
              <option value="construction">{lang === "tr" ? "İş Makineleri" : "Construction Equipment"}</option>
              <option value="agricultural">{lang === "tr" ? "Tarım Makineleri" : "Agricultural Equipment"}</option>
              <option value="other">{lang === "tr" ? "Diğer" : "Other"}</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Filter 2: Min Price */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === "tr" ? "Min Fiyat" : "Min Price"} ({store?.currency || "TRY"})
          </label>
          <input
            type="number"
            placeholder="0"
            value={portfolioMinPrice}
            onChange={(e) => setPortfolioMinPrice(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none shadow-sm"
          />
        </div>

        {/* Filter 3: Max Price */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === "tr" ? "Max Fiyat" : "Max Price"} ({store?.currency || "TRY"})
          </label>
          <input
            type="number"
            placeholder="∞"
            value={portfolioMaxPrice}
            onChange={(e) => setPortfolioMaxPrice(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none shadow-sm"
          />
        </div>

        {/* Filter 4: Room Count */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === "tr" ? "Oda Sayısı (Emlak)" : "Rooms (Estate)"}
          </label>
          <div className="relative">
            <select
              disabled={portfolioType !== "all" && portfolioType !== "real_estate"}
              value={portfolioRooms}
              onChange={(e) => setPortfolioRooms(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none appearance-none shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">{lang === "tr" ? "Tümü" : "All"}</option>
              <option value="1">1 Oda</option>
              <option value="2">2 Oda</option>
              <option value="3">3 Oda</option>
              <option value="4+">4+ Oda</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Filter 5: Min Area */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {lang === "tr" ? "Min Alan (Emlak)" : "Min Area (Estate)"}
          </label>
          <div className="relative">
            <input
              type="number"
              disabled={portfolioType !== "all" && portfolioType !== "real_estate"}
              placeholder="m²"
              value={portfolioMinM2}
              onChange={(e) => setPortfolioMinM2(e.target.value)}
              className="w-full bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:border-indigo-500 outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Clear filters trigger */}
      {(portfolioType !== "all" ||
        portfolioMinPrice ||
        portfolioMaxPrice ||
        portfolioRooms !== "all" ||
        portfolioMinM2) && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setPortfolioType("all");
              setPortfolioMinPrice("");
              setPortfolioMaxPrice("");
              setPortfolioRooms("all");
              setPortfolioMinM2("");
            }}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {lang === "tr" ? "Filtreleri Temizle" : "Clear Filters"}
          </button>
        </div>
      )}
    </div>
  );
};
