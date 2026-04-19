import { useState } from "react";

export const useCompanyUI = (branding: any) => {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [includeZeroBalance, setIncludeZeroBalance] = useState(false);
  const [transactionStartDate, setTransactionStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [transactionEndDate, setTransactionEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'debt' | 'credit'>('credit');
  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  const [newTransactionDate, setNewTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTransactionPaymentMethod, setNewTransactionPaymentMethod] = useState<'cash' | 'credit_card' | 'bank' | 'term'>('cash');
  const [newTransactionCurrency, setNewTransactionCurrency] = useState(branding?.default_currency || 'TRY');
  const [newTransactionExchangeRate, setNewTransactionExchangeRate] = useState('1');
  const [selectedCurrency, setSelectedCurrency] = useState(branding?.default_currency || 'TRY');

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
