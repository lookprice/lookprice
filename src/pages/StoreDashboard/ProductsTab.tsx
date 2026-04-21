import React, { useState, useDeferredValue, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Edit2, 
  ChevronRight, 
  ChevronLeft,
  Filter,
  AlertTriangle,
  Download,
  QrCode,
  Package,
  Tag,
  Percent,
  History,
  Truck,
  X
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";
import ProductMovementModal from "../../components/ProductMovementModal";

interface ProductsTabProps {
  products: any[];
  loading: boolean;
  isViewer: boolean;
  onDeleteAll: () => void;
  onEdit: (product: any) => void;
  onAddNew: () => void;
  onImport: () => void;
  onDelete: (id: number) => void;
  onExportReport: () => void;
  onApplyTaxRule?: (category: string, taxRate: number) => void;
  onBulkPriceUpdate?: () => void;
  onBulkRecalculatePrice2?: () => void;
  onShowQr: () => void;
  branding?: any;
  showStoreName?: boolean;
}

const ProductsTab = ({ 
  products, 
  loading, 
  isViewer, 
  onDeleteAll, 
  onEdit, 
  onAddNew,
  onImport,
  onDelete,
  onExportReport,
  onApplyTaxRule,
  onBulkPriceUpdate,
  onBulkRecalculatePrice2,
  onShowQr,
  branding,
  showStoreName
}: ProductsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
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

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLocaleLowerCase('tr-TR').includes(deferredSearch.toLocaleLowerCase('tr-TR')) || 
                         p.barcode.includes(deferredSearch);
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  return (
    <div className="space-y-4">
      {selectedProduct && (
        <ProductMovementModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          branding={branding}
        />
      )}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{t.productTitle}</h2>
            <div className="flex items-center gap-2">
                {!isViewer && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={onImport}
                      className="os-btn-secondary p-3 text-slate-400 hover:text-indigo-600 rounded-[1rem] transition-all border border-slate-200 hover:border-indigo-200 active:scale-95"
                      title={t.importBtn}
                    >
                      <Upload className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={onAddNew}
                      className="os-btn-primary p-3 text-white rounded-[1rem] transition-all border border-indigo-600 hover:bg-indigo-700 active:scale-95"
                      title={t.addEntry}
                    >
                      <Plus className="h-4.5 w-4.5" />
                    </button>
                    <button 
                      onClick={onDeleteAll}
                      className="p-3 text-slate-400 hover:bg-rose-600 hover:text-white rounded-[1rem] transition-all border border-transparent hover:border-rose-700 active:scale-95"
                      title={t.deleteAll}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
                <button 
                  onClick={onExportReport}
                  className="os-btn-secondary p-3 text-slate-400 hover:text-indigo-600 rounded-[1rem] transition-all border border-slate-200 hover:border-indigo-200 active:scale-95"
                  title={t.report}
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
            </div>
          </div>

          <div className="flex flex-row items-center gap-3 w-full sm:w-auto sm:max-w-md lg:max-w-lg ml-auto">
            <div className="relative flex-1 min-w-[120px] group">
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
              {search && (
                <button 
                  onClick={() => { setSearch(''); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                  title="Temizle"
                >
                  <X className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
            </div>
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
          </div>
        </div>
      </div>

      <div className="os-panel overflow-hidden">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.barcode}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.productName}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.category}</th>
                {showStoreName && <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.branch}</th>}
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.price}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.tax}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.cost}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">{t.stock}</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-5 shadow-2xl shadow-slate-200"></div>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-24 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    {t.noProducts}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] bg-white px-2 py-1 rounded-lg text-slate-600 border border-slate-200 font-bold tracking-widest shadow-sm">
                        {p.barcode?.toString().padStart(13, '0').slice(-13)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {p.image_url ? (
                          <div className="relative group">
                            <img 
                              src={p.image_url} 
                              alt={p.name} 
                              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm group-hover:scale-110 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <Package className="w-6 h-6 text-slate-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[13px] font-black text-slate-900 truncate leading-none mb-1.5">{p.name}</div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {p.brand && (
                              <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded-lg uppercase tracking-widest bg-white">
                                {p.brand}
                              </span>
                            )}
                            {p.product_type === 'service' && (
                              <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-lg uppercase tracking-widest">
                                SERV
                              </span>
                            )}
                            {p.is_web_sale === false && (
                              <span className="text-[8px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-lg uppercase tracking-widest">
                                OFF_LINE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black text-indigo-600 bg-indigo-50/50 px-2.5 py-1.5 rounded-xl border border-indigo-200 uppercase tracking-widest">
                        {p.category || 'N/A'}
                      </span>
                    </td>
                    {showStoreName && (
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-black text-slate-500 bg-slate-100/50 px-2.5 py-1.5 rounded-xl border border-slate-200 uppercase tracking-widest">
                          {p.store_name}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-black text-slate-900 mono-data tracking-tighter">
                        {Number(p.price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[11px] text-slate-400 font-bold ml-1 tracking-normal">{(p.currency || 'TRY').substring(0, 3)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-indigo-600 border border-indigo-100 bg-white px-2 py-1 rounded-lg shadow-sm">
                        VAT_{p.tax_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.cost_price > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-slate-600 mono-data">
                            {Number(p.cost_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-bold ml-1">{(p.cost_currency || 'TRY').substring(0, 3)}</span>
                          </span>
                          {(() => {
                            const profit = calculateProfitMargin(p);
                            if (!profit) return null;
                            const isLoss = profit.margin < 0;
                            return (
                              <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isLoss ? 'LOW_MARGIN' : `+${profit.margin.toFixed(0)}%_PROFIT`}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase letter-wider">NO_COST_DATA</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.product_type === 'service' ? (
                        <span className="text-[9px] font-black text-slate-400 border border-slate-200 px-2 py-1.5 rounded-xl uppercase tracking-widest leading-none">VIRTUAL</span>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span className={`text-[15px] font-black mono-data ${Number(p.stock_quantity) <= Number(p.min_stock_level) ? 'text-rose-600' : 'text-slate-900'}`}>
                            {Math.floor(Number(p.stock_quantity))}
                          </span>
                          {Number(p.stock_quantity) <= Number(p.min_stock_level) && (
                            <div className="flex items-center px-2 py-1 bg-rose-50 text-[8px] font-black text-rose-600 border border-rose-100 rounded-lg uppercase tracking-[0.15em] animate-pulse">
                              LOW_STOCK
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isViewer && (
                        <div className="flex justify-end items-center gap-1 transition-opacity">
                          <button 
                            onClick={() => setSelectedProduct(p)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 active:scale-90"
                            title={t.movementHistory}
                          >
                            <History className="h-4.5 w-4.5" />
                          </button>
                          <button 
                            onClick={() => onEdit(p)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-300 active:scale-90"
                          >
                            <Edit2 className="h-4.5 w-4.5" />
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

        {totalPages > 1 && (
          <div className="px-8 py-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {filteredProducts.length} RECORDS_LOCATED
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2.5 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all active:scale-90 disabled:opacity-20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="text-[11px] font-black text-slate-900 tabular-nums tracking-widest flex items-center">
                <span>PAGE</span>
                <span className="mx-2 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-inner">{page} <span className="text-slate-300 mx-1">/</span> {totalPages}</span>
              </div>

              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2.5 text-slate-400 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all active:scale-90 disabled:opacity-20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsTab;
