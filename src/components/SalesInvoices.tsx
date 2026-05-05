import { toast } from "sonner";
import React, { useState, useEffect, useDeferredValue, useRef } from "react";
import { Plus, Search, Trash2, FileDown, Eye, X, Save, Calendar, User as UserIcon, Hash, Package, CreditCard, Percent, FileSpreadsheet, FileText, CheckCircle2, Edit, Building2, Printer, CloudUpload, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReactToPrint } from 'react-to-print';

export default function SalesInvoices({ storeId, role, lang, api, branding, onSave, initialData, onCloseInitialData }: any) {
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
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
  });

  const handleViewDetails = async (invoice: any, shouldPrint: boolean = false) => {
    try {
      const fullInvoice = await api.getSalesInvoice(invoice.id, storeId);
      setSelectedInvoice(fullInvoice);
      setShowDetailsModal(true);
      if (shouldPrint) {
        setTimeout(() => handlePrint(), 500);
      }
    } catch (err) {
      console.error("Error fetching invoice details:", err);
    }
  };

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
  const [paymentMethod, setPaymentMethod] = useState<'term' | 'cash' | 'credit_card' | 'bank'>('term');
  const [currency, setCurrency] = useState(branding?.default_currency || 'TRY');
  const [exchangeRate, setExchangeRate] = useState("1");
  const [status, setStatus] = useState<'draft' | 'approved' | 'cancelled'>('draft');
  const [invoiceProfile, setInvoiceProfile] = useState<'TEMELFATURA' | 'TICARIFATURA'>('TEMELFATURA');
  const [isReturn, setIsReturn] = useState(false);
  
  const selectedCompany = companies.find((c: any) => c.id === Number(companyId));
  const selectedCustomer = customers.find((c: any) => c.id === Number(customerId));
  
  const [customerSearch, setCustomerSearch] = useState("");
  const deferredCustomerSearch = useDeferredValue(customerSearch);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [isTaxInclusive, setIsTaxInclusive] = useState(true);

  // New states for customer/company info update
  const [editTaxNumber, setEditTaxNumber] = useState("");
  const [editTaxOffice, setEditTaxOffice] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ 
    name: "", 
    price: "", 
    barcode: "", 
    tax_rate: String(branding?.default_tax_rate ?? 20),
    currency: branding?.default_currency || 'TRY' 
  });

  const isTr = lang === 'tr';

  const numberToTurkishWords = (number: number, currency: string = 'TRY') => {
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

    const currencyMap: { [key: string]: { main: string, sub: string } } = {
      'TRY': { main: 'TL', sub: 'Kr' },
      'USD': { main: 'USD', sub: 'Cent' },
      'EUR': { main: 'EUR', sub: 'Cent' }
    };

    const cur = currencyMap[currency] || { main: currency, sub: '' };
    result += cur.main;

    if (decimalPart > 0) {
      result += " " + convertThreeDigits(decimalPart) + " " + cur.sub;
    }

    return result;
  };

  useEffect(() => {
    if (initialData) {
      // Clear forms
      setEditingInvoiceId(null);
      setSaleId(initialData.sale_id || null);
      setCustomerId(initialData.customer_id || "");
      setCompanyId(initialData.company_id || "");
      setCustomerSearch(initialData.customer_name || initialData.company_title || "");
      setInvoiceNumber(initialData.invoice_number || `SATIŞ-${new Date().getTime().toString().slice(-6)}`);
      setNotes(initialData.notes || "");
      setItems(initialData.items || []);
      setCurrency(initialData.currency || branding?.default_currency || 'TRY');
      setPaymentMethod(initialData.payment_method || 'cash');
      setIsNewCustomer(false);
      setIsTaxInclusive(initialData.is_tax_inclusive !== undefined ? initialData.is_tax_inclusive : true);
      setShowModal(true);
      if (onCloseInitialData) onCloseInitialData();
    }
  }, [initialData, branding, onCloseInitialData]);

  useEffect(() => {
    const taxNote = isTr 
      ? (isTaxInclusive ? "Fiyatlara KDV dahildir." : "Fiyatlara KDV dahil değildir.")
      : (isTaxInclusive ? "Prices include VAT." : "Prices exclude VAT.");
    
    setNotes(prev => {
      const cleanNotes = prev.replace(/Fiyatlara KDV dahil(dir| değildir)\.?/g, '').replace(/Prices include VAT\.?/g, '').replace(/Prices exclude VAT\.?/g, '').trim();
      return cleanNotes ? `${cleanNotes}\n${taxNote}` : taxNote;
    });
  }, [isTaxInclusive, isTr]);

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
        const taxRateStr = product.tax_rate !== undefined ? String(Math.floor(Number(product.tax_rate))) : (branding?.default_tax_rate !== undefined ? String(Math.floor(Number(branding.default_tax_rate))) : String(20));
        const taxRate = Number(taxRateStr);
        
        let unitPrice: number;
        const kdvDahilPrice = Number(product.price) || 0;
        const kdvHaricPrice = (product.price_2 && Number(product.price_2) > 0) 
          ? Number(product.price_2) 
          : kdvDahilPrice / (1 + taxRate / 100);

        // If UI is tax-inclusive, we display and use the inclusive price in the inputs
        unitPrice = isTaxInclusive ? kdvDahilPrice : kdvHaricPrice;

        if (productCurrency !== targetCurrency) {
          const rates = branding?.currency_rates || {};
          const fromRate = rates[productCurrency] || 1;
          const toRate = rates[targetCurrency] || 1;
          if (targetCurrency === 'TRY') {
            unitPrice = unitPrice * fromRate;
          } else if (productCurrency === 'TRY') {
            unitPrice = unitPrice / toRate;
          } else {
            unitPrice = (unitPrice * fromRate) / toRate;
          }
        }

        return [...prevItems, {
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          quantity: "1",
          unit_price: unitPrice.toFixed(2),
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
      if (field === 'tax_rate' || field === 'tevkifat_rate') {
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
      
      if (isTaxInclusive) {
        const itemTotalIncl = qty * price;
        const itemTotalExcl = itemTotalIncl / (1 + (tax / 100));
        const itemTax = itemTotalIncl - itemTotalExcl;
        subtotal += itemTotalExcl;
        taxTotal += itemTax;
      } else {
        const itemTotal = qty * price;
        const itemTax = itemTotal * (tax / 100);
        subtotal += itemTotal;
        taxTotal += itemTax;
      }
    });
    
    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal: Number((subtotal + taxTotal).toFixed(2))
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId && !companyId && !isNewCustomer) {
      toast.error(isTr ? "Lütfen bir müşteri veya cari seçin" : "Please select a customer or company");
      return;
    }
    if (items.length === 0) {
      toast.error(isTr ? "Lütfen en az bir ürün ekleyin" : "Please add at least one product");
      return;
    }

    // Capture state values before closing the modal
    const targetStoreId = role === 'superadmin' ? (storeId || undefined) : undefined;
    const currentItems = [...items];
    const currentInvoiceNumber = invoiceNumber;
    const currentWaybillNumber = waybillNumber;
    const currentInvoiceDate = invoiceDate;
    const currentNotes = notes;
    const currentCustomerId = customerId;
    const currentCompanyId = companyId;
    const currentSearch = customerSearch;
    const currentPaymentMethod = paymentMethod;
    const currentCurrency = currency;
    const currentExchangeRate = exchangeRate;
    const currentStatus = status;
    const currentEditingId = editingInvoiceId;
    const currentIsNew = isNewCustomer;
    const currentIsTaxInclusive = isTaxInclusive;

    // Validation: If status is 'approved' and currency is not default, exchange rate is mandatory
    if (currentStatus === 'approved' && currentCurrency !== (branding?.default_currency || 'TRY')) {
      const rate = Number(currentExchangeRate);
      if (!rate || rate <= 0 || isNaN(rate) || currentExchangeRate === '1') {
        toast.error(isTr ? "Tamamlanan faturalarda farklı para birimi için geçerli bir döviz kuru girmelisiniz" : "You must enter a valid exchange rate for a different currency on completed invoices");
        return;
      }
    }

    // Capture values needed for company/customer updates
    const currentTaxNumber = editTaxNumber;
    const currentTaxOffice = editTaxOffice;
    const currentAddress = editAddress;
    const currentSelectedCompany = selectedCompany ? {...selectedCompany} : null;
    const currentSelectedCustomer = selectedCustomer ? {...selectedCustomer} : null;

    // Reset form and close modal immediately for "background" effect
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
    setExchangeRate("1");
    setStatus('draft');
    setIsNewCustomer(false);
    setIsTaxInclusive(true);
    setEditTaxNumber("");
    setEditTaxOffice("");
    setEditAddress("");

    const savePromise = (async () => {
      // Handle new customer creation or existing update if needed
      let finalCustomerId = currentCustomerId;
      let finalCompanyId = currentCompanyId;

      if (currentIsNew && currentSearch) {
        const newComp = await api.addCompany({
          title: currentSearch,
          tax_number: currentTaxNumber,
          tax_office: currentTaxOffice,
          address: currentAddress,
          store_id: targetStoreId
        }, targetStoreId);
        finalCompanyId = newComp.id;
      } else if (currentCompanyId && (currentTaxNumber !== currentSelectedCompany?.tax_number || currentTaxOffice !== currentSelectedCompany?.tax_office || currentAddress !== currentSelectedCompany?.address)) {
        await api.updateCompany(currentCompanyId, {
          ...currentSelectedCompany,
          tax_number: currentTaxNumber,
          tax_office: currentTaxOffice,
          address: currentAddress
        }, targetStoreId);
      } else if (currentCustomerId && (currentTaxNumber !== currentSelectedCustomer?.tax_number || currentTaxOffice !== currentSelectedCustomer?.tax_office || currentAddress !== currentSelectedCustomer?.address)) {
        await api.updateCustomer(currentCustomerId, {
          ...currentSelectedCustomer,
          tax_number: currentTaxNumber,
          tax_office: currentTaxOffice,
          address: currentAddress
        }, targetStoreId);
      }

      const payload = {
        storeId: targetStoreId,
        sale_id: saleId,
        customer_id: finalCustomerId || null,
        company_id: finalCompanyId || null,
        invoice_number: currentInvoiceNumber,
        waybill_number: currentWaybillNumber,
        invoice_date: currentInvoiceDate,
        notes: currentNotes,
        items: currentItems.map(item => ({
          ...item,
          quantity: Number(String(item.quantity).replace(',', '.')) || 0,
          unit_price: Number(String(item.unit_price).replace(',', '.')) || 0,
          tax_rate: Number(String(item.tax_rate).replace(',', '.')) || 0
        })),
        payment_method: currentPaymentMethod,
        currency: currentCurrency,
        exchange_rate: Number(currentExchangeRate) || 1,
        status: currentStatus,
        is_tax_inclusive: currentIsTaxInclusive
      };

      const res = currentEditingId 
        ? await api.updateSalesInvoice(currentEditingId, payload, targetStoreId)
        : await api.addSalesInvoice(payload, targetStoreId);

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
      setSaleId(data.sale_id || null);
      setCustomerId(data.customer_id || "");
      setCompanyId(data.company_id || "");
      setCustomerSearch(data.customer_name || data.company_title || "");
      setInvoiceNumber(data.invoice_number);
      setWaybillNumber(data.waybill_number || "");
      setInvoiceDate(new Date(data.invoice_date).toISOString().split('T')[0]);
      setNotes(data.notes || "");
      setPaymentMethod(data.payment_method || 'cash');
      setCurrency(data.currency || 'TRY');
      setExchangeRate(String(data.exchange_rate || 1));
      setStatus(data.status || 'draft');
      const taxIncl = data.is_tax_inclusive !== undefined ? data.is_tax_inclusive : true;
      setIsTaxInclusive(taxIncl);
      setItems((data.items || []).map((item: any) => {
        const taxRate = Number(item.tax_rate) || 0;
        const exclusivePrice = Number(item.unit_price) || 0;
        // If UI is tax-inclusive, show the inclusive price in the inputs
        const displayPrice = taxIncl ? (exclusivePrice * (1 + taxRate / 100)) : exclusivePrice;
        
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          barcode: item.barcode,
          quantity: String(Math.floor(Number(item.quantity) || 0)),
          unit_price: String(displayPrice.toFixed(2)),
          tax_rate: String(Math.floor(Number(item.tax_rate) || 0))
        };
      }));
      setShowModal(true);
    } catch (error: any) {
      alert(error.message || (isTr ? "Hata oluştu" : "An error occurred"));
    }
  };

  const handleSendToGIB = async (id: number) => {
    if (!window.confirm(isTr ? "Faturayı resmileştirmek üzere GİB'e göndermek istediğinize emin misiniz? Bu işlem geri alınamaz." : "Are you sure you want to send this invoice to the government? This operation cannot be undone.")) return;
    try {
      toast.info(isTr ? "Fatura gönderiliyor..." : "Sending invoice...");
      const res = await api.sendEInvoice(id);
      if (res.error) throw new Error(res.error);
      toast.success(isTr ? "Fatura GİB'e başarıyla iletildi!" : "Invoice successfully pushed to integrator!");
      await fetchInvoicesData();
    } catch (error: any) {
      toast.error(error.message || (isTr ? "Servis sağlayıcıya bağlanırken hata oluştu" : "Error connecting to integrator"));
    }
  };

  const handleCheckEInvoiceStatus = async (id: number) => {
    try {
      toast.info(isTr ? "Durum sorgulanıyor..." : "Checking status...");
      const res = await api.checkEInvoiceStatus(id);
      if (res.error) throw new Error(res.error);
      toast.success(`${isTr ? "Durum" : "Status"}: ${res.status}`);
      await fetchInvoicesData();
    } catch (error: any) {
      toast.error(error.message || (isTr ? "Durum sorgulama başarısız" : "Status check failed"));
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
      const currency = quickProductForm.currency || branding?.default_currency || 'TRY';
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
      setQuickProductForm({ 
        name: "", 
        price: "", 
        barcode: "", 
        tax_rate: String(branding?.default_tax_rate ?? 20),
        currency: branding?.default_currency || 'TRY'
      });
    } catch (error) {
      alert(isTr ? "Hata oluştu" : "An error occurred");
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
      [isTr ? 'KDV' : 'VAT']: Number(inv.tax_amount),
      [isTr ? 'Toplam' : 'Total']: Number(inv.grand_total),
      [isTr ? 'Para Birimi' : 'Currency']: inv.currency,
      [isTr ? 'Durum' : 'Status']: inv.status === 'approved' ? (isTr ? 'Onaylandı' : 'Approved') : (inv.status === 'cancelled' ? (isTr ? 'İptal' : 'Cancelled') : (isTr ? 'Taslak' : 'Draft'))
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Invoices");
    XLSX.writeFile(wb, `satis_faturalari_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    c.phone?.toLowerCase().includes(deferredCustomerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(deferredCustomerSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter((c: any) => 
    c.title?.toLowerCase().includes(deferredCustomerSearch.toLowerCase()) ||
    c.tax_number?.toLowerCase().includes(deferredCustomerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(deferredCustomerSearch.toLowerCase())
  );

  const filteredProducts = products.filter((p: any) => 
    p.name?.toLowerCase().includes(deferredProductSearch.toLowerCase()) ||
    p.barcode?.toString().includes(deferredProductSearch)
  );

  const totals = calculateTotals();

  const totalCalculatedTax = filteredInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.tax_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalSalesAmount = filteredInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalGrandTotal = filteredInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.grand_total || 0) * (Number(inv.exchange_rate) || 1)), 0);

  return (
    <>
      <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Percent className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{isTr ? "Hesaplanan Vergi" : "Calculated Tax"}</p>
            <p className="text-2xl font-black text-slate-900">
              {totalCalculatedTax.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: branding?.default_currency || 'TRY' })}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{isTr ? "Toplam Satış Matrahı" : "Total Sales Subtotal"}</p>
            <p className="text-2xl font-black text-slate-900">
              {totalSalesAmount.toLocaleString(isTr ? 'tr-TR' : 'en-US', { style: 'currency', currency: branding?.default_currency || 'TRY' })}
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
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Tarih' : 'Date'}</th>
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Fatura No' : 'Invoice No'}</th>
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Durum' : 'Status'}</th>
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{isTr ? 'Müşteri / Cari' : 'Customer / Company'}</th>
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'Matrah' : 'Subtotal'}</th>
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'KDV' : 'VAT'}</th>
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'Toplam' : 'Total'}</th>
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{isTr ? 'Döviz' : 'Curr'}</th>
                <th className="px-3 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{isTr ? 'İşlemler' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-slate-400 text-sm font-medium">
                    {isTr ? "Fatura bulunamadı" : "No invoices found"}
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 py-4 text-xs font-bold text-slate-500">
                      {new Date(inv.invoice_date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm font-bold text-slate-900">#{inv.invoice_number}</div>
                      {inv.document_number && (
                         <div className="text-[10px] text-indigo-600 font-black tracking-widest mt-0.5">{inv.document_number}</div>
                      )}
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{inv.payment_method}</div>
                    </td>
                    <td className="px-3 py-4 w-[120px]">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        inv.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                        inv.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.status === 'draft' ? (isTr ? 'Taslak' : 'Draft') :
                         inv.status === 'approved' ? (isTr ? 'Onaylandı' : 'Approved') :
                         inv.status === 'cancelled' ? (isTr ? 'İptal' : 'Cancelled') :
                         inv.status}
                      </span>
                      {inv.e_document_type && (
                         <div className="flex flex-col gap-1 mt-1">
                           <div className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-widest border w-fit ${
                             inv.e_document_type === 'E-FATURA' ? 'border-purple-200 bg-purple-50 text-purple-700' : 
                             'border-blue-200 bg-blue-50 text-blue-700'
                           }`}>
                             {inv.e_document_type}
                           </div>
                           {inv.integration_status && (
                             <div className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-widest border w-fit ${
                               inv.integration_status === 'QUEUED' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                               inv.integration_status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                               inv.integration_status === 'REJECTED' ? 'border-rose-200 bg-rose-700 text-rose-700' :
                               'border-slate-200 bg-slate-50 text-slate-700'
                             }`}>
                               {inv.integration_status === 'QUEUED' ? (isTr ? 'GİB KUYRUĞUNDA' : 'QUEUED') :
                                inv.integration_status === 'APPROVED' ? (isTr ? 'GİB ONAYLI' : 'APPROVED') : 
                                inv.integration_status === 'REJECTED' ? (isTr ? 'REDDEDİLDİ' : 'REJECTED') :
                                inv.integration_status}
                             </div>
                           )}
                         </div>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        {inv.company_id ? <Building2 className="h-3.5 w-3.5 text-indigo-500" /> : <UserIcon className="h-3.5 w-3.5 text-slate-400" />}
                        <div className="text-sm font-bold text-slate-700">{inv.customer_name || inv.company_title || inv.sale_customer_name || '-'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="text-sm font-bold text-slate-700">
                        {Number(inv.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="text-sm font-bold text-slate-600">
                        {Number(inv.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="text-sm font-black text-slate-900">
                        {Number(inv.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center text-xs font-black text-slate-400">
                      {inv.currency}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {/* E-Invoice / E-Archive Send Action */}
                        {!['QUEUED', 'APPROVED'].includes(inv.integration_status) && branding?.einvoice_settings?.is_active && inv.status !== 'draft' && (
                          <button 
                            onClick={() => handleSendToGIB(inv.id)}
                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                            title={isTr ? "GİB'e Gönder" : "Push to Document Integrator"}
                          >
                            <CloudUpload className="h-4 w-4" />
                          </button>
                        )}
                        {/* E-Invoice Check Status Action */}
                        {inv.integration_status === 'QUEUED' && branding?.einvoice_settings?.is_active && (
                          <button 
                            onClick={() => handleCheckEInvoiceStatus(inv.id)}
                            className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all"
                            title={isTr ? "GİB Durumunu Sorgula" : "Check Integrator Status"}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(inv.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewDetails(inv)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewDetails(inv, true)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title={isTr ? "Yazdır / PDF" : "Print / PDF"}
                        >
                          <Printer className="h-4 w-4" />
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Sistem Fiş / Takip No' : 'System Invoice / Tracking No'}</label>
                        <div className="relative">
                          <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <input 
                            type="text"
                            required
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            placeholder={isTr ? "SİSTEM-001" : "SYS-001"}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 pl-1 leading-tight">{isTr ? "İç takibiniz içindir, resmi GİB E-Fatura seri numarasını bozmaz." : "For internal tracking. Official Integrator sequence is strictly separated."}</p>
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
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Fatura Tipi' : 'Invoice Profile'}</label>
                        <select 
                          className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none"
                          value={invoiceProfile}
                          onChange={(e: any) => setInvoiceProfile(e.target.value)}
                        >
                          <option value="TEMELFATURA">{isTr ? "Temel Fatura" : "Basic Invoice"}</option>
                          <option value="TICARIFATURA">{isTr ? "Ticari Fatura" : "Commercial Invoice"}</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'İşlem Tipi' : 'Trans Type'}</label>
                         <div className="flex items-center gap-4 py-4">
                           <button
                             type="button"
                             onClick={() => setIsReturn(false)}
                             className={`flex-1 py-3 text-sm font-bold rounded-xl border-2 ${!isReturn ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
                           >
                             {isTr ? "Satış" : "Sale"}
                           </button>
                           <button
                             type="button"
                             onClick={() => setIsReturn(true)}
                             className={`flex-1 py-3 text-sm font-bold rounded-xl border-2 ${isReturn ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-200 text-slate-500'}`}
                           >
                             {isTr ? "İade" : "Return"}
                           </button>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{isTr ? 'Vergi Durumu' : 'Tax Status'}</label>
                         <div className="flex items-center gap-4 py-4">
                           <button
                             type="button"
                             onClick={() => setIsTaxInclusive(true)}
                             className={`flex-1 py-3 text-sm font-bold rounded-xl border-2 ${isTaxInclusive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
                           >
                             {isTr ? "KDV Dahil" : "VAT Incl."}
                           </button>
                           <button
                             type="button"
                             onClick={() => setIsTaxInclusive(false)}
                             className={`flex-1 py-3 text-sm font-bold rounded-xl border-2 ${!isTaxInclusive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
                           >
                             {isTr ? "KDV Hariç" : "VAT Excl."}
                           </button>
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
                                    <div className="text-sm font-black text-indigo-600">{Number(p.price).toLocaleString('tr-TR')} {p.currency || branding?.default_currency || 'TRY'}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isTr ? 'Stok' : 'Stock'}: {p.stock}</div>
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
                          <div className="flex gap-2">
                            <select 
                              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                              value={currency}
                              onChange={(e) => {
                                setCurrency(e.target.value);
                                if (e.target.value === (branding?.default_currency || 'TRY')) {
                                  setExchangeRate("1");
                                }
                              }}
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
                                className="w-24 px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                              />
                            )}
                          </div>
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
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">{isTr ? 'KDV %' : 'VAT %'}</th>
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
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 focus:bg-white transition-all"
                                    value={item.quantity}
                                    onKeyDown={(e) => {
                                      if (e.key === '.' || e.key === ',') e.preventDefault();
                                    }}
                                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                  />
                                </td>
                                <td className="px-3 py-4">
                                  <div className="relative">
                                    <input 
                                      type="text"
                                      className="w-full pl-2 pr-6 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right font-bold text-slate-700 text-xs focus:bg-white transition-all"
                                      value={item.unit_price}
                                      onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400">{currency}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <input 
                                    type="text"
                                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-slate-700 focus:bg-white transition-all"
                                    value={Math.floor(Number(item.tax_rate) || 0)}
                                    onChange={(e) => updateItem(idx, 'tax_rate', e.target.value)}
                                  />
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="text-sm font-black text-slate-900">
                                    {((Number(String(item.quantity).replace(',', '.')) || 0) * (Number(String(item.unit_price).replace(',', '.')) || 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">{currency}</span>
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
                          <span className="font-bold">{totals.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                          <span className="text-xs font-bold uppercase tracking-widest">{isTr ? 'KDV TOPLAM' : 'VAT TOTAL'}</span>
                          <span className="font-bold">{totals.taxTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</span>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                        <div className="space-y-2">
                          <span className="text-sm font-black uppercase tracking-[0.2em] block">{isTr ? 'GENEL TOPLAM' : 'GRAND TOTAL'}</span>
                          <div className="text-[10px] font-bold text-indigo-300 italic">
                            {isTr ? 'Yalnız: ' : 'Only: '} {numberToTurkishWords(totals.grandTotal, currency)}
                          </div>
                        </div>
                        <div className="text-right flex items-baseline gap-2">
                          <div className="text-4xl font-black tracking-tighter whitespace-nowrap">{totals.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-auto overflow-hidden border border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-bold text-slate-900">{isTr ? 'Fatura Detayı' : 'Invoice Details'}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePrint()} 
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-600 flex items-center gap-2 text-sm font-bold"
                  >
                    <Printer className="h-4 w-4" />
                    {isTr ? 'Yazdır' : 'Print'}
                  </button>
                  <button 
                    onClick={() => setShowDetailsModal(false)} 
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[75vh] overflow-y-auto" ref={invoiceRef}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{isTr ? 'Müşteri / Cari' : 'Customer / Company'}</p>
                    <p className="text-lg font-bold text-slate-900">{selectedInvoice.customer_name || selectedInvoice.company_title || selectedInvoice.sale_customer_name}</p>
                    <p className="text-sm text-slate-500">{selectedInvoice.customer_address || selectedInvoice.company_address}</p>
                    <p className="text-sm text-slate-500">{selectedInvoice.customer_phone || selectedInvoice.company_phone}</p>
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
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">{isTr ? 'NOTLAR' : 'NOTES'}</p>
                        <p className="text-sm text-slate-700">{selectedInvoice.notes}</p>
                      </div>
                    )}
                    <div className="text-xs text-slate-400 font-bold italic">
                      {isTr ? 'Yalnızca:' : 'Only:'} {numberToTurkishWords(Number(selectedInvoice.grand_total), selectedInvoice.currency)}
                    </div>
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
      {/* Quick Add Product Modal */}
      <AnimatePresence>
        {showQuickProductModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={quickProductForm.price}
                      onChange={(e) => setQuickProductForm({ ...quickProductForm, price: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <select
                      value={quickProductForm.currency}
                      onChange={(e) => setQuickProductForm({ ...quickProductForm, currency: e.target.value })}
                      className="w-24 px-2 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm font-bold"
                    >
                      <option value="TRY">TL</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
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
  </>
);
}
