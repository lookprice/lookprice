import { toast } from "sonner";
import React, { useState, useEffect, useDeferredValue } from "react";
import { 
  Plus, 
  Search, 
  FileDown, 
  Calendar, 
  FileSpreadsheet, 
  FileText, 
  CloudDownload, 
  Printer, 
  Loader2,
  X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { normalizeSearch } from "../lib/searchUtils";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { PurchaseInvoiceStats } from "./dashboard/invoices/purchase/PurchaseInvoiceStats";
import { PurchaseInvoiceTable } from "./dashboard/invoices/purchase/PurchaseInvoiceTable";
import { PurchaseInvoiceFormModal } from "./dashboard/invoices/purchase/PurchaseInvoiceFormModal";
import { PurchaseInvoiceDetailsModal } from "./dashboard/invoices/purchase/PurchaseInvoiceDetailsModal";
import { QuickProductModal } from "./dashboard/invoices/sales/QuickProductModal";
import { calculateInvoiceTotals } from "../lib/invoiceUtils";

export default function PurchaseInvoices({ storeId: initialStoreId, currentStoreId, role, lang, api, branding, onSave }: any) {
  const storeId = initialStoreId || currentStoreId;
  const isTr = lang === 'tr';

  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Form state
  const [companyId, setCompanyId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [waybillNumber, setWaybillNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const deferredProductSearch = useDeferredValue(productSearch);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'term' | 'cash' | 'credit_card' | 'bank'>('term');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [currency, setCurrency] = useState(branding?.default_currency || 'TRY');
  const [exchangeRate, setExchangeRate] = useState("1");
  const [companySearch, setCompanySearch] = useState("");
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ 
    name: "", 
    price: "", 
    barcode: "", 
    category: "",
    sub_category: "",
    tax_rate: String(branding?.default_tax_rate ?? 20),
    currency: branding?.default_currency || 'TRY'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [isExpense, setIsExpense] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseCenter, setExpenseCenter] = useState("");
  const [lastEditedId, setLastEditedId] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [purchaseHtmlLoading, setPurchaseHtmlLoading] = useState(false);
  const [purchaseIframeReady, setPurchaseIframeReady] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [activeSearch, startDate, endDate]);

  useEffect(() => {
    fetchInvoicesData(activeSearch, startDate, endDate);
  }, [storeId, activeSearch, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => setActiveSearch(search), 600);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchInvoicesData = async (searchStr?: string, sDate?: string, eDate?: string, silent = false) => {
    if (role === 'superadmin' && !storeId) return;
    if (!silent) setLoading(true);
    try {
      const targetStoreId = role === 'superadmin' ? storeId : undefined;
      const [invRes, compRes, prodRes] = await Promise.all([
        api.getPurchaseInvoices(targetStoreId, searchStr, sDate || startDate, eDate || endDate),
        api.getCompanies(false, targetStoreId),
        api.getProducts("", targetStoreId)
      ]);
      setInvoices(Array.isArray(invRes) ? invRes : []);
      setCompanies(Array.isArray(compRes) ? compRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch (error) {
      console.error("Error fetching purchase invoices data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: any) => {
    const productCurrency = product.currency || branding?.default_currency || 'TRY';
    const targetCurrency = items.length === 0 ? productCurrency : currency;
    if (items.length === 0 && productCurrency !== currency) {
      setCurrency(productCurrency);
      setExchangeRate("1");
    }
    setItems((prevItems) => {
      const existingItem = prevItems.find(item => item.product_id === product.id);
      if (existingItem) {
        return prevItems.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: String(Math.floor(Number(item.quantity) + 1)) }
            : item
        );
      } else {
        const taxRate = Math.floor(Number(product.tax_rate ?? branding?.default_tax_rate ?? 20));
        // cost_price is stored as EXCLUSIVE in DB.
        const costPriceExcl = Number(product.cost_price || product.price) || 0;
        let unitPrice = isTaxInclusive ? (costPriceExcl * (1 + taxRate / 100)) : costPriceExcl;

        if (productCurrency !== targetCurrency) {
          const rates = branding?.currency_rates || {};
          const fromRate = rates[productCurrency] || 1;
          const toRate = rates[targetCurrency] || 1;
          unitPrice = (unitPrice * fromRate) / toRate;
        }

        return [...prevItems, {
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          quantity: "1",
          unit_price: unitPrice.toFixed(2),
          tax_rate: String(taxRate)
        }];
      }
    });
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      if (field === 'tax_rate') {
        newItems[index][field] = value.replace(/[^0-9]/g, '').substring(0, 2);
      } else if (field === 'quantity') {
        newItems[index][field] = value.replace(/[^0-9]/g, '');
      } else {
        newItems[index][field] = value;
      }
      return newItems;
    });
  };

  const removeItem = (index: number) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingInvoiceId(null);
    setCompanyId("");
    setCompanySearch("");
    setInvoiceNumber("");
    setWaybillNumber("");
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setNotes("");
    setItems([]);
    setProductSearch("");
    setPaymentMethod('term');
    setPaymentStatus('unpaid');
    setCurrency(branding?.default_currency || 'TRY');
    setExchangeRate("1");
    setIsTaxInclusive(false);
    setIsExpense(false);
    setExpenseCategory("");
    setExpenseCenter("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      toast.error(isTr ? "Lütfen bir cari seçin" : "Please select a company");
      return;
    }
    if (items.length === 0) {
      toast.error(isTr ? "Lütfen en az bir ürün ekleyin" : "Please add at least one product");
      return;
    }

    setIsSubmitting(true);
    const savePromise = (async () => {
      try {
        const payload = {
          storeId: role === 'superadmin' ? storeId : undefined,
          company_id: companyId,
          invoice_number: invoiceNumber,
          waybill_number: waybillNumber,
          invoice_date: invoiceDate,
          notes,
          items: items.map(item => ({
            ...item,
            quantity: Number(String(item.quantity).replace(',', '.')) || 0,
            unit_price: Number(String(item.unit_price).replace(',', '.')) || 0,
            tax_rate: Number(String(item.tax_rate).replace(',', '.')) || 0
          })),
          payment_method: paymentMethod,
          payment_status: paymentMethod !== 'term' ? 'paid' : paymentStatus,
          currency,
          exchange_rate: Number(exchangeRate) || 1,
          is_tax_inclusive: isTaxInclusive,
          is_expense: isExpense,
          expense_category: expenseCategory,
          expense_center: expenseCenter
        };

        const res = editingInvoiceId 
          ? await api.updatePurchaseInvoice(editingInvoiceId, payload, payload.storeId)
          : await api.addPurchaseInvoice(payload, payload.storeId);

        if (res.error) throw new Error(res.error);
        setShowModal(false);
        setLastEditedId(editingInvoiceId || res.id);
        await fetchInvoicesData(undefined, undefined, undefined, true);
        if (onSave) await onSave(true);
        resetForm();
        return res;
      } finally {
        setIsSubmitting(false);
      }
    })();

    toast.promise(savePromise, {
      loading: isTr ? "Fatura kaydediliyor..." : "Saving invoice...",
      success: isTr ? "Fatura başarıyla kaydedildi" : "Invoice saved successfully",
      error: (err) => err.message || (isTr ? "Fatura kaydedilirken hata oluştu" : "Error saving invoice")
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(isTr ? "Bu faturayı silmek istediğinize emin misiniz?" : "Are you sure?")) return;
    try {
      const res = await api.deletePurchaseInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (res.error) throw new Error(res.error);
      toast.success(isTr ? "Fatura silindi" : "Invoice deleted");
      fetchInvoicesData();
      if (onSave) onSave(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const data = await api.getPurchaseInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (data.error) throw new Error(data.error);
      setEditingInvoiceId(id);
      setCompanyId(data.company_id);
      setCompanySearch(data.company_name || "");
      setInvoiceNumber(data.invoice_number);
      setWaybillNumber(data.waybill_number || "");
      setInvoiceDate(new Date(data.invoice_date).toISOString().split('T')[0]);
      setNotes(data.notes || "");
      setPaymentMethod(data.payment_method || 'term');
      setPaymentStatus(data.payment_status || 'unpaid');
      setCurrency(data.currency || 'TRY');
      setExchangeRate(String(data.exchange_rate || 1));
      const editIsTaxIncl = data.is_tax_inclusive !== undefined ? data.is_tax_inclusive : false;
      setIsTaxInclusive(editIsTaxIncl);
      setIsExpense(!!data.is_expense);
      setExpenseCategory(data.expense_category || "");
      setExpenseCenter(data.expense_center || "");
      setItems((data.items || []).map((item: any) => {
        const up = Number(item.unit_price) || 0;
        const tr = Number(item.tax_rate) || 0;
        const displayPrice = editIsTaxIncl ? (up * (1 + tr / 100)) : up;
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          barcode: item.barcode,
          quantity: String(item.quantity || 0),
          unit_price: String(displayPrice.toFixed(2)),
          tax_rate: String(item.tax_rate || 0)
        };
      }));
      setShowModal(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateTicariStatus = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    if (!window.confirm(isTr ? `Bu faturayı ${status === 'APPROVED' ? 'onaylamak' : 'reddetmek'} istediğinize emin misiniz?` : `Confirm ${status}?`)) return;
    try {
      const res = await api.updatePurchaseInvoiceTicariStatus(id, status, role === 'superadmin' ? storeId : undefined);
      if (res.error) throw new Error(res.error);
      toast.success(isTr ? "Durum güncellendi" : "Status updated");
      await fetchInvoicesData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdatePaymentStatus = async (id: number, status: 'paid' | 'unpaid') => {
    try {
      const res = await api.updatePurchaseInvoicePaymentStatus(id, status);
      if (res.error) throw new Error(res.error);
      toast.success(isTr ? "Ödeme durumu güncellendi" : "Payment status updated");
      await fetchInvoicesData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const totals = calculateInvoiceTotals(items, isTaxInclusive);

  const totalDeductibleTax = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.tax_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalPurchaseAmount = invoices.filter((i:any)=>!i.is_expense).reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalExpenseAmount = invoices.filter((i:any)=>i.is_expense).reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalGrandTotal = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.grand_total || 0) * (Number(inv.exchange_rate) || 1)), 0);

  const filteredProducts = products.filter((p: any) => {
    const searchTerms = normalizeSearch(deferredProductSearch).split(/\s+/).filter(Boolean);
    if (searchTerms.length === 0) return true;
    
    return searchTerms.every(term => 
      normalizeSearch(p.name).includes(term) || 
      (p.barcode || "").toLowerCase().includes(term) ||
      (p.brand || "").toLowerCase().includes(term) ||
      (p.description || "").toLowerCase().includes(term)
    );
  });

  const exportToExcel = () => {
    const targetInvoices = selectedIds.length > 0 
      ? invoices.filter((i: any) => selectedIds.includes(i.id))
      : invoices;

    if (selectedIds.length > 0) {
      toast.success(isTr ? `Seçili ${selectedIds.length} fatura Excel'e aktarılıyor...` : `Exporting ${selectedIds.length} selected invoices...`);
    }

    const data = targetInvoices.map((inv: any) => ({
      [isTr ? 'Tarih' : 'Date']: new Date(inv.invoice_date).toLocaleDateString('tr-TR'),
      [isTr ? 'Fatura No' : 'Invoice No']: inv.invoice_number,
      [isTr ? 'Satıcı' : 'Supplier']: inv.company_name,
      [isTr ? 'Matrah' : 'Subtotal']: Number(inv.total_amount),
      [isTr ? 'KDV' : 'VAT']: Number(inv.tax_amount),
      [isTr ? 'Toplam' : 'Total']: Number(inv.grand_total),
      [isTr ? 'Para Birimi' : 'Currency']: inv.currency
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Invoices");
    XLSX.writeFile(wb, `alis_faturalari_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleBulkPrint = () => {
    if (selectedIds.length === 0) return;
    setIsBulkPrinting(true);
    toast.info(isTr ? "Toplu yazdırma hazırlanıyor..." : "Preparing bulk print...");
    setTimeout(() => {
      window.print();
      setIsBulkPrinting(false);
    }, 1000);
  };

  const handleSyncInbox = async () => {
    setSyncing(true);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const res = await api.syncIncomingEInvoices(start.toISOString().split('T')[0], end.toISOString().split('T')[0], role === 'superadmin' ? storeId : undefined);
      if (res.error) throw new Error(res.error);
      toast.success(isTr ? `${res.importedCount} yeni fatura sisteme alındı!` : `${res.importedCount} new invoices imported!`);
      await fetchInvoicesData();
    } catch (error: any) {
       toast.error(error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = async (inv: any) => {
    try {
      const data = await api.getPurchaseInvoice(inv.id, role === 'superadmin' ? storeId : undefined);
      if (data.error) throw new Error(data.error);
      setSelectedInvoice(data);
      setShowDetailsModal(true);
      if (inv.is_read === false) {
        await api.markPurchaseInvoiceRead(inv.id, role === 'superadmin' ? storeId : undefined);
        fetchInvoicesData(activeSearch, startDate, endDate, true);
      }
    } catch (error: any) {
      toast.error(isTr ? "Fatura detayları yüklenemedi." : "Could not load invoice details.");
      console.error(error);
    }
  };

  const handleViewHtml = async (id: number, inv?: any) => {
    setPurchaseHtmlLoading(true);
    setPurchaseIframeReady(false);
    setShowHtmlModal(true);
    try {
      const res = await api.getPurchaseInvoiceHtml(id, role === 'superadmin' ? storeId : undefined);
      if (res.html) {
        setSelectedHtml(res.html);
      } else {
        toast.error(isTr ? "Fatura görseli bulunamadı" : "Invoice image not found");
        setShowHtmlModal(false);
      }
      if (inv && inv.is_read === false) {
        await api.markPurchaseInvoiceRead(id, role === 'superadmin' ? storeId : undefined);
        fetchInvoicesData(activeSearch, startDate, endDate, true);
      }
    } catch (error: any) {
      toast.error(error.message);
      setShowHtmlModal(false);
    } finally {
      setPurchaseHtmlLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileDown className="h-6 w-6 text-indigo-600" />
            {isTr ? "Alış Faturaları" : "Purchase Invoices"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isTr ? "Tedarikçilerden gelen faturaları girin ve stoklarınızı güncelleyin." : "Enter invoices from suppliers and update your stock."}
          </p>
        </div>
      </div>

      <PurchaseInvoiceStats 
        isTr={isTr}
        totalDeductibleTax={totalDeductibleTax}
        totalPurchaseAmount={totalPurchaseAmount}
        totalExpenseAmount={totalExpenseAmount}
        totalGrandTotal={totalGrandTotal}
        branding={branding}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 flex flex-wrap items-center gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={isTr ? "Fatura No veya Cari ara..." : "Search invoice no or company..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {branding?.einvoice_settings?.is_active && (
            <button 
              onClick={handleSyncInbox}
              disabled={syncing}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold transition-all hover:bg-indigo-100 disabled:opacity-50"
            >
              <CloudDownload className={`h-4 w-4 inline mr-2 ${syncing ? 'animate-bounce' : ''}`} />
              {isTr ? "Senkronize Et" : "Sync"}
            </button>
          )}
          <button
            onClick={exportToExcel}
            className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all text-xs font-black flex items-center gap-2 shadow-sm"
            title={isTr ? "Excel'e Aktar" : "Export to Excel"}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">{isTr ? "Excel (XLS)" : "Excel (XLS)"}</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {isTr ? "Fatura Ekle" : "Add Invoice"}
          </button>
        </div>
      </div>

      <PurchaseInvoiceTable 
        invoices={invoices.slice((page - 1) * itemsPerPage, page * itemsPerPage)}
        loading={loading}
        isTr={isTr}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        lastEditedId={lastEditedId}
        handleViewDetails={handleViewDetails}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleViewHtml={handleViewHtml}
        handleUpdateTicariStatus={handleUpdateTicariStatus}
        handleUpdatePaymentStatus={handleUpdatePaymentStatus}
        page={page}
        totalPages={Math.ceil(invoices.length / itemsPerPage)}
        setPage={setPage}
      />

      <PurchaseInvoiceFormModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isTr={isTr}
        editingInvoiceId={editingInvoiceId}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        companies={companies}
        companyId={companyId}
        setCompanyId={setCompanyId}
        companySearch={companySearch}
        setCompanySearch={setCompanySearch}
        invoiceNumber={invoiceNumber}
        setInvoiceNumber={setInvoiceNumber}
        waybillNumber={waybillNumber}
        setWaybillNumber={setWaybillNumber}
        invoiceDate={invoiceDate}
        setInvoiceDate={setInvoiceDate}
        isExpense={isExpense}
        setIsExpense={setIsExpense}
        expenseCategory={expenseCategory}
        setExpenseCategory={setExpenseCategory}
        expenseCenter={expenseCenter}
        setExpenseCenter={setExpenseCenter}
        isTaxInclusive={isTaxInclusive}
        setIsTaxInclusive={setIsTaxInclusive}
        items={items}
        updateItem={updateItem}
        removeItem={removeItem}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        showProductDropdown={showProductDropdown}
        setShowProductDropdown={setShowProductDropdown}
        filteredProducts={filteredProducts}
        handleAddProduct={handleAddProduct}
        setShowQuickProductModal={setShowQuickProductModal}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        currency={currency}
        setCurrency={setCurrency}
        exchangeRate={exchangeRate}
        setExchangeRate={setExchangeRate}
        notes={notes}
        setNotes={setNotes}
        totals={totals}
        branding={branding}
      />

      <PurchaseInvoiceDetailsModal 
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        invoice={selectedInvoice}
        isTr={isTr}
        handleViewHtml={handleViewHtml}
      />

      {showHtmlModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900">{isTr ? "Fatura Önizleme" : "Invoice Preview"}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const iframe = document.getElementById('purchase-invoice-iframe') as HTMLIFrameElement;
                    if (iframe?.contentWindow) {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    }
                  }}
                  className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  {isTr ? "Yazdır" : "Print"}
                </button>
                <button onClick={() => setShowHtmlModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="relative flex-1 overflow-auto bg-slate-100 p-8 flex justify-center">
              {(purchaseHtmlLoading || !purchaseIframeReady) && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-xs gap-4 z-10 transition-opacity duration-300">
                   <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                   <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">{isTr ? 'Görsel Hazırlanıyor...' : 'Preparing Preview...'}</p>
                 </div>
              )}
              <iframe 
                id="purchase-invoice-iframe"
                srcDoc={selectedHtml || ''} 
                onLoad={() => setPurchaseIframeReady(true)}
                className={`w-full h-full bg-white shadow-lg rounded-2xl min-h-[60vh] border-0 p-4 transition-opacity duration-300 ${
                  purchaseIframeReady && !purchaseHtmlLoading ? 'opacity-100' : 'opacity-0'
                }`}
                title="Invoice HTML Preview" 
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      )}

      <QuickProductModal 
        isOpen={showQuickProductModal}
        onClose={() => setShowQuickProductModal(false)}
        isTr={isTr}
        quickProductForm={quickProductForm}
        setQuickProductForm={setQuickProductForm}
        handleQuickProductSubmit={async (e) => {
           e.preventDefault();
           try {
             const res = await api.addProduct({ ...quickProductForm, stock_quantity: 0, status: 'active' }, role === 'superadmin' ? storeId : undefined);
             setProducts(p => [...p, res]);
             handleAddProduct(res);
             setShowQuickProductModal(false);
           } catch(err) { toast.error("Hata"); }
        }}
      />

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130] bg-slate-900 border border-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-black">{selectedIds.length}</span>
              <span className="text-sm font-bold text-slate-300">{isTr ? "Seçili Fatura" : "Selected Invoices"}</span>
            </div>
            <div className="h-5 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkPrint}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                {isTr ? "SEÇİLENLERİ YAZDIR" : "PRINT SELECTED"}
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {isTr ? "EXCEL AKTAR" : "EXPORT EXCEL"}
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden container that is only displayed during @media print printing */}
      {isBulkPrinting && (
        <div id="print-invoice-wrapper" className="print-section bg-white text-slate-900 font-sans p-6">
          {invoices.filter((inv: any) => selectedIds.includes(inv.id)).map((invoice: any, idx: number) => (
            <div key={invoice.id} className="mb-12 border-b-2 border-dashed border-slate-300 pb-12" style={{ pageBreakAfter: 'always' }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">{branding?.store_name || "Seçkin Mağaza"}</h1>
                  <p className="text-xs text-slate-500 mt-1">{isTr ? 'Alış Faturası' : 'Purchase Invoice'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{invoice.invoice_number}</p>
                  <p className="text-xs text-slate-500">{new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">{isTr ? 'SATICI (TEDARİKÇİ)' : 'SUPPLIER'}</p>
                  <p className="font-bold text-slate-800 text-sm">{invoice.company_name}</p>
                  {invoice.tax_number && <p className="text-slate-500 mt-1">{isTr ? "VKN/TCKN:" : "Tax ID:"} {invoice.tax_number}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">{isTr ? 'FATURA DETAYI' : 'DETAILS'}</p>
                  <p className="text-slate-600"><span className="font-bold">{isTr ? 'Para Birimi:' : 'Currency:'}</span> {invoice.currency}</p>
                  <p className="text-slate-600"><span className="font-bold">{isTr ? 'Ödeme Yöntemi:' : 'Payment:'}</span> {invoice.payment_method === 'cash' ? (isTr ? 'Nakit' : 'Cash') : (isTr ? 'Vadeli' : 'Term')}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-200 mb-8">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <th className="p-2 border border-slate-200">{isTr ? 'Ürün/Hizmet' : 'Product/Service'}</th>
                    <th className="p-2 border border-slate-200 text-center">{isTr ? 'Miktar' : 'Qty'}</th>
                    <th className="p-2 border border-slate-200 text-right">{isTr ? 'Birim Fiyat' : 'Price'}</th>
                    <th className="p-2 border border-slate-200 text-center">{isTr ? 'KDV %' : 'VAT %'}</th>
                    <th className="p-2 border border-slate-200 text-right">{isTr ? 'Toplam' : 'Total'}</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-2 border border-slate-200 font-medium">{item.product_name}</td>
                      <td className="p-2 border border-slate-200 text-center">{item.quantity}</td>
                      <td className="p-2 border border-slate-200 text-right">{Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</td>
                      <td className="p-2 border border-slate-200 text-center">%{item.tax_rate}</td>
                      <td className="p-2 border border-slate-200 text-right font-bold">{(Number(item.quantity) * Number(item.unit_price) * (1 + Number(item.tax_rate) / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-start text-xs">
                <div className="max-w-md italic text-slate-500">
                  {invoice.notes && <p className="mb-2"><span className="font-bold">{isTr ? 'Not:' : 'Note:'}</span> {invoice.notes}</p>}
                </div>
                <div className="w-64 space-y-1.5 text-right font-semibold">
                  <div className="flex justify-between text-slate-500">
                    <span>{isTr ? 'Ara Toplam' : 'Subtotal'}</span>
                    <span>{Number(invoice.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>{isTr ? 'KDV Toplam' : 'VAT Total'}</span>
                    <span>{Number(invoice.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 text-indigo-600">
                    <span>{isTr ? 'Genel Toplam' : 'Grand Total'}</span>
                    <span>{Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
