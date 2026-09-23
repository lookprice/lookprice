import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  ChevronRight,
  MapPin,
  Printer,
  History,
  Send,
  Download,
  Filter,
  Check,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  Barcode
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
  includeBranches?: boolean;
  onUpdate?: () => void;
  branding?: any;
}

export default function StockTransferTab({ storeId, products, isViewer, includeBranches = true, onUpdate, branding }: StockTransferTabProps) {
  const { lang } = useLanguage();
  const t = translations[lang]?.dashboard || translations.tr.dashboard;

  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  
  // Modal state
  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [transferMode, setTransferMode] = useState<'shipment' | 'request'>('shipment'); // shipment: Send out, request: Pull in
  
  // Store selection for transfer
  const [sourceStoreId, setSourceStoreId] = useState<number>(storeId);
  const [targetStoreId, setTargetStoreId] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Source store inventory loading for transfer modal
  const [sourceProducts, setSourceProducts] = useState<any[]>([]);
  const [loadingSourceProducts, setLoadingSourceProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [transferItems, setTransferItems] = useState<any[]>([]);

  // Filtering & Pagination for history table
  const [historyFilter, setHistoryFilter] = useState<'all' | 'outgoing' | 'incoming' | 'pending'>('all');
  const [searchHistory, setSearchHistory] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Selected Branch for Stock Inspection Panel
  const [inspectedBranchId, setInspectedBranchId] = useState<number | null>(null);
  const [inspectedBranchStock, setInspectedBranchStock] = useState<any[]>([]);
  const [loadingInspectedStock, setLoadingInspectedStock] = useState(false);
  const [inspectedSearch, setInspectedSearch] = useState('');

  // Dispatch note modal
  const [showDispatchNote, setShowDispatchNote] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [storeId, includeBranches]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [branchesRes, transfersRes, brandingRes] = await Promise.all([
        api.getBranches(storeId),
        api.getStockTransfers(storeId, true),
        api.getBranding(storeId)
      ]);

      const branchesList = Array.isArray(branchesRes) ? branchesRes : [];
      setBranches(branchesList);

      // Build full store family list (Current Store + Branches)
      const currentStoreObj = {
        id: storeId,
        name: brandingRes?.store_name || brandingRes?.name || (lang === 'tr' ? 'Ana Mağaza / Merkez' : 'Main Store'),
        address: brandingRes?.address || '',
        is_main: true
      };

      const fullList = [currentStoreObj, ...branchesList.map(b => ({ ...b, is_main: false }))];
      setAllStores(fullList);

      // Default target store to first available branch if present
      if (branchesList.length > 0) {
        setTargetStoreId(branchesList[0].id);
        if (!inspectedBranchId) {
          setInspectedBranchId(branchesList[0].id);
          fetchBranchStock(branchesList[0].id);
        }
      }

      setTransfers(Array.isArray(transfersRes) ? transfersRes : []);
    } catch (error) {
      console.error("Error fetching stock transfer data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load products for the selected Source Store in transfer modal
  const fetchSourceStoreProducts = async (srcId: number) => {
    if (!srcId) return;
    try {
      setLoadingSourceProducts(true);
      if (srcId === storeId && products.length > 0) {
        setSourceProducts(products);
      } else {
        const res = await api.getProducts("", srcId);
        setSourceProducts(Array.isArray(res) ? res : []);
      }
    } catch (error) {
      console.error("Error loading source store products:", error);
    } finally {
      setLoadingSourceProducts(false);
    }
  };

  // Load products for side inspection panel
  const fetchBranchStock = async (bId: number) => {
    try {
      setLoadingInspectedStock(true);
      setInspectedBranchId(bId);
      const stockRes = await api.getProducts("", bId);
      setInspectedBranchStock(Array.isArray(stockRes) ? stockRes : []);
    } catch (error) {
      console.error("Error fetching branch stock:", error);
    } finally {
      setLoadingInspectedStock(false);
    }
  };

  // Switch mode inside transfer modal
  const handleToggleMode = (mode: 'shipment' | 'request') => {
    setTransferMode(mode);
    setTransferItems([]);
    if (mode === 'shipment') {
      // Direct shipment: Source = Current Store, Target = First Branch
      setSourceStoreId(storeId);
      fetchSourceStoreProducts(storeId);
      if (branches.length > 0) {
        setTargetStoreId(branches[0].id);
      }
    } else {
      // Stock request: Source = First Branch, Target = Current Store
      if (branches.length > 0) {
        setSourceStoreId(branches[0].id);
        fetchSourceStoreProducts(branches[0].id);
      }
      setTargetStoreId(storeId);
    }
  };

  // Handle source store dropdown change in modal
  const handleSourceStoreChange = (newSourceId: number) => {
    setSourceStoreId(newSourceId);
    setTransferItems([]);
    fetchSourceStoreProducts(newSourceId);
    if (targetStoreId === newSourceId) {
      const remaining = allStores.find(s => s.id !== newSourceId);
      if (remaining) setTargetStoreId(remaining.id);
    }
  };

  // Open transfer modal with defaults
  const handleOpenTransferModal = (mode: 'shipment' | 'request', presetBranchId?: number) => {
    setTransferMode(mode);
    setTransferItems([]);
    setNotes('');
    setProductSearch('');

    if (mode === 'shipment') {
      setSourceStoreId(storeId);
      fetchSourceStoreProducts(storeId);
      const target = presetBranchId || (branches.length > 0 ? branches[0].id : 0);
      setTargetStoreId(target);
    } else {
      const source = presetBranchId || (branches.length > 0 ? branches[0].id : 0);
      setSourceStoreId(source);
      fetchSourceStoreProducts(source);
      setTargetStoreId(storeId);
    }

    setShowNewTransferModal(true);
  };

  // Add item to transfer table
  const handleAddProductToTransfer = (prod: any) => {
    const existing = transferItems.find(i => i.product_id === prod.id || (i.barcode && i.barcode === prod.barcode));
    if (existing) {
      setTransferItems(transferItems.map(i => {
        if (i.product_id === prod.id || (i.barcode && i.barcode === prod.barcode)) {
          const maxAvail = Math.floor(Number(prod.stock_quantity || 99999));
          const newQty = Math.min(i.quantity + 1, maxAvail > 0 ? maxAvail : 99999);
          return { ...i, quantity: newQty };
        }
        return i;
      }));
    } else {
      setTransferItems([
        ...transferItems,
        {
          product_id: prod.id,
          barcode: prod.barcode || '',
          product_name: prod.name,
          quantity: 1,
          stock_quantity: prod.stock_quantity || 0,
          product_type: prod.product_type || 'product'
        }
      ]);
    }
    setProductSearch('');
  };

  // Submit transfer
  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceStoreId || !targetStoreId || transferItems.length === 0) {
      alert(lang === 'tr' ? "Lütfen mağazaları seçin ve en az 1 ürün ekleyin." : "Please select stores and add at least 1 product.");
      return;
    }

    if (sourceStoreId === targetStoreId) {
      alert(lang === 'tr' ? "Çıkış ve varış mağazası aynı olamaz." : "Source and target store cannot be the same.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        from_store_id: sourceStoreId,
        to_store_id: targetStoreId,
        notes,
        status: transferMode === 'shipment' ? 'shipped' : 'pending',
        items: transferItems
      };

      const res = await api.createStockTransfer(payload, storeId);

      if (res.error) {
        alert(res.error);
        return;
      }

      setShowNewTransferModal(false);
      setTransferItems([]);
      fetchInitialData();
      if (onUpdate) onUpdate();

      const msg = transferMode === 'shipment' 
        ? (lang === 'tr' ? "🚀 Sevkiyat başarıyla başlatıldı ve stoklar güncellendi!" : "Shipment created and stock updated!")
        : (lang === 'tr' ? "📋 Transfer talebi gönderildi, onay bekleniyor." : "Transfer request sent, pending approval.");
      alert(msg);
    } catch (error) {
      console.error("Transfer error:", error);
      alert(lang === 'tr' ? "İşlem sırasında bir hata oluştu." : "An error occurred during transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (transferId: number, newStatus: string) => {
    try {
      const res = await api.updateStockTransferStatus(transferId, newStatus, storeId, lang);
      if (res.error) {
        alert(res.error);
        return;
      }
      fetchInitialData();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(lang === 'tr' ? "Durum güncellenirken hata oluştu." : "Error updating status.");
    }
  };

  // Delete transfer
  const handleDeleteTransfer = async (transferId: number) => {
    if (!window.confirm(lang === 'tr' ? "Bu transfer kaydını silmek istediğinize emin misiniz?" : "Delete this transfer record?")) return;
    try {
      const res = await api.deleteStockTransfer(transferId, storeId);
      if (res.error) {
        alert(res.error);
        return;
      }
      fetchInitialData();
      if (onUpdate) onUpdate();
    } catch (error) {
      alert(lang === 'tr' ? "Silme işlemi sırasında hata oluştu." : "Error deleting record.");
    }
  };

  // Filter transfers for display
  const filteredTransfers = useMemo(() => {
    return transfers.filter(tItem => {
      const isOutgoing = Number(tItem.from_store_id) === Number(storeId);
      const isIncoming = Number(tItem.to_store_id) === Number(storeId);

      if (historyFilter === 'outgoing' && !isOutgoing) return false;
      if (historyFilter === 'incoming' && !isIncoming) return false;
      if (historyFilter === 'pending' && tItem.status !== 'pending' && tItem.status !== 'preparing') return false;

      if (searchHistory.trim()) {
        const query = searchHistory.toLowerCase();
        const matchesId = String(tItem.id).includes(query);
        const matchesFrom = tItem.from_store_name?.toLowerCase().includes(query);
        const matchesTo = tItem.to_store_name?.toLowerCase().includes(query);
        const matchesItems = tItem.items?.some((i: any) => i.product_name?.toLowerCase().includes(query) || i.barcode?.toLowerCase().includes(query));
        return matchesId || matchesFrom || matchesTo || matchesItems;
      }

      return true;
    });
  }, [transfers, storeId, historyFilter, searchHistory]);

  const paginatedTransfers = useMemo(() => {
    return filteredTransfers.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  }, [filteredTransfers, page]);

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
            <Clock className="h-3 w-3 text-amber-500" />
            {lang === 'tr' ? 'Talep Edildi' : 'Requested'}
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
            <CheckCircle2 className="h-3 w-3 text-indigo-500" />
            {lang === 'tr' ? 'Kabul Edildi' : 'Accepted'}
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
            <Package className="h-3 w-3 text-purple-500" />
            {lang === 'tr' ? 'Hazırlanıyor' : 'Preparing'}
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
            <Truck className="h-3 w-3 text-blue-500" />
            {lang === 'tr' ? 'Sevk Edildi / Yolda' : 'Shipped'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {lang === 'tr' ? 'Tamamlandı' : 'Completed'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">
            <XCircle className="h-3 w-3 text-red-500" />
            {lang === 'tr' ? 'İptal Edildi' : 'Cancelled'}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50/50 rounded-2xl border border-slate-200/80">
        <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* High-Density Header Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {lang === 'tr' ? 'Şubeler Arası Stok Transferi & Sevkiyat' : 'Inter-Branch Stock Transfers & Shipments'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                {allStores.length} {lang === 'tr' ? 'Lokasyon' : 'Locations'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'tr' ? 'Ana mağaza ve şubeler arasında çift taraflı ürün sevk edin veya stok talep edin.' : 'Ship items directly or request stock bi-directionally across stores.'}
            </p>
          </div>
        </div>

        {!isViewer && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenTransferModal('request')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 border border-slate-200"
            >
              <ArrowDownLeft className="h-3.5 w-3.5 text-indigo-600" />
              <span>{lang === 'tr' ? 'Stok Talebi İsteyin' : 'Request Stock'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenTransferModal('shipment')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{lang === 'tr' ? 'Doğrudan Sevkiyat Yap' : 'Direct Ship Items'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Left Branch Quick Inspection & Right Transfer History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Branch Locations & Stock Inspector */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-indigo-600" />
                {lang === 'tr' ? 'Şube & Lokasyonlar' : 'Branch Locations'}
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">#{allStores.length}</span>
            </div>

            <div className="space-y-1.5">
              {allStores.map(st => {
                const isCurrent = st.id === storeId;
                const isInspected = inspectedBranchId === st.id;

                return (
                  <div
                    key={st.id}
                    onClick={() => {
                      if (!isCurrent) {
                        setInspectedBranchId(st.id);
                        fetchBranchStock(st.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isCurrent
                        ? 'bg-indigo-50/50 border-indigo-200/80 text-indigo-900'
                        : isInspected
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                          st.is_main ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {st.is_main ? <Building2 className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold truncate max-w-[150px]">{st.name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {st.is_main ? (lang === 'tr' ? 'Ana Merkez / Yönetim' : 'Main Center') : (st.address || 'Şube Lokasyonu')}
                          </div>
                        </div>
                      </div>

                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTransferModal('shipment', st.id);
                          }}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1 shrink-0"
                          title={lang === 'tr' ? 'Bu şubeye sevkiyat yap' : 'Ship to branch'}
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>{lang === 'tr' ? 'Sevk Et' : 'Ship'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inspected Branch Stock Quick Panel */}
          {inspectedBranchId && inspectedBranchId !== storeId && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                    {allStores.find(s => s.id === inspectedBranchId)?.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {inspectedBranchStock.length} {lang === 'tr' ? 'Ürün' : 'Products'}
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'tr' ? 'Şube stoklarında ara...' : 'Search branch stock...'}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                  value={inspectedSearch}
                  onChange={e => setInspectedSearch(e.target.value)}
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {loadingInspectedStock ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                  </div>
                ) : inspectedBranchStock.filter(s => {
                  if (!inspectedSearch.trim()) return true;
                  const q = inspectedSearch.toLowerCase();
                  return s.name?.toLowerCase().includes(q) || s.barcode?.toLowerCase().includes(q);
                }).length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4 italic">{lang === 'tr' ? 'Ürün bulunamadı.' : 'No products found.'}</p>
                ) : (
                  inspectedBranchStock
                    .filter(s => {
                      if (!inspectedSearch.trim()) return true;
                      const q = inspectedSearch.toLowerCase();
                      return s.name?.toLowerCase().includes(q) || s.barcode?.toLowerCase().includes(q);
                    })
                    .slice(0, 30)
                    .map(item => (
                      <div key={item.id} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded-lg text-xs group">
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-semibold text-slate-800 truncate">{item.name}</div>
                          <div className="text-[9px] text-slate-400 font-mono truncate">{item.barcode || '-'}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold ${Number(item.stock_quantity) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {Math.floor(Number(item.stock_quantity))} {item.unit || 'Adet'}
                          </span>
                          {!isViewer && (
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenTransferModal('request', inspectedBranchId);
                                handleAddProductToTransfer(item);
                              }}
                              className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title={lang === 'tr' ? 'Bu ürünü stok talebine ekle' : 'Request this product'}
                            >
                              <Plus className="h-3.5 w-3.5" />
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

        {/* Right Column: Transfer & Shipment History Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            {/* Table Filters Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => { setHistoryFilter('all'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    historyFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {lang === 'tr' ? 'Tüm Transferler' : 'All Transfers'} ({transfers.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setHistoryFilter('outgoing'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    historyFilter === 'outgoing' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  {lang === 'tr' ? 'Giden Sevkiyatlar' : 'Outgoing'}
                </button>
                <button
                  type="button"
                  onClick={() => { setHistoryFilter('incoming'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    historyFilter === 'incoming' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3" />
                  {lang === 'tr' ? 'Gelen Talepler' : 'Incoming'}
                </button>
                <button
                  type="button"
                  onClick={() => { setHistoryFilter('pending'); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    historyFilter === 'pending' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {lang === 'tr' ? 'Bekleyenler' : 'Pending'}
                </button>
              </div>

              <div className="relative sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'tr' ? 'Transfer ara...' : 'Search transfer...'}
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  value={searchHistory}
                  onChange={e => { setSearchHistory(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">{lang === 'tr' ? 'Çıkış ➔ Varış' : 'From ➔ To'}</th>
                    <th className="px-3 py-2">{lang === 'tr' ? 'İçerik / Kalem' : 'Items'}</th>
                    <th className="px-3 py-2">{lang === 'tr' ? 'Durum' : 'Status'}</th>
                    <th className="px-3 py-2 text-right">{lang === 'tr' ? 'İşlemler' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400 italic">
                        {lang === 'tr' ? 'Kriterlere uygun transfer veya sevkiyat kaydı bulunamadı.' : 'No transfer records found.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedTransfers.map(tItem => {
                      const isSender = Number(tItem.from_store_id) === Number(storeId);
                      const isReceiver = Number(tItem.to_store_id) === Number(storeId);
                      const totalQty = tItem.items?.reduce((acc: number, i: any) => acc + Number(i.quantity || 0), 0) || 0;

                      return (
                        <tr key={tItem.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3 py-2 font-mono text-[11px] font-bold text-slate-600">
                            #{tItem.id}
                            <div className="text-[9px] text-slate-400 font-normal">
                              {new Date(tItem.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                isSender ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {tItem.from_store_name}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                isReceiver ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {tItem.to_store_name}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-800 truncate max-w-[160px]">
                              {tItem.items?.[0]?.product_name || 'Ürün'}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {tItem.items?.length || 0} {lang === 'tr' ? 'Kalem' : 'items'} ({totalQty} {lang === 'tr' ? 'Adet' : 'pcs'})
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            {getStatusBadge(tItem.status)}
                          </td>

                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!isViewer && (
                                <>
                                  {/* Receiver Complete Action */}
                                  {isReceiver && tItem.status === 'shipped' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(tItem.id, 'completed')}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1"
                                      title={lang === 'tr' ? 'Teslim Al ve Stoğa İşle' : 'Complete Transfer'}
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>{lang === 'tr' ? 'Teslim Al & Stoğa İşle' : 'Receive Stock'}</span>
                                    </button>
                                  )}

                                  {/* Sender Accept & Ship Actions */}
                                  {isSender && tItem.status === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(tItem.id, 'accepted')}
                                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                      {lang === 'tr' ? 'Kabul Et' : 'Accept'}
                                    </button>
                                  )}

                                  {isSender && (tItem.status === 'accepted' || tItem.status === 'preparing') && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(tItem.id, 'shipped')}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1"
                                    >
                                      <Truck className="w-3 h-3" />
                                      <span>{lang === 'tr' ? 'Sevk Et' : 'Ship Out'}</span>
                                    </button>
                                  )}

                                  {/* Cancel Transfer */}
                                  {(tItem.status === 'pending' || tItem.status === 'accepted' || tItem.status === 'preparing') && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(tItem.id, 'cancelled')}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title={lang === 'tr' ? 'İptal Et' : 'Cancel'}
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Print Dispatch Note */}
                              {(tItem.status === 'shipped' || tItem.status === 'completed') && (
                                <button
                                  type="button"
                                  onClick={() => setShowDispatchNote(tItem)}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                  title={lang === 'tr' ? 'Sevk İrsaliyesi Bas' : 'Print Note'}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Record */}
                              {(tItem.status === 'completed' || tItem.status === 'cancelled') && !isViewer && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTransfer(tItem.id)}
                                  className="p-1 text-slate-300 hover:text-red-500 rounded transition-colors"
                                  title={lang === 'tr' ? 'Kaydı Sil' : 'Delete'}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
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

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {filteredTransfers.length} {lang === 'tr' ? 'kayıt' : 'records'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40"
                  >
                    {lang === 'tr' ? 'Önceki' : 'Prev'}
                  </button>
                  <span className="font-bold text-slate-600 px-1">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40"
                  >
                    {lang === 'tr' ? 'Sonraki' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Transfer & Shipment Modal */}
      <AnimatePresence>
        {showNewTransferModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-5 relative shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col"
            >
              <button
                type="button"
                onClick={() => setShowNewTransferModal(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>

              <div className="mb-4">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  {transferMode === 'shipment' ? (
                    <>
                      <Send className="h-4 w-4 text-indigo-600" />
                      <span>{lang === 'tr' ? 'Doğrudan Sevkiyat Yap (Şubeye Ürün Gönder)' : 'Direct Shipment (Send Products)'}</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                      <span>{lang === 'tr' ? 'Stok Talebi Oluştur (Şubeden Ürün İste)' : 'Create Stock Request (Pull Stock)'}</span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {transferMode === 'shipment'
                    ? (lang === 'tr' ? 'Çıkış mağazasının envanterinden seçip doğrudan hedef şubeye sevk edin.' : 'Ship items directly from source store inventory.')
                    : (lang === 'tr' ? 'Şubenin envanterindeki ürünlerden seçip mağazanıza transfer talebi oluşturun.' : 'Request items from branch inventory to your store.')}
                </p>
              </div>

              {/* Mode Segmented Control */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleToggleMode('shipment')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    transferMode === 'shipment'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{lang === 'tr' ? '🚀 Doğrudan Sevkiyat Yap' : 'Direct Ship'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode('request')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    transferMode === 'request'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'tr' ? '📋 Stok Talebi Oluştur' : 'Stock Request'}</span>
                </button>
              </div>

              <form onSubmit={handleSubmitTransfer} className="flex-1 flex flex-col justify-between overflow-hidden space-y-4">
                {/* Store Selectors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {lang === 'tr' ? 'Çıkış Mağazası (Kaynak)' : 'Source Store'}
                    </label>
                    <select
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      value={sourceStoreId}
                      onChange={e => handleSourceStoreChange(Number(e.target.value))}
                    >
                      {allStores.map(st => (
                        <option key={st.id} value={st.id}>
                          {st.name} {st.is_main ? (lang === 'tr' ? '(Merkez)' : '(Main)') : '(Şube)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {lang === 'tr' ? 'Varış Mağazası (Hedef)' : 'Target Store'}
                    </label>
                    <select
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      value={targetStoreId}
                      onChange={e => setTargetStoreId(Number(e.target.value))}
                    >
                      {allStores.filter(st => st.id !== sourceStoreId).map(st => (
                        <option key={st.id} value={st.id}>
                          {st.name} {st.is_main ? (lang === 'tr' ? '(Merkez)' : '(Main)') : '(Şube)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product Search & Picker */}
                <div className="space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                      {lang === 'tr' ? 'Çıkış Mağazası Envanterinden Ürün Ekle' : 'Add Products from Source Store'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {loadingSourceProducts ? (lang === 'tr' ? 'Yükleniyor...' : 'Loading...') : `${sourceProducts.length} ${lang === 'tr' ? 'ürün mevcut' : 'available'}`}
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={lang === 'tr' ? 'Ürün adı veya barkod ile canlı arayın...' : 'Search product name or barcode...'}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-1 focus:ring-indigo-500"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                    />

                    {/* Live Search Autocomplete Dropdown */}
                    {productSearch.trim() && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {sourceProducts.filter(p => {
                          const q = productSearch.toLowerCase();
                          return p.name?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q);
                        }).length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center italic">{lang === 'tr' ? 'Ürün bulunamadı.' : 'No products found.'}</div>
                        ) : (
                          sourceProducts.filter(p => {
                            const q = productSearch.toLowerCase();
                            return p.name?.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q);
                          }).slice(0, 15).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleAddProductToTransfer(p)}
                              className="w-full text-left p-2 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-bold text-slate-800 truncate">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{p.barcode || '-'}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                Number(p.stock_quantity) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {Math.floor(Number(p.stock_quantity))} {p.unit || 'Adet'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Items Table */}
                <div className="flex-1 overflow-y-auto max-h-52 border border-slate-200 rounded-xl bg-slate-50/50">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase">
                        <th className="px-3 py-1.5">{lang === 'tr' ? 'Ürün' : 'Product'}</th>
                        <th className="px-3 py-1.5">{lang === 'tr' ? 'Mevcut' : 'Stock'}</th>
                        <th className="px-3 py-1.5 w-28">{lang === 'tr' ? 'Transfer Miktarı' : 'Qty'}</th>
                        <th className="px-3 py-1.5 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transferItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400 italic">
                            {lang === 'tr' ? 'Henüz transfer listesine ürün eklenmedi. Yukarıdan ürün arayıp ekleyin.' : 'No products added yet.'}
                          </td>
                        </tr>
                      ) : (
                        transferItems.map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-3 py-2">
                              <div className="font-bold text-slate-800 truncate max-w-[180px]">{item.product_name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{item.barcode || '-'}</div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-bold text-slate-600">{Math.floor(Number(item.stock_quantity))}</span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.max(1, item.quantity - 1);
                                    setTransferItems(transferItems.map((i, index) => index === idx ? { ...i, quantity: newQty } : i));
                                  }}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  max={Math.floor(Number(item.stock_quantity || 99999))}
                                  value={item.quantity}
                                  onChange={e => {
                                    const val = Math.max(1, Math.floor(Number(e.target.value)));
                                    setTransferItems(transferItems.map((i, index) => index === idx ? { ...i, quantity: val } : i));
                                  }}
                                  className="w-12 py-0.5 text-center bg-white border border-slate-200 rounded font-bold text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = item.quantity + 1;
                                    setTransferItems(transferItems.map((i, index) => index === idx ? { ...i, quantity: newQty } : i));
                                  }}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Notes Input */}
                <div className="shrink-0">
                  <input
                    type="text"
                    placeholder={lang === 'tr' ? 'Transfer notu / Açıklama (opsiyonel)...' : 'Notes (optional)...'}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowNewTransferModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  >
                    {lang === 'tr' ? 'Vazgeç' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || transferItems.length === 0}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {transferMode === 'shipment'
                            ? (lang === 'tr' ? 'Sevkiyatı Başlat ve Yola Çıkar (Stok Düş)' : 'Ship Out & Deduct Stock')
                            : (lang === 'tr' ? 'Transfer Talebini Gönder (Onay Beklesin)' : 'Send Transfer Request')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dispatch Note Printable Modal */}
      <AnimatePresence>
        {showDispatchNote && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 print:p-0 print:bg-white">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-2xl max-w-2xl w-full relative shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-0"
            >
              <button
                type="button"
                onClick={() => setShowDispatchNote(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 print:hidden"
              >
                <XCircle className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h1 className="text-lg font-black text-indigo-600 tracking-tight uppercase">
                    {lang === 'tr' ? 'SEVK İRSALİYESİ / TRANSFER BELGESİ' : 'STOCK DISPATCH NOTE'}
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono">ID: #{showDispatchNote.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">
                    {new Date(showDispatchNote.created_at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(showDispatchNote.created_at).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    {lang === 'tr' ? 'GÖNDEREN MAĞAZA' : 'SENDER STORE'}
                  </span>
                  <div className="font-extrabold text-slate-900">{showDispatchNote.from_store_name}</div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {lang === 'tr' ? 'Düzenleyen' : 'Issued by'}: {showDispatchNote.created_by_email || 'Sistem'}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                  <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-widest block mb-1">
                    {lang === 'tr' ? 'ALICI MAĞAZA' : 'RECEIVER STORE'}
                  </span>
                  <div className="font-extrabold text-indigo-950">{showDispatchNote.to_store_name}</div>
                  <div className="text-[10px] text-indigo-700 mt-1">
                    {lang === 'tr' ? 'Teslim Alacak' : 'Receiver'}: {showDispatchNote.to_store_name}
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-[10px] font-extrabold text-slate-500 uppercase">
                      <th className="px-3 py-2">{lang === 'tr' ? 'Barkod' : 'Barcode'}</th>
                      <th className="px-3 py-2">{lang === 'tr' ? 'Ürün Adı' : 'Product Name'}</th>
                      <th className="px-3 py-2 text-right">{lang === 'tr' ? 'Miktar' : 'Quantity'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {showDispatchNote.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-mono text-[10px] text-slate-500">{item.barcode || '-'}</td>
                        <td className="px-3 py-2 font-bold text-slate-900">{item.product_name}</td>
                        <td className="px-3 py-2 font-bold text-slate-900 text-right">
                          {Math.floor(Number(item.quantity))} {lang === 'tr' ? 'Adet' : 'pcs'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showDispatchNote.notes && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 mb-4">
                  <span className="font-bold">{lang === 'tr' ? 'Not' : 'Notes'}:</span> {showDispatchNote.notes}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-slate-200 text-center text-xs">
                <div>
                  <div className="h-10 border-b border-slate-200 mb-1"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'tr' ? 'Teslim Eden İmza' : 'Sender Signature'}</span>
                </div>
                <div>
                  <div className="h-10 border-b border-slate-200 mb-1"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'tr' ? 'Teslim Alan İmza' : 'Receiver Signature'}</span>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'tr' ? 'Yazdır' : 'Print'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
