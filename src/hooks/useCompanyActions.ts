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
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      const deletePromise = (async () => {
        const res = await api.deleteTransaction(id, targetStoreId);
        if (selectedCompany) {
            handleFetchTransactions(selectedCompany.id, targetStoreId);
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
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const editPromise = (async () => {
      const res = await api.updateTransaction(id, data, targetStoreId);
      if (selectedCompany) {
        handleFetchTransactions(selectedCompany.id, targetStoreId);
      }
      if (data.company_id && selectedCompany && Number(data.company_id) !== Number(selectedCompany.id)) {
        handleFetchTransactions(data.company_id, targetStoreId);
      }
      fetchCompanies();
      return res;
    })();

    toast.promise(editPromise, {
      loading: lang === 'tr' ? "Cari işlem revize ediliyor..." : "Updating transaction...",
      success: lang === 'tr' ? "Cari işlem başarıyla revize edildi" : "Transaction updated successfully",
      error: lang === 'tr' ? "İşlem revize edilirken hata oluştu" : "Error updating transaction"
    });
  };

  const handleAddTransaction = async (
    eOrData: any,
    newTransactionType?: 'debt' | 'credit',
    newTransactionAmount?: string | number,
    newTransactionDescription?: string,
    newTransactionDate?: string,
    newTransactionPaymentMethod?: 'cash' | 'credit_card' | 'bank' | 'term',
    newTransactionCurrency?: string,
    newTransactionExchangeRate?: string | number,
    targetCompanyId?: number
  ) => {
    if (eOrData && typeof eOrData.preventDefault === 'function') {
      eOrData.preventDefault();
    }

    // Determine if eOrData is a payload object
    const isDirectPayload = Boolean(eOrData && typeof eOrData === 'object' && !eOrData.nativeEvent && ('amount' in eOrData || 'type' in eOrData || 'company_id' in eOrData));
    const payload = isDirectPayload ? eOrData : null;

    const rawCompanyId = payload?.company_id || targetCompanyId || selectedCompany?.id;
    const effectiveCompanyId = Number(rawCompanyId);
    if (!effectiveCompanyId) return;

    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const rawType = payload?.type || newTransactionType || 'credit';
    const rawAmount = payload?.amount !== undefined ? payload.amount : newTransactionAmount;
    const rawDesc = payload?.description !== undefined ? payload.description : newTransactionDescription;
    const rawDate = payload?.transaction_date || newTransactionDate || new Date().toISOString().split('T')[0];
    const rawPaymentMethod = payload?.payment_method || newTransactionPaymentMethod || 'cash';
    const rawCurrency = (payload?.currency || newTransactionCurrency || branding?.default_currency || 'TRY').toUpperCase();
    const rawExchangeRate = payload?.exchange_rate !== undefined ? payload.exchange_rate : newTransactionExchangeRate;

    // Parse amount cleanly
    let parsedAmount = 0;
    if (typeof rawAmount === 'number') {
      parsedAmount = isNaN(rawAmount) ? 0 : rawAmount;
    } else if (rawAmount) {
      const cleanStr = String(rawAmount).trim().replace(/\s/g, '');
      if (cleanStr.includes(',') && cleanStr.includes('.')) {
        parsedAmount = cleanStr.lastIndexOf(',') > cleanStr.lastIndexOf('.') 
          ? parseFloat(cleanStr.replace(/\./g, '').replace(',', '.')) 
          : parseFloat(cleanStr.replace(/,/g, ''));
      } else if (cleanStr.includes(',')) {
        parsedAmount = parseFloat(cleanStr.replace(',', '.'));
      } else {
        parsedAmount = parseFloat(cleanStr);
      }
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(lang === 'tr' ? "Lütfen geçerli bir işlem tutarı giriniz." : "Please enter a valid amount.");
      return;
    }

    let parsedRate = 1;
    if (rawExchangeRate !== undefined && rawExchangeRate !== null && rawExchangeRate !== '') {
      if (typeof rawExchangeRate === 'number') {
        parsedRate = isNaN(rawExchangeRate) ? 1 : rawExchangeRate;
      } else {
        const cleanRate = String(rawExchangeRate).trim().replace(/\s/g, '').replace(',', '.');
        const pr = parseFloat(cleanRate);
        if (!isNaN(pr) && pr > 0) parsedRate = pr;
      }
    }

    const addPromise = (async () => {
      const res = await api.addCompanyTransaction(effectiveCompanyId, {
        type: rawType,
        amount: parsedAmount,
        description: rawDesc || '',
        transaction_date: rawDate,
        payment_method: rawPaymentMethod,
        currency: rawCurrency,
        exchange_rate: parsedRate
      }, targetStoreId);
      
      handleFetchTransactions(effectiveCompanyId, targetStoreId);
      if (selectedCompany && Number(selectedCompany.id) !== effectiveCompanyId) {
        handleFetchTransactions(selectedCompany.id, targetStoreId);
      }
      fetchCompanies();
      return res;
    })();

    setShowAddTransactionModal(false);
    setNewTransactionAmount('');
    setNewTransactionDescription('');
    setNewTransactionCurrency(branding?.default_currency || 'TRY');
    setNewTransactionExchangeRate('1');

    toast.promise(addPromise, {
      loading: lang === 'tr' ? "Cari işlem kaydediliyor..." : "Adding transaction...",
      success: lang === 'tr' ? "Cari işlem başarıyla eklendi" : "Transaction added successfully",
      error: lang === 'tr' ? "İşlem eklenirken hata oluştu" : "Error adding transaction"
    });
  };

  return { handleAddCompany, handleDeleteCompany, handleDeleteTransaction, handleEditTransaction, handleAddTransaction };
};
