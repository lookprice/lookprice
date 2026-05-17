import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Printer,
  User as UserIcon,
  Hash,
  CreditCard,
  Calendar,
  Building2
} from "lucide-react";
import { api } from "../services/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PublicQuotation = () => {
  const { id, slug } = useParams<{ id: string, slug?: string }>();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'term'>('cash');
  const [dueDate, setDueDate] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const isTr = lang === 'tr';

  const numberToTurkishWords = (number: number, currency: string = 'TRY') => {
    const units = ["", "Bir", "İki", "Üç", "Dört", "Beş", "Altı", "Yedi", "Sekiz", "Dokuz"];
    const tens = ["", "On", "Yirmi", "Otuz", "Kırk", "Elli", "Altmış", "Yetmiş", "Seksen", "Doksan"];
    const thousands = ["", "Bin", "Milyon", "Milyar", "Trilyon"];

    const convertThreeDigits = (n: number) => {
      let str = "";
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const u = n % 10;

      if (h > 0) {
        str += (h === 1 ? "" : units[h]) + "Yüz";
      }
      if (t > 0) {
        str += tens[t];
      }
      if (u > 0) {
        str += units[u];
      }
      return str;
    };

    if (number === 0) return "Sıfır";

    const parts = number.toFixed(2).split(".");
    const integerPart = parseInt(parts[0]);
    const decimalPart = parseInt(parts[1]);

    let result = "";
    let tempInteger = integerPart;
    let i = 0;

    if (tempInteger === 0) {
      result = "Sıfır";
    } else {
      while (tempInteger > 0) {
        const threeDigits = tempInteger % 1000;
        if (threeDigits > 0) {
          let partStr = convertThreeDigits(threeDigits);
          if (i === 1 && threeDigits === 1) partStr = ""; 
          result = partStr + thousands[i] + result;
        }
        tempInteger = Math.floor(tempInteger / 1000);
        i++;
      }
    }

    const currencyMap: { [key: string]: { main: string, sub: string } } = {
      'TRY': { main: 'TL', sub: 'Kr' },
      'USD': { main: 'USD', sub: 'Cent' },
      'EUR': { main: 'EUR', sub: 'Cent' }
    };

    const cur = currencyMap[currency] || { main: currency, sub: '' };
    result += cur.main;

    if (decimalPart > 0) {
      result += " " + convertThreeDigits(decimalPart) + " " + cur.sub;
    }

    return result;
  };

  useEffect(() => {
    if (id) {
      fetchQuotation();
    }
  }, [id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPublicQuotation(id!);
      if (!data || data.error) {
        throw new Error(data?.error || "Quotation not found");
      }
      setQuotation(data);
      if (data.payment_method) setPaymentMethod(data.payment_method);
      if (data.due_date) setDueDate(new Date(data.due_date).toISOString().split('T')[0]);
      
      if (!slug && data.store_slug) {
        navigate(`/s/${data.store_slug}/quotation/${id}`, { replace: true });
      }

      // Default to TR if store name suggests it, or if no clear indicator
      if (data.store_name?.toLowerCase().includes('market') || 
          data.store_name?.toLowerCase().includes('ticaret') ||
          data.currency === 'TRY') {
        setLang('tr');
      }
    } catch (err: any) {
      console.error("Fetch Quotation Error:", err);
      setError(err.message || "Quotation not found or link is invalid");
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
          doc.addImage(logoBase64, 'PNG', 14, 5, 12, 12);
        } catch (e) {
          console.error("Logo addImage error:", e);
        }
      }
      
      doc.setTextColor(0, 0, 0);
      
      // Title - Top Center
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(fixTr(isTr ? "TEKLİF FORMU" : "QUOTATION FORM"), 105, 10, { align: 'center' });
      
      // Store Name - Below Title
      doc.setFontSize(8);
      const storeName = fixTr(quotation.store_name || "LookPrice");
      const splitStoreName = doc.splitTextToSize(storeName, 100);
      doc.text(splitStoreName, 105, 15, { align: 'center' });
      
      // Quotation Info - Top Right
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(fixTr(`${isTr ? "Teklif" : "Quote"} No: #${quotation.id}`), 196, 10, { align: 'right' });
      doc.text(fixTr(`${isTr ? "Tarih" : "Date"}: ${new Date(quotation.created_at).toLocaleDateString('tr-TR')}`), 196, 14, { align: 'right' });

      // Contact Info - Small below store name
      doc.setFontSize(6);
      const contactInfo = [
        quotation.store_address,
        quotation.store_phone,
        quotation.store_email
      ].filter(Boolean).map(fixTr).join(" | ");
      if (contactInfo) {
        doc.text(contactInfo, 105, 20, { align: 'center' });
      }
      
      // Separator Line
      doc.setDrawColor(230);
      doc.line(14, 23, 196, 23);
    };

    const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
      doc.setFontSize(6);
      doc.setTextColor(150);
      doc.text(fixTr(`${quotation.store_name || "LookPrice"} - ${isTr ? "Teklif Formu" : "Quotation Form"}`), 14, 292);
      doc.text(`${pageNumber} / ${totalPages}`, 196, 292, { align: 'right' });
    };

    addHeader(doc);
    let yPos = 28;

    // Customer Info Box - Very compact
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, yPos, 182, 14, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "Müşteri Bilgileri" : "Customer Information"), 18, yPos + 5);
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50);
    const customerInfo = [quotation.customer_name, quotation.customer_title].filter(Boolean).join(" - ");
    doc.text(fixTr(customerInfo), 18, yPos + 10);
    yPos += 18;

    const subtotal = (quotation.items || []).reduce((sum: number, item: any) => sum + Number(item.total_price), 0);
    const grandTotal = subtotal;

    const tableData = (quotation.items || []).map((item: any) => [
      fixTr(`${item.product_name}\n(${item.barcode || `#${item.product_id}`})`),
      item.quantity,
      `${item.tax_rate || 20}%`,
      `${Number(item.unit_price).toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`,
      `${Number(item.total_price).toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [[
        fixTr(isTr ? "Ürün Açıklaması" : "Product Description"), 
        fixTr(isTr ? "Adet" : "Qty"), 
        fixTr(isTr ? "KDV" : "Tax"),
        fixTr(isTr ? "Birim Fiyat" : "Unit Price"), 
        fixTr(isTr ? "Toplam" : "Total")
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      styles: { fontSize: 6, cellPadding: 1, font: "helvetica" },
      columnStyles: {
        1: { halign: 'center', cellWidth: 10 },
        2: { halign: 'center', cellWidth: 12 },
        3: { halign: 'right', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 22 }
      },
      margin: { left: 14, right: 14, top: 25, bottom: 10 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          addHeader(doc);
        }
      }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 3;
    
    // Summary Section
    if (quotation.is_tax_inclusive) {
      doc.setDrawColor(230);
      doc.line(130, finalY, 196, finalY);
      finalY += 4;
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(fixTr(isTr ? "GENEL TOPLAM" : "GRAND TOTAL"), 130, finalY);
      doc.text(`${Number(subtotal).toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`, 196, finalY, { align: 'right' });
      finalY += 3;
      doc.setFontSize(5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100);
      doc.text(fixTr(isTr ? "* Fiyatlara KDV dahildir." : "* Prices include VAT."), 196, finalY, { align: 'right' });
    } else {
      // For Tax Excluded, just show total
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(`${isTr ? 'TOPLAM (Vergi Haric):' : 'TOTAL (Excl. Tax):'} ${Number(subtotal).toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`, 196, finalY, { align: 'right' });
    }

    if (quotation.exchange_rate && Number(quotation.exchange_rate) !== 1) {
      finalY += 4;
      doc.setFontSize(5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150);
      doc.text(fixTr(`${isTr ? 'Kur' : 'Rate'}: 1 ${quotation.currency?.slice(0, 3)} = ${Number(quotation.exchange_rate).toLocaleString('tr-TR')} TRY`), 196, finalY, { align: 'right' });
    }

    // Total in Words
    finalY += 5;
    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    const words = numberToTurkishWords(grandTotal, quotation.currency || 'TRY');
    doc.text(fixTr(`${isTr ? 'Yazıyla' : 'In Words'}: ${words}`), 196, finalY, { align: 'right' });

    // Notes Section
    if (quotation.notes) {
      finalY += 6;
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50);
      doc.text(fixTr(isTr ? "Notlar:" : "Notes:"), 14, finalY);
      finalY += 3;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(100);
      const splitNotes = doc.splitTextToSize(fixTr(quotation.notes), 182);
      doc.text(splitNotes, 14, finalY);
    }

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto shadow-lg shadow-red-100">
            <AlertCircle className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{lang === 'tr' ? "Teklif Bulunamadı" : "Quotation Not Found"}</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              {error || (lang === 'tr' ? "Üzgünüz, aradığınız teklif bulunamadı veya link artık geçerli değil." : "Sorry, the quotation you are looking for was not found or the link is no longer valid.")}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            {lang === 'tr' ? "Tekrar Dene" : "Try Again"}
          </button>
        </motion.div>
      </div>
    );
  }

  const isExpired = quotation.expiry_date && new Date(quotation.expiry_date) < new Date() && quotation.status === 'pending';
  const subtotal = (quotation.items || []).reduce((sum: number, item: any) => sum + Number(item.total_price), 0);
  // Do NOT add tax to grand total if it's not tax inclusive (per user request to match PDF style)
  const grandTotal = subtotal;

  const t = {
    from: lang === 'tr' ? 'Gönderen' : 'From',
    to: lang === 'tr' ? 'Alıcı' : 'To',
    items: lang === 'tr' ? 'Ürünler' : 'Items',
    product: lang === 'tr' ? 'Ürün' : 'Product',
    qty: lang === 'tr' ? 'Miktar' : 'Qty',
    price: lang === 'tr' ? 'Fiyat' : 'Price',
    total: lang === 'tr' ? 'Toplam' : 'Total',
    totalAmount: quotation.is_tax_inclusive 
      ? (lang === 'tr' ? 'Genel Toplam' : 'Grand Total')
      : (lang === 'tr' ? 'Toplam (Vergi Hariç)' : 'Total (Excl. Tax)'),
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 grid-pattern print:bg-white print:py-0 print:px-0">
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              background: white !important;
            }
            .grid-pattern {
              background-image: none !important;
            }
            .print\\:max-w-none {
              max-width: 100% !important;
              width: 100% !important;
            }
            .print\\:shadow-none {
              box-shadow: none !important;
            }
            .print\\:border-none {
              border: none !important;
            }
            .print\\:rounded-none {
              border-radius: 0 !important;
            }
      /* Force content scaling to fit on one page */
      main, .max-w-4xl {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
      .grid-pattern {
        display: none !important;
      }
      * {
        overflow: visible !important;
      }
      h1, h2, h3, p, span, div, table {
        page-break-inside: avoid;
      }
      .min-h-screen {
        min-height: auto !important;
        height: auto !important;
      }
      /* Scale everything down slightly if needed */
      body {
        zoom: 0.95;
      }
    }
        `}
      </style>
      <div className="max-w-4xl mx-auto print:max-w-none">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Accent Bar */}
          <div className="h-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 print:hidden" />

          {/* Header Section */}
          <div className="p-8 sm:p-12 border-b border-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl print:hidden" />
            
            <div className="relative flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="flex items-center gap-6">
                {quotation.logo_url ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 print:hidden"></div>
                    <img src={quotation.logo_url} alt="Logo" className="relative h-20 w-20 bg-white rounded-2xl p-2 shadow-sm object-contain border border-slate-100" />
                  </div>
                ) : (
                  <div className="h-20 w-20 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 text-indigo-600">
                    <FileText className="h-10 w-10" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{quotation.store_name}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold tracking-wider uppercase">
                      {lang === 'tr' ? 'Teklif' : 'Quotation'} #{quotation.id}
                    </span>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      quotation.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                      quotation.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      isExpired ? 'bg-slate-100 text-slate-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {quotation.status === 'approved' ? t.status.approved : 
                       quotation.status === 'cancelled' ? t.status.rejected :
                       isExpired ? t.status.expired : t.status.pending}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4 print:items-start print:mt-4">
                <div className="flex items-center gap-2 print:hidden">
                  <button 
                    onClick={() => setLang('tr')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${lang === 'tr' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    TR
                  </button>
                  <button 
                    onClick={() => setLang('en')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    EN
                  </button>
                </div>
                
                <div className="flex items-center gap-2 print:hidden">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm"
                  >
                    <Printer className="h-4 w-4" /> {t.print}
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all duration-200 shadow-lg shadow-slate-200"
                  >
                    <Download className="h-4 w-4" /> {t.download}
                  </button>
                </div>

                <div className="hidden print:block text-right text-slate-500 text-xs space-y-1">
                  <p className="font-bold text-slate-900">{isTr ? 'Tarih' : 'Date'}: {new Date(quotation.created_at).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}</p>
                  {quotation.expiry_date && <p>{t.validUntil}: {new Date(quotation.expiry_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12 space-y-12">
            {/* Success Message */}
            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 text-emerald-800"
              >
                <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-black text-lg leading-tight">{lang === 'tr' ? 'Harika!' : 'Great!'}</p>
                  <p className="text-emerald-600 font-medium">{success}</p>
                </div>
              </motion.div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-indigo-600 rounded-full" />
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.from}</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-xl font-black text-slate-900">{quotation.store_name}</p>
                  <div className="space-y-3">
                    {quotation.store_address && (
                      <div className="flex items-start gap-3 text-slate-600">
                        <div className="mt-1 p-1.5 bg-slate-100 rounded-lg text-slate-400"><MapPin className="h-3.5 w-3.5" /></div>
                        <p className="text-sm font-medium leading-relaxed">{quotation.store_address}</p>
                      </div>
                    )}
                    {quotation.store_phone && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400"><Phone className="h-3.5 w-3.5" /></div>
                        <p className="text-sm font-medium">{quotation.store_phone}</p>
                      </div>
                    )}
                    {quotation.store_email && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400"><Mail className="h-3.5 w-3.5" /></div>
                        <p className="text-sm font-medium">{quotation.store_email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-violet-600 rounded-full" />
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.to}</h3>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><UserIcon className="h-12 w-12" /></div>
                  <div className="relative">
                    <p className="text-xl font-black text-slate-900">{quotation.customer_name}</p>
                    {quotation.customer_title && <p className="text-sm font-bold text-indigo-600 mt-1">{quotation.customer_title}</p>}
                    
                    <div className="mt-6 pt-6 border-t border-slate-200/60 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-wider">{isTr ? 'Teklif Tarihi' : 'Quotation Date'}</span>
                        <span className="text-slate-900 font-black">{new Date(quotation.created_at).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}</span>
                      </div>
                      {quotation.expiry_date && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase tracking-wider">{t.validUntil}</span>
                          <span className={`font-black ${isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                            {new Date(quotation.expiry_date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-slate-900 rounded-full" />
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.items}</h3>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{quotation.items.length} {isTr ? 'KALEM' : 'ITEMS'}</span>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.product}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.qty}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.price}</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">KDV</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.total}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {quotation.items.map((item: any) => (
                        <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[150px] md:max-w-[300px]" title={item.product_name}>{item.product_name}</div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Hash className="h-3 w-3 text-slate-300" />
                              <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{item.barcode || `#${item.product_id}`}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right text-slate-600 font-bold text-sm">
                            {Number(item.unit_price).toLocaleString(isTr ? 'tr-TR' : 'en-US')} <span className="text-[10px] text-slate-400 ml-0.5">{quotation.currency?.slice(0, 3)}</span>
                          </td>
                          <td className="px-8 py-6 text-center text-slate-500 font-bold text-xs">
                            {item.tax_rate || 20}%
                          </td>
                          <td className="px-8 py-6 text-right font-black text-slate-900">
                            {Number(item.total_price).toLocaleString(isTr ? 'tr-TR' : 'en-US')} <span className="text-[10px] text-slate-400 ml-0.5">{quotation.currency?.slice(0, 3)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-slate-900 p-8 sm:p-12 text-white flex flex-col sm:flex-row justify-between items-center gap-8">
                  <div className="space-y-3 text-center sm:text-left flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t.totalAmount}</p>
                    {quotation.is_tax_inclusive ? (
                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest pt-2">
                        {isTr ? '* Tüm fiyatlara KDV dahildir.' : '* All prices include VAT.'}
                      </p>
                    ) : (
                      <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest pt-2">
                        {isTr ? '* Fiyatlara KDV dahil değildir.' : '* Prices exclude VAT.'}
                      </p>
                    )}
                    <p className="text-indigo-300 text-[9px] font-bold italic pt-1">
                      {isTr ? 'Yalnızca:' : 'Only:'} {numberToTurkishWords(Number(grandTotal), quotation.currency)}
                    </p>
                    {quotation.exchange_rate && Number(quotation.exchange_rate) !== 1 && (
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                        {isTr ? 'Uygulanan Kur' : 'Exchange Rate'}: 1 {quotation.currency?.slice(0, 3)} = {Number(quotation.exchange_rate).toLocaleString(isTr ? 'tr-TR' : 'en-US')} TRY
                      </p>
                    )}
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-4xl sm:text-5xl font-black tracking-tighter flex items-baseline gap-2">
                      {Number(grandTotal).toLocaleString(isTr ? 'tr-TR' : 'en-US')}
                      <span className="text-lg text-indigo-400 uppercase tracking-widest">{quotation.currency?.slice(0, 3)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {quotation.notes && (
              <div className="space-y-4 break-inside-avoid">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-slate-300 rounded-full" />
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.notes}</h3>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200" />
                  <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap italic">"{quotation.notes}"</p>
                </div>
              </div>
            )}

            {/* Actions Section */}
            {quotation.status === 'pending' && !isExpired && !success && (
              <div className="space-y-8 pt-12 border-t border-slate-100 print:hidden">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-indigo-600 rounded-full" />
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{lang === 'tr' ? 'KARARINIZ' : 'YOUR DECISION'}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {quotation.company_id && (
                    <div className="space-y-6 md:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            {lang === 'tr' ? 'Ödeme Yöntemi' : 'Payment Method'}
                          </label>
                          <div className="relative group">
                            <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'term')}
                              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all font-bold text-slate-900 appearance-none outline-none"
                            >
                              <option value="cash">{lang === 'tr' ? 'Nakit / Kredi Kartı' : 'Cash / Credit Card'}</option>
                              <option value="term">{lang === 'tr' ? 'Cari Hesap (Vadeli)' : 'Term (Current Account)'}</option>
                            </select>
                          </div>
                        </div>
                        {paymentMethod === 'term' && (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              {lang === 'tr' ? 'Vade Tarihi' : 'Due Date'}
                            </label>
                            <div className="relative group">
                              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                              <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all font-bold text-slate-900 outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.messageLabel}</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.messagePlaceholder}
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all h-32 resize-none font-medium text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('reject')}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-sm hover:border-red-100 hover:text-red-600 hover:bg-red-50 transition-all duration-300 disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5" /> {t.reject}
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('approve')}
                    className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all duration-300 shadow-2xl shadow-indigo-200 disabled:opacity-50 group"
                  >
                    <CheckCircle2 className="h-5 w-5 group-hover:scale-110 transition-transform" /> {t.approve}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-12 border-t border-slate-50">
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
                {t.officialMsg}
              </p>
              <div className="mt-4 flex justify-center gap-4 opacity-20 grayscale">
                <div className="h-6 w-6 bg-slate-400 rounded-full" />
                <div className="h-6 w-24 bg-slate-400 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Powered By */}
        <div className="mt-8 text-center print:hidden">
          <p className="text-xs text-slate-400 font-bold">
            Powered by <span className="text-indigo-600">LookPrice GAP OS</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicQuotation;
