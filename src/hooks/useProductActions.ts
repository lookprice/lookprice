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

    const hasVariantsRaw: any = rawData.has_variants;
    const isExplicitlyVariantsOff = hasVariantsRaw === undefined || hasVariantsRaw === false || hasVariantsRaw === 'false';
    
    // Parse allergens list from rawData
    let parsedAllergens: string[] = [];
    if (rawData.allergens_data) {
      try {
        parsedAllergens = JSON.parse(rawData.allergens_data as string);
      } catch (e) {
        parsedAllergens = [];
      }
    } else if (typeof rawData.allergens === 'string') {
      try {
        parsedAllergens = JSON.parse(rawData.allergens);
      } catch (e) {
        parsedAllergens = rawData.allergens.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (Array.isArray(rawData.allergens)) {
      parsedAllergens = rawData.allergens;
    }

    let marketplaceData: any = {};
    if (rawData.marketplace_data) {
      try {
        marketplaceData = typeof rawData.marketplace_data === 'string'
          ? JSON.parse(rawData.marketplace_data)
          : rawData.marketplace_data;
      } catch (err) {
        console.error("Marketplace data parse error:", err);
      }
    } else if (editingProduct?.marketplace_data) {
      marketplaceData = editingProduct.marketplace_data;
    }

    const data: any = { 
      ...rawData,
      sector_data,
      category_2: rawData.category_2 || '',
      sub_category_2: rawData.sub_category_2 || '',
      labels: typeof rawData.labels === 'string' ? rawData.labels.split(',').map(s => s.trim()).filter(Boolean) : (rawData.labels || []),
      is_web_sale: rawData.is_web_sale === 'on' || rawData.is_web_sale === 'true',
      is_bestseller: rawData.is_bestseller === 'on' || rawData.is_bestseller === 'true',
      is_sellable: rawData.is_sellable === 'on' || rawData.is_sellable === 'true',
      has_variants: !isExplicitlyVariantsOff && (hasVariantsRaw === 'on' || hasVariantsRaw === 'true' || hasVariantsRaw === true),
      variants: [],
      allergens: parsedAllergens,
      calories: Number(rawData.calories) || 0,
      prep_time_min: Number(rawData.prep_time_min) || 0,
      portion_size: String(rawData.portion_size || '').trim(),
      product_type: rawData.product_type || 'product',
      sync_group: rawData.sync_group === 'on',
      marketplace_data: marketplaceData
    };

    if (data.has_variants && rawData.variants_data) {
      try {
        const parsedVariants = JSON.parse(rawData.variants_data as string);
        if (Array.isArray(parsedVariants) && parsedVariants.length > 0) {
          data.variants = parsedVariants;
          data.has_variants = true;
          // Automatically sum variant stocks so stock_quantity is correctly set and recognized by filters and website publishing
          const totalVariantStock = data.variants.reduce((acc: number, curr: any) => acc + (Number(curr.stock_quantity) || 0), 0);
          data.stock_quantity = totalVariantStock;
        } else {
          data.has_variants = false;
          data.variants = [];
        }
      } catch (e) {
        console.error("Variants data parse error:", e);
        data.variants = [];
      }
    } else {
      data.has_variants = false;
      data.variants = [];
    }
    ['price', 'price_2', 'old_price', 'cost_price', 'tax_rate', 'volume_ml'].forEach(field => {
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

    let barcode = String(data.barcode || '').trim();
    if (!barcode && !data.has_variants && !editingProduct) {
      toast.error(lang === 'tr' ? "Lütfen geçerli bir barkod giriniz." : "Please enter a valid barcode.");
      return;
    }
    if (!barcode && data.has_variants) {
      barcode = 'VAR-' + Date.now().toString().slice(-6);
      data.barcode = barcode;
    }

    const isDuplicate = barcode && products.some(p => p.barcode === barcode && p.id !== editingProduct?.id);
    if (isDuplicate) {
      toast.error(lang === 'tr' ? "Bu barkod numarasına sahip başka bir ürün zaten var!" : "Another product with this barcode already exists!");
      return;
    }

    const savePromise = (async () => {
      let res;
      if (editingProduct) {
        res = await api.updateProduct(Number(editingProduct.id), data, targetStoreId);
      } else {
        res = await api.addProduct(data, targetStoreId);
      }

      // Save recipe if data is present
      const productId = editingProduct ? Number(editingProduct.id) : res?.id;
      if (productId && rawData.recipe_data) {
        try {
          const recipeItems = JSON.parse(rawData.recipe_data as string);
          await api.saveProductRecipe(productId, recipeItems, targetStoreId);
        } catch (e) {
          console.error("Recipe save error:", e);
        }
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

  const handleBulkAdd = async (products: any[]) => {
    const targetStoreId = (user.role === 'superadmin' || user.store_id !== currentStoreId) ? currentStoreId : undefined;
    
    const addPromise = (async () => {
      const res = await api.addBulkProducts(products, targetStoreId);
      fetchData(true);
      return res;
    })();

    toast.promise(addPromise, {
      loading: lang === 'tr' ? "Ürünler ekleniyor..." : "Adding products...",
      success: lang === 'tr' ? "Ürünler başarıyla eklendi" : "Products added successfully",
      error: lang === 'tr' ? "Ürünler eklenemedi" : "Failed to add products"
    });
  };

  const handleBulkRename = async (renames: { id: number, name: string }[]) => {
    const targetStoreId = (user.role === 'superadmin' || user.store_id !== currentStoreId) ? currentStoreId : undefined;
    
    const renamePromise = (async () => {
      const res = await api.bulkRenameProducts(renames, targetStoreId);
      fetchData(true);
      return res;
    })();

    toast.promise(renamePromise, {
      loading: lang === 'tr' ? "İsimler güncelleniyor..." : "Updating names...",
      success: lang === 'tr' ? "İsimler başarıyla güncellendi" : "Names updated successfully",
      error: lang === 'tr' ? "İsimler güncellenemedi" : "Failed to update names"
    });
  };

  const handleReformatProductNames = async () => {
    const targetStoreId = (user.role === 'superadmin' || user.store_id !== currentStoreId) ? currentStoreId : undefined;
    
    const reformatPromise = (async () => {
      const res = await api.reformatProductNames(targetStoreId);
      fetchData(true);
      return res;
    })();

    toast.promise(reformatPromise, {
      loading: lang === 'tr' ? "Ürün isimleri yapay zeka ile akıllıca düzeltiliyor..." : "Reformatting product names with AI...",
      success: (res: any) => res?.message || (lang === 'tr' ? "Ürün isimleri başarıyla revize edildi" : "Product names successfully revised"),
      error: lang === 'tr' ? "Ürün isimleri revize edilemedi" : "Failed to revise product names"
    });
  };

  return { handleAddProduct, handleDeleteProduct, handleDeleteAllProducts, handleBulkDelete, handleBulkAdd, handleBulkRename, handleReformatProductNames, editingProduct, setEditingProduct };
};
