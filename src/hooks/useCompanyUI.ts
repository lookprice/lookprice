import { useState, useEffect } from "react";

export const useCompanyUI = (branding: any) => {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [includeZeroBalance, setIncludeZeroBalance] = useState(false);
  const [transactionStartDate, setTransactionStartDate] = useState('');
  const [transactionEndDate, setTransactionEndDate] = useState('');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'debt' | 'credit'>('credit');
  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  const [newTransactionDate, setNewTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTransactionPaymentMethod, setNewTransactionPaymentMethod] = useState<'cash' | 'credit_card' | 'bank' | 'term'>('cash');
  const [newTransactionCurrency, setNewTransactionCurrency] = useState(branding?.default_currency || 'TRY');
  const [newTransactionExchangeRate, setNewTransactionExchangeRate] = useState('1');
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');

  // Hareketler butonu tıklandığında tüm para birimlerini göster (kullanıcı dilerse tekil para birimi seçebilir)
  useEffect(() => {
    if (showTransactionModal && selectedCompany) {
      setSelectedCurrency('ALL');
    }
  }, [showTransactionModal, selectedCompany]);

  return {
    showCompanyModal, setShowCompanyModal,
    editingCompany, setEditingCompany,
    selectedCompany, setSelectedCompany,
    showTransactionModal, setShowTransactionModal,
    includeZeroBalance, setIncludeZeroBalance,
    transactionStartDate, setTransactionStartDate,
    transactionEndDate, setTransactionEndDate,
    showAddTransactionModal, setShowAddTransactionModal,
    newTransactionType, setNewTransactionType,
    newTransactionAmount, setNewTransactionAmount,
    newTransactionDescription, setNewTransactionDescription,
    newTransactionDate, setNewTransactionDate,
    newTransactionPaymentMethod, setNewTransactionPaymentMethod,
    newTransactionCurrency, setNewTransactionCurrency,
    newTransactionExchangeRate, setNewTransactionExchangeRate,
    selectedCurrency, setSelectedCurrency
  };
};
