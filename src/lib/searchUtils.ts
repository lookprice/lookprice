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

/**
 * Comprehensive Invoice Search Helper (Sales & Purchase Invoices)
 * Matches any token against any field belonging to an invoice:
 * - invoice_number, document_number, return_invoice_number, waybill_number, ettn
 * - customer_name, company_title, company_name, supplier_name, sale_customer_name
 * - tax_number, resolved_tax_number, tax_office, address, email, phone
 * - status, integration_status, e_document_type, invoice_profile, payment_method, currency
 * - formatted and raw dates, amounts (total_amount, tax_amount, grand_total)
 * - notes, cancellation/integration messages, and all invoice line items (product_name, barcode, product_code, variant_name)
 */
export const matchesInvoiceSearch = (inv: any, search: string): boolean => {
  if (!inv) return false;
  const trimmed = search ? search.trim() : "";
  if (!trimmed) return true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  // Format date variants (DD/MM/YYYY, DD.MM.YYYY, DD/MM/YY, YYYY-MM-DD)
  const dateVariants: string[] = [];
  if (inv.invoice_date) {
    const rawDate = String(inv.invoice_date);
    dateVariants.push(rawDate);
    try {
      const d = new Date(inv.invoice_date);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = String(d.getFullYear());
        const yy = yyyy.slice(-2);
        dateVariants.push(`${dd}/${mm}/${yyyy}`, `${dd}.${mm}.${yyyy}`, `${dd}/${mm}/${yy}`, `${dd}.${mm}.${yy}`, `${yyyy}-${mm}-${dd}`);
      }
    } catch {}
  }

  // Amount variants (raw and Turkish formatted)
  const amountVariants: string[] = [];
  [inv.total_amount, inv.tax_amount, inv.grand_total].forEach((amt) => {
    if (amt !== undefined && amt !== null && amt !== "") {
      const num = Number(amt);
      amountVariants.push(String(amt));
      if (!isNaN(num)) {
        amountVariants.push(num.toFixed(2));
        amountVariants.push(num.toFixed(2).replace('.', ','));
        try {
          amountVariants.push(num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } catch {}
      }
    }
  });

  // Status & type human-readable Turkish/English labels shown in table badges
  const statusLabels: string[] = [];
  const rawSt = String(inv.status || '').toLowerCase().trim();
  const intSt = String(inv.integration_status || '').toUpperCase().trim();
  if (['approved', 'completed', 'onaylandi', 'onaylandı'].includes(rawSt) || ['APPROVED', 'ONAYLANDI', 'BAŞARILI', '1300', 'SUCCESS'].includes(intSt)) {
    statusLabels.push('onaylı', 'onaylandi', 'onaylanan', 'gib onay', 'approved', 'kabul edildi');
  }
  if (['draft', 'taslak'].includes(rawSt) || intSt === 'DRAFT') {
    statusLabels.push('taslak', 'draft');
  }
  if (['pending'].includes(rawSt)) {
    statusLabels.push('bekleyen', 'pending');
  }
  if (['QUEUED', 'KUYRUKTA', 'İŞLENİYOR', 'İLETİLİYOR'].includes(intSt)) {
    statusLabels.push('gib kuyruk', 'kuyrukta', 'queued');
  }
  if (['cancelled', 'iptal', 'iptal edildi'].includes(rawSt) || ['CANCELLED', 'İPTAL', 'İPTAL EDİLDİ', 'REJECTED', 'HATALI', 'HATA'].includes(intSt) || inv.sale_status === 'cancelled') {
    statusLabels.push('iptal', 'iptal edildi', 'reddedildi', 'hatalı', 'hata', 'cancelled', 'rejected');
  }

  const pmLower = String(inv.payment_method || '').toLowerCase().trim();
  if (pmLower === 'term' || pmLower === 'vadeli') statusLabels.push('vadeli', 'term', 'acik hesap', 'açık hesap');
  if (pmLower === 'cash' || pmLower === 'nakit') statusLabels.push('nakit', 'cash');
  if (pmLower === 'credit_card' || pmLower === 'kredi_karti') statusLabels.push('kredi kartı', 'kredi karti', 'pos');
  if (pmLower === 'bank' || pmLower === 'havale') statusLabels.push('havale', 'eft', 'banka');

  if (inv.is_expense) statusLabels.push('gider', 'expense', inv.expense_category || '', inv.expense_center || '');
  else statusLabels.push('stoklu alım', 'stoklu alim');

  const docProfile = `${inv.e_document_type || ''} ${inv.invoice_profile || ''} ${inv.invoice_type || ''}`.toUpperCase();
  if (docProfile.includes('EARSIV') || docProfile.includes('ARŞİV') || docProfile.includes('ARSIV')) {
    statusLabels.push('e-arşiv', 'e-arsiv', 'earsiv', 'earşiv');
  }
  if (docProfile.includes('EFATURA') || docProfile.includes('E-FATURA') || docProfile.includes('TEMEL') || docProfile.includes('TICARI')) {
    statusLabels.push('e-fatura', 'efatura', 'ticari fatura', 'temel fatura');
  }

  // Line items text
  const itemsText = Array.isArray(inv.items)
    ? inv.items.map((it: any) => [
        it.product_name,
        it.barcode,
        it.product_code,
        it.matched_product_name,
        it.matched_product_barcode,
        it.matched_product_code,
        it.variant_name,
        it.quantity,
        it.unit_price,
        it.total_price
      ].filter(Boolean).join(" ")).join(" ")
    : "";

  const searchableFields = [
    inv.id ? `#${inv.id}` : "",
    inv.invoice_number,
    inv.invoice_number ? `#${inv.invoice_number}` : "",
    inv.document_number,
    inv.document_number ? `#${inv.document_number}` : "",
    inv.return_invoice_number,
    inv.waybill_number,
    inv.ettn,
    inv.customer_name,
    inv.company_title,
    inv.company_name,
    inv.supplier_name,
    inv.sale_customer_name,
    inv.tax_number,
    inv.resolved_tax_number,
    inv.supplier_tax_no,
    inv.customer_tax_number,
    inv.company_tax_number,
    inv.tax_office,
    inv.customer_tax_office,
    inv.company_tax_office,
    inv.address,
    inv.customer_address,
    inv.company_address,
    inv.customer_city,
    inv.customer_email,
    inv.email,
    inv.company_email,
    inv.customer_phone,
    inv.phone,
    inv.notes,
    inv.sale_cancellation_reason,
    inv.integration_message,
    inv.payment_method,
    inv.payment_status,
    inv.currency,
    inv.status,
    inv.integration_status,
    inv.e_document_type,
    inv.invoice_profile,
    inv.invoice_type,
    inv.gi_invoice_type,
    ...dateVariants,
    ...amountVariants,
    ...statusLabels,
    itemsText
  ].filter(Boolean).map(String);

  const rawCombined = searchableFields.join(" ");
  const normCombined = normalizeSearch(rawCombined);
  const dePunctCombined = normCombined.replace(/[-_/.+#]/g, " ");
  const strippedCombined = normCombined.replace(/[-_/.+#\s]/g, "");

  return tokens.every(rawToken => {
    const cleanRaw = rawToken.replace(/^#+/, "") || rawToken;
    const token = normalizeSearch(cleanRaw);
    if (!token) return true;

    if (normCombined.includes(token) || dePunctCombined.includes(token)) return true;

    const strippedToken = token.replace(/[-_/.+#]/g, "");
    if (strippedToken && (normCombined.includes(strippedToken) || dePunctCombined.includes(strippedToken) || strippedCombined.includes(strippedToken))) {
      return true;
    }

    return false;
  });
};

