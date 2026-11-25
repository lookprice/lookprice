/**
 * Normalizes a string for search, especially handling Turkish characters,
 * Unicode diacritics, apostrophes, and case-insensitivity.
 */
export const normalizeSearch = (text: string): string => {
  if (!text) return "";

  // First convert using Turkish locale so İ -> i and I -> ı consistently, and remove combining dot above
  let normalized = String(text).toLocaleLowerCase('tr-TR').replace(/\u0307/g, '');

  // Replace Turkish special characters before NFD decomposition
  normalized = normalized
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u');

  // Fold remaining Unicode accents/diacritics (e.g. é -> e, á -> a, ñ -> n) and normalize apostrophes
  normalized = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘ʼ`´]/g, "'");

  return normalized;
};

const parseSectorData = (item: any): Record<string, any> => {
  let sec = item?.sector_data;
  if (typeof sec === "string") {
    try { sec = JSON.parse(sec); } catch { sec = {}; }
  }
  return sec && typeof sec === "object" ? sec : {};
};

const getNestedFieldValue = (item: any, field: string): any => {
  if (!item || !field) return undefined;
  if (!field.includes(".")) return item[field];
  const [root, ...rest] = field.split(".");
  let current: any = root === "sector_data" ? parseSectorData(item) : item[root];
  for (const part of rest) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
};

// Bidirectional author surname/name transliteration clusters (normalized lowercase ASCII)
const AUTHOR_TRANSLITERATION_GROUPS: string[][] = [
  ['dostoyevski', 'dostoevsky', 'dostoevskii', 'dostojewski', 'dostoievski', 'dostoyevsky'],
  ['cehov', 'chekhov', 'chehov', 'tchekhov'],
  ['tolstoy', 'tolstoi', 'tolstoj'],
  ['puskin', 'pushkin', 'pouchkine'],
  ['gorki', 'gorky', 'gorkiy'],
  ['turgenyev', 'turgenev'],
  ['soljenitsin', 'solzhenitsyn'],
  ['sekspir', 'shakespeare'],
  ['mayakovski', 'mayakovsky', 'majakovski'],
  ['cibran', 'gibran'],
  ['flober', 'flaubert'],
  ['mopasan', 'maupassant'],
  ['zvayg', 'zweig'],
  ['markez', 'marquez'],
  ['borhes', 'borges'],
  ['dikens', 'dickens'],
  ['hemingvey', 'hemingway'],
  ['orvel', 'orwell'],
  ['bukovski', 'bukowski'],
  ['kristi', 'christie'],
  ['balzak', 'balzac'],
  ['vern', 'verne'],
  ['kamu', 'camus'],
  ['sartr', 'sartre'],
  ['nice', 'nietzsche'],
  ['remark', 'remarque'],
  ['ahmatova', 'akhmatova'],
  ['ostrovski', 'ostrovsky'],
  ['bayron', 'byron'],
  ['servantes', 'cervantes'],
  ['molyer', 'moliere'],
  ['volter', 'voltaire'],
  ['ruso', 'rousseau'],
  ['monteny', 'montaigne'],
  ['platon', 'plato'],
  ['aristo', 'aristotle', 'aristoteles'],
  ['sokrates', 'socrates'],
  ['konfucyus', 'confucius'],
  ['mevlana', 'rumi'],
  ['hayyam', 'khayyam'],
  ['haled', 'khaled'],
  ['huseyni', 'hosseini'],
  ['cengiz', 'chingiz', 'chyngyz'],
  ['aytmatov', 'aitmatov'],
  ['bulgakov', 'boulgakov']
];

const AUTHOR_VARIANT_MAP: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of AUTHOR_TRANSLITERATION_GROUPS) {
    for (const term of group) {
      map.set(term, group);
    }
  }
  return map;
})();

const stripApostropheSuffix = (normToken: string): string => {
  return normToken.replace(
    /'(?:nin|nin|nun|nun|in|in|un|un|yi|yi|yu|yu|ye|ya|da|de|dan|den|ta|te|tan|ten|la|le|i|u|e|a)$/,
    ''
  );
};

export const expandAuthorQueryTerms = (rawTerm: string): string[] => {
  const norm = normalizeSearch(rawTerm).trim();
  if (!norm) return [];
  const bare = stripApostropheSuffix(norm).replace(/[.,;:!?]+$/g, '');
  const variants = new Set<string>([norm, bare]);
  const mapped = AUTHOR_VARIANT_MAP.get(bare);
  if (mapped) {
    mapped.forEach(v => variants.add(v));
  }
  // Handle prefix >= 5 chars matching known author transliterations (e.g. "dostoev" -> "dostoyev")
  if (bare.length >= 5) {
    for (const group of AUTHOR_TRANSLITERATION_GROUPS) {
      if (group.some(g => g.startsWith(bare))) {
        if (bare.startsWith('dostoev')) variants.add('dostoyev');
        else if (bare.startsWith('dostoyev')) variants.add('dostoev');
        else if (bare.startsWith('chekh')) variants.add('cehov');
        else if (bare.startsWith('shakesp')) variants.add('sekspir');
        else if (bare.startsWith('nietz')) variants.add('nice');
        group.forEach(g => variants.add(g));
      }
    }
  }
  return Array.from(variants).filter(Boolean);
};

const evaluateTokenInCorpus = (
  rawToken: string,
  normCombined: string,
  dePunctCombined: string,
  collapsedCombined: string,
  authorCollapsed: string,
  normAuthorText: string,
  barcodeValues: string[]
): boolean => {
  const token = normalizeSearch(rawToken);
  if (!token) return true;

  const bareToken = stripApostropheSuffix(token).replace(/[,;:!?]+$/g, '');
  const cleanCandidates = bareToken && bareToken !== token ? [token, bareToken] : [token];

  for (const cand of cleanCandidates) {
    // 1. Direct match in combined fields
    if (normCombined.includes(cand) || dePunctCombined.includes(cand)) return true;

    // 2. Technical / initials punctuation match (e.g. "usb-c" -> "usb c" / "usbc", "j.k." -> "jk")
    const dePunctToken = cand.replace(/[-_/.+']+/g, ' ').trim();
    if (dePunctToken && dePunctCombined.includes(dePunctToken)) return true;

    const strippedToken = cand.replace(/[-_/.+']+/g, '');
    if (strippedToken) {
      if (normCombined.includes(strippedToken) || dePunctCombined.includes(strippedToken)) return true;
      // Match punctuation-collapsed corpus (e.g. "J. K. Rowling" <-> "JK Rowling", "USB-C" <-> "USBC")
      if (
        (cand !== strippedToken || (authorCollapsed && strippedToken.length >= 2)) &&
        ((authorCollapsed && authorCollapsed.includes(strippedToken)) ||
          (cand !== strippedToken && collapsedCombined.includes(strippedToken)))
      ) {
        return true;
      }
    }

    // 3. Technical synonyms: usb-c <-> type-c
    if (cand === "usb-c" || cand === "usbc" || cand === "type-c" || cand === "typec") {
      if (
        normCombined.includes("type-c") || normCombined.includes("type c") || normCombined.includes("typec") ||
        normCombined.includes("usb-c") || normCombined.includes("usb c") || normCombined.includes("usbc")
      ) {
        return true;
      }
    }

    // 4. Barcode / ISBN partial match ONLY if token is digits and at least 3 digits
    if (/^\d{3,}$/.test(cand)) {
      if (barcodeValues.some(b => b && b.includes(cand))) return true;
    }

    // 5. Bidirectional author transliteration check
    if (normAuthorText) {
      const authorVariants = expandAuthorQueryTerms(cand);
      for (const variant of authorVariants) {
        if (variant !== cand && (normAuthorText.includes(variant) || normCombined.includes(variant))) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Supports multi-word author queries such as "Fyodor Dostoyevski", "Fyodor M. Dostoyevski",
 * "F. Dostoevsky", or "Dostoyevski, Fyodor" even when the product stores surname-only author metadata ("Dostoyevski").
 * Strictly rejects unmatched post-surname words (e.g. "Dostoyevski Budala" against "Suç ve Ceza") and any non-alphabetic spec tokens.
 */
const matchesAuthorSmartFallback = (
  tokens: string[],
  matchedFlags: boolean[],
  normAuthorText: string
): boolean => {
  if (tokens.length < 2 || !normAuthorText || !normAuthorText.trim()) return false;

  const authorWords = normAuthorText
    .replace(/[-_/.+,'()]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (authorWords.length === 0 || authorWords.length > 2) return false;

  const cleanTokenAt = (idx: number) =>
    stripApostropheSuffix(normalizeSearch(tokens[idx])).replace(/[,;:!?]+$/g, '');

  // Locate substantial alphabetic token (>= 4 chars) matching a whole word (or >=5 char prefix) in stored author
  let surnameIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    const clean = cleanTokenAt(i).replace(/\.+$/g, '');
    if (clean.length < 4 || !/^[a-z]+$/.test(clean)) continue;
    const variants = expandAuthorQueryTerms(clean);
    const hitsAuthorWord = authorWords.some((aw) =>
      variants.some((v) => aw === v || (v.length >= 5 && aw.startsWith(v)))
    );
    if (hitsAuthorWord) {
      surnameIdx = i;
    }
  }

  if (surnameIdx === -1) return false;

  const surnameHasComma = normalizeSearch(tokens[surnameIdx]).trim().endsWith(',');

  for (let k = 0; k < tokens.length; k++) {
    if (matchedFlags[k]) continue;

    const clean = cleanTokenAt(k);
    // Unmatched token MUST look strictly like a human given name, middle name, or initial (no digits/hyphens)
    if (!/^[a-z]{1,22}\.?$/.test(clean)) return false;

    const isBeforeSurname = k < surnameIdx;
    const isAfterCommaSurname = surnameHasComma && k > surnameIdx;
    const isInitial = /^[a-z]{1,2}\.$/.test(clean);

    if (!isBeforeSurname && !isAfterCommaSurname && !isInitial) {
      return false;
    }
  }

  return true;
};

/**
 * Checks if a search term matches any of the fields in an object (progressive AND across tokens)
 */
export const matchesSearch = (item: any, search: string, fields: string[]): boolean => {
  const trimmed = search ? search.trim() : "";
  if (!trimmed) return true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const fieldValues = fields
    .map(field => {
      const v = getNestedFieldValue(item, field);
      return v !== undefined && v !== null ? String(v) : "";
    })
    .filter(Boolean);

  const authorFieldValues = fields
    .filter(f => /(^|\.)(author|writer|translator)$/.test(f))
    .map(f => {
      const v = getNestedFieldValue(item, f);
      return v !== undefined && v !== null ? String(v) : "";
    })
    .filter(Boolean);

  const normAuthorText = normalizeSearch(authorFieldValues.join(" "));
  const authorCollapsed = normAuthorText.replace(/[-_/.+'\s]+/g, '');

  const rawCombined = fieldValues.join(" ");
  const normCombined = normalizeSearch(rawCombined);
  const dePunctCombined = normCombined.replace(/[-_/.+']+/g, " ");
  const collapsedCombined = normCombined.replace(/[-_/.+'\s]+/g, "");
  const barcodeValues = item?.barcode ? [String(item.barcode)] : [];

  const matchedFlags = tokens.map(rawToken =>
    evaluateTokenInCorpus(
      rawToken,
      normCombined,
      dePunctCombined,
      collapsedCombined,
      authorCollapsed,
      normAuthorText,
      barcodeValues
    )
  );

  if (matchedFlags.every(Boolean)) return true;

  return matchesAuthorSmartFallback(tokens, matchedFlags, normAuthorText);
};

/**
 * Product-specific search that matches across all identity, barcode, author/publisher, marketplace and detail fields.
 * Enforces progressive AND filtering while also supporting full-name author queries ("Fyodor Dostoyevski")
 * and author transliterations ("Dostoevsky" <-> "Dostoyevski").
 */
export const matchProductSearch = (p: any, search: string): boolean => {
  const trimmed = search ? search.trim() : "";
  if (!trimmed) return true;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const sec = parseSectorData(p);
  const altBarcodes = Array.isArray(sec?.alternate_barcodes) ? sec.alternate_barcodes : [];

  const variantText = Array.isArray(p.variants)
    ? p.variants.map((v: any) => `${v.name || ''} ${v.barcode || ''} ${v.sku || ''}`).join(" ")
    : "";

  const locationText = Array.isArray(p.location_summary)
    ? p.location_summary.map((l: any) => `${l.full_path || ''} ${l.full_code || ''} ${l.name || ''}`).join(" ")
    : "";

  const authorRaw = [p.author, sec.author, sec.writer, sec.translator].filter(Boolean).map(String).join(" ");
  const normAuthorText = normalizeSearch(authorRaw);
  const authorCollapsed = normAuthorText.replace(/[-_/.+'\s]+/g, "");

  const searchableFields = [
    p.name,
    p.barcode,
    sec.isbn,
    ...altBarcodes,
    p.sku,
    p.product_code,
    p.code,
    p.brand,
    p.author,
    sec.author,
    sec.writer,
    sec.translator,
    sec.publisher,
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
    p.default_location_path,
    p.default_location_code,
    locationText,
    variantText
  ].filter(Boolean).map(String);

  const rawCombined = searchableFields.join(" ");
  const normCombined = normalizeSearch(rawCombined);
  const dePunctCombined = normCombined.replace(/[-_/.+']+/g, " ");
  const collapsedCombined = normCombined.replace(/[-_/.+'\s]+/g, "");

  const barcodeValues = [
    p.barcode ? String(p.barcode) : "",
    sec.isbn ? String(sec.isbn) : "",
    ...altBarcodes.map((b: any) => String(b || ""))
  ].filter(Boolean);

  const matchedFlags = tokens.map(rawToken =>
    evaluateTokenInCorpus(
      rawToken,
      normCombined,
      dePunctCombined,
      collapsedCombined,
      authorCollapsed,
      normAuthorText,
      barcodeValues
    )
  );

  if (matchedFlags.every(Boolean)) return true;

  return matchesAuthorSmartFallback(tokens, matchedFlags, normAuthorText);
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

  if (inv.operator_status === 'pending') {
    statusLabels.push('onay bekliyor', 'onay bekleyen', 'operator pending');
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
        it.reserved_for,
        Number(it.reserved_quantity || 0) > 0 ? 'rezerve' : '',
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

