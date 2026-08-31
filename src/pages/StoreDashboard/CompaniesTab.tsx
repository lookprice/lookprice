import React, { useState, useDeferredValue } from "react";
import { normalizeSearch } from "../../lib/searchUtils";
import { api } from "../../services/api";
import { 
  Plus, 
  Search, 
  Store, 
  ChevronRight, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Download,
  Trash2,
  Edit2,
  FileCheck,
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Copy,
  ExternalLink
} from "lucide-react";
import { motion } from "motion/react";
import { translations } from "../../translations";
import { useLanguage } from "../../contexts/LanguageContext";

interface CompaniesTabProps {
  companies: any[];
  isViewer: boolean;
  onViewTransactions: (company: any) => void;
  onEdit: (company: any) => void;
  onDelete: (id: any) => void;
  onExportReport: () => void;
  includeZero: boolean;
  onIncludeZeroChange: (val: boolean) => void;
  defaultCurrency?: string;
  branding?: any;
}

const CompaniesTab = ({ 
  companies, 
  isViewer, 
  onViewTransactions, 
  onEdit,
  onDelete,
  onExportReport,
  includeZero,
  onIncludeZeroChange,
  defaultCurrency = 'TRY',
  branding
}: CompaniesTabProps) => {
  const { lang } = useLanguage();
  const t = translations[lang].dashboard;
  const isTr = lang === 'tr';
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const [showReconHistory, setShowReconHistory] = useState(false);
  const storeId = companies[0]?.store_id || 1;

  const getReconciliations = () => {
    try {
      return JSON.parse(localStorage.getItem(`storeReconciliations_${storeId}`) || '[]');
    } catch {
      return [];
    }
  };

  const [reconciliations, setReconciliations] = useState<any[]>(getReconciliations());

  const handleClearHistory = () => {
    if (window.confirm(isTr ? "Tüm dijital mutabakat geçmişini ve test verilerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz." : "Are you sure you want to clear all digital reconciliation history? This cannot be undone.")) {
      try {
        localStorage.removeItem(`storeReconciliations_${storeId}`);
        // Remove individual keys like recon_*
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith('recon_')) {
            localStorage.removeItem(key);
          }
        }
        setReconciliations([]);
        alert(isTr ? 'Dijital mutabakat geçmişi başarıyla temizlendi.' : 'Digital reconciliation history successfully cleared.');
      } catch (e) {
        console.error("Error clearing reconciliations:", e);
      }
    }
  };

  const handleRefreshRecons = () => {
    setReconciliations(getReconciliations());
  };

  const filteredCompanies = companies.filter(c => {
    const searchTerms = normalizeSearch(deferredSearch).split(/\s+/).filter(Boolean);
    const matchesSearch = searchTerms.length === 0 ? true : searchTerms.every(term => 
      normalizeSearch(c.title).includes(term) || (c.tax_number || "").includes(term)
    );
    
    const hasBalance = Object.values(c.balances || {}).some(bal => Number(bal) !== 0);
    
    if (!includeZero && !hasBalance) {
      return false;
    }
    
    return matchesSearch;
  });

  const paginatedCompanies = filteredCompanies.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 shadow-sm backdrop-blur-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={t.searchCompany}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 transition-all text-sm placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              handleRefreshRecons();
              setShowReconHistory(true);
            }}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <History className="h-4 w-4" />
            {isTr ? 'Mutabakat Geçmişi & Durum Takibi' : 'Reconciliation History & Status'}
          </button>
          <button 
            onClick={onExportReport}
            className="flex items-center justify-center bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2 text-slate-500" /> {t.export}
          </button>
          <label className="flex items-center cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                className="peer h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10 transition-all cursor-pointer"
                checked={includeZero}
                onChange={(e) => onIncludeZeroChange(e.target.checked)}
              />
            </div>
            <span className="ml-2 text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{t.showZeroBalance}</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden zebra-border">
        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.companyTitle}</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.taxInfo}</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.contactPerson}</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">{t.balance}</th>
                <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm font-medium">
                    {t.noCompanies || "Kayıtlı cari hesap bulunamadı."}
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0 border border-slate-200">
                          {c.title ? c.title.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{c.title}</p>
                          <p className="text-xs text-slate-400">{c.phone || c.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-xs font-medium text-slate-800">{c.tax_office || '-'}</p>
                      <p className="text-xs font-mono text-slate-500">{c.tax_number || '-'}</p>
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-700">
                      {c.contact_person || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {c.balances && Object.keys(c.balances).length > 0 ? (
                          Object.entries(c.balances || {}).map(([currency, bal]) => {
                            const numBal = Number(bal);
                            if (numBal === 0) return null;
                            const isDebt = numBal > 0;
                            return (
                              <div key={currency} className={`flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg border transition-all ${isDebt ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                <div className="flex flex-col items-end leading-none">
                                  <span className="text-xs font-medium font-mono tabular-nums">
                                    {Math.abs(numBal).toLocaleString(isTr ? 'tr-TR' : 'en-US')}
                                  </span>
                                  <span className="text-[8px] font-medium uppercase tracking-widest opacity-70">
                                    {isDebt ? t.statements.debt : t.statements.credit}
                                  </span>
                                </div>
                                <div className={`px-1.5 py-0.5 rounded md text-[10px] font-medium ${isDebt ? 'bg-rose-600/10' : 'bg-emerald-600/10'}`}>
                                  {currency.substring(0, 3)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-lg border bg-slate-50 border-slate-100 text-slate-400 opacity-60">
                            <span className="text-xs font-medium font-mono">0</span>
                            <div className="px-1.5 py-0.5 rounded md text-[10px] font-medium bg-slate-200">
                              {defaultCurrency}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => onViewTransactions(c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title={t.viewTransactions}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const reconId = Date.now();
                              const curr = defaultCurrency || 'TRY';
                              const currentStoreId = c.store_id || branding?.id || storeId || 1;
                              
                              // Fetch all transactions to calculate dynamic carry-over and period details
                              let allTransactions: any[] = [];
                              try {
                                const res = await api.getCompanyTransactions(c.id, "", "", currentStoreId);
                                allTransactions = res.transactions || res || [];
                              } catch (e) {
                                console.error("Error fetching transactions for reconciliation:", e);
                              }

                              const today = new Date();
                              const currentYear = today.getFullYear();
                              const currentMonth = today.getMonth(); // 0-indexed

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

                              // Filter transactions for this specific currency
                              const currencyTxs = allTransactions.filter((tx: any) => (tx.currency || 'TRY') === curr);

                              // Sort transactions by date ascending for correct running balance math
                              currencyTxs.sort((a: any, b: any) => new Date(a.transaction_date || a.date).getTime() - new Date(b.transaction_date || b.date).getTime());

                              // Calculate Carry-Over Balance (transactions before targetStart)
                              const carryTxs = currencyTxs.filter((tx: any) => {
                                const d = new Date(tx.transaction_date || tx.date);
                                return d < targetStart;
                              });

                              const carryOverBalance = carryTxs.reduce((sum: number, tx: any) => {
                                const amt = Number(tx.amount || 0);
                                return sum + (tx.type === 'debt' ? amt : -amt);
                              }, 0);

                              // Calculate Period Transactions (transactions inside targetMonth)
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

                              // BA/BS calculation: USD/EUR/TRY invoices in target period whose TRY equivalent excluding VAT is >= 5000 TL
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
                                storeId: currentStoreId || 1,
                                storeName: finalStoreName,
                                storeAddress: finalStoreAddress,
                                storeTaxOffice: finalStoreTaxOffice,
                                storeTaxNumber: finalStoreTaxNumber,
                                companyTitle: c.title,
                                companyAddress: c.address || 'Firma Adresi Belirtilmemiş',
                                taxOffice: c.tax_office,
                                taxNumber: c.tax_number,
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

                              const existing = JSON.parse(localStorage.getItem(`storeReconciliations_${currentStoreId}`) || '[]');
                              localStorage.setItem(`storeReconciliations_${currentStoreId}`, JSON.stringify([reconObj, ...existing]));
                              localStorage.setItem(`recon_${reconId}`, JSON.stringify(reconObj));

                              const link = `${window.location.origin}/reconciliation/${reconId}`;
                              navigator.clipboard.writeText(link);
                              alert(isTr 
                                ? `🔗 Dijital Mutabakat Linki Oluşturuldu & Panoya Kopyalandı!\n\n${link}\n\nMüşterinize/Tedarikçinize WhatsApp üzerinden ileterek online onay alabilirsiniz.`
                                : `Digital Reconciliation Link created & copied!\n\n${link}`);
                              handleRefreshRecons();
                            } catch (err) {
                              console.error("Failed to create reconciliation link:", err);
                              alert(isTr ? 'Mutabakat linki oluşturulurken bir hata oluştu.' : 'Failed to create reconciliation link.');
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title={isTr ? 'Dijital Mutabakat Gönder' : 'Send Digital Reconciliation'}
                        >
                          <FileCheck className="h-4 w-4" />
                        </button>
                        {!isViewer && (
                          <>
                            <button 
                              onClick={() => onEdit(c)}
                              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                              title={t.edit}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => onDelete(c.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title={t.delete}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              {filteredCompanies.length} {t.companies}
            </p>
            <div className="flex items-center space-x-3">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {t.prev}
              </button>
              <div className="text-xs font-bold text-slate-600 tabular-nums">
                {page} <span className="text-slate-300 mx-1">/</span> {totalPages}
              </div>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                {t.next}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reconciliation History & Status Tracking Modal */}
      {showReconHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{isTr ? 'Dijital Mutabakat Geçmişi & Canlı Durum Takibi' : 'Reconciliation History & Status Tracking'}</h3>
                <p className="text-xs text-slate-200">{isTr ? 'Müşteri ve tedarikçilerinize gönderdiğiniz mutabakatların onay durumlarını anlık takip edin.' : 'Track client and vendor reconciliation confirmation statuses in real-time.'}</p>
              </div>
              <button 
                onClick={() => setShowReconHistory(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {reconciliations.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <History className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-sm font-bold">{isTr ? 'Henüz gönderilmiş bir dijital mutabakat bulunmuyor.' : 'No digital reconciliations sent yet.'}</p>
                  <p className="text-xs text-slate-400">{isTr ? 'Cari hesaplar tablosundan yeşil tik ikonuna tıklayarak yeni mutabakat oluşturabilirsiniz.' : 'Click the green check icon on any company row to create one.'}</p>
                </div>
              ) : (
                reconciliations.map((recon: any) => {
                  const status = recon.status || 'pending';
                  const isConfirmed = status === 'confirmed';
                  const isDisputed = status === 'disputed';
                  return (
                    <div key={recon.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white hover:shadow-md transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                            {recon.periodMonthName || 'Dönem'}
                          </span>
                          <span className="text-xs text-slate-400">ID: #{recon.id}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{recon.companyTitle}</h4>
                        <p className="text-xs font-mono font-bold text-slate-700">
                          {Number(recon.balance || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {recon.currency || 'TRY'}
                        </p>
                        {recon.disputeNote && (
                          <p className="text-xs text-rose-600 font-medium italic">
                            <span className="font-bold">{isTr ? 'İtiraz Notu: ' : 'Dispute Note: '}</span>
                            {recon.disputeNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        {isConfirmed ? (
                          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isTr ? 'Onaylandı (Mutabık)' : 'Confirmed'}
                          </span>
                        ) : isDisputed ? (
                          <span className="px-3 py-1.5 bg-rose-100 text-rose-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {isTr ? 'İtiraz Edildi' : 'Disputed'}
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-xs font-extrabold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {isTr ? 'Cevap Bekleniyor' : 'Pending'}
                          </span>
                        )}

                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/reconciliation/${recon.id}`;
                            navigator.clipboard.writeText(link);
                            alert(isTr ? '🔗 Mutabakat linki panoya kopyalandı!' : 'Link copied to clipboard!');
                          }}
                          className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer"
                          title={isTr ? 'Linki Kopyala' : 'Copy Link'}
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <a
                          href={`/reconciliation/${recon.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1 text-xs font-bold"
                          title={isTr ? 'Mutabakat Sayfasını Aç' : 'Open Page'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              {reconciliations.length > 0 ? (
                <button
                  onClick={handleClearHistory}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {isTr ? 'Tüm Geçmişi Temizle' : 'Clear All History'}
                </button>
              ) : <div />}
              <button
                onClick={() => setShowReconHistory(false)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {isTr ? 'Kapat' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesTab;
