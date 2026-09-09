import { Pool } from "pg";

export interface MatchCandidate {
  productId: number;
  barcode: string;
  productCode: string;
  name: string;
  matchType: 'supplier_mapping' | 'barcode' | 'product_code' | 'exact_name' | 'normalized_name' | 'model_token';
}

/**
 * Checks if a string is a valid standard numeric barcode (e.g. EAN-13, EAN-8, UPC, GTIN-14).
 * Must be 8 to 14 numeric digits, without letters or AUTO-/M-/P- prefixes.
 */
export function isValidStandardBarcode(code: string | null | undefined): boolean {
  if (!code) return false;
  const str = String(code).trim();
  if (!str || str.startsWith("AUTO-") || str.startsWith("M-") || str.startsWith("P-") || str.startsWith("TEMP-")) {
    return false;
  }
  // Standard barcodes are strictly numeric digits, 8 to 14 characters long
  return /^[0-9]{8,14}$/.test(str);
}

/**
 * Generates a valid standard 13-digit pseudo-EAN barcode (starting with internal prefix '200')
 */
export function generateTempBarcode(): string {
  const timeStr = Date.now().toString().slice(-9);
  const randomDigit = Math.floor(Math.random() * 10).toString();
  return `200${timeStr}${randomDigit}`;
}

/**
 * Sanitizes incoming barcode & product code values from invoice lines (UBL / XML / Manual).
 * Ensures non-standard barcode strings (like "TRU16977") are routed to productCode,
 * and a valid temporary numeric barcode is generated if no valid standard barcode exists.
 */
export function sanitizeInvoiceItemCodes(
  rawBarcode?: string | null,
  rawSellerCode?: string | null,
  rawBuyerCode?: string | null,
  rawProductCode?: string | null
): { barcode: string; productCode: string | null; isTempBarcode: boolean } {
  const cleanBarcode = rawBarcode ? String(rawBarcode).trim() : null;
  const cleanSeller = rawSellerCode ? String(rawSellerCode).trim() : null;
  const cleanBuyer = rawBuyerCode ? String(rawBuyerCode).trim() : null;
  const cleanProdCode = rawProductCode ? String(rawProductCode).trim() : null;

  // Candidates collected from invoice
  const candidates = [cleanBarcode, cleanProdCode, cleanSeller, cleanBuyer]
    .filter(Boolean)
    .map(c => String(c).trim())
    .filter(c => c.length > 0 && !c.startsWith("AUTO-"));

  // Find if any candidate is a true valid standard barcode
  let validBarcode: string | null = null;
  for (const c of candidates) {
    if (isValidStandardBarcode(c)) {
      validBarcode = c;
      break;
    }
  }

  // Find candidate for productCode (e.g. "TRU16977")
  let targetProductCode: string | null = cleanProdCode || cleanSeller || cleanBuyer || null;

  // If cleanBarcode is NOT a valid barcode (e.g., "TRU16977"), it belongs in productCode!
  if (cleanBarcode && !isValidStandardBarcode(cleanBarcode)) {
    if (!targetProductCode || targetProductCode.length < cleanBarcode.length) {
      targetProductCode = cleanBarcode;
    }
  }

  // If no valid standard barcode found, generate a valid temporary numeric barcode
  let finalBarcode: string;
  let isTemp = false;
  if (validBarcode) {
    finalBarcode = validBarcode;
  } else {
    finalBarcode = generateTempBarcode();
    isTemp = true;
  }

  return {
    barcode: finalBarcode,
    productCode: targetProductCode,
    isTempBarcode: isTemp
  };
}

/**
 * Normalizes text for Turkish-safe, punctuation-free string matching
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Extracts alphanumeric model tokens (e.g. "MZ-V9P1T0BW", "TRU16977", "16977", "C9370A", "990PRO")
 */
export function extractModelTokens(text: string | null | undefined): string[] {
  if (!text) return [];
  // Match tokens with alphanumeric mix, or numbers at least 4 digits
  const tokens = text.match(/[A-Za-z0-9]+(?:[-_/][A-Za-z0-9]+)+|[A-Za-z]{2,}[0-9]{3,}|[0-9]{4,}[A-Za-z]+|[A-Za-z0-9]{5,}/g) || [];
  return Array.from(new Set(tokens.map(t => t.trim()))).filter(t => t.length >= 4 && !t.startsWith("AUTO-"));
}

/**
 * Intelligent 5-Tier Product Matching for Incoming Invoices
 * 
 * 1. Supplier Product Mappings (Historical matches by VKN + product name or supplier code)
 * 2. Barcode Match (products.barcode exact match)
 * 3. Product Code / SKU Match (products.product_code or products.sku exact match)
 * 4. Product Name Exact or Normalized Match (products.name exact or normalized)
 * 5. Model/Code Token Intelligent Matching (Model numbers like MZ-V9P1T0BW, 16977, C9370A found in name or code)
 */
export async function findMatchingProduct(
  clientOrPool: any,
  storeId: number,
  params: {
    supplierVkn?: string | null;
    productName: string;
    barcode?: string | null;
    productCode?: string | null;
    sellerCode?: string | null;
    buyerCode?: string | null;
  }
): Promise<MatchCandidate | null> {
  const { supplierVkn, productName, barcode, productCode, sellerCode, buyerCode } = params;
  const cleanName = (productName || "").trim();
  const normalizedItemName = normalizeText(cleanName);

  // Candidate codes collected from invoice
  const rawCodes = [barcode, productCode, sellerCode, buyerCode]
    .filter(Boolean)
    .map(c => String(c).trim())
    .filter(c => c.length > 0 && !c.startsWith("AUTO-"));
  const candidateCodes = Array.from(new Set(rawCodes));

  // 1. Tier 1: Check Supplier Product Mappings (Prior manual or confirmed links)
  if (supplierVkn && cleanName) {
    try {
      const mappingRes = await clientOrPool.query(
        `SELECT spm.product_id, p.barcode, COALESCE(p.product_code, p.sku, '') as product_code, p.name 
         FROM supplier_product_mappings spm
         JOIN products p ON spm.product_id = p.id
         WHERE spm.store_id = $1 AND spm.supplier_vkn = $2 
           AND (
             spm.supplier_product_name = $3 
             OR (spm.supplier_product_code IS NOT NULL AND spm.supplier_product_code = ANY($4))
           )
         LIMIT 1`,
        [storeId, supplierVkn, cleanName, candidateCodes.length > 0 ? candidateCodes : ['__NONE__']]
      );
      if (mappingRes.rows.length > 0) {
        const row = mappingRes.rows[0];
        return {
          productId: row.product_id,
          barcode: row.barcode,
          productCode: row.product_code,
          name: row.name,
          matchType: 'supplier_mapping'
        };
      }
    } catch (err) {
      console.error("Error checking supplier_product_mappings:", err);
    }
  }

  // 2. Tier 2: Exact Barcode Match
  for (const code of candidateCodes) {
    // EAN/GTIN barcodes are typically 8, 12, 13, or 14 digits, or alphanumeric bar codes
    const barRes = await clientOrPool.query(
      `SELECT id, barcode, COALESCE(product_code, sku, '') as product_code, name 
       FROM products 
       WHERE store_id = $1 AND barcode = $2 
       LIMIT 1`,
      [storeId, code]
    );
    if (barRes.rows.length > 0) {
      const row = barRes.rows[0];
      return {
        productId: row.id,
        barcode: row.barcode,
        productCode: row.product_code,
        name: row.name,
        matchType: 'barcode'
      };
    }
  }

  // 3. Tier 3: Product Code / SKU Match (products.product_code or products.sku)
  for (const code of candidateCodes) {
    const codeRes = await clientOrPool.query(
      `SELECT id, barcode, COALESCE(product_code, sku, '') as product_code, name 
       FROM products 
       WHERE store_id = $1 AND (
         LOWER(product_code) = LOWER($2) 
         OR LOWER(sku) = LOWER($2)
       )
       LIMIT 1`,
      [storeId, code]
    );
    if (codeRes.rows.length > 0) {
      const row = codeRes.rows[0];
      return {
        productId: row.id,
        barcode: row.barcode,
        productCode: row.product_code,
        name: row.name,
        matchType: 'product_code'
      };
    }
  }

  // 4. Tier 4: Exact or Normalized Product Name Match
  if (cleanName) {
    // 4a. Exact case-insensitive match
    const exactNameRes = await clientOrPool.query(
      `SELECT id, barcode, COALESCE(product_code, sku, '') as product_code, name 
       FROM products 
       WHERE store_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) 
       LIMIT 1`,
      [storeId, cleanName]
    );
    if (exactNameRes.rows.length > 0) {
      const row = exactNameRes.rows[0];
      return {
        productId: row.id,
        barcode: row.barcode,
        productCode: row.product_code,
        name: row.name,
        matchType: 'exact_name'
      };
    }

    // 4b. Normalized name match (stripping spaces, symbols, turkish chars)
    if (normalizedItemName.length >= 4) {
      const allStoreProducts = await clientOrPool.query(
        `SELECT id, barcode, COALESCE(product_code, sku, '') as product_code, name 
         FROM products 
         WHERE store_id = $1`,
        [storeId]
      );
      for (const p of allStoreProducts.rows) {
        const normP = normalizeText(p.name);
        if (normP && (normP === normalizedItemName || (normP.length > 8 && normalizedItemName.length > 8 && (normP.includes(normalizedItemName) || normalizedItemName.includes(normP))))) {
          return {
            productId: p.id,
            barcode: p.barcode,
            productCode: p.product_code,
            name: p.name,
            matchType: 'normalized_name'
          };
        }
      }
    }
  }

  // 5. Tier 5: Intelligent Model Token & Code Intersection Match
  // E.g. Invoice says "Trust 16977 Bigfoot Jel MousePad -Siyah" and sellerCode "TRU16977".
  // System has "Trust 16977 Mouse Pad".
  // E.g. Invoice says "... 990 PRO ... MZ-V9P1T0BW". System has "Samsung 1Tb 990 Pro Mz-V9P1T0Bw ...".
  const tokensToSearch = Array.from(new Set([
    ...candidateCodes,
    ...extractModelTokens(cleanName),
    ...candidateCodes.flatMap(c => extractModelTokens(c))
  ])).filter(t => t.length >= 4);

  for (const token of tokensToSearch) {
    // Try matching model token inside products name, barcode, product_code or sku
    const tokenQuery = await clientOrPool.query(
      `SELECT id, barcode, COALESCE(product_code, sku, '') as product_code, name 
       FROM products 
       WHERE store_id = $1 AND (
         LOWER(name) LIKE '%' || LOWER($2) || '%' 
         OR LOWER(barcode) LIKE '%' || LOWER($2) || '%' 
         OR LOWER(product_code) LIKE '%' || LOWER($2) || '%' 
         OR LOWER(sku) LIKE '%' || LOWER($2) || '%'
       )
       LIMIT 3`,
      [storeId, token]
    );

    if (tokenQuery.rows.length === 1) {
      // Exactly 1 product matched this distinct model token!
      const row = tokenQuery.rows[0];
      return {
        productId: row.id,
        barcode: row.barcode,
        productCode: row.product_code,
        name: row.name,
        matchType: 'model_token'
      };
    } else if (tokenQuery.rows.length > 1) {
      // If multiple matched, find the one with highest brand/name similarity
      const cleanLower = cleanName.toLowerCase();
      let bestMatch: any = null;
      let maxOverlap = 0;
      for (const row of tokenQuery.rows) {
        const pLower = row.name.toLowerCase();
        // Count shared word tokens
        const invoiceWords = cleanLower.split(/\s+/).filter((w: string) => w.length > 2);
        const overlap = invoiceWords.filter((w: string) => pLower.includes(w)).length;
        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          bestMatch = row;
        }
      }
      if (bestMatch && maxOverlap >= 2) {
        return {
          productId: bestMatch.id,
          barcode: bestMatch.barcode,
          productCode: bestMatch.product_code,
          name: bestMatch.name,
          matchType: 'model_token'
        };
      }
    }
  }

  return null;
}

/**
 * Remember mapping for future invoices
 */
export async function saveSupplierMapping(
  clientOrPool: any,
  storeId: number,
  supplierVkn: string,
  supplierProductName: string,
  productId: number,
  supplierProductCode?: string | null
) {
  if (!supplierVkn || !supplierProductName || !productId) return;
  try {
    await clientOrPool.query(
      `INSERT INTO supplier_product_mappings 
        (store_id, supplier_vkn, supplier_product_name, supplier_product_code, product_id) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (store_id, supplier_vkn, supplier_product_name) 
       DO UPDATE SET 
         product_id = EXCLUDED.product_id,
         supplier_product_code = COALESCE(EXCLUDED.supplier_product_code, supplier_product_mappings.supplier_product_code)`,
      [storeId, supplierVkn, supplierProductName, supplierProductCode || null, productId]
    );
  } catch (err) {
    console.error("Failed to save supplier product mapping:", err);
  }
}

export interface ExpenseDetectionResult {
  isExpense: boolean;
  expenseCategory: string | null;
  expenseCenter: string | null;
  reason?: string;
}

export function normalizeTurkishText(str: string): string {
  if (!str) return '';
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Intelligent Expense Supplier & Category Detection Engine
 * Covers supermarkets, electricity, water, telecom, fuel, cargo, stationery, cleaning, maintenance, food, insurance, rent.
 */
export function detectExpenseCategory(
  supplierTitle?: string | null,
  supplierVkn?: string | null,
  notes?: string | null
): ExpenseDetectionResult {
  const rawTitle = (supplierTitle || "").trim();
  const rawNotes = (notes || "").trim();
  const normTitle = normalizeTurkishText(rawTitle);
  const normNotes = normalizeTurkishText(rawNotes);
  const titleLower = normTitle;
  const combined = `${normTitle} ${normNotes}`;
  const vkn = String(supplierVkn || '').trim();

  // Known VKN / Tax Number overrides
  // 1750051846: BİM Birleşik Mağazalar A.Ş.
  // 9980069675: Yeni Mağazacılık A.Ş. (A101)
  // 8110057404: ŞOK Marketler Ticaret A.Ş.
  // 6220529546: Migros Ticaret A.Ş.
  // 2030018596: CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.
  if (['1750051846', '9980069675', '8110057404', '6220529546', '2030018596'].includes(vkn)) {
    return {
      isExpense: true,
      expenseCategory: 'MARKET',
      expenseCenter: 'office',
      reason: 'Known Supermarket VKN'
    };
  }

  // 1. Supermarket, Grocery & Food Retail (BİM, A101, ŞOK, Migros, Carrefour, Tarım Kredi, Hakmar, etc.)
  if (
    titleLower.includes('bim ') || titleLower.startsWith('bim') || titleLower.includes('birlesik magazalar') || titleLower.includes('birleşik mağazalar') ||
    titleLower.includes('a101') || titleLower.includes('yeni magazacilik') || titleLower.includes('yeni mağazacılık') ||
    titleLower.includes('sok market') || titleLower.includes('şok market') || titleLower.includes('sok marketler') || titleLower.includes('şok marketler') ||
    titleLower.includes('migros') || titleLower.includes('macrocenter') ||
    titleLower.includes('carrefour') || titleLower.includes('carrefoursa') ||
    titleLower.includes('metro gross') || titleLower.includes('metro toptanci') || titleLower.includes('metro toptancı') ||
    titleLower.includes('tarim kredi') || titleLower.includes('tarım kredi') ||
    titleLower.includes('hakmar') || titleLower.includes('bizim toptan') ||
    titleLower.includes('file market') || titleLower.includes('onur market') ||
    titleLower.includes('happy center') || titleLower.includes('mopas') || titleLower.includes('mopaş') ||
    titleLower.includes('yunus market') || titleLower.includes('cagri market') || titleLower.includes('çağrı market') ||
    titleLower.includes('makro market') || titleLower.includes('pehlivanoglu') || titleLower.includes('pehlivanoğlu') ||
    titleLower.includes('gross market') || titleLower.includes('supermarket') || titleLower.includes('süpermarket') ||
    titleLower.includes('hipermarket') || titleLower.includes('bakkal') || titleLower.includes('manav')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'MARKET',
      expenseCenter: 'office',
      reason: 'Supermarket & Retail Store'
    };
  }

  // 2. Electricity & Energy
  if (
    combined.includes('enerjisa') || combined.includes('ayedas') || combined.includes('ayedaş') ||
    combined.includes('ck bogazici') || combined.includes('ck boğaziçi') || combined.includes('bogazici elektrik') || combined.includes('boğaziçi elektrik') ||
    combined.includes('gediz') || combined.includes('toroslar') || combined.includes('yesilirmak') || combined.includes('yeşilırmak') ||
    combined.includes('dicle elektrik') || combined.includes('uludag elektrik') || combined.includes('uludağ elektrik') ||
    combined.includes('akdeniz elektrik') || combined.includes('coruh elektrik') || combined.includes('camlibel') || combined.includes('çamlıbel') ||
    combined.includes('araz elektrik') || combined.includes('baskent elektrik') || combined.includes('başkent elektrik') ||
    combined.includes('elektrik perakende') || combined.includes('elektrik dagitim') || combined.includes('elektrik dağıtım') ||
    combined.includes('epias') || combined.includes('epiaş') || combined.includes('kib-tek') || combined.includes('kibtek')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'ELEKTRIK',
      expenseCenter: 'office',
      reason: 'Electricity Utility'
    };
  }

  // 3. Water & Drainage
  if (
    combined.includes('iski') || combined.includes('aski') || combined.includes('izsu') || combined.includes('buski') ||
    combined.includes('deski') || combined.includes('koski') || combined.includes('gaski') || combined.includes('meski') || combined.includes('saski') ||
    combined.includes('sirma su') || combined.includes('sırma su') || combined.includes('hayat su') || combined.includes('erikli') ||
    combined.includes('hamidiye') || combined.includes('pinar su') || combined.includes('pınar su') || combined.includes('damla su') ||
    combined.includes('abant su') || combined.includes('kardelen su') || combined.includes('su aritma') || combined.includes('su arıtma') ||
    combined.includes('su ve kanalizasyon')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'SU',
      expenseCenter: 'office',
      reason: 'Water Utility'
    };
  }

  // 4. Fuel, Gas & Energy
  if (
    combined.includes('igdas') || combined.includes('igdaş') || combined.includes('baskentgaz') || combined.includes('başkentgaz') || combined.includes('izmirgaz') ||
    combined.includes('shell') || combined.includes('petrol ofisi') || combined.includes('opet') || combined.includes('bp petrol') ||
    combined.includes('totalenergies') || combined.includes('aygaz') || combined.includes('ipragaz') || combined.includes('milangaz') ||
    combined.includes('likitgaz') || combined.includes('akaryakit') || combined.includes('akaryakıt') || combined.includes('benzin') ||
    combined.includes('otogaz') || combined.includes('motorin') || combined.includes('akpet') || combined.includes('alpet') ||
    combined.includes('sunpet') || combined.includes('tp petrol') || combined.includes('petrol istasyon')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'YAKIT',
      expenseCenter: 'office',
      reason: 'Fuel / Gas / Energy'
    };
  }

  // 5. Telecom, Internet, Cloud & Software
  if (
    combined.includes('turkcell') || combined.includes('vodafone') || combined.includes('turk telekom') || combined.includes('türk telekom') ||
    combined.includes('ttnet') || combined.includes('superonline') || combined.includes('turksat') || combined.includes('türksat') ||
    combined.includes('millenicom') || combined.includes('netspeed') || combined.includes('gibirnet') || combined.includes('netgsm') ||
    combined.includes('verimor') || combined.includes('hosting') || combined.includes('natro') || combined.includes('isimtescil') ||
    combined.includes('radore') || combined.includes('dgnplus') || combined.includes('turhost') || combined.includes('niobe') ||
    combined.includes('digitalocean') || combined.includes('aws') || combined.includes('google cloud') || combined.includes('cloudflare') ||
    combined.includes('domain') || combined.includes('sunucu') || combined.includes('telekomunikasyon') || combined.includes('telekomünikasyon') ||
    combined.includes('iletisim hizmetleri') || combined.includes('iletişim hizmetleri')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'TELEKOM',
      expenseCenter: 'office',
      reason: 'Telecommunications & IT'
    };
  }

  // 6. Cargo, Courier & Logistics
  if (
    combined.includes('aras kargo') || combined.includes('yurtici kargo') || combined.includes('yurtiçi kargo') ||
    combined.includes('mng kargo') || combined.includes('surat kargo') || combined.includes('sürat kargo') ||
    combined.includes('ptt kargo') || combined.includes('ups kargo') || combined.includes('fedex') || combined.includes('dhl') ||
    combined.includes('kargo tasimacilik') || combined.includes('kargo taşımacılık') || combined.includes('kurye') ||
    combined.includes('scotty') || combined.includes('hepsijet') || combined.includes('kolay gelsin') ||
    combined.includes('trendyol express') || combined.includes('sendeo') || combined.includes('lojistik ve tasima') || combined.includes('lojistik ve taşıma')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'KARGO',
      expenseCenter: 'marketing',
      reason: 'Cargo & Logistics'
    };
  }

  // 7. Stationery, Office Supplies & Packaging
  if (
    combined.includes('kirtasiye') || combined.includes('kırtasiye') || combined.includes('avansas') ||
    combined.includes('officestore') || combined.includes('d&r') || combined.includes('nezih') ||
    combined.includes('fotokopi') || combined.includes('matbaa') || combined.includes('toner') || combined.includes('kartus') || combined.includes('kartuş') ||
    combined.includes('ambalaj') || combined.includes('koli kutu') || combined.includes('poset') || combined.includes('poşet') ||
    combined.includes('etiket matbaa') || combined.includes('faber-castell') || combined.includes('adel kalem')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'KIRTASIYE',
      expenseCenter: 'office',
      reason: 'Stationery & Office Supplies'
    };
  }

  // 8. Cleaning & Consumables
  if (
    combined.includes('temizlik urun') || combined.includes('temizlik ürün') || combined.includes('deterjan') ||
    combined.includes('dezenfektan') || combined.includes('hijyen') || combined.includes('endustriyel temizlik') || combined.includes('endüstriyel temizlik') ||
    combined.includes('kagit havlu') || combined.includes('kağıt havlu') || combined.includes('pecete') || combined.includes('peçete')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'TEMIZLIK',
      expenseCenter: 'office',
      reason: 'Cleaning & Consumables'
    };
  }

  // 9. Maintenance, Repair & DIY Hardware
  if (
    combined.includes('koctas') || combined.includes('koçtaş') || combined.includes('bauhaus') ||
    combined.includes('ikea') || combined.includes('tekzen') || combined.includes('praktiker') ||
    combined.includes('nalbur') || combined.includes('hirdavat') || combined.includes('hırdavat') ||
    combined.includes('oto sanayi') || combined.includes('oto tamir') || combined.includes('oto servis') ||
    combined.includes('periyodik bakim') || combined.includes('periyodik bakım')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'BAKIM_ONARIM',
      expenseCenter: 'service',
      reason: 'Maintenance, Hardware & DIY'
    };
  }

  // 10. Food, Catering & Restaurant
  if (
    combined.includes('multinet') || combined.includes('sodexo') || combined.includes('edenred') ||
    combined.includes('ticket restaurant') || combined.includes('metropolcard') ||
    combined.includes('catering') || combined.includes('tabldot') || combined.includes('restoran') ||
    combined.includes('lokanta') || combined.includes('pastane') || combined.includes('firin') || combined.includes('fırın')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'YEMEK',
      expenseCenter: 'personnel',
      reason: 'Food & Catering'
    };
  }

  // 11. Insurance & Security
  if (
    combined.includes('anadolu sigorta') || combined.includes('allianz') || combined.includes('ak sigorta') || combined.includes('aksigorta') ||
    combined.includes('axa sigorta') || combined.includes('sompo') || combined.includes('gunes sigorta') || combined.includes('güneş sigorta') ||
    combined.includes('mapfre') || combined.includes('turkiye sigorta') || combined.includes('türkiye sigorta') || combined.includes('hdi sigorta') ||
    combined.includes('neova') || combined.includes('doga sigorta') || combined.includes('doğa sigorta') ||
    combined.includes('kasko') || combined.includes('trafik sigortasi') || combined.includes('trafik sigortası') ||
    combined.includes('pronet') || combined.includes('securitas') || combined.includes('kale guvenlik') || combined.includes('kale güvenlik')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'SIGORTA',
      expenseCenter: 'office',
      reason: 'Insurance & Security'
    };
  }

  // 12. Professional Services, Rent, Dues & Consultancy
  if (
    combined.includes('mali musavir') || combined.includes('mali müşavir') || combined.includes('muhasebe') || combined.includes('smmm') ||
    combined.includes('avukat') || combined.includes('hukuk burosu') || combined.includes('hukuk bürosu') || combined.includes('noter') ||
    combined.includes('ticaret odasi') || combined.includes('ticaret odası') || combined.includes('sanayi odasi') || combined.includes('sanayi odası') ||
    combined.includes('esnaf odasi') || combined.includes('esnaf odası') || combined.includes('apartman yonetimi') || combined.includes('apartman yönetimi') ||
    combined.includes('site yonetimi') || combined.includes('site yönetimi') || combined.includes('aidat') || combined.includes('kira bedeli')
  ) {
    return {
      isExpense: true,
      expenseCategory: 'KIRA_VE_AIDAT',
      expenseCenter: 'office',
      reason: 'Rent, Dues & Professional Services'
    };
  }

  return {
    isExpense: false,
    expenseCategory: null,
    expenseCenter: null
  };
}

/**
 * Reverts stock additions, deletes stock movements, cleans up orphan auto-created products,
 * and sets invoice items to non-inventory state for an expense invoice.
 */
export async function revertInvoiceStockAndProducts(
  clientOrPool: any,
  storeId: number,
  invoiceId: number
): Promise<{ revertedCount: number; deletedProductsCount: number }> {
  // Fetch invoice details
  const invRes = await clientOrPool.query(
    "SELECT id, invoice_number, document_number FROM purchase_invoices WHERE id = $1 AND store_id = $2",
    [invoiceId, storeId]
  );
  if (invRes.rows.length === 0) return { revertedCount: 0, deletedProductsCount: 0 };
  const inv = invRes.rows[0];
  const invNum = inv.invoice_number || inv.document_number || '';

  // Get all items in this purchase invoice
  const itemsRes = await clientOrPool.query(
    "SELECT id, product_id, barcode, product_code, quantity, system_quantity FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
    [invoiceId]
  );

  let revertedCount = 0;
  let deletedProductsCount = 0;
  const productIdsToCheck: number[] = [];

  for (const item of itemsRes.rows) {
    let prodId = item.product_id;
    if (!prodId && (item.barcode || item.product_code)) {
      const pFind = await clientOrPool.query(
        "SELECT id FROM products WHERE store_id = $1 AND (barcode = $2 OR (product_code IS NOT NULL AND product_code = $3)) LIMIT 1",
        [storeId, item.barcode || '__NONE__', item.product_code || '__NONE__']
      );
      if (pFind.rows.length > 0) {
        prodId = pFind.rows[0].id;
      }
    }

    if (prodId) {
      const qtyToDeduct = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
      if (qtyToDeduct > 0) {
        await clientOrPool.query(
          "UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2 AND store_id = $3",
          [qtyToDeduct, prodId, storeId]
        );
        revertedCount++;
      }
      productIdsToCheck.push(prodId);
    }
  }

  // Delete all stock movement logs related to this invoice
  await clientOrPool.query(
    `DELETE FROM stock_movements 
     WHERE store_id = $1 
       AND ((source = 'purchase_invoice' OR invoice_type = 'purchase') AND (invoice_id = $2 OR description LIKE $3 OR description LIKE $4))`,
    [storeId, invoiceId, `%${invNum}%`, `%${invoiceId}%`]
  );

  // Unlink items from product catalog so they do not show barcode/stock links
  await clientOrPool.query(
    "UPDATE purchase_invoice_items SET product_id = NULL, barcode = NULL, product_code = NULL WHERE purchase_invoice_id = $1",
    [invoiceId]
  );

  // Check if any referenced products were auto-created exclusively for incoming invoices and have no other transactions
  for (const pid of Array.from(new Set(productIdsToCheck))) {
    try {
      const prodRes = await clientOrPool.query(
        "SELECT id, labels, stock_quantity FROM products WHERE id = $1 AND store_id = $2",
        [pid, storeId]
      );
      if (prodRes.rows.length > 0) {
        const p = prodRes.rows[0];
        const labelsStr = JSON.stringify(p.labels || []);
        const isAutoCreated = labelsStr.includes("yeni_fatura_urunu");

        if (isAutoCreated) {
          // Check if this product is used in any sale or other invoice
          const saleCheck = await clientOrPool.query(
            "SELECT 1 FROM sales_items WHERE product_id = $1 LIMIT 1",
            [pid]
          );
          const otherInvCheck = await clientOrPool.query(
            "SELECT 1 FROM purchase_invoice_items WHERE product_id = $1 AND purchase_invoice_id != $2 LIMIT 1",
            [pid, invoiceId]
          );
          const movesCheck = await clientOrPool.query(
            "SELECT 1 FROM stock_movements WHERE product_id = $1 LIMIT 1",
            [pid]
          );

          if (saleCheck.rows.length === 0 && otherInvCheck.rows.length === 0 && movesCheck.rows.length === 0) {
            await clientOrPool.query("DELETE FROM products WHERE id = $1 AND store_id = $2", [pid, storeId]);
            deletedProductsCount++;
          }
        }
      }
    } catch (e) {
      console.error(`Error cleaning auto-created product ${pid}:`, e);
    }
  }

  return { revertedCount, deletedProductsCount };
}

/**
 * Resolves expense classification by consulting:
 * 1. Pinned supplier record in companies table (is_expense = true)
 * 2. Historical purchase invoices for this supplier in this store (is_expense = true)
 * 3. Keyword / VKN intelligent detection engine (detectExpenseCategory)
 * If detected as expense, optionally pins the supplier in companies table so future queries are instant.
 */
export async function resolveExpenseClassification(
  poolOrClient: any,
  storeId: number,
  params: {
    supplierTitle?: string | null;
    supplierVkn?: string | null;
    companyId?: number | null;
    pinToCompany?: boolean;
  }
): Promise<ExpenseDetectionResult> {
  const { supplierTitle, supplierVkn, companyId, pinToCompany = true } = params;
  const vkn = (supplierVkn || '').trim();
  const title = (supplierTitle || '').trim();

  // 1. Check pinned supplier in companies table
  if (companyId) {
    const compRes = await poolOrClient.query(
      "SELECT id, is_expense, expense_category, expense_center FROM companies WHERE id = $1 AND store_id = $2",
      [companyId, storeId]
    );
    if (compRes.rows.length > 0 && compRes.rows[0].is_expense) {
      return {
        isExpense: true,
        expenseCategory: compRes.rows[0].expense_category || 'MARKET',
        expenseCenter: compRes.rows[0].expense_center || 'office',
        reason: 'Pinned in Company Record'
      };
    }
  }

  if (vkn) {
    const compRes = await poolOrClient.query(
      "SELECT id, is_expense, expense_category, expense_center FROM companies WHERE store_id = $1 AND tax_number = $2 AND is_expense = true LIMIT 1",
      [storeId, vkn]
    );
    if (compRes.rows.length > 0) {
      return {
        isExpense: true,
        expenseCategory: compRes.rows[0].expense_category || 'MARKET',
        expenseCenter: compRes.rows[0].expense_center || 'office',
        reason: 'Pinned by Supplier VKN in Companies'
      };
    }
  }

  // 2. Check historical purchase invoices for this supplier in this store
  if (vkn || title) {
    const histRes = await poolOrClient.query(
      `SELECT expense_category, expense_center 
       FROM purchase_invoices 
       WHERE store_id = $1 
         AND is_expense = true 
         AND (
           ($2 != '' AND tax_number = $2) 
           OR ($3 != '' AND LOWER(TRIM(supplier_name)) = LOWER(TRIM($3)))
         )
       ORDER BY id DESC LIMIT 1`,
      [storeId, vkn, title]
    );
    if (histRes.rows.length > 0) {
      const cat = histRes.rows[0].expense_category || 'MARKET';
      const center = histRes.rows[0].expense_center || 'office';

      // Pin to company if requested
      if (pinToCompany && (vkn || companyId)) {
        try {
          if (companyId) {
            await poolOrClient.query(
              "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE id = $3",
              [cat, center, companyId]
            );
          } else if (vkn) {
            await poolOrClient.query(
              "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE store_id = $3 AND tax_number = $4",
              [cat, center, storeId, vkn]
            );
          }
        } catch (e) {
          console.error("Error auto-pinning company as expense:", e);
        }
      }

      return {
        isExpense: true,
        expenseCategory: cat,
        expenseCenter: center,
        reason: 'Inherited from Past Expense Invoices'
      };
    }
  }

  // 3. Intelligent detection engine based on Title & VKN
  const detected = detectExpenseCategory(title, vkn, null);
  if (detected.isExpense) {
    // Pin to company so future invoices are immediately recognized
    if (pinToCompany && (vkn || companyId)) {
      try {
        if (companyId) {
          await poolOrClient.query(
            "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE id = $3",
            [detected.expenseCategory, detected.expenseCenter, companyId]
          );
        } else if (vkn) {
          await poolOrClient.query(
            "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE store_id = $3 AND tax_number = $4",
            [detected.expenseCategory, detected.expenseCenter, storeId, vkn]
          );
        }
      } catch (e) {
        console.error("Error pinning detected company as expense:", e);
      }
    }
    return detected;
  }

  return {
    isExpense: false,
    expenseCategory: null,
    expenseCenter: null
  };
}


