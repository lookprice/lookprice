import * as XLSX from 'xlsx';
import { useState, useCallback, useEffect } from "react";
import { api } from "../services/api";
import { translations } from "../translations";
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
  const [convertCurrency, setConvertCurrency] = useState(false);
  const [currentStoreId, setCurrentStoreId] = useState<number | undefined>(user.store_id);

  const fetchData = useCallback(async (background = false) => {
    try {
      if (!background) setLoading(true);
      
      let targetStoreId = user.store_id;
      
      if (user.role === 'superadmin') {
        if (slug) {
          const storeInfo = await api.getBranding(undefined, slug);
          if (storeInfo && storeInfo.id) {
            targetStoreId = storeInfo.id;
          } else if (storeInfo && storeInfo.error) {
            console.error("Store branding error:", storeInfo.error);
            if (!background) setLoading(false);
            return;
          }
        } else {
          window.location.href = "/admin";
          return;
        }
      }
      
      if (targetStoreId === undefined || targetStoreId === null) {
        console.error("No target store ID found");
        if (!background) setLoading(false);
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
      if (!background) setLoading(false);
    }
  }, [includeBranches, user.role, user.store_id, slug]);

  useState(() => {
    fetchData();
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    const rawData = Object.fromEntries(formData.entries());
    
    // Parse numeric fields with comma support
    const data: any = { 
      ...rawData,
      is_web_sale: rawData.is_web_sale === 'on' || rawData.is_web_sale === 'true',
      product_type: rawData.product_type || 'product'
    };
    ['price', 'price_2', 'cost_price', 'tax_rate'].forEach(field => {
      if (data[field]) {
        data[field] = Number(String(data[field]).replace(',', '.'));
      }
    });
    ['stock_quantity', 'min_stock_level'].forEach(field => {
      if (data[field]) {
        data[field] = Math.floor(Number(String(data[field]).replace(',', '.')));
      }
    });

    // Ensure price_2_currency matches currency
    data.price_2_currency = data.currency;

    // Apply category-specific tax rules only for new products if not provided
    if (!editingProduct && !data.tax_rate) {
      const catName = String(data.category || '').trim().toLocaleLowerCase('tr-TR');
      const matchedRule = branding?.category_tax_rules?.find((r: any) => r.category.trim().toLocaleLowerCase('tr-TR') === catName);
      if (matchedRule) {
        data.tax_rate = String(matchedRule.taxRate);
      } else if (catName === 'kitap') {
        data.tax_rate = '0';
      }
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
      fetchData(true);
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      try {
        await api.deleteProduct(id, targetStoreId);
        fetchData(true);
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
        fetchData(true);
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleApplyTaxRule = async (category: string, taxRate: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const matchingProducts = products.filter(p => 
      p.category?.trim().toLocaleLowerCase('tr-TR') === category.trim().toLocaleLowerCase('tr-TR') && 
      Number(p.tax_rate) !== Number(taxRate)
    );
    
    if (matchingProducts.length === 0) {
      alert(lang === 'tr' ? `KDV'si %${taxRate} olmayan '${category}' ürünü bulunamadı.` : `No '${category}' products with non-${taxRate}% VAT found.`);
      return;
    }

    if (window.confirm(lang === 'tr' ? `${matchingProducts.length} adet '${category}' ürününün KDV'si %${taxRate} yapılacak. Emin misiniz?` : `VAT will be set to ${taxRate}% for ${matchingProducts.length} '${category}' products. Are you sure?`)) {
      try {
        setLoading(true);
        const result = await api.bulkUpdateTax(category, taxRate, targetStoreId, includeBranches);
        if (result && result.error) {
          throw new Error(result.error);
        }
        alert(lang === 'tr' ? "KDV'ler başarıyla güncellendi." : "VATs updated successfully.");
        fetchData(true);
      } catch (error: any) {
        console.error("Bulk tax update error:", error);
        alert(lang === 'tr' ? `Hata oluştu: ${error.message}` : `Error occurred: ${error.message}`);
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
        fetchData(true);
      } catch (error: any) {
        alert(error.response?.data?.error || "Hata oluştu");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkRecalculatePrice2 = async () => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Tüm ürünlerin 2. satış fiyatları (KDV Hariç), mevcut satış fiyatları ve KDV oranlarına göre yeniden hesaplanacak. Emin misiniz?" : "All 2nd sale prices (Excl. VAT) will be recalculated based on current sales prices and VAT rates. Are you sure?")) {
      try {
        setLoading(true);
        const res = await api.bulkRecalculatePrice2(targetStoreId);
        alert(lang === 'tr' ? `${res.count} ürünün 2. fiyatı başarıyla güncellendi.` : `2nd prices of ${res.count} products updated successfully.`);
        fetchData(true);
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
    formData.append('convertCurrency', String(convertCurrency));
    if (targetStoreId) formData.append('storeId', targetStoreId.toString());
    
    try {
      setIsImporting(true);
      await api.importProducts(formData, targetStoreId);
      setShowImportModal(false);
      setImportFile(null);
      setImportColumns([]);
      fetchData(true);
      alert(lang === 'tr' ? "İçe aktarma tamamlandı" : "Import completed");
    } catch (error) {
      alert(lang === 'tr' ? "Hata oluştu" : "An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportProducts = () => {
    const isTr = lang === 'tr';
    const t = translations[lang].dashboard;
    const data = products.map(p => ({
      [t.barcode]: p.barcode,
      [t.productName]: p.name,
      [isTr ? 'Kategori' : 'Category']: p.category,
      [isTr ? 'Alt Kategori' : 'Sub-Category']: p.sub_category || '',
      [isTr ? 'Marka' : 'Brand']: p.brand || '',
      [isTr ? 'Yazar' : 'Author']: p.author || '',
      [t.price]: p.price,
      [isTr ? 'Para Birimi' : 'Currency']: p.currency,
      [isTr ? 'Maliyet Fiyatı' : 'Cost Price']: p.cost_price || 0,
      [isTr ? 'Maliyet Para Birimi' : 'Cost Currency']: p.cost_currency || '',
      [t.stock]: p.stock_quantity,
      [isTr ? 'Min Stok' : 'Min Stock']: p.min_stock_level || 0,
      [isTr ? 'Birim' : 'Unit']: p.unit || '',
      [isTr ? 'KDV (%)' : 'Tax Rate (%)']: p.tax_rate || 0,
      [isTr ? 'Etiketler' : 'Labels']: Array.isArray(p.labels) ? p.labels.join(', ') : '',
      [isTr ? 'Görsel URL' : 'Image URL']: p.image_url || '',
      [isTr ? 'Açıklama' : 'Description']: p.description || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Ürünler" : "Products");
    XLSX.writeFile(wb, `${isTr ? 'Urun_Listesi' : 'Product_List'}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    convertCurrency, setConvertCurrency,
    handleAddProduct,
    handleDeleteProduct,
    handleDeleteAllProducts,
    handleApplyTaxRule,
    handleBulkPriceSubmit,
    handleBulkRecalculatePrice2,
    handleFileSelect,
    handleImport,
    handleExportProducts,
    fetchData,
    currentStoreId
  };
};
