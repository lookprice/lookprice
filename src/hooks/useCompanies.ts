import { useState, useCallback } from "react";
import { api } from "../services/api";
import * as XLSX from 'xlsx';

export const useCompanies = (user: any, currentStoreId: number | undefined, lang: string) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [includeZeroBalance, setIncludeZeroBalance] = useState(false);
  const [companyTransactions, setCompanyTransactions] = useState<any[]>([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionStartDate, setTransactionStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [transactionEndDate, setTransactionEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [newTransactionType, setNewTransactionType] = useState<'debt' | 'credit'>('credit');
  const [newTransactionAmount, setNewTransactionAmount] = useState('');
  const [newTransactionDescription, setNewTransactionDescription] = useState('');
  const [newTransactionDate, setNewTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTransactionPaymentMethod, setNewTransactionPaymentMethod] = useState<'cash' | 'credit_card' | 'bank' | 'term'>('cash');

  const fetchCompanies = useCallback(async () => {
    if (!currentStoreId) return;
    try {
      const res = await api.getCompanies(includeZeroBalance, currentStoreId);
      setCompanies(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Fetch companies error:", error);
    }
  }, [currentStoreId, includeZeroBalance]);

  const handleAddCompany = async (e: React.FormEvent) => {
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

  const handleExportCompanies = () => {
    const isTr = lang === 'tr';
    const data = companies.map(c => ({
      [isTr ? 'Firma/Müşteri Adı' : 'Company/Customer Name']: c.name,
      [isTr ? 'Tip' : 'Type']: c.type === 'supplier' ? (isTr ? 'Tedarikçi' : 'Supplier') : (isTr ? 'Müşteri' : 'Customer'),
      [isTr ? 'Telefon' : 'Phone']: c.phone,
      [isTr ? 'E-posta' : 'Email']: c.email,
      [isTr ? 'Bakiye' : 'Balance']: c.balance,
      [isTr ? 'Adres' : 'Address']: c.address
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Firmalar" : "Companies");
    XLSX.writeFile(wb, `Firma_Listesi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFetchTransactions = async (companyId: number) => {
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    try {
      setTransactionLoading(true);
      const res = await api.getCompanyTransactions(companyId, transactionStartDate, transactionEndDate, targetStoreId);
      setCompanyTransactions(res);
    } catch (error) {
      console.error("Fetch transactions error:", error);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleExportTransactionsPDF = async () => {
    if (!selectedCompany) return;
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;
    try {
      const blob = await api.exportCompanyTransactionsPDF(selectedCompany.id, transactionStartDate, transactionEndDate, targetStoreId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hesap_ekstresi_${selectedCompany.name}_${transactionStartDate}_${transactionEndDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export PDF error:", error);
      alert(lang === 'tr' ? "PDF oluşturulurken bir hata oluştu." : "Error generating PDF.");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    const targetStoreId = user.role === 'superadmin' ? currentStoreId : undefined;

    try {
      await api.addCompanyTransaction(selectedCompany.id, {
        type: newTransactionType,
        amount: Number(newTransactionAmount),
        description: newTransactionDescription,
        transaction_date: newTransactionDate,
        payment_method: newTransactionPaymentMethod
      }, targetStoreId);
      
      setShowAddTransactionModal(false);
      setNewTransactionAmount('');
      setNewTransactionDescription('');
      handleFetchTransactions(selectedCompany.id);
      fetchCompanies();
    } catch (error) {
      console.error("Add transaction error:", error);
      alert(lang === 'tr' ? "İşlem eklenirken hata oluştu." : "Error adding transaction.");
    }
  };

  return {
    companies, setCompanies,
    showCompanyModal, setShowCompanyModal,
    editingCompany, setEditingCompany,
    selectedCompany, setSelectedCompany,
    showTransactionModal, setShowTransactionModal,
    includeZeroBalance, setIncludeZeroBalance,
    companyTransactions, setCompanyTransactions,
    transactionLoading, setTransactionLoading,
    transactionStartDate, setTransactionStartDate,
    transactionEndDate, setTransactionEndDate,
    showAddTransactionModal, setShowAddTransactionModal,
    newTransactionType, setNewTransactionType,
    newTransactionAmount, setNewTransactionAmount,
    newTransactionDescription, setNewTransactionDescription,
    newTransactionDate, setNewTransactionDate,
    newTransactionPaymentMethod, setNewTransactionPaymentMethod,
    fetchCompanies,
    handleAddCompany,
    handleDeleteCompany,
    handleExportCompanies,
    handleFetchTransactions,
    handleExportTransactionsPDF,
    handleAddTransaction
  };
};
