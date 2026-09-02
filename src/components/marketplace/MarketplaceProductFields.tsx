import React, { useState, useEffect } from "react";
import { Search, ChevronDown, CheckCircle2 } from "lucide-react";

interface MarketplaceProductFieldsProps {
  product: any;
  onUpdate: (data: any) => void;
  isTr: boolean;
  categories: any[];
}

export const MarketplaceProductFields = ({ product, onUpdate, isTr, categories }: MarketplaceProductFieldsProps) => {
  const [marketData, setMarketData] = useState(product?.marketplace_data?.hepsiburada || { categoryId: "", attributes: {} });
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategorySelect = (categoryId: string) => {
    const updated = { ...marketData, categoryId };
    setMarketData(updated);
    onUpdate({ ...product, marketplace_data: { ...product.marketplace_data, hepsiburada: updated } });
  };

  return (
    <div className="p-4 bg-rose-50/20 rounded-3xl border border-rose-100 space-y-4 mt-4">
      <input type="hidden" name="marketplace_data" value={JSON.stringify(marketData)} />
      <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
        <span className="text-[11px] font-black text-rose-950 uppercase tracking-wider">Hepsiburada Entegrasyon</span>
        {marketData.categoryId && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
      </div>
      
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-rose-700 uppercase">{isTr ? "Kategori Eşleştirme" : "Category Mapping"}</label>
        <div className="relative">
          <input
            type="text"
            placeholder={isTr ? "Kategori ara..." : "Search categories..."}
            className="w-full px-4 py-2.5 bg-white border border-rose-200 rounded-xl text-xs font-bold focus:border-rose-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-rose-300" />
        </div>
        
        {searchTerm && (
          <div className="mt-2 max-h-40 overflow-y-auto bg-white border border-rose-100 rounded-xl shadow-lg">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-rose-50 ${marketData.categoryId === cat.id ? "bg-rose-100 text-rose-800" : "text-slate-700"}`}
                onClick={() => handleCategorySelect(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
