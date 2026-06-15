import { toast } from "sonner";
import React, { useState, useEffect, useDeferredValue, useRef } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  FileDown, 
  Eye, 
  X, 
  Save, 
  Calendar, 
  User as UserIcon, 
  Hash, 
  Package, 
  CreditCard, 
  Percent, 
  FileSpreadsheet, 
  FileText, 
  FileSearch, 
  CheckCircle2, 
  Edit, 
  Building2, 
  Printer, 
  CloudUpload, 
  RefreshCw, 
  Loader2, 
  XCircle 
} from "lucide-react";
import { normalizeSearch } from "../lib/searchUtils";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

import { SalesInvoiceStats } from "./dashboard/invoices/sales/SalesInvoiceStats";
import { SalesInvoiceTable } from "./dashboard/invoices/sales/SalesInvoiceTable";
import { SalesInvoiceDetailsModal } from "./dashboard/invoices/sales/SalesInvoiceDetailsModal";
import { SalesInvoiceHtmlModal } from "./dashboard/invoices/sales/SalesInvoiceHtmlModal";
import { QuickProductModal } from "./dashboard/invoices/sales/QuickProductModal";
import { QuickCariModal } from "./dashboard/invoices/sales/QuickCariModal";
import { SalesInvoiceFormModal } from "./dashboard/invoices/sales/SalesInvoiceFormModal";
import { calculateInvoiceTotals } from "../lib/invoiceUtils";

export default function SalesInvoices({ storeId: initialStoreId, currentStoreId, role, lang, api, branding, onSave, initialData, onCloseInitialData }: any) {
  const storeId = initialStoreId || currentStoreId;
  const isTr = lang === 'tr';
  const isTrBoolean = isTr;

  // Data States
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI States
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const [showHtmlModal, setShowHtmlModal] = useState(false);
  const [htmlContent, setHtmlContent] = useState("");
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Form States
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
  const [eDocumentType, setEDocumentType] = useState<string | null>(null);
  const [invoiceProfile, setInvoiceProfile] = useState<'TEMELFATURA' | 'TICARIFATURA' | 'EARSIVFATURA'>('TEMELFATURA');
  const [giInvoiceType, setGiInvoiceType] = useState<string>('SATIS');
  const [isReturn, setIsReturn] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [exemptionReasonCode, setExemptionReasonCode] = useState("");
  const [withholdingTaxCode, setWithholdingTaxCode] = useState("");
  const [isCheckingTaxpayer, setIsCheckingTaxpayer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [saleId, setSaleId] = useState<number | null>(null);
  const [isTaxInclusive, setIsTaxInclusive] = useState(true);
  const [editTaxNumber, setEditTaxNumber] = useState("");
  const [editTaxOffice, setEditTaxOffice] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const deferredCustomerSearch = useDeferredValue(customerSearch);
  const [lastEditedId, setLastEditedId] = useState<number | null>(null);
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({
    name: "",
    price: "",
    barcode: "",
    tax_rate: String(branding?.default_tax_rate ?? 20),
    currency: branding?.default_currency || 'TRY'
  });

  const [showQuickCariModal, setShowQuickCariModal] = useState(false);
  const [quickCariSearchInitial, setQuickCariSearchInitial] = useState("");

  const handleQuickCariSubmit = async (data: any) => {
    try {
      if (data.type === 'company') {
        const newCompany = await api.addCompany({
          title: data.title,
          representative: data.phone ? data.title + " Temsilcisi" : undefined,
          phone: data.phone,
          email: data.email,
          tax_office: data.tax_office,
          tax_number: data.tax_number,
          currency: data.currency,
          status: 'active'
        }, storeId);
        setCompanies((prev: any) => [...prev, newCompany]);
        setCompanyId(String(newCompany.id));
        setCustomerId("");
        setCustomerSearch(newCompany.title || newCompany.company_title || "");
      } else {
        const newCust = await api.addCustomer({
          name: data.title,
          phone: data.phone,
          email: data.email,
          currency: data.currency,
          status: 'active'
        }, storeId);
        setCustomers((prev: any) => [...prev, newCust]);
        setCustomerId(String(newCust.id));
        setCompanyId("");
        setCustomerSearch(newCust.name || newCust.customer_name || "");
      }
      setShowQuickCariModal(false);
      toast.success(isTr ? "Cari başarıyla kaydedildi" : "Cari successfully registered");
    } catch (err: any) {
      toast.error(err.message || (isTr ? "Cari kaydedilemedi" : "Cari register failed"));
    }
  };

  const invoiceRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: invoiceRef });

  const selectedCompany = companies.find((c: any) => c.id === Number(companyId));
  const selectedCustomer = customers.find((c: any) => c.id === Number(customerId));

  // Data Fetching
  const fetchInvoicesData = async (searchStr?: string, sDate?: string, eDate?: string, silent = false) => {
    if (role === 'superadmin' && !storeId) return;
    if (!silent) setLoading(true);
    try {
      const [invRes, custRes, compRes, prodRes] = await Promise.all([
        api.getSalesInvoices(role === 'superadmin' ? storeId : undefined, searchStr, sDate || startDate, eDate || endDate),
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoicesData(activeSearch, startDate, endDate);
  }, [storeId, activeSearch, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => setActiveSearch(search), 600);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial Data Handling
  useEffect(() => {
    if (initialData) {
      setEditingInvoiceId(null);
      setSaleId(initialData.sale_id || null);
      setCustomerId(initialData.customer_id || "");
      setCompanyId(initialData.company_id || "");
      setCustomerSearch(initialData.customer_name || initialData.company_title || "");
      setInvoiceNumber(initialData.invoice_number || `SATIŞ-${new Date().getTime().toString().slice(-6)}`);
      setNotes(initialData.notes || "");
      setItems(initialData.items || []);
      setCurrency(initialData.currency || branding?.default_currency || 'TRY');
      setPaymentMethod(initialData.payment_method || 'term');
      setEDocumentType(initialData.e_document_type || null);
      setGiInvoiceType(initialData.gi_invoice_type || 'SATIS');
      setCustomerEmail(initialData.customer_email || "");
      setExemptionReasonCode(initialData.gi_exemption_reason_code || "");
      setWithholdingTaxCode(initialData.gi_withholding_tax_code || "");
      setIsReturn((initialData.gi_invoice_type || 'SATIS') === 'IADE');
      setIsNewCustomer(false);
      setIsTaxInclusive(initialData.is_tax_inclusive !== undefined ? initialData.is_tax_inclusive : true);
      setShowModal(true);
      if (onCloseInitialData) onCloseInitialData();
    }
  }, [initialData, branding, onCloseInitialData]);

  // Taxpayer Checking
  useEffect(() => {
    const fetchTaxType = async () => {
      if (!branding?.einvoice_settings?.is_active || editingInvoiceId) return;
      let vkn = selectedCompany?.tax_number || selectedCustomer?.tax_number || "";
      if (vkn && (vkn.length === 10 || vkn.length === 11)) {
        try {
          const res = await api.checkTaxpayer(vkn);
          if (res.documentType === 'E-FATURA') {
            if (invoiceProfile === 'EARSIVFATURA') setInvoiceProfile('TEMELFATURA');
            setEDocumentType('E-FATURA');
          } else {
            setInvoiceProfile('EARSIVFATURA');
            setEDocumentType('E-ARŞİV');
          }
        } catch (err) {
          setEDocumentType('E-ARŞİV');
        }
      }
    };
    fetchTaxType();
  }, [companyId, customerId, editingInvoiceId]);

  const handleCheckTaxpayer = async () => {
    if (!editTaxNumber) {
      toast.error(isTr ? "Sorgulama için Vergi/TC numarası gereklidir." : "Tax or ID number is required for checking.");
      return;
    }
    setIsCheckingTaxpayer(true);
    try {
      const res = await api.checkTaxpayer(editTaxNumber);
      if (res.error) throw new Error(res.error);
      
      if (res.documentType === 'E-FATURA') {
        toast.info(isTr ? "E-Fatura Mükellefi" : "E-Invoice Taxpayer");
        setInvoiceProfile('TEMELFATURA');
        setEDocumentType('E-FATURA');
      } else {
        toast.info(isTr ? "E-Arşiv Mükellefi" : "E-Archive Taxpayer");
        setInvoiceProfile('EARSIVFATURA');
        setEDocumentType('E-ARŞİV');
      }

      if (res.title) {
        setCustomerSearch(res.title);
        toast.success(isTr ? "Cari ünvanı otomatik güncellendi!" : "Company title automatically updated!");
      }
      if (res.taxOffice) {
        setEditTaxOffice(res.taxOffice);
      }
      if (res.address) {
        setEditAddress(res.address);
      }
    } catch (err: any) {
      toast.error(isTr ? `Sorgulama hatası: ${err.message || 'Mükellef bulunamadı'}` : `Query error: ${err.message || 'Taxpayer not found'}`);
    } finally {
      setIsCheckingTaxpayer(false);
    }
  };

  // Form Handlers
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
        let unitPrice = isTaxInclusive 
          ? (Number(product.price) || 0)
          : (product.price_2 && Number(product.price_2) > 0 ? Number(product.price_2) : (Number(product.price) || 0) / (1 + taxRate / 100));

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

  const resetForm = () => {
    setEditingInvoiceId(null);
    setSaleId(null);
    setCustomerId("");
    setCompanyId("");
    setCustomerSearch("");
    setInvoiceNumber("");
    setWaybillNumber("");
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setNotes("");
    setItems([]);
    setProductSearch("");
    setPaymentMethod('term');
    setCurrency(branding?.default_currency || 'TRY');
    setExchangeRate("1");
    setStatus('draft');
    setEDocumentType(null);
    setInvoiceProfile('TEMELFATURA');
    setGiInvoiceType('SATIS');
    setIsReturn(false);
    setCustomerEmail("");
    setExemptionReasonCode("");
    setWithholdingTaxCode("");
    setIsTaxInclusive(true);
    setEditTaxNumber("");
    setEditTaxOffice("");
    setEditAddress("");
    setIsNewCustomer(false);
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

    const payload = {
      storeId: role === 'superadmin' ? (storeId || undefined) : undefined,
      sale_id: saleId,
      customer_id: customerId || null,
      company_id: companyId || null,
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
      currency,
      exchange_rate: Number(exchangeRate) || 1,
      status,
      e_document_type: eDocumentType,
      invoice_profile: invoiceProfile,
      gi_invoice_type: isReturn ? 'IADE' : giInvoiceType,
      gi_exemption_reason_code: exemptionReasonCode,
      gi_withholding_tax_code: withholdingTaxCode,
      customer_email: customerEmail,
      is_tax_inclusive: isTaxInclusive,
      tax_number: editTaxNumber,
      tax_office: editTaxOffice,
      address: editAddress
    };

    setShowModal(false);
    const savePromise = (async () => {
      const res = editingInvoiceId 
        ? await api.updateSalesInvoice(editingInvoiceId, payload, payload.storeId)
        : await api.addSalesInvoice(payload, payload.storeId);
      if (res.error) throw new Error(res.error);
      setLastEditedId(editingInvoiceId || res.id);
      await fetchInvoicesData(activeSearch, startDate, endDate, true);
      if (onSave) await onSave(true);
      return res;
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
      const res = await api.deleteSalesInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (res.error) throw new Error(res.error);
      await fetchInvoicesData();
      if (onSave) onSave(true);
      toast.success(isTr ? "Fatura silindi" : "Invoice deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const data = await api.getSalesInvoice(id, role === 'superadmin' ? storeId : undefined);
      if (data.error) throw new Error(data.error);
      setEditingInvoiceId(id);
      setSaleId(data.sale_id);
      setCustomerId(data.customer_id || "");
      setCompanyId(data.company_id || "");
      setCustomerSearch(data.customer_name || data.company_title || "");
      setInvoiceNumber(data.invoice_number);
      setWaybillNumber(data.waybill_number || "");
      setInvoiceDate(new Date(data.invoice_date).toISOString().split('T')[0]);
      setNotes(data.notes || "");
      setPaymentMethod(data.payment_method);
      setCurrency(data.currency);
      setExchangeRate(String(data.exchange_rate || 1));
      setStatus(data.status);
      setEDocumentType(data.e_document_type);
      setGiInvoiceType(data.gi_invoice_type);
      setIsReturn(data.gi_invoice_type === 'IADE');
      setCustomerEmail(data.customer_email || "");
      setExemptionReasonCode(data.gi_exemption_reason_code || "");
      setWithholdingTaxCode(data.gi_withholding_tax_code || "");
      setInvoiceProfile(data.invoice_profile);
      setEditTaxNumber(data.tax_number || "");
      setEditTaxOffice(data.tax_office || "");
      setEditAddress(data.address || "");
      setIsTaxInclusive(data.is_tax_inclusive !== undefined ? data.is_tax_inclusive : true);
      setItems((data.items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: String(Number(item.quantity)),
        unit_price: String(Number(item.unit_price).toFixed(2)),
        tax_rate: String(Number(item.tax_rate))
      })));
      setShowModal(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleViewDetails = async (inv: any, print?: boolean) => {
    try {
      const data = await api.getSalesInvoice(inv.id, role === 'superadmin' ? storeId : undefined);
      if (data.error) throw new Error(data.error);
      setSelectedInvoice(data);
      setShowDetailsModal(true);
      if (print) {
        setTimeout(() => {
          handlePrint();
        }, 500);
      }
    } catch (error: any) {
      toast.error(isTr ? "Fatura detayları yüklenemedi." : "Could not load invoice details.");
      console.error(error);
    }
  };

  const handleViewHtml = async (id: number) => {
    setHtmlLoading(true);
    setShowHtmlModal(true);
    try {
      const res = await api.getSalesInvoiceHtml(id);
      if (res && res.html) setHtmlContent(res.html);
      else {
        toast.error(isTr ? "Fatura görseli bulunamadı." : "Invoice HTML not found.");
        setShowHtmlModal(false);
      }
    } catch (err) {
      toast.error(isTr ? "Görsel yükleme hatası" : "Error loading preview");
      setShowHtmlModal(false);
    } finally {
      setHtmlLoading(false);
    }
  };

  const handleSendToGIB = async (id: number) => {
    if (!window.confirm(isTr ? "GİB'e göndermek istediğinize emin misiniz?" : "Confirm send to integrator?")) return;
    try {
      toast.info(isTr ? "Gönderiliyor..." : "Sending...");
      const res = await api.sendEInvoice(id);
      if (res.error) throw new Error(res.error);
      toast.success(isTr ? "Başarıyla iletildi!" : "Successfully pushed!");
      await fetchInvoicesData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelGIB = async (id: number) => {
    const reason = prompt(isTr ? "İptal nedeni:" : "Reason:");
    if (!reason) return;
    try {
      const res = await api.cancelEInvoice(id, reason);
      if (res.error) throw new Error(res.error);
      toast.success(isTr ? "Fatura iptal edildi." : "Cancelled.");
      await fetchInvoicesData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCheckEInvoiceStatus = async (id: number) => {
    try {
      const res = await api.checkEInvoiceStatus(id);
      if (res.error) throw new Error(res.error);
      toast.success(`${isTr ? "Durum" : "Status"}: ${res.status}`);
      await fetchInvoicesData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleQuickProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taxRate = Number(quickProductForm.tax_rate) || 20;
      const price = Number(quickProductForm.price);
      const cur = quickProductForm.currency;
      const newProduct = await api.addProduct({
        ...quickProductForm,
        tax_rate: taxRate,
        stock_quantity: 0,
        status: 'active'
      }, role === 'superadmin' ? storeId : undefined);
      setProducts(prev => [...prev, newProduct]);
      handleAddProduct(newProduct);
      setShowQuickProductModal(false);
    } catch (error) {
      toast.error(isTr ? "Ürün ekleme hatası" : "Product add error");
    }
  };

  const handleExportExcel = () => {
    const targetInvoices = selectedIds.length > 0 
      ? invoices.filter((i: any) => selectedIds.includes(i.id))
      : invoices;
    
    if (selectedIds.length > 0) {
      toast.success(isTr ? `Seçili ${selectedIds.length} fatura Excel'e aktarılıyor...` : `Exporting ${selectedIds.length} selected invoices...`);
    }

    const data = targetInvoices.map((inv: any) => ({
      [isTr ? 'Tarih' : 'Date']: new Date(inv.invoice_date).toLocaleDateString('tr-TR'),
      [isTr ? 'Fatura No' : 'Invoice No']: inv.invoice_number,
      [isTr ? 'Müşteri / Cari' : 'Customer / Company']: inv.customer_name || inv.company_title || '-',
      [isTr ? 'Matrah' : 'Subtotal']: Number(inv.total_amount),
      [isTr ? 'KDV' : 'VAT']: Number(inv.tax_amount),
      [isTr ? 'Toplam' : 'Total']: Number(inv.grand_total),
      [isTr ? 'Para Birimi' : 'Currency']: inv.currency
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices");
    XLSX.writeFile(wb, `satis_faturalari_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const totals = calculateInvoiceTotals(items, isTaxInclusive);
  
  const removeItem = (index: number) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
  };
  
  const totalCalculatedTax = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.tax_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalSalesAmount = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || 0) * (Number(inv.exchange_rate) || 1)), 0);
  const totalGrandTotal = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.grand_total || 0) * (Number(inv.exchange_rate) || 1)), 0);

  const filteredProducts = products.filter((p: any) => {
    const term = normalizeSearch(deferredProductSearch);
    return !term || normalizeSearch(p.name).includes(term) || (p.barcode || "").toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <SalesInvoiceStats 
        isTr={isTr}
        totalCalculatedTax={totalCalculatedTax}
        totalSalesAmount={totalSalesAmount}
        totalGrandTotal={totalGrandTotal}
        branding={branding}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 flex flex-wrap items-center gap-3 w-full">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={isTr ? "Fatura no, müşteri ara..." : "Search invoice, customer..."}
              className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-slate-300">-</span>
            <input 
              type="date"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleExportExcel}
            className="flex-1 md:flex-none p-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            title={isTr ? "Excel'e Aktar" : "Export to Excel"}
          >
            <FileDown className="h-5 w-5 mx-auto" />
          </button>
          <button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex-[2] md:flex-none px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {isTr ? "Fatura Ekle" : "Add Invoice"}
          </button>
        </div>
      </div>

      <SalesInvoiceTable 
        invoices={invoices.slice((page - 1) * itemsPerPage, page * itemsPerPage)}
        loading={loading}
        isTr={isTr}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        lastEditedId={lastEditedId}
        branding={branding}
        handleSendToGIB={handleSendToGIB}
        handleCancelGIB={handleCancelGIB}
        handleCheckEInvoiceStatus={handleCheckEInvoiceStatus}
        handleViewHtml={handleViewHtml}
        handleEdit={handleEdit}
        handleViewDetails={handleViewDetails}
        handleDelete={handleDelete}
        page={page}
        totalPages={Math.ceil(invoices.length / itemsPerPage)}
        setPage={setPage}
      />

      <SalesInvoiceFormModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isTr={isTr}
        editingInvoiceId={editingInvoiceId}
        handleSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        status={status}
        setStatus={setStatus}
        customers={customers}
        companies={companies}
        customerId={customerId}
        setCustomerId={setCustomerId}
        companyId={companyId}
        setCompanyId={setCompanyId}
        customerSearch={customerSearch}
        setCustomerSearch={setCustomerSearch}
        invoiceNumber={invoiceNumber}
        setInvoiceNumber={setInvoiceNumber}
        waybillNumber={waybillNumber}
        setWaybillNumber={setWaybillNumber}
        invoiceDate={invoiceDate}
        setInvoiceDate={setInvoiceDate}
        invoiceProfile={invoiceProfile}
        setInvoiceProfile={(val: any) => setInvoiceProfile(val)}
        giInvoiceType={giInvoiceType}
        setGiInvoiceType={setGiInvoiceType}
        exemptionReasonCode={exemptionReasonCode}
        setExemptionReasonCode={setExemptionReasonCode}
        withholdingTaxCode={withholdingTaxCode}
        setWithholdingTaxCode={setWithholdingTaxCode}
        isReturn={isReturn}
        setIsReturn={setIsReturn}
        isTaxInclusive={isTaxInclusive}
        setIsTaxInclusive={setIsTaxInclusive}
        editTaxOffice={editTaxOffice}
        setEditTaxOffice={setEditTaxOffice}
        editTaxNumber={editTaxNumber}
        setEditTaxNumber={setEditTaxNumber}
        handleCheckTaxpayer={handleCheckTaxpayer}
        isCheckingTaxpayer={isCheckingTaxpayer}
        customerEmail={customerEmail}
        setCustomerEmail={setCustomerEmail}
        editAddress={editAddress}
        setEditAddress={setEditAddress}
        selectedCompany={selectedCompany}
        selectedCustomer={selectedCustomer}
        isNewCustomer={isNewCustomer}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        showProductDropdown={showProductDropdown}
        setShowProductDropdown={setShowProductDropdown}
        filteredProducts={filteredProducts}
        handleAddProduct={handleAddProduct}
        setShowQuickProductModal={setShowQuickProductModal}
        paymentMethod={paymentMethod}
        setPaymentMethod={(val: any) => setPaymentMethod(val)}
        currency={currency}
        setCurrency={setCurrency}
        exchangeRate={exchangeRate}
        setExchangeRate={setExchangeRate}
        branding={branding}
        items={items}
        updateItem={updateItem}
        removeItem={removeItem}
        notes={notes}
        setNotes={setNotes}
        totals={totals}
        onQuickCariAdd={(searchStr) => {
          setQuickCariSearchInitial(searchStr);
          setShowQuickCariModal(true);
        }}
      />

      <SalesInvoiceDetailsModal 
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        invoice={selectedInvoice}
        isTr={isTr}
        invoiceRef={invoiceRef}
        handlePrint={handlePrint}
      />

      <SalesInvoiceHtmlModal 
        isOpen={showHtmlModal}
        onClose={() => setShowHtmlModal(false)}
        htmlContent={htmlContent}
        htmlLoading={htmlLoading}
        isTr={isTr}
      />

      <QuickProductModal 
        isOpen={showQuickProductModal}
        onClose={() => setShowQuickProductModal(false)}
        isTr={isTr}
        quickProductForm={quickProductForm}
        setQuickProductForm={setQuickProductForm}
        handleQuickProductSubmit={handleQuickProductSubmit}
      />

      <QuickCariModal
        isOpen={showQuickCariModal}
        onClose={() => setShowQuickCariModal(false)}
        isTr={isTr}
        onSubmit={handleQuickCariSubmit}
        initialValue={quickCariSearchInitial}
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
                onClick={handleExportExcel}
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
                  <p className="text-xs text-slate-500 mt-1">{isTr ? 'Satış Faturası' : 'Sales Invoice'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{invoice.invoice_number}</p>
                  <p className="text-xs text-slate-500">{new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
                <div>
                  <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">{isTr ? 'ALICI (MÜŞTERİ)' : 'CUSTOMER'}</p>
                  <p className="font-bold text-slate-800 text-sm">{invoice.customer_name || invoice.company_title || invoice.sale_customer_name}</p>
                  <p className="text-slate-500 mt-1">{invoice.customer_address || invoice.company_address || '-'}</p>
                  {invoice.tax_number && <p className="text-slate-500 mt-1">{isTr ? "VKN/TCKN:" : "Tax ID:"} {invoice.tax_number}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-400 uppercase tracking-widest mb-1">{isTr ? 'FATURA DETAYI' : 'DETAILS'}</p>
                  <p className="text-slate-600"><span className="font-bold">{isTr ? 'Para Birimi:' : 'Currency:'}</span> {invoice.currency}</p>
                  <p className="text-slate-600"><span className="font-bold">{isTr ? 'Ödeme Yöntemi:' : 'Payment:'}</span> {invoice.payment_method}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-200 mb-8">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase font-black border-b border-slate-200">
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
                      <td className="p-2 border border-slate-200 text-right font-bold">{(Number(item.total_price) + Number(item.tax_amount)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</td>
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
