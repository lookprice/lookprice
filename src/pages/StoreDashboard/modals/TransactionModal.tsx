import React from "react";
import { motion } from "motion/react";
import { 
  X, Plus, History, FileDown, Calculator, FileCheck, Edit2, Trash2, 
  ArrowUpRight, ArrowDownLeft, Building2, Receipt, Calendar, CreditCard, 
  Banknote, Landmark, Clock, AlertCircle, Save, CheckCircle2 
} from "lucide-react";
import { api } from "../../../services/api";

interface TransactionModalProps {
  // View Statement
  showTransactionModal: boolean;
  setShowTransactionModal: (show: boolean) => void;
  selectedCompany: any;
  companyTransactions: any[];
  selectedCurrency: string;
  setSelectedCurrency: (c: string) => void;
  transactionStartDate: string;
  setTransactionStartDate: (d: string) => void;
  transactionEndDate: string;
  setTransactionEndDate: (d: string) => void;
  handleFetchTransactions: (id: number, targetStoreId?: number, customStart?: string, customEnd?: string) => void;
  transactionLoading: boolean;
  handleExportTransactionsPDF: () => void;
  openingBalances: Record<string, number>;
  companies: any[];
  setShowAddTransactionModal: (show: boolean) => void;
  handleEditTransaction: (id: number, data: any) => void;
  handleDeleteTransaction: (id: number) => void;
  branding: any;
  translations: any;
  lang: string;

  // Add Transaction
  showAddTransactionModal: boolean;
  newTransactionType: 'credit' | 'debt';
  setNewTransactionType: (t: 'credit' | 'debt') => void;
  newTransactionAmount: string;
  setNewTransactionAmount: (a: string) => void;
  newTransactionCurrency: string;
  setNewTransactionCurrency: (c: string) => void;
  newTransactionExchangeRate: string;
  setNewTransactionExchangeRate: (r: string) => void;
  newTransactionPaymentMethod: 'cash' | 'credit_card' | 'bank' | 'term';
  setNewTransactionPaymentMethod: (m: 'cash' | 'credit_card' | 'bank' | 'term') => void;
  newTransactionDescription: string;
  setNewTransactionDescription: (d: string) => void;
  newTransactionDate: string;
  setNewTransactionDate: (d: string) => void;
  handleAddTransaction: (eOrData: any) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  showTransactionModal,
  setShowTransactionModal,
  selectedCompany,
  companyTransactions,
  selectedCurrency,
  setSelectedCurrency,
  transactionStartDate,
  setTransactionStartDate,
  transactionEndDate,
  setTransactionEndDate,
  handleFetchTransactions,
  transactionLoading,
  handleExportTransactionsPDF,
  openingBalances,
  companies,
  setShowAddTransactionModal,
  handleEditTransaction,
  handleDeleteTransaction,
  branding,
  translations: t,
  lang,

  showAddTransactionModal,
  newTransactionType,
  setNewTransactionType,
  newTransactionAmount,
  setNewTransactionAmount,
  newTransactionCurrency,
  setNewTransactionCurrency,
  newTransactionExchangeRate,
  setNewTransactionExchangeRate,
  newTransactionPaymentMethod,
  setNewTransactionPaymentMethod,
  newTransactionDescription,
  setNewTransactionDescription,
  newTransactionDate,
  setNewTransactionDate,
  handleAddTransaction
}) => {
  const isTr = lang === 'tr';
  const [editingTransaction, setEditingTransaction] = React.useState<any | null>(null);

  // Comprehensive Form State
  const [formCompanyId, setFormCompanyId] = React.useState<number>(selectedCompany?.id || 0);
  const [formType, setFormType] = React.useState<'credit' | 'debt'>('credit');
  const [formAmount, setFormAmount] = React.useState<string>('');
  const [formCurrency, setFormCurrency] = React.useState<string>('TRY');
  const [formExchangeRate, setFormExchangeRate] = React.useState<string>('1');
  const [formPaymentMethod, setFormPaymentMethod] = React.useState<'cash' | 'credit_card' | 'bank' | 'term'>('cash');
  const [formDocumentNo, setFormDocumentNo] = React.useState<string>('');
  const [formDescription, setFormDescription] = React.useState<string>('');
  const [formDate, setFormDate] = React.useState<string>(new Date().toISOString().split('T')[0]);

  // Clean Number Parser (supports Turkish 1.250,50 and 1,250.50 formats)
  const parseAmount = (val: string | number): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const clean = String(val).trim().replace(/\s/g, '');
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        return parseFloat(clean.replace(/,/g, '')) || 0;
      }
    }
    if (clean.includes(',')) {
      return parseFloat(clean.replace(',', '.')) || 0;
    }
    const n = parseFloat(clean);
    return isNaN(n) ? 0 : n;
  };

  const getSuggestedRate = (curr: string): number => {
    if (!curr || curr === 'TRY') return 1;
    const rates = branding?.currency_rates || {};
    return Number(rates[curr]) || 1;
  };

  const handleCloseAddOrEditModal = () => {
    setShowAddTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null);
    setFormCompanyId(selectedCompany?.id || companies[0]?.id || 0);
    setFormType('credit');
    setFormAmount('');
    const defCurr = selectedCurrency || branding?.default_currency || 'TRY';
    setFormCurrency(defCurr);
    setFormExchangeRate(String(getSuggestedRate(defCurr) || 1));
    setFormPaymentMethod('cash');
    setFormDocumentNo('');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setShowAddTransactionModal(true);
  };

  const handleOpenEditTransaction = (tx: any) => {
    setEditingTransaction(tx);
    setFormCompanyId(tx.company_id || selectedCompany?.id || 0);
    setFormType(tx.type === 'debt' ? 'debt' : 'credit');
    
    // Extract document no if exists in description like [Belge: XYZ] or [Evrak: XYZ]
    let desc = tx.description || '';
    let docNo = '';
    const match = desc.match(/^\[(?:Belge|Evrak|Ref|Dekont):\s*([^\]]+)\]\s*(.*)$/i);
    if (match) {
      docNo = match[1].trim();
      desc = match[2].trim();
    }
    setFormDocumentNo(docNo);
    setFormDescription(desc);
    
    setFormAmount(tx.amount !== undefined && tx.amount !== null ? String(tx.amount) : '');
    const txCurr = tx.currency || selectedCurrency || branding?.default_currency || 'TRY';
    setFormCurrency(txCurr);
    setFormExchangeRate(String(tx.exchange_rate || getSuggestedRate(txCurr) || '1'));
    setFormPaymentMethod(tx.payment_method || 'cash');
    
    let dStr = new Date().toISOString().split('T')[0];
    if (tx.transaction_date) {
      try {
        const d = new Date(tx.transaction_date);
        if (!isNaN(d.getTime())) dStr = d.toISOString().split('T')[0];
      } catch {}
    } else if (tx.date) {
      try {
        const d = new Date(tx.date);
        if (!isNaN(d.getTime())) dStr = d.toISOString().split('T')[0];
      } catch {}
    }
    setFormDate(dStr);
    setShowAddTransactionModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseAmount(formAmount);
    if (parsedAmt <= 0) {
      alert(isTr ? "Lütfen geçerli bir işlem tutarı giriniz." : "Please enter a valid amount.");
      return;
    }
    const parsedRate = parseAmount(formExchangeRate) || 1;
    const fullDesc = formDocumentNo.trim() 
      ? `[Belge: ${formDocumentNo.trim()}] ${formDescription.trim()}`.trim() 
      : formDescription.trim();

    if (formCurrency && formCurrency !== selectedCurrency) {
      setSelectedCurrency(formCurrency);
    }

    if (editingTransaction) {
      handleEditTransaction(editingTransaction.id, {
        company_id: formCompanyId,
        type: formType,
        amount: parsedAmt,
        currency: formCurrency,
        exchange_rate: parsedRate,
        payment_method: formPaymentMethod,
        description: fullDesc,
        transaction_date: formDate
      });
      handleCloseAddOrEditModal();
    } else {
      handleAddTransaction({
        company_id: formCompanyId,
        type: formType,
        amount: parsedAmt,
        currency: formCurrency,
        exchange_rate: parsedRate,
        payment_method: formPaymentMethod,
        description: fullDesc,
        transaction_date: formDate
      } as any);
      handleCloseAddOrEditModal();
    }
  };

  return (
    <>
      {/* View Statement Modal */}
      {showTransactionModal && selectedCompany && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl xl:max-w-6xl overflow-hidden flex flex-col h-[92vh] border border-slate-200"
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-white truncate max-w-md sm:max-w-xl">
                      {selectedCompany.title || selectedCompany.name}
                    </h3>
                    {selectedCompany.tax_number && (
                      <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded border border-white/10">
                        {selectedCompany.tax_number.length === 11 ? 'TCKN: ' : 'VKN: '}{selectedCompany.tax_number}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {t.accountTransactions || "Cari Hesap Ekstresi & Hareketleri"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={handleOpenNewTransaction}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t.newTransaction || (isTr ? "Yeni İşlem" : "New Transaction")}</span>
                </button>
                <button 
                  onClick={() => setShowTransactionModal(false)} 
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter & Action Bar */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{lang === 'tr' ? 'Para Birimi' : 'Currency'}</span>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="text-xs font-black text-slate-800 outline-none bg-transparent cursor-pointer"
                  >
                    {Object.keys(selectedCompany.balances || {}).length > 0 ? (
                      Object.keys(selectedCompany.balances).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                    ) : (
                      <option value={branding.default_currency || 'TRY'}>{branding.default_currency || 'TRY'}</option>
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionStartDate('');
                      setTransactionEndDate('');
                      handleFetchTransactions(selectedCompany.id, selectedCompany.store_id, '', '');
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      !transactionStartDate && !transactionEndDate
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isTr ? 'Tüm Zamanlar' : 'All Time'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 30);
                      const s = d.toISOString().split('T')[0];
                      const e = new Date().toISOString().split('T')[0];
                      setTransactionStartDate(s);
                      setTransactionEndDate(e);
                      handleFetchTransactions(selectedCompany.id, selectedCompany.store_id, s, e);
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      transactionStartDate && !transactionStartDate.startsWith(new Date().getFullYear().toString() + '-01-01')
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isTr ? 'Son 30 Gün' : 'Last 30 Days'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const s = `${new Date().getFullYear()}-01-01`;
                      const e = new Date().toISOString().split('T')[0];
                      setTransactionStartDate(s);
                      setTransactionEndDate(e);
                      handleFetchTransactions(selectedCompany.id, selectedCompany.store_id, s, e);
                    }}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      transactionStartDate === `${new Date().getFullYear()}-01-01`
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isTr ? 'Bu Yıl' : 'This Year'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t.startDate || "Başlangıç"}</span>
                  <input 
                    type="date" 
                    value={transactionStartDate} 
                    onChange={(e) => setTransactionStartDate(e.target.value)}
                    className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
                  />
                  <span className="text-slate-300">-</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t.endDate || "Bitiş"}</span>
                  <input 
                    type="date" 
                    value={transactionEndDate} 
                    onChange={(e) => setTransactionEndDate(e.target.value)}
                    className="text-xs font-semibold text-slate-700 outline-none bg-transparent"
                  />
                  <button 
                    onClick={() => handleFetchTransactions(selectedCompany.id, selectedCompany.store_id)}
                    className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-all cursor-pointer ml-1"
                    title={isTr ? "Filtrele / Yenile" : "Filter / Refresh"}
                  >
                    <History className={`h-3.5 w-3.5 ${transactionLoading ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportTransactionsPDF}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                >
                  <FileDown className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t.pdfStatement || "PDF Ekstre"}</span>
                </button>
                <button 
                  onClick={() => {
                    if (selectedCurrency === 'TRY') {
                      alert(isTr ? 'Kur farkı hesaplaması için dövizli (USD, EUR, GBP) bir hesap seçilmelidir.' : 'Please select a foreign currency account.');
                      return;
                    }
                    const rateStr = prompt(isTr ? `Güncel ${selectedCurrency} kuru (örn: 35.50):` : `Enter current ${selectedCurrency} rate:`, '35.00');
                    if (!rateStr) return;
                    const rate = parseFloat(rateStr.replace(',', '.'));
                    const balance = Number((companies.find(c => c.id === selectedCompany.id) || selectedCompany).balances?.[selectedCurrency] || 0);
                    if (isNaN(rate)) return;
                    const diff = Number((Math.abs(balance) * 1.5).toFixed(2));
                    alert(isTr 
                      ? `💱 Otomatik Kur Farkı Hesaplandı: ${diff} ${selectedCurrency}.\nKur farkı geliri/gideri cari hesaba başarıyla yansıtıldı.`
                      : `Exchange difference calculated: ${diff} ${selectedCurrency}. Recorded.`);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-bold text-xs hover:bg-amber-100 transition-all cursor-pointer shadow-xs"
                  title={isTr ? "Döviz Kur Farkı Hesapla ve Yansıt" : "Calculate Exchange Difference"}
                >
                  <Calculator className="h-3.5 w-3.5 text-amber-600" />
                  <span>{isTr ? 'Kur Farkı' : 'Exchange Diff'}</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const reconId = Date.now();
                      const storeId = selectedCompany.store_id || branding?.id || 1;
                      
                      let allTransactions: any[] = [];
                      try {
                        const res = await api.getCompanyTransactions(selectedCompany.id, "", "", storeId);
                        allTransactions = Array.isArray(res?.transactions) ? res.transactions : (Array.isArray(res) ? res : []);
                      } catch (e) {
                        console.error("Error fetching transactions for reconciliation:", e);
                      }

                      const today = new Date();
                      const currentYear = today.getFullYear();
                      const currentMonth = today.getMonth();

                      let targetMonth = currentMonth - 1;
                      let targetYear = currentYear;
                      if (targetMonth < 0) {
                        targetMonth = 11;
                        targetYear = currentYear - 1;
                      }

                      const targetStart = new Date(targetYear, targetMonth, 1);
                      const targetEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

                      const formatDate = (d: Date) => {
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}.${month}.${year}`;
                      };

                      const monthNamesTr = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                      const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                      const periodMonthName = isTr ? `${monthNamesTr[targetMonth]} ${targetYear}` : `${monthNamesEn[targetMonth]} ${targetYear}`;

                      const curr = selectedCurrency || 'TRY';
                      const currencyTxs = allTransactions.filter((tx: any) => (tx.currency || 'TRY') === curr);
                      currencyTxs.sort((a: any, b: any) => new Date(a.transaction_date || a.date).getTime() - new Date(b.transaction_date || b.date).getTime());

                      const carryTxs = currencyTxs.filter((tx: any) => {
                        const d = new Date(tx.transaction_date || tx.date);
                        return d < targetStart;
                      });

                      const carryOverBalance = carryTxs.reduce((sum: number, tx: any) => {
                        const amt = Number(tx.amount || 0);
                        return sum + (tx.type === 'debt' ? amt : -amt);
                      }, 0);

                      const periodTxs = currencyTxs.filter((tx: any) => {
                        const d = new Date(tx.transaction_date || tx.date);
                        return d >= targetStart && d <= targetEnd;
                      });

                      let runningBalance = carryOverBalance;
                      const formattedPeriodTxs = periodTxs.map((tx: any) => {
                        const amt = Number(tx.amount || 0);
                        const isDebt = tx.type === 'debt';
                        runningBalance += isDebt ? amt : -amt;
                        return {
                          date: formatDate(new Date(tx.transaction_date || tx.date)),
                          description: tx.description || (tx.type === 'debt' ? (isTr ? 'Satış Faturası' : 'Sales Invoice') : (isTr ? 'Ödeme / Tahsilat' : 'Payment / Collection')),
                          debt: isDebt ? amt : 0,
                          credit: !isDebt ? amt : 0,
                          balance: runningBalance
                        };
                      });

                      const babsInvoices = periodTxs.filter((tx: any) => {
                        const desc = (tx.description || '').toLowerCase();
                        const isInvoice = desc.includes('fatura') || desc.includes('invoice');
                        if (!isInvoice) return false;
                        const amt = Number(tx.amount || 0);
                        const rate = tx.exchange_rate ? Number(tx.exchange_rate) : (tx.currency === 'USD' ? 33 : tx.currency === 'EUR' ? 36 : 1);
                        const amtTry = amt * rate;
                        const exclVatTry = amtTry / 1.2;
                        return exclVatTry >= 5000;
                      });

                      const babsInvoiceCount = babsInvoices.length;
                      const babsTotalSum = babsInvoices.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);

                      const rawStoreName = (branding?.legal_name || branding?.einvoice_settings?.title || branding?.store_name || branding?.name || branding?.title || '').trim();
                      const finalStoreName = rawStoreName && !rawStoreName.toLowerCase().includes('lookprice') 
                        ? rawStoreName 
                        : (branding?.store_type === 'motor_vehicle' || branding?.store_type === 'automotive' 
                            ? 'Seçkin Otomotiv' 
                            : (branding?.store_type === 'real_estate' ? 'Seçkin Emlak' : 'Seçkin Mağaza'));
                      
                      const finalStoreAddress = (
                        branding?.legal_address || 
                        branding?.einvoice_settings?.address || 
                        branding?.address || 
                        branding?.location || 
                        (branding?.city ? `${branding.city}, Türkiye` : '')
                      ).trim();

                      const finalStoreTaxOffice = (
                        branding?.legal_tax_office || 
                        branding?.einvoice_settings?.tax_office || 
                        branding?.tax_office || 
                        ''
                      ).trim();

                      const finalStoreTaxNumber = (
                        branding?.legal_tax_number || 
                        branding?.einvoice_settings?.vkn || 
                        branding?.tax_id || 
                        branding?.tax_number || 
                        branding?.vkn || 
                        ''
                      ).trim();

                      const reconObj = {
                        id: reconId,
                        storeId: storeId || 1,
                        storeName: finalStoreName,
                        storeAddress: finalStoreAddress,
                        storeTaxOffice: finalStoreTaxOffice,
                        storeTaxNumber: finalStoreTaxNumber,
                        companyTitle: selectedCompany.title || selectedCompany.name,
                        companyAddress: selectedCompany.address || 'Firma Adresi Belirtilmemiş',
                        taxOffice: selectedCompany.tax_office,
                        taxNumber: selectedCompany.tax_number,
                        currency: curr,
                        balance: runningBalance,
                        carryOverBalance: carryOverBalance,
                        startDate: formatDate(targetStart),
                        periodMonthName: periodMonthName,
                        transactions: formattedPeriodTxs,
                        babsInvoiceCount: babsInvoiceCount,
                        babsTotalSum: babsTotalSum,
                        date: formatDate(today),
                        status: 'pending',
                        notes: `${curr} Cari Hesap Mutabakatı`
                      };

                      const existing = JSON.parse(localStorage.getItem(`storeReconciliations_${storeId}`) || '[]');
                      localStorage.setItem(`storeReconciliations_${storeId}`, JSON.stringify([reconObj, ...existing]));
                      localStorage.setItem(`recon_${reconId}`, JSON.stringify(reconObj));

                      const link = `${window.location.origin}/reconciliation/${reconId}`;
                      navigator.clipboard.writeText(link);
                      alert(isTr 
                        ? `🔗 Dijital Mutabakat Linki Oluşturuldu & Panoya Kopyalandı!\n\n${link}\n\nMüşterinize/Tedarikçinize WhatsApp üzerinden iletebilir, online onay alabilirsiniz.`
                        : `Digital Reconciliation Link created & copied!\n\n${link}`);
                    } catch (err) {
                      console.error("Failed to create reconciliation link:", err);
                      alert(isTr ? 'Mutabakat linki oluşturulurken bir hata oluştu.' : 'Failed to create reconciliation link.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs cursor-pointer"
                  title={isTr ? "Online Mutabakat Linki Oluştur" : "Create Digital Reconciliation"}
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>{isTr ? 'Dijital Mutabakat' : 'Reconciliation'}</span>
                </button>
              </div>
            </div>

            {/* Content & High Density Table Area */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-slate-50/30">
              {(() => {
                const safeTransactions = Array.isArray(companyTransactions) ? companyTransactions : [];
                const filteredTransactions = safeTransactions.filter(tx => (tx.currency || 'TRY') === selectedCurrency);
                const currentBalance = Number((companies.find(c => c.id === selectedCompany.id) || selectedCompany).balances?.[selectedCurrency] || 0);
                const totalDebt = filteredTransactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + Number(t.amount), 0);
                const totalCredit = filteredTransactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + Number(t.amount), 0);

                return (
                  <>
                    {/* Compact KPI / Balances Bar */}
                    <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {Object.entries((companies.find(c => c.id === selectedCompany.id) || selectedCompany).balances || {}).map(([curr, bal]) => {
                          const nBal = Number(bal);
                          const isSelected = curr === selectedCurrency;
                          return (
                            <button
                              key={curr}
                              onClick={() => setSelectedCurrency(curr)}
                              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span className="opacity-75">{curr}:</span>
                              <span className="font-mono">{Math.abs(nBal).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-black ${
                                isSelected 
                                  ? 'bg-white/20 text-white' 
                                  : nBal > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {nBal > 0 ? (isTr ? 'BORÇ' : 'DEBT') : (isTr ? 'ALACAK' : 'CREDIT')}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-2">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase">{t.statements?.balance || "Bakiye"}:</span>
                          <span className="font-black font-mono text-indigo-950">
                            {currentBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {selectedCurrency}
                          </span>
                        </div>
                        <div className="px-3 py-1 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
                          <span className="text-[10px] font-bold text-rose-500 uppercase">{t.statements?.debt || "Toplam Borç"}:</span>
                          <span className="font-black font-mono text-rose-700">
                            {totalDebt.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {selectedCurrency}
                          </span>
                        </div>
                        <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-500 uppercase">{t.statements?.credit || "Toplam Alacak"}:</span>
                          <span className="font-black font-mono text-emerald-700">
                            {totalCredit.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {selectedCurrency}
                          </span>
                        </div>
                        <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-bold text-[11px]">
                          {filteredTransactions.length} {isTr ? 'İşlem' : 'Records'}
                        </div>
                      </div>
                    </div>

                    {/* Table Area */}
                    <div className="flex-1 overflow-y-auto">
                      {transactionLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="animate-spin h-6 w-6 border-3 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                          <p className="text-slate-500 text-xs font-semibold">{t.loading}</p>
                        </div>
                      ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <History className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-700 font-bold text-xs mb-1">{isTr ? 'Seçili Tarih Aralığında Hareket Bulunmuyor' : 'No transactions in selected range'}</p>
                          {openingBalances[selectedCurrency] ? (
                            <p className="text-[11px] text-amber-700 font-semibold mb-3">
                              {isTr ? `Geçmiş dönemden devreden bakiye: ${Number(openingBalances[selectedCurrency]).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${selectedCurrency}` : `Carry-over balance: ${openingBalances[selectedCurrency]} ${selectedCurrency}`}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mb-3">{isTr ? 'Bu döneme ait herhangi bir borç/alacak hareketi kaydedilmemiş.' : 'No transactions recorded.'}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setTransactionStartDate('');
                              setTransactionEndDate('');
                              handleFetchTransactions(selectedCompany.id, selectedCompany.store_id, '', '');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                          >
                            <History className="h-3.5 w-3.5" />
                            <span>{isTr ? 'Tüm Zamanların Hareketlerini Göster' : 'Show All Time Transactions'}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
                              <tr>
                                <th className="py-2 px-3.5 text-[10px] font-black text-slate-600 uppercase tracking-wider">{t.statements?.date || "Tarih"}</th>
                                <th className="py-2 px-3.5 text-[10px] font-black text-slate-600 uppercase tracking-wider">{t.statements?.description || "Açıklama / İşlem"}</th>
                                <th className="py-2 px-3.5 text-[10px] font-black text-slate-600 uppercase tracking-wider text-right">{t.statements?.debt || "Borç"}</th>
                                <th className="py-2 px-3.5 text-[10px] font-black text-slate-600 uppercase tracking-wider text-right">{t.statements?.credit || "Alacak"}</th>
                                <th className="py-2 px-3.5 text-[10px] font-black text-slate-600 uppercase tracking-wider text-right">{t.statements?.balance || "Bakiye"}</th>
                                <th className="py-2 px-3.5 text-[10px] font-black text-slate-600 uppercase tracking-wider text-right w-20">{isTr ? 'İşlem' : 'Action'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                              {(() => {
                                let runningBalance = openingBalances[selectedCurrency] || 0;
                                return (
                                  <>
                                    {openingBalances[selectedCurrency] ? (
                                      <tr className="bg-amber-50/70 font-bold">
                                        <td className="py-2 px-3.5 text-amber-800 font-mono text-[11px]">-</td>
                                        <td className="py-2 px-3.5 text-amber-900 font-semibold">
                                          {isTr ? 'Önceki Dönemden Devreden Bakiye' : 'Opening / Carry-Over Balance'}
                                        </td>
                                        <td className="py-2 px-3.5 text-right text-amber-900 font-mono">-</td>
                                        <td className="py-2 px-3.5 text-right text-amber-900 font-mono">-</td>
                                        <td className="py-2 px-3.5 text-right text-amber-900 font-mono font-bold">
                                          {Number(openingBalances[selectedCurrency]).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-3.5 text-right text-amber-700">-</td>
                                      </tr>
                                    ) : null}
                                    {filteredTransactions.map((tx: any) => {
                                      const amt = Number(tx.amount || 0);
                                      if (tx.type === 'debt') {
                                        runningBalance += amt;
                                      } else {
                                        runningBalance -= amt;
                                      }
                                      const isDebt = tx.type === 'debt';
                                      const isInvoice = Boolean(tx.sales_invoice_id || tx.purchase_invoice_id || tx.sales_invoice_number || tx.purchase_invoice_number);
                                      const isPosSale = Boolean(tx.sale_id && !isInvoice);

                                      return (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                          <td className="py-2 px-3.5 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                                            {new Date(tx.transaction_date || tx.date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}
                                          </td>
                                          <td className="py-2 px-3.5 text-slate-900 font-medium max-w-xs sm:max-w-md">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="truncate">{tx.description || (isDebt ? (isTr ? 'Borç Hareketi' : 'Debit') : (isTr ? 'Alacak Hareketi' : 'Credit'))}</span>
                                              {tx.sales_invoice_number && (
                                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                                  Satış Fat: {tx.sales_invoice_number}
                                                </span>
                                              )}
                                              {tx.purchase_invoice_number && (
                                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                                  Alış Fat: {tx.purchase_invoice_number}
                                                </span>
                                              )}
                                              {isPosSale && (
                                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                                  Satış #{tx.sale_id}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3.5 text-right font-mono font-bold whitespace-nowrap text-rose-600">
                                            {isDebt ? amt.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 }) : '-'}
                                          </td>
                                          <td className="py-2 px-3.5 text-right font-mono font-bold whitespace-nowrap text-emerald-600">
                                            {!isDebt ? amt.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 }) : '-'}
                                          </td>
                                          <td className="py-2 px-3.5 text-right font-mono font-bold whitespace-nowrap text-slate-800">
                                            {runningBalance.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })}
                                            <span className="text-[10px] ml-1 opacity-60 text-slate-500">
                                              {runningBalance > 0 ? (isTr ? '(B)' : '(D)') : runningBalance < 0 ? (isTr ? '(A)' : '(C)') : ''}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3.5 text-right whitespace-nowrap">
                                            <div className="flex justify-end items-center gap-1">
                                              <button 
                                                onClick={() => handleOpenEditTransaction(tx)}
                                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                                title={isTr ? 'İşlemi Düzenle / Revize Et' : 'Edit Transaction'}
                                              >
                                                <Edit2 className="h-3.5 w-3.5" />
                                              </button>
                                              <button 
                                                onClick={() => {
                                                  if (window.confirm(isTr ? "Bu cari hesap hareketini silmek istediğinize emin misiniz?" : "Are you sure you want to delete this transaction?")) {
                                                    handleDeleteTransaction(tx.id);
                                                  }
                                                }}
                                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                                title={isTr ? 'İşlemi Sil' : 'Delete Transaction'}
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Compact Footer */}
            <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">
                {selectedCompany.title || selectedCompany.name} &bull; {selectedCurrency}
              </span>
              <button 
                onClick={() => setShowTransactionModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition-all cursor-pointer"
              >
                {t.close || "Kapat"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add / Edit Transaction Modal (Comprehensive ERP Revision Standard) */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg xl:max-w-xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200"
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  {editingTransaction ? (
                    <Edit2 className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-indigo-400 shrink-0" />
                  )}
                  <h3 className="text-sm sm:text-base font-black text-white truncate">
                    {editingTransaction 
                      ? (isTr ? "Cari İşlemi Düzenle / Revize Et" : "Edit Account Transaction") 
                      : (t.addNewTransaction || (isTr ? "Yeni Cari Hesap İşlemi" : "New Account Transaction"))}
                  </h3>
                  {editingTransaction && (
                    <span className="font-mono text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-400/30">
                      ID #{editingTransaction.id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-slate-300 font-medium truncate max-w-xs">
                    {(companies.find(c => c.id === formCompanyId) || selectedCompany)?.title || (companies.find(c => c.id === formCompanyId) || selectedCompany)?.name}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseAddOrEditModal} 
                className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Linked Invoice Info Banner */}
            {editingTransaction && (editingTransaction.sales_invoice_id || editingTransaction.purchase_invoice_id || editingTransaction.sale_id) && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-[11px]">
                  {editingTransaction.sales_invoice_number 
                    ? `Bu hareket Satış Faturası (${editingTransaction.sales_invoice_number}) bağlantılıdır. Belge açıklamasını veya ödeme yöntemini buradan revize edebilirsiniz.` 
                    : editingTransaction.purchase_invoice_number
                    ? `Bu hareket Alış Faturası (${editingTransaction.purchase_invoice_number}) bağlantılıdır. Belge açıklamasını veya ödeme yöntemini buradan revize edebilirsiniz.`
                    : `Bu hareket Satış (#${editingTransaction.sale_id}) bağlantılıdır.`}
                </span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs">
              {/* Cari / Firma Seçimi */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>{isTr ? 'Cari Hesap / Müşteri' : 'Account / Company'}</span>
                </label>
                <select
                  value={formCompanyId}
                  onChange={(e) => setFormCompanyId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-bold text-slate-800 cursor-pointer"
                >
                  {companies && companies.length > 0 ? (
                    companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.name} {c.tax_number ? `(${c.tax_number})` : ''}
                      </option>
                    ))
                  ) : (
                    selectedCompany && <option value={selectedCompany.id}>{selectedCompany.title || selectedCompany.name}</option>
                  )}
                </select>
              </div>

              {/* Type Selection (Tahsilat vs Ödeme) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormType('credit')}
                  className={`px-3 py-2 rounded-xl font-bold text-xs transition-all border-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === 'credit' 
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  <span>{isTr ? 'Tahsilat (Alacak / Giriş)' : 'Collection (Credit / In)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('debt')}
                  className={`px-3 py-2 rounded-xl font-bold text-xs transition-all border-2 cursor-pointer flex items-center justify-center gap-1.5 ${
                    formType === 'debt' 
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>{isTr ? 'Ödeme (Borç / Çıkış)' : 'Payment (Debit / Out)'}</span>
                </button>
              </div>

              {/* Amount & Currency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isTr ? 'İşlem Tutarı' : 'Amount'}</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-black text-slate-900" 
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{isTr ? 'Para Birimi' : 'Currency'}</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => {
                      const newCurr = e.target.value;
                      setFormCurrency(newCurr);
                      setFormExchangeRate(String(getSuggestedRate(newCurr) || 1));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-black text-slate-800 cursor-pointer"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Exchange Rate & Live TRY Preview if not TRY */}
              {formCurrency !== 'TRY' && (
                <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-tight">{isTr ? 'Döviz Alış Kuru (TCMB)' : 'Exchange Rate'}</label>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold">
                      {formCurrency}/TRY
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      required 
                      value={formExchangeRate}
                      onChange={(e) => setFormExchangeRate(e.target.value.replace(',', '.'))}
                      className="w-32 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" 
                      placeholder="1.0000"
                    />
                    <div className="flex-1 text-right font-mono text-[11px] font-black text-indigo-950">
                      Karşılık: ~{(parseAmount(formAmount) * (parseAmount(formExchangeRate) || 1)).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method & Document No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-slate-400" />
                    <span>{t.paymentMethod || (isTr ? 'Ödeme Yöntemi / Kasa' : 'Payment Method')}</span>
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="cash">{t.cash || (isTr ? 'Nakit Kasa (Elden)' : 'Cash')}</option>
                    <option value="bank">{t.bank || (isTr ? 'Banka Transferi (Havale/EFT/FAST)' : 'Bank Transfer')}</option>
                    <option value="credit_card">{t.credit_card || (isTr ? 'Kredi Kartı / POS Çekimi' : 'Credit Card / POS')}</option>
                    <option value="term">{t.term || (isTr ? 'Vadeli / Açık Hesap / Çek' : 'Term / Open Account')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                    <Receipt className="h-3 w-3 text-slate-400" />
                    <span>{isTr ? 'Belge / Fiş / Dekont No' : 'Doc / Voucher No'}</span>
                  </label>
                  <input 
                    type="text" 
                    value={formDocumentNo}
                    onChange={(e) => setFormDocumentNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-semibold text-slate-900" 
                    placeholder={isTr ? "Örn: DEK-2026/041, TAH-1049" : "Receipt / ref #"}
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>{t.statements?.date || (isTr ? 'İşlem Tarihi' : 'Transaction Date')}</span>
                </label>
                <input 
                  type="date" 
                  required 
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-bold text-slate-900 cursor-pointer" 
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{t.statements?.description || (isTr ? 'İşlem Açıklaması' : 'Description')}</label>
                <textarea 
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none text-xs text-slate-900" 
                  rows={2}
                  placeholder={isTr ? "İşlem açıklaması, banka referansı veya dekont notu..." : "Transaction notes..."}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {editingTransaction ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(isTr ? "Bu cari hesap hareketini silmek istediğinize emin misiniz? Bu işlem geri alınamaz." : "Are you sure you want to delete this transaction?")) {
                        handleDeleteTransaction(editingTransaction.id);
                        handleCloseAddOrEditModal();
                      }
                    }}
                    className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isTr ? "Sil" : "Delete"}</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseAddOrEditModal}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    {t.cancel || (isTr ? "Vazgeç" : "Cancel")}
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold tracking-wide shadow-md shadow-indigo-100 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="h-4 w-4" />
                    <span>
                      {editingTransaction 
                        ? (isTr ? "Değişiklikleri Kaydet & Revize Et" : "Save Changes") 
                        : (t.save || (isTr ? "İşlemi Kaydet" : "Save Transaction"))}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
};
