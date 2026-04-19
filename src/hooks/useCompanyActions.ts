import { api } from "../services/api";

export const useCompanyActions = (
  user: any,
  currentStoreId: number | undefined,
  fetchCompanies: () => void,
  handleFetchTransactions: (companyId: number, targetStoreId: number | undefined) => void,
  selectedCompany: any,
  setEditingCompany: (c: any) => void,
  setShowCompanyModal: (v: boolean) => void,
  setShowAddTransactionModal: (v: boolean) => void,
  setNewTransactionAmount: (v: string) => void,
  setNewTransactionDescription: (v: string) => void,
  setNewTransactionCurrency: (v: string) => void,
  setNewTransactionExchangeRate: (v: string) => void,
  branding: any,
  lang: string
) => {

  const handleAddCompany = async (e: React.FormEvent, editingCompany: any) => {
    e.preventDefault();
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    try {
      if (editingCompany) {
        await api.updateCompany(editingCompany.id, data, targetStoreId);
      } else {
        await api.addCompany(data, targetStoreId);
      }
      setShowCompanyModal(false);
      setEditingCompany(null);
      fetchCompanies();
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleDeleteCompany = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      try {
        await api.deleteCompany(id, targetStoreId);
        fetchCompanies();
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      try {
        await api.deleteTransaction(id);
        if (selectedCompany) {
            handleFetchTransactions(selectedCompany.id, user.role === 'superadmin' ? currentStoreId : undefined);
            fetchCompanies();
        }
      } catch (error) {
        alert("Hata oluştu");
      }
    }
  };

  const handleEditTransaction = async (id: number, data: any) => {
    try {
      await api.updateTransaction(id, data);
      if (selectedCompany) {
        handleFetchTransactions(selectedCompany.id, user.role === 'superadmin' ? currentStoreId : undefined);
        fetchCompanies();
      }
    } catch (error) {
      alert("Hata oluştu");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent, newTransactionType: 'debt' | 'credit', newTransactionAmount: string, newTransactionDescription: string, newTransactionDate: string, newTransactionPaymentMethod: 'cash' | 'credit_card' | 'bank' | 'term', newTransactionCurrency: string, newTransactionExchangeRate: string) => {
    e.preventDefault();
    if (!selectedCompany) return;
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;

    try {
      await api.addCompanyTransaction(selectedCompany.id, {
        type: newTransactionType,
        amount: Number(String(newTransactionAmount).replace(',', '.')),
        description: newTransactionDescription,
        transaction_date: newTransactionDate,
        payment_method: newTransactionPaymentMethod,
        currency: newTransactionCurrency,
        exchange_rate: Number(String(newTransactionExchangeRate).replace(',', '.')) || 1
      }, targetStoreId);
      
      setShowAddTransactionModal(false);
      setNewTransactionAmount('');
      setNewTransactionDescription('');
      setNewTransactionCurrency(branding?.default_currency || 'TRY');
      setNewTransactionExchangeRate('1');
      handleFetchTransactions(selectedCompany.id, targetStoreId);
      fetchCompanies();
    } catch (error) {
      console.error("Add transaction error:", error);
      alert(lang === 'tr' ? "İşlem eklenirken hata oluştu." : "Error adding transaction.");
    }
  };

  return { handleAddCompany, handleDeleteCompany, handleDeleteTransaction, handleEditTransaction, handleAddTransaction };
};
