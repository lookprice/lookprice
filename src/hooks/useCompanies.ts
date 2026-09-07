import { useCompanyData } from './useCompanyData';
import { useCompanyActions } from './useCompanyActions';
import { useCompanyUI } from './useCompanyUI';
import { useCompanyExport } from './useCompanyExport';

export const useCompanies = (user: any, currentStoreId: number | undefined, lang: string, branding: any) => {
  const ui = useCompanyUI(branding);
  const data = useCompanyData(currentStoreId, ui.includeZeroBalance, ui.transactionStartDate, ui.transactionEndDate);
  const actions = useCompanyActions(
      user, currentStoreId, data.fetchCompanies, 
      (cid, tsid) => data.handleFetchTransactions(cid, tsid),
      ui.selectedCompany, ui.setEditingCompany, ui.setShowCompanyModal,
      ui.setShowAddTransactionModal, ui.setNewTransactionAmount, ui.setNewTransactionDescription,
      ui.setNewTransactionCurrency, ui.setNewTransactionExchangeRate, branding, lang
  );
  
  const exporter = useCompanyExport(lang, data.companies, branding, ui.selectedCompany, ui.transactionStartDate, ui.transactionEndDate, data.companyTransactions, data.openingBalances, ui.selectedCurrency);

  return {
    ...data,
    ...ui,
    ...actions,
    ...exporter,
    handleAddCompany: (e: React.FormEvent) => actions.handleAddCompany(e, ui.editingCompany),
    handleAddTransaction: (e: React.FormEvent) => actions.handleAddTransaction(
        e, ui.newTransactionType, ui.newTransactionAmount, ui.newTransactionDescription,
        ui.newTransactionDate, ui.newTransactionPaymentMethod, ui.newTransactionCurrency, ui.newTransactionExchangeRate
    ),
    handleFetchTransactions: (companyId: number) => 
        data.handleFetchTransactions(companyId, user.role === 'superadmin' ? currentStoreId : undefined)
  };
};
