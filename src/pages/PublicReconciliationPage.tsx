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
        setReconData(found);
        setActionStatus(found.status || 'pending');
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
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Main Official Document Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-700 to-slate-900 p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full">
                  {isTr ? 'Resmi Dijital Mutabakat Portalı' : 'Official Digital Reconciliation Portal'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black">{reconData.storeName || 'Seçkin İşletme'}</h1>
              <p className="text-sm text-indigo-100 font-medium">{isTr ? 'Cari Hesap Bakiye & Ekstre Mutabakat Formu' : 'Current Account Balance & Statement Reconciliation'}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all backdrop-blur-xs cursor-pointer print:hidden"
            >
              <Printer className="w-4 h-4" />
              {isTr ? 'Yazdır / PDF İndir' : 'Print / Download PDF'}
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Official Company & Store Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{isTr ? 'İşletme Bilgileri (Gönderen)' : 'Store Info (Sender)'}</span>
                <h3 className="font-black text-slate-900 text-base">{reconData.storeName || 'Seçkin Mağaza'}</h3>
                <p className="text-xs text-slate-600">{reconData.storeAddress || ''}</p>
                <p className="text-xs text-slate-500 font-medium">{reconData.storeTaxOffice ? `${reconData.storeTaxOffice} V.D. - ${reconData.storeTaxNumber || ''}` : ''}</p>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{isTr ? 'Cari / Firma Bilgileri (Muhatap)' : 'Company Info (Recipient)'}</span>
                <h3 className="font-black text-slate-900 text-base">{reconData.companyTitle}</h3>
                <p className="text-xs text-slate-600">{reconData.companyAddress || ''}</p>
                <p className="text-xs text-slate-500 font-medium">{reconData.taxOffice ? `${reconData.taxOffice} V.D. - ${reconData.taxNumber || ''}` : ''}</p>
                <p className="text-xs text-indigo-600 font-bold mt-1">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  {isTr ? 'Mutabakat Dönemi:' : 'Period:'} {periodMonthName}
                </p>
              </div>
            </div>

            {/* Formal Statement Notice */}
            <div className="p-6 bg-indigo-50/80 border-2 border-indigo-200 rounded-2xl text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">{isTr ? 'Resmi Mutabakat Beyanı' : 'Formal Reconciliation Statement'}</span>
                <p className="text-sm font-bold text-indigo-950">
                  {isTr 
                    ? `Sayın ${reconData.companyTitle}, ${periodMonthName} sonu itibari ile ${reconData.storeName || 'firmamız'} nezdindeki cari hesabınızda ${absBalance} ${currency} ${isDebt ? 'BORÇ (B)' : 'ALACAK (A)'} bakiyeniz bulunmaktadır.`
                    : `Dear ${reconData.companyTitle}, as of the end of ${periodMonthName}, your current account balance is ${absBalance} ${currency} ${isDebt ? 'DEBIT' : 'CREDIT'}.`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className="text-2xl font-black font-mono text-slate-900 block">{absBalance} {currency}</span>
                <span className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold uppercase mt-1 ${isDebt ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {isDebt ? (isTr ? 'BORÇ (B)' : 'DEBT') : (isTr ? 'ALACAK (A)' : 'CREDIT')}
                </span>
              </div>
            </div>

            {/* Carry-over & Transaction Movements Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  {isTr ? 'Dönem İçi Cari Hesap Ekstresi & Önceki Ay Devri' : 'Period Statement & Carry-Over Balance'}
                </h4>
                <span className="text-xs text-slate-400 font-medium">{isTr ? 'Tüm hareketler resmi kayıtlardandır' : 'Official ledger records'}</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-4">{isTr ? 'Tarih' : 'Date'}</th>
                      <th className="py-3 px-4">{isTr ? 'İşlem Açıklaması' : 'Description'}</th>
                      <th className="py-3 px-4 text-right">{isTr ? 'Borç' : 'Debit'}</th>
                      <th className="py-3 px-4 text-right">{isTr ? 'Alacak' : 'Credit'}</th>
                      <th className="py-3 px-4 text-right">{isTr ? 'Kalan Bakiye' : 'Balance'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {/* Carry Over Row */}
                    <tr className="bg-slate-50/80 font-bold">
                      <td className="py-3 px-4">{reconData.startDate || '01.01.2026'}</td>
                      <td className="py-3 px-4 text-indigo-900">
                        {isTr ? '📌 Önceki Dönemden Devreden Bakiye (Devir)' : 'Carry-Over Balance from Previous Month'}
                      </td>
                      <td className="py-3 px-4 text-right">-</td>
                      <td className="py-3 px-4 text-right">-</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {Number(reconData.carryOverBalance || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {currency}
                      </td>
                    </tr>

                    {reconData.transactions && reconData.transactions.length > 0 ? (
                      reconData.transactions.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">{tx.date || '-'}</td>
                          <td className="py-3 px-4">{tx.description || tx.source}</td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600">
                            {Number(tx.debt || 0) > 0 ? Number(tx.debt).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-600">
                            {Number(tx.credit || 0) > 0 ? Number(tx.credit).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {Number(tx.balance || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {currency}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 px-4 text-center text-slate-400 italic">
                          {isTr ? 'Bu dönem içerisinde ek yeni hareket bulunmamaktadır.' : 'No additional transactions in this period.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BA/BS Summary Section */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {isTr ? 'BA / BS Mutabakat Özeti (5.000 TL ve Üzeri Faturalar)' : 'BA / BS Summary (Invoices >= 5,000 TL)'}
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isTr 
                  ? `Vergi Usul Kanunu hükümleri gereğince; ilgili ay içinde KDV hariç 5.000 TL ve üzerinde olan faturaların toplamı ve adet bildirimi aşağıdadır:`
                  : `In accordance with tax regulations, invoices equal to or exceeding 5,000 TL excluding VAT for the month:`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{isTr ? '5.000 TL Üzeri Fatura Adedi' : 'Invoice Count'}</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{reconData.babsInvoiceCount || 0} {isTr ? 'Adet Fatura' : 'Invoices'}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{isTr ? 'Faturalar Toplamı (KDV Hariç)' : 'Total Amount (Excl. VAT)'}</span>
                  <span className="text-lg font-black text-indigo-700 font-mono">{Number(reconData.babsTotalSum || 0).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} {currency}</span>
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
