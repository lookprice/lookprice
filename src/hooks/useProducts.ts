import * as XLSX from 'xlsx';
import { useState, useCallback } from "react";
import { api } from "../services/api";
import { Product } from "../types";

export const useProducts = (user: any, slug: string | undefined, includeBranches: boolean, branding: any, planLimits: Record<string, number>, lang: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPriceForm, setBulkPriceForm] = useState({ target: 'all', category: '', type: 'percentage', direction: 'increase', value: '', rounding: 'none' });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<any>({
    barcode: "",
    name: "",
    category: "",
    sub_category: "",
    brand: "",
    author: "",
    price: "",
    description: "",
    stock_quantity: "",
    unit: ""
  });
  const [currentStoreId, setCurrentStoreId] = useState<number | undefined>(user.store_id);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      let targetStoreId = user.store_id;
      
      if (user.role === 'superadmin') {
        if (slug) {
          const storeInfo = await api.getBranding(undefined, slug);
          if (storeInfo && storeInfo.id) {
            targetStoreId = storeInfo.id;
          } else if (storeInfo && storeInfo.error) {
            console.error("Store branding error:", storeInfo.error);
            return;
          }
        } else {
          window.location.href = "/admin";
          return;
        }
      }
      
      if (targetStoreId === undefined || targetStoreId === null) {
        console.error("No target store ID found");
        setLoading(false);
        return;
      }
      
      setCurrentStoreId(targetStoreId);

      const [productsRes] = await Promise.all([
        api.getProducts("", targetStoreId, includeBranches)
      ]);
      setProducts(Array.isArray(productsRes) ? productsRes : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [includeBranches, user.role, user.store_id, slug]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    
    const currentPlan = branding.plan || 'free';
    const limit = planLimits[currentPlan];
    if (!editingProduct && products.length >= limit) {
      alert(lang === 'tr' 
        ? `Hesap planı limitine ulaştınız (${limit} ürün). Lütfen planınızı yükseltin.` 
        : `You have reached your plan limit (${limit} products). Please upgrade your plan.`);
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    const catName = String(data.category).trim().toLocaleLowerCase('tr-TR');
    const matchedRule = branding?.category_tax_rules?.find((r: any) => r.category.trim().toLocaleLowerCase('tr-TR') === catName);
    if (matchedRule) {
      data.tax_rate = String(matchedRule.taxRate);
    } else if (catName === 'kitap') {
      data.tax_rate = '0';
    }

    const barcode = String(data.barcode || '').trim();
    if (!barcode) {
      alert(lang === 'tr' ? "Lütfen geçerli bir barkod giriniz." : "Please enter a valid barcode.");
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, data, targetStoreId);
      } else {
        await api.addProduct(data, targetStoreId);
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setShowDescription(false);
      fetchData();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      try {
        await api.deleteProduct(id, targetStoreId);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleDeleteAllProducts = async () => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Tüm ürünleri silmek istediğinize emin misiniz?" : "Are you sure you want to delete all products?")) {
      try {
        await api.deleteAllProducts(targetStoreId);
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleApplyTaxRule = async (category: string, taxRate: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const matchingProducts = products.filter(p => p.category?.trim().toLocaleLowerCase('tr-TR') === category.trim().toLocaleLowerCase('tr-TR') && p.tax_rate !== taxRate);
    
    if (matchingProducts.length === 0) {
      alert(lang === 'tr' ? `KDV'si %${taxRate} olmayan '${category}' ürünü bulunamadı.` : `No '${category}' products with non-${taxRate}% VAT found.`);
      return;
    }

    if (window.confirm(lang === 'tr' ? `${matchingProducts.length} adet '${category}' ürününün KDV'si %${taxRate} yapılacak. Emin misiniz?` : `VAT will be set to ${taxRate}% for ${matchingProducts.length} '${category}' products. Are you sure?`)) {
      try {
        setLoading(true);
        await api.bulkUpdateTax(category, taxRate, targetStoreId);
        alert(lang === 'tr' ? "KDV'ler başarıyla güncellendi." : "VATs updated successfully.");
        fetchData();
      } catch (error) {
        alert("Hata oluştu");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkPriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPriceForm.value || isNaN(Number(bulkPriceForm.value)) || Number(bulkPriceForm.value) <= 0) {
      alert(lang === 'tr' ? 'Lütfen geçerli bir değer giriniz.' : 'Please enter a valid value.');
      return;
    }

    if (bulkPriceForm.target === 'category' && !bulkPriceForm.category) {
      alert(lang === 'tr' ? 'Lütfen bir kategori seçiniz.' : 'Please select a category.');
      return;
    }

    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    
    let message = lang === 'tr' 
      ? `${bulkPriceForm.target === 'all' ? 'Tüm ürünlerin' : `'${bulkPriceForm.category}' kategorisindeki ürünlerin`} fiyatları `
      : `${bulkPriceForm.target === 'all' ? 'All products' : `Products in '${bulkPriceForm.category}'`} prices will be `;
    
    if (bulkPriceForm.type === 'percentage') {
      message += bulkPriceForm.direction === 'increase' ? `%${bulkPriceForm.value} artırılacak.` : `%${bulkPriceForm.value} düşürülecek.`;
    } else {
      message += bulkPriceForm.direction === 'increase' ? `${bulkPriceForm.value} ₺ artırılacak.` : `${bulkPriceForm.value} ₺ düşürülecek.`;
    }
    
    message += lang === 'tr' ? '\n\nBu işlem geri alınamaz. Emin misiniz?' : '\n\nThis action cannot be undone. Are you sure?';

    if (window.confirm(message)) {
      try {
        setLoading(true);
        const res = await api.bulkUpdatePrice(bulkPriceForm, targetStoreId);
        alert(lang === 'tr' ? `${res.data.count} ürünün fiyatı başarıyla güncellendi.` : `Prices of ${res.data.count} products updated successfully.`);
        setShowBulkPriceModal(false);
        fetchData();
      } catch (error: any) {
        alert(error.response?.data?.error || "Hata oluştu");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length > 0) {
        setImportColumns(data[0] as string[]);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    const currentPlan = branding.plan || 'free';
    const limit = planLimits[currentPlan];
    if (products.length >= limit) {
      alert(lang === 'tr' 
        ? `Hesap planı limitine ulaştınız (${limit} ürün). Lütfen planınızı yükseltin.` 
        : `You have reached your plan limit (${limit} products). Please upgrade your plan.`);
      return;
    }

    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('mapping', JSON.stringify(mapping));
    if (targetStoreId) formData.append('storeId', targetStoreId.toString());
    
    try {
      setIsImporting(true);
      await api.importProducts(formData, targetStoreId);
      setShowImportModal(false);
      setImportFile(null);
      setImportColumns([]);
      fetchData();
      alert(lang === 'tr' ? "İçe aktarma tamamlandı" : "Import completed");
    } catch (error) {
      alert(lang === 'tr' ? "Hata oluştu" : "An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportProducts = () => {
    const isTr = lang === 'tr';
    const data = products.map(p => ({
      [isTr ? 'Barkod' : 'Barcode']: p.barcode,
      [isTr ? 'Ürün Adı' : 'Product Name']: p.name,
      [isTr ? 'Kategori' : 'Category']: p.category,
      [isTr ? 'Fiyat' : 'Price']: p.price,
      [isTr ? 'Para Birimi' : 'Currency']: p.currency,
      [isTr ? 'Stok' : 'Stock']: p.stock_quantity,
      [isTr ? 'Açıklama' : 'Description']: p.description
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Ürünler" : "Products");
    XLSX.writeFile(wb, `Urun_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return {
    products, setProducts,
    loading, setLoading,
    showProductModal, setShowProductModal,
    showBulkPriceModal, setShowBulkPriceModal,
    bulkPriceForm, setBulkPriceForm,
    editingProduct, setEditingProduct,
    showDescription, setShowDescription,
    showImportModal, setShowImportModal,
    isImporting, setIsImporting,
    importFile, setImportFile,
    importColumns, setImportColumns,
    mapping, setMapping,
    handleAddProduct,
    handleDeleteProduct,
    handleDeleteAllProducts,
    handleApplyTaxRule,
    handleBulkPriceSubmit,
    handleFileSelect,
    handleImport,
    handleExportProducts,
    fetchData,
    currentStoreId
  };
};
