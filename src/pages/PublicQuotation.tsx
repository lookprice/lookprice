import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "motion/react";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  Download,
  AlertCircle,
  Printer
} from "lucide-react";
import { api } from "../services/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PublicQuotation = () => {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'term'>('cash');
  const [dueDate, setDueDate] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [lang, setLang] = useState<'tr' | 'en'>('tr');

  useEffect(() => {
    if (id) {
      fetchQuotation();
    }
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const data = await api.getPublicQuotation(id!);
      setQuotation(data);
      if (data.payment_method) setPaymentMethod(data.payment_method);
      if (data.due_date) setDueDate(new Date(data.due_date).toISOString().split('T')[0]);
      // Simple heuristic for language
      if (data.store_name?.toLowerCase().includes('market') || data.store_name?.toLowerCase().includes('ticaret')) {
        setLang('tr');
      } else {
        setLang('en');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Quotation not found");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!id) return;
    setActionLoading(true);
    try {
      await api.publicQuotationAction(id, action, notes, paymentMethod, dueDate);
      setSuccess(action === 'approve' 
        ? (lang === 'tr' ? "Teklif başarıyla onaylandı!" : "Quotation approved successfully!") 
        : (lang === 'tr' ? "Teklif reddedildi." : "Quotation rejected."));
      fetchQuotation();
    } catch (err: any) {
      alert(err.response?.data?.error || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!quotation) return;
    const doc = new jsPDF();
    const isTr = lang === 'tr';
    
    const fixTr = (text: string) => {
      if (!text) return "";
      return text
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    // Helper to convert image URL to base64 for jsPDF
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

    let logoBase64 = "";
    if (quotation.logo_url) {
      try {
        logoBase64 = await getBase64Image(quotation.logo_url);
      } catch (e) {
        console.error("Logo loading error for PDF:", e);
      }
    }

    const addHeader = (doc: jsPDF) => {
      // Logo (if exists) - Top Left
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 14, 8, 15, 15);
        } catch (e) {
          console.error("Logo addImage error:", e);
        }
      }
      
      doc.setTextColor(0, 0, 0);
      
      // Title - Top Center
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(fixTr(isTr ? "TEKLİF FORMU" : "QUOTATION FORM"), 105, 12, { align: 'center' });
      
      // Store Name - Below Title
      doc.setFontSize(10);
      const storeName = fixTr(quotation.store_name || "LookPrice");
      const splitStoreName = doc.splitTextToSize(storeName, 100);
      doc.text(splitStoreName, 105, 18, { align: 'center' });
      
      // Quotation Info - Top Right
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(fixTr(`${isTr ? "Teklif No" : "Quotation No"}: #${quotation.id}`), 196, 12, { align: 'right' });
      doc.text(fixTr(`${isTr ? "Tarih" : "Date"}: ${new Date(quotation.created_at).toLocaleDateString('tr-TR')}`), 196, 17, { align: 'right' });

      // Contact Info - Small below store name
      doc.setFontSize(7);
      const contactInfo = [
        quotation.store_address,
        quotation.store_phone,
        quotation.store_email
      ].filter(Boolean).map(fixTr).join(" | ");
      if (contactInfo) {
        doc.text(contactInfo, 105, 25, { align: 'center' });
      }
      
      // Separator Line
      doc.setDrawColor(230);
      doc.line(14, 28, 196, 28);
    };

    const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(fixTr(`${quotation.store_name || "LookPrice"} - ${isTr ? "Teklif Formu" : "Quotation Form"}`), 14, 290);
      doc.text(`${pageNumber} / ${totalPages}`, 196, 290, { align: 'right' });
    };

    addHeader(doc);
    let yPos = 35;

    // Customer Info Box - More compact
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, yPos, 182, 18, 1, 1, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "Müşteri Bilgileri" : "Customer Information"), 18, yPos + 6);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const customerInfo = [quotation.customer_name, quotation.customer_title].filter(Boolean).join(" - ");
    doc.text(fixTr(customerInfo), 18, yPos + 12);
    yPos += 25;

    const tableData = quotation.items.map((item: any) => [
      fixTr(`${item.product_name}\n(${item.barcode || `#${item.product_id}`})`),
      item.quantity,
      `${Number(item.unit_price).toLocaleString('tr-TR')} ${quotation.currency}`,
      `${Number(item.total_price).toLocaleString('tr-TR')} ${quotation.currency}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [[
        fixTr(isTr ? "Ürün Açıklaması" : "Product Description"), 
        fixTr(isTr ? "Miktar" : "Qty"), 
        fixTr(isTr ? "Birim Fiyat" : "Unit Price"), 
        fixTr(isTr ? "Toplam" : "Total")
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2, font: "helvetica" },
      columnStyles: {
        1: { halign: 'center', cellWidth: 15 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: 14, right: 14, top: 30, bottom: 15 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addHeader(doc);
        }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 5;
    
    // Check if summary fits on page
    if (finalY > 270) {
      doc.addPage();
      addHeader(doc);
      finalY = 35;
    }

    // Summary Section
    doc.setDrawColor(230);
    doc.line(130, finalY, 196, finalY);
    finalY += 6;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(fixTr(isTr ? "Ara Toplam" : "Subtotal"), 130, finalY);
    doc.text(`${Number(quotation.total_amount).toLocaleString('tr-TR')} ${quotation.currency}`, 196, finalY, { align: 'right' });
    
    finalY += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "GENEL TOPLAM" : "GRAND TOTAL"), 130, finalY);
    doc.text(`${Number(quotation.total_amount).toLocaleString('tr-TR')} ${quotation.currency}`, 196, finalY, { align: 'right' });

    // Add page numbers to all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(doc, i, totalPages);
    }

    doc.save(`Quotation_${quotation.id}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{lang === 'tr' ? 'Hata' : 'Error'}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            {lang === 'tr' ? 'Ana Sayfaya Dön' : 'Go to Homepage'}
          </a>
        </div>
      </div>
    );
  }

  const isExpired = quotation.expiry_date && new Date(quotation.expiry_date) < new Date() && quotation.status === 'pending';

  const t = {
    from: lang === 'tr' ? 'Gönderen' : 'From',
    to: lang === 'tr' ? 'Alıcı' : 'To',
    items: lang === 'tr' ? 'Ürünler' : 'Items',
    product: lang === 'tr' ? 'Ürün' : 'Product',
    qty: lang === 'tr' ? 'Miktar' : 'Qty',
    price: lang === 'tr' ? 'Fiyat' : 'Price',
    total: lang === 'tr' ? 'Toplam' : 'Total',
    totalAmount: lang === 'tr' ? 'Toplam Tutar' : 'Total Amount',
    notes: lang === 'tr' ? 'Notlar' : 'Notes',
    messageLabel: lang === 'tr' ? 'Mesajınız (Opsiyonel)' : 'Your Message (Optional)',
    messagePlaceholder: lang === 'tr' ? 'Bir not veya özel istek ekleyin...' : 'Add a note or special request...',
    reject: lang === 'tr' ? 'Teklifi Reddet' : 'Reject Quotation',
    approve: lang === 'tr' ? 'Teklifi Onayla' : 'Approve Quotation',
    validUntil: lang === 'tr' ? 'Geçerlilik Tarihi' : 'Valid until',
    officialMsg: lang === 'tr' ? `Bu, ${quotation.store_name} tarafından gönderilen resmi bir tekliftir.` : `This is an official quotation from ${quotation.store_name}.`,
    download: lang === 'tr' ? 'PDF İndir' : 'Download PDF',
    print: lang === 'tr' ? 'Yazdır' : 'Print',
    status: {
      approved: lang === 'tr' ? 'Onaylandı' : 'Approved',
      rejected: lang === 'tr' ? 'Reddedildi' : 'Rejected',
      expired: lang === 'tr' ? 'Süresi Doldu' : 'Expired',
      pending: lang === 'tr' ? 'Beklemede' : 'Pending'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-indigo-600 p-8 text-white relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                {quotation.logo_url ? (
                  <img src={quotation.logo_url} alt="Logo" className="h-16 w-16 bg-white rounded-2xl p-2 object-contain" />
                ) : (
                  <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <FileText className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{quotation.store_name}</h1>
                  <p className="text-indigo-100 opacity-80">{lang === 'tr' ? 'Teklif' : 'Quotation'} #{quotation.id}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2 mb-1 print:hidden">
                  <button 
                    onClick={() => setLang('tr')}
                    className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'tr' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    TR
                  </button>
                  <button 
                    onClick={() => setLang('en')}
                    className={`px-2 py-1 text-[10px] font-bold rounded ${lang === 'en' ? 'bg-white text-indigo-600' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    EN
                  </button>
                </div>
                <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                  quotation.status === 'approved' ? 'bg-emerald-500 text-white' : 
                  quotation.status === 'cancelled' ? 'bg-red-500 text-white' :
                  isExpired ? 'bg-gray-500 text-white' :
                  'bg-amber-500 text-white'
                }`}>
                  {quotation.status === 'approved' ? t.status.approved : 
                   quotation.status === 'cancelled' ? t.status.rejected :
                   isExpired ? t.status.expired : t.status.pending}
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                  >
                    <Printer className="h-4 w-4" /> {t.print}
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                  >
                    <Download className="h-4 w-4" /> {t.download}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Success Message */}
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold"
              >
                <CheckCircle2 className="h-6 w-6" />
                {success}
              </motion.div>
            )}

            {/* Store & Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.from}</h3>
                <div className="space-y-2">
                  <p className="font-bold text-gray-900">{quotation.store_name}</p>
                  {quotation.store_address && <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin className="h-4 w-4" /> {quotation.store_address}</p>}
                  {quotation.store_phone && <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="h-4 w-4" /> {quotation.store_phone}</p>}
                  {quotation.store_email && <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="h-4 w-4" /> {quotation.store_email}</p>}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.to}</h3>
                <div className="space-y-2">
                  <p className="font-bold text-gray-900">{quotation.customer_name}</p>
                  {quotation.customer_title && <p className="text-sm text-gray-600">{quotation.customer_title}</p>}
                  {quotation.expiry_date && (
                    <p className={`text-sm flex items-center gap-2 font-bold ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                      <Clock className="h-4 w-4" /> {t.validUntil}: {new Date(quotation.expiry_date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.items}</h3>
              <div className="border border-gray-100 rounded-3xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-sm font-bold text-gray-600">{t.product}</th>
                      <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">{t.qty}</th>
                      <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">{t.price}</th>
                      <th className="px-6 py-4 text-sm font-bold text-gray-600 text-right">{t.total}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {quotation.items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{item.product_name}</div>
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">{item.barcode || `#${item.product_id}`}</div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600 font-medium">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-gray-600 font-medium">{Number(item.unit_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {quotation.currency}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{Number(item.total_price).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {quotation.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50/50">
                      <td colSpan={3} className="px-6 py-6 text-right font-black text-gray-500 uppercase tracking-widest text-xs">{t.totalAmount}</td>
                      <td className="px-6 py-6 text-right text-2xl font-black text-indigo-600">
                        {Number(quotation.total_amount).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} {quotation.currency}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes */}
            {quotation.notes && (
              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 break-inside-avoid">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t.notes}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}

            {/* Actions */}
            {quotation.status === 'pending' && !isExpired && !success && (
              <div className="space-y-6 pt-6 border-t border-gray-100 print:hidden">
                {quotation.company_id && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'term')}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                      >
                        <option value="cash">{lang === 'tr' ? 'Nakit / Kredi Kartı' : 'Cash / Credit Card'}</option>
                        <option value="term">{lang === 'tr' ? 'Cari Hesap (Vadeli)' : 'Term (Current Account)'}</option>
                      </select>
                    </div>
                    {paymentMethod === 'term' && (
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          {lang === 'tr' ? 'Vade Tarihi' : 'Due Date'}
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          required
                          className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.messageLabel}</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.messagePlaceholder}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all h-24 resize-none"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('reject')}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" /> {t.reject}
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('approve')}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-5 w-5" /> {t.approve}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-8">
              <p className="text-xs text-gray-400 font-medium">
                {t.officialMsg}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicQuotation;
