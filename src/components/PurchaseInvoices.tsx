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
import { motion } from "motion/react";
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
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
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
    tax_rate: String(branding?.default_tax_rate ?? 20),
    currency: branding?.default_currency || 'TRY'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTaxInclusive, setIsTaxInclusive] = useState(true);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [isExpense, setIsExpense] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseCenter, setExpenseCenter] = useState("");
  const [lastEditedId, setLastEditedId] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

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
        const kdvDahilPrice = Number(product.cost_price || product.price) || 0;
        let unitPrice = kdvDahilPrice / (1 + taxRate / 100);

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
          payment_status: paymentStatus,
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
      setIsTaxInclusive(data.is_tax_inclusive !== undefined ? data.is_tax_inclusive : true);
      setIsExpense(!!data.is_expense);
      setExpenseCategory(data.expense_category || "");
      setExpenseCenter(data.expense_center || "");
      setItems((data.items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: String(item.quantity || 0),
        unit_price: String(Number(item.unit_price).toFixed(2)),
        tax_rate: String(item.tax_rate || 0)
      })));
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
    const term = normalizeSearch(deferredProductSearch);
    return !term || normalizeSearch(p.name).includes(term) || (p.barcode || "").toLowerCase().includes(term);
  });

  const exportToExcel = () => {
    const data = invoices.map((inv: any) => ({
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

  const handleViewHtml = async (id: number) => {
    try {
      const res = await api.getPurchaseInvoiceHtml(id, role === 'superadmin' ? storeId : undefined);
      if (res.html) {
        setSelectedHtml(res.html);
        setShowHtmlModal(true);
      } else {
        toast.error(isTr ? "Fatura görseli bulunamadı" : "Invoice image not found");
      }
    } catch (error: any) {
      toast.error(error.message);
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
            className="p-2 bg-white border border-slate-200 text-emerald-600 rounded-xl hover:bg-slate-50 transition-all"
          >
            <FileSpreadsheet className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setEditingInvoiceId(null);
              setCompanyId("");
              setItems([]);
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
        handleViewDetails={(inv) => { setSelectedInvoice(inv); setShowDetailsModal(true); }}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
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
                    const win = window.open('', '_blank');
                    win?.document.write(selectedHtml || '');
                    win?.document.close();
                  }}
                  className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  {isTr ? "Yazdır" : "Print"}
                </button>
                <button onClick={() => setShowHtmlModal(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-all">
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-8">
              <div className="bg-white shadow-lg mx-auto w-fit p-1" dangerouslySetInnerHTML={{ __html: selectedHtml || '' }} />
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
    </div>
  );
}
