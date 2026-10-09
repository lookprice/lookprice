import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { translations } from "../translations";
import { formatDateTR, formatFileDateTR } from "../utils/formatUtils";

export const useCompanyExport = (
  lang: string, 
  companies: any[], 
  branding: any, 
  selectedCompany: any, 
  transactionStartDate: string, 
  transactionEndDate: string, 
  companyTransactions: any[], 
  openingBalances: Record<string, number>, 
  selectedCurrency: string
) => {

  const handleExportCompanies = () => {
    const isTr = lang === 'tr';
    const t = translations[lang].dashboard;
    const data = companies.map(c => {
      const balancesStr = Object.entries(c.balances || {})
        .filter(([_, bal]) => Number(bal) !== 0)
        .map(([curr, bal]) => `${Number(bal).toLocaleString(isTr ? 'tr-TR' : 'en-US')} ${curr}`)
        .join(', ') || '0 TRY';

      return {
        [t.companyName]: c.title,
        [t.contactPerson]: c.contact_person || c.representative || '-',
        [t.taxOffice || 'Tax Office']: c.tax_office || '-',
        [t.taxNumber || 'Tax Number']: c.tax_number || '-',
        [t.phone || 'Phone']: c.phone || '-',
        [t.email || 'Email']: c.email || '-',
        [t.statements.balance]: balancesStr,
        [t.address || 'Address']: c.address || '-'
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t.companies);
    XLSX.writeFile(wb, `${t.companies}_${formatFileDateTR()}.xlsx`);
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
    
    doc.text(`${fixTr(t.phone || 'Tel:')} ${branding.phone || ""}`, 14, yPos);
    yPos += 4;
    doc.text(`${fixTr(t.email || 'Email:')} ${branding.email || ""}`, 14, yPos);
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
    doc.text(`${fixTr(t.company || 'Company')}: ${fixTr(selectedCompany.title)}`, 14, yPos);
    yPos += 6;
    doc.text(`${fixTr(t.dateRange || 'Date Range')}: ${formatDateTR(transactionStartDate)} - ${formatDateTR(transactionEndDate)}`, 14, yPos);
    yPos += 10;

    const runningBalancesByCurr: Record<string, number> = { ...openingBalances };
    const filteredTransactions = companyTransactions.filter(tx => selectedCurrency === 'ALL' || (tx.currency || 'TRY') === selectedCurrency);

    const tableData: any[] = [];
    
    if (selectedCurrency !== 'ALL' && openingBalances[selectedCurrency]) {
      const ob = Number(openingBalances[selectedCurrency] || 0);
      tableData.push([
        formatDateTR(transactionStartDate),
        '-',
        fixTr(isTr ? 'Devreden Bakiye' : 'Opening Balance'),
        selectedCurrency,
        ob > 0 ? `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${selectedCurrency}` : "-",
        ob < 0 ? `${Math.abs(ob).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${selectedCurrency}` : "-",
        `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${selectedCurrency}`
      ]);
    }

    filteredTransactions.forEach(t_item => {
      const amount = Number(t_item.amount || 0);
      const curr = (t_item.currency || 'TRY').toUpperCase();
      if (runningBalancesByCurr[curr] === undefined) {
        runningBalancesByCurr[curr] = Number(openingBalances[curr] || 0);
      }
      if (t_item.type === 'debt') runningBalancesByCurr[curr] += amount;
      else runningBalancesByCurr[curr] -= amount;
      const rowBal = runningBalancesByCurr[curr];
      
      const invNo = (t_item.invoice_number && t_item.invoice_number !== '-') ? t_item.invoice_number : (t_item.sales_invoice_number || t_item.purchase_invoice_number || '-');
      const currStr = `${curr}${curr !== 'TRY' && t_item.exchange_rate ? ` (Kur: ${Number(t_item.exchange_rate).toFixed(4)})` : ''}`;

      tableData.push([
        formatDateTR(t_item.transaction_date || t_item.date),
        fixTr(invNo),
        fixTr(t_item.description || ""),
        currStr,
        t_item.type === 'debt' ? `${amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${curr}` : "-",
        t_item.type === 'credit' ? `${amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${curr}` : "-",
        `${rowBal.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${curr}`
      ]);
    });

    autoTable(doc, {
      startY: yPos,
      head: [[
        fixTr(t.statements.date),
        fixTr(isTr ? 'Fatura No' : 'Invoice No'),
        fixTr(t.statements.description),
        fixTr(isTr ? 'Döviz/Kur' : 'Currency/Rate'),
        fixTr(t.statements.debt),
        fixTr(t.statements.credit),
        fixTr(t.statements.balance)
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const summaryText = Object.entries(runningBalancesByCurr)
      .filter(([c]) => selectedCurrency === 'ALL' || c === selectedCurrency)
      .map(([c, b]) => `${Number(b).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2 })} ${c}`)
      .join('  |  ');
    doc.text(`${fixTr(t.statements.balance)}: ${summaryText}`, 196, finalY, { align: 'right' });

    doc.save(`${fixTr(t.statements.customerStatement.toLowerCase().replace(/\s+/g, '_'))}_${fixTr(selectedCompany.title)}_${selectedCurrency}_${transactionStartDate ? formatFileDateTR(transactionStartDate) : 'all'}_${transactionEndDate ? formatFileDateTR(transactionEndDate) : 'all'}.pdf`);
  };

  const handleExportTransactionsExcel = () => {
    if (!selectedCompany) return;
    const isTr = lang === 'tr';
    const filteredTxs = companyTransactions.filter(tx => selectedCurrency === 'ALL' || (tx.currency || 'TRY') === selectedCurrency);
    
    const runningBalancesByCurr: Record<string, number> = { ...openingBalances };
    const data: any[] = [];

    if (selectedCurrency !== 'ALL' && openingBalances[selectedCurrency]) {
      const ob = Number(openingBalances[selectedCurrency] || 0);
      data.push({
        [isTr ? 'Tarih' : 'Date']: formatDateTR(transactionStartDate),
        [isTr ? 'Fatura / Belge No' : 'Invoice No']: '-',
        [isTr ? 'Açıklama' : 'Description']: isTr ? 'Devreden Bakiye' : 'Opening Balance',
        [isTr ? 'Para Birimi' : 'Currency']: selectedCurrency,
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: 1,
        [isTr ? 'Borç' : 'Debit']: ob > 0 ? ob : 0,
        [isTr ? 'Alacak' : 'Credit']: ob < 0 ? Math.abs(ob) : 0,
        [isTr ? 'Bakiye' : 'Balance']: ob,
      });
    }

    filteredTxs.forEach(t_item => {
      const invNo = (t_item.invoice_number && t_item.invoice_number !== '-') ? t_item.invoice_number : (t_item.sales_invoice_number || t_item.purchase_invoice_number || '-');
      const amt = Number(t_item.amount || 0);
      const curr = (t_item.currency || 'TRY').toUpperCase();
      if (runningBalancesByCurr[curr] === undefined) {
        runningBalancesByCurr[curr] = Number(openingBalances[curr] || 0);
      }
      if (t_item.type === 'debt') runningBalancesByCurr[curr] += amt;
      else runningBalancesByCurr[curr] -= amt;

      data.push({
        [isTr ? 'Tarih' : 'Date']: formatDateTR(t_item.transaction_date || t_item.date, false, ''),
        [isTr ? 'Fatura / Belge No' : 'Invoice No']: invNo || '-',
        [isTr ? 'Açıklama' : 'Description']: t_item.description || '',
        [isTr ? 'Para Birimi' : 'Currency']: curr,
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: t_item.exchange_rate ? Number(t_item.exchange_rate) : 1,
        [isTr ? 'Borç' : 'Debit']: t_item.type === 'debt' ? amt : 0,
        [isTr ? 'Alacak' : 'Credit']: t_item.type === 'credit' ? amt : 0,
        [isTr ? 'Bakiye' : 'Balance']: Number(runningBalancesByCurr[curr].toFixed(2)),
      });
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cari Ekstre');
    XLSX.writeFile(wb, `cari_ekstre_${selectedCompany.title || 'firma'}_${selectedCurrency}_${transactionStartDate ? formatFileDateTR(transactionStartDate) : 'all'}.xlsx`);
  };

  return { handleExportCompanies, handleExportTransactionsPDF, handleExportTransactionsExcel };
};
