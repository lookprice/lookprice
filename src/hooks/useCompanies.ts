import { useState, useCallback } from "react";
import { api } from "../services/api";
import { translations } from "../translations";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const useCompanies = (user: any, currentStoreId: number | undefined, lang: string, branding: any) => {
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
    const t = translations[lang].dashboard;
    const data = companies.map(c => ({
      [t.statements.customerSupplier]: c.title,
      [isTr ? 'Yetkili' : 'Contact Person']: c.contact_person || c.representative || '-',
      [isTr ? 'Vergi Dairesi' : 'Tax Office']: c.tax_office || '-',
      [isTr ? 'Vergi No' : 'Tax Number']: c.tax_number || '-',
      [isTr ? 'Telefon' : 'Phone']: c.phone || '-',
      [isTr ? 'E-posta' : 'Email']: c.email || '-',
      [t.statements.balance]: c.balance,
      [isTr ? 'Adres' : 'Address']: c.address || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Firmalar" : "Companies");
    XLSX.writeFile(wb, `${isTr ? 'Firma_Listesi' : 'Company_List'}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    const doc = new jsPDF();
    const isTr = lang === 'tr';
    const t = translations[lang].dashboard;
    
    const fixTr = (text: any) => {
      if (text === null || text === undefined) return "";
      const str = String(text);
      return str
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    const getBase64Image = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = (e) => reject(e);
        img.src = url;
      });
    };

    let yPos = 20;

    if (branding.logo_url) {
      try {
        const logoBase64 = await getBase64Image(branding.logo_url);
        doc.addImage(logoBase64, 'PNG', 14, 10, 40, 15);
        yPos = 30;
      } catch (e) {
        console.error("Logo addImage error:", e);
      }
    }

    const storeTitle = branding.name || branding.store_name || "LookPrice";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(fixTr(storeTitle), 14, yPos);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    yPos += 5;
    
    const addressLines = doc.splitTextToSize(fixTr(branding.address || ""), 80);
    doc.text(addressLines, 14, yPos);
    yPos += (addressLines.length * 4);
    
    doc.text(`${fixTr(isTr ? 'Tel:' : 'Tel:')} ${branding.phone || ""}`, 14, yPos);
    yPos += 4;
    doc.text(`${fixTr(isTr ? 'E-posta:' : 'Email:')} ${branding.email || ""}`, 14, yPos);
    yPos += 10;

    doc.setDrawColor(200);
    doc.line(14, yPos, 196, yPos);
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(fixTr(t.statements.customerStatement.toUpperCase()), 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${fixTr(isTr ? 'Firma:' : 'Company:')} ${fixTr(selectedCompany.title)}`, 14, yPos);
    yPos += 6;
    doc.text(`${fixTr(isTr ? 'Tarih Araligi:' : 'Date Range:')}: ${transactionStartDate} - ${transactionEndDate}`, 14, yPos);
    yPos += 10;

    let runningBalance = 0;
    const tableData = companyTransactions.map(t => {
      const amount = Number(t.amount);
      if (t.type === 'debt') runningBalance += amount;
      else runningBalance -= amount;
      
      return [
        t.transaction_date.split('T')[0],
        fixTr(t.description || ""),
        t.type === 'debt' ? amount.toLocaleString('tr-TR') : "-",
        t.type === 'credit' ? amount.toLocaleString('tr-TR') : "-",
        runningBalance.toLocaleString('tr-TR')
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [[
        fixTr(t.statements.date),
        fixTr(t.statements.description),
        fixTr(t.statements.debt),
        fixTr(t.statements.credit),
        fixTr(t.statements.balance)
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${fixTr(t.statements.balance)}: ${Number(selectedCompany.balance).toLocaleString(isTr ? 'tr-TR' : 'en-US')} ${branding.default_currency || 'TL'}`, 196, finalY, { align: 'right' });

    doc.save(`${isTr ? 'hesap_ekstresi' : 'account_statement'}_${selectedCompany.title}_${transactionStartDate}_${transactionEndDate}.pdf`);
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
