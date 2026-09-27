export interface AllergenItem {
  id: string;
  labelTr: string;
  labelEn: string;
  icon: string;
}

export const ALLERGEN_DICTIONARY: Record<string, AllergenItem> = {
  gluten: { id: "gluten", labelTr: "Glüten", labelEn: "Gluten", icon: "🌾" },
  gluten_free: { id: "gluten_free", labelTr: "Glütensiz", labelEn: "Gluten-Free", icon: "🌾" },
  lactose: { id: "lactose", labelTr: "Laktoz / Süt", labelEn: "Lactose / Milk", icon: "🥛" },
  laktoz: { id: "lactose", labelTr: "Laktoz / Süt", labelEn: "Lactose / Milk", icon: "🥛" },
  dairy: { id: "dairy", labelTr: "Süt Ürünleri", labelEn: "Dairy", icon: "🥛" },
  milk: { id: "milk", labelTr: "Süt", labelEn: "Milk", icon: "🥛" },
  nuts: { id: "nuts", labelTr: "Kuruyemiş / Fındık", labelEn: "Tree Nuts", icon: "🌰" },
  tree_nuts: { id: "tree_nuts", labelTr: "Fındık / Ceviz", labelEn: "Tree Nuts", icon: "🌰" },
  sert_kabuklu: { id: "sert_kabuklu", labelTr: "Fındık / Ceviz", labelEn: "Tree Nuts", icon: "🌰" },
  peanuts: { id: "peanuts", labelTr: "Yer Fıstığı", labelEn: "Peanuts", icon: "🥜" },
  fistik: { id: "fistik", labelTr: "Yer Fıstığı", labelEn: "Peanuts", icon: "🥜" },
  egg: { id: "egg", labelTr: "Yumurta", labelEn: "Egg", icon: "🥚" },
  eggs: { id: "eggs", labelTr: "Yumurta", labelEn: "Eggs", icon: "🥚" },
  yumurta: { id: "yumurta", labelTr: "Yumurta", labelEn: "Egg", icon: "🥚" },
  soy: { id: "soy", labelTr: "Soya", labelEn: "Soy", icon: "🌱" },
  soya: { id: "soya", labelTr: "Soya", labelEn: "Soy", icon: "🌱" },
  seafood: { id: "seafood", labelTr: "Deniz Ürünleri", labelEn: "Seafood", icon: "🦐" },
  deniz_kabuklu: { id: "deniz_kabuklu", labelTr: "Deniz Ürünleri", labelEn: "Shellfish", icon: "🦐" },
  shellfish: { id: "shellfish", labelTr: "Kabuklu Deniz Ürünleri", labelEn: "Shellfish", icon: "🦐" },
  crustaceans: { id: "crustaceans", labelTr: "Kabuklu Deniz Ürünleri", labelEn: "Crustaceans", icon: "🦀" },
  molluscs: { id: "molluscs", labelTr: "Yumuşakçalar", labelEn: "Molluscs", icon: "🦪" },
  fish: { id: "fish", labelTr: "Balık", labelEn: "Fish", icon: "🐟" },
  balik: { id: "balik", labelTr: "Balık", labelEn: "Fish", icon: "🐟" },
  celery: { id: "celery", labelTr: "Kereviz", labelEn: "Celery", icon: "🥬" },
  kereviz: { id: "kereviz", labelTr: "Kereviz", labelEn: "Celery", icon: "🥬" },
  mustard: { id: "mustard", labelTr: "Hardal", labelEn: "Mustard", icon: "🌭" },
  hardal: { id: "hardal", labelTr: "Hardal", labelEn: "Mustard", icon: "🌭" },
  sesame: { id: "sesame", labelTr: "Susam", labelEn: "Sesame", icon: "🥯" },
  susam: { id: "susam", labelTr: "Susam", labelEn: "Sesame", icon: "🥯" },
  sulphites: { id: "sulphites", labelTr: "Sülfit", labelEn: "Sulphites", icon: "🍷" },
  sulfites: { id: "sulfites", labelTr: "Sülfit", labelEn: "Sulfites", icon: "🍷" },
  sulfit: { id: "sulfit", labelTr: "Sülfit", labelEn: "Sulphites", icon: "🍷" },
  lupin: { id: "lupin", labelTr: "Acı Bakla", labelEn: "Lupin", icon: "🌸" },
  aci: { id: "aci", labelTr: "Acı / Baharat", labelEn: "Spicy", icon: "🌶️" },
  spicy: { id: "spicy", labelTr: "Acı / Baharat", labelEn: "Spicy", icon: "🌶️" },
  vegan: { id: "vegan", labelTr: "Vegan", labelEn: "Vegan", icon: "🥬" },
  vegetarian: { id: "vegetarian", labelTr: "Vejetaryen", labelEn: "Vegetarian", icon: "🥗" },
  vejetaryen: { id: "vejetaryen", labelTr: "Vejetaryen", labelEn: "Vegetarian", icon: "🥗" },
  sugar_free: { id: "sugar_free", labelTr: "Şekersiz", labelEn: "Sugar-Free", icon: "🍃" },
  pork_free: { id: "pork_free", labelTr: "Domuz Eti İçermez (Helal)", labelEn: "Halal / Pork-Free", icon: "✨" },
};

/**
 * Format a raw allergen string or key into a clean, localized, human-readable label without technical terms or underscores.
 */
export function formatSingleAllergen(rawKey: string, lang = 'tr'): { id: string; label: string; icon: string } {
  if (!rawKey || typeof rawKey !== 'string') {
    return { id: '', label: '', icon: '⚠️' };
  }

  const normalized = rawKey.trim().toLowerCase();
  const found = ALLERGEN_DICTIONARY[normalized];

  if (found) {
    return {
      id: found.id,
      label: lang === 'tr' ? found.labelTr : found.labelEn,
      icon: found.icon
    };
  }

  // Fallback for unlisted keys: clean underscores and capitalize words
  const cleanLabel = rawKey
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

  return {
    id: normalized,
    label: cleanLabel,
    icon: '⚠️'
  };
}

/**
 * Parse any raw input (array, JSON string, comma-separated string) and return formatted allergen items.
 */
export function parseAndFormatAllergens(raw: any, lang = 'tr'): Array<{ id: string; label: string; icon: string }> {
  let list: string[] = [];

  if (Array.isArray(raw)) {
    list = raw.map(item => String(item));
  } else if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          list = parsed.map(item => String(item));
        }
      } catch (e) {
        list = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else {
      list = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const result: Array<{ id: string; label: string; icon: string }> = [];
  const seen = new Set<string>();

  for (const item of list) {
    const formatted = formatSingleAllergen(item, lang);
    if (formatted.label && !seen.has(formatted.label.toLowerCase())) {
      seen.add(formatted.label.toLowerCase());
      result.push(formatted);
    }
  }

  return result;
}

/**
 * Convenience helper to return joined string of formatted allergen labels (e.g. "Glüten, Laktoz / Süt, Deniz Ürünleri")
 */
export function formatAllergensText(raw: any, lang = 'tr'): string {
  const items = parseAndFormatAllergens(raw, lang);
  return items.map(i => i.label).join(', ');
}
