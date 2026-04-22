import { toast } from "sonner";
import React, { useState, useEffect, useDeferredValue } from "react";
import { Plus, Search, Trash2, FileDown, Eye, X, Save, Calendar, Building2, Hash, Package, CreditCard, Percent, FileSpreadsheet, FileText, CheckCircle2, Edit } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PurchaseInvoices({ storeId, role, lang, api, branding, onSave }: any) {
  const [invoices, setInvoices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
  const [currency, setCurrency] = useState(branding?.default_currency || 'TRY');
  const [exchangeRate, setExchangeRate] = useState("1");
  const [companySearch, setCompanySearch] = useState("");
  const deferredCompanySearch = useDeferredValue(companySearch);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showQuickCompanyModal, setShowQuickCompanyModal] = useState(false);
  const [quickCompanyForm, setQuickCompanyForm] = useState({ title: "", phone: "", tax_number: "" });
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ name: "", price: "", barcode: "", tax_rate: String(branding?.default_tax_rate ?? 20) });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  const isTr = lang === 'tr';

  useEffect(() => {
    fetchInvoicesData();
  }, [storeId]);

  const fetchInvoicesData = async () => {
    if (role === 'superadmin' && !storeId) return;
    setLoading(true);
    try {
      const targetStoreId = role === 'superadmin' ? storeId : undefined;
      const [invRes, compRes, prodRes] = await Promise.all([
        api.getPurchaseInvoices(targetStoreId),
        api.getCompanies(false, targetStoreId),
        api.getProducts("", targetStoreId)
      ]);
      
      setInvoices(Array.isArray(invRes) ? invRes : []);
      setCompanies(Array.isArray(compRes) ? compRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch (error) {
      console.error("Error fetching purchase invoices data:", error);
      setInvoices([]);
      setCompanies([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: any) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(item => item.product_id === product.id);
      if (existingItem) {
        return prevItems.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: String(Math.floor(Number(item.quantity) + 1)) }
            : item
        );
      } else {
        const taxRateStr = product.tax_rate !== undefined ? String(Math.floor(Number(product.tax_rate))) : (branding?.default_tax_rate !== undefined ? String(Math.floor(Number(branding.default_tax_rate))) : "20");
        const taxRate = Number(taxRateStr);
        const kdvDahilPrice = Number(product.cost_price || product.price) || 0;
        const kdvHaricPrice = kdvDahilPrice / (1 + taxRate / 100);

        return [...prevItems, {
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          quantity: "1",
          unit_price: kdvHaricPrice.toFixed(2),
          tax_rate: taxRateStr
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

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    
    items.forEach(item => {
      const qty = Number(String(item.quantity).replace(',', '.')) || 0;
      const price = Number(String(item.unit_price).replace(',', '.')) || 0;
      const tax = Math.floor(Number(String(item.tax_rate).replace(',', '.')) || 0);
      
      const itemTotal = qty * price;
      const itemTax = itemTotal * (tax / 100);
      subtotal += itemTotal;
      taxTotal += itemTax;
    });
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal: Number((subtotal + taxTotal).toFixed(2))
    };
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

    const targetStoreId = role === 'superadmin' ? (storeId || undefined) : undefined;
    if (role === 'superadmin' && !storeId) {
      toast.error(isTr ? "Mağaza ID bulunamadı. Lütfen sayfayı yenileyin." : "Store ID not found. Please refresh the page.");
      return;
    }

    // Capture state values
    const currentItems = [...items];
    const currentCompanyId = companyId;
    const currentInvoiceNumber = invoiceNumber;
    const currentWaybillNumber = waybillNumber;
    const currentInvoiceDate = invoiceDate;
    const currentNotes = notes;
    const currentPaymentMethod = paymentMethod;
    const currentCurrency = currency;
    const currentExchangeRate = exchangeRate;
    const currentEditingId = editingInvoiceId;

    if (currentCurrency !== (branding?.default_currency || 'TRY')) {
      const rate = Number(currentExchangeRate);
      if (!rate || rate <= 0 || isNaN(rate) || currentExchangeRate === '1') {
        toast.error(isTr ? "Farklı para birimi için geçerli bir döviz kuru girmelisiniz" : "You must enter a valid exchange rate for a different currency");
        return;
      }
    }

    // Reset form and close modal immediately
    setShowModal(false);
    setShowConfirmModal(false);
    setEditingInvoiceId(null);
    setCompanyId("");
    setCompanySearch("");
    setInvoiceNumber("");
    setWaybillNumber("");
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setNotes("");
    setItems([]);
    setPaymentMethod('term');
    setCurrency(branding?.default_currency || 'TRY');
    setExchangeRate("1");

    const savePromise = (async () => {
      const payload = {
        storeId: targetStoreId,
        company_id: currentCompanyId,
        invoice_number: currentInvoiceNumber,
        waybill_number: currentWaybillNumber,
        invoice_date: currentInvoiceDate,
        notes: currentNotes,
        items: currentItems.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0
        })),
        payment_method: currentPaymentMethod,
        currency: currentCurrency,
        exchange_rate: Number(currentExchangeRate) || 1
      };

      const res = currentEditingId 
        ? await api.updatePurchaseInvoice(currentEditingId, payload, targetStoreId)
        : await api.addPurchaseInvoice(payload, targetStoreId);

      if (res.error) {
        throw new Error(res.error);
      }

      await fetchInvoicesData();
      if (onSave) await onSave();
      return res;
    })();

    toast.promise(savePromise, {
      loading: isTr ? "Fatura kaydediliyor..." : "Saving invoice...",
      success: isTr ? "Fatura başarıyla kaydedildi" : "Invoice saved successfully",
      error: (err) => err.message || (isTr ? "Fatura kaydedilirken hata oluştu" : "Error saving invoice")
    });
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm(isTr ? "Bu faturayı silmek istediğinize emin misiniz? Stoklar geri alınacaktır." : "Are you sure you want to delete this invoice? Stocks will be reverted.")) return;
    
    try {
      const res = await api.deletePurchaseInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (res.error) throw new Error(res.error);
      toast.success(isTr ? "Fatura silindi" : "Invoice deleted");
      fetchInvoicesData();
      if (onSave) onSave();
    } catch (error: any) {
      toast.error(error.message || (isTr ? "Hata oluştu" : "An error occurred"));
    }
  };

  const viewDetails = async (id: number) => {
    try {
      const data = await api.getPurchaseInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (data.error) throw new Error(data.error);
      setSelectedInvoice(data);
      setShowDetailsModal(true);
    } catch (error: any) {
      toast.error(error.message || (isTr ? "Hata oluştu" : "An error occurred"));
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const data = await api.getPurchaseInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (data.error) throw new Error(data.error);
      
      setEditingInvoiceId(id);
      setCompanyId(data.company_id);
      setCompanySearch(data.company_name);
      setInvoiceNumber(data.invoice_number);
      setWaybillNumber(data.waybill_number || "");
      setInvoiceDate(new Date(data.invoice_date).toISOString().split('T')[0]);
      setNotes(data.notes || "");
      setPaymentMethod(data.payment_method || 'term');
      setCurrency(data.currency || 'TRY');
      setExchangeRate(String(data.exchange_rate || 1));
      setItems((data.items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: String(Math.floor(Number(item.quantity) || 0)),
        unit_price: String(item.unit_price),
        tax_rate: String(Math.floor(Number(item.tax_rate) || 0))
      })));
      setShowModal(true);
    } catch (error: any) {
      toast.error(error.message || (isTr ? "Hata oluştu" : "An error occurred"));
    }
  };

  const totals = calculateTotals();

  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesSearch = (inv.invoice_number || "").toLowerCase().includes(deferredSearch.toLowerCase()) ||
      (inv.company_name || "").toLowerCase().includes(deferredSearch.toLowerCase());
    
    const invDate = new Date(inv.invoice_date).toISOString().split('T')[0];
    const matchesStartDate = !startDate || invDate >= startDate;
    const matchesEndDate = !endDate || invDate <= endDate;
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const paginatedInvoices = filteredInvoices.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const totalDeductibleTax = filteredInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.tax_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalPurchaseAmount = filteredInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalGrandTotal = filteredInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.grand_total || 0) * (Number(inv.exchange_rate) || 1)), 0);

  const filteredProducts = products.filter((p: any) => 
    (p.name || "").toLowerCase().includes(deferredProductSearch.toLowerCase()) ||
    (p.barcode || "").toLowerCase().includes(deferredProductSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter((c: any) => 
    (c.title || "").toLowerCase().includes(deferredCompanySearch.toLowerCase()) ||
    (c.tax_number && c.tax_number.includes(deferredCompanySearch))
  );

  const exportToExcel = () => {
    const data = filteredInvoices.map((inv: any) => ({
      [isTr ? 'Tarih' : 'Date']: new Date(inv.invoice_date).toLocaleDateString('tr-TR'),
      [isTr ? 'Fatura No' : 'Invoice No']: inv.invoice_number,
      [isTr ? 'İrsaliye No' : 'Waybill No']: inv.waybill_number || '',
      [isTr ? 'Satıcı' : 'Supplier']: inv.company_name,
      [isTr ? 'Vergi No' : 'Tax No']: inv.tax_number || '',
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    const fixTr = (text: string) => {
      if (!text) return "";
      return text
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "Alış Faturaları Raporu" : "Purchase Invoices Report"), 14, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${isTr ? "Tarih:" : "Date:"} ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [[
        fixTr(isTr ? 'Tarih' : 'Date'),
        fixTr(isTr ? 'Fatura No' : 'Invoice No'),
        fixTr(isTr ? 'Cari' : 'Company'),
        fixTr(isTr ? 'Tutar' : 'Amount'),
        fixTr(isTr ? 'KDV' : 'VAT'),
        fixTr(isTr ? 'Genel Toplam' : 'Grand Total')
      ]],
      body: filteredInvoices.map((inv: any) => [
        new Date(inv.invoice_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US'),
        inv.invoice_number,
        fixTr(inv.company_name),
        `${Number(inv.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${inv.currency || 'TRY'}`,
        `${Number(inv.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${inv.currency || 'TRY'}`,
        `${Number(inv.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${inv.currency || 'TRY'}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 8, font: "helvetica" }
    });
    doc.save(`purchase_invoices_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleQuickCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addCompany(quickCompanyForm, role === 'superadmin' ? storeId : undefined);
      setCompanies([...companies, res]);
      setCompanyId(res.id);
      setCompanySearch(res.title);
      setShowQuickCompanyModal(false);
      setQuickCompanyForm({ title: "", phone: "", tax_number: "" });
    } catch (error: any) {
      alert(error.message || (isTr ? "Hata oluştu" : "An error occurred"));
    }
  };

  const handleQuickProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const normalizeText = (text: string) => text ? text.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase() : '';
      const productNameLower = normalizeText(quickProductForm.name);
      let matchedRule = branding?.category_tax_rules?.find((r: any) => productNameLower.includes(normalizeText(r.category)));
      
      let taxRate = branding?.default_tax_rate !== undefined ? Number(branding.default_tax_rate) : 20;
      let category = '';

      if (matchedRule) {
        taxRate = matchedRule.taxRate;
        category = matchedRule.category;
      } else if (productNameLower.includes('kitap')) {
        taxRate = 0;
        category = 'Kitap';
      }

      const price = Number(quickProductForm.price);
      const currency = branding?.default_currency || 'TRY';
      const price_2 = price / (1 + taxRate / 100);

      const newProduct = await api.addProduct({
        ...quickProductForm,
        price,
        price_2,
        currency,
        price_2_currency: currency,
        tax_rate: taxRate,
        stock_quantity: 0,
        status: 'active',
        category: category
      }, role === 'superadmin' ? storeId : undefined);
      
      setProducts(prev => [...prev, newProduct]);
      handleAddProduct(newProduct);
      setShowQuickProductModal(false);
      setQuickProductForm({ name: "", price: "", barcode: "", tax_rate: String(branding?.default_tax_rate ?? 20) });
    } catch (error) {
      alert(isTr ? "Hata oluştu" : "An error occurred");
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

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
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => {
              setEditingInvoiceId(null);
              setCompanyId("");
              setCompanySearch("");
              setInvoiceNumber("");
              setInvoiceDate(new Date().toISOString().split('T')[0]);
              setNotes("");
              setItems([]);
              setPaymentMethod('term');
              setCurrency(branding?.default_currency || 'TRY');
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {isTr ? "Yeni Fatura" : "New Invoice"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Percent className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{isTr ? "Toplanan İndirilecek Vergi" : "Total Deductible Tax"}</p>
            <p className="text-2xl font-black text-slate-900">
              {totalDeductibleTax.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: branding?.default_currency || 'TRY' })}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{isTr ? "Toplam Alış Matrahı" : "Total Purchase Subtotal"}</p>
            <p className="text-2xl font-black text-slate-900">
              {totalPurchaseAmount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: branding?.default_currency || 'TRY' })}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <CreditCard className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{isTr ? "Toplam Genel Toplam" : "Total Grand Total"}</p>
            <p className="text-2xl font-black text-slate-900">
              {totalGrandTotal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: branding?.default_currency || 'TRY' })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isTr ? "Arama" : "Search"}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={isTr ? "Fatura No veya Cari ara..." : "Search invoice no or company..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="w-full md:w-44 space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isTr ? "Başlangıç" : "Start Date"}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[16ch] px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="w-full md:w-44 space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isTr ? "Bitiş" : "End Date"}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[16ch] px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => { setStartDate(""); setEndDate(""); setSearch(""); }}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            {isTr ? "Temizle" : "Clear"}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="p-4 font-bold">{isTr ? "Tarih" : "Date"}</th>
                <th className="p-4 font-bold">{isTr ? "Fatura No" : "Inv No"}</th>
                <th className="p-4 font-bold">{isTr ? "İrsaliye No" : "Waybill"}</th>
                <th className="p-4 font-bold">{isTr ? "Satıcı" : "Supplier"}</th>
                <th className="p-4 font-bold">{isTr ? "Vergi No" : "Tax No"}</th>
                <th className="p-4 font-bold text-right">{isTr ? "Matrah" : "Subtotal"}</th>
                <th className="p-4 font-bold text-right">{isTr ? "KDV" : "VAT"}</th>
                <th className="p-4 font-bold text-right">{isTr ? "Toplam" : "Total"}</th>
                <th className="p-4 font-bold text-center">{isTr ? "Döviz" : "Curr"}</th>
                <th className="p-4 font-bold text-right">{isTr ? "İşlemler" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedInvoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs text-slate-600 whitespace-nowrap">
                    {new Date(invoice.invoice_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {invoice.waybill_number || '-'}
                  </td>
                  <td className="p-4 text-xs font-medium text-slate-700">
                    {invoice.company_name}
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {invoice.tax_number || '-'}
                  </td>
                  <td className="p-4 text-xs text-slate-600 text-right font-medium">
                    {Number(invoice.total_amount).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-xs text-slate-600 text-right font-medium">
                    {Number(invoice.tax_amount).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-900 text-right">
                    {Number(invoice.grand_total).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-4 text-xs text-slate-500 text-center font-bold">
                    {invoice.currency}
                  </td>
                  <td className="p-4 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => viewDetails(invoice.id)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title={isTr ? "Görüntüle" : "View"}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(invoice.id)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title={isTr ? "Revize Et" : "Revise"}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title={isTr ? "Sil" : "Delete"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {isTr ? "Fatura bulunamadı." : "No invoices found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              {filteredInvoices.length} {isTr ? 'fatura' : 'invoices'}
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                {isTr ? 'Önceki' : 'Prev'}
              </button>
              <div className="text-xs font-bold text-slate-600 tabular-nums">
                {page} <span className="text-slate-300 mx-1">/</span> {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all"
              >
                {isTr ? 'Sonraki' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Invoice Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-indigo-600" />
                  {editingInvoiceId 
                    ? (isTr ? "Fatura Revize Et" : "Revise Invoice")
                    : (isTr ? "Yeni Alış Faturası" : "New Purchase Invoice")
                  }
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {isTr ? "Cari (Tedarikçi)" : "Company (Supplier)"} *
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder={isTr ? "Cari ara..." : "Search company..."}
                          value={companySearch}
                          onChange={(e) => {
                            setCompanySearch(e.target.value);
                            setShowCompanyDropdown(true);
                            if (!e.target.value) setCompanyId("");
                          }}
                          onFocus={() => setShowCompanyDropdown(true)}
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        />
                        {showCompanyDropdown && companySearch && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {filteredCompanies.map((c: any) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setCompanyId(c.id);
                                  setCompanySearch(c.title);
                                  setShowCompanyDropdown(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex flex-col"
                              >
                                <span className="font-medium text-slate-900">{c.title}</span>
                                {c.tax_number && <span className="text-xs text-slate-500">{c.tax_number}</span>}
                              </button>
                            ))}
                            {filteredCompanies.length === 0 && (
                              <div className="p-4 text-center">
                                <p className="text-sm text-slate-500 mb-2">{isTr ? "Cari bulunamadı" : "Company not found"}</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setQuickCompanyForm(prev => ({ ...prev, title: companySearch }));
                                    setShowQuickCompanyModal(true);
                                    setShowCompanyDropdown(false);
                                  }}
                                  className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center justify-center gap-1 w-full"
                                >
                                  <Plus className="h-4 w-4" />
                                  {isTr ? "Yeni Cari Ekle" : "Add New Company"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Hash className="h-4 w-4 text-slate-400" />
                        {isTr ? "Fatura No" : "Invoice No"} *
                      </label>
                      <input
                        type="text"
                        required
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        {isTr ? "İrsaliye No" : "Waybill No"}
                      </label>
                      <input
                        type="text"
                        value={waybillNumber}
                        onChange={(e) => setWaybillNumber(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {isTr ? "Fatura Tarihi" : "Invoice Date"} *
                      </label>
                      <input
                        type="date"
                        required
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Percent className="h-4 w-4 text-slate-400" />
                        {isTr ? "Para Birimi" : "Currency"} *
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={currency}
                          onChange={(e) => {
                            setCurrency(e.target.value);
                            if (e.target.value === (branding?.default_currency || 'TRY')) {
                              setExchangeRate("1");
                            }
                          }}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        >
                          <option value="TRY">TRY</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                        {currency !== (branding?.default_currency || 'TRY') && (
                          <input
                            type="text"
                            placeholder={isTr ? "Kur" : "Rate"}
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value.replace(',', '.'))}
                            className="w-24 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <Package className="h-4 w-4 text-indigo-600" />
                        {isTr ? "Ürünler" : "Products"}
                      </h4>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder={isTr ? "Ürün ara ve ekle..." : "Search and add product..."}
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                      {showProductDropdown && productSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {filteredProducts.map((p: any) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleAddProduct(p)}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium text-slate-900">{p.name}</div>
                                <div className="text-xs text-slate-500">{p.barcode}</div>
                              </div>
                              <div className="text-sm font-medium text-indigo-600">
                                {Number(p.price).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: p.currency || 'TRY' })}
                              </div>
                            </button>
                          ))}
                          {filteredProducts.length === 0 && (
                            <div className="p-4 text-center">
                              <p className="text-sm text-slate-500 mb-2">{isTr ? "Ürün bulunamadı" : "Product not found"}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickProductForm(prev => ({ ...prev, name: productSearch }));
                                  setShowQuickProductModal(true);
                                  setShowProductDropdown(false);
                                }}
                                className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center justify-center gap-1 w-full"
                              >
                                <Plus className="h-4 w-4" />
                                {isTr ? "Hızlı Ürün Ekle" : "Quick Add Product"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {items.length > 0 && (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Desktop Table View */}
                        <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-3 text-xs font-medium text-slate-500 uppercase">{isTr ? "Ürün" : "Product"}</th>
                                <th className="p-3 text-xs font-medium text-slate-500 uppercase w-24 text-center">{isTr ? "Adet" : "Qty"}</th>
                                <th className="p-3 text-xs font-medium text-slate-500 uppercase w-36">{isTr ? "Birim Fiyat" : "Unit Price"}</th>
                                <th className="p-3 text-xs font-medium text-slate-500 uppercase w-24">{isTr ? "KDV %" : "VAT %"}</th>
                                <th className="p-3 text-xs font-medium text-slate-500 uppercase w-36 text-right">{isTr ? "Toplam" : "Total"}</th>
                                <th className="p-3 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {items.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3">
                                    <div className="font-medium text-sm text-slate-900">{item.product_name}</div>
                                    <div className="text-xs text-slate-500">{item.barcode}</div>
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={item.quantity}
                                      onKeyDown={(e) => {
                                        if (e.key === '.' || e.key === ',') e.preventDefault();
                                      }}
                                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full px-2 py-1.5 text-sm text-center rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full pl-2 pr-8 py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{currency?.slice(0, 3)}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="relative">
                                      <input
                                        type="text"
                                        list="tax-rates"
                                        value={Math.floor(Number(item.tax_rate) || 0)}
                                        onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-[8ch] px-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                      />
                                      <datalist id="tax-rates">
                                        <option value="0" />
                                        <option value="1" />
                                        <option value="10" />
                                        <option value="20" />
                                      </datalist>
                                    </div>
                                  </td>
                                  <td className="p-3 text-right text-sm font-bold text-slate-900">
                                    {( (Number(String(item.quantity).replace(',', '.')) * Number(String(item.unit_price).replace(',', '.'))) * (1 + Number(String(item.tax_rate).replace(',', '.')) / 100) ).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: currency })}
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => removeItem(index)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                          {items.map((item, index) => (
                            <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <h5 className="font-bold text-slate-900 leading-tight">{item.product_name}</h5>
                                  <p className="text-xs text-slate-500 mt-0.5">{item.barcode}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTr ? "Miktar" : "Quantity"}</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={item.quantity}
                                    onKeyDown={(e) => {
                                      if (e.key === '.' || e.key === ',') e.preventDefault();
                                    }}
                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTr ? "Birim Fiyat" : "Unit Price"}</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={item.unit_price}
                                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{currency?.slice(0, 3)}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTr ? "KDV Oranı" : "VAT Rate"}</label>
                                  <input
                                    type="text"
                                    list="tax-rates-mobile"
                                    value={Math.floor(Number(item.tax_rate) || 0)}
                                    onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-[8ch] px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                  <datalist id="tax-rates-mobile">
                                    <option value="0" />
                                    <option value="1" />
                                    <option value="10" />
                                    <option value="20" />
                                  </datalist>
                                </div>
                                <div className="space-y-1 flex flex-col justify-end items-end">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTr ? "Satır Toplamı" : "Line Total"}</label>
                                  <div className="text-lg font-black text-indigo-600">
                                    {( (Number(String(item.quantity).replace(',', '.')) * Number(String(item.unit_price).replace(',', '.'))) * (1 + Number(String(item.tax_rate).replace(',', '.')) / 100) ).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: currency })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">
                          {isTr ? "Ödeme Yöntemi" : "Payment Method"}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('term')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                              paymentMethod === 'term' 
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isTr ? "Vadeli (Ödenmedi)" : "Term (Unpaid)"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                              paymentMethod === 'cash' 
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isTr ? "Nakit" : "Cash"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('credit_card')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                              paymentMethod === 'credit_card' 
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isTr ? "Kredi Kartı" : "Credit Card"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bank')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                              paymentMethod === 'bank' 
                                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-600' 
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isTr ? "Banka / EFT" : "Bank Transfer"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1.5">
                          {isTr ? "Notlar" : "Notes"}
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                    
                    <div className="w-full md:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>{isTr ? "Ara Toplam:" : "Subtotal:"}</span>
                        <span className="font-medium">{totals.subtotal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: currency })}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>{isTr ? "KDV Toplam:" : "VAT Total:"}</span>
                        <span className="font-medium">{totals.taxTotal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: currency })}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                        <span className="font-bold text-slate-900">{isTr ? "Genel Toplam:" : "Grand Total:"}</span>
                        <span className="font-bold text-indigo-600 text-lg">{totals.grandTotal.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: currency })}</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                >
                  {isTr ? "İptal" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!companyId) {
                      alert(isTr ? "Lütfen bir cari seçin" : "Please select a company");
                      return;
                    }
                    if (items.length === 0) {
                      alert(isTr ? "Lütfen en az bir ürün ekleyin" : "Please add at least one product");
                      return;
                    }
                    setShowConfirmModal(true);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingInvoiceId ? (isTr ? "Güncelle" : "Update") : (isTr ? "Kaydet" : "Save")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                {isTr ? "Faturayı Onaylıyor musunuz?" : "Confirm Invoice?"}
              </h3>
              <p className="text-slate-600 mb-6">
                {isTr 
                  ? `FATURA PARA BİRİMİNİZ = ${currency?.slice(0, 3)}. Bu para birimi ile kaydetmeyi onaylıyor musunuz?` 
                  : `INVOICE CURRENCY = ${currency?.slice(0, 3)}. Do you confirm saving with this currency?`}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isTr ? "Vazgeç" : "Cancel"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {editingInvoiceId ? (isTr ? "Evet, Güncelle" : "Yes, Update") : (isTr ? "Evet, Onaylıyorum" : "Yes, I Confirm")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-auto overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900">{isTr ? 'Fatura Detayı' : 'Invoice Details'}</h3>
                <button 
                  onClick={() => setShowDetailsModal(false)} 
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'Tedarikçi' : 'Supplier'}</p>
                    <p className="text-lg font-bold text-slate-900">{selectedInvoice.company_name}</p>
                    <p className="text-sm text-slate-500">{selectedInvoice.company_address}</p>
                    <p className="text-sm text-slate-500">{selectedInvoice.company_phone}</p>
                    <p className="text-sm text-slate-500">{selectedInvoice.tax_number}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'Fatura Bilgileri' : 'Invoice Info'}</p>
                    <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Fatura No:' : 'Inv No:'}</span> {selectedInvoice.invoice_number}</p>
                    <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Tarih:' : 'Date:'}</span> {new Date(selectedInvoice.invoice_date).toLocaleDateString('tr-TR')}</p>
                    <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Para Birimi:' : 'Currency:'}</span> {selectedInvoice.currency} {selectedInvoice.exchange_rate !== 1 && `(Kur: ${selectedInvoice.exchange_rate})`}</p>
                    <p className="text-sm text-slate-600"><span className="font-bold">{isTr ? 'Ödeme:' : 'Payment:'}</span> {selectedInvoice.payment_method}</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">{isTr ? 'Ürün' : 'Product'}</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">{isTr ? 'Miktar' : 'Qty'}</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">{isTr ? 'Birim Fiyat' : 'Unit Price'}</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">{isTr ? 'KDV %' : 'VAT %'}</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">{isTr ? 'Toplam' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedInvoice.items || []).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-900">{item.product_name}</div>
                            <div className="text-xs text-slate-400">{item.barcode}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 text-center">{Math.floor(Number(item.quantity))}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 text-right">
                            {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedInvoice.currency}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 text-center">%{item.tax_rate}</td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-900 text-right">
                            {(Number(item.total_price) + Number(item.tax_amount)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedInvoice.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex-1">
                    {selectedInvoice.notes && (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">{isTr ? 'NOTLAR' : 'NOTES'}</p>
                        <p className="text-sm text-slate-700">{selectedInvoice.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{isTr ? 'Ara Toplam' : 'Subtotal'}</span>
                      <span className="font-medium">{Number(selectedInvoice.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedInvoice.currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{isTr ? 'KDV Toplam' : 'VAT Total'}</span>
                      <span className="font-medium">{Number(selectedInvoice.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedInvoice.currency}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2">
                      <span>{isTr ? 'Genel Toplam' : 'Grand Total'}</span>
                      <span className="text-indigo-600">{Number(selectedInvoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedInvoice.currency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Quick Add Company Modal */}
      <AnimatePresence>
        {showQuickCompanyModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowQuickCompanyModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  {isTr ? "Hızlı Cari Ekle" : "Quick Add Company"}
                </h3>
                <button
                  onClick={() => setShowQuickCompanyModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleQuickCompanySubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Firma Ünvanı" : "Company Title"} *</label>
                  <input
                    type="text"
                    required
                    value={quickCompanyForm.title}
                    onChange={(e) => setQuickCompanyForm({ ...quickCompanyForm, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Telefon" : "Phone"}</label>
                  <input
                    type="text"
                    value={quickCompanyForm.phone}
                    onChange={(e) => setQuickCompanyForm({ ...quickCompanyForm, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Vergi No" : "Tax Number"}</label>
                  <input
                    type="text"
                    value={quickCompanyForm.tax_number}
                    onChange={(e) => setQuickCompanyForm({ ...quickCompanyForm, tax_number: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowQuickCompanyModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    {isTr ? "İptal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                  >
                    {isTr ? "Kaydet" : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Product Modal */}
      <AnimatePresence>
        {showQuickProductModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowQuickProductModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-indigo-600" />
                  {isTr ? "Hızlı Ürün Ekle" : "Quick Add Product"}
                </h3>
                <button
                  onClick={() => setShowQuickProductModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleQuickProductSubmit} className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Ürün Adı" : "Product Name"} *</label>
                  <input
                    type="text"
                    required
                    value={quickProductForm.name}
                    onChange={(e) => setQuickProductForm({ ...quickProductForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Barkod" : "Barcode"}</label>
                  <input
                    type="text"
                    value={quickProductForm.barcode}
                    onChange={(e) => setQuickProductForm({ ...quickProductForm, barcode: e.target.value })}
                    maxLength={14}
                    className="w-[22ch] px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "KDV %" : "Tax %"}</label>
                  <input
                    type="number"
                    value={quickProductForm.tax_rate}
                    onChange={(e) => setQuickProductForm({ ...quickProductForm, tax_rate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{isTr ? "Satış Fiyatı" : "Selling Price"} *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quickProductForm.price}
                    onChange={(e) => setQuickProductForm({ ...quickProductForm, price: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowQuickProductModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    {isTr ? "İptal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                  >
                    {isTr ? "Kaydet" : "Save"}
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
