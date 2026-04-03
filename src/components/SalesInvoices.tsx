import React, { useState, useEffect, useDeferredValue } from "react";
import { Plus, Search, Trash2, FileDown, Eye, X, Save, Calendar, User as UserIcon, Hash, Package, CreditCard, Percent, FileSpreadsheet, FileText, CheckCircle2, Edit, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SalesInvoices({ storeId, role, lang, api, branding, onSave }: any) {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
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
  const [customerId, setCustomerId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [waybillNumber, setWaybillNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const deferredProductSearch = useDeferredValue(productSearch);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'term' | 'cash' | 'credit_card' | 'bank'>('cash');
  const [currency, setCurrency] = useState(branding?.default_currency || 'TRY');
  const [status, setStatus] = useState<'draft' | 'approved' | 'cancelled'>('draft');
  
  const selectedCompany = companies.find((c: any) => c.id === Number(companyId));
  const selectedCustomer = customers.find((c: any) => c.id === Number(customerId));
  
  const [customerSearch, setCustomerSearch] = useState("");
  const deferredCustomerSearch = useDeferredValue(customerSearch);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  // New states for customer/company info update
  const [editTaxNumber, setEditTaxNumber] = useState("");
  const [editTaxOffice, setEditTaxOffice] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const isTr = lang === 'tr';

  const numberToTurkishWords = (number: number) => {
    const units = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
    const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
    const thousands = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

    const convertThreeDigits = (n: number) => {
      let str = "";
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const u = n % 10;

      if (h > 0) {
        str += (h === 1 ? "" : units[h]) + "Yüz";
      }
      if (t > 0) {
        str += tens[t];
      }
      if (u > 0) {
        str += units[u];
      }
      return str;
    };

    if (number === 0) return "Sıfır";

    const parts = number.toFixed(2).split(".");
    const integerPart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);

    let result = "";
    let tempInteger = integerPart;
    let i = 0;

    if (tempInteger === 0) {
      result = "Sıfır";
    } else {
      while (tempInteger > 0) {
        const threeDigits = tempInteger % 1000;
        if (threeDigits > 0) {
          let partStr = convertThreeDigits(threeDigits);
          if (i === 1 && threeDigits === 1) partStr = ""; 
          result = partStr + thousands[i] + result;
        }
        tempInteger = Math.floor(tempInteger / 1000);
        i++;
      }
    }

    result += "TL";

    if (decimalPart > 0) {
      result += convertThreeDigits(decimalPart) + "Kr";
    }

    return result;
  };

  useEffect(() => {
    if (selectedCompany) {
      setEditTaxNumber(selectedCompany.tax_number || "");
      setEditTaxOffice(selectedCompany.tax_office || "");
      setEditAddress(selectedCompany.address || "");
      setIsNewCustomer(false);
    } else if (selectedCustomer) {
      setEditTaxNumber(selectedCustomer.tax_number || "");
      setEditTaxOffice(selectedCustomer.tax_office || "");
      setEditAddress(selectedCustomer.address || "");
      setIsNewCustomer(false);
    } else if (isNewCustomer) {
      // Keep manual entries
    } else {
      setEditTaxNumber("");
      setEditTaxOffice("");
      setEditAddress("");
    }
  }, [companyId, customerId, isNewCustomer]);

  useEffect(() => {
    fetchInvoicesData();
  }, [storeId]);

  const fetchInvoicesData = async () => {
    if (role === 'superadmin' && !storeId) return;
    setLoading(true);
    try {
      const [invRes, custRes, compRes, prodRes] = await Promise.all([
        api.getSalesInvoices(role === 'superadmin' ? storeId : undefined),
        api.getCustomers(role === 'superadmin' ? storeId : undefined),
        api.getCompanies(false, role === 'superadmin' ? storeId : undefined),
        api.getProducts("", role === 'superadmin' ? storeId : undefined)
      ]);
      
      setInvoices(Array.isArray(invRes) ? invRes : []);
      setCustomers(Array.isArray(custRes) ? custRes : []);
      setCompanies(Array.isArray(compRes) ? compRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch (error) {
      console.error("Error fetching sales invoices data:", error);
      setInvoices([]);
      setCustomers([]);
      setCompanies([]);
      setProducts([]);
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
        unit_price: product.price || "0",
        tax_rate: product.tax_rate !== undefined ? String(product.tax_rate) : (branding?.default_tax_rate !== undefined ? String(branding.default_tax_rate) : "20")
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
    if (!customerId && !companyId && !isNewCustomer) {
      alert(isTr ? "Lütfen bir müşteri veya cari seçin" : "Please select a customer or company");
      return;
    }
    if (items.length === 0) {
      alert(isTr ? "Lütfen en az bir ürün ekleyin" : "Please add at least one product");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetStoreId = role === 'superadmin' ? (storeId || undefined) : undefined;
      
      // Handle new customer creation or existing update if needed
      let finalCustomerId = customerId;
      let finalCompanyId = companyId;

      if (isNewCustomer && customerSearch) {
        // Create a new company (defaulting to company for tax info)
        const newComp = await api.addCompany({
          title: customerSearch,
          tax_number: editTaxNumber,
          tax_office: editTaxOffice,
          address: editAddress,
          store_id: targetStoreId
        }, targetStoreId);
        finalCompanyId = newComp.id;
      } else if (companyId && (editTaxNumber !== selectedCompany?.tax_number || editTaxOffice !== selectedCompany?.tax_office || editAddress !== selectedCompany?.address)) {
        // Update existing company
        await api.updateCompany(companyId, {
          ...selectedCompany,
          tax_number: editTaxNumber,
          tax_office: editTaxOffice,
          address: editAddress
        }, targetStoreId);
      } else if (customerId && (editTaxNumber !== selectedCustomer?.tax_number || editTaxOffice !== selectedCustomer?.tax_office || editAddress !== selectedCustomer?.address)) {
        // Update existing customer
        await api.updateCustomer(customerId, {
          ...selectedCustomer,
          tax_number: editTaxNumber,
          tax_office: editTaxOffice,
          address: editAddress
        }, targetStoreId);
      }

      const payload = {
        storeId: targetStoreId,
        customer_id: finalCustomerId || null,
        company_id: finalCompanyId || null,
        invoice_number: invoiceNumber,
        waybill_number: waybillNumber,
        invoice_date: invoiceDate,
        notes,
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0
        })),
        payment_method: paymentMethod,
        currency,
        status
      };

      const res = editingInvoiceId 
        ? await api.updateSalesInvoice(editingInvoiceId, payload, targetStoreId)
        : await api.addSalesInvoice(payload, targetStoreId);

      if (res.error) {
        throw new Error(res.error);
      }

      await fetchInvoicesData();
      if (onSave) await onSave();
      
      setShowModal(false);
      setEditingInvoiceId(null);
      setCustomerId("");
      setCompanyId("");
      setCustomerSearch("");
      setInvoiceNumber("");
      setWaybillNumber("");
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setNotes("");
      setItems([]);
      setPaymentMethod('cash');
      setCurrency(branding?.default_currency || 'TRY');
      setStatus('draft');
      setIsNewCustomer(false);
      setEditTaxNumber("");
      setEditTaxOffice("");
      setEditAddress("");
      alert(isTr ? "Fatura başarıyla kaydedildi" : "Invoice saved successfully");
    } catch (error: any) {
      alert(error.message || (isTr ? "Fatura kaydedilirken hata oluştu" : "Error saving invoice"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(isTr ? "Bu faturayı silmek istediğinize emin misiniz? Stoklar geri alınacaktır." : "Are you sure you want to delete this invoice? Stocks will be reverted.")) return;
    
    try {
      const res = await api.deleteSalesInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (!res.error) {
        await fetchInvoicesData();
        alert(isTr ? "Fatura silindi" : "Invoice deleted");
      } else {
        alert(res.error || "Error deleting invoice");
      }
    } catch (error) {
      alert("Error deleting invoice");
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const data = await api.getSalesInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (data.error) throw new Error(data.error);
      
      setEditingInvoiceId(id);
      setCustomerId(data.customer_id || "");
      setCompanyId(data.company_id || "");
      setCustomerSearch(data.customer_name || data.company_name || "");
      setInvoiceNumber(data.invoice_number);
      setWaybillNumber(data.waybill_number || "");
      setInvoiceDate(new Date(data.invoice_date).toISOString().split('T')[0]);
      setNotes(data.notes || "");
      setPaymentMethod(data.payment_method || 'cash');
      setCurrency(data.currency || 'TRY');
      setStatus(data.status || 'draft');
      setItems((data.items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
        tax_rate: String(item.tax_rate)
      })));
      setShowModal(true);
    } catch (error: any) {
      alert(error.message || (isTr ? "Hata oluştu" : "An error occurred"));
    }
  };

  const handleExportExcel = () => {
    const data = filteredInvoices.map((inv: any) => ({
      [isTr ? 'Tarih' : 'Date']: new Date(inv.invoice_date).toLocaleDateString('tr-TR'),
      [isTr ? 'Fatura No' : 'Invoice No']: inv.invoice_number,
      [isTr ? 'İrsaliye No' : 'Waybill No']: inv.waybill_number || '',
      [isTr ? 'Müşteri / Cari' : 'Customer / Company']: inv.customer_name || inv.company_title || '-',
      [isTr ? 'Vergi No' : 'Tax No']: inv.tax_number || '',
      [isTr ? 'Matrah' : 'Subtotal']: Number(inv.total_amount),
      [isTr ? 'KDV' : 'Tax']: Number(inv.tax_amount),
      [isTr ? 'Toplam' : 'Total']: Number(inv.grand_total),
      [isTr ? 'Para Birimi' : 'Currency']: inv.currency,
      [isTr ? 'Durum' : 'Status']: inv.status === 'approved' ? (isTr ? 'Onaylandı' : 'Approved') : (inv.status === 'cancelled' ? (isTr ? 'İptal' : 'Cancelled') : (isTr ? 'Taslak' : 'Draft'))
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Invoices");
    XLSX.writeFile(wb, `satis_faturalari_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = (invoice: any) => {
    const doc = new jsPDF();
    const isTr = lang === 'tr';
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(isTr ? "SATIŞ FATURASI" : "SALES INVOICE", 105, 25, { align: 'center' });
    
    // Store Info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(branding?.store_name || 'LookPrice', 20, 45);
    doc.setFontSize(8);
    doc.text(branding?.address || '-', 20, 50, { maxWidth: 80 });
    doc.text(`${isTr ? 'Tel' : 'Phone'}: ${branding?.phone || '-'}`, 20, 60);
    
    // Invoice Info
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`${isTr ? "Fatura No" : "Invoice No"}:`, 140, 45);
    doc.setFontSize(12);
    doc.text(invoice.invoice_number, 140, 52);
    
    doc.setFontSize(10);
    doc.text(`${isTr ? "Tarih" : "Date"}:`, 140, 62);
    doc.setFontSize(12);
    doc.text(new Date(invoice.invoice_date).toLocaleDateString('tr-TR'), 140, 69);
    
    // Customer Info
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(20, 80, 170, 40, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(isTr ? "SAYIN (MÜŞTERİ / CARİ)" : "BILL TO", 25, 88);
    
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    const customerName = invoice.customer_name || invoice.company_title || '-';
    doc.text(customerName, 25, 96);
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    if (invoice.company_id) {
      doc.text(`${isTr ? 'V.D.' : 'Tax Office'}: ${invoice.tax_office || '-'}`, 25, 104);
      doc.text(`${isTr ? 'V.N.' : 'Tax No'}: ${invoice.tax_number || '-'}`, 25, 109);
    }
    doc.text(invoice.customer_address || invoice.company_address || '-', 25, 115, { maxWidth: 160 });
    
    // Items Table
    const tableData = invoice.items.map((item: any) => [
      item.product_name,
      item.quantity,
      Number(item.unit_price).toLocaleString('tr-TR'),
      Number(item.tax_rate).toLocaleString('tr-TR') + "%",
      Number(item.total_price).toLocaleString('tr-TR')
    ]);
    
    autoTable(doc, {
      startY: 130,
      head: [[isTr ? 'Ürün' : 'Product', isTr ? 'Adet' : 'Qty', isTr ? 'Birim Fiyat' : 'Unit Price', isTr ? 'KDV' : 'Tax', isTr ? 'Toplam' : 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Totals
    const totalsX = 140;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(isTr ? "Ara Toplam" : "Subtotal", totalsX, finalY + 15);
    doc.text(isTr ? "KDV Toplam" : "Tax Total", totalsX, finalY + 22);
    
    doc.setTextColor(30, 41, 59);
    doc.text(`${Number(invoice.total_amount).toLocaleString('tr-TR')} ${invoice.currency}`, 190, finalY + 15, { align: 'right' });
    doc.text(`${Number(invoice.tax_amount).toLocaleString('tr-TR')} ${invoice.currency}`, 190, finalY + 22, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229); // indigo-600
    doc.text(isTr ? "GENEL TOPLAM" : "GRAND TOTAL", totalsX, finalY + 35);
    doc.text(`${Number(invoice.grand_total).toLocaleString('tr-TR')} ${invoice.currency}`, 190, finalY + 35, { align: 'right' });
    
    // Notes
    if (invoice.notes) {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(isTr ? "NOTLAR:" : "NOTES:", 20, finalY + 50);
      doc.text(invoice.notes, 20, finalY + 55, { maxWidth: 100 });
    }
    
    // Footer / Signature
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(isTr ? "Bu belge elektronik ortamda oluşturulmuştur." : "This document was generated electronically.", 105, 285, { align: 'center' });
    
    doc.save(`fatura_${invoice.invoice_number}.pdf`);
  };

  const filteredInvoices = invoices.filter((inv: any) => {
    const matchesSearch = 
      inv.invoice_number?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      inv.company_title?.toLowerCase().includes(deferredSearch.toLowerCase());
    
    const invDate = new Date(inv.invoice_date);
    const matchesStartDate = !startDate || invDate >= new Date(startDate);
    const matchesEndDate = !endDate || invDate <= new Date(endDate);
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const paginatedInvoices = filteredInvoices.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const filteredCustomers = customers.filter((c: any) => 
    c.name?.toLowerCase().includes(deferredCustomerSearch.toLowerCase()) ||
    c.phone?.toLowerCase().includes(deferredCustomerSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter((c: any) => 
    c.title?.toLowerCase().includes(deferredCustomerSearch.toLowerCase()) ||
    c.tax_number?.toLowerCase().includes(deferredCustomerSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p: any) => 
    p.name?.toLowerCase().includes(deferredProductSearch.toLowerCase()) ||
    p.barcode?.toString().includes(deferredProductSearch)
  );

  const totals = calculateTotals();

  return (
    <>
      <div className="space-y-6">
        {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 flex flex-wrap items-center gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={isTr ? "Fatura no, müşteri ara..." : "Search invoice, customer..."}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input 
              type="date" 
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportExcel}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Excel
          </button>
          <button 
            onClick={() => {
              setEditingInvoiceId(null);
              setCustomerId("");
              setCompanyId("");
              setCustomerSearch("");
              setInvoiceNumber("");
              setInvoiceDate(new Date().toISOString().split('T')[0]);
              setNotes("");
              setItems([]);
              setShowModal(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" />
            {isTr ? "Yeni Satış Faturası" : "New Sales Invoice"}
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Tarih' : 'Date'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Fatura No' : 'Invoice No'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'İrsaliye No' : 'Waybill No'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Müşteri / Cari' : 'Customer / Company'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Vergi No' : 'Tax No'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'Matrah' : 'Subtotal'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'KDV' : 'Tax'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'Toplam' : 'Total'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{isTr ? 'Döviz' : 'Curr'}</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'İşlemler' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                    {isTr ? "Fatura bulunamadı" : "No invoices found"}
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {new Date(inv.invoice_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-900">#{inv.invoice_number}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{inv.payment_method}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {inv.waybill_number || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {inv.company_id ? <Building2 className="h-3.5 w-3.5 text-indigo-500" /> : <UserIcon className="h-3.5 w-3.5 text-slate-400" />}
                        <div className="text-sm font-bold text-slate-700">{inv.customer_name || inv.company_title || '-'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {inv.tax_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-bold text-slate-700">
                        {Number(inv.total_amount).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-bold text-slate-600">
                        {Number(inv.tax_amount).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-black text-slate-900">
                        {Number(inv.grand_total).toLocaleString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs font-black text-slate-400">
                      {inv.currency}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(inv.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => { setSelectedInvoice(inv); setShowDetailsModal(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleExportPDF(inv)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Prev
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl my-auto overflow-hidden border border-slate-200"
            >
              <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                        {editingInvoiceId ? (isTr ? "Faturayı Düzenle" : "Edit Invoice") : (isTr ? "Yeni Satış Faturası" : "New Sales Invoice")}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                        {isTr ? "RESMİ SATIŞ BELGESİ OLUŞTUR" : "CREATE OFFICIAL SALES DOCUMENT"}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors">
                    <X className="h-6 w-6 text-slate-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Customer Selection & Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Müşteri / Cari Seçimi' : 'Customer / Company Selection'}</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input 
                          type="text"
                          placeholder={isTr ? "Müşteri veya Cari ara..." : "Search customer or company..."}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                        />
                        
                        {showCustomerDropdown && (customerSearch || (filteredCustomers.length > 0 || filteredCompanies.length > 0)) && (
                          <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2">
                            {customerSearch && !filteredCustomers.some(c => c.name === customerSearch) && !filteredCompanies.some(c => c.title === customerSearch) && (
                              <button
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-3 group border-b border-slate-100 mb-2"
                                onClick={() => {
                                  setIsNewCustomer(true);
                                  setCustomerId("");
                                  setCompanyId("");
                                  setShowCustomerDropdown(false);
                                }}
                              >
                                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                                  <Plus className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-emerald-700">{isTr ? `Yeni Kayıt: "${customerSearch}"` : `New Record: "${customerSearch}"`}</div>
                                  <div className="text-[10px] text-emerald-500 font-medium">{isTr ? 'Yeni cari olarak ekle' : 'Add as new company'}</div>
                                </div>
                              </button>
                            )}
                            {filteredCustomers.length > 0 && (
                              <div className="mb-2">
                                <p className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'BİREYSEL MÜŞTERİLER' : 'INDIVIDUAL CUSTOMERS'}</p>
                                {filteredCustomers.map((c: any) => (
                                  <button
                                    key={`cust-${c.id}`}
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-3 group"
                                    onClick={() => {
                                      setCustomerId(c.id);
                                      setCompanyId("");
                                      setCustomerSearch(c.name);
                                      setShowCustomerDropdown(false);
                                    }}
                                  >
                                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                      <UserIcon className="h-4 w-4 text-slate-500 group-hover:text-indigo-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-700">{c.name}</div>
                                      <div className="text-[10px] text-slate-400 font-medium">{c.phone}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            {filteredCompanies.length > 0 && (
                              <div>
                                <p className="px-3 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'KURUMSAL CARİLER' : 'CORPORATE COMPANIES'}</p>
                                {filteredCompanies.map((c: any) => (
                                  <button
                                    key={`comp-${c.id}`}
                                    type="button"
                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-3 group"
                                    onClick={() => {
                                      setCompanyId(c.id);
                                      setCustomerId("");
                                      setCustomerSearch(c.title);
                                      setShowCustomerDropdown(false);
                                    }}
                                  >
                                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                      <Building2 className="h-4 w-4 text-slate-500 group-hover:text-indigo-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-700">{c.title}</div>
                                      <div className="text-[10px] text-slate-400 font-medium">{c.tax_number}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            {filteredCustomers.length === 0 && filteredCompanies.length === 0 && (
                              <div className="p-4 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                {isTr ? "Sonuç bulunamadı" : "No results found"}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Fatura No' : 'Invoice Number'}</label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input 
                            type="text"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            placeholder="INV-2024-001"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'İrsaliye No' : 'Waybill Number'}</label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input 
                            type="text"
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                            value={waybillNumber}
                            onChange={(e) => setWaybillNumber(e.target.value)}
                            placeholder="IRS-2024-001"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Fatura Tarihi' : 'Invoice Date'}</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input 
                            type="date"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                            value={invoiceDate}
                            onChange={(e) => setInvoiceDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Fatura Durumu' : 'Invoice Status'}</label>
                        <div className="relative">
                          <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <select 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none"
                            value={status}
                            onChange={(e: any) => setStatus(e.target.value)}
                          >
                            <option value="draft">{isTr ? "Taslak" : "Draft"}</option>
                            <option value="approved">{isTr ? "Onaylandı" : "Approved"}</option>
                            <option value="cancelled">{isTr ? "İptal Edildi" : "Cancelled"}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Tax Info Display & Edit */}
                  {(selectedCompany || selectedCustomer || isNewCustomer) && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-indigo-50/30 border-2 border-indigo-100/50 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'Ünvan' : 'Title'}</p>
                        <input 
                          type="text"
                          className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder={isTr ? "Ünvan giriniz..." : "Enter title..."}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'Vergi Dairesi' : 'Tax Office'}</p>
                        <input 
                          type="text"
                          className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all"
                          value={editTaxOffice}
                          onChange={(e) => setEditTaxOffice(e.target.value)}
                          placeholder={isTr ? "Vergi dairesi..." : "Tax office..."}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'Vergi / TC No' : 'Tax / ID No'}</p>
                        <input 
                          type="text"
                          className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all"
                          value={editTaxNumber}
                          onChange={(e) => setEditTaxNumber(e.target.value)}
                          placeholder={isTr ? "Vergi veya TC no..." : "Tax or ID number..."}
                        />
                      </div>
                      <div className="md:col-span-3 space-y-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">{isTr ? 'Adres' : 'Address'}</p>
                        <textarea 
                          className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl text-xs font-bold text-slate-600 focus:border-indigo-500 transition-all min-h-[60px]"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder={isTr ? "Adres bilgisi..." : "Address info..."}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Product Search & Items Table */}
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                      <div className="flex-1 w-full space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Ürün Ekle' : 'Add Product'}</label>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input 
                            type="text"
                            placeholder={isTr ? "Ürün adı veya barkod ara..." : "Search product or barcode..."}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                            value={productSearch}
                            onChange={(e) => {
                              setProductSearch(e.target.value);
                              setShowProductDropdown(true);
                            }}
                            onFocus={() => setShowProductDropdown(true)}
                          />
                          
                          {showProductDropdown && productSearch && (
                            <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2">
                              {filteredProducts.map((p: any) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-between group"
                                  onClick={() => handleAddProduct(p)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                      <Package className="h-4 w-4 text-slate-500 group-hover:text-indigo-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-700">{p.name}</div>
                                      <div className="text-[10px] text-slate-400 font-medium">{p.barcode}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-black text-indigo-600">{Number(p.price).toLocaleString('tr-TR')} {branding?.default_currency}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? 'Stok' : 'Stock'}: {p.stock}</div>
                                  </div>
                                </button>
                              ))}
                              {filteredProducts.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                  {isTr ? "Ürün bulunamadı" : "No products found"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-4 w-full md:w-auto">
                        <div className="space-y-4 flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Ödeme' : 'Payment'}</label>
                          <select 
                            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                            value={paymentMethod}
                            onChange={(e: any) => setPaymentMethod(e.target.value)}
                          >
                            <option value="cash">{isTr ? 'Nakit' : 'Cash'}</option>
                            <option value="credit_card">{isTr ? 'Kredi Kartı' : 'Credit Card'}</option>
                            <option value="bank">{isTr ? 'Havale/EFT' : 'Bank Transfer'}</option>
                            <option value="term">{isTr ? 'Vadeli' : 'Term'}</option>
                          </select>
                        </div>
                        <div className="space-y-4 flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Döviz' : 'Currency'}</label>
                          <select 
                            className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                          >
                            <option value="TRY">TRY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="border-2 border-slate-100 rounded-[2rem] overflow-x-auto bg-slate-50/30">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-100/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{isTr ? 'Ürün' : 'Product'}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">{isTr ? 'Adet' : 'Qty'}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-40">{isTr ? 'Birim Fiyat' : 'Unit Price'}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">{isTr ? 'KDV %' : 'Tax %'}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-44">{isTr ? 'Toplam' : 'Total'}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                                {isTr ? "Henüz ürün eklenmedi" : "No products added yet"}
                              </td>
                            </tr>
                          ) : (
                            items.map((item, idx) => (
                              <tr key={idx} className="bg-white/50 hover:bg-white transition-colors group">
                                <td className="px-6 py-4">
                                  <div className="text-sm font-bold text-slate-700">{item.product_name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">{item.barcode}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <input 
                                    type="number"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 focus:bg-white transition-all"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                    min="1"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="relative">
                                    <input 
                                      type="number"
                                      step="0.01"
                                      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-bold text-slate-700 focus:bg-white transition-all"
                                      value={item.unit_price}
                                      onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{currency}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <input 
                                    type="number"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 focus:bg-white transition-all"
                                    value={item.tax_rate}
                                    onChange={(e) => updateItem(idx, 'tax_rate', e.target.value)}
                                  />
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="text-sm font-black text-slate-900">
                                    {(Number(item.quantity) * Number(item.unit_price)).toLocaleString('tr-TR')} <span className="text-[10px] text-slate-400">{currency}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    type="button"
                                    onClick={() => removeItem(idx)}
                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes & Totals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Fatura Notları' : 'Invoice Notes'}</label>
                      <textarea 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700 min-h-[160px]"
                        placeholder={isTr ? "Fatura üzerine eklenecek notlar..." : "Notes to be added on the invoice..."}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-slate-200">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center opacity-60">
                          <span className="text-xs font-bold uppercase tracking-widest">{isTr ? 'ARA TOPLAM' : 'SUBTOTAL'}</span>
                          <span className="font-bold">{totals.subtotal.toLocaleString('tr-TR')} {currency}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                          <span className="text-xs font-bold uppercase tracking-widest">{isTr ? 'KDV TOPLAM' : 'TAX TOTAL'}</span>
                          <span className="font-bold">{totals.taxTotal.toLocaleString('tr-TR')} {currency}</span>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                        <div className="space-y-2">
                          <span className="text-sm font-black uppercase tracking-[0.2em] block">{isTr ? 'GENEL TOPLAM' : 'GRAND TOTAL'}</span>
                          <div className="text-[10px] font-bold text-indigo-300 italic">
                            {isTr ? 'Yalnız: ' : 'Only: '} {numberToTurkishWords(totals.grandTotal)}
                          </div>
                        </div>
                        <div className="text-right flex items-baseline gap-2">
                          <div className="text-4xl font-black tracking-tighter whitespace-nowrap">{totals.grandTotal.toLocaleString('tr-TR')}</div>
                          <div className="text-sm font-bold opacity-40 uppercase tracking-widest">{currency}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all uppercase tracking-widest"
                  >
                    {isTr ? "İptal" : "Cancel"}
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 uppercase tracking-widest flex items-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    {isTr ? "Faturayı Kaydet" : "Save Invoice"}
                  </button>
                </div>
              </form>
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
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-auto overflow-hidden border border-slate-200"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isTr ? 'Satış Faturası Detayı' : 'Sales Invoice Details'}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">#{selectedInvoice.invoice_number}</p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors">
                  <X className="h-6 w-6 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{isTr ? 'Fatura Tarihi' : 'Invoice Date'}</p>
                    <p className="text-lg font-black text-slate-900">{new Date(selectedInvoice.invoice_date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{isTr ? 'Ödeme Yöntemi' : 'Payment Method'}</p>
                    <p className="text-lg font-black text-slate-900 uppercase">{selectedInvoice.payment_method || '-'}</p>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{isTr ? 'Müşteri / Cari' : 'Customer / Company'}</p>
                  <div className="flex items-center gap-3">
                    {selectedInvoice.company_id ? <Building2 className="h-5 w-5 text-indigo-600" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
                    <p className="text-lg font-black text-slate-900">{selectedInvoice.customer_name || selectedInvoice.company_title || '-'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Ürünler' : 'Products'}</p>
                  <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">{isTr ? 'Ürün' : 'Product'}</th>
                          <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">{isTr ? 'Adet' : 'Qty'}</th>
                          <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">{isTr ? 'Birim' : 'Unit'}</th>
                          <th className="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">{isTr ? 'Toplam' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(selectedInvoice.items || []).map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-4 px-6 text-sm font-bold text-slate-700">{item.product_name}</td>
                            <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">{item.quantity}</td>
                            <td className="py-4 px-6 text-sm font-bold text-slate-600 text-right">{Number(item.unit_price).toLocaleString('tr-TR')}</td>
                            <td className="py-4 px-6 text-sm font-black text-slate-900 text-right">{Number(item.total_price).toLocaleString('tr-TR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">{isTr ? 'Notlar' : 'Notes'}</p>
                    <p className="text-sm font-medium text-amber-900 leading-relaxed">{selectedInvoice.notes}</p>
                  </div>
                )}

                <div className="p-8 bg-slate-900 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-slate-200">
                  <span className="text-sm font-black uppercase tracking-[0.2em] opacity-60">{isTr ? 'GENEL TOPLAM' : 'GRAND TOTAL'}</span>
                  <div className="text-right">
                    <span className="text-3xl font-black tracking-tighter">{Number(selectedInvoice.grand_total).toLocaleString('tr-TR')}</span>
                    <span className="text-xs font-bold opacity-40 uppercase tracking-widest ml-2">{selectedInvoice.currency}</span>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button 
                  onClick={() => handleExportPDF(selectedInvoice)}
                  className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <FileDown className="h-5 w-5 text-emerald-600" />
                  PDF {isTr ? "İndir" : "Download"}
                </button>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest"
                >
                  {isTr ? "Kapat" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </>
);
}
