import { useState, useCallback } from "react";
import { api } from "../services/api";

export const useQuotations = (currentStoreId: number | undefined, refreshProducts: () => Promise<void>, branding: any, lang: string) => {
  const [quotationList, setQuotationList] = useState<any[]>([]);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [quotationSearch, setQuotationSearch] = useState("");
  const [quotationStatusFilter, setQuotationStatusFilter] = useState("all");
  const [quotationProductSearch, setQuotationProductSearch] = useState("");
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProductForm, setQuickProductForm] = useState({ name: "", price: "", barcode: "", tax_rate: "" });
  const [quotationItems, setQuotationItems] = useState<any[]>([]);
  const [editingQuotation, setEditingQuotation] = useState<any>(null);
  const [selectedQuotationDetails, setSelectedQuotationDetails] = useState<any>(null);
  const [showQuotationDetailsModal, setShowQuotationDetailsModal] = useState(false);

  const fetchQuotations = useCallback(async (search: string, status: string) => {
    if (!currentStoreId) return;
    try {
      const res = await api.getQuotations(search, status, currentStoreId);
      setQuotationList(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Fetch quotations error:", error);
    }
  }, [currentStoreId]);

  const handleQuickAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productNameLower = quickProductForm.name.toLocaleLowerCase('tr-TR');
      let matchedRule = branding?.category_tax_rules?.find((r: any) => productNameLower.includes(r.category.toLocaleLowerCase('tr-TR')));
      
      let taxRate = Number(quickProductForm.tax_rate) || branding.default_tax_rate || 20;
      let category = '';

      if (matchedRule) {
        taxRate = matchedRule.taxRate;
        category = matchedRule.category;
      } else if (productNameLower.includes('kitap')) {
        taxRate = 0;
        category = 'Kitap';
      }

      const newProduct = await api.addProduct({
        name: quickProductForm.name,
        price: Number(quickProductForm.price),
        barcode: quickProductForm.barcode || `M-${Date.now()}`,
        currency: branding.default_currency || 'TRY',
        tax_rate: taxRate,
        stock: 0,
        status: 'active',
        category: category
      }, currentStoreId);

      setQuotationItems([...quotationItems, {
        product_id: newProduct.id,
        product_name: newProduct.name,
        barcode: newProduct.barcode,
        quantity: 1,
        unit_price: Number(newProduct.price),
        tax_rate: Number(newProduct.tax_rate),
        total_price: Number(newProduct.price)
      }]);

      setShowQuickProductModal(false);
      setQuotationProductSearch("");
      refreshProducts(); 
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleAddQuotation = async (e: React.FormEvent, companies: any[]) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    if (quotationItems.length === 0) {
      alert(lang === 'tr' ? "En az bir ürün eklemelisiniz" : "You must add at least one product");
      return;
    }

    if (quotationItems.some(item => !item.quantity || item.quantity <= 0)) {
      alert(lang === 'tr' ? "Lütfen tüm ürünler için geçerli bir adet girin" : "Please enter a valid quantity for all products");
      return;
    }

    const matchingCompany = companies.find(c => c.title.toLowerCase().trim() === (data.customer_name as string).toLowerCase().trim());
    const totalAmount = quotationItems.reduce((sum, item) => sum + Number(item.total_price), 0);

    const quotationData = {
      ...data,
      company_id: matchingCompany?.id || null,
      items: quotationItems,
      total_amount: totalAmount,
      currency: branding.default_currency || 'TRY'
    };

    try {
      if (editingQuotation) {
        await api.updateQuotation(editingQuotation.id, quotationData, currentStoreId);
      } else {
        await api.addQuotation(quotationData, currentStoreId);
      }
      setShowQuotationModal(false);
      setEditingQuotation(null);
      setQuotationItems([]);
      fetchQuotations();
      alert(lang === 'tr' ? "Teklif başarıyla kaydedildi" : "Quotation saved successfully");
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleApproveQuotation = async (id: number) => {
    try {
      await api.approveQuotation(id, {}, currentStoreId);
      fetchQuotations();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleCancelQuotation = async (id: number) => {
    if (window.confirm(lang === 'tr' ? "Bu teklifi iptal etmek istediğinize emin misiniz?" : "Are you sure you want to cancel this quotation?")) {
      try {
        await api.cancelQuotation(id, currentStoreId);
        fetchQuotations();
        alert(lang === 'tr' ? "Teklif iptal edildi" : "Quotation cancelled");
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleDeleteQuotation = async (id: number) => {
    if (window.confirm(lang === 'tr' ? "Bu teklifi silmek istediğinize emin misiniz?" : "Are you sure you want to delete this quotation?")) {
      try {
        await api.deleteQuotation(id, currentStoreId);
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
    fetchQuotations
  };
};
