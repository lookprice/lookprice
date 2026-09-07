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
    for (const item of data as any[]) {
      const barcode = String(item[mapping.barcode] || "").trim();
      const name = String(item[mapping.name] || "").trim();
      const rawPrice = item[mapping.price];
      let price = 0;
      if (rawPrice !== undefined && rawPrice !== null) {
        let s = String(rawPrice).trim();
        // Remove currency symbols and other non-numeric chars except . and ,
        s = s.replace(/[^0-9.,]/g, "");
        
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
        price = parseFloat(s) || 0;
      }

      if (importLogs.length < 20) {
        importLogs.push({ barcode, name, price, rawPrice: item[mapping.price] });
      }

      if (barcode && !isNaN(price)) {
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
        const stockQuantity = hasStockUpdate ? parseInt(String(stockQuantityRaw)) || 0 : 0;
        
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

          if (hasStockUpdate) {
            updateQuery += `, stock_quantity = $${paramIdx}`;
            updateParams.push(stockQuantity);
            paramIdx++;
          }

          if (hasCategoryUpdate) {
            updateQuery += `, category = $${paramIdx}`;
            updateParams.push(category);
            paramIdx++;
          }

          if (mapping.sub_category && item[mapping.sub_category] !== undefined) {
            updateQuery += `, sub_category = $${paramIdx}`;
            updateParams.push(String(item[mapping.sub_category]).trim() || '');
            paramIdx++;
          }

          if (mapping.brand && item[mapping.brand] !== undefined) {
            updateQuery += `, brand = $${paramIdx}`;
            updateParams.push(String(item[mapping.brand]).trim() || '');
            paramIdx++;
          }

          if (mapping.author && item[mapping.author] !== undefined) {
            updateQuery += `, author = $${paramIdx}`;
            updateParams.push(String(item[mapping.author]).trim() || '');
            paramIdx++;
          }

          if (mapping.description && item[mapping.description] !== undefined) {
            updateQuery += `, description = $${paramIdx}`;
            updateParams.push(item[mapping.description] || '');
            paramIdx++;
          }

          if (mapping.unit && item[mapping.unit] !== undefined) {
            updateQuery += `, unit = $${paramIdx}`;
            updateParams.push(String(item[mapping.unit]).trim() || 'Adet');
            paramIdx++;
          }

          if (mapping.currency && item[mapping.currency] !== undefined) {
            updateQuery += `, currency = $${paramIdx}`;
            updateParams.push(item[mapping.currency] || 'TRY');
            paramIdx++;
          }

          if (mapping.min_stock_level && item[mapping.min_stock_level] !== undefined) {
            updateQuery += `, min_stock_level = $${paramIdx}`;
            updateParams.push(parseInt(String(item[mapping.min_stock_level])) || 5);
            paramIdx++;
          }

          if (hasTaxRateUpdate) {
            updateQuery += `, tax_rate = $${paramIdx}`;
            updateParams.push(taxRate);
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
            INSERT INTO products (store_id, barcode, name, price, currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, tax_rate, price_2, price_2_currency, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
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
            currency
          ]);
          successCount++;
        }
      }
    }
    await client.query("COMMIT");
    
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
