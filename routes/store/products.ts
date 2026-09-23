import express from "express";
import { pool, logAction } from "../../models/db";
import { getAuthorizedStoreId, getTurkishSearchSnippet, normalizeTurkishParam, checkProductLimit, getGeminiApiKey } from "./utils";
import { isValidStandardBarcode } from "./invoiceMatching";
import { GoogleGenAI } from "@google/genai";
import XLSX from "xlsx";
import { masterBookLookup, splitAndCleanCategory, generateHighResBookCoverSvg } from "./bookLookupService";

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

    await client.query(`
      UPDATE products 
      SET stock_quantity = $1,
          cost_price = $2,
          cost_currency = $3,
          product_code = COALESCE(product_code, $4),
          sku = COALESCE(sku, $5),
          brand = COALESCE(brand, $6),
          category = COALESCE(category, $7),
          sub_category = COALESCE(sub_category, $8),
          price = CASE WHEN price > 0 THEN price ELSE $9 END,
          image_url = COALESCE(image_url, $10),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
    `, [newStock, newCost, newCurrency, newCode, newSku, newBrand, newCategory, newSubCat, newPrice, newImage, target.id]);

    // 15. Delete duplicate source product safely
    await client.query("DELETE FROM products WHERE id = $1", [source.id]);

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
 * Scans a store's products to find candidate pairs for merging (duplicates, temp barcodes matching real products).
 */
export async function getDuplicateCandidatesForStore(storeId: number) {
  const all = await pool.query(
    `SELECT id, store_id, name, barcode, product_code, sku, stock_quantity, cost_price, cost_currency, price, currency, image_url, category, brand, created_at 
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

      const codeMatch = (aCode && bCode && aCode === bCode) ||
                        (aSku && bSku && aSku === bSku) ||
                        (aCode && bSku && aCode === bSku) ||
                        (aSku && bCode && aSku === bCode);

      const aNameNorm = (a.name || "").trim().toLowerCase();
      const bNameNorm = (b.name || "").trim().toLowerCase();
      const nameMatch = aNameNorm.length > 2 && aNameNorm === bNameNorm;

      if (codeMatch && nameMatch) {
        reason = `Ürün Kodu (${a.product_code || a.sku}) ve Ürün Adı birebir aynı`;
        confidence = 100;
      } else if (codeMatch) {
        reason = `Aynı Ürün Kodu / Model No (${a.product_code || a.sku})`;
        confidence = (aIsTemp || bIsTemp) ? 95 : 85;
      } else if (nameMatch && (aIsTemp || bIsTemp)) {
        reason = `Birebir aynı ürün adı (biri geçici/dahili barkodlu)`;
        confidence = 90;
      } else if (nameMatch) {
        reason = `Birebir aynı ürün adı`;
        confidence = 80;
      }

      if (reason) {
        seenPairs.add(pairKey);
        // Decide target (to keep) and source (to merge into target)
        let target = a;
        let source = b;

        if (aIsTemp && !bIsTemp) {
          target = b;
          source = a;
        } else if (!aIsTemp && bIsTemp) {
          target = a;
          source = b;
        } else {
          // If both temp or both real: prefer the one with positive stock or earlier created
          if ((Number(b.stock_quantity) || 0) > (Number(a.stock_quantity) || 0)) {
            target = b;
            source = a;
          }
        }

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
        const pIdx = params.length + 1;
        query += ` AND (${getTurkishSearchSnippet('p.name', pIdx)} OR ${getTurkishSearchSnippet('p.barcode', pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.product_code, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.sku, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.category, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.sub_category, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.description, '')", pIdx)} OR ${getTurkishSearchSnippet("COALESCE(p.brand, '')", pIdx)})`;
        params.push(normalizeTurkishParam(term));
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
    brand, author, labels, image_url, is_web_sale, is_bestseller, product_type, 
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
    const allergensVal = JSON.stringify(Array.isArray(allergens) ? allergens : (typeof allergens === 'string' ? JSON.parse(allergens || '[]') : []));
    const marketplaceDataVal = JSON.stringify(typeof marketplace_data === 'object' && marketplace_data !== null ? marketplace_data : (typeof marketplace_data === 'string' ? JSON.parse(marketplace_data || '{}') : {}));
    const sectorDataVal = JSON.stringify(typeof sector_data === 'object' && sector_data !== null ? sector_data : (typeof sector_data === 'string' ? JSON.parse(sector_data || '{}') : {}));
    const finalProductCode = (product_code || sku || '').trim() || null;

    const result = await pool.query(`
      INSERT INTO products (
        store_id, barcode, product_code, sku, name, price, currency, cost_price, cost_currency, description, 
        stock_quantity, min_stock_level, unit, category, sub_category, category_2, sub_category_2,
        has_variants, variants, brand, author, labels, image_url, is_web_sale, is_bestseller, 
        product_type, price_2, price_2_currency, tax_rate, shipping_profile_id, volume_ml, is_sellable,
        allergens, calories, prep_time_min, portion_size, marketplace_data, sector_data, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19::jsonb, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33::jsonb, $34, $35, $36, $37::jsonb, $38::jsonb, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      storeId, finalBarcode, finalProductCode, finalProductCode, name, finalPrice, currency || 'TRY',  
      parseFloat(cost_price) || 0, cost_currency || 'TRY', description || '', 
      parseFloat(stock_quantity) || 0, parseFloat(min_stock_level) || 5, unit || 'Adet', 
      category || '', sub_category || '', category_2 || '', sub_category_2 || '',
      hasVariantsVal, variantsVal, brand || '', author || '', 
      JSON.stringify(labels || []), image_url || '', 
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

    if (parseFloat(stock_quantity) > 0 && result.rows[0]?.id) {
      try {
        await pool.query(`
          INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
          VALUES ($1, $2, 'in', $3, 'initial_stock', 'Açılış Stok Girişi', $4, $5, CURRENT_TIMESTAMP)
        `, [storeId, result.rows[0].id, parseFloat(stock_quantity), parseFloat(cost_price) || finalPrice || 0, currency || 'TRY']);
      } catch (smErr) {
        console.error("Failed to log initial stock movement:", smErr);
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
            INSERT INTO products (store_id, barcode, name, price, currency, description, unit, category, sub_category, brand, author, image_url, labels, product_type, tax_rate, stock_quantity, is_web_sale, is_sellable, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, false, $16, CURRENT_TIMESTAMP)
          `, [
            bId, finalBarcode, name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            image_url || '', JSON.stringify(labels || []), product_type || 'product', 
            (tax_rate !== undefined && tax_rate !== null && tax_rate !== "") ? parseFloat(tax_rate) : defaultTaxRate,
            req.body.is_sellable !== undefined ? req.body.is_sellable : true
          ]);
        }
      }
    }

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
    if (direction === 'increase') priceCalc = `price + \${val}`;
    else priceCalc = `GREATEST(price - \${val}, 0)`;
  } else if (type === 'percentage') {
    const multiplier = direction === 'increase' ? (1 + val / 100) : (1 - val / 100);
    priceCalc = `price * \${multiplier}`;
  }

  if (rounding === 'round') {
    priceCalc = `ROUND(CAST(\${priceCalc} AS numeric), 0)`;
  } else if (rounding === 'ceil') {
    priceCalc = `CEIL(\${priceCalc})`;
  } else if (rounding === 'floor') {
    priceCalc = `FLOOR(\${priceCalc})`;
  } else {
    priceCalc = `ROUND(CAST(\${priceCalc} AS numeric), 2)`;
  }

  try {
    let query = `
      UPDATE products p 
      SET price = \${priceCalc}, 
          price_2 = \${priceCalc} / (1 + COALESCE(p.tax_rate, s.default_tax_rate, 20) / 100.0), 
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
    brand, author, labels, image_url, is_web_sale, is_bestseller, product_type, 
    price_2, price_2_currency, tax_rate, shipping_profile_id, sync_group, volume_ml, is_sellable,
    allergens, calories, prep_time_min, portion_size, marketplace_data, sector_data
  } = req.body;

  try {
    const existingProductRes = await pool.query("SELECT labels, barcode, product_code, is_sellable, is_bestseller, allergens, calories, prep_time_min, portion_size, marketplace_data, sector_data, stock_quantity, price, cost_price, currency FROM products WHERE id = $1 AND store_id = $2", [id, storeId]);
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

    const finalBarcode = barcode ? String(barcode).trim() : (existingProductRes.rows[0]?.barcode || 'GEN-' + Date.now().toString());

    await pool.query(`
      UPDATE products SET 
        barcode = $1, product_code = $2, sku = $2, name = $3, price = $4, currency = $5, 
        cost_price = $6, cost_currency = $7, description = $8, 
        stock_quantity = $9, min_stock_level = $10, unit = $11, 
        category = $12, sub_category = $13, category_2 = $14, sub_category_2 = $15,
        has_variants = $16, variants = $17::jsonb, brand = $18, author = $19, 
        labels = $20, image_url = $21, is_web_sale = $22, is_bestseller = $23, product_type = $24,
        price_2 = $25, price_2_currency = $26, tax_rate = $27, shipping_profile_id = $28, volume_ml = $29, is_sellable = $30,
        allergens = $31::jsonb, calories = $32, prep_time_min = $33, portion_size = $34,
        marketplace_data = $35::jsonb, sector_data = $36::jsonb, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $37 AND store_id = $38
    `, [
      finalBarcode, finalProductCode, name, finalPrice, currency || 'TRY', 
      parseFloat(cost_price) || 0, cost_currency || 'TRY', description || '', 
      parseFloat(stock_quantity) || 0, parseFloat(min_stock_level) || 5, unit || 'Adet', 
      category || '', sub_category || '', category_2 || '', sub_category_2 || '',
      finalHasVariants, finalVariants, brand || '', author || '', 
      JSON.stringify(updatedLabels), image_url || '',
      finalIsWebSale,
      finalIsBestseller,
      product_type || 'product',
      parseFloat(price_2) || 0,
      price_2_currency || 'TRY',
      parseFloat(tax_rate) || 0,
      shipping_profile_id || null,
      parseFloat(volume_ml) || 0,
      finalIsSellable,
      finalAllergens,
      calories !== undefined ? (parseFloat(calories) || 0) : (existingProductRes.rows[0]?.calories || 0),
      prep_time_min !== undefined ? (parseFloat(prep_time_min) || 0) : (existingProductRes.rows[0]?.prep_time_min || 0),
      portion_size !== undefined ? String(portion_size) : (existingProductRes.rows[0]?.portion_size || ''),
      JSON.stringify(finalMarketplaceData),
      JSON.stringify(finalSectorData),
      id, storeId
    ]);

    const newStock = parseFloat(stock_quantity !== undefined ? stock_quantity : oldStock) || 0;
    const diff = newStock - oldStock;
    if (Math.abs(diff) > 0.001) {
      try {
        await pool.query(`
          INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
          VALUES ($1, $2, $3, $4, 'manual_adjustment', $5, $6, $7, CURRENT_TIMESTAMP)
        `, [
          storeId, 
          id, 
          diff > 0 ? 'in' : 'out', 
          Math.abs(diff), 
          diff > 0 ? 'Stok Miktarı Güncellendi (Manuel Artış)' : 'Stok Miktarı Güncellendi (Manuel Azalış)',
          parseFloat(cost_price) || finalPrice || parseFloat(existingProductRes.rows[0]?.cost_price) || parseFloat(existingProductRes.rows[0]?.price) || 0, 
          currency || existingProductRes.rows[0]?.currency || 'TRY'
        ]);
      } catch (smErr) {
        console.error("Failed to log product update stock movement:", smErr);
      }
    }

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
              image_url = $10, labels = $11, product_type = $12, 
              tax_rate = $13, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $14
          `, [
            name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            image_url || '', JSON.stringify(updatedLabels), product_type || 'product', 
            parseFloat(tax_rate) || 0, existsRes.rows[0].id
          ]);
        } else {
          await pool.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description, unit, category, sub_category, brand, author, image_url, labels, product_type, tax_rate, stock_quantity, is_web_sale, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, false, CURRENT_TIMESTAMP)
          `, [
            bId, String(barcode), name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            image_url || '', JSON.stringify(updatedLabels), product_type || 'product', 
            parseFloat(tax_rate) || 0
          ]);
        }
      }
    }
    
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
    if (existingProductRes.rows[0]?.is_hepsiburada_active) {
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
            const hbMerchantSku = finalMarketplaceData?.hepsiburada?.merchantSku || finalBarcode;

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

    res.json({ success: true });
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
    // 0. Clean up any bad/orphaned stock movements with product_id 0 or NULL
    await pool.query("DELETE FROM stock_movements WHERE product_id IS NULL OR product_id = 0");

    const prodRes = await pool.query(
      "SELECT id, store_id, barcode, product_code, sku, name, stock_quantity, cost_price, price, currency, created_at FROM products WHERE id = $1",
      [productId]
    );
    if (prodRes.rows.length === 0) return;
    const prod = prodRes.rows[0];
    const prodBarcode = prod.barcode ? String(prod.barcode).trim() : '';
    const prodCode = prod.product_code ? String(prod.product_code).trim() : '';
    const prodSku = prod.sku ? String(prod.sku).trim() : '';
    const prodName = prod.name ? String(prod.name).trim().toLowerCase() : '';

    // 0.1 Deduplicate existing redundant movements for this product:
    // a) Deduplicate multiple movements for the exact same invoice_id (keep highest id)
    await pool.query(`
      DELETE FROM stock_movements sm1
      WHERE sm1.product_id = $1
        AND sm1.invoice_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM stock_movements sm2
          WHERE sm2.product_id = sm1.product_id
            AND sm2.invoice_id = sm1.invoice_id
            AND sm2.id > sm1.id
        )
    `, [productId]);

    // b) Deduplicate redundant pos_sale or legacy marketplace movements when a sales_invoice movement exists for the same order/sale/invoice
    await pool.query(`
      DELETE FROM stock_movements sm1
      WHERE sm1.product_id = $1
        AND sm1.source IN ('pos_sale', 'hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti')
        AND EXISTS (
          SELECT 1 FROM stock_movements sm2
          WHERE sm2.product_id = sm1.product_id
            AND sm2.id != sm1.id
            AND sm2.source = 'sales_invoice'
            AND (
              (sm1.sale_id IS NOT NULL AND sm2.sale_id = sm1.sale_id)
              OR (sm1.invoice_id IS NOT NULL AND sm2.invoice_id = sm1.invoice_id)
              OR (sm2.invoice_number IS NOT NULL AND (
                sm1.description LIKE '%' || sm2.invoice_number || '%'
                OR (sm2.invoice_number LIKE 'HB-%' AND sm1.description LIKE '%' || SUBSTRING(sm2.invoice_number FROM 4) || '%')
                OR (sm2.invoice_number LIKE 'TY-%' AND sm1.description LIKE '%' || SUBSTRING(sm2.invoice_number FROM 4) || '%')
                OR (sm2.invoice_number LIKE 'N11-%' AND sm1.description LIKE '%' || SUBSTRING(sm2.invoice_number FROM 5) || '%')
                OR (sm2.invoice_number LIKE 'AMZ-%' AND sm1.description LIKE '%' || SUBSTRING(sm2.invoice_number FROM 5) || '%')
                OR (sm2.invoice_number LIKE 'PZR-%' AND sm1.description LIKE '%' || SUBSTRING(sm2.invoice_number FROM 5) || '%')
              ))
            )
        )
    `, [productId]);

    // c) Deduplicate multiple initial_stock records (keep the earliest original record)
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

    // 0.2 Auto-link unlinked purchase_invoice_items and sales_invoice_items for this product
    if (prodBarcode || prodCode || prodSku || prodName.length >= 2) {
      await pool.query(`
        UPDATE purchase_invoice_items pii
        SET product_id = $1
        FROM purchase_invoices pi
        WHERE pii.purchase_invoice_id = pi.id
          AND (pii.product_id IS NULL OR pii.product_id = 0)
          AND COALESCE(pi.is_expense, FALSE) = FALSE
          AND (
            ($2 != '' AND pii.barcode = $2)
            OR ($3 != '' AND (pii.product_code = $3 OR pii.barcode = $3))
            OR ($4 != '' AND (pii.product_code = $4 OR pii.barcode = $4))
            OR ($5 != '' AND LOWER(TRIM(pii.product_name)) = $5)
            OR ($5 != '' AND LENGTH($5) >= 4 AND LOWER(pii.product_name) LIKE '%' || $5 || '%')
          )
      `, [prod.id, prodBarcode, prodCode, prodSku, prodName]);

      await pool.query(`
        UPDATE sales_invoice_items sii
        SET product_id = $1
        FROM sales_invoices si
        WHERE sii.sales_invoice_id = si.id
          AND (sii.product_id IS NULL OR sii.product_id = 0)
          AND (
            ($2 != '' AND sii.barcode = $2)
            OR ($3 != '' AND sii.barcode = $3)
            OR ($4 != '' AND sii.barcode = $4)
            OR ($5 != '' AND LOWER(TRIM(sii.product_name)) = $5)
            OR ($5 != '' AND LENGTH($5) >= 4 AND LOWER(sii.product_name) LIKE '%' || $5 || '%')
          )
      `, [prod.id, prodBarcode, prodCode, prodSku, prodName]);
    }

    // 1. Sync missing purchase_invoice_items for this product
    await pool.query(`
      INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number)
      SELECT 
        pi.store_id,
        $1,
        'in',
        pii.quantity,
        'purchase_invoice',
        'Alış Faturası: ' || COALESCE(NULLIF(pi.document_number, ''), pi.invoice_number),
        pii.unit_price,
        COALESCE(pi.supplier_name, c.title, 'Tedarikçi'),
        COALESCE(pi.currency, 'TRY'),
        COALESCE(pi.invoice_date::timestamp, pi.created_at),
        pi.id,
        'purchase',
        COALESCE(NULLIF(pi.document_number, ''), pi.invoice_number)
      FROM purchase_invoice_items pii
      JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
      LEFT JOIN companies c ON pi.company_id = c.id
      WHERE (
          pii.product_id = $1 
          OR ($2 != '' AND pii.barcode = $2)
          OR ($3 != '' AND (pii.product_code = $3 OR pii.barcode = $3))
          OR ($4 != '' AND (pii.product_code = $4 OR pii.barcode = $4))
          OR ($5 != '' AND LOWER(TRIM(pii.product_name)) = $5)
        )
        AND COALESCE(pi.is_expense, FALSE) = FALSE
        AND NOT EXISTS (
          SELECT 1 FROM stock_movements sm
          WHERE sm.product_id = $1
            AND (
              sm.invoice_id = pi.id
              OR (sm.invoice_number IS NOT NULL AND (sm.invoice_number = pi.invoice_number OR sm.invoice_number = pi.document_number))
              OR sm.description LIKE '%' || pi.invoice_number || '%'
            )
        )
    `, [productId, prodBarcode, prodCode, prodSku, prodName]);

    // 2. Sync missing sales_invoice_items for this product
    await pool.query(`
      INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number)
      SELECT 
        si.store_id,
        $1,
        'out',
        sii.quantity,
        'sales_invoice',
        'Satış Faturası: ' || COALESCE(NULLIF(si.document_number, ''), si.invoice_number),
        sii.unit_price,
        COALESCE(c.title, cust.full_name, si.customer_name, 'Müşteri'),
        COALESCE(si.currency, 'TRY'),
        COALESCE(si.invoice_date::timestamp, si.created_at),
        si.id,
        'sales',
        COALESCE(NULLIF(si.document_number, ''), si.invoice_number)
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.sales_invoice_id = si.id
      LEFT JOIN companies c ON si.company_id = c.id
      LEFT JOIN customers cust ON si.customer_id = cust.id
      WHERE (
          sii.product_id = $1 
          OR ($2 != '' AND sii.barcode = $2)
          OR ($3 != '' AND sii.barcode = $3)
          OR ($4 != '' AND sii.barcode = $4)
          OR ($5 != '' AND LOWER(TRIM(sii.product_name)) = $5)
        )
        AND NOT EXISTS (
          SELECT 1 FROM stock_movements sm
          WHERE sm.product_id = $1
            AND (
              sm.invoice_id = si.id
              OR (si.sale_id IS NOT NULL AND sm.sale_id = si.sale_id)
              OR (sm.invoice_number IS NOT NULL AND (sm.invoice_number = si.invoice_number OR sm.invoice_number = si.document_number))
              OR sm.description LIKE '%' || si.invoice_number || '%'
              OR (si.invoice_number LIKE 'HB-%' AND sm.description LIKE '%' || SUBSTRING(si.invoice_number FROM 4) || '%')
              OR (si.invoice_number LIKE 'TY-%' AND sm.description LIKE '%' || SUBSTRING(si.invoice_number FROM 4) || '%')
            )
        )
    `, [productId, prodBarcode, prodCode, prodSku, prodName]);

    // 3. Sync missing sale_items (POS) for this product/barcode (exclude marketplace and invoice-linked sales)
    await pool.query(`
      INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, sale_id)
      SELECT 
        s.store_id,
        $1,
        'out',
        si.quantity,
        'pos_sale',
        'POS Satışı: #' || s.id,
        si.unit_price,
        COALESCE(c.full_name, 'Perakende Müşteri'),
        'TRY',
        s.created_at,
        s.id
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE (si.product_id = $1 OR ($2 != '' AND si.barcode = $2))
        AND COALESCE(s.source, '') NOT IN ('hepsiburada', 'trendyol', 'n11', 'amazon', 'pazarama', 'ciceksepeti', 'marketplace')
        AND COALESCE(s.payment_method, '') NOT LIKE '%Hepsiburada%'
        AND COALESCE(s.payment_method, '') NOT LIKE '%Trendyol%'
        AND COALESCE(s.payment_method, '') NOT LIKE '%N11%'
        AND COALESCE(s.payment_method, '') NOT LIKE '%Amazon%'
        AND COALESCE(s.payment_method, '') NOT LIKE '%Pazarama%'
        AND NOT EXISTS (
          SELECT 1 FROM sales_invoices inv
          WHERE inv.sale_id = s.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM stock_movements sm
          WHERE sm.product_id = $1
            AND (
              sm.sale_id = s.id
              OR (sm.invoice_id IS NOT NULL AND EXISTS (SELECT 1 FROM sales_invoices inv WHERE inv.sale_id = s.id AND inv.id = sm.invoice_id))
              OR sm.description LIKE '%#' || s.id || '%'
            )
        )
    `, [productId, prodBarcode]);

    // 4. Calculate net movements vs product stock_quantity
    const smSumRes = await pool.query(`
      SELECT SUM(CASE WHEN type = 'in' THEN quantity ELSE -quantity END) as net_qty
      FROM stock_movements
      WHERE product_id = $1
    `, [productId]);

    const netQty = parseFloat(smSumRes.rows[0]?.net_qty || '0');
    const currentStock = parseFloat(prod.stock_quantity || '0');
    const diff = currentStock - netQty;

    const existingInitialRes = await pool.query(
      "SELECT id, quantity FROM stock_movements WHERE product_id = $1 AND source = 'initial_stock' ORDER BY id ASC LIMIT 1",
      [productId]
    );

    if (Math.abs(diff) > 0.001) {
      if (existingInitialRes.rows.length > 0) {
        const initialRow = existingInitialRes.rows[0];
        const newInitialQty = Math.max(0, parseFloat(initialRow.quantity) + diff);
        if (newInitialQty > 0) {
          await pool.query(
            "UPDATE stock_movements SET quantity = $1 WHERE id = $2",
            [newInitialQty, initialRow.id]
          );
        } else {
          await pool.query("DELETE FROM stock_movements WHERE id = $1", [initialRow.id]);
        }
      } else if (diff > 0) {
        await pool.query(`
          INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
          VALUES ($1, $2, 'in', $3, 'initial_stock', 'Açılış Stok / Devir Kaydı', $4, $5, COALESCE($6, CURRENT_TIMESTAMP))
        `, [prod.store_id, prod.id, diff, parseFloat(prod.cost_price) || parseFloat(prod.price) || 0, prod.currency || 'TRY', prod.created_at]);
      } else {
        await pool.query(`
          INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
          VALUES ($1, $2, 'out', $3, 'manual_adjustment', 'Stok Düzeltme / Manuel Düşüş', $4, $5, CURRENT_TIMESTAMP)
        `, [prod.store_id, prod.id, Math.abs(diff), parseFloat(prod.cost_price) || parseFloat(prod.price) || 0, prod.currency || 'TRY']);
      }
    }

    // 5. Absolute Fallback: if total movements count is 0, always insert initial_stock
    const totalMovCountRes = await pool.query(
      "SELECT COUNT(*) as cnt FROM stock_movements WHERE product_id = $1",
      [productId]
    );
    if (parseInt(totalMovCountRes.rows[0]?.cnt || '0') === 0) {
      const initialQty = parseFloat(prod.stock_quantity || '0') > 0 ? parseFloat(prod.stock_quantity) : (parseFloat(prod.stock_quantity) === 0 ? 0 : 1);
      await pool.query(`
        INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
        VALUES ($1, $2, 'in', $3, 'initial_stock', 'Açılış Stok / Devir Kaydı', $4, $5, COALESCE($6, CURRENT_TIMESTAMP))
      `, [prod.store_id, prod.id, initialQty, parseFloat(prod.cost_price) || parseFloat(prod.price) || 0, prod.currency || 'TRY', prod.created_at]);
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
      "SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC",
      [id]
    );

    res.json(movementsRes.rows);
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
      "SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC",
      [id]
    );

    const data = movementsRes.rows.map((m: any) => ({
      [lang === "tr" ? "Tarih" : "Date"]: new Date(m.created_at).toLocaleString(lang === "tr" ? "tr-TR" : "en-US"),
      [lang === "tr" ? "Tür" : "Type"]: m.type === "in" ? (lang === "tr" ? "Giriş" : "In") : (lang === "tr" ? "Çıkış" : "Out"),
      [lang === "tr" ? "Miktar" : "Quantity"]: m.quantity,
      [lang === "tr" ? "Kaynak" : "Source"]: m.source,
      [lang === "tr" ? "Açıklama" : "Description"]: m.description || "",
      [lang === "tr" ? "Birim Fiyat" : "Unit Price"]: m.unit_price ? Number(m.unit_price) : "",
      [lang === "tr" ? "Müşteri/Tedarikçi" : "Customer/Supplier"]: m.customer_info || "",
      [lang === "tr" ? "Para Birimi" : "Currency"]: m.currency || "TRY"
    }));

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
          image_url: bookData.image_url || generateHighResBookCoverSvg(bookData.name, bookData.author, bookData.publisher, bookData.category)
        }
      });
    }

    // Check existing database records if external catalog lookup is unavailable
    const existing = await query(
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
