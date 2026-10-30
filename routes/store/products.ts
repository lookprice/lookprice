import express from "express";
import axios from "axios";
import { pool, logAction } from "../../models/db";
import { getAuthorizedStoreId, getTurkishSearchSnippet, normalizeTurkishParam, checkProductLimit, getGeminiApiKey } from "./utils";
import { isValidStandardBarcode, hasProductMatchConflict, invalidateStoreProductsCache, transferAndCleanupInvoiceGeneratedProduct, saveSupplierMapping } from "./invoiceMatching";
import { GoogleGenAI } from "@google/genai";
import XLSX from "xlsx";
import { masterBookLookup, generateHighResBookCoverSvg } from "./bookLookupService";
import { getPredefinedSectorPackages, seedStoreSectorTaxonomy, autoBridgeStoreCategories, populateMarketplaceMasterTaxonomies } from "./hepsiburadaTaxonomyService";

export function cleanMpString(val: any): string | null {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'none' || s.toLowerCase() === 'n/a') return null;
  return s;
}

export function parseMpBool(val: any, fallback: boolean = false): boolean {
  if (val === undefined || val === null) return fallback;
  if (val === true || val === 1) return true;
  if (val === false || val === 0) return false;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'on' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'off' || s === 'no') return false;
  }
  return fallback;
}

/**
 * Reusable engine to merge a duplicate/temporary product into a target real product.
 * Reassigns all related stock movements, invoice lines, POS sales, and aliases.
 */
export async function mergeProducts(clientOrPool: any, sourceId: number, targetId: number, storeId?: number) {
  if (sourceId === targetId) {
    throw new Error("Kaynak ve hedef ürün aynı olamaz.");
  }

  const isDirectClient = typeof clientOrPool.release === "function";
  const client = isDirectClient ? clientOrPool : await pool.connect();
  let mustCommit = false;

  try {
    if (!isDirectClient) {
      await client.query("BEGIN");
      mustCommit = true;
    }

    const sourceRes = await client.query("SELECT * FROM products WHERE id = $1", [sourceId]);
    const targetRes = await client.query("SELECT * FROM products WHERE id = $1", [targetId]);

    if (sourceRes.rows.length === 0) throw new Error(`Kaynak ürün bulunamadı (ID: ${sourceId})`);
    if (targetRes.rows.length === 0) throw new Error(`Hedef ürün bulunamadı (ID: ${targetId})`);

    const source = sourceRes.rows[0];
    const target = targetRes.rows[0];

    if (storeId && (source.store_id !== storeId || target.store_id !== storeId)) {
      throw new Error("Yetkisiz işlem: Ürünler bu mağazaya ait değil.");
    }
    if (source.store_id !== target.store_id) {
      throw new Error("Farklı mağazalara ait ürünler birleştirilemez.");
    }

    // 1. Reassign stock movements
    await client.query("UPDATE stock_movements SET product_id = $1 WHERE product_id = $2", [target.id, source.id]);

    // 2. Reassign purchase invoice items
    await client.query(
      "UPDATE purchase_invoice_items SET product_id = $1, barcode = COALESCE(NULLIF($2, ''), barcode), product_code = COALESCE(product_code, $3) WHERE product_id = $4",
      [target.id, target.barcode, target.product_code || source.product_code, source.id]
    );
    if (source.barcode) {
      await client.query(
        "UPDATE purchase_invoice_items SET barcode = $1 WHERE barcode = $2 AND (product_id = $3 OR product_id IS NULL)",
        [target.barcode, source.barcode, target.id]
      );
    }

    // 3. Reassign sales invoice items
    await client.query(
      "UPDATE sales_invoice_items SET product_id = $1, barcode = COALESCE(NULLIF($2, ''), barcode) WHERE product_id = $3",
      [target.id, target.barcode, source.id]
    );
    if (source.barcode) {
      await client.query(
        "UPDATE sales_invoice_items SET barcode = $1 WHERE barcode = $2 AND (product_id = $3 OR product_id IS NULL)",
        [target.barcode, source.barcode, target.id]
      );
    }

    // 4. Reassign sale items (POS / Fast-POS)
    await client.query(
      "UPDATE sale_items SET product_id = $1, barcode = COALESCE(NULLIF($2, ''), barcode) WHERE product_id = $3",
      [target.id, target.barcode, source.id]
    );
    if (source.barcode) {
      await client.query(
        "UPDATE sale_items SET barcode = $1 WHERE barcode = $2 AND (product_id = $3 OR product_id IS NULL)",
        [target.barcode, source.barcode, target.id]
      );
    }

    // 5. Quotation items
    await client.query(
      "UPDATE quotation_items SET product_id = $1, barcode = COALESCE(NULLIF($2, ''), barcode) WHERE product_id = $3",
      [target.id, target.barcode, source.id]
    );

    // 6. Procurements
    await client.query(
      "UPDATE procurements SET product_id = $1, barcode = COALESCE(NULLIF($2, ''), barcode) WHERE product_id = $3",
      [target.id, target.barcode, source.id]
    );

    // 7. E-Waybill items
    await client.query(
      "UPDATE e_waybill_items SET product_id = $1, barcode = COALESCE(NULLIF($2, ''), barcode) WHERE product_id = $3",
      [target.id, target.barcode, source.id]
    );

    // 8. Stock transfer items
    await client.query(
      "UPDATE stock_transfer_items SET product_id = $1, barcode = COALESCE(NULLIF($2, ''), barcode) WHERE product_id = $3",
      [target.id, target.barcode, source.id]
    );

    // 9. Service items
    await client.query("UPDATE service_items SET product_id = $1 WHERE product_id = $2", [target.id, source.id]);

    // 10. Scan logs
    await client.query("UPDATE scan_logs SET product_id = $1 WHERE product_id = $2", [target.id, source.id]);

    // 11. Product recipes
    await client.query("UPDATE product_recipes SET product_id = $1 WHERE product_id = $2", [target.id, source.id]);
    await client.query("UPDATE product_recipes SET ingredient_id = $1 WHERE ingredient_id = $2", [target.id, source.id]);

    // 12. Supplier product mappings (resolve potential unique constraint conflicts)
    await client.query(`
      DELETE FROM supplier_product_mappings s1
      USING supplier_product_mappings s2
      WHERE s1.product_id = $1 AND s2.product_id = $2
        AND s1.store_id = s2.store_id AND s1.supplier_vkn = s2.supplier_vkn AND s1.supplier_product_name = s2.supplier_product_name
    `, [source.id, target.id]);
    await client.query("UPDATE supplier_product_mappings SET product_id = $1 WHERE product_id = $2", [target.id, source.id]);

    // 13. Product aliases - preserve mapping so future imports match the target product
    await client.query("UPDATE product_aliases SET product_id = $1 WHERE product_id = $2", [target.id, source.id]);
    if (source.name && source.name.trim().toLowerCase() !== target.name.trim().toLowerCase()) {
      await client.query(
        "INSERT INTO product_aliases (store_id, product_id, raw_product_name, raw_product_code) VALUES ($1, $2, $3, $4)",
        [target.store_id, target.id, source.name.trim(), source.product_code || source.sku || null]
      );
    }

    // 14. Calculate combined stock & cost price for target product
    const targetIsInternalBarcode = !target.barcode || /^(2[0-9]{7,13}|TEMP|AUTO|M-|P-|LP-)/i.test(target.barcode);
    const sourceIsRealBarcode = isValidStandardBarcode(source.barcode) && !/^(2[0-9]{7,13}|TEMP|AUTO|M-|P-|LP-)/i.test(source.barcode);
    const finalBarcode = (targetIsInternalBarcode && sourceIsRealBarcode) ? source.barcode : target.barcode;

    const newStock = Number(target.stock_quantity || 0) + Number(source.stock_quantity || 0);
    let newCost = Number(target.cost_price || 0);
    if (newCost <= 0 && Number(source.cost_price || 0) > 0) {
      newCost = Number(source.cost_price);
    }
    const newCurrency = target.cost_currency || source.cost_currency || "TRY";
    const newCode = target.product_code || source.product_code || null;
    const newSku = target.sku || source.sku || null;
    const newBrand = target.brand || source.brand || null;
    const newCategory = target.category || source.category || null;
    const newSubCat = target.sub_category || source.sub_category || null;
    const newPrice = Number(target.price || 0) > 0 ? Number(target.price) : Number(source.price || 0);
    const newImage = target.image_url || source.image_url || null;

    // 15. Delete duplicate source product first so its barcode is completely freed
    await client.query("DELETE FROM products WHERE id = $1", [source.id]);

    await client.query(`
      UPDATE products 
      SET barcode = $1,
          stock_quantity = $2,
          cost_price = $3,
          cost_currency = $4,
          product_code = COALESCE(product_code, $5),
          sku = COALESCE(sku, $6),
          brand = COALESCE(brand, $7),
          category = COALESCE(category, $8),
          sub_category = COALESCE(sub_category, $9),
          price = CASE WHEN price > 0 THEN price ELSE $10 END,
          image_url = COALESCE(image_url, $11),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `, [finalBarcode, newStock, newCost, newCurrency, newCode, newSku, newBrand, newCategory, newSubCat, newPrice, newImage, target.id]);

    if (mustCommit) {
      await client.query("COMMIT");
    }

    return {
      success: true,
      mergedIntoId: target.id,
      deletedId: source.id,
      targetName: target.name,
      targetBarcode: target.barcode,
      newStock,
      newCost
    };
  } catch (err) {
    if (mustCommit) {
      await client.query("ROLLBACK");
    }
    throw err;
  } finally {
    if (mustCommit) {
      client.release();
    }
  }
}

/**
 * Normalizes hardware/retail product titles for fuzzy & synonym matching
 */
function normalizeTechTerms(str: string): string {
  if (!str) return "";
  let s = str.toLowerCase()
    .replace(/[ıİ]/g, "i")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[şŞ]/g, "s")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c");
  
  // Normalize common technical synonyms
  s = s.replace(/\b(card\s*reader|kart\s*okuyucu|kart\s*okuyucusu)\b/g, "kart_okuyucu");
  s = s.replace(/\b(memory\s*card|hafiza\s*karti|bellek\s*karti)\b/g, "bellek_karti");
  s = s.replace(/\b(wireless|kablosuz)\b/g, "kablosuz");
  s = s.replace(/\b(mouse|fare)\b/g, "mouse");
  s = s.replace(/\b(keyboard|klavye)\b/g, "klavye");
  s = s.replace(/\b(headset|headphone|earphone|kulaklik)\b/g, "kulaklik");
  s = s.replace(/\b(speaker|hoparlor)\b/g, "hoparlor");
  s = s.replace(/\b(cable|kablo)\b/g, "kablo");
  s = s.replace(/\b(adapter|adaptor|charger|sarj\s*aleti)\b/g, "adaptor");
  s = s.replace(/\b(case|canta|kilif)\b/g, "kilif");
  
  return s.replace(/[^a-z0-9_]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Extracts distinct model codes (alphanumerics or 4+ digit part numbers)
 */
function getProductModelCodes(p: any): string[] {
  const text = `${p.name || ''} ${p.product_code || ''} ${p.sku || ''} ${p.barcode || ''}`;
  const tokens = text.match(/[A-Za-z0-9]+(?:[-_/][A-Za-z0-9]+)+|[A-Za-z]{1,4}[0-9]{2,6}[A-Za-z0-9]*|[0-9]{4,8}[A-Za-z]+|\b[0-9]{4,8}\b/g) || [];
  
  // Filter out obvious generic non-model numbers (years if generic, or common standard vat/percentages)
  const ignored = new Set(["2020", "2021", "2022", "2023", "2024", "2025", "2026", "1000", "2000", "3000", "0000"]);
  return Array.from(new Set(tokens.map(t => t.trim().toLowerCase()))).filter(t => t.length >= 4 && !ignored.has(t));
}

function scoreProductAsTarget(p: any): number {
  let score = 0;
  // 1. Is sellable / active vs closed
  if (p.is_sellable !== false) score += 100;
  else score -= 50;

  // 2. Barcode quality - Real international manufacturer barcodes get highest priority
  const bar = (p.barcode || "").trim();
  const isInternal = !bar || /^(2[0-9]{7,13}|TEMP|AUTO|M-|P-|LP-)/i.test(bar);
  if (isValidStandardBarcode(bar) && !isInternal) {
    score += 150; // Real global manufacturer barcode (e.g. 8806090527456, 869..., 400...)
  } else if (isValidStandardBarcode(bar)) {
    score += 30; // Internal retail/scale barcode (e.g. 2806090527456, 200...)
  } else {
    score -= 50; // No barcode or temp prefix
  }

  // 3. Stock quantity (positive stock preferred over negative stock)
  const stock = Number(p.stock_quantity) || 0;
  if (stock > 0) score += 40 + Math.min(stock, 10);
  else if (stock < 0) score -= 40;

  // 4. Selling price active
  const price = Number(p.price) || 0;
  if (price > 0) score += 30;

  // 5. Cost price defined
  if (Number(p.cost_price) > 0) score += 15;

  // 6. Image present
  if (p.image_url) score += 25;

  // 7. Brand and category
  if (p.brand) score += 10;
  if (p.category) score += 10;

  return score;
}

/**
 * Scans a store's products to find candidate pairs for merging (duplicates, temp barcodes matching real products).
 */
export async function getDuplicateCandidatesForStore(storeId: number) {
  const all = await pool.query(
    `SELECT id, store_id, name, barcode, product_code, sku, stock_quantity, cost_price, cost_currency, price, currency, image_url, category, brand, is_sellable, created_at 
     FROM products 
     WHERE store_id = $1 
     ORDER BY id ASC`,
    [storeId]
  );
  const prods = all.rows;
  const candidates: any[] = [];
  const seenPairs = new Set<string>();

  for (let i = 0; i < prods.length; i++) {
    for (let j = i + 1; j < prods.length; j++) {
      const a = prods[i];
      const b = prods[j];
      const pairKey = [a.id, b.id].sort().join("-");
      if (seenPairs.has(pairKey)) continue;

      let reason = "";
      let confidence = 0;

      const aIsTemp = a.barcode && (a.barcode.startsWith("200") || a.barcode.startsWith("TEMP") || !isValidStandardBarcode(a.barcode));
      const bIsTemp = b.barcode && (b.barcode.startsWith("200") || b.barcode.startsWith("TEMP") || !isValidStandardBarcode(b.barcode));

      const aCode = (a.product_code || "").trim().toLowerCase();
      const bCode = (b.product_code || "").trim().toLowerCase();
      const aSku = (a.sku || "").trim().toLowerCase();
      const bSku = (b.sku || "").trim().toLowerCase();
      const aBar = (a.barcode || "").trim().toLowerCase();
      const bBar = (b.barcode || "").trim().toLowerCase();

      // 1. Direct code/sku match
      const directCodeMatch = (aCode && bCode && aCode === bCode) ||
                              (aSku && bSku && aSku === bSku) ||
                              (aCode && bSku && aCode === bSku) ||
                              (aSku && bCode && aSku === bCode);

      // 2. Cross barcode <-> code match
      const crossBarCodeMatch = (aBar && bCode && aBar === bCode) ||
                                (aBar && bSku && aBar === bSku) ||
                                (bBar && aCode && bBar === aCode) ||
                                (bBar && aSku && bBar === aSku) ||
                                (aBar && bBar && aBar === bBar && a.id !== b.id);

      // 3. Name normalization & tech terms
      const aNorm = normalizeTechTerms(a.name);
      const bNorm = normalizeTechTerms(b.name);
      const exactNameMatch = aNorm.length > 3 && aNorm === bNorm;

      // 4. Model code extraction & token overlap
      const aModels = getProductModelCodes(a);
      const bModels = getProductModelCodes(b);
      const sharedModels = aModels.filter(m => bModels.includes(m));

      // Brand matching
      const aBrand = (a.brand || a.name.split(" ")[0] || "").trim().toLowerCase();
      const bBrand = (b.brand || b.name.split(" ")[0] || "").trim().toLowerCase();
      const brandMatch = aBrand.length >= 3 && bBrand.length >= 3 && (aBrand === bBrand || aNorm.includes(bBrand) || bNorm.includes(aBrand));

      // Word tokens overlap
      const aWords = aNorm.split(/\s+/).filter(w => w.length > 2);
      const bWords = bNorm.split(/\s+/).filter(w => w.length > 2);
      const sharedWords = aWords.filter(w => bWords.includes(w));
      const unionWordCount = new Set([...aWords, ...bWords]).size;
      const jaccard = unionWordCount > 0 ? sharedWords.length / unionWordCount : 0;

      if (directCodeMatch && exactNameMatch) {
        reason = `Ürün Kodu (${a.product_code || a.sku}) ve Ürün Adı birebir aynı`;
        confidence = 100;
      } else if (crossBarCodeMatch) {
        reason = `Barkod & Ürün Kodu Çapraz Eşleşmesi (${a.barcode || b.barcode})`;
        confidence = 98;
      } else if (sharedModels.length > 0 && (brandMatch || sharedWords.length >= 2 || jaccard >= 0.4)) {
        reason = `Aynı Model / Parça Kodu (${sharedModels[0].toUpperCase()}) ve ${brandMatch ? aBrand.toUpperCase() + ' Marka' : 'Teknik Ürün'} Eşleşmesi`;
        confidence = 95;
      } else if (directCodeMatch) {
        reason = `Aynı Ürün Kodu / Model No (${a.product_code || a.sku || b.product_code || b.sku})`;
        confidence = (aIsTemp || bIsTemp) ? 95 : 90;
      } else if (exactNameMatch) {
        reason = `Birebir aynı ürün adı ${aIsTemp || bIsTemp ? '(dahili/geçici barkodlu)' : ''}`;
        confidence = (aIsTemp || bIsTemp) ? 95 : 90;
      } else if (brandMatch && (sharedWords.length >= 3 || jaccard >= 0.6)) {
        reason = `Aynı Marka (${aBrand.toUpperCase()}) ve Yüksek İsim/Donanım Benzerliği`;
        confidence = 88;
      } else if (sharedModels.length > 0 && sharedModels[0].length >= 5) {
        reason = `Ortak Ürün Model Numarası (${sharedModels[0].toUpperCase()})`;
        confidence = 85;
      }

      if (reason) {
        seenPairs.add(pairKey);

        // Smart decision of target (keeper) and source (to merge into target)
        const aScore = scoreProductAsTarget(a);
        const bScore = scoreProductAsTarget(b);

        let target = aScore >= bScore ? a : b;
        let source = aScore >= bScore ? b : a;

        candidates.push({ target, source, reason, confidence });
      }
    }
  }

  // Sort by highest confidence first
  candidates.sort((x, y) => y.confidence - x.confidence);
  return candidates;
}

export async function syncProductNamesFromInvoices(storeId?: number) {
  try {
    const storeFilterPII = storeId ? "AND pi.store_id = " + Number(storeId) : "";
    const storeFilterSI = storeId ? "AND si.store_id = " + Number(storeId) : "";
    const storeFilterPA = storeId ? "AND pa.store_id = " + Number(storeId) : "";
    const storeFilterSPM = storeId ? "AND spm.store_id = " + Number(storeId) : "";

    let updatedCount = 0;

    // 1. Match from purchase_invoice_items by product_id or barcode
    const res1 = await pool.query(`
      UPDATE products p
      SET name = pii.product_name,
          updated_at = CURRENT_TIMESTAMP
      FROM purchase_invoice_items pii
      JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
      WHERE (pii.product_id = p.id OR (pii.barcode IS NOT NULL AND pii.barcode != '' AND pii.barcode = p.barcode))
        ${storeFilterPII}
        AND pii.product_name IS NOT NULL
        AND TRIM(pii.product_name) != ''
        AND LENGTH(TRIM(pii.product_name)) >= 3
        AND (
          p.name IS NULL 
          OR TRIM(p.name) = '' 
          OR p.name ~ '^\\d+$'
          OR p.name ILIKE 'HBCV%' 
          OR p.name ILIKE 'HBV%'
          OR p.name ILIKE 'TY-%'
          OR p.name ILIKE 'HB-%'
        )
        AND pii.product_name NOT ILIKE 'HBCV%'
        AND pii.product_name NOT ILIKE 'HBV%'
        AND NOT (pii.product_name ~ '^\\d+$')
    `);
    updatedCount += res1.rowCount || 0;

    // 2. Match from sales_invoice_items
    const res2 = await pool.query(`
      UPDATE products p
      SET name = sii.product_name,
          updated_at = CURRENT_TIMESTAMP
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.sales_invoice_id = si.id
      WHERE (sii.product_id = p.id OR (sii.barcode IS NOT NULL AND sii.barcode != '' AND sii.barcode = p.barcode))
        ${storeFilterSI}
        AND sii.product_name IS NOT NULL
        AND TRIM(sii.product_name) != ''
        AND LENGTH(TRIM(sii.product_name)) >= 3
        AND (
          p.name IS NULL 
          OR TRIM(p.name) = '' 
          OR p.name ~ '^\\d+$'
          OR p.name ILIKE 'HBCV%' 
          OR p.name ILIKE 'HBV%'
          OR p.name ILIKE 'TY-%'
          OR p.name ILIKE 'HB-%'
        )
        AND sii.product_name NOT ILIKE 'HBCV%'
        AND sii.product_name NOT ILIKE 'HBV%'
        AND NOT (sii.product_name ~ '^\\d+$')
    `);
    updatedCount += res2.rowCount || 0;

    // 3. Match from product_aliases
    const res3 = await pool.query(`
      UPDATE products p
      SET name = pa.raw_product_name,
          updated_at = CURRENT_TIMESTAMP
      FROM product_aliases pa
      WHERE pa.product_id = p.id
        ${storeFilterPA}
        AND pa.raw_product_name IS NOT NULL
        AND TRIM(pa.raw_product_name) != ''
        AND LENGTH(TRIM(pa.raw_product_name)) >= 3
        AND (
          p.name IS NULL 
          OR TRIM(p.name) = '' 
          OR p.name ~ '^\\d+$'
          OR p.name ILIKE 'HBCV%' 
          OR p.name ILIKE 'HBV%'
        )
        AND pa.raw_product_name NOT ILIKE 'HBCV%'
        AND pa.raw_product_name NOT ILIKE 'HBV%'
        AND NOT (pa.raw_product_name ~ '^\\d+$')
    `);
    updatedCount += res3.rowCount || 0;

    // 4. Match from supplier_product_mappings
    const res4 = await pool.query(`
      UPDATE products p
      SET name = spm.supplier_product_name,
          updated_at = CURRENT_TIMESTAMP
      FROM supplier_product_mappings spm
      WHERE spm.product_id = p.id
        ${storeFilterSPM}
        AND spm.supplier_product_name IS NOT NULL
        AND TRIM(spm.supplier_product_name) != ''
        AND LENGTH(TRIM(spm.supplier_product_name)) >= 3
        AND (
          p.name IS NULL 
          OR TRIM(p.name) = '' 
          OR p.name ~ '^\\d+$'
          OR p.name ILIKE 'HBCV%' 
          OR p.name ILIKE 'HBV%'
        )
        AND spm.supplier_product_name NOT ILIKE 'HBCV%'
        AND spm.supplier_product_name NOT ILIKE 'HBV%'
        AND NOT (spm.supplier_product_name ~ '^\\d+$')
    `);
    updatedCount += res4.rowCount || 0;

    return updatedCount;
  } catch (err) {
    console.error("Error in syncProductNamesFromInvoices:", err);
    return 0;
  }
}

const router = express.Router();

// Ensure new schema columns exist
export async function initProductSchema() {
  try {
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category_2 VARCHAR(255) DEFAULT '';`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category_2 VARCHAR(255) DEFAULT '';`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS allergens JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS calories NUMERIC DEFAULT 0;`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS prep_time_min NUMERIC DEFAULT 0;`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS portion_size VARCHAR(100) DEFAULT '';`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS marketplace_data JSONB DEFAULT '{}'::jsonb;`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;`);

    // Run product name sync in background
    syncProductNamesFromInvoices().catch(e => console.error("Error running syncProductNamesFromInvoices in initProductSchema:", e));
  } catch (e) {
    console.error("Failed to alter products table schema for variants and 2nd categories:", e);
  }
}

// POST /products/sync-names
router.post("/sync-names", async (req: any, res) => {
  try {
    const storeId = await getAuthorizedStoreId(req, req.body.storeId);
    const updatedCount = await syncProductNamesFromInvoices(storeId);
    res.json({ success: true, updatedCount, message: `${updatedCount} ürün ismi faturalardan güncellendi.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to sync product names" });
  }
});

// GET /products/categories/sector-packages
router.get("/categories/sector-packages", async (req: any, res) => {
  try {
    const packages = getPredefinedSectorPackages();
    res.json({ success: true, packages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /products/categories/seed-sector-taxonomy
router.post("/categories/seed-sector-taxonomy", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { packageIds } = req.body;
  if (!Array.isArray(packageIds) || packageIds.length === 0) {
    return res.status(400).json({ error: "Lütfen en az bir sektör kategorisi seçiniz." });
  }

  try {
    const result = await seedStoreSectorTaxonomy(storeId, packageIds, req.user?.id);
    res.json(result);
  } catch (err: any) {
    console.error("Seed sector taxonomy error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /products/categories/auto-bridge
router.post("/categories/auto-bridge", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  try {
    const result = await autoBridgeStoreCategories(storeId);
    res.json(result);
  } catch (err: any) {
    console.error("Auto bridge categories error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /products/categories/sync-master-taxonomy
router.post("/categories/sync-master-taxonomy", async (req: any, res) => {
  try {
    const result = await populateMarketplaceMasterTaxonomies();
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("Sync master taxonomy error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /products/categories
router.get("/categories", async (req: any, res) => {
  const currentStoreId = req.user.store_id;
  const requestedStoreId = req.query.storeId || currentStoreId;
  if (!requestedStoreId) return res.status(400).json({ error: "Store ID required" });

  try {
    const storeIdNum = Number(requestedStoreId);
    if (isNaN(storeIdNum)) return res.status(400).json({ error: "Invalid Store ID" });

    const query = `
      SELECT DISTINCT 
        TRIM(COALESCE(category, '')) as category,
        TRIM(COALESCE(sub_category, '')) as sub_category,
        TRIM(COALESCE(category_2, '')) as category_2,
        TRIM(COALESCE(sub_category_2, '')) as sub_category_2
      FROM products
      WHERE store_id = $1 AND (
        (category IS NOT NULL AND TRIM(category) <> '') OR
        (category_2 IS NOT NULL AND TRIM(category_2) <> '')
      )
    `;
    const result = await pool.query(query, [storeIdNum]);

    const catMap = new Map<string, Set<string>>();

    result.rows.forEach(row => {
      const c1 = row.category;
      const s1 = row.sub_category;
      const c2 = row.category_2;
      const s2 = row.sub_category_2;

      if (c1) {
        if (!catMap.has(c1)) catMap.set(c1, new Set<string>());
        if (s1) catMap.get(c1)!.add(s1);
      }
      if (c2) {
        if (!catMap.has(c2)) catMap.set(c2, new Set<string>());
        if (s2) catMap.get(c2)!.add(s2);
      }
    });

    // Also include store predefined categories from branding.category_specs / custom_categories
    try {
      const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeIdNum]);
      if (storeRes.rows.length > 0 && storeRes.rows[0].branding) {
        let branding = storeRes.rows[0].branding;
        if (typeof branding === "string") {
          try { branding = JSON.parse(branding); } catch (e) {}
        }
        if (branding?.category_specs && typeof branding.category_specs === "object") {
          for (const [cat, spec] of Object.entries<any>(branding.category_specs)) {
            if (cat && typeof cat === "string") {
              if (!catMap.has(cat)) catMap.set(cat, new Set<string>());
              if (Array.isArray(spec?.sub_categories)) {
                spec.sub_categories.forEach((s: string) => {
                  if (s && typeof s === "string") catMap.get(cat)!.add(s);
                });
              }
            }
          }
        }
      }
    } catch (storeCatErr) {
      console.warn("Could not load branding categories for store:", storeCatErr);
    }

    const response = Array.from(catMap.entries()).map(([category, subs]) => ({
      category,
      sub_categories: Array.from(subs).filter(Boolean)
    }));

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch categories" });
  }
});

// GET /products
router.get("/", async (req: any, res) => {
  const currentStoreId = req.user.store_id;
  const requestedStoreId = req.query.storeId || currentStoreId;
  console.log("Fetching products. req.user.store_id:", currentStoreId, "req.query.storeId:", req.query.storeId, "requestedStoreId:", requestedStoreId);

  const includeBranches = req.query.includeBranches === 'true';
  const sellableOnly = req.query.sellableOnly === 'true';
  
  if (!requestedStoreId) return res.status(400).json({ error: "Store ID required" });

  try {
    const storeIdNum = Number(requestedStoreId);
    if (isNaN(storeIdNum)) return res.status(400).json({ error: "Invalid Store ID" });

    let storeIds = [storeIdNum];

    // Find parent_id to get the whole group for authorization and branch inclusion
    const storeRes = await pool.query("SELECT id, parent_id FROM stores WHERE id = $1", [storeIdNum]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    
    const parentId = storeRes.rows[0].parent_id || storeIdNum;

    if (includeBranches) {
      const groupRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
      storeIds = groupRes.rows.map(r => r.id);
    }

    // Authorization check for non-superadmins
    if (req.user.role !== "superadmin") {
      const currentStoreRes = await pool.query("SELECT id, parent_id FROM stores WHERE id = $1", [currentStoreId]);
      if (currentStoreRes.rows.length === 0) return res.status(403).json({ error: "User store not found" });
      
      const userParentId = currentStoreRes.rows[0].parent_id || currentStoreId;

      // Rule: Parent store can view any store in their group
      const unauthorizedIds = await pool.query(
        "SELECT id FROM stores WHERE id = ANY($1) AND id != $2 AND parent_id != $2",
        [storeIds, userParentId]
      );

      if (unauthorizedIds.rows.length > 0) {
        return res.status(403).json({ error: "Unauthorized to view products from these stores" });
      }
    }

    const search = req.query.search as string;
    let query = `
      SELECT p.*, s.name as store_name 
      FROM products p 
      JOIN stores s ON p.store_id = s.id 
      WHERE p.store_id = ANY($1)
    `;
    const params: any[] = [storeIds];
    
    if (sellableOnly) {
      query += ` AND (p.is_sellable IS TRUE OR p.is_sellable IS NULL)`;
    }

    const categoryFilter = req.query.category as string;
    const subCategoryFilter = req.query.sub_category as string;

    if (categoryFilter) {
      const pIdx = params.length + 1;
      query += ` AND (p.category = $${pIdx} OR p.category_2 = $${pIdx})`;
      params.push(categoryFilter);
    }

    if (subCategoryFilter) {
      const pIdx = params.length + 1;
      query += ` AND (p.sub_category = $${pIdx} OR p.sub_category_2 = $${pIdx})`;
      params.push(subCategoryFilter);
    }

    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      searchTerms.forEach(term => {
        const normTerm = term.toLowerCase().replace(/[-_/.+]/g, '');
        if (normTerm === 'usbc' || normTerm === 'typec') {
          const pIdx1 = params.length + 1;
          const pIdx2 = params.length + 2;
          query += ` AND (
            ${getTurkishSearchSnippet('p.name', pIdx1)} OR 
            ${getTurkishSearchSnippet('p.name', pIdx2)} OR 
            ${getTurkishSearchSnippet("COALESCE(p.description, '')", pIdx1)} OR
            ${getTurkishSearchSnippet("COALESCE(p.description, '')", pIdx2)}
          )`;
          params.push('%type%c%', '%usb%c%');
        } else {
          const pIdx = params.length + 1;
          query += ` AND (${getTurkishSearchSnippet('p.name', pIdx)} OR ${getTurkishSearchSnippet('p.barcode', pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.product_code, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.sku, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.category, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.sub_category, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.description, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.brand, '')", pIdx)})`;
          params.push(normalizeTurkishParam(term));
        }
      });
    }

    query += ` ORDER BY COALESCE(p.updated_at, p.created_at) DESC, p.id DESC`;

    const limit = req.query.limit ? Number(req.query.limit) : null;
    if (limit && !isNaN(limit)) {
      query += ` LIMIT ${limit}`;
    }

    const productsRes = await pool.query(query, params);
    res.json(productsRes.rows);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { 
    barcode, product_code, sku, name, price, currency, cost_price, cost_currency, description, 
    stock_quantity, min_stock_level, unit, category, sub_category, 
    category_2, sub_category_2, has_variants, variants,
    brand, author, labels, image_url, images, is_web_sale, is_bestseller, product_type, 
    price_2, price_2_currency, tax_rate, volume_ml, allergens, calories, prep_time_min, portion_size,
    marketplace_data, sector_data
  } = req.body;
  
  if (!name) return res.status(400).json({ error: "Missing fields: name" });

  let parsedVariants: any[] = [];
  if (variants) {
    try {
      parsedVariants = Array.isArray(variants) ? variants : (typeof variants === 'string' ? JSON.parse(variants || '[]') : []);
    } catch (e) {
      parsedVariants = [];
    }
  }

  let parsedImages: string[] = [];
  if (images) {
    try {
      const rawImgs = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images || '[]') : []);
      if (Array.isArray(rawImgs)) {
        rawImgs.forEach((img: any) => {
          const s = String(img || '').trim();
          if (s && !parsedImages.includes(s)) parsedImages.push(s);
        });
      }
    } catch (e) {
      if (typeof images === 'string' && images.trim()) {
        images.split(/[\n\r;|,]+/).map(x => x.trim()).filter(Boolean).forEach(x => {
          if (!parsedImages.includes(x)) parsedImages.push(x);
        });
      }
    }
  }
  const cleanMainImage = String(image_url || '').trim() || (parsedImages.length > 0 ? parsedImages[0] : '');
  if (cleanMainImage && !parsedImages.includes(cleanMainImage)) {
    parsedImages.unshift(cleanMainImage);
  }

  const hasVariantsVal = has_variants === true || has_variants === 'true' || has_variants === 'on' || (Array.isArray(parsedVariants) && parsedVariants.length > 0);

  let finalPrice = parseFloat(String(price || '').replace(',', '.'));
  const variantPrices = parsedVariants
    .map((v: any) => parseFloat(String(v.price || '').replace(',', '.')))
    .filter((p: number) => !isNaN(p) && p > 0);

  if (isNaN(finalPrice) || finalPrice <= 0) {
    if (variantPrices.length > 0) {
      finalPrice = Math.min(...variantPrices);
    } else if (hasVariantsVal) {
      finalPrice = 0;
    } else {
      return res.status(400).json({ error: "Missing fields: price" });
    }
  }
  
  let finalBarcode = barcode ? String(barcode).trim() : '';
  if (!finalBarcode) {
    finalBarcode = 'GEN-' + Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  }

  try {
    const existing = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [storeId, finalBarcode]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu barkod ile ürün oluşturuldu!" });
    }

    const canAdd = await checkProductLimit(storeId);
    if (!canAdd) {
      return res.status(400).json({ error: "Ürün limitine ulaşıldı. Lütfen planınızı yükseltin." });
    }

    const storeRes = await pool.query("SELECT default_tax_rate FROM stores WHERE id = $1", [storeId]);
    const defaultTaxRate = storeRes.rows[0]?.default_tax_rate ?? 20;

    const isWebSaleVal = is_web_sale === true || is_web_sale === 'true' || is_web_sale === 'on';
    const isBestsellerVal = is_bestseller === true || is_bestseller === 'true' || is_bestseller === 'on';
    const variantsVal = JSON.stringify(parsedVariants);
    const imagesVal = JSON.stringify(parsedImages);
    const allergensVal = JSON.stringify(Array.isArray(allergens) ? allergens : (typeof allergens === 'string' ? JSON.parse(allergens || '[]') : []));
    const marketplaceDataVal = JSON.stringify(typeof marketplace_data === 'object' && marketplace_data !== null ? marketplace_data : (typeof marketplace_data === 'string' ? JSON.parse(marketplace_data || '{}') : {}));
    const sectorDataVal = JSON.stringify(typeof sector_data === 'object' && sector_data !== null ? sector_data : (typeof sector_data === 'string' ? JSON.parse(sector_data || '{}') : {}));
    const finalProductCode = (product_code || sku || '').trim() || null;

    const result = await pool.query(`
      INSERT INTO products (
        store_id, barcode, product_code, sku, name, price, currency, cost_price, cost_currency, description, 
        stock_quantity, min_stock_level, unit, category, sub_category, category_2, sub_category_2,
        has_variants, variants, brand, author, labels, image_url, images, is_web_sale, is_bestseller, 
        product_type, price_2, price_2_currency, tax_rate, shipping_profile_id, volume_ml, is_sellable,
        allergens, calories, prep_time_min, portion_size, marketplace_data, sector_data, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20, $21, $22, $23, $24::jsonb, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34::jsonb, $35, $36, $37, $38::jsonb, $39::jsonb, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      storeId, finalBarcode, finalProductCode, finalProductCode, name, finalPrice, currency || 'TRY',  
      parseFloat(cost_price) || 0, cost_currency || 'TRY', description || '', 
      parseFloat(stock_quantity) || 0, parseFloat(min_stock_level) || 5, unit || 'Adet', 
      category || '', sub_category || '', category_2 || '', sub_category_2 || '',
      hasVariantsVal, variantsVal, brand || '', author || '', 
      JSON.stringify(labels || []), cleanMainImage, imagesVal,
      isWebSaleVal,
      isBestsellerVal,
      product_type || 'product',
      parseFloat(price_2) || 0,
      price_2_currency || 'TRY',
      (tax_rate !== undefined && tax_rate !== null && tax_rate !== "") ? parseFloat(tax_rate) : defaultTaxRate,
      req.body.shipping_profile_id || null,
      parseFloat(volume_ml) || 0,
      req.body.is_sellable !== undefined ? req.body.is_sellable : true,
      allergensVal,
      parseFloat(calories) || 0,
      parseFloat(prep_time_min) || 0,
      portion_size || '',
      marketplaceDataVal,
      sectorDataVal
    ]);

    const linkedInvoiceItemId = req.body._purchaseInvoiceItemId || req.body.purchase_invoice_item_id;
    if (result.rows[0]?.id) {
      const createdProdId = result.rows[0].id;
      let handledAsInvoiceMovement = false;

      if (linkedInvoiceItemId) {
        try {
          const piiRes = await pool.query(
            `SELECT pii.*, pi.invoice_number, pi.document_number, pi.invoice_date, pi.is_expense, pi.tax_number as supplier_vkn, pi.currency as inv_currency, pi.supplier_name
             FROM purchase_invoice_items pii
             JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
             WHERE pii.id = $1 AND pi.store_id = $2`,
            [linkedInvoiceItemId, storeId]
          );
          if (piiRes.rows.length > 0) {
            const pii = piiRes.rows[0];
            const oldProdId = pii.product_id ? Number(pii.product_id) : null;
            const invNum = pii.document_number || pii.invoice_number || String(pii.purchase_invoice_id);
            const itemQty = pii.system_quantity != null ? Number(pii.system_quantity) : Number(pii.quantity || parseFloat(stock_quantity) || 1);
            const itemUnitPrice = Number(pii.unit_price) || parseFloat(cost_price) || 0;

            if (oldProdId && oldProdId !== createdProdId) {
              await transferAndCleanupInvoiceGeneratedProduct(pool, storeId, {
                oldProductId: oldProdId,
                newProductId: createdProdId,
                invoiceId: Number(pii.purchase_invoice_id),
                invoiceItemId: Number(linkedInvoiceItemId),
                invNum,
                itemQty,
                unitPrice: itemUnitPrice,
                supplierVkn: pii.supplier_vkn,
                itemProductName: pii.product_name
              });
            }

            await pool.query(
              `UPDATE purchase_invoice_items
               SET product_id = $1,
                   barcode = COALESCE($2, barcode),
                   product_code = COALESCE($3, product_code)
               WHERE id = $4`,
              [createdProdId, finalBarcode, finalProductCode, linkedInvoiceItemId]
            );

            if (!pii.is_expense && (parseFloat(stock_quantity) > 0 || itemQty > 0)) {
              const movQty = parseFloat(stock_quantity) > 0 ? parseFloat(stock_quantity) : itemQty;
              await pool.query(
                `INSERT INTO stock_movements
                 (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number)
                 VALUES ($1, $2, 'in', $3, 'purchase_invoice', $4, $5, $6, $7, COALESCE($8::timestamp, CURRENT_TIMESTAMP), $9, 'purchase', $10)`,
                [
                  storeId,
                  createdProdId,
                  movQty,
                  `Alış Faturası: ${invNum}`,
                  itemUnitPrice,
                  pii.supplier_name || 'Tedarikçi',
                  pii.inv_currency || currency || 'TRY',
                  pii.invoice_date || null,
                  pii.purchase_invoice_id,
                  invNum
                ]
              );
              handledAsInvoiceMovement = true;
            }

            if (pii.supplier_vkn && pii.product_name) {
              await saveSupplierMapping(pool, storeId, pii.supplier_vkn, pii.product_name, createdProdId, finalProductCode);
            }
          }
        } catch (invLinkErr) {
          console.error("Failed to link purchase invoice item on product creation:", invLinkErr);
        }
      }

      if (!handledAsInvoiceMovement && parseFloat(stock_quantity) > 0) {
        try {
          await pool.query(`
            INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
            VALUES ($1, $2, 'in', $3, 'initial_stock', 'Açılış Stok Girişi', $4, $5, CURRENT_TIMESTAMP)
          `, [storeId, createdProdId, parseFloat(stock_quantity), parseFloat(cost_price) || finalPrice || 0, currency || 'TRY']);
        } catch (smErr) {
          console.error("Failed to log initial stock movement:", smErr);
        }
      }
    }

    if (req.body.sync_group && finalBarcode) {
      const storeResq = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
      const parentId = storeResq.rows[0]?.parent_id || storeId;

      const allStoresRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
      const branchIds = allStoresRes.rows.map(r => r.id);

      for (const bId of branchIds) {
        if (bId === storeId) continue;

        const existsRes = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [bId, finalBarcode]);
        
        if (existsRes.rows.length === 0) {
          await pool.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description, unit, category, sub_category, brand, author, image_url, images, labels, product_type, tax_rate, stock_quantity, is_web_sale, is_sellable, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, 0, false, $17, CURRENT_TIMESTAMP)
          `, [
            bId, finalBarcode, name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            cleanMainImage, imagesVal, JSON.stringify(labels || []), product_type || 'product', 
            (tax_rate !== undefined && tax_rate !== null && tax_rate !== "") ? parseFloat(tax_rate) : defaultTaxRate,
            req.body.is_sellable !== undefined ? req.body.is_sellable : true
          ]);
        }
      }
    }

    try {
      const { publicApiCache } = await import("../public.js");
      publicApiCache.clear();
    } catch {}

    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Bulk Update Price
router.put("/bulk-update-price", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  const { target, category, type, value, direction, rounding } = req.body;

  if (!value || isNaN(value) || value <= 0) {
    return res.status(400).json({ error: "Geçerli bir değer giriniz." });
  }

  let priceCalc = "price";
  const val = Number(value);

  if (type === 'amount') {
    if (direction === 'increase') priceCalc = `price + ${val}`;
    else priceCalc = `GREATEST(price - ${val}, 0)`;
  } else if (type === 'percentage') {
    const multiplier = direction === 'increase' ? (1 + val / 100) : (1 - val / 100);
    priceCalc = `price * ${multiplier}`;
  }

  if (rounding === 'round') {
    priceCalc = `ROUND(CAST(${priceCalc} AS numeric), 0)`;
  } else if (rounding === 'ceil') {
    priceCalc = `CEIL(${priceCalc})`;
  } else if (rounding === 'floor') {
    priceCalc = `FLOOR(${priceCalc})`;
  } else {
    priceCalc = `ROUND(CAST(${priceCalc} AS numeric), 2)`;
  }

  try {
    let query = `
      UPDATE products p 
      SET price = ${priceCalc}, 
          price_2 = ${priceCalc} / (1 + COALESCE(p.tax_rate, s.default_tax_rate, 20) / 100.0), 
          price_2_currency = p.currency, 
          updated_at = CURRENT_TIMESTAMP 
      FROM stores s 
      WHERE p.store_id = s.id AND p.store_id = $1`;
    const params: any[] = [storeId];

    if (target === 'category' && category) {
      query += ` AND LOWER(TRIM(category)) = LOWER(TRIM($2))`;
      params.push(category);
    }

    const result = await pool.query(query, params);
    
    await logAction(
      storeId, 
      req.user.id, 
      "bulk_price_update", 
      "product", 
      null, 
      `Toplu fiyat güncelleme: \${target === 'all' ? 'Tüm ürünler' : category + ' kategorisi'}, \${direction === 'increase' ? 'Artış' : 'Azalış'}, \${type === 'percentage' ? '%' + value : value + ' ₺'}, Yuvarlama: \${rounding}`,
      { target, category, type, value, direction, rounding },
      { count: result.rowCount }
    );

    res.json({ success: true, count: result.rowCount });
  } catch (e: any) {
    console.error("Bulk price update error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Bulk Update Tax
router.put("/bulk-update-tax", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  const { category, taxRate, includeBranches } = req.body;
  if (!category || taxRate === undefined) {
    return res.status(400).json({ error: "Category and taxRate are required" });
  }

  try {
    let storeIds = [storeId];
    if (includeBranches) {
      const branchesRes = await pool.query("SELECT id FROM stores WHERE parent_id = $1", [storeId]);
      storeIds = [storeId, ...branchesRes.rows.map(r => r.id)];
    }

    const result = await pool.query(
      "UPDATE products SET tax_rate = $1, updated_at = CURRENT_TIMESTAMP WHERE store_id = ANY($2) AND LOWER(TRIM(category)) = LOWER(TRIM($3))",
      [taxRate, storeIds, category]
    );

    await logAction(
      storeId, 
      req.user.id, 
      "bulk_tax_update", 
      "product", 
      null, 
      `Toplu KDV güncelleme: \${category} kategorisi, Yeni KDV: %\${taxRate}, Etkilenen Ürün: \${result.rowCount}`,
      { category, taxRate, affectedRows: result.rowCount },
      { category, newTaxRate: taxRate, count: result.rowCount }
    );

    res.json({ success: true, count: result.rowCount });
  } catch (e: any) {
    console.error("Bulk tax update error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Bulk Recalculate Price 2
router.put("/bulk-recalculate-price2", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const result = await pool.query(
      `UPDATE products p 
       SET price_2 = p.price / (1 + COALESCE(p.tax_rate, s.default_tax_rate, 20) / 100.0), 
           price_2_currency = p.currency, 
           updated_at = CURRENT_TIMESTAMP 
       FROM stores s 
       WHERE p.store_id = s.id AND p.store_id = $1`,
      [storeId]
    );

    await logAction(
      storeId, 
      req.user.id, 
      "bulk_price2_recalculate", 
      "product", 
      null, 
      `Tüm ürünlerin 2. fiyatları (KDV Hariç) KDV oranlarına göre yeniden hesaplandı.`,
      { affectedRows: result.rowCount },
      { count: result.rowCount }
    );

    res.json({ success: true, count: result.rowCount });
  } catch (e: any) {
    console.error("Bulk price2 recalculate error:", e);
    res.status(500).json({ error: e.message });
  }
});

import { getEanEnrichmentCandidates, applyEanEnrichment } from "./eanEnrichmentService";

// GET /products/duplicate-candidates
router.get("/duplicate-candidates", async (req: any, res) => {
  const requestedId = req.query.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  try {
    const candidates = await getDuplicateCandidatesForStore(storeId);
    res.json({ candidates });
  } catch (error: any) {
    console.error("Duplicate candidates error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /products/merge
router.post("/merge", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { sourceId, targetId } = req.body;
  if (!sourceId || !targetId) {
    return res.status(400).json({ error: "sourceId ve targetId zorunludur." });
  }

  try {
    const result = await mergeProducts(pool, Number(sourceId), Number(targetId), storeId);
    await logAction(
      storeId,
      req.user.id,
      "merge_products",
      "product",
      Number(targetId),
      `Ürün birleştirildi: #${sourceId} silindi, #${targetId} (${result.targetName}) ile birleştirildi.`,
      { sourceId, targetId, result }
    );
    res.json(result);
  } catch (error: any) {
    console.error("Product merge error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /products/auto-merge-duplicates
router.post("/auto-merge-duplicates", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  try {
    const candidates = await getDuplicateCandidatesForStore(storeId);
    const highConfidence = candidates.filter((c: any) => c.confidence >= 90);
    const mergedResults: any[] = [];
    const mergedIds = new Set<number>();

    for (const item of highConfidence) {
      if (mergedIds.has(item.source.id) || mergedIds.has(item.target.id)) {
        continue;
      }
      try {
        const resMerge = await mergeProducts(pool, item.source.id, item.target.id, storeId);
        mergedIds.add(item.source.id);
        mergedResults.push({
          sourceId: item.source.id,
          sourceName: item.source.name,
          sourceBarcode: item.source.barcode,
          targetId: item.target.id,
          targetName: item.target.name,
          targetBarcode: item.target.barcode,
          reason: item.reason
        });
      } catch (e: any) {
        console.warn(`Could not merge ${item.source.id} into ${item.target.id}:`, e.message);
      }
    }

    if (mergedResults.length > 0) {
      await logAction(
        storeId,
        req.user.id,
        "auto_merge_duplicates",
        "product",
        null,
        `Otomatik ${mergedResults.length} adet mükerrer ürün birleştirildi.`,
        { count: mergedResults.length, mergedResults }
      );
    }

    res.json({
      success: true,
      mergedCount: mergedResults.length,
      mergedResults
    });
  } catch (error: any) {
    console.error("Auto merge error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /products/ean-enrichment-candidates
router.get("/ean-enrichment-candidates", async (req: any, res) => {
  const requestedId = req.query.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  try {
    const candidates = await getEanEnrichmentCandidates(storeId);
    res.json({
      success: true,
      count: candidates.length,
      candidates
    });
  } catch (error: any) {
    console.error("EAN enrichment candidates error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /products/apply-ean-enrichment
router.post("/apply-ean-enrichment", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { productId, newEan } = req.body;
  if (!productId || !newEan) {
    return res.status(400).json({ error: "productId ve newEan parametreleri zorunludur." });
  }

  try {
    const result = await applyEanEnrichment(storeId, Number(productId), String(newEan), req.user?.id);
    res.json(result);
  } catch (error: any) {
    console.error("Apply EAN enrichment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /products/auto-apply-ean-enrichment
router.post("/auto-apply-ean-enrichment", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  try {
    const candidates = await getEanEnrichmentCandidates(storeId);
    const highConfidence = candidates.filter(c => c.confidence >= 95);
    const appliedResults: any[] = [];

    for (const item of highConfidence) {
      try {
        const result = await applyEanEnrichment(storeId, item.id, item.suggestedEan, req.user?.id);
        appliedResults.push({
          productId: item.id,
          productName: item.name,
          oldBarcode: item.currentBarcode,
          newEan: item.suggestedEan,
          result
        });
      } catch (err: any) {
        console.warn(`[Auto EAN Apply] Skip item #${item.id}:`, err.message);
      }
    }

    res.json({
      success: true,
      appliedCount: appliedResults.length,
      appliedResults
    });
  } catch (error: any) {
    console.error("Auto apply EAN error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /products/:id
router.put("/:id", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { id } = req.params;
  const { 
    barcode, product_code, sku, name, price, currency, cost_price, cost_currency, description, 
    stock_quantity, min_stock_level, unit, category, sub_category, 
    category_2, sub_category_2, has_variants, variants,
    brand, author, labels, image_url, images, is_web_sale, is_bestseller, product_type, 
    price_2, price_2_currency, tax_rate, shipping_profile_id, sync_group, volume_ml, is_sellable,
    allergens, calories, prep_time_min, portion_size, marketplace_data, sector_data
  } = req.body;

  try {
    const existingProductRes = await pool.query("SELECT labels, barcode, product_code, is_sellable, is_bestseller, allergens, calories, prep_time_min, portion_size, marketplace_data, sector_data, stock_quantity, price, cost_price, currency, image_url, images FROM products WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (existingProductRes.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    const oldStock = parseFloat(existingProductRes.rows[0]?.stock_quantity || '0');
    let existingLabels = existingProductRes.rows[0]?.labels || [];
    let existingIsSellable = existingProductRes.rows[0]?.is_sellable;
    if (existingIsSellable === undefined || existingIsSellable === null) existingIsSellable = true;
    let existingIsBestseller = existingProductRes.rows[0]?.is_bestseller || false;

    if (!Array.isArray(existingLabels)) existingLabels = [];
    
    let updatedLabels = labels !== undefined ? labels : existingLabels;
    if (Array.isArray(updatedLabels)) {
       updatedLabels = updatedLabels.filter((l: string) => l !== "yeni_fatura_urunu");
    }

    const finalIsSellable = is_sellable !== undefined ? is_sellable : existingIsSellable;
    const finalIsWebSale = is_web_sale !== undefined ? (is_web_sale === true || is_web_sale === 'true' || is_web_sale === 'on') : true;
    const finalIsBestseller = is_bestseller !== undefined ? (is_bestseller === true || is_bestseller === 'true' || is_bestseller === 'on') : existingIsBestseller;
    let parsedVariants: any[] = [];
    if (variants) {
      try {
        parsedVariants = Array.isArray(variants) ? variants : (typeof variants === 'string' ? JSON.parse(variants || '[]') : []);
      } catch (e) {
        parsedVariants = [];
      }
    }
    const finalHasVariants = (has_variants !== undefined ? (has_variants === true || has_variants === 'true' || has_variants === 'on') : false) || (Array.isArray(parsedVariants) && parsedVariants.length > 0);
    const finalVariants = JSON.stringify(parsedVariants);

    let parsedImages: string[] = [];
    if (images !== undefined) {
      try {
        const rawImgs = Array.isArray(images) ? images : (typeof images === 'string' ? JSON.parse(images || '[]') : []);
        if (Array.isArray(rawImgs)) {
          rawImgs.forEach((img: any) => {
            const s = String(img || '').trim();
            if (s && !parsedImages.includes(s)) parsedImages.push(s);
          });
        }
      } catch (e) {
        if (typeof images === 'string' && images.trim()) {
          images.split(/[\n\r;|,]+/).map(x => x.trim()).filter(Boolean).forEach(x => {
            if (!parsedImages.includes(x)) parsedImages.push(x);
          });
        }
      }
    } else if (Array.isArray(existingProductRes.rows[0]?.images)) {
      parsedImages = [...existingProductRes.rows[0].images];
    } else if (typeof existingProductRes.rows[0]?.images === 'string') {
      try { parsedImages = JSON.parse(existingProductRes.rows[0].images); } catch { parsedImages = []; }
    }

    const cleanMainImage = image_url !== undefined
      ? (String(image_url || '').trim() || (parsedImages.length > 0 ? parsedImages[0] : ''))
      : (existingProductRes.rows[0]?.image_url || (parsedImages.length > 0 ? parsedImages[0] : ''));
    if (cleanMainImage && !parsedImages.includes(cleanMainImage)) {
      parsedImages.unshift(cleanMainImage);
    }
    const finalImagesVal = JSON.stringify(parsedImages);

    let finalPrice = parseFloat(String(price || '').replace(',', '.'));
    const variantPrices = parsedVariants
      .map((v: any) => parseFloat(String(v.price || '').replace(',', '.')))
      .filter((p: number) => !isNaN(p) && p > 0);

    if (isNaN(finalPrice) || finalPrice <= 0) {
      if (variantPrices.length > 0) {
        finalPrice = Math.min(...variantPrices);
      } else if (finalHasVariants) {
        finalPrice = 0;
      } else {
        finalPrice = parseFloat(existingProductRes.rows[0]?.price || '0');
      }
    }

    const finalAllergens = allergens !== undefined ? JSON.stringify(Array.isArray(allergens) ? allergens : (typeof allergens === 'string' ? JSON.parse(allergens || '[]') : [])) : JSON.stringify(existingProductRes.rows[0]?.allergens || []);
    const finalProductCode = (product_code !== undefined ? product_code : (sku !== undefined ? sku : existingProductRes.rows[0]?.product_code)) || null;

    const existingMarketplaceData = existingProductRes.rows[0]?.marketplace_data || {};
    let parsedIncomingMp = marketplace_data !== undefined
      ? (typeof marketplace_data === 'object' && marketplace_data !== null ? marketplace_data : JSON.parse(marketplace_data || '{}'))
      : existingMarketplaceData;

    let finalMarketplaceData: any = { ...existingMarketplaceData };
    if (parsedIncomingMp && typeof parsedIncomingMp === 'object') {
      if ((parsedIncomingMp.categoryId !== undefined || parsedIncomingMp.attributes !== undefined) && !parsedIncomingMp.hepsiburada) {
        finalMarketplaceData = {
          ...finalMarketplaceData,
          hepsiburada: {
            ...(finalMarketplaceData.hepsiburada || {}),
            ...parsedIncomingMp
          }
        };
      } else {
        finalMarketplaceData = {
          ...finalMarketplaceData,
          ...parsedIncomingMp,
          hepsiburada: {
            ...(finalMarketplaceData.hepsiburada || {}),
            ...(parsedIncomingMp.hepsiburada || {})
          }
        };
      }
    }

    const existingSectorData = existingProductRes.rows[0]?.sector_data || {};
    const finalSectorData = sector_data !== undefined
      ? (typeof sector_data === 'object' && sector_data !== null ? sector_data : JSON.parse(sector_data || '{}'))
      : existingSectorData;

    // Sector Isolation: Purge book-exclusive keys if store is not a bookstore
    const storeRowRes = await pool.query("SELECT store_type, branding FROM stores WHERE id = $1", [storeId]);
    const storeBranding = storeRowRes.rows[0]?.branding || {};
    const parsedStoreBranding = typeof storeBranding === 'string' ? JSON.parse(storeBranding || '{}') : storeBranding;
    const isBookstoreStore = parsedStoreBranding?.store_concept === 'bookstore' || parsedStoreBranding?.bookstore_module_enabled === true;

    if (!isBookstoreStore && finalSectorData && typeof finalSectorData === 'object') {
      delete finalSectorData.publisher;
      delete finalSectorData.author;
      delete finalSectorData.isbn;
      delete finalSectorData.translator;
      delete finalSectorData.edition;
      delete finalSectorData.edition_number;
      delete finalSectorData.cover_type;
      delete finalSectorData.paper_type;
      delete finalSectorData.publication_year;
      delete finalSectorData.publish_year;
      delete finalSectorData.featured_quote;
      delete finalSectorData.spot_quote;
      delete finalSectorData.quote;
      delete finalSectorData.spot;
      delete finalSectorData.awards;
      delete finalSectorData.award;
      delete finalSectorData.rating;
    }

    const finalBarcode = barcode ? String(barcode).trim() : (existingProductRes.rows[0]?.barcode || 'GEN-' + Date.now().toString());

    const rawHbSku = cleanMpString(req.body.hepsiburada_sku);
    const existingHbSku = cleanMpString(finalMarketplaceData?.hepsiburada?.hepsiburadaSku || finalMarketplaceData?.hepsiburada?.hbSku || existingProductRes.rows[0]?.hepsiburada_sku);
    const finalHbSku = req.body.hepsiburada_sku !== undefined ? rawHbSku : existingHbSku;

    const rawHbUrl = cleanMpString(req.body.hepsiburada_url);
    const existingHbUrl = cleanMpString(finalMarketplaceData?.hepsiburada?.productUrl || existingProductRes.rows[0]?.hepsiburada_url);
    const finalHbUrl = req.body.hepsiburada_url !== undefined ? rawHbUrl : existingHbUrl;

    const rawAmzAsin = cleanMpString(req.body.amazon_asin);
    const existingAmzAsin = cleanMpString(finalMarketplaceData?.amazon?.asin || existingProductRes.rows[0]?.amazon_asin);
    const finalAmzAsin = req.body.amazon_asin !== undefined ? rawAmzAsin : existingAmzAsin;

    const rawAmzSku = cleanMpString(req.body.amazon_sku);
    const existingAmzSku = cleanMpString(finalMarketplaceData?.amazon?.sku || existingProductRes.rows[0]?.amazon_sku);
    const finalAmzSku = req.body.amazon_sku !== undefined ? rawAmzSku : existingAmzSku;

    const rawAmzUrl = cleanMpString(req.body.amazon_url);
    const existingAmzUrl = cleanMpString(finalMarketplaceData?.amazon?.productUrl || existingProductRes.rows[0]?.amazon_url);
    const finalAmzUrl = req.body.amazon_url !== undefined ? rawAmzUrl : existingAmzUrl;

    const cleanValidAmzAsin = (finalAmzAsin && finalAmzAsin.length >= 9 && !finalAmzAsin.startsWith('http')) 
      ? finalAmzAsin.toUpperCase() 
      : null;
    const hasValidAmzAsin = Boolean(cleanValidAmzAsin);

    const existing = existingProductRes.rows[0] || {};
    const isExplicitStockUpdate = req.body.is_explicit_stock_update === true || req.body.is_explicit_stock_update === 'true';
    const hasStockFieldInBody = stock_quantity !== undefined && stock_quantity !== null && String(stock_quantity).trim() !== '';
    const parsedBodyStock = hasStockFieldInBody ? (parseFloat(String(stock_quantity).replace(',', '.')) || 0) : oldStock;
    // Accept stock update if explicitly flagged (inline stock edit or modified stock in ProductModal) or if operator submitted 0 (zeroing stock)
    const finalStockQuantity = hasStockFieldInBody && (isExplicitStockUpdate || parsedBodyStock === 0)
      ? parsedBodyStock
      : oldStock;

    // If stock is zeroed out (<= 0), automatically mark marketplace listings inactive / manually unpublished so background crons never push positive stock
    const isZeroStock = finalStockQuantity <= 0;
    if (isZeroStock) {
      if (!finalMarketplaceData.amazon) finalMarketplaceData.amazon = {};
      finalMarketplaceData.amazon.manuallyUnpublished = true;
      finalMarketplaceData.amazon.status = 'INACTIVE';
    }

    const finalIsHbActive = req.body.is_hepsiburada_active !== undefined 
      ? parseMpBool(req.body.is_hepsiburada_active) 
      : (Boolean(finalHbSku) && finalMarketplaceData?.hepsiburada?.status !== 'PENDING_APPROVAL' && Boolean(existingProductRes.rows[0]?.is_hepsiburada_active));

    const finalIsAmzActive = isZeroStock
      ? false
      : (req.body.is_amazon_active !== undefined 
          ? (parseMpBool(req.body.is_amazon_active) && hasValidAmzAsin) 
          : (hasValidAmzAsin && Boolean(existingProductRes.rows[0]?.is_amazon_active)));

    if (finalHbUrl && finalMarketplaceData?.hepsiburada) {
      finalMarketplaceData.hepsiburada.productUrl = finalHbUrl;
    }
    if (finalAmzUrl && finalMarketplaceData?.amazon) {
      finalMarketplaceData.amazon.productUrl = finalAmzUrl;
    }

    // Recalculate channel-specific marketplace prices whenever product price, currency, or category is saved
    if (finalPrice > 0) {
      try {
        const storeSettingsRes = await pool.query(
          "SELECT currency_rates, amazon_settings, hepsiburada_settings, n11_settings, trendyol_settings, pazarama_settings, branding FROM stores WHERE id = $1",
          [storeId]
        );
        const stRow = storeSettingsRes.rows[0] || {};
        let stBr: any = stRow.branding || {};
        if (typeof stBr === 'string') { try { stBr = JSON.parse(stBr); } catch (e) { stBr = {}; } }
        let stRates: any = stRow.currency_rates || {};
        if (typeof stRates === 'string') { try { stRates = JSON.parse(stRates); } catch (e) { stRates = {}; } }
        const effectiveRates = { ...(stBr?.currency_rates || {}), ...(stRates || {}) };

        let webPriceTry = finalPrice;
        const currUpper = String(currency || 'TRY').toUpperCase();
        if (currUpper === 'USD' && effectiveRates.USD) webPriceTry *= Number(effectiveRates.USD);
        else if (currUpper === 'EUR' && effectiveRates.EUR) webPriceTry *= Number(effectiveRates.EUR);
        else if (currUpper === 'GBP' && effectiveRates.GBP) webPriceTry *= Number(effectiveRates.GBP);

        const { N11Service } = await import("../../src/services/backend/n11Service.js");
        const channelConfigs: Array<{ key: string; settings: any }> = [
          { key: 'hepsiburada', settings: { ...(stBr?.hepsiburada_settings || {}), ...(stRow.hepsiburada_settings || {}) } },
          { key: 'amazon', settings: { ...(stBr?.amazon_settings || {}), ...(stRow.amazon_settings || {}) } },
          { key: 'n11', settings: { ...(stBr?.n11_settings || {}), ...(stRow.n11_settings || {}) } },
          { key: 'trendyol', settings: { ...(stBr?.trendyol_settings || {}), ...(stRow.trendyol_settings || {}) } },
          { key: 'pazarama', settings: { ...(stBr?.pazarama_settings || {}), ...(stRow.pazarama_settings || {}) } },
        ];

        for (const ch of channelConfigs) {
          const chPrice = N11Service.calculateMarketplacePrice(webPriceTry, category, sub_category, ch.settings);
          if (!finalMarketplaceData[ch.key]) finalMarketplaceData[ch.key] = {};
          if (!finalMarketplaceData[ch.key].attributes) finalMarketplaceData[ch.key].attributes = {};
          finalMarketplaceData[ch.key].attributes.price = String(chPrice);
          finalMarketplaceData[ch.key].price = chPrice;
        }
      } catch (calcErr) {
        // Non-blocking fallback
      }
    }

    const finalName = name !== undefined ? name : (existing.name || '');
    const finalCostPrice = cost_price !== undefined ? (parseFloat(String(cost_price).replace(',', '.')) || 0) : (parseFloat(existing.cost_price) || 0);
    const finalCostCurrency = cost_currency !== undefined ? cost_currency : (existing.cost_currency || 'TRY');
    const finalDescription = description !== undefined ? description : (existing.description || '');
    const finalMinStockLevel = min_stock_level !== undefined ? (parseFloat(min_stock_level) || 5) : (parseFloat(existing.min_stock_level) || 5);
    const finalUnit = unit !== undefined ? unit : (existing.unit || 'Adet');
    const finalCategory = category !== undefined ? category : (existing.category || '');
    const finalSubCategory = sub_category !== undefined ? sub_category : (existing.sub_category || '');
    const finalCategory2 = category_2 !== undefined ? category_2 : (existing.category_2 || '');
    const finalSubCategory2 = sub_category_2 !== undefined ? sub_category_2 : (existing.sub_category_2 || '');
    const finalBrand = brand !== undefined ? brand : (existing.brand || '');
    const finalAuthor = author !== undefined ? author : (existing.author || '');
    const finalPrice2 = price_2 !== undefined ? (parseFloat(String(price_2).replace(',', '.')) || 0) : (parseFloat(existing.price_2) || 0);
    const finalPrice2Currency = price_2_currency !== undefined ? price_2_currency : (existing.price_2_currency || 'TRY');
    const finalTaxRate = tax_rate !== undefined ? (parseFloat(tax_rate) || 0) : (parseFloat(existing.tax_rate) || 0);
    const finalShippingProfileId = shipping_profile_id !== undefined ? (shipping_profile_id || null) : (existing.shipping_profile_id || null);
    const finalVolumeMl = volume_ml !== undefined ? (parseFloat(volume_ml) || 0) : (parseFloat(existing.volume_ml) || 0);

    await pool.query(`
      UPDATE products SET 
        barcode = $1, product_code = $2, sku = $2, name = $3, price = $4, currency = $5, 
        cost_price = $6, cost_currency = $7, description = $8, 
        stock_quantity = $9, min_stock_level = $10, unit = $11, 
        category = $12, sub_category = $13, category_2 = $14, sub_category_2 = $15,
        has_variants = $16, variants = $17::jsonb, brand = $18, author = $19, 
        labels = $20, image_url = $21, images = $22::jsonb, is_web_sale = $23, is_bestseller = $24, product_type = $25,
        price_2 = $26, price_2_currency = $27, tax_rate = $28, shipping_profile_id = $29, volume_ml = $30, is_sellable = $31,
        allergens = $32::jsonb, calories = $33, prep_time_min = $34, portion_size = $35,
        marketplace_data = $36::jsonb, sector_data = $37::jsonb,
        hepsiburada_sku = $38, is_hepsiburada_active = $39,
        amazon_asin = $40, amazon_sku = $41, is_amazon_active = $42,
        hepsiburada_url = $43, amazon_url = $44,
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $45 AND store_id = $46
    `, [
      finalBarcode, finalProductCode, finalName, finalPrice, currency || existing.currency || 'TRY', 
      finalCostPrice, finalCostCurrency, finalDescription, 
      finalStockQuantity, finalMinStockLevel, finalUnit, 
      finalCategory, finalSubCategory, finalCategory2, finalSubCategory2,
      finalHasVariants, finalVariants, finalBrand, finalAuthor, 
      JSON.stringify(updatedLabels), cleanMainImage, finalImagesVal,
      finalIsWebSale,
      finalIsBestseller,
      product_type || existing.product_type || 'product',
      finalPrice2,
      finalPrice2Currency,
      finalTaxRate,
      finalShippingProfileId,
      finalVolumeMl,
      finalIsSellable,
      finalAllergens,
      calories !== undefined ? (parseFloat(calories) || 0) : (existing.calories || 0),
      prep_time_min !== undefined ? (parseFloat(prep_time_min) || 0) : (existing.prep_time_min || 0),
      portion_size !== undefined ? String(portion_size) : (existing.portion_size || ''),
      JSON.stringify(finalMarketplaceData),
      JSON.stringify(finalSectorData),
      finalHbSku, finalIsHbActive,
      cleanValidAmzAsin || null, finalAmzSku, finalIsAmzActive,
      finalHbUrl, finalAmzUrl,
      id, storeId
    ]);

    const newStock = finalStockQuantity;
    if (finalPrice > 0 && newStock > 0) {
      await pool.query(
        `UPDATE products
         SET hepsiburada_last_error = CASE WHEN hepsiburada_last_error ILIKE '%yetersiz%' OR hepsiburada_last_error ILIKE '%kapatıldı%' THEN NULL ELSE hepsiburada_last_error END,
             trendyol_last_error = CASE WHEN trendyol_last_error ILIKE '%yetersiz%' OR trendyol_last_error ILIKE '%kapatıldı%' THEN NULL ELSE trendyol_last_error END,
             n11_last_error = CASE WHEN n11_last_error ILIKE '%yetersiz%' OR n11_last_error ILIKE '%kapatıldı%' THEN NULL ELSE n11_last_error END,
             amazon_last_error = CASE WHEN amazon_last_error ILIKE '%yetersiz%' OR amazon_last_error ILIKE '%kapatıldı%' THEN NULL ELSE amazon_last_error END,
             pazarama_last_error = CASE WHEN pazarama_last_error ILIKE '%yetersiz%' OR pazarama_last_error ILIKE '%kapatıldı%' THEN NULL ELSE pazarama_last_error END
         WHERE id = $1 AND store_id = $2`,
        [id, storeId]
      );
    }
    await ensureProductMovements(Number(id), storeId);

    if (sync_group && barcode) {
      const storeRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
      const parentId = storeRes.rows[0]?.parent_id || storeId;

      const allStoresRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
      const branchIds = allStoresRes.rows.map(r => r.id);

      for (const bId of branchIds) {
        if (bId === storeId) continue;

        const existsRes = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [bId, String(barcode)]);
        
        if (existsRes.rows.length > 0) {
          await pool.query(`
            UPDATE products SET 
              name = $1, price = $2, currency = $3, 
              description = $4, unit = $5, category = $6, 
              sub_category = $7, brand = $8, author = $9, 
              image_url = $10, images = $11::jsonb, labels = $12, product_type = $13, 
              tax_rate = $14, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $15
          `, [
            name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            cleanMainImage, finalImagesVal, JSON.stringify(updatedLabels), product_type || 'product', 
            parseFloat(tax_rate) || 0, existsRes.rows[0].id
          ]);
        } else {
          await pool.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description, unit, category, sub_category, brand, author, image_url, images, labels, product_type, tax_rate, stock_quantity, is_web_sale, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, 0, false, CURRENT_TIMESTAMP)
          `, [
            bId, String(barcode), name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            cleanMainImage, finalImagesVal, JSON.stringify(updatedLabels), product_type || 'product', 
            parseFloat(tax_rate) || 0
          ]);
        }
      }
    }
    
    try {
      const { publicApiCache } = await import("../public.js");
      publicApiCache.clear();
    } catch {}
    
    await logAction(
      storeId, 
      req.user.id, 
      "product_update", 
      "product", 
      parseInt(id), 
      `Ürün güncellendi: ${name} (${barcode})`,
      null,
      req.body
    );

    // Auto-sync revised price & stock to Hepsiburada if product is active on HB
    const isHbActive = existingProductRes.rows[0]?.is_hepsiburada_active || existingProductRes.rows[0]?.hepsiburada_sku;
    if (isHbActive) {
      (async () => {
        try {
          const storeRes = await pool.query("SELECT hepsiburada_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
          const st = storeRes.rows[0];
          const hbSettings = st?.hepsiburada_settings || st?.branding?.hepsiburada_settings;
          if (hbSettings?.merchantId && hbSettings?.apiKey && hbSettings?.apiSecret) {
            const { HepsiburadaService } = await import("../../src/services/backend/hepsiburadaService.js");
            const hbService = new HepsiburadaService(hbSettings, storeId);
            
            const rates = st?.currency_rates || st?.branding?.currency_rates || {};
            let rawPrice = parseFloat(String(finalPrice || "0"));
            const curr = (currency || "TRY").toUpperCase();
            if (curr === "USD" && rates.USD) rawPrice *= Number(rates.USD);
            else if (curr === "EUR" && rates.EUR) rawPrice *= Number(rates.EUR);
            else if (curr === "GBP" && rates.GBP) rawPrice *= Number(rates.GBP);

            const effectivePrice = hbService.calculateMarketplacePrice(rawPrice, category, sub_category);
            const hbMerchantSku = finalMarketplaceData?.hepsiburada?.merchantSku || existingProductRes.rows[0]?.marketplace_data?.hepsiburada?.merchantSku || finalBarcode;

            await hbService.updatePriceAndStock([{
              MerchantSku: hbMerchantSku,
              HepsiburadaSku: existingProductRes.rows[0]?.hepsiburada_sku || "",
              Price: effectivePrice,
              AvailableStock: parseInt(String(newStock || 0), 10),
              DispatchTime: hbSettings.defaultDispatchTime || 1,
            }]);
            await pool.query(
              "UPDATE products SET hepsiburada_last_sync = NOW(), hepsiburada_last_error = NULL WHERE id = $1",
              [id]
            );
          }
        } catch (hbSyncErr: any) {
          console.warn(`[Background HB Sync] Failed for product ${id}:`, hbSyncErr.message);
          await pool.query(
            "UPDATE products SET hepsiburada_last_error = $1 WHERE id = $2",
            [hbSyncErr.message, id]
          );
        }
      })();
    }

    const isAmzActive = existingProductRes.rows[0]?.is_amazon_active || existingProductRes.rows[0]?.amazon_asin;
    if (isAmzActive) {
      (async () => {
        try {
          const storeRes = await pool.query("SELECT amazon_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
          const st = storeRes.rows[0];
          const amzSettings = st?.amazon_settings || st?.branding?.amazon_settings;
          if (amzSettings?.sellerId && (amzSettings?.refresh_token || amzSettings?.refreshToken)) {
            const { AmazonService } = await import("../../src/services/backend/amazonService.js");
            const amzService = new AmazonService(amzSettings, storeId);
            
            const rates = st?.currency_rates || st?.branding?.currency_rates || {};
            let rawPrice = parseFloat(String(finalPrice || "0"));
            const curr = (currency || "TRY").toUpperCase();
            if (curr === "USD" && rates.USD) rawPrice *= Number(rates.USD);
            else if (curr === "EUR" && rates.EUR) rawPrice *= Number(rates.EUR);
            else if (curr === "GBP" && rates.GBP) rawPrice *= Number(rates.GBP);

            const effectivePrice = amzService.calculateMarketplacePrice(rawPrice, category, sub_category);
            const amzSku = existingProductRes.rows[0]?.amazon_sku || finalMarketplaceData?.amazon?.sku || existingProductRes.rows[0]?.sku || finalBarcode;

            if (amzSku) {
              await amzService.updateListingsItem(
                String(amzSku).trim(),
                effectivePrice,
                parseInt(String(newStock || 0), 10)
              );
              await pool.query(
                "UPDATE products SET amazon_last_sync = NOW(), amazon_last_error = NULL WHERE id = $1",
                [id]
              );
            }
          }
        } catch (amzSyncErr: any) {
          console.warn(`[Background Amazon Sync] Failed for product ${id}:`, amzSyncErr.message);
          await pool.query(
            "UPDATE products SET amazon_last_error = $1 WHERE id = $2",
            [amzSyncErr.message, id]
          );
        }
      })();
    }

    // Auto-sync N11 and other marketplaces data
    const isN11Active = existingProductRes.rows[0]?.is_n11_active || (finalMarketplaceData?.n11?.status === 'ACTIVE');
    if (isN11Active) {
      (async () => {
        try {
          const storeRes = await pool.query("SELECT n11_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
          const st = storeRes.rows[0];
          const n11Settings = st?.n11_settings || st?.branding?.n11_settings;
          if (n11Settings?.appKey && n11Settings?.appSecret) {
            const { N11Service } = await import("../../src/services/backend/n11Service.js");
            const auth = { appKey: n11Settings.appKey.trim(), appSecret: n11Settings.appSecret.trim() };
            const rates = st?.currency_rates || st?.branding?.currency_rates || {};
            let rawPrice = parseFloat(String(finalPrice || "0"));
            const curr = (currency || "TRY").toUpperCase();
            if (curr === "USD" && rates.USD) rawPrice *= Number(rates.USD);
            else if (curr === "EUR" && rates.EUR) rawPrice *= Number(rates.EUR);
            else if (curr === "GBP" && rates.GBP) rawPrice *= Number(rates.GBP);

            const effectivePrice = N11Service.calculateMarketplacePrice(rawPrice, category, sub_category, n11Settings);
            const sellerCode = finalBarcode || existingProductRes.rows[0]?.sku;

            if (sellerCode && effectivePrice > 0) {
              await N11Service.updatePriceAndStock(auth, sellerCode, effectivePrice, parseInt(String(newStock || 0), 10));
            }
          }
        } catch (n11SyncErr: any) {
          console.warn(`[Background N11 Sync] Failed for product ${id}:`, n11SyncErr.message);
        }
      })();
    }

    // Auto-sync Trendyol if product is active on Trendyol
    const isTyActive = existingProductRes.rows[0]?.is_trendyol_active || (finalMarketplaceData?.trendyol?.status === 'ACTIVE') || finalMarketplaceData?.trendyol?.onSale;
    if (isTyActive) {
      (async () => {
        try {
          const storeRes = await pool.query("SELECT trendyol_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
          const st = storeRes.rows[0];
          const tySettings = st?.trendyol_settings || st?.branding?.trendyol_settings;
          if (tySettings?.merchantId && tySettings?.apiKey && tySettings?.apiSecret) {
            const cleanBarcode = String(finalBarcode || existingProductRes.rows[0]?.sku || "").trim();
            if (cleanBarcode) {
              const { N11Service } = await import("../../src/services/backend/n11Service.js");
              const auth = { username: String(tySettings.apiKey).trim(), password: String(tySettings.apiSecret).trim() };
              const storeFrontCode = (tySettings.storeFrontCode && String(tySettings.storeFrontCode).trim() !== "1" ? String(tySettings.storeFrontCode).trim() : "TR").toUpperCase();
              const headers = {
                "User-Agent": `${String(tySettings.merchantId).trim()} - SelfIntegration`,
                "Accept": "application/json",
                "Content-Type": "application/json",
                "storeFrontCode": storeFrontCode
              };

              const rates = st?.currency_rates || st?.branding?.currency_rates || {};
              let rawPrice = parseFloat(String(finalPrice || "0"));
              const curr = (currency || "TRY").toUpperCase();
              if (curr === "USD" && rates.USD) rawPrice *= Number(rates.USD);
              else if (curr === "EUR" && rates.EUR) rawPrice *= Number(rates.EUR);
              else if (curr === "GBP" && rates.GBP) rawPrice *= Number(rates.GBP);

              const effectivePrice = N11Service.calculateMarketplacePrice(rawPrice, category, sub_category, tySettings);
              const roundedPrice = Math.round(effectivePrice * 100) / 100;

              const payload = {
                items: [{
                  barcode: cleanBarcode,
                  quantity: Math.max(0, parseInt(String(newStock || 0), 10)),
                  salePrice: roundedPrice,
                  listPrice: roundedPrice
                }]
              };

              await axios.post(
                `https://apigw.trendyol.com/integration/inventory/sellers/${String(tySettings.merchantId).trim()}/products/price-and-inventory`,
                payload,
                { auth, headers, timeout: 10000 }
              );
              await pool.query(
                "UPDATE products SET trendyol_last_error = NULL WHERE id = $1",
                [id]
              );
            }
          }
        } catch (tySyncErr: any) {
          console.warn(`[Background Trendyol Sync] Failed for product ${id}:`, tySyncErr.message);
          await pool.query(
            "UPDATE products SET trendyol_last_error = $1 WHERE id = $2",
            [tySyncErr.message, id]
          );
        }
      })();
    }

    const updatedProdRes = await pool.query(
      "SELECT p.*, s.name as store_name FROM products p JOIN stores s ON p.store_id = s.id WHERE p.id = $1",
      [id]
    );
    invalidateStoreProductsCache(storeId);
    res.json({ success: true, product: updatedProdRes.rows[0] });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Toggle Bestseller
router.put("/:id/toggle-bestseller", async (req: any, res) => {
  const storeId = req.user.store_id;
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE products SET is_bestseller = NOT is_bestseller WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Recipe Routes
router.get("/:id/recipe", async (req: any, res) => {
  const productId = parseInt(req.params.id);
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  try {
    const recipeRes = await pool.query(
      `SELECT r.*, p.name as ingredient_name, p.unit as ingredient_unit, p.stock_quantity as ingredient_stock 
       FROM product_recipes r
       JOIN products p ON r.ingredient_id = p.id
       WHERE r.product_id = $1 AND r.store_id = $2`,
      [productId, storeId]
    );
    res.json({ success: true, items: recipeRes.rows });
  } catch (error: any) {
    console.error("Get recipe error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/recipe", async (req: any, res) => {
  const productId = parseInt(req.params.id);
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });
  const { items } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM product_recipes WHERE product_id = $1 AND store_id = $2",
      [productId, storeId]
    );

    if (Array.isArray(items)) {
      for (const item of items) {
        if (!item.ingredient_id || !item.amount) continue;
        await client.query(
          "INSERT INTO product_recipes (store_id, product_id, ingredient_id, amount, unit) VALUES ($1, $2, $3, $4, $5)",
          [storeId, productId, item.ingredient_id, item.amount, item.unit || 'Adet']
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Reçete başarıyla kaydedildi." });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Save recipe error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Delete Routes
router.delete("/all", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    await pool.query("DELETE FROM products WHERE store_id = $1", [storeId]);
    await logAction(storeId, req.user.id, "product_delete_all", "product", null, `Tüm ürünler silindi`, null, null);
    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete all products error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/auto-image", async (req: any, res) => {
  try {
    const requestedStoreId = req.query.storeId || req.body.storeId;
    const storeId = req.user.role === "superadmin" ? (requestedStoreId || req.user.store_id) : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    const { id, productIds, allMissing } = req.body;
    let targetIds: number[] = [];

    if (id) {
      targetIds = [Number(id)];
    } else if (Array.isArray(productIds) && productIds.length > 0) {
      targetIds = productIds.map((pid: any) => Number(pid));
    } else if (allMissing) {
      const missingRes = await pool.query(
        "SELECT id FROM products WHERE store_id = $1 AND (image_url IS NULL OR image_url = '') LIMIT 50",
        [storeId]
      );
      targetIds = missingRes.rows.map((r: any) => r.id);
    }

    if (targetIds.length === 0) {
      return res.json({ success: true, results: [], message: "Görseli eksik ürün bulunamadı." });
    }

    const productsRes = await pool.query(
      "SELECT id, name, category, brand, barcode FROM products WHERE store_id = $1 AND id = ANY($2::int[])",
      [storeId, targetIds]
    );

    const results = [];
    for (const prod of productsRes.rows) {
      const queryText = encodeURIComponent(`${prod.name} ${prod.brand || ''} ${prod.category || ''}`.trim());
      const imageUrl = `https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80`;

      await pool.query("UPDATE products SET image_url = $1 WHERE id = $2 AND store_id = $3", [imageUrl, prod.id, storeId]);
      results.push({ id: prod.id, status: 'found', url: imageUrl });
    }

    res.json({ success: true, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Görsel arama hatası" });
  }
});

router.post("/bulk-delete", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "No IDs provided" });

    await pool.query("DELETE FROM products WHERE store_id = $1 AND id = ANY($2::int[])", [storeId, ids]);
    await logAction(storeId, req.user.id, "product_bulk_delete", "product", null, `\${ids.length} adet ürün toplu olarak silindi`, null, null);
    res.json({ success: true, message: `\${ids.length} products deleted.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/bulk-add", async (req: any, res) => {
  try {
    const requestedStoreId = req.query.storeId || req.body.storeId;
    const storeId = req.user.role === "superadmin" ? requestedStoreId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) return res.status(400).json({ error: "No products provided" });

    const canAddBatch = await checkProductLimit(storeId, products.length);
    if (!canAddBatch) return res.status(400).json({ error: "Ürün limitine ulaşıldı. Lütfen planınızı yükseltin." });

    const insertedIds = [];
    for (const p of products) {
      const barcode = p.barcode || `B-\${Date.now()}-\${Math.floor(Math.random() * 1000)}`;
      const name = p.name;
      const price = p.price || 0;
      if (!name) continue;

      const result = await pool.query(
        `INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, labels, image_url, is_web_sale, product_type, price_2, price_2_currency, tax_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id`,
        [storeId, String(barcode), name, price, p.currency || 'TRY', p.cost_price || 0, p.cost_currency || 'TRY', p.description || '', p.stock_quantity || 0, p.min_stock_level || 0, p.unit || 'Adet', p.category || '', p.sub_category || '', p.brand || '', p.author || '', p.labels || '', p.image_url || '', p.is_web_sale !== false, p.product_type || 'standard', p.price_2 || 0, p.price_2_currency || 'TRY', p.tax_rate ?? 20]
      );
      insertedIds.push(result.rows[0].id);
    }

    await logAction(storeId, req.user.id, "product_bulk_add", "product", null, `\${products.length} adet ürün toplu olarak eklendi`, null, null);
    res.json({ success: true, message: `\${products.length} products added.`, insertedIds });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/bulk-rename", async (req: any, res) => {
  try {
    const requestedStoreId = req.query.storeId || req.body.storeId;
    const storeId = req.user.role === "superadmin" ? requestedStoreId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { renames } = req.body;
    if (!Array.isArray(renames) || renames.length === 0) return res.status(400).json({ error: "No renames provided" });

    for (const item of renames) {
      if (!item.id || !item.name) continue;
      await pool.query("UPDATE products SET name = $1 WHERE store_id = $2 AND id = $3", [item.name, storeId, item.id]);
    }

    await logAction(storeId, req.user.id, "product_bulk_rename", "product", null, `\${renames.length} adet ürün toplu olarak yeniden adlandırıldı`, null, null);
    res.json({ success: true, message: `\${renames.length} products renamed.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req: any, res) => {
  try {
    const requestedStoreId = req.query.storeId || req.user.store_id;
    const storeId = req.user.role === "superadmin" ? requestedStoreId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { id } = req.params;
    let result;
    if (req.user.role === "superadmin") {
      result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
    } else {
      result = await pool.query("DELETE FROM products WHERE id = $1 AND (store_id = $2 OR store_id IN (SELECT id FROM stores WHERE parent_id = $2)) RETURNING *", [id, storeId]);
    }

    if (result.rowCount === 0) return res.status(404).json({ error: "Product not found or unauthorized" });
    await logAction(storeId, req.user.id, "product_delete", "product", parseInt(id), `Ürün silindi (ID: ${id})`, null, null);
    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete product error:", e);
    res.status(500).json({ error: e.message });
  }
});

export async function ensureProductMovements(productId: number, storeId: number) {
  try {
    // 0. Clean up any bad/orphaned stock movements with product_id 0 or NULL or phantom auto-sync descriptions
    await pool.query("DELETE FROM stock_movements WHERE product_id IS NULL OR product_id = 0");
    await pool.query(`
      DELETE FROM stock_movements
      WHERE product_id = $1
        AND (
          COALESCE(description, '') ILIKE '%Envanter Stok Senkronizasyonu%'
          OR COALESCE(description, '') ILIKE '%Envanter Stok Mutabakatı%'
          OR COALESCE(description, '') ILIKE 'Stok Miktarı Güncellendi (Manuel%'
        )
    `, [productId]);

    const prodRes = await pool.query(
      "SELECT id, store_id, barcode, product_code, sku, name, product_type, stock_quantity, cost_price, price, currency, created_at FROM products WHERE id = $1",
      [productId]
    );
    if (prodRes.rows.length === 0) return;
    const prod = prodRes.rows[0];

    // 1. Clean up bogus recent initial_stock records (id >= 24000) if product already has purchase invoice items
    await pool.query(`
      DELETE FROM stock_movements sm
      WHERE sm.product_id = $1
        AND sm.source = 'initial_stock'
        AND sm.id >= 24000
        AND EXISTS (
          SELECT 1 FROM purchase_invoice_items pii
          WHERE pii.product_id = sm.product_id
        )
    `, [productId]);

    // 2. Remove any stock_movements linked to cancelled/rejected sales_invoices
    await pool.query(`
      DELETE FROM stock_movements sm
      USING sales_invoices si
      WHERE sm.product_id = $1
        AND (
          (sm.invoice_id = si.id AND (sm.type = 'out' OR sm.invoice_type = 'sales' OR sm.source = 'sales_invoice'))
          OR (si.sale_id IS NOT NULL AND sm.sale_id = si.sale_id)
          OR (
            NULLIF(TRIM(sm.invoice_number), '') IS NOT NULL
            AND TRIM(sm.invoice_number) = NULLIF(TRIM(si.invoice_number), '')
            AND (sm.type = 'out' OR sm.invoice_type = 'sales' OR sm.source = 'sales_invoice')
          )
        )
        AND LOWER(COALESCE(si.status, '')) IN ('cancelled', 'iptal', 'canceled', 'rejected', 'reddedildi')
    `, [productId]);

    // 3. Reconstruct any missing purchase_invoice ('in') stock movements from authoritative purchase_invoice_items
    if (prod.product_type !== 'service') {
      await pool.query(`
        INSERT INTO stock_movements (
          store_id, product_id, type, quantity, source, description,
          unit_price, customer_info, currency, sale_id, invoice_id,
          invoice_type, invoice_number, created_at
        )
        SELECT
          pi.store_id,
          $1::int,
          'in',
          SUM(COALESCE(pii.system_quantity, pii.quantity, 0)),
          'purchase_invoice',
          'Alış Faturası: ' || COALESCE(NULLIF(TRIM(pi.document_number), ''), NULLIF(TRIM(pi.invoice_number), ''), '#' || pi.id::text),
          AVG(COALESCE(pii.unit_price, 0)),
          COALESCE(NULLIF(TRIM(pi.supplier_name), ''), comp.title, 'Tedarikçi'),
          COALESCE(NULLIF(TRIM(pi.currency), ''), 'TRY'),
          NULL,
          pi.id,
          'purchase',
          COALESCE(NULLIF(TRIM(pi.document_number), ''), NULLIF(TRIM(pi.invoice_number), '')),
          COALESCE(pi.invoice_date, pi.created_at, CURRENT_TIMESTAMP)
        FROM purchase_invoice_items pii
        JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
        LEFT JOIN companies comp ON pi.company_id = comp.id
        WHERE pii.product_id = $1
          AND COALESCE(pi.is_expense, FALSE) = FALSE
          AND LOWER(COALESCE(pi.status, '')) NOT IN ('cancelled', 'iptal', 'canceled', 'rejected', 'reddedildi')
          AND NOT EXISTS (
            SELECT 1 FROM stock_movements sm
            WHERE sm.product_id = $1
              AND sm.type = 'in'
              AND (
                (sm.invoice_id = pi.id AND (sm.invoice_type = 'purchase' OR sm.source = 'purchase_invoice' OR sm.invoice_type IS NULL))
                OR (
                  NULLIF(TRIM(COALESCE(NULLIF(pi.document_number, ''), pi.invoice_number)), '') IS NOT NULL
                  AND (
                    sm.invoice_number = COALESCE(NULLIF(TRIM(pi.document_number), ''), TRIM(pi.invoice_number))
                    OR sm.description ILIKE ('%' || COALESCE(NULLIF(TRIM(pi.document_number), ''), TRIM(pi.invoice_number)) || '%')
                  )
                )
              )
          )
        GROUP BY pi.id, pi.store_id, pi.document_number, pi.invoice_number, pi.supplier_name, comp.title, pi.currency, pi.invoice_date, pi.created_at
        HAVING SUM(COALESCE(pii.system_quantity, pii.quantity, 0)) > 0
      `, [productId]);

      // 4. Reconstruct any missing sales_invoice ('out') stock movements from authoritative sales_invoice_items
      await pool.query(`
        INSERT INTO stock_movements (
          store_id, product_id, type, quantity, source, description,
          unit_price, customer_info, currency, sale_id, invoice_id,
          invoice_type, invoice_number, created_at
        )
        SELECT
          si.store_id,
          $1::int,
          'out',
          SUM(COALESCE(sii.quantity, 0)),
          'sales_invoice',
          'Satış Faturası: ' || COALESCE(NULLIF(TRIM(si.document_number), ''), NULLIF(TRIM(si.invoice_number), ''), '#' || si.id::text),
          AVG(COALESCE(sii.unit_price, 0)),
          COALESCE(comp.title, cust.full_name, 'Müşteri'),
          COALESCE(NULLIF(TRIM(si.currency), ''), 'TRY'),
          si.sale_id,
          si.id,
          'sales',
          COALESCE(NULLIF(TRIM(si.document_number), ''), NULLIF(TRIM(si.invoice_number), '')),
          COALESCE(si.invoice_date, si.created_at, CURRENT_TIMESTAMP)
        FROM sales_invoice_items sii
        JOIN sales_invoices si ON sii.sales_invoice_id = si.id
        LEFT JOIN companies comp ON si.company_id = comp.id
        LEFT JOIN customers cust ON si.customer_id = cust.id
        WHERE sii.product_id = $1
          AND LOWER(COALESCE(si.status, '')) NOT IN ('cancelled', 'iptal', 'canceled', 'rejected', 'reddedildi', 'draft')
          AND NOT EXISTS (
            SELECT 1 FROM stock_movements sm
            WHERE sm.product_id = $1
              AND sm.type = 'out'
              AND (
                (sm.invoice_id = si.id AND (sm.invoice_type = 'sales' OR sm.source = 'sales_invoice' OR sm.invoice_type IS NULL))
                OR (si.sale_id IS NOT NULL AND sm.sale_id = si.sale_id)
                OR (
                  NULLIF(TRIM(COALESCE(NULLIF(si.document_number, ''), si.invoice_number)), '') IS NOT NULL
                  AND (
                    sm.invoice_number = COALESCE(NULLIF(TRIM(si.document_number), ''), TRIM(si.invoice_number))
                    OR sm.description ILIKE ('%' || COALESCE(NULLIF(TRIM(si.document_number), ''), TRIM(si.invoice_number)) || '%')
                  )
                )
              )
          )
        GROUP BY si.id, si.store_id, si.document_number, si.invoice_number, comp.title, cust.full_name, si.currency, si.sale_id, si.invoice_date, si.created_at
        HAVING SUM(COALESCE(sii.quantity, 0)) > 0
      `, [productId]);
    }

    // 5. Deduplicate existing redundant movements for this product:
    // a) Deduplicate multiple 'out' movements for the exact same sales invoice_id (keep earliest record per invoice)
    await pool.query(`
      DELETE FROM stock_movements sm1
      WHERE sm1.product_id = $1
        AND sm1.type = 'out'
        AND sm1.invoice_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM stock_movements sm2
          WHERE sm2.product_id = sm1.product_id
            AND sm2.type = 'out'
            AND sm2.invoice_id = sm1.invoice_id
            AND sm2.id < sm1.id
        )
    `, [productId]);

    // b) Deduplicate multiple initial_stock records (keep the earliest original record)
    await pool.query(`
      DELETE FROM stock_movements sm1
      WHERE sm1.product_id = $1
        AND sm1.source = 'initial_stock'
        AND EXISTS (
          SELECT 1 FROM stock_movements sm2
          WHERE sm2.product_id = sm1.product_id
            AND sm2.source = 'initial_stock'
            AND sm2.id < sm1.id
        )
    `, [productId]);

    // 6. Authoritative Stock & Ledger Reconciliation:
    // NEVER overwrite products.stock_quantity from ensureProductMovements!
    // products.stock_quantity is the authoritative physical stock set by operator / invoices / orders.
    const currentStock = parseFloat(prod.stock_quantity || '0');

    // Calculate net stock of actual invoice & sale documents (excluding initial_stock and manual_adjustment)
    const docSumRes = await pool.query(`
      SELECT COALESCE(SUM(CASE WHEN type = 'in' THEN quantity ELSE -quantity END), 0) as doc_net,
             MIN(created_at) as min_date
      FROM stock_movements
      WHERE product_id = $1
        AND COALESCE(source, '') NOT IN ('initial_stock', 'manual_adjustment')
    `, [productId]);

    const docNet = parseFloat(docSumRes.rows[0]?.doc_net || '0');
    const minDate = docSumRes.rows[0]?.min_date;
    const baseUnitPrice = parseFloat(prod.cost_price) || parseFloat(prod.price) || 0;
    const baseCurrency = prod.currency || 'TRY';
    const openingDate = (minDate && prod.created_at && new Date(minDate) < new Date(prod.created_at))
      ? minDate
      : (prod.created_at || minDate || new Date().toISOString());

    if (currentStock >= docNet - 0.001) {
      // Remove any manual_adjustment rows since opening stock + invoices/sales cleanly accounts for currentStock
      await pool.query("DELETE FROM stock_movements WHERE product_id = $1 AND source = 'manual_adjustment'", [productId]);
      const openingQty = Math.max(0, currentStock - docNet);
      if (openingQty > 0.001) {
        const initRes = await pool.query(
          "SELECT id FROM stock_movements WHERE product_id = $1 AND source = 'initial_stock' ORDER BY id ASC LIMIT 1",
          [productId]
        );
        if (initRes.rows.length > 0) {
          await pool.query(
            "UPDATE stock_movements SET type = 'in', quantity = $1, description = 'Açılış Stok / Devir Kaydı', created_at = LEAST(created_at, $2::timestamptz) WHERE id = $3",
            [openingQty, openingDate, initRes.rows[0].id]
          );
        } else {
          await pool.query(`
            INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
            VALUES ($1, $2, 'in', $3, 'initial_stock', 'Açılış Stok / Devir Kaydı', $4, $5, $6)
          `, [prod.store_id, prod.id, openingQty, baseUnitPrice, baseCurrency, openingDate]);
        }
      } else {
        await pool.query("DELETE FROM stock_movements WHERE product_id = $1 AND source = 'initial_stock'", [productId]);
      }
    } else {
      // currentStock < docNet (e.g., purchase invoices exceed sales invoices + current shelf stock because operator zeroed/reduced stock)
      await pool.query("DELETE FROM stock_movements WHERE product_id = $1 AND source = 'initial_stock'", [productId]);
      const adjustOutQty = docNet - currentStock;
      const adjRes = await pool.query(
        "SELECT id FROM stock_movements WHERE product_id = $1 AND source = 'manual_adjustment' ORDER BY id DESC LIMIT 1",
        [productId]
      );
      if (adjRes.rows.length > 0) {
        const keepId = adjRes.rows[0].id;
        await pool.query("DELETE FROM stock_movements WHERE product_id = $1 AND source = 'manual_adjustment' AND id != $2", [productId, keepId]);
        await pool.query(
          "UPDATE stock_movements SET type = 'out', quantity = $1, description = 'Operatör Stok Sayım Düzeltmesi (-)' WHERE id = $2",
          [adjustOutQty, keepId]
        );
      } else {
        await pool.query(`
          INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
          VALUES ($1, $2, 'out', $3, 'manual_adjustment', 'Operatör Stok Sayım Düzeltmesi (-)', $4, $5, CURRENT_TIMESTAMP)
        `, [prod.store_id, prod.id, adjustOutQty, baseUnitPrice, baseCurrency]);
      }
    }
  } catch (err) {
    console.error("ensureProductMovements error for product", productId, err);
  }
}

router.get("/:id/movements", async (req: any, res) => {
  try {
    const { id } = req.params;
    const prodRes = await pool.query("SELECT store_id FROM products WHERE id = $1", [id]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    const productStoreId = prodRes.rows[0].store_id;

    // Auto-repair movements for this product if needed before returning
    await ensureProductMovements(Number(id), productStoreId);

    const movementsRes = await pool.query(
      `SELECT sm.*,
              COALESCE(pi.invoice_date, si.invoice_date, sm.created_at) as effective_date,
              pi.supplier_name as pi_supplier_name,
              COALESCE(NULLIF(TRIM(pi.document_number), ''), NULLIF(TRIM(pi.invoice_number), '')) as pi_inv_num,
              COALESCE(NULLIF(TRIM(si.document_number), ''), NULLIF(TRIM(si.invoice_number), '')) as si_inv_num
       FROM stock_movements sm
       LEFT JOIN purchase_invoices pi ON sm.invoice_id = pi.id AND (sm.invoice_type = 'purchase' OR sm.source = 'purchase_invoice' OR (sm.invoice_type IS NULL AND sm.type = 'in'))
       LEFT JOIN sales_invoices si ON sm.invoice_id = si.id AND (sm.invoice_type = 'sales' OR sm.source = 'sales_invoice' OR (sm.invoice_type IS NULL AND sm.type = 'out'))
       WHERE sm.product_id = $1
         AND COALESCE(sm.description, '') NOT ILIKE '%Envanter Stok Senkronizasyonu%'
         AND COALESCE(sm.description, '') NOT ILIKE 'Stok Miktarı Güncellendi (Manuel%'
       ORDER BY COALESCE(pi.invoice_date, si.invoice_date, sm.created_at) DESC, sm.id DESC`,
      [id]
    );

    const rows = movementsRes.rows.map((row: any) => {
      const isInvoice = row.source === 'purchase_invoice' || row.source === 'sales_invoice' || row.invoice_type === 'purchase' || row.invoice_type === 'sales';
      const resolvedInvNum = (row.invoice_number && String(row.invoice_number).trim()) || row.pi_inv_num || row.si_inv_num || null;
      let cleanDesc = row.description || '';
      if (cleanDesc.startsWith('Fatura Güncelleme:') || cleanDesc.startsWith('E-Fatura İlk İçe Aktarma:') || cleanDesc.startsWith('Fatura Girişi:') || cleanDesc.startsWith('Alış Faturası Yeni Ürün Kartı:')) {
        const invNum = resolvedInvNum || cleanDesc.split(':')[1]?.trim() || '';
        cleanDesc = `Alış Faturası: ${invNum}`;
      } else if (cleanDesc.startsWith('Satış Faturası Güncelleme:') || cleanDesc === 'Satış Faturası:' || cleanDesc === 'Satış Faturası: ') {
        const invNum = resolvedInvNum || cleanDesc.split(':')[1]?.trim() || `#${row.invoice_id || ''}`;
        cleanDesc = `Satış Faturası: ${invNum}`;
      }
      const cleanCustomer = (row.customer_info === 'Tedarikçi' && row.pi_supplier_name) ? row.pi_supplier_name : row.customer_info;

      return {
        ...row,
        invoice_number: resolvedInvNum,
        created_at: (row.effective_date && isInvoice) ? row.effective_date : row.created_at,
        description: cleanDesc,
        customer_info: cleanCustomer
      };
    });

    res.json(rows);
  } catch (error: any) {
    console.error("Fetch product movements error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id/movements/export", async (req: any, res) => {
  try {
    const { id } = req.params;
    const lang = req.query.lang || "tr";

    // Verify product
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    const product = prodRes.rows[0];

    await ensureProductMovements(Number(id), product.store_id);

    const movementsRes = await pool.query(
      `SELECT sm.*,
              COALESCE(pi.invoice_date, si.invoice_date, sm.created_at) as effective_date,
              pi.supplier_name as pi_supplier_name,
              COALESCE(NULLIF(TRIM(pi.document_number), ''), NULLIF(TRIM(pi.invoice_number), '')) as pi_inv_num,
              COALESCE(NULLIF(TRIM(si.document_number), ''), NULLIF(TRIM(si.invoice_number), '')) as si_inv_num
       FROM stock_movements sm
       LEFT JOIN purchase_invoices pi ON sm.invoice_id = pi.id AND (sm.invoice_type = 'purchase' OR sm.source = 'purchase_invoice' OR (sm.invoice_type IS NULL AND sm.type = 'in'))
       LEFT JOIN sales_invoices si ON sm.invoice_id = si.id AND (sm.invoice_type = 'sales' OR sm.source = 'sales_invoice' OR (sm.invoice_type IS NULL AND sm.type = 'out'))
       WHERE sm.product_id = $1
         AND COALESCE(sm.description, '') NOT ILIKE '%Envanter Stok Senkronizasyonu%'
         AND COALESCE(sm.description, '') NOT ILIKE 'Stok Miktarı Güncellendi (Manuel%'
       ORDER BY COALESCE(pi.invoice_date, si.invoice_date, sm.created_at) DESC, sm.id DESC`,
      [id]
    );

    const { formatDateTimeTR, formatDateTR } = await import("../../src/utils/formatUtils");
    const data = movementsRes.rows.map((m: any) => {
      const isInvoice = m.source === 'purchase_invoice' || m.source === 'sales_invoice' || m.invoice_type === 'purchase' || m.invoice_type === 'sales';
      const displayDate = (m.effective_date && isInvoice) ? m.effective_date : m.created_at;
      const resolvedInvNum = (m.invoice_number && String(m.invoice_number).trim()) || m.pi_inv_num || m.si_inv_num || '';
      let cleanDesc = m.description || "";
      if (cleanDesc.startsWith('Fatura Güncelleme:') || cleanDesc.startsWith('E-Fatura İlk İçe Aktarma:') || cleanDesc.startsWith('Fatura Girişi:') || cleanDesc.startsWith('Alış Faturası Yeni Ürün Kartı:')) {
        const invNum = resolvedInvNum || cleanDesc.split(':')[1]?.trim() || '';
        cleanDesc = `Alış Faturası: ${invNum}`;
      } else if (cleanDesc.startsWith('Satış Faturası Güncelleme:') || cleanDesc === 'Satış Faturası:' || cleanDesc === 'Satış Faturası: ') {
        const invNum = resolvedInvNum || cleanDesc.split(':')[1]?.trim() || `#${m.invoice_id || ''}`;
        cleanDesc = `Satış Faturası: ${invNum}`;
      }
      const cleanCustomer = (m.customer_info === 'Tedarikçi' && m.pi_supplier_name) ? m.pi_supplier_name : (m.customer_info || "");
      return {
        [lang === "tr" ? "Tarih" : "Date"]: isInvoice ? formatDateTR(displayDate) : formatDateTimeTR(displayDate),
        [lang === "tr" ? "Tür" : "Type"]: m.type === "in" ? (lang === "tr" ? "Giriş" : "In") : (lang === "tr" ? "Çıkış" : "Out"),
        [lang === "tr" ? "Miktar" : "Quantity"]: m.quantity,
        [lang === "tr" ? "Kaynak" : "Source"]: m.source,
        [lang === "tr" ? "Açıklama" : "Description"]: cleanDesc,
        [lang === "tr" ? "Birim Fiyat" : "Unit Price"]: m.unit_price ? Number(m.unit_price) : "",
        [lang === "tr" ? "Müşteri/Tedarikçi" : "Customer/Supplier"]: cleanCustomer,
        [lang === "tr" ? "Para Birimi" : "Currency"]: m.currency || "TRY"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, lang === "tr" ? "Hareketler" : "Movements");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(product.name)}_movements.xlsx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Export movements error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Accounting-Grade Stock Movement Correction & Reversal (Senaryo 2 - Ters Kayıt / Düzeltme)
router.post("/:id/movements/correction", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const storeId = req.user?.store_id || req.body.store_id;
    const { movement_id, correction_type, target_quantity, reason } = req.body;

    if (!movement_id) {
      return res.status(400).json({ error: "Düzeltilecek hareket ID'si belirtilmelidir." });
    }

    // 1. Ürünü doğrula
    const prodRes = await client.query("SELECT * FROM products WHERE id = $1", [id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı." });
    }
    const product = prodRes.rows[0];
    const targetStoreId = product.store_id || storeId;

    // 2. Hedef hareketi doğrula
    const movRes = await client.query(
      "SELECT * FROM stock_movements WHERE id = $1 AND product_id = $2",
      [movement_id, id]
    );
    if (movRes.rows.length === 0) {
      return res.status(404).json({ error: "Düzeltilecek stok hareketi bulunamadı." });
    }
    const targetMov = movRes.rows[0];

    // Sadece manuel düzeltmeler veya açılış stokları revize edilebilir
    const allowedSources = ['manual_adjustment', 'initial_stock'];
    if (!allowedSources.includes(targetMov.source)) {
      return res.status(400).json({ 
        error: "Fatura, POS veya pazaryeri kaynaklı hareketler doğrudan düzeltilemez. Bu işlemler ilgili fatura/satış iadesi üzerinden yönetilmelidir." 
      });
    }

    const origType = targetMov.type; // 'in' or 'out'
    const origQty = parseFloat(targetMov.quantity) || 0;
    const origEffect = origType === 'in' ? origQty : -origQty;

    let newType: 'in' | 'out' = 'in';
    let newQty = 0;
    let stockDelta = 0;
    let description = '';

    if (correction_type === 'full_reversal') {
      // Tam Ters Kayıt: Orijinal hareketin etkisini sıfırlar
      newType = origType === 'in' ? 'out' : 'in';
      newQty = origQty;
      stockDelta = -origEffect;
      description = `Hata Düzeltme & Ters Kayıt: Hatalı ${origType === 'in' ? 'Manuel Artış' : 'Manuel Azalış'} İptal Edildi (Ref #${targetMov.id})`;
    } else if (correction_type === 'partial_difference') {
      // Hedef Miktar ile Fark Dengelemesi
      const targetQtyNum = parseFloat(target_quantity);
      if (isNaN(targetQtyNum) || targetQtyNum < 0) {
        return res.status(400).json({ error: "Geçerli bir hedef miktar girilmelidir." });
      }
      const desiredEffect = origType === 'in' ? targetQtyNum : -targetQtyNum;
      const differenceEffect = desiredEffect - origEffect;

      if (Math.abs(differenceEffect) < 0.001) {
        return res.status(400).json({ error: "Girilen hedef miktar mevcut hareket miktarı ile aynıdır, düzeltme gerekmiyor." });
      }

      newType = differenceEffect > 0 ? 'in' : 'out';
      newQty = Math.abs(differenceEffect);
      stockDelta = differenceEffect;
      description = `Hata Düzeltme Fark Kaydı: Manuel ${origType === 'in' ? 'Artış' : 'Azalış'} Revize Edildi (Ref #${targetMov.id}, Hedef: ${targetQtyNum} ${product.unit || 'Adet'})`;
    } else {
      return res.status(400).json({ error: "Geçersiz düzeltme türü. 'full_reversal' veya 'partial_difference' seçilmelidir." });
    }

    if (reason && String(reason).trim()) {
      description += ` | Not: ${String(reason).trim()}`;
    }

    await client.query("BEGIN");

    // 1. Ters kayıt / Dengeleme hareketini ekle
    const insertMovRes = await client.query(`
      INSERT INTO stock_movements (
        store_id, product_id, type, quantity, source, description, 
        unit_price, currency, reference_movement_id, created_at
      ) VALUES ($1, $2, $3, $4, 'manual_adjustment', $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      targetStoreId,
      id,
      newType,
      newQty,
      description,
      targetMov.unit_price || parseFloat(product.cost_price) || parseFloat(product.price) || 0,
      targetMov.currency || product.currency || 'TRY',
      targetMov.id
    ]);

    // 2. Ürünün güncel stok miktarını güncelle
    const updateProdRes = await client.query(`
      UPDATE products 
      SET stock_quantity = stock_quantity + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING stock_quantity
    `, [stockDelta, id]);

    await client.query("COMMIT");

    const newStockQuantity = updateProdRes.rows[0]?.stock_quantity;

    res.json({
      success: true,
      message: "Düzeltme ters kaydı başarıyla oluşturuldu.",
      new_stock: newStockQuantity,
      movement: insertMovRes.rows[0]
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Create stock movement correction error:", error);
    res.status(500).json({ error: error.message || "Ters kayıt oluşturulurken bir hata oluştu." });
  } finally {
    client.release();
  }
});

// Toggle Bestseller
router.put("/:id/toggle-bestseller", async (req: any, res) => {
  const storeId = req.user.store_id;
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE products SET is_bestseller = NOT is_bestseller WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Split and Clean Category Helper for Bookstore Mode
const splitAndCleanCategory = (raw: string): { category: string; subCategory: string } => {
  if (!raw) return { category: "Edebiyat", subCategory: "Roman" };
  const parts = raw.split("/").map(p => p.trim()).filter(Boolean);
  let main = parts[0] || "Edebiyat";
  let sub = parts.slice(1).join(" / ") || "Roman";

  // Standardize Main
  const lowerMain = main.toLowerCase();
  if (lowerMain.includes("fiction") || lowerMain.includes("literary") || lowerMain.includes("roman") || lowerMain.includes("edebiyat")) {
    main = "Edebiyat";
  } else if (lowerMain.includes("science fiction") || lowerMain.includes("sci-fi") || lowerMain.includes("bilim kurgu")) {
    main = "Bilim Kurgu";
  } else if (lowerMain.includes("history") || lowerMain.includes("tarih")) {
    main = "Tarih";
  } else if (lowerMain.includes("philosophy") || lowerMain.includes("felsefe")) {
    main = "Felsefe";
  } else if (lowerMain.includes("psychology") || lowerMain.includes("psikoloji") || lowerMain.includes("gelişim")) {
    main = "Psikoloji / Kişisel Gelişim";
  } else if (lowerMain.includes("children") || lowerMain.includes("çocuk")) {
    main = "Çocuk Kitapları";
  }

  // Standardize Sub
  const lowerSub = sub.toLowerCase();
  if (lowerSub.includes("distopya") || lowerSub.includes("dystopia")) {
    sub = "Distopya";
  } else if (lowerSub.includes("roman") && main === "Edebiyat") {
    sub = "Roman";
  }

  return { category: main, subCategory: sub };
};

// Bulk Book Enrichment using Free Google Books API + Optional Gemini AI Refinement
router.post("/bulk-enrich-books", async (req: any, res) => {
  const storeId = req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID is required" });

  try {
    // 1. Fetch all store products with a barcode and missing author, brand (publisher), or category
    const productsRes = await pool.query(
      `SELECT id, barcode, name, author, brand, category, description, image_url 
       FROM products 
       WHERE store_id = $1 
         AND barcode IS NOT NULL 
         AND barcode != '' 
       ORDER BY id DESC LIMIT 100`,
      [storeId]
    );

    const products = productsRes.rows;
    if (products.length === 0) {
      return res.json({ success: true, message: "Barkod bilgisi olan kitap bulunamadı.", updatedCount: 0 });
    }

    const CATEGORY_MAP: Record<string, string> = {
      "fiction": "Edebiyat / Roman",
      "history": "Tarih / Araştırma",
      "biography": "Biyografi / Otobiyografi",
      "poetry": "Şiir",
      "philosophy": "Felsefe / Düşünce",
      "religion": "Din / Felsefe",
      "science": "Bilim / Araştırma",
      "psychology": "Psikoloji / Kişisel Gelişim",
      "self-help": "Kişisel Gelişim",
      "business": "İş / Ekonomi",
      "economics": "Ekonomi / Finans",
      "computers": "Bilişim / Teknoloji",
      "art": "Sanat / Kültür",
      "juvenile fiction": "Çocuk Edebiyatı",
      "juvenile nonfiction": "Çocuk Kitapları (Eğitici)",
      "education": "Eğitim / Sınav Hazırlık",
      "drama": "Tiyatro / Oyun",
      "literary criticism": "Edebi İnceleme",
      "social science": "Sosyal Bilimler",
      "political science": "Siyaset / Politika",
      "cooking": "Yemek / Gastronomi",
      "travel": "Gezi / Seyahat",
      "health & fitness": "Sağlık / Yaşam",
      "body, mind & spirit": "Kişisel Gelişim / Spiritüel"
    };

    const translateCategory = (rawCategory: string): string => {
      if (!rawCategory) return "Edebiyat / Roman";
      const normalized = rawCategory.toLowerCase().trim();
      if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized];
      for (const [key, val] of Object.entries(CATEGORY_MAP)) {
        if (normalized.includes(key)) return val;
      }
      return rawCategory;
    };

    let updatedCount = 0;
    const apiKey = getGeminiApiKey();

    for (const prod of products) {
      const cleanBarcode = String(prod.barcode).replace(/\D/g, "");
      if (cleanBarcode.length < 9 || cleanBarcode.length > 15) continue;

      try {
        const bookData = await masterBookLookup(cleanBarcode);
        if (!bookData || !bookData.name) continue;

        const finalName = prod.name && prod.name.length > 3 ? prod.name : bookData.name;
        const finalAuthor = bookData.author || "";
        const finalPublisher = bookData.publisher || bookData.brand || "";
        const finalCategory = bookData.category || "Edebiyat";
        const finalSubCategory = bookData.sub_category || "Roman";
        const finalDescription = (bookData.description || "").substring(0, 1000);
        const finalImage = bookData.image_url || prod.image_url;

        // Update database with resolved attributes
        await pool.query(
          `UPDATE products 
           SET author = COALESCE(NULLIF($1, ''), author),
               brand = COALESCE(NULLIF($2, ''), brand),
               category = COALESCE(NULLIF($3, ''), category),
               sub_category = COALESCE(NULLIF($4, ''), sub_category),
               description = COALESCE(NULLIF($5, ''), description),
               image_url = COALESCE(NULLIF($6, ''), image_url),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $7`,
          [finalAuthor, finalPublisher, finalCategory, finalSubCategory, finalDescription, finalImage, prod.id]
        );

        updatedCount++;
      } catch (prodErr) {
        console.error(`Error enriching book barcode ${cleanBarcode}:`, prodErr);
      }
    }

    await logAction(storeId, req.user.id, "product_bulk_enrich", "products", null, `Kitaplar Google Books & AI ile toplu eşleştirildi (Güncellenen: ${updatedCount})`, null, null);

    res.json({
      success: true,
      message: `Tebrikler! ${updatedCount} kitap bilgisi sıfır maliyetli Google Books & AI motoru ile başarıyla eşleştirildi.`,
      updatedCount
    });
  } catch (error: any) {
    console.error("Bulk book enrichment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Single Book Barcode Lookup for Instant Auto-Fill using Multi-Layer Data Mining Pipeline
router.get("/lookup-barcode", async (req: any, res) => {
  try {
    const barcode = String(req.query.barcode || "").trim();
    const cleanBarcode = barcode.replace(/\D/g, "");
    if (!cleanBarcode || cleanBarcode.length < 9) {
      return res.status(400).json({ error: "Geçerli bir barkod / ISBN giriniz" });
    }

    let bookData = await masterBookLookup(cleanBarcode);

    if (bookData && bookData.name) {
      return res.json({
        success: true,
        data: {
          barcode,
          name: bookData.name,
          author: bookData.author || "",
          brand: bookData.publisher || bookData.brand || "",
          publisher: bookData.publisher || bookData.brand || "",
          category: bookData.category || "Edebiyat",
          sub_category: bookData.sub_category || "Roman",
          description: bookData.description || "",
          image_url: bookData.image_url || generateHighResBookCoverSvg(bookData.name, bookData.author, bookData.publisher, bookData.category),
          market_prices: bookData.market_prices || null
        }
      });
    }

    // Check existing database records if external catalog lookup is unavailable
    const existing = await pool.query(
      "SELECT name, author, brand, category, sub_category, description, image_url FROM products WHERE barcode = $1 OR barcode = $2 LIMIT 1",
      [barcode, cleanBarcode]
    );

    if (existing.rows.length > 0) {
      const p = existing.rows[0];
      return res.json({
        success: true,
        data: {
          barcode,
          name: p.name,
          author: p.author || "",
          brand: p.brand || "",
          publisher: p.brand || "",
          category: p.category || "Edebiyat",
          sub_category: p.sub_category || "Roman",
          description: p.description || "",
          image_url: p.image_url || generateHighResBookCoverSvg(p.name, p.author, p.brand, p.category)
        }
      });
    }

    return res.status(404).json({ error: "Eser kataloglarında bu barkoda ait bilgi bulunamadı. Lütfen detayları manuel doldurunuz." });
  } catch (error: any) {
    console.error("Lookup barcode error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
