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
  const [newTransactionCurrency, setNewTransactionCurrency] = useState(branding?.default_currency || 'TRY');

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
      [t.companyName]: c.title,
      [t.contactPerson]: c.contact_person || c.representative || '-',
      [t.taxOffice || 'Tax Office']: c.tax_office || '-',
      [t.taxNumber || 'Tax Number']: c.tax_number || '-',
      [t.phone || 'Phone']: c.phone || '-',
      [t.email || 'Email']: c.email || '-',
      [t.statements.balance]: c.balance,
      [t.address || 'Address']: c.address || '-'
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.companies);
    XLSX.writeFile(wb, `${t.companies}_${new Date().toISOString().split('T')[0]}.xlsx`);
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

    // 1. Store Info (Left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(fixTr(branding.name || branding.store_name || "LookPrice"), 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    const addressLines = doc.splitTextToSize(fixTr(branding.address || ""), 50);
    doc.text(addressLines, 14, yPos + 5);
    let storeY = yPos + 5 + (addressLines.length * 4);
    doc.text(`${fixTr(t.phone || 'Tel:')} ${branding.phone || ""}`, 14, storeY);
    doc.text(`${fixTr(t.email || 'Email:')} ${branding.email || ""}`, 14, storeY + 4);

    // 2. Logo (Center)
    if (branding.logo_url) {
      try {
        const logoBase64 = await getBase64Image(branding.logo_url);
        // Square logo, centered
        doc.addImage(logoBase64, 'PNG', 90, 10, 30, 30);
      } catch (e) {
        console.error("Logo addImage error:", e);
      }
    }

    // 3. Customer Info (Right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(fixTr(t.company || 'Company'), 150, yPos);
    doc.text(fixTr(selectedCompany.title), 150, yPos + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`${fixTr(t.dateRange || 'Date Range')}:`, 150, yPos + 10);
    doc.text(`${transactionStartDate} - ${transactionEndDate}`, 150, yPos + 14);

    yPos = 50; // Move below the top section

    // 4. Title (Centered)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(fixTr(t.statements.customerStatement.toUpperCase()), 105, yPos, { align: 'center' });
    yPos += 15;

    const currencies = Array.from(new Set(companyTransactions.map(t => t.currency || branding.default_currency || 'TRY')));

    for (const curr of currencies) {
      if (currencies.indexOf(curr) > 0) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${fixTr(t.statements.customerStatement)} - ${curr}`, 14, yPos);
      yPos += 10;

      let runningBalance = 0;
      const filteredTransactions = companyTransactions.filter(t_item => (t_item.currency || branding.default_currency || 'TRY') === curr);
      
      const tableData = filteredTransactions.map(t_item => {
        const amount = Number(t_item.amount);
        if (t_item.type === 'debt') runningBalance += amount;
        else runningBalance -= amount;
        
        return [
          t_item.transaction_date.split('T')[0],
          fixTr(t_item.description || ""),
          t_item.type === 'debt' ? amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US') : "-",
          t_item.type === 'credit' ? amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US') : "-",
          runningBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')
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

      yPos = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${fixTr(t.statements.balance)}: ${runningBalance.toLocaleString(isTr ? 'tr-TR' : 'en-US')} ${curr}`, 196, yPos, { align: 'right' });
      yPos += 15;
    }

    doc.save(`${fixTr(t.statements.customerStatement.toLowerCase().replace(/\s+/g, '_'))}_${fixTr(selectedCompany.title)}_${transactionStartDate}_${transactionEndDate}.pdf`);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
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
        currency: newTransactionCurrency
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
    newTransactionCurrency, setNewTransactionCurrency,
    fetchCompanies,
    handleAddCompany,
    handleDeleteCompany,
    handleExportCompanies,
    handleFetchTransactions,
    handleExportTransactionsPDF,
    handleAddTransaction
  };
};
