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
  
  items.forEach(item => {
    const qty = Number(String(item.quantity).replace(',', '.')) || 0;
    const price = Number(String(item.unit_price).replace(',', '.')) || 0;
    const tax = Math.floor(Number(String(item.tax_rate).replace(',', '.')) || 0);
    
    if (isTaxInclusive) {
      const itemTotalIncl = qty * price;
      const itemTotalExcl = itemTotalIncl / (1 + (tax / 100));
      const itemTax = itemTotalIncl - itemTotalExcl;
      subtotal += itemTotalExcl;
      taxTotal += itemTax;
    } else {
      const itemTotal = qty * price;
      const itemTax = itemTotal * (tax / 100);
      subtotal += itemTotal;
      taxTotal += itemTax;
    }
  });
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    grandTotal: Number((subtotal + taxTotal).toFixed(2))
  };
};
