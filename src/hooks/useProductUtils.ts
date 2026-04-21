import { useState } from "react";
import * as XLSX from 'xlsx';
import { api } from "../services/api";
import { translations } from "../translations";
import { Product } from "../types";

export const useProductUtils = (user: any, currentStoreId: number | undefined, includeBranches: boolean, products: Product[], lang: string, fetchData: (background?: boolean) => Promise<void>) => {
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPriceForm, setBulkPriceForm] = useState({ target: 'all', category: '', type: 'percentage', direction: 'increase', value: '', rounding: 'none' });

  const handleApplyTaxRule = async (category: string, taxRate: number, setLoading: (l: boolean) => void) => {
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
        alert(lang === 'tr' ? `Hata oluştu: ${error.message}` : `Error occurred: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkPriceSubmit = async (e: React.FormEvent, setLoading: (l: boolean) => void) => {
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
        if (res.error) throw new Error(res.error);
        alert(lang === 'tr' ? `${res.count} ürünün fiyatı başarıyla güncellendi.` : `Prices of ${res.count} products updated successfully.`);
        setBulkPriceForm({ target: 'all', category: '', type: 'percentage', direction: 'increase', value: '', rounding: 'none' });
        setShowBulkPriceModal(false);
        fetchData(true);
      } catch (error: any) {
        alert(error.message || "Hata oluştu");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkRecalculatePrice2 = async (setLoading: (l: boolean) => void) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Tüm ürünlerin 2. satış fiyatları (KDV Hariç), mevcut satış fiyatları ve KDV oranlarına göre yeniden hesaplanacak. Emin misiniz?" : "All 2nd sale prices (Excl. VAT) will be recalculated based on current sales prices and VAT rates. Are you sure?")) {
      try {
        setLoading(true);
        const res = await api.bulkRecalculatePrice2(targetStoreId);
        if (res.error) throw new Error(res.error);
        alert(lang === 'tr' ? `${res.count} ürünün 2. fiyatı başarıyla güncellendi.` : `2nd prices of ${res.count} products updated successfully.`);
        fetchData(true);
      } catch (error: any) {
        alert(error.message || "Hata oluştu");
      } finally {
        setLoading(false);
      }
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

  return { showBulkPriceModal, setShowBulkPriceModal, bulkPriceForm, setBulkPriceForm, handleApplyTaxRule, handleBulkPriceSubmit, handleBulkRecalculatePrice2, handleExportProducts };
};
