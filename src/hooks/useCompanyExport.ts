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

    const defaultCurr = (branding?.default_currency || branding?.currency || 'TRY').toUpperCase();
    const storeRates: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20, TRY: 1, [defaultCurr]: 1 };
    const rawRates = branding?.currency_rates || {};
    if (typeof rawRates === 'object' && rawRates !== null) {
      Object.keys(rawRates).forEach(k => {
        const v = parseFloat(rawRates[k]);
        if (!isNaN(v) && v > 0) storeRates[k.toUpperCase()] = v;
      });
    }

    const resolveRate = (curr: string, txRate: any) => {
      const c = (curr || defaultCurr).toUpperCase();
      if (c === defaultCurr) return 1;
      const r = Number(txRate || 0);
      if (!isNaN(r) && r > 0 && r !== 1) return r;
      return storeRates[c] || 1;
    };

    const runningBalancesByCurr: Record<string, number> = { ...openingBalances };
    let runningBaseBalance = 0;
    const filteredTransactions = companyTransactions.filter(tx => selectedCurrency === 'ALL' || (tx.currency || defaultCurr).toUpperCase() === selectedCurrency);

    const tableData: any[] = [];
    
    if (selectedCurrency === 'ALL') {
      Object.entries(openingBalances).forEach(([currKey, obVal]) => {
        const ob = Number(obVal || 0);
        if (Math.abs(ob) < 0.005) return;
        const c = currKey.toUpperCase();
        const rate = resolveRate(c, storeRates[c]);
        const obBase = Number((ob * rate).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance + obBase).toFixed(2));
        tableData.push([
          formatDateTR(transactionStartDate),
          '-',
          fixTr(isTr ? `Devreden Bakiye (${c})` : `Opening Balance (${c})`),
          `${c}${c !== defaultCurr ? ` (Kur: ${rate.toFixed(4)})` : ''}`,
          ob > 0 ? `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : "-",
          ob < 0 ? `${Math.abs(ob).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : "-",
          `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`,
          `${runningBaseBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${defaultCurr}`
        ]);
      });
    } else if (openingBalances[selectedCurrency]) {
      const ob = Number(openingBalances[selectedCurrency] || 0);
      const c = selectedCurrency.toUpperCase();
      const rate = resolveRate(c, storeRates[c]);
      const obBase = Number((ob * rate).toFixed(2));
      runningBaseBalance = Number((runningBaseBalance + obBase).toFixed(2));
      tableData.push([
        formatDateTR(transactionStartDate),
        '-',
        fixTr(isTr ? 'Devreden Bakiye' : 'Opening Balance'),
        `${c}${c !== defaultCurr ? ` (Kur: ${rate.toFixed(4)})` : ''}`,
        ob > 0 ? `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : "-",
        ob < 0 ? `${Math.abs(ob).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : "-",
        `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`,
        `${runningBaseBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${defaultCurr}`
      ]);
    }

    filteredTransactions.forEach(t_item => {
      const amount = Number(t_item.amount || 0);
      const curr = (t_item.currency || defaultCurr).toUpperCase();
      const rate = resolveRate(curr, t_item.exchange_rate);
      const baseAmount = Number((amount * rate).toFixed(2));

      if (runningBalancesByCurr[curr] === undefined) {
        runningBalancesByCurr[curr] = Number(openingBalances[curr] || 0);
      }
      if (t_item.type === 'debt') {
        runningBalancesByCurr[curr] = Number((runningBalancesByCurr[curr] + amount).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance + baseAmount).toFixed(2));
      } else {
        runningBalancesByCurr[curr] = Number((runningBalancesByCurr[curr] - amount).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance - baseAmount).toFixed(2));
      }
      const rowBal = runningBalancesByCurr[curr];
      
      const invNo = (t_item.invoice_number && t_item.invoice_number !== '-') ? t_item.invoice_number : (t_item.sales_invoice_number || t_item.purchase_invoice_number || '-');
      const currStr = `${curr}${curr !== defaultCurr ? ` (Kur: ${rate.toFixed(4)})` : ''}`;

      tableData.push([
        formatDateTR(t_item.transaction_date || t_item.date),
        fixTr(invNo),
        fixTr(t_item.description || ""),
        currStr,
        t_item.type === 'debt' ? `${amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` : "-",
        t_item.type === 'credit' ? `${amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` : "-",
        `${rowBal.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`,
        `${runningBaseBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${defaultCurr}`
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
        fixTr(t.statements.balance),
        fixTr(isTr ? `Bakiye (${defaultCurr})` : `Balance (${defaultCurr})`)
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    const summaryText = Object.entries(runningBalancesByCurr)
      .filter(([c]) => selectedCurrency === 'ALL' || c === selectedCurrency)
      .map(([c, b]) => `${Number(b).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`)
      .join('  |  ');
    const baseSummaryStr = `${isTr ? `Birlesik (${defaultCurr}) Bakiye` : `Combined (${defaultCurr}) Balance`}: ${runningBaseBalance.toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${defaultCurr}`;
    doc.text(`${fixTr(t.statements.balance)}: ${summaryText}   ||   ${baseSummaryStr}`, 196, finalY, { align: 'right' });

    doc.save(`${fixTr(t.statements.customerStatement.toLowerCase().replace(/\s+/g, '_'))}_${fixTr(selectedCompany.title)}_${selectedCurrency}_${transactionStartDate ? formatFileDateTR(transactionStartDate) : 'all'}_${transactionEndDate ? formatFileDateTR(transactionEndDate) : 'all'}.pdf`);
  };

  const handleExportTransactionsExcel = () => {
    if (!selectedCompany) return;
    const isTr = lang === 'tr';
    const defaultCurr = (branding?.default_currency || branding?.currency || 'TRY').toUpperCase();
    const storeRates: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20, TRY: 1, [defaultCurr]: 1 };
    const rawRates = branding?.currency_rates || {};
    if (typeof rawRates === 'object' && rawRates !== null) {
      Object.keys(rawRates).forEach(k => {
        const v = parseFloat(rawRates[k]);
        if (!isNaN(v) && v > 0) storeRates[k.toUpperCase()] = v;
      });
    }

    const resolveRate = (curr: string, txRate: any) => {
      const c = (curr || defaultCurr).toUpperCase();
      if (c === defaultCurr) return 1;
      const r = Number(txRate || 0);
      if (!isNaN(r) && r > 0 && r !== 1) return r;
      return storeRates[c] || 1;
    };

    const resolveTxTypeLabel = (tx: any) => {
      const desc = (tx.description || '').toLowerCase();
      const isDebt = tx.type === 'debt';
      if (desc.includes('iade')) {
        return isTr ? 'İade Faturası' : 'Return Invoice';
      }
      if (desc.includes('kur fark')) {
        return isTr ? 'Kur Farkı Faturası' : 'Exchange Diff Invoice';
      }
      if (tx.sales_invoice_id || tx.sales_invoice_number || desc.includes('satış faturası')) {
        if (desc.includes('tahsilat')) return isTr ? 'Tahsilat' : 'Collection';
        return isTr ? 'Satış Faturası' : 'Sales Invoice';
      }
      if (tx.purchase_invoice_id || tx.purchase_invoice_number || desc.includes('alış faturası')) {
        if (desc.includes('ödeme')) return isTr ? 'Ödeme' : 'Payment';
        return isTr ? 'Alış Faturası' : 'Purchase Invoice';
      }
      if (desc.includes('tahsilat')) return isTr ? 'Tahsilat' : 'Collection';
      if (desc.includes('ödeme') || desc.includes('odeme')) return isTr ? 'Ödeme' : 'Payment';
      if (tx.sale_id || desc.includes('pos')) return isTr ? 'POS Satışı' : 'POS Sale';
      return isDebt ? (isTr ? 'Borç Dekontu / Fatura' : 'Debit / Invoice') : (isTr ? 'Tahsilat / Ödeme' : 'Collection / Payment');
    };

    const filteredTxs = companyTransactions.filter(tx => selectedCurrency === 'ALL' || (tx.currency || defaultCurr).toUpperCase() === selectedCurrency);
    
    const runningBalancesByCurr: Record<string, number> = { ...openingBalances };
    let runningBaseBalance = 0;
    let totalBaseDebit = 0;
    let totalBaseCredit = 0;
    const totalOrigDebitByCurr: Record<string, number> = {};
    const totalOrigCreditByCurr: Record<string, number> = {};

    const data: any[] = [];

    const pushOpeningRow = (currKey: string, obVal: number) => {
      const ob = Number(obVal || 0);
      if (Math.abs(ob) < 0.005) return;
      const c = currKey.toUpperCase();
      const rate = resolveRate(c, storeRates[c]);
      const obBase = Number((ob * rate).toFixed(2));
      runningBaseBalance = Number((runningBaseBalance + obBase).toFixed(2));

      const origDebit = ob > 0 ? Number(ob.toFixed(2)) : 0;
      const origCredit = ob < 0 ? Number(Math.abs(ob).toFixed(2)) : 0;
      const baseDebit = obBase > 0 ? obBase : 0;
      const baseCredit = obBase < 0 ? Math.abs(obBase) : 0;

      totalOrigDebitByCurr[c] = Number(((totalOrigDebitByCurr[c] || 0) + origDebit).toFixed(2));
      totalOrigCreditByCurr[c] = Number(((totalOrigCreditByCurr[c] || 0) + origCredit).toFixed(2));
      totalBaseDebit = Number((totalBaseDebit + baseDebit).toFixed(2));
      totalBaseCredit = Number((totalBaseCredit + baseCredit).toFixed(2));

      data.push({
        [isTr ? 'Tarih' : 'Date']: transactionStartDate ? formatDateTR(transactionStartDate, false, '') : '-',
        [isTr ? 'İşlem Türü' : 'Transaction Type']: isTr ? 'Devreden Bakiye' : 'Opening Balance',
        [isTr ? 'Fatura / Belge No' : 'Invoice No']: '-',
        [isTr ? 'Açıklama' : 'Description']: isTr ? `Önceki Dönemden Devreden Bakiye (${c})` : `Carry-Over Opening Balance (${c})`,
        [isTr ? 'Para Birimi' : 'Currency']: c,
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: Number(rate.toFixed(4)),
        [isTr ? 'Döviz Borç' : 'FX Debit']: c !== defaultCurr ? origDebit : 0,
        [isTr ? 'Döviz Alacak' : 'FX Credit']: c !== defaultCurr ? origCredit : 0,
        [isTr ? 'Döviz Bakiye' : 'FX Balance']: c !== defaultCurr ? Number(ob.toFixed(2)) : 0,
        [isTr ? 'Döviz Bakiye Yönü' : 'FX Balance Dir']: c !== defaultCurr ? (ob > 0 ? (isTr ? 'Borç (B)' : 'DR') : ob < 0 ? (isTr ? 'Alacak (A)' : 'CR') : '-') : '-',
        [isTr ? `Borç (${defaultCurr})` : `Debit (${defaultCurr})`]: baseDebit,
        [isTr ? `Alacak (${defaultCurr})` : `Credit (${defaultCurr})`]: baseCredit,
        [isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined Balance (${defaultCurr})`]: runningBaseBalance,
        [isTr ? `Bakiye Yönü (${defaultCurr})` : `Balance Dir (${defaultCurr})`]: runningBaseBalance > 0 ? (isTr ? 'Borç (B)' : 'DR') : runningBaseBalance < 0 ? (isTr ? 'Alacak (A)' : 'CR') : '-'
      });
    };

    if (selectedCurrency === 'ALL') {
      Object.entries(openingBalances).forEach(([currKey, obVal]) => {
        pushOpeningRow(currKey, Number(obVal || 0));
      });
    } else if (openingBalances[selectedCurrency]) {
      pushOpeningRow(selectedCurrency, Number(openingBalances[selectedCurrency] || 0));
    }

    filteredTxs.forEach(t_item => {
      const invNo = (t_item.invoice_number && t_item.invoice_number !== '-') ? t_item.invoice_number : (t_item.sales_invoice_number || t_item.purchase_invoice_number || (t_item.sale_id ? `POS #${t_item.sale_id}` : '-'));
      const amt = Number(t_item.amount || 0);
      const curr = (t_item.currency || defaultCurr).toUpperCase();
      const rate = resolveRate(curr, t_item.exchange_rate);
      const baseAmt = Number((amt * rate).toFixed(2));

      if (runningBalancesByCurr[curr] === undefined) {
        runningBalancesByCurr[curr] = Number(openingBalances[curr] || 0);
      }

      const isDebt = t_item.type === 'debt';
      if (isDebt) {
        runningBalancesByCurr[curr] = Number((runningBalancesByCurr[curr] + amt).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance + baseAmt).toFixed(2));
      } else {
        runningBalancesByCurr[curr] = Number((runningBalancesByCurr[curr] - amt).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance - baseAmt).toFixed(2));
      }

      const origDebit = isDebt ? Number(amt.toFixed(2)) : 0;
      const origCredit = !isDebt ? Number(amt.toFixed(2)) : 0;
      const baseDebit = isDebt ? baseAmt : 0;
      const baseCredit = !isDebt ? baseAmt : 0;

      totalOrigDebitByCurr[curr] = Number(((totalOrigDebitByCurr[curr] || 0) + origDebit).toFixed(2));
      totalOrigCreditByCurr[curr] = Number(((totalOrigCreditByCurr[curr] || 0) + origCredit).toFixed(2));
      totalBaseDebit = Number((totalBaseDebit + baseDebit).toFixed(2));
      totalBaseCredit = Number((totalBaseCredit + baseCredit).toFixed(2));

      const currRunBal = Number(runningBalancesByCurr[curr].toFixed(2));

      data.push({
        [isTr ? 'Tarih' : 'Date']: formatDateTR(t_item.transaction_date || t_item.date, false, ''),
        [isTr ? 'İşlem Türü' : 'Transaction Type']: resolveTxTypeLabel(t_item),
        [isTr ? 'Fatura / Belge No' : 'Invoice No']: invNo || '-',
        [isTr ? 'Açıklama' : 'Description']: t_item.description || '',
        [isTr ? 'Para Birimi' : 'Currency']: curr,
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: Number(rate.toFixed(4)),
        [isTr ? 'Döviz Borç' : 'FX Debit']: curr !== defaultCurr ? origDebit : 0,
        [isTr ? 'Döviz Alacak' : 'FX Credit']: curr !== defaultCurr ? origCredit : 0,
        [isTr ? 'Döviz Bakiye' : 'FX Balance']: curr !== defaultCurr ? currRunBal : 0,
        [isTr ? 'Döviz Bakiye Yönü' : 'FX Balance Dir']: curr !== defaultCurr ? (currRunBal > 0 ? (isTr ? 'Borç (B)' : 'DR') : currRunBal < 0 ? (isTr ? 'Alacak (A)' : 'CR') : '-') : '-',
        [isTr ? `Borç (${defaultCurr})` : `Debit (${defaultCurr})`]: baseDebit,
        [isTr ? `Alacak (${defaultCurr})` : `Credit (${defaultCurr})`]: baseCredit,
        [isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined Balance (${defaultCurr})`]: runningBaseBalance,
        [isTr ? `Bakiye Yönü (${defaultCurr})` : `Balance Dir (${defaultCurr})`]: runningBaseBalance > 0 ? (isTr ? 'Borç (B)' : 'DR') : runningBaseBalance < 0 ? (isTr ? 'Alacak (A)' : 'CR') : '-'
      });
    });

    // Append Summary & Exchange Difference Calculation Rows at the bottom of the statement
    if (data.length > 0) {
      data.push({
        [isTr ? 'Tarih' : 'Date']: '',
        [isTr ? 'İşlem Türü' : 'Transaction Type']: '',
        [isTr ? 'Fatura / Belge No' : 'Invoice No']: '',
        [isTr ? 'Açıklama' : 'Description']: '',
        [isTr ? 'Para Birimi' : 'Currency']: '',
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: '',
        [isTr ? 'Döviz Borç' : 'FX Debit']: '',
        [isTr ? 'Döviz Alacak' : 'FX Credit']: '',
        [isTr ? 'Döviz Bakiye' : 'FX Balance']: '',
        [isTr ? 'Döviz Bakiye Yönü' : 'FX Balance Dir']: '',
        [isTr ? `Borç (${defaultCurr})` : `Debit (${defaultCurr})`]: '',
        [isTr ? `Alacak (${defaultCurr})` : `Credit (${defaultCurr})`]: '',
        [isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined Balance (${defaultCurr})`]: '',
        [isTr ? `Bakiye Yönü (${defaultCurr})` : `Balance Dir (${defaultCurr})`]: ''
      });

      // Overall Default Currency Summary Row
      data.push({
        [isTr ? 'Tarih' : 'Date']: '',
        [isTr ? 'İşlem Türü' : 'Transaction Type']: isTr ? 'GENEL TOPLAM' : 'GRAND TOTAL',
        [isTr ? 'Fatura / Belge No' : 'Invoice No']: '-',
        [isTr ? 'Açıklama' : 'Description']: isTr ? `Birleşik Cari Ekstre Toplamı (${defaultCurr} Karşılığı)` : `Combined Statement Total (${defaultCurr} Equivalent)`,
        [isTr ? 'Para Birimi' : 'Currency']: defaultCurr,
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: 1,
        [isTr ? 'Döviz Borç' : 'FX Debit']: '',
        [isTr ? 'Döviz Alacak' : 'FX Credit']: '',
        [isTr ? 'Döviz Bakiye' : 'FX Balance']: '',
        [isTr ? 'Döviz Bakiye Yönü' : 'FX Balance Dir']: '',
        [isTr ? `Borç (${defaultCurr})` : `Debit (${defaultCurr})`]: totalBaseDebit,
        [isTr ? `Alacak (${defaultCurr})` : `Credit (${defaultCurr})`]: totalBaseCredit,
        [isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined Balance (${defaultCurr})`]: runningBaseBalance,
        [isTr ? `Bakiye Yönü (${defaultCurr})` : `Balance Dir (${defaultCurr})`]: runningBaseBalance > 0 ? (isTr ? 'Borç (B)' : 'DR') : runningBaseBalance < 0 ? (isTr ? 'Alacak (A)' : 'CR') : '-'
      });

      // Per-Currency Summary & Current Rate Valuation / Exchange Difference Helper Rows
      Object.entries(runningBalancesByCurr).forEach(([currKey, endBal]) => {
        const c = currKey.toUpperCase();
        const finalBal = Number((endBal || 0).toFixed(2));
        const currDeb = Number((totalOrigDebitByCurr[c] || 0).toFixed(2));
        const currCred = Number((totalOrigCreditByCurr[c] || 0).toFixed(2));
        if (currDeb === 0 && currCred === 0 && Math.abs(finalBal) < 0.005) return;

        const currentStoreRate = resolveRate(c, storeRates[c]);
        const valuedInBaseAtCurrentRate = Number((finalBal * currentStoreRate).toFixed(2));

        data.push({
          [isTr ? 'Tarih' : 'Date']: '',
          [isTr ? 'İşlem Türü' : 'Transaction Type']: isTr ? `${c} HESAP ÖZETİ` : `${c} SUMMARY`,
          [isTr ? 'Fatura / Belge No' : 'Invoice No']: '-',
          [isTr ? 'Açıklama' : 'Description']: c === defaultCurr
            ? (isTr ? `${c} Cinsinden İşlemler Toplamı` : `Total ${c} Transactions`)
            : (isTr ? `${c} Net Bakiye & Güncel Kur (${currentStoreRate.toFixed(4)}) Değerlemesi` : `${c} Net Balance & Current Rate (${currentStoreRate.toFixed(4)}) Valuation`),
          [isTr ? 'Para Birimi' : 'Currency']: c,
          [isTr ? 'Döviz Kuru' : 'Exchange Rate']: Number(currentStoreRate.toFixed(4)),
          [isTr ? 'Döviz Borç' : 'FX Debit']: c !== defaultCurr ? currDeb : 0,
          [isTr ? 'Döviz Alacak' : 'FX Credit']: c !== defaultCurr ? currCred : 0,
          [isTr ? 'Döviz Bakiye' : 'FX Balance']: c !== defaultCurr ? finalBal : 0,
          [isTr ? 'Döviz Bakiye Yönü' : 'FX Balance Dir']: c !== defaultCurr ? (finalBal > 0 ? (isTr ? 'Borç (B)' : 'DR') : finalBal < 0 ? (isTr ? 'Alacak (A)' : 'CR') : '-') : '-',
          [isTr ? `Borç (${defaultCurr})` : `Debit (${defaultCurr})`]: c === defaultCurr ? currDeb : '',
          [isTr ? `Alacak (${defaultCurr})` : `Credit (${defaultCurr})`]: c === defaultCurr ? currCred : '',
          [isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined Balance (${defaultCurr})`]: valuedInBaseAtCurrentRate,
          [isTr ? `Bakiye Yönü (${defaultCurr})` : `Balance Dir (${defaultCurr})`]: valuedInBaseAtCurrentRate > 0 ? (isTr ? 'Borç (B)' : 'DR') : valuedInBaseAtCurrentRate < 0 ? (isTr ? 'Alacak (A)' : 'CR') : '-'
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    // Auto-size columns for crisp readability in Excel
    ws['!cols'] = [
      { wch: 13 }, // Tarih
      { wch: 18 }, // İşlem Türü
      { wch: 20 }, // Fatura / Belge No
      { wch: 42 }, // Açıklama
      { wch: 11 }, // Para Birimi
      { wch: 12 }, // Döviz Kuru
      { wch: 15 }, // Döviz Borç
      { wch: 15 }, // Döviz Alacak
      { wch: 16 }, // Döviz Bakiye
      { wch: 15 }, // Döviz Bakiye Yönü
      { wch: 16 }, // Borç (Default)
      { wch: 16 }, // Alacak (Default)
      { wch: 20 }, // Birleşik Bakiye (Default)
      { wch: 16 }, // Bakiye Yönü (Default)
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cari Ekstre');
    XLSX.writeFile(wb, `cari_ekstre_${selectedCompany.title || 'firma'}_${selectedCurrency}_${transactionStartDate ? formatFileDateTR(transactionStartDate) : 'all'}.xlsx`);
  };

  return { handleExportCompanies, handleExportTransactionsPDF, handleExportTransactionsExcel };
};
