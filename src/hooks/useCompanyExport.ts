import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { translations } from "../translations";

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
    XLSX.writeFile(wb, `${t.companies}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    doc.text(`${fixTr(t.dateRange || 'Date Range')}: ${transactionStartDate} - ${transactionEndDate}`, 14, yPos);
    yPos += 10;

    let runningBalance = openingBalances[selectedCurrency] || 0;
    const filteredTransactions = companyTransactions.filter(tx => (tx.currency || 'TRY') === selectedCurrency);
    const currentBalance = Number(selectedCompany.balances?.[selectedCurrency] || 0);

    const tableData: any[] = [];
    
    if (runningBalance !== 0) {
      tableData.push([
        transactionStartDate,
        fixTr(isTr ? 'Devreden Bakiye' : 'Opening Balance'),
        runningBalance > 0 ? `${runningBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${selectedCurrency.slice(0, 3)}` : "-",
        runningBalance < 0 ? `${Math.abs(runningBalance).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${selectedCurrency.slice(0, 3)}` : "-",
        runningBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')
      ]);
    }

    filteredTransactions.forEach(t_item => {
      const amount = Number(t_item.amount);
      if (t_item.type === 'debt') runningBalance += amount;
      else runningBalance -= amount;
      
      tableData.push([
        t_item.transaction_date.split('T')[0],
        fixTr(t_item.description || ""),
        t_item.type === 'debt' ? `${amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${selectedCurrency.slice(0, 3)}` : "-",
        t_item.type === 'credit' ? `${amount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')} ${selectedCurrency.slice(0, 3)}` : "-",
        runningBalance.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')
      ]);
    });

    autoTable(doc, {
      startY: yPos,
      head: [[
        fixTr(t.statements.date),
        fixTr(t.statements.description),
        fixTr(t.statements.debt),
        fixTr(t.statements.credit),
        fixTr(t.statements.balance)
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${fixTr(t.statements.balance)}: ${currentBalance.toLocaleString(isTr ? 'tr-TR' : 'en-US')} ${selectedCurrency}`, 196, finalY, { align: 'right' });

    doc.save(`${fixTr(t.statements.customerStatement.toLowerCase().replace(/\s+/g, '_'))}_${fixTr(selectedCompany.title)}_${selectedCurrency}_${transactionStartDate}_${transactionEndDate}.pdf`);
  };

  return { handleExportCompanies, handleExportTransactionsPDF };
};
