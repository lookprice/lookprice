import { pool, logAction } from "../../models/db";
import { isValidStandardBarcode } from "./invoiceMatching";
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./utils";
import { mergeProducts } from "./products";

export interface EanEnrichmentCandidate {
  id: number;
  name: string;
  currentBarcode: string;
  suggestedEan: string;
  source: "product_code_cross" | "supplier_invoice_cross" | "marketplace_catalog" | "gemini_catalog_lookup";
  confidence: number;
  reason: string;
  product_code?: string;
  sku?: string;
  brand?: string;
  category?: string;
  stock_quantity: number;
  price?: number;
  image_url?: string;
}

/**
 * Scans a store's products to find temporary/internal barcode items and identifies
 * their authentic international EAN-13 / GTIN barcodes without modifying any existing data.
 */
export async function getEanEnrichmentCandidates(storeId: number): Promise<EanEnrichmentCandidate[]> {
  // 1. Fetch products that currently possess temporary or internal barcodes
  const query = `
    SELECT id, store_id, name, barcode, product_code, sku, brand, category, sub_category, stock_quantity, price, currency, image_url, marketplace_data
    FROM products
    WHERE store_id = $1
      AND (
        barcode LIKE '2%'
        OR barcode LIKE 'TEMP%'
        OR barcode LIKE 'AUTO%'
        OR barcode LIKE 'M-%'
        OR barcode LIKE 'P-%'
        OR barcode LIKE 'LP-%'
        OR barcode IS NULL
        OR barcode = ''
        OR LENGTH(barcode) < 8
      )
    ORDER BY stock_quantity DESC, id DESC
  `;

  const prodsRes = await pool.query(query, [storeId]);
  const prods = prodsRes.rows;
  if (prods.length === 0) return [];

  const candidates: EanEnrichmentCandidate[] = [];
  const seenProductIds = new Set<number>();

  // 2. Step 1: Direct Cross-Field Detection (e.g. product_code or sku is already a valid EAN-13)
  for (const p of prods) {
    const pCode = (p.product_code || "").trim();
    const pSku = (p.sku || "").trim();

    const candidateCodes = [pCode, pSku].filter(c => 
      c && 
      /^[0-9]{12,14}$/.test(c) && 
      !c.startsWith("20") && 
      !c.startsWith("28") && 
      !c.startsWith("29") &&
      isValidStandardBarcode(c)
    );

    if (candidateCodes.length > 0) {
      const bestEan = candidateCodes[0];
      candidates.push({
        id: p.id,
        name: p.name,
        currentBarcode: p.barcode || "",
        suggestedEan: bestEan,
        source: "product_code_cross",
        confidence: 100,
        reason: `Ürün Kodu / SKU alanında (${bestEan}) geçerli uluslararası EAN-13 barkodu tespit edildi`,
        product_code: p.product_code,
        sku: p.sku,
        brand: p.brand,
        category: p.category,
        stock_quantity: Number(p.stock_quantity) || 0,
        price: p.price,
        image_url: p.image_url
      });
      seenProductIds.add(p.id);
    }
  }

  // 2.5 Step 1.5: Cross-match with authentic products in the SAME store (e.g. same SKU / model)
  try {
    const realProdsRes = await pool.query(`
      SELECT id, name, barcode, product_code, sku, brand
      FROM products
      WHERE store_id = $1
        AND barcode ~ '^[0-9]{12,14}$'
        AND NOT (barcode LIKE '2%')
        AND barcode != ''
    `, [storeId]);

    const realProds = realProdsRes.rows;
    for (const p of prods) {
      if (seenProductIds.has(p.id)) continue;
      const pCode = (p.product_code || "").trim().toLowerCase();
      const pSku = (p.sku || "").trim().toLowerCase();

      const matchedReal = realProds.find(rp => {
        const rpCode = (rp.product_code || "").trim().toLowerCase();
        const rpSku = (rp.sku || "").trim().toLowerCase();
        if (pCode && (pCode === rpCode || pCode === rpSku)) return true;
        if (pSku && (pSku === rpCode || pSku === rpSku)) return true;
        return false;
      });

      if (matchedReal && matchedReal.barcode && isValidStandardBarcode(matchedReal.barcode)) {
        candidates.push({
          id: p.id,
          name: p.name,
          currentBarcode: p.barcode || "",
          suggestedEan: matchedReal.barcode,
          source: "product_code_cross",
          confidence: 100,
          reason: `Aynı mağazadaki #${matchedReal.id} (${matchedReal.name}) orijinal ürün kartının barkodu (${matchedReal.barcode}) ile eşleşti (Otomatik Birleştirilecek)`,
          product_code: p.product_code,
          sku: p.sku,
          brand: p.brand,
          category: p.category,
          stock_quantity: Number(p.stock_quantity) || 0,
          price: p.price,
          image_url: p.image_url
        });
        seenProductIds.add(p.id);
      }
    }
  } catch (sameStoreErr) {
    console.warn("[EAN Cross Match] Same store lookup warning:", sameStoreErr);
  }

  // 3. Step 2: Cross-match from supplier_product_mappings and purchase_invoice_items
  const remainingProds = prods.filter(p => !seenProductIds.has(p.id));
  if (remainingProds.length > 0) {
    const prodIds = remainingProds.map(p => p.id);
    
    // Look up in purchase_invoice_items where product_id matches or product_code matches and barcode was standard EAN
    const piiRes = await pool.query(`
      SELECT pii.product_id, pii.barcode, pii.product_code, pii.product_name
      FROM purchase_invoice_items pii
      JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
      WHERE pi.store_id = $1
        AND pii.barcode IS NOT NULL
        AND pii.barcode ~ '^[0-9]{12,14}$'
        AND NOT (pii.barcode LIKE '2%')
        AND pii.product_id = ANY($2::int[])
      ORDER BY pii.id DESC
    `, [storeId, prodIds]);

    for (const row of piiRes.rows) {
      if (!seenProductIds.has(row.product_id)) {
        const prod = prods.find(p => p.id === row.product_id);
        if (prod && row.barcode && isValidStandardBarcode(row.barcode)) {
          candidates.push({
            id: prod.id,
            name: prod.name,
            currentBarcode: prod.barcode || "",
            suggestedEan: row.barcode,
            source: "supplier_invoice_cross",
            confidence: 98,
            reason: `Tedarikçi Alış Faturası (${row.product_name || 'E-Fatura'}) üzerinden orijinal üretici barkodu bulundu`,
            product_code: prod.product_code,
            sku: prod.sku,
            brand: prod.brand,
            category: prod.category,
            stock_quantity: Number(prod.stock_quantity) || 0,
            price: prod.price,
            image_url: prod.image_url
          });
          seenProductIds.add(prod.id);
        }
      }
    }
  }

  // 4. Step 3: Marketplace metadata cross-match (e.g. Amazon ASIN EAN / HB Barkod in attributes)
  for (const p of prods) {
    if (seenProductIds.has(p.id)) continue;
    let mp = p.marketplace_data;
    if (typeof mp === "string") {
      try { mp = JSON.parse(mp); } catch (e) { mp = null; }
    }
    if (mp && typeof mp === "object") {
      const candidateBarcodes = [
        mp.hepsiburada?.attributes?.Barcode,
        mp.trendyol?.attributes?.Barcode,
        mp.n11?.attributes?.Barcode,
        mp.amazon?.attributes?.Barcode
      ].filter(b => b && typeof b === "string" && /^[0-9]{12,14}$/.test(b.trim()) && !b.trim().startsWith("2"));

      if (candidateBarcodes.length > 0) {
        const ean = candidateBarcodes[0].trim();
        candidates.push({
          id: p.id,
          name: p.name,
          currentBarcode: p.barcode || "",
          suggestedEan: ean,
          source: "marketplace_catalog",
          confidence: 95,
          reason: `Bağlı pazar yeri katalog eşleşmesinden (${ean}) üretici barkodu teyit edildi`,
          product_code: p.product_code,
          sku: p.sku,
          brand: p.brand,
          category: p.category,
          stock_quantity: Number(p.stock_quantity) || 0,
          price: p.price,
          image_url: p.image_url
        });
        seenProductIds.add(p.id);
      }
    }
  }

  // 5. Step 4: Intelligent AI Catalog EAN Discovery for products with model codes
  const unmappedWithModels = prods
    .filter(p => !seenProductIds.has(p.id) && (p.product_code || p.sku || (p.name && p.name.length > 8)))
    .slice(0, 15);

  const apiKey = getGeminiApiKey();
  if (apiKey && unmappedWithModels.length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Global Product EAN / Barcode Resolution Engine.
Given these retail products, find the authentic official EAN-13 / GTIN-13 / UPC manufacturer barcode.
Only return valid 12-14 digit numeric barcodes (EAN-13 preferred). If unknown or uncertain, return null.

Products to resolve:
${unmappedWithModels.map(p => `ID: ${p.id} | Name: ${p.name} | Model/Code: ${p.product_code || p.sku || 'N/A'} | Brand: ${p.brand || 'N/A'}`).join("\n")}

Respond strictly in valid JSON format:
[
  { "id": 123, "ean": "8806090527456", "brand": "SAMSUNG", "confidence": 92, "reason": "Official Samsung Part Number EAN" }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "";
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.id && item.ean && /^[0-9]{12,14}$/.test(String(item.ean).trim()) && !String(item.ean).trim().startsWith("2")) {
              const prod = prods.find(p => p.id === item.id);
              if (prod && !seenProductIds.has(prod.id)) {
                const cleanEan = String(item.ean).trim();
                candidates.push({
                  id: prod.id,
                  name: prod.name,
                  currentBarcode: prod.barcode || "",
                  suggestedEan: cleanEan,
                  source: "gemini_catalog_lookup",
                  confidence: Math.min(95, Math.max(85, Number(item.confidence) || 90)),
                  reason: item.reason || `Üretici model kodu (${prod.product_code || prod.sku}) üzerinden resmi EAN-13 doğrulandı`,
                  product_code: prod.product_code,
                  sku: prod.sku,
                  brand: prod.brand || item.brand,
                  category: prod.category,
                  stock_quantity: Number(prod.stock_quantity) || 0,
                  price: prod.price,
                  image_url: prod.image_url
                });
                seenProductIds.add(prod.id);
              }
            }
          }
        }
      }
    } catch (aiErr: any) {
      console.warn("[EAN AI Lookup] Warning:", aiErr.message);
    }
  }

  // Sort by highest confidence and stock quantity
  candidates.sort((a, b) => b.confidence - a.confidence || b.stock_quantity - a.stock_quantity);
  return candidates;
}

/**
 * Applies a verified EAN-13 barcode to a product safely.
 * If another product already exists with that EAN, merges them automatically.
 * Otherwise, updates products.barcode and reassigns all invoice / stock movement records.
 */
export async function applyEanEnrichment(
  storeId: number,
  productId: number,
  newEan: string,
  userId?: number
): Promise<{ success: boolean; message: string; mergedIntoId?: number; updatedId?: number }> {
  const cleanEan = String(newEan || "").trim();
  if (!isValidStandardBarcode(cleanEan)) {
    throw new Error(`Geçersiz barkod formatı (${cleanEan}). Standart 8-14 haneli sayısal barkod girilmelidir.`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const prodRes = await client.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    if (prodRes.rows.length === 0) {
      throw new Error(`Ürün bulunamadı (ID: ${productId})`);
    }
    const currentProduct = prodRes.rows[0];

    // Check if another product in this store already owns this EAN barcode
    const existingWithEan = await client.query(
      "SELECT * FROM products WHERE barcode = $1 AND store_id = $2 AND id != $3",
      [cleanEan, storeId, productId]
    );

    if (existingWithEan.rows.length > 0) {
      // Automatic safe merge: merge the temporary product into the existing real product
      const targetProduct = existingWithEan.rows[0];
      const mergeRes = await mergeProducts(client, currentProduct.id, targetProduct.id, storeId);

      await logAction(
        storeId,
        userId || null,
        "apply_ean_enrichment_merged",
        "product",
        targetProduct.id,
        `EAN Barkod Zenginleştirme: #${currentProduct.id} geçici ürün kartı, mevcut #${targetProduct.id} (${cleanEan}) kartı ile başarıyla birleştirildi.`,
        { sourceId: currentProduct.id, targetId: targetProduct.id, newEan: cleanEan }
      );

      await client.query("COMMIT");
      return {
        success: true,
        message: `'${currentProduct.name}' kartı, mevcut ${cleanEan} barkodlu #${targetProduct.id} kartı ile birleştirildi.`,
        mergedIntoId: targetProduct.id
      };
    }

    // No conflict: update current product barcode and reassign all historical links
    const oldBarcode = currentProduct.barcode;

    await client.query(
      "UPDATE products SET barcode = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [cleanEan, productId]
    );

    if (oldBarcode && oldBarcode.trim()) {
      await client.query(
        "UPDATE purchase_invoice_items SET barcode = $1 WHERE barcode = $2 AND product_id = $3",
        [cleanEan, oldBarcode, productId]
      );
      await client.query(
        "UPDATE sales_invoice_items SET barcode = $1 WHERE barcode = $2 AND product_id = $3",
        [cleanEan, oldBarcode, productId]
      );
      await client.query(
        "UPDATE sale_items SET barcode = $1 WHERE barcode = $2 AND product_id = $3",
        [cleanEan, oldBarcode, productId]
      );
      await client.query(
        "UPDATE stock_transfer_items SET barcode = $1 WHERE barcode = $2 AND product_id = $3",
        [cleanEan, oldBarcode, productId]
      );
      await client.query(
        "UPDATE quotation_items SET barcode = $1 WHERE barcode = $2 AND product_id = $3",
        [cleanEan, oldBarcode, productId]
      );
      await client.query(
        "UPDATE procurements SET barcode = $1 WHERE barcode = $2 AND product_id = $3",
        [cleanEan, oldBarcode, productId]
      );
      await client.query(
        "UPDATE e_waybill_items SET barcode = $1 WHERE barcode = $2 AND product_id = $3",
        [cleanEan, oldBarcode, productId]
      );
    }

    await logAction(
      storeId,
      userId || null,
      "apply_ean_enrichment",
      "product",
      productId,
      `EAN Barkod Güncellendi: #${productId} (${currentProduct.name}) ${oldBarcode || 'Boş'} ➡️ ${cleanEan}`,
      { productId, oldBarcode, newEan: cleanEan }
    );

    await client.query("COMMIT");
    return {
      success: true,
      message: `Ürün barkodu başarıyla ${cleanEan} olarak güncellendi.`,
      updatedId: productId
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
