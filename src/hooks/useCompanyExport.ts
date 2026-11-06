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
  selectedCurrency: string,
  includeZeroBalance: boolean = false
) => {

  const handleExportCompanies = (customCompanies?: any[], customIncludeZero?: boolean) => {
    const isTr = lang === 'tr';
    const t = translations[lang].dashboard;

    let effectiveIncludeZero = customIncludeZero !== undefined ? customIncludeZero : includeZeroBalance;
    if (effectiveIncludeZero === undefined && typeof window !== 'undefined') {
      const saved = localStorage.getItem('companies_include_zero_balance');
      if (saved !== null) {
        effectiveIncludeZero = saved === 'true';
      }
    }

    let targetCompanies = Array.isArray(customCompanies) && customCompanies.length > 0 ? customCompanies : companies;
    if (!effectiveIncludeZero) {
      targetCompanies = targetCompanies.filter(c => {
        return Object.values(c.balances || {}).some(bal => Math.abs(Number(bal)) > 0.0001);
      });
    }

    const data = targetCompanies.map(c => {
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
    const tryRates: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20, TRY: 1 };
    const rawRates = branding?.currency_rates || {};
    if (typeof rawRates === 'object' && rawRates !== null) {
      Object.keys(rawRates).forEach(k => {
        const v = parseFloat(rawRates[k]);
        if (!isNaN(v) && v > 0) tryRates[k.toUpperCase()] = v;
      });
    }
    tryRates['TRY'] = 1;

    const getTryRate = (curr: string, txRate?: any) => {
      const c = (curr || 'TRY').toUpperCase();
      if (c === 'TRY') return 1;
      const r = Number(txRate || 0);
      if (!isNaN(r) && r > 1) return r;
      return tryRates[c] || 35;
    };

    const convertCurrency = (amt: number, fromCurr: string, toCurr: string, txRate?: any) => {
      const f = (fromCurr || defaultCurr).toUpperCase();
      const target = (toCurr || defaultCurr).toUpperCase();
      if (f === target) return Number(amt.toFixed(2));
      const fromTry = getTryRate(f, txRate);
      const toTry = getTryRate(target);
      return Number(((amt * fromTry) / toTry).toFixed(2));
    };

    const resolveRate = (curr: string, txRate: any) => {
      const c = (curr || defaultCurr).toUpperCase();
      if (c === defaultCurr) return 1;
      const r = Number(txRate || 0);
      if (!isNaN(r) && r > 1) return r;
      return getTryRate(c, txRate);
    };

    const runningBalancesByCurr: Record<string, number> = { ...openingBalances };
    let runningStatementBal = Number(openingBalances[selectedCurrency] || 0);
    let runningBaseBalance = 0;

    const enrichedTransactions: any[] = [];
    (Array.isArray(companyTransactions) ? companyTransactions : []).forEach((tx: any) => {
      const txCurr = (tx.currency || defaultCurr).toUpperCase();
      const txCrossCurr = (tx.cross_currency || '').toUpperCase();
      const rawAmt = Number(tx.amount || 0);
      const rawCrossAmt = Number(tx.cross_amount || 0);
      const rate = resolveRate(txCurr, tx.exchange_rate);
      const crossRate = Number(tx.cross_rate || rate || 1);
      const descLower = (tx.description || '').toLowerCase();
      const isExchangeDiffInvoice = descLower.includes('kur fark');

      const isCrossFromTRY = (txCrossCurr === 'TRY' && rawCrossAmt > 0 && txCurr !== 'TRY') ||
        ((descLower.includes('tl tahsilat') || descLower.includes('tl ödeme') || descLower.includes('tl:')) && txCurr !== 'TRY');
      const isCrossToTRY = (txCurr === 'TRY' && txCrossCurr && txCrossCurr !== 'TRY');

      if (selectedCurrency === 'ALL') {
        if (isCrossFromTRY) {
          const effRate = crossRate > 1 ? crossRate : getTryRate(txCurr, tx.exchange_rate);
          const tryAmt = rawCrossAmt > 0 ? rawCrossAmt : Number((rawAmt * effRate).toFixed(2));
          const baseAmt = defaultCurr === 'TRY' ? tryAmt : convertCurrency(rawAmt, txCurr, defaultCurr, effRate);
          enrichedTransactions.push({
            ...tx,
            statementCurr: txCurr,
            statementAmt: rawAmt,
            statementRate: effRate,
            fxCurr: 'TRY',
            fxAmt: tryAmt,
            fxRate: effRate,
            baseAmt,
            targetBalCurr: txCurr,
            targetBalAmt: rawAmt,
            isCross: true,
            crossNote: `${tryAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ile Mahsup Edildi (Kur: ${effRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`
          });
          return;
        }

        if (isCrossToTRY) {
          const effRate = crossRate > 1 ? crossRate : getTryRate(txCrossCurr);
          const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : (effRate > 0 ? Number((rawAmt / effRate).toFixed(2)) : null);
          const baseAmt = defaultCurr === 'TRY' ? rawAmt : convertCurrency(rawAmt, 'TRY', defaultCurr);
          enrichedTransactions.push({
            ...tx,
            statementCurr: txCrossCurr,
            statementAmt: fxAmt || 0,
            statementRate: effRate > 0 ? effRate : 1,
            fxCurr: 'TRY',
            fxAmt: rawAmt,
            fxRate: effRate,
            baseAmt,
            targetBalCurr: txCrossCurr,
            targetBalAmt: fxAmt || 0,
            isCross: true,
            crossNote: `${rawAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ile Mahsup Edildi (Kur: ${effRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`
          });
          return;
        }

        if (txCurr === defaultCurr) {
          enrichedTransactions.push({
            ...tx,
            statementCurr: defaultCurr,
            statementAmt: rawAmt,
            statementRate: 1,
            fxCurr: '',
            fxAmt: null,
            fxRate: 1,
            baseAmt: rawAmt,
            targetBalCurr: defaultCurr,
            targetBalAmt: rawAmt,
            isCross: false,
            isExchangeDiffInvoice
          });
          return;
        }

        const baseAmt = convertCurrency(rawAmt, txCurr, defaultCurr, tx.exchange_rate);
        const effDisplayRate = txCurr === 'TRY' ? getTryRate(defaultCurr) : getTryRate(txCurr, tx.exchange_rate);
        const fxCurr = txCrossCurr || defaultCurr;
        const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : baseAmt;
        enrichedTransactions.push({
          ...tx,
          statementCurr: txCurr,
          statementAmt: rawAmt,
          statementRate: effDisplayRate,
          fxCurr,
          fxAmt,
          fxRate: crossRate > 1 ? crossRate : effDisplayRate,
          baseAmt,
          targetBalCurr: txCurr,
          targetBalAmt: rawAmt,
          isCross: Boolean(txCrossCurr && txCrossCurr !== txCurr)
        });
        return;
      }

      // Single Currency PDF Export (selectedCurrency !== 'ALL')
      const activeTabCurr = selectedCurrency.toUpperCase();
      const targetLedgerCurr = (txCurr !== 'TRY')
        ? txCurr
        : (txCrossCurr && txCrossCurr !== 'TRY' ? txCrossCurr : 'TRY');

      // Transactions belonging to a different currency ledger MUST NOT appear in this statement!
      if (targetLedgerCurr !== activeTabCurr) {
        return;
      }

      if (txCurr === activeTabCurr) {
        const hasCross = Boolean(txCrossCurr && txCrossCurr !== activeTabCurr) ||
          (activeTabCurr !== 'TRY' && (descLower.includes('tl tahsilat') || descLower.includes('tl ödeme') || descLower.includes('tl:')));
        const convertedToDefault = convertCurrency(rawAmt, activeTabCurr, defaultCurr, tx.exchange_rate);
        const displayRate = activeTabCurr === 'TRY' ? 1 : getTryRate(activeTabCurr, tx.exchange_rate);
        const effRate = crossRate > 1 ? crossRate : displayRate;
        const counterCurr = (txCrossCurr && txCrossCurr !== activeTabCurr) ? txCrossCurr : (activeTabCurr === 'TRY' ? defaultCurr : 'TRY');
        const convCounter = convertCurrency(rawAmt, activeTabCurr, counterCurr, effRate);
        const counterAmt = rawCrossAmt > 0 ? rawCrossAmt : convCounter;
        enrichedTransactions.push({
          ...tx,
          statementCurr: activeTabCurr,
          statementAmt: rawAmt,
          statementRate: effRate,
          fxCurr: hasCross ? counterCurr : (activeTabCurr !== defaultCurr ? defaultCurr : ''),
          fxAmt: hasCross ? counterAmt : (activeTabCurr !== defaultCurr ? convertedToDefault : null),
          fxRate: effRate,
          baseAmt: convertedToDefault,
          targetBalCurr: activeTabCurr,
          targetBalAmt: rawAmt,
          isCross: hasCross,
          crossNote: hasCross ? `${Number(counterAmt).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${counterCurr === 'TRY' ? '₺' : counterCurr} ile Mahsup Edildi (Kur: ${effRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : undefined
        });
        return;
      }

      if (txCurr === 'TRY' && txCrossCurr === activeTabCurr) {
        const effRate = crossRate > 1 ? crossRate : getTryRate(activeTabCurr, tx.exchange_rate);
        const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : (effRate > 0 ? Number((rawAmt / effRate).toFixed(2)) : 0);
        const baseAmt = convertCurrency(fxAmt, activeTabCurr, defaultCurr, effRate);
        enrichedTransactions.push({
          ...tx,
          statementCurr: activeTabCurr,
          statementAmt: fxAmt,
          statementRate: effRate,
          fxCurr: 'TRY',
          fxAmt: rawAmt,
          fxRate: effRate,
          baseAmt,
          targetBalCurr: activeTabCurr,
          targetBalAmt: fxAmt,
          isCross: true,
          crossNote: `${rawAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ ile Mahsup Edildi (Kur: ${effRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`
        });
        return;
      }
    });

    const filteredTransactions = enrichedTransactions;

    const tableData: any[] = [];
    
    if (selectedCurrency === 'ALL') {
      Object.entries(openingBalances).forEach(([currKey, obVal]) => {
        const ob = Number(obVal || 0);
        if (Math.abs(ob) < 0.005) return;
        const c = currKey.toUpperCase();
        const rate = c === 'TRY' ? getTryRate(defaultCurr) : getTryRate(c);
        const obBase = convertCurrency(ob, c, defaultCurr);
        runningBaseBalance = Number((runningBaseBalance + obBase).toFixed(2));
        tableData.push([
          formatDateTR(transactionStartDate),
          '-',
          '-',
          '-',
          fixTr(isTr ? `Devreden Bakiye (${c})` : `Opening Balance (${c})`),
          `${c}${c !== defaultCurr ? ` (Kur: ${rate.toFixed(4)})` : ''}`,
          '-',
          ob > 0 ? `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : "-",
          ob < 0 ? `${Math.abs(ob).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : "-",
          `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`,
          `${runningBaseBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${defaultCurr}`
        ]);
      });
    } else if (openingBalances[selectedCurrency]) {
      const ob = Number(openingBalances[selectedCurrency] || 0);
      const c = selectedCurrency.toUpperCase();
      const rate = c === 'TRY' ? getTryRate(defaultCurr) : getTryRate(c);
      const obBase = convertCurrency(ob, c, defaultCurr);
      runningBaseBalance = Number((runningBaseBalance + obBase).toFixed(2));
      tableData.push([
        formatDateTR(transactionStartDate),
        '-',
        '-',
        '-',
        fixTr(isTr ? 'Devreden Bakiye' : 'Opening Balance'),
        `${c}${c !== defaultCurr ? ` (Kur: ${rate.toFixed(4)})` : ''}`,
        '-',
        ob > 0 ? `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : "-",
        ob < 0 ? `${Math.abs(ob).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : "-",
        `${ob.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`
      ]);
    }

    const resolveTxTypeLabel = (tx: any) => {
      if (tx.transaction_type_label) return tx.transaction_type_label;
      const desc = (tx.description || '').toLowerCase();
      const isDebt = tx.type === 'debt';
      const pMethod = (tx.payment_method || '').toLowerCase();
      if (desc.includes('iade')) {
        return isTr ? 'İade Faturası' : 'Return Invoice';
      }
      if (desc.includes('kur fark')) {
        return isTr ? 'Kur Farkı Faturası' : 'Exchange Diff Invoice';
      }
      if (isDebt) {
        if (tx.is_invoice || (tx.sales_invoice_id && !desc.includes('tahsilat') && !desc.includes('ödeme')) || desc.startsWith('satış faturası')) {
          return isTr ? 'Satış Faturası' : 'Sales Invoice';
        }
        if (tx.sale_id || desc.includes('pos')) return isTr ? 'POS Satışı' : 'POS Sale';
        if (pMethod === 'bank' || desc.includes('bank') || desc.includes('havale') || desc.includes('eft') || desc.includes('fast')) {
          return isTr ? 'Ödeme (Banka)' : 'Payment (Bank)';
        }
        if (pMethod === 'cash' || desc.includes('nakit') || desc.includes('kasa') || desc.includes('elden')) {
          return isTr ? 'Ödeme (Nakit)' : 'Payment (Cash)';
        }
        if (pMethod === 'credit_card' || desc.includes('kart')) {
          return isTr ? 'Ödeme (Kredi Kartı)' : 'Payment (Card)';
        }
        if (desc.includes('ödeme') || desc.includes('odeme')) return isTr ? 'Ödeme' : 'Payment';
        return isTr ? 'Borç Dekontu' : 'Debit';
      } else {
        if (tx.is_invoice || (tx.purchase_invoice_id && !desc.includes('ödeme') && !desc.includes('tahsilat')) || desc.startsWith('alış faturası')) {
          return isTr ? 'Alış Faturası' : 'Purchase Invoice';
        }
        if (pMethod === 'bank' || desc.includes('bank') || desc.includes('garanti') || desc.includes('havale') || desc.includes('eft') || desc.includes('fast') || desc.includes('akbank') || desc.includes('isbank') || desc.includes('yapikredi') || desc.includes('ziraat') || desc.includes('vakif') || desc.includes('qnb') || desc.includes('teb') || desc.includes('halk')) {
          return isTr ? 'Tahsilat (Banka)' : 'Collection (Bank)';
        }
        if (pMethod === 'cash' || desc.includes('nakit') || desc.includes('kasa') || desc.includes('elden')) {
          return isTr ? 'Tahsilat (Nakit)' : 'Collection (Cash)';
        }
        if (pMethod === 'credit_card' || desc.includes('kart') || desc.includes('pos')) {
          return isTr ? 'Tahsilat (Kredi Kartı)' : 'Collection (Card)';
        }
        if (desc.includes('tahsilat') || desc.includes('gelen')) return isTr ? 'Tahsilat' : 'Collection';
        return isTr ? 'Tahsilat' : 'Collection';
      }
    };

    const resolveDocNo = (tx: any) => {
      if (tx.document_number && tx.document_number !== '-') return tx.document_number;
      const isDebt = tx.type === 'debt';
      const desc = tx.description || '';
      if (tx.is_invoice) {
        return tx.sales_invoice_number || tx.purchase_invoice_number || tx.invoice_number || '-';
      }
      if (isDebt && (tx.sales_invoice_id || desc.toLowerCase().startsWith('satış faturası')) && !desc.toLowerCase().includes('tahsilat')) {
        return tx.sales_invoice_number || tx.invoice_number || '-';
      }
      if (!isDebt && (tx.purchase_invoice_id || desc.toLowerCase().startsWith('alış faturası')) && !desc.toLowerCase().includes('ödeme')) {
        return tx.purchase_invoice_number || tx.invoice_number || '-';
      }
      if (tx.sale_id) return `POS #${tx.sale_id}`;
      const matchBracket = desc.match(/\[(?:Belge|Evrak|Ref|Dekont|Makbuz|Fiş):\s*([^\]]+)\]/i);
      if (matchBracket) return matchBracket[1].trim();
      const matchVoucher = desc.match(/\b(DEK-[A-Z0-9\-_/]+|TAH-[A-Z0-9\-_/]+|MAK-[A-Z0-9\-_/]+|REF-[A-Z0-9\-_/]+|OD-[A-Z0-9\-_/]+)\b/i);
      if (matchVoucher) return matchVoucher[1].trim();
      return '-';
    };

    const resolveClosedInvNo = (tx: any) => {
      if (tx.closed_invoice_number && tx.closed_invoice_number !== '-') return tx.closed_invoice_number;
      const isDebt = tx.type === 'debt';
      const desc = tx.description || '';
      if (tx.is_invoice || (isDebt && tx.sales_invoice_id && !desc.toLowerCase().includes('tahsilat')) || (!isDebt && tx.purchase_invoice_id && !desc.toLowerCase().includes('ödeme'))) {
        return '-';
      }
      if (tx.sales_invoice_number) return tx.sales_invoice_number;
      if (tx.purchase_invoice_number) return tx.purchase_invoice_number;
      const matchCode = desc.match(/\b(GIB\d{10,16}|GAP\d{10,16}|EAR\d{10,16}|SAT-\d+|ALI-\d+|FT-\d+|INV-\d+|\d{4}-\d{3,8})\b/i);
      if (matchCode) return matchCode[1].trim();
      return '-';
    };

    filteredTransactions.forEach(t_item => {
      const amount = Number(t_item.statementAmt || t_item.amount || 0);
      const curr = (t_item.statementCurr || t_item.currency || defaultCurr).toUpperCase();
      const rate = Number(t_item.statementRate || resolveRate(curr, t_item.exchange_rate));
      const baseAmount = Number(t_item.baseAmt !== undefined ? t_item.baseAmt : convertCurrency(amount, curr, defaultCurr, t_item.exchange_rate));

      if (t_item.targetBalCurr && t_item.targetBalCurr !== curr) {
        if (runningBalancesByCurr[t_item.targetBalCurr] === undefined) {
          runningBalancesByCurr[t_item.targetBalCurr] = Number(openingBalances[t_item.targetBalCurr] || 0);
        }
        const tAmt = Number(t_item.targetBalAmt || t_item.fxAmt || 0);
        if (t_item.type === 'debt') {
          runningBalancesByCurr[t_item.targetBalCurr] = Number((runningBalancesByCurr[t_item.targetBalCurr] + tAmt).toFixed(2));
        } else {
          runningBalancesByCurr[t_item.targetBalCurr] = Number((runningBalancesByCurr[t_item.targetBalCurr] - tAmt).toFixed(2));
        }
      } else {
        if (runningBalancesByCurr[curr] === undefined) {
          runningBalancesByCurr[curr] = Number(openingBalances[curr] || 0);
        }
        if (t_item.type === 'debt') {
          runningBalancesByCurr[curr] = Number((runningBalancesByCurr[curr] + amount).toFixed(2));
        } else {
          runningBalancesByCurr[curr] = Number((runningBalancesByCurr[curr] - amount).toFixed(2));
        }
      }
      if (t_item.type === 'debt') {
        runningStatementBal = Number((runningStatementBal + amount).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance + baseAmount).toFixed(2));
      } else {
        runningStatementBal = Number((runningStatementBal - amount).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance - baseAmount).toFixed(2));
      }
      const rowBal = selectedCurrency === 'ALL' 
        ? (t_item.targetBalCurr ? runningBalancesByCurr[t_item.targetBalCurr] : runningBalancesByCurr[curr]) 
        : runningStatementBal;
      
      const docNo = resolveDocNo(t_item);
      const closedInvNo = resolveClosedInvNo(t_item);
      const txType = resolveTxTypeLabel(t_item);
      const currStr = `${curr}${rate !== 1 ? ` (Kur: ${rate.toFixed(4)})` : ''}`;
      const fxStr = t_item.fxAmt ? `${Number(t_item.fxAmt).toLocaleString(isTr ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t_item.fxCurr}` : '-';

      const rowArr = [
        formatDateTR(t_item.transaction_date || t_item.date),
        fixTr(txType),
        fixTr(docNo),
        fixTr(closedInvNo),
        fixTr(t_item.crossNote || t_item.description || ""),
        currStr,
        fxStr,
        t_item.type === 'debt' ? `${amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` : "-",
        t_item.type === 'credit' ? `${amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` : "-",
        `${rowBal.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${selectedCurrency === 'ALL' ? (t_item.targetBalCurr || curr) : selectedCurrency}`
      ];
      if (selectedCurrency === 'ALL') {
        rowArr.push(`${runningBaseBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${defaultCurr}`);
      }
      tableData.push(rowArr);
    });

    const pdfHeadRow = [
      fixTr(t.statements.date),
      fixTr(isTr ? 'İşlem Türü' : 'Type'),
      fixTr(isTr ? 'Belge No' : 'Doc No'),
      fixTr(isTr ? 'Kapattığı Fatura' : 'Closed Inv'),
      fixTr(t.statements.description),
      fixTr(isTr ? 'Döviz/Kur' : 'Currency/Rate'),
      fixTr(isTr ? 'Döviz/Karşı Tutar' : 'FX/Cross Amount'),
      fixTr(t.statements.debt),
      fixTr(t.statements.credit),
      fixTr(t.statements.balance)
    ];
    if (selectedCurrency === 'ALL') {
      pdfHeadRow.push(fixTr(isTr ? `Birleşik (${defaultCurr})` : `Combined (${defaultCurr})`));
    }

    autoTable(doc, {
      startY: yPos,
      head: [pdfHeadRow],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 7, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      columnStyles: selectedCurrency === 'ALL'
        ? {
            7: { halign: 'right' },
            8: { halign: 'right' },
            9: { halign: 'right' },
            10: { halign: 'right' }
          }
        : {
            7: { halign: 'right' },
            8: { halign: 'right' },
            9: { halign: 'right' }
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
    doc.text(
      selectedCurrency === 'ALL'
        ? `${fixTr(t.statements.balance)}: ${summaryText}   ||   ${baseSummaryStr}`
        : `${fixTr(t.statements.balance)}: ${summaryText}`,
      196,
      finalY,
      { align: 'right' }
    );

    doc.save(`${fixTr(t.statements.customerStatement.toLowerCase().replace(/\s+/g, '_'))}_${fixTr(selectedCompany.title)}_${selectedCurrency}_${transactionStartDate ? formatFileDateTR(transactionStartDate) : 'all'}_${transactionEndDate ? formatFileDateTR(transactionEndDate) : 'all'}.pdf`);
  };

  const handleExportTransactionsExcel = () => {
    if (!selectedCompany) return;
    const isTr = lang === 'tr';
    const defaultCurr = (branding?.default_currency || branding?.currency || 'TRY').toUpperCase();
    const tryRates: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20, TRY: 1 };
    const rawRates = branding?.currency_rates || {};
    if (typeof rawRates === 'object' && rawRates !== null) {
      Object.keys(rawRates).forEach(k => {
        const v = parseFloat(rawRates[k]);
        if (!isNaN(v) && v > 0) tryRates[k.toUpperCase()] = v;
      });
    }
    tryRates['TRY'] = 1;

    const getTryRate = (curr: string, txRate?: any) => {
      const c = (curr || 'TRY').toUpperCase();
      if (c === 'TRY') return 1;
      const r = Number(txRate || 0);
      if (!isNaN(r) && r > 1) return r;
      return tryRates[c] || 35;
    };

    const convertCurrency = (amt: number, fromCurr: string, toCurr: string, txRate?: any) => {
      const f = (fromCurr || defaultCurr).toUpperCase();
      const target = (toCurr || defaultCurr).toUpperCase();
      if (f === target) return Number(amt.toFixed(2));
      const fromTry = getTryRate(f, txRate);
      const toTry = getTryRate(target);
      return Number(((amt * fromTry) / toTry).toFixed(2));
    };

    const resolveRate = (curr: string, txRate: any) => {
      const c = (curr || defaultCurr).toUpperCase();
      if (c === defaultCurr) return 1;
      const r = Number(txRate || 0);
      if (!isNaN(r) && r > 1) return r;
      return getTryRate(c, txRate);
    };

    const resolveTxTypeLabel = (tx: any) => {
      if (tx.transaction_type_label) return tx.transaction_type_label;
      const desc = (tx.description || '').toLowerCase();
      const isDebt = tx.type === 'debt';
      const pMethod = (tx.payment_method || '').toLowerCase();
      if (desc.includes('iade')) {
        return isTr ? 'İade Faturası' : 'Return Invoice';
      }
      if (desc.includes('kur fark')) {
        return isTr ? 'Kur Farkı Faturası' : 'Exchange Diff Invoice';
      }
      if (isDebt) {
        if (tx.is_invoice || (tx.sales_invoice_id && !desc.includes('tahsilat') && !desc.includes('ödeme')) || desc.startsWith('satış faturası')) {
          return isTr ? 'Satış Faturası' : 'Sales Invoice';
        }
        if (tx.sale_id || desc.includes('pos')) return isTr ? 'POS Satışı' : 'POS Sale';
        if (pMethod === 'bank' || desc.includes('bank') || desc.includes('havale') || desc.includes('eft') || desc.includes('fast')) {
          return isTr ? 'Ödeme (Banka)' : 'Payment (Bank)';
        }
        if (pMethod === 'cash' || desc.includes('nakit') || desc.includes('kasa') || desc.includes('elden')) {
          return isTr ? 'Ödeme (Nakit)' : 'Payment (Cash)';
        }
        if (pMethod === 'credit_card' || desc.includes('kart')) {
          return isTr ? 'Ödeme (Kredi Kartı)' : 'Payment (Card)';
        }
        if (desc.includes('ödeme') || desc.includes('odeme')) return isTr ? 'Ödeme' : 'Payment';
        return isTr ? 'Borç Dekontu' : 'Debit';
      } else {
        if (tx.is_invoice || (tx.purchase_invoice_id && !desc.includes('ödeme') && !desc.includes('tahsilat')) || desc.startsWith('alış faturası')) {
          return isTr ? 'Alış Faturası' : 'Purchase Invoice';
        }
        if (pMethod === 'bank' || desc.includes('bank') || desc.includes('garanti') || desc.includes('havale') || desc.includes('eft') || desc.includes('fast') || desc.includes('akbank') || desc.includes('isbank') || desc.includes('yapikredi') || desc.includes('ziraat') || desc.includes('vakif') || desc.includes('qnb') || desc.includes('teb') || desc.includes('halk')) {
          return isTr ? 'Tahsilat (Banka)' : 'Collection (Bank)';
        }
        if (pMethod === 'cash' || desc.includes('nakit') || desc.includes('kasa') || desc.includes('elden')) {
          return isTr ? 'Tahsilat (Nakit)' : 'Collection (Cash)';
        }
        if (pMethod === 'credit_card' || desc.includes('kart') || desc.includes('pos')) {
          return isTr ? 'Tahsilat (Kredi Kartı)' : 'Collection (Card)';
        }
        if (desc.includes('tahsilat') || desc.includes('gelen')) return isTr ? 'Tahsilat' : 'Collection';
        return isTr ? 'Tahsilat' : 'Collection';
      }
    };

    const resolveDocNo = (tx: any) => {
      if (tx.document_number && tx.document_number !== '-') return tx.document_number;
      const isDebt = tx.type === 'debt';
      const desc = tx.description || '';
      if (tx.is_invoice) {
        return tx.sales_invoice_number || tx.purchase_invoice_number || tx.invoice_number || '-';
      }
      if (isDebt && (tx.sales_invoice_id || desc.toLowerCase().startsWith('satış faturası')) && !desc.toLowerCase().includes('tahsilat')) {
        return tx.sales_invoice_number || tx.invoice_number || '-';
      }
      if (!isDebt && (tx.purchase_invoice_id || desc.toLowerCase().startsWith('alış faturası')) && !desc.toLowerCase().includes('ödeme')) {
        return tx.purchase_invoice_number || tx.invoice_number || '-';
      }
      if (tx.sale_id) return `POS #${tx.sale_id}`;
      const matchBracket = desc.match(/\[(?:Belge|Evrak|Ref|Dekont|Makbuz|Fiş):\s*([^\]]+)\]/i);
      if (matchBracket) return matchBracket[1].trim();
      const matchVoucher = desc.match(/\b(DEK-[A-Z0-9\-_/]+|TAH-[A-Z0-9\-_/]+|MAK-[A-Z0-9\-_/]+|REF-[A-Z0-9\-_/]+|OD-[A-Z0-9\-_/]+)\b/i);
      if (matchVoucher) return matchVoucher[1].trim();
      return '-';
    };

    const resolveClosedInvNo = (tx: any) => {
      if (tx.closed_invoice_number && tx.closed_invoice_number !== '-') return tx.closed_invoice_number;
      const isDebt = tx.type === 'debt';
      const desc = tx.description || '';
      if (tx.is_invoice || (isDebt && tx.sales_invoice_id && !desc.toLowerCase().includes('tahsilat')) || (!isDebt && tx.purchase_invoice_id && !desc.toLowerCase().includes('ödeme'))) {
        return '-';
      }
      if (tx.sales_invoice_number) return tx.sales_invoice_number;
      if (tx.purchase_invoice_number) return tx.purchase_invoice_number;
      const matchCode = desc.match(/\b(GIB\d{10,16}|GAP\d{10,16}|EAR\d{10,16}|SAT-\d+|ALI-\d+|FT-\d+|INV-\d+|\d{4}-\d{3,8})\b/i);
      if (matchCode) return matchCode[1].trim();
      return '-';
    };

    const detectedFxCurrencies = Array.from(new Set(
      [
        ...Object.keys(openingBalances || {}),
        ...(Array.isArray(companyTransactions) ? companyTransactions : []).flatMap((tx: any) => [
          (tx.currency || '').toUpperCase(),
          (tx.cross_currency || '').toUpperCase()
        ])
      ].filter(c => c && c !== defaultCurr && c !== 'ALL')
    ));
    const primaryFxCurr = selectedCurrency === defaultCurr
      ? ''
      : (selectedCurrency !== 'ALL'
        ? selectedCurrency.toUpperCase()
        : (detectedFxCurrencies[0] || ''));

    let lastKnownFxRate = primaryFxCurr ? getTryRate(primaryFxCurr) : 1;

    const enrichedExcelTxs: any[] = [];
    (Array.isArray(companyTransactions) ? companyTransactions : []).forEach((tx: any) => {
      const txCurr = (tx.currency || defaultCurr).toUpperCase();
      const txCrossCurr = (tx.cross_currency || '').toUpperCase();
      const rawAmt = Number(tx.amount || 0);
      const rawCrossAmt = Number(tx.cross_amount || 0);
      const rate = resolveRate(txCurr, tx.exchange_rate);
      const crossRate = Number(tx.cross_rate || rate || 1);
      const descLower = (tx.description || '').toLowerCase();
      const isKurFarki = descLower.includes('kur fark');

      if (txCurr !== defaultCurr && rate > 1) {
        lastKnownFxRate = rate;
      } else if (crossRate > 1) {
        lastKnownFxRate = crossRate;
      }

      const isCrossFromTRY = (txCrossCurr === 'TRY' && rawCrossAmt > 0 && txCurr !== 'TRY') ||
        ((descLower.includes('tl tahsilat') || descLower.includes('tl ödeme') || descLower.includes('tl:')) && txCurr !== 'TRY');
      const isCrossToTRY = (txCurr === 'TRY' && txCrossCurr && txCrossCurr !== 'TRY');

      if (selectedCurrency === 'ALL') {
        if (isCrossFromTRY) {
          const effRate = crossRate > 1 ? crossRate : getTryRate(txCurr, tx.exchange_rate);
          const tryAmt = rawCrossAmt > 0 ? rawCrossAmt : Number((rawAmt * effRate).toFixed(2));
          const baseAmt = defaultCurr === 'TRY' ? tryAmt : convertCurrency(rawAmt, txCurr, defaultCurr, effRate);
          enrichedExcelTxs.push({
            ...tx,
            statementCurr: txCurr,
            statementAmt: rawAmt,
            statementRate: effRate,
            fxCurr: 'TRY',
            fxAmt: tryAmt,
            fxRate: effRate,
            baseAmt,
            targetBalCurr: txCurr,
            targetBalAmt: rawAmt,
            isCross: true,
            isKurFarki: false,
            crossNote: `${tryAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺ ile Mahsup Edildi (Kur: ${effRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`
          });
          return;
        }

        if (isCrossToTRY) {
          const effRate = crossRate > 1 ? crossRate : (rate > 1 ? rate : lastKnownFxRate);
          const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : (effRate > 0 ? Number((rawAmt / effRate).toFixed(2)) : null);
          const baseAmt = defaultCurr === 'TRY' ? rawAmt : convertCurrency(rawAmt, 'TRY', defaultCurr);
          enrichedExcelTxs.push({
            ...tx,
            statementCurr: txCrossCurr,
            statementAmt: fxAmt || 0,
            statementRate: effRate,
            fxCurr: 'TRY',
            fxAmt: rawAmt,
            fxRate: effRate,
            baseAmt,
            targetBalCurr: txCrossCurr,
            targetBalAmt: fxAmt || 0,
            isCross: true,
            isKurFarki: false,
            crossNote: `${rawAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺ ile Mahsup Edildi (Kur: ${effRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`
          });
          return;
        }

        if (txCurr === defaultCurr && primaryFxCurr) {
          enrichedExcelTxs.push({
            ...tx,
            statementCurr: defaultCurr,
            statementAmt: rawAmt,
            statementRate: 1,
            fxCurr: primaryFxCurr,
            fxAmt: 0,
            fxRate: 1,
            baseAmt: rawAmt,
            targetBalCurr: primaryFxCurr,
            targetBalAmt: 0,
            isCross: false,
            isKurFarki
          });
          return;
        }

        const baseAmt = convertCurrency(rawAmt, txCurr, defaultCurr, tx.exchange_rate);
        const effDisplayRate = txCurr === 'TRY' ? getTryRate(defaultCurr) : getTryRate(txCurr, tx.exchange_rate);
        const fxCurr = txCrossCurr || defaultCurr;
        const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : baseAmt;
        enrichedExcelTxs.push({
          ...tx,
          statementCurr: txCurr,
          statementAmt: rawAmt,
          statementRate: effDisplayRate,
          fxCurr,
          fxAmt,
          fxRate: crossRate > 1 ? crossRate : effDisplayRate,
          baseAmt,
          targetBalCurr: txCurr,
          targetBalAmt: rawAmt,
          isCross: Boolean(txCrossCurr && txCrossCurr !== txCurr),
          isKurFarki
        });
        return;
      }

      // Single Currency Excel Export (selectedCurrency !== 'ALL')
      const activeTabCurr = selectedCurrency.toUpperCase();
      const targetLedgerCurr = (txCurr !== 'TRY')
        ? txCurr
        : (txCrossCurr && txCrossCurr !== 'TRY' ? txCrossCurr : 'TRY');

      // Transactions belonging to a different currency ledger MUST NOT appear in this statement!
      if (targetLedgerCurr !== activeTabCurr) {
        return;
      }

      if (txCurr === activeTabCurr) {
        const hasTryCross = Boolean(txCrossCurr && txCrossCurr !== activeTabCurr) || descLower.includes('tl tahsilat') || descLower.includes('tl ödeme') || descLower.includes('tl:');
        const effRate = crossRate > 1 ? crossRate : (activeTabCurr === 'TRY' ? 1 : getTryRate(activeTabCurr, tx.exchange_rate));
        const convertedToDefault = convertCurrency(rawAmt, activeTabCurr, defaultCurr, tx.exchange_rate);
        const counterCurr = (txCrossCurr && txCrossCurr !== activeTabCurr) ? txCrossCurr : (activeTabCurr === 'TRY' ? defaultCurr : 'TRY');
        const convCounter = convertCurrency(rawAmt, activeTabCurr, counterCurr, effRate);
        const counterAmt = rawCrossAmt > 0 ? rawCrossAmt : convCounter;
        enrichedExcelTxs.push({
          ...tx,
          statementCurr: activeTabCurr,
          statementAmt: rawAmt,
          statementRate: effRate,
          fxCurr: hasTryCross ? counterCurr : (activeTabCurr !== defaultCurr ? defaultCurr : ''),
          fxAmt: hasTryCross ? counterAmt : (activeTabCurr !== defaultCurr ? convertedToDefault : 0),
          fxRate: effRate,
          baseAmt: convertedToDefault,
          targetBalCurr: activeTabCurr,
          targetBalAmt: rawAmt,
          isCross: hasTryCross,
          isKurFarki: false,
          crossNote: hasTryCross ? `${Number(counterAmt).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${counterCurr === 'TRY' ? '₺' : counterCurr} ile Mahsup Edildi (Kur: ${effRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})` : undefined
        });
        return;
      }

      if (txCurr === 'TRY' && txCrossCurr === activeTabCurr) {
        const effRate = crossRate > 1 ? crossRate : getTryRate(activeTabCurr, tx.exchange_rate);
        const fxAmt = rawCrossAmt > 0 ? rawCrossAmt : (effRate > 0 ? Number((rawAmt / effRate).toFixed(2)) : 0);
        const baseAmt = convertCurrency(fxAmt, activeTabCurr, defaultCurr, effRate);
        enrichedExcelTxs.push({
          ...tx,
          statementCurr: activeTabCurr,
          statementAmt: fxAmt,
          statementRate: effRate,
          fxCurr: 'TRY',
          fxAmt: rawAmt,
          fxRate: effRate,
          baseAmt,
          targetBalCurr: activeTabCurr,
          targetBalAmt: fxAmt,
          isCross: true,
          isKurFarki: false,
          crossNote: `${rawAmt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺ ile Mahsup Edildi (Kur: ${effRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })})`
        });
        return;
      }
    });

    const filteredTxs = enrichedExcelTxs;
    
    const runningBalancesByCurr: Record<string, number> = { ...openingBalances };
    let runningStatementBal = Number(openingBalances[selectedCurrency] || 0);
    let runningBaseBalance = 0;
    let totalBaseDebit = 0;
    let totalBaseCredit = 0;
    const totalOrigDebitByCurr: Record<string, number> = {};
    const totalOrigCreditByCurr: Record<string, number> = {};

    const data: any[] = [];

    const formatCleanDescription = (rawDesc: string, crossNote?: string) => {
      const cleaned = (rawDesc || '')
        .replace(/^\[(?:Belge|Evrak|Ref|Dekont|Makbuz|Fiş):\s*[^\]]+\]\s*/gi, '')
        .replace(/\[(?:Belge|Evrak|Ref|Dekont|Makbuz|Fiş):\s*[^\]]+\]\s*/gi, '')
        .replace(/\[(?:TL\s*(?:Tahsilat|Ödeme|Karşılığı)|Cross\s*TRY):\s*[^\]]+\]\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (crossNote && cleaned) {
        if (cleaned.toLowerCase().includes('mahsubu')) return cleaned;
        return `${cleaned} (${crossNote})`;
      }
      return crossNote || cleaned || '';
    };

    const pushOpeningRow = (currKey: string, obVal: number) => {
      const ob = Number(obVal || 0);
      if (Math.abs(ob) < 0.005) return;
      const c = currKey.toUpperCase();
      const rate = c === 'TRY' ? getTryRate(defaultCurr) : getTryRate(c);
      const obBase = convertCurrency(ob, c, defaultCurr);
      runningBaseBalance = Number((runningBaseBalance + obBase).toFixed(2));

      const origDebit = ob > 0 ? Number(ob.toFixed(2)) : 0;
      const origCredit = ob < 0 ? Number(Math.abs(ob).toFixed(2)) : 0;
      const baseDebit = obBase > 0 ? obBase : 0;
      const baseCredit = obBase < 0 ? Math.abs(obBase) : 0;

      totalOrigDebitByCurr[c] = Number(((totalOrigDebitByCurr[c] || 0) + origDebit).toFixed(2));
      totalOrigCreditByCurr[c] = Number(((totalOrigCreditByCurr[c] || 0) + origCredit).toFixed(2));
      totalBaseDebit = Number((totalBaseDebit + baseDebit).toFixed(2));
      totalBaseCredit = Number((totalBaseCredit + baseCredit).toFixed(2));

      const rowObj: Record<string, any> = {
        [isTr ? 'Tarih' : 'Date']: transactionStartDate ? formatDateTR(transactionStartDate, false, '') : '-',
        [isTr ? 'İşlem Türü' : 'Transaction Type']: isTr ? 'Devreden Bakiye' : 'Opening Balance',
        [isTr ? 'Fatura / Belge No' : 'Invoice / Document No']: '-',
        [isTr ? 'Kapattığı / İlişkili Fatura' : 'Closed / Linked Invoice']: '-',
        [isTr ? 'Açıklama' : 'Description']: isTr ? `Önceki Dönemden Devreden Bakiye (${c})` : `Carry-Over Opening Balance (${c})`,
        [isTr ? 'Para Birimi' : 'Currency']: c,
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: Number(rate.toFixed(4)),
        [isTr ? 'Döviz Borç' : 'FX Debit']: c !== defaultCurr ? origDebit : 0,
        [isTr ? 'Döviz Alacak' : 'FX Credit']: c !== defaultCurr ? origCredit : 0,
        [isTr ? 'Döviz Bakiye' : 'FX Balance']: c !== defaultCurr ? Number(ob.toFixed(2)) : 0,
        [isTr ? 'Döviz Bakiye Yönü' : 'FX Balance Dir']: c !== defaultCurr ? (ob > 0.005 ? (isTr ? 'Borç (B)' : 'DR') : ob < -0.005 ? (isTr ? 'Alacak (A)' : 'CR') : (isTr ? '0,00 (Kapalı)' : '0.00')) : '-',
        [isTr ? `Borç (${defaultCurr})` : `Debit (${defaultCurr})`]: baseDebit,
        [isTr ? `Alacak (${defaultCurr})` : `Credit (${defaultCurr})`]: baseCredit
      };
      if (selectedCurrency === 'ALL') {
        rowObj[isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined Balance (${defaultCurr})`] = runningBaseBalance;
        rowObj[isTr ? `Bakiye Yönü (${defaultCurr})` : `Balance Dir (${defaultCurr})`] = runningBaseBalance > 0.005 ? (isTr ? 'Borç (B)' : 'DR') : runningBaseBalance < -0.005 ? (isTr ? 'Alacak (A)' : 'CR') : (isTr ? '0,00 (Kapalı)' : '0.00');
      }
      data.push(rowObj);
    };

    if (selectedCurrency === 'ALL') {
      Object.entries(openingBalances).forEach(([currKey, obVal]) => {
        pushOpeningRow(currKey, Number(obVal || 0));
      });
    } else if (openingBalances[selectedCurrency]) {
      pushOpeningRow(selectedCurrency, Number(openingBalances[selectedCurrency] || 0));
    }

    filteredTxs.forEach(t_item => {
      const docNo = resolveDocNo(t_item);
      const closedInvNo = resolveClosedInvNo(t_item);
      const txType = resolveTxTypeLabel(t_item);
      const amt = Number(t_item.statementAmt || t_item.amount || 0);
      const curr = (t_item.statementCurr || t_item.currency || defaultCurr).toUpperCase();
      const rate = Number(t_item.statementRate || resolveRate(curr, t_item.exchange_rate));
      const baseAmt = Number(t_item.baseAmt !== undefined ? t_item.baseAmt : convertCurrency(amt, curr, defaultCurr, t_item.exchange_rate));
      const isDebt = t_item.type === 'debt';

      const fxTargetCurr = (t_item.targetBalCurr && t_item.targetBalCurr !== defaultCurr)
        ? String(t_item.targetBalCurr).toUpperCase()
        : (curr !== defaultCurr ? curr : (primaryFxCurr || ''));

      const fxMovAmt = (t_item.targetBalCurr && t_item.targetBalCurr !== defaultCurr)
        ? Number(t_item.targetBalAmt ?? t_item.fxAmt ?? 0)
        : (curr !== defaultCurr ? amt : 0);

      if (fxTargetCurr) {
        if (runningBalancesByCurr[fxTargetCurr] === undefined) {
          runningBalancesByCurr[fxTargetCurr] = Number(openingBalances[fxTargetCurr] || 0);
        }
        if (fxMovAmt > 0) {
          if (isDebt) {
            runningBalancesByCurr[fxTargetCurr] = Number((runningBalancesByCurr[fxTargetCurr] + fxMovAmt).toFixed(2));
          } else {
            runningBalancesByCurr[fxTargetCurr] = Number((runningBalancesByCurr[fxTargetCurr] - fxMovAmt).toFixed(2));
          }
        }
      }

      if (curr === defaultCurr) {
        if (runningBalancesByCurr[defaultCurr] === undefined) {
          runningBalancesByCurr[defaultCurr] = Number(openingBalances[defaultCurr] || 0);
        }
        if (isDebt) {
          runningBalancesByCurr[defaultCurr] = Number((runningBalancesByCurr[defaultCurr] + baseAmt).toFixed(2));
        } else {
          runningBalancesByCurr[defaultCurr] = Number((runningBalancesByCurr[defaultCurr] - baseAmt).toFixed(2));
        }
      }

      if (isDebt) {
        runningStatementBal = Number((runningStatementBal + (selectedCurrency !== defaultCurr && selectedCurrency !== 'ALL' ? fxMovAmt : amt)).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance + baseAmt).toFixed(2));
      } else {
        runningStatementBal = Number((runningStatementBal - (selectedCurrency !== defaultCurr && selectedCurrency !== 'ALL' ? fxMovAmt : amt)).toFixed(2));
        runningBaseBalance = Number((runningBaseBalance - baseAmt).toFixed(2));
      }

      const fxDebit = isDebt && fxMovAmt > 0 ? Number(fxMovAmt.toFixed(2)) : 0;
      const fxCredit = !isDebt && fxMovAmt > 0 ? Number(fxMovAmt.toFixed(2)) : 0;
      const baseDebit = isDebt ? baseAmt : 0;
      const baseCredit = !isDebt ? baseAmt : 0;

      if (fxTargetCurr && (fxDebit > 0 || fxCredit > 0)) {
        totalOrigDebitByCurr[fxTargetCurr] = Number(((totalOrigDebitByCurr[fxTargetCurr] || 0) + fxDebit).toFixed(2));
        totalOrigCreditByCurr[fxTargetCurr] = Number(((totalOrigCreditByCurr[fxTargetCurr] || 0) + fxCredit).toFixed(2));
      }
      if (curr === defaultCurr) {
        totalOrigDebitByCurr[defaultCurr] = Number(((totalOrigDebitByCurr[defaultCurr] || 0) + baseDebit).toFixed(2));
        totalOrigCreditByCurr[defaultCurr] = Number(((totalOrigCreditByCurr[defaultCurr] || 0) + baseCredit).toFixed(2));
      }

      totalBaseDebit = Number((totalBaseDebit + baseDebit).toFixed(2));
      totalBaseCredit = Number((totalBaseCredit + baseCredit).toFixed(2));

      const activeFxBalance = fxTargetCurr
        ? Number((runningBalancesByCurr[fxTargetCurr] || 0).toFixed(2))
        : (selectedCurrency !== defaultCurr && selectedCurrency !== 'ALL' ? Number(runningStatementBal.toFixed(2)) : 0);

      const displayCurrLabel = (t_item.isCross && fxTargetCurr && curr === defaultCurr)
        ? `${defaultCurr} (${fxTargetCurr})`
        : curr;

      const rowObj: Record<string, any> = {
        [isTr ? 'Tarih' : 'Date']: formatDateTR(t_item.transaction_date || t_item.date, false, ''),
        [isTr ? 'İşlem Türü' : 'Transaction Type']: txType,
        [isTr ? 'Fatura / Belge No' : 'Invoice / Document No']: docNo || '-',
        [isTr ? 'Kapattığı / İlişkili Fatura' : 'Closed / Linked Invoice']: closedInvNo || '-',
        [isTr ? 'Açıklama' : 'Description']: formatCleanDescription(t_item.description || '', t_item.crossNote),
        [isTr ? 'Para Birimi' : 'Currency']: displayCurrLabel,
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: Number(rate.toFixed(4)),
        [isTr ? 'Döviz Borç' : 'FX Debit']: fxDebit,
        [isTr ? 'Döviz Alacak' : 'FX Credit']: fxCredit,
        [isTr ? 'Döviz Bakiye' : 'FX Balance']: fxTargetCurr ? activeFxBalance : 0,
        [isTr ? 'Döviz Bakiye Yönü' : 'FX Balance Dir']: fxTargetCurr
          ? (activeFxBalance > 0.005 ? (isTr ? 'Borç (B)' : 'DR') : activeFxBalance < -0.005 ? (isTr ? 'Alacak (A)' : 'CR') : (isTr ? '0,00 (Kapalı)' : '0.00'))
          : '-',
        [isTr ? `Borç (${defaultCurr})` : `Debit (${defaultCurr})`]: baseDebit,
        [isTr ? `Alacak (${defaultCurr})` : `Credit (${defaultCurr})`]: baseCredit
      };
      if (selectedCurrency === 'ALL') {
        rowObj[isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined Balance (${defaultCurr})`] = runningBaseBalance;
        rowObj[isTr ? `Bakiye Yönü (${defaultCurr})` : `Balance Dir (${defaultCurr})`] = runningBaseBalance > 0.005 ? (isTr ? 'Borç (B)' : 'DR') : runningBaseBalance < -0.005 ? (isTr ? 'Alacak (A)' : 'CR') : (isTr ? '0,00 (Kapalı)' : '0.00');
      }
      data.push(rowObj);
    });

    if (data.length > 0 && selectedCurrency === 'ALL') {
      data.push({
        [isTr ? 'Tarih' : 'Date']: '',
        [isTr ? 'İşlem Türü' : 'Transaction Type']: '',
        [isTr ? 'Fatura / Belge No' : 'Invoice / Document No']: '',
        [isTr ? 'Kapattığı / İlişkili Fatura' : 'Closed / Linked Invoice']: '',
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

      const finalPrimaryFxBal = primaryFxCurr ? Number((runningBalancesByCurr[primaryFxCurr] || 0).toFixed(2)) : 0;
      const finalPrimaryFxDeb = primaryFxCurr ? Number((totalOrigDebitByCurr[primaryFxCurr] || 0).toFixed(2)) : 0;
      const finalPrimaryFxCred = primaryFxCurr ? Number((totalOrigCreditByCurr[primaryFxCurr] || 0).toFixed(2)) : 0;

      data.push({
        [isTr ? 'Tarih' : 'Date']: '',
        [isTr ? 'İşlem Türü' : 'Transaction Type']: isTr ? 'GENEL TOPLAM' : 'GRAND TOTAL',
        [isTr ? 'Fatura / Belge No' : 'Invoice / Document No']: '-',
        [isTr ? 'Kapattığı / İlişkili Fatura' : 'Closed / Linked Invoice']: '-',
        [isTr ? 'Açıklama' : 'Description']: isTr ? `Birleşik Cari Ekstre Toplamı (${primaryFxCurr ? `${primaryFxCurr} & ` : ''}${defaultCurr})` : `Combined Statement Total (${primaryFxCurr ? `${primaryFxCurr} & ` : ''}${defaultCurr})`,
        [isTr ? 'Para Birimi' : 'Currency']: primaryFxCurr ? `${primaryFxCurr}/${defaultCurr}` : defaultCurr,
        [isTr ? 'Döviz Kuru' : 'Exchange Rate']: '',
        [isTr ? 'Döviz Borç' : 'FX Debit']: primaryFxCurr ? finalPrimaryFxDeb : '',
        [isTr ? 'Döviz Alacak' : 'FX Credit']: primaryFxCurr ? finalPrimaryFxCred : '',
        [isTr ? 'Döviz Bakiye' : 'FX Balance']: primaryFxCurr ? finalPrimaryFxBal : '',
        [isTr ? 'Döviz Bakiye Yönü' : 'FX Balance Dir']: primaryFxCurr
          ? (finalPrimaryFxBal > 0.005 ? (isTr ? 'Borç (B)' : 'DR') : finalPrimaryFxBal < -0.005 ? (isTr ? 'Alacak (A)' : 'CR') : (isTr ? '0,00 (Kapalı)' : '0.00'))
          : '',
        [isTr ? `Borç (${defaultCurr})` : `Debit (${defaultCurr})`]: totalBaseDebit,
        [isTr ? `Alacak (${defaultCurr})` : `Credit (${defaultCurr})`]: totalBaseCredit,
        [isTr ? `Birleşik Bakiye (${defaultCurr})` : `Combined Balance (${defaultCurr})`]: runningBaseBalance,
        [isTr ? `Bakiye Yönü (${defaultCurr})` : `Balance Dir (${defaultCurr})`]: runningBaseBalance > 0.005 ? (isTr ? 'Borç (B)' : 'DR') : runningBaseBalance < -0.005 ? (isTr ? 'Alacak (A)' : 'CR') : (isTr ? '0,00 (Kapalı)' : '0.00')
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:O1');
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const rateCell = ws[XLSX.utils.encode_cell({ r: R, c: 6 })];
      if (rateCell && rateCell.t === 'n') {
        rateCell.z = '#,##0.0000';
      }
      for (const colIdx of [7, 8, 9, 11, 12, 13]) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: colIdx })];
        if (cell && cell.t === 'n') {
          cell.z = '#,##0.00';
        }
      }
    }

    ws['!cols'] = [
      { wch: 13 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 52 },
      { wch: 14 },
      { wch: 13 },
      { wch: 15 },
      { wch: 15 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      ...(selectedCurrency === 'ALL' ? [{ wch: 20 }, { wch: 16 }] : [])
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cari Ekstre');
    XLSX.writeFile(wb, `cari_ekstre_${selectedCompany.title || 'firma'}_${selectedCurrency}_${transactionStartDate ? formatFileDateTR(transactionStartDate) : 'all'}.xlsx`);
  };

  return { handleExportCompanies, handleExportTransactionsPDF, handleExportTransactionsExcel };
};
