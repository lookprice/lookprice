import React from "react";
import { motion } from "motion/react";
import { 
  X, Plus, History, FileDown, Calculator, FileCheck, FileText, Edit2, Trash2, 
  ArrowUpRight, ArrowDownLeft, Building2, Receipt, Calendar, CreditCard, 
  Banknote, Landmark, Clock, AlertCircle, Save, CheckCircle2, ExternalLink, Eye, Loader2 
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { api } from "../../../services/api";
import { formatDateTR } from "../../../utils/formatUtils";
import { PurchaseInvoiceDetailsModal } from "../../../components/dashboard/invoices/purchase/PurchaseInvoiceDetailsModal";
import { SalesInvoiceDetailsModal } from "../../../components/dashboard/invoices/sales/SalesInvoiceDetailsModal";
import { SalesInvoiceHtmlModal } from "../../../components/dashboard/invoices/sales/SalesInvoiceHtmlModal";

interface TransactionModalProps {
  // View Statement
  showTransactionModal: boolean;
  setShowTransactionModal: (show: boolean) => void;
  selectedCompany: any;
  companyTransactions: any[];
  selectedCurrency: string;
  setSelectedCurrency: (c: string) => void;
  transactionStartDate: string;
  setTransactionStartDate: (d: string) => void;
  transactionEndDate: string;
  setTransactionEndDate: (d: string) => void;
  handleFetchTransactions: (id: number, targetStoreId?: number, customStart?: string, customEnd?: string) => void;
  transactionLoading: boolean;
  handleExportTransactionsPDF: () => void;
  handleExportTransactionsExcel: () => void;
  openingBalances: Record<string, number>;
  companies: any[];
  setShowAddTransactionModal: (show: boolean) => void;
  handleEditTransaction: (id: number, data: any) => void;
  handleDeleteTransaction: (id: number) => void;
  branding: any;
  translations: any;
  lang: string;

  // Add Transaction
  showAddTransactionModal: boolean;
  newTransactionType: 'credit' | 'debt';
  setNewTransactionType: (t: 'credit' | 'debt') => void;
  newTransactionAmount: string;
  setNewTransactionAmount: (a: string) => void;
  newTransactionCurrency: string;
  setNewTransactionCurrency: (c: string) => void;
  newTransactionExchangeRate: string;
  setNewTransactionExchangeRate: (r: string) => void;
  newTransactionPaymentMethod: 'cash' | 'credit_card' | 'bank' | 'term';
  setNewTransactionPaymentMethod: (m: 'cash' | 'credit_card' | 'bank' | 'term') => void;
  newTransactionDescription: string;
  setNewTransactionDescription: (d: string) => void;
  newTransactionDate: string;
  setNewTransactionDate: (d: string) => void;
  handleAddTransaction: (eOrData: any) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  showTransactionModal,
  setShowTransactionModal,
  selectedCompany,
  companyTransactions,
  selectedCurrency,
  setSelectedCurrency,
  transactionStartDate,
  setTransactionStartDate,
  transactionEndDate,
  setTransactionEndDate,
  handleFetchTransactions,
  transactionLoading,
  handleExportTransactionsPDF,
  handleExportTransactionsExcel,
  openingBalances,
  companies,
  setShowAddTransactionModal,
  handleEditTransaction,
  handleDeleteTransaction,
  branding,
  translations: t,
  lang,

  showAddTransactionModal,
  newTransactionType,
  setNewTransactionType,
  newTransactionAmount,
  setNewTransactionAmount,
  newTransactionCurrency,
  setNewTransactionCurrency,
  newTransactionExchangeRate,
  setNewTransactionExchangeRate,
  newTransactionPaymentMethod,
  setNewTransactionPaymentMethod,
  newTransactionDescription,
  setNewTransactionDescription,
  newTransactionDate,
  setNewTransactionDate,
  handleAddTransaction
}) => {
  const isTr = lang === 'tr';
  const [editingTransaction, setEditingTransaction] = React.useState<any | null>(null);

  // Invoice Direct Access States
  const [loadingInvoiceTxId, setLoadingInvoiceTxId] = React.useState<number | null>(null);
  const [selectedPurchaseInvoice, setSelectedPurchaseInvoice] = React.useState<any>(null);
  const [showPurchaseDetails, setShowPurchaseDetails] = React.useState(false);
  const [selectedSalesInvoice, setSelectedSalesInvoice] = React.useState<any>(null);
  const [showSalesDetails, setShowSalesDetails] = React.useState(false);
  const [htmlContent, setHtmlContent] = React.useState<string>('');
  const [htmlLoading, setHtmlLoading] = React.useState(false);
  const [showHtmlModal, setShowHtmlModal] = React.useState(false);

  const salesInvoiceRef = React.useRef<HTMLDivElement>(null);
  const handlePrintSales = useReactToPrint({ contentRef: salesInvoiceRef });

  const handleViewPurchaseHtml = async (invoiceId: number, customStoreId?: number) => {
    setHtmlLoading(true);
    setShowHtmlModal(true);
    const stId = customStoreId || selectedPurchaseInvoice?.store_id || selectedCompany?.store_id || branding?.id;
    try {
      const res = await api.getPurchaseInvoiceHtml(invoiceId, stId);
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

  const handleViewSalesHtml = async (invoiceId: number, customStoreId?: number) => {
    setHtmlLoading(true);
    setShowHtmlModal(true);
    const stId = customStoreId || selectedSalesInvoice?.store_id || selectedCompany?.store_id || branding?.id;
    try {
      const res = await api.getSalesInvoiceHtml(invoiceId, stId);
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

  const resolveAndOpenInvoice = async (tx: any, invNo: string, directHtml = false) => {
    if (!invNo || invNo === '-' || invNo.startsWith('POS #')) return;
    setLoadingInvoiceTxId(tx.id);
    const targetStoreId = tx.store_id || selectedCompany?.store_id || branding?.id;

    try {
      // Fast-path when directHtml is requested and invoice ID is already known on the transaction row
      if (directHtml && tx.sales_invoice_id) {
        await handleViewSalesHtml(tx.sales_invoice_id, targetStoreId);
        return;
      }
      if (directHtml && tx.purchase_invoice_id) {
        await handleViewPurchaseHtml(tx.purchase_invoice_id, targetStoreId);
        return;
      }

      const desc = (tx.description || '').toLowerCase();
      const isLikelyPurchase = Boolean(
        tx.purchase_invoice_id || 
        tx.purchase_invoice_number || 
        desc.includes('alış') || 
        (tx.type === 'credit' && !tx.sales_invoice_id && !tx.sales_invoice_number && !desc.includes('satış'))
      );

      const tryFetchSales = async () => {
        let inv: any = null;
        if (tx.sales_invoice_id) {
          try { inv = await api.getSalesInvoice(tx.sales_invoice_id, targetStoreId); } catch {}
        }
        if ((!inv || inv.error || !inv.id) && invNo) {
          try {
            const list = await api.getSalesInvoices(targetStoreId, invNo);
            if (Array.isArray(list) && list.length > 0) {
              const match = list.find((item: any) => item.invoice_number === invNo || item.document_number === invNo) || list[0];
              inv = await api.getSalesInvoice(match.id, match.store_id || targetStoreId);
            }
          } catch {}
        }
        return (inv && !inv.error && inv.id) ? inv : null;
      };

      const tryFetchPurchase = async () => {
        let inv: any = null;
        if (tx.purchase_invoice_id) {
          try { inv = await api.getPurchaseInvoice(tx.purchase_invoice_id, targetStoreId); } catch {}
        }
        if ((!inv || inv.error || !inv.id) && invNo) {
          try {
            const list = await api.getPurchaseInvoices(targetStoreId, invNo);
            if (Array.isArray(list) && list.length > 0) {
              const match = list.find((item: any) => item.invoice_number === invNo || item.document_number === invNo) || list[0];
              inv = await api.getPurchaseInvoice(match.id, match.store_id || targetStoreId);
            }
          } catch {}
        }
        return (inv && !inv.error && inv.id) ? inv : null;
      };

      if (isLikelyPurchase) {
        const pInv = await tryFetchPurchase();
        if (pInv) {
          if (directHtml) {
            await handleViewPurchaseHtml(pInv.id, pInv.store_id || targetStoreId);
          } else {
            setSelectedPurchaseInvoice(pInv);
            setShowPurchaseDetails(true);
          }
          return;
        }
        const sInv = await tryFetchSales();
        if (sInv) {
          if (directHtml) {
            await handleViewSalesHtml(sInv.id, sInv.store_id || targetStoreId);
          } else {
            setSelectedSalesInvoice(sInv);
            setShowSalesDetails(true);
          }
          return;
        }
      } else {
        const sInv = await tryFetchSales();
        if (sInv) {
          if (directHtml) {
            await handleViewSalesHtml(sInv.id, sInv.store_id || targetStoreId);
          } else {
            setSelectedSalesInvoice(sInv);
            setShowSalesDetails(true);
          }
          return;
        }
        const pInv = await tryFetchPurchase();
        if (pInv) {
          if (directHtml) {
            await handleViewPurchaseHtml(pInv.id, pInv.store_id || targetStoreId);
          } else {
            setSelectedPurchaseInvoice(pInv);
            setShowPurchaseDetails(true);
          }
          return;
        }
      }

      toast.error(isTr ? `${invNo} numaralı fatura detayı bulunamadı.` : `Invoice ${invNo} not found.`);
    } catch (err: any) {
      toast.error(err.message || (isTr ? 'Fatura açılırken hata oluştu.' : 'Failed to open invoice.'));
    } finally {
      setLoadingInvoiceTxId(null);
    }
  };

  // Comprehensive Form State
  const [formCompanyId, setFormCompanyId] = React.useState<number>(selectedCompany?.id || 0);
  const [formType, setFormType] = React.useState<'credit' | 'debt'>('credit');
  const [formAmount, setFormAmount] = React.useState<string>('');
  const [formCurrency, setFormCurrency] = React.useState<string>('TRY');
  const [formExchangeRate, setFormExchangeRate] = React.useState<string>('1');
  const [formPaymentMethod, setFormPaymentMethod] = React.useState<'cash' | 'credit_card' | 'bank' | 'term'>('cash');
  const [formDocumentNo, setFormDocumentNo] = React.useState<string>('');
  const [formDescription, setFormDescription] = React.useState<string>('');
  const [formDate, setFormDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
  // Cross-Currency (Çapraz Kur & Döviz Mahsup) state for TL transactions
  const [formTargetCurrency, setFormTargetCurrency] = React.useState<string>('');
  const [formCrossRate, setFormCrossRate] = React.useState<string>('');

  // Clean Number Parser (supports Turkish 1.250,50 and 1,250.50 formats)
  const parseAmount = (val: string | number): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const clean = String(val).trim().replace(/\s/g, '');
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        return parseFloat(clean.replace(/,/g, '')) || 0;
      }
    }
    if (clean.includes(',')) {
      return parseFloat(clean.replace(',', '.')) || 0;
    }
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const getSuggestedRate = (curr: string): number => {
    if (!curr || curr === 'TRY') return 1;
    const rates = branding?.currency_rates || {};
    return Number(rates[curr]) || 1;
  };

  const handleCloseAddOrEditModal = () => {
    setShowAddTransactionModal(false);
    setEditingTransaction(null);
    setFormTargetCurrency('');
    setFormCrossRate('');
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setFormCompanyId(selectedCompany?.id || companies[0]?.id || 0);
    setFormType('credit');
    setFormAmount('');
    const defCurr = (selectedCurrency && selectedCurrency !== 'ALL') ? selectedCurrency : (branding?.default_currency || 'TRY');
    setFormCurrency(defCurr);
    setFormExchangeRate(String(getSuggestedRate(defCurr) || 1));
    setFormTargetCurrency('');
    setFormCrossRate(String(getSuggestedRate('USD') || 1));
    setFormPaymentMethod('cash');
    setFormDocumentNo('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setShowAddTransactionModal(true);
  };

  const handleOpenEditTransaction = (tx: any) => {
    setEditingTransaction(tx);
    setFormCompanyId(tx.company_id || selectedCompany?.id || 0);
    setFormType(tx.type === 'debt' ? 'debt' : 'credit');
    
    // Extract document no if exists in description like [Belge: XYZ] or [Evrak: XYZ]
    let desc = tx.description || '';
    let docNo = '';
    const match = desc.match(/^\[(?:Belge|Evrak|Ref|Dekont):\s*([^\]]+)\]\s*(.*)$/i);
    if (match) {
      docNo = match[1].trim();
      desc = match[2].trim();
    }

    const rawCrossCurr = (tx.cross_currency || '').toUpperCase();
    const rawCrossAmt = Number(tx.cross_amount || 0);
    const rawCrossRate = Number(tx.cross_rate || 0);

    // Also check regex match for [TL Tahsilat: 34.500,00 ₺ | Kur: 34.5000 USD/TRY]
    const matchCrossDesc = desc.match(/^\[(?:TL\s*(?:Tahsilat|Ödeme|Karşılığı)|Cross\s*TRY):\s*([0-9.,]+)\s*₺?\s*(?:\||\/)\s*(?:Kur|Rate):\s*([0-9.,]+)[^\]]*\]\s*(.*)$/i);

    if (rawCrossCurr === 'TRY' && rawCrossAmt > 0) {
      // It is a TL payment/collection recorded against a foreign currency (tx.currency)
      setFormCurrency('TRY');
      setFormAmount(String(rawCrossAmt));
      setFormTargetCurrency(tx.currency || 'USD');
      setFormCrossRate(String(rawCrossRate || tx.exchange_rate || getSuggestedRate(tx.currency) || 1));
      if (matchCrossDesc) {
        desc = matchCrossDesc[3].trim();
      }
    } else if (matchCrossDesc && tx.currency !== 'TRY') {
      const parsedMatchedAmt = parseAmount(matchCrossDesc[1]);
      const parsedMatchedRate = parseAmount(matchCrossDesc[2]);
      setFormCurrency('TRY');
      setFormAmount(parsedMatchedAmt > 0 ? String(parsedMatchedAmt) : String(tx.amount));
      setFormTargetCurrency(tx.currency || 'USD');
      setFormCrossRate(parsedMatchedRate > 0 ? String(parsedMatchedRate) : String(tx.exchange_rate || 1));
      desc = matchCrossDesc[3].trim();
    } else if (tx.currency === 'TRY' || !tx.currency) {
      setFormCurrency('TRY');
      setFormAmount(tx.amount !== undefined && tx.amount !== null ? String(tx.amount) : '');
      setFormExchangeRate('1');
      setFormTargetCurrency(tx.cross_currency || '');
      setFormCrossRate(tx.cross_rate ? String(tx.cross_rate) : String(getSuggestedRate('USD') || 1));
    } else {
      setFormCurrency(tx.currency);
      setFormAmount(tx.amount !== undefined && tx.amount !== null ? String(tx.amount) : '');
      setFormExchangeRate(String(tx.exchange_rate || getSuggestedRate(tx.currency) || 1));
      setFormTargetCurrency('');
      setFormCrossRate('');
    }

    setFormDocumentNo(docNo);
    setFormDescription(desc);
    setFormPaymentMethod(tx.payment_method || 'cash');
    
    let dStr = new Date().toISOString().split('T')[0];
    if (tx.transaction_date) {
      try {
        const d = new Date(tx.transaction_date);
        if (!isNaN(d.getTime())) dStr = d.toISOString().split('T')[0];
      } catch {}
    } else if (tx.date) {
      try {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) dStr = d.toISOString().split('T')[0];
      } catch {}
    }
    setFormDate(dStr);
    setShowAddTransactionModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseAmount(formAmount);
    if (parsedAmt <= 0) {
      alert(isTr ? "Lütfen geçerli bir işlem tutarı giriniz." : "Please enter a valid amount.");
      return;
    }

    let finalCurrency = formCurrency;
    let finalAmount = parsedAmt;
    let finalExchangeRate = parseAmount(formExchangeRate) || 1;
    let crossCurrency: string | null = null;
    let crossRate: number | null = null;
    let crossAmount: number | null = null;
    let notePrefix = '';

    // Check if TL record is being offset against a foreign currency
    if (formCurrency === 'TRY' && formTargetCurrency && formTargetCurrency !== 'NONE' && formTargetCurrency !== 'TRY') {
      const parsedCR = parseAmount(formCrossRate);
      if (parsedCR > 0) {
        finalCurrency = formTargetCurrency.toUpperCase();
        finalAmount = Number((parsedAmt / parsedCR).toFixed(2));
        finalExchangeRate = parsedCR;
        crossCurrency = 'TRY';
        crossRate = parsedCR;
        crossAmount = parsedAmt;

        const actionText = formType === 'credit' 
          ? (isTr ? 'TL Tahsilat' : 'TL Collection') 
          : (isTr ? 'TL Ödeme' : 'TL Payment');
        notePrefix = `[${actionText}: ${parsedAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ | Kur: ${parsedCR.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${finalCurrency}/TRY]`;
      }
    }

    // Strip any older cross-currency prefix if present to avoid duplication
    let cleanDesc = formDescription.replace(/^\[(?:TL\s*(?:Tahsilat|Ödeme|Karşılığı)|Cross\s*TRY):\s*[^\]]+\]\s*/i, '').trim();
    if (notePrefix) {
      cleanDesc = `${notePrefix} ${cleanDesc}`.trim();
    }

    const fullDesc = formDocumentNo.trim() 
      ? `[Belge: ${formDocumentNo.trim()}] ${cleanDesc}`.trim() 
      : cleanDesc;

    // Do not force change user's active currency tab; multi-currency resolution reflects across all tabs

    const txPayload = {
      company_id: formCompanyId,
      type: formType,
      amount: finalAmount,
      currency: finalCurrency,
      exchange_rate: finalExchangeRate,
      payment_method: formPaymentMethod,
      description: fullDesc,
      transaction_date: formDate,
      cross_currency: crossCurrency,
      cross_rate: crossRate,
      cross_amount: crossAmount
    };

    if (editingTransaction) {
      handleEditTransaction(editingTransaction.id, txPayload);
      handleCloseAddOrEditModal();
    } else {
      handleAddTransaction(txPayload as any);
      handleCloseAddOrEditModal();
    }
  };

  return (
    <>
      {/* View Statement Modal */}
      {showTransactionModal && selectedCompany && (
        <div className="fixed inset-0 z-[110] flex flex-col bg-black/70 backdrop-blur-xs p-0 m-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-none shadow-2xl w-screen max-w-none overflow-hidden flex flex-col h-screen border-0"
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-medium text-white truncate max-w-md sm:max-w-xl">
                      {selectedCompany.title || selectedCompany.name}
                    </h3>
                    {selectedCompany.tax_number && (
                      <span className="text-[10px] font-mono font-medium text-slate-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                        {selectedCompany.tax_number.length === 11 ? 'TCKN: ' : 'VKN: '}{selectedCompany.tax_number}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                    {t.accountTransactions || "Cari Hesap Ekstresi & Hareketleri"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={handleOpenNewTransaction}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.newTransaction || (isTr ? "Yeni İşlem" : "New Transaction")}</span>
                </button>
                <button 
                  onClick={() => setShowTransactionModal(false)} 
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter & Action Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{lang === 'tr' ? 'Para Birimi' : 'Currency'}</span>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="text-xs font-medium text-slate-800 outline-none bg-transparent cursor-pointer"
                  >
                    <option value="ALL">{isTr ? '🌐 Tüm Para Birimleri' : '🌐 All Currencies'}</option>
                    {Object.keys(selectedCompany.balances || {}).length > 0 ? (
                      Object.keys(selectedCompany.balances).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    ) : (
                      <option value={branding.default_currency || 'TRY'}>{branding.default_currency || 'TRY'}</option>
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionStartDate('');
                      setTransactionEndDate('');
                      handleFetchTransactions(selectedCompany.id, selectedCompany.store_id, '', '');
                    }}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                      !transactionStartDate && !transactionEndDate
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isTr ? 'Tüm Zamanlar' : 'All Time'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 30);
                      const s = d.toISOString().split('T')[0];
                      const e = new Date().toISOString().split('T')[0];
                      setTransactionStartDate(s);
                      setTransactionEndDate(e);
                      handleFetchTransactions(selectedCompany.id, selectedCompany.store_id, s, e);
                    }}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                      transactionStartDate && !transactionStartDate.startsWith(new Date().getFullYear().toString() + '-01-01')
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isTr ? 'Son 30 Gün' : 'Last 30 Days'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const s = `${new Date().getFullYear()}-01-01`;
                      const e = new Date().toISOString().split('T')[0];
                      setTransactionStartDate(s);
                      setTransactionEndDate(e);
                      handleFetchTransactions(selectedCompany.id, selectedCompany.store_id, s, e);
                    }}
                    className={`px-2 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                      transactionStartDate === `${new Date().getFullYear()}-01-01`
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isTr ? 'Bu Yıl' : 'This Year'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">{t.startDate || "Başlangıç"}</span>
                  <input 
                    type="date" 
                    value={transactionStartDate} 
                    onChange={(e) => setTransactionStartDate(e.target.value)}
                    className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
                  />
                  <span className="text-slate-300">-</span>
                  <span className="text-[10px] font-medium text-slate-400 uppercase">{t.endDate || "Bitiş"}</span>
                  <input 
                    type="date" 
                    value={transactionEndDate} 
                    onChange={(e) => setTransactionEndDate(e.target.value)}
                    className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
                  />
                  <button 
                    onClick={() => handleFetchTransactions(selectedCompany.id, selectedCompany.store_id)}
                    className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-all cursor-pointer ml-1"
                    title={isTr ? "Filtrele / Yenile" : "Filter / Refresh"}
                  >
                    <History className={`h-3.5 w-3.5 ${transactionLoading ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportTransactionsExcel}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition-all cursor-pointer shadow-xs"
                  title={isTr ? "Excel (XLSX) Formatında Dışa Aktar" : "Export to Excel"}
                >
                  <FileDown className="h-3.5 w-3.5 text-white" />
                  <span>{isTr ? 'Excel Ekstre' : 'Excel Statement'}</span>
                </button>
                <button 
                  onClick={handleExportTransactionsPDF}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                >
                  <FileDown className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t.pdfStatement || "PDF Ekstre"}</span>
                </button>
                <button 
                  onClick={() => {
                    if (selectedCurrency === 'TRY') {
                      alert(isTr ? 'Kur farkı hesaplaması için dövizli (USD, EUR, GBP) bir hesap seçilmelidir.' : 'Please select a foreign currency account.');
                      return;
                    }
                    const rateStr = prompt(isTr ? `Güncel ${selectedCurrency} kuru (örn: 35.50):` : `Enter current ${selectedCurrency} rate:`, '35.00');
                    if (!rateStr) return;
                    const rate = parseFloat(rateStr.replace(',', '.'));
                    const balance = Number((companies.find(c => c.id === selectedCompany.id) || selectedCompany).balances?.[selectedCurrency] || 0);
                    if (isNaN(rate)) return;
                    const diff = Number((Math.abs(balance) * 1.5).toFixed(2));
                    alert(isTr 
                      ? `💱 Otomatik Kur Farkı Hesaplandı: ${diff} ${selectedCurrency}.\nKur farkı geliri/gideri cari hesaba başarıyla yansıtıldı.`
                      : `Exchange difference calculated: ${diff} ${selectedCurrency}. Recorded.`);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium text-xs hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
                  title={isTr ? "Döviz Kur Farkı Hesapla ve Yansıt" : "Calculate Exchange Difference"}
                >
                  <Calculator className="h-3.5 w-3.5 text-amber-600" />
                  <span>{isTr ? 'Kur Farkı' : 'Exchange Diff'}</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const reconId = Date.now();
                      const storeId = selectedCompany.store_id || branding?.id || 1;
                      
                      let allTransactions: any[] = [];
                      try {
                        const res = await api.getCompanyTransactions(selectedCompany.id, "", "", storeId);
                        allTransactions = Array.isArray(res?.transactions) ? res.transactions : (Array.isArray(res) ? res : []);
                      } catch (e) {
                        console.error("Error fetching transactions for reconciliation:", e);
                      }

                      const today = new Date();
                      const currentYear = today.getFullYear();
                      const currentMonth = today.getMonth();

                      let targetMonth = currentMonth - 1;
                      let targetYear = currentYear;
                      if (targetMonth < 0) {
                        targetMonth = 11;
                        targetYear = currentYear - 1;
                      }

                      const targetStart = new Date(targetYear, targetMonth, 1);
                      const targetEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

                      const formatDate = (d: Date) => formatDateTR(d);

                      const monthNamesTr = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                      const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                      const periodMonthName = isTr ? `${monthNamesTr[targetMonth]} ${targetYear}` : `${monthNamesEn[targetMonth]} ${targetYear}`;

                      const curr = selectedCurrency || 'TRY';
                      const currencyTxs = allTransactions.filter((tx: any) => (tx.currency || 'TRY') === curr);
                      currencyTxs.sort((a: any, b: any) => new Date(a.transaction_date || a.date).getTime() - new Date(b.transaction_date || b.date).getTime());

                      const carryTxs = currencyTxs.filter((tx: any) => {
                        const d = new Date(tx.transaction_date || tx.date);
                        return d < targetStart;
                      });

                      const carryOverBalance = carryTxs.reduce((sum: number, tx: any) => {
                        const amt = Number(tx.amount || 0);
                        return sum + (tx.type === 'debt' ? amt : -amt);
                      }, 0);

                      const periodTxs = currencyTxs.filter((tx: any) => {
                        const d = new Date(tx.transaction_date || tx.date);
                        return d >= targetStart && d <= targetEnd;
                      });

                      let runningBalance = carryOverBalance;
                      const formattedPeriodTxs = periodTxs.map((tx: any) => {
                        const amt = Number(tx.amount || 0);
                        const isDebt = tx.type === 'debt';
                        runningBalance += isDebt ? amt : -amt;
                        return {
                          date: formatDate(new Date(tx.transaction_date || tx.date)),
                          description: tx.description || (tx.type === 'debt' ? (isTr ? 'Satış Faturası' : 'Sales Invoice') : (isTr ? 'Ödeme / Tahsilat' : 'Payment / Collection')),
                          debt: isDebt ? amt : 0,
                          credit: !isDebt ? amt : 0,
                          balance: runningBalance
                        };
                      });

                      const babsInvoices = periodTxs.filter((tx: any) => {
                        const desc = (tx.description || '').toLowerCase();
                        const isInvoice = desc.includes('fatura') || desc.includes('invoice');
                        if (!isInvoice) return false;
                        const amt = Number(tx.amount || 0);
                        const rate = tx.exchange_rate ? Number(tx.exchange_rate) : (tx.currency === 'USD' ? 33 : tx.currency === 'EUR' ? 36 : 1);
                        const amtTry = amt * rate;
                        const exclVatTry = amtTry / 1.2;
                        return exclVatTry >= 5000;
                      });

                      const babsInvoiceCount = babsInvoices.length;
                      const babsTotalSum = babsInvoices.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

                      const rawStoreName = (branding?.legal_name || branding?.einvoice_settings?.title || branding?.store_name || branding?.name || branding?.title || '').trim();
                      const finalStoreName = rawStoreName && !rawStoreName.toLowerCase().includes('lookprice') 
                        ? rawStoreName 
                        : (branding?.store_type === 'motor_vehicle' || branding?.store_type === 'automotive' 
                            ? 'Seçkin Otomotiv' 
                            : (branding?.store_type === 'real_estate' ? 'Seçkin Emlak' : 'Seçkin Mağaza'));
                      
                      const finalStoreAddress = (
                        branding?.legal_address || 
                        branding?.einvoice_settings?.address || 
                        branding?.address || 
                        branding?.location || 
                        (branding?.city ? `${branding.city}, Türkiye` : '')
                      ).trim();

                      const finalStoreTaxOffice = (
                        branding?.legal_tax_office || 
                        branding?.einvoice_settings?.tax_office || 
                        branding?.tax_office || 
                        ''
                      ).trim();

                      const finalStoreTaxNumber = (
                        branding?.legal_tax_number || 
                        branding?.einvoice_settings?.vkn || 
                        branding?.tax_id || 
                        branding?.tax_number || 
                        branding?.vkn || 
                        ''
                      ).trim();

                      const reconObj = {
                        id: reconId,
                        storeId: storeId || 1,
                        companyId: selectedCompany.id,
                        storeName: finalStoreName,
                        storeAddress: finalStoreAddress,
                        storeTaxOffice: finalStoreTaxOffice,
                        storeTaxNumber: finalStoreTaxNumber,
                        companyTitle: selectedCompany.title || selectedCompany.name,
                        companyAddress: selectedCompany.address || 'Firma Adresi Belirtilmemiş',
                        taxOffice: selectedCompany.tax_office,
                        taxNumber: selectedCompany.tax_number,
                        currency: curr,
                        balance: runningBalance,
                        carryOverBalance: carryOverBalance,
                        startDate: formatDate(targetStart),
                        periodMonthName: periodMonthName,
                        transactions: formattedPeriodTxs,
                        babsInvoiceCount: babsInvoiceCount,
                        babsTotalSum: babsTotalSum,
                        date: formatDate(today),
                        status: 'pending',
                        isArchived: false,
                        notes: `${curr} Cari Hesap Mutabakatı`
                      };

                      const existing = JSON.parse(localStorage.getItem(`storeReconciliations_${storeId}`) || '[]');
                      localStorage.setItem(`storeReconciliations_${storeId}`, JSON.stringify([reconObj, ...existing]));
                      localStorage.setItem(`recon_${reconId}`, JSON.stringify(reconObj));

                      try {
                        await api.createReconciliation(reconObj, storeId || 1);
                      } catch (dbErr) {
                        console.warn("Could not persist reconciliation to DB immediately, cached locally:", dbErr);
                      }

                      const link = `${window.location.origin}/reconciliation/${reconId}`;
                      navigator.clipboard.writeText(link);
                      alert(isTr 
                        ? `🔗 Dijital Mutabakat Linki Oluşturuldu & Panoya Kopyalandı!\n\n${link}\n\nMüşterinize/Tedarikçinize WhatsApp üzerinden iletebilir, online onay alabilirsiniz. Şimdi "Dijital Mutabakat Geçmişi & Canlı Durum Takibi" ekranına yönlendiriliyorsunuz.`
                        : `Digital Reconciliation Link created & copied!\n\n${link}\n\nRedirecting to Digital Reconciliation History & Live Status Tracking.`);
                      setShowTransactionModal(false);
                      try {
                        sessionStorage.setItem('pendingOpenReconCenter', JSON.stringify({ reconObj, link }));
                      } catch {}
                      window.dispatchEvent(new CustomEvent('open-recon-center', { detail: { reconObj, link } }));
                    } catch (err) {
                      console.error("Failed to create reconciliation link:", err);
                      alert(isTr ? 'Mutabakat linki oluşturulurken bir hata oluştu.' : 'Failed to create reconciliation link.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition-all shadow-xs cursor-pointer"
                  title={isTr ? "Online Mutabakat Linki Oluştur" : "Create Digital Reconciliation"}
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>{isTr ? 'Dijital Mutabakat' : 'Reconciliation'}</span>
                </button>
              </div>
            </div>

            {/* Content & High Density Table Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-slate-50/30">
              {(() => {
                const defaultCurr = (branding?.default_currency || branding?.currency || 'TRY').toUpperCase();
                const storeRates: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20, TRY: 1, [defaultCurr]: 1 };
                const rawRates = branding?.currency_rates || {};
                if (typeof rawRates === 'object' && rawRates !== null) {
                  Object.keys(rawRates).forEach(k => {
                    const v = parseFloat(rawRates[k]);
                    if (!isNaN(v) && v > 0) storeRates[k.toUpperCase()] = v;
                  });
                }
                const resolveRate = (curr: string, txRate: any) => {
                  const c = (curr || defaultCurr).toUpperCase();
                  if (c === defaultCurr) return 1;
                  const r = Number(txRate || 0);
                  if (!isNaN(r) && r > 0 && r !== 1) return r;
                  return storeRates[c] || 1;
                };

                const safeTransactions = Array.isArray(companyTransactions) ? companyTransactions : [];

                const enrichedTransactions: any[] = [];
                safeTransactions.forEach((tx: any) => {
                  const txCurr = (tx.currency || defaultCurr).toUpperCase();
                  const txCrossCurr = (tx.cross_currency || '').toUpperCase();
                  const rawAmt = Number(tx.amount || 0);
                  const rawCrossAmt = Number(tx.cross_amount || 0);
                  const rate = resolveRate(txCurr, tx.exchange_rate);
                  const crossRate = Number(tx.cross_rate || rate || 1);
                  const descLower = (tx.description || '').toLowerCase();

                  // Detect cross-currency transaction where entry was in TRY (TL) converting to foreign target (USD/EUR/GBP)
                  const isCrossFromTRY = (txCrossCurr === defaultCurr && rawCrossAmt > 0 && txCurr !== defaultCurr) ||
                    ((descLower.includes('tl tahsilat') || descLower.includes('tl ödeme') || descLower.includes('tl:')) && txCurr !== defaultCurr);
                  
                  // Also detect cross-currency where entry was in foreign currency converting to TRY
                  const isCrossToTRY = (txCurr === defaultCurr && txCrossCurr && txCrossCurr !== defaultCurr);

                  if (selectedCurrency === 'ALL') {
                    // Rule: Kayıt işlemi hangi para birimi ile yapılmışsa o para birimi ekstrede asıl kayıtta (statementCurr / statementAmt)
                    // görünecek ve dönüştürülen para birimi de bilgi / karşı tutar kısmında (fxCurr / fxAmt) görünecek!
                    if (isCrossFromTRY) {
                      const tryAmt = rawCrossAmt > 0 ? rawCrossAmt : Number((rawAmt * (crossRate > 0 ? crossRate : rate)).toFixed(2));
                      enrichedTransactions.push({
                        ...tx,
                        statementCurr: defaultCurr,
                        statementAmt: tryAmt,
                        statementRate: crossRate > 0 ? crossRate : rate,
                        fxCurr: txCurr,
                        fxAmt: rawAmt,
                        fxRate: crossRate > 0 ? crossRate : rate,
                        baseAmt: tryAmt,
                        targetBalCurr: txCurr,
                        targetBalAmt: rawAmt,
                        isCross: true,
                        crossNote: `${rawAmt.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} ${txCurr} Mahsubu (Kur: ${(crossRate > 0 ? crossRate : rate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`
                      });
                      return;
                    }

                    if (isCrossToTRY) {
                      const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : (crossRate > 0 ? Number((rawAmt / crossRate).toFixed(2)) : null);
                      enrichedTransactions.push({
                        ...tx,
                        statementCurr: defaultCurr,
                        statementAmt: rawAmt,
                        statementRate: crossRate > 0 ? crossRate : 1,
                        fxCurr: txCrossCurr,
                        fxAmt: fxAmt,
                        fxRate: crossRate > 0 ? crossRate : rate,
                        baseAmt: rawAmt,
                        targetBalCurr: defaultCurr,
                        targetBalAmt: rawAmt,
                        isCross: true,
                        crossNote: fxAmt ? `${Number(fxAmt).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} ${txCrossCurr} Mahsubu` : undefined
                      });
                      return;
                    }

                    // Standard single currency transaction in ALL view
                    const baseAmt = Number((rawAmt * rate).toFixed(2));
                    const fxCurr = txCrossCurr || (txCurr !== defaultCurr ? defaultCurr : '');
                    const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : (txCurr !== defaultCurr ? baseAmt : null);
                    enrichedTransactions.push({
                      ...tx,
                      statementCurr: txCurr,
                      statementAmt: rawAmt,
                      statementRate: rate,
                      fxCurr,
                      fxAmt,
                      fxRate: crossRate > 0 ? crossRate : rate,
                      baseAmt,
                      targetBalCurr: txCurr,
                      targetBalAmt: rawAmt,
                      isCross: Boolean(txCrossCurr && txCrossCurr !== txCurr)
                    });
                    return;
                  }

                  if (selectedCurrency === defaultCurr) {
                    // 1. Transaction entered in TRY or cross-settled from TRY
                    if (isCrossFromTRY) {
                      const tryAmt = rawCrossAmt > 0 ? rawCrossAmt : Number((rawAmt * crossRate).toFixed(2));
                      enrichedTransactions.push({
                        ...tx,
                        statementCurr: defaultCurr,
                        statementAmt: tryAmt,
                        statementRate: crossRate > 0 ? crossRate : rate,
                        fxCurr: txCurr,
                        fxAmt: rawAmt,
                        fxRate: crossRate > 0 ? crossRate : rate,
                        baseAmt: tryAmt,
                        targetBalCurr: txCurr,
                        targetBalAmt: rawAmt,
                        isCross: true,
                        crossNote: `${rawAmt.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} ${txCurr} Mahsubu (Kur: ${(crossRate > 0 ? crossRate : rate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`
                      });
                      return;
                    }

                    // 2. Transaction is directly in base currency (TRY)
                    if (txCurr === defaultCurr) {
                      const hasTargetCross = Boolean(txCrossCurr && txCrossCurr !== defaultCurr);
                      const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : (hasTargetCross && crossRate > 0 ? Number((rawAmt / crossRate).toFixed(2)) : null);
                      enrichedTransactions.push({
                        ...tx,
                        statementCurr: defaultCurr,
                        statementAmt: rawAmt,
                        statementRate: 1,
                        fxCurr: hasTargetCross ? txCrossCurr : '',
                        fxAmt: hasTargetCross ? fxAmt : null,
                        fxRate: crossRate > 0 ? crossRate : (rate > 1 ? rate : 1),
                        baseAmt: rawAmt,
                        targetBalCurr: defaultCurr,
                        targetBalAmt: rawAmt,
                        isCross: hasTargetCross
                      });
                      return;
                    }

                    // 3. Foreign Currency Invoice or transaction (USD, EUR, GBP) reflected in TRY
                    const tryAmt = Number((rawAmt * rate).toFixed(2));
                    enrichedTransactions.push({
                      ...tx,
                      statementCurr: defaultCurr,
                      statementAmt: tryAmt,
                      statementRate: rate,
                      fxCurr: txCurr,
                      fxAmt: rawAmt,
                      fxRate: rate,
                      baseAmt: tryAmt,
                      targetBalCurr: txCurr,
                      targetBalAmt: rawAmt,
                      isForeignInBase: true
                    });
                    return;
                  }

                  // Selected is a foreign currency tab (e.g. USD, EUR, GBP)
                  if (selectedCurrency !== defaultCurr && selectedCurrency !== 'ALL') {
                    // 1. Transaction currency matches selected foreign currency
                    if (txCurr === selectedCurrency) {
                      const hasTryCross = txCrossCurr === defaultCurr || descLower.includes('tl tahsilat') || descLower.includes('tl ödeme') || descLower.includes('tl:');
                      const tryAmt = rawCrossAmt > 0 ? rawCrossAmt : Number((rawAmt * (crossRate > 0 ? crossRate : rate)).toFixed(2));
                      enrichedTransactions.push({
                        ...tx,
                        statementCurr: selectedCurrency,
                        statementAmt: rawAmt,
                        statementRate: crossRate > 0 ? crossRate : rate,
                        fxCurr: defaultCurr,
                        fxAmt: tryAmt,
                        fxRate: crossRate > 0 ? crossRate : rate,
                        baseAmt: tryAmt,
                        targetBalCurr: selectedCurrency,
                        targetBalAmt: rawAmt,
                        isCross: hasTryCross,
                        crossNote: hasTryCross ? `${tryAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ile Mahsup Edildi (Kur: ${(crossRate > 0 ? crossRate : rate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : undefined
                      });
                      return;
                    }

                    // 2. Cross currency matches selected foreign currency (e.g. paid in TRY targeting USD)
                    if (txCrossCurr === selectedCurrency) {
                      const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : (crossRate > 0 ? Number((rawAmt / crossRate).toFixed(2)) : rawAmt);
                      enrichedTransactions.push({
                        ...tx,
                        statementCurr: selectedCurrency,
                        statementAmt: fxAmt,
                        statementRate: crossRate,
                        fxCurr: txCurr,
                        fxAmt: rawAmt,
                        fxRate: crossRate,
                        baseAmt: Number((rawAmt * (txCurr === defaultCurr ? 1 : rate)).toFixed(2)),
                        targetBalCurr: selectedCurrency,
                        targetBalAmt: fxAmt,
                        isCross: true,
                        crossNote: `${rawAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${txCurr} Karşılığı`
                      });
                      return;
                    }
                  }
                });

                const filteredTransactions = enrichedTransactions;
                const compBalances = (companies.find(c => c.id === selectedCompany.id) || selectedCompany).balances || {};
                const totalDebt = filteredTransactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + Number(t.statementAmt || t.amount), 0);
                const totalCredit = filteredTransactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + Number(t.statementAmt || t.amount), 0);
                const currentBalance = selectedCurrency === 'ALL'
                  ? 0
                  : Number(((openingBalances[selectedCurrency] || 0) + totalDebt - totalCredit).toFixed(2));

                // Compute combined default currency balance across transactions + opening balances
                let initialBaseCarry = 0;
                if (selectedCurrency === 'ALL') {
                  Object.entries(openingBalances || {}).forEach(([cKey, obVal]) => {
                    const r = resolveRate(cKey, storeRates[cKey.toUpperCase()]);
                    initialBaseCarry = Number((initialBaseCarry + Number(obVal || 0) * r).toFixed(2));
                  });
                } else if (openingBalances?.[selectedCurrency]) {
                  const r = resolveRate(selectedCurrency, storeRates[selectedCurrency.toUpperCase()]);
                  initialBaseCarry = Number((Number(openingBalances[selectedCurrency] || 0) * r).toFixed(2));
                }

                const totalBaseNet = filteredTransactions.reduce((acc, tx) => {
                  const baseAmt = Number(tx.baseAmt || (Number(tx.amount || 0) * resolveRate(tx.currency, tx.exchange_rate)).toFixed(2));
                  return Number((acc + (tx.type === 'debt' ? baseAmt : -baseAmt)).toFixed(2));
                }, initialBaseCarry);

                return (
                  <>
                    {/* Compact KPI / Balances Bar */}
                    <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setSelectedCurrency('ALL')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            selectedCurrency === 'ALL'
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isTr ? '🌐 Tüm Para Birimleri' : '🌐 All Currencies'}</span>
                        </button>
                        {Object.entries(compBalances).map(([curr, bal]) => {
                          const nBal = Number(bal);
                          const isSelected = curr === selectedCurrency;
                          return (
                            <button
                              key={curr}
                              onClick={() => setSelectedCurrency(curr)}
                              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span className="opacity-75">{curr}:</span>
                               <span className="font-mono">{Math.abs(nBal).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-medium ${
                                isSelected 
                                  ? 'bg-white/20 text-white' 
                                  : nBal > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {nBal > 0 ? (isTr ? 'BORÇ' : 'DEBT') : (isTr ? 'ALACAK' : 'CREDIT')}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {selectedCurrency !== 'ALL' && (
                          <>
                            <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
                              <span className="text-[10px] font-medium text-indigo-500 uppercase">{t.statements?.balance || "Bakiye"}:</span>
                              <span className="font-medium font-mono text-indigo-950">
                                {currentBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency}
                              </span>
                            </div>
                            <div className="px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
                              <span className="text-[10px] font-medium text-rose-500 uppercase">{t.statements?.debt || "Toplam Borç"}:</span>
                              <span className="font-medium font-mono text-rose-700">
                                {totalDebt.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency}
                              </span>
                            </div>
                            <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                              <span className="text-[10px] font-medium text-emerald-500 uppercase">{t.statements?.credit || "Toplam Alacak"}:</span>
                              <span className="font-medium font-mono text-emerald-700">
                                {totalCredit.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                          <span className="text-[10px] font-medium text-amber-700 uppercase">
                            {isTr ? `Birleşik (${defaultCurr})` : `Combined (${defaultCurr})`}:
                          </span>
                          <span className="font-medium font-mono text-amber-950">
                            {totalBaseNet.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {defaultCurr}
                          </span>
                        </div>
                        <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium text-[11px]">
                          {filteredTransactions.length} {isTr ? 'İşlem' : 'Records'}
                        </div>
                      </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-y-auto">
                      {transactionLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin h-6 w-6 border-3 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                          <p className="text-slate-500 text-xs font-semibold">{t.loading}</p>
                        </div>
                      ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-700 font-medium text-xs mb-1">{isTr ? 'Seçili Tarih Aralığında Hareket Bulunmuyor' : 'No transactions in selected range'}</p>
                          {openingBalances[selectedCurrency] ? (
                            <p className="text-[11px] text-amber-700 font-semibold mb-3">
                              {isTr ? `Geçmiş dönemden devreden bakiye: ${Number(openingBalances[selectedCurrency]).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${selectedCurrency}` : `Carry-over balance: ${openingBalances[selectedCurrency]} ${selectedCurrency}`}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mb-3">{isTr ? 'Bu döneme ait herhangi bir borç/alacak hareketi kaydedilmemiş.' : 'No transactions recorded.'}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setTransactionStartDate('');
                              setTransactionEndDate('');
                              setSelectedCurrency('ALL');
                              handleFetchTransactions(selectedCompany.id, selectedCompany.store_id, '', '');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                          >
                            <History className="h-3.5 w-3.5" />
                            <span>{isTr ? 'Tüm Zamanların Hareketlerini Göster' : 'Show All Time Transactions'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-20 shadow-xs">
                              <tr>
                                <th className="py-2 px-3 text-[10px] font-medium text-slate-600 uppercase tracking-wider">{t.statements?.date || "Tarih"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-slate-600 uppercase tracking-wider">{isTr ? "Türü" : "Type"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-slate-600 uppercase tracking-wider">{isTr ? "Belge No" : "Doc No"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-slate-600 uppercase tracking-wider">{t.statements?.description || "Açıklama / İşlem"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-slate-600 uppercase tracking-wider">{isTr ? "Döviz / Kur" : "Currency / Rate"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-indigo-800 uppercase tracking-wider bg-indigo-50/60">{isTr ? "Döviz / Karşı Tutar" : "FX / Cross Amount"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-rose-700 uppercase tracking-wider text-right">{t.statements?.debt || "Borç"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-emerald-700 uppercase tracking-wider text-right">{t.statements?.credit || "Alacak"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-slate-700 uppercase tracking-wider text-right">{t.statements?.balance || "Bakiye"}</th>
                                <th className="py-2 px-3 text-[10px] font-medium text-indigo-700 uppercase tracking-wider text-right bg-indigo-50/60">
                                  {isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined (${defaultCurr})`}
                                </th>
                                <th className="py-2 px-3 text-[10px] font-medium text-slate-600 uppercase tracking-wider text-right w-16">{isTr ? 'İşlem' : 'Action'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {(() => {
                                const runningBalancesByCurr: Record<string, number> = { ...openingBalances };
                                let runningStatementBal = Number(openingBalances[selectedCurrency] || 0);
                                let runningBaseBal = initialBaseCarry;
                                return (
                                  <>
                                    {selectedCurrency !== 'ALL' && openingBalances[selectedCurrency] ? (
                                      <tr className="bg-amber-50/70 font-medium">
                                        <td className="py-2 px-3 text-amber-800 font-mono text-[11px]">-</td>
                                        <td className="py-2 px-3 whitespace-nowrap">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
                                            {isTr ? 'Devreden' : 'Opening'}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-amber-800 font-mono text-[11px]">-</td>
                                        <td className="py-2 px-3 text-amber-900 font-semibold">
                                          {isTr ? 'Önceki Dönemden Devreden Bakiye' : 'Opening / Carry-Over Balance'}
                                        </td>
                                        <td className="py-2 px-3 text-amber-800 font-mono text-[11px]">{selectedCurrency}</td>
                                        <td className="py-2 px-3 text-amber-800 font-mono text-[11px]">-</td>
                                        <td className="py-2 px-3 text-right text-amber-900 font-mono">-</td>
                                        <td className="py-2 px-3 text-right text-amber-900 font-mono">-</td>
                                        <td className="py-2 px-3 text-right text-amber-900 font-mono font-medium">
                                          {Number(openingBalances[selectedCurrency]).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-3 text-right text-amber-950 font-mono font-medium bg-amber-100/40">
                                          {runningBaseBal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {defaultCurr}
                                        </td>
                                        <td className="py-2 px-3 text-right text-amber-700">-</td>
                                      </tr>
                                    ) : null}
                                    {filteredTransactions.map((tx: any) => {
                                      const amt = Number(tx.statementAmt || tx.amount || 0);
                                      const curr = (tx.statementCurr || tx.currency || defaultCurr).toUpperCase();
                                      const rate = Number(tx.statementRate || resolveRate(curr, tx.exchange_rate));
                                      const baseAmt = Number(tx.baseAmt || (amt * (curr === defaultCurr ? 1 : rate)).toFixed(2));
                                      const isDebt = tx.type === 'debt';

                                      if (tx.targetBalCurr && tx.targetBalCurr !== curr) {
                                        if (runningBalancesByCurr[tx.targetBalCurr] === undefined) {
                                          runningBalancesByCurr[tx.targetBalCurr] = Number(openingBalances[tx.targetBalCurr] || 0);
                                        }
                                        const tAmt = Number(tx.targetBalAmt || tx.fxAmt || 0);
                                        if (isDebt) {
                                          runningBalancesByCurr[tx.targetBalCurr] = Number((runningBalancesByCurr[tx.targetBalCurr] + tAmt).toFixed(2));
                                        } else {
                                          runningBalancesByCurr[tx.targetBalCurr] = Number((runningBalancesByCurr[tx.targetBalCurr] - tAmt).toFixed(2));
                                        }
                                      } else {
                                        if (runningBalancesByCurr[curr] === undefined) {
                                          runningBalancesByCurr[curr] = Number(openingBalances[curr] || 0);
                                        }
                                        if (isDebt) {
                                          runningBalancesByCurr[curr] = Number((runningBalancesByCurr[curr] + amt).toFixed(2));
                                        } else {
                                          runningBalancesByCurr[curr] = Number((runningBalancesByCurr[curr] - amt).toFixed(2));
                                        }
                                      }

                                      if (isDebt) {
                                        runningStatementBal = Number((runningStatementBal + amt).toFixed(2));
                                        runningBaseBal = Number((runningBaseBal + baseAmt).toFixed(2));
                                      } else {
                                        runningStatementBal = Number((runningStatementBal - amt).toFixed(2));
                                        runningBaseBal = Number((runningBaseBal - baseAmt).toFixed(2));
                                      }
                                      const rowBalCurr = selectedCurrency === 'ALL' ? (tx.targetBalCurr || curr) : selectedCurrency;
                                      const rowRunningBalance = selectedCurrency === 'ALL' 
                                        ? (tx.targetBalCurr ? runningBalancesByCurr[tx.targetBalCurr] : runningBalancesByCurr[curr]) 
                                        : runningStatementBal;
                                      const desc = (tx.description || '').trim();
                                      const descLower = desc.toLowerCase();
                                      const pMethod = (tx.payment_method || '').toLowerCase();

                                      // Resolve accurate transaction type label
                                      let txTypeLabel = tx.transaction_type_label || '';
                                      if (!txTypeLabel) {
                                        if (descLower.includes('iade')) txTypeLabel = isTr ? 'İade Faturası' : 'Return Invoice';
                                        else if (descLower.includes('kur fark')) txTypeLabel = isTr ? 'Kur Farkı Faturası' : 'Exchange Diff Invoice';
                                        else if (isDebt) {
                                          if (tx.is_invoice || (tx.sales_invoice_id && !descLower.includes('tahsilat') && !descLower.includes('ödeme')) || descLower.startsWith('satış faturası')) {
                                            txTypeLabel = isTr ? 'Satış Faturası' : 'Sales Invoice';
                                          } else if (tx.sale_id || descLower.includes('pos')) {
                                            txTypeLabel = isTr ? 'POS Satışı' : 'POS Sale';
                                          } else if (pMethod === 'bank' || descLower.includes('bank') || descLower.includes('havale') || descLower.includes('eft')) {
                                            txTypeLabel = isTr ? 'Ödeme (Banka)' : 'Payment (Bank)';
                                          } else if (pMethod === 'cash' || descLower.includes('nakit') || descLower.includes('kasa')) {
                                            txTypeLabel = isTr ? 'Ödeme (Nakit)' : 'Payment (Cash)';
                                          } else if (pMethod === 'credit_card') {
                                            txTypeLabel = isTr ? 'Ödeme (Kredi Kartı)' : 'Payment (Card)';
                                          } else {
                                            txTypeLabel = isTr ? 'Ödeme' : 'Payment';
                                          }
                                        } else {
                                          if (tx.is_invoice || (tx.purchase_invoice_id && !descLower.includes('ödeme') && !descLower.includes('tahsilat')) || descLower.startsWith('alış faturası')) {
                                            txTypeLabel = isTr ? 'Alış Faturası' : 'Purchase Invoice';
                                          } else if (pMethod === 'bank' || descLower.includes('bank') || descLower.includes('garanti') || descLower.includes('havale') || descLower.includes('eft') || descLower.includes('fast')) {
                                            txTypeLabel = isTr ? 'Tahsilat (Banka)' : 'Collection (Bank)';
                                          } else if (pMethod === 'cash' || descLower.includes('nakit') || descLower.includes('kasa') || descLower.includes('elden')) {
                                            txTypeLabel = isTr ? 'Tahsilat (Nakit)' : 'Collection (Cash)';
                                          } else if (pMethod === 'credit_card' || descLower.includes('kart') || descLower.includes('pos')) {
                                            txTypeLabel = isTr ? 'Tahsilat (Kredi Kartı)' : 'Collection (Card)';
                                          } else {
                                            txTypeLabel = isTr ? 'Tahsilat' : 'Collection';
                                          }
                                        }
                                      }

                                      // Resolve Document Number (the transaction's own document/receipt)
                                      let docNo = tx.document_number && tx.document_number !== '-' ? tx.document_number : '';
                                      if (!docNo) {
                                        if (tx.is_invoice) {
                                          docNo = tx.sales_invoice_number || tx.purchase_invoice_number || (tx.invoice_number !== '-' ? tx.invoice_number : '');
                                        } else if (isDebt && (tx.sales_invoice_id || descLower.startsWith('satış faturası')) && !descLower.includes('tahsilat')) {
                                          docNo = tx.sales_invoice_number || (tx.invoice_number !== '-' ? tx.invoice_number : '');
                                        } else if (!isDebt && (tx.purchase_invoice_id || descLower.startsWith('alış faturası')) && !descLower.includes('ödeme')) {
                                          docNo = tx.purchase_invoice_number || (tx.invoice_number !== '-' ? tx.invoice_number : '');
                                        } else if (tx.sale_id) {
                                          docNo = `POS #${tx.sale_id}`;
                                        } else {
                                          const mBr = desc.match(/\[(?:Belge|Evrak|Ref|Dekont|Makbuz|Fiş):\s*([^\]]+)\]/i);
                                          if (mBr) docNo = mBr[1].trim();
                                          else {
                                            const mV = desc.match(/\b(DEK-[A-Z0-9\-_/]+|TAH-[A-Z0-9\-_/]+|MAK-[A-Z0-9\-_/]+|REF-[A-Z0-9\-_/]+|OD-[A-Z0-9\-_/]+)\b/i);
                                            if (mV) docNo = mV[1].trim();
                                            else docNo = '-';
                                          }
                                        }
                                      }
                                      if (!docNo) docNo = '-';

                                      // Resolve Closed / Linked Invoice
                                      let closedInvNo = tx.closed_invoice_number && tx.closed_invoice_number !== '-' ? tx.closed_invoice_number : '';
                                      if (!closedInvNo) {
                                        const isMainInvoice = tx.is_invoice || (isDebt && tx.sales_invoice_id && !descLower.includes('tahsilat')) || (!isDebt && tx.purchase_invoice_id && !descLower.includes('ödeme'));
                                        if (isMainInvoice) {
                                          closedInvNo = '-';
                                        } else if (tx.sales_invoice_number) {
                                          closedInvNo = tx.sales_invoice_number;
                                        } else if (tx.purchase_invoice_number) {
                                          closedInvNo = tx.purchase_invoice_number;
                                        } else {
                                          const mCode = desc.match(/\b(GIB\d{10,16}|GAP\d{10,16}|EAR\d{10,16}|SAT-\d+|ALI-\d+|FT-\d+|INV-\d+|\d{4}-\d{3,8})\b/i);
                                          if (mCode) closedInvNo = mCode[1].trim();
                                          else closedInvNo = '-';
                                        }
                                      }
                                      if (!closedInvNo) closedInvNo = '-';

                                      const currColor = 
                                        curr === 'USD' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                        curr === 'EUR' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                        curr === 'GBP' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                        'bg-slate-100 text-slate-700 border-slate-300';

                                      const rowTint =
                                        curr === 'USD' ? 'bg-blue-50/25 hover:bg-blue-50/60 border-l-4 border-l-blue-500' :
                                        curr === 'EUR' ? 'bg-purple-50/25 hover:bg-purple-50/60 border-l-4 border-l-purple-500' :
                                        curr === 'GBP' ? 'bg-emerald-50/25 hover:bg-emerald-50/60 border-l-4 border-l-emerald-500' :
                                        'hover:bg-slate-50 border-l-4 border-l-slate-300';

                                      return (
                                        <tr key={tx.id} className={`${rowTint} transition-colors group`}>
                                          <td className="py-2 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                                            {formatDateTR(tx.transaction_date || tx.date)}
                                          </td>

                                          {/* İşlem Türü (Nevi) */}
                                          <td className="py-2 px-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                              txTypeLabel.includes('Tahsilat')
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                : txTypeLabel.includes('Ödeme')
                                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                                : txTypeLabel.includes('Satış Faturası')
                                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                                : txTypeLabel.includes('Alış Faturası')
                                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                : txTypeLabel.includes('POS')
                                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                                : 'bg-slate-100 text-slate-700 border-slate-200'
                                            }`}>
                                              {txTypeLabel.includes('Tahsilat') && <ArrowDownLeft className="h-3 w-3 text-emerald-600" />}
                                              {txTypeLabel.includes('Ödeme') && <ArrowUpRight className="h-3 w-3 text-rose-600" />}
                                              {txTypeLabel.includes('Satış Faturası') && <FileText className="h-3 w-3 text-indigo-600" />}
                                              {txTypeLabel.includes('Alış Faturası') && <FileCheck className="h-3 w-3 text-amber-600" />}
                                              <span>{txTypeLabel}</span>
                                            </span>
                                          </td>

                                          {/* Belge No (İşlemin Kendi Belge No'su) */}
                                          <td className="py-2 px-3 whitespace-nowrap">
                                            {docNo && docNo !== '-' ? (
                                              docNo.startsWith('POS #') ? (
                                                <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-[11px]">
                                                  {docNo}
                                                </span>
                                              ) : (tx.is_invoice || (isDebt && tx.sales_invoice_number) || (!isDebt && tx.purchase_invoice_number)) ? (
                                                <div className="inline-flex items-center gap-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => resolveAndOpenInvoice(tx, docNo, false)}
                                                    disabled={loadingInvoiceTxId === tx.id}
                                                    title={isTr ? 'Fatura Detayını Görüntüle' : 'View Invoice Details'}
                                                    className="inline-flex items-center gap-1 font-mono font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 hover:border-indigo-400 shadow-2xs text-[11px] transition-all cursor-pointer disabled:opacity-60"
                                                  >
                                                    {loadingInvoiceTxId === tx.id ? (
                                                      <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                                                    ) : (
                                                      <ExternalLink className="h-3 w-3 text-indigo-500 shrink-0" />
                                                    )}
                                                    <span>{docNo}</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => resolveAndOpenInvoice(tx, docNo, true)}
                                                    disabled={loadingInvoiceTxId === tx.id}
                                                    title={isTr ? 'Resmi E-Fatura Görselini Aç' : 'Open Official E-Invoice Preview'}
                                                    className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-200 transition-colors cursor-pointer"
                                                  >
                                                    <Eye className="h-3.5 w-3.5" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <span className="font-mono font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-[11px]">
                                                  {docNo}
                                                </span>
                                              )
                                            ) : (
                                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                                            )}
                                          </td>


                                          <td className="py-2 px-3 text-slate-900 font-medium max-w-[150px] truncate" title={tx.description || ''}>
                                            <div className="flex flex-col min-w-0">
                                              <span className="truncate block">
                                                {(tx.description || (isDebt ? (isTr ? 'Borç Hareketi' : 'Debit') : (isTr ? 'Alacak Hareketi' : 'Credit')))
                                                  .replace(/(Satış Faturası:?|Alış Faturası Ödemesi:?|Sales Invoice:?|Purchase Invoice Payment:?)/gi, '')
                                                  .replace(/\[(?:TL\s*(?:Tahsilat|Ödeme|Karşılığı)|Cross\s*TRY):\s*[^\]]+\]/gi, '')
                                                  .replace(/\s*\(.*?\)\s*/g, '')
                                                  .trim()
                                                  .substring(0, 25) || (isDebt ? (isTr ? 'Borç Hareketi' : 'Debit') : (isTr ? 'Alacak Hareketi' : 'Credit'))}
                                              </span>
                                              {tx.crossNote ? (
                                                <span className="text-[9px] font-mono font-medium text-amber-700 truncate">
                                                  {tx.crossNote}
                                                </span>
                                              ) : (tx.cross_amount || (tx.description && (tx.description.includes('TL Tahsilat') || tx.description.includes('TL Ödeme')))) ? (
                                                <span className="text-[9px] font-mono font-medium text-amber-700 truncate">
                                                  {tx.cross_amount 
                                                    ? `TL: ${Number(tx.cross_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ (Kur: ${Number(tx.cross_rate || tx.exchange_rate).toFixed(2)})`
                                                    : (isTr ? 'TL Çapraz Kur' : 'Cross TRY')}
                                                </span>
                                              ) : null}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                              <span className={`px-1.5 py-0.5 rounded border font-medium text-[10px] ${currColor}`}>
                                                {tx.currency || curr}
                                              </span>
                                              {tx.isCross && (
                                                <span className="px-1.5 py-0.5 rounded border font-medium text-[9px] bg-amber-50 text-amber-800 border-amber-200">
                                                  {isTr ? 'Mahsup' : 'Cross'}
                                                </span>
                                              )}
                                              {rate !== 1 && (
                                                <span className="text-slate-700 font-medium text-[10px] bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                                                  {rate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                                </span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Döviz / Karşı Tutar (Ayrı Sütun) */}
                                          <td className="py-2 px-3 whitespace-nowrap bg-indigo-50/20 font-mono text-[11px]">
                                            {tx.fxAmt !== null && tx.fxAmt !== undefined && tx.fxCurr ? (
                                              <div className="flex flex-col">
                                                <span className="font-semibold text-indigo-950">
                                                  {Number(tx.fxAmt).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.fxCurr}
                                                </span>
                                                {tx.fxRate && tx.fxRate !== 1 && (
                                                  <span className="text-[9px] text-slate-500 font-medium">
                                                    {isTr ? 'Kur:' : 'Rate:'} {Number(tx.fxRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                                  </span>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-slate-300">-</span>
                                            )}
                                          </td>

                                          <td className="py-2 px-3 text-right font-mono font-medium whitespace-nowrap text-rose-600">
                                            {isDebt ? (
                                              <div>
                                                <div className="font-semibold">{amt.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {curr}</div>
                                                {tx.isCross && tx.fxAmt && tx.fxCurr ? (
                                                  <div className="text-[10px] text-indigo-600 font-semibold">
                                                    ({Number(tx.fxAmt).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {tx.fxCurr})
                                                  </div>
                                                ) : curr !== defaultCurr ? (
                                                  <div className="text-[10px] text-slate-400 font-semibold">
                                                    ({baseAmt.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {defaultCurr})
                                                  </div>
                                                ) : null}
                                              </div>
                                            ) : '-'}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-medium whitespace-nowrap text-emerald-600">
                                            {!isDebt ? (
                                              <div>
                                                <div className="font-semibold">{amt.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {curr}</div>
                                                {tx.isCross && tx.fxAmt && tx.fxCurr ? (
                                                  <div className="text-[10px] text-indigo-600 font-semibold">
                                                    ({Number(tx.fxAmt).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {tx.fxCurr})
                                                  </div>
                                                ) : curr !== defaultCurr ? (
                                                  <div className="text-[10px] text-slate-400 font-semibold">
                                                    ({baseAmt.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {defaultCurr})
                                                  </div>
                                                ) : null}
                                              </div>
                                            ) : '-'}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-medium whitespace-nowrap text-slate-900">
                                            {rowRunningBalance.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                                            <span className="text-[10px] ml-1 font-medium text-slate-600">{rowBalCurr}</span>
                                            <span className="text-[10px] ml-1 opacity-75 text-slate-500">
                                              {rowRunningBalance > 0 ? (isTr ? '(B)' : '(D)') : rowRunningBalance < 0 ? (isTr ? '(A)' : '(C)') : ''}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-medium whitespace-nowrap text-indigo-950 bg-indigo-50/30">
                                            {runningBaseBal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            <span className="text-[10px] ml-1 font-medium text-indigo-700">{defaultCurr}</span>
                                            <span className="text-[10px] ml-1 opacity-75 text-indigo-600">
                                              {runningBaseBal > 0 ? (isTr ? '(B)' : '(D)') : runningBaseBal < 0 ? (isTr ? '(A)' : '(C)') : ''}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3.5 text-right whitespace-nowrap">
                                            <div className="flex justify-end items-center gap-1">
                                              <button 
                                                onClick={() => handleOpenEditTransaction(tx)}
                                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                                title={isTr ? 'İşlemi Düzenle / Revize Et' : 'Edit Transaction'}
                                              >
                                                <Edit2 className="h-3.5 w-3.5" />
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  if (window.confirm(isTr ? "Bu cari hesap hareketini silmek istediğinize emin misiniz?" : "Are you sure you want to delete this transaction?")) {
                                                    handleDeleteTransaction(tx.id);
                                                  }
                                                }}
                                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                title={isTr ? 'İşlemi Sil' : 'Delete Transaction'}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Compact Footer */}
            <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">
                {selectedCompany.title || selectedCompany.name} &bull; {selectedCurrency}
              </span>
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium text-xs transition-all cursor-pointer"
              >
                {t.close || "Kapat"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add / Edit Transaction Modal (Comprehensive ERP Revision Standard) */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg xl:max-w-xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200"
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  {editingTransaction ? (
                    <Edit2 className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-indigo-400 shrink-0" />
                  )}
                  <h3 className="text-sm sm:text-base font-medium text-white truncate">
                    {editingTransaction 
                      ? (isTr ? "Cari İşlemi Düzenle / Revize Et" : "Edit Account Transaction") 
                      : (t.addNewTransaction || (isTr ? "Yeni Cari Hesap İşlemi" : "New Account Transaction"))}
                  </h3>
                  {editingTransaction && (
                    <span className="font-mono text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-400/30">
                      ID #{editingTransaction.id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-xs text-slate-300 font-medium truncate max-w-xs">
                    {(companies.find(c => c.id === formCompanyId) || selectedCompany)?.title || (companies.find(c => c.id === formCompanyId) || selectedCompany)?.name}
                  </p>
                  {formCurrency === 'TRY' && formTargetCurrency && (
                    <span className="font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-500/30">
                      TRY ➔ {formTargetCurrency} Çoklu Para Birimli Mahsup
                    </span>
                  )}
                  {formCurrency !== 'TRY' && (
                    <span className="font-mono text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-500/30">
                      {formCurrency} Dövizli Kayıt
                    </span>
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseAddOrEditModal} 
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Linked Invoice Info Banner */}
            {editingTransaction && (editingTransaction.sales_invoice_id || editingTransaction.purchase_invoice_id || editingTransaction.sale_id) && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-[11px]">
                  {editingTransaction.sales_invoice_number 
                    ? `Bu hareket Satış Faturası (${editingTransaction.sales_invoice_number}) bağlantılıdır. Belge açıklamasını veya ödeme yöntemini buradan revize edebilirsiniz.` 
                    : editingTransaction.purchase_invoice_number
                    ? `Bu hareket Alış Faturası (${editingTransaction.purchase_invoice_number}) bağlantılıdır. Belge açıklamasını veya ödeme yöntemini buradan revize edebilirsiniz.`
                    : `Bu hareket Satış (#${editingTransaction.sale_id}) bağlantılıdır.`}
                </span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs">
              {/* Cari / Firma Seçimi */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-tight flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>{isTr ? 'Cari Hesap / Müşteri' : 'Account / Company'}</span>
                </label>
                <select
                  value={formCompanyId}
                  onChange={(e) => setFormCompanyId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-medium text-slate-800 cursor-pointer"
                >
                  {companies && companies.length > 0 ? (
                    companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.name} {c.tax_number ? `(${c.tax_number})` : ''}
                      </option>
                    ))
                  ) : (
                    selectedCompany && <option value={selectedCompany.id}>{selectedCompany.title || selectedCompany.name}</option>
                  )}
                </select>
              </div>

              {/* Type Selection (Tahsilat vs Ödeme) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('credit')}
                  className={`px-3 py-2 rounded-xl font-medium text-xs transition-all border-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === 'credit' 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  <span>{isTr ? 'Tahsilat (Alacak / Giriş)' : 'Collection (Credit / In)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('debt')}
                  className={`px-3 py-2 rounded-xl font-medium text-xs transition-all border-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === 'debt' 
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{isTr ? 'Ödeme (Borç / Çıkış)' : 'Payment (Debit / Out)'}</span>
                </button>
              </div>

              {/* Amount & Currency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{isTr ? 'İşlem Tutarı' : 'Amount'}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-medium text-slate-900" 
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{isTr ? 'Para Birimi' : 'Currency'}</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => {
                      const newCurr = e.target.value;
                      setFormCurrency(newCurr);
                      if (newCurr !== 'TRY') {
                        setFormExchangeRate(String(getSuggestedRate(newCurr) || 1));
                        setFormTargetCurrency('');
                        setFormCrossRate('');
                      } else {
                        setFormExchangeRate('1');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* SADECE TL İŞLEMLERİ İÇİN: Çapraz Döviz Kuru & Mahsup Bölümü */}
              {formCurrency === 'TRY' && (
                <div className="p-3 bg-gradient-to-br from-amber-50/70 via-indigo-50/30 to-slate-50 border border-amber-200/90 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-amber-950">
                      <Calculator className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>{isTr ? 'Çapraz Döviz Kuru & Mahsup' : 'Cross Currency & Offset'}</span>
                    </div>
                    {formTargetCurrency ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {formTargetCurrency} {isTr ? 'Hesabına Bağlı' : 'Linked'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500">
                        {isTr ? '(İsteğe Bağlı)' : '(Optional)'}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {isTr 
                      ? 'Dövizli (USD/EUR/GBP) cari borç veya alacağı TL ödeme ile kapatıyorsanız, mahsup edilecek döviz cinsini ve güncel kuru seçiniz. Boş bırakırsanız işlem sadece TL olarak kaydedilir.'
                      : 'If offsetting a foreign currency balance with this TL record, select the target currency and rate. If left empty, it remains a pure TL record.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-slate-600 uppercase tracking-tight">
                        {isTr ? 'Mahsup Edilecek Döviz Cinsi' : 'Target Foreign Currency'}
                      </label>
                      <select
                        value={formTargetCurrency}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormTargetCurrency(val);
                          if (val) {
                            setFormCrossRate(String(getSuggestedRate(val) || 1));
                          } else {
                            setFormCrossRate('');
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs font-medium text-slate-900 cursor-pointer"
                      >
                        <option value="">{isTr ? '— Yok (Sadece TL Kaydı) —' : '— None (Pure TL Record) —'}</option>
                        <option value="USD">USD ($) - Amerikan Doları</option>
                        <option value="EUR">EUR (€) - Euro</option>
                        <option value="GBP">GBP (£) - İngiliz Sterlini</option>
                      </select>
                    </div>

                    {formTargetCurrency ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-medium text-amber-900 uppercase tracking-tight">
                            {isTr ? `Çapraz Kur (1 ${formTargetCurrency} = ... ₺)` : `Cross Rate (1 ${formTargetCurrency} = ... TRY)`}
                          </label>
                          {branding?.currency_rates?.[formTargetCurrency] && (
                            <button
                              type="button"
                              onClick={() => setFormCrossRate(String(branding.currency_rates[formTargetCurrency]))}
                              className="text-[9px] font-medium text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                              title={isTr ? "TCMB Kurunu Getir" : "Get CBRT Rate"}
                            >
                              TCMB: {Number(branding.currency_rates[formTargetCurrency]).toFixed(2)} ₺
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          required={Boolean(formTargetCurrency)}
                          value={formCrossRate}
                          onChange={(e) => setFormCrossRate(e.target.value.replace(',', '.'))}
                          placeholder="Örn: 34.5000"
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 text-xs font-medium text-amber-950 font-mono"
                        />
                      </div>
                    ) : null}
                  </div>

                  {formTargetCurrency && parseAmount(formCrossRate) > 0 && parseAmount(formAmount) > 0 && (
                    <div className="p-2.5 bg-white border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="text-[11px] text-slate-800">
                          <span className="font-medium text-slate-900">{parseAmount(formAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="font-mono font-medium text-amber-800">{parseAmount(formCrossRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                          <span className="text-slate-400 mx-1">=</span>
                          <span className="font-medium font-mono text-emerald-700 text-xs">
                            {(parseAmount(formAmount) / parseAmount(formCrossRate)).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formTargetCurrency}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                        {formType === 'credit' 
                          ? (isTr ? `Cari ${formTargetCurrency} Borcundan Düşülecek` : `Deducts from ${formTargetCurrency} debt`) 
                          : (isTr ? `Cari ${formTargetCurrency} Alacağından Düşülecek` : `Deducts from ${formTargetCurrency} credit`)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Exchange Rate & Live TRY Preview if not TRY */}
              {formCurrency !== 'TRY' && (
                <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-medium text-indigo-900 uppercase tracking-tight">{isTr ? 'Döviz Alış Kuru (TCMB)' : 'Exchange Rate'}</label>
                    <span className="text-[10px] text-indigo-600 font-mono font-medium">
                      {formCurrency}/TRY
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      required 
                      value={formExchangeRate}
                      onChange={(e) => setFormExchangeRate(e.target.value.replace(',', '.'))}
                      className="w-32 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono" 
                      placeholder="1.0000"
                    />
                    <div className="flex-1 text-right font-mono text-[11px] font-medium text-indigo-950">
                      Karşılık: ~{(parseAmount(formAmount) * (parseAmount(formExchangeRate) || 1)).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method & Document No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-tight flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-slate-400" />
                    <span>{t.paymentMethod || (isTr ? 'Ödeme Yöntemi / Kasa' : 'Payment Method')}</span>
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="cash">{t.cash || (isTr ? 'Nakit Kasa (Elden)' : 'Cash')}</option>
                    <option value="bank">{t.bank || (isTr ? 'Banka Transferi (Havale/EFT/FAST)' : 'Bank Transfer')}</option>
                    <option value="credit_card">{t.credit_card || (isTr ? 'Kredi Kartı / POS Çekimi' : 'Credit Card / POS')}</option>
                    <option value="term">{t.term || (isTr ? 'Vadeli / Açık Hesap / Çek' : 'Term / Open Account')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-slate-500 uppercase tracking-tight flex items-center gap-1">
                    <Receipt className="h-3 w-3 text-slate-400" />
                    <span>{isTr ? 'Belge / Fiş / Dekont No' : 'Doc / Voucher No'}</span>
                  </label>
                  <input 
                    type="text" 
                    value={formDocumentNo}
                    onChange={(e) => setFormDocumentNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-semibold text-slate-900" 
                    placeholder={isTr ? "Örn: DEK-2026/041, TAH-1049" : "Receipt / ref #"}
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-tight flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>{t.statements?.date || (isTr ? 'İşlem Tarihi' : 'Transaction Date')}</span>
                </label>
                <input 
                  type="date" 
                  required 
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-medium text-slate-900 cursor-pointer" 
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{t.statements?.description || (isTr ? 'İşlem Açıklaması' : 'Description')}</label>
                <textarea 
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none text-xs text-slate-900" 
                  rows={2}
                  placeholder={isTr ? "İşlem açıklaması, banka referansı veya dekont notu..." : "Transaction notes..."}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {editingTransaction ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(isTr ? "Bu cari hesap hareketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz." : "Are you sure you want to delete this transaction?")) {
                        handleDeleteTransaction(editingTransaction.id);
                        handleCloseAddOrEditModal();
                      }
                    }}
                    className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-medium text-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isTr ? "Sil" : "Delete"}</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseAddOrEditModal}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition-all cursor-pointer"
                  >
                    {t.cancel || (isTr ? "Vazgeç" : "Cancel")}
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium tracking-wide shadow-md shadow-indigo-100 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>
                      {editingTransaction 
                        ? (isTr ? "Değişiklikleri Kaydet & Revize Et" : "Save Changes") 
                        : (t.save || (isTr ? "İşlemi Kaydet" : "Save Transaction"))}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Purchase Invoice Details Modal */}
      <PurchaseInvoiceDetailsModal 
        isOpen={showPurchaseDetails}
        onClose={() => setShowPurchaseDetails(false)}
        invoice={selectedPurchaseInvoice}
        isTr={isTr}
        handleViewHtml={handleViewPurchaseHtml}
        storeId={selectedCompany?.store_id || branding?.id}
      />

      {/* Sales Invoice Details Modal */}
      <SalesInvoiceDetailsModal 
        isOpen={showSalesDetails}
        onClose={() => setShowSalesDetails(false)}
        invoice={selectedSalesInvoice}
        isTr={isTr}
        invoiceRef={salesInvoiceRef}
        handlePrint={handlePrintSales}
        handleViewHtml={handleViewSalesHtml}
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
