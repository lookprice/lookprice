import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { numberToTurkishWords } from "./formatUtils";

export const handleDownloadQuotationPDF = async (quotation: any, branding: any, lang: string) => {
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
  if (branding.logo_url) {
    try {
      logoBase64 = await getBase64Image(branding.logo_url);
    } catch (e) {
      console.error("Logo loading error for PDF:", e);
    }
  }

  const addHeader = (doc: jsPDF) => {
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 14, 5, 12, 12);
      } catch (e) {
        console.error("Logo addImage error:", e);
      }
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(fixTr(isTr ? "TEKLİF FORMU" : "QUOTATION FORM"), 105, 10, { align: 'center' });
    
    doc.setFontSize(8);
    const storeName = fixTr(branding.store_name || branding.name || "LookPrice");
    const splitStoreName = doc.splitTextToSize(storeName, 100);
    doc.text(splitStoreName, 105, 15, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(fixTr(`${isTr ? "Teklif" : "Quote"} No: #${quotation.id}`), 196, 10, { align: 'right' });
    doc.text(fixTr(`${isTr ? "Tarih" : "Date"}: ${new Date(quotation.created_at).toLocaleDateString('tr-TR')}`), 196, 14, { align: 'right' });

    doc.setFontSize(6);
    const contactInfo = [
      branding.address,
      branding.phone,
      branding.email
    ].filter(Boolean).map(fixTr).join(" | ");
    if (contactInfo) {
      doc.text(contactInfo, 105, 20, { align: 'center' });
    }
    
    doc.setDrawColor(230);
    doc.line(14, 23, 196, 23);
  };

  const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
    doc.setFontSize(6);
    doc.setTextColor(150);
    doc.text(fixTr(`${branding.store_name || branding.name || "LookPrice"} - ${isTr ? "Teklif Formu" : "Quotation Form"}`), 14, 292);
    doc.text(`${pageNumber} / ${totalPages}`, 196, 292, { align: 'right' });
  };

  addHeader(doc);
  let yPos = 28;

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
  const subtotal = (quotation.items || []).reduce((s: number, i: any) => s + Number(i.total_price), 0);
  let grandTotal = subtotal;

  if (quotation.is_tax_inclusive) {
    doc.setDrawColor(230);
    doc.line(130, finalY, 196, finalY);
    finalY += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(fixTr(isTr ? "GENEL TOPLAM" : "GRAND TOTAL"), 130, finalY);
    doc.text(`${subtotal.toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`, 196, finalY, { align: 'right' });
    finalY += 3;
    doc.setFontSize(5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text(fixTr(isTr ? "* Fiyatlara KDV dahildir." : "* Prices include VAT."), 196, finalY, { align: 'right' });
    grandTotal = subtotal;
  } else {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text(`${isTr ? 'TOPLAM (Vergi Haric):' : 'TOTAL (Excl. Tax):'} ${subtotal.toLocaleString('tr-TR')} ${quotation.currency?.slice(0, 3)}`, 196, finalY, { align: 'right' });
    grandTotal = subtotal;
  }

  if (quotation.exchange_rate && Number(quotation.exchange_rate) !== 1) {
    finalY += 4;
    doc.setFontSize(5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text(fixTr(`${isTr ? 'Kur' : 'Rate'}: 1 ${quotation.currency?.slice(0, 3)} = ${Number(quotation.exchange_rate).toLocaleString('tr-TR')} TRY`), 196, finalY, { align: 'right' });
  }

  finalY += 5;
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100);
  const words = numberToTurkishWords(grandTotal, quotation.currency || 'TRY');
  doc.text(fixTr(`${isTr ? 'Yazıyla' : 'In Words'}: ${words}`), 196, finalY, { align: 'right' });

  if (quotation.notes) {
    finalY += 10;
    if (finalY > 270) {
      doc.addPage();
      addHeader(doc);
      finalY = 35;
    }
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    doc.text(fixTr(isTr ? "Notlar / Açıklamalar:" : "Notes / Descriptions:"), 14, finalY);
    finalY += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100);
    const splitNotes = doc.splitTextToSize(fixTr(quotation.notes), 182);
    doc.text(splitNotes, 14, finalY);
  }

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i, totalPages);
  }

  doc.save(`Quotation_${quotation.id}.pdf`);
};
