import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  X, Package, ArrowUpCircle, ArrowDownCircle, FileDown, FileText, 
  ExternalLink, Loader2, Receipt, Search, Filter, Printer, 
  TrendingUp, TrendingDown, Store, User, Hash, Calendar, Layers
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { translations } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';

import { PurchaseInvoiceDetailsModal } from './dashboard/invoices/purchase/PurchaseInvoiceDetailsModal';
import { SalesInvoiceDetailsModal } from './dashboard/invoices/sales/SalesInvoiceDetailsModal';
import { SalesInvoiceHtmlModal } from './dashboard/invoices/sales/SalesInvoiceHtmlModal';

interface Movement {
  id: number;
  type: 'in' | 'out';
  quantity: number;
  source: string;
  description: string;
  unit_price?: number;
  customer_info?: string;
  currency?: string;
  created_at: string;
  invoice_id?: number | null;
  invoice_type?: 'purchase' | 'sales' | null;
  invoice_number?: string | null;
  sale_id?: number | null;
}

interface ProductMovementModalProps {
  product: any;
  onClose: () => void;
  branding?: any;
  storeId?: any;
  isOpen?: boolean;
}

export const ProductMovementModal = ({ product, onClose, branding, storeId, isOpen }: ProductMovementModalProps) => {
  const { lang } = useLanguage();
  const isTr = lang === 'tr';
  const t = translations[lang]?.dashboard || {};
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'purchase' | 'sales' | 'pos' | 'other'>('all');

  // Invoice view states
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = useState<any>(null);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false);
  const [selectedSalesInvoice, setSelectedSalesInvoice] = useState<any>(null);
  const [showSalesDetails, setShowSalesDetails] = useState(false);

  // HTML e-invoice preview modal state
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);

  // Print ref for sales invoice
  const salesInvoiceRef = useRef<HTMLDivElement>(null);
  const handlePrintSales = useReactToPrint({ contentRef: salesInvoiceRef });

  // Print ref for whole movement statement (Ekstre)
  const statementPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintStatement = useReactToPrint({ contentRef: statementPrintRef });

  const defaultCurrency = product?.currency || branding?.default_currency || 'TRY';

  const fetchMovements = () => {
    setLoading(true);
    api.get(`/api/store/products/${product.id}/movements`)
      .then(data => {
        if (Array.isArray(data)) {
          setMovements(data);
        } else {
          console.error("Expected array but got:", data);
          setMovements([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (product?.id) {
      fetchMovements();
    }
  }, [product?.id]);

  const handleExport = async () => {
    try {
      setExporting(true);
      await api.download(
        `/api/store/products/${product.id}/movements/export?lang=${lang}`,
        `${isTr ? 'urun_ekstresi' : 'product_statement'}_${(product.name || 'product').replace(/\s+/g, '_')}.xlsx`
      );
    } catch (err) {
      console.error(err);
      toast.error(isTr ? 'Dışa aktarma başarısız oldu' : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getInvoiceDetailsFromMovement = (m: Movement) => {
    let type: 'purchase' | 'sales' | null = m.invoice_type || null;
    let number: string | null = m.invoice_number || null;
    const desc = m.description || '';

    if (!type) {
      if (m.source === 'purchase_invoice' || /alış faturası|fatura girişi|e-fatura içe|e-fatura detay/i.test(desc)) {
        type = 'purchase';
      } else if (m.source === 'sales_invoice' || /satış faturası/i.test(desc)) {
        type = 'sales';
      }
    }

    if (!number) {
      const match = desc.match(/(?:Faturası?|Girişi|Sorgulama|Aktarma|Güncellendi)?:\s*([A-Za-z0-9\-_]+)/i);
      if (match) {
        number = match[1].trim();
      }
    }

    const hasInvoice = Boolean(m.invoice_id || (type && number) || m.source === 'purchase_invoice' || m.source === 'sales_invoice');
    return { type, number, hasInvoice };
  };

  const handleViewPurchaseHtml = async (invoiceId: number) => {
    setHtmlLoading(true);
    setShowHtmlModal(true);
    try {
      const res = await api.getPurchaseInvoiceHtml(invoiceId, (product as any)?.store_id || branding?.id);
      if (res?.html) {
        setHtmlContent(res.html);
      } else {
        toast.error(isTr ? 'Fatura görseli bulunamadı.' : 'Invoice HTML not found.');
        setShowHtmlModal(false);
      }
    } catch (err: any) {
      toast.error(err.message || (isTr ? 'Görsel yüklenemedi' : 'Failed to load preview'));
      setShowHtmlModal(false);
    } finally {
      setHtmlLoading(false);
    }
  };

  const handleOpenInvoice = async (m: Movement) => {
    const { type, number } = getInvoiceDetailsFromMovement(m);
    if (!type && !m.invoice_id) return;

    setLoadingInvoiceId(m.id);
    try {
      if (type === 'purchase' || (!type && m.source === 'purchase_invoice')) {
        let inv: any = null;
        if (m.invoice_id) {
          try {
            inv = await api.getPurchaseInvoice(m.invoice_id);
          } catch (e) {
            console.warn("Direct purchase invoice fetch failed, trying search fallback", e);
          }
        }
        if ((!inv || inv.error || !inv.id) && number) {
          const list = await api.getPurchaseInvoices(undefined, number);
          if (Array.isArray(list) && list.length > 0) {
            const match = list.find((item: any) => item.invoice_number === number || item.document_number === number) || list[0];
            inv = await api.getPurchaseInvoice(match.id);
          }
        }

        if (inv && !inv.error && inv.id) {
          setSelectedPurchaseInvoice(inv);
          setShowPurchaseDetails(true);
        } else {
          toast.error(isTr ? 'Alış faturası bulunamadı.' : 'Purchase invoice not found.');
        }
      } else if (type === 'sales' || (!type && m.source === 'sales_invoice')) {
        let inv: any = null;
        if (m.invoice_id) {
          try {
            inv = await api.getSalesInvoice(m.invoice_id);
          } catch (e) {
            console.warn("Direct sales invoice fetch failed, trying search fallback", e);
          }
        }
        if ((!inv || inv.error || !inv.id) && number) {
          const list = await api.getSalesInvoices(undefined, number);
          if (Array.isArray(list) && list.length > 0) {
            const match = list.find((item: any) => item.invoice_number === number || item.document_number === number) || list[0];
            inv = await api.getSalesInvoice(match.id);
          }
        }

        if (inv && !inv.error && inv.id) {
          setSelectedSalesInvoice(inv);
          setShowSalesDetails(true);
        } else {
          toast.error(isTr ? 'Satış faturası bulunamadı.' : 'Sales invoice not found.');
        }
      }
    } catch (err: any) {
      console.error("Open invoice error:", err);
      toast.error(err.message || (isTr ? 'Fatura açılırken hata oluştu.' : 'Failed to load invoice.'));
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  // Calculations for summary stats
  const stats = useMemo(() => {
    let totalInQty = 0;
    let totalInAmount = 0;
    let totalOutQty = 0;
    let totalOutAmount = 0;
    let purchaseCount = 0;
    let salesCount = 0;
    let posCount = 0;
    let otherCount = 0;

    movements.forEach(m => {
      const qty = Number(m.quantity) || 0;
      const price = Number(m.unit_price) || 0;
      const amount = qty * price;

      if (m.type === 'in') {
        totalInQty += qty;
        totalInAmount += amount;
      } else {
        totalOutQty += qty;
        totalOutAmount += amount;
      }

      const isPurchase = m.source === 'purchase_invoice' || m.invoice_type === 'purchase' || m.source === 'purchase' || (m.type === 'in' && m.source !== 'initial_stock');
      const isSales = m.source === 'sales_invoice' || m.invoice_type === 'sales' || m.source === 'sales' || m.source === 'web_sale' || ['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti'].includes(m.source);
      const isPos = m.source === 'pos_sale' || m.source === 'pos';

      if (isPurchase) {
        purchaseCount++;
      } else if (isSales) {
        salesCount++;
      } else if (isPos) {
        posCount++;
      } else {
        otherCount++;
      }
    });

    const netStock = totalInQty - totalOutQty;

    return {
      totalInQty,
      totalInAmount,
      totalOutQty,
      totalOutAmount,
      netStock,
      purchaseCount,
      salesCount,
      posCount,
      otherCount,
      totalCount: movements.length
    };
  }, [movements]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const isPurchase = m.source === 'purchase_invoice' || m.invoice_type === 'purchase' || m.source === 'purchase' || (m.type === 'in' && m.source !== 'initial_stock');
      const isSales = m.source === 'sales_invoice' || m.invoice_type === 'sales' || m.source === 'sales' || m.source === 'web_sale' || ['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti'].includes(m.source);
      const isPos = m.source === 'pos_sale' || m.source === 'pos';

      // Type Filter
      if (selectedFilter === 'purchase') {
        if (!isPurchase) return false;
      } else if (selectedFilter === 'sales') {
        if (!isSales) return false;
      } else if (selectedFilter === 'pos') {
        if (!isPos) return false;
      } else if (selectedFilter === 'other') {
        if (isPurchase || isSales || isPos) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const desc = (m.description || '').toLowerCase();
        const cust = (m.customer_info || '').toLowerCase();
        const invNum = (m.invoice_number || '').toLowerCase();
        const src = (m.source || '').toLowerCase();
        if (!desc.includes(q) && !cust.includes(q) && !invNum.includes(q) && !src.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [movements, selectedFilter, searchQuery]);

  const formatCurrency = (val: number, cur = defaultCurrency) => {
    return `${Number(val || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
  };

  const formatSourceBadge = (source: string, type: string) => {
    switch (source) {
      case 'purchase_invoice':
      case 'purchase':
        return { label: isTr ? 'Alış Faturası' : 'Purchase Invoice', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'sales_invoice':
      case 'sales':
        return { label: isTr ? 'Satış Faturası' : 'Sales Invoice', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'pos_sale':
      case 'pos':
        return { label: isTr ? 'POS / Kasa Satışı' : 'POS Sale', color: 'bg-violet-100 text-violet-800 border-violet-200' };
      case 'web_sale':
        return { label: isTr ? 'E-Ticaret / Web Satışı' : 'Web Sale', color: 'bg-sky-100 text-sky-800 border-sky-200' };
      case 'initial_stock':
        return { label: isTr ? 'Açılış / Devir Stok' : 'Opening Stock', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'manual_adjustment':
        return { label: isTr ? 'Manuel Stok Sayım/Düzeltme' : 'Manual Adjustment', color: 'bg-slate-100 text-slate-800 border-slate-200' };
      default:
        if (['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti'].includes(source)) {
          return { label: `Pazaryeri (${source.toUpperCase()})`, color: 'bg-orange-100 text-orange-800 border-orange-200' };
        }
        return { 
          label: type === 'in' ? (isTr ? 'Stok Girişi' : 'Stock In') : (isTr ? 'Stok Çıkışı' : 'Stock Out'),
          color: type === 'in' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        };
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
          
          {/* HEADER */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black uppercase tracking-wide text-white">
                    {isTr ? 'Ürün Ekstresi & Hareket Takibi' : 'Product Statement & Movements'}
                  </h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    ID #{product.id}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                  <span className="font-bold text-white max-w-[280px] sm:max-w-md truncate">{product.name}</span>
                  {product.barcode && (
                    <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 text-[10px]">
                      {product.barcode}
                    </span>
                  )}
                  {product.product_code && (
                    <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 text-[10px]">
                      {product.product_code}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handlePrintStatement}
                disabled={movements.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-all text-xs font-bold border border-slate-700 disabled:opacity-40 cursor-pointer"
                title={isTr ? 'Yazdır / PDF Ekstre' : 'Print Statement'}
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">{isTr ? 'Yazdır' : 'Print'}</span>
              </button>

              <button 
                type="button"
                onClick={handleExport}
                disabled={exporting || movements.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-xs font-bold shadow-xs disabled:opacity-40 cursor-pointer"
                title={isTr ? 'Excel Olarak İndir' : 'Export Excel'}
              >
                <FileDown className="h-4 w-4" />
                <span>{exporting ? '...' : 'Excel'}</span>
              </button>

              <button 
                type="button"
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer ml-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* SUMMARY KPI CARDS */}
          <div className="p-4 bg-slate-50/90 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            {/* INCOMING / PURCHASES */}
            <div className="p-3 bg-white rounded-2xl border border-emerald-100 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  {isTr ? 'Toplam Giriş / Alış' : 'Total In / Purchases'}
                </div>
                <div className="text-lg font-black text-emerald-700">
                  +{stats.totalInQty} <span className="text-xs font-bold text-slate-600">{product.unit || 'Adet'}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500">
                  {formatCurrency(stats.totalInAmount)}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-xs">
                {stats.purchaseCount} {isTr ? 'fat' : 'inv'}
              </div>
            </div>

            {/* OUTGOING / SALES */}
            <div className="p-3 bg-white rounded-2xl border border-rose-100 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                  {isTr ? 'Toplam Çıkış / Satış' : 'Total Out / Sales'}
                </div>
                <div className="text-lg font-black text-rose-700">
                  -{stats.totalOutQty} <span className="text-xs font-bold text-slate-600">{product.unit || 'Adet'}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500">
                  {formatCurrency(stats.totalOutAmount)}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-black text-xs">
                {stats.salesCount + stats.posCount} {isTr ? 'işl' : 'tx'}
              </div>
            </div>

            {/* NET STOCK & BALANCE */}
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-indigo-600" />
                  {isTr ? 'Mevcut Stok Durumu' : 'Current Stock Balance'}
                </div>
                <div className="text-lg font-black text-indigo-950">
                  {product.stock_quantity ?? stats.netStock} <span className="text-xs font-bold text-indigo-700">{product.unit || 'Adet'}</span>
                </div>
                <div className="text-[11px] font-bold text-indigo-700">
                  {isTr ? 'Satış Fiyatı:' : 'Price:'} {formatCurrency(product.price)}
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                OK
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isTr ? 'Tüm Hareketler' : 'All Movements'} ({stats.totalCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('purchase')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'purchase'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {isTr ? 'Alış Faturaları' : 'Purchases'} ({stats.purchaseCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('sales')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'sales'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                {isTr ? 'Satış Faturaları' : 'Sales'} ({stats.salesCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('pos')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  selectedFilter === 'pos'
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'bg-violet-50 text-violet-800 hover:bg-violet-100'
                }`}
              >
                {isTr ? 'POS / Kasa' : 'POS'} ({stats.posCount})
              </button>
              {stats.otherCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter('other')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedFilter === 'other'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  {isTr ? 'Devir / Düzeltme' : 'Adjustment'} ({stats.otherCount})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTr ? 'Fatura no, cari veya açıklama ara...' : 'Search invoice, customer...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:ring-0 transition-all font-medium text-slate-900"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* MOVEMENTS LIST / TABLE */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2.5 bg-slate-50/50">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-500">
                  {isTr ? 'Ürün hareketleri ve fatura eşleşmeleri kontrol ediliyor...' : 'Checking product movements and invoice links...'}
                </div>
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-700">
                  {isTr ? 'Kayıtlı Hareket Bulunamadı' : 'No Movements Found'}
                </div>
                <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedFilter !== 'all'
                    ? (isTr ? 'Seçili filtrelere uygun hareket kaydı bulunamadı.' : 'No movements match the current filter.')
                    : (isTr ? 'Bu ürüne ait henüz alış faturası, satış veya stok devri kaydedilmemiştir.' : 'No invoices or sales recorded for this product yet.')}
                </div>
              </div>
            ) : (
              filteredMovements.map(m => {
                const { type: invType, number: invNumber, hasInvoice } = getInvoiceDetailsFromMovement(m);
                const badge = formatSourceBadge(m.source, m.type);
                const rowTotal = (Number(m.quantity) || 0) * (Number(m.unit_price) || 0);

                return (
                  <div 
                    key={m.id} 
                    className="p-3.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {m.type === 'in' ? (
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <ArrowUpCircle className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                          <ArrowDownCircle className="h-5 w-5" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wide ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {m.description}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {new Date(m.created_at).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')} {new Date(m.created_at).toLocaleTimeString(isTr ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {m.customer_info && (
                            <span className="flex items-center gap-1 text-slate-700 font-bold">
                              <User className="h-3 w-3 text-slate-400" />
                              {m.customer_info}
                            </span>
                          )}

                          {m.unit_price != null && Number(m.unit_price) > 0 && (
                            <span className="text-slate-600 font-medium">
                              {isTr ? 'Birim:' : 'Unit:'} <strong className="text-slate-900">{formatCurrency(m.unit_price, m.currency)}</strong>
                            </span>
                          )}

                          {rowTotal > 0 && (
                            <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded">
                              {isTr ? 'Tutar:' : 'Total:'} {formatCurrency(rowTotal, m.currency)}
                            </span>
                          )}
                        </div>

                        {/* Direct Invoice Action Buttons */}
                        {hasInvoice && (
                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenInvoice(m)}
                              disabled={loadingInvoiceId === m.id}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-2xs border cursor-pointer ${
                                invType === 'purchase'
                                  ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 hover:border-indigo-300'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300'
                              }`}
                              title={isTr ? 'Fatura detaylarını görüntüleyin' : 'View invoice details'}
                            >
                              {loadingInvoiceId === m.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
                              ) : (
                                <FileText className="h-3.5 w-3.5 text-current" />
                              )}
                              <span>
                                {invType === 'purchase'
                                  ? (isTr ? 'Alış Faturasını Aç' : 'Open Purchase Invoice')
                                  : (isTr ? 'Satış Faturasını Aç' : 'Open Sales Invoice')}
                                {invNumber ? ` (${invNumber})` : ''}
                              </span>
                              <ExternalLink className="h-3 w-3 opacity-60 ml-0.5" />
                            </button>

                            {/* View e-Invoice HTML if purchase invoice */}
                            {invType === 'purchase' && m.invoice_id && (
                              <button
                                type="button"
                                onClick={() => handleViewPurchaseHtml(m.invoice_id!)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
                                title={isTr ? 'Orijinal e-Fatura HTML görselini görüntüle' : 'View e-Invoice HTML'}
                              >
                                <Receipt className="h-3.5 w-3.5 text-slate-600" />
                                <span>{isTr ? 'e-Fatura Görseli' : 'e-Invoice HTML'}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                      <span className="text-[11px] text-slate-400 font-bold uppercase sm:hidden">
                        {isTr ? 'Miktar' : 'Quantity'}
                      </span>
                      <div className={`font-black text-base sm:text-lg tabular-nums ${
                        m.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {m.type === 'in' ? '+' : '-'}{Math.abs(Number(m.quantity))} <span className="text-xs font-bold text-slate-500">{product.unit || 'Adet'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="font-medium">
              {isTr ? 'Gösterilen Hareket:' : 'Shown Movements:'} <strong className="text-slate-900">{filteredMovements.length}</strong> / {movements.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-all cursor-pointer"
            >
              {isTr ? 'Kapat' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Printable Statement Document */}
      <div className="hidden">
        <div ref={statementPrintRef} className="p-8 bg-white text-slate-900 max-w-[210mm] mx-auto font-sans">
          <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider">{branding?.store_name || branding?.name || 'LOOKPRICE'}</h1>
              <h2 className="text-base font-bold text-slate-700 mt-1">{isTr ? 'ÜRÜN HAREKET EKSTRESİ' : 'PRODUCT MOVEMENT STATEMENT'}</h2>
              <p className="text-xs text-slate-500">{new Date().toLocaleString(isTr ? 'tr-TR' : 'en-US')}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-slate-900">{product.name}</div>
              <div className="text-xs font-mono text-slate-600">{product.barcode || ''} {product.product_code ? `| ${product.product_code}` : ''}</div>
              <div className="text-xs font-bold text-indigo-700 mt-1">{isTr ? 'Güncel Stok:' : 'Current Stock:'} {product.stock_quantity ?? stats.netStock} {product.unit || 'Adet'}</div>
            </div>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-800">
                <th className="py-2 px-2 font-bold">{isTr ? 'Tarih' : 'Date'}</th>
                <th className="py-2 px-2 font-bold">{isTr ? 'İşlem / Kaynak' : 'Type'}</th>
                <th className="py-2 px-2 font-bold">{isTr ? 'Açıklama & Cari' : 'Description'}</th>
                <th className="py-2 px-2 text-right font-bold">{isTr ? 'Birim Fiyat' : 'Price'}</th>
                <th className="py-2 px-2 text-right font-bold">{isTr ? 'Giriş (+)' : 'In (+)'}</th>
                <th className="py-2 px-2 text-right font-bold">{isTr ? 'Çıkış (-)' : 'Out (-)'}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-1.5 px-2 font-mono">{new Date(m.created_at).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}</td>
                  <td className="py-1.5 px-2 font-bold">{m.source}</td>
                  <td className="py-1.5 px-2">{m.description} {m.customer_info ? `(${m.customer_info})` : ''}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{m.unit_price ? formatCurrency(m.unit_price, m.currency) : '-'}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-emerald-700">{m.type === 'in' ? `+${m.quantity}` : '-'}</td>
                  <td className="py-1.5 px-2 text-right font-bold text-rose-700">{m.type === 'out' ? `-${m.quantity}` : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800 font-bold bg-slate-50">
                <td colSpan={4} className="py-2 px-2">{isTr ? 'TOPLAM' : 'TOTAL'}</td>
                <td className="py-2 px-2 text-right text-emerald-700 font-bold">+{stats.totalInQty}</td>
                <td className="py-2 px-2 text-right text-rose-700 font-bold">-{stats.totalOutQty}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Purchase Invoice Details Modal */}
      <PurchaseInvoiceDetailsModal 
        isOpen={showPurchaseDetails}
        onClose={() => setShowPurchaseDetails(false)}
        invoice={selectedPurchaseInvoice}
        isTr={isTr}
        handleViewHtml={handleViewPurchaseHtml}
      />

      {/* Sales Invoice Details Modal */}
      <SalesInvoiceDetailsModal 
        isOpen={showSalesDetails}
        onClose={() => setShowSalesDetails(false)}
        invoice={selectedSalesInvoice}
        isTr={isTr}
        invoiceRef={salesInvoiceRef}
        handlePrint={handlePrintSales}
      />

      {/* E-Invoice HTML Preview Modal */}
      <SalesInvoiceHtmlModal 
        isOpen={showHtmlModal}
        onClose={() => setShowHtmlModal(false)}
        htmlContent={htmlContent}
        htmlLoading={htmlLoading}
        isTr={isTr}
      />
    </>
  );
};

export default ProductMovementModal;
