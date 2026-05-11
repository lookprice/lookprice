import { toast } from 'sonner';
import { useState } from "react";
import { api } from "../services/api";
import { Product } from "../types";

export const useProductActions = (user: any, currentStoreId: number | undefined, products: Product[], lang: string, fetchData: (background?: boolean) => Promise<void>) => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleAddProduct = async (e: React.FormEvent, editingProduct: Product | null, branding: any, planLimits: Record<string, number>, setShowProductModal: (val: boolean) => void, setEditingProduct: (val: Product | null) => void, setShowDescription: (val: boolean) => void) => {
    e.preventDefault();
    const targetStoreId = (user.role === 'superadmin' || user.store_id !== currentStoreId) ? currentStoreId : undefined;
    
    const currentPlan = branding.plan || 'free';
    const limit = planLimits[currentPlan];
    if (!editingProduct && products.length >= limit) {
      toast.error(lang === 'tr' 
        ? `Hesap planı limitine ulaştınız (${limit} ürün). Lütfen planınızı yükseltin.` 
        : `You have reached your plan limit (${limit} products). Please upgrade your plan.`);
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const rawData = Object.fromEntries(formData.entries());
    
    // Collect sector-specific data
    const sector_data: any = {};
    Object.keys(rawData).forEach(key => {
      if (key.startsWith('sector_spec_')) {
        const specKey = key.replace('sector_spec_', '');
        sector_data[specKey] = rawData[key];
        delete rawData[key];
      }
    });

    const data: any = { 
      ...rawData,
      sector_data,
      is_web_sale: rawData.is_web_sale === 'on' || rawData.is_web_sale === 'true',
      product_type: rawData.product_type || 'product',
      sync_group: rawData.sync_group === 'on'
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

    data.price_2_currency = data.currency;

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
      toast.error(lang === 'tr' ? "Lütfen geçerli bir barkod giriniz." : "Please enter a valid barcode.");
      return;
    }

    const isDuplicate = products.some(p => p.barcode === barcode && p.id !== editingProduct?.id);
    if (isDuplicate) {
      toast.error(lang === 'tr' ? "Bu barkod numarasına sahip başka bir ürün zaten var!" : "Another product with this barcode already exists!");
      return;
    }

    const savePromise = (async () => {
      let res;
      if (editingProduct) {
        res = await api.updateProduct(editingProduct.id, data, targetStoreId);
      } else {
        res = await api.addProduct(data, targetStoreId);
      }
      fetchData(true);
      return res;
    })();

    setShowProductModal(false);
    setEditingProduct(null);
    setShowDescription(false);

    toast.promise(savePromise, {
      loading: lang === 'tr' ? "Ürün kaydediliyor..." : "Saving product...",
      success: lang === 'tr' ? "Ürün başarıyla kaydedildi" : "Product saved successfully",
      error: lang === 'tr' ? "Ürün kaydedilemedi" : "Failed to save product"
    });
  };

  const handleDeleteProduct = async (id: number) => {
    const targetStoreId = (user.role === 'superadmin' || user.store_id !== currentStoreId) ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      const deletePromise = (async () => {
        const res = await api.deleteProduct(id, targetStoreId);
        fetchData(true);
        return res;
      })();

      toast.promise(deletePromise, {
        loading: lang === 'tr' ? "Ürün siliniyor..." : "Deleting product...",
        success: lang === 'tr' ? "Ürün silindi" : "Product deleted",
        error: lang === 'tr' ? "Ürün silinemedi" : "Failed to delete product"
      });
    }
  };

  const handleDeleteAllProducts = async () => {
    const targetStoreId = (user.role === 'superadmin' || user.store_id !== currentStoreId) ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Tüm ürünleri silmek istediğinize emin misiniz?" : "Are you sure you want to delete all products?")) {
      const deletePromise = (async () => {
        const res = await api.deleteAllProducts(targetStoreId);
        fetchData(true);
        return res;
      })();

      toast.promise(deletePromise, {
        loading: lang === 'tr' ? "Tüm ürünler siliniyor..." : "Deleting all products...",
        success: lang === 'tr' ? "Tüm ürünler silindi" : "All products deleted",
        error: lang === 'tr' ? "Ürünler silinemedi" : "Failed to delete products"
      });
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    if (!ids || ids.length === 0) return;
    const targetStoreId = (user.role === 'superadmin' || user.store_id !== currentStoreId) ? currentStoreId : undefined;
    
    const deletePromise = (async () => {
      const res = await api.deleteBulkProducts(ids, targetStoreId);
      fetchData(true);
      return res;
    })();

    toast.promise(deletePromise, {
      loading: lang === 'tr' ? `${ids.length} ürün siliniyor...` : `Deleting ${ids.length} products...`,
      success: lang === 'tr' ? `${ids.length} ürün silindi` : `${ids.length} products deleted`,
      error: lang === 'tr' ? "Ürünler silinemedi" : "Failed to delete products"
    });
  };

  return { handleAddProduct, handleDeleteProduct, handleDeleteAllProducts, handleBulkDelete, editingProduct, setEditingProduct };
};
