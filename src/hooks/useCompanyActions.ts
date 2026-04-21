import { toast } from 'sonner';
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

    const savePromise = (async () => {
      let res;
      if (editingCompany) {
        res = await api.updateCompany(editingCompany.id, data, targetStoreId);
      } else {
        res = await api.addCompany(data, targetStoreId);
      }
      fetchCompanies();
      return res;
    })();

    setShowCompanyModal(false);
    setEditingCompany(null);

    toast.promise(savePromise, {
      loading: lang === 'tr' ? "Cari kaydediliyor..." : "Saving company...",
      success: lang === 'tr' ? "Cari kaydedildi" : "Company saved",
      error: lang === 'tr' ? "Hata oluştu" : "Error occurred"
    });
  };

  const handleDeleteCompany = async (id: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      const deletePromise = (async () => {
        const res = await api.deleteCompany(id, targetStoreId);
        fetchCompanies();
        return res;
      })();

      toast.promise(deletePromise, {
        loading: lang === 'tr' ? "Siliniyor..." : "Deleting...",
        success: lang === 'tr' ? "Cari silindi" : "Company deleted",
        error: lang === 'tr' ? "Hata oluştu" : "Error occurred"
      });
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      const deletePromise = (async () => {
        const res = await api.deleteTransaction(id);
        if (selectedCompany) {
            handleFetchTransactions(selectedCompany.id, user.role === 'superadmin' ? currentStoreId : undefined);
            fetchCompanies();
        }
        return res;
      })();

      toast.promise(deletePromise, {
        loading: lang === 'tr' ? "İşlem siliniyor..." : "Deleting transaction...",
        success: lang === 'tr' ? "İşlem silindi" : "Transaction deleted",
        error: lang === 'tr' ? "Hata oluştu" : "Error occurred"
      });
    }
  };

  const handleEditTransaction = async (id: number, data: any) => {
    const editPromise = (async () => {
      const res = await api.updateTransaction(id, data);
      if (selectedCompany) {
        handleFetchTransactions(selectedCompany.id, user.role === 'superadmin' ? currentStoreId : undefined);
        fetchCompanies();
      }
      return res;
    })();

    toast.promise(editPromise, {
      loading: lang === 'tr' ? "Güncelleniyor..." : "Updating...",
      success: lang === 'tr' ? "Güncellendi" : "Updated",
      error: lang === 'tr' ? "Hata oluştu" : "Error occurred"
    });
  };

  const handleAddTransaction = async (e: React.FormEvent, newTransactionType: 'debt' | 'credit', newTransactionAmount: string, newTransactionDescription: string, newTransactionDate: string, newTransactionPaymentMethod: 'cash' | 'credit_card' | 'bank' | 'term', newTransactionCurrency: string, newTransactionExchangeRate: string) => {
    e.preventDefault();
    if (!selectedCompany) return;
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;

    const addPromise = (async () => {
      const res = await api.addCompanyTransaction(selectedCompany.id, {
        type: newTransactionType,
        amount: Number(String(newTransactionAmount).replace(',', '.')),
        description: newTransactionDescription,
        transaction_date: newTransactionDate,
        payment_method: newTransactionPaymentMethod,
        currency: newTransactionCurrency,
        exchange_rate: Number(String(newTransactionExchangeRate).replace(',', '.')) || 1
      }, targetStoreId);
      
      handleFetchTransactions(selectedCompany.id, targetStoreId);
      fetchCompanies();
      return res;
    })();

    setShowAddTransactionModal(false);
    setNewTransactionAmount('');
    setNewTransactionDescription('');
    setNewTransactionCurrency(branding?.default_currency || 'TRY');
    setNewTransactionExchangeRate('1');

    toast.promise(addPromise, {
      loading: lang === 'tr' ? "İşlem ekleniyor..." : "Adding transaction...",
      success: lang === 'tr' ? "İşlem eklendi" : "Transaction added",
      error: lang === 'tr' ? "İşlem eklenirken hata oluştu" : "Error adding transaction"
    });
  };

  return { handleAddCompany, handleDeleteCompany, handleDeleteTransaction, handleEditTransaction, handleAddTransaction };
};
