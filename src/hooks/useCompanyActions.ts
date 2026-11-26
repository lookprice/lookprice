import { toast } from 'sonner';
import { api } from "../services/api";

export const useCompanyActions = (
  user: any,
  currentStoreId: number | undefined,
  fetchCompanies: () => Promise<void> | void,
  handleFetchTransactions: (companyId: number, targetStoreId: number | undefined, customStart?: string, customEnd?: string) => Promise<void> | void,
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

  const handleAddCompany = async (e: React.FormEvent, editingCompany: any): Promise<boolean> => {
    e.preventDefault();
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    const savePromise = (async () => {
      const res = editingCompany
        ? await api.updateCompany(editingCompany.id, data, targetStoreId)
        : await api.addCompany(data, targetStoreId);
      if (!res || res.error) {
        throw new Error(res?.error || (lang === 'tr' ? "Cari kaydedilemedi" : "Failed to save company"));
      }
      await Promise.resolve(fetchCompanies());
      return res;
    })();

    toast.promise(savePromise, {
      loading: lang === 'tr' ? "Cari kaydediliyor..." : "Saving company...",
      success: lang === 'tr' ? "Cari kaydedildi" : "Company saved",
      error: (err: any) => err?.message || (lang === 'tr' ? "Hata oluştu" : "Error occurred")
    });

    try {
      await savePromise;
      setShowCompanyModal(false);
      setEditingCompany(null);
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteCompany = async (id: number): Promise<boolean> => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (!window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      return false;
    }
    const deletePromise = (async () => {
      const res = await api.deleteCompany(id, targetStoreId);
      if (!res || res.error) {
        throw new Error(res?.error || (lang === 'tr' ? "Cari silinemedi" : "Failed to delete company"));
      }
      await Promise.resolve(fetchCompanies());
      return res;
    })();

    toast.promise(deletePromise, {
      loading: lang === 'tr' ? "Siliniyor..." : "Deleting...",
      success: lang === 'tr' ? "Cari silindi" : "Company deleted",
      error: (err: any) => err?.message || (lang === 'tr' ? "Hata oluştu" : "Error occurred")
    });

    try {
      await deletePromise;
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteTransaction = async (id: number, skipConfirm?: boolean): Promise<boolean> => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    if (!skipConfirm && !window.confirm(lang === 'tr' ? "Silmek istediğinize emin misiniz?" : "Are you sure you want to delete?")) {
      return false;
    }
    const deletePromise = (async () => {
      const res = await api.deleteTransaction(id, targetStoreId);
      if (!res || res.error) {
        throw new Error(res?.error || (lang === 'tr' ? "İşlem silinemedi" : "Failed to delete transaction"));
      }
      if (selectedCompany) {
        await Promise.resolve(handleFetchTransactions(selectedCompany.id, targetStoreId));
      }
      await Promise.resolve(fetchCompanies());
      return res;
    })();

    toast.promise(deletePromise, {
      loading: lang === 'tr' ? "İşlem siliniyor..." : "Deleting transaction...",
      success: lang === 'tr' ? "İşlem silindi" : "Transaction deleted",
      error: (err: any) => err?.message || (lang === 'tr' ? "Hata oluştu" : "Error occurred")
    });

    try {
      await deletePromise;
      return true;
    } catch {
      return false;
    }
  };

  const handleEditTransaction = async (id: number, data: any): Promise<boolean> => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    const editPromise = (async () => {
      const res = await api.updateTransaction(id, data, targetStoreId);
      if (!res || res.error) {
        throw new Error(res?.error || (lang === 'tr' ? "İşlem revize edilemedi" : "Failed to update transaction"));
      }
      if (selectedCompany) {
        await Promise.resolve(handleFetchTransactions(selectedCompany.id, targetStoreId));
      }
      if (data.company_id && (!selectedCompany || Number(data.company_id) !== Number(selectedCompany.id))) {
        await Promise.resolve(handleFetchTransactions(Number(data.company_id), targetStoreId));
      }
      await Promise.resolve(fetchCompanies());
      return res;
    })();

    toast.promise(editPromise, {
      loading: lang === 'tr' ? "Cari işlem revize ediliyor..." : "Updating transaction...",
      success: lang === 'tr' ? "Cari işlem başarıyla revize edildi" : "Transaction updated successfully",
      error: (err: any) => err?.message || (lang === 'tr' ? "İşlem revize edilirken hata oluştu" : "Error updating transaction")
    });

    try {
      await editPromise;
      return true;
    } catch {
      return false;
    }
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
  ): Promise<boolean> => {
    if (eOrData && typeof eOrData.preventDefault === 'function') {
      eOrData.preventDefault();
    }

    // Determine if eOrData is a payload object
    const isDirectPayload = Boolean(eOrData && typeof eOrData === 'object' && !eOrData.nativeEvent && ('amount' in eOrData || 'type' in eOrData || 'company_id' in eOrData));
    const payload = isDirectPayload ? eOrData : null;

    const rawCompanyId = payload?.company_id || targetCompanyId || selectedCompany?.id;
    const effectiveCompanyId = Number(rawCompanyId);
    if (!effectiveCompanyId) {
      toast.error(lang === 'tr' ? "Lütfen geçerli bir cari hesap seçiniz." : "Please select a valid company.");
      return false;
    }

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
      return false;
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
        exchange_rate: parsedRate,
        cross_currency: payload?.cross_currency !== undefined ? payload.cross_currency : null,
        cross_rate: payload?.cross_rate !== undefined ? payload.cross_rate : null,
        cross_amount: payload?.cross_amount !== undefined ? payload.cross_amount : null,
        financial_account_id: payload?.financial_account_id ?? null,
        financial_account_name: payload?.financial_account_name ?? null,
        check_note_no: payload?.check_note_no ?? null,
        check_due_date: payload?.check_due_date ?? null,
        check_instrument_type: payload?.check_instrument_type ?? null,
        check_bank_name: payload?.check_bank_name ?? null
      }, targetStoreId);

      if (!res || res.error) {
        throw new Error(res?.error || (lang === 'tr' ? "Cari işlem kaydedilemedi" : "Failed to add transaction"));
      }

      await Promise.resolve(handleFetchTransactions(effectiveCompanyId, targetStoreId));
      if (selectedCompany && Number(selectedCompany.id) !== effectiveCompanyId) {
        await Promise.resolve(handleFetchTransactions(selectedCompany.id, targetStoreId));
      }
      await Promise.resolve(fetchCompanies());
      return res;
    })();

    toast.promise(addPromise, {
      loading: lang === 'tr' ? "Cari işlem kaydediliyor..." : "Adding transaction...",
      success: lang === 'tr' ? "Cari işlem başarıyla eklendi" : "Transaction added successfully",
      error: (err: any) => err?.message || (lang === 'tr' ? "İşlem eklenirken hata oluştu" : "Error adding transaction")
    });

    try {
      await addPromise;
      setShowAddTransactionModal(false);
      setNewTransactionAmount('');
      setNewTransactionDescription('');
      setNewTransactionCurrency(branding?.default_currency || 'TRY');
      setNewTransactionExchangeRate('1');
      return true;
    } catch {
      return false;
    }
  };

  return { handleAddCompany, handleDeleteCompany, handleDeleteTransaction, handleEditTransaction, handleAddTransaction };
};
