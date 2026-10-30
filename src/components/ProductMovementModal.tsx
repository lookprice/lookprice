import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  X, Package, ArrowUpCircle, ArrowDownCircle, FileDown, FileText, 
  ExternalLink, Loader2, Receipt, Search, Filter, Printer, 
  TrendingUp, TrendingDown, Store, User, Hash, Calendar, Layers,
  RotateCcw, Scale, CheckCircle2, AlertCircle, Info, ArrowRight, Edit2
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'sonner';
import { translations } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatDateTR, formatDateTimeTR } from '../utils/formatUtils';

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
  reference_movement_id?: number | null;
}

interface ProductMovementModalProps {
  product: any;
  onClose: () => void;
  branding?: any;
  storeId?: any;
  isOpen?: boolean;
  onStockUpdated?: (newStock: number) => void;
}

export const ProductMovementModal = ({ product, onClose, branding, storeId, isOpen, onStockUpdated }: ProductMovementModalProps) => {
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

  // Correction / Reversal modal states (Scenario 2 - Accounting Reversal)
  const [correctingMovement, setCorrectingMovement] = useState<Movement | null>(null);
  const [correctionType, setCorrectionType] = useState<'full_reversal' | 'partial_difference'>('full_reversal');
  const [targetQuantity, setTargetQuantity] = useState<string>('');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [submittingCorrection, setSubmittingCorrection] = useState<boolean>(false);

  const defaultCurrency = product?.currency || branding?.default_currency || 'TRY';

  const handleConfirmCorrection = async () => {
    if (!correctingMovement) return;
    setSubmittingCorrection(true);
    try {
      const res = await api.post(`/api/store/products/${product.id}/movements/correction`, {
        movement_id: correctingMovement.id,
        correction_type: correctionType,
        target_quantity: correctionType === 'partial_difference' ? parseFloat(targetQuantity) : undefined,
        reason: correctionReason,
        store_id: storeId || (product as any)?.store_id || branding?.id
      });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success(isTr ? 'Ters kayıt / düzeltme hareketi başarıyla işlendi.' : 'Correction reversal recorded successfully.');
      if (res?.new_stock !== undefined) {
        product.stock_quantity = res.new_stock;
        if (onStockUpdated) onStockUpdated(res.new_stock);
      }
      setCorrectingMovement(null);
      setTargetQuantity('');
      setCorrectionReason('');
      fetchMovements();
    } catch (err: any) {
      toast.error(err?.message || (isTr ? 'İşlem başarısız oldu' : 'Action failed'));
    } finally {
      setSubmittingCorrection(false);
    }
  };

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
    const srcLower = (m.source || '').toLowerCase();

    if (!type) {
      if (srcLower === 'purchase_invoice' || srcLower === 'purchase' || /alış faturası|fatura girişi|e-fatura içe|e-fatura detay/i.test(desc)) {
        type = 'purchase';
      } else if (
        srcLower === 'sales_invoice' ||
        srcLower === 'sales' ||
        /satış faturası/i.test(desc) ||
        (['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti'].includes(srcLower) && (m.invoice_id || m.invoice_number))
      ) {
        type = 'sales';
      }
    }

    if (!number) {
      const match = desc.match(/(?:Faturası?|Girişi|Sorgulama|Aktarma|Güncellendi)?:\s*([A-Za-z0-9\-_#]+)/i);
      if (match) {
        number = match[1].trim();
      }
    }

    const hasInvoice = Boolean(m.invoice_id || (type && number) || srcLower === 'purchase_invoice' || srcLower === 'sales_invoice');
    return { type, number, hasInvoice };
  };

  const handleViewPurchaseHtml = async (invoiceId: number) => {
    setHtmlLoading(true);
    setShowHtmlModal(true);
    try {
      const res = await api.getPurchaseInvoiceHtml(invoiceId, selectedPurchaseInvoice?.store_id || storeId || (product as any)?.store_id || branding?.id);
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

  const handleViewSalesHtml = async (invoiceId: number) => {
    setHtmlLoading(true);
    setShowHtmlModal(true);
    try {
      const res = await api.getSalesInvoiceHtml(invoiceId, selectedSalesInvoice?.store_id || storeId || (product as any)?.store_id || branding?.id);
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
    const targetStoreId = (m as any).store_id || storeId || (product as any)?.store_id || branding?.id;

    setLoadingInvoiceId(m.id);
    try {
      if (type === 'purchase' || (!type && m.source === 'purchase_invoice')) {
        let inv: any = null;
        if (m.invoice_id) {
          try {
            inv = await api.getPurchaseInvoice(m.invoice_id, targetStoreId);
          } catch (e) {
            console.warn("Direct purchase invoice fetch failed, trying search fallback", e);
          }
        }
        if ((!inv || inv.error || !inv.id) && number) {
          const list = await api.getPurchaseInvoices(targetStoreId, number);
          if (Array.isArray(list) && list.length > 0) {
            const match = list.find((item: any) => item.invoice_number === number || item.document_number === number) || list[0];
            inv = await api.getPurchaseInvoice(match.id, match.store_id || targetStoreId);
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
            inv = await api.getSalesInvoice(m.invoice_id, targetStoreId);
          } catch (e) {
            console.warn("Direct sales invoice fetch failed, trying search fallback", e);
          }
        }
        if ((!inv || inv.error || !inv.id) && number) {
          const list = await api.getSalesInvoices(targetStoreId, number);
          if (Array.isArray(list) && list.length > 0) {
            const match = list.find((item: any) => item.invoice_number === number || item.document_number === number) || list[0];
            inv = await api.getSalesInvoice(match.id, match.store_id || targetStoreId);
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

      const srcLower = (m.source || '').toLowerCase();
      const isReversal = Boolean(m.reference_movement_id || /ters kay[ıi]t|d[üu]zeltme fark/i.test(m.description || ''));
      const isPurchase = !isReversal && (srcLower === 'purchase_invoice' || m.invoice_type === 'purchase' || srcLower === 'purchase');
      const isSales = !isReversal && (srcLower === 'sales_invoice' || m.invoice_type === 'sales' || srcLower === 'sales' || srcLower === 'web_sale' || ['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti'].includes(srcLower));
      const isPos = !isReversal && (srcLower === 'pos_sale' || srcLower === 'pos' || (srcLower === 'sale' && !m.invoice_id && m.invoice_type !== 'sales'));

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
      const srcLower = (m.source || '').toLowerCase();
      const isReversal = Boolean(m.reference_movement_id || /ters kay[ıi]t|d[üu]zeltme fark/i.test(m.description || ''));
      const isPurchase = !isReversal && (srcLower === 'purchase_invoice' || m.invoice_type === 'purchase' || srcLower === 'purchase');
      const isSales = !isReversal && (srcLower === 'sales_invoice' || m.invoice_type === 'sales' || srcLower === 'sales' || srcLower === 'web_sale' || ['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti'].includes(srcLower));
      const isPos = !isReversal && (srcLower === 'pos_sale' || srcLower === 'pos' || (srcLower === 'sale' && !m.invoice_id && m.invoice_type !== 'sales'));

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

  const formatSourceBadge = (source: string, type: string, description?: string, refId?: number | null) => {
    if (refId || (description && /ters kay[ıi]t|d[üu]zeltme fark/i.test(description))) {
      return { 
        label: isTr ? 'Düzeltme & Ters Kayıt' : 'Correction / Reversal', 
        color: 'bg-purple-100 text-purple-800 border-purple-200' 
      };
    }
    const srcLower = (source || '').toLowerCase();
    switch (srcLower) {
      case 'purchase_invoice':
      case 'purchase':
        return { label: isTr ? 'Alış Faturası' : 'Purchase Invoice', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'sales_invoice':
      case 'sales':
        return { label: isTr ? 'Satış Faturası' : 'Sales Invoice', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'pos_sale':
      case 'pos':
      case 'sale':
        return { label: isTr ? 'POS / Kasa Satışı' : 'POS Sale', color: 'bg-violet-100 text-violet-800 border-violet-200' };
      case 'web_sale':
        return { label: isTr ? 'E-Ticaret / Web Satışı' : 'Web Sale', color: 'bg-sky-100 text-sky-800 border-sky-200' };
      case 'initial_stock':
        return { label: isTr ? 'Dönem Başı Mal Mevcudu' : 'Opening Stock', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'manual_adjustment':
      case 'stock_revision_virman':
        return { label: isTr ? 'Stok Hareket Virmanı' : 'Stock Revision Virman', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      default:
        if (['hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti'].includes(srcLower)) {
          return { label: `Pazaryeri (${srcLower.toUpperCase()})`, color: 'bg-orange-100 text-orange-800 border-orange-200' };
        }
        return { 
          label: type === 'in' ? (isTr ? 'Stok Girişi' : 'Stock In') : (isTr ? 'Stok Çıkışı' : 'Stock Out'),
          color: type === 'in' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
        };
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
        <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full max-w-6xl xl:max-w-7xl h-[100dvh] sm:h-auto sm:max-h-[92dvh] flex flex-col overflow-hidden border border-slate-200">
          
          {/* HEADER */}
          <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-medium uppercase tracking-wide text-white truncate">
                    {isTr ? 'Ürün Ekstresi' : 'Product Statement'}
                  </h2>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                    #{product.id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5 truncate">
                  <span className="font-medium text-white truncate max-w-md sm:max-w-xl">{product.name}</span>
                  {product.barcode && (
                    <span className="font-mono bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 text-[10px] hidden sm:inline border border-slate-700">
                      {product.barcode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                type="button"
                onClick={handlePrintStatement}
                disabled={movements.length === 0}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-all text-xs font-medium border border-slate-700 disabled:opacity-40 cursor-pointer"
                title={isTr ? 'Yazdır / PDF Ekstre' : 'Print Statement'}
              >
                <Printer className="h-3.5 w-3.5" />
                <span>{isTr ? 'Yazdır' : 'Print'}</span>
              </button>

              <button 
                type="button"
                onClick={handleExport}
                disabled={exporting || movements.length === 0}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all text-xs font-medium shadow-2xs disabled:opacity-40 cursor-pointer"
                title={isTr ? 'Excel Olarak İndir' : 'Export Excel'}
              >
                <FileDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{exporting ? '...' : 'Excel'}</span>
              </button>

              <button 
                type="button"
                onClick={onClose} 
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer ml-1"
                title={isTr ? 'Kapat' : 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* COMPACT SUMMARY KPI CARDS */}
          <div className="py-2 px-4 bg-slate-50/80 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
            {/* INCOMING / PURCHASES */}
            <div className="px-3 py-2 bg-white rounded-xl border border-emerald-100/90 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  {isTr ? 'Toplam Giriş / Alış' : 'Total In / Purchases'}
                </div>
                <div className="text-sm font-medium font-mono text-emerald-700">
                  +{stats.totalInQty} <span className="text-[11px] font-normal text-slate-500">{product.unit || 'Adet'}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(stats.totalInAmount)}
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-mono font-medium text-[11px]">
                {stats.purchaseCount} {isTr ? 'fat' : 'inv'}
              </div>
            </div>

            {/* OUTGOING / SALES */}
            <div className="px-3 py-2 bg-white rounded-xl border border-rose-100/90 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-rose-600" />
                  {isTr ? 'Toplam Çıkış / Satış' : 'Total Out / Sales'}
                </div>
                <div className="text-sm font-medium font-mono text-rose-700">
                  -{stats.totalOutQty} <span className="text-[11px] font-normal text-slate-500">{product.unit || 'Adet'}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatCurrency(stats.totalOutAmount)}
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 font-mono font-medium text-[11px]">
                {stats.salesCount + stats.posCount} {isTr ? 'işl' : 'tx'}
              </div>
            </div>

            {/* NET STOCK & BALANCE */}
            <div className="px-3 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100 shadow-2xs flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-[10px] font-medium text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                  <Package className="h-3 w-3 text-indigo-600" />
                  {isTr ? 'Mevcut Stok Durumu' : 'Current Stock Balance'}
                </div>
                <div className="text-sm font-medium font-mono text-indigo-950">
                  {stats.totalCount > 0 ? stats.netStock : (product.stock_quantity ?? 0)} <span className="text-[11px] font-normal text-indigo-700">{product.unit || 'Adet'}</span>
                </div>
                <div className="text-[10px] font-mono text-indigo-700">
                  {isTr ? 'Satış:' : 'Price:'} {formatCurrency(product.price)}
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-mono font-medium text-[10px] shadow-2xs">
                OK
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH TOOLBAR (SINGLE LINE) */}
          <div className="px-4 py-2 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isTr ? 'Tümü' : 'All'} ({stats.totalCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('purchase')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedFilter === 'purchase'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                {isTr ? 'Alış Faturaları' : 'Purchases'} ({stats.purchaseCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('sales')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedFilter === 'sales'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60'
                }`}
              >
                {isTr ? 'Satış Faturaları' : 'Sales'} ({stats.salesCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('pos')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedFilter === 'pos'
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'bg-violet-50 text-violet-800 hover:bg-violet-100 border border-violet-200/60'
                }`}
              >
                {isTr ? 'POS / Kasa' : 'POS'} ({stats.posCount})
              </button>
              {stats.otherCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter('other')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedFilter === 'other'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  {isTr ? 'Devir / Virman' : 'Opening / Virman'} ({stats.otherCount})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTr ? 'Fatura no, cari veya açıklama ara...' : 'Search invoice, customer...'}
                className="w-full pl-8 pr-7 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:bg-white focus:border-indigo-600 focus:ring-0 transition-all font-medium text-slate-800"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* MOVEMENTS LIST / HIGH DENSITY SINGLE-ROW TABLE */}
          <div className="p-3 overflow-y-auto flex-1 space-y-1.5 bg-slate-50/50">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-500">
                  {isTr ? 'Ürün hareketleri ve fatura eşleşmeleri kontrol ediliyor...' : 'Checking product movements and invoice links...'}
                </div>
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-700">
                  {isTr ? 'Kayıtlı Hareket Bulunamadı' : 'No Movements Found'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || selectedFilter !== 'all'
                    ? (isTr ? 'Seçili filtrelere uygun hareket kaydı bulunamadı.' : 'No movements match the current filter.')
                    : (isTr ? 'Bu ürüne ait henüz alış faturası, satış veya stok devri kaydedilmemiştir.' : 'No invoices or sales recorded for this product yet.')}
                </div>
              </div>
            ) : (
              filteredMovements.map(m => {
                const { type: invType, number: invNumber, hasInvoice } = getInvoiceDetailsFromMovement(m);
                const badge = formatSourceBadge(m.source, m.type, m.description, m.reference_movement_id);
                const rowTotal = (Number(m.quantity) || 0) * (Number(m.unit_price) || 0);

                const isManualAdjust = m.source === 'manual_adjustment' || m.source === 'initial_stock';
                const isReversalEntry = Boolean(m.reference_movement_id || /ters kay[ıi]t|d[üu]zeltme fark/i.test(m.description || ''));
                const isAlreadyReversed = movements.some(other => other.reference_movement_id === m.id);

                return (
                  <div 
                    key={m.id} 
                    className="py-1.5 px-3 bg-white hover:bg-slate-50/90 rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-2xs transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    {/* Left: Direction Icon + Date + Badge + Description & Context */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Direction Icon */}
                      {m.type === 'in' ? (
                        <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0" title={isTr ? 'Stok Girişi' : 'Stock In'}>
                          <ArrowUpCircle className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shrink-0" title={isTr ? 'Stok Çıkışı' : 'Stock Out'}>
                          <ArrowDownCircle className="h-3.5 w-3.5" />
                        </div>
                      )}

                      {/* Date Time */}
                      <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap shrink-0">
                        {(m.source === 'purchase_invoice' || m.source === 'sales_invoice' || m.invoice_type === 'purchase' || m.invoice_type === 'sales')
                          ? formatDateTR(m.created_at)
                          : formatDateTimeTR(m.created_at)}
                      </span>

                      {/* Badge */}
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider whitespace-nowrap shrink-0 ${badge.color}`}>
                        {badge.label}
                      </span>

                      {/* Description and Document Info (Inline) */}
                      <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                        <span className="text-xs font-medium text-slate-800 truncate" title={m.description}>
                          {m.description}
                        </span>

                        {/* Customer Info */}
                        {m.customer_info && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 truncate shrink-0 max-w-[180px]" title={m.customer_info}>
                            <User className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{m.customer_info}</span>
                          </span>
                        )}

                        {/* Unit Price & Total Amount if present */}
                        {(m.unit_price != null && Number(m.unit_price) > 0) && (
                          <span className="hidden lg:inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 whitespace-nowrap shrink-0">
                            <span>{isTr ? 'Birim:' : 'Unit:'}</span>
                            <span className="text-slate-800 font-medium">{formatCurrency(m.unit_price, m.currency)}</span>
                            {rowTotal > 0 && (
                              <>
                                <span className="text-slate-300">|</span>
                                <span>{isTr ? 'Tutar:' : 'Total:'}</span>
                                <span className="text-indigo-700 font-medium">{formatCurrency(rowTotal, m.currency)}</span>
                              </>
                            )}
                          </span>
                        )}

                        {/* Reversal Reference Note if this is a reversal */}
                        {isReversalEntry && m.reference_movement_id && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60 shrink-0">
                            <Scale className="w-2.5 h-2.5 text-purple-600" />
                            <span>Ref #{m.reference_movement_id}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions + Reversal Pen Icon + Quantity */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Direct Invoice Action Buttons (compact icons) */}
                      {hasInvoice && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(m)}
                            disabled={loadingInvoiceId === m.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all border cursor-pointer ${
                              invType === 'purchase'
                                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                            }`}
                            title={invType === 'purchase' ? (isTr ? 'Alış Faturasını Aç' : 'Open Purchase Invoice') : (isTr ? 'Satış Faturasını Aç' : 'Open Sales Invoice')}
                          >
                            {loadingInvoiceId === m.id ? (
                              <Loader2 className="h-3 w-3 animate-spin text-current" />
                            ) : (
                              <FileText className="h-3 w-3 text-current" />
                            )}
                            <span className="font-mono">{invNumber || (invType === 'purchase' ? (isTr ? 'Alış Faturası' : 'Purchase') : (isTr ? 'Satış Faturası' : 'Sales'))}</span>
                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                          </button>

                          {invType === 'purchase' && m.invoice_id && (
                            <button
                              type="button"
                              onClick={() => handleViewPurchaseHtml(m.invoice_id!)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-200 transition-colors cursor-pointer"
                              title={isTr ? 'Orijinal e-Fatura HTML görselini görüntüle' : 'View e-Invoice HTML'}
                            >
                              <Receipt className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Reversal Tag if already reversed */}
                      {isAlreadyReversed && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200" title={isTr ? 'Bu hareket için ters kayıt/düzeltme oluşturuldu' : 'Corrected via reversal'}>
                          <CheckCircle2 className="w-3 h-3 text-amber-600" />
                          <span className="hidden sm:inline">{isTr ? 'Düzeltildi' : 'Reversed'}</span>
                        </span>
                      )}

                      {/* Kalem İkonu ile Hata Düzeltme / Ters Kayıt Revizesi */}
                      {isManualAdjust && !isReversalEntry && (
                        <button
                          type="button"
                          onClick={() => {
                            setCorrectingMovement(m);
                            setCorrectionType('full_reversal');
                            setTargetQuantity(String(m.quantity || ''));
                            setCorrectionReason('');
                          }}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-all cursor-pointer shadow-2xs active:scale-95"
                          title={isTr ? 'Hata Düzeltme / Ters Kayıt (Miktar Revizesi)' : 'Correction / Reversal'}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Movement Quantity: Single-Line, Clean Font */}
                      <div className={`font-mono font-medium text-xs sm:text-sm whitespace-nowrap min-w-[65px] text-right ${
                        m.type === 'in' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {m.type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}{' '}
                        <span className="text-[11px] font-normal text-slate-500">{product.unit || 'Adet'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
            <span className="font-medium">
              {isTr ? 'Gösterilen Hareket:' : 'Shown Movements:'} <strong className="text-slate-800">{filteredMovements.length}</strong> / {movements.length}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium transition-all cursor-pointer"
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
              <h1 className="text-xl font-medium uppercase tracking-wider">{branding?.store_name || branding?.name || 'LOOKPRICE'}</h1>
              <h2 className="text-base font-medium text-slate-700 mt-1">{isTr ? 'ÜRÜN HAREKET EKSTRESİ' : 'PRODUCT MOVEMENT STATEMENT'}</h2>
              <p className="text-xs text-slate-500">{formatDateTimeTR(new Date())}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">{product.name}</div>
              <div className="text-xs font-mono text-slate-600">{product.barcode || ''} {product.product_code ? `| ${product.product_code}` : ''}</div>
              <div className="text-xs font-medium text-indigo-700 mt-1">{isTr ? 'Güncel Stok:' : 'Current Stock:'} {stats.totalCount > 0 ? stats.netStock : (product.stock_quantity ?? 0)} {product.unit || 'Adet'}</div>
            </div>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-800">
                <th className="py-2 px-2 font-medium">{isTr ? 'Tarih' : 'Date'}</th>
                <th className="py-2 px-2 font-medium">{isTr ? 'İşlem / Kaynak' : 'Type'}</th>
                <th className="py-2 px-2 font-medium">{isTr ? 'Açıklama & Cari' : 'Description'}</th>
                <th className="py-2 px-2 text-right font-medium">{isTr ? 'Birim Fiyat' : 'Price'}</th>
                <th className="py-2 px-2 text-right font-medium">{isTr ? 'Giriş (+)' : 'In (+)'}</th>
                <th className="py-2 px-2 text-right font-medium">{isTr ? 'Çıkış (-)' : 'Out (-)'}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, idx) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-1.5 px-2 font-mono">{formatDateTR(m.created_at)}</td>
                  <td className="py-1.5 px-2 font-medium">{m.source}</td>
                  <td className="py-1.5 px-2">{m.description} {m.customer_info ? `(${m.customer_info})` : ''}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{m.unit_price ? formatCurrency(m.unit_price, m.currency) : '-'}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-emerald-700">{m.type === 'in' ? `+${m.quantity}` : '-'}</td>
                  <td className="py-1.5 px-2 text-right font-medium text-rose-700">{m.type === 'out' ? `-${m.quantity}` : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800 font-medium bg-slate-50">
                <td colSpan={4} className="py-2 px-2">{isTr ? 'TOPLAM' : 'TOTAL'}</td>
                <td className="py-2 px-2 text-right text-emerald-700 font-medium">+{stats.totalInQty}</td>
                <td className="py-2 px-2 text-right text-rose-700 font-medium">-{stats.totalOutQty}</td>
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

      {/* Accounting Reversal & Correction Modal (Senaryo 2) */}
      {correctingMovement && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                    <span>{isTr ? 'Hata Düzeltme & Ters Kayıt' : 'Stock Correction & Reversal'}</span>
                    <span className="font-mono text-[10px] text-purple-300 font-medium bg-purple-900/50 px-1.5 py-0.2 rounded border border-purple-500/30">
                      Ref #{correctingMovement.id}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isTr ? 'Muhasebe denetim izini koruyarak karşı ters kayıt oluşturma' : 'Creates an offsetting reversal entry preserving audit history'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCorrectingMovement(null)}
                disabled={submittingCorrection}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Original Movement Summary Card */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {isTr ? 'Düzeltilecek Orijinal Kayıt' : 'Target Movement'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {formatDateTimeTR(correctingMovement.created_at)}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  {correctingMovement.description}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                  <span className="text-[11px] text-slate-500 font-normal">
                    {isTr ? 'Kayıtlı İşlem Yönü & Miktar:' : 'Recorded Effect:'}
                  </span>
                  <span className={`text-sm font-semibold font-mono ${correctingMovement.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {correctingMovement.type === 'in' ? '+' : '-'}{correctingMovement.quantity} {product.unit || 'Adet'}
                  </span>
                </div>
              </div>

              {/* Correction Mode Options */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isTr ? 'Düzeltme Yöntemini Seçin:' : 'Select Correction Mode:'}</span>
                </label>

                {/* Option 1: Full Reversal */}
                <div 
                  onClick={() => setCorrectionType('full_reversal')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    correctionType === 'full_reversal'
                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 shadow-2xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input 
                      type="radio"
                      name="correctionType"
                      checked={correctionType === 'full_reversal'}
                      onChange={() => setCorrectionType('full_reversal')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="space-y-0.5 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{isTr ? 'Tam Ters Kayıt (Hareketi Sıfırla / İptal Et)' : 'Full Reversal (Nullify Entry)'}</span>
                        <span className="text-[10px] font-mono font-black text-purple-700 dark:text-purple-300">
                          {correctingMovement.type === 'in' ? `-${correctingMovement.quantity}` : `+${correctingMovement.quantity}`} {product.unit || 'Adet'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {isTr 
                          ? `Bu hareketin stoğa yaptığı etkiyi tam karşı yönde (${correctingMovement.type === 'in' ? 'Stok Çıkışı' : 'Stok Girişi'}) yeni bir ters kayıt atarak tamamen sıfırlar.` 
                          : `Creates an offsetting entry in the exact opposite direction to fully cancel out the quantity.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Partial Difference */}
                <div 
                  onClick={() => setCorrectionType('partial_difference')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    correctionType === 'partial_difference'
                      ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 shadow-2xs'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input 
                      type="radio"
                      name="correctionType"
                      checked={correctionType === 'partial_difference'}
                      onChange={() => setCorrectionType('partial_difference')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {isTr ? 'Hedef Miktar ile Dengeleme (Fark Kaydı)' : 'Target Adjustment (Difference Entry)'}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {isTr 
                          ? 'Bu işlem aslında ne kadar olmalıydı? Doğru hedef miktarı yazın; sistem aradaki farkı otomatik hesaplayıp telafi kaydı atar.' 
                          : 'Enter the intended correct amount. The system will automatically compute and log the difference.'}
                      </p>

                      {correctionType === 'partial_difference' && (
                        <div className="pt-2 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {isTr ? 'Olması Gereken Doğru Miktar:' : 'Correct Intended Amount:'}
                            </label>
                            <div className="relative w-32">
                              <input 
                                type="number"
                                min="0"
                                step="any"
                                value={targetQuantity}
                                onChange={(e) => setTargetQuantity(e.target.value)}
                                placeholder="0"
                                className="w-full px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                              />
                              <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-bold">
                                {product.unit || 'Adet'}
                              </span>
                            </div>
                          </div>

                          {/* Live Difference Preview */}
                          {targetQuantity !== '' && !isNaN(parseFloat(targetQuantity)) && (
                            (() => {
                              const origQty = parseFloat(String(correctingMovement.quantity || '0')) || 0;
                              const origType = correctingMovement.type;
                              const origEffect = origType === 'in' ? origQty : -origQty;
                              const targetNum = parseFloat(targetQuantity) || 0;
                              const desiredEffect = origType === 'in' ? targetNum : -targetNum;
                              const differenceEffect = desiredEffect - origEffect;

                              if (Math.abs(differenceEffect) < 0.001) {
                                return (
                                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                                    ⚠️ {isTr ? 'Hedef miktar mevcut miktar ile aynıdır; fark bulunmuyor.' : 'Target quantity matches existing entry.'}
                                  </div>
                                );
                              }

                              const isAddingStock = differenceEffect > 0;
                              return (
                                <div className="p-2 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-950 dark:text-indigo-200 space-y-0.5">
                                  <div className="font-bold flex items-center gap-1">
                                    <Scale className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>{isTr ? 'Oluşturulacak Otomatik Dengeleme:' : 'Generated Offset Entry:'}</span>
                                  </div>
                                  <div className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300">
                                    {isAddingStock ? `+${Math.abs(differenceEffect)}` : `-${Math.abs(differenceEffect)}`} {product.unit || 'Adet'} {isAddingStock ? (isTr ? '(Stok Girişi)' : '(Stock In)') : (isTr ? '(Stok Çıkışı)' : '(Stock Out)')}
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason / Note input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {isTr ? 'Gerekçe / Düzeltme Notu (Opsiyonel):' : 'Reason / Note (Optional):'}
                </label>
                <input 
                  type="text"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder={isTr ? 'Örn: Sayım esnasında sehven fazla girilmişti' : 'e.g., Keying error during manual stock take'}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:border-purple-600 focus:ring-0 outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setCorrectingMovement(null)}
                disabled={submittingCorrection}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                {isTr ? 'Vazgeç' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirmCorrection}
                disabled={submittingCorrection || (correctionType === 'partial_difference' && (!targetQuantity || isNaN(parseFloat(targetQuantity))))}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {submittingCorrection ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isTr ? 'İşleniyor...' : 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isTr ? 'Ters Kaydı Onayla & Stoğu Güncelle' : 'Confirm Reversal & Update Stock'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductMovementModal;
