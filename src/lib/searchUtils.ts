/**
 * Normalizes a string for search, especially handling Turkish characters
 * and case-insensitivity.
 */
export const normalizeSearch = (text: string): string => {
  if (!text) return "";
  
  // First convert to Turkish lowercase to handle İ -> i and I -> ı
  let normalized = text.toLocaleLowerCase('tr-TR');
  
  // Replace Turkish special characters with normalized equivalents for ultra-tolerant matching
  normalized = normalized
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');
  
  return normalized;
};

/**
 * Checks if a search term matches any of the fields in an object (progressive AND across tokens)
 */
export const matchesSearch = (item: any, search: string, fields: string[]): boolean => {
  const trimmed = search ? search.trim() : "";
  if (!trimmed) return true;
  
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  
  // Build searchable text from all requested fields
  const fieldValues = fields.map(field => {
    const v = item[field];
    return v !== undefined && v !== null ? String(v) : "";
  }).filter(Boolean);

  const rawCombined = fieldValues.join(" ");
  const normCombined = normalizeSearch(rawCombined);
  const dePunctCombined = normCombined.replace(/[-_/.+]/g, " ");

  return tokens.every(rawToken => {
    const token = normalizeSearch(rawToken);
    if (!token) return true;

    // Direct match in fields
    if (normCombined.includes(token) || dePunctCombined.includes(token)) return true;

    // Token with punctuation (e.g. "usb-c")
    const dePunctToken = token.replace(/[-_/.+]/g, " ");
    if (dePunctCombined.includes(dePunctToken)) return true;
    const strippedToken = token.replace(/[-_/.+]/g, "");
    if (normCombined.includes(strippedToken) || dePunctCombined.includes(strippedToken)) return true;

    // Technical synonym mapping: usb-c <-> type-c
    if (token === "usb-c" || token === "usbc" || token === "type-c" || token === "typec") {
      if (normCombined.includes("type-c") || normCombined.includes("type c") || normCombined.includes("typec") ||
          normCombined.includes("usb-c") || normCombined.includes("usb c") || normCombined.includes("usbc")) {
        return true;
      }
    }

    // Barcode partial match ONLY if token is digits and at least 3 digits
    if (/^\d{3,}$/.test(token) && item.barcode && String(item.barcode).includes(token)) {
      return true;
    }

    return false;
  });
};

/**
 * Product-specific search that matches across all identity, barcode, marketplace and detail fields.
 * Enforces progressive AND filtering:
 * - typing "dell" matches dell products (37 results)
 * - adding "65w" narrows down exclusively to dell products with 65w (2 results)
 * - adding "usb-c" retains the Dell 65W USB Type-C chargers without matching unrelated products
 * - eliminates false positive digit matches on barcodes
 */
export const matchProductSearch = (p: any, search: string): boolean => {
  const trimmed = search ? search.trim() : "";
  if (!trimmed) return true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const altBarcodes = (() => {
    let sec = p.sector_data;
    if (typeof sec === "string") {
      try { sec = JSON.parse(sec); } catch { sec = {}; }
    }
    return Array.isArray(sec?.alternate_barcodes) ? sec.alternate_barcodes : [];
  })();

  const variantText = Array.isArray(p.variants) 
    ? p.variants.map((v: any) => `${v.name || ''} ${v.barcode || ''} ${v.sku || ''}`).join(" ")
    : "";

  const searchableFields = [
    p.name,
    p.barcode,
    ...altBarcodes,
    p.sku,
    p.product_code,
    p.brand,
    p.category,
    p.sub_category,
    p.category_2,
    p.sub_category_2,
    p.description,
    p.hepsiburada_sku,
    p.amazon_asin,
    p.n11_id,
    p.trendyol_id,
    p.store_name,
    variantText
  ].filter(Boolean).map(String);

  const rawCombined = searchableFields.join(" ");
  const normCombined = normalizeSearch(rawCombined);
  const dePunctCombined = normCombined.replace(/[-_/.+]/g, " ");

  return tokens.every(rawToken => {
    const token = normalizeSearch(rawToken);
    if (!token) return true;

    // 1. Direct match in combined fields
    if (normCombined.includes(token) || dePunctCombined.includes(token)) return true;

    // 2. Technical punctuation match (e.g. "usb-c" -> "usb c" / "usbc")
    const dePunctToken = token.replace(/[-_/.+]/g, " ");
    if (dePunctCombined.includes(dePunctToken)) return true;
    const strippedToken = token.replace(/[-_/.+]/g, "");
    if (normCombined.includes(strippedToken) || dePunctCombined.includes(strippedToken)) return true;

    // 3. Technical synonyms: usb-c <-> type-c
    if (token === "usb-c" || token === "usbc" || token === "type-c" || token === "typec") {
      if (normCombined.includes("type-c") || normCombined.includes("type c") || normCombined.includes("typec") ||
          normCombined.includes("usb-c") || normCombined.includes("usb c") || normCombined.includes("usbc")) {
        return true;
      }
    }

    // 4. Barcode partial match ONLY if token is digits and at least 3 digits (never for random short numbers extracted from letters)
    if (/^\d{3,}$/.test(token)) {
      if (p.barcode && String(p.barcode).includes(token)) return true;
      if (altBarcodes.some((b: any) => String(b).includes(token))) return true;
    }

    return false;
  });
};
