import React, { useState, useDeferredValue, useEffect } from "react";
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
  Tag,
  Percent,
  History
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
  onDelete: (id: number) => void;
  onExportReport: () => void;
  onApplyTaxRule?: (category: string, taxRate: number) => void;
  onBulkPriceUpdate?: () => void;
  onShowQr: () => void;
  branding?: any;
  showStoreName?: boolean;
  currentStoreId?: number;
}

const ProductsTab = ({ 
  products, 
  loading, 
  isViewer, 
  onDeleteAll, 
  onEdit, 
  onDelete,
  onExportReport,
  onApplyTaxRule,
  onBulkPriceUpdate,
  onShowQr,
  branding,
  showStoreName,
  currentStoreId
}: ProductsTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [search, setSearch] = useState("");
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

  const filteredProducts = products.filter(p => 
    p.name.toLocaleLowerCase('tr-TR').includes(deferredSearch.toLocaleLowerCase('tr-TR')) || 
    p.barcode.includes(deferredSearch)
  );
  
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
    <div className="space-y-6">
      {selectedProduct && (
        <ProductMovementModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          branding={branding}
        />
      )}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t.searchProduct}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all text-sm placeholder:text-slate-400"
            value={search}
            onChange={(e) => { 
              setSearch(e.target.value);
              setPage(1); 
            }}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={onShowQr}
            className="flex-1 md:flex-none flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <QrCode className="h-4 w-4 mr-2 text-slate-500" /> {t.qr}
          </button>
          <button 
            onClick={onExportReport}
            className="flex-1 md:flex-none flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            <Download className="h-4 w-4 mr-2 text-slate-500" /> {t.report}
          </button>
          {!isViewer && (
            <>
              {onApplyTaxRule && branding?.category_tax_rules?.map((rule: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => onApplyTaxRule(rule.category, rule.taxRate)}
                  className="flex-1 md:flex-none flex items-center justify-center bg-white text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                  title={`${rule.category} ${t.taxRateUpdateTitle}${rule.taxRate}`}
                >
                  <Tag className="h-4 w-4 mr-2 text-indigo-500" /> {rule.category} {t.tax} %{rule.taxRate}
                </button>
              ))}
              {onBulkPriceUpdate && (
                <button 
                  onClick={onBulkPriceUpdate}
                  className="flex-1 md:flex-none flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                  title={t.bulkPriceUpdate}
                >
                  <Percent className="h-4 w-4 mr-2 text-emerald-500" /> {t.bulkPrice}
                </button>
              )}
              <button 
                onClick={() => {
                  if (window.confirm(lang === 'tr' ? 'Tüm ürünlerin 2. Satış Fiyatları (KDV Hariç) güncellensin mi?' : 'Update 2nd Sales Prices (Excl. Tax) for all products?')) {
                    const updatedProducts = products.map(p => ({
                      ...p,
                      price_2: (Number(p.price) / (1 + Number(p.tax_rate) / 100)).toFixed(2)
                    }));
                    Promise.all(updatedProducts.map(p => api.updateProduct(p.id, { ...p, price_2: p.price_2 }, currentStoreId))).then(() => {
                      alert(lang === 'tr' ? 'Tüm ürünler güncellendi.' : 'All products updated.');
                      window.location.reload();
                    });
                  }
                }}
                className="flex-1 md:flex-none flex items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-all"
              >
                {lang === 'tr' ? 'Tüm Fiyatları Hesapla' : 'Calculate All Prices'}
              </button>
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
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.barcode}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.productName}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.category}</th>
                {showStoreName && <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.branch}</th>}
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.price}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.tax}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.cost}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{t.stock}</th>
                <th className="px-6 py-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm font-medium">{t.loading}</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">
                    {t.noProducts}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-1 rounded-md text-slate-600 border border-slate-200">
                        {p.barcode?.toString().padStart(13, '0').slice(-13)}
                      </span>
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
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <Package className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {p.brand && (
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-tighter">
                                {p.brand}
                              </span>
                            )}
                            {p.author && (
                              <span className="text-[10px] font-medium text-slate-400 italic">
                                {p.author}
                              </span>
                            )}
                            {p.product_type === 'service' && (
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 uppercase">
                                {lang === 'tr' ? 'Hizmet' : 'Service'}
                              </span>
                            )}
                            {p.is_web_sale === false && (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 uppercase">
                                {lang === 'tr' ? 'Web Kapalı' : 'Web Off'}
                              </span>
                            )}
                            {p.labels && Array.isArray(p.labels) && p.labels.map((label: string, idx: number) => (
                              <span key={idx} className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-100 uppercase">
                                {label}
                              </span>
                            ))}
                            {p.description && <div className="text-xs text-slate-400 truncate max-w-[180px]">{p.description}</div>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase tracking-tighter">
                        {p.category || '-'}
                      </span>
                    </td>
                    {showStoreName && (
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-tighter">
                          {p.store_name}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">
                        {Number(p.price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{(p.currency || 'TRY').substring(0, 3)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                        %{p.tax_rate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.cost_price > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-600">
                            {Number(p.cost_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} <span className="text-[10px] text-slate-400 font-medium ml-0.5">{(p.cost_currency || 'TRY').substring(0, 3)}</span>
                          </span>
                          {(() => {
                            const profit = calculateProfitMargin(p);
                            if (!profit) return null;
                            const isLoss = profit.margin < 0;
                            return (
                              <span className={`text-[10px] font-bold ${isLoss ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isLoss ? '' : '+'}{profit.margin.toFixed(1)}% {t.profit}
                              </span>
                            );
                          })()}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.product_type === 'service' ? (
                        <span className="text-xs text-slate-400 italic">{lang === 'tr' ? 'Stok Takipsiz' : 'No Stock Tracking'}</span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold ${Number(p.stock_quantity) <= Number(p.min_stock_level) ? 'text-rose-600' : 'text-slate-700'}`}>
                            {p.stock_quantity}
                          </span>
                          {Number(p.stock_quantity) <= Number(p.min_stock_level) && (
                            <div className="flex items-center px-1.5 py-0.5 bg-rose-50 rounded text-[10px] font-bold text-rose-600 border border-rose-100 uppercase tracking-tighter">
                              <AlertTriangle className="h-3 w-3 mr-1" /> {t.low}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isViewer && (
                        <div className="flex justify-end space-x-1 transition-opacity">
                          <button 
                            onClick={() => setSelectedProduct(p)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                            title={t.movementHistory}
                          >
                            <History className="h-4 w-4" />
                          </button>
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
