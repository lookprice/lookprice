import { Pool } from "pg";

export interface MatchCandidate {
  productId: number;
  barcode: string;
  productCode: string;
  name: string;
  matchType: 'supplier_mapping' | 'barcode' | 'product_code' | 'exact_name' | 'normalized_name' | 'model_token';
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
