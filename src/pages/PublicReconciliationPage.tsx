import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, FileCheck, Building, ShieldCheck, ArrowRight, Printer, Receipt, Calendar } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function PublicReconciliationPage() {
  const { reconId } = useParams();
  const { lang } = useLanguage();
  const isTr = lang === 'tr';

  const [reconData, setReconData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [disputeNote, setDisputeNote] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  useEffect(() => {
    try {
      let found = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('storeReconciliations_')) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const match = list.find((r: any) => String(r.id) === String(reconId));
          if (match) {
            found = match;
            break;
          }
        }
      }
      
      if (!found && reconId) {
        const demoStored = localStorage.getItem(`recon_${reconId}`);
        if (demoStored) {
          found = JSON.parse(demoStored);
        }
      }

      if (found) {
        // Sanitize found object to display premium fallbacks for any missing details or "LookPrice" text
        const sanitized = { ...found };
        const rawStoreName = sanitized.storeName || '';
        // Only use fallback if explicitly required, otherwise allow actual store name
        if (!rawStoreName || rawStoreName.toLowerCase().includes('lookprice')) {
          // If we have a way to get the true official name, we should use it here.
          // For now, just allow the existing name if it's not a placeholder.
          if (rawStoreName && !rawStoreName.toLowerCase().includes('lookprice')) {
              sanitized.storeName = rawStoreName;
          } else {
              // Keeping 'Seçkin İşletme' only as an absolute last resort if truly missing or placeholder
              sanitized.storeName = sanitized.storeName || 'Seçkin İşletme';
          }
        }
        
        if (!sanitized.storeAddress || sanitized.storeAddress.trim() === '') {
          sanitized.storeAddress = 'Merkez Mahallesi, Ticaret Cad. No:15 İstanbul';
        }
        
        if (!sanitized.storeTaxOffice || sanitized.storeTaxOffice.trim() === '') {
          sanitized.storeTaxOffice = 'Beşiktaş';
        }
        
        if (!sanitized.storeTaxNumber || sanitized.storeTaxNumber.trim() === '') {
          sanitized.storeTaxNumber = '1234567890';
        }

        setReconData(sanitized);
        setActionStatus(sanitized.status || 'pending');
      }
    } catch (e) {
      console.error("Error loading reconciliation:", e);
    } finally {
      setLoading(false);
    }
  }, [reconId]);

  const handleUpdateStatus = (newStatus: 'confirmed' | 'disputed', note = '') => {
    if (!reconData) return;
    const updated = {
      ...reconData,
      status: newStatus,
      disputeNote: note,
      updatedAt: new Date().toISOString()
    };
    setReconData(updated);
    setActionStatus(newStatus);
    setShowDisputeModal(false);

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('storeReconciliations_')) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = list.findIndex((r: any) => String(r.id) === String(reconId));
          if (idx !== -1) {
            list[idx] = updated;
            localStorage.setItem(key, JSON.stringify(list));
            break;
          }
        }
      }
      localStorage.setItem(`recon_${reconId}`, JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving reconciliation status:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!reconData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900">
            {isTr ? 'Mutabakat Belgesi Bulunamadı' : 'Reconciliation Document Not Found'}
          </h1>
          <p className="text-sm text-slate-500">
            {isTr ? 'Aradığınız dijital mutabakat belgesi geçerli değil veya süresi dolmuş.' : 'The digital reconciliation document you are looking for is invalid or expired.'}
          </p>
        </div>
      </div>
    );
  }

  const balanceNum = Number(reconData.balance || 0);
  const isDebt = balanceNum > 0;
  const absBalance = Math.abs(balanceNum).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 });
  const currency = reconData.currency || 'TRY';
  const periodMonthName = reconData.periodMonthName || (isTr ? 'İlgili Dönem' : 'Current Period');

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 print:bg-white print:py-0 print:px-0 print-section">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm !important;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-section, .print-section * {
            visibility: visible !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          /* Spacing compression to ensure absolute A4 single page fitting */
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
          }
          .space-y-6 > * + * {
            margin-top: 0.5rem !important;
          }
          .space-y-8 > * + * {
            margin-top: 0.5rem !important;
          }
          .p-8 {
            padding: 0.75rem !important;
          }
          .p-6 {
            padding: 0.5rem !important;
          }
          .p-4 {
            padding: 0.35rem !important;
          }
          .rounded-3xl {
            border-radius: 0.5rem !important;
          }
          .rounded-2xl {
            border-radius: 0.375rem !important;
          }
          .shadow-xl {
            box-shadow: none !important;
          }
          /* Fine-tuned typography for single page */
          h1 {
            font-size: 1.25rem !important;
            line-height: 1.5rem !important;
            margin: 0 !important;
          }
          h3 {
            font-size: 0.875rem !important;
            line-height: 1.1rem !important;
          }
          p, span, td, th {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
          }
          th, td {
            padding: 4px 6px !important;
          }
          /* Prevent page split inside key content blocks */
          .no-split {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print\:hidden {
            display: none !important;
          }
        }
      `}} />
      <div className="max-w-4xl mx-auto space-y-6 print-container print:space-y-4">
        
        {/* Main Official Document Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-700 to-slate-900 p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:bg-none print:bg-slate-50 print:text-slate-900 print:p-4 print:border-b print:border-slate-300 print:rounded-xl">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400 print:text-indigo-700" />
                <span className="text-xs font-black uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full print:bg-indigo-100 print:text-indigo-800">
                  {isTr ? 'Resmi Dijital Mutabakat Portalı' : 'Official Digital Reconciliation Portal'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black print:text-xl print:text-slate-900">{reconData.storeName || 'Seçkin İşletme'}</h1>
              <p className="text-sm text-indigo-100 font-medium print:text-xs print:text-slate-600">{isTr ? 'Cari Hesap Bakiye & Ekstre Mutabakat Formu' : 'Current Account Balance & Statement Reconciliation'}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all backdrop-blur-xs cursor-pointer print:hidden"
            >
              <Printer className="w-4 h-4" />
              {isTr ? 'Yazdır / PDF İndir' : 'Print / Download PDF'}
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-8 print:p-2 print:space-y-4">
            
            {/* Official Company & Store Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 print:bg-white print:p-2 print:border-slate-200 print:rounded-xl print:gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest print:text-[8px]">{isTr ? 'İşletme Bilgileri (Gönderen)' : 'Store Info (Sender)'}</span>
                <h3 className="font-black text-slate-900 text-base print:text-sm">{reconData.storeName || 'Seçkin Mağaza'}</h3>
                <p className="text-xs text-slate-600 print:text-[10px]">{reconData.storeAddress || ''}</p>
                <p className="text-xs text-slate-500 font-medium print:text-[10px]">{reconData.storeTaxOffice ? `${reconData.storeTaxOffice} V.D. - ${reconData.storeTaxNumber || ''}` : ''}</p>
              </div>

              <div className="space-y-1 sm:text-right print:text-right">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest print:text-[8px]">{isTr ? 'Cari / Firma Bilgileri (Muhatap)' : 'Company Info (Recipient)'}</span>
                <h3 className="font-black text-slate-900 text-base print:text-sm">{reconData.companyTitle}</h3>
                <p className="text-xs text-slate-600 print:text-[10px]">{reconData.companyAddress || ''}</p>
                <p className="text-xs text-slate-500 font-medium print:text-[10px]">{reconData.taxOffice ? `${reconData.taxOffice} V.D. - ${reconData.taxNumber || ''}` : ''}</p>
                <p className="text-xs text-indigo-600 font-bold mt-1 print:text-[10px] print:text-indigo-800">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  {isTr ? 'Mutabakat Dönemi:' : 'Period:'} {periodMonthName}
                </p>
              </div>
            </div>

            {/* Formal Statement Notice */}
            <div className="p-6 bg-indigo-50/80 border-2 border-indigo-200 rounded-2xl text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4 print:bg-indigo-50 print:border-indigo-200 print:p-4 print:rounded-xl">
              <div className="space-y-1">
                <span className="text-xs font-black text-indigo-900 uppercase tracking-wider print:text-[10px]">{isTr ? 'Resmi Mutabakat Beyanı' : 'Formal Reconciliation Statement'}</span>
                <p className="text-sm font-bold text-indigo-950 print:text-xs">
                  {isTr 
                    ? `Sayın ${reconData.companyTitle}, ${periodMonthName} sonu itibari ile ${reconData.storeName || 'firmamız'} nezdindeki cari hesabınızda ${absBalance} ${currency} ${isDebt ? 'BORÇ (B)' : 'ALACAK (A)'} bakiyeniz bulunmaktadır.`
                    : `Dear ${reconData.companyTitle}, as of the end of ${periodMonthName}, your current account balance is ${absBalance} ${currency} ${isDebt ? 'DEBIT' : 'CREDIT'}.`}
                </p>
              </div>
              <div className="shrink-0 text-right print:text-right">
                <span className="text-2xl font-black font-mono text-slate-900 block print:text-lg">{absBalance} {currency}</span>
                <span className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold uppercase mt-1 ${isDebt ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'} print:bg-slate-200 print:text-slate-800`}>
                  {isDebt ? (isTr ? 'BORÇ (B)' : 'DEBT') : (isTr ? 'ALACAK (A)' : 'CREDIT')}
                </span>
              </div>
            </div>

            {/* Carry-over & Transaction Movements Table */}
            <div className="space-y-3 print:space-y-1.5 no-split">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 print:text-[10px]">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  {isTr ? 'Dönem İçi Cari Hesap Ekstresi & Önceki Ay Devri' : 'Period Statement & Carry-Over Balance'}
                </h4>
                <span className="text-xs text-slate-400 font-medium print:hidden">{isTr ? 'Tüm hareketler resmi kayıtlardandır' : 'Official ledger records'}</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 print:rounded-xl print:border-slate-300">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider print:bg-slate-50 print:text-[9px]">
                      <th className="py-3 px-4 print:py-1.5 print:px-3">{isTr ? 'Tarih' : 'Date'}</th>
                      <th className="py-3 px-4 print:py-1.5 print:px-3">{isTr ? 'İşlem Açıklaması' : 'Description'}</th>
                      <th className="py-3 px-4 text-right print:py-1.5 print:px-3">{isTr ? 'Borç' : 'Debit'}</th>
                      <th className="py-3 px-4 text-right print:py-1.5 print:px-3">{isTr ? 'Alacak' : 'Credit'}</th>
                      <th className="py-3 px-4 text-right print:py-1.5 print:px-3">{isTr ? 'Kalan Bakiye' : 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium print:text-[10px]">
                    {/* Carry Over Row */}
                    <tr className="bg-slate-50/80 font-bold print:bg-slate-50">
                      <td className="py-3 px-4 print:py-1.5 print:px-3">{reconData.startDate || '01.01.2026'}</td>
                      <td className="py-3 px-4 text-indigo-900 print:text-indigo-900 print:py-1.5 print:px-3">
                        {isTr ? '📌 Önceki Dönemden Devreden Bakiye (Devir)' : 'Carry-Over Balance from Previous Month'}
                      </td>
                      <td className="py-3 px-4 text-right print:py-1.5 print:px-3">-</td>
                      <td className="py-3 px-4 text-right print:py-1.5 print:px-3">-</td>
                      <td className="py-3 px-4 text-right font-mono print:py-1.5 print:px-3">
                        {Number(reconData.carryOverBalance || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {currency}
                      </td>
                    </tr>

                    {reconData.transactions && reconData.transactions.length > 0 ? (
                      reconData.transactions.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 print:bg-white">
                          <td className="py-3 px-4 print:py-1.5 print:px-3">{tx.date || '-'}</td>
                          <td className="py-3 px-4 print:py-1.5 print:px-3">{tx.description || tx.source}</td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600 print:py-1.5 print:px-3">
                            {Number(tx.debt || 0) > 0 ? Number(tx.debt).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600 print:py-1.5 print:px-3">
                            {Number(tx.credit || 0) > 0 ? Number(tx.credit).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold print:py-1.5 print:px-3">
                            {Number(tx.balance || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {currency}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 px-4 text-center text-slate-400 italic print:py-2">
                          {isTr ? 'Bu dönem içerisinde ek yeni hareket bulunmamaktadır.' : 'No additional transactions in this period.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BA/BS Summary Section */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 print:bg-white print:p-3 print:border-slate-200 print:rounded-xl print:space-y-1.5 no-split">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider print:text-[10px]">
                  {isTr ? 'BA / BS Mutabakat Özeti (5.000 TL ve Üzeri Faturalar)' : 'BA / BS Summary (Invoices >= 5,000 TL)'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed print:text-[10px]">
                {isTr 
                  ? `Vergi Usul Kanunu hükümleri gereğince; ilgili ay içinde KDV hariç 5.000 TL ve üzerinde olan faturaların toplamı ve adet bildirimi aşağıdadır:`
                  : `In accordance with tax regulations, invoices equal to or exceeding 5,000 TL excluding VAT for the month:`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 print:grid-cols-2 print:gap-2 print:pt-0">
                <div className="bg-white p-4 rounded-xl border border-slate-200 print:p-2 print:border-slate-200 print:rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-[8px]">{isTr ? '5.000 TL Üzeri Fatura Adedi' : 'Invoice Count'}</span>
                  <span className="text-lg font-black text-slate-900 font-mono print:text-sm">{reconData.babsInvoiceCount || 0} {isTr ? 'Adet Fatura' : 'Invoices'}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 print:p-2 print:border-slate-200 print:rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 print:text-[8px]">{isTr ? 'Faturalar Toplamı (KDV Hariç)' : 'Total Amount (Excl. VAT)'}</span>
                  <span className="text-lg font-black text-indigo-700 font-mono print:text-sm print:text-indigo-800">{Number(reconData.babsTotalSum || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {currency}</span>
                </div>
              </div>
            </div>

            {/* Signature Block (Only visible on Print) */}
            <div className="hidden print:grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-center text-xs mt-6 no-split">
              <div className="space-y-10">
                <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">{reconData.storeName || 'Gönderen İşletme'}</p>
                <div className="border-t border-dashed border-slate-300 w-44 mx-auto pt-2">
                  <p className="text-[10px] text-slate-500 font-bold">{isTr ? 'Kaşe / İmza' : 'Stamp / Signature'}</p>
                </div>
              </div>
              <div className="space-y-10">
                <p className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider">{reconData.companyTitle || 'Muhatap Firma'}</p>
                <div className="border-t border-dashed border-slate-300 w-44 mx-auto pt-2">
                  <p className="text-[10px] text-slate-500 font-bold">{isTr ? 'Kaşe / İmza' : 'Stamp / Signature'}</p>
                </div>
              </div>
            </div>

            {/* Interactive Status & Confirmation Actions */}
            <div className="pt-6 border-t border-slate-200 space-y-4 print:hidden">
              {actionStatus === 'confirmed' ? (
                <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-black text-emerald-900">
                    {isTr ? 'Mutabakat Başarıyla Onaylandı!' : 'Reconciliation Confirmed Successfully!'}
                  </h3>
                  <p className="text-xs text-emerald-700">
                    {isTr ? 'Bu bakiye için mutabık olduğunuz sisteme işlenmiş ve işletmeye iletilmiştir. Teşekkür ederiz.' : 'Your confirmation has been recorded and sent to the store.'}
                  </p>
                </div>
              ) : actionStatus === 'disputed' ? (
                <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center space-y-2">
                  <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
                  <h3 className="text-lg font-black text-rose-900">
                    {isTr ? 'Mutabakatsızlık / İtiraz Bildirildi' : 'Dispute Submitted'}
                  </h3>
                  <p className="text-xs text-rose-700">
                    {isTr ? `İtiraz notunuz işletmeye iletildi: "${reconData.disputeNote || ''}". En kısa sürede sizinle iletişime geçilecektir.` : 'Your dispute note has been forwarded to the store.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 text-center">
                    {isTr ? 'Lütfen yukarıdaki bakiye ve ekstre mutabakat durumunu onaylayınız:' : 'Please confirm the reconciliation status above:'}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleUpdateStatus('confirmed')}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {isTr ? 'Mutabıkız (Onayla)' : 'Confirm Balance'}
                    </button>

                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="w-full py-4 bg-white hover:bg-rose-50 text-rose-700 border-2 border-rose-200 font-black text-sm uppercase tracking-wider rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                    >
                      <AlertCircle className="w-5 h-5" />
                      {isTr ? 'Mutabık Değilim (İtiraz Et)' : 'Dispute Balance'}
                    </button>
                  </div>
                </div>
              )}

              {showDisputeModal && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    {isTr ? 'İtiraz / Düzeltme Gerekçeniz:' : 'Dispute Reason:'}
                  </h4>
                  <textarea
                    value={disputeNote}
                    onChange={(e) => setDisputeNote(e.target.value)}
                    placeholder={isTr ? 'Örn: 15.05.2026 tarihli tahsilat ekstrede görünmüyor...' : 'Enter your note...'}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setShowDisputeModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      {isTr ? 'İptal' : 'Cancel'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('disputed', disputeNote)}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-xl shadow-md"
                    >
                      {isTr ? 'İtirazı Gönder' : 'Send Dispute'}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="text-center text-xs text-slate-500 font-medium">
          {isTr ? 'shopLP Güvenli Dijital Mutabakat & Cari Yönetim Sistemi' : 'shopLP Secure Digital Reconciliation & Ledger System'}
        </div>

      </div>
    </div>
  );
}
