import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck, 
  Package,
  Store,
  ArrowRight,
  AlertCircle,
  Loader2,
  ChevronRight,
  MapPin,
  Printer,
  History,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations';

interface StockTransferTabProps {
  storeId: number;
  products: Product[];
  isViewer?: boolean;
}

export default function StockTransferTab({ storeId, products, isViewer }: StockTransferTabProps) {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const [branches, setBranches] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [transferItems, setTransferItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [branchStock, setBranchStock] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);

  const [showDispatchNote, setShowDispatchNote] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [storeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [branchesRes, transfersRes] = await Promise.all([
        api.getBranches(storeId),
        api.getStockTransfers(storeId)
      ]);
      setBranches(branchesRes);
      setTransfers(transfersRes);
    } catch (error) {
      console.error("Error fetching stock transfer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBranchStock = async (branchId: number) => {
    try {
      setLoadingStock(true);
      setSelectedBranch(branchId);
      const stockRes = await api.getProducts(branchId);
      setBranchStock(stockRes);
    } catch (error) {
      console.error("Error checking branch stock:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch || transferItems.length === 0) return;

    try {
      await api.createStockTransfer({
        from_store_id: selectedBranch,
        to_store_id: storeId,
        items: transferItems
      }, storeId);
      setShowNewTransfer(false);
      setTransferItems([]);
      setSelectedBranch(null);
      fetchData();
      alert(lang === 'tr' ? "Transfer talebi oluşturuldu" : "Transfer request created");
    } catch (error) {
      alert(lang === 'tr' ? "Hata oluştu" : "An error occurred");
    }
  };

  const handleUpdateStatus = async (transferId: number, status: 'pending' | 'accepted' | 'preparing' | 'shipped' | 'completed' | 'cancelled') => {
    try {
      await api.updateStockTransferStatus(transferId, status, storeId);
      fetchData();
    } catch (error) {
      alert(lang === 'tr' ? "Hata oluştu" : "An error occurred");
    }
  };

  const handleDeleteTransfer = async (transferId: number) => {
    if (!window.confirm(lang === 'tr' ? "Bu transfer kaydını silmek istediğinize emin misiniz?" : "Are you sure you want to delete this transfer record?")) return;
    try {
      await api.deleteStockTransfer(transferId);
      fetchData();
    } catch (error) {
      alert(lang === 'tr' ? "Hata oluştu" : "An error occurred");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase"><Clock className="h-3 w-3 mr-1" /> {lang === 'tr' ? 'Talep Edildi' : 'Requested'}</span>;
      case 'accepted':
        return <span className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> {lang === 'tr' ? 'Kabul Edildi' : 'Accepted'}</span>;
      case 'preparing':
        return <span className="flex items-center text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase"><Package className="h-3 w-3 mr-1" /> {lang === 'tr' ? 'Hazırlanıyor' : 'Preparing'}</span>;
      case 'shipped':
        return <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase"><Truck className="h-3 w-3 mr-1" /> {lang === 'tr' ? 'Sevk Edildi' : 'Shipped'}</span>;
      case 'completed':
        return <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> {lang === 'tr' ? 'Tamamlandı' : 'Completed'}</span>;
      case 'cancelled':
        return <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase"><XCircle className="h-3 w-3 mr-1" /> {lang === 'tr' ? 'İptal Edildi' : 'Cancelled'}</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <ArrowLeftRight className="h-5 w-5 mr-2 text-indigo-600" />
            {lang === 'tr' ? 'Şubeler Arası Stok Transferi' : 'Inter-branch Stock Transfer'}
          </h2>
          <p className="text-sm text-gray-500">
            {lang === 'tr' ? 'Diğer şubelerden stok talep edin veya gönderin' : 'Request or send stock from/to other branches'}
          </p>
        </div>
        {!isViewer && (
          <button
            onClick={() => setShowNewTransfer(true)}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            {lang === 'tr' ? 'Yeni Transfer Talebi' : 'New Transfer Request'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branches List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
            <Store className="h-3.5 w-3.5 mr-1.5" />
            {lang === 'tr' ? 'Diğer Şubeler' : 'Other Branches'}
          </h3>
          <div className="space-y-2">
            {branches.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200">
                <p className="text-xs text-gray-500 italic">
                  {lang === 'tr' ? 'Kayıtlı başka şube bulunamadı.' : 'No other branches found.'}
                </p>
              </div>
            ) : (
              branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => handleCheckBranchStock(branch.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedBranch === branch.id 
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                      : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-gray-900">{branch.name}</span>
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${selectedBranch === branch.id ? 'rotate-90 text-indigo-500' : ''}`} />
                  </div>
                  <div className="flex items-center text-[10px] text-gray-500">
                    <MapPin className="h-3 w-3 mr-1" />
                    {branch.address || 'Adres belirtilmemiş'}
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedBranch && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3"
            >
              <h4 className="text-xs font-bold text-gray-900 flex items-center">
                <Package className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                {branches.find(b => b.id === selectedBranch)?.name} Stok Durumu
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={lang === 'tr' ? 'Ürün ara...' : 'Search product...'}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {loadingStock ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                  </div>
                ) : branchStock.filter(s => s.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                  <p className="text-[10px] text-gray-400 text-center py-2 italic">Ürün bulunamadı.</p>
                ) : (
                  branchStock
                    .filter(s => s.name.toLowerCase().includes(productSearch.toLowerCase()))
                    .map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900">{item.name}</span>
                          <span className="text-[9px] text-gray-400 font-mono">{item.barcode}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-bold ${item.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {item.stock_quantity} {item.unit || 'Adet'}
                          </span>
                          {item.stock_quantity > 0 && !isViewer && (
                            <button
                              onClick={() => {
                                if (!transferItems.find(i => i.product_id === item.id)) {
                                  setTransferItems([...transferItems, { ...item, product_id: item.id, quantity: 1 }]);
                                  setShowNewTransfer(true);
                                }
                              }}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Transfers History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
            <History className="h-3.5 w-3.5 mr-1.5" />
            {lang === 'tr' ? 'Transfer Geçmişi' : 'Transfer History'}
          </h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-bottom border-gray-100">
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Transfer Akışı</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ürünler</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Durum</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 italic">
                        Henüz bir transfer kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    transfers.map(transfer => {
                      const isIncoming = transfer.to_store_id === storeId;
                      return (
                        <tr key={transfer.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-gray-500">#{transfer.id}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-bold ${isIncoming ? 'text-gray-900' : 'text-indigo-600'}`}>
                                  {transfer.from_store_name}
                                </span>
                                <span className="text-[8px] text-gray-400 uppercase tracking-tighter">Kaynak</span>
                              </div>
                              <ArrowRight className={`h-3 w-3 ${isIncoming ? 'text-green-500' : 'text-blue-500'}`} />
                              <div className="flex flex-col items-start">
                                <span className={`text-[10px] font-bold ${isIncoming ? 'text-indigo-600' : 'text-gray-900'}`}>
                                  {transfer.to_store_name}
                                </span>
                                <span className="text-[8px] text-gray-400 uppercase tracking-tighter">Hedef</span>
                              </div>
                            </div>
                            <div className="mt-1 text-[9px] text-gray-400">
                              {new Date(transfer.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              {transfer.items?.slice(0, 2).map((item: any, idx: number) => (
                                <span key={idx} className="text-[10px] text-gray-600 truncate max-w-[150px]">
                                  {item.quantity}x {item.product_name}
                                </span>
                              ))}
                              {transfer.items?.length > 2 && (
                                <span className="text-[9px] text-indigo-500 font-medium">+{transfer.items.length - 2} daha...</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(transfer.status)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {/* Actions based on status and direction */}
                              {!isViewer && (
                                <>
                                  {/* Sender Actions */}
                                  {!isIncoming && (
                                    <>
                                      {transfer.status === 'pending' && (
                                        <button
                                          onClick={() => handleUpdateStatus(transfer.id, 'accepted')}
                                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                          title="Kabul Et"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </button>
                                      )}
                                      {transfer.status === 'accepted' && (
                                        <button
                                          onClick={() => handleUpdateStatus(transfer.id, 'preparing')}
                                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                          title="Hazırlanıyor"
                                        >
                                          <Package className="h-4 w-4" />
                                        </button>
                                      )}
                                      {transfer.status === 'preparing' && (
                                        <button
                                          onClick={() => handleUpdateStatus(transfer.id, 'shipped')}
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Sevk Et"
                                        >
                                          <Truck className="h-4 w-4" />
                                        </button>
                                      )}
                                    </>
                                  )}

                                  {/* Receiver Actions */}
                                  {isIncoming && transfer.status === 'shipped' && (
                                    <button
                                      onClick={() => handleUpdateStatus(transfer.id, 'completed')}
                                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                      title="Teslim Alındı (Stoklara İşle)"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </button>
                                  )}

                                  {/* General Actions */}
                                  {(transfer.status === 'pending' || transfer.status === 'accepted' || transfer.status === 'preparing') && (
                                    <button
                                      onClick={() => handleUpdateStatus(transfer.id, 'cancelled')}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="İptal Et"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  )}

                                  {(transfer.status === 'shipped' || transfer.status === 'completed') && (
                                    <button
                                      onClick={() => setShowDispatchNote(transfer)}
                                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                      title="Sevk İrsaliyesi"
                                    >
                                      <Printer className="h-4 w-4" />
                                    </button>
                                  )}

                                  {(transfer.status === 'completed' || transfer.status === 'cancelled') && (
                                    <button
                                      onClick={() => handleDeleteTransfer(transfer.id)}
                                      className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                      title="Sil"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Note Modal */}
      <AnimatePresence>
        {showDispatchNote && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-2xl max-w-3xl w-full relative max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:max-h-none print:rounded-none"
            >
              <button onClick={() => setShowDispatchNote(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 print:hidden"><XCircle className="h-5 w-5" /></button>
              
              <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
                <div>
                  <h1 className="text-2xl font-black text-indigo-600 tracking-tighter mb-1 uppercase">SEVK İRSALİYESİ</h1>
                  <p className="text-xs text-gray-400 font-mono">Transfer ID: #{showDispatchNote.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 uppercase">Tarih: {new Date(showDispatchNote.created_at).toLocaleDateString()}</div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase">Saat: {new Date(showDispatchNote.created_at).toLocaleTimeString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">GÖNDEREN MAĞAZA</h3>
                  <div className="text-sm font-bold text-slate-900">{showDispatchNote.from_store_name}</div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Hazırlayan: {showDispatchNote.prepared_by_email || 'Sistem'}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tight">Sevk Eden: {showDispatchNote.shipped_by_email || 'Sistem'}</div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">ALICI MAĞAZA</h3>
                  <div className="text-sm font-bold text-indigo-900">{showDispatchNote.to_store_name}</div>
                  <div className="text-[10px] text-indigo-500 mt-1 uppercase tracking-tight">Talep Eden: {showDispatchNote.created_by_email || 'Sistem'}</div>
                </div>
              </div>

              <div className="mb-8 overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Barkod</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase">Ürün Adı</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase text-right">Miktar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {showDispatchNote.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{item.barcode}</td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-900">{item.product_name}</td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-900 text-right">{item.quantity} Adet</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showDispatchNote.notes && (
                <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Notlar</h3>
                  <p className="text-xs text-amber-800 italic">{showDispatchNote.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-gray-200">
                <div className="text-center">
                  <div className="h-20 border-b border-gray-200 mb-2"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Teslim Eden İmza</p>
                </div>
                <div className="text-center">
                  <div className="h-20 border-b border-gray-200 mb-2"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Teslim Alan İmza</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Yazdır
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Transfer Modal */}
      <AnimatePresence>
        {showNewTransfer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
            >
              <button onClick={() => setShowNewTransfer(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
              <h2 className="text-xl font-bold mb-5 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-indigo-600" />
                {lang === 'tr' ? 'Yeni Transfer Talebi' : 'New Transfer Request'}
              </h2>

              <form onSubmit={handleCreateTransfer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Kaynak Şube</label>
                    <select
                      required
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                      value={selectedBranch || ""}
                      onChange={e => {
                        const branchId = Number(e.target.value);
                        setSelectedBranch(branchId);
                        handleCheckBranchStock(branchId);
                      }}
                    >
                      <option value="">Şube Seçin</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Hedef Mağaza</label>
                    <div className="p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium">
                      Bu Mağaza (Mevcut)
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Talep Edilen Ürünler</h3>
                    <div className="relative w-48">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ürün Ara..."
                        className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                      />
                      {productSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                          {branchStock
                            .filter(s => s.name.toLowerCase().includes(productSearch.toLowerCase()))
                            .map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  if (!transferItems.find(i => i.product_id === item.id)) {
                                    setTransferItems([...transferItems, { ...item, product_id: item.id, quantity: 1 }]);
                                  }
                                  setProductSearch("");
                                }}
                                className="w-full text-left p-2 hover:bg-gray-50 text-xs flex justify-between items-center"
                              >
                                <span>{item.name}</span>
                                <span className="text-indigo-600 font-bold">{item.stock_quantity}</span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100/50">
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase">Ürün</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase">Mevcut</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase w-24">Miktar</th>
                          <th className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transferItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-xs text-gray-400 italic">
                              Henüz ürün eklenmedi.
                            </td>
                          </tr>
                        ) : (
                          transferItems.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-gray-900">{item.name}</span>
                                  <span className="text-[9px] text-gray-400 font-mono">{item.barcode}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <span className="text-xs font-bold text-gray-500">{item.stock_quantity}</span>
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  max={item.stock_quantity}
                                  className="w-full p-1.5 bg-white border border-gray-200 rounded text-xs text-center"
                                  value={item.quantity}
                                  onChange={e => {
                                    const newItems = [...transferItems];
                                    newItems[idx].quantity = Math.min(Number(e.target.value), item.stock_quantity);
                                    setTransferItems(newItems);
                                  }}
                                />
                              </td>
                              <td className="px-4 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))}
                                  className="p-1 text-red-400 hover:text-red-600"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-top border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowNewTransfer(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedBranch || transferItems.length === 0}
                    className="flex-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Transfer Talebi Oluştur
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
