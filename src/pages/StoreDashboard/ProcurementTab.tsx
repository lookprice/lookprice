import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Package, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  ExternalLink, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translations } from '../../translations';
import { useLanguage } from '../../contexts/LanguageContext';

interface Procurement {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  quantity: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  supplier_id: number | null;
  supplier_stock: number | null;
  supplier_price: number | null;
  created_at: string;
  sale_customer_name: string;
}

interface SupplierApi {
  id: number;
  name: string;
  api_url: string;
  api_key: string;
}

interface SupplierQueryResult {
  supplier_id: number;
  supplier_name: string;
  stock: number;
  price: number;
}

export const ProcurementTab: React.FC<{ storeId?: number; isViewer?: boolean }> = ({ storeId, isViewer }) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [supplierApis, setSupplierApis] = useState<SupplierApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [queryingId, setQueryingId] = useState<number | null>(null);
  const [queryResults, setQueryResults] = useState<Record<number, SupplierQueryResult[]>>({});
  
  // API Settings Modal State
  const [editingApi, setEditingApi] = useState<Partial<SupplierApi> | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [procRes, apiRes] = await Promise.all([
        api.getProcurements(storeId),
        api.getSupplierApis(storeId)
      ]);
      setProcurements(procRes);
      setSupplierApis(apiRes);
    } catch (err) {
      console.error("Error fetching procurement data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryApis = async (id: number) => {
    setQueryingId(id);
    try {
      const results = await api.querySupplierApis(id, storeId);
      setQueryResults(prev => ({ ...prev, [id]: results }));
    } catch (err) {
      console.error("Error querying supplier APIs:", err);
    } finally {
      setQueryingId(null);
    }
  };

  const handleUpdateStatus = async (id: number, status: Procurement['status'], supplierData?: Partial<Procurement>) => {
    try {
      await api.updateProcurement(id, { status, ...supplierData }, storeId);
      fetchData();
    } catch (err) {
      console.error("Error updating procurement status:", err);
    }
  };

  const handleDeleteProcurement = async (id: number) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api.deleteProcurement(id, storeId);
      fetchData();
    } catch (err) {
      console.error("Error deleting procurement:", err);
    }
  };

  const handleSaveApi = async () => {
    if (!editingApi?.name || !editingApi?.api_url) return;
    try {
      if (editingApi.id) {
        await api.updateSupplierApi(editingApi.id, editingApi, storeId);
      } else {
        await api.addSupplierApi(editingApi, storeId);
      }
      setIsApiModalOpen(false);
      setEditingApi(null);
      fetchData();
    } catch (err) {
      console.error("Error saving supplier API:", err);
    }
  };

  const handleDeleteApi = async (id: number) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api.deleteSupplierApi(id, storeId);
      fetchData();
    } catch (err) {
      console.error("Error deleting supplier API:", err);
    }
  };

  const getStatusColor = (status: Procurement['status']) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ordered': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'received': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: Procurement['status']) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'ordered': return <Truck className="w-4 h-4" />;
      case 'received': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const paginatedProcurements = procurements.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(procurements.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t.procurement.title}</h2>
          <p className="text-gray-500">{t.procurement.description}</p>
        </div>
        <button
          onClick={() => setShowApiSettings(!showApiSettings)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Settings className="w-4 h-4" />
          {t.apiSettings}
        </button>
      </div>

      <AnimatePresence>
        {showApiSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  {t.procurement.supplierApiSources}
                </h3>
                {!isViewer && (
                  <button
                    onClick={() => {
                      setEditingApi({ name: '', api_url: '', api_key: '' });
                      setIsApiModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    {t.procurement.addNewApi}
                  </button>
                )}
              </div>
              
              {supplierApis.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">{t.procurement.noApiSources}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supplierApis.map(api => (
                    <div key={api.id} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-200 transition-colors group">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{api.name}</h4>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{api.api_url}</p>
                        </div>
                        {!isViewer && (
                          <div className="flex items-center gap-1 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingApi(api);
                                setIsApiModalOpen(true);
                              }}
                              className="p-1 text-gray-400 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteApi(api.id)}
                              className="p-1 text-gray-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-bottom border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.procurement.productInfo}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.service_tab.quantity}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.procurement.customerSale}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.status}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.procurement.supplierQuery}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProcurements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">{t.procurement.noProcurementItems}</p>
                      <p className="text-sm text-gray-400">{t.procurement.noProcurementItemsDesc}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProcurements.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 truncate max-w-[150px] md:max-w-[250px]" title={item.product_name}>{item.product_name}</span>
                        <span className="text-xs text-gray-500 font-mono">{item.barcode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700 font-medium">{item.quantity} {t.procurement.units}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">{item.sale_customer_name || t.procurement.unknownCustomer}</span>
                        <span className="text-xs text-indigo-600 font-medium">{t.sale} #{item.sale_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status === 'pending' ? t.procurement.statuses.pending : 
                         item.status === 'ordered' ? t.procurement.statuses.ordered : 
                         item.status === 'received' ? t.procurement.statuses.received : t.procurement.statuses.cancelled}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleQueryApis(item.id)}
                          disabled={queryingId === item.id || supplierApis.length === 0}
                          className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {queryingId === item.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Search className="w-3 h-3" />
                          )}
                          {t.procurement.queryApi}
                        </button>
                        
                        {queryResults[item.id] && (
                          <div className="space-y-1">
                            {queryResults[item.id].map(res => (
                              <div key={res.supplier_id} className="flex items-center justify-between gap-4 p-1.5 bg-gray-50 rounded border border-gray-100 text-[10px]">
                                <span className="font-medium text-gray-700">{res.supplier_name}:</span>
                                <div className="flex items-center gap-2">
                                  <span className={res.stock >= item.quantity ? 'text-emerald-600' : 'text-rose-600'}>
                                    {t.service_tab.stock}: {res.stock}
                                  </span>
                                  <span className="text-indigo-600">
                                    {res.price.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' })}
                                  </span>
                                  {!isViewer && (
                                    <button
                                      onClick={() => handleUpdateStatus(item.id, 'ordered', { 
                                        supplier_id: res.supplier_id,
                                        supplier_stock: res.stock,
                                        supplier_price: res.price
                                      })}
                                      className="p-0.5 text-indigo-600 hover:bg-indigo-50 rounded"
                                      title={t.procurement.placeOrder}
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {item.supplier_id && (
                          <div className="text-[10px] text-gray-500 italic">
                            {t.procurement.selected}: {supplierApis.find(a => a.id === item.supplier_id)?.name} 
                            ({item.supplier_price?.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { style: 'currency', currency: 'TRY' })})
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        {!isViewer && (
                          <>
                            {item.status !== 'received' && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'received')}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title={t.received}
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                            )}
                            {item.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, 'cancelled')}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title={t.cancel}
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProcurement(item.id)}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title={t.delete}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">
              {procurements.length} {t.records}
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                {t.prev}
              </button>
              <div className="text-xs font-medium text-gray-600 tabular-nums">
                {page} <span className="text-gray-300 mx-1">/</span> {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* API Modal */}
      <AnimatePresence>
        {isApiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingApi?.id ? t.procurement.editApiSource : t.procurement.addNewApiSource}
                </h3>
                <button onClick={() => setIsApiModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.procurement.supplierName}</label>
                  <input
                    type="text"
                    value={editingApi?.name || ''}
                    onChange={e => setEditingApi(prev => ({ ...prev!, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={t.procurement.example_supplier}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
                  <input
                    type="text"
                    value={editingApi?.api_url || ''}
                    onChange={e => setEditingApi(prev => ({ ...prev!, api_url: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="https://api.supplier.com/stock"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key ({t.procurement.optional})</label>
                  <input
                    type="password"
                    value={editingApi?.api_key || ''}
                    onChange={e => setEditingApi(prev => ({ ...prev!, api_key: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="••••••••••••••••"
                  />
                </div>
                <div className="bg-amber-50 p-3 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700">
                    {t.procurement.apiSourceInfo}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsApiModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSaveApi}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  {t.save}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
