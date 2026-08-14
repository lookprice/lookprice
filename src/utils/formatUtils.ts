
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
    'TRY': { main: 'TL', sub: 'Krş' },
    'USD': { main: 'USD', sub: 'Cent' },
    'EUR': { main: 'EUR', sub: 'Cent' }
  };

  const cur = currencyMap[currency] || { main: currency, sub: '' };
  result += cur.main;

  if (decimalPart > 0) {
    result += convertThreeDigits(decimalPart) + cur.sub;
  }

  return result;
};

export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";
  // Strip all spaces, parenthesis, dashes, and dots
  let cleaned = phone.replace(/[\s()\-.]/g, "");

  // If it starts with +, remove +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // If it starts with 00, remove 00
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // If it starts with 05 (typical Turkey/Cyprus mobile number), replace leading 0 with 90
  if (cleaned.startsWith("05") && cleaned.length === 11) {
    cleaned = "90" + cleaned.substring(1);
  }

  // Double check if it has no country code and has 10 digits starting with 5 (e.g. 5338600000), add 90
  if (cleaned.length === 10 && cleaned.startsWith("5")) {
    cleaned = "90" + cleaned;
  }

  return cleaned;
}

export function formatFuelType(fuel?: string, lang: string = 'tr'): string {
  const isEn = lang === 'en';
  if (!fuel) return isEn ? 'Not Specified' : 'Belirtilmedi';
  const f = String(fuel).toLowerCase().trim();
  const map: Record<string, { tr: string; en: string }> = {
    gasoline: { tr: 'Benzin', en: 'Gasoline' },
    petrol: { tr: 'Benzin', en: 'Gasoline' },
    benzin: { tr: 'Benzin', en: 'Gasoline' },
    diesel: { tr: 'Dizel', en: 'Diesel' },
    dizel: { tr: 'Dizel', en: 'Diesel' },
    lpg: { tr: 'LPG', en: 'LPG' },
    hybrid: { tr: 'Hibrit', en: 'Hybrid' },
    hibrit: { tr: 'Hibrit', en: 'Hybrid' },
    gasoline_hybrid: { tr: 'Benzin / Hibrit', en: 'Gasoline / Hybrid' },
    diesel_hybrid: { tr: 'Dizel / Hibrit', en: 'Diesel / Hybrid' },
    plug_in_hybrid: { tr: 'Plug-in Hibrit', en: 'Plug-in Hybrid' },
    plugin_hybrid: { tr: 'Plug-in Hibrit', en: 'Plug-in Hybrid' },
    mild_hybrid: { tr: 'Mild Hibrit', en: 'Mild Hybrid' },
    electric: { tr: 'Elektrik', en: 'Electric' },
    elektrik: { tr: 'Elektrik', en: 'Electric' },
    elektrikli: { tr: 'Elektrik', en: 'Electric' }
  };
  if (map[f]) return map[f][isEn ? 'en' : 'tr'] || map[f].tr;
  if (f.includes('gasoline_hybrid') || (f.includes('gasoline') && f.includes('hybrid')) || (f.includes('benzin') && f.includes('hibrit'))) {
    return isEn ? 'Gasoline / Hybrid' : 'Benzin / Hibrit';
  }
  if (f.includes('diesel_hybrid') || (f.includes('diesel') && f.includes('hybrid')) || (f.includes('dizel') && f.includes('hibrit'))) {
    return isEn ? 'Diesel / Hybrid' : 'Dizel / Hibrit';
  }
  if (f.includes('plug_in') || f.includes('plugin')) {
    return isEn ? 'Plug-in Hybrid' : 'Plug-in Hibrit';
  }
  if (f.includes('mild')) {
    return isEn ? 'Mild Hybrid' : 'Mild Hibrit';
  }
  if (f.includes('hybrid') || f.includes('hibrit')) {
    return isEn ? 'Hybrid' : 'Hibrit';
  }
  if (f.includes('diesel') || f.includes('dizel')) {
    return isEn ? 'Diesel' : 'Dizel';
  }
  if (f.includes('gasoline') || f.includes('petrol') || f.includes('benzin')) {
    return isEn ? 'Gasoline' : 'Benzin';
  }
  if (f.includes('electric') || f.includes('elektrik')) {
    return isEn ? 'Electric' : 'Elektrik';
  }
  return fuel;
}

export function formatTransmission(trans?: string, lang: string = 'tr'): string {
  const isEn = lang === 'en';
  if (!trans) return isEn ? 'Not Specified' : 'Belirtilmedi';
  const t = String(trans).toLowerCase().trim();
  const map: Record<string, { tr: string; en: string }> = {
    automatic: { tr: 'Otomatik', en: 'Automatic' },
    otomatik: { tr: 'Otomatik', en: 'Automatic' },
    oto: { tr: 'Otomatik', en: 'Automatic' },
    auto: { tr: 'Otomatik', en: 'Automatic' },
    manual: { tr: 'Manuel', en: 'Manual' },
    manuel: { tr: 'Manuel', en: 'Manual' },
    semi_automatic: { tr: 'Yarı Otomatik', en: 'Semi-Automatic' },
    'semi-automatic': { tr: 'Yarı Otomatik', en: 'Semi-Automatic' },
    yari_otomatik: { tr: 'Yarı Otomatik', en: 'Semi-Automatic' },
    yarı_otomatik: { tr: 'Yarı Otomatik', en: 'Semi-Automatic' },
    'yarı otomatik': { tr: 'Yarı Otomatik', en: 'Semi-Automatic' },
    'yari otomatik': { tr: 'Yarı Otomatik', en: 'Semi-Automatic' },
    triptonic: { tr: 'Yarı Otomatik (Tiptronik)', en: 'Semi-Automatic (Tiptronic)' },
    tiptronik: { tr: 'Yarı Otomatik (Tiptronik)', en: 'Semi-Automatic (Tiptronic)' },
    dual_clutch: { tr: 'Çift Kavrama', en: 'Dual Clutch' },
    cift_kavrama: { tr: 'Çift Kavrama', en: 'Dual Clutch' },
    'çift kavrama': { tr: 'Çift Kavrama', en: 'Dual Clutch' }
  };
  if (map[t]) return map[t][isEn ? 'en' : 'tr'] || map[t].tr;
  if (t.includes('semi') || t.includes('yari') || t.includes('yarı') || t.includes('tiptron')) {
    return isEn ? 'Semi-Automatic' : 'Yarı Otomatik';
  }
  if (t.includes('auto') || t.includes('otomat')) {
    return isEn ? 'Automatic' : 'Otomatik';
  }
  if (t.includes('man')) {
    return isEn ? 'Manual' : 'Manuel';
  }
  return trans;
}

export function formatTitleDeedType(deed?: string): string {
  if (!deed) return '';
  const d = String(deed).toLowerCase().trim();
  if (d.includes('esdeger') || d.includes('eşdeğer') || d.includes('equivalent')) return 'Eşdeğer Koçan';
  if (d.includes('turk') || d.includes('türk') || d.includes('turkish')) return 'Türk Koçanı';
  if (d.includes('tahsis') || d.includes('allocation')) return 'Tahsis Koçan';
  if (d.includes('yabanci') || d.includes('yabancı') || d.includes('foreign')) return 'Yabancı Koçan';
  if (d.includes('mustakil') || d.includes('müstakil')) return 'Müstakil Koçan';
  if (d.includes('hisseli')) return 'Hisseli Koçan';
  return deed;
}

export function formatListingIntent(intent?: string): string {
  if (!intent) return '';
  const i = String(intent).toLowerCase().trim();
  if (i === 'rent' || i === 'kiralik' || i === 'kiralık') return 'Kiralık';
  if (i === 'sale' || i === 'satilik' || i === 'satılık' || i === 'sell') return 'Satılık';
  return intent;
}

export function formatVehicleStatus(status?: string): string {
  if (!status) return '';
  const s = String(status).toLowerCase().trim();
  const map: Record<string, string> = {
    in_stock: 'Stokta',
    stokta: 'Stokta',
    reserved: 'Rezerve',
    rezerve: 'Rezerve',
    sold: 'Satıldı',
    satildi: 'Satıldı',
    satıldı: 'Satıldı',
    maintenance: 'Bakımda',
    bakimda: 'Bakımda',
    rented: 'Kiralandı',
    kiralandi: 'Kiralandı'
  };
  return map[s] || status;
}

export function formatBodyType(body?: string): string {
  if (!body) return 'Vasıta';
  const b = String(body).toLowerCase().trim();
  const map: Record<string, string> = {
    sedan: 'Sedan',
    hatchback: 'Hatchback',
    suv: 'SUV / Arazi',
    coupe: 'Kupe',
    cabrio: 'Cabrio / Convertible',
    pickup: 'Pick-up',
    van: 'Panelvan / Minibüs',
    station_wagon: 'Station Wagon',
    hafif_ticari: 'Hafif Ticari'
  };
  return map[b] || body;
}

