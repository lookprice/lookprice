import React, { useState, useEffect } from "react";

interface StoreFeaturedRowProps {
  store: any;
  onSave: (id: number, isFeatured: boolean, order: number, title: string) => void;
  isSaving: boolean;
}

export const StoreFeaturedRow: React.FC<StoreFeaturedRowProps> = ({ store, onSave, isSaving }) => {
  const [isFeatured, setIsFeatured] = useState(!!store.is_enrakipsiz_featured);
  const [order, setOrder] = useState(store.enrakipsiz_featured_order || 0);
  const [title, setTitle] = useState(store.enrakipsiz_featured_title || "");

  useEffect(() => {
    setIsFeatured(!!store.is_enrakipsiz_featured);
    setOrder(store.enrakipsiz_featured_order || 0);
    setTitle(store.enrakipsiz_featured_title || "");
  }, [store]);

  return (
    <div className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
      isFeatured ? 'bg-amber-50/20 border-amber-200/60 shadow-[0_2px_8px_rgba(245,158,11,0.04)]' : 'bg-white border-gray-150'
    }`}>
      <div className="flex items-center gap-3 min-w-[200px] max-w-sm">
        {store.logo_url ? (
          <img src={store.logo_url} alt={store.name} className="h-10 w-10 object-contain rounded-lg border bg-white p-0.5" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-10 w-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold text-xs">
            {store.name ? store.name.substring(0,2).toUpperCase() : 'MA'}
          </div>
        )}
        <div>
          <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            {store.name}
            {isFeatured && <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">⭐ SPONSOR</span>}
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">@{store.slug}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Toggle Switch */}
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id={`feat-${store.id}`}
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor={`feat-${store.id}`} className="text-xs font-bold text-slate-600 cursor-pointer select-none">
            Vitrin Sponsoru Yap
          </label>
        </div>

        {/* Custom Title Slogan */}
        <div>
          <input 
            type="text"
            placeholder="Örn: KKTC Emlak & Yatırım Lideri"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isFeatured}
            className="w-full p-2 border border-gray-200 rounded-xl text-xs disabled:bg-gray-50 disabled:text-gray-400 font-medium"
          />
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Sıra:</span>
          <input 
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            disabled={!isFeatured}
            className="w-20 p-2 border border-gray-200 rounded-xl text-xs font-mono disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>
      </div>

      <div className="shrink-0">
        <button
          onClick={() => onSave(store.id, isFeatured, order, title)}
          disabled={isSaving}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 w-full md:w-auto justify-center ${
            isFeatured 
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          {isSaving ? "..." : "Güncelle"}
        </button>
      </div>
    </div>
  );
};
