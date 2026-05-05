import { useState } from "react";
import { useProductData } from "./useProductData";
import { useProductActions } from "./useProductActions";
import { useProductUtils } from "./useProductUtils";
import { useProductImport } from "./useProductImport";

export const useProducts = (user: any, slug: string | undefined, includeBranches: boolean, branding: any, planLimits: Record<string, number>, lang: string) => {
  const { products, setProducts, loading, setLoading, fetchData, currentStoreId } = useProductData(user, slug, includeBranches);
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  
  const { handleAddProduct, handleDeleteProduct, handleDeleteAllProducts, handleBulkDelete, editingProduct, setEditingProduct } = useProductActions(user, currentStoreId, products, lang, fetchData);
  const { showBulkPriceModal, setShowBulkPriceModal, bulkPriceForm, setBulkPriceForm, handleApplyTaxRule, handleBulkPriceSubmit, handleBulkRecalculatePrice2, handleExportProducts } = useProductUtils(user, currentStoreId, includeBranches, products, lang, fetchData);
  const importHooks = useProductImport(user, currentStoreId, products.length, branding, planLimits, lang, fetchData);

  return {
    products, setProducts,
    loading, setLoading,
    showProductModal, setShowProductModal,
    showBulkPriceModal, setShowBulkPriceModal,
    bulkPriceForm, setBulkPriceForm,
    editingProduct, setEditingProduct,
    showDescription, setShowDescription,
    
    // Import hooks
    showImportModal: importHooks.showImportModal,
    setShowImportModal: importHooks.setShowImportModal,
    isImporting: importHooks.isImporting,
    setIsImporting: importHooks.setIsImporting,
    importFile: importHooks.importFile,
    setImportFile: importHooks.setImportFile,
    importColumns: importHooks.importColumns,
    setImportColumns: importHooks.setImportColumns,
    mapping: importHooks.mapping,
    setMapping: importHooks.setMapping,
    convertCurrency: importHooks.convertCurrency,
    setConvertCurrency: importHooks.setConvertCurrency,
    
    handleAddProduct: (e: React.FormEvent) => handleAddProduct(e, editingProduct, branding, planLimits, setShowProductModal, setEditingProduct, setShowDescription),
    handleDeleteProduct,
    handleDeleteAllProducts,
    handleBulkDelete,
    handleApplyTaxRule: (cat: string, tax: number) => handleApplyTaxRule(cat, tax, setLoading),
    handleBulkPriceSubmit: (e: React.FormEvent) => handleBulkPriceSubmit(e, setLoading),
    handleBulkRecalculatePrice2: () => handleBulkRecalculatePrice2(setLoading),
    handleExportProducts,
    handleFileSelect: importHooks.handleFileSelect,
    handleImport: importHooks.handleImport,
    
    fetchData,
    currentStoreId
  };
};
