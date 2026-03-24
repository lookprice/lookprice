import React, { useState, useEffect } from "react";
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form state
  const [companyId, setCompanyId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'term' | 'cash' | 'credit_card' | 'bank'>('term');
  const [currency, setCurrency] = useState(branding?.default_currency || 'TRY');
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showQuickCompanyModal, setShowQuickCompanyModal] = useState(false);
  const [quickCompanyForm, setQuickCompanyForm] = useState({ title: "", phone: "", tax_number: "" });
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ name: "", price: "", barcode: "" });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  const isTr = lang === 'tr';

  useEffect(() => {
    fetchInvoicesData();
  }, [storeId]);

  const fetchInvoicesData = async () => {
    setLoading(true);
    try {
      const [invRes, compRes, prodRes] = await Promise.all([
        fetch(`/api/store/purchase-invoices${role === 'superadmin' && storeId ? `?storeId=${storeId}` : ''}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
        api.getCompanies(false, role === 'superadmin' ? storeId : undefined),
        api.getProducts(role === 'superadmin' ? storeId : undefined)
      ]);
      
      if (invRes.ok) {
        setInvoices(await invRes.json());
      }
      setCompanies(compRes);
      setProducts(prodRes);
    } catch (error) {
      console.error("Error fetching purchase invoices data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (product: any) => {
    const existingItem = items.find(item => item.product_id === product.id);
    if (existingItem) {
      setItems(items.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: Number(item.quantity) + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        quantity: "1",
        unit_price: product.price || "0", // Default to selling price, user can change
        tax_rate: product.tax_rate !== undefined ? String(product.tax_rate) : (branding?.default_tax_rate !== undefined ? String(branding.default_tax_rate) : "20") // Default KDV
      }]);
    }
    setProductSearch("");
    setShowProductDropdown(false);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    
    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const tax = Number(item.tax_rate) || 0;
      
      const itemTotal = qty * price;
      const itemTax = itemTotal * (tax / 100);
      subtotal += itemTotal;
      taxTotal += itemTax;
    });
    
    return {
      subtotal,
      taxTotal,
      grandTotal: subtotal + taxTotal
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) {
      alert(isTr ? "Lütfen bir cari seçin" : "Please select a company");
      return;
    }
    if (items.length === 0) {
      alert(isTr ? "Lütfen en az bir ürün ekleyin" : "Please add at least one product");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetStoreId = role === 'superadmin' ? (storeId || undefined) : undefined;
      
      if (role === 'superadmin' && !storeId) {
        alert(isTr ? "Mağaza ID bulunamadı. Lütfen sayfayı yenileyin." : "Store ID not found. Please refresh the page.");
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(editingInvoiceId ? `/api/store/purchase-invoices/${editingInvoiceId}` : '/api/store/purchase-invoices', {
        method: editingInvoiceId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          storeId: targetStoreId,
          company_id: companyId,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          notes,
          items: items.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            tax_rate: Number(item.tax_rate) || 0
          })),
          payment_method: paymentMethod,
          currency
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || (isTr ? "Fatura kaydedilemedi" : "Failed to save invoice"));
      }

      await fetchInvoicesData();
      if (onSave) {
        await onSave();
      }
      
      setShowModal(false);
      setShowConfirmModal(false);
      setEditingInvoiceId(null);
      setCompanyId("");
      setCompanySearch("");
      setInvoiceNumber("");
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setNotes("");
      setItems([]);
      setPaymentMethod('term');
      setCurrency(branding?.default_currency || 'TRY');
      alert(isTr ? "Fatura başarıyla kaydedildi ve stoklar güncellendi" : "Invoice saved successfully and stock updated");
    } catch (error: any) {
      alert(error.message || (isTr ? "Fatura kaydedilirken hata oluştu" : "Error saving invoice"));
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (id: number) => {
    if (!window.confirm(isTr ? "Bu faturayı silmek istediğinize emin misiniz? Stoklar geri alınacaktır." : "Are you sure you want to delete this invoice? Stocks will be reverted.")) return;
    
    try {
      const res = await fetch(`/api/store/purchase-invoices/${id}${role === 'superadmin' && storeId ? `?storeId=${storeId}` : ''}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to delete invoice");
      fetchInvoicesData();
      if (onSave) onSave();
    } catch (error: any) {
      alert(error.message || (isTr ? "Hata oluştu" : "An error occurred"));
    }
  };

  const viewDetails = async (id: number) => {
    try {
      const res = await fetch(`/api/store/purchase-invoices/${id}${role === 'superadmin' && storeId ? `?storeId=${storeId}` : ''}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setSelectedInvoice(data);
      setShowDetailsModal(true);
    } catch (error) {
      alert(isTr ? "Hata oluştu" : "An error occurred");
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/store/purchase-invoices/${id}${role === 'superadmin' && storeId ? `?storeId=${storeId}` : ''}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      
      setEditingInvoiceId(id);
      setCompanyId(data.company_id);
      setCompanySearch(data.company_name);
      setInvoiceNumber(data.invoice_number);
      setInvoiceDate(new Date(data.invoice_date).toISOString().split('T')[0]);
      setNotes(data.notes || "");
      setPaymentMethod(data.payment_method || 'term');
      setCurrency(data.currency || 'TRY');
      setItems(data.items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
        tax_rate: String(item.tax_rate)
      })));
      setShowModal(true);
    } catch (error) {
      alert(isTr ? "Hata oluştu" : "An error occurred");
    }
  };

  const totals = calculateTotals();

  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.company_name.toLowerCase().includes(search.toLowerCase());
    
    const invDate = new Date(inv.invoice_date).toISOString().split('T')[0];
    const matchesStartDate = !startDate || invDate >= startDate;
    const matchesEndDate = !endDate || invDate <= endDate;
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalDeductibleTax = filteredInvoices.reduce((sum: number, inv: any) => sum + Number(inv.tax_amount || 0), 0);

  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.barcode.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter((c: any) => 
    c.title.toLowerCase().includes(companySearch.toLowerCase()) ||
    (c.tax_number && c.tax_number.includes(companySearch))
  );

  const exportToExcel = () => {
    const data = filteredInvoices.map((inv: any) => ({
      [isTr ? 'Tarih' : 'Date']: new Date(inv.invoice_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US'),
      [isTr ? 'Fatura No' : 'Invoice No']: inv.invoice_number,
      [isTr ? 'Cari' : 'Company']: inv.company_name,
      [isTr ? 'Tutar' : 'Amount']: inv.total_amount,
      [isTr ? 'KDV' : 'Tax']: inv.tax_amount,
      [isTr ? 'Genel Toplam' : 'Grand Total']: inv.grand_total,
      [isTr ? 'Para Birimi' : 'Currency']: inv.currency
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `purchase_invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(isTr ? "Alış Faturaları" : "Purchase Invoices", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [[
        isTr ? 'Tarih' : 'Date',
        isTr ? 'Fatura No' : 'Invoice No',
        isTr ? 'Cari' : 'Company',
        isTr ? 'Tutar' : 'Amount',
        isTr ? 'KDV' : 'Tax',
        isTr ? 'Genel Toplam' : 'Grand Total'
      ]],
      body: filteredInvoices.map((inv: any) => [
        new Date(inv.invoice_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US'),
        inv.invoice_number,
        inv.company_name,
        `${Number(inv.total_amount).toFixed(2)} ${inv.currency || 'TRY'}`,
        `${Number(inv.tax_amount).toFixed(2)} ${inv.currency || 'TRY'}`,
        `${Number(inv.grand_total).toFixed(2)} ${inv.currency || 'TRY'}`
      ])
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
      const newProduct = await api.addProduct({
        ...quickProductForm,
        price: Number(quickProductForm.price),
        currency: branding?.default_currency || 'TRY',
        stock_quantity: 0,
        status: 'active'
      }, role === 'superadmin' ? storeId : undefined);
      
      setProducts([...products, newProduct]);
      handleAddProduct(newProduct);
      setShowQuickProductModal(false);
      setQuickProductForm({ name: "", price: "", barcode: "" });
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
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="w-full md:w-44 space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isTr ? "Bitiş" : "End Date"}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">{isTr ? "Tarih" : "Date"}</th>
                <th className="p-4 font-medium">{isTr ? "Fatura No" : "Invoice No"}</th>
                <th className="p-4 font-medium">{isTr ? "Cari" : "Company"}</th>
                <th className="p-4 font-medium text-right">{isTr ? "Tutar" : "Amount"}</th>
                <th className="p-4 font-medium text-right">{isTr ? "KDV" : "Tax"}</th>
                <th className="p-4 font-medium text-right">{isTr ? "Genel Toplam" : "Grand Total"}</th>
                <th className="p-4 font-medium text-right">{isTr ? "İşlemler" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-sm text-slate-600">
                    {new Date(invoice.invoice_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {invoice.company_name}
                  </td>
                  <td className="p-4 text-sm text-slate-600 text-right">
                    {Number(invoice.total_amount).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: invoice.currency || 'TRY' })}
                  </td>
                  <td className="p-4 text-sm text-slate-600 text-right">
                    {Number(invoice.tax_amount).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: invoice.currency || 'TRY' })}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-900 text-right">
                    {Number(invoice.grand_total).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: invoice.currency || 'TRY' })}
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
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    {isTr ? "Fatura bulunamadı." : "No invoices found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      >
                        <option value="TRY">TRY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
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
                                <th className="p-3 text-xs font-medium text-slate-500 uppercase w-24">{isTr ? "KDV %" : "Tax %"}</th>
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
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full px-2 py-1.5 text-sm text-center rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_price}
                                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full pl-2 pr-8 py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{currency}</span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="relative">
                                      <input
                                        type="number"
                                        list="tax-rates"
                                        value={item.tax_rate}
                                        onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
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
                                    {((Number(item.quantity) * Number(item.unit_price)) * (1 + Number(item.tax_rate) / 100)).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: currency })}
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
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTr ? "Birim Fiyat" : "Unit Price"}</label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={item.unit_price}
                                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full pl-3 pr-8 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{currency}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isTr ? "KDV Oranı" : "Tax Rate"}</label>
                                  <input
                                    type="number"
                                    list="tax-rates-mobile"
                                    value={item.tax_rate}
                                    onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                                    {((Number(item.quantity) * Number(item.unit_price)) * (1 + Number(item.tax_rate) / 100)).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: currency })}
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
                        <span>{isTr ? "KDV Toplam:" : "Tax Total:"}</span>
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
                  ? `FATURA PARA BİRİMİNİZ = ${currency}. Bu para birimi ile kaydetmeyi onaylıyor musunuz?` 
                  : `INVOICE CURRENCY = ${currency}. Do you confirm saving with this currency?`}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setShowDetailsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileDown className="h-5 w-5 text-indigo-600" />
                  {isTr ? "Fatura Detayı" : "Invoice Details"} - #{selectedInvoice.invoice_number}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <div className="text-sm text-slate-500 mb-1">{isTr ? "Cari" : "Company"}</div>
                    <div className="font-medium text-slate-900">{selectedInvoice.company_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-1">{isTr ? "Tarih" : "Date"}</div>
                    <div className="font-medium text-slate-900">{new Date(selectedInvoice.invoice_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-3">{isTr ? "Ürünler" : "Products"}</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="p-3 text-xs font-medium text-slate-500 uppercase">{isTr ? "Ürün" : "Product"}</th>
                          <th className="p-3 text-xs font-medium text-slate-500 uppercase text-right">{isTr ? "Adet" : "Qty"}</th>
                          <th className="p-3 text-xs font-medium text-slate-500 uppercase text-right">{isTr ? "Birim Fiyat" : "Unit Price"}</th>
                          <th className="p-3 text-xs font-medium text-slate-500 uppercase text-right">{isTr ? "KDV" : "Tax"}</th>
                          <th className="p-3 text-xs font-medium text-slate-500 uppercase text-right">{isTr ? "Toplam" : "Total"}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedInvoice.items?.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="p-3">
                              <div className="font-medium text-sm text-slate-900">{item.product_name}</div>
                              <div className="text-xs text-slate-500">{item.barcode}</div>
                            </td>
                            <td className="p-3 text-right text-sm text-slate-600">{item.quantity}</td>
                            <td className="p-3 text-right text-sm text-slate-600">
                              {Number(item.unit_price).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: selectedInvoice.currency || 'TRY' })}
                            </td>
                            <td className="p-3 text-right text-sm text-slate-600">
                              %{item.tax_rate}
                            </td>
                            <td className="p-3 text-right text-sm font-medium text-slate-900">
                              {(Number(item.total_price) + Number(item.tax_amount)).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: selectedInvoice.currency || 'TRY' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-full md:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{isTr ? "Ara Toplam:" : "Subtotal:"}</span>
                      <span className="font-medium">{Number(selectedInvoice.total_amount).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: selectedInvoice.currency || 'TRY' })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{isTr ? "KDV Toplam:" : "Tax Total:"}</span>
                      <span className="font-medium">{Number(selectedInvoice.tax_amount).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: selectedInvoice.currency || 'TRY' })}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="font-bold text-slate-900">{isTr ? "Genel Toplam:" : "Grand Total:"}</span>
                      <span className="font-bold text-indigo-600 text-lg">{Number(selectedInvoice.grand_total).toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: selectedInvoice.currency || 'TRY' })}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">{isTr ? "Notlar" : "Notes"}</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}
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
