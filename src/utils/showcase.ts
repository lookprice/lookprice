import { BOOKSTORE_BADGES } from "../data/bookstoreBadges";

/**
 * Maps raw/technical label keys (e.g. "new_release", "bestseller", "award_winning")
 * into human-friendly, localized display strings.
 */
export const getDisplayLabel = (label: string, lang: string = "tr"): string => {
  const clean = String(label || "").trim();
  if (!clean) return "";
  const lower = clean.toLowerCase();

  // Filter out internal technical/JSON field keys that shouldn't appear as raw tags
  if (
    lower === "curated_badges" || 
    lower === "curated_badge" || 
    lower === "labels" || 
    lower === "sector_data" ||
    lower === "is_new_release" ||
    lower === "is_bestseller"
  ) {
    return "";
  }
  
  if (lower === "yeni_fatura_urunu") {
    return lang === "tr" ? "Yeni Ürün" : "New Item";
  }

  // Check Bookstore Badge definitions
  for (const b of BOOKSTORE_BADGES) {
    if (b.id === lower || b.aliases.includes(lower)) {
      return lang === "tr" ? b.badgeTr : b.badgeEn;
    }
  }

  // Common label mappings
  if (lower === "new" || lower === "yeni" || lower === "new_release" || lower === "new_arrival") {
    return lang === "tr" ? "YENİ" : "NEW";
  }
  if (lower === "bestseller" || lower === "bestsellers" || lower === "cok_satan" || lower === "çoksatan") {
    return lang === "tr" ? "ÇOK SATAN" : "BESTSELLER";
  }
  if (lower === "discount" || lower === "discounted" || lower === "indirim" || lower === "indirimli") {
    return lang === "tr" ? "İNDİRİM" : "DISCOUNT";
  }
  if (lower === "deal" || lower === "kampanya" || lower === "firsat" || lower === "haftanin_firsati") {
    return lang === "tr" ? "FIRSAT" : "DEAL";
  }
  if (lower === "award_winning" || lower === "odullu" || lower === "ödüllü") {
    return lang === "tr" ? "ÖDÜLLÜ ESER" : "AWARD WINNER";
  }
  if (lower === "editors_pick" || lower === "editorun_secimi" || lower === "editörün seçimi") {
    return lang === "tr" ? "EDİTÖRÜN SEÇİMİ" : "EDITOR'S PICK";
  }
  if (lower === "featured_week" || lower === "haftanin_eseri" || lower === "haftanın eseri") {
    return lang === "tr" ? "HAFTANIN ESERİ" : "BOOK OF THE WEEK";
  }
  if (lower === "coming_soon" || lower === "yakinda" || lower === "yakında") {
    return lang === "tr" ? "YAKINDA" : "COMING SOON";
  }

  // Replace underscores and sanitize
  const formatted = clean.replace(/_/g, " ");
  return formatted;
};

export const getLabels = (labels: any, lang: string = "tr"): string[] => {
  if (!labels) return [];
  let list: string[] = [];

  if (Array.isArray(labels)) {
    list = labels.map(l => String(l || "").trim()).filter(Boolean);
  } else if (typeof labels === "string") {
    const trimmed = labels.trim();
    if (!trimmed) return [];
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          list = parsed.map(l => String(l || "").trim()).filter(Boolean);
        }
      } catch (e) {
        // Fallback below
      }
    }
    if (list.length === 0) {
      list = trimmed
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    }
  }

  const seen = new Set<string>();
  const results: string[] = [];

  for (const item of list) {
    const display = getDisplayLabel(item, lang);
    if (display && !seen.has(display.toLowerCase())) {
      seen.add(display.toLowerCase());
      results.push(display);
    }
  }

  return results;
};

export const formatPrice = (price: number, currency: string, sector?: string, storeType?: string) => {
  const isPortfolio = storeType === "real_estate" || storeType === "motor_vehicle" || sector === "real_estate" || sector === "automotive";
  const decimals = isPortfolio ? 0 : 2;
  return `${Number(price).toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency || "TRY"}`;
};
