import { useQuotationData } from './useQuotationData';
import { useQuotationActions } from './useQuotationActions';
import { useQuotationUI } from './useQuotationUI';

export const useQuotations = (currentStoreId: number | undefined, fetchProductsData: () => void, branding: any, lang: string) => {
  const ui = useQuotationUI(branding);
  const data = useQuotationData(currentStoreId, ui.quotationSearch, ui.quotationStatusFilter);
  const actions = useQuotationActions(
    currentStoreId, lang, branding, fetchProductsData, data.fetchQuotations,
    ui.setQuotationItems, ui.setShowQuotationModal, ui.setEditingQuotation,
    ui.setQuickProductForm, ui.setShowQuickProductModal, ui.setSelectedQuotationDetails, ui.selectedQuotationDetails,
    ui.isTaxInclusive
  );

  return {
    ...data,
    ...ui,
    fetchQuotations: data.fetchQuotations,
    handleQuickAddProduct: (e: React.FormEvent) => actions.handleQuickAddProduct(e, ui.quickProductForm),
    handleAddQuotation: (e: React.FormEvent) => actions.handleAddQuotation(e, ui.quotationItems, ui.editingQuotation),
    handleApproveQuotation: actions.handleApproveQuotation,
    handleCancelQuotation: actions.handleCancelQuotation,
    handleDeleteQuotation: actions.handleDeleteQuotation
  };
};
