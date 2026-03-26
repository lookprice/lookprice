import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Edit2, 
  ChevronRight, 
  AlertTriangle,
  Download,
  QrCode,
  Package,
  Sparkles
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface ProductsTabProps {
  products: any[];
  loading: boolean;
  isViewer: boolean;
  onDeleteAll: () => void;
  onEdit: (product: any) => void;
  onDelete: (id: number) => void;
  onExportReport: () => void;
  onShowQr: () => void;
  onEnrichAI?: (product: any) => void;
  onBulkEnrichAI?: () => void;
  isEnriching?: boolean;
  enrichProgress?: { current: number; total: number };
  aiReady?: boolean;
  branding?: any;
}

const ProductsTab = ({ 
  products, 
  loading, 
  isViewer, 
  onDeleteAll, 
  onEdit, 
  onDelete,
  onExportReport,
  onShowQr,
  onEnrichAI,
  onBulkEnrichAI,
  isEnriching,
  enrichProgress,
  aiReady,
  branding
}: ProductsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const calculateProfitMargin = (p: any) => {
    if (!p.cost_price || p.cost_price === 0) return null;
    
    const getRate = (currency: string) => {
      if (currency === 'TRY' || !currency) return 1;
      return branding?.currency_rates?.[currency] || 1;
    };

    const salesRate = getRate(p.currency);
    const costRate = getRate(p.cost_currency);

    const salesInTry = p.price * salesRate;
    const costInTry = p.cost_price * costRate;

    const profit = salesInTry - costInTry;
    const margin = (profit / costInTry) * 100;
    
    return {
      profitInTry: profit,
      margin: margin
    };
  };

  const filteredProducts = products.filter(p => 
    p.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) || 
    p.barcode.includes(search)
  );
  
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t.searchProduct}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all text-sm placeholder:text-slate-400"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {!isViewer && onBulkEnrichAI && (
            <div className="relative group">
              <button 
                onClick={onBulkEnrichAI}
                disabled={isEnriching}
                className={`flex-1 md:flex-none flex items-center justify-center px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  isEnriching 
                    ? 'bg-amber-50 text-amber-600 border border-amber-200 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
                }`}
              >
                {isEnriching && enrichProgress ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    %{Math.round((enrichProgress.current / enrichProgress.total) * 100)}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {lang === 'tr' ? 'AI Zenginleştir' : 'AI Enrich'}
                  </>
                )}
              </button>
              
              {/* AI Status Dot */}
              <div 
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                  aiReady ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={aiReady ? (lang === 'tr' ? 'AI Hazır' : 'AI Ready') : (lang === 'tr' ? 'API Anahtarı Gerekli' : 'API Key Required')}
              />
            </div>
          )}
          <button 
            onClick={onShowQr}
            className="flex-1 md:flex-none flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <QrCode className="h-4 w-4 mr-2 text-slate-500" /> {lang === 'tr' ? 'QR' : 'QR'}
          </button>
          <button 
            onClick={onExportReport}
            className="flex-1 md:flex-none flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Download className="h-4 w-4 mr-2 text-slate-500" /> {lang === 'tr' ? 'Rapor' : 'Export'}
          </button>
          {!isViewer && (
            <>
              <button 
                onClick={onDeleteAll}
                className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100"
                title={t.deleteAll}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden zebra-border">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.barcode}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.productName}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.price}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Maliyet' : 'Cost'}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.stock}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm font-medium">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {t.noProducts}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md text-slate-600 border border-slate-200">{p.barcode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img 
                            src={p.image_url} 
                            alt={p.name} 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.category && (
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">
                                {p.category}
                              </span>
                            )}
                            {p.description && <div className="text-xs text-slate-400 truncate max-w-[180px]">{p.description}</div>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">
                        {Number(p.price).toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{p.currency}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.cost_price > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-600">
                            {Number(p.cost_price).toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{p.cost_currency}</span>
                          </span>
                          {(() => {
                            const profit = calculateProfitMargin(p);
                            if (!profit) return null;
                            const isLoss = profit.margin < 0;
                            return (
                              <span className={`text-[10px] font-bold ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isLoss ? '' : '+'}{profit.margin.toFixed(1)}% {lang === 'tr' ? 'Kar' : 'Profit'}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-bold ${Number(p.stock_quantity) <= Number(p.min_stock_level) ? 'text-rose-600' : 'text-slate-700'}`}>
                          {p.stock_quantity}
                        </span>
                        {Number(p.stock_quantity) <= Number(p.min_stock_level) && (
                          <div className="flex items-center px-1.5 py-0.5 bg-rose-50 rounded text-[10px] font-bold text-rose-600 border border-rose-100 uppercase tracking-tighter">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Low
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isViewer && (
                        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEnrichAI && (
                            <button 
                              onClick={() => onEnrichAI(p)}
                              className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                              title={lang === 'tr' ? 'AI ile Zenginleştir' : 'Enrich with AI'}
                            >
                              <Sparkles className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => onEdit(p)}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => onDelete(p.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Compact List View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-10 w-10 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-500 font-medium text-sm">{t.loading}</p>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium text-sm">
              {t.noProducts}
            </div>
          ) : (
            paginatedProducts.map((p) => (
              <div key={p.id} className="p-4 bg-white active:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="text-sm font-bold text-slate-900 truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{p.barcode}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${Number(p.stock_quantity) <= Number(p.min_stock_level) ? 'text-rose-600 bg-rose-50 border border-rose-100' : 'text-slate-500 bg-slate-50 border border-slate-100'}`}>
                        {p.stock_quantity} {lang === 'tr' ? 'Adet' : 'Pcs'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                      {Number(p.price).toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400 font-medium">{p.currency}</span>
                    </div>
                    {p.cost_price > 0 && (
                      <div className="text-xs font-bold text-slate-500 whitespace-nowrap mt-0.5">
                        {lang === 'tr' ? 'Mal:' : 'Cost:'} {Number(p.cost_price).toLocaleString('tr-TR')} <span className="text-[9px] text-slate-400 font-medium">{p.cost_currency}</span>
                        {(() => {
                          const profit = calculateProfitMargin(p);
                          if (!profit) return null;
                          const isLoss = profit.margin < 0;
                          return (
                            <span className={`ml-1 text-[9px] font-bold ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                              ({isLoss ? '' : '+'}{profit.margin.toFixed(1)}%)
                            </span>
                          );
                        })()}
                      </div>
                    )}
                    {!isViewer && (
                      <div className="flex items-center justify-end gap-1 mt-2">
                        {onEnrichAI && (
                          <button 
                            onClick={() => onEnrichAI(p)}
                            className="p-2 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl active:scale-90 transition-all"
                            title={lang === 'tr' ? 'AI ile Zenginleştir' : 'Enrich with AI'}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => onEdit(p)}
                          className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl active:scale-90 transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => onDelete(p.id)}
                          className="p-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl active:scale-90 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              {filteredProducts.length} {t.products}
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                {t.prev}
              </button>
              <div className="text-xs font-bold text-slate-600 tabular-nums">
                {page} <span className="text-slate-300 mx-1">/</span> {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsTab;
