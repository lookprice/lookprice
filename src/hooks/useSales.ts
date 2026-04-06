import { useState, useCallback } from "react";
import { api } from "../services/api";
import * as XLSX from 'xlsx';

export const useSales = (
  user: any, 
  currentStoreId: number | undefined, 
  branding: any, 
  lang: string, 
  fetchData: () => void
) => {
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesStatusFilter, setSalesStatusFilter] = useState("all");
  const [salesStartDate, setSalesStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [salesEndDate, setSalesEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showSaleDetailsModal, setShowSaleDetailsModal] = useState(false);
  
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'bank' | 'term'>('cash');
  const [dueDate, setDueDate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');
  const [createCompanyFromSale, setCreateCompanyFromSale] = useState(false);
  
  const [completingSale, setCompletingSale] = useState(false);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'credit_card' | 'bank'>('cash');

  const fetchSales = useCallback(async () => {
    if (!currentStoreId) return;
    try {
      setSalesLoading(true);
      const res = await api.getSales(salesStatusFilter, salesStartDate, salesEndDate, currentStoreId);
      setSales(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Fetch sales error:", error);
    } finally {
      setSalesLoading(false);
    }
  }, [salesStatusFilter, salesStartDate, salesEndDate, currentStoreId]);

  const getConvertedPrice = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    const rates = branding?.currency_rates || { "USD": 45.0, "EUR": 48.5, "GBP": 56.2 };
    
    if (toCurrency === 'TRY') {
      const rate = rates[fromCurrency as keyof typeof rates] || 1;
      return amount * rate;
    }
    
    if (fromCurrency === 'TRY') {
      const rate = rates[toCurrency as keyof typeof rates] || 1;
      return amount / rate;
    }
    
    const fromRate = rates[fromCurrency as keyof typeof rates] || 1;
    const toRate = rates[toCurrency as keyof typeof rates] || 1;
    return (amount * fromRate) / toRate;
  };

  const handleUpdateSaleItem = (idx: number, field: 'quantity' | 'unit_price', value: string) => {
    if (!selectedSale) return;
    const newItems = [...(selectedSale.items || [])];
    
    const val = value === '' ? 0 : Number(String(value).replace(',', '.'));
    
    newItems[idx] = { 
      ...newItems[idx], 
      [field]: value, // Keep the string value for the input field
      total_price: field === 'quantity' ? val * (Number(String(newItems[idx].unit_price).replace(',', '.')) || 0) : (Number(String(newItems[idx].quantity).replace(',', '.')) || 0) * val
    };
    
    const newTotal = newItems.reduce((acc, curr) => {
      const itemTotal = Number(curr.total_price);
      const converted = getConvertedPrice(itemTotal, curr.currency || selectedSale.currency, selectedSale.currency);
      return acc + converted;
    }, 0);
    setSelectedSale({ ...selectedSale, items: newItems, total_amount: newTotal });
  };

  const handleRemoveSaleItem = (idx: number) => {
    if (!selectedSale) return;
    const newItems = (selectedSale.items || []).filter((_: any, i: number) => i !== idx);
    const newTotal = newItems.reduce((acc, curr) => {
      const itemTotal = Number(curr.total_price);
      const converted = getConvertedPrice(itemTotal, curr.currency || selectedSale.currency, selectedSale.currency);
      return acc + converted;
    }, 0);
    setSelectedSale({ ...selectedSale, items: newItems, total_amount: newTotal });
  };

  const handleCancelPendingSale = async (saleId: number) => {
    if (!window.confirm(lang === 'tr' ? "Siparişi iptal etmek istediğinize emin misiniz?" : "Are you sure you want to cancel this order?")) return;
    try {
      setCompletingSale(true);
      const res = await api.cancelSale(saleId, currentStoreId);
      if (res.success) {
        setShowSaleDetailsModal(false);
        fetchSales();
      } else {
        alert(res.error || "Error cancelling sale");
      }
    } catch (error: any) {
      alert(error.message || "Error cancelling sale");
    } finally {
      setCompletingSale(false);
    }
  };

  const handleCompletePendingSale = async (saleId: number) => {
    try {
      setCompletingSale(true);
      const res = await api.completeSale(saleId, {
        paymentMethod: posPaymentMethod,
        items: selectedSale.items
      }, currentStoreId);
      
      if (res.success) {
        alert(lang === 'tr' ? "Satış tamamlandı" : "Sale completed");
        if (res.fiscal) {
          alert(`${lang === 'tr' ? 'Mali fiş oluşturuldu' : 'Fiscal receipt generated'}\n${lang === 'tr' ? 'Fiş No' : 'Receipt No'}: ${res.fiscal.receiptNo}\nZ No: ${res.fiscal.zNo}`);
        }
        setShowSaleDetailsModal(false);
        fetchSales();
      } else {
        alert(res.error || "Error completing sale");
      }
    } catch (error: any) {
      alert(error.message || "Error completing sale");
    } finally {
      setCompletingSale(false);
    }
  };

  const handleConvertToSale = (quotation: any) => {
    setSelectedQuotation(quotation);
    setPaymentMethod('cash');
    setDueDate('');
    setSaleNotes('');
    setShowSaleModal(true);
  };

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation) return;
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;

    setIsConfirmingSale(true);
    try {
      let companyId = selectedQuotation.company_id;

      if (createCompanyFromSale && !companyId) {
        const newCompany = await api.addCompany({
          title: selectedQuotation.customer_title || selectedQuotation.customer_name,
          email: selectedQuotation.customer_email || '',
          phone: selectedQuotation.customer_phone || '',
          address: selectedQuotation.customer_address || '',
          tax_office: '',
          tax_number: ''
        }, targetStoreId);
        companyId = newCompany.id;
        
        await api.updateQuotation(selectedQuotation.id, {
          ...selectedQuotation,
          company_id: companyId
        }, targetStoreId);
      }

      const saleData = {
        payment_method: paymentMethod,
        due_date: paymentMethod === 'term' ? dueDate : null,
        notes: saleNotes
      };

      await api.approveQuotation(selectedQuotation.id, saleData, targetStoreId);
      
      setShowSaleModal(false);
      setSelectedQuotation(null);
      setCreateCompanyFromSale(false);
      fetchData();
      alert(lang === 'tr' ? "Satış başarıyla kaydedildi" : "Sale recorded successfully");
    } catch (error: any) {
      alert(error.response?.data?.error || (lang === 'tr' ? "Hata oluştu" : "An error occurred"));
    } finally {
      setIsConfirmingSale(false);
    }
  };

  const handleDeleteSale = async (id: number) => {
    if (window.confirm(lang === 'tr' ? "Bu satışı silmek istediğinize emin misiniz?" : "Are you sure you want to delete this sale?")) {
      try {
        await api.deleteSale(id, currentStoreId);
        fetchSales();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleExportSales = () => {
    const isTr = lang === 'tr';
    const data = sales.map(s => ({
      [isTr ? 'Tarih' : 'Date']: new Date(s.created_at).toLocaleString(isTr ? 'tr-TR' : 'en-US'),
      [isTr ? 'Müşteri' : 'Customer']: s.customer_name || '-',
      [isTr ? 'Tutar' : 'Amount']: s.total_amount,
      [isTr ? 'Para Birimi' : 'Currency']: s.currency,
      [isTr ? 'Ödeme Yöntemi' : 'Payment Method']: s.payment_method,
      [isTr ? 'Durum' : 'Status']: s.status
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Satışlar" : "Sales");
    XLSX.writeFile(wb, `Satis_Raporu_${salesStartDate}_${salesEndDate}.xlsx`);
  };

  return {
    sales, setSales,
    salesLoading, setSalesLoading,
    salesStatusFilter, setSalesStatusFilter,
    salesStartDate, setSalesStartDate,
    salesEndDate, setSalesEndDate,
    selectedSale, setSelectedSale,
    showSaleDetailsModal, setShowSaleDetailsModal,
    showSaleModal, setShowSaleModal,
    isConfirmingSale, setIsConfirmingSale,
    selectedQuotation, setSelectedQuotation,
    paymentMethod, setPaymentMethod,
    dueDate, setDueDate,
    saleNotes, setSaleNotes,
    createCompanyFromSale, setCreateCompanyFromSale,
    completingSale, setCompletingSale,
    posPaymentMethod, setPosPaymentMethod,
    fetchSales,
    handleUpdateSaleItem,
    handleRemoveSaleItem,
    handleCancelPendingSale,
    handleCompletePendingSale,
    handleConvertToSale,
    handleConfirmSale,
    handleDeleteSale,
    handleExportSales,
    getConvertedPrice
  };
};
