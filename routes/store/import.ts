import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { pool } from "../../models/db";
import { checkProductLimit, PLAN_LIMITS } from "./utils";

const router = express.Router();
const upload = multer({ dest: path.join(process.cwd(), "uploads/") });

router.post("/", upload.single("file"), async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const convertCurrencyFlag = req.body.convertCurrency === 'true';

  let mapping;
  try {
    mapping = JSON.parse(req.body.mapping);
  } catch (e) {
    return res.status(400).json({ error: "Invalid mapping data" });
  }

  if (!mapping.barcode || !mapping.name || !mapping.price) {
    return res.status(400).json({ error: "Barcode, Name, and Price columns must be mapped" });
  }
  
  const client = await pool.connect();
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      client.release();
      return res.status(400).json({ error: "The uploaded file is empty" });
    }

    let successCount = 0;
    
    // Fetch store branding for currency rates if needed
    let currencyRates: any = { "USD": 1, "EUR": 1, "GBP": 1 };
    let defaultCurrency = 'TRY';
    if (convertCurrencyFlag) {
      const storeRes = await pool.query("SELECT currency_rates, default_currency FROM stores WHERE id = $1", [storeId]);
      if (storeRes.rows.length > 0) {
        currencyRates = storeRes.rows[0].currency_rates || currencyRates;
        defaultCurrency = storeRes.rows[0].default_currency || 'TRY';
      }
    }

    // Check limit for the whole batch
    const canAddBatch = await checkProductLimit(storeId, data.length);
    if (!canAddBatch) {
      // Find out how many more we can add
      const storeRes = await pool.query("SELECT plan FROM stores WHERE id = $1", [storeId]);
      const plan = storeRes.rows[0]?.plan || 'free';
      const limit = PLAN_LIMITS[plan] || 50;
      const currentCountRes = await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1", [storeId]);
      const currentCount = currentCountRes.rows[0].count;
      const remaining = limit - currentCount;
      
      if (remaining <= 0) {
        throw new Error(`Ürün limitine ulaşıldı (${limit}). Lütfen planınızı yükseltin.`);
      }
      throw new Error(`Bu dosya ile toplam ürün sayınız limitinizi (${limit}) aşıyor. En fazla ${remaining} ürün daha ekleyebilirsiniz.`);
    }

    await client.query("BEGIN");
    const importLogs: any[] = [];

    const parsePriceVal = (raw: any): number => {
      if (raw === undefined || raw === null) return 0;
      let s = String(raw).trim().replace(/[^0-9.,]/g, "");
      if (!s) return 0;
      if (s.includes('.') && s.includes(',')) {
        if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
          s = s.replace(/,/g, "");
        } else {
          s = s.replace(/\./g, "").replace(",", ".");
        }
      } else if (s.includes(',')) {
        if (s.match(/,\d{2}$/)) {
          s = s.replace(",", ".");
        } else if (s.match(/,\d{3}/)) {
          s = s.replace(",", "");
        } else {
          s = s.replace(",", ".");
        }
      }
      return parseFloat(s) || 0;
    };

    // Group rows by barcode to support variant rows sharing the same parent barcode
    const groupedMap = new Map<string, any[]>();
    for (const item of data as any[]) {
      const barcode = String(item[mapping.barcode] || "").trim();
      if (!barcode) continue;
      if (!groupedMap.has(barcode)) {
        groupedMap.set(barcode, []);
      }
      groupedMap.get(barcode)!.push(item);
    }

    for (const [barcode, items] of groupedMap.entries()) {
      const item = items[0];
      const name = String(item[mapping.name] || "").trim();
      let price = parsePriceVal(item[mapping.price]);

      if (importLogs.length < 20) {
        importLogs.push({ barcode, name, price, rawPrice: item[mapping.price] });
      }

      if (barcode) {
        const existing = await client.query("SELECT id, stock_quantity FROM products WHERE store_id = $1 AND barcode = $2", [storeId, barcode]);

        let currency = item[mapping.currency] || mapping.currency || 'TRY';
        
        if (convertCurrencyFlag && currency !== defaultCurrency) {
          const rate = currencyRates[currency];
          const defaultRate = currencyRates[defaultCurrency];
          if (rate && defaultRate) {
            const priceInBase = price / rate;
            price = priceInBase * defaultRate;
            currency = defaultCurrency;
          }
        }

        const stockQuantityRaw = item[mapping.stock_quantity];
        const hasStockUpdate = stockQuantityRaw !== undefined && stockQuantityRaw !== null && String(stockQuantityRaw).trim() !== "";
        let stockQuantity = hasStockUpdate ? parseInt(String(stockQuantityRaw)) || 0 : 0;
        
        const minStockLevel = parseInt(String(item[mapping.min_stock_level] || "5")) || 5;
        const unit = (mapping.unit && item[mapping.unit] !== undefined && item[mapping.unit] !== null && String(item[mapping.unit]).trim() !== "") 
          ? String(item[mapping.unit]).trim() 
          : 'Adet';
        
        const categoryRaw = item[mapping.category];
        const hasCategoryUpdate = categoryRaw !== undefined && categoryRaw !== null && String(categoryRaw).trim() !== "";
        const category = hasCategoryUpdate ? String(categoryRaw).trim() : '';
        
        const taxRateRaw = item[mapping.tax_rate];
        const hasTaxRateUpdate = taxRateRaw !== undefined && taxRateRaw !== null && String(taxRateRaw).trim() !== "";
        const taxRate = hasTaxRateUpdate ? parseFloat(String(taxRateRaw)) : null;

        // Extract main image and extra images from all rows in this group
        const extractedImages: string[] = [];
        const pushRawUrlString = (rawVal: any) => {
          if (rawVal === undefined || rawVal === null) return;
          const str = String(rawVal).trim();
          if (!str) return;
          const parts = str.split(/[\n\r;|]+|,(?=\s*https?:\/\/)/i).map(p => p.trim()).filter(Boolean);
          for (const part of parts) {
            if ((part.startsWith("http://") || part.startsWith("https://") || part.startsWith("/")) && !extractedImages.includes(part)) {
              extractedImages.push(part);
            }
          }
        };

        const imageMappingKeys = ["image_url", "image_url_2", "image_url_3", "image_url_4", "image_url_5", "image_url_6", "image_url_7", "image_url_8"];
        for (const rowItem of items) {
          for (const mKey of imageMappingKeys) {
            if (mapping[mKey] && rowItem[mapping[mKey]] !== undefined) {
              pushRawUrlString(rowItem[mapping[mKey]]);
            }
          }
          for (const colKey of Object.keys(rowItem)) {
            if (/^(ek\s*resim|ekstra\s*resim|ek\s*görsel|ek\s*gorsel|resim\s*\d+|görsel\s*\d+|gorsel\s*\d+|image\s*\d+|image_url_\d+|img\s*\d+|foto\s*\d+)$/i.test(colKey.trim())) {
              pushRawUrlString(rowItem[colKey]);
            }
          }
        }

        const hasImagesUpdate = extractedImages.length > 0;
        const primaryImageUrl = hasImagesUpdate ? extractedImages[0] : "";

        // Extract and build variant matrix from items
        const variantsList: any[] = [];
        for (let idx = 0; idx < items.length; idx++) {
          const row = items[idx];
          const vName = String(
            (mapping.variant_name && row[mapping.variant_name]) || 
            row["Varyant Adı / Seçeneği"] || 
            row["Varyant Adı"] || 
            row["Varyant"] || 
            ""
          ).trim();
          const vColor = String(
            (mapping.variant_color && row[mapping.variant_color]) || 
            row["Varyant Rengi"] || 
            row["Renk"] || 
            ""
          ).trim();
          const vSize = String(
            (mapping.variant_size && row[mapping.variant_size]) || 
            row["Varyant Bedeni"] || 
            row["Varyant Bedeni / Numarası"] || 
            row["Beden"] || 
            ""
          ).trim();
          const vBarcode = String(
            (mapping.variant_barcode && row[mapping.variant_barcode]) || 
            row["Varyant Barkodu"] || 
            row["Varyant Barkod"] || 
            ""
          ).trim();
          const vRawPrice = (mapping.variant_price && row[mapping.variant_price] !== undefined) 
            ? row[mapping.variant_price] 
            : (row["Varyant Satış Fiyatı"] || row["Varyant Fiyatı"]);
          const vRawStock = (mapping.variant_stock && row[mapping.variant_stock] !== undefined) 
            ? row[mapping.variant_stock] 
            : (row["Varyant Stok Miktarı"] || row["Varyant Stok"]);
          const vImage = String(
            (mapping.variant_image && row[mapping.variant_image]) || 
            row["Varyant Özel Resim Linki"] || 
            row["Varyant Resim Linki"] || 
            ""
          ).trim();

          if (vName || vColor || vSize || vBarcode || items.length > 1) {
            const parsedVPrice = parsePriceVal(vRawPrice);
            const parsedVStock = parseInt(String(vRawStock)) || 0;
            const finalVName = vName || [vColor, vSize].filter(Boolean).join(" / ") || `Varyant ${idx + 1}`;
            variantsList.push({
              id: "var_" + Date.now().toString(36) + "_" + idx + "_" + Math.random().toString(36).substring(2, 6),
              name: finalVName,
              barcode: vBarcode || (vName ? `${barcode}-${idx + 1}` : ""),
              price: parsedVPrice > 0 ? parsedVPrice : (price > 0 ? price : undefined),
              stock_quantity: parsedVStock,
              color_name: vColor || undefined,
              size: vSize || undefined,
              image_url: vImage || undefined,
              attributes: {
                ...(vColor ? { "Renk": vColor } : {}),
                ...(vSize ? { "Beden": vSize } : {})
              },
              is_active: true
            });
          }
        }

        const hasVariants = variantsList.length > 0;
        if (hasVariants && stockQuantity === 0) {
          stockQuantity = variantsList.reduce((acc, curr) => acc + (Number(curr.stock_quantity) || 0), 0);
        }
        if (price === 0 && hasVariants && variantsList[0].price) {
          price = Number(variantsList[0].price);
        }

        if (existing.rows.length > 0) {
          const existingId = existing.rows[0].id;
          
          let effectiveTaxRate = 20;
          if (hasTaxRateUpdate) {
            effectiveTaxRate = taxRate!;
          } else {
            const currentTaxRes = await client.query("SELECT COALESCE(p.tax_rate, s.default_tax_rate, 20) as tax_rate FROM products p JOIN stores s ON p.store_id = s.id WHERE p.id = $1", [existingId]);
            effectiveTaxRate = currentTaxRes.rows[0].tax_rate;
          }

          const price_2 = price / (1 + effectiveTaxRate / 100.0);

          let updateQuery = "UPDATE products SET updated_at = CURRENT_TIMESTAMP, price = $2, price_2 = $3";
          let updateParams: any[] = [existingId, price, price_2];
          let paramIdx = 4;

          if (name) {
            updateQuery += `, name = $${paramIdx}`;
            updateParams.push(name);
            paramIdx++;
          }

          if (hasStockUpdate || hasVariants) {
            updateQuery += `, stock_quantity = $${paramIdx}`;
            updateParams.push(stockQuantity);
            paramIdx++;
          }

          if (hasCategoryUpdate) {
            updateQuery += `, category = $${paramIdx}`;
            updateParams.push(category);
            paramIdx++;
          }

          if (mapping.sub_category && item[mapping.sub_category] !== undefined && String(item[mapping.sub_category]).trim() !== "") {
            updateQuery += `, sub_category = $${paramIdx}`;
            updateParams.push(String(item[mapping.sub_category]).trim());
            paramIdx++;
          }

          if (mapping.brand && item[mapping.brand] !== undefined && String(item[mapping.brand]).trim() !== "") {
            updateQuery += `, brand = $${paramIdx}`;
            updateParams.push(String(item[mapping.brand]).trim());
            paramIdx++;
          }

          if (mapping.author && item[mapping.author] !== undefined && String(item[mapping.author]).trim() !== "") {
            updateQuery += `, author = $${paramIdx}`;
            updateParams.push(String(item[mapping.author]).trim());
            paramIdx++;
          }

          if (mapping.description && item[mapping.description] !== undefined && String(item[mapping.description]).trim() !== "") {
            updateQuery += `, description = $${paramIdx}`;
            updateParams.push(String(item[mapping.description]).trim());
            paramIdx++;
          }

          if (mapping.unit && item[mapping.unit] !== undefined && String(item[mapping.unit]).trim() !== "") {
            updateQuery += `, unit = $${paramIdx}`;
            updateParams.push(String(item[mapping.unit]).trim());
            paramIdx++;
          }

          if (mapping.currency && item[mapping.currency] !== undefined && String(item[mapping.currency]).trim() !== "") {
            updateQuery += `, currency = $${paramIdx}`;
            updateParams.push(String(item[mapping.currency]).trim());
            paramIdx++;
          }

          if (mapping.min_stock_level && item[mapping.min_stock_level] !== undefined && String(item[mapping.min_stock_level]).trim() !== "") {
            updateQuery += `, min_stock_level = $${paramIdx}`;
            updateParams.push(parseInt(String(item[mapping.min_stock_level])) || 5);
            paramIdx++;
          }

          if (hasTaxRateUpdate) {
            updateQuery += `, tax_rate = $${paramIdx}`;
            updateParams.push(taxRate);
            paramIdx++;
          }

          if (hasImagesUpdate) {
            updateQuery += `, image_url = $${paramIdx}, images = $${paramIdx + 1}::jsonb`;
            updateParams.push(primaryImageUrl, JSON.stringify(extractedImages));
            paramIdx += 2;
          }

          if (hasVariants) {
            updateQuery += `, has_variants = true, variants = $${paramIdx}::jsonb`;
            updateParams.push(JSON.stringify(variantsList));
            paramIdx++;
          }

          updateQuery += ` WHERE id = $1`;
          await client.query(updateQuery, updateParams);
          successCount++;
        } else {
          const storeRes = await client.query("SELECT default_tax_rate FROM stores WHERE id = $1", [storeId]);
          const storeDefaultTax = storeRes.rows[0]?.default_tax_rate ?? 20;
          const effectiveTaxRate = hasTaxRateUpdate ? taxRate! : storeDefaultTax;
          const price_2 = price / (1 + effectiveTaxRate / 100.0);

          await client.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, tax_rate, price_2, price_2_currency, image_url, images, has_variants, variants, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19, $20::jsonb, CURRENT_TIMESTAMP)
          `, [
            storeId,
            barcode,
            name || 'İsimsiz Ürün',
            price,
            currency,
            item[mapping.description] || '',
            stockQuantity,
            minStockLevel,
            unit,
            category,
            item[mapping.sub_category] || '',
            item[mapping.brand] || '',
            item[mapping.author] || '',
            hasTaxRateUpdate ? taxRate : null,
            price_2,
            currency,
            primaryImageUrl,
            JSON.stringify(extractedImages),
            hasVariants,
            JSON.stringify(variantsList)
          ]);
          successCount++;
        }
      }
    }
    await client.query("COMMIT");
    
    try {
      const { publicApiCache } = await import("../public.js");
      publicApiCache.clear();
    } catch {}

    try {
      const logPath = path.join(process.cwd(), 'import_log.json');
      fs.writeFileSync(logPath, JSON.stringify(importLogs, null, 2));
    } catch (logError) {
      console.error("Failed to write import log:", logError);
    }

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({ success: true, count: successCount, total: data.length });
  } catch (e: any) {
    console.error("Import error:", e);
    if (client) await client.query("ROLLBACK");
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

export default router;
