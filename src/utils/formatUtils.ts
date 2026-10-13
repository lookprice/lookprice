
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

export function normalizeVehicleCategory(raw: any): string {
  if (!raw) return '';
  const s = String(raw).toLowerCase().trim().replace(/[-_]/g, ' ');
  if (s.includes('otomobil') || s.includes('sedan') || s.includes('hatchback') || s === 'car' || s === 'binek') return 'otomobil';
  if (s.includes('suv') || s.includes('arazi') || s.includes('crossover') || s.includes('4x4')) return 'suv';
  if (s.includes('hafif ticari') || s.includes('ticari') || s.includes('commercial') || s.includes('minivan') || s.includes('panelvan')) return 'hafif_ticari';
  if (s.includes('pickup') || s.includes('pick up') || s.includes('kamyonet')) return 'pickup';
  return s;
}

export function getVehicleCategoryDisplayName(catKey: string, lang: string = 'tr'): string {
  const norm = normalizeVehicleCategory(catKey);
  if (norm === 'otomobil') return lang === 'tr' ? 'Otomobil' : 'Car';
  if (norm === 'suv') return lang === 'tr' ? 'SUV / Arazi Aracı' : 'SUV / Off-Road';
  if (norm === 'hafif_ticari') return lang === 'tr' ? 'Hafif Ticari' : 'Light Commercial';
  if (norm === 'pickup') return lang === 'tr' ? 'Pick-up' : 'Pick-up';
  return catKey;
}

/**
 * Safely parses any date input (ISO string, Date object, timestamp, or Turkish DD/MM/YYYY / DD.MM.YYYY string)
 * without falling into the US MM/DD/YYYY trap.
 */
export function parseSafeDateTR(input?: string | number | Date | null): Date | null {
  if (input === null || input === undefined || input === '') return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  const str = String(input).trim();
  if (!str) return null;

  // Match DD/MM/YYYY or DD.MM.YYYY or DD/MM/YY or DD.MM.YY with optional HH:mm(:ss)
  const trMatch = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (trMatch) {
    let p1 = parseInt(trMatch[1], 10);
    let p2 = parseInt(trMatch[2], 10);
    let year = parseInt(trMatch[3], 10);
    if (year < 100) year += 2000;
    // In TR format, p1 is day and p2 is month; only swap if p2 > 12 and p1 <= 12
    const day = (p2 > 12 && p1 <= 12) ? p2 : p1;
    const month = (p2 > 12 && p1 <= 12) ? p1 - 1 : p2 - 1;
    const hours = trMatch[4] ? parseInt(trMatch[4], 10) : 0;
    const minutes = trMatch[5] ? parseInt(trMatch[5], 10) : 0;
    const seconds = trMatch[6] ? parseInt(trMatch[6], 10) : 0;
    const d = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(d.getTime()) ? null : d;
  }

  // Match YYYY-MM-DD (date-only ISO) in local time to prevent UTC timezone day-shift
  const isoDateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateOnly) {
    const d = new Date(
      parseInt(isoDateOnly[1], 10),
      parseInt(isoDateOnly[2], 10) - 1,
      parseInt(isoDateOnly[3], 10)
    );
    return isNaN(d.getTime()) ? null : d;
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats any date strictly into Turkish dd/mm/yy format (e.g. "08/10/26"),
 * or "dd/mm/yy HH:mm" when includeTime is true.
 */
export function formatDateTR(input?: string | number | Date | null, includeTime: boolean = false, fallback: string = '-'): string {
  const d = parseSafeDateTR(input);
  if (!d) return fallback;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  if (!includeTime) {
    return `${dd}/${mm}/${yy}`;
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

/**
 * Formats any date strictly into Turkish dd/mm/yy HH:mm format (e.g. "08/10/26 14:30").
 */
export function formatDateTimeTR(input?: string | number | Date | null, fallback: string = '-'): string {
  return formatDateTR(input, true, fallback);
}

/**
 * Formats a date for file names in dd-mm-yy format (since '/' is not allowed in file names).
 */
export function formatFileDateTR(input: string | number | Date = new Date()): string {
  const d = parseSafeDateTR(input) || new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}


