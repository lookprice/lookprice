import { toast } from 'sonner';
import { api } from '../services/api';

export const useQuotationActions = (
  currentStoreId: number | undefined, 
  lang: string, 
  branding: any, 
  fetchProductsData: () => void, 
  fetchQuotations: () => void,
  setQuotationItems: any,
  setShowQuotationModal: (val: boolean) => void,
  setEditingQuotation: (val: any) => void,
  setQuickProductForm: any,
  setShowQuickProductModal: (val: boolean) => void,
  setSelectedQuotationDetails: any,
  selectedQuotationDetails: any
) => {

  const handleQuickAddProduct = async (e: React.FormEvent, quickProductForm: any) => {
    e.preventDefault();
    const savePromise = (async () => {
      const price = Number(quickProductForm.price);
      const taxRate = (quickProductForm.tax_rate !== undefined && quickProductForm.tax_rate !== "") ? Number(quickProductForm.tax_rate) : Number(branding?.default_tax_rate !== undefined ? branding.default_tax_rate : 20);
      const currency = branding?.default_currency || 'TRY';
      const price_2 = price / (1 + taxRate / 100);

      const newProduct = await api.addProduct({
        ...quickProductForm,
        tax_rate: taxRate,
        price,
        price_2,
        currency,
        price_2_currency: currency,
        category: 'Hızlı Ekleme',
        stock_quantity: 0,
        min_stock_level: 0
      }, currentStoreId || undefined);
      
      setQuotationItems((prev: any) => [...prev, {
        product_id: newProduct.id,
        product_name: newProduct.name,
        barcode: newProduct.barcode,
        quantity: 1,
        unit_price: Number(newProduct.price),
        tax_rate: (newProduct.tax_rate !== undefined && newProduct.tax_rate !== null) ? Number(newProduct.tax_rate) : taxRate,
        total_price: Number(newProduct.price)
      }]);
      
      fetchProductsData();
      return newProduct;
    })();

    setShowQuickProductModal(false);
    setQuickProductForm({ name: '', price: '', barcode: '', tax_rate: String(branding?.default_tax_rate ?? 20) });

    toast.promise(savePromise, {
      loading: lang === 'tr' ? "Ürün ekleniyor..." : "Adding product...",
      success: lang === 'tr' ? "Ürün eklendi" : "Product added",
      error: lang === 'tr' ? "Ürün eklenirken hata oluştu" : "Error adding product"
    });
  };

  const handleAddQuotation = async (e: React.FormEvent, quotationItems: any, editingQuotation: any) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    const quotationData = {
      customer_name: data.customer_name,
      customer_title: data.customer_title,
      total_amount: quotationItems.reduce((sum: number, item: any) => sum + Number(item.total_price), 0),
      currency: data.currency,
      exchange_rate: Number(data.exchange_rate),
      notes: data.notes,
      items: quotationItems,
      company_id: data.company_id ? parseInt(String(data.company_id)) : null,
      tax_number: data.tax_number,
      tax_office: data.tax_office,
      expiry_date: data.expiry_date,
      payment_method: data.payment_method,
      due_date: data.due_date
    };

    const savePromise = (async () => {
      let res;
      if (editingQuotation) {
        res = await api.updateQuotation(editingQuotation.id, quotationData, currentStoreId || undefined);
      } else {
        res = await api.addQuotation(quotationData, currentStoreId || undefined);
      }
      fetchQuotations();
      return res;
    })();

    setShowQuotationModal(false);
    setEditingQuotation(null);
    setQuotationItems([]);

    toast.promise(savePromise, {
      loading: lang === 'tr' ? "Teklif kaydediliyor..." : "Saving quotation...",
      success: lang === 'tr' ? "Teklif kaydedildi" : "Quotation saved",
      error: lang === 'tr' ? "Hata oluştu" : "Error occurred"
    });
  };

  const handleApproveQuotation = async (quotation: any) => {
    const approvePromise = (async () => {
      const res = await api.approveQuotation(quotation.id, {}, currentStoreId || undefined);
      fetchQuotations();
      if (selectedQuotationDetails?.id === quotation.id) {
        setSelectedQuotationDetails((prev: any) => prev ? { ...prev, status: 'approved' as any } : null);
      }
      return res;
    })();

    toast.promise(approvePromise, {
      loading: lang === 'tr' ? "Onaylanıyor..." : "Approving...",
      success: lang === 'tr' ? "Onaylandı" : "Approved",
      error: lang === 'tr' ? "Hata oluştu" : "Error occurred"
    });
  };

  const handleCancelQuotation = async (id: number) => {
    const cancelPromise = (async () => {
      const res = await api.cancelQuotation(id, currentStoreId || undefined);
      fetchQuotations();
      if (selectedQuotationDetails?.id === id) {
        setSelectedQuotationDetails((prev: any) => prev ? { ...prev, status: 'cancelled' as any } : null);
      }
      return res;
    })();

    toast.promise(cancelPromise, {
      loading: lang === 'tr' ? "İptal ediliyor..." : "Cancelling...",
      success: lang === 'tr' ? "İptal edildi" : "Cancelled",
      error: lang === 'tr' ? "Hata oluştu" : "Error occurred"
    });
  };

  const handleDeleteQuotation = async (id: number) => {
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      const deletePromise = (async () => {
        const res = await api.deleteQuotation(id, currentStoreId || undefined);
        fetchQuotations();
        return res;
      })();

      toast.promise(deletePromise, {
        loading: lang === 'tr' ? "Siliniyor..." : "Deleting...",
        success: lang === 'tr' ? "Silindi" : "Deleted",
        error: lang === 'tr' ? "Hata oluştu" : "Error occurred"
      });
    }
  };

  return { handleQuickAddProduct, handleAddQuotation, handleApproveQuotation, handleCancelQuotation, handleDeleteQuotation };
};
