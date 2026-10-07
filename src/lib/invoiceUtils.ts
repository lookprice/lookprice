export const numberToTurkishWords = (number: number, currency: string = 'TRY') => {
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
    'EUR': { main: 'EUR', sub: 'Cent' },
    'GBP': { main: 'GBP', sub: 'Pence' }
  };

  const cur = currencyMap[currency] || { main: currency, sub: '' };
  result += ' ' + cur.main;

  if (decimalPart > 0) {
    result += " " + convertThreeDigits(decimalPart) + " " + cur.sub;
  }

  return result;
};

export const calculateInvoiceTotals = (items: any[], isTaxInclusive: boolean) => {
  let subtotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;
  
  items.forEach(item => {
    const qty = Number(String(item.quantity).replace(',', '.')) || 0;
    const price = Number(String(item.unit_price).replace(',', '.')) || 0;
    const taxRate = Number(String(item.tax_rate).replace(',', '.')) || 0;
    
    if (isTaxInclusive) {
      const lineIncl = Math.round(qty * price * 100) / 100;
      const lineExcl = Math.round((lineIncl / (1 + (taxRate / 100))) * 100) / 100;
      const lineTax = Math.round((lineIncl - lineExcl) * 100) / 100;
      
      grandTotal += lineIncl;
      taxTotal += lineTax;
      subtotal += lineExcl;
    } else {
      const lineExcl = Math.round(qty * price * 100) / 100;
      const lineTax = Math.round((lineExcl * (taxRate / 100)) * 100) / 100;
      const lineIncl = Math.round((lineExcl + lineTax) * 100) / 100;
      
      subtotal += lineExcl;
      taxTotal += lineTax;
      grandTotal += lineIncl;
    }
  });
  
  const finalGrand = Math.round(grandTotal * 100) / 100;
  const finalTax = Math.round(taxTotal * 100) / 100;
  const finalSub = isTaxInclusive 
    ? Math.round((finalGrand - finalTax) * 100) / 100 
    : Math.round(subtotal * 100) / 100;

  return {
    subtotal: finalSub,
    taxTotal: finalTax,
    grandTotal: finalGrand
  };
};
