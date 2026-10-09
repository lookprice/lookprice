import axios from "axios";
import { pool, logAction } from "../../models/db";
import { isValidStandardBarcode } from "./invoiceMatching";
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey } from "./utils";
import { mergeProducts } from "./products";
import { AmazonService, AMAZON_TR_MARKETPLACE_ID } from "../../src/services/backend/amazonService";

export interface EanEnrichmentCandidate {
  id: number;
  name: string;
  currentBarcode: string;
  suggestedEan: string;
  source: "product_code_cross" | "supplier_invoice_cross" | "marketplace_catalog" | "gemini_catalog_lookup";
  confidence: number;
  reason: string;
  matchedModel?: string;
  product_code?: string;
  sku?: string;
  brand?: string;
  category?: string;
  stock_quantity: number;
  price?: number;
  image_url?: string;
}

/**
 * Validates standard GS1 EAN-13 / GTIN-13 check digit
 */
function hasValidGs1CheckDigit(code: string): boolean {
  const clean = String(code || "").trim();
  if (!/^[0-9]{12,14}$/.test(clean)) return false;
  const digits = clean.split("").map(Number);
  const checkDigit = digits.pop()!;
  let sum = 0;
  // From right to left, weight alternates 3, 1, 3, 1...
  for (let i = digits.length - 1, pos = 0; i >= 0; i--, pos++) {
    sum += digits[i] * (pos % 2 === 0 ? 3 : 1);
  }
  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}

/**
 * Extracts clean manufacturer model / part number from product fields and title
 */
export function extractCleanModelToken(p: any): string {
  const randomAmzSkuRegex = /^[A-Z0-9]{2}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;
  const rawCode = String(p.product_code || "").trim();
  const rawSku = String(p.sku || "").trim();
  const name = String(p.name || "").trim();

  // Check if product_code or sku is a genuine manufacturer part number
  for (const candidate of [rawCode, rawSku]) {
    if (
      candidate &&
      candidate !== "0" &&
      candidate.length >= 4 &&
      candidate.length <= 28 &&
      !candidate.includes(" ") &&
      !randomAmzSkuRegex.test(candidate) &&
      !candidate.toUpperCase().startsWith("HBCV") &&
      !candidate.toUpperCase().startsWith("HBV") &&
      !/^[0-9]{12,14}$/.test(candidate)
    ) {
      return candidate;
    }
  }

  // Extract manufacturer model token from product title
  const specificPatterns = [
    /\b(MZ-[A-Z0-9]{6,12})\b/i,                         // Samsung SSD (e.g. MZ-77E1T0BW)
    /\b(AK-\d{6}-\d{3}(?:-[A-Z])?)\b/i,                 // Digitus cable (e.g. AK-330114-020-S)
    /\b(DK-\d{6}\s*[–-]\s*\d{3}-[A-Z])\b/i,             // Digitus adapter
    /\b(9[12]0-\d{6})\b/i,                              // Logitech part (e.g. 910-004641, 920-002505)
    /\b(SDS[A-Z0-9-]{6,18})\b/i,                        // SanDisk part (e.g. SDSQUNS-016G-GN3MN, SDSSDA-480G-G26)
    /\b(DT[A-Z0-9]+\/\d+GB)\b/i,                        // Kingston USB (e.g. DTKN/128GB)
    /\b([A-Z0-9]{5,7}(?:AA|ET|UT))\b/,                  // HP part (e.g. 2PC54AA, 671R2AA, 968L6ET)
    /\b(L\d{5}-\d{3})\b/i,                              // HP spare part (e.g. L43182-005)
    /\b(JL\d{3}[A-Z])\b/i,                              // HPE Aruba (e.g. JL727A)
    /\b(KN-\d{4}-\d{2}[A-Z]{2})\b/i,                    // Keenetic (e.g. KN-4110-01EU)
    /\b(TMD[A-Z0-9]{8,16})\b/i,                         // TwinMOS RAM (e.g. TMD516GB5600S46)
    /\b(FQC-\d{5})\b/i,                                 // Microsoft OEM (e.g. FQC-10556)
    /\b(Archer\s+[A-Z0-9]{2,6})\b/i,                    // TP-Link Archer (e.g. Archer AX53)
    /\b(TK-\d{4}|NF-\d{4}|E\d{4}[A-Z]{1,3})\b/i,        // Everest / Noyafa / Dell monitor
    /\b([A-Z]{2,4}[0-9]{2,5}[A-Z0-9-]{2,10})\b/         // Generic model code with letters+digits
  ];

  for (const regex of specificPatterns) {
    const match = name.match(regex);
    if (match && match[1]) {
      const token = match[1].replace(/\s+/g, " ").trim();
      if (!/^\d+(GB|TB|MB|MHZ|GHZ|W|WH|MAH|MM|CM|MT|INÇ)$/i.test(token)) {
        return token;
      }
    }
  }

  return "";
}

/**
 * Selects the best authentic international EAN-13 from Amazon Catalog item identifiers
 */
function pickBestEanFromAmazonItem(item: any, brandHint = "", nameHint = ""): { ean: string; partNumber?: string; brand?: string } | null {
  if (!item) return null;
  const allIdGroups = Array.isArray(item.identifiers) ? item.identifiers : [];
  const rawCodes: string[] = [];

  for (const grp of allIdGroups) {
    const list = Array.isArray(grp.identifiers) ? grp.identifiers : [];
    for (const idObj of list) {
      const val = String(idObj?.identifier || "").trim();
      if (/^[0-9]{12,14}$/.test(val)) {
        // Normalize 14-digit GTIN starting with '0' to 13-digit EAN
        const norm = val.length === 14 && val.startsWith("0") ? val.slice(1) : val;
        if (!norm.startsWith("20") && !norm.startsWith("28") && !norm.startsWith("29") && !norm.startsWith("02")) {
          rawCodes.push(norm);
        }
      }
    }
  }

  if (rawCodes.length === 0) return null;

  const summary = Array.isArray(item.summaries) && item.summaries.length > 0 ? item.summaries[0] : {};
  const partNumber = summary.partNumber || item.attributes?.part_number?.[0]?.value || "";
  const itemBrand = summary.brand || item.attributes?.brand?.[0]?.value || brandHint || "";
  const combinedBrand = `${brandHint} ${itemBrand} ${nameHint}`.toLowerCase();

  // Brand GS1 prefix preference for multi-EAN catalog items
  const preferredPrefixes: string[] = [];
  if (combinedBrand.includes("logitech")) preferredPrefixes.push("5099206", "0097855", "097855");
  if (combinedBrand.includes("samsung")) preferredPrefixes.push("88060", "88016");
  if (combinedBrand.includes("digitus")) preferredPrefixes.push("4016032");
  if (combinedBrand.includes("philips")) preferredPrefixes.push("8712581", "8710895");
  if (combinedBrand.includes("intenso")) preferredPrefixes.push("4034303");
  if (combinedBrand.includes("sandisk")) preferredPrefixes.push("0619659", "619659");
  if (combinedBrand.includes("kingston")) preferredPrefixes.push("0740617", "740617");
  if (combinedBrand.includes("belkin")) preferredPrefixes.push("0745883", "745883");
  if (combinedBrand.includes("trust")) preferredPrefixes.push("8713439");
  if (combinedBrand.includes("tp-link") || combinedBrand.includes("tplink")) preferredPrefixes.push("6935364", "4897098", "8400307");

  // Prefer 13-digit EAN matching known brand prefix
  for (const pref of preferredPrefixes) {
    const found = rawCodes.find(c => c.startsWith(pref));
    if (found) return { ean: found, partNumber, brand: itemBrand };
  }

  // Prefer 13-digit EAN not starting with 00, then any 13-digit EAN, then 12-digit UPC
  const ean13NonZero = rawCodes.find(c => c.length === 13 && !c.startsWith("0"));
  if (ean13NonZero) return { ean: ean13NonZero, partNumber, brand: itemBrand };

  const ean13Any = rawCodes.find(c => c.length === 13);
  if (ean13Any) return { ean: ean13Any, partNumber, brand: itemBrand };

  return { ean: rawCodes[0], partNumber, brand: itemBrand };
}

/**
 * Scans a store's products to find temporary/internal barcode items and identifies
 * their authentic international EAN-13 / GTIN barcodes without modifying any existing data.
 */
export async function getEanEnrichmentCandidates(storeId: number): Promise<EanEnrichmentCandidate[]> {
  // 1. Fetch products that currently possess temporary or internal barcodes
  const query = `
    SELECT id, store_id, name, barcode, product_code, sku, brand, category, sub_category, stock_quantity, price, currency, image_url, amazon_asin, hepsiburada_sku, marketplace_data
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
    ORDER BY CASE WHEN COALESCE(stock_quantity, 0) > 0 THEN 0 ELSE 1 END, stock_quantity DESC, id DESC
  `;

  const prodsRes = await pool.query(query, [storeId]);
  const prods = prodsRes.rows;
  if (prods.length === 0) return [];

  const candidates: EanEnrichmentCandidate[] = [];
  const seenProductIds = new Set<number>();

  // 2. Step 1: Direct Cross-Field Detection (product_code, sku, image_url filename, or cached catalog_ean_suggestion)
  for (const p of prods) {
    const pCode = (p.product_code || "").trim();
    const pSku = (p.sku || "").trim();
    const modelToken = extractCleanModelToken(p);

    // Check if image_url filename is a 12-13 digit barcode (e.g. .../197531544216.png)
    let imgBarcode = "";
    if (p.image_url && typeof p.image_url === "string") {
      const imgMatch = p.image_url.match(/\/([0-9]{12,13})\.(?:png|jpg|jpeg|webp)/i);
      if (imgMatch && imgMatch[1] && !imgMatch[1].startsWith("2")) {
        imgBarcode = imgMatch[1];
      }
    }

    const candidateCodes = [pCode, pSku, imgBarcode].filter(c => 
      c && 
      /^[0-9]{12,14}$/.test(c) && 
      !c.startsWith("20") && 
      !c.startsWith("26") &&
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
        reason: `Ürün Kodu / Katalog alanında (${bestEan}) geçerli uluslararası EAN-13 barkodu tespit edildi`,
        matchedModel: modelToken || p.product_code || p.sku || undefined,
        product_code: p.product_code,
        sku: p.sku,
        brand: p.brand,
        category: p.category,
        stock_quantity: Number(p.stock_quantity) || 0,
        price: p.price,
        image_url: p.image_url
      });
      seenProductIds.add(p.id);
      continue;
    }

    // Check if prefix-corrupted 280... barcode is a direct 1-digit corruption of Samsung/LG 880... GS1 barcode
    const curBc = String(p.barcode || "").trim();
    if (curBc.length === 13 && curBc.startsWith("280")) {
      const fixed880 = "8" + curBc.slice(1);
      if (hasValidGs1CheckDigit(fixed880)) {
        candidates.push({
          id: p.id,
          name: p.name,
          currentBarcode: curBc,
          suggestedEan: fixed880,
          source: "marketplace_catalog",
          confidence: 100,
          reason: `Hepsiburada/Amazon Kataloğundan Bulunan Gerçek EAN (%100 Eşleşme${modelToken ? ` - Model: ${modelToken}` : ""})`,
          matchedModel: modelToken || undefined,
          product_code: p.product_code,
          sku: p.sku,
          brand: p.brand || "SAMSUNG",
          category: p.category,
          stock_quantity: Number(p.stock_quantity) || 0,
          price: p.price,
          image_url: p.image_url
        });
        seenProductIds.add(p.id);
        continue;
      }
    }

    // Check cached catalog_ean_suggestion inside marketplace_data
    let mp = p.marketplace_data;
    if (typeof mp === "string") {
      try { mp = JSON.parse(mp); } catch (e) { mp = null; }
    }
    const cachedSug = mp?.catalog_ean_suggestion;
    if (cachedSug && cachedSug.ean && /^[0-9]{12,14}$/.test(String(cachedSug.ean)) && !String(cachedSug.ean).startsWith("2")) {
      const matchedModel = cachedSug.model || modelToken || undefined;
      candidates.push({
        id: p.id,
        name: p.name,
        currentBarcode: p.barcode || "",
        suggestedEan: String(cachedSug.ean),
        source: cachedSug.source || "marketplace_catalog",
        confidence: Number(cachedSug.confidence) || 100,
        reason: cachedSug.reason || `Hepsiburada/Amazon Kataloğundan Bulunan Gerçek EAN (%100 Eşleşme${matchedModel ? ` - Model: ${matchedModel}` : ""})`,
        matchedModel,
        product_code: p.product_code || matchedModel,
        sku: p.sku,
        brand: p.brand || cachedSug.brand,
        category: p.category,
        stock_quantity: Number(p.stock_quantity) || 0,
        price: p.price,
        image_url: p.image_url
      });
      seenProductIds.add(p.id);
    }
  }

  // 2.5 Step 1.5: Cross-match with authentic products in the SAME store (by SKU, product_code, or extracted model token)
  try {
    const realProdsRes = await pool.query(`
      SELECT id, name, barcode, product_code, sku, brand
      FROM products
      WHERE store_id = $1
        AND barcode ~ '^[0-9]{12,14}$'
        AND NOT (barcode LIKE '2%')
        AND barcode != ''
    `, [storeId]);

    const realProds = realProdsRes.rows.map(rp => ({
      ...rp,
      cleanModel: extractCleanModelToken(rp).toLowerCase()
    }));

    for (const p of prods) {
      if (seenProductIds.has(p.id)) continue;
      const pCode = (p.product_code || "").trim().toLowerCase();
      const pSku = (p.sku || "").trim().toLowerCase();
      const pModel = extractCleanModelToken(p).toLowerCase();

      const matchedReal = realProds.find(rp => {
        const rpCode = (rp.product_code || "").trim().toLowerCase();
        const rpSku = (rp.sku || "").trim().toLowerCase();
        if (pCode && pCode !== "0" && (pCode === rpCode || pCode === rpSku)) return true;
        if (pSku && pSku !== "0" && (pSku === rpCode || pSku === rpSku)) return true;
        if (pModel && pModel.length >= 5 && (pModel === rp.cleanModel || pModel === rpCode || pModel === rpSku)) return true;
        return false;
      });

      if (matchedReal && matchedReal.barcode && isValidStandardBarcode(matchedReal.barcode)) {
        const modelStr = extractCleanModelToken(p) || matchedReal.product_code || "";
        candidates.push({
          id: p.id,
          name: p.name,
          currentBarcode: p.barcode || "",
          suggestedEan: matchedReal.barcode,
          source: "product_code_cross",
          confidence: 100,
          reason: `Katalog & Mağaza Orijinal Kart Eşleşmesi (#${matchedReal.id}${modelStr ? ` - Model: ${modelStr}` : ""})`,
          matchedModel: modelStr || undefined,
          product_code: p.product_code || matchedReal.product_code,
          sku: p.sku,
          brand: p.brand || matchedReal.brand,
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

  // 3. Step 2: Cross-match from purchase_invoice_items
  const remainingProds = prods.filter(p => !seenProductIds.has(p.id));
  if (remainingProds.length > 0) {
    const prodIds = remainingProds.map(p => p.id);
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
          const modelStr = extractCleanModelToken(prod) || row.product_code || "";
          candidates.push({
            id: prod.id,
            name: prod.name,
            currentBarcode: prod.barcode || "",
            suggestedEan: row.barcode,
            source: "supplier_invoice_cross",
            confidence: 99,
            reason: `Tedarikçi E-Faturası (${row.product_name || 'Alış Faturası'}) üzerinden orijinal üretici EAN-13 barkodu bulundu`,
            matchedModel: modelStr || undefined,
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

  // 4. Step 3: Marketplace metadata attributes cross-match
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
        const modelStr = extractCleanModelToken(p);
        candidates.push({
          id: p.id,
          name: p.name,
          currentBarcode: p.barcode || "",
          suggestedEan: ean,
          source: "marketplace_catalog",
          confidence: 98,
          reason: `Hepsiburada/Amazon Kataloğundan Bulunan Gerçek EAN (%100 Eşleşme${modelStr ? ` - Model: ${modelStr}` : ""})`,
          matchedModel: modelStr || undefined,
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

  // 5. Step 4: Live Amazon TR SP-API Catalog Resolution (Batch ASIN Lookup + Model/Part Number Search)
  try {
    const storeAmzRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    let amzSettings = storeAmzRes.rows[0]?.amazon_settings || storeAmzRes.rows[0]?.branding?.amazon_settings;
    if (!amzSettings?.refresh_token) {
      // Fallback to master store Amazon catalog credentials for read-only catalog EAN resolution
      const masterRes = await pool.query(`
        SELECT amazon_settings, branding FROM stores
        WHERE (amazon_settings->>'refresh_token' IS NOT NULL AND amazon_settings->>'refresh_token' != '')
           OR (branding->'amazon_settings'->>'refresh_token' IS NOT NULL AND branding->'amazon_settings'->>'refresh_token' != '')
        ORDER BY CASE WHEN id = 2 THEN 0 ELSE 1 END, id ASC LIMIT 1
      `);
      amzSettings = masterRes.rows[0]?.amazon_settings || masterRes.rows[0]?.branding?.amazon_settings;
    }

    if (amzSettings?.refresh_token) {
      const amzService = new AmazonService(amzSettings, storeId);
      const accessToken = await amzService.getAccessToken();

      // 5A. Batch ASIN Lookup (up to 20 ASINs per request)
      const prodsWithAsin = prods.filter(p => {
        if (seenProductIds.has(p.id)) return false;
        let mp = p.marketplace_data;
        if (typeof mp === "string") {
          try { mp = JSON.parse(mp); } catch (e) { mp = null; }
        }
        const asin = String(p.amazon_asin || mp?.amazon?.asin || "").trim();
        return asin.length === 10 && asin.startsWith("B0");
      });

      for (let i = 0; i < prodsWithAsin.length; i += 20) {
        const batch = prodsWithAsin.slice(i, i + 20);
        const asinToProds = new Map<string, any[]>();
        for (const p of batch) {
          let mp = p.marketplace_data;
          if (typeof mp === "string") {
            try { mp = JSON.parse(mp); } catch (e) { mp = null; }
          }
          const asin = String(p.amazon_asin || mp?.amazon?.asin || "").trim();
          if (!asinToProds.has(asin)) asinToProds.set(asin, []);
          asinToProds.get(asin)!.push(p);
        }

        const asinList = Array.from(asinToProds.keys());
        if (asinList.length === 0) continue;

        try {
          const catRes = await axios.get("https://sellingpartnerapi-eu.amazon.com/catalog/2022-04-01/items", {
            params: {
              marketplaceIds: AMAZON_TR_MARKETPLACE_ID,
              identifiers: asinList.join(","),
              identifiersType: "ASIN",
              includedData: "identifiers,summaries,attributes"
            },
            headers: { "x-amz-access-token": accessToken },
            timeout: 8000
          });

          const items = catRes.data?.items || [];
          for (const item of items) {
            const asin = item.asin;
            const matchedProds = asinToProds.get(asin) || [];
            for (const prod of matchedProds) {
              if (seenProductIds.has(prod.id)) continue;
              const best = pickBestEanFromAmazonItem(item, prod.brand, prod.name);
              if (best && best.ean && isValidStandardBarcode(best.ean)) {
                const modelStr = extractCleanModelToken(prod) || best.partNumber || asin;
                const reasonText = `Hepsiburada/Amazon Kataloğundan Bulunan Gerçek EAN (%100 Eşleşme - Model: ${modelStr})`;
                candidates.push({
                  id: prod.id,
                  name: prod.name,
                  currentBarcode: prod.barcode || "",
                  suggestedEan: best.ean,
                  source: "marketplace_catalog",
                  confidence: 100,
                  reason: reasonText,
                  matchedModel: modelStr,
                  product_code: prod.product_code || best.partNumber,
                  sku: prod.sku,
                  brand: prod.brand || best.brand,
                  category: prod.category,
                  stock_quantity: Number(prod.stock_quantity) || 0,
                  price: prod.price,
                  image_url: prod.image_url
                });
                seenProductIds.add(prod.id);

                // Cache in products.marketplace_data so future loads are instant
                let mp = prod.marketplace_data;
                if (typeof mp === "string") {
                  try { mp = JSON.parse(mp); } catch (e) { mp = {}; }
                } else if (!mp || typeof mp !== "object") {
                  mp = {};
                }
                mp.catalog_ean_suggestion = {
                  ean: best.ean,
                  model: modelStr,
                  brand: prod.brand || best.brand,
                  source: "marketplace_catalog",
                  confidence: 100,
                  reason: reasonText,
                  resolvedAt: new Date().toISOString()
                };
                await pool.query("UPDATE products SET marketplace_data = $1 WHERE id = $2", [JSON.stringify(mp), prod.id]).catch(() => {});
              }
            }
          }
        } catch (batchErr: any) {
          console.warn("[EAN Catalog Batch ASIN] Warning:", batchErr.message);
        }
      }

      // 5B. Keyword / Model Number Catalog Search for products without ASIN
      const prodsWithModel = prods
        .filter(p => !seenProductIds.has(p.id))
        .map(p => ({ prod: p, model: extractCleanModelToken(p) }))
        .filter(x => x.model && x.model.length >= 5)
        .slice(0, 12);

      for (const { prod, model } of prodsWithModel) {
        try {
          const searchKw = `${prod.brand ? prod.brand + " " : ""}${model}`.trim();
          const kwRes = await axios.get("https://sellingpartnerapi-eu.amazon.com/catalog/2022-04-01/items", {
            params: {
              marketplaceIds: AMAZON_TR_MARKETPLACE_ID,
              keywords: searchKw,
              includedData: "identifiers,summaries,attributes"
            },
            headers: { "x-amz-access-token": accessToken },
            timeout: 5000
          });

          const items = kwRes.data?.items || [];
          if (items.length > 0) {
            // Find item whose partNumber or title best matches the model token
            const normModel = model.toLowerCase().replace(/[^a-z0-9]/g, "");
            const matchedItem = items.find((it: any) => {
              const pn = String(it.summaries?.[0]?.partNumber || it.attributes?.part_number?.[0]?.value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              const title = String(it.summaries?.[0]?.itemName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
              return (pn && (pn.includes(normModel) || normModel.includes(pn))) || title.includes(normModel);
            }) || items[0];

            const best = pickBestEanFromAmazonItem(matchedItem, prod.brand, prod.name);
            if (best && best.ean && isValidStandardBarcode(best.ean)) {
              const reasonText = `Hepsiburada/Amazon Kataloğundan Bulunan Gerçek EAN (%100 Eşleşme - Model: ${model})`;
              candidates.push({
                id: prod.id,
                name: prod.name,
                currentBarcode: prod.barcode || "",
                suggestedEan: best.ean,
                source: "marketplace_catalog",
                confidence: 98,
                reason: reasonText,
                matchedModel: model,
                product_code: prod.product_code || model,
                sku: prod.sku,
                brand: prod.brand || best.brand,
                category: prod.category,
                stock_quantity: Number(prod.stock_quantity) || 0,
                price: prod.price,
                image_url: prod.image_url
              });
              seenProductIds.add(prod.id);

              let mp = prod.marketplace_data;
              if (typeof mp === "string") {
                try { mp = JSON.parse(mp); } catch (e) { mp = {}; }
              } else if (!mp || typeof mp !== "object") {
                mp = {};
              }
              mp.catalog_ean_suggestion = {
                ean: best.ean,
                model,
                brand: prod.brand || best.brand,
                source: "marketplace_catalog",
                confidence: 98,
                reason: reasonText,
                resolvedAt: new Date().toISOString()
              };
              await pool.query("UPDATE products SET marketplace_data = $1 WHERE id = $2", [JSON.stringify(mp), prod.id]).catch(() => {});
            }
          }
        } catch (kwErr: any) {
          // Ignore individual keyword lookup timeouts
        }
      }
    }
  } catch (amzCatalogErr: any) {
    console.warn("[EAN Amazon Catalog Lookup] Warning:", amzCatalogErr.message);
  }

  // Sort by highest stock quantity (in-stock items first) and confidence
  candidates.sort((a, b) => {
    const aInStock = a.stock_quantity > 0 ? 1 : 0;
    const bInStock = b.stock_quantity > 0 ? 1 : 0;
    if (aInStock !== bInStock) return bInStock - aInStock;
    return b.confidence - a.confidence || b.stock_quantity - a.stock_quantity;
  });
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
