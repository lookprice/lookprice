import { useSaleData } from './useSaleData';
import { useSaleActions } from './useSaleActions';
import { useSaleUI } from './useSaleUI';

export const useSales = (
  user: any, 
  currentStoreId: number | undefined, 
  branding: any, 
  lang: string, 
  fetchData: () => void
) => {
  const ui = useSaleUI();
  const data = useSaleData(currentStoreId, ui.salesStatusFilter, ui.salesStartDate, ui.salesEndDate);
  const actions = useSaleActions(
    user, currentStoreId, data.sales, branding, lang, fetchData, data.fetchSales,
    ui.selectedSale, ui.setSelectedSale, ui.setShowSaleDetailsModal, ui.setCompletingSale,
    ui.posPaymentMethod, ui.selectedQuotation, ui.setSelectedQuotation, ui.setShowSaleModal,
    ui.setIsConfirmingSale, ui.paymentMethod, ui.dueDate, ui.saleNotes, ui.createCompanyFromSale, ui.setCreateCompanyFromSale
  );

  return {
    ...data,
    ...ui,
    fetchSales: data.fetchSales,
    ...actions,
    handleExportSales: () => actions.handleExportSales(ui.salesStartDate, ui.salesEndDate)
  };
};
