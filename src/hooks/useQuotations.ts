import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { Quotation, QuotationItem } from '../types';

export const useQuotations = (currentStoreId: number | undefined, fetchProductsData: () => void, branding: any, lang: string) => {
  const [quotationList, setQuotationList] = useState<Quotation[]>([]);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [quotationProductSearch, setQuotationProductSearch] = useState("");
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ name: '', price: '', barcode: '', tax_rate: String(branding?.default_tax_rate ?? 20) });
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [quotationSearch, setQuotationSearch] = useState("");
  const [quotationStatusFilter, setQuotationStatusFilter] = useState("all");
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState<Quotation | null>(null);
  const [showQuotationDetailsModal, setShowQuotationDetailsModal] = useState(false);

  const fetchQuotations = useCallback(async () => {
    if (!currentStoreId) return;
    try {
      const data = await api.getQuotations(quotationSearch, quotationStatusFilter, currentStoreId);
      setQuotationList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    }
  }, [currentStoreId, quotationSearch, quotationStatusFilter]);

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const price = Number(quickProductForm.price);
      const taxRate = Number(quickProductForm.tax_rate) || Number(branding?.default_tax_rate ?? 20);
      const currency = branding?.default_currency || 'TRY';
      const price_2 = price / (1 + taxRate / 100);

      const newProduct = await api.addProduct({
        ...quickProductForm,
        price,
        price_2,
        currency,
        price_2_currency: currency,
        category: 'Hızlı Ekleme',
        stock_quantity: 0,
        min_stock_level: 0
      }, currentStoreId || undefined);
      
      setQuotationItems(prev => [...prev, {
        product_id: newProduct.id,
        product_name: newProduct.name,
        barcode: newProduct.barcode,
        quantity: 1,
        unit_price: Number(newProduct.price),
        tax_rate: Number(newProduct.tax_rate) || Number(branding?.default_tax_rate ?? 20),
        total_price: Number(newProduct.price)
      }]);
      
      setShowQuickProductModal(false);
      setQuickProductForm({ name: '', price: '', barcode: '', tax_rate: String(branding?.default_tax_rate ?? 20) });
      fetchProductsData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleAddQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    const quotationData = {
      customer_name: data.customer_name,
      customer_title: data.customer_title,
      total_amount: quotationItems.reduce((sum, item) => sum + Number(item.total_price), 0),
      currency: data.currency || branding.default_currency,
      notes: data.notes,
      items: quotationItems,
      company_id: data.company_id ? parseInt(String(data.company_id)) : null,
      tax_number: data.tax_number,
      tax_office: data.tax_office,
      expiry_date: data.expiry_date,
      payment_method: data.payment_method,
      due_date: data.due_date
    };

    try {
      if (editingQuotation) {
        await api.updateQuotation(editingQuotation.id, quotationData, currentStoreId || undefined);
      } else {
        await api.addQuotation(quotationData, currentStoreId || undefined);
      }
      setShowQuotationModal(false);
      setEditingQuotation(null);
      setQuotationItems([]);
      fetchQuotations();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleApproveQuotation = async (quotation: any) => {
    try {
      await api.approveQuotation(quotation.id, {}, currentStoreId || undefined);
      
      // Teklif onaylandıktan sonra fatura oluştur
      const invoiceData = {
        customer_name: quotation.customer_name,
        customer_title: quotation.customer_title,
        total_amount: quotation.total_amount,
        currency: quotation.currency,
        items: quotation.items,
        company_id: quotation.company_id,
        tax_number: quotation.tax_number,
        tax_office: quotation.tax_office,
        payment_method: quotation.payment_method,
        due_date: quotation.due_date,
        quotation_id: quotation.id
      };
      
      await api.addSalesInvoice(invoiceData, currentStoreId || undefined);
      
      fetchQuotations();
      if (selectedQuotationDetails?.id === quotation.id) {
        setSelectedQuotationDetails(prev => prev ? { ...prev, status: 'approved' as any } : null);
      }
    } catch (error) {
      console.error('Error approving quotation or creating invoice:', error);
      alert("Hata oluştu: Teklif onaylanamadı veya fatura oluşturulamadı.");
    }
  };

  const handleCancelQuotation = async (id: number) => {
    try {
      await api.cancelQuotation(id, currentStoreId || undefined);
      fetchQuotations();
      if (selectedQuotationDetails?.id === id) {
        setSelectedQuotationDetails(prev => prev ? { ...prev, status: 'cancelled' as any } : null);
      }
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteQuotation = async (id: number) => {
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      try {
        await api.deleteQuotation(id, currentStoreId || undefined);
        fetchQuotations();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  return {
    quotationList, setQuotationList,
    showQuotationModal, setShowQuotationModal,
    showNotes, setShowNotes,
    quotationProductSearch, setQuotationProductSearch,
    showQuickProductModal, setShowQuickProductModal,
    quickProductForm, setQuickProductForm,
    quotationItems, setQuotationItems,
    editingQuotation, setEditingQuotation,
    quotationSearch, setQuotationSearch,
    quotationStatusFilter, setQuotationStatusFilter,
    selectedQuotationDetails, setSelectedQuotationDetails,
    showQuotationDetailsModal, setShowQuotationDetailsModal,
    fetchQuotations,
    handleQuickAddProduct,
    handleAddQuotation,
    handleApproveQuotation,
    handleCancelQuotation,
    handleDeleteQuotation
  };
};
